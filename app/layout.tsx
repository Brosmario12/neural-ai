import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Igor AI Studio",
  description: "Chat, imagenes y biblioteca multimodal para tus modelos de IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

