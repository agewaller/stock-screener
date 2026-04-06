/* ============================================================
   Page Renderers - Added to App.prototype
   ============================================================ */

// Login Page - Disease selection first, then login
App.prototype.render_login = function() {
  const cats = CONFIG.DISEASE_CATEGORIES;
  const selected = store.get('selectedDiseases') || [];

  const categoryHtml = cats.map(cat => `
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.toggle').textContent=this.nextElementSibling.style.display==='none'?'▸':'▾'">
        <span class="toggle" style="font-size:12px;color:var(--text-muted)">▾</span>
        <span style="font-size:18px">${cat.icon}</span>
        <span style="font-size:14px;font-weight:600">${cat.name}</span>
        <span style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${cat.icd}</span>
      </div>
      <div style="display:block;padding-left:32px">
        ${cat.diseases.map(d => `
          <label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px;color:var(--text-secondary)">
            <input type="checkbox" class="disease-checkbox" value="${d.id}" data-name="${d.name}"
              ${selected.includes(d.id) ? 'checked' : ''}
              onchange="app.toggleDiseaseSelection(this)"
              style="width:16px;height:16px;accent-color:var(--accent)">
            <span>${d.name}</span>
            ${d.icd ? `<span style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${d.icd}</span>` : ''}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  const selectedCount = selected.length;

  return `
  <div class="login-page" style="align-items:flex-start;padding-top:30px">
    <div style="width:100%;max-width:720px;padding:0 20px">
      <div class="login-logo" style="text-align:center;margin-bottom:24px">
        <div class="login-logo-icon" style="margin:0 auto 12px">⚕️</div>
        <h1>ChronicCare AI</h1>
        <p>慢性疾患管理ダッシュボード</p>
      </div>

      <!-- Step 1: Disease Selection -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-title">Step 1: 対象疾患を選択</span>
          <span class="tag tag-accent" id="disease-count">${selectedCount}件選択中</span>
        </div>
        <div class="card-body" style="max-height:400px;overflow-y:auto">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">該当する疾患にチェックを入れてください（複数選択可）。WHO ICD-11分類に基づいています。</p>

          <!-- Search -->
          <input type="text" class="form-input" placeholder="疾患名で検索..." style="margin-bottom:16px"
            oninput="document.querySelectorAll('.disease-checkbox').forEach(cb=>{const label=cb.closest('label');const match=label.textContent.toLowerCase().includes(this.value.toLowerCase());label.style.display=match?'':'none'})">

          ${categoryHtml}

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" class="disease-checkbox" value="custom" data-name="その他（自由記入）"
                ${selected.includes('custom') ? 'checked' : ''}
                onchange="app.toggleDiseaseSelection(this)"
                style="width:16px;height:16px;accent-color:var(--accent)">
              <span style="font-weight:600">その他（自由記入）</span>
            </label>
            <input type="text" class="form-input" id="custom-disease-name" placeholder="疾患名を入力..." style="margin-top:8px;display:${selected.includes('custom') ? 'block' : 'none'}">
          </div>
        </div>
      </div>

      <!-- Step 2: Login -->
      <div class="login-card">
        <div style="font-size:14px;font-weight:600;margin-bottom:12px">Step 2: ログイン</div>
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
      </div>
    </div>
  </div>`;
};

// Disease Selection (for changing diseases later, from settings)
App.prototype.render_disease_select = function() {
  // Redirect to login which now includes disease selection
  app.navigate('login');
  return '';
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

  // Show all selected diseases
  const selectedDiseases = store.get('selectedDiseases') || [];
  const diseaseNames = [];
  selectedDiseases.forEach(id => {
    if (id === 'custom') { diseaseNames.push(store.get('customDiseaseName') || 'その他'); return; }
    for (const cat of CONFIG.DISEASE_CATEGORIES) {
      const found = cat.diseases.find(d => d.id === id);
      if (found) { diseaseNames.push(found.name); break; }
    }
  });
  const diseaseTagsHtml = diseaseNames.length > 0
    ? diseaseNames.map(n => `<span class="tag tag-accent" style="font-size:10px">${n}</span>`).join(' ')
    : `<span class="tag tag-accent" style="font-size:10px">${disease.name}</span>`;

  const latestParsed = latestAnalysis?.parsed || latestAnalysis?.result || {};
  const latestAlerts = latestParsed.riskAlerts || [];
  const allRecs = recs.length > 0 ? recs : (latestParsed.recommendations || []);
  const hasData = totalEntries > 0 || totalSymptoms > 0;

  // Build AI-enriched recent entries (last 5)
  const recentAll = textEntries.slice(-5).reverse();
  const enrichedEntries = recentAll.map(e => {
    const insight = app.generateQuickInsight(e.content || '');
    return { ...e, _insight: insight };
  });

  // Welcome message for new users
  const welcomeHtml = !hasData ? `
    <div class="card" style="margin-bottom:20px;border-color:var(--success);background:var(--success-bg)">
      <div class="card-body" style="text-align:center;padding:30px">
        <div style="font-size:36px;margin-bottom:12px">👋</div>
        <h3 style="font-size:16px;font-weight:600;margin-bottom:8px">ようこそ ChronicCare AI へ</h3>
        <p style="font-size:13px;color:var(--text-secondary);max-width:500px;margin:0 auto 16px;line-height:1.7">
          まずは上の入力欄に今日の体調を書いてみてください。<br>
          書くだけでAIが即座に分析し、あなたに合ったアドバイスを表示します。
        </p>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('dash-quick-input').focus()">体調を書く</button>
          <button class="btn btn-secondary btn-sm" onclick="app.navigate('data-input')">詳しく記録する</button>
        </div>
      </div>
    </div>` : '';

  return `
  <!-- 1. Quick Input Area (always top) -->
  <div class="card" style="margin-bottom:16px;border-color:var(--accent-border)">
    <div class="card-body" style="padding:14px 18px">
      <div style="display:flex;gap:12px;align-items:start">
        <div style="flex:1">
          <textarea class="form-textarea" id="dash-quick-input" rows="2"
            style="border:none;background:transparent;resize:none;font-size:14px;padding:0;min-height:auto"
            placeholder="今日の体調は？（例：頭痛がする、生理2日目で辛い、昨日よく眠れた、薬を飲んだ...）"></textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn btn-primary btn-sm" onclick="app.dashQuickSubmit()">送信</button>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;text-align:center">
            📎
            <input type="file" hidden multiple accept="image/*,.pdf,.csv,.json,.xml,.txt" onchange="app.dashQuickFile(event)">
          </label>
        </div>
      </div>
      <div id="dash-quick-preview" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div>
    </div>
  </div>

  <!-- 2. AI Instant Feedback (appears after input) -->
  <div id="dash-ai-feedback" style="margin-bottom:16px"></div>

  <!-- 3. Welcome for new users OR Enriched Data Feed -->
  ${welcomeHtml}

  ${enrichedEntries.length > 0 ? `
  <div style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 style="font-size:15px;font-weight:600">あなたの記録</h3>
      <button class="btn btn-outline btn-sm" onclick="app.navigate('timeline')">すべて見る（${totalEntries}件）</button>
    </div>
    ${enrichedEntries.map((e, i) => {
      const content = e.content || '';
      const isLong = content.length > 100;
      const preview = content.substring(0, 100).replace(/\n/g, ' ');
      const eid = 'rec-' + (e.id || i);
      return `
      <div class="card" style="margin-bottom:8px;border-left:3px solid var(--accent)">
        <div style="padding:10px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"
          onclick="var b=document.getElementById('${eid}');b.style.display=b.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=b.style.display==='none'?'▸':'▾'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <span style="font-size:12px;font-weight:600">${e.title || new Date(e.timestamp).toLocaleDateString('ja-JP')}</span>
              <span style="font-size:10px;color:var(--text-muted)">${new Date(e.timestamp).toLocaleDateString('ja-JP', {month:'short',day:'numeric',weekday:'short'})}</span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}${isLong ? '...' : ''}</div>
          </div>
          <span class="arrow" style="font-size:12px;color:var(--text-muted);margin-left:8px;flex-shrink:0">▸</span>
        </div>
        <div id="${eid}" style="display:none;padding:0 16px 12px">
          <div style="font-size:13px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${content}</div>
          ${e._insight ? `<div style="padding:6px 10px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--accent);margin-top:8px"><strong>AI:</strong> ${e._insight}</div>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- 4. Calendar Widget -->
  ${CalendarIntegration.renderWidget()}

  <!-- 5. Recommendations -->
  ${allRecs.length > 0 ? `
  <div style="margin-bottom:20px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:10px">あなたへの推奨</h3>
    ${allRecs.slice(0, 3).map(r => Components.recommendationCard(r)).join('')}
    ${allRecs.length > 3 ? `<button class="btn btn-outline btn-sm" onclick="app.navigate('actions')">すべて見る →</button>` : ''}
  </div>` : ''}

  <!-- 5. Dynamic Recommendations (based on user data) -->
  <div style="margin-bottom:20px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:10px">あなたへのおすすめ</h3>
    <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px">
      ${app.generateDynamicRecommendations().map(item => `
        <a href="${item.url}" target="_blank" rel="noopener"
          onclick="affiliateEngine.trackClick('${item.id}','${item.store === 'iherb' ? 'iherb' : 'amazon_jp'}','supplement')"
          class="card" style="min-width:170px;flex-shrink:0;text-decoration:none;color:inherit">
          <div class="card-body" style="padding:12px;text-align:center">
            <div style="font-size:20px;margin-bottom:4px">${item.icon}</div>
            <div style="font-size:12px;font-weight:600">${item.name}</div>
            <div style="font-size:10px;color:var(--text-muted)">${item.desc}</div>
            <div style="font-size:10px;color:var(--accent);margin-top:4px">${item.store === 'iherb' ? 'iHerb' : 'Amazon'} →</div>
          </div>
        </a>
      `).join('')}
      <div class="card" style="min-width:140px;flex-shrink:0;cursor:pointer" onclick="app.navigate('actions')">
        <div class="card-body" style="padding:12px;text-align:center">
          <div style="font-size:20px;margin-bottom:4px">→</div>
          <div style="font-size:12px;font-weight:600">もっと見る</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. Simple condition tracker + chart (bottom) -->
  ${hasData ? `
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:16px 20px">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="text-align:center;min-width:80px">
          <div style="font-size:32px;font-weight:800;color:${score >= 60 ? 'var(--success)' : score >= 35 ? 'var(--warning)' : 'var(--danger)'}">${score}</div>
          <div style="font-size:10px;color:var(--text-muted)">体調スコア</div>
        </div>
        <div style="flex:1;font-size:13px;color:var(--text-secondary);line-height:1.7">
          ${score >= 60 ? '比較的安定した状態です。この調子を維持しましょう。' :
            score >= 35 ? '少し注意が必要な状態です。無理せず休息を取ってください。' :
            '体調が優れない状態です。安静を優先し、必要であれば医療機関に相談してください。'}
        </div>
        <div style="font-size:11px;color:var(--text-muted);text-align:right;min-width:60px">${totalEntries + totalSymptoms}件<br>記録済</div>
      </div>
    </div>
  </div>
  ${symptoms.length > 0 ? `
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">トレンド</span></div>
    <div class="card-body" style="height:220px"><canvas id="symptom-chart"></canvas></div>
  </div>` : ''}
  ` : ''}

  <!-- Disease tags -->
  <div style="display:flex;flex-wrap:wrap;gap:4px">${diseaseTagsHtml}</div>`;
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

  <!-- Recommended Test Kits -->
  <div style="margin-top:24px;margin-bottom:24px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">🧪 推奨検査キット・ラボ</h3>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">あなたの疾患プロファイルに基づく検査推奨</p>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${CONFIG.TEST_KITS.map(tk => `
        <div class="card">
          <div class="card-body" style="padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <div class="action-card-title" style="font-size:13px">${tk.name}</div>
              <span class="tag tag-info" style="font-size:10px;white-space:nowrap">${tk.where}</span>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">${tk.description}</p>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent)">${tk.price}</span>
              ${tk.url ? `<a href="${tk.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary"
                onclick="affiliateEngine.trackClick('${tk.id}','amazon_jp','test_kit')">購入・予約</a>` : `<span style="font-size:11px;color:var(--text-muted)">医師に相談</span>`}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

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
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">最新研究アップデート</h2>
      <p style="font-size:13px;color:var(--text-secondary)">PubMedからME/CFSの最新論文をリアルタイム検索</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="app.searchPubMedLive()">PubMed検索</button>
      <button class="btn btn-outline btn-sm" onclick="app.runAnalysis('mecfs_research')">AI分析で研究スキャン</button>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-body" style="padding:14px 20px">
      <div style="display:flex;gap:10px">
        <input type="text" class="form-input" id="pubmed-search-query" value="ME/CFS OR myalgic encephalomyelitis OR chronic fatigue syndrome" placeholder="検索キーワード..." style="flex:1">
        <select class="form-select" id="pubmed-search-days" style="width:120px">
          <option value="7">過去7日</option>
          <option value="30" selected>過去30日</option>
          <option value="90">過去90日</option>
          <option value="365">過去1年</option>
        </select>
        <button class="btn btn-primary" onclick="app.searchPubMedLive()">検索</button>
      </div>
    </div>
  </div>

  <!-- PubMed Results -->
  <div id="pubmed-results">
    ${updates.length > 0
      ? '<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">AI分析による研究レポート</h3>' + updates.map(r => Components.researchCard(r)).join('')
      : Components.emptyState('🔬', 'PubMed検索を実行してください', '上の「PubMed検索」ボタンをクリックするとME/CFSの最新論文が表示されます。')}
  </div>`;
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
  // Collect ALL data sources
  const allEntries = [];

  // Text entries (diary, notes)
  (store.get('textEntries') || []).forEach(d => allEntries.push({
    ...d, _type: 'text', _icon: '📝', _label: d.title || '日記',
    _category: d.category || 'other'
  }));

  // Symptoms
  (store.get('symptoms') || []).forEach(d => {
    if (d.text_note) {
      allEntries.push({ ...d, _type: 'symptom_note', _icon: '📝', _label: d.title || '症状メモ' });
    } else {
      allEntries.push({ ...d, _type: 'symptom_data', _icon: '📊', _label: '症状スコア' });
    }
  });

  // Vitals
  (store.get('vitals') || []).forEach(d => allEntries.push({
    ...d, _type: 'vitals', _icon: '💓', _label: 'バイタル'
  }));

  // Blood tests
  (store.get('bloodTests') || []).forEach(d => allEntries.push({
    ...d, _type: 'blood', _icon: '🩸', _label: '血液検査'
  }));

  // Medications
  (store.get('medications') || []).forEach(d => allEntries.push({
    ...d, _type: 'medication', _icon: '💊', _label: '服薬記録'
  }));

  // Sleep
  (store.get('sleepData') || []).forEach(d => allEntries.push({
    ...d, _type: 'sleep', _icon: '😴', _label: '睡眠'
  }));

  // Activity
  (store.get('activityData') || []).forEach(d => allEntries.push({
    ...d, _type: 'activity', _icon: '🚶', _label: '活動量'
  }));

  // Photos
  (store.get('photos') || []).forEach(d => allEntries.push({
    ...d, _type: 'photo', _icon: '📸', _label: d.filename || '写真'
  }));

  // Conversation history (AI chat)
  (store.get('conversationHistory') || []).filter(c => c.type === 'data_entry').forEach(d => {
    // Already in textEntries, skip duplicates
  });

  // Sort by timestamp (newest first)
  allEntries.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  // Group by date
  const byDate = {};
  allEntries.forEach(e => {
    const dateKey = e.timestamp ? new Date(e.timestamp).toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'short' }) : '日付不明';
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(e);
  });

  // Category labels for filter
  const categoryLabels = {
    text: '日記・メモ', symptom_note: '症状メモ', symptom_data: '症状スコア',
    vitals: 'バイタル', blood: '血液検査', medication: '服薬',
    sleep: '睡眠', activity: '活動', photo: '写真'
  };

  // Render entries
  const renderEntry = (e) => {
    const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' }) : '';
    const skipKeys = ['id', 'timestamp', 'category', '_type', '_icon', '_label', '_category', 'createdAt', '_synced', 'type', 'source', 'dataUrl'];

    // Text entries - show formatted content
    if (e._type === 'text' || e._type === 'symptom_note') {
      const content = e.content || e.text_note || '';
      const aiInsight = app.generateQuickInsight(content);
      return `
        <div class="card" style="margin-bottom:10px;border-left:3px solid var(--accent)">
          <div class="card-body" style="padding:12px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span>${e._icon}</span>
                <span style="font-size:12px;font-weight:600">${e._label}</span>
                ${e._category ? `<span class="tag tag-accent" style="font-size:9px">${e._category}</span>` : ''}
              </div>
              <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${time}</span>
            </div>
            <div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap;margin-bottom:8px">${content}</div>
            ${aiInsight ? `<div style="padding:8px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--accent)"><strong>AI:</strong> ${aiInsight}</div>` : ''}
          </div>
        </div>`;
    }

    // Symptom scores
    if (e._type === 'symptom_data') {
      const fields = [];
      if (e.fatigue_level != null) fields.push(`疲労: ${e.fatigue_level}/7`);
      if (e.pain_level != null) fields.push(`痛み: ${e.pain_level}/7`);
      if (e.brain_fog != null) fields.push(`脳霧: ${e.brain_fog}/7`);
      if (e.sleep_quality != null) fields.push(`睡眠: ${e.sleep_quality}/7`);
      if (e.pem_status) fields.push('PEM: あり');
      const avgScore = fields.length > 0 ? '（平均 ' + (((e.fatigue_level||0)+(e.pain_level||0)+(e.brain_fog||0))/3).toFixed(1) + '/7）' : '';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
          <span>${e._icon}</span>
          <span style="font-size:12px;flex:1">${fields.join(' | ')}</span>
          <span style="font-size:11px;color:var(--text-muted)">${avgScore} ${time}</span>
        </div>`;
    }

    // Vitals
    if (e._type === 'vitals') {
      const fields = [];
      if (e.heart_rate) fields.push(`HR: ${e.heart_rate}bpm`);
      if (e.temperature) fields.push(`体温: ${e.temperature}°C`);
      if (e.spo2) fields.push(`SpO2: ${e.spo2}%`);
      if (e.bp_systolic) fields.push(`BP: ${e.bp_systolic}/${e.bp_diastolic}`);
      if (e.hrv) fields.push(`HRV: ${e.hrv}ms`);
      if (e.weight) fields.push(`体重: ${e.weight}kg`);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
          <span>💓</span>
          <span style="font-size:12px;flex:1">${fields.join(' | ') || 'バイタルデータ'}</span>
          <span style="font-size:11px;color:var(--text-muted)">${time}</span>
        </div>`;
    }

    // Photos
    if (e._type === 'photo') {
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
          <span>📸</span>
          <span style="font-size:12px;flex:1">${e.filename || '画像'} (${e.type || ''}, ${e.size ? (e.size/1024).toFixed(0)+'KB' : ''})</span>
          <span style="font-size:11px;color:var(--text-muted)">${time}</span>
        </div>`;
    }

    // Generic data entry
    const dataFields = Object.entries(e)
      .filter(([k, v]) => !skipKeys.includes(k) && v != null && v !== '' && !k.startsWith('_'))
      .map(([k, v]) => `<span style="margin-right:12px"><strong style="color:var(--text-muted)">${k}:</strong> ${v}</span>`)
      .join('');
    return `
      <div style="display:flex;align-items:start;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
        <span>${e._icon}</span>
        <div style="font-size:12px;flex:1;line-height:1.6">${dataFields || e._label}</div>
        <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${time}</span>
      </div>`;
  };

  // Render by date
  const dateGroups = Object.entries(byDate).map(([dateStr, entries]) => `
    <div style="margin-bottom:24px">
      <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid var(--accent);display:inline-block">${dateStr}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;display:inline;margin-left:10px">${entries.length}件</div>
      ${entries.map(renderEntry).join('')}
    </div>
  `).join('');

  return `
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:4px">経過・データ一覧</h2>
      <p style="font-size:12px;color:var(--text-muted)">${allEntries.length}件のデータ（日記・検査・薬剤・バイタル・写真）</p>
    </div>
    <div style="display:flex;gap:8px">
      <select class="form-select" style="width:auto;font-size:12px" onchange="app.filterTimeline(this.value)">
        <option value="">すべて表示</option>
        ${Object.entries(categoryLabels).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
      </select>
    </div>
  </div>
  <div id="timeline-content">
    ${allEntries.length > 0 ? dateGroups : Components.emptyState('📅', 'データがありません', 'ダッシュボードから体調を記録すると、ここに時系列で表示されます。')}
  </div>`;
};

// Integrations Page
App.prototype.render_integrations = function() {
  const userEmail = Integrations.generateUserEmail();
  const fitbitConnected = Integrations.fitbit.connected;
  const shortcutInfo = Integrations.appleHealth.getShortcutInstructions();

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">デバイス・サービス連携</h2>
    <p style="font-size:13px;color:var(--text-secondary)">外部デバイスやサービスからデータを自動取り込み</p>
  </div>

  <!-- Your Data Ingestion Email -->
  <div class="card" style="margin-bottom:24px;border-color:var(--accent-border)">
    <div class="card-header" style="background:var(--accent-bg)">
      <span class="card-title">📧 あなた専用のデータ受信メールアドレス</span>
    </div>
    <div class="card-body">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">以下のメールアドレスにデータを送信すると自動で取り込まれます。Plaudの転送先やiOSショートカットの送信先に設定してください。</p>
      <div style="display:flex;align-items:center;gap:10px;padding:14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
        <code style="font-size:15px;font-weight:600;color:var(--accent);flex:1;font-family:'JetBrains Mono',monospace">${userEmail}</code>
        <button class="btn btn-sm btn-primary" onclick="navigator.clipboard.writeText('${userEmail}');Components.showToast('コピーしました','success')">コピー</button>
      </div>
      <p style="font-size:11px;color:var(--text-muted);margin-top:8px">※ メール受信にはバックエンドサーバーの設定が必要です（Cloudflare Email Workers等）。手動の場合は下の各セクションからペースト/アップロードできます。</p>
    </div>
  </div>

  <div class="grid grid-3" style="margin-bottom:24px">
    <!-- Plaud Card -->
    <div class="stat-card" style="text-align:center;cursor:pointer" onclick="document.getElementById('plaud-section').scrollIntoView({behavior:'smooth'})">
      <div style="font-size:32px;margin-bottom:8px">🎙️</div>
      <div class="stat-card-label">Plaud</div>
      <div style="font-size:14px;font-weight:600">会話記録</div>
      <p style="font-size:11px;color:var(--text-muted);margin-top:4px">音声→テキスト→AI分析</p>
    </div>

    <!-- Fitbit Card -->
    <div class="stat-card" style="text-align:center;cursor:pointer" onclick="document.getElementById('fitbit-section').scrollIntoView({behavior:'smooth'})">
      <div style="font-size:32px;margin-bottom:8px">⌚</div>
      <div class="stat-card-label">Fitbit</div>
      <div style="font-size:14px;font-weight:600">${fitbitConnected ? '<span style="color:var(--success)">接続中</span>' : '未接続'}</div>
      <p style="font-size:11px;color:var(--text-muted);margin-top:4px">心拍・睡眠・活動量</p>
    </div>

    <!-- Apple Health Card -->
    <div class="stat-card" style="text-align:center;cursor:pointer" onclick="document.getElementById('apple-section').scrollIntoView({behavior:'smooth'})">
      <div style="font-size:32px;margin-bottom:8px">🍎</div>
      <div class="stat-card-label">Apple Health</div>
      <div style="font-size:14px;font-weight:600">iPhone連携</div>
      <p style="font-size:11px;color:var(--text-muted);margin-top:4px">ヘルスケアデータ取込</p>
    </div>
  </div>

  <!-- GOOGLE CALENDAR SECTION -->
  <div class="card" style="margin-bottom:24px" id="gcal-section">
    <div class="card-header">
      <span class="card-title">📅 Googleカレンダー連携</span>
      <span class="tag ${(store.get('calendarEvents')||[]).length > 0 ? 'tag-success' : 'tag-warning'}">${(store.get('calendarEvents')||[]).length > 0 ? (store.get('calendarEvents')||[]).length + '件同��済' : '未同期'}</span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">スケジュール情報からPEM予防のための活動量管理���AIが分析します。現在はClaude Codeセッ���ョンから手��同期です。</p>
      <div style="background:var(--bg-tertiary);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="font-size:12px;color:var(--text-secondary)">
          <strong>同期��法：</strong>このClaude Codeチャッ��で「カレンダーを同期して」と依頼してください。自動でGoogleカレンダーからデータを取得しダッシュボードに反映します。
        </div>
      </div>
      ${(store.get('calendarEvents')||[]).length > 0 ? `
        <div style="font-size:12px;color:var(--success)">最終同期: ${(store.get('calendarEvents')||[]).length}件のイベント</div>
      ` : ''}
    </div>
  </div>

  <!-- PLAUD SECTION -->
  <div class="card" style="margin-bottom:24px" id="plaud-section">
    <div class="card-header">
      <span class="card-title">🎙️ Plaud 会話記録連携</span>
      <span class="tag tag-info">メール転送 or ペースト</span>
    </div>
    <div class="card-body">
      <div style="background:var(--bg-tertiary);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px">
        <h4 style="font-size:13px;font-weight:600;margin-bottom:8px">自動連携の設定方法</h4>
        <ol style="font-size:12px;color:var(--text-secondary);line-height:2;padding-left:20px">
          <li>Plaudアプリを開く</li>
          <li>設定 → 共有 → メール転送先を追加</li>
          <li>転送先に <strong>${userEmail}</strong> を入力</li>
          <li>以降、録音→文字起こし完了時に自動転送されます</li>
        </ol>
      </div>

      <h4 style="font-size:13px;font-weight:600;margin-bottom:8px">手動ペースト</h4>
      <div class="form-group">
        <label class="form-label">会話の日付</label>
        <input type="date" class="form-input" id="plaud-date" value="${new Date().toISOString().split('T')[0]}" style="width:200px">
      </div>
      <div class="form-group">
        <label class="form-label">タイトル（例：山村先生診察、友人との会話）</label>
        <input type="text" class="form-input" id="plaud-title" placeholder="会話のタイトル...">
      </div>
      <div class="form-group">
        <label class="form-label">文字起こしテキスト</label>
        <textarea class="form-textarea" id="plaud-transcript" rows="8" placeholder="Plaudの文字起こし結果をここにペーストしてください...&#10;&#10;[00:00] 先生: 最近の体調はいかがですか？&#10;[00:05] 自分: 倦怠感が続いていて..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="app.importPlaudTranscript()">取り込み＆AI分析</button>
    </div>
  </div>

  <!-- FITBIT SECTION -->
  <div class="card" style="margin-bottom:24px" id="fitbit-section">
    <div class="card-header">
      <span class="card-title">⌚ Fitbit連携</span>
      <span class="tag ${fitbitConnected ? 'tag-success' : 'tag-warning'}">${fitbitConnected ? '接続中' : '未接続'}</span>
    </div>
    <div class="card-body">
      ${fitbitConnected ? `
        <p style="font-size:13px;color:var(--success);margin-bottom:16px">Fitbitに接続されています。データを取り込めます。</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
          <button class="btn btn-primary" onclick="app.importFitbitToday()">今日のデータを取得</button>
          <button class="btn btn-secondary" onclick="app.importFitbitHistory()">過去7日分を取得</button>
          <button class="btn btn-outline btn-danger" onclick="Integrations.fitbit.disconnect();app.navigate('integrations')">接続解除</button>
        </div>
        <div id="fitbit-import-status"></div>
      ` : `
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">FitbitアカウントをOAuth2で接続すると、心拍数・睡眠・歩数・活動量を自動取得できます。</p>
        <div style="background:var(--bg-tertiary);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px">
          <h4 style="font-size:13px;font-weight:600;margin-bottom:8px">接続手順</h4>
          <ol style="font-size:12px;color:var(--text-secondary);line-height:2;padding-left:20px">
            <li><a href="https://dev.fitbit.com/apps/new" target="_blank" rel="noopener" style="color:var(--accent)">Fitbit開発者ポータル</a>でアプリを登録（OAuth 2.0 Application Type: Personal）</li>
            <li>Redirect URLに <code style="background:var(--bg-primary);padding:2px 6px;border-radius:4px">${window.location.origin + window.location.pathname}</code> を設定</li>
            <li>取得したClient IDを下に入力</li>
            <li>「Fitbitに接続」ボタンをクリック</li>
          </ol>
        </div>
        <div class="form-group">
          <label class="form-label">Fitbit OAuth2 Client ID</label>
          <input type="text" class="form-input" id="fitbit-client-id" value="${localStorage.getItem('fitbit_client_id') || ''}" placeholder="23XXXX">
        </div>
        <button class="btn btn-primary" onclick="app.connectFitbit()">Fitbitに接続</button>
      `}
    </div>
  </div>

  <!-- APPLE HEALTH SECTION -->
  <div class="card" style="margin-bottom:24px" id="apple-section">
    <div class="card-header">
      <span class="card-title">🍎 Apple Health / iPhone連携</span>
      <span class="tag tag-info">エクスポート & ショートカット</span>
    </div>
    <div class="card-body">
      <div class="grid grid-2" style="gap:20px">
        <!-- Method 1: XML Export -->
        <div>
          <h4 style="font-size:13px;font-weight:600;margin-bottom:10px">方法1: XMLエクスポート（一括取込）</h4>
          <ol style="font-size:12px;color:var(--text-secondary);line-height:2;padding-left:20px;margin-bottom:16px">
            <li>iPhoneの「ヘルスケア」アプリを開く</li>
            <li>右上のプロフィールアイコンをタップ</li>
            <li>「すべてのヘルスケアデータを書き出す」</li>
            <li>書き出したZIPを解凍し、<code>export.xml</code>を下にドロップ</li>
          </ol>
          <div class="upload-area" style="padding:24px"
            onclick="document.getElementById('apple-health-file').click()"
            ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
            ondragleave="this.style.borderColor='var(--border)'"
            ondrop="event.preventDefault();app.importAppleHealthFile(event.dataTransfer.files[0])">
            <div style="font-size:24px;margin-bottom:8px">📄</div>
            <div style="font-size:13px">export.xml をドロップ</div>
            <input type="file" id="apple-health-file" hidden accept=".xml" onchange="app.importAppleHealthFile(this.files[0])">
          </div>
        </div>

        <!-- Method 2: iOS Shortcut -->
        <div>
          <h4 style="font-size:13px;font-weight:600;margin-bottom:10px">方法2: iOSショートカット（毎日自動）</h4>
          <ol style="font-size:12px;color:var(--text-secondary);line-height:2;padding-left:20px">
            ${shortcutInfo.steps.map(s => s ? `<li>${s}</li>` : '').join('')}
          </ol>
        </div>
      </div>
      <div id="apple-import-status" style="margin-top:16px"></div>
    </div>
  </div>

  <!-- Generic File Import -->
  <div class="card">
    <div class="card-header"><span class="card-title">📁 汎用ファイルインポート</span></div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">CSV, JSON, XML, テキストファイルを自動判別して取り込みます</p>
      <div class="upload-area" style="padding:24px"
        onclick="document.getElementById('generic-import-file').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
        ondragleave="this.style.borderColor='var(--border)'"
        ondrop="event.preventDefault();Array.from(event.dataTransfer.files).forEach(f=>Integrations.importFile(f))">
        <div style="font-size:24px;margin-bottom:8px">📁</div>
        <div style="font-size:13px">ファイルをドロップまたはクリック</div>
        <div style="font-size:11px;color:var(--text-muted)">対応形式: XML (Apple Health), CSV, JSON, TXT (Plaud)</div>
        <input type="file" id="generic-import-file" hidden multiple accept=".xml,.csv,.json,.txt" onchange="Array.from(this.files).forEach(f=>Integrations.importFile(f))">
      </div>
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

  // Group prompts by disease
  const promptsByDisease = {};
  Object.entries(prompts).forEach(([key, p]) => {
    const group = p.disease || '_universal';
    if (!promptsByDisease[group]) promptsByDisease[group] = [];
    promptsByDisease[group].push({ key, ...p });
  });

  const diseaseLabels = { '_universal': '共通（全疾患・健常者）' };
  CONFIG.DISEASE_CATEGORIES.forEach(cat => {
    cat.diseases.forEach(d => { diseaseLabels[d.id] = d.name; });
  });

  const promptEditors = Object.entries(promptsByDisease).map(([diseaseId, promptList]) => `
    <div style="margin-bottom:24px">
      <h4 style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:10px;padding:6px 12px;background:var(--accent-bg);border-radius:var(--radius-xs);display:inline-block">${diseaseLabels[diseaseId] || diseaseId}（${promptList.length}件）</h4>
      ${promptList.map(p => `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="padding:14px 20px">
            <div style="flex:1">
              <input class="form-input" data-prompt-name="${p.key}" value="${p.name}"
                style="font-weight:600;border:none;background:transparent;padding:0;font-size:14px;color:var(--text-primary);width:100%">
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${p.description || ''}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
              <select class="form-select" data-prompt-disease="${p.key}" style="font-size:11px;padding:4px 8px;width:auto">
                <option value="_universal" ${(p.disease||'_universal')==='_universal'?'selected':''}>共通</option>
                ${CONFIG.DISEASE_CATEGORIES.map(cat => `<optgroup label="${cat.name}">${cat.diseases.map(d => `<option value="${d.id}" ${p.disease===d.id?'selected':''}>${d.name}</option>`).join('')}</optgroup>`).join('')}
              </select>
              <select class="form-select" data-prompt-schedule="${p.key}" style="font-size:11px;padding:4px 8px;width:auto">
                <option value="daily" ${p.schedule==='daily'?'selected':''}>毎日</option>
                <option value="weekly" ${p.schedule==='weekly'?'selected':''}>毎週</option>
                <option value="on_data_update" ${p.schedule==='on_data_update'?'selected':''}>データ更新時</option>
                <option value="manual" ${p.schedule==='manual'?'selected':''}>手動</option>
              </select>
              <button class="btn btn-primary btn-sm" onclick="app.savePrompt('${p.key}')" style="padding:5px 12px">保存</button>
              <button class="btn btn-danger btn-sm" onclick="if(confirm('削除しますか？'))app.deletePrompt('${p.key}')" style="padding:5px 10px">×</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <textarea class="form-textarea" data-prompt-text="${p.key}"
              style="min-height:300px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;border:none;border-radius:0;border-top:1px solid var(--border);resize:vertical">${p.prompt}</textarea>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  const affConfig = store.get('affiliateConfig') || {};
  const affFields = CONFIG.AFFILIATE_NETWORKS.map(n => `
    <div class="form-group" style="display:flex;align-items:center;gap:12px">
      <label style="min-width:120px;font-size:13px;font-weight:500">${n.name}</label>
      <input class="form-input" name="aff_${n.id}" value="${affConfig[n.id]?.tag || n.tag || n.code || ''}" placeholder="タグ/コード" style="flex:1">
    </div>
  `).join('');

  // Flat list of all prompts for table view
  const allPromptsList = Object.entries(prompts);
  const totalPrompts = allPromptsList.length;

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">管理パネル</h2>
  </div>

  <!-- Admin Tabs -->
  <div class="tabs" id="admin-tabs">
    <div class="tab active" onclick="app.switchAdminTab('prompts')">プロンプト管理（${totalPrompts}）</div>
    <div class="tab" onclick="app.switchAdminTab('models')">AIモデル</div>
    <div class="tab" onclick="app.switchAdminTab('api')">APIキー</div>
    <div class="tab" onclick="app.switchAdminTab('affiliate')">アフィリエイト</div>
    <div class="tab" onclick="app.switchAdminTab('firebase')">Firebase</div>
    <div class="tab" onclick="app.switchAdminTab('data')">データ管理</div>
  </div>

  <!-- TAB: Prompts -->
  <div class="admin-tab-content" id="admin-tab-prompts">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <h3 style="font-size:15px;font-weight:600">全プロンプト一覧</h3>
        <p style="font-size:12px;color:var(--text-muted)">疾患別に分類されたAI分析プロンプト。クリックして編集。</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="app.addNewPrompt()">+ 新規プロンプト</button>
        <button class="btn btn-secondary btn-sm" onclick="app.resetPromptsToDefault()">デフォルトに戻す</button>
      </div>
    </div>

    <!-- Prompt Filter -->
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <input type="text" class="form-input" placeholder="プロンプト名で検索..."
        style="flex:1" oninput="app.filterPrompts(this.value)">
      <select class="form-select" style="width:auto" onchange="app.filterPromptsByDisease(this.value)">
        <option value="">すべての疾患</option>
        <option value="_universal">共通</option>
        ${CONFIG.DISEASE_CATEGORIES.map(cat => `<optgroup label="${cat.name}">${cat.diseases.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</optgroup>`).join('')}
      </select>
    </div>

    <!-- Prompt List -->
    <div id="prompt-list">
      ${allPromptsList.map(([key, p], idx) => `
        <div class="card prompt-item" data-prompt-key="${key}" data-disease="${p.disease || '_universal'}" style="margin-bottom:12px">
          <div class="card-header" style="padding:12px 16px;cursor:pointer" onclick="app.togglePromptEdit('${key}')">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
              <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;min-width:24px">${idx+1}</span>
              <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</span>
              <span class="tag tag-accent" style="font-size:9px;flex-shrink:0">${diseaseLabels[p.disease || '_universal'] || p.disease || '共通'}</span>
              <span class="tag ${p.schedule==='daily'?'tag-success':p.schedule==='weekly'?'tag-info':'tag-warning'}" style="font-size:9px;flex-shrink:0">${p.schedule || 'manual'}</span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();app.savePrompt('${key}')" style="padding:3px 10px;font-size:11px">保存</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();if(confirm('「${p.name}」を削除しますか？'))app.deletePrompt('${key}')" style="padding:3px 8px;font-size:11px">×</button>
            </div>
          </div>
          <div class="card-body" id="prompt-edit-${key}" style="padding:0;display:none">
            <div style="display:flex;gap:10px;padding:12px 16px;background:var(--bg-tertiary);border-bottom:1px solid var(--border);flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">名前</label>
                <input class="form-input" data-prompt-name="${key}" value="${p.name}" style="font-size:13px">
              </div>
              <div style="min-width:160px">
                <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">対象疾患</label>
                <select class="form-select" data-prompt-disease="${key}" style="font-size:12px">
                  <option value="_universal" ${(p.disease||'_universal')==='_universal'?'selected':''}>共通（全疾患）</option>
                  ${CONFIG.DISEASE_CATEGORIES.map(cat => `<optgroup label="${cat.name}">${cat.diseases.map(d => `<option value="${d.id}" ${p.disease===d.id?'selected':''}>${d.name}</option>`).join('')}</optgroup>`).join('')}
                </select>
              </div>
              <div style="min-width:120px">
                <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">スケジュール</label>
                <select class="form-select" data-prompt-schedule="${key}" style="font-size:12px">
                  <option value="daily" ${p.schedule==='daily'?'selected':''}>毎日</option>
                  <option value="weekly" ${p.schedule==='weekly'?'selected':''}>毎週</option>
                  <option value="on_data_update" ${p.schedule==='on_data_update'?'selected':''}>データ更新時</option>
                  <option value="manual" ${p.schedule==='manual'?'selected':''}>手動</option>
                </select>
              </div>
            </div>
            <textarea class="form-textarea" data-prompt-text="${key}"
              style="min-height:400px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.8;border:none;border-radius:0;resize:vertical;padding:16px">${p.prompt}</textarea>
            <div style="padding:10px 16px;background:var(--bg-tertiary);border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;color:var(--text-muted)">${(p.prompt || '').length}文字</span>
              <button class="btn btn-primary btn-sm" onclick="app.savePrompt('${key}')">保存</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- TAB: Models -->
  <div class="admin-tab-content" id="admin-tab-models" style="display:none">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">AIモデル選択</h3>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      ${modelCards}
    </div>
  </div>

  <!-- TAB: API Keys -->
  <div class="admin-tab-content" id="admin-tab-api" style="display:none">
  <div class="card" style="margin-bottom:28px">
    <div class="card-header">
      <span class="card-title">APIキー設定</span>
      <span class="tag" id="api-key-status">確認中...</span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">APIキーを設定すると、Claude/GPT/Geminiによるリアルタイム分析が有効になります。未設定時はローカルキーワード分析を使用します。</p>
      <div class="form-group">
        <label class="form-label">Anthropic API Key（Claude Sonnet/Opus/Haiku）</label>
        <input type="text" class="form-input" id="input-apikey-anthropic" placeholder="sk-ant-api03-..." autocomplete="off">
        <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">console.anthropic.com でキーを取得</span>
      </div>
      <div class="form-group">
        <label class="form-label">OpenAI API Key（GPT-4o）</label>
        <input type="text" class="form-input" id="input-apikey-openai" placeholder="sk-proj-..." autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">Google AI API Key（Gemini 2.5 Pro）</label>
        <input type="text" class="form-input" id="input-apikey-google" placeholder="AIza..." autocomplete="off">
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" onclick="app.saveApiKeys()">APIキーを保存</button>
        <button class="btn btn-danger btn-sm" onclick="app.clearApiKeys()">すべて削除</button>
      </div>
    </div>
  </div>

  </div>

  <!-- TAB: Affiliate -->
  <div class="admin-tab-content" id="admin-tab-affiliate" style="display:none">
  <div class="card" style="margin-bottom:28px">
    <div class="card-header"><span class="card-title">アフィリエイト設定</span></div>
    <div class="card-body">
      <form onsubmit="app.saveAffiliateConfig(event)">
        ${affFields}
        <button type="submit" class="btn btn-primary btn-sm" style="margin-top:12px">設定を保存</button>
      </form>
    </div>
  </div>
  </div>

  <!-- TAB: Firebase -->
  <div class="admin-tab-content" id="admin-tab-firebase" style="display:none">
  <div class="card" style="margin-bottom:28px">
    <div class="card-header">
      <span class="card-title">Firebase設定</span>
      <span class="tag" id="firebase-status">確認中...</span>
    </div>
    <div class="card-body">
      <div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="fb-apiKey" placeholder="AIzaSy..." autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Auth Domain</label><input type="text" class="form-input" id="fb-authDomain" placeholder="your-project.firebaseapp.com" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Project ID</label><input type="text" class="form-input" id="fb-projectId" placeholder="your-project-id" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Storage Bucket</label><input type="text" class="form-input" id="fb-storageBucket" placeholder="your-project.appspot.com" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Messaging Sender ID</label><input type="text" class="form-input" id="fb-messagingSenderId" placeholder="123456789" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">App ID</label><input type="text" class="form-input" id="fb-appId" placeholder="1:123456789:web:abc123" autocomplete="off"></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" onclick="app.saveFirebaseConfig()">保存して接続</button>
        <button class="btn btn-danger btn-sm" onclick="app.clearFirebaseConfig()">削除</button>
      </div>
    </div>
  </div>
  </div>

  <!-- TAB: Data -->
  <div class="admin-tab-content" id="admin-tab-data" style="display:none">
  <div class="card">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="app.generateDemoData()">デモデータ生成</button>
      <button class="btn btn-secondary" onclick="app.exportData()">データエクスポート</button>
      <button class="btn btn-danger" onclick="if(confirm('すべてのデータを削除しますか？')){store.clearAll();location.reload()}">データ全削除</button>
    </div>
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

  <!-- Profile & Health Info -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">プロフィール・基本情報</span></div>
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div class="user-avatar" style="width:56px;height:56px;font-size:22px">${user.displayName?.[0] || '?'}</div>
        <div>
          <div style="font-size:16px;font-weight:600">${user.displayName || 'ゲスト'}</div>
          <div style="font-size:13px;color:var(--text-muted)">${user.email || ''}</div>
        </div>
      </div>

      <div class="grid grid-2" style="gap:12px;margin-bottom:16px">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">年齢</label>
          <input type="number" class="form-input" id="profile-age" placeholder="50" min="0" max="120">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">性別</label>
          <select class="form-select" id="profile-gender">
            <option value="">選択してください</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">身長 (cm)</label>
          <input type="number" class="form-input" id="profile-height" placeholder="170" min="100" max="250">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">体重 (kg)</label>
          <input type="number" class="form-input" id="profile-weight" placeholder="65" min="20" max="300">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">居住地（都道府県・市区町村）</label>
        <input type="text" class="form-input" id="profile-location" placeholder="例: 神奈川県秦野市">
      </div>
      <div class="form-group">
        <label class="form-label">通院可能範囲</label>
        <select class="form-select" id="profile-travel-range">
          <option value="local">近隣のみ（市内）</option>
          <option value="prefecture">県内</option>
          <option value="region" selected>関東圏・地方圏</option>
          <option value="national">国内全域</option>
          <option value="international">海外も含む</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">主な言語</label>
        <select class="form-select" id="profile-language">
          <option value="ja" selected>日本語</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">備考（アレルギー、既往歴、家族歴など）</label>
        <textarea class="form-textarea" id="profile-notes" rows="3" placeholder="例: ペニシリンアレルギー、父が糖尿病、母が甲状腺疾患"></textarea>
      </div>

      <button class="btn btn-primary" onclick="app.saveProfile()">プロフィールを保存</button>
      <button class="btn btn-secondary btn-sm" style="margin-left:8px" onclick="app.navigate('login')">疾患設定を変更</button>
    </div>
  </div>



  <!-- Data Migration & Export -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
      <div style="background:var(--warning-bg);border:1px solid var(--warning);border-radius:var(--radius-sm);padding:12px;font-size:12px;color:var(--text-primary)">
        <strong>旧ドメインからのデータ移行</strong><br>
        agewaller.github.io で入力したデータがある場合、以下の手順で移行できます：<br>
        1. <a href="https://agewaller.github.io/stock-screener/dashboard.html" target="_blank" style="color:var(--accent)">旧サイト</a>を開く → 設定 →「すべてのデータをエクスポート」<br>
        2. 下の「データインポート」でそのJSONファイルを選択
      </div>
      <div>
        <label class="form-label">データインポート（JSONファイル）</label>
        <input type="file" class="form-input" accept=".json" onchange="app.importDataFile(this.files[0])">
      </div>
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
    selectedDiseases: store.get('selectedDiseases'),
    symptoms: store.get('symptoms'),
    vitals: store.get('vitals'),
    bloodTests: store.get('bloodTests'),
    medications: store.get('medications'),
    supplements: store.get('supplements'),
    meals: store.get('meals'),
    sleepData: store.get('sleepData'),
    activityData: store.get('activityData'),
    analysisHistory: store.get('analysisHistory'),
    conversationHistory: store.get('conversationHistory'),
    textEntries: store.get('textEntries'),
    customPrompts: store.get('customPrompts'),
    selectedModel: store.get('selectedModel')
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

// Import Data from JSON file
App.prototype.importDataFile = function(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      let count = 0;

      const importKeys = [
        'selectedDisease', 'selectedDiseases', 'symptoms', 'vitals',
        'bloodTests', 'medications', 'supplements', 'meals',
        'sleepData', 'activityData', 'analysisHistory',
        'conversationHistory', 'textEntries', 'customPrompts', 'selectedModel'
      ];

      importKeys.forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          const existing = store.get(key);
          if (Array.isArray(existing) && Array.isArray(data[key])) {
            // Merge arrays (avoid duplicates by id)
            const existingIds = new Set(existing.map(e => e.id).filter(Boolean));
            const newItems = data[key].filter(item => !item.id || !existingIds.has(item.id));
            store.set(key, [...existing, ...newItems]);
            count += newItems.length;
          } else if (!existing || (Array.isArray(existing) && existing.length === 0) || (typeof existing === 'object' && Object.keys(existing).length === 0)) {
            store.set(key, data[key]);
            count++;
          }
        }
      });

      store.calculateHealthScore();
      Components.showToast('データをインポートしました（' + count + '件）', 'success');

      // Sync to Firestore if connected
      if (FirebaseBackend.initialized) {
        FirebaseBackend.loadAllData().then(() => {
          // Re-save all imported data to Firestore
          const textEntries = store.get('textEntries') || [];
          textEntries.forEach(entry => {
            if (!entry._synced) {
              FirebaseBackend.saveHealthEntry('textEntries', entry);
              entry._synced = true;
            }
          });
        });
        Components.showToast('Firestoreに同期中...', 'info');
      }
    } catch (err) {
      Components.showToast('インポートエラー: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
};
