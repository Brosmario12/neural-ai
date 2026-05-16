"use client";

import { useEffect, useState } from "react";
import { Bot, ImageIcon, KeyRound, LibraryBig, Loader2, SendHorizontal, Sparkles } from "lucide-react";
import type { ApiKeys, Provider } from "@/lib/providers";

type Message = { id?: string; provider: string; prompt: string; answer: string };
type Asset = { id?: string; prompt: string; data_url: string };

const providerOptions: Array<{ value: Provider; label: string }> = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "groq", label: "Groq" },
  { value: "mistral", label: "Mistral" },
  { value: "cohere", label: "Cohere" },
  { value: "openrouter", label: "OpenRouter" },
];

export default function Home() {
  const [tab, setTab] = useState<"chat" | "images" | "library" | "keys">("chat");
  const [provider, setProvider] = useState<Provider>("openai");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [comparison, setComparison] = useState<Array<{ provider: string; answer: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});

  useEffect(() => {
    const savedKeys = window.localStorage.getItem("igor-ai-studio-api-keys");
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch {
        window.localStorage.removeItem("igor-ai-studio-api-keys");
      }
    }
    void loadLibrary();
  }, []);

  function updateKey(providerName: keyof ApiKeys, value: string) {
    const nextKeys = { ...apiKeys, [providerName]: value };
    setApiKeys(nextKeys);
    window.localStorage.setItem("igor-ai-studio-api-keys", JSON.stringify(nextKeys));
  }

  async function loadLibrary() {
    const response = await fetch("/api/library");
    const data = await response.json();
    setMessages(data.messages ?? []);
    setAssets(data.assets ?? []);
  }

  async function ask() {
    setBusy(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, prompt, apiKeys }),
    });
    const data = await response.json();
    setAnswer(data.answer ?? data.error);
    setBusy(false);
    await loadLibrary();
  }

  async function createImage() {
    setBusy(true);
    setImageError("");
    const response = await fetch("/api/images", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, prompt: imagePrompt, apiKeys }),
    });
    const data = await response.json();
    setImageUrl(data.imageUrl ?? "");
    setImageError(data.error ?? "");
    setBusy(false);
    await loadLibrary();
  }

  async function compareModels() {
    setBusy(true);
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, apiKeys }),
    });
    const data = await response.json();
    setComparison(data.results ?? []);
    setBusy(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p>Igor AI Studio</p>
          <h1>Centro multimodal para chat, imagenes y biblioteca</h1>
        </div>
        <nav>
          <button onClick={() => setTab("chat")} data-active={tab === "chat"}><Bot size={18} />Chat</button>
          <button onClick={() => setTab("images")} data-active={tab === "images"}><ImageIcon size={18} />Imagenes</button>
          <button onClick={() => setTab("library")} data-active={tab === "library"}><LibraryBig size={18} />Biblioteca</button>
          <button onClick={() => setTab("keys")} data-active={tab === "keys"}><KeyRound size={18} />Claves</button>
        </nav>
      </header>

      {tab === "chat" && (
        <section className="workspace">
          <aside>
            <label>Proveedor
              <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
                {providerOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="preset-grid">
              {["Resume", "Compara", "Explica", "Critica"].map((preset) => (
                <button key={preset} onClick={() => setPrompt(`${preset} este tema con profundidad y conclusiones accionables.`)}>
                  {preset}
                </button>
              ))}
            </div>
          </aside>
          <div className="main-panel">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Pregunta algo importante..." />
            <button className="primary" onClick={ask} disabled={busy || !prompt}>
              {busy ? <Loader2 className="spin" size={18} /> : <SendHorizontal size={18} />}
              Consultar
            </button>
            <button className="secondary" onClick={compareModels} disabled={busy || !prompt}>
              Comparar configurados
            </button>
            <article className="answer">{answer || "La respuesta aparecera aqui."}</article>
            {comparison.length > 0 && (
              <div className="comparison">
                {comparison.map((item) => (
                  <article key={item.provider}>
                    <strong>{item.provider}</strong>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "images" && (
        <section className="image-stage">
          <div className="composer">
            <Sparkles size={18} />
            <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Describe la imagen que quieres generar..." />
            <button className="primary" onClick={createImage} disabled={busy || !imagePrompt}>
              {busy ? <Loader2 className="spin" size={18} /> : <ImageIcon size={18} />}
              Generar
            </button>
          </div>
          <div className="image-frame">
            {imageUrl ? <img src={imageUrl} alt="Imagen generada" /> : <span>{imageError || "Aqui aparecera la imagen generada."}</span>}
          </div>
        </section>
      )}

      {tab === "library" && (
        <section className="library">
          <div>
            <h2>Chats recientes</h2>
            {messages.map((message, index) => (
              <article key={message.id ?? index}>
                <strong>{message.provider}</strong>
                <p>{message.prompt}</p>
                <span>{message.answer}</span>
              </article>
            ))}
          </div>
          <div>
            <h2>Imagenes recientes</h2>
            <div className="thumb-grid">
              {assets.map((asset, index) => (
                <figure key={asset.id ?? index}>
                  <img src={asset.data_url} alt={asset.prompt} />
                  <figcaption>{asset.prompt}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "keys" && (
        <section className="keys-panel">
          <label>OpenAI
            <input type="password" value={apiKeys.openai ?? ""} onChange={(event) => updateKey("openai", event.target.value)} placeholder="sk-..." />
          </label>
          <label>Gemini
            <input type="password" value={apiKeys.gemini ?? ""} onChange={(event) => updateKey("gemini", event.target.value)} placeholder="AIza..." />
          </label>
          <label>Claude
            <input type="password" value={apiKeys.claude ?? ""} onChange={(event) => updateKey("claude", event.target.value)} placeholder="sk-ant-..." />
          </label>
          <label>Groq
            <input type="password" value={apiKeys.groq ?? ""} onChange={(event) => updateKey("groq", event.target.value)} placeholder="gsk_..." />
          </label>
          <label>Mistral
            <input type="password" value={apiKeys.mistral ?? ""} onChange={(event) => updateKey("mistral", event.target.value)} placeholder="Mistral API key" />
          </label>
          <label>Cohere
            <input type="password" value={apiKeys.cohere ?? ""} onChange={(event) => updateKey("cohere", event.target.value)} placeholder="Cohere API key" />
          </label>
          <label>OpenRouter
            <input type="password" value={apiKeys.openrouter ?? ""} onChange={(event) => updateKey("openrouter", event.target.value)} placeholder="sk-or-v1-..." />
          </label>
          <label>Azure OpenAI clave
            <input type="password" value={apiKeys.azureKey ?? ""} onChange={(event) => updateKey("azureKey", event.target.value)} placeholder="Clave de Azure OpenAI" />
          </label>
          <label>Azure endpoint
            <input value={apiKeys.azureEndpoint ?? ""} onChange={(event) => updateKey("azureEndpoint", event.target.value)} placeholder="https://tu-recurso.openai.azure.com" />
          </label>
          <label>Azure deployment
            <input value={apiKeys.azureDeployment ?? ""} onChange={(event) => updateKey("azureDeployment", event.target.value)} placeholder="Nombre del deployment" />
          </label>
          <label>Azure API version
            <input value={apiKeys.azureApiVersion ?? ""} onChange={(event) => updateKey("azureApiVersion", event.target.value)} placeholder="2024-10-21" />
          </label>
        </section>
      )}
    </main>
  );
}
