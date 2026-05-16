"use client";

import { useEffect, useState } from "react";
import { Bot, ImageIcon, LibraryBig, Loader2, SendHorizontal, Sparkles } from "lucide-react";

type Provider = "openai" | "gemini" | "claude";
type Message = { id?: string; provider: string; prompt: string; answer: string };
type Asset = { id?: string; prompt: string; data_url: string };

export default function Home() {
  const [tab, setTab] = useState<"chat" | "images" | "library">("chat");
  const [provider, setProvider] = useState<Provider>("openai");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [comparison, setComparison] = useState<Array<{ provider: string; answer: string }>>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadLibrary();
  }, []);

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
      body: JSON.stringify({ provider, prompt }),
    });
    const data = await response.json();
    setAnswer(data.answer ?? data.error);
    setBusy(false);
    await loadLibrary();
  }

  async function createImage() {
    setBusy(true);
    const response = await fetch("/api/images", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: imagePrompt }),
    });
    const data = await response.json();
    setImageUrl(data.imageUrl ?? "");
    setBusy(false);
    await loadLibrary();
  }

  async function compareModels() {
    setBusy(true);
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
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
        </nav>
      </header>

      {tab === "chat" && (
        <section className="workspace">
          <aside>
            <label>Proveedor
              <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
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
              Comparar 3 modelos
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
            <input value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Describe la imagen que quieres generar..." />
            <button className="primary" onClick={createImage} disabled={busy || !imagePrompt}>
              {busy ? <Loader2 className="spin" size={18} /> : <ImageIcon size={18} />}
              Generar
            </button>
          </div>
          <div className="image-frame">
            {imageUrl ? <img src={imageUrl} alt="Imagen generada" /> : <span>Aqui aparecera la imagen generada.</span>}
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
    </main>
  );
}
