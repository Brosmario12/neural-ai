export type Provider = "openai" | "gemini" | "claude";

export async function runChat(provider: Provider, prompt: string) {
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Falta GEMINI_API_KEY");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? JSON.stringify(json);
  }

  if (provider === "claude") {
    const key = process.env.ANTHROPIC_API_KEY;
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
    return json.content?.[0]?.text ?? JSON.stringify(json);
  }

  const key = process.env.OPENAI_API_KEY;
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
  return json.output_text ?? JSON.stringify(json);
}

export async function generateImage(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
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

