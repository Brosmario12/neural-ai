import { NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/providers";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({ prompt: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { prompt } = schema.parse(await request.json());
    const imageUrl = await generateImage(prompt);
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

