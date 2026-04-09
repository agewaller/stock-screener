/**
 * Cloudflare Email Worker — Plaud (and other text) inbox dispatcher
 *
 * 受信した plaud-{hash}@inbox.cares.advisers.jp / data-{hash}@... のメールを
 * Firestore のユーザーごとのコレクションに書き込む。フロントエンド (index.html) は
 * onSnapshot でその新着を検知し、Plaud 文字起こしであれば自動で
 * Integrations.plaud.saveTranscript() → 禅トラック分析プロンプトを実行する。
 *
 * ────────────────────────────────────────────────
 * デプロイ手順 (1回だけ)
 * ────────────────────────────────────────────────
 * 1. Cloudflare Dashboard → ドメイン cares.advisers.jp の Email Routing を有効化
 *    （MX レコードは Cloudflare が自動で設定）
 *
 * 2. Email Routing → "Catch-all address" → "Send to a Worker" → このワーカーを選択
 *    (または "Custom address" で plaud-* / data-* パターンを設定)
 *
 * 3. Worker のシークレットを設定:
 *      wrangler secret put FIREBASE_PROJECT_ID
 *      wrangler secret put FIREBASE_API_KEY        # Firebase Web API key (公開可)
 *      wrangler secret put INBOX_SECRET            # フロント側と共有する短いソルト
 *
 *    任意: USER_HASH_LOOKUP_URL — ハッシュ→uid を解決する Firestore REST URL を
 *    別途用意する場合に使う。デフォルトは inbox 共通コレクション (hash でクエリ)
 *    を読みに行く。
 *
 * 4. wrangler.toml にエントリを追加:
 *      [[env.production.workers]]
 *      name = "plaud-inbox"
 *      main = "worker/plaud-inbox.js"
 *      compatibility_date = "2024-09-01"
 *
 * 5. wrangler deploy
 *
 * 6. 初回テスト: Plaud アプリ → オートフロー → メール送信 → 宛先 plaud-XXX@...
 *    送信完了後、フロントエンドアプリで「禅トラック」グラフが自動表示されるはず。
 *
 * ────────────────────────────────────────────────
 * Firestore データ構造
 * ────────────────────────────────────────────────
 *   inbox/{hash}/plaud/{messageId}    ← 受信メール
 *     {
 *       hash: "abc123",
 *       from: "plaud@noreply.plaud.ai",
 *       subject: "Your transcript",
 *       text: "[00:00] 先生: ...",
 *       receivedAt: serverTimestamp,
 *       processed: false
 *     }
 *
 *   フロントエンドはログイン時に自分の hash で onSnapshot を貼り、新着 doc を
 *   読んで saveTranscript → 禅トラック分析実行 → processed: true にマーク。
 *
 * ────────────────────────────────────────────────
 * セキュリティモデル
 * ────────────────────────────────────────────────
 * - hash はユーザーの Firebase UID を short hash したもの (8 chars)
 *   → 送信元アドレスを知っていれば書き込めるが読み出しは認証必須
 * - Firestore rules: inbox/{hash}/plaud/{messageId} は
 *     allow read: if request.auth != null
 *                 && hashFromUid(request.auth.uid) == hash
 *     allow write: if false  (Worker 経由のみ Admin SDK / REST + service account)
 * - Worker は Firebase Service Account を使わず、anonymous-friendly な
 *   "公開受信箱" として動かす場合は inbox/{hash} を hash 単位で隔離するだけ
 *   (低価値ユーザーごみメール対策のため、後段でレート制限を入れる)
 */

export default {
  async email(message, env, ctx) {
    try {
      // 1. アドレスのローカルパートからハッシュを抽出
      //    plaud-abc123@inbox.cares.advisers.jp → "abc123" (kind="plaud")
      //    data-xyz789@inbox.cares.advisers.jp  → "xyz789" (kind="data")
      const to = message.to || '';
      const m = to.toLowerCase().match(/^(plaud|data)-([a-z0-9]+)@/);
      if (!m) {
        console.warn('[plaud-inbox] unrecognized recipient:', to);
        message.setReject('Unknown recipient pattern');
        return;
      }
      const kind = m[1];
      const hash = m[2];

      // 2. メール本文を読む。multipart の場合は text/plain パートを優先
      const raw = await new Response(message.raw).text();
      const text = extractTextBody(raw);
      const subject = message.headers.get('subject') || '(件名なし)';
      const from = message.from || '';

      if (!text || text.trim().length < 10) {
        console.warn('[plaud-inbox] empty body, ignoring');
        return;
      }

      // 3. Firestore REST API へ書き込み
      //    URL: https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/inbox/{hash}/{kind}?key={API_KEY}
      const projectId = env.FIREBASE_PROJECT_ID;
      const apiKey = env.FIREBASE_API_KEY;
      if (!projectId || !apiKey) {
        console.error('[plaud-inbox] missing FIREBASE_PROJECT_ID / FIREBASE_API_KEY secrets');
        return;
      }
      const collection = `inbox/${hash}/${kind}`;
      const docId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`;

      const body = {
        fields: {
          hash:       { stringValue: hash },
          kind:       { stringValue: kind },
          from:       { stringValue: from },
          subject:    { stringValue: subject },
          text:       { stringValue: text.substring(0, 100000) },
          receivedAt: { timestampValue: new Date().toISOString() },
          processed:  { booleanValue: false }
        }
      };

      const fsRes = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!fsRes.ok) {
        const errText = await fsRes.text().catch(() => '');
        console.error('[plaud-inbox] Firestore write failed:', fsRes.status, errText);
        return;
      }

      console.log('[plaud-inbox] saved', kind, 'message for hash', hash);
    } catch (err) {
      console.error('[plaud-inbox] handler error:', err);
    }
  }
};

// Extract a usable text body from a raw RFC 822 message. Prefers
// text/plain parts; falls back to stripping HTML tags from text/html.
// Not a full MIME parser — covers the common cases (plain, multipart
// with text/plain section). Plaud's auto-flow sends plain text by
// default, so this is sufficient for the primary use case.
function extractTextBody(raw) {
  if (!raw) return '';
  // Find Content-Type to determine multipart boundary
  const ctMatch = raw.match(/Content-Type:\s*multipart\/[^;]+;\s*boundary="?([^"\s;]+)"?/i);
  if (ctMatch) {
    const boundary = '--' + ctMatch[1];
    const parts = raw.split(boundary);
    // Pick the first text/plain part
    for (const part of parts) {
      if (/Content-Type:\s*text\/plain/i.test(part)) {
        // Body is after the blank line that separates headers from content
        const blank = part.search(/\r?\n\r?\n/);
        if (blank !== -1) {
          let body = part.substring(blank).trim();
          // Strip the trailing -- or -- boundary marker
          body = body.replace(/--\s*$/, '').trim();
          return decodeQuotedPrintable(body);
        }
      }
    }
    // Fallback: text/html with tag strip
    for (const part of parts) {
      if (/Content-Type:\s*text\/html/i.test(part)) {
        const blank = part.search(/\r?\n\r?\n/);
        if (blank !== -1) {
          const html = part.substring(blank).trim().replace(/--\s*$/, '');
          return decodeQuotedPrintable(html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
        }
      }
    }
  }
  // Single-part: take everything after the first blank line
  const blank = raw.search(/\r?\n\r?\n/);
  if (blank !== -1) return decodeQuotedPrintable(raw.substring(blank).trim());
  return raw;
}

// Quoted-printable decoder. Plaud often sends UTF-8 quoted-printable
// for Japanese transcripts. Handles =XX hex sequences and soft
// line breaks (=\n).
function decodeQuotedPrintable(s) {
  if (!s) return s;
  // Soft line breaks
  s = s.replace(/=\r?\n/g, '');
  // =XX hex sequences → bytes → UTF-8 decode
  const bytes = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === '=' && i + 2 < s.length && /^[0-9A-Fa-f]{2}$/.test(s.substr(i + 1, 2))) {
      bytes.push(parseInt(s.substr(i + 1, 2), 16));
      i += 3;
    } else {
      bytes.push(s.charCodeAt(i));
      i++;
    }
  }
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch (e) {
    return s;
  }
}
