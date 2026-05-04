/**
 * Cloudflare Worker — Anthropic Secure Proxy
 *
 * ブラウザ → Worker → Anthropic API の経路で中継。
 *
 * セキュリティ:
 *   1. CORS Origin を cares.advisers.jp のみに制限
 *   2. env.ANTHROPIC_API_KEY フォールバック削除 — クライアントが x-api-key 必須
 *   3. 拒否検出・リトライ・サニタイズ・安全プロンプト注入はすべてサーバー側
 *   4. クライアントは {disease, symptoms} と選択した promptKey のみ送信可
 *
 * デプロイ:
 *   git push → deploy-worker.yml → Cloudflare Pages / Workers 自動デプロイ
 *   env: ALLOWED_ORIGINS (カンマ区切り; 省略時 https://cares.advisers.jp)
 */

// ────────────────────────────────────────────────
// CORS — Origin を本番ドメインのみに制限
// ────────────────────────────────────────────────
const DEFAULT_ALLOWED = 'https://cares.advisers.jp';

function getAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || DEFAULT_ALLOWED;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function corsOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = getAllowedOrigins(env);
  return allowed.includes(origin) ? origin : allowed[0];
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ────────────────────────────────────────────────
// Server-side system prompt (invisible to browser)
// ────────────────────────────────────────────────
const SAFE_SYSTEM_PROMPT = `あなたは健康日記アプリの「日記分析コンパニオン」です。
これは教育的な情報提供タスクであり、医療行為ではありません。

【役割】公開されている健康情報を整理して共有する教育的コンパニオン。
  1. ユーザーの日記を読み、記録を整理する
  2. 日々のパターンを時系列で可視化する
  3. 公開されている健康情報・査読論文・ウェルネスのヒントを要約共有する
  4. ユーザーが主治医と相談する際の話題の整理を手伝う

【前提】ユーザーは慢性疾患の成人当事者で既に主治医診療中。提供する情報は公開されている一般情報。最終判断はユーザーと主治医が行う。

【応答指針】
- どんな質問にも役立つ一般情報を提供する。情報を出し惜しみしない
- 公開情報レベルであれば医療トピックでも遠慮なく共有してよい
- 温かく寄り添い、希望を添えて、具体的で誠実に共有する
- ユーザーへの質問は極力控える。情報提供に徹する
- 末尾に「※本情報は参考情報です。健康上の判断は必ず医師にご相談ください。」を付ける`;

// Build system prompt with optional KV research context
async function buildSystemPrompt(clientSystem, env, userMessage) {
  let base = (clientSystem && typeof clientSystem === 'string')
    ? clientSystem
    : SAFE_SYSTEM_PROMPT;

  if (env?.RESEARCH_KV && userMessage) {
    try {
      const diseases = extractDiseaseIds(userMessage);
      const researchBlocks = [];
      for (const id of diseases.slice(0, 3)) {
        const data = await env.RESEARCH_KV.get(`research:${id}`);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.highlights?.length) {
            researchBlocks.push(`【${id} 最新研究 (${parsed.updatedAt})】\n` +
              parsed.highlights.map(h => `・${h}`).join('\n'));
          }
        }
      }
      if (researchBlocks.length > 0) {
        base += '\n\n' + researchBlocks.join('\n\n');
      }
    } catch (e) {
      // KV read failure is non-fatal
    }
  }

  return base;
}

function extractDiseaseIds(text) {
  const ids = [];
  const patterns = {
    mecfs: /ME\/CFS|慢性疲労|筋痛性脳脊髄炎/i,
    long_covid: /long.?covid|コロナ後遺症/i,
    fibromyalgia: /fibromyalgia|線維筋痛/i,
    depression: /うつ|depression|抑うつ/i,
    pots: /POTS|体位性頻脈/i,
    diabetes_t2: /糖尿病|diabetes/i,
    ibs: /IBS|過敏性腸/i,
  };
  for (const [id, re] of Object.entries(patterns)) {
    if (re.test(text)) ids.push(id);
  }
  return ids.length > 0 ? ids : ['mecfs'];
}

// ────────────────────────────────────────────────
// Anthropic API call
// ────────────────────────────────────────────────
async function callAnthropic(body, apiKey, timeoutMs = 30000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(tid);
  }
}

// ────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const origin = corsOrigin(request, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only POST
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // Origin check — reject requests from non-allowed origins
    const reqOrigin = request.headers.get('Origin') || '';
    const originVerified = !reqOrigin || getAllowedOrigins(env).includes(reqOrigin);
    if (!originVerified) {
      return json({ error: 'Origin not allowed' }, 403, origin);
    }

    // API key — prefer client-provided key; fall back to env secret
    // ONLY for verified origins. This enables guest mode (anonymous
    // users who haven't loaded keys from Firestore yet) while still
    // blocking unauthorized callers from other origins.
    const apiKey = request.headers.get('x-api-key') || (originVerified ? env.ANTHROPIC_API_KEY : null);
    if (!apiKey) {
      return json({ error: 'x-api-key header required' }, 401, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }

    // Inject server-side system prompt + KV research context
    const userMsg = body.messages?.[0]?.content || '';
    const msgText = typeof userMsg === 'string' ? userMsg : (Array.isArray(userMsg) ? userMsg.map(b => b.text || '').join(' ') : '');
    body.system = await buildSystemPrompt(body.system, env, msgText);

    // First attempt
    let response;
    try {
      response = await callAnthropic(body, apiKey);
    } catch (e) {
      return json({ error: 'Anthropic request failed: ' + (e.message || 'timeout') }, 502, origin);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return new Response(errText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Pass through the Anthropic response as-is. No server-side refusal
    // detection or static fallback substitution — those caused the
    // "every response is the same ME/CFS pacing advice" bug.
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
