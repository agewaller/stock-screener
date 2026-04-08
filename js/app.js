/* ============================================================
   Main Application Controller
   ============================================================ */
var App = class App {
  constructor() {
    this.pages = {};
    this.currentPage = null;
    this.chartInstances = {};
    this.ADMIN_EMAILS = ['agewaller@gmail.com'];
    // Load additional admins from localStorage
    try {
      const extra = JSON.parse(localStorage.getItem('admin_emails') || '[]');
      if (Array.isArray(extra)) this.ADMIN_EMAILS = [...new Set([...this.ADMIN_EMAILS, ...extra])];
    } catch(e) {}
  }

  isAdmin() {
    const user = store.get('user');
    return user && this.ADMIN_EMAILS.includes(user.email);
  }

  init() {
    // Force light theme always
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('cc_theme');
    store.on('currentPage', (p) => this.navigate(p));

    // Show immediate content from localStorage while Firebase loads
    const hasLocalAuth = store.get('isAuthenticated') && store.get('user');
    if (hasLocalAuth) {
      // Show dashboard immediately from cached data
      this.navigate(store.get('selectedDisease') ? 'dashboard' : 'disease-select');
    } else {
      this.navigate('login');
    }

    // Initialize Firebase (will update navigation when auth resolves)
    if (FirebaseBackend.isConfigured()) {
      const config = FirebaseBackend.getConfig();
      FirebaseBackend.init(config);
      FirebaseBackend.enableAutoSync();
    }

    // Set up periodic health score calc
    setInterval(() => store.calculateHealthScore(), 60000);
    store.calculateHealthScore();

    // Load initial calendar data if not yet synced
    if (!(store.get('calendarEvents') || []).length) {
      store.set('calendarEvents', [
        {id:'e1',title:'IOEA 2026',location:'Cargèse, Corsica – France',start:'2026-04-06',end:'2026-04-11',allDay:true,type:'default',attendees:1},
        {id:'e2',title:'♻️資源ごみをすてる（上原）',start:'2026-04-06T06:30:00+09:00',end:'2026-04-06T07:00:00+09:00',allDay:false,type:'default',attendees:1},
        {id:'e3',title:'Reservation at APONTE',location:'APONTE, 目黒区',start:'2026-04-09T19:00:00+09:00',end:'2026-04-09T20:00:00+09:00',allDay:false,type:'default',attendees:1},
        {id:'e4',title:'山口揚平予約 (Sheng Wei)',start:'2026-04-13T12:30:00+09:00',end:'2026-04-13T13:30:00+09:00',allDay:false,type:'default',attendees:2}
      ]);
    }
  }

  // ---- Navigation ----
  navigate(page) {
    // Block non-admin users from admin-only pages
    if (['admin', 'analysis'].includes(page) && !this.isAdmin()) {
      Components.showToast('この機能は管理者専用です', 'error');
      return;
    }

    this.currentPage = page;
    const content = document.getElementById('page-content');
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('top-bar');
    if (!content) return;

    // Hide admin-only nav items for non-admin users
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = this.isAdmin() ? '' : 'none';
    });

    // Show/hide sidebar for login/disease-select
    if (['login', 'disease-select'].includes(page)) {
      if (sidebar) sidebar.style.display = 'none';
      if (topbar) topbar.style.display = 'none';
      document.querySelector('.main-content').style.marginLeft = '0';
    } else {
      if (sidebar) sidebar.style.display = '';
      if (topbar) topbar.style.display = '';
      document.querySelector('.main-content').style.marginLeft = '';
    }

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update top bar title
    const titles = {
      dashboard: 'ダッシュボード',
      'data-input': 'データ入力',
      analysis: 'AI分析',
      actions: 'アクションセンター',
      research: '最新研究',
      chat: '相談する',
      integrations: 'デバイス連携',
      timeline: 'タイムライン',
      admin: '管理パネル',
      settings: '設定'
    };
    const titleEl = document.getElementById('top-bar-title');
    if (titleEl) titleEl.textContent = titles[page] || '';

    // Close sidebar on mobile after navigation
    this.closeSidebar();

    // Render page
    const renderer = this['render_' + page.replace(/-/g, '_')];
    if (renderer) {
      try {
        content.innerHTML = renderer.call(this);
        this.afterRender(page);
      } catch(err) {
        console.error('Page render error:', page, err);
        content.innerHTML = `<div style="padding:20px"><p>ページの読み込みエラー</p><p style="font-size:12px;color:#94a3b8">${err.message}</p><button onclick="localStorage.clear();location.reload()" style="margin-top:10px;padding:8px 16px;background:#6C63FF;color:white;border:none;border-radius:8px;cursor:pointer">リセットして再読み込み</button></div>`;
      }
    }
  }

  afterRender(page) {
    if (page === 'dashboard') {
      this.initDashboardCharts();
      setTimeout(() => this.loadDashResearch(), 300);
      setTimeout(() => this.loadActionRecommendations(), 600);
    }
    if (page === 'actions') {
      setTimeout(() => this.loadActionRecommendations(), 300);
    }
    if (page === 'analysis') this.loadLatestAnalysis();
    if (page === 'admin') { this.loadApiKeyFields(); this.loadFirebaseConfigFields(); }
    if (page === 'settings') this.loadProfileFields();
  }

  // ---- API Key Management ----
  // ---- Firebase Config Management ----
  saveFirebaseConfig() {
    const fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const config = {};
    let filled = 0;
    fields.forEach(f => {
      const el = document.getElementById('fb-' + f);
      if (el && el.value.trim()) {
        config[f] = el.value.trim();
        filled++;
      }
    });

    if (filled < 3) {
      Components.showToast('API Key, Auth Domain, Project IDは必須です', 'error');
      return;
    }

    FirebaseBackend.saveConfig(config);
    Components.showToast('Firebase設定を保存しました。ページをリロードして接続します...', 'success');
    setTimeout(() => location.reload(), 1500);
  }

  clearFirebaseConfig() {
    localStorage.removeItem('firebase_config');
    Components.showToast('Firebase設定を削除しました。リロード後はローカルモードになります。', 'info');
    setTimeout(() => location.reload(), 1500);
  }

  loadFirebaseConfigFields() {
    const config = FirebaseBackend.getConfig();
    if (!config) return;
    ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].forEach(f => {
      const el = document.getElementById('fb-' + f);
      if (el && config[f] && config[f] !== 'YOUR_FIREBASE_API_KEY') {
        el.value = config[f];
      }
    });
    const statusEl = document.getElementById('firebase-status');
    if (statusEl) {
      const configured = FirebaseBackend.isConfigured();
      const connected = FirebaseBackend.initialized;
      statusEl.className = 'tag ' + (connected ? 'tag-success' : configured ? 'tag-warning' : 'tag-danger');
      statusEl.textContent = connected ? '接続中' : configured ? '設定済(未接続)' : '未設定';
    }
  }

  loadApiKeyFields() {
    // Load proxy URL (show default if not custom-set)
    const proxyEl = document.getElementById('input-proxy-url');
    if (proxyEl) {
      const proxyStored = localStorage.getItem('anthropic_proxy_url');
      proxyEl.value = proxyStored || 'https://stock-screener.agewaller.workers.dev';
    }

    const keys = ['anthropic', 'openai', 'google'];
    keys.forEach(k => {
      const el = document.getElementById('input-apikey-' + k);
      const stored = localStorage.getItem('apikey_' + k);
      if (el && stored) {
        el.value = stored;
      }
    });
    // Update status badge
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) {
      const hasAny = keys.some(k => localStorage.getItem('apikey_' + k));
      statusEl.className = 'tag ' + (hasAny ? 'tag-success' : 'tag-warning');
      statusEl.textContent = hasAny ? 'APIキー設定済' : 'APIキー未設定';
    }
  }

  async saveApiKeys() {
    const keys = ['anthropic', 'openai', 'google'];
    const keyData = {};
    let saved = 0;
    // Save proxy URL
    const proxyEl = document.getElementById('input-proxy-url');
    if (proxyEl && proxyEl.value.trim()) {
      localStorage.setItem('anthropic_proxy_url', proxyEl.value.trim());
      saved++;
    }

    keys.forEach(k => {
      const el = document.getElementById('input-apikey-' + k);
      if (el && el.value.trim()) {
        localStorage.setItem('apikey_' + k, el.value.trim());
        keyData[k] = el.value.trim();
        saved++;
      }
    });
    if (saved > 0) {
      // Also save to Firestore if available
      if (FirebaseBackend.initialized) {
        await FirebaseBackend.saveApiKeys(keyData);
      } else {
        Components.showToast(saved + '個のAPIキーを保存しました（ローカル）', 'success');
      }
      this.loadApiKeyFields();
    } else {
      Components.showToast('保存するAPIキーがありません', 'error');
    }
  }

  async testApiKey() {
    const result = document.getElementById('api-test-result');
    if (result) result.innerHTML = Components.loading('接続テスト中...');

    const model = store.get('selectedModel') || 'claude-sonnet-4-6';
    const apiKey = aiEngine.getApiKey(model);

    if (!apiKey) {
      if (result) result.innerHTML = '<div style="color:var(--danger);font-size:12px">APIキーが設定されていません。上のフィールドにキーを入力して「保存」してください。</div>';
      return;
    }

    try {
      const response = await aiEngine.callModel(model, 'こんにちは。接続テストです。「接続成功」と返答してください。', { maxTokens: 100 });
      if (result) result.innerHTML = `<div style="color:var(--success);font-size:12px;padding:8px;background:var(--success-bg);border-radius:var(--radius-sm)">接続成功（${model}）: ${typeof response === 'string' ? response.substring(0, 100) : 'OK'}</div>`;
    } catch (err) {
      if (result) result.innerHTML = `<div style="color:var(--danger);font-size:12px;padding:8px;background:var(--danger-bg);border-radius:var(--radius-sm)">接続失敗: ${err.message}</div>`;
    }
  }

  async clearApiKeys() {
    ['anthropic', 'openai', 'google'].forEach(k => {
      localStorage.removeItem('apikey_' + k);
      const el = document.getElementById('input-apikey-' + k);
      if (el) el.value = '';
    });
    if (FirebaseBackend.initialized) {
      await FirebaseBackend.saveApiKeys({});
    }
    Components.showToast('すべてのAPIキーを削除しました', 'info');
    this.loadApiKeyFields();
  }

  // ---- Auth ----
  async loginWithGoogle() {
    if (FirebaseBackend.initialized) {
      // Real Google OAuth via Firebase
      try {
        await FirebaseBackend.signInWithGoogle();
        // Navigation handled by onAuthStateChanged
      } catch (err) {
        // Fallback to prompt mode
        this.loginWithPrompt();
      }
    } else {
      this.loginWithPrompt();
    }
  }

  loginWithPrompt() {
    const email = prompt('Googleアカウントのメールアドレスを入力してください:', 'agewaller@gmail.com');
    if (!email) return;
    const user = {
      uid: 'local_' + email.replace(/[^a-z0-9]/gi, '_'),
      displayName: email.split('@')[0],
      email: email,
      photoURL: null
    };
    store.update({ user, isAuthenticated: true });
    this.finishLogin(email);
  }

  finishLogin(email) {
    // Save custom disease name if selected
    const customInput = document.getElementById('custom-disease-name');
    if (customInput && customInput.value.trim()) {
      const diseases = store.get('selectedDiseases') || [];
      if (!diseases.includes('custom')) diseases.push('custom');
      store.set('selectedDiseases', diseases);
      store.set('customDiseaseName', customInput.value.trim());
    }

    // Ensure primary disease is set
    const diseases = store.get('selectedDiseases') || [];
    if (diseases.length > 0 && !store.get('selectedDisease')) {
      for (const cat of CONFIG.DISEASE_CATEGORIES) {
        const found = cat.diseases.find(d => d.id === diseases[0]);
        if (found) {
          store.set('selectedDisease', { id: found.id, name: found.name, fullName: found.name, icon: cat.icon, color: '#6C63FF' });
          break;
        }
      }
    }

    // Default to ME/CFS if nothing selected
    if (!store.get('selectedDisease')) {
      store.set('selectedDisease', { id: 'mecfs', name: 'ME/CFS', fullName: '筋痛性脳脊髄炎/慢性疲労症候群', icon: '🧠', color: '#6C63FF' });
    }

    // Load default prompts
    if (!store.get('customPrompts') || Object.keys(store.get('customPrompts')).length === 0) {
      store.set('customPrompts', { ...DEFAULT_PROMPTS });
    }

    Components.showToast(`${email} でログインしました（${diseases.length}疾患選択）`, 'success');
    this.navigate('dashboard');
  }

  async loginWithEmail(e) {
    if (e) e.preventDefault();
    const form = e.target;
    const email = form.querySelector('[name=email]').value;
    const pass = form.querySelector('[name=password]').value;
    if (!email || !pass) { Components.showToast('メールとパスワードを入力してください', 'error'); return; }

    if (FirebaseBackend.initialized) {
      try {
        await FirebaseBackend.signInWithEmail(email, pass);
      } catch (err) { /* error shown in signInWithEmail */ }
    } else {
      const user = { uid: 'local_' + Date.now(), displayName: email.split('@')[0], email, photoURL: null };
      store.update({ user, isAuthenticated: true });
      Components.showToast('ログインしました（ローカルモード）', 'success');
      this.navigate('disease-select');
    }
  }

  async logout() {
    if (FirebaseBackend.initialized) {
      await FirebaseBackend.signOut();
    } else {
      store.update({ user: null, isAuthenticated: false, currentPage: 'login' });
    }
    this.navigate('login');
  }

  // ---- Disease Selection ----
  // ---- Disease Selection (multi-select) ----
  toggleDiseaseSelection(checkbox) {
    const selected = store.get('selectedDiseases') || [];
    const id = checkbox.value;

    if (checkbox.checked) {
      if (!selected.includes(id)) selected.push(id);
    } else {
      const idx = selected.indexOf(id);
      if (idx >= 0) selected.splice(idx, 1);
    }

    store.set('selectedDiseases', selected);

    // Update count badge
    const countEl = document.getElementById('disease-count');
    if (countEl) countEl.textContent = selected.length + '件選択中';

    // Show/hide custom input
    if (id === 'custom') {
      const customInput = document.getElementById('custom-disease-name');
      if (customInput) customInput.style.display = checkbox.checked ? 'block' : 'none';
    }

    // Also set primary disease for backward compat
    if (selected.length > 0) {
      const primaryId = selected[0];
      // Find disease name from categories
      let primaryDisease = null;
      for (const cat of CONFIG.DISEASE_CATEGORIES) {
        const found = cat.diseases.find(d => d.id === primaryId);
        if (found) {
          primaryDisease = { id: found.id, name: found.name, fullName: found.name, icon: cat.icon, color: '#6C63FF' };
          break;
        }
      }
      if (primaryDisease) store.set('selectedDisease', primaryDisease);
    }
  }

  selectDisease(diseaseId) {
    // Legacy single-select support
    const disease = CONFIG.DISEASES.find(d => d.id === diseaseId);
    if (disease) {
      store.set('selectedDisease', disease);
      store.set('selectedDiseases', [diseaseId]);
      if (!store.get('customPrompts') || Object.keys(store.get('customPrompts')).length === 0) {
        store.set('customPrompts', { ...DEFAULT_PROMPTS });
      }
      Components.showToast(`${disease.name} を選択しました`, 'success');
      this.navigate('dashboard');
    }
  }

  // ---- Data Input ----
  openDataInput(category) {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!overlay || !body) return;

    const cat = CONFIG.DATA_CATEGORIES.find(c => c.id === category);
    title.textContent = cat ? `${cat.icon} ${cat.name}を記録` : 'データ入力';

    if (category === 'photos') {
      body.innerHTML = Components.photoUpload(category);
    } else {
      body.innerHTML = Components.dataEntryForm(category);
    }
    overlay.classList.add('active');
  }

  closeModal() {
    document.getElementById('modal-overlay')?.classList.remove('active');
  }

  submitDataForm(e, category) {
    e.preventDefault();
    const form = e.target;
    const data = {};
    new FormData(form).forEach((val, key) => {
      data[key] = isNaN(val) ? val : Number(val);
    });
    // Handle checkboxes
    form.querySelectorAll('input[type=checkbox]').forEach(cb => {
      data[cb.name] = cb.checked;
    });

    store.addHealthData(category, data);
    store.calculateHealthScore();
    Components.showToast('データを保存しました', 'success');
    this.closeModal();
    if (this.currentPage === 'dashboard') this.navigate('dashboard');
  }

  // Store pending files for preview before save
  // ---- Text Entry ----
  updateInputHint(category) {
    const hints = {
      symptoms: '例：今朝は倦怠感が強い、頭痛がする、ブレインフォグで集中できない\n📎 体温計やパルスオキシメーターの画面写真もOK',
      mental: '例：気分が落ち込む、不安が強い、孤独感、イライラ、やる気が出ない\n気分を1-10で数値化すると経過追跡しやすくなります',
      sleep: '例：23時就寝→7時起床、中途覚醒2回、夢を見た、寝起きのだるさ\n📎 Fitbit/Oura等の睡眠画面のスクリーンショットもOK',
      pain: '例：右肩の鈍痛 強度6/10、14時から、天気が曇り\n部位・強度・時間帯・トリガーを書くとパターンが見えてきます',
      blood_test: '例：CRP 0.8, WBC 5200, Hb 12.5, TSH 3.2, フェリチン 25\n📎 検査結果の写真をアップロードすると自動で数値を読み取ります',
      medication: '例：ツートラム100mg×2回/日、リンデロン0.5mg朝1回、五苓散2.5g×3回\n📎 お薬手帳や処方箋の写真をアップロードできます',
      supplement: '例：CoQ10 200mg朝食後、マグネシウム400mg就寝前、NMN 250mg空腹時\n効果の実感や副作用も記録してください',
      doctor: '例：山村先生：アザルフィジン追加、次回4週後に血液検査\n📎 紹介状や診断書の写真もアップロードできます',
      allergy: '例：IgE検査でダニ・ハウスダスト陽性、IgG検査で小麦・乳製品に反応\n📎 アレルギー検査結果の写真をアップロード',
      hormone: '例：コルチゾール朝8時: 12μg/dL、DHEA-S: 150μg/dL、エストラジオール: 25pg/mL\n📎 ホルモン検査結果の写真をアップロード',
      genetic: '例：MTHFR C677T ヘテロ、CYP2D6 Poor Metabolizer、COMT Val/Met\n📎 遺伝子検査レポートのスクリーンショットもOK',
      nutrition: '例：朝:オートミール+バナナ+プロテイン、昼:サバ定食、夜:鍋\n📎 食事の写真を撮ってアップロードするとカロリー・栄養素を自動推定',
      water: '例：今日の水分摂取 - 朝500ml、昼300ml、夕500ml、合計1.3L\nPOTS/ME/CFS患者は2-3L/日+塩分が推奨です',
      alcohol: '例：ビール350ml×1本、夕食と一緒に\n薬との相互作用や睡眠への影響を分析します',
      vitals: '例：心拍65bpm、血圧120/78、SpO2 98%、HRV 35ms\n📎 血圧計やパルスオキシメーターの画面写真もOK',
      weight: '例：体重65.2kg、体脂肪率22%、筋肉量48kg\n📎 体組成計（TANITA等）の画面写真もOK',
      activity: '例：散歩15分、ヨガ20分、家事30分、合計活動1時間\n翌日のPEM有無も忘れず記録してください',
      menstrual: '例：生理2日目、経血量多い、下腹部痛あり、PMS症状5日前から\n基礎体温も記録すると排卵日予測ができます',
      weather: '例：気圧1005hPa→998hPaに低下、曇り→雨、頭痛発症\n📎 気圧アプリのスクリーンショットもOK',
      environment: '例：室温24°C、湿度45%、エアコン使用、窓を開けて換気\nスマホの寝室持ち込みの有無も体調に影響します',
      conversation: '例：山村先生との診察で免疫抑制剤の追加を検討、友人と電話30分\n📎 Plaudの文字起こしをペースト or 連携ページから取り込み',
      work: '例：ミーティング2件（合計2時間）、資料作成1時間、午後にPEM症状\n50分作業→10分休憩のリズムを守りましょう',
      family: '例：母と電話30分（元気をもらった）、一人で夕食（孤独感）\n社会的つながりは回復の重要な要素です',
      travel: '例：東京→秦野 電車1.5時間、帰宅後強い倦怠感\n移動後は1-2日の回復期間を確保してください',
      finance: '例：今月の医療費合計3万円、サプリ代1.5万円\n高額療養費制度や難病助成制度の対象になる場合があります',
      meditation: '例：朝10分の坐禅、4-7-8呼吸法×3セット、ボディスキャン瞑想\n継続日数と体調の相関を追跡しています',
      research: '例：LDNのME/CFS効果の論文を読んだ、PubMed PMID: 12345678\n気になった治療法や論文の情報を記録してください',
      other: '何でも自由に記録してください。内容を自動で分類・分析します。'
    };
    const hint = hints[category] || hints.other;
    const hintEl = document.getElementById('input-hint');
    if (hintEl) hintEl.innerHTML = '💡 ' + hint.replace(/\n/g, '<br>');

    // Update placeholder
    const textarea = document.getElementById('text-input-content');
    if (textarea) textarea.placeholder = hint.split('\n')[0].replace('例：', '');
  }

  submitTextEntry() {
    const category = document.getElementById('text-input-category')?.value || 'other';
    const title = document.getElementById('text-input-title')?.value?.trim() || '';
    const content = document.getElementById('text-input-content')?.value?.trim() || '';
    const dateStr = document.getElementById('text-input-date')?.value || '';

    if (!content) {
      Components.showToast('内容を入力してください', 'error');
      return;
    }

    const timestamp = dateStr ? new Date(dateStr + 'T12:00:00').toISOString() : new Date().toISOString();

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: timestamp,
      category: category,
      type: 'text_entry',
      title: title,
      content: content
    };

    // Store in conversation history for AI context
    const history = store.get('conversationHistory') || [];
    history.push({
      role: 'user',
      content: `[${category}] ${title ? title + ': ' : ''}${content}`,
      timestamp: entry.timestamp,
      type: 'data_entry'
    });
    store.set('conversationHistory', history);

    // Always store in textEntries for AI analysis
    const textEntries = store.get('textEntries') || [];
    textEntries.push(entry);
    store.set('textEntries', textEntries);

    // Also store as health data in the appropriate category
    const stateKey = store.categoryToStateKey(category);
    if (stateKey && Array.isArray(store.get(stateKey))) {
      store.addHealthData(category, { text_note: content, title: title });
    }

    // Clear form
    document.getElementById('text-input-content').value = '';
    document.getElementById('text-input-title').value = '';

    // Navigate to dashboard and run API analysis
    this.navigate('dashboard');
    Components.showToast('保存しました', 'success');

    // ALL analysis via API prompt
    const inputWithContext = `[${category}] ${title ? title + ': ' : ''}${content}`;
    const promptType = category === 'conversation' ? 'conversation_analysis' : 'text_analysis';
    setTimeout(() => {
      this.analyzeViaAPI(inputWithContext, promptType).then(result => {
        store.set('latestFeedback', result);
        this.saveAIComment(entry.id, result);
        const el = document.getElementById('dash-ai-feedback');
        if (el) el.innerHTML = this.renderAnalysisCard(result);
      });
    }, 500);
  }

  // ---- AI Analysis ----
  async runAnalysis(promptKey) {
    const prompts = { ...DEFAULT_PROMPTS, ...(store.get('customPrompts') || {}) };
    const promptConfig = prompts[promptKey] || Object.values(prompts)[0];
    if (!promptConfig) { Components.showToast('プロンプトが見つかりません', 'error'); return; }

    const resultArea = document.getElementById('analysis-result');
    if (resultArea) resultArea.innerHTML = Components.loading('分析を実行中...');

    try {
      const result = await aiEngine.runScheduledAnalysis(promptConfig);
      if (resultArea) this.renderAnalysisResult(result, resultArea);
      Components.showToast('分析が完了しました', 'success');
    } catch (err) {
      if (resultArea) resultArea.innerHTML = `<div style="color:var(--danger);padding:20px">分析エラー: ${err.message}</div>`;
      Components.showToast('分析に失敗しました', 'error');
    }
  }

  // ---- PubMed Live Search ----
  // Generate clinic/workshop/event recommendations via API
  async loadActionRecommendations() {
    const container = document.getElementById('action-live-recs');
    if (!container) return;

    // Check cache (refresh every 12 hours)
    const cached = store.get('cachedActions');
    if (cached && cached.html && (Date.now() - cached.fetchedAt) < 12 * 60 * 60 * 1000) {
      container.innerHTML = cached.html;
      return;
    }

    const apiKey = aiEngine.getApiKey(store.get('selectedModel'));
    if (!apiKey) {
      container.innerHTML = this.generateLocalActionRecs();
      return;
    }

    container.innerHTML = Components.loading('あなたに合った施設・イベントを検索中...');

    const diseases = store.get('selectedDiseases') || [];
    const profile = store.get('userProfile') || {};
    const recentText = (store.get('textEntries') || []).slice(-5).map(e => e.content || '').join('\n').substring(0, 2000);
    const today = new Date();
    const dayOfWeek = ['日','月','火','水','木','金','土'][today.getDay()];
    const randomSeed = Math.floor(today.getTime() / 86400000); // Changes daily

    const prompt = `あなたは慢性疾患患者の生活支援の専門家です。
以下のユーザー情報に基づいて、今日（${today.toLocaleDateString('ja-JP')}・${dayOfWeek}曜日）おすすめのアクションを提案してください。

【重要】毎回異なる視点・新しい選択肢を提示すること。前回と同じ提案は避けてください。
ランダムシード: ${randomSeed}（この数値に基づいて提案内容を変化させてください）

【ユーザー情報】
疾患: ${diseases.join(', ') || '未設定'}
居住地: ${profile.location || '日本・関東'}
言語: ${profile.language || 'ja'}
年齢: ${profile.age || '未設定'}
通院範囲: ${profile.travelRange || '関東圏'}

【重要】居住地の国・地域に応じたイベントプラットフォームと医療検索サービスを使うこと。
日本ならPeatix/病院なび/ストアカ、米国ならEventbrite/Zocdoc/Meetup、
欧州ならDoctolib/Jameda等、その地域で実際に使われているサービスを特定して提案すること。
すべての提案にクリック可能なURLを付けること（検索キーワード入り）。

【最近の記録から推測される状態】
${recentText || '記録なし'}

以下の5カテゴリから各1-2件、合計5-8件を提案してください：

■ 1. クリニック・医療機関（ユーザーの国・地域の医療検索サイトで探す）
・その地域の医療検索サービスで見つかる専門クリニック
・医療機関名、診療科、住所、特徴
・予約URL（その国の予約サイト経由）

■ 2. ワークショップ・セミナー（その地域のイベントプラットフォームで探す）
・その国で使われているイベントサイトの具体的な検索URL
・マインドフルネス、ヨガ、栄養学、運動療法のクラス
・Peatix/Eventbrite/connpass/ストアカで検索するためのキーワード
・具体的な検索URL例を提示

■ 3. 患者会・コミュニティ
・疾患別の患者支援団体、オンラインコミュニティ
・参加方法、費用、次回の集まり
・同じ疾患を持つ人とつながる具体的な方法

■ 4. 今日できるセルフケア
・今日の天気/曜日/季節に合わせた具体的な養生法
・新しい食事法、入浴法、呼吸法、運動法の提案
・初めて試すことを1つ含める

■ 5. 新しい治療・アプローチ
・最近注目されている治療法や臨床試験
・海外で成果が出ている代替療法
・日本で受けられる最新の統合医療

各提案は以下の形式で出力：
【カテゴリ】タイトル
説明（2-3行）
アクション：具体的な次のステップ
URL/連絡先：（あれば）`;

    try {
      const response = await aiEngine.callModel(store.get('selectedModel'), prompt, { maxTokens: 3000 });
      if (typeof response === 'string' && response.length > 100) {
        const html = `<div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(response)}</div>`;
        container.innerHTML = html;
        store.set('cachedActions', { html, fetchedAt: Date.now() });
      } else {
        container.innerHTML = this.generateLocalActionRecs();
      }
    } catch (err) {
      console.warn('[Action Recs] API failed:', err.message);
      container.innerHTML = this.generateLocalActionRecs();
    }
  }

  generateLocalActionRecs() {
    const diseases = store.get('selectedDiseases') || [];
    const profile = store.get('userProfile') || {};
    const location = profile.location || '関東';
    const day = new Date().getDay();
    const tips = [
      '朝日を浴びて体内時計をリセット。15分の散歩から始めてみましょう。',
      '発酵食品（味噌汁、納豆、ぬか漬け）を1品追加して腸内環境を改善。',
      'エプソムソルト入浴（38°C, 20分）で自律神経を整えてみましょう。',
      '4-7-8呼吸法（吸う4秒→止める7秒→吐く8秒）を3セット試してみてください。',
      'デジタルデトックス：今日1時間だけスマホを手放してみましょう。',
      '感謝日記：今日良かったことを3つ書いてみてください。',
      '緑茶やほうじ茶でカフェインを控えめに。L-テアニンでリラックス。',
    ];

    // Detect region from location
    const lang = profile.language || 'ja';
    const loc = (profile.location || '').toLowerCase();
    const isJapan = lang === 'ja' || /日本|tokyo|osaka|神奈川|東京|秦野/.test(loc);
    const isUS = /us|usa|america|new york|california|texas/.test(loc);
    const isUK = /uk|england|london|manchester/.test(loc);
    const isEU = /germany|france|spain|italy|deutschland|paris|berlin/.test(loc);
    const isAU = /australia|sydney|melbourne/.test(loc);
    const isKR = lang === 'ko' || /korea|seoul|부산/.test(loc);

    // Region-specific event platform
    const eventBase = isUS ? 'https://www.eventbrite.com/d/online/' :
      isUK ? 'https://www.eventbrite.co.uk/d/online/' :
      isAU ? 'https://www.eventbrite.com.au/d/online/' :
      isKR ? 'https://www.meetup.com/find/?keywords=' :
      isEU ? 'https://www.eventbrite.com/d/online/' :
      'https://peatix.com/search?q=';

    const clinicBase = isUS ? 'https://www.zocdoc.com/search?dr_specialty=' :
      isUK ? 'https://www.nhs.uk/service-search/find-a-service?q=' :
      isAU ? 'https://www.hotdoc.com.au/search?q=' :
      'https://byoinnavi.jp/search?q=';

    const searchLinks = [];
    // Disease-specific searches
    const diseaseSearchTerms = {
      mecfs: { ja: 'ME/CFS 慢性疲労', en: 'ME CFS chronic fatigue' },
      depression: { ja: 'うつ病 回復', en: 'depression recovery support' },
      fibromyalgia: { ja: '線維筋痛症', en: 'fibromyalgia support' },
      long_covid: { ja: 'Long COVID 後遺症', en: 'long covid support' },
      bipolar: { ja: '双極性障害 当事者会', en: 'bipolar support group' },
      ptsd: { ja: 'PTSD トラウマ', en: 'PTSD trauma support' },
      adhd: { ja: 'ADHD 大人の発達障害', en: 'adult ADHD support' },
    };
    diseases.forEach(d => {
      const terms = diseaseSearchTerms[d];
      if (terms) {
        const q = isJapan ? terms.ja : terms.en;
        searchLinks.push({ label: q, url: eventBase + encodeURIComponent(q) });
      }
    });

    // Common wellness searches
    const wellnessTerms = isJapan
      ? [{ l: 'マインドフルネス', q: 'マインドフルネス ' + location }, { l: 'ヨガ教室', q: 'ヨガ 初心者 ' + location }, { l: '栄養セミナー', q: '栄養 健康 セミナー' }]
      : [{ l: 'Mindfulness', q: 'mindfulness meditation' }, { l: 'Yoga class', q: 'yoga beginner' }, { l: 'Nutrition', q: 'nutrition wellness' }];
    wellnessTerms.forEach(w => searchLinks.push({ label: w.l, url: eventBase + encodeURIComponent(w.q) }));

    // Clinic search
    const clinicTerms = isJapan ? '慢性疲労 専門' : 'chronic fatigue specialist';
    searchLinks.push({ label: isJapan ? '専門クリニックを探す' : 'Find specialist', url: clinicBase + encodeURIComponent(clinicTerms) });

    return `
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;margin-bottom:8px">今日の養生ヒント</div>
        <div style="padding:10px 14px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:12px;line-height:1.7">${tips[day]}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;margin-bottom:8px">ワークショップ・イベントを探す</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${searchLinks.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline" style="font-size:11px">${l.label}</a>`).join('')}
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-muted)">管理者がAPIキーを設定すると、あなたの疾患・地域に特化したクリニックやイベントの提案が自動生成されます。</div>`;
  }

  async loadDashResearch() {
    const container = document.getElementById('dash-research');
    if (!container) return;

    // Check cache: only fetch once per day
    const cached = store.get('cachedResearch');
    const now = Date.now();
    if (cached && cached.articles && (now - cached.fetchedAt) < 24 * 60 * 60 * 1000) {
      this.renderDashResearch(container, cached.articles);
      return;
    }

    container.innerHTML = Components.loading('最新論文を検索中...');

    // Build search query from user's diseases
    const diseases = store.get('selectedDiseases') || [];
    const diseaseTerms = {
      mecfs: 'ME/CFS OR myalgic encephalomyelitis OR chronic fatigue syndrome',
      depression: 'major depressive disorder treatment',
      bipolar: 'bipolar disorder treatment',
      ptsd: 'PTSD treatment',
      adhd: 'ADHD treatment',
      long_covid: 'long COVID OR post-COVID',
      fibromyalgia: 'fibromyalgia treatment',
      hashimoto: 'Hashimoto thyroiditis',
      diabetes_t2: 'type 2 diabetes treatment',
      sle: 'systemic lupus erythematosus',
      ibs: 'irritable bowel syndrome treatment',
      pots: 'postural orthostatic tachycardia',
      insomnia: 'insomnia treatment',
    };
    const terms = diseases.map(d => diseaseTerms[d]).filter(Boolean);
    const query = terms.length > 0 ? `(${terms.join(' OR ')})` : 'chronic disease management';

    try {
      let articles = await aiEngine.searchPubMed(query + ' AND ("last 7 days"[dp])', 5);
      if (articles.length === 0) {
        articles = await aiEngine.searchPubMed(query + ' AND ("last 30 days"[dp])', 5);
      }
      if (articles.length === 0) {
        articles = await aiEngine.searchPubMed(query, 5);
      }
      if (articles.length === 0) {
        container.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:10px">該当する最新論文が見つかりませんでした。</p>';
        return;
      }
      // Cache results
      store.set('cachedResearch', { articles, fetchedAt: Date.now() });
      this.renderDashResearch(container, articles);
    } catch (err) {
      container.innerHTML = `<p style="font-size:12px;color:var(--text-muted);padding:10px">論文検索中にエラーが発生しました</p>`;
    }
  }

  renderDashResearch(container, articles) {
    container.innerHTML = articles.map(a => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:600;line-height:1.4;margin-bottom:4px">${a.title}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${(a.authors||'').substring(0,60)} — ${a.journal} (${a.date})</div>
        <div style="display:flex;gap:6px">
          <a href="${a.translateUrl || a.url}" target="_blank" rel="noopener" style="font-size:10px;color:var(--accent)">日本語で読む</a>
          <a href="${a.url}" target="_blank" rel="noopener" style="font-size:10px;color:var(--text-muted)">PubMed</a>
        </div>
      </div>
    `).join('') + `<div style="padding:8px 0"><button class="btn btn-outline btn-sm" onclick="app.navigate('research')" style="font-size:11px">もっと見る</button></div>`;
  }

  async searchPubMedLive() {
    const query = document.getElementById('pubmed-search-query')?.value || 'ME/CFS';
    const days = parseInt(document.getElementById('pubmed-search-days')?.value || '30');
    const resultsArea = document.getElementById('pubmed-results');
    if (!resultsArea) return;

    resultsArea.innerHTML = Components.loading('PubMedを検索中...');

    // Add date filter
    const dateFilter = `AND ("last ${days} days"[dp])`;
    const fullQuery = query + dateFilter;

    try {
      const articles = await aiEngine.searchPubMed(fullQuery, 20);

      if (articles.length === 0) {
        resultsArea.innerHTML = Components.emptyState('🔬', '該当する論文が見つかりませんでした', '検索期間を広げるか、キーワードを変更してみてください。');
        return;
      }

      resultsArea.innerHTML = `
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">PubMed検索結果（${articles.length}件）</h3>
        ${articles.map(a => `
          <div class="card" style="margin-bottom:12px">
            <div class="card-body" style="padding:16px 20px">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <span class="tag tag-info">PMID: ${a.pmid}</span>
                <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${a.date}</span>
              </div>
              <h4 style="font-size:14px;font-weight:600;margin-bottom:6px;line-height:1.5">${a.title}</h4>
              <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${a.authors.substring(0, 100)}${a.authors.length > 100 ? '...' : ''} — ${a.journal}</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <a href="${a.url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">PubMed（英語）</a>
                <a href="${a.translateUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">日本語で読む</a>
                ${a.doiUrl ? `<a href="${a.doiUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary">論文全文（DOI）</a>` : ''}
                ${a.doiTranslateUrl ? `<a href="${a.doiTranslateUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">論文全文（日本語）</a>` : ''}
              </div>
            </div>
          </div>
        `).join('')}`;

      Components.showToast(`${articles.length}件の論文が見つかりました`, 'success');
    } catch (err) {
      resultsArea.innerHTML = `<div style="color:var(--danger);padding:20px">PubMed検索エラー: ${err.message}</div>`;
      Components.showToast('PubMed検索に失敗しました', 'error');
    }
  }

  loadLatestAnalysis() {
    const latest = store.get('latestAnalysis');
    const resultArea = document.getElementById('analysis-result');
    if (latest && resultArea) {
      this.renderAnalysisResult(latest, resultArea);
    }
  }

  renderAnalysisResult(analysis, container) {
    const p = analysis.parsed || analysis.result;
    if (typeof p === 'string') {
      container.innerHTML = `<div style="white-space:pre-wrap;font-size:13px;line-height:1.8">${Components.formatMarkdown(p)}</div>`;
      return;
    }

    let html = '';
    // Summary
    if (p.summary) {
      html += `<div class="card" style="margin-bottom:20px"><div class="card-body">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:10px">分析サマリー</h3>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8">${p.summary}</p>
      </div></div>`;
    }

    // Risk Alerts
    if (p.riskAlerts?.length) {
      html += '<div style="margin-bottom:20px">';
      p.riskAlerts.forEach(a => {
        const c = a.level === 'warning' ? 'var(--warning)' : 'var(--info)';
        html += `<div style="padding:12px 16px;background:${c}15;border-left:3px solid ${c};border-radius:0 8px 8px 0;margin-bottom:8px;font-size:13px;color:var(--text-primary)">${a.message}</div>`;
      });
      html += '</div>';
    }

    // Trends
    if (p.trends) {
      html += '<div class="grid grid-4" style="margin-bottom:20px">';
      const trendLabels = { fatigue: '疲労', pain: '痛み', sleep: '睡眠', cognitive: '認知機能' };
      const trendIcons = { fatigue: '😴', pain: '💢', sleep: '🌙', cognitive: '🧠' };
      Object.entries(p.trends).forEach(([k, v]) => {
        const dir = v.direction === 'improving' ? '改善↑' : v.direction === 'declining' ? '悪化↓' : '安定→';
        const cls = v.direction === 'improving' ? 'positive' : v.direction === 'declining' ? 'negative' : '';
        html += Components.statCard(trendLabels[k] || k, `${trendIcons[k] || ''} ${dir}`, v.change ? v.change * 100 : 0);
      });
      html += '</div>';
    }

    // Recommendations
    if (p.recommendations?.length) {
      html += '<h3 style="font-size:16px;font-weight:600;margin:24px 0 14px">推奨アクション</h3>';
      p.recommendations.forEach(r => { html += Components.recommendationCard(r); });
    }

    // Research
    if (p.researchUpdates?.length) {
      html += '<h3 style="font-size:16px;font-weight:600;margin:24px 0 14px">最新研究</h3>';
      p.researchUpdates.forEach(r => { html += Components.researchCard(r); });
    }

    container.innerHTML = html;
  }

  // ---- Chat ----
  async sendChat() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const msg = input.value.trim();
    input.value = '';

    const history = store.get('conversationHistory') || [];
    history.push({ role: 'user', content: msg, timestamp: new Date().toISOString() });
    store.set('conversationHistory', history);
    this.renderChatMessages();

    // Generate response
    try {
      const apiKey = aiEngine.getApiKey(store.get('selectedModel'));
      let responseText;

      // ALL responses via API prompt
      const result = await this.analyzeViaAPI(msg, 'text_analysis');
      if (result._raw) {
        responseText = result._raw;
      } else if (result.findings) {
        responseText = (result.summary ? result.summary + '\n\n' : '') + result.findings;
        if (result.actions?.length) responseText += '\n\n推奨アクション:\n' + result.actions.map(a => '→ ' + a).join('\n');
      } else {
        if (advice.actions.length > 0) {
          responseText += '\n\n📋 推奨アクション:\n' + advice.actions.map(a => '→ ' + a).join('\n');
        }
      }

      history.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
      store.set('conversationHistory', history);
      this.renderChatMessages();
    } catch (err) {
      history.push({ role: 'assistant', content: 'すみません、応答の生成中にエラーが発生しました。もう一度お試しください。\n\nエラー: ' + err.message, timestamp: new Date().toISOString() });
      store.set('conversationHistory', history);
      this.renderChatMessages();
    }
  }

  renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const history = store.get('conversationHistory') || [];
    container.innerHTML = history.map(m => Components.chatMessage(m)).join('');
    container.scrollTop = container.scrollHeight;
  }

  // ---- Integrations ----
  importPlaudTranscript() {
    const text = document.getElementById('plaud-transcript')?.value?.trim();
    const title = document.getElementById('plaud-title')?.value?.trim() || 'Plaud会話記録';
    const date = document.getElementById('plaud-date')?.value;

    if (!text) { Components.showToast('テキストを入力してください', 'error'); return; }

    const parsed = Integrations.plaud.parseTranscript(text);
    Integrations.plaud.saveTranscript(parsed, { title, date: date ? new Date(date + 'T12:00:00').toISOString() : undefined });

    document.getElementById('plaud-transcript').value = '';
    document.getElementById('plaud-title').value = '';

    Components.showToast(`会話記録を取り込みました（${parsed.entries.length}発言, ${parsed.wordCount}語）`, 'success');

    // Navigate to dashboard and run API analysis
    this.navigate('dashboard');

    // ALL analysis via API
    setTimeout(() => {
      this.analyzeViaAPI('[会話データ] ' + title + '\n' + text, 'conversation_analysis').then(result => {
        store.set('latestFeedback', result);
        // Save AI comment for the Plaud entry
        const plaudEntries = (store.get('textEntries') || []).filter(e => e.type === 'plaud_transcript');
        const lastPlaud = plaudEntries[plaudEntries.length - 1];
        if (lastPlaud) this.saveAIComment(lastPlaud.id, result);
        const el = document.getElementById('dash-ai-feedback');
        if (el) el.innerHTML = this.renderAnalysisCard(result);
      });
    }, 500);
  }

  connectFitbit() {
    const clientId = document.getElementById('fitbit-client-id')?.value?.trim();
    if (!clientId) { Components.showToast('Client IDを入力してください', 'error'); return; }
    localStorage.setItem('fitbit_client_id', clientId);
    Integrations.fitbit.connect();
  }

  async importFitbitToday() {
    const status = document.getElementById('fitbit-import-status');
    if (status) status.innerHTML = Components.loading('Fitbitからデータを取得中...');
    try {
      await Integrations.fitbit.importToday();
      if (status) status.innerHTML = '<div style="color:var(--success);font-size:13px;padding:10px">今日のデータを取り込みました</div>';
    } catch (err) {
      if (status) status.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px">エラー: ${err.message}</div>`;
    }
  }

  async importFitbitHistory() {
    const status = document.getElementById('fitbit-import-status');
    if (status) status.innerHTML = Components.loading('Fitbitから過去7日分を取得中...');
    try {
      await Integrations.fitbit.importHistory(7);
      if (status) status.innerHTML = '<div style="color:var(--success);font-size:13px;padding:10px">過去7日分のデータを取り込みました</div>';
    } catch (err) {
      if (status) status.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px">エラー: ${err.message}</div>`;
    }
  }

  async importAppleHealthFile(file) {
    if (!file) return;
    const status = document.getElementById('apple-import-status');
    if (status) status.innerHTML = Components.loading('Apple Healthデータを解析中...');
    try {
      const count = await Integrations.importFile(file);
      if (status) status.innerHTML = `<div style="color:var(--success);font-size:13px;padding:10px">${count}件のデータを取り込みました</div>`;
    } catch (err) {
      if (status) status.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px">エラー: ${err.message}</div>`;
    }
  }

  // ---- Theme ----
  // ---- Dynamic Recommendations ----
  generateDynamicRecommendations() {
    const textEntries = store.get('textEntries') || [];
    const allText = textEntries.map(e => e.content || '').join('\n').toLowerCase();
    const diseases = store.get('selectedDiseases') || [];
    const profile = store.get('userProfile') || {};
    const score = store.get('healthScore') || 50;

    // All possible items with relevance scoring
    const items = [
      { id: 'coq10', icon: '💊', name: 'CoQ10（ユビキノール）', desc: 'ミトコンドリアサポート', store: 'iherb', url: 'https://www.iherb.com/search?kw=coq10+ubiquinol&rcode=CHRONICCARE',
        relevance: (allText.includes('倦怠') || allText.includes('疲') || diseases.includes('mecfs') ? 10 : 3) },
      { id: 'magnesium', icon: '✨', name: 'マグネシウム', desc: '筋弛緩・睡眠改善', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=%E3%83%9E%E3%82%B0%E3%83%8D%E3%82%B7%E3%82%A6%E3%83%A0+%E3%82%B0%E3%83%AA%E3%82%B7%E3%83%8D%E3%83%BC%E3%83%88&tag=chroniccare-22',
        relevance: (allText.includes('痛') || allText.includes('眠') || allText.includes('筋肉') ? 10 : 4) },
      { id: 'vitd', icon: '☀️', name: 'ビタミンD3+K2', desc: '免疫・骨代謝', store: 'iherb', url: 'https://www.iherb.com/search?kw=vitamin+d3+k2&rcode=CHRONICCARE',
        relevance: (diseases.some(d => ['sle','ra','hashimoto','osteoporosis'].includes(d)) ? 10 : allText.includes('免疫') ? 8 : 3) },
      { id: 'omega3', icon: '🐟', name: 'オメガ3（EPA/DHA）', desc: '抗炎症・脳機能', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=オメガ3+EPA+DHA&tag=chroniccare-22',
        relevance: (allText.includes('炎症') || allText.includes('頭') || diseases.includes('depression') ? 9 : 4) },
      { id: 'epsom', icon: '🛁', name: 'エプソムソルト', desc: '入浴療法・Mg吸収', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=エプソムソルト&tag=chroniccare-22',
        relevance: (allText.includes('エプソム') || allText.includes('風呂') || allText.includes('入浴') ? 10 : 3) },
      { id: 'nmn', icon: '🧬', name: 'NMN', desc: 'NAD+・細胞修復', store: 'iherb', url: 'https://www.iherb.com/search?kw=NMN+supplement&rcode=CHRONICCARE',
        relevance: (allText.includes('nmn') || allText.includes('老化') || diseases.includes('mecfs') ? 9 : 2) },
      { id: 'melatonin', icon: '🌙', name: 'メラトニン（低用量）', desc: '睡眠リズム調整', store: 'iherb', url: 'https://www.iherb.com/search?kw=melatonin+0.5mg&rcode=CHRONICCARE',
        relevance: (allText.includes('不眠') || allText.includes('眠れ') || diseases.includes('insomnia') ? 10 : 2) },
      { id: 'probiotics', icon: '🦠', name: 'プロバイオティクス', desc: '腸内環境改善', store: 'iherb', url: 'https://www.iherb.com/search?kw=probiotics+lactobacillus&rcode=CHRONICCARE',
        relevance: (allText.includes('腸') || allText.includes('お腹') || diseases.includes('ibs') || diseases.includes('crohns') ? 10 : 3) },
      { id: 'bcomplex', icon: '⚡', name: 'ビタミンB群', desc: 'エネルギー代謝・神経', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=ビタミンB群+コンプレックス&tag=chroniccare-22',
        relevance: (allText.includes('ビタミンb') || allText.includes('エネルギー') || diseases.includes('mecfs') ? 8 : 3) },
      { id: 'ltheanine', icon: '🍵', name: 'L-テアニン', desc: 'リラックス・集中', store: 'iherb', url: 'https://www.iherb.com/search?kw=l-theanine&rcode=CHRONICCARE',
        relevance: (allText.includes('不安') || allText.includes('ストレス') || diseases.includes('gad') || diseases.includes('adhd') ? 9 : 2) },
      { id: 'creatine', icon: '💪', name: 'クレアチン', desc: '筋力・脳エネルギー', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=クレアチン+モノハイドレート&tag=chroniccare-22',
        relevance: (allText.includes('クレアチン') || allText.includes('筋') || diseases.includes('mecfs') ? 8 : 2) },
      { id: 'ashwagandha', icon: '🌿', name: 'アシュワガンダ', desc: '副腎サポート・ストレス', store: 'iherb', url: 'https://www.iherb.com/search?kw=ashwagandha+ksm66&rcode=CHRONICCARE',
        relevance: (allText.includes('アシュワガンダ') || allText.includes('副腎') || allText.includes('ストレス') ? 9 : 2) },
      { id: 'curcumin', icon: '🟡', name: 'クルクミン', desc: '抗炎症・関節サポート', store: 'iherb', url: 'https://www.iherb.com/search?kw=curcumin+bcm95&rcode=CHRONICCARE',
        relevance: (allText.includes('炎症') || allText.includes('関節') || diseases.includes('ra') || diseases.includes('fibromyalgia') ? 9 : 2) },
      { id: 'zinc', icon: '🔩', name: '亜鉛', desc: '免疫・ホルモン', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=亜鉛+サプリメント&tag=chroniccare-22',
        relevance: (allText.includes('亜鉛') || allText.includes('免疫') || allText.includes('性欲') ? 8 : 3) },
      { id: 'pea', icon: '🧪', name: 'PEA（パルミトイルエタノールアミド）', desc: '神経障害性疼痛', store: 'iherb', url: 'https://www.iherb.com/search?kw=palmitoylethanolamide+PEA&rcode=CHRONICCARE',
        relevance: (allText.includes('疼痛') || allText.includes('神経痛') || diseases.includes('fibromyalgia') ? 10 : 1) },
      { id: 'oura', icon: '⌚', name: 'Oura Ring（HRVモニター）', desc: '自律神経・睡眠トラッキング', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=oura+ring&tag=chroniccare-22',
        relevance: (allText.includes('hrv') || allText.includes('ペーシング') || diseases.includes('pots') || diseases.includes('mecfs') ? 8 : 2) },
      { id: 'gut_test', icon: '🔬', name: '腸内フローラ検査キット', desc: '腸内細菌叢の分析', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=腸内フローラ+検査キット&tag=chroniccare-22',
        relevance: (allText.includes('腸') || diseases.includes('ibs') || diseases.includes('crohns') ? 9 : 2) },
      { id: 'gene_test', icon: '🧬', name: '遺伝子検査キット', desc: '疾患リスク・薬剤代謝', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=遺伝子検査キット&tag=chroniccare-22',
        relevance: (allText.includes('遺伝') ? 8 : 1) },
      // Japanese products
      { id: 'kampo_hochu', icon: '🌿', name: '補中益気湯（漢方）', desc: '疲労・免疫低下・食欲不振', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=補中益気湯+ツムラ&tag=chroniccare-22',
        relevance: (allText.match(/倦怠|疲|だるい|食欲/) ? 9 : diseases.includes('mecfs') ? 6 : 2) },
      { id: 'kampo_goreisan', icon: '🌿', name: '五苓散（漢方）', desc: '気象病・頭痛・むくみ', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=五苓散+ツムラ&tag=chroniccare-22',
        relevance: (allText.match(/気圧|天候|頭痛|むくみ/) ? 10 : 2) },
      { id: 'kampo_kamishoyosan', icon: '🌿', name: '加味逍遙散（漢方）', desc: '更年期・イライラ・不眠', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=加味逍遙散+クラシエ&tag=chroniccare-22',
        relevance: (allText.match(/更年期|イライラ|のぼせ|不眠/) ? 9 : profile.gender === 'female' ? 4 : 1) },
      { id: 'ala5', icon: '✨', name: '5-ALA（アミノレブリン酸）', desc: 'ミトコンドリア活性・日本発', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=5-ALA+サプリ&tag=chroniccare-22',
        relevance: (allText.match(/ミトコンドリア|5-ala|エネルギー/) ? 9 : diseases.includes('mecfs') ? 6 : 2) },
      { id: 'hydrogen', icon: '💧', name: '水素水生成器', desc: '抗酸化・日本発テクノロジー', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=水素水+生成器&tag=chroniccare-22',
        relevance: (allText.match(/水素|酸化|抗酸化/) ? 8 : 1) },
      { id: 'omron_bp', icon: '🩺', name: 'OMRON 血圧計', desc: '日本精密機器・家庭測定', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=オムロン+血圧計&tag=chroniccare-22',
        relevance: (allText.match(/血圧|高血圧/) ? 9 : diseases.includes('hypertension') ? 7 : 1) },
      { id: 'tanita_scale', icon: '⚖️', name: 'TANITA 体組成計', desc: '日本精密機器・体脂肪率', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=タニタ+体組成計&tag=chroniccare-22',
        relevance: (allText.match(/体重|体脂肪|肥満|ダイエット/) ? 8 : diseases.includes('metabolic_syndrome') ? 6 : 1) },
      { id: 'miso', icon: '🫘', name: '有機味噌（発酵食品）', desc: '腸内環境・免疫・日本の智慧', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=有機+味噌+無添加&tag=chroniccare-22',
        relevance: (allText.match(/腸|発酵|免疫|食事/) ? 7 : 2) },
      { id: 'amazake', icon: '🍶', name: '甘酒（飲む点滴）', desc: '発酵・栄養補給・日本伝統', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=甘酒+米麹+無添加&tag=chroniccare-22',
        relevance: (allText.match(/栄養|疲労|発酵|甘酒/) ? 7 : 2) },
      { id: 'epsom_jp', icon: '♨️', name: 'エプソムソルト（国産）', desc: '入浴・Mg吸収・日本品質', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=エプソムソルト+国産&tag=chroniccare-22',
        relevance: (allText.match(/風呂|入浴|エプソム|マグネシウム/) ? 9 : 3) },
      { id: 'shinrinyoku', icon: '🌲', name: '森林浴ガイドブック', desc: 'Shinrin-yoku・日本発セラピー', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=森林浴+ガイド&tag=chroniccare-22',
        relevance: (allText.match(/自然|森|散歩|リラックス/) ? 6 : 1) },
      { id: 'evening_primrose', icon: '🌸', name: '月見草オイル', desc: 'PMS・ホルモンバランス', store: 'iherb', url: 'https://www.iherb.com/search?kw=evening+primrose+oil&rcode=CHRONICCARE',
        relevance: (allText.match(/生理|月経|pms|ホルモン|更年期/) ? 10 : profile.gender === 'female' ? 4 : 0) },
      { id: 'equol', icon: '🫘', name: 'エクオール', desc: '更年期・女性ホルモン', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=エクオール+サプリ&tag=chroniccare-22',
        relevance: (allText.match(/更年期|ホットフラッシュ|のぼせ/) ? 10 : profile.gender === 'female' && parseInt(profile.age) >= 40 ? 5 : 0) },
      { id: 'iron', icon: '🩸', name: '鉄分（ヘム鉄）', desc: '貧血・疲労対策', store: 'iherb', url: 'https://www.iherb.com/search?kw=heme+iron&rcode=CHRONICCARE',
        relevance: (allText.match(/貧血|鉄|フェリチン|めまい|立ちくらみ/) ? 10 : profile.gender === 'female' ? 4 : 1) },
      { id: 'ginger', icon: '🫚', name: 'ジンジャーサプリ', desc: '吐き気・消化・抗炎症', store: 'iherb', url: 'https://www.iherb.com/search?kw=ginger+extract&rcode=CHRONICCARE',
        relevance: (allText.match(/吐き気|嘔吐|気持ち悪|消化|胃/) ? 9 : 1) },
      { id: 'psyllium', icon: '🌾', name: 'サイリウムハスク', desc: '食物繊維・腸内環境', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=サイリウムハスク&tag=chroniccare-22',
        relevance: (allText.match(/便秘|腸|食物繊維/) ? 9 : diseases.includes('ibs') ? 6 : 1) },
      { id: 'headache_app', icon: '📱', name: '頭痛ーる（アプリ）', desc: '気圧予報・頭痛予防', store: 'amazon', url: 'https://zutool.jp/',
        relevance: (allText.match(/頭痛|偏頭痛|片頭痛|気圧/) ? 10 : 1) },
      { id: 'feverfew', icon: '🌼', name: 'フィーバーフュー', desc: '片頭痛予防ハーブ', store: 'iherb', url: 'https://www.iherb.com/search?kw=feverfew&rcode=CHRONICCARE',
        relevance: (allText.match(/頭痛|偏頭痛|片頭痛/) ? 9 : 0) },
    ];

    // Add recency bonus: if mentioned in last 3 entries, boost relevance
    const recentText = textEntries.slice(-3).map(e => (e.content || '').toLowerCase()).join('\n');
    items.forEach(item => {
      const keywords = item.name.toLowerCase().split(/[（）/・]+/).filter(k => k.length > 1);
      if (keywords.some(k => recentText.includes(k))) item.relevance += 5;
    });

    // Low health score boosts energy/recovery items
    if (score < 40) {
      items.find(i => i.id === 'coq10').relevance += 3;
      items.find(i => i.id === 'bcomplex').relevance += 3;
      items.find(i => i.id === 'magnesium').relevance += 2;
    }

    // Sort by relevance and pick top 6
    items.sort((a, b) => b.relevance - a.relevance);
    return items.slice(0, 6);
  }

  // ---- Timeline ----
  filterTimeline(type) {
    // Re-render with filter
    const content = document.getElementById('timeline-content');
    if (!content) return;

    const items = content.querySelectorAll('.card, [style*="bg-tertiary"]');
    // Simple approach: re-navigate to refresh, store filter
    store.set('_timelineFilter', type);
    this.navigate('timeline');
  }

  // Generate quick AI insight for timeline entries
  generateQuickInsight(text) {
    if (!text || text.length < 10) return '';
    const lower = text.toLowerCase();

    // Pattern-based quick insights
    if (/pem|労作後|倦怠感がひどい|動けな/.test(lower)) return 'PEMの兆候。24-48時間の安静を推奨。活動量の見直しが必要です。';
    if (/疼痛|痛[いみ]|頭痛/.test(lower)) return '疼痛記録。痛みの時間帯・トリガーのパターンを追跡中。';
    if (/頭痛|偏頭痛|片頭痛/.test(lower)) return '頭痛パターンを追跡中。頻度・トリガー（気圧/食事/ストレス/生理周期）の記録が予防に繋がります。';
    if (/生理|月経|pms|ホルモン/.test(lower)) return '月経・ホルモン周期を追跡中。体調との相関分析で症状予防が可能になります。';
    if (/更年期|ホットフラッシュ/.test(lower)) return '更年期症状の記録。エクオール・漢方・HRT等の選択肢を主治医と相談してください。';
    if (/お腹|下痢|便秘|吐き気|胃/.test(lower)) return '消化器症状を追跡中。食事内容との相関が見えてくると改善策が明確に。';
    if (/めまい|ふらつき|立ちくらみ/.test(lower)) return 'めまいの記録。水分・塩分摂取量と起立時の状況を合わせて記録すると診断の助けに。';
    if (/肌荒れ|かゆ|湿疹|アトピー/.test(lower)) return '皮膚症状を記録中。食事・ストレス・環境との相関を分析しています。';
    if (/息苦し|呼吸|胸が/.test(lower)) return '呼吸器症状の記録。腹式呼吸の練習と姿勢改善が基本的な対策です。';
    if (/だるい|倦怠|疲れ/.test(lower)) return '疲労の記録。鉄・ビタミンB12・甲状腺機能の検査を検討してください。';
    if (/鬱|孤独|辛|死|ネガティ|絶望/.test(lower)) return '精神面のケアが重要です。信頼できる方への連絡を検討してください。';
    if (/眠[れり]|不眠|寝[れた]/.test(lower)) return '睡眠パターンを追跡中。睡眠衛生の見直しで改善の可能性があります。';
    if (/先生|診察|クリニック|病院/.test(lower)) return '医療記録。次回診察に向けてこの記録を共有することを推奨。';
    if (/ツートラム|リンデロン|エチゾラム|ステロイド|プレドニゾ/.test(lower)) return '服薬メモ。効果と副作用を追跡しています。';
    if (/コエンザイム|nmn|ビタミン|マグネシウム|サプリ/.test(lower)) return 'サプリメント記録。効果評価のため2-4週間の継続観察を。';
    if (/良[いか]|楽|元気|調子が良|できた|回復/.test(lower)) return '改善傾向。何が効果的だったか分析し、再現性を高めましょう。';
    if (/エプソムソルト|風呂|入浴/.test(lower)) return '入浴療法の記録。マグネシウム吸収と自律神経調整の効果を追跡。';
    if (/瞑想|呼吸法|ヨガ/.test(lower)) return '迷走神経トーニング効果を記録中。継続が自律神経改善の鍵です。';
    if (/気圧|天候|天気/.test(lower)) return '気象感受性を記録。気圧変動と症状の相関を分析しています。';
    if (/ジム|運動|散歩|ストレッチ/.test(lower)) return '活動記録。翌日のPEM有無を確認し、安全な活動量を学習中。';
    if (/食[べ事]|ご飯|料理/.test(lower)) return '食事記録。栄養バランスと体調の相関を分析中。';

    // Generic insight based on text length
    if (text.length > 200) return '詳細な記録です。AI分析でより深い洞察を得られます。';
    if (text.length > 50) return '記録を継続中。パターン分析の精度が向上しています。';
    return '';
  }

  // ============================================================
  // Unified API Analysis - ALL advice comes from prompts, not JS
  // ============================================================

  // Main entry point: analyze any user input via API
  async analyzeViaAPI(input, type, options = {}) {
    const apiKey = aiEngine.getApiKey(store.get('selectedModel'));

    // Select prompt template
    let promptTemplate = INLINE_PROMPTS[type] || INLINE_PROMPTS.text_analysis;
    let prompt = promptTemplate
      .replace(/\{\{INPUT\}\}/g, (input || '').substring(0, 8000))
      .replace(/\{\{SEED\}\}/g, Math.floor(Date.now() / 86400000).toString());

    // Interpolate standard variables
    prompt = aiEngine.interpolatePrompt(prompt, aiEngine.collectCurrentUserData());

    if (!apiKey) {
      // No API key - return minimal feedback
      return {
        summary: '記録を保存しました。',
        findings: 'APIキーを設定すると、詳細な分析結果が表示されます。\n管理パネル → APIキータブで設定してください。',
        actions: ['管理者にAPIキーの設定を依頼する'],
        products: [],
        _fromAPI: false
      };
    }

    try {
      const modelOptions = { maxTokens: 2048 };
      if (options.imageBase64) modelOptions.imageBase64 = options.imageBase64;
      if (type === 'image_analysis') {
        modelOptions.systemPrompt = '画像を詳細に分析し、慢性疾患患者の健康管理に役立つ情報を日本語で提供してください。必ずJSON形式で返してください。';
      }

      const response = await aiEngine.callModel(store.get('selectedModel'), prompt, modelOptions);

      // Try to parse JSON response
      try {
        // Extract JSON from response (may be wrapped in markdown code block)
        const jsonMatch = (response || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          parsed._fromAPI = true;
          parsed._raw = response;
          return parsed;
        }
      } catch (e) {
        // Not JSON - return as text
      }

      // Return raw text response
      return {
        summary: '',
        findings: response,
        actions: [],
        products: [],
        _fromAPI: true,
        _raw: response
      };
    } catch (err) {
      console.warn('[API Analysis] Failed:', err.message);
      return {
        summary: '記録を保存しました。',
        findings: '分析を実行できませんでした。しばらくしてからもう一度お試しください。',
        actions: [],
        products: [],
        _fromAPI: false
      };
    }
  }

  // Render API analysis result as HTML card
  renderAnalysisCard(result) {
    if (!result) return '';

    // If raw text (not JSON), render as formatted text
    if (result._raw && !result.summary && result.findings === result._raw) {
      return `
        <div class="card" style="border-left:4px solid var(--success);margin-bottom:12px">
          <div class="card-body" style="padding:14px 16px">
            <div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(result._raw)}</div>
          </div>
        </div>`;
    }

    const urgencyColor = result.urgency === 'urgent' ? 'var(--danger)' : result.urgency === 'attention' ? 'var(--warning)' : 'var(--accent)';

    let html = `<div class="card" style="border-left:4px solid ${urgencyColor};margin-bottom:12px">`;

    // Summary
    if (result.summary) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600">${result.summary}</div>`;
    }

    // Findings
    if (result.findings) {
      html += `<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(result.findings)}</div>
      </div>`;
    }

    // Details (for image analysis)
    if (result.details) {
      html += `<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(result.details)}</div>
      </div>`;
    }

    // Actions
    if (result.actions && result.actions.length > 0) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">推奨アクション</div>
        ${result.actions.map(a => `<div style="font-size:12px;margin-bottom:3px"><span style="color:var(--accent)">→</span> ${a}</div>`).join('')}
      </div>`;
    }

    // New approach (fresh suggestion user hasn't tried)
    if (result.new_approach) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border);background:linear-gradient(135deg, rgba(99,102,241,0.03), rgba(168,85,247,0.03))">
        <div style="font-size:11px;font-weight:600;color:#6366f1;margin-bottom:4px">✨ 新しい打ち手</div>
        <div style="font-size:12px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${Components.formatMarkdown(result.new_approach)}</div>
      </div>`;
    }

    // Trend analysis
    if (result.trend) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">📈 経過の変化</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${Components.formatMarkdown(result.trend)}</div>
      </div>`;
    }

    // Products
    if (result.products && result.products.length > 0) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px">おすすめ</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${result.products.map(p => `<a href="${p.url || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline" style="font-size:10px">${p.name}</a>`).join('')}
        </div>
      </div>`;
    }

    // Next check / tracking reminder
    if (result.next_check) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">📋 次にやること</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.7">${Components.formatMarkdown(result.next_check)}</div>
      </div>`;
    }

    // Monitoring metrics
    if (result.monitoring?.items?.length) {
      const statusIcons = { improving: '📈', stable: '➡️', declining: '📉', unknown: '❓' };
      const statusColors = { improving: 'var(--success)', stable: 'var(--text-muted)', declining: 'var(--danger)', unknown: 'var(--text-muted)' };
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted)">📊 定点観測</div>
          ${result.monitoring.overall_trend ? `<span style="font-size:10px;color:${result.monitoring.overall_trend.includes('改善') ? 'var(--success)' : result.monitoring.overall_trend.includes('注意') ? 'var(--danger)' : 'var(--text-muted)'}">${result.monitoring.overall_trend}</span>` : ''}
        </div>
        ${result.monitoring.items.slice(0, 6).map(m => `
          <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px">
            <span>${statusIcons[m.status] || '❓'}</span>
            <span style="flex:1;color:var(--text-secondary)">${m.metric}</span>
            <span style="font-weight:600;color:${statusColors[m.status] || 'var(--text-muted)'}">${m.current || '-'}</span>
            <span style="color:var(--text-muted);font-size:10px">目標:${m.target || '-'}</span>
          </div>
        `).join('')}
        ${result.monitoring.next_milestone ? `<div style="font-size:10px;color:var(--accent);margin-top:6px">🎯 ${result.monitoring.next_milestone}</div>` : ''}
      </div>`;
    }

    // Deeper prompt
    if (result.deeper_prompt) {
      html += `<div style="padding:8px 16px;background:var(--accent-bg);font-size:11px;color:var(--accent)">💡 ${result.deeper_prompt}</div>`;
    }

    html += '</div>';
    return html;
  }

  // Save AI analysis comment linked to a text entry
  saveAIComment(entryId, result) {
    const comments = store.get('aiComments') || {};
    comments[entryId] = {
      timestamp: new Date().toISOString(),
      result: result
    };
    store.set('aiComments', comments);
  }

  // Get AI comment for a specific entry
  getAIComment(entryId) {
    const comments = store.get('aiComments') || {};
    return comments[entryId] || null;
  }

  // Return URL as-is. Browser's built-in translation handles language.
  // Google Translate proxy breaks many modern sites (SPA, auth, etc.)
  translateUrl(url) {
    return url || '#';
  }

  // ---- Dashboard Quick Input ----
  dashQuickSubmit() {
    const input = document.getElementById('dash-quick-input');
    if (!input || !input.value.trim()) {
      Components.showToast('テキストを入力してください', 'error');
      return;
    }

    const content = input.value.trim();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      category: 'symptoms',
      type: 'text_entry',
      title: '',
      content: content
    };

    const textEntries = store.get('textEntries') || [];
    textEntries.push(entry);
    store.set('textEntries', textEntries);

    const history = store.get('conversationHistory') || [];
    history.push({ role: 'user', content: content, timestamp: entry.timestamp, type: 'data_entry' });
    store.set('conversationHistory', history);

    input.value = '';

    // Show loading state
    const feedback = document.getElementById('dash-ai-feedback');
    if (feedback) feedback.innerHTML = Components.loading('分析中...');

    // ALL analysis via API prompt - save result with the entry
    const entryId = entry.id;
    this.analyzeViaAPI(content, 'text_analysis').then(result => {
      store.set('latestFeedback', result);
      // Save AI comment with the entry
      this.saveAIComment(entryId, result);
      const el = document.getElementById('dash-ai-feedback');
      if (el) el.innerHTML = this.renderAnalysisCard(result);
    });

    // Re-render dashboard (keeps loading state visible)
    this.navigate('dashboard');
  }

  // Deep structured analysis of any user input
  dashQuickFile(event) {
    const files = event.target.files;
    if (!files.length) return;

    Components.showToast(`${files.length}件のファイルを処理中...`, 'info');

    Array.from(files).forEach(async (file) => {
      // Determine file category from type and name
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const fileName = file.name.toLowerCase();

      // Auto-categorize
      let category = 'その他';
      let analysisPrompt = '';
      if (isImage) {
        // Images are likely: food photos, test results, prescriptions, skin conditions
        category = '写真';
        analysisPrompt = `[写真アップロード] ${file.name}
これは画像ファイルです。以下の可能性があります：

【食事写真の場合】
・写真に写っている料理の推定カロリー、栄養バランス（タンパク質/脂質/炭水化物）を分析
・慢性疾患との関連（抗炎症食か、血糖値への影響、腸内環境への影響）
・改善提案（不足している栄養素、追加すべき食材）
・この食事の良い点と注意点

【検査結果写真の場合】
・数値を読み取り、基準値との比較
・異常値があれば具体的なアクション提案

【処方箋/お薬手帳の場合】
・薬の飲み合わせチェック
・副作用の注意点

写真の内容に応じて適切な分析を提供してください。`;
      } else if (isPDF || fileName.includes('検査') || fileName.includes('test') || fileName.includes('result')) {
        category = '検査結果';
        analysisPrompt = `[検査結果ファイル] ${file.name} - 検査データの分析と基準値比較、要注意項目の指摘をしてください。`;
      } else {
        analysisPrompt = `[ファイル] ${file.name} (${file.type}) - このファイルの内容を分析してください。`;
      }

      // Save file
      const reader = new FileReader();
      reader.onload = (ev) => {
        store.addHealthData('photos', {
          filename: file.name, type: file.type, size: file.size,
          dataUrl: isImage ? ev.target.result.substring(0, 500) : '',
          category: category
        });

        // Save to text entries for timeline
        const textEntries = store.get('textEntries') || [];
        textEntries.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          timestamp: new Date().toISOString(),
          category: category,
          type: 'file_upload',
          title: `📎 ${file.name}`,
          content: `${category}をアップロードしました（${(file.size/1024).toFixed(0)}KB）`
        });
        store.set('textEntries', textEntries);

        // Add to conversation history
        const history = store.get('conversationHistory') || [];
        history.push({
          role: 'user', content: analysisPrompt,
          timestamp: new Date().toISOString(), type: 'file_upload'
        });
        store.set('conversationHistory', history);

        Components.showToast(`${file.name} を分析中...`, 'info');
        this.navigate('dashboard');

        // ALL analysis via API prompt
        const imgOpts = isImage ? { imageBase64: ev.target.result } : {};
        setTimeout(() => {
          this.analyzeViaAPI(
            `[ファイル: ${file.name}] ${category}`,
            isImage ? 'image_analysis' : 'text_analysis',
            imgOpts
          ).then(result => {
            store.set('latestFeedback', result);
            // Save AI comment linked to file entry
            const fileEntries = store.get('textEntries') || [];
            const lastFileEntry = fileEntries.filter(e => e.type === 'file_upload').pop();
            if (lastFileEntry) this.saveAIComment(lastFileEntry.id, result);
            const el = document.getElementById('dash-ai-feedback');
            if (el) el.innerHTML = this.renderAnalysisCard(result);
          });
        }, 500);
      };
      reader.readAsDataURL(file);
    });
  }

  // Image analysis using Vision API
  // File-specific deep analysis
  // ---- Data Page File Upload ----
  dataPageFileUpload(files) {
    if (!files || !files.length) return;
    const resultEl = document.getElementById('data-file-result');
    if (resultEl) resultEl.innerHTML = Components.loading('ファイルを分析中...');

    Array.from(files).forEach(async (file) => {
      const isImage = file.type.startsWith('image/');

      // Try auto-import for non-image files
      if (!isImage) {
        try {
          const count = await Integrations.importFile(file);
          if (count > 0) Components.showToast(`${file.name}: ${count}件のデータを取り込みました`, 'success');
        } catch(e) { /* fall through */ }
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        // Save file reference
        store.addHealthData('photos', {
          filename: file.name, type: file.type, size: file.size,
          dataUrl: isImage ? ev.target.result.substring(0, 500) : '',
          category: isImage ? '写真' : 'ファイル'
        });

        // Save to text entries for timeline
        const entryId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const textEntries = store.get('textEntries') || [];
        textEntries.push({
          id: entryId,
          timestamp: new Date().toISOString(),
          category: isImage ? '写真' : 'ファイル',
          type: 'file_upload',
          title: `📎 ${file.name}`,
          content: `${isImage ? '写真' : 'ファイル'}をアップロード（${(file.size/1024).toFixed(0)}KB）`
        });
        store.set('textEntries', textEntries);

        // Add to conversation history
        const history = store.get('conversationHistory') || [];
        history.push({ role: 'user', content: `[ファイル: ${file.name}]`, timestamp: new Date().toISOString(), type: 'file_upload' });
        store.set('conversationHistory', history);

        Components.showToast(`${file.name} を分析中...`, 'info');

        // Run API analysis
        const imgOpts = isImage ? { imageBase64: ev.target.result } : {};
        const result = await this.analyzeViaAPI(
          `[ファイル: ${file.name}] ${isImage ? '写真' : 'ファイル'}`,
          isImage ? 'image_analysis' : 'text_analysis',
          imgOpts
        );

        // Save AI comment
        this.saveAIComment(entryId, result);
        store.set('latestFeedback', result);

        // Show result on the page
        if (resultEl) {
          resultEl.innerHTML = this.renderAnalysisCard(result);
        }

        Components.showToast(`${file.name} の分析が完了しました`, 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // ---- User Profile ----
  saveDiseaseSettings() {
    const checkboxes = document.querySelectorAll('.settings-disease-cb');
    const selected = [];
    checkboxes.forEach(cb => { if (cb.checked) selected.push(cb.value); });
    store.set('selectedDiseases', selected);

    // Set primary disease
    if (selected.length > 0) {
      for (const cat of CONFIG.DISEASE_CATEGORIES) {
        const found = cat.diseases.find(d => d.id === selected[0]);
        if (found) {
          store.set('selectedDisease', { id: found.id, name: found.name, fullName: found.name, icon: cat.icon, color: '#6C63FF' });
          break;
        }
      }
    }

    if (FirebaseBackend.initialized) {
      FirebaseBackend.saveProfile({ settings: { selectedDiseases: selected, selectedDisease: store.get('selectedDisease') } });
    }

    const countEl = document.getElementById('settings-disease-count');
    if (countEl) countEl.textContent = selected.length + '件選択';
    Components.showToast(`${selected.length}件の疾患を保存しました`, 'success');
  }

  saveProfile() {
    const profile = {
      age: document.getElementById('profile-age')?.value || '',
      gender: document.getElementById('profile-gender')?.value || '',
      height: document.getElementById('profile-height')?.value || '',
      weight: document.getElementById('profile-weight')?.value || '',
      location: document.getElementById('profile-location')?.value || '',
      travelRange: document.getElementById('profile-travel-range')?.value || 'region',
      language: document.getElementById('profile-language')?.value || 'ja',
      notes: document.getElementById('profile-notes')?.value || ''
    };
    store.set('userProfile', profile);
    if (FirebaseBackend.initialized) {
      FirebaseBackend.saveProfile({ userProfile: profile });
    }
    Components.showToast('プロフィールを保存しました', 'success');
  }

  loadProfileFields() {
    const profile = store.get('userProfile') || {};
    const fields = { age: 'profile-age', gender: 'profile-gender', height: 'profile-height', weight: 'profile-weight', location: 'profile-location', travelRange: 'profile-travel-range', language: 'profile-language', notes: 'profile-notes' };
    Object.entries(fields).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && profile[key]) el.value = profile[key];
    });
  }

  // ---- Sidebar (mobile) ----
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    if (overlay) overlay.style.display = isOpen ? 'block' : 'none';
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  }

  showLegalPage(type) {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!overlay || !body) return;

    const pages = {
      privacy: { title: 'プライバシーポリシー', content: `
<h3>個人情報の取り扱いについて</h3>
<p>シェアーズ株式会社（以下「当社」）は、未病ダイアリー（以下「本サービス」）における個人情報の取り扱いについて、以下のとおり定めます。</p>

<h4>1. 収集する情報</h4>
<p>・Googleアカウント情報（メールアドレス、表示名）<br>
・ユーザーが入力した体調記録、症状データ、写真、ファイル<br>
・デバイス連携データ（Fitbit、Apple Health等、ユーザーが明示的に連携した場合）<br>
・利用ログ（アクセス日時、操作履歴）</p>

<h4>2. 要配慮個人情報について</h4>
<p>本サービスで取り扱う健康情報・病歴情報は、個人情報保護法における「要配慮個人情報」に該当します。当社は本人の明示的な同意に基づいてのみこれらの情報を取得・利用します。</p>

<h4>3. 利用目的</h4>
<p>・ユーザー本人への体調記録・情報整理サービスの提供<br>
・サービス改善のための統計的分析（個人を特定しない形式）<br>
・ユーザーサポートへの対応</p>

<h4>4. 第三者提供</h4>
<p>ユーザーの健康データを第三者に提供・販売することはありません。ただし以下の場合を除きます：<br>
・ユーザー本人の明示的な同意がある場合<br>
・法令に基づく開示要請がある場合</p>

<h4>5. データの保管</h4>
<p>データはGoogle Firebase（東京リージョン）に暗号化して保存されます。</p>

<h4>6. データの削除・開示</h4>
<p>ユーザーは設定画面からいつでもすべてのデータを削除できます。個人情報の開示・訂正・削除の請求は support@advisers.jp までご連絡ください。</p>

<h4>7. お問い合わせ</h4>
<p>シェアーズ株式会社<br>E-mail: support@advisers.jp</p>
<p>最終更新日: 2025年4月</p>` },

      terms: { title: '利用規約', content: `
<h3>未病ダイアリー 利用規約</h3>

<h4>第1条（サービスの性質）</h4>
<p>本サービスは体調記録・情報整理のためのツールであり、<strong>医療機器ではなく、医療行為を行うものではありません</strong>。本サービスが提示する情報は参考情報であり、医師による診断・治療・処方の代替にはなりません。</p>

<h4>第2条（利用資格）</h4>
<p>本サービスは個人の健康管理を目的としてご利用いただけます。18歳未満の方は保護者の同意を得てご利用ください。</p>

<h4>第3条（禁止事項）</h4>
<p>・本サービスの情報を医師の診断の代替として使用すること<br>
・虚偽の情報の入力<br>
・本サービスの逆アセンブル、リバースエンジニアリング<br>
・他のユーザーのアカウントへの不正アクセス</p>

<h4>第4条（免責）</h4>
<p>当社は、本サービスが提示する参考情報の正確性、完全性、有用性について保証しません。本サービスの情報に基づく判断・行動はすべてユーザーご自身の責任となります。</p>

<h4>第5条（サービスの変更・停止）</h4>
<p>当社は事前の通知なくサービスの内容を変更、または停止する場合があります。</p>

<h4>第6条（料金）</h4>
<p>本サービスの基本機能は無料でご利用いただけます。将来的に有料機能を追加する場合は事前にお知らせします。</p>

<h4>第7条（準拠法・管轄）</h4>
<p>本規約は日本法に準拠し、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
<p>最終更新日: 2025年4月</p>` },

      disclaimer: { title: '免責事項・医療情報について', content: `
<h3>免責事項</h3>

<h4>医療行為ではありません</h4>
<p>未病ダイアリーは体調記録・情報整理ツールであり、<strong>医療機器プログラム（SaMD）には該当しません</strong>。本サービスは診断、治療、処方、または医学的助言を提供するものではありません。</p>

<h4>参考情報の性質</h4>
<p>本サービスが表示する情報（研究論文の要約、サプリメント情報、生活習慣に関する情報等）はすべて参考情報です。これらの情報は：<br>
・AIによる自動生成を含み、誤りを含む可能性があります<br>
・個別の症状・体質・服薬状況を完全に考慮するものではありません<br>
・最新の医学的知見と異なる場合があります<br>
・医師の診断・治療方針に代わるものではありません</p>

<h4>医師への相談</h4>
<p>体調に不安がある場合、新たなサプリメントや生活習慣の変更を検討する場合は、必ず医師または医療専門家にご相談ください。特に以下の場合は速やかに医療機関を受診してください：<br>
・症状の急激な悪化<br>
・自傷や自殺の念慮<br>
・呼吸困難、胸痛、意識障害等の緊急症状</p>

<h4>緊急連絡先</h4>
<p>救急: 119<br>
いのちの電話: 0570-783-556<br>
よりそいホットライン: 0120-279-338</p>

<h4>商品・サービスの推奨について</h4>
<p>本サービスが表示する商品・サービスの情報は、一般的な参考情報の提供を目的としています。特定の商品の効能を保証するものではありません。購入・使用の際はご自身でご判断ください。本サービスはアフィリエイトプログラムに参加しており、紹介リンクを通じた購入に対して報酬を受け取る場合があります。</p>

<p>最終更新日: 2025年4月</p>` }
    };

    const page = pages[type];
    if (!page) return;
    title.textContent = page.title;
    body.innerHTML = `<div style="font-size:12px;color:#475569;line-height:1.8">${page.content}</div>`;
    overlay.classList.add('active');
  }

  toggleTheme() {
    const t = store.get('theme') === 'dark' ? 'light' : 'dark';
    store.set('theme', t);
  }

  // ---- Admin ----
  savePrompt(key) {
    const nameEl = document.querySelector(`[data-prompt-name="${key}"]`);
    const textEl = document.querySelector(`[data-prompt-text="${key}"]`);
    const diseaseEl = document.querySelector(`[data-prompt-disease="${key}"]`);
    const scheduleEl = document.querySelector(`[data-prompt-schedule="${key}"]`);
    if (!nameEl || !textEl) return;

    const prompts = store.get('customPrompts') || {};
    prompts[key] = {
      ...prompts[key],
      name: nameEl.value,
      prompt: textEl.value,
      disease: diseaseEl ? diseaseEl.value : (prompts[key]?.disease || '_universal'),
      schedule: scheduleEl ? scheduleEl.value : (prompts[key]?.schedule || 'manual'),
      active: true
    };
    store.set('customPrompts', prompts);
    Components.showToast(`「${nameEl.value}」を保存しました`, 'success');
  }

  // ---- Admin Tab Navigation ----
  switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#admin-tabs .tab').forEach(el => el.classList.remove('active'));

    const target = document.getElementById('admin-tab-' + tabId);
    if (target) target.style.display = 'block';

    const tabs = document.querySelectorAll('#admin-tabs .tab');
    const tabNames = ['prompts', 'models', 'api', 'affiliate', 'firebase', 'data'];
    const idx = tabNames.indexOf(tabId);
    if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');

    // Load fields for specific tabs
    if (tabId === 'api') this.loadApiKeyFields();
    if (tabId === 'firebase') this.loadFirebaseConfigFields();
  }

  togglePromptEdit(key) {
    const el = document.getElementById('prompt-edit-' + key);
    if (!el) return;
    const isOpen = el.style.display !== 'none';
    el.style.display = isOpen ? 'none' : 'block';
  }

  filterPrompts(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.prompt-item').forEach(el => {
      const name = el.querySelector('[data-prompt-name]')?.value?.toLowerCase() || '';
      el.style.display = name.includes(q) || q === '' ? '' : 'none';
    });
  }

  filterPromptsByDisease(diseaseId) {
    document.querySelectorAll('.prompt-item').forEach(el => {
      const d = el.dataset.disease || '_universal';
      el.style.display = !diseaseId || d === diseaseId ? '' : 'none';
    });
  }

  resetPromptsToDefault() {
    if (!confirm('すべてのプロンプトをデフォルトに戻しますか？カスタム変更は失われます。')) return;
    store.set('customPrompts', {});  // Clear overrides so DEFAULT_PROMPTS shines through
    Components.showToast(`プロンプトをデフォルトに戻しました（${Object.keys(DEFAULT_PROMPTS).length}件）`, 'success');
    this.navigate('admin');
  }

  addNewPrompt() {
    const key = 'custom_' + Date.now();
    const prompts = store.get('customPrompts') || {};
    prompts[key] = {
      name: '新しいプロンプト',
      disease: '_universal',
      description: '',
      prompt: PROMPT_HEADER + 'ここにプロンプトを入力してください...\n\n{{USER_DATA}} や {{SELECTED_DISEASES}} 等の変数が使えます。',
      schedule: 'manual',
      active: true
    };
    store.set('customPrompts', prompts);
    this.navigate('admin');
    // Auto-open the new prompt
    setTimeout(() => this.togglePromptEdit(key), 100);
  }

  deletePrompt(key) {
    const prompts = store.get('customPrompts') || {};
    delete prompts[key];
    store.set('customPrompts', prompts);
    this.navigate('admin');
    Components.showToast('プロンプトを削除しました', 'info');
  }

  addAdmin() {
    const input = document.getElementById('new-admin-email');
    if (!input || !input.value.trim() || !input.value.includes('@')) {
      Components.showToast('有効なメールアドレスを入力してください', 'error');
      return;
    }
    const email = input.value.trim().toLowerCase();
    if (this.ADMIN_EMAILS.includes(email)) {
      Components.showToast('既に管理者です', 'error');
      return;
    }
    this.ADMIN_EMAILS.push(email);
    localStorage.setItem('admin_emails', JSON.stringify(this.ADMIN_EMAILS.filter(e => e !== 'agewaller@gmail.com')));
    if (FirebaseBackend.initialized) {
      FirebaseBackend.saveProfile({ adminEmails: this.ADMIN_EMAILS });
    }
    input.value = '';
    Components.showToast(`${email} を管理者に追加しました`, 'success');
    this.navigate('admin');
  }

  removeAdmin(email) {
    if (email === 'agewaller@gmail.com') {
      Components.showToast('オーナーは削除できません', 'error');
      return;
    }
    this.ADMIN_EMAILS = this.ADMIN_EMAILS.filter(e => e !== email);
    localStorage.setItem('admin_emails', JSON.stringify(this.ADMIN_EMAILS.filter(e => e !== 'agewaller@gmail.com')));
    Components.showToast(`${email} を管理者から削除しました`, 'info');
    this.navigate('admin');
  }

  setModel(modelId) {
    store.set('selectedModel', modelId);
    // Persist to Firestore so it survives reload
    if (FirebaseBackend.initialized) {
      FirebaseBackend.saveProfile({ settings: { selectedModel: modelId } });
    }
    Components.showToast(`モデルを ${modelId} に変更しました`, 'success');
  }

  saveAffiliateConfig(e) {
    e.preventDefault();
    const form = e.target;
    CONFIG.AFFILIATE_NETWORKS.forEach(n => {
      const tagInput = form.querySelector(`[name="aff_${n.id}"]`);
      if (tagInput && tagInput.value) {
        affiliateEngine.updateConfig(n.id, { tag: tagInput.value });
      }
    });
    Components.showToast('アフィリエイト設定を保存しました', 'success');
  }

  // ---- Dashboard Charts ----
  initDashboardCharts() {
    // Symptom trend chart
    const sympCtx = document.getElementById('symptom-chart');
    if (sympCtx && typeof Chart !== 'undefined') {
      if (this.chartInstances.symptom) this.chartInstances.symptom.destroy();

      const symptoms = store.get('symptoms') || [];
      const last14 = symptoms.slice(-14);
      const labels = last14.map(s => {
        const d = new Date(s.timestamp);
        return `${d.getMonth()+1}/${d.getDate()}`;
      });

      this.chartInstances.symptom = new Chart(sympCtx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['データなし'],
          datasets: [
            {
              label: '疲労度',
              data: last14.map(s => s.fatigue_level || 0),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.1)',
              tension: 0.3, fill: true
            },
            {
              label: '痛み',
              data: last14.map(s => s.pain_level || 0),
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245,158,11,0.1)',
              tension: 0.3, fill: true
            },
            {
              label: 'ブレインフォグ',
              data: last14.map(s => s.brain_fog || 0),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139,92,246,0.1)',
              tension: 0.3, fill: true
            },
            {
              label: '睡眠品質',
              data: last14.map(s => s.sleep_quality || 0),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34,197,94,0.1)',
              tension: 0.3, fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 7, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8896b0' } },
            x: { grid: { display: false }, ticks: { color: '#8896b0' } }
          },
          plugins: {
            legend: { labels: { color: '#8896b0', font: { size: 11 } } }
          }
        }
      });
    }
  }

  // ---- Generate Demo Data ----
  generateDemoData() {
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ts = d.toISOString();

      store.addHealthData('symptoms', {
        timestamp: ts,
        fatigue_level: Math.floor(Math.random() * 4) + 2,
        pain_level: Math.floor(Math.random() * 3) + 1,
        brain_fog: Math.floor(Math.random() * 4) + 1,
        sleep_quality: Math.floor(Math.random() * 3) + 2,
        pem_status: Math.random() > 0.7
      });

      store.addHealthData('vitals', {
        timestamp: ts,
        heart_rate: Math.floor(Math.random() * 30) + 60,
        temperature: (36 + Math.random() * 1.5).toFixed(1),
        spo2: Math.floor(Math.random() * 3) + 96
      });
    }
    store.calculateHealthScore();
    Components.showToast('デモデータを生成しました', 'success');
    this.navigate('dashboard');
  }
};

var app = new App();
