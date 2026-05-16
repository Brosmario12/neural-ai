import { NextResponse } from "next/server";
import { z } from "zod";
import { runChat } from "@/lib/providers";

const schema = z.object({ prompt: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { prompt } = schema.parse(await request.json());
    const providers = ["openai", "gemini", "claude"] as const;
    const results = await Promise.allSettled(
      providers.map(async (provider) => ({ provider, answer: await runChat(provider, prompt) })),
    );

    return NextResponse.json({
      results: results.map((result, index) =>
        result.status === "fulfilled"
          ? result.value
          : { provider: providers[index], answer: result.reason instanceof Error ? result.reason.message : "Error" },
      ),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 400 });
  }
}
