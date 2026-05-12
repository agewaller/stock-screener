// CLI counterpart of POST /api/send-alerts. Used by GitHub Actions.
//
// It calls the deployed /api/send-alerts endpoint when SITE_URL +
// CRON_SECRET are set, falling back to running the same logic directly
// against Supabase + the local data/ files.
import { loadDailyScores } from "../lib/loadData";
import { shouldSendAlert } from "../lib/alertRules";
import { buildAlertSubject, sendRiskAlertEmail } from "../lib/email";
import { generateToken, hashToken } from "../lib/tokens";
import { getSupabaseAdmin, isSupabaseConfigured } from "../lib/supabaseAdmin";
import type { AlertDeliveryRow, SubscriberRow } from "../lib/types";

async function callViaHttp(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!url || !secret) return false;
  try {
    const r = await fetch(`${url.replace(/\/+$/, "")}/api/send-alerts`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    });
    const json = await r.json().catch(() => ({}));
    console.log(`[send-alerts] http status=${r.status}`, json);
    return r.ok;
  } catch (err) {
    console.error("[send-alerts] http call failed:", err);
    return false;
  }
}

async function runDirect() {
  if (!isSupabaseConfigured()) {
    console.error(
      "[send-alerts] Supabase is not configured; cannot run directly. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (and optionally NEXT_PUBLIC_SITE_URL + CRON_SECRET to use HTTP path).",
    );
    process.exitCode = 0;
    return;
  }

  const scores = loadDailyScores();
  if (scores.length === 0) {
    console.log("[send-alerts] no daily_scores yet");
    return;
  }
  const latest = scores[scores.length - 1];
  const previous = scores.length > 1 ? scores[scores.length - 2] : null;

  const supabase = getSupabaseAdmin();
  const { data: subs } = await supabase
    .from("subscribers")
    .select("*")
    .eq("status", "active");
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
    sent += 1;
  }

  console.log(
    `[send-alerts] direct run: date=${latest.date} checked=${subscribers.length} sent=${sent} skipped=${skipped} failed=${failed}`,
  );
}

async function main() {
  const httpOk = await callViaHttp();
  if (httpOk) return;
  await runDirect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
