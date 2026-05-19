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
    return NextResponse.redirect(`${siteUrl()}/subscribe?error=invalid_token`);
  }
  if (!isSupabaseConfigured()) {
    // Dev fallback: treat as success so the page can be inspected.
    return NextResponse.redirect(`${siteUrl()}/subscribe/confirmed`);
  }
  const supabase = getSupabaseAdmin();
  const hash = hashToken(token);
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("confirm_token_hash", hash)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.redirect(`${siteUrl()}/subscribe?error=invalid_token`);
  }

  await supabase
    .from("subscribers")
    .update({
      status: "active",
      confirmed_at: new Date().toISOString(),
      confirm_token_hash: null,
    })
    .eq("id", data.id);

  await supabase.from("subscription_events").insert({
    subscriber_id: data.id,
    event_type: "confirmed",
  });

  return NextResponse.redirect(`${siteUrl()}/subscribe/confirmed`);
}
