import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseAdmin";
import { loadDailyScores } from "@/lib/loadData";
import { shouldSendAlert } from "@/lib/alertRules";
import { buildAlertSubject, sendRiskAlertEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";
import type { AlertDeliveryRow, SubscriberRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${expected}`;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase_not_configured" },
      { status: 500 },
    );
  }

  const scores = loadDailyScores();
  if (scores.length === 0) {
    return NextResponse.json({
      ok: true,
      reason: "no_scores",
      checked: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    });
  }
  const latest = scores[scores.length - 1];
  const previous = scores.length > 1 ? scores[scores.length - 2] : null;

  const supabase = getSupabaseAdmin();

  const { data: subs, error: subErr } = await supabase
    .from("subscribers")
    .select("*")
    .eq("status", "active");
  if (subErr) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  const subscribers = (subs ?? []) as SubscriberRow[];

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const sinceIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const { data: dels } = await supabase
      .from("alert_deliveries")
      .select("*")
      .eq("subscriber_id", subscriber.id)
      .gte("risk_date", sinceIso);
    const deliveries = (dels ?? []) as AlertDeliveryRow[];

    const decision = shouldSendAlert({
      latest,
      previous,
      subscriber,
      recentDeliveries: deliveries,
    });
    if (!decision.send || !decision.alertType) {
      skipped += 1;
      continue;
    }

    // Rotate unsubscribe token: every alert email carries a fresh, valid link.
    // The DB stores only the hash, never the raw token.
    const unsubRaw = generateToken();
    const unsubHash = hashToken(unsubRaw);
    await supabase
      .from("subscribers")
      .update({ unsubscribe_token_hash: unsubHash })
      .eq("id", subscriber.id);

    const subject = buildAlertSubject(latest);
    const result = await sendRiskAlertEmail({
      to: subscriber.email,
      unsubscribeToken: unsubRaw,
      daily: latest,
      alertType: decision.alertType,
    });

    if (!result.ok) {
      await supabase.from("alert_deliveries").insert({
        subscriber_id: subscriber.id,
        risk_date: latest.date,
        alert_type: decision.alertType,
        overall_score: latest.overallScore,
        level: latest.level,
        subject,
        status: "failed",
        error_message: result.error ?? null,
        payload: { decision_reason: decision.reason },
      });
      await supabase.from("subscription_events").insert({
        subscriber_id: subscriber.id,
        event_type: "alert_failed",
        metadata: { error: result.error ?? null, alertType: decision.alertType },
      });
      failed += 1;
      continue;
    }

    await supabase.from("alert_deliveries").insert({
      subscriber_id: subscriber.id,
      risk_date: latest.date,
      alert_type: decision.alertType,
      overall_score: latest.overallScore,
      level: latest.level,
      subject,
      resend_message_id: result.id,
      status: result.skipped ? "skipped" : "sent",
      payload: { decision_reason: decision.reason },
    });
    await supabase
      .from("subscribers")
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq("id", subscriber.id);
    await supabase.from("subscription_events").insert({
      subscriber_id: subscriber.id,
      event_type: "alert_sent",
      metadata: { alertType: decision.alertType, level: latest.level },
    });

    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    date: latest.date,
    checked: subscribers.length,
    sent,
    skipped,
    failed,
  });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
