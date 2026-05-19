import { NextResponse } from "next/server";
import { hashToken } from "@/lib/tokens";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${siteUrl()}/unsubscribe`);
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${siteUrl()}/unsubscribe?status=success`);
  }
  const supabase = getSupabaseAdmin();
  const hash = hashToken(token);
  const { data, error } = await supabase
    .from("subscribers")
    .select("id")
    .eq("unsubscribe_token_hash", hash)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.redirect(`${siteUrl()}/unsubscribe`);
  }

  await supabase
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  await supabase.from("subscription_events").insert({
    subscriber_id: data.id,
    event_type: "unsubscribed",
  });

  return NextResponse.redirect(`${siteUrl()}/unsubscribe?status=success`);
}
