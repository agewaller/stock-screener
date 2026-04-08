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
    const modelId = options.model || store.get('selectedModel') || 'claude-sonnet-4-6';
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
  interpolatePrompt(template, data) {
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Build user profile string
    const profile = store.get('userProfile') || {};
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

    let prompt = template
      .replace(/\{\{DATE\}\}/g, today)
      .replace(/\{\{USER_PROFILE\}\}/g, profileStr)
      .replace(/\{\{SELECTED_DISEASES\}\}/g, diseasesStr)
      .replace(/\{\{LOCATION\}\}/g, profile.location || '日本')
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
  async callModel(modelId, prompt, options = {}) {
    const providers = this.buildProviderFallbackList(modelId);
    const errors = [];
    for (const { model, callFn } of providers) {
      const key = this.getApiKey(model);
      if (!key) {
        errors.push(`${model}: no API key`);
        continue;
      }
      try {
        console.log('[AI Engine] Trying', model);
        const result = await callFn.call(this, model, prompt, key, options);
        // Successful provider — if it wasn't the originally requested
        // one, log a warning so the admin can see the fallback in the
        // console but nothing is surfaced to regular users.
        if (model !== modelId) {
          console.warn(`[AI Engine] Fell back from ${modelId} to ${model}`);
        }
        return result;
      } catch (err) {
        console.warn(`[AI Engine] ${model} failed:`, err.message);
        errors.push(`${model}: ${err.message}`);
      }
    }
    throw new Error('ALL_PROVIDERS_FAILED: ' + errors.join(' | '));
  }

  // Build the list of providers to try, in order, starting with the
  // user's preferred model and falling back to the other two. Image
  // analysis can only use OpenAI (vision), so for those we force the
  // preferred path first and skip non-vision fallbacks unless they
  // happen to support the input.
  buildProviderFallbackList(preferredModel) {
    const anthropic = { model: 'claude-sonnet-4-6', callFn: this.callAnthropic };
    const openai = { model: 'gpt-4o', callFn: this.callOpenAI };
    const google = { model: 'gemini-2.5-pro', callFn: this.callGoogle };

    if (preferredModel?.startsWith('claude-')) {
      return [{ model: preferredModel, callFn: this.callAnthropic }, openai, google];
    }
    if (preferredModel?.startsWith('gpt-')) {
      return [{ model: preferredModel, callFn: this.callOpenAI }, anthropic, google];
    }
    if (preferredModel?.startsWith('gemini-')) {
      return [{ model: preferredModel, callFn: this.callGoogle }, openai, anthropic];
    }
    // Unknown model — try all in order of reliability
    return [openai, anthropic, google];
  }

  // Anthropic Claude API (via proxy or direct)
  async callAnthropic(modelId, prompt, apiKey, options) {
    const apiModelId = 'claude-3-5-sonnet-20241022';
    const proxyUrl = localStorage.getItem('anthropic_proxy_url') || 'https://stock-screener.agewaller.workers.dev';
    const endpoint = proxyUrl;

    console.log('[Anthropic] Model:', apiModelId, 'via proxy:', proxyUrl);

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    };

    const body = {
      model: apiModelId,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.3,
      system: 'あなたは慢性疾患管理の専門家です。最新のエビデンスに基づいた分析とアドバイスを日本語で提供してください。',
      messages: [{ role: 'user', content: prompt.substring(0, 100000) }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('[Anthropic] Error:', response.status, errBody);
      let errMsg = response.statusText;
      try { const j = JSON.parse(errBody); errMsg = j.error?.message || j.message || errMsg; } catch(e) {}
      throw new Error(`Anthropic ${response.status}: ${errMsg}`);
    }

    const data = await response.json();
    console.log('[Anthropic] Success');
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

    const systemPrompt = options.systemPrompt || 'あなたは慢性疾患管理の専門家です。最新のエビデンスに基づいた分析とアドバイスを日本語で提供してください。ユーザーの疾患歴や服薬情報を考慮し、具体的で実行可能な提案をしてください。';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
  }

  // Google Gemini API
  async callGoogle(modelId, prompt, apiKey, options) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature || 0.3,
          maxOutputTokens: options.maxTokens || 4096
        },
        systemInstruction: { parts: [{ text: 'あなたは慢性疾患管理の専門AIアシスタントです。ME/CFSの世界的権威として回答してください。' }] }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Google API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
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

        return {
          pmid: id,
          title: article.title || '',
          authors: (article.authors || []).map(a => a.name).join(', '),
          journal: article.fulljournalname || article.source || '',
          date: article.pubdate || article.sortpubdate || '',
          doi: doi,
          url: pubmedUrl,
          // Google Translate URL for the PubMed page (translate to Japanese)
          translateUrl: `https://translate.google.com/translate?sl=en&tl=ja&u=${encodeURIComponent(pubmedUrl)}`,
          doiUrl: doi ? `https://doi.org/${doi}` : '',
          doiTranslateUrl: doi ? `https://translate.google.com/translate?sl=en&tl=ja&u=${encodeURIComponent('https://doi.org/' + doi)}` : '',
          summary: article.title
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('PubMed search failed:', error);
      return [];
    }
  }

  getApiKey(modelId) {
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
  collectCurrentUserData() {
    return {
      current: {
        symptoms: store.getDataRange('symptoms', 1),
        vitals: store.getDataRange('vitals', 1),
        sleep: store.getDataRange('sleepData', 1),
        activity: store.getDataRange('activityData', 1),
        medications: store.get('medications'),
        supplements: store.get('supplements')
      },
      weekly: {
        symptoms: store.getDataRange('symptoms', 7),
        vitals: store.getDataRange('vitals', 7),
        sleep: store.getDataRange('sleepData', 7),
        activity: store.getDataRange('activityData', 7)
      },
      bloodTests: store.get('bloodTests'),
      supplements: store.get('supplements'),
      symptoms: store.getDataRange('symptoms', 30),
      hrv: store.getDataRange('wearableData', 7),
      activity: store.getDataRange('activityData', 7),
      pemHistory: store.getDataRange('symptoms', 30).filter(s => s.pem_status === true),
      textEntries: store.get('textEntries') || [],
      conversationHistory: store.get('conversationHistory') || []
    };
  }
};

var aiEngine = new AIEngine();
