/* ============================================================
   Main Application Controller
   ============================================================ */
class App {
  constructor() {
    this.pages = {};
    this.currentPage = null;
    this.chartInstances = {};
  }

  init() {
    document.documentElement.setAttribute('data-theme', store.get('theme'));
    store.on('theme', (t) => document.documentElement.setAttribute('data-theme', t));
    store.on('currentPage', (p) => this.navigate(p));

    // Check auth state
    if (store.get('isAuthenticated') && store.get('user')) {
      this.navigate(store.get('selectedDisease') ? 'dashboard' : 'disease-select');
    } else {
      this.navigate('login');
    }

    // Set up periodic health score calc
    setInterval(() => store.calculateHealthScore(), 60000);
    store.calculateHealthScore();
  }

  // ---- Navigation ----
  navigate(page) {
    this.currentPage = page;
    const content = document.getElementById('page-content');
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('top-bar');
    if (!content) return;

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
      timeline: 'タイムライン',
      admin: '管理パネル',
      settings: '設定'
    };
    const titleEl = document.getElementById('top-bar-title');
    if (titleEl) titleEl.textContent = titles[page] || '';

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
  }

  // ---- Auth ----
  loginWithGoogle() {
    // In production, use Firebase Auth
    // For demo, simulate login
    const user = {
      uid: 'demo_user_001',
      displayName: 'デモユーザー',
      email: 'demo@chroniccare.ai',
      photoURL: null
    };
    store.update({ user, isAuthenticated: true });
    Components.showToast('ログインしました', 'success');
    this.navigate('disease-select');
  }

  loginWithEmail(e) {
    if (e) e.preventDefault();
    const form = e.target;
    const email = form.querySelector('[name=email]').value;
    const pass = form.querySelector('[name=password]').value;
    if (!email || !pass) { Components.showToast('メールとパスワードを入力してください', 'error'); return; }
    const user = { uid: 'user_' + Date.now(), displayName: email.split('@')[0], email, photoURL: null };
    store.update({ user, isAuthenticated: true });
    Components.showToast('ログインしました', 'success');
    this.navigate('disease-select');
  }

  logout() {
    store.update({ user: null, isAuthenticated: false, currentPage: 'login' });
    this.navigate('login');
  }

  // ---- Disease Selection ----
  selectDisease(diseaseId) {
    const disease = CONFIG.DISEASES.find(d => d.id === diseaseId);
    if (disease) {
      store.set('selectedDisease', disease);
      // Load default prompts for this disease
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

  // ---- Theme ----
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
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
