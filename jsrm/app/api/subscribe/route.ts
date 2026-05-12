import { NextResponse } from "next/server";
import { z } from "zod";
import { ALL_CATEGORIES, type RiskCategory } from "@/lib/types";
import { generateToken, hashToken, hashIp } from "@/lib/tokens";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { sendConfirmationEmail } from "@/lib/email";
import { checkAndIncrement, getClientIp, SUBSCRIBE_LIMIT, SUBSCRIBE_WINDOW_MS } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().max(254),
  // honeypot: humans leave empty.
  website: z.string().max(200).optional().default(""),
  alert_min_level: z.number().int().min(0).max(5).optional(),
  spike_enabled: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
});

// Generic success response — returned even on duplicate / honeypot, to avoid leaking enumeration.
function genericOk() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  // Rate limit by IP
  const ip = getClientIp(req.headers);
  const rl = checkAndIncrement(`subscribe:${ip}`, SUBSCRIBE_LIMIT, SUBSCRIBE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    // do not echo zod issues
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { email, website, alert_min_level, spike_enabled, categories } = parsed.data;

  // Honeypot: bots fill `website`. Pretend success without doing anything.
  if (website && website.trim().length > 0) {
    return genericOk();
  }

  if (!isSupabaseConfigured()) {
    // In local dev with no Supabase, still drive the email path so the dev can
    // see the confirmation flow.
    const confirmToken = generateToken();
    const unsubToken = generateToken();
    await sendConfirmationEmail({
      to: email,
      confirmToken,
      unsubscribeToken: unsubToken,
    });
    return genericOk();
  }

  const supabase = getSupabaseAdmin();
  const normEmail = email.trim().toLowerCase();

  const validCats: RiskCategory[] = (categories ?? ALL_CATEGORIES).filter((c) =>
    (ALL_CATEGORIES as string[]).includes(c),
  ) as RiskCategory[];
  const minLevel = alert_min_level ?? 2;
  // Spike disabled => force per-user spike thresholds out of reach.
  const min1d = spike_enabled === false ? 99 : 0.35;
  const min7d = spike_enabled === false ? 99 : 0.6;

  // Find existing
  const { data: existing, error: selErr } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("email", normEmail)
    .maybeSingle();
  if (selErr) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const confirmTokenRaw = generateToken();
  const unsubTokenRaw = generateToken();
  const confirmHash = hashToken(confirmTokenRaw);
  const unsubHash = hashToken(unsubTokenRaw);

  let subscriberId: string | null = null;

  if (!existing) {
    const { data: ins, error } = await supabase
      .from("subscribers")
      .insert({
        email: normEmail,
        status: "pending",
        confirm_token_hash: confirmHash,
        unsubscribe_token_hash: unsubHash,
        alert_min_level: minLevel,
        alert_min_score_delta_1d: min1d,
        alert_min_score_delta_7d: min7d,
        categories: validCats,
        locale: "ja",
      })
      .select("id")
      .single();
    if (error || !ins) return NextResponse.json({ ok: false }, { status: 500 });
    subscriberId = ins.id;
    await supabase.from("subscription_events").insert({
      subscriber_id: subscriberId,
      event_type: "requested",
      ip_hash: hashIp(ip),
      user_agent: req.headers.get("user-agent") ?? "",
      metadata: { source: "subscribe_form" },
    });
    await sendConfirmationEmail({
      to: normEmail,
      confirmToken: confirmTokenRaw,
      unsubscribeToken: unsubTokenRaw,
    });
    return genericOk();
  }

  if (existing.status === "active") {
    // already subscribed: respond generically (no enumeration). Optionally re-issue unsub link via email.
    return genericOk();
  }

  // pending or unsubscribed: refresh tokens and re-send confirmation.
  const { error: upErr } = await supabase
    .from("subscribers")
    .update({
      status: "pending",
      confirm_token_hash: confirmHash,
      unsubscribe_token_hash: unsubHash,
      alert_min_level: minLevel,
      alert_min_score_delta_1d: min1d,
      alert_min_score_delta_7d: min7d,
      categories: validCats,
    })
    .eq("id", existing.id);
  if (upErr) return NextResponse.json({ ok: false }, { status: 500 });
  await supabase.from("subscription_events").insert({
    subscriber_id: existing.id,
    event_type: "requested",
    ip_hash: hashIp(ip),
    user_agent: req.headers.get("user-agent") ?? "",
    metadata: { source: "subscribe_form_resend" },
  });
  await sendConfirmationEmail({
    to: normEmail,
    confirmToken: confirmTokenRaw,
    unsubscribeToken: unsubTokenRaw,
  });
  return genericOk();
}
