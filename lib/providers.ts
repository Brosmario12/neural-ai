export type Provider = "openai" | "gemini" | "claude" | "azure" | "groq" | "mistral" | "cohere" | "openrouter";

export type ApiKeys = Partial<Record<Exclude<Provider, "azure">, string>> & {
  azureKey?: string;
  azureEndpoint?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
};

export const textProviders: Provider[] = ["openai", "gemini", "claude", "azure", "groq", "mistral", "cohere", "openrouter"];
export const imageProviders: Provider[] = ["openai", "gemini"];

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

function readOpenAiCompatibleAnswer(json: { choices?: Array<{ message?: { content?: string } }> }) {
  return json.choices?.[0]?.message?.content;
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await response.json();
    return json.content?.[0]?.text ?? json.error?.message ?? JSON.stringify(json);
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
