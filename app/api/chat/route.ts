import { NextResponse } from "next/server";
import { z } from "zod";
import { runChat } from "@/lib/providers";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  provider: z.enum(["openai", "gemini", "claude"]),
  prompt: z.string().min(1),
  apiKeys: z
    .object({
      openai: z.string().optional(),
      gemini: z.string().optional(),
      claude: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const answer = await runChat(body.provider, body.prompt, body.apiKeys);
    const supabase = getSupabaseAdmin();

    if (supabase) {
      await supabase.from("ai_messages").insert({
        provider: body.provider,
        prompt: body.prompt,
        answer,
      });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 400 });
  }
}
