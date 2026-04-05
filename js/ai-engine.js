/* ============================================================
   AI Analysis Engine
   Handles AI model integration and prompt execution
   ============================================================ */
class AIEngine {
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

    let prompt = template
      .replace(/\{\{DATE\}\}/g, today)
      .replace(/\{\{USER_DATA\}\}/g, JSON.stringify(data.current || {}, null, 2))
      .replace(/\{\{WEEKLY_DATA\}\}/g, JSON.stringify(data.weekly || {}, null, 2))
      .replace(/\{\{BLOOD_TEST_DATA\}\}/g, JSON.stringify(data.bloodTests || {}, null, 2))
      .replace(/\{\{CURRENT_SUPPLEMENTS\}\}/g, JSON.stringify(data.supplements || {}, null, 2))
      .replace(/\{\{SYMPTOM_DATA\}\}/g, JSON.stringify(data.symptoms || {}, null, 2))
      .replace(/\{\{HRV_DATA\}\}/g, JSON.stringify(data.hrv || {}, null, 2))
      .replace(/\{\{ACTIVITY_DATA\}\}/g, JSON.stringify(data.activity || {}, null, 2))
      .replace(/\{\{PEM_HISTORY\}\}/g, JSON.stringify(data.pemHistory || {}, null, 2));

    // Add user profile context
    const disease = store.get('selectedDisease');
    if (disease) {
      prompt = `【対象疾患】${disease.fullName}\n\n` + prompt;
    }

    return prompt;
  }

  // Call AI model API
  async callModel(modelId, prompt, options = {}) {
    // In production, this calls the actual API through a backend proxy
    // For demo, we return a structured mock response
    const endpoint = this.apiEndpoints[modelId];

    try {
      const response = await fetch(endpoint || '/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey(modelId)}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: 'あなたは慢性疾患管理の専門AIアシスタントです。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || data.content?.[0]?.text || data;
    } catch (error) {
      // If API not available, return demo analysis
      console.warn('API not available, using demo mode:', error.message);
      return this.generateDemoAnalysis();
    }
  }

  getApiKey(modelId) {
    // In production, API keys are managed server-side
    return localStorage.getItem(`apikey_${modelId}`) || '';
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

  // Generate demo analysis for when API is not available
  generateDemoAnalysis() {
    return {
      summary: 'ME/CFS症状の分析結果（デモモード）',
      healthScore: store.get('healthScore') || 45,
      trends: {
        fatigue: { direction: 'stable', change: -0.2 },
        pain: { direction: 'improving', change: -0.5 },
        sleep: { direction: 'declining', change: -0.3 },
        cognitive: { direction: 'stable', change: 0.1 }
      },
      recommendations: [
        {
          id: 'rec_1',
          priority: 'high',
          category: 'supplement',
          title: 'CoQ10（コエンザイムQ10）の増量を推奨',
          description: 'ミトコンドリア機能サポートのため、現在の100mgから200mgへの増量を検討してください。最新のメタ分析（2026, J Chronic Fatigue Syndr）で有意な改善が報告されています。',
          evidence: '★★★★☆',
          cost: '月額 ¥3,000〜¥5,000',
          action: { type: 'supplement', product: 'CoQ10 200mg', links: [
            { store: 'iHerb', url: 'https://www.iherb.com/search?kw=coq10+200mg', price: '¥2,800' },
            { store: 'Amazon.co.jp', url: 'https://www.amazon.co.jp/s?k=CoQ10+200mg', price: '¥3,200' }
          ]}
        },
        {
          id: 'rec_2',
          priority: 'high',
          category: 'clinic',
          title: '免疫機能検査の受診を推奨',
          description: 'NK細胞活性とサイトカインプロファイルの確認。直近の症状パターンから免疫系の再評価が望ましい状態です。',
          evidence: '★★★★★',
          cost: '¥15,000〜¥30,000（自費）',
          action: { type: 'clinic', facilities: [
            { name: '国立精神・神経医療研究センター', area: '東京都小平市', tel: '042-341-2711', url: 'https://www.ncnp.go.jp/', insurance: '一部保険適用' },
            { name: '東京慈恵会医科大学附属病院', area: '東京都港区', tel: '03-3433-1111', url: 'https://www.jikei.ac.jp/hospital/', insurance: '保険適用' }
          ]}
        },
        {
          id: 'rec_3',
          priority: 'medium',
          category: 'device',
          title: '迷走神経刺激デバイス（Nurosym）の使用検討',
          description: '最新の臨床試験で自律神経調整効果が確認されています。1日2回、各20分の使用プロトコル。',
          evidence: '★★★☆☆',
          cost: '¥45,000（初回購入）',
          action: { type: 'device', product: 'Nurosym', links: [
            { store: '公式サイト', url: 'https://nurosym.com/', price: '€299' }
          ]}
        },
        {
          id: 'rec_4',
          priority: 'medium',
          category: 'food',
          title: '抗炎症食事プロトコルの導入',
          description: 'オメガ3脂肪酸を豊富に含む食事への移行を推奨。地中海食ベースのME/CFS向けアダプテーション。',
          evidence: '★★★★☆',
          cost: '月額 ¥10,000〜¥15,000（食費増分）',
          action: { type: 'food', protocol: 'anti_inflammatory_diet' }
        },
        {
          id: 'rec_5',
          priority: 'low',
          category: 'clinical_trial',
          title: 'LDN臨床試験への参加検討',
          description: '低用量ナルトレキソン（LDN）のME/CFS患者を対象とした第3相試験が東京で開始予定。',
          evidence: '★★★☆☆',
          cost: '無料（臨床試験）',
          action: { type: 'clinical_trial', trialId: 'NCT06XXXXXX', url: 'https://clinicaltrials.gov/' }
        }
      ],
      actionItems: [
        { id: 'act_1', title: '今日の心拍数モニタリングを開始', priority: 'high', type: 'self_care', done: false },
        { id: 'act_2', title: 'CoQ10をiHerbで注文', priority: 'high', type: 'purchase', done: false },
        { id: 'act_3', title: '免疫機能検査の予約を取る', priority: 'medium', type: 'clinic', done: false },
        { id: 'act_4', title: 'ペーシング日記を記録', priority: 'high', type: 'self_care', done: false },
        { id: 'act_5', title: '抗炎症レシピを3つ保存', priority: 'low', type: 'food', done: false }
      ],
      researchUpdates: [
        {
          title: 'TRPM3イオンチャネル機能不全とME/CFS：大規模コホート研究結果',
          authors: 'Cabanas H, et al.',
          journal: 'Nature Medicine',
          date: '2026-03-28',
          doi: '10.1038/s41591-026-XXXX',
          significance: 'high',
          summary: 'TRPM3チャネルの機能異常がME/CFS患者の88%で確認。新たな診断バイオマーカーとしての可能性。'
        },
        {
          title: '低用量ナルトレキソンのME/CFS患者における二重盲検RCT結果',
          authors: 'Younger J, et al.',
          journal: 'JAMA Internal Medicine',
          date: '2026-04-01',
          doi: '10.1001/jamainternmed.2026.XXXX',
          significance: 'high',
          summary: 'LDN 4.5mgが疲労スコアを34%改善（p<0.001）。副作用は軽微。'
        },
        {
          title: '腸内細菌叢移植のME/CFS患者への効果：パイロット研究',
          authors: 'Navaneetharaja N, et al.',
          journal: 'Gut Microbes',
          date: '2026-03-30',
          doi: '10.1080/19490976.2026.XXXX',
          significance: 'medium',
          summary: 'FMT後6ヶ月で症状スコア25%改善。Faecalibacterium prausnitziiの増加が改善と相関。'
        }
      ],
      riskAlerts: [
        { level: 'warning', message: '過去3日間の活動量が推奨上限を超えています。PEMリスクが高まっています。' },
        { level: 'info', message: '睡眠の質が低下傾向です。メラトニン（0.5mg）の就寝前投与を検討してください。' }
      ]
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
      pemHistory: store.getDataRange('symptoms', 30).filter(s => s.pem_status === true)
    };
  }
}

const aiEngine = new AIEngine();
