export type Provider = "openai" | "gemini" | "claude" | "azure" | "groq" | "mistral" | "cohere" | "openrouter";

export type ApiKeys = Partial<Record<Exclude<Provider, "azure">, string>> & {
  azureKey?: string;
  azureEndpoint?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
};

export const textProviders: Provider[] = ["openai", "gemini", "claude", "azure", "groq", "mistral", "cohere", "openrouter"];
export const imageProviders: Provider[] = ["openai", "gemini"];
const claudeModels = ["claude-haiku-4-5-20251001", "claude-3-5-haiku-latest", "claude-sonnet-4-20250514"] as const;

function getKey(provider: Exclude<Provider, "azure">, apiKeys?: ApiKeys) {
  const directKey = apiKeys?.[provider]?.trim();
  if (directKey) return directKey;

  if (provider === "openai") return process.env.OPENAI_API_KEY;
  if (provider === "gemini") return process.env.GEMINI_API_KEY;
  if (provider === "claude") return process.env.ANTHROPIC_API_KEY;
  if (provider === "groq") return process.env.GROQ_API_KEY;
  if (provider === "mistral") return process.env.MISTRAL_API_KEY;
  if (provider === "cohere") return process.env.COHERE_API_KEY;
  return process.env.OPENROUTER_API_KEY;
}

export function hasConfiguredProvider(provider: Provider, apiKeys?: ApiKeys) {
  if (provider === "azure") {
    return Boolean(
      apiKeys?.azureKey?.trim() ||
        process.env.AZURE_OPENAI_API_KEY ||
        (apiKeys?.azureEndpoint?.trim() || process.env.AZURE_OPENAI_ENDPOINT) &&
          (apiKeys?.azureDeployment?.trim() || process.env.AZURE_OPENAI_DEPLOYMENT),
    );
  }

  return Boolean(getKey(provider, apiKeys));
}

function readOpenAiCompatibleAnswer(json: { choices?: Array<{ message?: { content?: string } }> }) {
  return json.choices?.[0]?.message?.content;
}

function readClaudeText(json: { content?: Array<{ type?: string; text?: string }> }) {
  return json.content?.find((part) => part.type === "text")?.text;
}

function isClaudeModelError(json: { error?: { type?: string; message?: string } }) {
  const message = json.error?.message?.toLowerCase() ?? "";
  return json.error?.type === "not_found_error" || message.includes("model") || message.includes("not found");
}

async function listClaudeModels(key: string) {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    method: "GET",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
  });

  const json = await response.json();
  if (!response.ok) {
    const errorMessage = json.error?.message ?? `Anthropic devolvio ${response.status} al listar modelos`;
    throw new Error(`Claude Console/API no pudo listar modelos: ${errorMessage}`);
  }

  return Array.isArray(json.data) ? json.data : [];
}

function pickClaudeModel(models: Array<{ id?: string; display_name?: string }>) {
  const availableIds = new Set(models.map((model) => model.id).filter((value): value is string => Boolean(value)));

  for (const candidate of claudeModels) {
    if (availableIds.has(candidate)) return candidate;
  }

  const sonnetCandidate = models.find((model) => model.id?.includes("sonnet"));
  if (sonnetCandidate?.id) return sonnetCandidate.id;

  const firstClaude = models.find((model) => model.id?.startsWith("claude-"));
  return firstClaude?.id;
}

async function runClaudeChat(prompt: string, key: string) {
  const tryModel = async (model: string) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt.slice(0, 2500) }],
      }),
    });
    const json = await response.json();
    const text = readClaudeText(json);

    if (response.ok && text) {
      return { ok: true as const, text };
    }

    return {
      ok: false as const,
      status: response.status,
      json,
      errorMessage: json.error?.message ?? `Claude devolvio ${response.status}`,
    };
  };

  const preferredModel = claudeModels[0];
  const firstAttempt = await tryModel(preferredModel);
  if (firstAttempt.ok) return firstAttempt.text;
  if (firstAttempt.status === 429) {
    throw new Error("Claude/Haiku esta saturado temporalmente por limite de uso. Intenta de nuevo en 1 o 2 minutos o usa otro proveedor.");
  }

  if (!isClaudeModelError(firstAttempt.json)) {
    throw new Error(`Claude Console/API rechazo la solicitud: ${firstAttempt.errorMessage}`);
  }

  const models = await listClaudeModels(key);
  const model = pickClaudeModel(models);

  if (!model) {
    const visibleModels = models
      .map((item: { id?: string }) => item.id)
      .filter((value: string | undefined): value is string => Boolean(value))
      .slice(0, 8);
    throw new Error(`Claude Console/API no reporto un modelo compatible. Disponibles: ${visibleModels.join(", ") || "ninguno"}`);
  }

  const fallbackAttempt = await tryModel(model);
  if (fallbackAttempt.ok) return fallbackAttempt.text;
  if (fallbackAttempt.status === 429) {
    throw new Error("Claude/Haiku esta saturado temporalmente por limite de uso. Intenta de nuevo en 1 o 2 minutos o usa otro proveedor.");
  }
  throw new Error(`Claude rechazo el modelo resuelto (${model}): ${fallbackAttempt.errorMessage}`);
}

export async function runChat(provider: Provider, prompt: string, apiKeys?: ApiKeys) {
  if (provider === "gemini") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta GEMINI_API_KEY");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? json.error?.message ?? JSON.stringify(json);
  }

  if (provider === "claude") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta ANTHROPIC_API_KEY");
    if (!key.startsWith("sk-ant-")) {
      throw new Error("La clave de Claude debe ser una API key de Claude Console y normalmente empieza con sk-ant-");
    }
    return runClaudeChat(prompt, key);
  }

  if (provider === "azure") {
    const key = apiKeys?.azureKey?.trim() || process.env.AZURE_OPENAI_API_KEY;
    const endpoint = apiKeys?.azureEndpoint?.trim() || process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = apiKeys?.azureDeployment?.trim() || process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = apiKeys?.azureApiVersion?.trim() || process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
    if (!key || !endpoint || !deployment) {
      throw new Error("Azure necesita clave, endpoint y deployment");
    }
    const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": key,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
      }),
    });
    const json = await response.json();
    return readOpenAiCompatibleAnswer(json) ?? json.error?.message ?? JSON.stringify(json);
  }

  if (provider === "groq") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta GROQ_API_KEY");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await response.json();
    return readOpenAiCompatibleAnswer(json) ?? json.error?.message ?? JSON.stringify(json);
  }

  if (provider === "mistral") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta MISTRAL_API_KEY");
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await response.json();
    return readOpenAiCompatibleAnswer(json) ?? json.message ?? JSON.stringify(json);
  }

  if (provider === "cohere") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta COHERE_API_KEY");
    const response = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "command-a-03-2025",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await response.json();
    return json.message?.content?.find((part: { type?: string; text?: string }) => part.type === "text")?.text ?? json.message ?? JSON.stringify(json);
  }

  if (provider === "openrouter") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta OPENROUTER_API_KEY");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await response.json();
    return readOpenAiCompatibleAnswer(json) ?? json.error?.message ?? JSON.stringify(json);
  }

  const key = getKey("openai", apiKeys);
  if (!key) throw new Error("Falta OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      input: prompt,
    }),
  });
  const json = await response.json();
  return json.output_text ?? json.error?.message ?? JSON.stringify(json);
}

export async function generateImage(provider: Provider, prompt: string, apiKeys?: ApiKeys) {
  if (provider === "gemini") {
    const key = getKey(provider, apiKeys);
    if (!key) throw new Error("Falta GEMINI_API_KEY");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });
    const json = await response.json();
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data);
    const base64 = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";
    if (!base64) {
      throw new Error(json.error?.message ?? "Gemini no devolvio una imagen");
    }
    return `data:${mimeType};base64,${base64}`;
  }

  if (provider !== "openai") {
    throw new Error("Este proveedor no genera imagenes en esta app");
  }

  const key = getKey(provider, apiKeys);
  if (!key) throw new Error("Falta OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1.5",
      prompt,
      size: "1024x1024",
      quality: "high",
    }),
  });
  const json = await response.json();
  const base64 = json.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error(json.error?.message ?? "No se recibio imagen");
  }
  return `data:image/png;base64,${base64}`;
}
