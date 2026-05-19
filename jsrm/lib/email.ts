import { Resend } from "resend";
import { CATEGORY_LABELS_JA, DISCLAIMER_JA, LEVEL_LABELS_JA } from "./constants";
import type { DailyScore, RiskCategory, RiskEvent, RiskLevel } from "./types";
import { formatDateJa, formatDelta, formatLevelJa, formatScore } from "./format";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getFrom(): string {
  const name = process.env.ALERT_FROM_NAME || "Japan Sovereignty Risk Monitor";
  const email = process.env.ALERT_FROM_EMAIL || "alerts@example.com";
  return `${name} <${email}>`;
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

interface DeliveryResult {
  ok: boolean;
  id: string | null;
  skipped: boolean;
  error?: string;
}

async function sendOrLog(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<DeliveryResult> {
  if (!isResendConfigured()) {
    // Local dev fallback. Do not send a real email.
    // eslint-disable-next-line no-console
    console.log("\n[JSRM][email skipped: RESEND_API_KEY not set]");
    // eslint-disable-next-line no-console
    console.log(`  To: ${args.to}\n  Subject: ${args.subject}\n  Text:\n${args.text}\n`);
    return { ok: true, id: null, skipped: true };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const r = await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (r.error) {
      return { ok: false, id: null, skipped: false, error: r.error.message };
    }
    return { ok: true, id: r.data?.id ?? null, skipped: false };
  } catch (err) {
    return {
      ok: false,
      id: null,
      skipped: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------- Confirmation email ----------

export interface SendConfirmationParams {
  to: string;
  confirmToken: string;
  unsubscribeToken: string;
}

export async function sendConfirmationEmail(
  params: SendConfirmationParams,
): Promise<DeliveryResult> {
  const site = getSiteUrl();
  const confirmUrl = `${site}/api/confirm-subscription?token=${params.confirmToken}`;
  const unsubUrl = `${site}/api/unsubscribe?token=${params.unsubscribeToken}`;
  const subject = "【確認】日本参戦リスク・主権モニターのアラート登録";

  const text = [
    "日本参戦リスク・主権モニターへのご登録ありがとうございます。",
    "",
    "以下のリンクをクリックすると、アラート通知の登録が完了します。",
    confirmUrl,
    "",
    "このメールに心当たりがない場合は、無視してください（登録は完了しません）。",
    "",
    "----",
    DISCLAIMER_JA,
    "",
    "登録の解除はこちらから行えます：",
    unsubUrl,
  ].join("\n");

  const html = `<!doctype html>
<html lang="ja"><body style="font-family:system-ui,-apple-system,Hiragino Sans,'Noto Sans JP',sans-serif;line-height:1.7;color:#1f2937;">
  <h2 style="margin:0 0 12px">登録の確認</h2>
  <p>日本参戦リスク・主権モニターへのご登録ありがとうございます。</p>
  <p>以下のボタンをクリックすると、アラート通知の登録が完了します。</p>
  <p style="margin:20px 0">
    <a href="${escapeHtml(confirmUrl)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">登録を確認する</a>
  </p>
  <p style="font-size:12px;color:#6b7280">ボタンが表示されない場合は次の URL を開いてください：<br><a href="${escapeHtml(confirmUrl)}">${escapeHtml(confirmUrl)}</a></p>
  <p style="font-size:12px;color:#6b7280">このメールに心当たりがない場合は、無視してください。クリックしなければ登録は完了しません。</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#6b7280">${escapeHtml(DISCLAIMER_JA)}</p>
  <p style="font-size:12px;color:#6b7280">登録の解除：<a href="${escapeHtml(unsubUrl)}">${escapeHtml(unsubUrl)}</a></p>
</body></html>`;

  return sendOrLog({ to: params.to, subject, html, text });
}

// ---------- Risk alert email ----------

export interface SendRiskAlertParams {
  to: string;
  unsubscribeToken: string;
  daily: DailyScore;
  alertType: "level_threshold" | "daily_spike" | "weekly_spike" | "manual_critical";
}

const ALERT_TYPE_LABEL: Record<SendRiskAlertParams["alertType"], string> = {
  level_threshold: "通知レベル到達",
  daily_spike: "前日比急上昇",
  weekly_spike: "7日比急上昇",
  manual_critical: "重大事象指定",
};

export function buildAlertSubject(daily: DailyScore): string {
  return `【JSRM Alert】日本参戦リスク指数が ${formatLevelJa(daily.level as RiskLevel)} に到達しました`;
}

export async function sendRiskAlertEmail(
  params: SendRiskAlertParams,
): Promise<DeliveryResult> {
  const site = getSiteUrl();
  const unsubUrl = `${site}/api/unsubscribe?token=${params.unsubscribeToken}`;
  const subject = buildAlertSubject(params.daily);

  const drivers = params.daily.topDrivers.slice(0, 5);
  const driversText =
    drivers.length === 0
      ? "（該当する具体イベントはありません）"
      : drivers
          .map(
            (e, i) =>
              `${i + 1}. [${CATEGORY_LABELS_JA[e.category as RiskCategory] ?? e.category}] ${e.title} (${e.sourceName})`,
          )
          .join("\n");

  const text = [
    "日本参戦リスク・主権モニターからの自動通知です。",
    "",
    "公開情報に基づく本日のリスク指数が、あなたの設定した通知条件に到達しました。",
    `通知種別：${ALERT_TYPE_LABEL[params.alertType]}`,
    "",
    `日付：${params.daily.date}`,
    `総合リスク指数：${formatScore(params.daily.overallScore)} / 5`,
    `レベル：${formatLevelJa(params.daily.level as RiskLevel)}`,
    `前日比：${formatDelta(params.daily.trend1d)}`,
    `7日平均との差：${formatDelta(params.daily.trend7d)}`,
    `30日平均との差：${formatDelta(params.daily.trend30d)}`,
    "",
    "主な上昇要因：",
    driversText,
    "",
    "詳細：",
    site,
    "",
    "----",
    "本メールは公開情報に基づく自動通知であり、戦争の発生を予言・断定するものではありません。",
    "重要な判断には必ず一次情報と専門家判断を確認してください。",
    "",
    DISCLAIMER_JA,
    "",
    "配信停止：",
    unsubUrl,
  ].join("\n");

  const driversHtml =
    drivers.length === 0
      ? `<p style="color:#6b7280">該当する具体イベントはありません。</p>`
      : `<ol style="padding-left:20px">${drivers
          .map(
            (e: RiskEvent) =>
              `<li style="margin-bottom:6px"><span style="display:inline-block;background:#eef2ff;color:#3730a3;padding:1px 8px;border-radius:10px;font-size:12px;margin-right:6px">${escapeHtml(
                CATEGORY_LABELS_JA[e.category as RiskCategory] ?? e.category,
              )}</span>${escapeHtml(e.title)} <a href="${escapeHtml(e.sourceUrl)}" style="color:#2563eb">(${escapeHtml(e.sourceName)})</a></li>`,
          )
          .join("")}</ol>`;

  const html = `<!doctype html>
<html lang="ja"><body style="font-family:system-ui,-apple-system,Hiragino Sans,'Noto Sans JP',sans-serif;line-height:1.7;color:#1f2937;max-width:640px">
  <p style="margin:0 0 6px;font-size:13px;color:#6b7280">日本参戦リスク・主権モニター</p>
  <h2 style="margin:0 0 12px;font-size:20px">本日のリスク指数が通知条件に到達しました</h2>
  <p style="font-size:13px;color:#374151">通知種別：${escapeHtml(ALERT_TYPE_LABEL[params.alertType])} ／ 日付：${escapeHtml(formatDateJa(params.daily.date))}</p>

  <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;margin:12px 0;width:100%">
    <tr><td style="border:1px solid #e5e7eb;background:#f9fafb;width:40%">総合リスク指数</td><td style="border:1px solid #e5e7eb;font-weight:600">${escapeHtml(formatScore(params.daily.overallScore))} / 5</td></tr>
    <tr><td style="border:1px solid #e5e7eb;background:#f9fafb">レベル</td><td style="border:1px solid #e5e7eb">${escapeHtml(formatLevelJa(params.daily.level as RiskLevel))}</td></tr>
    <tr><td style="border:1px solid #e5e7eb;background:#f9fafb">前日比</td><td style="border:1px solid #e5e7eb">${escapeHtml(formatDelta(params.daily.trend1d))}</td></tr>
    <tr><td style="border:1px solid #e5e7eb;background:#f9fafb">7日平均との差</td><td style="border:1px solid #e5e7eb">${escapeHtml(formatDelta(params.daily.trend7d))}</td></tr>
    <tr><td style="border:1px solid #e5e7eb;background:#f9fafb">30日平均との差</td><td style="border:1px solid #e5e7eb">${escapeHtml(formatDelta(params.daily.trend30d))}</td></tr>
  </table>

  <h3 style="margin:16px 0 8px;font-size:15px">主な上昇要因</h3>
  ${driversHtml}

  <p style="margin:16px 0"><a href="${escapeHtml(site)}" style="color:#2563eb">ダッシュボードで詳細を見る</a></p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#6b7280">本メールは公開情報に基づく自動通知であり、戦争の発生を予言・断定するものではありません。重要な判断には必ず一次情報と専門家判断を確認してください。</p>
  <p style="font-size:12px;color:#6b7280">${escapeHtml(DISCLAIMER_JA)}</p>
  <p style="font-size:12px;color:#6b7280">配信停止：<a href="${escapeHtml(unsubUrl)}">${escapeHtml(unsubUrl)}</a></p>
</body></html>`;

  return sendOrLog({ to: params.to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
