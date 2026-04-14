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
      const extracted = extractTextBody(raw);
      const text = (extracted?.text || '').trim();
      const subject = message.headers.get('subject') || '(件名なし)';
      const from = message.from || '';

      if (!text || text.length < 10) {
        console.warn('[plaud-inbox] empty body, ignoring. extractor path:', extracted?.path || '(none)', 'raw length:', raw?.length || 0);
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
          processed:  { booleanValue: false },
          // Trail of which parser branch found the body. Written
          // into Firestore so the admin diagnostic panel can surface
          // "we received the email and parsed it as X" to the user.
          parsePath:  { stringValue: extracted?.path || '' }
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

// Extract a usable text body from a raw RFC 822 message.
//
// Returns { text, path } where `path` is a diagnostic breadcrumb of
// which branch of the parser reached the result (e.g. "multipart->
// multipart/alternative->text/plain(base64)"). Plaud's auto-flow
// typically sends plain text, but depending on the sending client
// the message can be:
//   - single-part text/plain (quoted-printable or 7bit)
//   - multipart/alternative (text/plain + text/html)
//   - multipart/mixed containing multipart/alternative + attachments
//   - base64 bodies for non-ASCII languages
// The old parser only handled the first two cases and always
// assumed quoted-printable, so Japanese transcripts sent with
// base64 encoding or nested inside multipart/mixed were silently
// dropped. This version recursively walks nested multiparts and
// handles all three common Content-Transfer-Encoding values.
function extractTextBody(raw) {
  if (!raw) return { text: '', path: 'empty' };

  // Split the message into headers + body on the first blank line.
  // RFC 5322: headers and body are separated by CRLF CRLF.
  const parsed = parseMessagePart(raw);
  const result = walkPart(parsed, []);
  return result || { text: '', path: 'no-text-found' };
}

// Parse an RFC 5322 message part into { headers: {name: value},
// body: string }. Handles header line folding (continuation lines
// starting with whitespace).
function parseMessagePart(raw) {
  const blank = raw.search(/\r?\n\r?\n/);
  if (blank === -1) {
    return { headers: {}, body: raw, rawHeaders: '' };
  }
  const rawHeaders = raw.substring(0, blank);
  // +2 for \n\n, +4 for \r\n\r\n — just skip whichever matched.
  const bodyStart = raw.substring(blank).match(/^\r?\n\r?\n/)[0].length;
  const body = raw.substring(blank + bodyStart);
  // Unfold continuation lines: RFC 5322 allows headers to span
  // multiple lines if the continuation starts with whitespace.
  const unfolded = rawHeaders.replace(/\r?\n[ \t]+/g, ' ');
  const headers = {};
  unfolded.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const name = line.substring(0, idx).trim().toLowerCase();
    const value = line.substring(idx + 1).trim();
    headers[name] = value;
  });
  return { headers, body, rawHeaders };
}

// Recursively walk a (possibly multipart) MIME part and return the
// best text/plain (preferred) or text/html (fallback) body we can
// find. Returns { text, path } or null.
function walkPart(part, trail) {
  const ct = (part.headers['content-type'] || '').toLowerCase();
  const enc = (part.headers['content-transfer-encoding'] || '7bit').toLowerCase();

  if (ct.startsWith('multipart/')) {
    // Extract boundary param from the Content-Type header. Handles
    // both quoted and unquoted boundary values.
    const boundaryMatch = ct.match(/boundary="?([^";]+)"?/);
    if (!boundaryMatch) {
      return { text: part.body, path: trail.concat('multipart-no-boundary').join('->') };
    }
    const boundary = '--' + boundaryMatch[1];
    const subparts = part.body.split(boundary)
      .map(s => s.replace(/^\r?\n/, '').replace(/\r?\n$/, ''))
      // The first chunk is preamble (before the first boundary),
      // and the last is the closing boundary marker "--" + epilogue.
      .filter(s => s && !/^--\s*/.test(s));

    // Recurse into each subpart. Prefer text/plain over text/html.
    let htmlFallback = null;
    for (const sub of subparts) {
      const parsed = parseMessagePart(sub);
      const subCt = (parsed.headers['content-type'] || '').toLowerCase();
      const childTrail = trail.concat('multipart(' + ct.split(';')[0].split('/')[1] + ')');
      const result = walkPart(parsed, childTrail);
      if (!result) continue;
      if (subCt.startsWith('text/plain')) return result;
      if (subCt.startsWith('text/html') && !htmlFallback) htmlFallback = result;
      // Also walk nested multiparts eagerly — the recursive call
      // may have found text/plain deeper down.
      if (subCt.startsWith('multipart/') && result.text) return result;
    }
    return htmlFallback;
  }

  // Leaf part: decode the body according to Content-Transfer-Encoding.
  let decoded = part.body || '';
  let encTag = enc;
  if (enc === 'base64') {
    decoded = decodeBase64Utf8(decoded);
  } else if (enc === 'quoted-printable') {
    decoded = decodeQuotedPrintable(decoded);
  } else {
    // 7bit / 8bit / binary / (unknown) — pass through, but still
    // attempt quoted-printable fallback if the text contains =XX
    // sequences (some senders label as 7bit but still QP-encode).
    if (/=[0-9A-Fa-f]{2}/.test(decoded)) {
      decoded = decodeQuotedPrintable(decoded);
      encTag = '7bit-as-qp';
    }
  }
  decoded = decoded.trim();

  if (ct.startsWith('text/plain')) {
    return { text: decoded, path: trail.concat('text/plain(' + encTag + ')').join('->') };
  }
  if (ct.startsWith('text/html')) {
    // Strip HTML tags + decode common entities for a best-effort
    // plain-text representation.
    const plain = decoded
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .trim();
    return { text: plain, path: trail.concat('text/html(' + encTag + ')').join('->') };
  }
  // Unknown leaf content-type — return nothing so the caller can
  // pick the next sibling instead of stuffing binary into Firestore.
  return null;
}

// Base64 decoder that tolerates whitespace (RFC 2045 allows CRLF
// every 76 chars) and decodes the resulting bytes as UTF-8. Used
// for Content-Transfer-Encoding: base64 which Plaud/macOS Mail
// sometimes emit for non-ASCII bodies.
function decodeBase64Utf8(s) {
  if (!s) return '';
  try {
    // Strip whitespace and any stray line endings.
    const cleaned = s.replace(/[\r\n\s]+/g, '');
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.warn('[plaud-inbox] base64 decode failed:', e?.message);
    return s;
  }
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
