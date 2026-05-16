import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ messages: [], assets: [] });
  }

  const [{ data: messages }, { data: assets }] = await Promise.all([
    supabase.from("ai_messages").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("ai_assets").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  return NextResponse.json({ messages: messages ?? [], assets: assets ?? [] });
}

