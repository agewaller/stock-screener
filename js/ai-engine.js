// === js/ai-engine.js ===
/* ============================================================
   AI Analysis Engine
   Handles AI model integration and prompt execution
   ============================================================ */
var AIEngine = class AIEngine {
  constructor() {
    this.apiEndpoints = {
      'claude-sonnet-4-6': '/api/anthropic',
      'claude-opus-4-6': '/api/anthropic',
      'claude-haiku-4-5': '/api/anthropic',
      'gpt-4o': '/api/openai',
      'gemini-2.5-pro': '/api/google'
    };
  }

  // Main analysis function
  async analyze(promptTemplate, userData, options = {}) {
    const modelId = options.model || store.get('selectedModel') || 'claude-opus-4-6';
    store.set('isAnalyzing', true);

    try {
      const prompt = this.interpolatePrompt(promptTemplate, userData);
      const result = await this.callModel(modelId, prompt, options);

      const analysis = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        model: modelId,
        promptName: options.promptName || 'custom',
        result: result,
        parsed: this.parseAnalysisResult(result),
        userData: this.summarizeUserData(userData)
      };

      // Store analysis
      const history = store.get('analysisHistory') || [];
      history.unshift(analysis);
      if (history.length > 100) history.pop();
      store.set('analysisHistory', history);
      store.set('latestAnalysis', analysis);

      // Extract recommendations and actions
      if (analysis.parsed.recommendations) {
        store.set('recommendations', analysis.parsed.recommendations);
      }
      if (analysis.parsed.actionItems) {
        store.set('actionItems', analysis.parsed.actionItems);
      }

      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    } finally {
      store.set('isAnalyzing', false);
    }
  }

  // Interpolate prompt template with user data
  // Lightweight helper: inject ONLY the response-language directive
  // into a prompt template (no heavy user-data interpolation). Used
  // for fast-guest and Plaud prompts that deliberately skip the full
  // interpolatePrompt path but still need to respect the user's
  // selected language.
  injectLanguageDirective(template) {
    const profile = store.get('userProfile') || {};
    const userLang = profile.language || (typeof i18n !== 'undefined' && i18n.currentLang) || 'ja';
    const directive = this._languageDirectiveFor(userLang);
    return template
      .replace(/\{\{RESPOND_LANGUAGE_INSTRUCTION\}\}/g, directive)
      .replace(/\{\{USER_LANGUAGE\}\}/g, userLang);
  }

  // Resolve the language directive for a given ISO code. Extracted so
  // both interpolatePrompt and injectLanguageDirective share the
  // same wording.
  _languageDirectiveFor(userLang) {
    const m = {
      ja: '【応答言語】必ず日本語 (ja) で応答してください。敬語を基調に、温かく寄り添う口調で。ユーザーは日本語ネイティブです。',
      en: '[RESPONSE LANGUAGE] Respond entirely in English (en). Warm, empathetic, supportive tone. The user is a native English speaker. Every heading, label, bullet, and disclaimer must be in English.',
      zh: '【回复语言】请全程使用简体中文 (zh) 回答。语气温暖、有同理心、鼓励。用户是中文母语者。所有标题、标签、项目符号、免责声明都必须是中文。',
      ko: '【응답 언어】반드시 한국어 (ko)로 응답하세요. 따뜻하고 공감적이며 격려하는 말투로. 사용자는 한국어 원어민입니다. 모든 제목, 라벨, 항목, 면책 조항은 한국어여야 합니다.',
      es: '[IDIOMA DE RESPUESTA] Responde completamente en español (es). Tono cálido, empático y alentador. El usuario es hispanohablante. Todos los títulos, etiquetas, viñetas y descargos de responsabilidad deben estar en español.',
      fr: '[LANGUE DE RÉPONSE] Répondez entièrement en français (fr). Ton chaleureux, empathique et encourageant. L\'utilisateur est francophone. Tous les titres, étiquettes, puces et avertissements doivent être en français.',
      pt: '[IDIOMA DE RESPOSTA] Responda inteiramente em português (pt). Tom caloroso, empático e encorajador. O usuário é falante nativo de português. Todos os títulos, rótulos, marcadores e avisos devem estar em português.',
      de: '[ANTWORTSPRACHE] Antworte vollständig auf Deutsch (de). Warmer, einfühlsamer, ermutigender Ton. Der Nutzer ist deutscher Muttersprachler. Alle Überschriften, Beschriftungen, Aufzählungszeichen und Haftungsausschlüsse müssen auf Deutsch sein.',
      ar: '[لغة الرد] أجب بالكامل باللغة العربية (ar). بنبرة دافئة، متعاطفة، ومشجعة. المستخدم يتحدث العربية كلغة أم. يجب أن تكون جميع العناوين والتصنيفات والنقاط وإخلاء المسؤولية باللغة العربية.',
      it: '[LINGUA DI RISPOSTA] Rispondi interamente in italiano (it). Tono caloroso, empatico e incoraggiante. L\'utente è madrelingua italiano. Tutti i titoli, le etichette, i punti elenco e i disclaimer devono essere in italiano.'
    };
    return m[userLang] || m.en;
  }

  // Build an epidemiology context block for AI prompts. Given the
  // user's selected disease ids, returns a multi-line string with
  // world / Japan patient counts for each condition, plus a
  // directive instructing the AI to use these numbers naturally to
  // reinforce "you are not alone" messaging where appropriate.
  //
  // Returns an empty string if no selected disease has epidemiology
  // data, so prompt templates that reference {{EPIDEMIOLOGY_CONTEXT}}
  // degrade gracefully.
  _buildEpidemiologyContext(selectedDiseaseIds) {
    if (!Array.isArray(selectedDiseaseIds) || selectedDiseaseIds.length === 0) return '';
    const epi = (typeof CONFIG !== 'undefined' && CONFIG.DISEASE_EPIDEMIOLOGY) || {};
    const lines = [];
    selectedDiseaseIds.forEach(id => {
      const data = epi[id];
      if (!data) return;
      // Skip tier-0 rows (no numeric data at all) to avoid polluting
      // the prompt with "策定中" placeholders.
      const hasWorld = data.label && !/策定中/.test(data.label);
      const hasJapan = data.japanLabel && !/策定中|未計上/.test(data.japanLabel);
      if (!hasWorld && !hasJapan) return;
      const name = (CONFIG.DISEASE_CATEGORIES
        .flatMap(c => c.diseases).find(d => d.id === id) || {}).name || id;
      const parts = [];
      if (hasWorld) parts.push(`世界患者数 ${data.label}`);
      if (hasJapan) parts.push(`日本患者数 ${data.japanLabel}`);
      lines.push(`- ${name}: ${parts.join(' / ')}`);
    });
    if (lines.length === 0) return '';
    return [
      '【疾患規模の参考情報】',
      'ユーザーが選択している疾患の患者数は以下の通りです:',
      ...lines,
      '',
      '【この情報の使い方】',
      'ユーザーが孤独を感じていそうなとき、あるいは適切な文脈で、上記の患者数に自然に触れて「同じ症状と向き合っている方が世界/日本にこれだけいらっしゃいます」という寄り添いの一言を添えてください。ただし数字の列挙や押し付けは避け、寄り添う会話の中に自然に織り込むこと。'
    ].join('\n');
  }

  // Return a 1-based "day of year" integer for a given Date (defaults
  // to today). Used as a deterministic seed so that every user sees
  // the same "today's prescription axis" — which changes daily.
  _getDayOfYear(date) {
    const d = date || new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
    return Math.floor(diff / 86400000);
  }

  // Pick today's prescription axis from CONFIG.PRESCRIPTION_AXES.
  // dayOfYear % 14 produces a stable rotation: every 14 days all
  // axes are covered exactly once. Returns the full axis object
  // including id/icon/name/desc so the prompt can reference all
  // fields.
  _getTodayPrescriptionAxis(date) {
    const axes = (typeof CONFIG !== 'undefined' && CONFIG.PRESCRIPTION_AXES) || [];
    if (axes.length === 0) return null;
    const idx = this._getDayOfYear(date) % axes.length;
    return axes[idx];
  }

  // Build a text block listing recent AI suggestions so the next
  // prompt can explicitly avoid repeating them. Walks analysisHistory
  // (last N days), extracts actionItems + new_approach fields, dedupes
  // by the first 40 chars of each string, and returns a markdown list.
  //
  // Also looks at actionItems stored separately (set by analyze() on
  // each successful call) to cover the case where analysisHistory was
  // wiped or is shorter than the lookback window.
  _getRecentProposals(days) {
    const lookback = days || 14;
    const cutoff = Date.now() - lookback * 86400000;
    const history = (typeof store !== 'undefined' && store.get('analysisHistory')) || [];
    const extraActions = (typeof store !== 'undefined' && store.get('actionItems')) || [];
    const seen = new Set();
    const out = [];
    const push = (s) => {
      if (!s || typeof s !== 'string') return;
      const trimmed = s.trim();
      if (!trimmed) return;
      const key = trimmed.substring(0, 40);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(trimmed.substring(0, 160));
    };
    // Recent analyses first (reverse chronological)
    for (const analysis of history.slice(-50).reverse()) {
      const ts = Date.parse(analysis.timestamp || '') || 0;
      if (ts && ts < cutoff) continue;
      const parsed = analysis.parsed || {};
      if (Array.isArray(parsed.actionItems)) parsed.actionItems.forEach(a => push(typeof a === 'string' ? a : a?.title || a?.content));
      if (parsed.new_approach) push(parsed.new_approach);
      if (Array.isArray(parsed.actions)) parsed.actions.forEach(push);
    }
    // Extras (not tied to analysisHistory, e.g. old schema)
    if (Array.isArray(extraActions)) extraActions.forEach(a => push(typeof a === 'string' ? a : a?.title || a?.content));
    return out.slice(0, 20);
  }

  // Build the "今日の新処方プロトコル" prompt block. Combines
  // today's axis + recent proposals + day-of-year seed so the AI
  // receives a concrete, varied, non-repeating prescription brief.
  // Returns '' when no axes are defined so prompts degrade safely.
  _buildPrescriptionProtocol() {
    const axis = this._getTodayPrescriptionAxis();
    if (!axis) return '';
    const dayOfYear = this._getDayOfYear();
    const recent = this._getRecentProposals(14);
    const dateStr = new Date().toISOString().split('T')[0];

    const avoidBlock = recent.length === 0
      ? '（過去 14 日の提案履歴はまだありません。初回は自由に提案してください。）'
      : recent.map((s, i) => `  ${i + 1}. ${s}`).join('\n');

    return `
【本日の新処方プロトコル — 毎日違う打ち手を】

本日 ${dateStr} の指定軸: ${axis.icon} 「${axis.name}」
  └ 候補例: ${axis.desc}

この軸は「${dayOfYear} 日目」というシードから機械的に決まっており、
毎日自動的に別の軸が選ばれるため、ユーザーは 14 日で全ての軸を体験します。
本日の応答では、**必ずこの軸から最低 1 つの具体的な新処方** を提示してください。

【過去 14 日間に既に提案された打ち手（重複禁止）】
${avoidBlock}

【今日の新処方の出力形式】
応答の最後に必ず以下の形式で「今日の処方箋」ブロックを出してください。
これは情報量が多い箇条書きではなく、1 つの具体的な処方として提示します。

╔══ 今日の新処方 (${axis.icon} ${axis.name}) ══
║ ■ 内容: （具体的な施策名 — 商品名/手法名/治療名）
║ ■ 用量・頻度: （例: 夕食後 20 分、週 3 回、または 1 回 100 mg）
║ ■ 試行期間: （例: まず 7 日間続けてみる、2 週間後に効果判定）
║ ■ 期待される効果: （何がどう変わる可能性があるか、2-3 行）
║ ■ 効果判定の指標: （記録して見る値 — 例: 疲労度、睡眠時間、HRV）
║ ■ 注意点・副作用: （既知のリスク、禁忌、相互作用）
║ ■ エビデンス: （RCT / メタ分析 / 症例報告 / 前臨床、論文 PMID があれば併記）
║ ■ 入手方法と費用: （処方 / OTC / 個人輸入 / 費用の目安）
║ ■ なぜ今日これを勧めるか: （ユーザーの記録と指定軸を結ぶ 1 行の理由）
╚════════════════════════════════

【重要ルール】
1. 指定軸から選ぶこと。ユーザーが既に指定軸の施策を試している場合のみ、
   別軸から選んで良い (その場合はその旨を明記)
2. 上の「過去 14 日の提案リスト」にあるものとは必ず具体的に異なる処方にする
3. 「漠然と瞑想しましょう」等の抽象表現ではなく、
   「Headspace の朝 5 分瞑想、朝食前に実施」のような具体性で書く
4. 今日の処方箋は "新しい" ものだが、**無理に最先端である必要はない**。
   身近で安価な改善 (例: 朝日を 10 分浴びる) も立派な処方
5. 処方として出せない日 (例: 内容が足りない) は、「今日は仮の処方箋として○○を試しながら、もう 1 日記録を待ちましょう」と誠実に伝える`;
  }

  interpolatePrompt(template, data) {
    const profile = store.get('userProfile') || {};
    const userLang = profile.language || (typeof i18n !== 'undefined' && i18n.currentLang) || 'ja';

    // Pick a date locale that matches the user's language so the
    // injected {{DATE}} variable reads naturally in the response.
    const dateLocaleMap = {
      ja: 'ja-JP', en: 'en-US', zh: 'zh-CN', ko: 'ko-KR',
      es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', de: 'de-DE',
      ar: 'ar', it: 'it-IT'
    };
    const today = new Date().toLocaleDateString(dateLocaleMap[userLang] || 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Language directive injected at the top of PROMPT_HEADER via
    // {{RESPOND_LANGUAGE_INSTRUCTION}}. This is the single most
    // important instruction — the entire response including all
    // headings, labels, bullet markers and disclaimer must match.
    const respondLanguageInstruction = this._languageDirectiveFor(userLang);

    // Build user profile string (labels in user language so the AI
    // sees profile data in a consistent voice).
    const genderMap = { male: '男性', female: '女性', other: 'その他' };
    const rangeMap = { local: '近隣のみ', prefecture: '県内', region: '関東圏・地方圏', national: '国内全域', international: '海外含む' };
    const profileStr = [
      profile.age ? `年齢: ${profile.age}歳` : '',
      profile.gender ? `性別: ${genderMap[profile.gender] || profile.gender}` : '',
      profile.height ? `身長: ${profile.height}cm` : '',
      profile.weight ? `体重: ${profile.weight}kg` : '',
      profile.location ? `居住地: ${profile.location}` : '',
      profile.travelRange ? `通院可能範囲: ${rangeMap[profile.travelRange] || profile.travelRange}` : '',
      profile.notes ? `備考: ${profile.notes}` : ''
    ].filter(Boolean).join('\n') || '未設定';

    // Build selected diseases string
    const selectedDiseases = store.get('selectedDiseases') || [];
    const diseaseNames = [];
    selectedDiseases.forEach(id => {
      for (const cat of CONFIG.DISEASE_CATEGORIES) {
        const found = cat.diseases.find(d => d.id === id);
        if (found) { diseaseNames.push(found.name); break; }
      }
    });
    const diseasesStr = diseaseNames.join('、') || (store.get('selectedDisease')?.fullName || '未設定');

    // Epidemiology context — lets the AI reference how large the
    // patient community is for the user's selected condition(s).
    // Surfaces world + Japan patient counts so the AI can naturally
    // reinforce "あなたは一人ではない" messaging without us having
    // to hardcode those numbers into every prompt template.
    const epidemiologyContext = this._buildEpidemiologyContext(selectedDiseases);

    // New-prescription protocol — today's rotating axis + the list
    // of past 14 days of AI suggestions so the model can avoid
    // repetition and deliver a genuinely new prescription daily.
    const prescriptionProtocol = this._buildPrescriptionProtocol();
    const todayAxis = this._getTodayPrescriptionAxis();
    const todayAxisLabel = todayAxis ? (todayAxis.icon + ' ' + todayAxis.name) : '';
    const dayOfYear = this._getDayOfYear();
    const recentProposalsList = this._getRecentProposals(14)
      .map((s, i) => `  ${i + 1}. ${s}`).join('\n');

    let prompt = template
      .replace(/\{\{RESPOND_LANGUAGE_INSTRUCTION\}\}/g, respondLanguageInstruction)
      .replace(/\{\{USER_LANGUAGE\}\}/g, userLang)
      .replace(/\{\{DATE\}\}/g, today)
      .replace(/\{\{USER_PROFILE\}\}/g, profileStr)
      .replace(/\{\{SELECTED_DISEASES\}\}/g, diseasesStr)
      .replace(/\{\{EPIDEMIOLOGY_CONTEXT\}\}/g, epidemiologyContext)
      .replace(/\{\{PRESCRIPTION_PROTOCOL\}\}/g, prescriptionProtocol)
      .replace(/\{\{TODAY_PRESCRIPTION_AXIS\}\}/g, todayAxisLabel)
      .replace(/\{\{DAY_OF_YEAR\}\}/g, String(dayOfYear))
      .replace(/\{\{RECENT_PROPOSALS\}\}/g, recentProposalsList)
      .replace(/\{\{LOCATION\}\}/g, profile.location || 'Worldwide')
      .replace(/\{\{USER_DATA\}\}/g, JSON.stringify(data.current || {}, null, 2))
      .replace(/\{\{WEEKLY_DATA\}\}/g, JSON.stringify(data.weekly || {}, null, 2))
      .replace(/\{\{BLOOD_TEST_DATA\}\}/g, JSON.stringify(data.bloodTests || {}, null, 2))
      .replace(/\{\{CURRENT_SUPPLEMENTS\}\}/g, JSON.stringify(data.supplements || {}, null, 2))
      .replace(/\{\{SYMPTOM_DATA\}\}/g, JSON.stringify(data.symptoms || {}, null, 2))
      .replace(/\{\{HRV_DATA\}\}/g, JSON.stringify(data.hrv || {}, null, 2))
      .replace(/\{\{ACTIVITY_DATA\}\}/g, JSON.stringify(data.activity || {}, null, 2))
      .replace(/\{\{PEM_HISTORY\}\}/g, JSON.stringify(data.pemHistory || {}, null, 2));

    return prompt;
  }

  // Call AI model API - real implementation.
  //
  // IMPORTANT: this MUST return a string (the raw model response text) or
  // throw on failure. It must never return a JS object — callers parse the
  // string as JSON. If the API is unavailable or no key is set, throw and
  // let the caller decide what fallback message to show. Returning a fake
  // "demo" object here used to leak as raw JSON to the user UI.
  //
  // Automatic provider fallback: if the preferred provider fails (proxy
  // down, bad key, rate limit, network error), we transparently retry
  // with other providers whose keys are available. The user sees a
  // working result instead of an error. Errors are aggregated so that
  // when ALL providers fail, the thrown Error.message lists exactly what
  // went wrong with each, making it trivial to diagnose.
  // Detect canned AI refusal responses that we should never surface
  // directly to users. Catches both:
  //   (a) Short responses that ARE refusals (length < 400)
  //   (b) Any response that CONTAINS hard-refusal phrases anywhere
  // The second mode is critical for catching cases where the AI
  // wraps the refusal in extra prose like "Hello! I'm sorry, I
  // can't assist with that. If you have other questions...".
  // Direct-browser calls bypass the Cloudflare Worker, so the refusal
  // filter has to run client-side again. Detects the common canned
  // phrases in both English ("I'm sorry, I can't assist...") and
  // Japanese. isRefusalResponse returns true when the whole reply is a
  // refusal; sanitizeRefusal strips a leading refusal sentence while
  // preserving any substantive follow-up the model included.
  isRefusalResponse(text) {
    if (!text) return true;
    const s = String(text).trim();
    if (!s) return true;
    const patterns = [
      /^i'?m sorry[,.]?\s*(but\s*)?i (can'?t|cannot|am not able to|won'?t) (assist|help)/i,
      /^i (can'?t|cannot) (help|assist) (with|you) (that|this)/i,
      /^i'?m not able to (assist|help)/i,
      /^申し訳(ありません|ございません)が.{0,40}(お手伝い|お答え|ご案内)(でき|いたしかね)/,
    ];
    if (s.length < 400) {
      for (const p of patterns) if (p.test(s)) return true;
    }
    const head = s.slice(0, 160);
    for (const p of patterns) if (p.test(head)) return true;
    return false;
  }
  sanitizeRefusal(text) {
    if (!text) return '';
    const s = String(text);
    const firstBreak = s.search(/[。.\n]/);
    if (firstBreak > 0) {
      const head = s.slice(0, firstBreak + 1);
      if (this.isRefusalResponse(head)) return s.slice(firstBreak + 1).trim();
    }
    return this.isRefusalResponse(s) ? '' : s;
  }

  async callModel(modelId, prompt, options = {}) {
    // Apply opt-in PII masking before the text leaves the browser.
    if (typeof Privacy !== 'undefined' && Privacy.isEnabled && Privacy.isEnabled()) {
      const before = prompt.length;
      prompt = Privacy.anonymizeText(prompt);
      const after = prompt.length;
      if (before !== after) console.log('[Privacy] masked', before - after, 'chars of PII before AI call');
    }

    // ── Global timeout ──
    // Cap the entire provider chain at 55s so users never wait
    // indefinitely. A hard deadline prevents the 87-second spinner
    // reported by users when the retry chain stacked up. After the
    // deadline, abort remaining retries and return the graceful
    // disease-aware fallback.
    const startTime = Date.now();
    const GLOBAL_DEADLINE_MS = options.globalTimeoutMs || 55000;
    const timeRemaining = () => GLOBAL_DEADLINE_MS - (Date.now() - startTime);

    const providers = this.buildProviderFallbackList(modelId);
    const errors = [];
    let lastRefusal = null;
    // Use shorter per-call timeout so a single hanging provider
    // doesn't eat up the whole deadline.
    const perCallOptions = (remaining) => ({
      ...options,
      perCallTimeoutMs: Math.max(5000, Math.min(30000, remaining - 2000))
    });

    for (const { model, callFn } of providers) {
      if (timeRemaining() <= 3000) {
        console.warn('[AI Engine] Global deadline approaching, skipping remaining providers');
        break;
      }
      const key = this.getApiKey(model);
      const canUseSharedProxy = model.startsWith('claude-') && this.canUseSharedProxy();
      if (!key && !canUseSharedProxy) {
        errors.push(`${model}: no API key`);
        continue;
      }
      try {
        console.log('[AI Engine] Trying', model, `(${Math.round(timeRemaining()/1000)}s remaining)`);
        const result = await callFn.call(this, model, prompt, key, perCallOptions(timeRemaining()));

        if (model !== modelId) {
          console.warn(`[AI Engine] Fell back from ${modelId} to ${model}`);
        }
        return result;
      } catch (err) {
        console.warn(`[AI Engine] ${model} failed:`, err.message);
        errors.push(`${model}: ${err.message}`);
      }
    }
    // All providers failed — throw so callers show diagnostic error.
    // The old code silently returned _gracefulRefusalFallback here,
    // which masked the real error and showed "AIサービスが混雑" even
    // when the actual cause was missing API key or CORS rejection.
    const errDetail = errors.join(' | ');
    console.error('[AI Engine] ALL_PROVIDERS_FAILED:', errDetail);
    throw new Error('ALL_PROVIDERS_FAILED: ' + errDetail);
  }

  // _wrapAsJournalEntry, _wrapAsResearchSummary, _buildSafeSystemPrompt
  // have been moved to the Cloudflare Worker (server-side only).
  _wrapAsJournalEntry(p) { return p; }
  _wrapAsResearchSummary(p) { return p; }
  _buildSafeSystemPrompt(e) { return e || ''; }

  // Graceful fallback — disease-specific content moved server-side.
  _gracefulRefusalFallback(_originalPrompt) {
    return JSON.stringify({
      summary: '記録ありがとうございます。お疲れさまです。',
      findings: '現在AIサービスが混雑しています。しばらくしてから再度お試しください。\n\n日々の記録を続けていただくことが、ご自身の体調パターンを理解する第一歩です。',
      actions: [
        '今日の記録を続けていただきありがとうございます。',
        '気になる症状があれば、次の診察時にこの日記を見せて主治医にご相談ください。',
      ],
      new_approach: '体調が安定している時間帯を記録すると、活動のペース配分が見えてきます。',
      next_check: '明日も一行で大丈夫ですので書いてみてください。',
      _fromAPI: true,
      _fallback: 'client_minimal'
    });
  }

  // Shared proxy mode allows guest / pre-login users to receive AI
  // advice without storing provider API keys in the browser.
  // The Cloudflare Worker must have ANTHROPIC_API_KEY set as a secret.
  canUseSharedProxy() {
    return localStorage.getItem('enable_shared_guest_ai') !== '0';
  }

  // Build the list of providers to try, in order, starting with the
  // user's preferred model and falling back through alternatives.
  //
  // IMPORTANT for guest mode: the shared Cloudflare proxy only works
  // for Anthropic endpoints, and guests have no API keys for OpenAI
  // or Google. If we only list one Claude variant and it fails
  // (model rotation, rate limit, transient 5xx), the whole guest
  // request dies and they see "サービスを準備中". To make guest mode
  // resilient, we ALWAYS include Opus + Sonnet + Haiku when the user
  // prefers any Claude model — that way a Haiku failure naturally
  // falls through to Sonnet / Opus on the same shared proxy path.
  // #9 Simplified provider chain: Anthropic only (Opus → Sonnet → Haiku).
  // OpenAI/Google are available for direct selection but NOT in the
  // automatic fallback chain. This reduces timeout from 55s to ~30s
  // and makes failures predictable.
  buildProviderFallbackList(preferredModel) {
    const opus   = { model: 'claude-opus-4-6',   callFn: this.callAnthropic };
    const sonnet = { model: 'claude-sonnet-4-6', callFn: this.callAnthropic };
    const haiku  = { model: 'claude-haiku-4-5',  callFn: this.callAnthropic };
    const uniq = (arr) => {
      const seen = new Set();
      return arr.filter(p => (seen.has(p.model) ? false : (seen.add(p.model), true)));
    };
    if (preferredModel?.startsWith('gpt-')) {
      return [{ model: preferredModel, callFn: this.callOpenAI }];
    }
    if (preferredModel?.startsWith('gemini-')) {
      return [{ model: preferredModel, callFn: this.callGoogle }];
    }
    return uniq([
      { model: preferredModel || 'claude-opus-4-6', callFn: this.callAnthropic },
      opus, sonnet, haiku
    ]);
  }

  // Anthropic Claude API (via proxy or direct)
  async callAnthropic(modelId, prompt, apiKey, options) {
    // Map internal model identifiers (the CONFIG.AI_MODELS ids) onto
    // the actual API model names. Anthropic rotates model IDs: any
    // hardcoded id eventually returns HTTP 400 once deprecated, which
    // the user sees as "分析の呼び出しに失敗".
    //
    // We use the UNDATED aliases (claude-opus-4-6, claude-sonnet-4-6,
    // claude-haiku-4-5) which Anthropic keeps fresh by pointing them
    // at the latest dated snapshot. Previously Haiku was pinned to
    // `claude-haiku-4-5-20251001` which became the root cause of the
    // "分析サービスに接続できませんでした" error reported in guest mode
    // once that specific snapshot was rotated out on the API.
    const MODEL_MAP = {
      'claude-sonnet-4-6': 'claude-sonnet-4-6',
      'claude-opus-4-6':   'claude-opus-4-6',
      'claude-haiku-4-5':  'claude-haiku-4-5',
    };
    const apiModelId = MODEL_MAP[modelId] || modelId || 'claude-opus-4-6';

    // Direct connection to Anthropic API. Simple, no intermediaries.
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    if (apiKey) headers['x-api-key'] = apiKey;

    // Vision: when options.imageBase64 is supplied, wrap the prompt and
    // image in a content array per the Anthropic messages API contract.
    // The base64 string may arrive as a raw payload or a data URL
    // ("data:image/png;base64,iVBOR..."); split out the media type and
    // payload cleanly so we never send a malformed source block.
    let userContent;
    if (options.imageBase64) {
      let mediaType = 'image/jpeg';
      let data = options.imageBase64;
      const dataUrlMatch = /^data:([^;]+);base64,(.*)$/.exec(data);
      if (dataUrlMatch) {
        mediaType = dataUrlMatch[1];
        data = dataUrlMatch[2];
      }
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
        { type: 'text', text: prompt.substring(0, 100000) }
      ];
    } else {
      userContent = prompt.substring(0, 100000);
    }

    const systemPrompt = options.systemPrompt
      || 'あなたは健康日記アプリの日記分析コンパニオンです。温かく寄り添い、一般的な健康情報を共有してください。主治医への相談を添えつつ、具体的な情報も併記してください。';

    const body = {
      model: apiModelId,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    };

    console.log('[Anthropic] Direct API call, model:', apiModelId);

    const controller = new AbortController();
    const timeoutMs = options.perCallTimeoutMs || 30000;
    const tid = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchErr) {
      const reason = fetchErr.name === 'AbortError' ? 'タイムアウト' : fetchErr.message;
      throw new Error(`Anthropic API 接続失敗: ${reason}`);
    } finally {
      clearTimeout(tid);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let errMsg = response.statusText;
      try { const j = JSON.parse(errBody); errMsg = j.error?.message || j.message || errMsg; } catch(e) {}
      throw new Error(`Anthropic ${response.status}: ${errMsg}`);
    }

    const data = await response.json();
    console.log('[Anthropic] Success');
    try {
      const u = data.usage || {};
      store.recordApiUsage(modelId, u.input_tokens || 0, u.output_tokens || 0, apiKey ? 'auth' : 'guest');
    } catch (e) {}
    return data.content?.[0]?.text || JSON.stringify(data);
  }

  // OpenAI GPT API (with Vision support for images)
  async callOpenAI(modelId, prompt, apiKey, options) {
    // Build messages - support image content
    const userContent = options.imageBase64
      ? [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: options.imageBase64, detail: 'high' } }
        ]
      : prompt;

    const systemPrompt = options.systemPrompt || 'You are a health diary companion.';

    // 30s per-call timeout (same as callAnthropic) to prevent hangs.
    const openAiController = new AbortController();
    const openAiTimeoutId = setTimeout(() => openAiController.abort(), options.perCallTimeoutMs || 30000);
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.3
        }),
        signal: openAiController.signal
      });
    } catch (fe) {
      if (fe.name === 'AbortError') throw new Error('OpenAI API timeout (30s)');
      throw fe;
    } finally {
      clearTimeout(openAiTimeoutId);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    try {
      const u = data.usage || {};
      store.recordApiUsage(modelId, u.prompt_tokens, u.completion_tokens, 'auth');
    } catch (e) { console.warn('[usage track]', e.message); }
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
  }

  // Google Gemini API
  async callGoogle(modelId, prompt, apiKey, options) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const googleController = new AbortController();
    const googleTimeoutId = setTimeout(() => googleController.abort(), options.perCallTimeoutMs || 30000);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.3,
            maxOutputTokens: options.maxTokens || 4096
          },
          systemInstruction: { parts: [{ text: options.systemPrompt || 'You are a health diary companion.' }] }
        }),
        signal: googleController.signal
      });
    } catch (fe) {
      if (fe.name === 'AbortError') throw new Error('Google API timeout (30s)');
      throw fe;
    } finally {
      clearTimeout(googleTimeoutId);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Google API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    try {
      const u = data.usageMetadata || {};
      store.recordApiUsage(modelId, u.promptTokenCount, u.candidatesTokenCount, 'auth');
    } catch (e) { console.warn('[usage track]', e.message); }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
  }

  // PubMed real search
  async searchPubMed(query, maxResults = 10) {
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&retmode=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];

      if (ids.length === 0) return [];

      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
      const fetchRes = await fetch(fetchUrl);
      const fetchData = await fetchRes.json();

      return ids.map(id => {
        const article = fetchData.result?.[id];
        if (!article) return null;

        // Extract DOI properly from elocationid or articleids
        let doi = '';
        if (article.elocationid) {
          const doiMatch = article.elocationid.match(/(?:doi:\s*)?((10\.\d{4,}\/[^\s]+))/i);
          if (doiMatch) doi = doiMatch[1];
        }
        if (!doi && article.articleids) {
          const doiEntry = article.articleids.find(a => a.idtype === 'doi');
          if (doiEntry) doi = doiEntry.value;
        }

        const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
        // Build Google Translate URL using the modern translate.goog
        // subdomain format. The old translate.google.com/translate?u=
        // endpoint was deprecated in 2019 and now shows a landing page
        // that doesn't redirect — users were stuck on a "translation not
        // available" screen.
        // Format: https://{host-with-dashes}.translate.goog{path}?_x_tr_sl=auto&_x_tr_tl=ja&_x_tr_hl=ja
        const toGoogTranslate = (srcUrl) => {
          try {
            const u = new URL(srcUrl);
            const host = u.hostname.replace(/\./g, '-');
            const sep = u.search ? u.search + '&' : '?';
            return `https://${host}.translate.goog${u.pathname}${sep}_x_tr_sl=auto&_x_tr_tl=ja&_x_tr_hl=ja`;
          } catch (e) {
            return srcUrl;
          }
        };

        return {
          pmid: id,
          title: article.title || '',
          authors: (article.authors || []).map(a => a.name).join(', '),
          journal: article.fulljournalname || article.source || '',
          date: article.pubdate || article.sortpubdate || '',
          doi: doi,
          url: pubmedUrl,
          translateUrl: toGoogTranslate(pubmedUrl),
          doiUrl: doi ? `https://doi.org/${doi}` : '',
          doiTranslateUrl: doi ? toGoogTranslate('https://doi.org/' + doi) : '',
          summary: article.title
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('PubMed search failed:', error);
      return [];
    }
  }

  getApiKey(modelId) {
    // Guard against undefined / null: callers sometimes pass an
    // un-initialized selectedModel early in the bootstrap, and the
    // template literal + startsWith() would throw TypeError.
    if (!modelId) return '';
    // Check all possible key storage patterns
    const directKey = localStorage.getItem(`apikey_${modelId}`);
    if (directKey) return directKey;

    // Fallback to provider-level keys
    if (modelId.startsWith('claude-')) return localStorage.getItem('apikey_anthropic') || '';
    if (modelId.startsWith('gpt-')) return localStorage.getItem('apikey_openai') || '';
    if (modelId.startsWith('gemini-')) return localStorage.getItem('apikey_google') || '';
    return '';
  }

  // Parse analysis result into structured data
  parseAnalysisResult(result) {
    if (typeof result === 'object') return result;

    const parsed = {
      summary: '',
      recommendations: [],
      actionItems: [],
      researchUpdates: [],
      riskAlerts: [],
      raw: result
    };

    try {
      // Try to extract JSON blocks from the response
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        Object.assign(parsed, jsonData);
      }
    } catch (e) {
      // Parse as structured text
      parsed.summary = result.substring(0, 500);
    }

    return parsed;
  }

  summarizeUserData(data) {
    return {
      dataPoints: Object.values(data).reduce((sum, val) =>
        sum + (Array.isArray(val) ? val.length : val ? 1 : 0), 0),
      categories: Object.keys(data).filter(k => data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : true)),
      timestamp: new Date().toISOString()
    };
  }


  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Run scheduled analysis
  async runScheduledAnalysis(promptConfig) {
    const userData = this.collectCurrentUserData();
    return await this.analyze(promptConfig.prompt, userData, {
      promptName: promptConfig.name,
      model: store.get('selectedModel')
    });
  }

  // Collect all current user data for analysis
  collectCurrentUserData(options = {}) {
    const guestMode = options.guest === true;
    const cap = (arr, limit) => {
      if (!Array.isArray(arr)) return [];
      if (!limit || arr.length <= limit) return arr;
      return arr.slice(-limit);
    };

    return {
      current: {
        symptoms: cap(store.getDataRange('symptoms', 1), guestMode ? 5 : 50),
        vitals: cap(store.getDataRange('vitals', 1), guestMode ? 5 : 50),
        sleep: cap(store.getDataRange('sleepData', 1), guestMode ? 5 : 50),
        activity: cap(store.getDataRange('activityData', 1), guestMode ? 5 : 50),
        medications: cap(store.get('medications') || [], guestMode ? 10 : 100),
        supplements: cap(store.get('supplements') || [], guestMode ? 10 : 100)
      },
      weekly: {
        symptoms: cap(store.getDataRange('symptoms', 7), guestMode ? 7 : 100),
        vitals: cap(store.getDataRange('vitals', 7), guestMode ? 7 : 100),
        sleep: cap(store.getDataRange('sleepData', 7), guestMode ? 7 : 100),
        activity: cap(store.getDataRange('activityData', 7), guestMode ? 7 : 100)
      },
      bloodTests: cap(store.get('bloodTests') || [], guestMode ? 10 : 100),
      supplements: cap(store.get('supplements') || [], guestMode ? 20 : 200),
      symptoms: cap(store.getDataRange('symptoms', 30), guestMode ? 20 : 300),
      hrv: cap(store.getDataRange('wearableData', 7), guestMode ? 10 : 100),
      activity: cap(store.getDataRange('activityData', 7), guestMode ? 14 : 200),
      pemHistory: cap(store.getDataRange('symptoms', 30).filter(s => s.pem_status === true), guestMode ? 10 : 100),
      textEntries: cap(store.get('textEntries') || [], guestMode ? 5 : 100),
      conversationHistory: cap(store.get('conversationHistory') || [], guestMode ? 8 : 120)
    };
  }
};

var aiEngine = new AIEngine();


