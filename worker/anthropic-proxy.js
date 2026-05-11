/**
 * Cloudflare Worker — Anthropic Secure Proxy
 *
 * ブラウザ → Worker → Anthropic API の経路で中継。
 *
 * セキュリティ:
 *   1. CORS Origin を cares.advisers.jp のみに制限
 *   2. env.ANTHROPIC_API_KEY をゲスト用フォールバックとして使用
 *   3. クライアントが x-api-key を持っていればそちらを優先
 *
 * デプロイ:
 *   git push → deploy-worker.yml → Cloudflare Workers 自動デプロイ
 *   シークレット: wrangler secret put ANTHROPIC_API_KEY --name stock-screener
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
    bipolar: /双極性|躁うつ|bipolar/i,
    adhd: /ADHD|注意欠如|多動/i,
    pots: /POTS|体位性頻脈/i,
    diabetes_t2: /糖尿病|diabetes/i,
    ibs: /IBS|過敏性腸/i,
    hashimoto: /橋本病|甲状腺/i,
    mcas: /MCAS|マスト細胞/i,
    eds: /EDS|エーラス.ダンロス/i,
    insomnia: /不眠症|불眠|insomnia/i,
    migraine: /片頭痛|偏頭痛|migraine|頭痛ダイアリー|トリプタン/i,
    ptsd: /PTSD|心的外傷|フラッシュバック|トラウマ|EMDR|複雑性PTSD/i,
    ra: /関節リウマチ|RA\b|リウマチ|rheumatoid|MTX|メトトレキサート|生物学的製剤|JAK阻害薬/i,
    sle: /SLE\b|全身性エリテマトーデス|ループス|lupus|蝶形紅斑|ループス腎炎|プラケニル|ベンリスタ|抗dsDNA/i,
    asd: /ASD\b|自閉スペクトラム|自閉症|アスペルガー|autism|感覚過敏|マスキング|発達障害|バーンアウト|ステレオタイプ行動/i,
    crohns: /クローン病|Crohn|クローン|IBD|炎症性腸疾患|エンタイビオ|ステラーラ|エレンタール|痔瘻|カルプロテクチン/i,
    gad: /全般性不安障害|GAD\b|不安障害|不安症|anxiety disorder|CBT 不安|心配が止まらない|漠然とした不安/i,
    sjogrens: /シェーグレン|Sjogren|Sjögren|ドライアイ.*乾燥|ドライマウス.*乾燥|抗SS-A|抗SS-B|唾液腺|涙腺/i,
    ocd: /強迫性障害|強迫症|OCD\b|強迫観念|強迫行為|ERP 曝露|フルボキサミン|ルボックス|アナフラニール|Y-BOCS/i,
    epilepsy: /てんかん|epilepsy|発作日誌|抗てんかん薬|デパケン|バルプロ酸|ラミクタール|イーケプラ|発作.*日誌|てんかん.*発作/i,
    burnout: /バーンアウト|燃え尽き症候群|burnout|情緒的消耗|脱人格化|リワーク|職場復帰プログラム|休職.*回復/i,
    parkinsons: /パーキンソン病|パーキンソン|Parkinson|振戦|固縮|寡動|レボドパ|メネシット|ミラペックス|ウェアリングオフ|DBS.*パーキンソン/i,
    ms: /多発性硬化症|MS\b|Multiple Sclerosis|視神経炎|MSファティーグ|ウートホフ|タイサブリ|オクレバス|フィンゴリモド|イムセラ|ナタリズマブ|オクレリズマブ|インターフェロンβ/i,
    chronic_pain: /慢性疼痛|慢性痛|神経障害性疼痛|ペインクリニック|リリカ|プレガバリン|タリージェ|中枢感作|アロディニア|脊髄刺激|SCS\b|神経ブロック|CRPS|複合性局所疼痛/i,
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

    // Streaming requests (body.stream === true) need the response body
    // passed through as-is — buffering with response.text() would
    // collapse the SSE event sequence into a single string and break
    // the client's incremental parser. The deep-analysis "本格的な分析"
    // and 医師提出レポート flows both depend on this.
    if (body.stream === true) {
      const upstreamCT = response.headers.get('Content-Type') || 'text/event-stream';
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': upstreamCT,
          'Cache-Control': 'no-cache',
          ...corsHeaders(origin),
        },
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
