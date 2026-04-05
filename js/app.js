/* ============================================================
   Main Application Controller
   ============================================================ */
var App = class App {
  constructor() {
    this.pages = {};
    this.currentPage = null;
    this.chartInstances = {};
    this.ADMIN_EMAILS = ['agewaller@gmail.com'];
  }

  isAdmin() {
    const user = store.get('user');
    return user && this.ADMIN_EMAILS.includes(user.email);
  }

  init() {
    document.documentElement.setAttribute('data-theme', store.get('theme'));
    store.on('theme', (t) => document.documentElement.setAttribute('data-theme', t));
    store.on('currentPage', (p) => this.navigate(p));

    // Initialize Firebase if configured
    if (FirebaseBackend.isConfigured()) {
      const config = FirebaseBackend.getConfig();
      FirebaseBackend.init(config);
      FirebaseBackend.enableAutoSync();
      // Firebase auth will handle navigation via onAuthStateChanged
    } else {
      // No Firebase - use localStorage mode
      if (store.get('isAuthenticated') && store.get('user')) {
        this.navigate(store.get('selectedDisease') ? 'dashboard' : 'disease-select');
      } else {
        this.navigate('login');
      }
    }

    // Set up periodic health score calc
    setInterval(() => store.calculateHealthScore(), 60000);
    store.calculateHealthScore();
  }

  // ---- Navigation ----
  navigate(page) {
    // Block non-admin users from admin page
    if (page === 'admin' && !this.isAdmin()) {
      Components.showToast('管理パネルへのアクセス権限がありません', 'error');
      return;
    }

    this.currentPage = page;
    const content = document.getElementById('page-content');
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('top-bar');
    if (!content) return;

    // Hide admin nav item for non-admin users
    document.querySelectorAll('.nav-item[data-page="admin"]').forEach(el => {
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
      chat: 'AIコンサルタント',
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
      content.innerHTML = renderer.call(this);
      this.afterRender(page);
    }
  }

  afterRender(page) {
    if (page === 'dashboard') this.initDashboardCharts();
    if (page === 'analysis') this.loadLatestAnalysis();
    if (page === 'admin') { this.loadApiKeyFields(); this.loadFirebaseConfigFields(); }
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

  handlePhotoUpload(e, category) {
    const files = e.target.files;
    this.processPhotos(files, category);
  }

  handlePhotoDrop(e, category) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    this.processPhotos(files, category);
  }

  processPhotos(files, category) {
    const preview = document.getElementById(`photo-preview-${category}`);
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const entry = store.addHealthData('photos', {
          filename: file.name,
          type: file.type,
          size: file.size,
          dataUrl: ev.target.result.substring(0, 200) + '...',
          category
        });
        if (preview) {
          preview.innerHTML += `<div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;background:var(--bg-tertiary)">
            <img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover">
            <div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:rgba(0,0,0,0.7);font-size:10px;color:#fff">${file.name}</div>
          </div>`;
        }
      };
      reader.readAsDataURL(file);
    });
    Components.showToast(`${files.length}件のファイルをアップロードしました`, 'success');
  }

  // ---- Text Entry ----
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

    // Status feedback
    const status = document.getElementById('text-save-status');
    if (status) status.textContent = '保存しました。AI分析中...';

    // Re-render page to show updated recent entries
    this.navigate('data-input');

    // Run instant AI analysis and display advice
    this.showInstantAdvice(content, category);

    Components.showToast('保存してAI分析を実行中...', 'success');
  }

  showInstantAdvice(newText, category) {
    const adviceArea = document.getElementById('instant-advice');
    if (!adviceArea) return;

    adviceArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">🤖 AIインスタントアドバイス</span>
          <div class="spinner" style="width:18px;height:18px;border-width:2px"></div>
        </div>
        <div class="card-body" style="color:var(--text-muted);font-size:13px">入力内容を分析しています...</div>
      </div>`;

    // Small delay to let UI update, then generate advice
    setTimeout(() => {
      const advice = this.generateInstantAdvice(newText, category);
      adviceArea.innerHTML = `
        <div class="card" style="border-color:var(--accent-border)">
          <div class="card-header" style="background:var(--accent-bg)">
            <span class="card-title">🤖 AIインスタントアドバイス</span>
            <span style="font-size:11px;color:var(--text-muted)">${new Date().toLocaleTimeString('ja-JP')}</span>
          </div>
          <div class="card-body">
            ${advice.alerts.map(a => `
              <div style="padding:10px 14px;background:${a.level === 'warning' ? 'var(--warning-bg)' : a.level === 'danger' ? 'var(--danger-bg)' : 'var(--info-bg)'};border-left:3px solid ${a.level === 'warning' ? 'var(--warning)' : a.level === 'danger' ? 'var(--danger)' : 'var(--info)'};border-radius:0 8px 8px 0;margin-bottom:10px;font-size:13px">
                ${a.message}
              </div>
            `).join('')}
            <div style="font-size:13px;line-height:1.8;color:var(--text-secondary);white-space:pre-wrap">${advice.text}</div>
            ${advice.actions.length > 0 ? `
              <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
                <h4 style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">推奨アクション</h4>
                ${advice.actions.map(a => `
                  <div style="display:flex;align-items:start;gap:8px;margin-bottom:6px;font-size:13px">
                    <span style="color:var(--accent)">→</span>
                    <span>${a}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>`;

      const status = document.getElementById('text-save-status');
      if (status) status.textContent = 'AI分析完了';
    }, 300);
  }

  generateInstantAdvice(text, category) {
    const lower = text.toLowerCase();
    const alerts = [];
    const actions = [];
    let advice = '';

    // PEM detection
    if (/pem|労作後|倦怠感がひどい|動けな[いく]|まったく動け|寝込/.test(lower)) {
      alerts.push({ level: 'warning', message: 'PEM（労作後倦怠感）の兆候を検出しました。今日は活動を最小限に抑えてください。' });
      advice += '【PEM管理】安静を最優先してください。横になり、刺激（スマホ・TV）を減らし、心拍数が安静時+20bpm以内に保たれるようにしてください。\n\n';
      actions.push('活動を即座に中断し、安静にする');
      actions.push('次の24-48時間は回復に充てる');
    }

    // Pain
    if (/疼痛|痛[いみむ]|頭痛|痛む|ぴきぴき|バキバキ/.test(lower)) {
      alerts.push({ level: 'info', message: '疼痛の記録を検出。痛みの部位・強度・時間帯を追跡することで傾向が見えてきます。' });
      advice += '【疼痛管理】記録された痛みのパターン分析：\n・ツートラム等の鎮痛剤は食事と一緒に服用\n・エプソムソルト入浴（38°C, 20分）で筋緊張を緩和\n・マグネシウムバーム外用も局所疼痛に有効\n\n';
      actions.push('痛みの強度を0-7で記録する');
    }

    // Mental health
    if (/鬱|孤独|不安|辛[いか]|死|自殺|ネガティ|絶望|メンタル|イライラ|焦燥/.test(lower)) {
      alerts.push({ level: 'danger', message: '精神面の不調を検出しました。信頼できる方への連絡、または専門家への相談を推奨します。' });
      advice += '【メンタルケア】孤独感やネガティブな感情が記録されています。以下を試してください：\n・信頼できる人に電話する（短時間でもOK）\n・呼吸法：4秒吸って→7秒止めて→8秒吐く を3セット\n・「今あるもの」への感謝リストを3つ書く\n・無理に活動せず、副交感神経優位な環境を作る\n\n';
      actions.push('信頼できる人に連絡する');
      actions.push('4-7-8呼吸法を3セット実施');
    }

    // Medication notes
    if (/ツートラム|リンデロン|エチゾラム|ステロイド|プレドニゾ|カロナール|リボトリール|減薬/.test(lower)) {
      advice += '【服薬メモ】薬の変更や減薬に関する記録を検出。必ず主治医と相談の上で進めてください。特にベンゾジアゼピン系（エチゾラム・リボトリール）の減薬は10%/月の漸減が推奨されています。\n\n';
      actions.push('次回診察時にお薬手帳を更新');
    }

    // Supplements
    if (/coq10|コエンザイム|nmn|クレアチン|オメガ3|ビタミン|マグネシウム|サプリ|5-ala|カルニチン/.test(lower)) {
      advice += '【サプリメント】言及されたサプリメントについて：飲み合わせの安全性を確認してください。CoQ10は食事と一緒に、マグネシウムは就寝前に、NMNは朝の空腹時がベストです。\n\n';
    }

    // Bath / Epsom salt
    if (/エプソムソルト|風呂|入浴/.test(lower)) {
      advice += '【入浴療法】エプソムソルト入浴の効果を記録されています。継続してください。推奨：38-39°C、15-20分、就寝90分前。マグネシウム経皮吸収により筋弛緩・自律神経調整効果が期待できます。\n\n';
    }

    // Weather sensitivity
    if (/気圧|天候|気象病|五苓散/.test(lower)) {
      advice += '【気象病対策】気圧変動への感受性が記録されています。「頭痛ーる」アプリで翌日の気圧を確認し、低気圧接近の6時間前に五苓散2.5gを予防服用してください。\n\n';
      actions.push('気圧予報を確認する');
    }

    // Meditation / breathing
    if (/瞑想|呼吸法|マインドフル|ムドラー|坐禅/.test(lower)) {
      advice += '【瞑想・呼吸法】効果を感じている記録があります。迷走神経トーニング効果により自律神経バランスが改善されます。朝10分＋就寝前10分を目標に継続してください。\n\n';
    }

    // Activity / exercise
    if (/ジム|運動|散歩|ストレッチ|ヨガ|自転車|ランニング/.test(lower)) {
      advice += '【活動管理】運動記録を検出。ME/CFS患者は活動後のPEMに注意が必要です。心拍数が安静時+30bpmを超えない範囲で活動し、翌日の体調を必ず確認してください。\n\n';
      actions.push('活動後24-48時間の体調をモニタリング');
    }

    // Sleep
    if (/眠[れり]|寝[たて]|睡眠|不眠|マイスリー|ゾルピデム|起き[たれ]/.test(lower)) {
      advice += '【睡眠管理】睡眠に関する記録あり。睡眠衛生チェック：①スマホは寝室に持ち込まない ②室温21-23°C ③就寝1時間前はスクリーンOFF ④一定の起床時間を保つ\n\n';
    }

    // Doctor visits
    if (/先生|クリニック|病院|診察|受診/.test(lower)) {
      advice += '【診察メモ】医療機関の受診記録です。次回の診察に向けて、このテキストをプリントして主治医に共有することを推奨します。\n\n';
      actions.push('診察メモをまとめて主治医に共有する');
    }

    // GLP-1
    if (/リベルサス|glp-1|セマグルチド/.test(lower)) {
      alerts.push({ level: 'info', message: 'GLP-1受容体作動薬の使用を検出。消化器系副作用（吐き気）に注意し、医師の管理下での使用を推奨します。' });
      advice += '【GLP-1薬】リベルサスは空腹時に少量の水で服用し、30分後に食事。吐き気がある場合は用量調整を検討してください。\n\n';
    }

    // Default if nothing detected
    if (advice === '') {
      advice = '記録ありがとうございます。この内容はAI分析のコンテキストに追加されました。\n\n日々の記録を続けることで、症状パターンの検出精度が向上します。体調の変化、薬の効果、気分の波など、気づいたことを自由に書き続けてください。';
    }

    if (actions.length === 0) {
      actions.push('明日も体調を記録する');
    }

    return { text: advice, alerts, actions };
  }

  // ---- AI Analysis ----
  async runAnalysis(promptKey) {
    const prompts = store.get('customPrompts') || DEFAULT_PROMPTS;
    const promptConfig = prompts[promptKey] || Object.values(prompts)[0];
    if (!promptConfig) { Components.showToast('プロンプトが見つかりません', 'error'); return; }

    const resultArea = document.getElementById('analysis-result');
    if (resultArea) resultArea.innerHTML = Components.loading('AI分析を実行中...');

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
              <div style="display:flex;gap:8px">
                <a href="${a.url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">PubMedで見る</a>
                ${a.doi ? `<a href="https://doi.org/${a.doi}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary">DOI</a>` : ''}
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

    // Get AI response
    try {
      const disease = store.get('selectedDisease');
      const systemPrompt = `あなたは${disease?.fullName || '慢性疾患'}の専門AIアシスタントです。患者に寄り添い、最新のエビデンスに基づいたアドバイスを提供してください。`;
      const userData = aiEngine.collectCurrentUserData();

      const response = await aiEngine.callModel(
        store.get('selectedModel'),
        `${systemPrompt}\n\nユーザーの健康データ: ${JSON.stringify(userData.current)}\n\nユーザーの質問: ${msg}`,
        { maxTokens: 2048 }
      );

      const aiMsg = typeof response === 'string' ? response : (response.summary || JSON.stringify(response));
      history.push({ role: 'assistant', content: aiMsg, timestamp: new Date().toISOString() });
      store.set('conversationHistory', history);
      this.renderChatMessages();
    } catch (err) {
      history.push({ role: 'assistant', content: 'すみません、応答の生成中にエラーが発生しました。もう一度お試しください。', timestamp: new Date().toISOString() });
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

    // Run instant advice on transcript
    this.showInstantAdvice(text, 'conversation');
    this.navigate('integrations');
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

  toggleTheme() {
    const t = store.get('theme') === 'dark' ? 'light' : 'dark';
    store.set('theme', t);
  }

  // ---- Admin ----
  savePrompt(key) {
    const nameEl = document.querySelector(`[data-prompt-name="${key}"]`);
    const textEl = document.querySelector(`[data-prompt-text="${key}"]`);
    if (!nameEl || !textEl) return;

    const prompts = store.get('customPrompts') || {};
    prompts[key] = {
      ...prompts[key],
      name: nameEl.value,
      prompt: textEl.value,
      active: true
    };
    store.set('customPrompts', prompts);
    Components.showToast('プロンプトを保存しました', 'success');
  }

  addNewPrompt() {
    const key = 'custom_' + Date.now();
    const prompts = store.get('customPrompts') || {};
    prompts[key] = {
      name: '新しいプロンプト',
      description: '',
      prompt: 'ここにプロンプトを入力してください...',
      schedule: 'manual',
      active: true
    };
    store.set('customPrompts', prompts);
    this.navigate('admin');
  }

  deletePrompt(key) {
    const prompts = store.get('customPrompts') || {};
    delete prompts[key];
    store.set('customPrompts', prompts);
    this.navigate('admin');
    Components.showToast('プロンプトを削除しました', 'info');
  }

  setModel(modelId) {
    store.set('selectedModel', modelId);
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
