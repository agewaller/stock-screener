/* ============================================================
   Page Renderers - Added to App.prototype
   ============================================================ */

// Login Page - Disease selection first, then login
App.prototype.render_login = function() {
  const cats = CONFIG.DISEASE_CATEGORIES;
  const selected = store.get('selectedDiseases') || [];
  const selectedCount = selected.length;

  const categoryHtml = cats.map(cat => `
    <div style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;cursor:pointer"
        onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'flex':'none';this.querySelector('.toggle').textContent=this.nextElementSibling.style.display==='none'?'+':'-'">
        <span class="toggle" style="font-size:14px;color:var(--accent);font-weight:700;width:16px;text-align:center">+</span>
        <span style="font-size:16px">${cat.icon}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${cat.name}</span>
        <span style="font-size:10px;color:var(--text-muted)">(${cat.diseases.length})</span>
      </div>
      <div style="display:none;flex-wrap:wrap;gap:6px;padding-left:22px">
        ${cat.diseases.map(d => `
          <label style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;background:${selected.includes(d.id)?'var(--accent-bg)':'var(--bg-tertiary)'};border:1px solid ${selected.includes(d.id)?'var(--accent-border)':'transparent'};border-radius:20px;cursor:pointer;font-size:12px;color:${selected.includes(d.id)?'var(--accent)':'var(--text-secondary)'};transition:all 0.15s">
            <input type="checkbox" class="disease-checkbox" value="${d.id}" data-name="${d.name}"
              ${selected.includes(d.id) ? 'checked' : ''}
              onchange="app.toggleDiseaseSelection(this);var l=this.closest('label');if(this.checked){l.style.background='var(--accent-bg)';l.style.border='1px solid var(--accent-border)';l.style.color='var(--accent)'}else{l.style.background='var(--bg-tertiary)';l.style.border='1px solid transparent';l.style.color='var(--text-secondary)'}"
              style="display:none">
            ${d.name}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
  <div class="login-page" style="align-items:flex-start;padding:0;background:#fff;min-height:100vh">
    <div style="width:100%;max-width:520px;margin:0 auto;padding:0 20px">

      <!-- Hero -->
      <!-- Language Selector -->
      <div style="text-align:right;padding:12px 0 0">
        <select style="font-size:11px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;cursor:pointer"
          onchange="i18n.setLang(this.value);location.reload()">
          <option value="ja" ${(store.get('userProfile')?.language || 'ja') === 'ja' ? 'selected' : ''}>日本語</option>
          <option value="en" ${(store.get('userProfile')?.language) === 'en' ? 'selected' : ''}>English</option>
          <option value="zh" ${(store.get('userProfile')?.language) === 'zh' ? 'selected' : ''}>中文</option>
          <option value="ko" ${(store.get('userProfile')?.language) === 'ko' ? 'selected' : ''}>한국어</option>
          <option value="es" ${(store.get('userProfile')?.language) === 'es' ? 'selected' : ''}>Español</option>
          <option value="fr" ${(store.get('userProfile')?.language) === 'fr' ? 'selected' : ''}>Français</option>
          <option value="de" ${(store.get('userProfile')?.language) === 'de' ? 'selected' : ''}>Deutsch</option>
          <option value="pt" ${(store.get('userProfile')?.language) === 'pt' ? 'selected' : ''}>Português</option>
          <option value="th" ${(store.get('userProfile')?.language) === 'th' ? 'selected' : ''}>ไทย</option>
          <option value="vi" ${(store.get('userProfile')?.language) === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
          <option value="ar" ${(store.get('userProfile')?.language) === 'ar' ? 'selected' : ''}>العربية</option>
          <option value="hi" ${(store.get('userProfile')?.language) === 'hi' ? 'selected' : ''}>हिन्दी</option>
        </select>
      </div>

      <div style="text-align:center;padding:24px 0 24px">
        <div style="width:48px;height:48px;margin:0 auto 16px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C12 3 7 8 7 13a5 5 0 0010 0c0-5-5-10-5-10z"/></svg>
        </div>
        <h1 style="font-size:26px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;margin-bottom:6px">未病ダイアリー</h1>
        <p style="font-size:14px;color:#64748b;line-height:1.5">体調記録・情報整理ツール</p>
      </div>

      <!-- Guest Try Area (no registration required) -->
      <div style="margin-bottom:20px;padding:18px;background:#fff;border-radius:16px;border:2px solid #6366f1;box-shadow:0 2px 12px rgba(99,102,241,0.08)">
        <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px">まずはお試しください（登録不要）</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:12px">今の体調や気になること、お薬の写真などを入れてみてください</div>
        <div style="display:flex;gap:8px;align-items:start">
          <div style="flex:1">
            <textarea id="guest-input" rows="2"
              style="width:100%;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;font-size:14px;resize:none;font-family:inherit;outline:none"
              placeholder="例：最近だるくて眠れない、頭痛がする..."></textarea>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="app.guestAnalyze()" style="padding:12px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">聞いてみる</button>
            <label style="padding:8px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;font-size:12px;color:#64748b;cursor:pointer;text-align:center">
              📎 写真
              <input type="file" hidden accept="image/*,.pdf" onchange="app.guestFileAnalyze(event)">
            </label>
          </div>
        </div>

        <!-- Disease hint (gentle) -->
        <div style="margin-top:10px;padding:8px 12px;background:#f8fafc;border-radius:10px;font-size:11px;color:#64748b;line-height:1.6">
          お持ちの症状を選ぶと、より的確な情報をお伝えできます（任意）
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
            ${['mecfs:慢性疲労', 'depression:うつ', 'fibromyalgia:線維筋痛症', 'long_covid:コロナ後遺症', 'insomnia:不眠', 'pots:起立不耐', 'ibs:おなかの不調', 'hashimoto:甲状腺'].map(item => {
              const [id, label] = item.split(':');
              return `<span class="guest-disease-tag" data-id="${id}" style="padding:3px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:11px;transition:all 0.15s"
                onclick="this.classList.toggle('selected');if(this.classList.contains('selected')){this.style.background='#ede9fe';this.style.borderColor='#6366f1';this.style.color='#6366f1'}else{this.style.background='#fff';this.style.borderColor='#e2e8f0';this.style.color='#64748b'}">${label}</span>`;
            }).join('')}
          </div>
        </div>

        <!-- Guest result area -->
        <div id="guest-result" style="margin-top:12px"></div>
      </div>
      <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px">このサービスでできること</div>
        <div style="font-size:12px;color:#475569;line-height:1.8">
          <div style="display:flex;gap:8px;margin-bottom:6px"><span style="flex-shrink:0">📝</span><span><strong>体調を記録</strong> — テキスト・写真・ファイルで日々の症状、服薬、食事、気分を記録</span></div>
          <div style="display:flex;gap:8px;margin-bottom:6px"><span style="flex-shrink:0">📊</span><span><strong>経過を可視化</strong> — 記録データの時系列表示と傾向の整理</span></div>
          <div style="display:flex;gap:8px;margin-bottom:6px"><span style="flex-shrink:0">🔬</span><span><strong>研究情報の収集</strong> — 最新の研究情報を疾患別に自動取得（参考情報）</span></div>
          <div style="display:flex;gap:8px"><span style="flex-shrink:0">💡</span><span><strong>情報の整理補助</strong> — 入力内容に基づく参考情報の提示（医療行為ではありません）</span></div>
        </div>
      </div>

      <!-- Important Notice -->
      <div style="margin-bottom:24px;padding:14px 16px;background:#fef2f2;border-radius:14px;border:1px solid #fecaca">
        <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:6px">⚠ 重要なお知らせ</div>
        <div style="font-size:11px;color:#7f1d1d;line-height:1.7">
          本サービスは<strong>医療機器ではなく、医療行為を行うものではありません</strong>。
          提示される情報は参考情報であり、診断・治療・処方の代替にはなりません。
          健康上の判断は必ず医師・医療専門家にご相談ください。
          本サービスの情報に基づく行動はすべてご自身の責任となります。
        </div>
      </div>

      <!-- Login Options -->
      <div id="login-section"></div>
      <div style="margin-bottom:24px">
        <!-- Email Registration/Login (primary for older users) -->
        <form onsubmit="app.loginWithEmail(event)" style="margin-bottom:14px">
          <input type="email" name="email" class="form-input" placeholder="メールアドレス"
            style="border-radius:14px;padding:14px 16px;margin-bottom:8px;border:1.5px solid #e2e8f0;font-size:15px">
          <input type="password" name="password" class="form-input" placeholder="パスワード（6文字以上）"
            style="border-radius:14px;padding:14px 16px;margin-bottom:10px;border:1.5px solid #e2e8f0;font-size:15px">
          <button type="submit" class="btn btn-primary" style="width:100%;border-radius:14px;padding:14px;font-size:15px">メールアドレスではじめる（無料）</button>
          <div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:6px">初回は自動で登録されます。2回目以降は同じメール・パスワードでログイン。</div>
        </form>

        <!-- Divider -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="flex:1;height:1px;background:#e2e8f0"></div>
          <span style="font-size:12px;color:#94a3b8">または</span>
          <div style="flex:1;height:1px;background:#e2e8f0"></div>
        </div>

        <!-- Google Login -->
        <button class="google-btn" onclick="app.loginWithGoogle()" style="width:100%;border-radius:14px;padding:14px;font-size:14px;border:1.5px solid #e2e8f0;background:#fff">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Googleアカウントではじめる
        </button>
      </div>

      <!-- How it works -->
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px">はじめ方（3ステップ）</div>
        <div style="display:flex;gap:12px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">1</div>
          <div style="font-size:12px;color:#475569;line-height:1.6"><strong>Googleでログイン</strong> — アカウント作成は不要。Googleアカウントでそのまま開始</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">2</div>
          <div style="font-size:12px;color:#475569;line-height:1.6"><strong>今日の体調を書く</strong> — テキストでも写真でもOK。1行でもかまいません</div>
        </div>
        <div style="display:flex;gap:12px">
          <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">3</div>
          <div style="font-size:12px;color:#475569;line-height:1.6"><strong>参考情報を確認</strong> — 入力内容に基づく情報整理と関連研究が表示されます</div>
        </div>
      </div>

      <!-- Disease Selection -->
      <div style="margin-bottom:20px;padding:14px;background:#f8fafc;border-radius:14px">
        <div style="cursor:pointer;display:flex;justify-content:space-between;align-items:center"
          onclick="var c=document.getElementById('disease-picker');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'+':'−'">
          <div style="font-size:12px;font-weight:600;color:#1e293b">対象疾患を選択（任意・後から変更可）<span style="font-weight:400;color:#94a3b8;margin-left:4px">${selectedCount > 0 ? selectedCount + '件' : ''}</span></div>
          <span class="arrow" style="font-size:16px;color:#94a3b8">+</span>
        </div>
        <div id="disease-picker" style="display:none;margin-top:10px">
          <input type="text" class="form-input" placeholder="検索..." style="border-radius:10px;padding:9px 12px;margin-bottom:10px;border:1.5px solid #e2e8f0;font-size:12px"
            oninput="document.querySelectorAll('.disease-checkbox').forEach(cb=>{const label=cb.closest('label');const match=label.textContent.toLowerCase().includes(this.value.toLowerCase());label.style.display=match?'':'none'})">
          ${categoryHtml}
        </div>
      </div>

      <!-- Testimonial -->
      <div style="margin-bottom:24px;padding:16px;border-left:3px solid #6366f1;background:#fafaff;border-radius:0 12px 12px 0">
        <div style="font-size:12px;color:#475569;line-height:1.8;font-style:italic;margin-bottom:8px">
          「2年間のME/CFS闘病の中で、毎日の記録が最大の武器になりました」
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:11px;color:#64748b">山口揚平 / 開発者</span>
          <a href="https://note.com/age/n/n4f373bc7415a" target="_blank" rel="noopener" style="font-size:11px;color:#6366f1;text-decoration:none;font-weight:600">闘病記 →</a>
        </div>
      </div>

      <!-- Data Handling & Privacy -->
      <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px">データの取り扱い</div>
        <div style="font-size:11px;color:#475569;line-height:1.8">
          <div style="margin-bottom:4px">🔒 <strong>暗号化保存</strong> — データはGoogle Firebase上に暗号化して保存されます</div>
          <div style="margin-bottom:4px">👤 <strong>本人のみアクセス</strong> — ログインしたユーザー本人のみが自分のデータにアクセスできます</div>
          <div style="margin-bottom:4px">🚫 <strong>第三者提供なし</strong> — ユーザーの健康データを第三者に提供・販売することはありません</div>
          <div style="margin-bottom:4px">🗑️ <strong>削除可能</strong> — 設定画面からすべてのデータを削除できます。退会も自由です</div>
          <div>📋 <strong>要配慮個人情報</strong> — 健康情報は要配慮個人情報として、個人情報保護法に基づき適切に管理します</div>
        </div>
      </div>

      <!-- Legal Links -->
      <div style="margin-bottom:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#" onclick="app.showLegalPage('privacy');return false" style="font-size:11px;color:#6366f1;text-decoration:none">プライバシーポリシー</a>
        <span style="color:#cbd5e1">|</span>
        <a href="#" onclick="app.showLegalPage('terms');return false" style="font-size:11px;color:#6366f1;text-decoration:none">利用規約</a>
        <span style="color:#cbd5e1">|</span>
        <a href="#" onclick="app.showLegalPage('disclaimer');return false" style="font-size:11px;color:#6366f1;text-decoration:none">免責事項</a>
        <span style="color:#cbd5e1">|</span>
        <a href="mailto:support@advisers.jp" style="font-size:11px;color:#6366f1;text-decoration:none">お問い合わせ</a>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:0 0 32px;color:#94a3b8;font-size:10px;line-height:2">
        <div>運営: シェアーズ株式会社 &nbsp;·&nbsp; 🇯🇵 Made in Japan</div>
        <div>本サービスは医療機器ではありません &nbsp;·&nbsp; 無料</div>
        <div style="margin-top:4px;color:#cbd5e1">&copy; 2025 Shares Inc. All rights reserved.</div>
      </div>

    </div>
  </div>`;
};

// Disease Selection (for changing diseases later, from settings)
App.prototype.render_disease_select = function() {
  // Disease selection is now part of the login page and also available
  // in settings. For authed users landing here (e.g. first login without
  // a cached disease) we fall through to the dashboard. For unauth users
  // we render the login page HTML directly — never call navigate() from a
  // renderer, which blanks the page via a race with the caller's
  // innerHTML assignment.
  if (store.get('isAuthenticated')) {
    return this.render_dashboard();
  }
  return this.render_login();
};

// Dashboard Page
App.prototype.render_dashboard = function() {
  try {
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

  // Welcome message for new users (minimal)
  const welcomeHtml = !hasData ? `
    <div style="text-align:center;padding:12px 0;font-size:13px;color:var(--text-muted)">
      上の入力欄に体調を書いてみてください
    </div>` : '';

  return `
  <!-- 1. Quick Input Area (always top) -->
  <div class="card" style="margin-bottom:16px;border-color:var(--accent-border)">
    <div class="card-body" style="padding:14px 18px">
      <div style="display:flex;gap:12px;align-items:start">
        <div style="flex:1">
          <textarea class="form-textarea" id="dash-quick-input" rows="2"
            style="border:none;background:transparent;resize:none;font-size:14px;padding:0;min-height:auto"
            placeholder="体調・食事・薬・検査結果など何でも記録（📎で写真も添付可）"></textarea>
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

  <!-- Daily tracking hint (disease-specific, minimal) -->
  ${(() => {
    const diseases = store.get('selectedDiseases') || [];
    const hints = {
      mecfs: ['体調(1-10)', '睡眠時間', 'PEMの有無'],
      depression: ['気分(1-10)', '睡眠', '外出したか'],
      fibromyalgia: ['痛み(1-10)', '睡眠', 'こわばり'],
      long_covid: ['疲労(1-10)', '呼吸', '活動量'],
      pots: ['水分量', '立ちくらみ', '心拍数'],
      diabetes_t2: ['食事内容', '運動', '体重'],
      hashimoto: ['体調', '体重', '冷え'],
      ibs: ['お腹の調子', '食事内容', 'ストレス'],
      insomnia: ['就寝/起床時刻', '睡眠の質', '日中の眠気'],
      bipolar: ['気分(1-10)', '睡眠時間', '活動量'],
      ptsd: ['気分', '睡眠', 'フラッシュバック'],
      adhd: ['集中力', '睡眠', 'タスク達成'],
    };
    const items = new Set();
    diseases.forEach(d => (hints[d] || []).forEach(h => items.add(h)));
    if (items.size === 0) ['体調(1-10)', '睡眠', '食事'].forEach(h => items.add(h));
    const uniqueItems = [...items].slice(0, 4);
    return `<div style="padding:0 4px 8px;font-size:11px;color:var(--text-muted)">
      今日の記録: ${uniqueItems.map(h => `<span style="display:inline-block;padding:2px 8px;background:var(--bg-tertiary);border-radius:10px;margin:2px;cursor:pointer" onclick="document.getElementById('dash-quick-input').value+=' ${h}：';document.getElementById('dash-quick-input').focus()">${h}</span>`).join('')}
    </div>`;
  })()}

  <!-- 2. AI Instant Feedback (appears after input) -->
  <div id="dash-ai-feedback" style="margin-bottom:16px">
    ${(() => {
      const fb = store.get('latestFeedback');
      if (!fb) return '';
      // Use unified renderAnalysisCard
      try { return app.renderAnalysisCard(fb); } catch(e) { return ''; }
    })()}
  </div>

  <!-- 3. Welcome for new users OR Enriched Data Feed -->
  ${welcomeHtml}

  <!-- Integration sync status — shows last received data per source -->
  ${(() => {
    const syncs = store.get('integrationSyncs') || {};
    const sourceMeta = {
      plaud: { icon: '🎙️', label: 'Plaud' },
      apple_health: { icon: '🍎', label: 'Apple Health' },
      fitbit: { icon: '⌚', label: 'Fitbit' },
      csv_import: { icon: '📊', label: 'CSV取込' },
      json_import: { icon: '📦', label: 'JSON取込' },
    };
    const items = Object.entries(syncs)
      .filter(([k]) => sourceMeta[k])
      .sort((a, b) => new Date(b[1]) - new Date(a[1]))
      .slice(0, 4);
    if (items.length === 0) return '';
    const formatRel = (ts) => {
      const diff = Date.now() - new Date(ts).getTime();
      if (diff < 60000) return 'たった今';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
      return `${Math.floor(diff / 86400000)}日前`;
    };
    return `
    <div style="margin-bottom:16px;padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:11px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <strong style="color:var(--text-muted)">📡 連携データ</strong>
        <a onclick="app.navigate('integrations')" style="color:var(--accent);text-decoration:none;cursor:pointer">設定 →</a>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${items.map(([k, ts]) => `
          <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:var(--bg-primary);border-radius:10px">
            <span>${sourceMeta[k].icon}</span>
            <span>${sourceMeta[k].label}</span>
            <span style="color:var(--text-muted)">${formatRel(ts)}</span>
          </span>
        `).join('')}
      </div>
    </div>`;
  })()}

  ${enrichedEntries.length > 0 ? `
  <div style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 style="font-size:15px;font-weight:600">あなたの記録</h3>
      <button class="btn btn-outline btn-sm" onclick="app.navigate('timeline')">すべて見る（${totalEntries}件）</button>
    </div>
    ${enrichedEntries.map((e, i) => {
      // Escape user-supplied text BEFORE inserting into innerHTML —
      // otherwise malicious HTML/JS in a record could execute on render.
      const rawContent = e.content || '';
      const content = Components.escapeHtml(rawContent);
      const isLong = rawContent.length > 100;
      const preview = Components.escapeHtml(rawContent.substring(0, 100).replace(/\n/g, ' '));
      const safeTitle = Components.escapeHtml(e.title || new Date(e.timestamp).toLocaleDateString('ja-JP'));
      const eid = 'rec-' + (e.id || i);
      // Source badge — show where the data came from for imported entries
      const sourceLabels = {
        plaud: { icon: '🎙️', label: 'Plaud', color: '#8b5cf6' },
        apple_health: { icon: '🍎', label: 'Apple Health', color: '#ef4444' },
        fitbit: { icon: '⌚', label: 'Fitbit', color: '#22c55e' },
        csv_import: { icon: '📊', label: 'CSV', color: '#3b82f6' },
        json_import: { icon: '📦', label: 'JSON', color: '#f59e0b' },
        file_import: { icon: '📎', label: 'ファイル', color: '#64748b' },
      };
      const src = sourceLabels[e.source];
      const sourceBadge = src
        ? `<span class="tag" style="font-size:9px;background:${src.color}22;color:${src.color};padding:1px 6px">${src.icon} ${src.label}</span>`
        : '';
      // Border color: highlight integration imports so they pop on the feed
      const borderColor = src ? src.color : 'var(--accent)';
      return `
      <div class="card" style="margin-bottom:8px;border-left:3px solid ${borderColor}">
        <div style="padding:10px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"
          onclick="var b=document.getElementById('${eid}');b.style.display=b.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=b.style.display==='none'?'▸':'▾'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;flex-wrap:wrap">
              <span style="font-size:12px;font-weight:600">${safeTitle}</span>
              ${sourceBadge}
              <span style="font-size:10px;color:var(--text-muted)">${new Date(e.timestamp).toLocaleDateString('ja-JP', {month:'short',day:'numeric',weekday:'short'})}</span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}${isLong ? '...' : ''}</div>
          </div>
          <span class="arrow" style="font-size:12px;color:var(--text-muted);margin-left:8px;flex-shrink:0">▸</span>
        </div>
        <div id="${eid}" style="display:none;padding:0 16px 12px">
          <div style="font-size:13px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${content}</div>
          ${(() => {
            const comment = app.getAIComment(e.id);
            if (!comment) return e._insight ? `<div style="padding:6px 10px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--accent);margin-top:8px"><strong>分析:</strong> ${e._insight}</div>` : '';
            const r = comment.result || {};
            // Prefer parsed structured fields. _raw is only used if it's
            // a real string AND no parsed fields exist (defensive against
            // legacy records that stored an object as _raw).
            const pickString = (v) => (typeof v === 'string' && v.trim() ? v : '');
            let text = pickString(r.summary) || pickString(r.findings) || pickString(r._raw);
            // If everything is non-string (legacy bad data), regenerate a
            // friendly placeholder rather than dumping raw JSON to the user.
            if (!text) text = '分析結果を取得できませんでした。再度記録を送信してください。';
            // Cap at 500 chars; never JSON.stringify an object here.
            const display = text.substring(0, 500);
            const actions = Array.isArray(r.actions) ? r.actions.filter(a => typeof a === 'string').slice(0, 3) : [];
            return `<div style="margin-top:8px;padding:10px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);border-left:3px solid var(--accent)">
              <div style="font-size:10px;font-weight:600;color:var(--accent);margin-bottom:4px">分析結果（${new Date(comment.timestamp).toLocaleString('ja-JP')}）</div>
              <div style="font-size:11px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${Components.formatMarkdown(display)}</div>
              ${actions.length ? '<div style="margin-top:6px;font-size:11px">' + actions.map(a => '<div style="color:var(--accent)">→ ' + a + '</div>').join('') + '</div>' : ''}
            </div>`;
          })()}
        </div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- 4. Calendar Widget -->
  ${CalendarIntegration.renderWidget()}

  <!-- 5. Recommendations (collapsible) -->
  ${allRecs.length > 0 ? `
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-recs');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">あなたへの推奨（${allRecs.length}件）</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="dash-recs">
      ${allRecs.slice(0, 3).map(r => Components.recommendationCard(r)).join('')}
      ${allRecs.length > 3 ? `<button class="btn btn-outline btn-sm" onclick="app.navigate('actions')">すべて見る →</button>` : ''}
    </div>
  </div>` : ''}

  <!-- 5. Dynamic Recommendations (based on user data) -->
  <div style="margin-bottom:20px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:10px">あなたへのおすすめ</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" class="grid-recs">
      ${app.generateDynamicRecommendations().map(item => `
        <a href="${item.url}" target="_blank" rel="noopener"
          onclick="affiliateEngine.trackClick('${item.id}','${item.store === 'iherb' ? 'iherb' : 'amazon_jp'}','supplement')"
          class="card" style="text-decoration:none;color:inherit">
          <div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:18px;margin-bottom:2px">${item.icon}</div>
            <div style="font-size:11px;font-weight:600;line-height:1.3">${item.name}</div>
            <div style="font-size:9px;color:var(--text-muted)">${item.desc}</div>
            <div style="font-size:9px;color:var(--accent);margin-top:2px">${item.store === 'iherb' ? 'iHerb' : 'Amazon'} →</div>
          </div>
        </a>
      `).join('')}
      <div class="card" style="cursor:pointer" onclick="app.navigate('actions')">
        <div class="card-body" style="padding:10px;text-align:center">
          <div style="font-size:18px;margin-bottom:2px">→</div>
          <div style="font-size:12px;font-weight:600">もっと見る</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. Clinics / Workshops / Events (auto-loaded) -->
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-actions-live');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">クリニック・イベント・セルフケア</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="dash-actions-live" style="display:block"></div>
  </div>

  <!-- 7. Latest Research (auto-loaded research) -->
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-research');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">最新研究</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="dash-research" style="display:block"></div>
  </div>

  <!-- 8. Nutrition / BMR / PFC (collapsible) -->
  ${(() => {
    const log = store.get('nutritionLog') || [];
    const hasLog = log.length > 0;
    const bmr = store.calculateBMR();
    const bmrText = bmr != null ? bmr + ' kcal' : '--';
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = log.find(e => e.date === today);
    const todayCal = todayEntry ? Math.round(todayEntry.calories || 0) : null;
    const todayDiffText = (todayCal != null && bmr != null)
      ? (todayCal - bmr > 0 ? '+' : '') + (todayCal - bmr) + ' kcal'
      : '--';
    const recent7Log = log.slice(-7);
    const avg7 = recent7Log.length
      ? Math.round(recent7Log.reduce((s, e) => s + (e.calories || 0), 0) / recent7Log.length)
      : null;
    const initiallyOpen = hasLog ? 'block' : 'none';
    const initialArrow = hasLog ? '▾' : '▸';
    return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
        onclick="var c=document.getElementById('dash-nutrition');var open=c.style.display==='none';c.style.display=open?'block':'none';this.querySelector('.arrow').textContent=open?'▾':'▸';if(open)setTimeout(()=>app.initNutritionCharts(),30)">
        <h3 style="font-size:15px;font-weight:600">栄養 / PFCバランス</h3>
        <span class="arrow" style="font-size:14px;color:var(--text-muted)">${initialArrow}</span>
      </div>
      <div id="dash-nutrition" style="display:${initiallyOpen}">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px" class="grid-nutrition">
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">基礎代謝 BMR</div>
            <div style="font-size:16px;font-weight:700">${bmrText}</div>
            ${bmr == null ? '<div style="font-size:9px;color:var(--text-muted);margin-top:2px">設定→身長/体重/年齢を入力</div>' : ''}
          </div></div>
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">今日の摂取</div>
            <div style="font-size:16px;font-weight:700">${todayCal != null ? todayCal + ' kcal' : '--'}</div>
            <div style="font-size:9px;color:var(--text-muted);margin-top:2px">BMR差 ${todayDiffText}</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">7日平均</div>
            <div style="font-size:16px;font-weight:700">${avg7 != null ? avg7 + ' kcal' : '--'}</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">記録日数</div>
            <div style="font-size:16px;font-weight:700">${log.length}</div>
          </div></div>
        </div>
        <div class="card" style="margin-bottom:8px">
          <div class="card-header" style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center">
            <span class="card-title" style="font-size:13px">摂取カロリー vs 基礎代謝</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-primary btn-sm" style="font-size:11px;padding:4px 10px" onclick="app.extractTodayNutrition()">今日の記録から集計</button>
              ${hasLog ? `<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 10px" onclick="app.clearNutritionLog()">クリア</button>` : ''}
            </div>
          </div>
          <div class="card-body" style="height:200px;padding:10px 14px"><canvas id="nutrition-calorie-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header" style="padding:8px 14px"><span class="card-title" style="font-size:13px">PFCバランス（g）</span></div>
          <div class="card-body" style="height:200px;padding:10px 14px"><canvas id="nutrition-pfc-chart"></canvas></div>
        </div>
        ${!hasLog ? `<div style="font-size:11px;color:var(--text-muted);padding:10px 2px;text-align:center">「今日の記録から集計」を押すと、今日書いた食事記録から摂取カロリー・PFCを自動計算します。</div>` : ''}
      </div>
    </div>`;
  })()}

  <!-- 7. Stats + Chart (collapsible) -->
  ${hasData ? `
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-stats');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px;font-weight:800;color:${score >= 60 ? 'var(--success)' : score >= 35 ? 'var(--warning)' : 'var(--danger)'}">${score}</span>
        <span style="font-size:13px;color:var(--text-secondary)">体調スコア・${totalEntries + totalSymptoms}件記録済</span>
      </div>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▸</span>
    </div>
    <div id="dash-stats" style="display:none">
      <div class="card" style="margin-bottom:8px">
        <div class="card-body" style="padding:12px 16px;font-size:13px;color:var(--text-secondary);line-height:1.7">
          ${score >= 60 ? '比較的安定した状態です。この調子を維持しましょう。' :
            score >= 35 ? '少し注意が必要な状態です。無理せず休息を取ってください。' :
            '体調が優れない状態です。安静を優先し、必要であれば医療機関に相談してください。'}
        </div>
      </div>
      ${symptoms.length > 0 ? `
      <div class="card" style="margin-bottom:8px">
        <div class="card-header" style="padding:8px 14px"><span class="card-title" style="font-size:13px">トレンド</span></div>
        <div class="card-body" style="height:200px"><canvas id="symptom-chart"></canvas></div>
      </div>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- 7. Full Timeline (collapsible) -->
  ${totalEntries > 0 ? (() => {
    const allTL = (store.get('textEntries') || []).slice().reverse();
    const byDate = {};
    allTL.forEach(e => {
      const dk = e.timestamp ? new Date(e.timestamp).toLocaleDateString('ja-JP', {year:'numeric',month:'short',day:'numeric',weekday:'short'}) : '不明';
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push(e);
    });
    const dateKeys = Object.keys(byDate);
    return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:10px 0"
        onclick="var c=document.getElementById('dash-timeline');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
        <h3 style="font-size:15px;font-weight:600">全記録（${allTL.length}件）</h3>
        <span class="arrow" style="font-size:14px;color:var(--text-muted)">▸</span>
      </div>
      <div id="dash-timeline" style="display:none">
        ${dateKeys.slice(0, 30).map(dk => `
          <div style="margin-bottom:12px">
            <div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:6px">${dk}（${byDate[dk].length}件）</div>
            ${byDate[dk].map(e => {
              const rawContent = e.content || '';
              const content = Components.escapeHtml(rawContent);
              const preview = Components.escapeHtml(rawContent.substring(0, 80).replace(/\n/g, ' '));
              const eid = 'tl-' + (e.id || Math.random().toString(36).substr(2));
              return `
              <div style="margin-bottom:4px;border-left:2px solid var(--border);padding-left:10px">
                <div style="cursor:pointer;display:flex;align-items:center;gap:6px"
                  onclick="var b=document.getElementById('${eid}');b.style.display=b.style.display==='none'?'block':'none'">
                  <span style="font-size:10px;color:var(--text-muted)">${e.timestamp ? new Date(e.timestamp).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <span style="font-size:11px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${preview}${rawContent.length > 80 ? '...' : ''}</span>
                </div>
                <div id="${eid}" style="display:none;padding:6px 0;font-size:12px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${content}</div>
              </div>`;
            }).join('')}
          </div>
        `).join('')}
        ${dateKeys.length > 30 ? '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px">さらに古い記録は「記録する」ページで確認できます</div>' : ''}
      </div>
    </div>`;
  })() : ''}

  <div style="display:flex;flex-wrap:wrap;gap:4px">${diseaseTagsHtml}</div>`;
  } catch(err) {
    console.error('Dashboard render error:', err);
    return `<div style="padding:20px"><p>読み込みエラーが発生しました。</p><p style="font-size:12px;color:var(--text-muted)">${err.message}</p><button class="btn btn-primary" onclick="store.clearAll();location.reload()">データをリセットして再読み込み</button></div>`;
  }
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
      ${recentTexts.map(e => {
        const rawContent = e.content || '';
        const safeContent = Components.escapeHtml(rawContent.length > 300 ? rawContent.substring(0, 300) + '...' : rawContent);
        const safeTitle = e.title ? Components.escapeHtml(e.title) : '';
        const safeCategory = Components.escapeHtml(categoryLabels[e.category] || e.category || '');
        return `
        <div style="padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid var(--accent)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span class="tag tag-accent" style="font-size:10px">${safeCategory}</span>
            <span style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${new Date(e.timestamp).toLocaleString('ja-JP')}</span>
          </div>
          ${safeTitle ? `<div style="font-size:13px;font-weight:600;margin-bottom:2px">${safeTitle}</div>` : ''}
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${safeContent}</div>
        </div>
      `;
      }).join('')}
    </div>` : '';

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">データ入力</h2>
    <p style="font-size:13px;color:var(--text-secondary)">日々の体調や気づきを記録してください。テキストから即座にアドバイスを生成します。</p>
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
        <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <label class="form-label">カテゴリ</label>
            <select class="form-select" id="text-input-category" onchange="app.updateInputHint(this.value)">
              <optgroup label="体調・症状">
                <option value="symptoms">体調・症状</option>
                <option value="mental">気分・メンタル</option>
                <option value="sleep">睡眠</option>
                <option value="pain">痛み・疼痛</option>
              </optgroup>
              <optgroup label="医療">
                <option value="blood_test">検査結果（血液・尿・画像）</option>
                <option value="medication">服薬・処方・漢方</option>
                <option value="supplement">サプリメント</option>
                <option value="doctor">診察・医師の所見</option>
                <option value="allergy">アレルギー検査</option>
                <option value="hormone">ホルモン検査</option>
                <option value="genetic">遺伝子検査</option>
              </optgroup>
              <optgroup label="食事・栄養">
                <option value="nutrition">食事・栄養</option>
                <option value="water">水分摂取</option>
                <option value="alcohol">飲酒</option>
              </optgroup>
              <optgroup label="生活・バイタル">
                <option value="vitals">バイタル（心拍・血圧・体温）</option>
                <option value="weight">体重・体組成</option>
                <option value="activity">運動・活動量</option>
                <option value="menstrual">生理・月経周期</option>
                <option value="weather">天気・気圧</option>
                <option value="environment">住環境（温度・湿度）</option>
              </optgroup>
              <optgroup label="人間関係・生活">
                <option value="conversation">会話・コミュニケーション</option>
                <option value="work">仕事・予定</option>
                <option value="family">家族・人間関係</option>
                <option value="travel">旅行・移動</option>
                <option value="finance">医療費・経済</option>
                <option value="meditation">瞑想・呼吸法</option>
              </optgroup>
              <optgroup label="その他">
                <option value="research">調べたこと・論文</option>
                <option value="other">その他</option>
              </optgroup>
            </select>
          </div>
          <div style="flex:1;min-width:140px">
            <label class="form-label">タイトル（任意）</label>
            <input type="text" class="form-input" id="text-input-title" placeholder="例: 朝の体調、診察メモ...">
          </div>
        </div>
      </div>

      <!-- Input hints by category -->
      <div id="input-hint" style="padding:8px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);margin-bottom:10px;font-size:11px;color:var(--accent);line-height:1.6">
        💡 テキスト入力のほか、📎ボタンで写真を撮影してアップロードできます（血液検査結果、お薬手帳、食事写真など）
      </div>

      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-textarea" id="text-input-content" rows="6" placeholder="体調や気づきを自由に記録してください..."></textarea>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="app.submitTextEntry()">保存して分析</button>
        <label class="btn btn-secondary" style="cursor:pointer">📎 写真・ファイル<input type="file" hidden multiple accept="image/*,.pdf,.csv,.json,.xml,.txt,.xlsx" onchange="app.dataPageFileUpload(this.files)"></label>
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
      <div class="upload-area" onclick="document.getElementById('data-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
        ondragleave="this.style.borderColor='var(--border)'"
        ondrop="event.preventDefault();app.dataPageFileUpload(event.dataTransfer.files)">
        <div class="upload-area-icon">📸</div>
        <div class="upload-area-text">クリックまたはドラッグ&ドロップ</div>
        <div class="upload-area-hint">写真・画像・PDF・CSV・JSON・XML・テキスト</div>
        <input type="file" id="data-file-input" hidden multiple accept="image/*,.pdf,.csv,.json,.xml,.txt,.xlsx"
          onchange="app.dataPageFileUpload(this.files)">
      </div>
      <div id="data-file-result" style="margin-top:12px"></div>
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
  const model = store.get('selectedModel') || 'claude-opus-4-6';
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
  ${sections || ''}

  <!-- Live Clinic/Workshop/Event Recommendations -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-header">
      <span class="card-title">クリニック・イベント・セルフケア</span>
      <span style="font-size:10px;color:var(--text-muted)">毎日更新</span>
    </div>
    <div class="card-body" id="action-live-recs"></div>
  </div>

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

  <!-- Dynamic Product Recommendations (same as dashboard) -->
  <div style="margin-top:24px;margin-bottom:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('action-recs');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">あなたへのおすすめ</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="action-recs">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px" class="grid-recs">
        ${app.generateDynamicRecommendations().map(item => `
          <a href="${item.url}" target="_blank" rel="noopener"
            onclick="affiliateEngine.trackClick('${item.id}','${item.store === 'iherb' ? 'iherb' : 'amazon_jp'}','supplement')"
            class="card" style="text-decoration:none;color:inherit">
            <div class="card-body" style="padding:10px;text-align:center">
              <div style="font-size:18px;margin-bottom:2px">${item.icon}</div>
              <div style="font-size:11px;font-weight:600;line-height:1.3">${item.name}</div>
              <div style="font-size:9px;color:var(--text-muted)">${item.desc}</div>
              <div style="font-size:9px;color:var(--accent);margin-top:2px">${item.store === 'iherb' ? 'iHerb' : 'Amazon'} →</div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Latest Feedback Actions (from dashboard analysis) -->
  ${(() => {
    const fb = store.get('latestFeedback');
    if (!fb || !fb.sections) return '';
    const actionSection = fb.sections.find(s => s.title.includes('今すぐ'));
    const findingSection = fb.sections.find(s => s.title.includes('詳細'));
    if (!actionSection && !findingSection) return '';
    return '<div style="margin-top:24px;margin-bottom:24px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0" onclick="var c=document.getElementById(\\x27action-insights\\x27);c.style.display=c.style.display===\\x27none\\x27?\\x27block\\x27:\\x27none\\x27;this.querySelector(\\x27.arrow\\x27).textContent=c.style.display===\\x27none\\x27?\\x27▸\\x27:\\x27▾\\x27">' +
      '<h3 style="font-size:15px;font-weight:600">最新の分析からのアクション</h3>' +
      '<span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span></div>' +
      '<div id="action-insights"><div class="card" style="border-left:4px solid var(--accent)">' +
      (actionSection ? '<div style="padding:12px 16px;border-bottom:1px solid var(--border)"><div style="font-size:12px;font-weight:600;margin-bottom:4px">' + actionSection.icon + ' ' + actionSection.title + '</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + actionSection.content + '</div></div>' : '') +
      (findingSection ? '<div style="padding:12px 16px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">' + findingSection.icon + ' ' + findingSection.title + '</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + findingSection.content + '</div></div>' : '') +
      '</div></div></div>';
  })()}`;
};

// Research Page
App.prototype.render_research = function() {
  const analysis = store.get('latestAnalysis');
  const updates = analysis?.parsed?.researchUpdates || analysis?.result?.researchUpdates || [];

  return `
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">最新研究</h2>
      <p style="font-size:13px;color:var(--text-secondary)">あなたの疾患に関連する最新の研究論文</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="app.searchPubMedLive()">論文を検索</button>
      <button class="btn btn-outline btn-sm" onclick="app.runAnalysis('mecfs_research')">研究スキャン</button>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-body" style="padding:14px 20px">
      <div style="display:flex;gap:10px">
        <input type="text" class="form-input" id="pubmed-search-query" value="ME/CFS OR myalgic encephalomyelitis OR chronic fatigue syndrome" placeholder="検索キーワード..." style="flex:1">
        <select class="form-select" id="pubmed-search-days" style="width:120px">
          <option value="7">過去7日</option>
          <option value="30">過去30日</option>
          <option value="90" selected>過去90日</option>
          <option value="365">過去1年</option>
        </select>
        <button class="btn btn-primary" onclick="app.searchPubMedLive()">論文を検索</button>
      </div>
    </div>
  </div>

  <!-- PubMed Results -->
  <div id="pubmed-results">
    ${updates.length > 0
      ? '<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">研究レポート</h3>' + updates.map(r => Components.researchCard(r)).join('')
      : Components.emptyState('🔬', '論文を検索を実行してください', '上の「論文を検索」ボタンをクリックするとME/CFSの最新論文が表示されます。')}
  </div>`;
};

// Chat Page
App.prototype.render_chat = function() {
  const history = store.get('conversationHistory') || [];
  const messages = history.map(m => Components.chatMessage(m)).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">相談する</h2>
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
      const rawContent = e.content || e.text_note || '';
      const content = Components.escapeHtml(rawContent);
      const aiInsight = Components.escapeHtml(app.generateQuickInsight(rawContent) || '');
      const safeLabel = Components.escapeHtml(e._label || '');
      const safeCategory = e._category ? Components.escapeHtml(e._category) : '';
      return `
        <div class="card" style="margin-bottom:10px;border-left:3px solid var(--accent)">
          <div class="card-body" style="padding:12px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span>${e._icon}</span>
                <span style="font-size:12px;font-weight:600">${safeLabel}</span>
                ${safeCategory ? `<span class="tag tag-accent" style="font-size:9px">${safeCategory}</span>` : ''}
              </div>
              <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${time}</span>
            </div>
            <div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap;margin-bottom:8px">${content}</div>
            ${aiInsight ? `<div style="padding:8px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--accent)"><strong>分析:</strong> ${aiInsight}</div>` : ''}
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
      <p style="font-size:11px;color:var(--text-muted);margin-top:4px">音声→テキスト→自動分析</p>
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
      <span class="tag ${(store.get('calendarEvents')||[]).length > 0 ? 'tag-success' : 'tag-warning'}">${(store.get('calendarEvents')||[]).length > 0 ? (store.get('calendarEvents')||[]).length + '件同期済' : '未同期'}</span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">スケジュール情報から活動量を自動分析します。現在はGoogleカレンダーと連携しています。</p>
      <div style="background:var(--bg-tertiary);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="font-size:12px;color:var(--text-secondary)">
          <strong>Googleカレンダーのデータを自動で取得して、ダッシュボードに表示します。
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
      ${(() => {
        const plaudEntries = (store.get('textEntries') || []).filter(e => e.type === 'plaud_transcript' || (e.category === 'conversation' && e.title?.includes('Plaud')));
        if (plaudEntries.length > 0) {
          const last = plaudEntries[plaudEntries.length - 1];
          return '<span class="tag tag-success" style="font-size:9px">' + plaudEntries.length + '件取込済（最終: ' + new Date(last.timestamp).toLocaleDateString('ja-JP') + '）</span>';
        }
        return '<span class="tag tag-warning" style="font-size:9px">未取込</span>';
      })()}
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
      <button class="btn btn-primary" onclick="app.importPlaudTranscript()">取り込み＆分析</button>
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
  const model = store.get('selectedModel') || 'claude-opus-4-6';
  // Merge: DEFAULT_PROMPTS as base, user customPrompts override
  const userPrompts = store.get('customPrompts') || {};
  const prompts = { ...DEFAULT_PROMPTS, ...userPrompts };

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
              <button class="btn btn-danger btn-sm" onclick="app.confirmAction(this,'削除',()=>app.deletePrompt('${p.key}'))" style="padding:5px 10px">×</button>
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
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();app.confirmAction(this,'削除',()=>app.deletePrompt('${key}'))" style="padding:3px 8px;font-size:11px">×</button>
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
    <h3 style="font-size:15px;font-weight:600;margin-bottom:8px">AIモデル選択</h3>
    <div style="padding:10px 12px;background:var(--info-bg,#eef2ff);border-left:3px solid #6366f1;border-radius:var(--radius-sm);font-size:11px;color:#4338ca;margin-bottom:12px">
      <b>全ユーザー共通設定:</b> ここで選んだモデルは、サインインしているすべての利用者に共通で適用されます。
    </div>
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
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">APIキーを設定すると、Claudeによるリアルタイム分析が有効になります。</p>
      <div style="padding:10px 12px;background:var(--info-bg,#eef2ff);border-left:3px solid #6366f1;border-radius:var(--radius-sm);font-size:11px;color:#4338ca;margin-bottom:16px">
        <b>全ユーザー共通設定:</b> ここで保存したAPIキー・プロキシURLは、サインインしているすべての利用者に共通で適用されます。利用者ごとに個別に設定する必要はありません。
      </div>
      <div class="form-group">
        <label class="form-label">APIプロキシURL（必須）</label>
        <input type="text" class="form-input" id="input-proxy-url" placeholder="https://your-worker.workers.dev" autocomplete="off">
        <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">Cloudflare Workerのデプロイ後にURLを貼り付け</span>
      </div>
      <div class="form-group">
        <label class="form-label">Anthropic API Key</label>
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
        <button class="btn btn-secondary" onclick="app.testApiKey()" style="margin-left:8px">接続テスト</button>
        <div id="api-test-result" style="margin-top:8px"></div>
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
  <!-- Admin Users -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">管理者ユーザー</span></div>
    <div class="card-body">
      <div id="admin-list" style="margin-bottom:12px">
        ${app.ADMIN_EMAILS.map(e => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">${e}</span>
            ${e === 'agewaller@gmail.com' ? '<span style="font-size:10px;color:var(--text-muted)">オーナー</span>' : `<button class="btn btn-sm btn-danger" onclick="app.removeAdmin('${e}')">削除</button>`}
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <input type="email" class="form-input" id="new-admin-email" placeholder="追加するメールアドレス" style="flex:1">
        <button class="btn btn-primary btn-sm" onclick="app.addAdmin()">追加</button>
      </div>
    </div>
  </div>

  <!-- Data Management -->
  <div class="card">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="app.generateDemoData()">デモデータ生成</button>
      <button class="btn btn-secondary" onclick="app.exportData()">データエクスポート</button>
      <button class="btn btn-warning" onclick="app.deduplicateRecords()">重複レコード削除</button>
      <button class="btn btn-danger" onclick="app.confirmAction(this,'データ全削除',()=>{store.clearAll();location.reload()})">データ全削除</button>
    </div>
    <div style="padding:8px 16px 0;font-size:11px;color:var(--text-muted)">「重複レコード削除」は、同じ内容のレコードを1つに統合します（一度だけ実行すれば十分です）。</div>
  </div>
  </div>`;
};

// Settings Page
App.prototype.render_settings = function() {
  const user = store.get('user') || {};
  const selected = store.get('selectedDiseases') || [];

  // Build disease checkboxes
  const diseaseSections = CONFIG.DISEASE_CATEGORIES.map(cat => `
    <div style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">${cat.icon} ${cat.name}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${cat.diseases.map(d => `
          <label style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:${selected.includes(d.id)?'var(--accent-bg)':'var(--bg-tertiary)'};border:1px solid ${selected.includes(d.id)?'var(--accent-border)':'var(--border)'};border-radius:16px;cursor:pointer;font-size:11px">
            <input type="checkbox" class="settings-disease-cb" value="${d.id}" ${selected.includes(d.id)?'checked':''}
              style="width:12px;height:12px;accent-color:var(--accent)"
              onchange="var l=this.closest('label');if(this.checked){l.style.background='var(--accent-bg)';l.style.borderColor='var(--accent-border)'}else{l.style.background='var(--bg-tertiary)';l.style.borderColor='var(--border)'}">
            ${d.name}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">設定</h2>
  </div>

  <!-- Disease Selection -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <span class="card-title">対象疾患</span>
      <span class="tag tag-accent" id="settings-disease-count">${selected.length}件選択</span>
    </div>
    <div class="card-body" style="padding:12px 16px">
      ${diseaseSections}
      <button class="btn btn-primary btn-sm" onclick="app.saveDiseaseSettings()" style="margin-top:8px">疾患を保存</button>
    </div>
  </div>

  <!-- Profile -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">プロフィール</span></div>
    <div class="card-body" style="padding:12px 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="user-avatar" style="width:40px;height:40px;font-size:16px">${user.displayName?.[0] || '?'}</div>
        <div>
          <div style="font-size:14px;font-weight:600">${user.displayName || 'ゲスト'}</div>
          <div style="font-size:12px;color:var(--text-muted)">${user.email || ''}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="form-group" style="margin:0"><label class="form-label">年齢</label><input type="number" class="form-input" id="profile-age" placeholder="50" min="0" max="120" style="padding:8px 10px"></div>
        <div class="form-group" style="margin:0"><label class="form-label">性別</label><select class="form-select" id="profile-gender" style="padding:8px 10px"><option value="">未選択</option><option value="male">男性</option><option value="female">女性</option><option value="other">その他</option></select></div>
        <div class="form-group" style="margin:0"><label class="form-label">身長(cm)</label><input type="number" class="form-input" id="profile-height" placeholder="170" style="padding:8px 10px"></div>
        <div class="form-group" style="margin:0"><label class="form-label">体重(kg)</label><input type="number" class="form-input" id="profile-weight" placeholder="65" style="padding:8px 10px"></div>
      </div>

      <div class="form-group"><label class="form-label">居住地</label><input type="text" class="form-input" id="profile-location" placeholder="神奈川県秦野市" style="padding:8px 10px"></div>
      <div class="form-group"><label class="form-label">通院範囲</label><select class="form-select" id="profile-travel-range" style="padding:8px 10px"><option value="local">近隣</option><option value="prefecture">県内</option><option value="region" selected>関東圏</option><option value="national">国内全域</option><option value="international">海外含</option></select></div>
      <div class="form-group"><label class="form-label">言語</label><select class="form-select" id="profile-language" style="padding:8px 10px"><option value="ja" selected>日本語</option><option value="en">English</option><option value="zh">中文</option><option value="ko">한국어</option></select></div>
      <div class="form-group"><label class="form-label">備考</label><textarea class="form-textarea" id="profile-notes" rows="2" placeholder="アレルギー、既往歴、家族歴..." style="padding:8px 10px"></textarea></div>

      <button class="btn btn-primary btn-sm" onclick="app.saveProfile()">プロフィールを保存</button>
    </div>
  </div>

  <!-- Data Export -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label class="form-label">データインポート（JSONファイル）</label>
        <input type="file" class="form-input" accept=".json" onchange="app.importDataFile(this.files[0])">
      </div>
      <button class="btn btn-secondary" onclick="app.exportData()">すべてのデータをエクスポート (JSON)</button>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-danger" style="width:100%;padding:14px;font-size:14px" id="logout-btn" onclick="app.confirmLogout()">ログアウト</button>
      </div>
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
