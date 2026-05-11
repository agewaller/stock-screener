/**
 * Cloudflare Worker — Professional Mailer
 *
 * 利用者が「自立支援医療」「障害年金」「傷病手当金」などの申請フォームを
 * 送信すると、健康日記のフロントエンドがこの Worker を叩き、登録済みの
 * 社労士・税理士 宛に「丁寧で簡潔な依頼メール」を転送する。
 *
 * プロバイダ切替:
 *   RESEND_API_KEY が設定されていれば Resend API (https://resend.com) 経由で
 *   送信。未設定なら MailChannels の無料ルート (Cloudflare Workers 上で
 *   認証不要) にフォールバック。どちらも利用不可ならエラーを返す。
 *
 * デプロイ:
 *   1. wrangler.jsonc / .toml に services.professionalMailer を追加
 *   2. ダッシュボードで ENV に以下を設定 (任意):
 *        RESEND_API_KEY      — re_... で始まる API キー
 *        MAILER_FROM         — 差出人メール (例: support@cares.advisers.jp)
 *        MAILER_FROM_NAME    — 差出人表示名 (例: 健康日記 申請サポート)
 *   3. `wrangler deploy worker/professional-mailer.js` か GitHub Actions
 *      で Cloudflare にデプロイする
 *   4. 生成された URL を管理パネル → 専門家登録 →「メール送信Worker URL」
 *      に貼り付ける
 *
 * リクエストボディ (JSON):
 *   {
 *     to:          "pro@example.com"   // 必須
 *     toName:      "山田 太郎"         // 任意
 *     replyTo:     "user@example.com"  // 必須 (利用者のメール)
 *     replyToName: "花子"              // 任意
 *     from:        null                // 無視される (MAILER_FROM 固定)
 *     fromName:    "健康日記 申請サポート"
 *     subject:     "..."
 *     text:        "メール本文 (plain text)"
 *     meta:        { programId, programName, applicationId, userUid }
 *   }
 *
 * レスポンス: { ok: true, provider: "resend|mailchannels" } または
 *             { error: "..." } (4xx / 5xx)
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return cors(null, 204);
    }
    if (request.method !== 'POST') {
      return cors({ error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return cors({ error: 'Invalid JSON body' }, 400);
    }

    // ── Shape validation ──
    const { to, toName, replyTo, replyToName, fromName, subject, text, meta } = body || {};
    if (!to || typeof to !== 'string' || !isEmail(to)) {
      return cors({ error: 'to: valid email required' }, 400);
    }
    if (!replyTo || typeof replyTo !== 'string' || !isEmail(replyTo)) {
      return cors({ error: 'replyTo: valid email required' }, 400);
    }
    if (!subject || typeof subject !== 'string' || subject.length > 300) {
      return cors({ error: 'subject: 1-300 chars required' }, 400);
    }
    if (!text || typeof text !== 'string' || text.length > 50000) {
      return cors({ error: 'text: 1-50000 chars required' }, 400);
    }

    const senderEmail = env.MAILER_FROM || 'noreply@cares.advisers.jp';
    const senderName = (typeof fromName === 'string' && fromName) || env.MAILER_FROM_NAME || '健康日記 申請サポート';

    // Append a small tracking footer so the recipient can reference the
    // application ID and the user's identity remains transparent.
    const footer =
      '\n\n---\n' +
      'このメールは「健康日記 (cares.advisers.jp)」の申請サポート機能から送信されています。\n' +
      (meta?.programName ? `制度: ${meta.programName}\n` : '') +
      (meta?.applicationId ? `申請ID: ${meta.applicationId}\n` : '') +
      `返信はそのまま ${replyTo} に届きます。\n`;
    const fullText = text + footer;

    // ── Try Resend first if API key set ──
    if (env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [toName ? `${toName} <${to}>` : to],
            reply_to: replyToName ? `${replyToName} <${replyTo}>` : replyTo,
            subject,
            text: fullText,
          }),
        });
        if (resendRes.ok) {
          return cors({ ok: true, provider: 'resend' }, 200);
        }
        const errText = await resendRes.text();
        console.warn('[mailer] Resend failed:', resendRes.status, errText);
        // Fall through to MailChannels
      } catch (e) {
        console.warn('[mailer] Resend threw:', e.message);
      }
    }

    // ── MailChannels fallback (free on Cloudflare Workers) ──
    try {
      const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to, name: toName || '' }],
            },
          ],
          from: { email: senderEmail, name: senderName },
          reply_to: { email: replyTo, name: replyToName || '' },
          subject,
          content: [{ type: 'text/plain', value: fullText }],
        }),
      });
      if (mcRes.ok || mcRes.status === 202) {
        return cors({ ok: true, provider: 'mailchannels' }, 200);
      }
      const errText = await mcRes.text();
      return cors({ error: `mailchannels ${mcRes.status}: ${errText}` }, 502);
    } catch (e) {
      return cors({ error: 'all mail providers failed: ' + e.message }, 502);
    }
  },
};

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function cors(data, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (data === null) return new Response(null, { status, headers });
  headers['Content-Type'] = 'application/json';
  return new Response(JSON.stringify(data), { status, headers });
}
