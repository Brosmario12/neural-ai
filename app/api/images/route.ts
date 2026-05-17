import { NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/providers";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  provider: z.enum(["openai", "gemini", "claude", "azure", "groq", "mistral", "cohere", "openrouter"]),
  prompt: z.string().min(1),
  apiKeys: z
    .object({
      openai: z.string().optional(),
      gemini: z.string().optional(),
      claude: z.string().optional(),
      groq: z.string().optional(),
      mistral: z.string().optional(),
      cohere: z.string().optional(),
      openrouter: z.string().optional(),
      azureKey: z.string().optional(),
      azureEndpoint: z.string().optional(),
      azureDeployment: z.string().optional(),
      azureApiVersion: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const { provider, prompt, apiKeys } = schema.parse(await request.json());
    const imageUrl = await generateImage(provider, prompt, apiKeys);
    const supabase = getSupabaseAdmin();

    if (supabase) {
      await supabase.from("ai_assets").insert({
        kind: "image",
        prompt,
        data_url: imageUrl,
      });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 400 });
  }
}
