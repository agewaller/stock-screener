/* ============================================================
   Page Renderers - Added to App.prototype
   ============================================================ */

// Login Page
App.prototype.render_login = function() {
  return `
  <div class="login-page">
    <div class="login-container">
      <div class="login-logo">
        <div class="login-logo-icon">⚕️</div>
        <h1>ChronicCare AI</h1>
        <p>慢性疾患管理ダッシュボード</p>
      </div>
      <div class="login-card">
        <button class="google-btn" onclick="app.loginWithGoogle()">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Googleでログイン
        </button>
        <div class="login-divider">または</div>
        <form onsubmit="app.loginWithEmail(event)">
          <div class="form-group">
            <label class="form-label">メールアドレス</label>
            <input type="email" name="email" class="form-input" placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">パスワード</label>
            <input type="password" name="password" class="form-input" placeholder="パスワード">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px">ログイン</button>
        </form>
        <p style="text-align:center;margin-top:16px;font-size:12px;color:var(--text-muted)">
          デモ体験は「Googleでログイン」をクリック
        </p>
      </div>
    </div>
  </div>`;
};

// Disease Selection
App.prototype.render_disease_select = function() {
  const cards = CONFIG.DISEASES.map(d => `
    <div class="disease-option" onclick="app.selectDisease('${d.id}')">
      <div class="disease-option-icon">${d.icon}</div>
      <div class="disease-option-name">${d.name}</div>
      <div class="disease-option-desc">${d.description}</div>
    </div>
  `).join('');

  return `
  <div class="disease-select-page" style="max-width:800px;margin:60px auto;padding:0 20px">
    <div style="text-align:center;margin-bottom:32px">
      <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">対象疾患を選択してください</h2>
      <p style="color:var(--text-secondary);font-size:14px">あなたの慢性疾患に合わせたダッシュボードを構築します</p>
    </div>
    <div class="disease-grid">${cards}</div>
  </div>`;
};

// Dashboard Page
App.prototype.render_dashboard = function() {
  const disease = store.get('selectedDisease') || { name: 'ME/CFS', icon: '🧠' };
  const score = store.get('healthScore') || 50;
  const symptoms = store.get('symptoms') || [];
  const latest = symptoms[symptoms.length - 1] || {};
  const recs = store.get('recommendations') || [];
  const textEntries = store.get('textEntries') || [];
  const conversations = store.get('conversationHistory') || [];
  const latestAnalysis = store.get('latestAnalysis');

  // Real data counts
  const totalEntries = textEntries.length;
  const totalSymptoms = symptoms.length;
  const lastEntry = textEntries[textEntries.length - 1];
  const lastUpdate = lastEntry ? new Date(lastEntry.timestamp).toLocaleString('ja-JP') : (symptoms.length ? new Date(latest.timestamp).toLocaleString('ja-JP') : '未記録');

  // Calculate real stats from symptom data
  const recent7 = symptoms.filter(s => (Date.now() - new Date(s.timestamp)) < 7 * 86400000);
  const avgField = (arr, f) => { const v = arr.map(s => s[f]).filter(x => x != null); return v.length ? (v.reduce((a,b) => a+b, 0) / v.length).toFixed(1) : '--'; };
  const changeField = (arr, f) => {
    if (arr.length < 2) return 0;
    const half = Math.floor(arr.length / 2);
    const first = arr.slice(0, half).map(s => s[f]).filter(x => x != null);
    const second = arr.slice(half).map(s => s[f]).filter(x => x != null);
    if (!first.length || !second.length) return 0;
    const avg1 = first.reduce((a,b) => a+b, 0) / first.length;
    const avg2 = second.reduce((a,b) => a+b, 0) / second.length;
    return avg1 === 0 ? 0 : Math.round(((avg2 - avg1) / avg1) * 100);
  };

  const fatigueAvg = avgField(recent7, 'fatigue_level');
  const painAvg = avgField(recent7, 'pain_level');
  const fogAvg = avgField(recent7, 'brain_fog');
  const sleepAvg = avgField(recent7, 'sleep_quality');
  const fatigueChange = changeField(recent7, 'fatigue_level');
  const painChange = changeField(recent7, 'pain_level');
  const fogChange = changeField(recent7, 'brain_fog');
  const sleepChange = changeField(recent7, 'sleep_quality');

  // Latest text entries for dashboard
  const recentTexts = textEntries.slice(-3).reverse();

  return `
  <div style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="font-size:20px;font-weight:700">${disease.icon} ${disease.name} ダッシュボード</h2>
      <p style="font-size:13px;color:var(--text-muted)">最終更新: ${lastUpdate}｜テキスト記録: ${totalEntries}件｜指標データ: ${totalSymptoms}件</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="app.navigate('data-input')">📝 データ入力</button>
      <button class="btn btn-outline btn-sm" onclick="app.runAnalysis('mecfs_daily')">🤖 AI分析</button>
    </div>
  </div>

  <!-- Health Score + Stats -->
  <div class="grid" style="grid-template-columns:220px 1fr;gap:20px;margin-bottom:24px">
    <div class="card" style="display:flex;align-items:center;justify-content:center;padding:24px">
      ${Components.healthGauge(score)}
    </div>
    <div class="grid grid-4">
      ${Components.statCard('疲労度(7日平均)', fatigueAvg === '--' ? '--' : fatigueAvg + '/7', fatigueChange, '😴')}
      ${Components.statCard('痛み(7日平均)', painAvg === '--' ? '--' : painAvg + '/7', painChange, '💢')}
      ${Components.statCard('ブレインフォグ', fogAvg === '--' ? '--' : fogAvg + '/7', fogChange, '🧠')}
      ${Components.statCard('睡眠品質', sleepAvg === '--' ? '--' : sleepAvg + '/7', sleepChange, '🌙')}
    </div>
  </div>

  <!-- Recent Diary Entries -->
  ${recentTexts.length > 0 ? `
  <div class="card" style="margin-bottom:24px">
    <div class="card-header">
      <span class="card-title">最近の日記</span>
      <button class="btn btn-sm btn-outline" onclick="app.navigate('data-input')">すべて見る</button>
    </div>
    <div class="card-body">
      ${recentTexts.map(e => `
        <div style="padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid var(--accent)">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600">${e.title || new Date(e.timestamp).toLocaleDateString('ja-JP')}</span>
            <span style="font-size:10px;color:var(--text-muted)">${new Date(e.timestamp).toLocaleDateString('ja-JP')}</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${(e.content || '').substring(0, 200)}${(e.content || '').length > 200 ? '...' : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <!-- Symptom Trend Chart -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-header">
      <span class="card-title">症状トレンド（過去14日間）</span>
    </div>
    <div class="card-body" style="height:300px">
      ${symptoms.length > 0
        ? '<canvas id="symptom-chart"></canvas>'
        : Components.emptyState('📈', 'データがありません', '症状を記録するとトレンドチャートが表示されます。デモデータ生成ボタンでお試しできます。')}
    </div>
  </div>

  <!-- Recommendations -->
  <div style="margin-bottom:24px">
    <h3 style="font-size:16px;font-weight:600;margin-bottom:14px">推奨アクション</h3>
    ${recs.length > 0
      ? recs.slice(0, 3).map(r => Components.recommendationCard(r)).join('')
      : `<div class="card"><div class="card-body">${Components.emptyState('🤖', 'まだ推奨がありません', 'AI分析を実行すると、個別化された推奨アクションが表示されます。')}</div></div>`}
    ${recs.length > 3 ? `<button class="btn btn-outline" onclick="app.navigate('actions')" style="margin-top:10px">すべての推奨を見る →</button>` : ''}
  </div>`;
};

// Data Input Page
App.prototype.render_data_input = function() {
  const cards = CONFIG.DATA_CATEGORIES.map(c => {
    const key = store.categoryToStateKey(c.id);
    const data = key ? (store.get(key) || []) : [];
    const count = Array.isArray(data) ? data.length : 0;
    return `
    <div class="action-card" onclick="app.openDataInput('${c.id}')">
      <div class="action-card-icon" style="background:var(--accent-bg)">${c.icon}</div>
      <div class="action-card-title">${c.name}</div>
      <div class="action-card-desc">${c.fields.length}項目</div>
      ${count > 0 ? `<span class="tag tag-accent" style="margin-top:8px">${count}件記録済</span>` : ''}
    </div>`;
  }).join('');

  const textEntries = store.get('textEntries') || [];
  const recentTexts = textEntries.slice(-5).reverse();
  const categoryLabels = {
    symptoms: '症状', nutrition: '食事・栄養', medication: '服薬・処方',
    mental: '精神状態', activity: '活動', sleep: '睡眠',
    blood_test: '検査結果', doctor: '医師の所見', research: '調査メモ', other: 'その他'
  };

  const recentHtml = recentTexts.length > 0 ? `
    <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
      <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:10px">最近の記録（${textEntries.length}件）</h4>
      ${recentTexts.map(e => `
        <div style="padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid var(--accent)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span class="tag tag-accent" style="font-size:10px">${categoryLabels[e.category] || e.category}</span>
            <span style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${new Date(e.timestamp).toLocaleString('ja-JP')}</span>
          </div>
          ${e.title ? `<div style="font-size:13px;font-weight:600;margin-bottom:2px">${e.title}</div>` : ''}
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${(e.content || '').length > 300 ? e.content.substring(0, 300) + '...' : e.content}</div>
        </div>
      `).join('')}
    </div>` : '';

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">データ入力</h2>
    <p style="font-size:13px;color:var(--text-secondary)">日々の体調や気づきを記録してください。テキストからAIが即座にアドバイスを生成します。</p>
  </div>

  <!-- 1. Free Text Input (Primary) -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-header">
      <span class="card-title">📝 日記・フリーテキスト入力</span>
      <span class="tag tag-accent">メイン</span>
    </div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-input" id="text-input-date" value="${new Date().toISOString().split('T')[0]}" style="width:200px">
      </div>
      <div class="form-group">
        <div style="display:flex;gap:12px;align-items:end">
          <div style="flex:1">
            <label class="form-label">カテゴリ</label>
            <select class="form-select" id="text-input-category">
              <option value="symptoms">症状メモ</option>
              <option value="nutrition">食事・栄養メモ</option>
              <option value="medication">服薬・処方メモ</option>
              <option value="mental">精神状態メモ</option>
              <option value="activity">活動・ペーシングメモ</option>
              <option value="sleep">睡眠メモ</option>
              <option value="blood_test">検査結果メモ</option>
              <option value="doctor">医師の所見・アドバイス</option>
              <option value="research">調べたこと・論文メモ</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div style="flex:1">
            <label class="form-label">タイトル（任意）</label>
            <input type="text" class="form-input" id="text-input-title" placeholder="例: 朝の体調、診察メモ...">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-textarea" id="text-input-content" rows="8" placeholder="自由にテキストを入力してください...&#10;&#10;例:&#10;・今朝は頭痛がひどく、ブレインフォグも強い&#10;・昨日の散歩（15分）の後にPEMが出た&#10;・CoQ10を200mgに増量して3日目、少し楽になった気がする&#10;・山村先生にアザルフィジンの相談をした&#10;・エプソムソルト風呂に入ったら疲れが取れた"></textarea>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn btn-primary" onclick="app.submitTextEntry()">保存してAI分析</button>
        <button class="btn btn-secondary" onclick="document.getElementById('text-input-content').value='';document.getElementById('text-input-title').value=''">クリア</button>
        <span id="text-save-status" style="font-size:12px;color:var(--text-muted)"></span>
      </div>
      ${recentHtml}
    </div>
  </div>

  <!-- 2. AI Instant Advice (appears after text save) -->
  <div id="instant-advice" style="margin-bottom:24px"></div>

  <!-- 3. File Upload -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-header"><span class="card-title">📎 ファイルアップロード</span></div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">血液検査結果、食事写真、処方箋、遺伝子データなど</p>
      ${Components.photoUpload('general')}
    </div>
  </div>

  <!-- 4. Structured Data Entry (bottom) -->
  <div style="margin-bottom:12px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:4px">指標データ入力</h3>
    <p style="font-size:12px;color:var(--text-muted)">数値で記録したい項目はこちらから</p>
  </div>
  <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">
    ${cards}
  </div>`;
};

// AI Analysis Page
App.prototype.render_analysis = function() {
  const prompts = store.get('customPrompts') || DEFAULT_PROMPTS;
  const model = store.get('selectedModel') || 'claude-sonnet-4-6';
  const isAnalyzing = store.get('isAnalyzing');

  const modelOpts = CONFIG.AI_MODELS.map(m =>
    `<option value="${m.id}" ${m.id === model ? 'selected' : ''}>${m.name} (${m.provider})</option>`
  ).join('');

  const promptBtns = Object.entries(prompts).map(([key, p]) => `
    <button class="btn ${p.active ? 'btn-outline' : 'btn-secondary'} btn-sm"
      onclick="app.runAnalysis('${key}')" ${isAnalyzing ? 'disabled' : ''}>
      ${p.name}
    </button>
  `).join('');

  return `
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">AI分析</h2>
      <p style="font-size:13px;color:var(--text-secondary)">あなたの健康データをAIが分析し、最適な提案を生成します</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <select class="form-select" style="width:auto" onchange="app.setModel(this.value)">
        ${modelOpts}
      </select>
    </div>
  </div>

  <!-- Prompt Selection -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">分析プロンプト</span></div>
    <div class="card-body" style="display:flex;flex-wrap:wrap;gap:8px">
      ${promptBtns}
    </div>
  </div>

  <!-- Analysis Result -->
  <div id="analysis-result">
    ${store.get('latestAnalysis')
      ? ''
      : Components.emptyState('🤖', 'AI分析を実行してください', '上のボタンからプロンプトを選択して分析を開始します')}
  </div>`;
};

// Action Center
App.prototype.render_actions = function() {
  const recs = store.get('recommendations') || [];
  const analysis = store.get('latestAnalysis');
  const demoRecs = analysis?.parsed?.recommendations || analysis?.result?.recommendations || [];
  const allRecs = recs.length > 0 ? recs : demoRecs;

  const byCategory = {};
  allRecs.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  });

  let sections = '';
  CONFIG.ACTION_TYPES.forEach(at => {
    const items = byCategory[at.id];
    if (!items) return;
    sections += `
      <div style="margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${at.icon} ${at.name}</h3>
        ${items.map(r => Components.recommendationCard(r)).join('')}
      </div>`;
  });

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">アクションセンター</h2>
    <p style="font-size:13px;color:var(--text-secondary)">ワンクリックで健康改善のアクションを実行</p>
  </div>
  ${sections || `<div class="card"><div class="card-body">${Components.emptyState('⚡', 'アクションはまだありません', 'AI分析を実行すると、個別化されたアクションプランが生成されます。')}</div></div>`}

  <!-- Quick Action Grid -->
  <div style="margin-top:24px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">クイックアクション</h3>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      ${CONFIG.ACTION_TYPES.map(at => `
        <div class="action-card" style="text-align:center" onclick="Components.showToast('${at.name}機能は準備中です','info')">
          <div style="font-size:28px;margin-bottom:8px">${at.icon}</div>
          <div class="action-card-title">${at.name}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
};

// Research Page
App.prototype.render_research = function() {
  const analysis = store.get('latestAnalysis');
  const updates = analysis?.parsed?.researchUpdates || analysis?.result?.researchUpdates || [];

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">最新研究アップデート</h2>
    <p style="font-size:13px;color:var(--text-secondary)">ME/CFSに関する最新の研究論文・臨床試験情報</p>
  </div>
  ${updates.length > 0
    ? updates.map(r => Components.researchCard(r)).join('')
    : `<div class="card"><div class="card-body">
        ${Components.emptyState('🔬', '研究データがありません', 'AI分析を実行すると最新の研究情報が収集されます。')}
        <div style="text-align:center;margin-top:16px">
          <button class="btn btn-primary" onclick="app.runAnalysis('mecfs_research')">最新研究をスキャン</button>
        </div>
      </div></div>`}`;
};

// Chat Page
App.prototype.render_chat = function() {
  const history = store.get('conversationHistory') || [];
  const messages = history.map(m => Components.chatMessage(m)).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">AIコンサルタント</h2>
    <p style="font-size:13px;color:var(--text-secondary)">あなたの健康データに基づいて質問にお答えします</p>
  </div>
  <div class="card">
    <div class="chat-container">
      <div class="chat-messages" id="chat-messages">
        ${messages || `
          <div style="text-align:center;padding:40px;color:var(--text-muted)">
            <div style="font-size:40px;margin-bottom:12px">💬</div>
            <p>ME/CFSについて何でも質問してください</p>
            <p style="font-size:12px;margin-top:8px">例：「今日の体調データから気をつけることは？」</p>
          </div>
        `}
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chat-input" placeholder="メッセージを入力..."
          onkeydown="if(event.key==='Enter')app.sendChat()">
        <button class="btn btn-primary" onclick="app.sendChat()">送信</button>
      </div>
    </div>
  </div>`;
};

// Timeline Page
App.prototype.render_timeline = function() {
  const allData = [];
  ['symptoms', 'vitals', 'bloodTests', 'medications', 'sleepData'].forEach(key => {
    const data = store.get(key) || [];
    data.forEach(d => allData.push({ ...d, _type: key }));
  });

  allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recent = allData.slice(0, 50);

  const typeLabels = { symptoms: '症状記録', vitals: 'バイタル', bloodTests: '血液検査', medications: '服薬', sleepData: '睡眠' };
  const typeIcons = { symptoms: '📝', vitals: '💓', bloodTests: '🩸', medications: '💊', sleepData: '😴' };

  const items = recent.map(d => {
    const date = new Date(d.timestamp);
    const summary = Object.entries(d)
      .filter(([k]) => !['id', 'timestamp', 'category', '_type'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    return `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-date">${date.toLocaleString('ja-JP')}</div>
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">
        ${typeIcons[d._type] || '📋'} ${typeLabels[d._type] || d._type}
      </div>
      <div class="timeline-content">${summary.substring(0, 200)}</div>
    </div>`;
  }).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">タイムライン</h2>
    <p style="font-size:13px;color:var(--text-secondary)">すべての健康データの時系列表示</p>
  </div>
  <div class="card">
    <div class="card-body">
      ${items ? `<div class="timeline">${items}</div>` :
        Components.emptyState('📅', 'タイムラインにデータがありません', 'データを入力するとここに時系列で表示されます。')}
    </div>
  </div>`;
};

// Admin Page
App.prototype.render_admin = function() {
  const model = store.get('selectedModel') || 'claude-sonnet-4-6';
  const prompts = store.get('customPrompts') || DEFAULT_PROMPTS;

  const modelCards = CONFIG.AI_MODELS.map(m => `
    <div class="action-card ${m.id === model ? 'selected' : ''}"
      onclick="app.setModel('${m.id}')"
      style="${m.id === model ? 'border-color:var(--accent);background:var(--accent-bg)' : ''}">
      <div class="action-card-title">${m.name}</div>
      <div class="action-card-desc">${m.provider} - ${m.description}</div>
      ${m.id === model ? '<span class="tag tag-accent">使用中</span>' : ''}
    </div>
  `).join('');

  const promptEditors = Object.entries(prompts).map(([key, p]) => `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <input class="form-input" data-prompt-name="${key}" value="${p.name}" style="font-weight:600;border:none;background:transparent;padding:0;font-size:14px;color:var(--text-primary)">
        <div style="display:flex;gap:6px">
          <span class="tag ${p.active ? 'tag-success' : 'tag-warning'}">${p.schedule || 'manual'}</span>
          <button class="btn btn-sm btn-danger" onclick="app.deletePrompt('${key}')">削除</button>
        </div>
      </div>
      <div class="card-body">
        <textarea class="form-textarea" data-prompt-text="${key}" style="min-height:200px;font-family:'JetBrains Mono',monospace;font-size:12px">${p.prompt}</textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:10px">
          <button class="btn btn-primary btn-sm" onclick="app.savePrompt('${key}')">保存</button>
        </div>
      </div>
    </div>
  `).join('');

  const affConfig = store.get('affiliateConfig') || {};
  const affFields = CONFIG.AFFILIATE_NETWORKS.map(n => `
    <div class="form-group" style="display:flex;align-items:center;gap:12px">
      <label style="min-width:120px;font-size:13px;font-weight:500">${n.name}</label>
      <input class="form-input" name="aff_${n.id}" value="${affConfig[n.id]?.tag || n.tag || n.code || ''}" placeholder="タグ/コード" style="flex:1">
    </div>
  `).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">管理パネル</h2>
    <p style="font-size:13px;color:var(--text-secondary)">AIモデル・プロンプト・アフィリエイトの設定</p>
  </div>

  <!-- AI Model Selection -->
  <div style="margin-bottom:28px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">AIモデル選択</h3>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      ${modelCards}
    </div>
  </div>

  <!-- API Key Configuration -->
  <div class="card" style="margin-bottom:28px">
    <div class="card-header"><span class="card-title">APIキー設定</span></div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label">Anthropic API Key</label>
        <input type="password" class="form-input" placeholder="sk-ant-..." onchange="localStorage.setItem('apikey_claude-sonnet-4-6',this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">OpenAI API Key</label>
        <input type="password" class="form-input" placeholder="sk-..." onchange="localStorage.setItem('apikey_gpt-4o',this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Google AI API Key</label>
        <input type="password" class="form-input" placeholder="AIza..." onchange="localStorage.setItem('apikey_gemini-2.5-pro',this.value)">
      </div>
    </div>
  </div>

  <!-- Prompt Management -->
  <div style="margin-bottom:28px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="font-size:15px;font-weight:600">分析プロンプト管理</h3>
      <button class="btn btn-primary btn-sm" onclick="app.addNewPrompt()">+ 新規プロンプト</button>
    </div>
    ${promptEditors}
  </div>

  <!-- Affiliate Configuration -->
  <div class="card" style="margin-bottom:28px">
    <div class="card-header"><span class="card-title">アフィリエイト設定</span></div>
    <div class="card-body">
      <form onsubmit="app.saveAffiliateConfig(event)">
        ${affFields}
        <button type="submit" class="btn btn-primary btn-sm" style="margin-top:12px">設定を保存</button>
      </form>
    </div>
  </div>

  <!-- Dashboard Layout -->
  <div class="card" style="margin-bottom:28px">
    <div class="card-header"><span class="card-title">ダッシュボードレイアウト</span></div>
    <div class="card-body">
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="store.set('dashboardLayout','default');Components.showToast('デフォルトレイアウト','info')">デフォルト</button>
        <button class="btn btn-secondary" onclick="store.set('dashboardLayout','compact');Components.showToast('コンパクトレイアウト','info')">コンパクト</button>
        <button class="btn btn-secondary" onclick="store.set('dashboardLayout','detailed');Components.showToast('詳細レイアウト','info')">詳細表示</button>
      </div>
    </div>
  </div>

  <!-- Demo & Data -->
  <div class="card">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="app.generateDemoData()">デモデータ生成</button>
      <button class="btn btn-secondary" onclick="app.exportData()">データエクスポート</button>
      <button class="btn btn-danger" onclick="if(confirm('すべてのデータを削除しますか？')){store.clearAll();location.reload()}">データ全削除</button>
    </div>
  </div>`;
};

// Settings Page
App.prototype.render_settings = function() {
  const user = store.get('user') || {};
  const disease = store.get('selectedDisease') || {};
  const theme = store.get('theme');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">設定</h2>
  </div>

  <!-- Profile -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">プロフィール</span></div>
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div class="user-avatar" style="width:56px;height:56px;font-size:22px">${user.displayName?.[0] || '?'}</div>
        <div>
          <div style="font-size:16px;font-weight:600">${user.displayName || 'ゲスト'}</div>
          <div style="font-size:13px;color:var(--text-muted)">${user.email || ''}</div>
          <div class="tag tag-accent" style="margin-top:6px">${disease.name || '未設定'} - ${disease.fullName || ''}</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="app.navigate('disease-select')">疾患設定を変更</button>
    </div>
  </div>

  <!-- Theme -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">表示設定</span></div>
    <div class="card-body">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span>テーマ</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm ${theme==='dark'?'btn-primary':'btn-secondary'}" onclick="store.set('theme','dark')">ダーク</button>
          <button class="btn btn-sm ${theme==='light'?'btn-primary':'btn-secondary'}" onclick="store.set('theme','light')">ライト</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Data Export -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
      <button class="btn btn-secondary" onclick="app.exportData()">すべてのデータをエクスポート (JSON)</button>
      <button class="btn btn-danger" onclick="if(confirm('本当にログアウトしますか？')){app.logout()}">ログアウト</button>
    </div>
  </div>`;
};

// Export Data utility
App.prototype.exportData = function() {
  const data = {
    exportDate: new Date().toISOString(),
    user: store.get('user'),
    disease: store.get('selectedDisease'),
    symptoms: store.get('symptoms'),
    vitals: store.get('vitals'),
    bloodTests: store.get('bloodTests'),
    medications: store.get('medications'),
    supplements: store.get('supplements'),
    meals: store.get('meals'),
    sleepData: store.get('sleepData'),
    activityData: store.get('activityData'),
    analysisHistory: store.get('analysisHistory'),
    conversationHistory: store.get('conversationHistory')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chroniccare_export_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Components.showToast('データをエクスポートしました', 'success');
};
