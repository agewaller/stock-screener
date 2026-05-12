// === js/app.js ===
/* ============================================================
   Main Application Controller
   ============================================================ */

// #18 Global error monitoring — captures unhandled errors and
// rejections. Logged to Firestore /admin/errors for admin dashboard.
// Replace with Sentry DSN when available.
window.addEventListener('error', (e) => {
  console.error('[Global]', e.message, e.filename, e.lineno);
  try {
    const errors = JSON.parse(localStorage.getItem('cc_errorLog') || '[]');
    errors.push({ ts: new Date().toISOString(), msg: e.message, file: e.filename, line: e.lineno });
    if (errors.length > 50) errors.splice(0, errors.length - 50);
    localStorage.setItem('cc_errorLog', JSON.stringify(errors));
  } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Global] Unhandled rejection:', e.reason);
  try {
    const errors = JSON.parse(localStorage.getItem('cc_errorLog') || '[]');
    errors.push({ ts: new Date().toISOString(), msg: String(e.reason?.message || e.reason), type: 'promise' });
    if (errors.length > 50) errors.splice(0, errors.length - 50);
    localStorage.setItem('cc_errorLog', JSON.stringify(errors));
  } catch (_) {}
});

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
    // Multi-source admin check. Previously this only read from
    // store.get('user').email, which silently returned false whenever
    // the in-memory store was stale or never populated (e.g. right
    // after a hard refresh before the auth state listener ran). The
    // user got "管理者権限がない" even though they were signed in as
    // agewaller@gmail.com. We now consult three sources in order:
    //   1. store.get('user').email
    //   2. FirebaseBackend.auth.currentUser.email
    //   3. firebase.auth().currentUser.email
    // Any matching one grants admin. The hardcoded owner email is
    // ALWAYS admin (matches removeAdmin's owner-protect logic).
    const email = this.currentUserEmail();
    if (!email) return false;
    if (email === 'agewaller@gmail.com') return true;
    return Array.isArray(this.ADMIN_EMAILS) && this.ADMIN_EMAILS.includes(email);
  }

  currentUserEmail() {
    try {
      const u = store.get('user');
      if (u && u.email) return u.email;
    } catch (_) {}
    try {
      if (typeof FirebaseBackend !== 'undefined' && FirebaseBackend.auth
          && FirebaseBackend.auth.currentUser && FirebaseBackend.auth.currentUser.email) {
        return FirebaseBackend.auth.currentUser.email;
      }
    } catch (_) {}
    try {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const fu = firebase.auth().currentUser;
        if (fu && fu.email) return fu.email;
      }
    } catch (_) {}
    return null;
  }

  // Boot-time canary: walk through every onclick / on* attribute in
  // index.html and the rendered template files and verify each
  // `app.X(...)` reference resolves to a real method. This catches the
  // class of regression where a wholesale revert (e.g. cca607c) drops
  // a method while leaving the onclick handlers behind, which would
  // otherwise only surface as a TypeError when the user actually taps
  // the button. The check runs once on init() and only logs — it does
  // not throw, so a missing handler can never block the app from
  // booting. Smoke tests perform the same check statically.
  _verifyHandlerBindings() {
    try {
      const nodes = document.querySelectorAll('[onclick],[onchange],[oninput],[onsubmit],[onkeydown],[onkeyup],[onfocus],[onblur]');
      const seen = new Set();
      const missing = new Set();
      const re = /\bapp\.([A-Za-z_]\w*)\s*\(/g;
      nodes.forEach(node => {
        ['onclick','onchange','oninput','onsubmit','onkeydown','onkeyup','onfocus','onblur'].forEach(attr => {
          const v = node.getAttribute(attr);
          if (!v) return;
          let m;
          while ((m = re.exec(v)) !== null) {
            const name = m[1];
            if (seen.has(name)) continue;
            seen.add(name);
            if (typeof this[name] !== 'function' && typeof window.app?.[name] !== 'function') {
              missing.add(name);
            }
          }
        });
      });
      if (missing.size > 0) {
        console.warn('[App] Boot canary: missing handlers referenced from on* attributes →', [...missing]);
      }
    } catch (e) { console.warn('[App] handler canary failed:', e.message); }
  }

  init() {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('cc_theme');
    this._initHashRouter();
    store.on('currentPage', (p) => this.navigate(p));
    // Defensive: log any onclick handler that resolves to undefined
    // before the user has a chance to tap it.
    setTimeout(() => this._verifyHandlerBindings(), 1500);

    // Auto-refresh the dashboard whenever new data lands in any of the
    // user-visible collections. This makes Plaud / Apple Health / Fitbit
    // / file imports show up immediately on the home screen without the
    // user having to manually navigate away and back. Debounced so a
    // batch import doesn't trigger N renders.
    // #12 Diff-based dashboard updates via morphdom. Prevents form
    // input loss and scroll position reset during auto-refresh.
    let refreshTimer = null;
    const scheduleDashRefresh = () => {
      if (this.currentPage !== 'dashboard') return;
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (this.currentPage !== 'dashboard') return;
        try {
          const content = document.getElementById('page-content');
          if (!content) return;
          const newHtml = this.render_dashboard();
          if (typeof morphdom !== 'undefined') {
            const tmp = document.createElement('div');
            tmp.innerHTML = newHtml;
            morphdom(content, tmp, {
              childrenOnly: true,
              onBeforeElUpdated: (from, to) => {
                if (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA' || from.tagName === 'SELECT') {
                  if (from === document.activeElement) return false;
                }
                return true;
              }
            });
            this.afterRender('dashboard');
          } else {
            this.navigate('dashboard');
          }
        } catch (e) { console.warn('dash refresh:', e); }
      }, 200);
    };
    // 'latestFeedbackError' was missing from this list, so when an
    // API call failed and set the error, no re-render fired — the
    // dashboard kept showing the loading spinner forever. The user
    // saw "コメントが出なくなりました". Same for 'isAnalyzing': when
    // it flips to false we need the dashboard to pick it up.
    ['textEntries', 'symptoms', 'vitals', 'sleepData', 'activityData', 'integrationSyncs', 'latestFeedback', 'latestFeedbackError', 'isAnalyzing', 'plaudAnalyses']
      .forEach(key => store.on(key, scheduleDashRefresh));

    // Start the auto-sync scheduler so connected integrations
    // (Fitbit, Google Calendar) refresh automatically while the
    // app is open — set up once, update forever.
    try { Integrations.autoSync.init(); } catch (e) { console.warn('autoSync init:', e); }

    // Capture referral ID from URL (?ref=xxx). Stored in
    // localStorage so it survives until the user signs up, at
    // which point touchUserMetadata writes it to users/{uid}.
    // referredBy. Overwrites any existing value so the latest
    // referrer wins — prevents stale refs from old invitations.
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get('ref');
      if (ref && /^[a-zA-Z0-9_\-]{3,32}$/.test(ref)) {
        localStorage.setItem('referrer_id', ref);
        console.log('[Referral] captured ref=' + ref);
      }
    } catch (_) {}

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

    // Calendar events are loaded per-user from Firestore (users/{uid}/calendarEvents).
    // Never hardcode personal schedule data in source — the built index.html is
    // publicly served, so any hardcoded events would be exposed to anyone who
    // views source. If no events exist yet, start empty; the user can sync
    // their own Google Calendar via the integrations page.
    if (!store.get('calendarEvents')) {
      store.set('calendarEvents', []);
    }
  }

  // #10 Hash routing — enables browser back/forward and bookmarks
  _initHashRouter() {
    window.addEventListener('hashchange', () => {
      const hash = location.hash.replace('#/', '').replace('#', '') || 'dashboard';
      if (hash !== this.currentPage && !this._navigating) {
        this.navigate(hash, true);
      }
    });
  }

  navigate(page, fromHash = false) {
    if (['admin', 'analysis'].includes(page) && !this.isAdmin()) {
      Components.showToast('この機能は管理者専用です', 'error');
      return;
    }

    this._navigating = true;
    this.currentPage = page;
    if (!fromHash) {
      const newHash = '#/' + page;
      if (location.hash !== newHash) location.hash = newHash;
    }
    this._navigating = false;
    const content = document.getElementById('page-content');
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('top-bar');
    if (!content) return;

    // Hide admin-only nav items for non-admin users
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = this.isAdmin() ? '' : 'none';
    });

    // Show/hide sidebar for login/disease-select. The 'privacy'
    // page is accessible both before and after login, so only
    // hide the sidebar when the user is not yet authenticated.
    const hideChrome = ['login', 'disease-select'].includes(page)
      || (page === 'privacy' && !store.get('isAuthenticated'));
    if (hideChrome) {
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
      settings: '設定',
      privacy: 'プライバシーと安全'
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
        content.innerHTML = `<div style="padding:20px"><p>ページの読み込みエラー</p><p style="font-size:12px;color:#94a3b8">${err.message}</p><button onclick="store.clearAll();location.reload()" style="margin-top:10px;padding:8px 16px;background:#6C63FF;color:white;border:none;border-radius:8px;cursor:pointer">リセットして再読み込み</button></div>`;
      }
    }
  }

  afterRender(page) {
    // Translate UI to user's selected language
    if (typeof i18n !== 'undefined' && i18n.translatePage) {
      try { i18n.translatePage(); } catch (_) {}
    }
    // Populate the "選択疾患の規模" banner on the login page when it
    // first mounts — otherwise a user returning with diseases already
    // cached in localStorage sees an empty box until they click a tag.
    if (page === 'login') {
      try { this.updateSelectedDiseaseScale(); } catch (_) {}
      try { this.loadPublicUserCount(); } catch (_) {}
    }
    // Surface the first-time user onboarding widget on dashboard
    // when the user has 0 records. This pushes them into their
    // first quick action.
    if (page === 'dashboard') {
      try { this.maybeShowFirstTimeOnboarding(); } catch (_) {}
    }
    if (page === 'dashboard') {
      this.initDashboardCharts();
      setTimeout(() => this.initNutritionCharts(), 100);
      // Plaud 禅トラック charts (read latest analysis from store and
      // initialize the four panels: focus radar, signals, calorie,
      // net value trend). Skip silently if no analyses yet.
      //
      // 400ms delay: must be LONGER than scheduleDashRefresh's 200ms
      // debounce. At 150ms (old value) the charts were drawn on
      // canvases that were then destroyed 50ms later by the debounced
      // re-render — the user saw charts flash and disappear, or never
      // appear at all. 400ms guarantees the last scheduleDashRefresh
      // has already settled.
      setTimeout(() => {
        const analyses = store.get('plaudAnalyses') || [];
        if (analyses.length === 0) return;
        const latest = analyses[analyses.length - 1];
        const j = latest.json || {};

        // If the model failed to produce structured JSON, the chart
        // data is all-zero and appears as "empty" canvases. Show the
        // full-text report as a fallback in that case.
        const hasStructuredData = j.conscious_focus || j.signals || j.calories;
        if (!hasStructuredData) {
          // Skip chart init — the widget HTML already shows the
          // fullText report in a <details> element. Make it visible.
          const details = document.querySelector('#plaud-widget-card details');
          if (details) details.open = true;
          return;
        }

        const cf = j.conscious_focus || {};
        const dims = cf.dims_pct || {};
        const signals = j.signals || {};
        const cal = j.calories || {};
        const netHistory = analyses.slice(-14).map(a => {
          const jj = a.json || {};
          const nv = jj.summary?.net_value ?? jj.summary?.pure_value ?? jj.summary?.['純価値'] ?? null;
          return { date: a.dateLabel, nv: typeof nv === 'number' ? nv : null };
        });
        try { this.initPlaudCharts(dims, signals, cal, netHistory); }
        catch (e) { console.warn('plaud charts:', e); }
      }, 400);
      setTimeout(() => this.loadDashResearch(), 300);
      setTimeout(() => this.loadActionRecommendations(), 600);
    }
    if (page === 'actions') {
      setTimeout(() => this.loadActionRecommendations(), 300);
    }
    if (page === 'research') {
      setTimeout(() => this.autoLoadResearchPage(), 300);
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

  // ── Data diagnosis ──
  // Counts the actual document count in each Firestore subcollection
  // for the current user, and compares with what's currently loaded
  // into the in-memory store. Reveals discrepancies that explain
  // "my data disappeared!" panics — typically caused by:
  //   - listener filtered by orderBy('createdAt') excluding old docs
  //   - permission-denied silently failing
  //   - listener never started because userId was null at sub time
  // Reads are unfiltered (.get() with no orderBy / where) so even
  // documents missing standard timestamp fields are counted.
  async runDataDiagnosis() {
    const out = document.getElementById('data-diagnosis-result');
    if (!out) return;
    out.innerHTML = '<div style="color:var(--text-muted)">⏳ 診断中…（Firestore に問い合わせ中）</div>';
    if (!FirebaseBackend?.userId) {
      out.innerHTML = '<div style="color:var(--danger,#dc2626)">未ログインです。ログインしてから実行してください。</div>';
      return;
    }
    const subs = [
      ['textEntries', 'textEntries', 'テキスト記録'],
      ['symptoms', 'symptoms', '症状'],
      ['vitals', 'vitals', 'バイタル'],
      ['sleep', 'sleepData', '睡眠'],
      ['activity', 'activityData', '活動'],
      ['bloodTests', 'bloodTests', '血液検査'],
      ['medications', 'medications', '薬'],
      ['conversations', 'conversationHistory', 'AI チャット']
    ];
    const rows = [];
    let totalFirestore = 0, totalStore = 0;
    for (const [fbKey, storeKey, label] of subs) {
      let cloudCount = 0, oldest = null, newest = null, errMsg = '';
      try {
        const snap = await FirebaseBackend.userCollection(fbKey).limit(1000).get();
        cloudCount = snap.size;
        snap.forEach(d => {
          const data = d.data() || {};
          const t = data.timestamp || data.createdAt || data.date || data.recordedAt;
          let ms = 0;
          if (t && typeof t === 'object' && typeof t.toMillis === 'function') ms = t.toMillis();
          else if (t instanceof Date) ms = t.getTime();
          else if (typeof t === 'string') { const p = Date.parse(t); ms = isNaN(p) ? 0 : p; }
          else if (typeof t === 'number') ms = t;
          if (ms) {
            if (!oldest || ms < oldest) oldest = ms;
            if (!newest || ms > newest) newest = ms;
          }
        });
      } catch (err) {
        errMsg = err.code || err.message || String(err);
      }
      const storeArr = store.get(storeKey) || [];
      const storeCount = Array.isArray(storeArr) ? storeArr.length : 0;
      totalFirestore += cloudCount;
      totalStore += storeCount;
      const fmt = (ms) => {
        if (!ms) return '—';
        const d = new Date(ms);
        return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
      };
      const mismatch = cloudCount !== storeCount;
      rows.push(`
        <tr style="${mismatch ? 'background:#fef3c7' : ''}">
          <td style="padding:6px 8px;font-size:12px">${label}</td>
          <td style="padding:6px 8px;font-size:12px;text-align:right;font-weight:${cloudCount > 0 ? '600' : 'normal'}">${errMsg ? '<span style="color:var(--danger,#dc2626)">' + errMsg + '</span>' : cloudCount.toLocaleString()}</td>
          <td style="padding:6px 8px;font-size:12px;text-align:right">${storeCount.toLocaleString()}</td>
          <td style="padding:6px 8px;font-size:11px;color:var(--text-muted)">${fmt(oldest)} → ${fmt(newest)}</td>
        </tr>
      `);
    }
    const verdict = totalFirestore > totalStore
      ? `<div style="background:#fef3c7;padding:10px;border-radius:6px;margin-bottom:10px;font-size:13px;color:#92400e"><strong>⚠️ 不一致を検出</strong>: クラウドには ${totalFirestore} 件、画面には ${totalStore} 件のみ。<br>「☁️ クラウドから強制再読込」を押してください。</div>`
      : totalFirestore === 0 && totalStore === 0
        ? `<div style="background:#dbeafe;padding:10px;border-radius:6px;margin-bottom:10px;font-size:13px;color:#1e40af"><strong>ℹ️ データはまだありません。</strong></div>`
        : `<div style="background:#dcfce7;padding:10px;border-radius:6px;margin-bottom:10px;font-size:13px;color:#166534"><strong>✓ クラウドと画面の件数が一致しています。</strong></div>`;
    out.innerHTML = verdict + `
      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid var(--border);border-radius:6px;overflow:hidden">
        <thead><tr style="background:var(--bg-tertiary)">
          <th style="padding:8px;text-align:left;font-weight:600;font-size:11px">データ種別</th>
          <th style="padding:8px;text-align:right;font-weight:600;font-size:11px">クラウド件数</th>
          <th style="padding:8px;text-align:right;font-weight:600;font-size:11px">画面件数</th>
          <th style="padding:8px;text-align:left;font-weight:600;font-size:11px">期間</th>
        </tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    `;
  }

  // Force a fresh re-fetch from Firestore (bypasses the local cache).
  // Useful when the realtime listener missed entries due to a stale
  // index, an old orderBy filter, or a permission-denied that has
  // since been fixed.
  async forceReloadFromCloud() {
    const out = document.getElementById('data-diagnosis-result');
    if (!FirebaseBackend?.userId) {
      if (out) out.innerHTML = '<div style="color:var(--danger,#dc2626)">未ログインです。</div>';
      return;
    }
    if (out) out.innerHTML = '<div style="color:var(--text-muted)">⏳ クラウドから再取得中…</div>';
    try {
      // Tear down + recreate listeners so the new fetch returns fresh server data.
      FirebaseBackend.cleanupListeners?.();
      FirebaseBackend.subscribeToCollections();
      FirebaseBackend.subscribeToSettings();
      // Wait briefly for snapshots to arrive, then run diagnosis.
      await new Promise(r => setTimeout(r, 1500));
      await this.runDataDiagnosis();
      Components.showToast?.('クラウドから再読込しました', 'success');
    } catch (err) {
      console.error('[forceReloadFromCloud]', err);
      if (out) out.innerHTML = '<div style="color:var(--danger,#dc2626)">再読込に失敗しました: ' + Components.escapeHtml(err.message || String(err)) + '</div>';
    }
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

  // Direct mode has been removed — all calls go through the Worker.
  // This stub remains for backward compatibility with any saved
  // onclick handlers that reference it.
  setAnthropicMode(_mode) {
  }

  async saveApiKeys() {
    if (!this.isAdmin()) {
      const seen = this.currentUserEmail() || '(未ログイン)';
      Components.showToast(
        'APIキー設定は管理者専用です。現在のログイン: ' + seen
        + '\n管理者は agewaller@gmail.com です。一度ログアウト → 再ログインしてください。',
        'error'
      );
      console.warn('[saveApiKeys] admin check failed. seen email:', seen, 'ADMIN_EMAILS:', this.ADMIN_EMAILS);
      return;
    }
    const keys = ['anthropic', 'openai', 'google'];
    const keyData = {};
    let saved = 0;
    let proxyUrl = '';
    // Save proxy URL
    const proxyEl = document.getElementById('input-proxy-url');
    if (proxyEl && proxyEl.value.trim()) {
      proxyUrl = proxyEl.value.trim();
      localStorage.setItem('anthropic_proxy_url', proxyUrl);
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
      // Save to global admin config so all users inherit these settings
      if (FirebaseBackend.initialized) {
        const globalConfig = { apiKeys: keyData };
        if (proxyUrl) globalConfig.proxyUrl = proxyUrl;
        // Include the current Anthropic transport mode so other users
        // inherit the admin's choice (direct vs proxy).
        const mode = localStorage.getItem('anthropic_mode');
        if (mode) globalConfig.anthropicMode = mode;
        await FirebaseBackend.saveGlobalConfig(globalConfig);
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

    const model = store.get('selectedModel') || 'claude-opus-4-6';
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
    if (!this.isAdmin()) {
      Components.showToast('APIキー設定は管理者専用です', 'error');
      return;
    }
    ['anthropic', 'openai', 'google'].forEach(k => {
      localStorage.removeItem('apikey_' + k);
      const el = document.getElementById('input-apikey-' + k);
      if (el) el.value = '';
    });
    if (FirebaseBackend.initialized) {
      await FirebaseBackend.saveGlobalConfig({ apiKeys: {} });
    }
    Components.showToast('すべてのAPIキーを削除しました', 'info');
    this.loadApiKeyFields();
  }

  // ---- Auth ----
  // Display a diagnostic error on the login page. Silent fallbacks
  // hid every actionable failure mode from the user; this surfaces
  // exactly what went wrong so we can distinguish popup blocked vs
  // unauthorized domain vs Firebase disabled vs app-internal throw.
  showLoginError(message) {
    const el = document.getElementById('login-error');
    if (el) {
      el.style.display = 'block';
      el.textContent = message;
    }
    console.error('[loginWithGoogle]', message);
  }

  async loginWithGoogle() {
    // Clear any previous error banner
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.style.display = 'none';

    // In-app browsers (LINE, Instagram, Facebook, Twitter WebViews)
    // block Google OAuth entirely. Google returns "アクセスをブロック:
    // care-14c31.firebaseapp.com のリクエストは Google のポリシーに
    // 準拠していません". Detect and guide the user BEFORE the popup
    // attempt — otherwise they see a cryptic Google error page.
    const ua = navigator.userAgent || '';
    const isInApp = /Line\//i.test(ua) || /FBAN|FBAV/i.test(ua) ||
      /Instagram/i.test(ua) || /Twitter/i.test(ua) ||
      /MicroMessenger/i.test(ua) || /wv\)/i.test(ua);
    if (isInApp) {
      this.showLoginError(
        'アプリ内ブラウザでは Google ログインが使えません。' +
        'Safari または Chrome でこのページを開き直すか、下のメールアドレスで登録してください。'
      );
      return;
    }

    if (!FirebaseBackend.initialized) {
      this.showLoginError('Firebase が初期化できていません。ページを再読み込みしてお試しください。');
      return;
    }
    try {
      const user = await FirebaseBackend.signInWithGoogle();
      if (!user) {
        // Cancelled or popup blocked — signInWithGoogle already
        // surfaced a toast / error banner as appropriate.
        return;
      }
      // Belt-and-braces: if handleSignedInUser hasn't navigated yet
      // (race with an error in its internal path), kick it again.
      // Idempotent — no double-load thanks to the loadAllData guard.
      if (this.currentPage !== 'dashboard') {
        try { FirebaseBackend.handleSignedInUser(user); } catch (e) {
          this.showLoginError('ログイン後の画面切替でエラー: ' + (e?.message || e));
        }
      }
    } catch (err) {
      // Surface the FULL error to the user so we can diagnose. Before
      // this, the code silently fell back to loginWithPrompt (native
      // window.prompt) which is blocked on mobile and confusing on
      // desktop.
      this.showLoginError('ログインに失敗しました: ' + (err?.code ? err.code + ' — ' : '') + (err?.message || err));
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

  // Generic inline double-tap to proceed (mobile-safe, no modal dialogs)
  confirmAction(btn, label, callback) {
    if (!btn) return;
    if (btn.dataset.confirmed) { callback(); return; }
    const orig = btn.textContent;
    const origBg = btn.style.background;
    btn.dataset.confirmed = '1';
    btn.textContent = `${label}？もう一度押して確定`;
    btn.style.background = 'var(--danger)';
    btn.style.color = '#fff';
    setTimeout(() => {
      if (btn.dataset.confirmed) {
        btn.textContent = orig;
        btn.style.background = origBg;
        btn.style.color = '';
        delete btn.dataset.confirmed;
      }
    }, 4000);
  }

  confirmLogout() {
    const btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.outerHTML = `
      <div style="text-align:center;padding:12px;background:var(--danger-bg);border-radius:12px">
        <div style="font-size:13px;color:var(--danger);margin-bottom:10px">ログアウトしますか？</div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-danger" style="padding:10px 24px;font-size:14px" onclick="app.logout()">はい</button>
          <button class="btn btn-secondary" style="padding:10px 24px;font-size:14px" onclick="app.navigate('settings')">いいえ</button>
        </div>
      </div>`;
  }

  async logout() {
    try {
      if (FirebaseBackend.initialized) {
        await FirebaseBackend.signOut();
      }
    } catch(e) {
      console.warn('Logout error:', e);
    }
    // Always clear auth state and go to login
    store.update({ user: null, isAuthenticated: false });
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

    // Invalidate disease-dependent caches (research/actions/feedback)
    store.set('cachedResearch', null);
    store.set('cachedActions', null);
    store.set('latestFeedback', null);

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

  // Handle photo selection from the 📸 写真 modal. Reads each file
  // as a data URL, saves it to textEntries for timeline display, and
  // fires the image_analysis prompt via analyzeViaAPI so the user gets
  // a deep analysis (medication recognition, food calorie estimation,
  // lab result reading, etc.) right inside the modal.
  handleModalPhotoUpload(files) {
    if (!files || !files.length) return;
    const resultEl = document.getElementById('modal-photo-result');

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        Components.showToast('画像ファイルのみ対応しています', 'error');
        return;
      }

      if (resultEl) resultEl.innerHTML = Components.loading('写真を認識中...');

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rawDataUrl = ev.target.result;
        const compressed = await Components.compressImage(rawDataUrl);

        const entry = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          timestamp: new Date().toISOString(),
          category: '写真',
          type: 'file_upload',
          title: `📸 ${file.name}`,
          content: `写真をアップロードしました（${(file.size / 1024).toFixed(0)}KB）`,
          dataUrl: compressed,
          previewImage: compressed,
          source: 'photo_modal'
        };
        const textEntries = store.get('textEntries') || [];
        textEntries.push(entry);
        store.set('textEntries', textEntries);

        store.addHealthData('photos', {
          filename: file.name,
          type: file.type,
          size: file.size,
          dataUrl: compressed,
          category: '写真'
        });

        // Run AI image analysis. Send the compressed payload (800px
        // JPEG@0.7, ~100-300KB) — the raw ev.target.result can be 5-7MB
        // for iPhone photos which pushes us past Anthropic's vision
        // block size limit and the Worker payload ceiling. Storage /
        // preview uses the same compressed copy above.
        try {
          const result = await this.analyzeViaAPI(
            `[写真: ${file.name}]`,
            'image_analysis',
            { imageBase64: compressed }
          );
          if (resultEl) {
            resultEl.innerHTML = this.renderAnalysisCard(result);
          }
          // Save AI comment linked to the entry
          this.saveAIComment(entry.id, result);
          store.set('latestFeedback', result);
          Components.showToast('写真の分析が完了しました', 'success');
        } catch (err) {
          console.error('[handleModalPhotoUpload]', err);
          if (resultEl) {
            resultEl.innerHTML = `<div style="color:var(--danger);font-size:12px;padding:10px">分析エラー: ${Components.escapeHtml(err?.message || String(err))}</div>`;
          }
        }
      };
      reader.readAsDataURL(file);
    });
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
    if (store.get('isAnalyzing')) {
      Components.showToast('分析中です。完了までお待ちください。', 'info');
      return;
    }
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

    // Kick off the 5-minute post-comment timer so the セルフケア panel
    // (loadActionRecommendations) re-evaluates its gate once the user
    // has presumably finished typing. Each new comment resets the
    // timer, so the update only fires after the LAST comment in a
    // burst. The gate itself still applies the 1-per-day cap (B-7).
    clearTimeout(this._actionRefreshTimer);
    this._actionRefreshTimer = setTimeout(() => {
      this.loadActionRecommendations();
    }, 5 * 60 * 1000 + 1000);

    // Also store as health data in the appropriate category
    const stateKey = store.categoryToStateKey(category);
    if (stateKey && Array.isArray(store.get(stateKey))) {
      store.addHealthData(category, { text_note: content, title: title });
    }

    // Clear form
    document.getElementById('text-input-content').value = '';
    document.getElementById('text-input-title').value = '';

    // Flip analyzing/feedback flags BEFORE navigating so the
    // dashboard renders the loading spinner rather than the stale
    // feedback, and so the scheduleDashRefresh listener that fires
    // 200ms after store.set('textEntries', ...) above keeps showing
    // the spinner instead of wiping it.
    store.set('latestFeedback', null);
    store.set('latestFeedbackError', null);
    store.set('isAnalyzing', true);

    // Navigate to dashboard and run API analysis
    this.navigate('dashboard');
    Components.showToast('保存しました', 'success');

    const inputWithContext = `[${category}] ${title ? title + ': ' : ''}${content}`;
    const promptType = category === 'conversation' ? 'conversation_analysis' : 'text_analysis';
    this.analyzeViaAPI(inputWithContext, promptType)
      .then(result => {
        store.set('isAnalyzing', false);
        if (result && result._fromAPI === false) {
          const errText = result._error || result.findings || '分析に失敗しました';
          store.set('latestFeedbackError', errText);
          return;
        }
        store.set('latestFeedback', result);
        this.saveAIComment(entry.id, result);
      })
      .catch(err => {
        console.error('[submitTextEntry] analyzeViaAPI failed:', err);
        store.set('isAnalyzing', false);
        store.set('latestFeedbackError', err?.message || String(err));
      });
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
  //
  // Refresh policy (B-7). Before this rewrite, every textEntry write
  // invalidated the cache and fired a fresh AI call, so 3 comments in
  // a row meant 3 AI calls, and reloading the page always triggered a
  // new call even when nothing had changed. Now:
  //   - Already updated today (JST)                → skip
  //   - No comment logged today                    → skip
  //   - Last comment less than 5 minutes ago       → skip (mid-typing)
  //   - Otherwise                                  → fire once, cache
  //
  // The gate lives in _shouldRefreshActions so both the dashboard
  // widget and the actions page go through the same logic.
  async loadActionRecommendations() {
    // The container has different IDs on the dashboard vs the actions
    // page. Previously only 'action-live-recs' (actions page) was
    // checked, so the dashboard's 'dash-actions-live' div always
    // stayed empty — the user saw "クリニック・イベント" with nothing
    // inside.
    const container = document.getElementById('action-live-recs')
      || document.getElementById('dash-actions-live');
    if (!container) return;

    const cached = store.get('cachedActions');
    // Always paint the cached result first so the panel never goes
    // blank between tab switches or while the gate is deciding whether
    // to refresh.
    if (cached && cached.html) {
      container.innerHTML = cached.html;
    }

    if (!this._shouldRefreshActions()) {
      if (!cached || !cached.html) {
        container.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;line-height:1.7">
          今日のコメントを書くと、<br>
          あなた向けのセルフケア提案がここに表示されます。
        </div>`;
      }
      return;
    }

    // Build verified search links FIRST (these always work), then
    // optionally layer AI advice text on top. The old approach asked
    // the AI to generate URLs, which it hallucinated 100% of the
    // time — every link led to a 404 or irrelevant page.
    const diseases = store.get('selectedDiseases') || [];
    const profile = store.get('userProfile') || {};
    const verifiedLinksHtml = this.buildVerifiedActionLinks(diseases, profile);

    container.innerHTML = Components.loading('あなたに合った情報を準備中...');

    // Fire AI advice in the background. If it fails, verified links
    // are shown alone (still useful).
    const langDirective = aiEngine._languageDirectiveFor(profile.language || 'ja');
    // Pull every textEntry written since the last successful refresh
    // (or the last 24h on first run) so multi-day gaps don't drop
    // accumulated comments. Cap at 30 entries / 3000 chars to keep the
    // prompt under control.
    const sinceTs = (cached && cached.fetchedAt) || (Date.now() - 24 * 60 * 60 * 1000);
    const recentEntries = (store.get('textEntries') || [])
      .filter(e => new Date(e.timestamp).getTime() > sinceTs)
      .slice(-30);
    const recentText = recentEntries.map(e => e.content || '').join('\n').substring(0, 3000);
    const randomSeed = Math.floor(Date.now() / 86400000);
    const prompt = `${langDirective}

あなたは慢性疾患患者の生活改善パートナーです。
以下のユーザー情報に基づいて、今日おすすめの養生ヒントを3つ提案してください。
必ず寄り添いの言葉から始め、毎回新しいアプローチを1つ含めてください。

【重要】URLやリンクは一切出力しないでください（リンクはシステム側で別途提供します）。
テキストのみで、具体的で温かいアドバイスに集中してください。

【ユーザー情報】
疾患: ${diseases.join(', ') || '未設定'}
居住地: ${profile.location || '未設定'}
年齢: ${profile.age || '未設定'}
ランダムシード: ${randomSeed}（毎日異なる提案をする）

【最近の記録】
${recentText || '記録なし'}

以下の3カテゴリから1つずつ提案:
1. 🏥 今日できるセルフケア（具体的な方法と理由）
2. 🌿 新しい試みの提案（ユーザーがまだ試していなさそうなもの）
3. 💪 励ましと次のステップ（継続のモチベーション）`;

    let aiAdviceHtml = '';
    try {
      const response = await aiEngine.callModel(store.get('selectedModel'), prompt, { maxTokens: 1500 });
      if (typeof response === 'string' && response.length > 50) {
        aiAdviceHtml = `
          <div style="margin-bottom:16px">
            <div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(response)}</div>
          </div>`;
      }
    } catch (err) {
      console.warn('[Action Recs] AI advice failed:', err.message);
    }

    const html = aiAdviceHtml + verifiedLinksHtml;
    container.innerHTML = html;
    const todayJst = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    store.set('cachedActions', { html, fetchedAt: Date.now(), fetchedDateJst: todayJst });
  }

  // Gate for loadActionRecommendations (B-7). Returns true only when
  // the panel is allowed to fetch new advice right now.
  _shouldRefreshActions() {
    const cached = store.get('cachedActions');
    const todayJst = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    // 1-per-day cap, same pattern as deepAnalysisLastRun (pages.js:610).
    if (cached && cached.fetchedDateJst === todayJst) return false;

    // Need at least one comment today so the advice is actually
    // grounded in fresh user data.
    const todayEntries = (store.get('textEntries') || []).filter(e =>
      new Date(e.timestamp).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }) === todayJst
    );
    if (todayEntries.length === 0) return false;

    // Wait at least 5 minutes after the user's most recent comment so
    // mid-typing doesn't trigger an update. The gate is re-checked on
    // every scheduleDashRefresh tick and on the explicit 5-minute
    // post-submit re-invocation in submitTextEntry.
    const lastTs = new Date(todayEntries[todayEntries.length - 1].timestamp).getTime();
    if ((Date.now() - lastTs) < 5 * 60 * 1000) return false;

    return true;
  }

  // Build a grid of VERIFIED search links (real URLs that always lead
  // to working search results). These are NOT AI-generated — every URL
  // is a search template that produces relevant results on the
  // platform it targets.
  buildVerifiedActionLinks(diseases, profile) {
    const lang = profile.language || 'ja';
    const loc = (profile.location || '').toLowerCase();
    const isJapan = lang === 'ja' || /日本|tokyo|osaka|神奈川|東京|秦野|大阪|京都|北海道|名古屋|福岡/.test(loc);
    const isUS = /us|usa|america|new york|california|texas|chicago|los angeles/.test(loc);
    const isUK = /uk|england|london|manchester|birmingham/.test(loc);
    const userLocation = profile.location || (isJapan ? '関東' : '');

    // Disease → search term mapping
    const diseaseTerms = {
      mecfs: { ja: 'ME/CFS 慢性疲労症候群', en: 'ME/CFS chronic fatigue' },
      depression: { ja: 'うつ病', en: 'depression' },
      fibromyalgia: { ja: '線維筋痛症', en: 'fibromyalgia' },
      long_covid: { ja: 'Long COVID コロナ後遺症', en: 'long COVID' },
      pots: { ja: '起立性頻脈症候群 POTS', en: 'POTS dysautonomia' },
      diabetes_t2: { ja: '2型糖尿病', en: 'type 2 diabetes' },
      hashimoto: { ja: '橋本病 甲状腺', en: 'Hashimoto thyroiditis' },
      ibs: { ja: '過敏性腸症候群 IBS', en: 'IBS' },
      insomnia: { ja: '不眠症 睡眠', en: 'insomnia sleep' },
      bipolar: { ja: '双極性障害', en: 'bipolar disorder' },
      ptsd: { ja: 'PTSD トラウマ', en: 'PTSD trauma' },
      adhd: { ja: 'ADHD 発達障害', en: 'ADHD' },
    };
    const primaryDisease = diseases[0] || 'mecfs';
    const dt = diseaseTerms[primaryDisease] || diseaseTerms.mecfs;
    const diseaseLabel = isJapan ? dt.ja : dt.en;

    // ── Section 1: Clinic search ──
    const clinicLinks = [];
    if (isJapan) {
      clinicLinks.push({ icon: '🏥', label: '病院なびで検索', url: `https://byoinnavi.jp/search?q=${encodeURIComponent(dt.ja + ' ' + userLocation)}` });
      clinicLinks.push({ icon: '📋', label: 'カルーで口コミ検索', url: `https://caloo.jp/hospitals/search?q=${encodeURIComponent(dt.ja)}` });
      clinicLinks.push({ icon: '🗺️', label: 'Google Mapで近くの病院', url: `https://www.google.com/maps/search/${encodeURIComponent(dt.ja + ' 病院 ' + userLocation)}` });
    } else if (isUS) {
      clinicLinks.push({ icon: '🏥', label: 'Find on Zocdoc', url: `https://www.zocdoc.com/search?dr_specialty=${encodeURIComponent(dt.en)}` });
      clinicLinks.push({ icon: '📋', label: 'Healthgrades', url: `https://www.healthgrades.com/find-a-doctor?q=${encodeURIComponent(dt.en)}` });
    } else if (isUK) {
      clinicLinks.push({ icon: '🏥', label: 'NHS Find a Service', url: `https://www.nhs.uk/service-search/find-a-service?q=${encodeURIComponent(dt.en)}` });
    } else {
      clinicLinks.push({ icon: '🏥', label: 'Google Mapで病院検索', url: `https://www.google.com/maps/search/${encodeURIComponent(dt.en + ' clinic ' + userLocation)}` });
    }

    // ── Section 2: Events / workshops ──
    const eventLinks = [];
    if (isJapan) {
      eventLinks.push({ icon: '🧘', label: 'Peatixでイベント検索', url: `https://peatix.com/search?q=${encodeURIComponent(diseaseLabel + ' ' + userLocation)}` });
      eventLinks.push({ icon: '📚', label: 'ストアカで講座検索', url: `https://www.street-academy.com/search?q=${encodeURIComponent('マインドフルネス ヨガ 栄養')}` });
      eventLinks.push({ icon: '♨️', label: '温泉療法施設を探す', url: `https://www.google.com/search?q=${encodeURIComponent('温泉療法 ' + userLocation + ' 療養')}` });
    } else {
      eventLinks.push({ icon: '🧘', label: 'Eventbrite', url: `https://www.eventbrite.com/d/online/${encodeURIComponent(dt.en + ' support wellness')}` });
      eventLinks.push({ icon: '👥', label: 'Meetup Groups', url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(dt.en + ' support group')}` });
    }

    // ── Section 3: Patient communities ──
    const communityLinks = [];
    communityLinks.push({ icon: '💬', label: isJapan ? 'Reddit (患者コミュニティ)' : 'Reddit Community', url: `https://www.reddit.com/search/?q=${encodeURIComponent(dt.en + ' support')}` });
    if (isJapan) {
      communityLinks.push({ icon: '📖', label: 'noteで体験記を読む', url: `https://note.com/search?q=${encodeURIComponent(dt.ja + ' 闘病記')}` });
      communityLinks.push({ icon: '🔬', label: '難病情報センター', url: 'https://www.nanbyou.or.jp/' });
    } else {
      communityLinks.push({ icon: '👥', label: 'PatientsLikeMe', url: `https://www.patientslikeme.com/conditions/${encodeURIComponent(dt.en.toLowerCase().replace(/\s+/g, '-'))}` });
      communityLinks.push({ icon: '🔬', label: 'ClinicalTrials.gov', url: `https://clinicaltrials.gov/search?term=${encodeURIComponent(dt.en)}` });
    }

    // ── Section 4: Supplements / products ──
    const shopLinks = [];
    shopLinks.push({ icon: '💊', label: isJapan ? 'iHerbでサプリ検索' : 'iHerb Supplements', url: `https://www.iherb.com/search?kw=${encodeURIComponent(dt.en + ' supplement')}&rcode=CHRONICCARE` });
    if (isJapan) {
      shopLinks.push({ icon: '🛒', label: 'Amazonで検索', url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(dt.ja + ' サプリメント')}&tag=forestvoice-22` });
    } else {
      shopLinks.push({ icon: '🛒', label: 'Amazon', url: `https://www.amazon.com/s?k=${encodeURIComponent(dt.en + ' supplement')}` });
    }

    const renderSection = (title, links) => `
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px">${title}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline" style="font-size:11px;display:inline-flex;align-items:center;gap:4px"><span>${l.icon}</span>${Components.escapeHtml(l.label)}</a>`).join('')}
        </div>
      </div>`;

    return `
      <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:8px">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:10px">🔗 検証済みリンク（すべてクリックで実際のサイトに飛びます）</div>
        ${renderSection('🏥 クリニック・医療機関を探す', clinicLinks)}
        ${renderSection('🧘 ワークショップ・イベント', eventLinks)}
        ${renderSection('💬 患者コミュニティ・体験記', communityLinks)}
        ${renderSection('💊 サプリメント・検査キット', shopLinks)}
      </div>`;
  }

  async loadDashResearch() {
    const container = document.getElementById('dash-research');
    if (!container) return;

    // Check cache: only fetch once per day. Invalidate if the user
    // switched languages since last fetch — cached translations would
    // be in the wrong language.
    const currentLang = (store.get('userProfile') || {}).language || 'ja';
    const cached = store.get('cachedResearch');
    const now = Date.now();
    if (cached && cached.articles && (now - cached.fetchedAt) < 24 * 60 * 60 * 1000
        && cached.lang === currentLang) {
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

      // Pre-translate titles into the user's language so the list is
      // readable at a glance without clicking "日本語で読む". One batch
      // AI call per fetch (not per article) keeps cost minimal. Results
      // are cached alongside the articles so reloads don't re-translate.
      const lang = (store.get('userProfile') || {}).language || 'ja';
      if (lang !== 'en') {
        try {
          articles = await this.translateArticlesList(articles, lang);
        } catch (err) {
          console.warn('[loadDashResearch] translation failed, showing originals:', err.message);
        }
      }

      // Cache results (with translations if any)
      store.set('cachedResearch', { articles, fetchedAt: Date.now(), lang });
      this.renderDashResearch(container, articles);
    } catch (err) {
      container.innerHTML = `<p style="font-size:12px;color:var(--text-muted);padding:10px">論文検索中にエラーが発生しました</p>`;
    }
  }

  // Translate an array of PubMed articles into the user's language in
  // a single batched AI call. Adds `titleTranslated` to each article.
  // Falls through gracefully if no API key is available — the renderer
  // will use the original title and the "日本語で読む" fallback link.
  async translateArticlesList(articles, targetLang) {
    if (!articles || articles.length === 0) return articles;
    const langNames = {
      ja: '日本語', en: 'English', zh: '中文', ko: '한국어',
      es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português',
      th: 'ไทย', vi: 'Tiếng Việt', ar: 'العربية', hi: 'हिन्दी'
    };
    const targetName = langNames[targetLang] || targetLang;
    const titles = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');
    const prompt = `以下の医学論文のタイトルを ${targetName} に翻訳してください。
専門用語は自然な表現で訳し、タイトルの意味と文脈を正確に伝えてください。
番号順に、1行1件で翻訳のみを返してください。余計な説明や前置きは不要です。

${titles}`;
    try {
      const response = await aiEngine.callModel(store.get('selectedModel'), prompt, { maxTokens: 1500 });
      const text = typeof response === 'string' ? response : String(response || '');
      // Parse "1. ...\n2. ...\n" format into an array. Also handles
      // full-width numbers "１．" that some models use in Japanese output.
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const translated = [];
      const toHalfWidth = (s) => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
      for (const rawLine of lines) {
        const line = toHalfWidth(rawLine).replace(/[．、。]/g, '.');
        const m = line.match(/^(\d+)[.\s　)]+(.+)/);
        if (m) {
          const idx = parseInt(m[1], 10) - 1;
          if (idx >= 0 && idx < articles.length) translated[idx] = m[2].trim();
        }
      }
      return articles.map((a, i) => ({
        ...a,
        titleTranslated: translated[i] || a.title,
        _translatedLang: targetLang
      }));
    } catch (err) {
      console.warn('[translateArticlesList] skipped:', err.message);
      return articles;
    }
  }

  renderDashResearch(container, articles) {
    container.innerHTML = articles.map(a => {
      const displayTitle = a.titleTranslated || a.title;
      const showOriginal = a.titleTranslated && a.titleTranslated !== a.title;
      return `
      <div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:600;line-height:1.4;margin-bottom:4px">${Components.escapeHtml(displayTitle)}</div>
        ${showOriginal ? `<div style="font-size:10px;color:var(--text-muted);font-style:italic;margin-bottom:4px">${Components.escapeHtml(a.title)}</div>` : ''}
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${Components.escapeHtml((a.authors||'').substring(0,60))} — ${Components.escapeHtml(a.journal || '')} (${Components.escapeHtml(a.date || '')})</div>
        <div style="display:flex;gap:6px">
          <a href="${a.translateUrl || a.url}" target="_blank" rel="noopener" style="font-size:10px;color:var(--accent)">全文を読む</a>
          <a href="${a.url}" target="_blank" rel="noopener" style="font-size:10px;color:var(--text-muted)">PubMed (原文)</a>
        </div>
      </div>`;
    }).join('') + `<div style="padding:8px 0"><button class="btn btn-outline btn-sm" onclick="app.navigate('research')" style="font-size:11px">もっと見る</button></div>`;
  }

  async autoLoadResearchPage() {
    const resultsArea = document.getElementById('pubmed-results');
    if (!resultsArea) return;
    // State lives in store, not DOM. The DOM gets blown away on every
    // render_research(), so relying on queryEl.value to decide whether
    // to overwrite (the old approach) always failed — the field was
    // empty at the time of the check, so the guard never caught the
    // user's saved keyword and the auto-generated query clobbered it
    // on every tab switch (B-2 / B-3).
    const savedQuery = (store.get('researchQuery') || '').trim();
    if (savedQuery) {
      // render_research already restored the input value and results
      // from store. Nothing to do — do NOT auto-search.
      return;
    }
    // First visit (no saved query): seed the input with a disease-
    // derived query and run once. Subsequent visits skip this branch
    // because searchPubMedLive persists researchQuery on every run.
    const diseases = store.get('selectedDiseases') || [];
    const diseaseTerms = {
      mecfs: 'ME/CFS OR chronic fatigue syndrome',
      depression: 'major depressive disorder',
      fibromyalgia: 'fibromyalgia',
      long_covid: 'long COVID OR post-COVID',
      pots: 'postural orthostatic tachycardia',
      diabetes_t2: 'type 2 diabetes',
      hashimoto: 'Hashimoto thyroiditis',
      ibs: 'irritable bowel syndrome',
      insomnia: 'insomnia treatment',
    };
    const terms = diseases.map(d => diseaseTerms[d]).filter(Boolean);
    const query = terms.length > 0 ? `(${terms.join(' OR ')})` : 'chronic disease management';
    const queryEl = document.getElementById('pubmed-search-query');
    if (queryEl) queryEl.value = query;
    this.searchPubMedLive();
  }

  async searchPubMedLive() {
    const query = document.getElementById('pubmed-search-query')?.value || 'ME/CFS';
    const days = parseInt(document.getElementById('pubmed-search-days')?.value || '90');
    const resultsArea = document.getElementById('pubmed-results');
    const lang = (store.get('userProfile') || {}).language || 'ja';
    if (!resultsArea) return;

    // Persist the query/days as soon as the user runs a search so that
    // re-rendering the page (tab switch) restores exactly what they
    // typed, not a disease-derived auto-query. Tied to B-2 / B-3 fix.
    store.set('researchQuery', query);
    store.set('researchDays', days);

    resultsArea.innerHTML = Components.loading('最新の研究論文を検索しています...');

    try {
      // Try with date filter first, then broaden
      let articles = await aiEngine.searchPubMed(query + ` AND ("last ${days} days"[dp])`, 20);
      if (articles.length === 0) {
        articles = await aiEngine.searchPubMed(query + ' AND ("last 365 days"[dp])', 20);
      }
      if (articles.length === 0) {
        articles = await aiEngine.searchPubMed(query, 20);
      }

      if (articles.length === 0) {
        const emptyHtml = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">現在、関連する論文が見つかりませんでした。<br>設定から疾患を選択すると、より適切な研究が見つかります。</div>';
        resultsArea.innerHTML = emptyHtml;
        store.set('researchResults', { html: emptyHtml, lang, savedAt: Date.now() });
        return;
      }

      // Show translated titles in the research page as well (not only
      // dashboard), so users can read the latest papers in their
      // selected profile language without relying on external
      // translation pages.
      if (lang !== 'en') {
        try {
          articles = await this.translateArticlesList(articles, lang);
        } catch (err) {
          console.warn('[searchPubMedLive] translation failed, showing originals:', err.message);
        }
      }

      const resultsHtml = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">${articles.length}件の研究論文</div>
        ${articles.map(a => `
          <div class="card" style="margin-bottom:12px">
            <div class="card-body" style="padding:14px 16px">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
                <span style="font-size:10px;color:var(--text-muted)">${Components.escapeHtml(a.journal || '')}</span>
                <span style="font-size:10px;color:var(--text-muted)">${Components.escapeHtml(a.date || '')}</span>
              </div>
              <h4 style="font-size:14px;font-weight:600;margin-bottom:6px;line-height:1.5">${Components.escapeHtml(a.titleTranslated || a.title)}</h4>
              ${(a.titleTranslated && a.titleTranslated !== a.title) ? `<div style="font-size:10px;color:var(--text-muted);font-style:italic;margin-bottom:6px">${Components.escapeHtml(a.title)}</div>` : ''}
              <p style="font-size:11px;color:var(--text-muted);margin-bottom:8px">${Components.escapeHtml((a.authors || '').substring(0, 80))}${(a.authors || '').length > 80 ? '...' : ''}</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <a href="${Components.escapeHtml(a.translateUrl || a.url || '#')}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="font-size:12px">この研究を読む</a>
                ${a.doiUrl ? `<a href="${Components.escapeHtml(a.doiUrl)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline" style="font-size:12px">論文全文</a>` : ''}
              </div>
            </div>
          </div>
        `).join('')}`;

      resultsArea.innerHTML = resultsHtml;
      // Cache the rendered HTML + language so render_research can
      // restore it on tab switch without re-hitting PubMed. Language
      // is tracked because translated titles go stale if the user
      // switches their profile language.
      store.set('researchResults', { html: resultsHtml, lang, savedAt: Date.now() });

      Components.showToast(`${articles.length}件の論文が見つかりました`, 'success');
    } catch (err) {
      resultsArea.innerHTML = `<div style="color:var(--danger);padding:20px">PubMed検索エラー: ${Components.escapeHtml(err.message || '')}</div>`;
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

    // Show typing indicator while we wait for the reply. The chat view
    // otherwise sits silent for 10-30 seconds, which elderly users read
    // as "the app froze".
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.insertAdjacentHTML('beforeend', Components.typingIndicator());
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

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

  async connectGoogleFit() {
    await Integrations.googleFit.connect();
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
    if (status) status.innerHTML = Components.loading('Apple Health / Apple Watch データを解析中...');
    try {
      const count = await Integrations.importFile(file);
      if (status) status.innerHTML = `<div style="color:var(--success);font-size:13px;padding:10px">${count}件のデータを取り込みました</div>`;
    } catch (err) {
      if (status) status.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px">エラー: ${err.message}</div>`;
    }
  }

  // Connect a Google Calendar (or any ICS feed) by pasting the
  // iCal secret URL. No OAuth flow required — Google Calendar
  // settings → "カレンダーの統合" → "iCal 形式の秘密アドレス".
  async connectGoogleCalendar() {
    const input = document.getElementById('gcal-ics-url');
    if (!input) return;
    const url = input.value.trim();
    if (!url) {
      Components.showToast('ICS URLを入力してください', 'error');
      return;
    }
    const status = document.getElementById('gcal-import-status');
    if (status) status.innerHTML = Components.loading('カレンダーを取得中...');
    try {
      const events = await CalendarIntegration.importFromIcsUrl(url);
      if (status) status.innerHTML = `<div style="color:var(--success);font-size:13px;padding:10px">✓ ${events.length}件のイベントを取り込みました</div>`;
      Components.showToast(`カレンダーから${events.length}件取り込みました`, 'success');
    } catch (err) {
      if (status) status.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px">✗ ${err.message}</div>`;
      Components.showToast(err.message, 'error');
    }
  }

  async connectGoogleCalendarWithGoogle() {
    const status = document.getElementById('gcal-import-status');
    if (status) status.innerHTML = Components.loading('Googleアカウント認証中...');
    try {
      if (!FirebaseBackend?.auth) throw new Error('Googleログインを有効にしてからお試しください');
      const currentUser = FirebaseBackend.auth.currentUser;
      if (!currentUser) {
        throw new Error('先にログインしてからGoogleカレンダー連携を行ってください');
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.setCustomParameters({
        prompt: 'consent',
        include_granted_scopes: 'true'
      });

      // Try to obtain a Google OAuth access token while preserving the
      // Firebase user session. We attempt reauthenticateWithPopup /
      // linkWithPopup first (these keep the current user intact), but
      // multiple Firebase SDK versions intermittently fail to populate
      // credential.accessToken for those methods — the user then sees
      // "Google認可トークンが見つかりません" even though the popup
      // completed successfully. We work around this in two ways:
      //   1. Read accessToken from multiple possible locations on the
      //      result object (cred.accessToken, result._tokenResponse.
      //      oauthAccessToken).
      //   2. If still missing, fall back to signInWithPopup which
      //      reliably exposes the access token. For same-account
      //      sign-ins this merely refreshes the session; the user's
      //      Firebase uid does not change.
      const extractAccessToken = (res) => {
        try {
          const cred = firebase.auth.GoogleAuthProvider.credentialFromResult(res);
          if (cred?.accessToken) return cred.accessToken;
        } catch (_) {}
        return res?._tokenResponse?.oauthAccessToken
          || res?.credential?.accessToken
          || null;
      };

      const hasGoogleProvider = Array.isArray(currentUser.providerData) &&
        currentUser.providerData.some(p => p.providerId === 'google.com');

      let accessToken = null;
      try {
        const result = hasGoogleProvider
          ? await currentUser.reauthenticateWithPopup(provider)
          : await currentUser.linkWithPopup(provider);
        accessToken = extractAccessToken(result);
      } catch (inner) {
        // Bubble up cancellation / block errors to the outer catch.
        if (inner?.code === 'auth/popup-closed-by-user'
            || inner?.code === 'auth/cancelled-popup-request'
            || inner?.code === 'auth/popup-blocked') {
          throw inner;
        }
        console.warn('[calendar] reauth/link path failed, falling back to signInWithPopup:', inner?.code || '', inner?.message || '');
      }

      if (!accessToken) {
        // Fallback: signInWithPopup. This replaces the current Firebase
        // session with a fresh one for the same Google account and
        // reliably returns an OAuth access token.
        const result2 = await FirebaseBackend.auth.signInWithPopup(provider);
        accessToken = extractAccessToken(result2);
        if (result2?.user) {
          FirebaseBackend.handleSignedInUser(result2.user);
        }
      }

      if (!accessToken) {
        throw new Error('Googleからアクセストークンを取得できませんでした。別のGoogleアカウントでお試しいただくか、ICS URL連携をご利用ください。');
      }
      // #4 Save token + expiry for future re-sync (1 hour validity)
      localStorage.setItem('google_calendar_access_token', accessToken);
      localStorage.setItem('google_calendar_token_expiry', String(Date.now() + 3500000));
      const events = await CalendarIntegration.importFromGoogleAccessToken(accessToken);

      if (status) status.innerHTML = `<div style="color:var(--success);font-size:13px;padding:10px">✓ Google連携で${events.length}件取り込みました</div>`;
      Components.showToast(`Googleカレンダーから${events.length}件取り込みました`, 'success');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        if (status) status.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:10px">キャンセルされました</div>';
        return;
      }
      if (this.isGoogleCalendarApiDisabledError(err)) {
        this.showGoogleCalendarApiEnablePrompt(status, err);
        return;
      }
      if (this.isGoogleCalendarUnverifiedAppError(err)) {
        this.showGoogleCalendarIcsFallback(status);
        return;
      }
      if (status) status.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px">✗ ${err.message}</div>`;
      Components.showToast('Google連携に失敗しました: ' + err.message, 'error');
    }
  }

  isGoogleCalendarApiDisabledError(err) {
    // Google Cloud returns this when the Calendar API has never been
    // enabled for the Firebase project (or has been disabled). The
    // message includes the enable URL so we can redirect the admin
    // straight there instead of showing the raw blob of English text.
    const message = String(err?.message || '');
    return /Google Calendar API has not been used/i.test(message)
        || /accessNotConfigured/i.test(message)
        || (/Calendar API/i.test(message) && /disabled/i.test(message));
  }

  showGoogleCalendarApiEnablePrompt(statusEl, err) {
    // Extract the console URL from the Google error message. Google
    // embeds it directly: "Enable it by visiting https://console.
    // developers.google.com/apis/api/calendar-json.googleapis.com/
    // overview?project=429015904719 then retry."
    const raw = String(err?.message || '');
    const urlMatch = raw.match(/https?:\/\/console\.(?:developers|cloud)\.google\.com\/apis\/(?:api\/)?calendar[^\s"')]+/i);
    const enableUrl = urlMatch
      ? urlMatch[0]
      : 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=care-14c31';
    const html = `
      <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:14px;color:#7f1d1d;font-size:12px;line-height:1.8">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">📛 Google Cloud 側で Calendar API が無効です</div>
        <div style="margin-bottom:10px">
          Firebase プロジェクト <code style="background:#fee2e2;padding:1px 6px;border-radius:4px">care-14c31</code> で Google Calendar API が一度も有効化されていません。Cloud Console で <b>有効化</b> を押してから 1〜2 分待って、もう一度「Googleで連携」をお試しください。
        </div>
        <a href="${Components.escapeHtml(enableUrl)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 14px;background:#4285F4;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:12px;margin-bottom:10px">
          🔓 Cloud Console で有効化する
        </a>
        <div style="margin-top:10px;padding:10px;background:#fff;border:1px solid #fecaca;border-radius:6px;font-size:11px;color:#7f1d1d;line-height:1.7">
          <b>手順:</b>
          <ol style="margin:6px 0 0 18px;padding:0">
            <li>上のリンクを開く（Google アカウント選択で <code>agewaller@gmail.com</code> を選ぶ）</li>
            <li>青い <b>「有効にする」</b>（ENABLE）ボタンをタップ</li>
            <li>「このAPIを有効にしました」と表示されたら、この画面に戻る</li>
            <li>1〜2 分待ってから「🔐 Googleで連携して取り込む」をもう一度押す</li>
          </ol>
        </div>
        <div style="margin-top:10px;padding:8px 10px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.7">
          <b>すぐに取り込みたい場合:</b> 下の「iCal URL を貼り付け（従来方式）」に切り替えれば、Google Cloud 側の設定なしで今すぐカレンダーを取り込めます。
        </div>
      </div>
    `;
    if (statusEl) statusEl.innerHTML = html;
    Components.showToast('Calendar API が無効です。Cloud Console で有効化してください', 'error');
  }

  isGoogleCalendarUnverifiedAppError(err) {
    const code = String(err?.code || '').toLowerCase();
    const message = String(err?.message || '').toLowerCase();
    return code.includes('access_blocked') ||
      code.includes('unauthorized-domain') ||
      message.includes('app is blocked') ||
      message.includes('has not completed the google verification process') ||
      message.includes('this app is not verified') ||
      message.includes('このアプリは google で確認されていません');
  }

  showGoogleCalendarIcsFallback(statusEl) {
    const fallbackHtml = `
      <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px;color:#1e3a8a;font-size:12px;line-height:1.7">
        <div style="font-weight:700;margin-bottom:6px">Google OAuth が未検証のため、URL連携で取り込みます</div>
        <ol style="margin:0 0 0 18px;padding:0">
          <li>Googleカレンダー設定 → 対象カレンダー → 「カレンダーの統合」</li>
          <li>「iCal 形式の秘密アドレス」をコピー</li>
          <li>下の入力欄に貼り付けて「URLで接続」を押す</li>
        </ol>
      </div>
    `;
    if (statusEl) statusEl.innerHTML = fallbackHtml;
    const input = document.getElementById('gcal-ics-url');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    Components.showToast('Google未検証アプリのため、ICS URL連携をご利用ください', 'warning');
  }

  disconnectGoogleCalendar() {
    localStorage.removeItem('ics_calendar_url');
    localStorage.removeItem('google_calendar_oauth_connected');
    store.set('calendarEvents', []);
    app.navigate('integrations');
    Components.showToast('Googleカレンダー連携を解除しました', 'success');
  }

  // Diagnostic: list the 10 most recent inbox/{hash}/plaud docs so
  // the user can confirm whether their Plaud emails are actually
  // reaching Firestore. This answers the common question
  // "I sent it but nothing shows up" — without this panel, the
  // only way to inspect the inbox is via the Firebase Console.
  async loadPlaudInboxDiagnostic() {
    const container = document.getElementById('plaud-inbox-diagnostic');
    if (!container) return;
    if (!FirebaseBackend.initialized || !FirebaseBackend.userId) {
      container.innerHTML = `<div style="padding:10px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;font-size:11px;color:#991b1b">Firebase にログインしてから確認してください</div>`;
      return;
    }
    container.innerHTML = `<div style="padding:10px;font-size:11px;color:var(--text-muted)">読み込み中…</div>`;
    try {
      const docs = await FirebaseBackend.fetchRecentInbox('plaud', 10);
      const hash = FirebaseBackend._userHash();
      if (!docs || docs.length === 0) {
        container.innerHTML = `
          <div style="padding:10px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.7">
            <strong>受信箱は空です。</strong><br>
            Firestore の <code>inbox/${Components.escapeHtml(hash || '?')}/plaud/</code> に 1 件も届いていません。
            以下を確認してください:<br>
            ① Plaud のオートフロー宛先が <code>${Components.escapeHtml(Integrations.generatePlaudEmail() || '')}</code> になっているか<br>
            ② Cloudflare Email Routing が <code>plaud-inbox</code> Worker に紐づいているか<br>
            ③ Cloudflare Dashboard → Workers → plaud-inbox → Logs で受信ログを確認
          </div>`;
        return;
      }
      const fmt = (ms) => {
        if (!ms) return '—';
        const d = new Date(ms);
        return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      };
      const processedCount = docs.filter(d => d.processed).length;
      const errorCount = docs.filter(d => d.error).length;
      const rows = docs.map((d, i) => {
        const statusColor = d.error ? '#ef4444' : (d.processed ? '#16a34a' : '#f59e0b');
        const statusText = d.error ? 'エラー' : (d.processed ? '処理済' : '未処理');
        const preview = (d.text || '').replace(/\s+/g, ' ').substring(0, 80);
        return `
          <div style="padding:8px 10px;border-top:1px solid var(--border);font-size:11px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:2px">
              <span style="color:${statusColor};font-weight:700;font-size:10px">●${statusText}</span>
              <span style="color:var(--text-muted);font-family:monospace;font-size:10px">${fmt(d.receivedAt)}</span>
              <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px">${Components.escapeHtml(d.subject || '(件名なし)')}</span>
              <span style="margin-left:auto;color:var(--text-muted);font-size:10px">${d.textLength} 文字</span>
            </div>
            <div style="color:var(--text-muted);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Components.escapeHtml(preview)}</div>
            ${d.parsePath ? `<div style="color:#6366f1;font-size:9px;font-family:monospace;margin-top:2px">path: ${Components.escapeHtml(d.parsePath)}</div>` : ''}
            ${d.error ? `<div style="color:#ef4444;font-size:10px;margin-top:2px">${Components.escapeHtml(d.error)}</div>` : ''}
            ${d.skipped ? `<div style="color:#f59e0b;font-size:10px;margin-top:2px">skipped: ${Components.escapeHtml(d.skipped)}</div>` : ''}
          </div>`;
      }).join('');
      container.innerHTML = `
        <div style="background:#fff;border:1px solid var(--border);border-radius:6px">
          <div style="padding:8px 10px;background:var(--bg-tertiary);font-size:10px;color:var(--text-muted);display:flex;gap:12px;align-items:center">
            <span>hash: <code>${Components.escapeHtml(hash || '')}</code></span>
            <span>件数: <strong>${docs.length}</strong></span>
            <span style="color:#16a34a">処理済: ${processedCount}</span>
            ${errorCount > 0 ? `<span style="color:#ef4444">エラー: ${errorCount}</span>` : ''}
          </div>
          ${rows}
        </div>`;
    } catch (err) {
      console.error('[loadPlaudInboxDiagnostic]', err);
      container.innerHTML = `<div style="padding:10px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;font-size:11px;color:#991b1b">読み込みエラー: ${Components.escapeHtml(err.message || String(err))}</div>`;
    }
  }

  // Copy the user's per-user Plaud receiving email address so they
  // can paste it into Plaud's auto-flow email destination.
  copyPlaudEmail() {
    const addr = Integrations.generatePlaudEmail();
    if (!addr) {
      Components.showToast('ログインが必要です', 'error');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addr).then(() => {
        Components.showToast('メールアドレスをコピーしました。Plaudアプリのオートフローに貼り付けてください。', 'success');
      }).catch(() => {
        Components.showToast(addr, 'info');
      });
    } else {
      Components.showToast(addr, 'info');
    }
  }

  // Copy the user-specific iOS Shortcut URL prefix so they can
  // paste it into a Shortcut "Open URL" action. The shortcut
  // appends its own #import=<base64> payload at runtime.
  copyShortcutUrlPrefix() {
    const prefix = window.location.origin + window.location.pathname + '#import=';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(prefix).then(() => {
        Components.showToast('URLプレフィックスをコピーしました', 'success');
      }).catch(() => {
        Components.showToast(prefix, 'info');
      });
    } else {
      Components.showToast(prefix, 'info');
    }
  }

  // Build a sample #import URL with current demo data, copy to
  // clipboard. Useful for testing the URL-based import flow.
  buildSampleShortcutUrl() {
    const sample = Integrations.urlImport.buildSampleUrl([
      { type: 'heart_rate',         value: 72, timestamp: new Date().toISOString() },
      { type: 'resting_heart_rate', value: 58, timestamp: new Date().toISOString() },
      { type: 'hrv',                value: 45, timestamp: new Date().toISOString() },
      { type: 'steps',              value: 8500, timestamp: new Date().toISOString() },
      { type: 'sleep_min',          value: 420, timestamp: new Date().toISOString() },
    ]);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sample).then(() => {
        Components.showToast('サンプルURLをコピーしました。新しいタブで開いてテストできます', 'success');
      });
    }
    return sample;
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
      { id: 'magnesium', icon: '✨', name: 'マグネシウム', desc: '筋弛緩・睡眠改善', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=%E3%83%9E%E3%82%B0%E3%83%8D%E3%82%B7%E3%82%A6%E3%83%A0+%E3%82%B0%E3%83%AA%E3%82%B7%E3%83%8D%E3%83%BC%E3%83%88&tag=forestvoice-22',
        relevance: (allText.includes('痛') || allText.includes('眠') || allText.includes('筋肉') ? 10 : 4) },
      { id: 'vitd', icon: '☀️', name: 'ビタミンD3+K2', desc: '免疫・骨代謝', store: 'iherb', url: 'https://www.iherb.com/search?kw=vitamin+d3+k2&rcode=CHRONICCARE',
        relevance: (diseases.some(d => ['sle','ra','hashimoto','osteoporosis'].includes(d)) ? 10 : allText.includes('免疫') ? 8 : 3) },
      { id: 'omega3', icon: '🐟', name: 'オメガ3（EPA/DHA）', desc: '抗炎症・脳機能', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=オメガ3+EPA+DHA&tag=forestvoice-22',
        relevance: (allText.includes('炎症') || allText.includes('頭') || diseases.includes('depression') ? 9 : 4) },
      { id: 'epsom', icon: '🛁', name: 'エプソムソルト', desc: '入浴療法・Mg吸収', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=エプソムソルト&tag=forestvoice-22',
        relevance: (allText.includes('エプソム') || allText.includes('風呂') || allText.includes('入浴') ? 10 : 3) },
      { id: 'nmn', icon: '🧬', name: 'NMN', desc: 'NAD+・細胞修復', store: 'iherb', url: 'https://www.iherb.com/search?kw=NMN+supplement&rcode=CHRONICCARE',
        relevance: (allText.includes('nmn') || allText.includes('老化') || diseases.includes('mecfs') ? 9 : 2) },
      { id: 'melatonin', icon: '🌙', name: 'メラトニン（低用量）', desc: '睡眠リズム調整', store: 'iherb', url: 'https://www.iherb.com/search?kw=melatonin+0.5mg&rcode=CHRONICCARE',
        relevance: (allText.includes('不眠') || allText.includes('眠れ') || diseases.includes('insomnia') ? 10 : 2) },
      { id: 'probiotics', icon: '🦠', name: 'プロバイオティクス', desc: '腸内環境改善', store: 'iherb', url: 'https://www.iherb.com/search?kw=probiotics+lactobacillus&rcode=CHRONICCARE',
        relevance: (allText.includes('腸') || allText.includes('お腹') || diseases.includes('ibs') || diseases.includes('crohns') ? 10 : 3) },
      { id: 'bcomplex', icon: '⚡', name: 'ビタミンB群', desc: 'エネルギー代謝・神経', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=ビタミンB群+コンプレックス&tag=forestvoice-22',
        relevance: (allText.includes('ビタミンb') || allText.includes('エネルギー') || diseases.includes('mecfs') ? 8 : 3) },
      { id: 'ltheanine', icon: '🍵', name: 'L-テアニン', desc: 'リラックス・集中', store: 'iherb', url: 'https://www.iherb.com/search?kw=l-theanine&rcode=CHRONICCARE',
        relevance: (allText.includes('不安') || allText.includes('ストレス') || diseases.includes('gad') || diseases.includes('adhd') ? 9 : 2) },
      { id: 'creatine', icon: '💪', name: 'クレアチン', desc: '筋力・脳エネルギー', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=クレアチン+モノハイドレート&tag=forestvoice-22',
        relevance: (allText.includes('クレアチン') || allText.includes('筋') || diseases.includes('mecfs') ? 8 : 2) },
      { id: 'ashwagandha', icon: '🌿', name: 'アシュワガンダ', desc: '副腎サポート・ストレス', store: 'iherb', url: 'https://www.iherb.com/search?kw=ashwagandha+ksm66&rcode=CHRONICCARE',
        relevance: (allText.includes('アシュワガンダ') || allText.includes('副腎') || allText.includes('ストレス') ? 9 : 2) },
      { id: 'curcumin', icon: '🟡', name: 'クルクミン', desc: '抗炎症・関節サポート', store: 'iherb', url: 'https://www.iherb.com/search?kw=curcumin+bcm95&rcode=CHRONICCARE',
        relevance: (allText.includes('炎症') || allText.includes('関節') || diseases.includes('ra') || diseases.includes('fibromyalgia') ? 9 : 2) },
      { id: 'zinc', icon: '🔩', name: '亜鉛', desc: '免疫・ホルモン', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=亜鉛+サプリメント&tag=forestvoice-22',
        relevance: (allText.includes('亜鉛') || allText.includes('免疫') || allText.includes('性欲') ? 8 : 3) },
      { id: 'pea', icon: '🧪', name: 'PEA（パルミトイルエタノールアミド）', desc: '神経障害性疼痛', store: 'iherb', url: 'https://www.iherb.com/search?kw=palmitoylethanolamide+PEA&rcode=CHRONICCARE',
        relevance: (allText.includes('疼痛') || allText.includes('神経痛') || diseases.includes('fibromyalgia') ? 10 : 1) },
      { id: 'oura', icon: '⌚', name: 'Oura Ring（HRVモニター）', desc: '自律神経・睡眠トラッキング', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=oura+ring&tag=forestvoice-22',
        relevance: (allText.includes('hrv') || allText.includes('ペーシング') || diseases.includes('pots') || diseases.includes('mecfs') ? 8 : 2) },
      { id: 'gut_test', icon: '🔬', name: '腸内フローラ検査キット', desc: '腸内細菌叢の分析', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=腸内フローラ+検査キット&tag=forestvoice-22',
        relevance: (allText.includes('腸') || diseases.includes('ibs') || diseases.includes('crohns') ? 9 : 2) },
      { id: 'gene_test', icon: '🧬', name: '遺伝子検査キット', desc: '疾患リスク・薬剤代謝', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=遺伝子検査キット&tag=forestvoice-22',
        relevance: (allText.includes('遺伝') ? 8 : 1) },
      // Japanese products
      { id: 'kampo_hochu', icon: '🌿', name: '補中益気湯（漢方）', desc: '疲労・免疫低下・食欲不振', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=補中益気湯+ツムラ&tag=forestvoice-22',
        relevance: (allText.match(/倦怠|疲|だるい|食欲/) ? 9 : diseases.includes('mecfs') ? 6 : 2) },
      { id: 'kampo_goreisan', icon: '🌿', name: '五苓散（漢方）', desc: '気象病・頭痛・むくみ', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=五苓散+ツムラ&tag=forestvoice-22',
        relevance: (allText.match(/気圧|天候|頭痛|むくみ/) ? 10 : 2) },
      { id: 'kampo_kamishoyosan', icon: '🌿', name: '加味逍遙散（漢方）', desc: '更年期・イライラ・不眠', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=加味逍遙散+クラシエ&tag=forestvoice-22',
        relevance: (allText.match(/更年期|イライラ|のぼせ|不眠/) ? 9 : profile.gender === 'female' ? 4 : 1) },
      { id: 'ala5', icon: '✨', name: '5-ALA（アミノレブリン酸）', desc: 'ミトコンドリア活性・日本発', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=5-ALA+サプリ&tag=forestvoice-22',
        relevance: (allText.match(/ミトコンドリア|5-ala|エネルギー/) ? 9 : diseases.includes('mecfs') ? 6 : 2) },
      { id: 'hydrogen', icon: '💧', name: '水素水生成器', desc: '抗酸化・日本発テクノロジー', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=水素水+生成器&tag=forestvoice-22',
        relevance: (allText.match(/水素|酸化|抗酸化/) ? 8 : 1) },
      { id: 'omron_bp', icon: '🩺', name: 'OMRON 血圧計', desc: '日本精密機器・家庭測定', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=オムロン+血圧計&tag=forestvoice-22',
        relevance: (allText.match(/血圧|高血圧/) ? 9 : diseases.includes('hypertension') ? 7 : 1) },
      { id: 'tanita_scale', icon: '⚖️', name: 'TANITA 体組成計', desc: '日本精密機器・体脂肪率', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=タニタ+体組成計&tag=forestvoice-22',
        relevance: (allText.match(/体重|体脂肪|肥満|ダイエット/) ? 8 : diseases.includes('metabolic_syndrome') ? 6 : 1) },
      { id: 'miso', icon: '🫘', name: '有機味噌（発酵食品）', desc: '腸内環境・免疫・日本の智慧', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=有機+味噌+無添加&tag=forestvoice-22',
        relevance: (allText.match(/腸|発酵|免疫|食事/) ? 7 : 2) },
      { id: 'amazake', icon: '🍶', name: '甘酒（飲む点滴）', desc: '発酵・栄養補給・日本伝統', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=甘酒+米麹+無添加&tag=forestvoice-22',
        relevance: (allText.match(/栄養|疲労|発酵|甘酒/) ? 7 : 2) },
      { id: 'epsom_jp', icon: '♨️', name: 'エプソムソルト（国産）', desc: '入浴・Mg吸収・日本品質', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=エプソムソルト+国産&tag=forestvoice-22',
        relevance: (allText.match(/風呂|入浴|エプソム|マグネシウム/) ? 9 : 3) },
      { id: 'shinrinyoku', icon: '🌲', name: '森林浴ガイドブック', desc: 'Shinrin-yoku・日本発セラピー', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=森林浴+ガイド&tag=forestvoice-22',
        relevance: (allText.match(/自然|森|散歩|リラックス/) ? 6 : 1) },
      { id: 'evening_primrose', icon: '🌸', name: '月見草オイル', desc: 'PMS・ホルモンバランス', store: 'iherb', url: 'https://www.iherb.com/search?kw=evening+primrose+oil&rcode=CHRONICCARE',
        relevance: (allText.match(/生理|月経|pms|ホルモン|更年期/) ? 10 : profile.gender === 'female' ? 4 : 0) },
      { id: 'equol', icon: '🫘', name: 'エクオール', desc: '更年期・女性ホルモン', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=エクオール+サプリ&tag=forestvoice-22',
        relevance: (allText.match(/更年期|ホットフラッシュ|のぼせ/) ? 10 : profile.gender === 'female' && parseInt(profile.age) >= 40 ? 5 : 0) },
      { id: 'iron', icon: '🩸', name: '鉄分（ヘム鉄）', desc: '貧血・疲労対策', store: 'iherb', url: 'https://www.iherb.com/search?kw=heme+iron&rcode=CHRONICCARE',
        relevance: (allText.match(/貧血|鉄|フェリチン|めまい|立ちくらみ/) ? 10 : profile.gender === 'female' ? 4 : 1) },
      { id: 'ginger', icon: '🫚', name: 'ジンジャーサプリ', desc: '吐き気・消化・抗炎症', store: 'iherb', url: 'https://www.iherb.com/search?kw=ginger+extract&rcode=CHRONICCARE',
        relevance: (allText.match(/吐き気|嘔吐|気持ち悪|消化|胃/) ? 9 : 1) },
      { id: 'psyllium', icon: '🌾', name: 'サイリウムハスク', desc: '食物繊維・腸内環境', store: 'amazon', url: 'https://www.amazon.co.jp/s?k=サイリウムハスク&tag=forestvoice-22',
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

  openImagePreview(url, filename = '画像') {
    if (!url) return;
    if (!document.getElementById('image-preview-modal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="image-preview-modal" class="image-preview-modal" hidden onclick="if(event.target===this)app.closeImagePreview()">
          <div class="image-preview-content">
            <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
              <button class="btn btn-outline btn-sm" onclick="app.closeImagePreview()">閉じる</button>
            </div>
            <img id="image-preview-img" src="" alt="拡大画像">
          </div>
        </div>
      `);
    }
    const modal = document.getElementById('image-preview-modal');
    const image = document.getElementById('image-preview-img');
    if (!modal || !image) return;
    image.src = url;
    image.alt = filename;
    modal.hidden = false;
  }

  closeImagePreview() {
    const modal = document.getElementById('image-preview-modal');
    const image = document.getElementById('image-preview-img');
    if (modal) modal.hidden = true;
    if (image) image.src = '';
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
    if (text.length > 200) return '詳しい記録ありがとうございます。蓄積データから傾向を整理しています。';
    if (text.length > 50) return '記録を継続中。パターンの把握精度が向上しています。';
    return '';
  }

  // ============================================================
  // Unified API Analysis - ALL advice comes from prompts, not JS
  // ============================================================

  // Main entry point: analyze any user input via API
  async analyzeViaAPI(input, type, options = {}) {
    const apiKey = aiEngine.getApiKey(store.get('selectedModel'));
    const isGuestContext = !store.get('isAuthenticated');
    const isFastGuestText = isGuestContext && options.fastGuest === true && type === 'text_analysis';
    console.log('[analyzeViaAPI] type=' + type + ' model=' + store.get('selectedModel') + ' hasKey=' + !!apiKey + ' isGuest=' + isGuestContext);

    // Select prompt template
    let promptTemplate = isFastGuestText
      ? (INLINE_PROMPTS.timeline_insight || INLINE_PROMPTS.text_analysis)
      : (INLINE_PROMPTS[type] || INLINE_PROMPTS.text_analysis);
    let prompt = promptTemplate
      .replace(/\{\{INPUT\}\}/g, (input || '').substring(0, 8000))
      .replace(/\{\{SEED\}\}/g, Math.floor(Date.now() / 86400000).toString());

    // Fast path for pre-login quick comments: keep the prompt tiny and
    // skip heavy context interpolation so the first response returns in
    // a few seconds instead of waiting for full-schema generation.
    if (!isFastGuestText) {
      // Interpolate standard variables. In guest mode (pre-login), use a
      // much smaller context window to avoid slow prompt assembly when
      // localStorage already contains many historical records.
      prompt = aiEngine.interpolatePrompt(
        prompt,
        aiEngine.collectCurrentUserData({ guest: isGuestContext })
      );
    } else {
      // Fast guest path still needs the response-language directive so
      // pre-login users whose selected language is en/zh/ko/etc. get a
      // reply in their own language instead of Japanese. Skip the full
      // interpolatePrompt (too heavy) but apply the lightweight
      // language directive helper.
      prompt = aiEngine.injectLanguageDirective(prompt);
    }

    // NOTE: we intentionally do NOT short-circuit here on `!apiKey`.
    // aiEngine.callModel has its own shared-proxy fallback (the
    // Cloudflare Worker with a server-side ANTHROPIC_API_KEY secret)
    // for Claude models. Early-returning here would bypass that path
    // entirely — every logged-in user without a local key would get
    // the "ただいま詳細分析をご用意できません" fallback even though the
    // shared proxy could serve the request. The previous code had this
    // bug because f19eac1 added canUseSharedProxy to callModel but
    // forgot to remove the short-circuit here, which is exactly the
    // regression users were hitting as "ダッシュボードにコメントしても
    // エラーが出ます".

    try {
      // 4096 tokens allows the AI to produce the full schema
      // (summary, findings, actions, new_approach, trend, next_check,
      // monitoring items, products, nutrition, deeper_prompt) without
      // truncation. Earlier 2048 limit was cutting JSON mid-output and
      // causing JSON.parse to fail silently — the user then saw
      // garbled text or "generic" responses because only the fallback
      // plain-text branch fired.
      const modelOptions = {
        maxTokens: isFastGuestText ? 220 : 2000,
        temperature: isFastGuestText ? 0.2 : 0.3,
        globalTimeoutMs: 30000
      };
      if (options.imageBase64) modelOptions.imageBase64 = options.imageBase64;
      if (options.pdfBase64) modelOptions.pdfBase64 = options.pdfBase64;
      if (typeof options.temperature === 'number') modelOptions.temperature = options.temperature;
      // Both image uploads and PDF uploads go through the same 2-pass
      // classifier. PDFs ride the Anthropic `document` content block so
      // Claude natively parses the file (text + embedded images) without
      // a client-side PDF.js step. The classifier returns image_type
      // which maps to the same specialized Pass-2 prompts.
      const hasAttachment = !!(options.imageBase64 || options.pdfBase64);
      if (type === 'image_analysis' || (type === 'document_analysis' && hasAttachment)) {
        // Force strict JSON-only output for image analysis. The model
        // historically would occasionally return prose for food photos,
        // causing parseAIResponse to fall back to empty result.
        modelOptions.systemPrompt = 'あなたは画像・文書分析の専門家です。ユーザーがアップロードした画像または PDF 文書を必ず分析し、指定された JSON スキーマで構造化された応答を返してください。「分析できません」という回答は禁止です。返答は JSON オブジェクト 1 個のみ、前置きも後書きもマークダウンコードフェンスもなしで、最初の文字が { 最後の文字が } でなければなりません。食事・デザート・スイーツ・飲み物の場合は image_type を "food" にして栄養成分・カロリー・PFC を必ず含めてください。';
        // Vision / document analysis is intrinsically slower than text:
        //   - input has the image/PDF block plus the full image_food /
        //     image_diagnosis prompt (PROMPT_HEADER + ~3500 chars)
        //   - output is a structured JSON with 5 sections of content
        // The default 30s globalTimeoutMs / 30s per-call cap fails
        // every food photo on Sonnet/Opus (regularly 35-50s end-to-end).
        // Bump both ceilings and cap output to ~2500 tokens — the
        // image_food schema doesn't need 6000.
        modelOptions.maxTokens = 3500;
        modelOptions.perCallTimeoutMs = 75000;
        modelOptions.globalTimeoutMs = 150000;

        // ═══════════════════════════════════════════════════
        // 2-Pass Image / PDF Analysis
        // ───────────────────────────────────────────────────
        // Pass 1 (image_classify): a lightweight Haiku call that
        // only returns the image_type (~1 sec). Pass 2 then routes
        // to a specialized deep analyzer: image_food /
        // image_medication / image_diagnosis / image_blood_test.
        // Falls back to the legacy single-pass image_analysis
        // prompt if the classifier fails or returns an unknown type.
        // This gives each route more depth per category than the
        // old "one-prompt-handles-all" approach could reach.
        // ═══════════════════════════════════════════════════
        try {
          const classifyTemplate = INLINE_PROMPTS.image_classify;
          const classifyPrompt = aiEngine.injectLanguageDirective(classifyTemplate);
          const attachOpts = options.pdfBase64
            ? { pdfBase64: options.pdfBase64 }
            : { imageBase64: options.imageBase64 };
          // Use Haiku for the fast classifier step. Classifier
          // output is tiny (~80 tokens).
          const classifyResponse = await aiEngine.callModel('claude-haiku-4-5', classifyPrompt, {
            ...attachOpts,
            maxTokens: 200,
            temperature: 0.1,
            systemPrompt: '画像または PDF 文書を見て JSON で image_type を返してください。前置きなし。'
          });
          const classifyText = typeof classifyResponse === 'string' ? classifyResponse : JSON.stringify(classifyResponse);
          let classified;
          try { classified = this.parseAIResponse(classifyText); } catch (_) { classified = null; }
          const imgType = classified?.image_type;
          console.log('[image-analysis] Pass 1 classified as:', imgType, '(confidence', classified?.confidence || '?)');

          // Map classified type to specialized Pass 2 prompt.
          const specialized = {
            food:        'image_food',
            medication:  'image_medication',
            medical_doc: 'image_diagnosis',
            blood_test:  'image_blood_test'
          }[imgType];

          if (specialized && INLINE_PROMPTS[specialized]) {
            // Re-interpolate the specialized prompt with full user data
            // (it inherits PROMPT_HEADER which needs all the usual vars).
            const specializedTemplate = INLINE_PROMPTS[specialized];
            const specializedPrompt = aiEngine.interpolatePrompt(specializedTemplate, {
              current: store.get('symptoms'),
              weekly: store.get('symptoms')?.slice?.(-7) || [],
              bloodTests: store.get('bloodTests'),
              supplements: store.get('supplements'),
              symptoms: store.get('symptoms')
            }).replace(/\{\{INPUT\}\}/g, (input || '').substring(0, 8000));

            console.log('[image-analysis] Pass 2: routing to', specialized);
            // Use Opus for the deep analysis (default selectedModel).
            // maxTokens / per-call / global timeouts are already set
            // in modelOptions for image_analysis (see above), so we
            // just spread them — the previous explicit `maxTokens:6000`
            // override here was undoing the reduction and pushing
            // every Sonnet/Opus call past the per-call cap.
            const deepResponse = await aiEngine.callModel(store.get('selectedModel'), specializedPrompt, modelOptions);
            const deepText = typeof deepResponse === 'string' ? deepResponse : JSON.stringify(deepResponse);
            const deepParsed = this.parseAIResponse(deepText);

            if (deepParsed && typeof deepParsed === 'object') {
              // Store the result and short-circuit the generic path.
              const analysis = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                type,
                parsed: deepParsed,
                _raw: deepText,
                _specializedBy: specialized
              };
              const history = store.get('analysisHistory') || [];
              history.push(analysis);
              store.set('analysisHistory', history);
              store.set('latestAnalysis', analysis);

              // Auto-route structured results into the matching health
              // collection so food shows up in the meals log, med photos
              // populate the medication list, and blood-panel PDFs land
              // in bloodTests. The original textEntry (with AI comment)
              // still exists alongside — this just adds the structured
              // record so dashboard charts and summaries pick it up.
              try {
                if (specialized === 'image_food' && deepParsed.nutrition) {
                  const n = deepParsed.nutrition;
                  store.addHealthData('nutrition', {
                    name: deepParsed.identified_items || '食事',
                    calories: n.calories,
                    protein_g: n.protein_g,
                    fat_g: n.fat_g,
                    carb_g: n.carb_g,
                    fiber_g: n.fiber_g,
                    salt_g: n.salt_g,
                    anti_inflammatory_score: n.anti_inflammatory_score,
                    summary: deepParsed.summary || '',
                    source: 'ai_upload',
                    analysis_id: analysis.id
                  });
                } else if (specialized === 'image_medication') {
                  store.addHealthData('medication', {
                    name: deepParsed.identified_items || '薬',
                    notes: (deepParsed.summary || '').substring(0, 500),
                    findings: (deepParsed.findings || '').substring(0, 2000),
                    source: 'ai_upload',
                    analysis_id: analysis.id
                  });
                } else if (specialized === 'image_blood_test') {
                  store.addHealthData('blood_test', {
                    name: deepParsed.identified_items || '検査結果',
                    findings: (deepParsed.findings || '').substring(0, 4000),
                    details: (deepParsed.details || '').substring(0, 4000),
                    summary: deepParsed.summary || '',
                    source: 'ai_upload',
                    analysis_id: analysis.id
                  });
                }
                // medical_doc intentionally not auto-routed — diagnostic
                // notes are free-form and already live in textEntries as
                // category='doctor'.
              } catch (routeErr) {
                console.warn('[2-pass] auto-route failed:', routeErr.message);
              }

              return { ...analysis, result: deepParsed };
            }
            // Fall through to legacy single-pass on parse failure
            console.warn('[image-analysis] Pass 2 parse failed, falling back to legacy image_analysis');
          } else {
            console.log('[image-analysis] No specialized prompt for', imgType, '— using legacy prompt');
          }
        } catch (classifyErr) {
          console.warn('[image-analysis] 2-pass failed, falling back to legacy:', classifyErr.message);
        }
      }

      const response = await aiEngine.callModel(store.get('selectedModel'), prompt, modelOptions);

      // Defensive: callModel must return a string, but coerce in case a
      // future change ever returns an object. Never store a non-string
      // in _raw — the dashboard renderer would JSON.stringify it and
      // leak the entire object as raw JSON to the user.
      let responseText = typeof response === 'string'
        ? response
        : (response == null ? '' : JSON.stringify(response));

      // ── Final refusal guard ──
      // Even after callModel's retry logic, a raw refusal string can
      // still slip through (e.g. if the refusal text happens to parse
      // as valid JSON or wraps around our prompt). We check one more
      // time at this layer and substitute a friendly fallback so the
      // user NEVER sees "I'm sorry, I can't assist with that".
      if (aiEngine.isRefusalResponse && aiEngine.isRefusalResponse(responseText)) {
        console.warn('[analyzeViaAPI] Refusal detected at final layer, using graceful fallback');
        responseText = aiEngine._gracefulRefusalFallback(prompt);
      }

      let parsed = this.parseAIResponse(responseText);

      // #8 Two-pass JSON: if first parse failed, use Haiku to structure
      if (!parsed || (!parsed.summary && !parsed.findings)) {
        try {
          const structurePrompt = `以下のテキストを JSON に構造化してください。出力は JSON のみ（前後の説明なし）。
キー: summary (1行要約), findings (本文), actions (配列), new_approach (新提案), next_check (次回確認)

テキスト:
${responseText.substring(0, 3000)}`;
          const structured = await aiEngine.callModel('claude-haiku-4-5', structurePrompt, { maxTokens: 800, temperature: 0.1 });
          const pass2 = this.parseAIResponse(typeof structured === 'string' ? structured : JSON.stringify(structured));
          if (pass2 && (pass2.summary || pass2.findings)) {
            parsed = pass2;
            parsed._twoPass = true;
          }
        } catch (e) {
          console.warn('[analyzeViaAPI] 2-pass structuring failed:', e.message);
        }
      }

      // Also guard after parse — sometimes parseAIResponse unwraps
      // a JSON whose `findings` or `summary` contains the refusal text.
      const containsRefusal = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        const fields = [obj.summary, obj.findings, obj.details, obj._raw, obj.new_approach];
        return fields.some(f => typeof f === 'string' && aiEngine.isRefusalResponse(f));
      };
      if (parsed && containsRefusal(parsed)) {
        console.warn('[analyzeViaAPI] Refusal in parsed fields, replacing with graceful fallback');
        const fallback = JSON.parse(aiEngine._gracefulRefusalFallback(prompt));
        fallback._fromAPI = true;
        fallback._fallback = 'graceful_refusal';
        return fallback;
      }

      // Final sanity check: reject responses that match the shape of
      // the old generateDemoAnalysis() output (deleted long ago) which
      // still circulates in some user sessions via persisted caches or
      // echoed prompt context. If the parsed object has the legacy
      // shape, treat it as garbage and show a helpful message instead
      // of leaking raw JSON to the UI.
      const isLegacyDemoShape = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (typeof obj.healthScore === 'number' && obj.trends && obj.trends.fatigue && obj.trends.fatigue.direction) return true;
        if (Array.isArray(obj.actionItems) && Array.isArray(obj.researchUpdates)) return true;
        if (typeof obj.summary === 'string' && /入力データ\s*\d+\s*件を分析/.test(obj.summary)) return true;
        return false;
      };

      if (parsed && !isLegacyDemoShape(parsed)) {
        parsed._fromAPI = true;
        return parsed;
      }

      if (parsed && isLegacyDemoShape(parsed)) {
        console.warn('[analyzeViaAPI] Rejected legacy-demo-shaped response from model');
        return {
          summary: '記録を保存しました。',
          findings: this.isAdmin()
            ? 'モデルが旧スキーマ形式の出力を返しました。プロンプトを見直すか、別のモデルをお試しください。'
            : 'もう少し詳しい分析をお待ちください。',
          actions: [],
          products: [],
          _fromAPI: true,
          _rejected: 'legacy_shape'
        };
      }

      // Plain-text response (no JSON detected even after repair)
      if (isFastGuestText) {
        return {
          summary: 'かんたんアドバイス',
          findings: responseText.trim(),
          actions: [],
          products: [],
          _fromAPI: true,
          _fastGuest: true
        };
      }
      return {
        summary: '',
        findings: responseText,
        actions: [],
        products: [],
        _fromAPI: true
      };
    } catch (err) {
      console.warn('[API Analysis] Failed:', err.message);
      const isNoKey = err.message === 'NO_API_KEY' || err.message?.startsWith('ALL_PROVIDERS_FAILED: ') && err.message.includes('no API key');
      const isAllFailed = err.message?.startsWith('ALL_PROVIDERS_FAILED:');
      let adminHint;
      if (this.isAdmin()) {
        if (isNoKey) {
          adminHint = '管理パネル → APIキータブで共通APIキーを保存してください。少なくとも1つのプロバイダー（OpenAI/Anthropic/Google）のキーが必要です。';
        } else if (isAllFailed) {
          // Show what each provider said
          const details = err.message.replace('ALL_PROVIDERS_FAILED: ', '');
          adminHint = `すべてのプロバイダーで失敗しました:\n${details}\n\n考えられる原因: プロキシURL誤り / キー無効 / ネットワーク障害 / レート制限`;
        } else {
          adminHint = `分析の呼び出しに失敗しました: ${err.message}`;
        }
      } else {
        if (/403|Origin|Forbidden/i.test(err.message)) {
          adminHint = 'このドメインからの接続が許可されていません。本番サイト (cares.advisers.jp) からご利用ください。';
        } else if (/401|Unauthorized/i.test(err.message)) {
          adminHint = 'AIサービスの認証に失敗しました。しばらく待ってから再度お試しください。';
        } else {
          adminHint = 'ただいま詳細分析をご用意できません。少し時間をおいて再度お試しください。';
        }
      }
      return {
        summary: '記録を保存しました。',
        findings: adminHint,
        actions: [],
        products: [],
        _fromAPI: false,
        // Preserve the raw error message so callers (dashQuickSubmit /
        // submitTextEntry) can render an explicit error card instead
        // of treating the fallback like a successful analysis.
        _error: err?.message || String(err)
      };
    }
  }

  // Parse an AI response string into a structured result object.
  //
  // Models sometimes return:
  //   1. Clean JSON
  //   2. JSON wrapped in markdown code fences (```json\n{...}\n```)
  //   3. JSON with extra prose before/after
  //   4. Truncated JSON (hit maxTokens mid-output)
  //   5. Plain text (model ignored the JSON instruction)
  //
  // ─── 禅トラック / Plaud Daily Dashboard analysis ───
  // Runs the plaud_analysis prompt on a saved Plaud transcript and
  // persists both the human-readable "full version" and the
  // structured JSON the prompt produces. Downstream the dashboard
  // widget reads from plaudAnalyses to draw graphs.
  async runPlaudAnalysis(entry) {
    if (!entry || !entry.content) return;
    const input = (entry.content || '').substring(0, 12000);
    // Date locale follows the user's selected language so the label
    // in the analysis reads naturally.
    const userLang = (store.get('userProfile') || {}).language || 'ja';
    const dateLocaleMap = { ja: 'ja-JP', en: 'en-US', zh: 'zh-CN', ko: 'ko-KR', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', de: 'de-DE', ar: 'ar', it: 'it-IT' };
    const dateLabel = new Date(entry.timestamp).toLocaleDateString(dateLocaleMap[userLang] || 'en-US');
    const promptTemplate = (typeof INLINE_PROMPTS !== 'undefined' && INLINE_PROMPTS.plaud_analysis) || '';
    if (!promptTemplate) {
      console.warn('[plaud] plaud_analysis prompt not found');
      return;
    }
    // Inject {{INPUT}} AND the language directive so the 禅トラック
    // analysis obeys the user's selected language.
    const prompt = aiEngine.injectLanguageDirective(
      promptTemplate.replace(/\{\{INPUT\}\}/g, input)
    );

    let raw;
    try {
      raw = await aiEngine.callModel(store.get('selectedModel'), prompt, { maxTokens: 6000 });
    } catch (err) {
      console.warn('[plaud] model call failed:', err.message);
      return;
    }
    const rawText = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // The prompt is designed to produce FULL-VERSION bullets followed
    // by a JSON block. Split them so we can save both.
    const { fullText, json } = this._splitPlaudResponse(rawText);

    // Persist the analysis in a dedicated collection so the dashboard
    // widget can read the most recent analysis plus a trend history
    // for graphing (conscious_focus, net value, calorie balance, etc.).
    const analyses = store.get('plaudAnalyses') || [];
    analyses.push({
      id: 'plaud_' + Date.now().toString(36),
      entryId: entry.id,
      timestamp: entry.timestamp,
      dateLabel,
      title: entry.title,
      fullText: fullText || rawText,
      json: json || null,
      _raw: rawText.length > 20000 ? null : rawText
    });
    // Cap history at 90 entries so localStorage doesn't blow up
    if (analyses.length > 90) analyses.splice(0, analyses.length - 90);
    store.set('plaudAnalyses', analyses);

    // Also save an AI comment linked to the entry so it shows in the
    // dashboard inline analysis card too.
    if (this.saveAIComment && json) {
      this.saveAIComment(entry.id, {
        summary: (json.summary && typeof json.summary === 'object')
          ? (json.summary.overall_note || '') : '',
        findings: fullText ? fullText.substring(0, 2000) : '',
        actions: Array.isArray(json.actions) ? json.actions.map(a => a?.action || '').filter(Boolean) : [],
        _fromAPI: true,
        _plaud: true
      });
    }
  }

  // Split the model's response into a human-readable bullet section
  // and the trailing JSON object. The prompt is strict about the
  // order (full version first, JSON immediately after) and forbids
  // JSON / braces in the full version, so finding the first '{' that
  // starts a top-level object is reliable.
  _splitPlaudResponse(text) {
    if (!text || typeof text !== 'string') return { fullText: '', json: null };
    // Strip code fences around JSON if the model added them
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    let body = text;
    if (fence) body = text.replace(fence[0], fence[1]);

    // Find the first opening brace that's followed by a likely JSON key
    const jsonStart = body.search(/\{\s*"(meta|summary|details|actions|people|context|conscious_focus|calories|signals|raw_bullets)"/);
    if (jsonStart === -1) return { fullText: body.trim(), json: null };

    const fullText = body.substring(0, jsonStart).trim();
    const jsonPart = body.substring(jsonStart);
    // Use parseAIResponse's robust JSON repair in case of truncation
    const parsed = this.parseAIResponse(jsonPart);
    return { fullText, json: parsed };
  }

  // This helper handles all five. For (4), we progressively close
  // dangling strings / arrays / objects until the parse succeeds, so
  // even a truncated response yields at least the fields that were
  // fully emitted before the cut-off.
  parseAIResponse(text) {
    if (!text || typeof text !== 'string') return null;

    // 1. Strip markdown code fences if present
    let body = text.trim();
    const fenceMatch = body.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) body = fenceMatch[1].trim();

    // 2. Find the first `{` and try to parse from there
    const start = body.indexOf('{');
    if (start === -1) return null;
    body = body.substring(start);

    // 3. Try parsing as-is first
    try {
      return JSON.parse(body);
    } catch (e) { /* fall through to repair */ }

    // 4. Try finding the last `}` and parsing up to there
    const lastClose = body.lastIndexOf('}');
    if (lastClose > 0) {
      try {
        return JSON.parse(body.substring(0, lastClose + 1));
      } catch (e) { /* fall through */ }
    }

    // 5. Repair truncated JSON: walk forward and track brace/bracket/
    // string depth. When we hit the end unexpectedly, close whatever's
    // open in the right order. This produces valid JSON even from a
    // response that was cut off mid-field.
    let repaired = '';
    let inString = false;
    let escape = false;
    const stack = []; // contents: '{', '[', or '"'
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      repaired += c;
      if (escape) { escape = false; continue; }
      if (inString) {
        if (c === '\\') { escape = true; continue; }
        if (c === '"') { inString = false; stack.pop(); continue; }
        continue;
      }
      if (c === '"') { inString = true; stack.push('"'); continue; }
      if (c === '{') { stack.push('{'); continue; }
      if (c === '[') { stack.push('['); continue; }
      if (c === '}' && stack[stack.length - 1] === '{') { stack.pop(); continue; }
      if (c === ']' && stack[stack.length - 1] === '[') { stack.pop(); continue; }
    }
    // Close any remaining open structures.
    // Trim trailing `,` before closing so `[1,2,` → `[1,2]` not `[1,2,]`.
    // Note: hex-escape `}` in regex char classes (\x7d) so static
    // analysers / brace-counters treat this file as having balanced braces.
    repaired = repaired.replace(/,\s*$/, '');
    while (stack.length > 0) {
      const open = stack.pop();
      if (open === '"') repaired += '"';
      else if (open === '{') repaired += '\x7d';
      else if (open === '[') repaired += ']';
      // Trim trailing commas again before each close
      repaired = repaired.replace(/,(\s*[\x7d\]])/g, '$1');
    }
    try {
      const parsed = JSON.parse(repaired);
      parsed._truncated = true; // signal that we had to repair
      console.warn('[parseAIResponse] Repaired truncated JSON');
      return parsed;
    } catch (e) {
      console.warn('[parseAIResponse] Repair failed:', e.message);
    }

    // 6. Last resort: extract at least summary / findings via regex
    // so the user sees something useful.
    const summaryMatch = body.match(/"summary"\s*:\s*"([^"]*)"/);
    const findingsMatch = body.match(/"findings"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (summaryMatch || findingsMatch) {
      return {
        summary: summaryMatch?.[1] || '',
        findings: (findingsMatch?.[1] || '').replace(/\\n/g, '\n'),
        actions: [],
        _truncated: true,
        _parseMethod: 'regex-salvage'
      };
    }
    return null;
  }

  // Render API analysis result as HTML card
  // Build a pre-written share text that includes today's axis label
  // + a condensed version of the AI's new_approach. Designed to fit
  // in 140 chars (for X) with the URL appended by the share intent.
  _buildShareText(newApproach) {
    const axis = (typeof aiEngine !== 'undefined' && aiEngine._getTodayPrescriptionAxis)
      ? aiEngine._getTodayPrescriptionAxis()
      : null;
    const axisLabel = axis ? `${axis.icon} ${axis.name}` : '新しい打ち手';
    // Strip markdown and shorten the approach to ~80 chars so the
    // total post stays under X's 280 char limit even after URL.
    const cleaned = (newApproach || '')
      .replace(/[\*_`#]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
    return `【今日の新処方 / ${axisLabel}】\n${cleaned}\n\n慢性疾患と寄り添う AI 記録アプリ「健康日記」 #ME_CFS #慢性疾患 #健康日記`;
  }

  // Copy share text to clipboard + toast feedback. Used by the 📋
  // button in the analysis card. Falls back to a prompt dialog on
  // browsers without clipboard API.
  copyAnalysisShare(btn, text) {
    if (!text) return;
    const done = () => {
      Components.showToast('コピーしました。SNS に貼り付けて共有してください', 'success');
      if (btn && btn.textContent) {
        const orig = btn.textContent;
        btn.textContent = '✓ コピー済み';
        setTimeout(() => { btn.textContent = orig; }, 1800);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        try { window.prompt('コピーして共有してください:', text); } catch (_) {}
      });
    } else {
      try { window.prompt('コピーして共有してください:', text); } catch (_) {}
    }
  }

  // Use navigator.share (iOS/Android native share sheet) if available.
  // Falls back to copyAnalysisShare. This is the primary growth-loop
  // entry point: one tap → system share sheet → X/LINE/mail/etc.
  async nativeShareAnalysis(text) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: '健康日記 — 今日の新処方', text });
        return;
      } catch (e) {
        // User canceled or share failed — fall through to clipboard.
      }
    }
    this.copyAnalysisShare(null, text);
  }

  renderAnalysisCard(result) {
    if (!result) return '';

    // Defensive coercion: every text-like field must be a string before
    // it reaches the markdown formatter. Legacy records may contain
    // objects in summary/findings/_raw from when callModel() used to
    // return a fake-result object on API failure; rendering those would
    // either crash formatMarkdown or dump raw JSON to the user.
    const asText = (v) => (typeof v === 'string' && v.trim() ? v : '');

    // ── Refusal sanitizer (final UI safety net) ──
    // Even after callModel's retry chain and analyzeViaAPI's guards,
    // a refusal phrase can still slip through (especially in cached
    // analysisHistory entries from before the anti-refusal patches).
    // We sanitize EVERY text field here so users never see "I'm sorry,
    // I can't assist with that" in the UI. If a field is entirely
    // refusal, substitute a friendly placeholder instead.
    const refusalPlaceholder = '記録を保存しました。本日のテキストを受け取りました。詳細な分析は次回の主治医診察の材料としてご活用ください。';
    const sanitize = (v) => {
      const s = asText(v);
      if (!s) return s;
      if (typeof aiEngine !== 'undefined' && aiEngine.isRefusalResponse && aiEngine.isRefusalResponse(s)) {
        const cleaned = aiEngine.sanitizeRefusal(s);
        return cleaned || refusalPlaceholder;
      }
      return s;
    };

    const summary = sanitize(result.summary);
    const findings = sanitize(result.findings);
    const details = sanitize(result.details);
    const newApproach = sanitize(result.new_approach);
    const trend = sanitize(result.trend);
    const nextCheck = sanitize(result.next_check);
    const rawText = sanitize(result._raw);

    // If only raw text (no parsed structure), render it plain.
    if (rawText && !summary && !findings) {
      return `
        <div class="card" style="border-left:4px solid var(--success);margin-bottom:12px">
          <div class="card-body" style="padding:14px 16px">
            <div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(rawText)}</div>
          </div>
        </div>`;
    }

    const urgencyColor = result.urgency === 'urgent' ? 'var(--danger)' : result.urgency === 'attention' ? 'var(--warning)' : 'var(--accent)';

    let html = `<div class="card" style="border-left:4px solid ${urgencyColor};margin-bottom:12px">`;

    // Summary
    if (summary) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600">${summary}</div>`;
    }

    // Findings
    if (findings) {
      html += `<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(findings)}</div>
      </div>`;
    }

    // Details (for image analysis)
    if (details) {
      html += `<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap">${Components.formatMarkdown(details)}</div>
      </div>`;
    }

    // Actions (skip non-string entries from legacy bad records)
    const stringActions = Array.isArray(result.actions) ? result.actions.filter(a => typeof a === 'string') : [];
    if (stringActions.length > 0) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">推奨アクション</div>
        ${stringActions.map(a => `<div style="font-size:12px;margin-bottom:3px"><span style="color:var(--accent)">→</span> ${Components.escapeHtml(a)}</div>`).join('')}
      </div>`;
    }

    // New approach (fresh suggestion user hasn't tried)
    if (newApproach) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border);background:linear-gradient(135deg, rgba(99,102,241,0.03), rgba(168,85,247,0.03))">
        <div style="font-size:11px;font-weight:600;color:#6366f1;margin-bottom:4px">✨ 新しい打ち手</div>
        <div style="font-size:12px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${Components.formatMarkdown(newApproach)}</div>
      </div>`;

      // Share buttons — let the user one-tap share today's
      // prescription to X / LINE / clipboard. Drives viral growth:
      // every satisfied user who shares their daily 処方 is a
      // direct referral signal to other patients. Pre-written text
      // includes the today's axis so SNS followers see variety.
      const shareText = this._buildShareText(newApproach);
      const shareUrl = 'https://cares.advisers.jp/';
      // Append a per-user referral param if the user has signed
      // in — Firebase auth is the identity source.
      const refId = (typeof FirebaseBackend !== 'undefined' && FirebaseBackend.userId)
        ? FirebaseBackend.userId.substring(0, 8)
        : '';
      const refUrl = refId ? shareUrl + '?ref=' + encodeURIComponent(refId) : shareUrl;
      const shareTextEncoded = encodeURIComponent(shareText);
      const refUrlEncoded = encodeURIComponent(refUrl);
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border);background:#fafaff">
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">🌱 この処方を共有して、同じ症状の方に届ける</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <a href="https://x.com/intent/tweet?text=${shareTextEncoded}&url=${refUrlEncoded}" target="_blank" rel="noopener"
            style="padding:6px 12px;background:#000;color:#fff;border-radius:14px;text-decoration:none;font-size:11px;font-weight:600">
            𝕏 Post
          </a>
          <a href="https://social-plugins.line.me/lineit/share?url=${refUrlEncoded}&text=${shareTextEncoded}" target="_blank" rel="noopener"
            style="padding:6px 12px;background:#06c755;color:#fff;border-radius:14px;text-decoration:none;font-size:11px;font-weight:600">
            LINE
          </a>
          <button onclick="app.copyAnalysisShare(this,${JSON.stringify(shareText + ' ' + refUrl).replace(/"/g, '&quot;')})"
            style="padding:6px 12px;background:#fff;color:#6366f1;border:1.5px solid #6366f1;border-radius:14px;cursor:pointer;font-size:11px;font-weight:600">
            📋 コピー
          </button>
          <button onclick="app.nativeShareAnalysis(${JSON.stringify(shareText + ' ' + refUrl).replace(/"/g, '&quot;')})"
            style="padding:6px 12px;background:#6366f1;color:#fff;border:none;border-radius:14px;cursor:pointer;font-size:11px;font-weight:600">
            📤 共有
          </button>
        </div>
      </div>`;
    }

    // Trend analysis
    if (trend) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">📈 経過の変化</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${Components.formatMarkdown(trend)}</div>
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
    if (nextCheck) {
      html += `<div style="padding:10px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">📋 次にやること</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.7">${Components.formatMarkdown(nextCheck)}</div>
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

  // ---- Guest CTA + 医師レポート: module-level fallbacks --------------
  // These are also re-bound to richer implementations from the
  // index.html DOMContentLoaded inline script (which has access to
  // closures like resolveKey / pickGuestDiseaseKey). The class
  // versions below exist so that:
  //   - onclick="app.guestSampleSubmit()" / app.guestSampleReport() /
  //     app.generateDoctorReport() never resolves to undefined, even
  //     before DOMContentLoaded fires or in environments where the
  //     inline script never runs (e.g. unit tests, SSR snapshots).
  //   - The smoke test (which loads JS modules without index.html)
  //     can verify that every onclick reference in templates has a
  //     real method — earlier builds regressed when a wholesale
  //     revert dropped these definitions.
  // -------------------------------------------------------------------
  // Same fallback story as the guest CTA methods above: setReaction /
  // toggleBookmark / runDeepAnalysis are also re-bound at runtime by
  // an index.html inline script. Provide module-level fallbacks so the
  // onclick="app.setReaction(...)" / "app.toggleBookmark(...)" /
  // "app.runDeepAnalysis()" handlers in js/pages.js never resolve to
  // undefined even before DOMContentLoaded fires or in test contexts.
  setReaction(id, section, reaction) {
    if (!id || !section) return;
    const archive = (store.get('deepAnalyses') || []).slice();
    const idx = archive.findIndex(a => a && a.id === id);
    if (idx < 0) return;
    const entry = Object.assign({}, archive[idx]);
    entry.reactions = Object.assign({}, entry.reactions || {});
    if (entry.reactions[section] === reaction) {
      delete entry.reactions[section];
    } else {
      entry.reactions[section] = reaction;
    }
    archive[idx] = entry;
    store.set('deepAnalyses', archive);
  }

  toggleBookmark(id, section) {
    if (!id || !section) return;
    const archive = (store.get('deepAnalyses') || []).slice();
    const idx = archive.findIndex(a => a && a.id === id);
    if (idx < 0) return;
    const entry = Object.assign({}, archive[idx]);
    entry.bookmarks = Object.assign({}, entry.bookmarks || {});
    if (entry.bookmarks[section]) {
      delete entry.bookmarks[section];
    } else {
      entry.bookmarks[section] = true;
    }
    archive[idx] = entry;
    store.set('deepAnalyses', archive);
  }

  async runDeepAnalysis() {
    // The richer streaming version lives in index.html (uses
    // callClaudeStream + token-by-token paint). This module-level
    // fallback runs the same prompt via the standard non-streaming
    // aiEngine.callModel so the handler never throws even if the
    // inline patch failed to apply. Stores the result into deepAnalyses
    // so the archive UI picks it up.
    const entries = store.get('textEntries') || [];
    const last = entries.length ? entries[entries.length - 1] : null;
    if (!last || !last.content) {
      try { Components.showToast('分析対象の記録が見つかりません。先に記録を送信してください。', 'info'); } catch (_) {}
      return;
    }
    store.set('isDeepAnalyzing', true);
    store.set('latestFeedbackError', null);
    try {
      const recent = entries.slice(-5).map((e, i) =>
        `${i + 1}. ${new Date(e.timestamp).toLocaleDateString('ja-JP')} [${e.category || ''}] ${String(e.content || '').substring(0, 300)}`
      ).join('\n');
      const userText = `[${last.category || 'symptoms'}] ${last.content}\n\n【直近の記録（最大5件）】\n${recent}`;
      const sysPrompt = '慢性疾患患者の日記を分析して JSON で返してください。キー: summary (要約), findings (所見), actions (行動配列), new_approach (新しいアプローチ), trend (傾向), next_check (次に確認すること)。前置きなしで JSON のみ。';
      const response = await aiEngine.callModel(store.get('selectedModel'), userText, {
        maxTokens: 2500,
        temperature: 0.3,
        globalTimeoutMs: 90000,
        systemPrompt: sysPrompt
      });
      const text = typeof response === 'string' ? response : JSON.stringify(response);
      let parsed = null;
      try { parsed = this.parseAIResponse(text); } catch (_) {}
      const analysis = {
        id: this.generateId ? this.generateId() : (Date.now().toString(36) + Math.random().toString(36).slice(2)),
        timestamp: new Date().toISOString(),
        type: 'text_analysis',
        parsed: parsed || { summary: '深い分析結果', findings: text },
        _raw: text,
        _fromAPI: true,
        _deepAnalysis: true,
        sourceContent: last.content
      };
      const archive = (store.get('deepAnalyses') || []).slice();
      archive.push(analysis);
      store.set('deepAnalyses', archive);
      store.set('latestFeedback', Object.assign({}, parsed || { findings: text }, { _deepAnalysis: true }));
      const todayJst = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
      store.set('deepAnalysisLastRun', todayJst);
    } catch (err) {
      const msg = (err && err.message) ? String(err.message) : String(err);
      store.set('latestFeedbackError', '深い分析に失敗しました: ' + msg);
    } finally {
      store.set('isDeepAnalyzing', false);
    }
  }

  guestSampleSubmit() {
    let firstId = 'default';
    try {
      const selectedTags = document.querySelectorAll('.guest-disease-tag.selected');
      if (selectedTags.length > 0 && selectedTags[0].dataset && selectedTags[0].dataset.id) {
        firstId = selectedTags[0].dataset.id;
      }
    } catch (_) { /* DOM not ready — fall through to default pool */ }
    const samples = (typeof CONFIG !== 'undefined' && CONFIG.GUEST_SAMPLES) || {};
    const pool = samples[firstId] || samples['default'] || [];
    if (!pool.length) {
      try { Components.showToast('サンプルがまだ読み込まれていません。少し待ってからお試しください。', 'info'); } catch (_) {}
      return;
    }
    const text = pool[Math.floor(Math.random() * pool.length)] || '';
    const input = document.getElementById('guest-input');
    if (input) {
      input.value = text;
      try { input.focus(); } catch (_) {}
    }
    if (typeof this.guestAnalyze === 'function') {
      this.guestAnalyze();
    }
  }

  guestSampleReport() {
    let diseaseId = 'mecfs';
    try {
      const selectedTags = document.querySelectorAll('.guest-disease-tag.selected');
      if (selectedTags.length > 0 && selectedTags[0].dataset && selectedTags[0].dataset.id) {
        diseaseId = selectedTags[0].dataset.id;
      }
    } catch (_) {}
    const reportData = (typeof CONFIG !== 'undefined' && CONFIG.GUEST_REPORT_DATA) || {};
    const sample = reportData[diseaseId] || reportData.mecfs;
    const resultEl = document.getElementById('guest-result');
    if (!resultEl) return;
    if (!sample) {
      resultEl.innerHTML = '<div style="padding:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#991b1b;font-size:12px">サンプルレポートデータがまだ読み込まれていません。ページを再読み込みしてからお試しください。</div>';
      return;
    }

    const diseases = (sample.diseases || []).join('、');
    const profile = sample.profile || {};
    const entries = sample.textEntries || [];
    const symptoms = sample.symptoms || [];
    const meds = sample.medications || [];
    const blood = sample.bloodTests || [];

    const entryRows = entries.slice(-6).map(e => {
      const d = new Date(e.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
      return `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:6px 8px;font-size:11px;color:#64748b;white-space:nowrap">${d}</td><td style="padding:6px 8px;font-size:12px;color:#1e293b">${Components.escapeHtml(e.content || '')}</td></tr>`;
    }).join('');

    const latestSymptom = symptoms[symptoms.length - 1] || {};
    const firstSymptom = symptoms[0] || {};
    const fatigueDelta = latestSymptom.fatigue_level && firstSymptom.fatigue_level
      ? firstSymptom.fatigue_level - latestSymptom.fatigue_level : 0;
    const trendText = fatigueDelta > 0 ? `疲労度 ${fatigueDelta} ポイント改善`
      : fatigueDelta < 0 ? `疲労度 ${-fatigueDelta} ポイント悪化` : '安定';

    const medRows = meds.map(m =>
      `<li style="font-size:11px;color:#1e293b;margin-bottom:2px">${Components.escapeHtml(m.name || '')}${m.notes ? ' — ' + Components.escapeHtml(m.notes) : ''}</li>`
    ).join('');

    const bloodRows = blood.map(b =>
      `<div style="font-size:11px;color:#1e293b;margin-bottom:4px"><span style="font-weight:600">${Components.escapeHtml(b.name || '')}</span>: ${Components.escapeHtml(b.findings || '')}</div>`
    ).join('');

    resultEl.innerHTML = `
      <div style="margin-top:12px;padding:16px;background:#fff;border:2px solid #0891b2;border-radius:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div style="font-size:14px;font-weight:700;color:#155e75">🏥 医師提出用レポート（サンプル）</div>
          <span style="font-size:10px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:8px;padding:2px 8px">架空のサンプルデータ</span>
        </div>
        <div style="font-size:12px;color:#0e7490;margin-bottom:12px;padding:8px 12px;background:#ecfeff;border-radius:8px">
          対象疾患: <strong>${Components.escapeHtml(diseases)}</strong> ／
          ${profile.age ? Components.escapeHtml(String(profile.age)) + '歳 ' : ''}${profile.gender === 'female' ? '女性' : profile.gender === 'male' ? '男性' : ''}
        </div>
        <div style="font-size:13px;font-weight:600;color:#1e3a8a;margin-bottom:6px">📊 症状推移サマリー</div>
        <div style="font-size:12px;color:#475569;margin-bottom:12px;padding:8px 12px;background:#f8fafc;border-radius:8px">
          期間: ${symptoms.length > 0 ? new Date(symptoms[0].timestamp).toLocaleDateString('ja-JP', {month:'long',day:'numeric'}) + ' 〜 ' + new Date(symptoms[symptoms.length-1].timestamp).toLocaleDateString('ja-JP', {month:'long',day:'numeric'}) : '記録なし'} ／
          ${trendText}
        </div>
        ${meds.length > 0 ? `<div style="font-size:13px;font-weight:600;color:#1e3a8a;margin-bottom:6px">💊 服薬記録</div><ul style="margin:0 0 12px;padding-left:16px">${medRows}</ul>` : ''}
        ${blood.length > 0 ? `<div style="font-size:13px;font-weight:600;color:#1e3a8a;margin-bottom:6px">🩸 検査結果</div><div style="margin-bottom:12px">${bloodRows}</div>` : ''}
        <div style="font-size:13px;font-weight:600;color:#1e3a8a;margin-bottom:6px">📝 日記ハイライト（直近 6 件）</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
          <tbody>${entryRows}</tbody>
        </table>
        <div style="padding:12px;background:linear-gradient(135deg,#eef2ff,#fdf4ff);border-radius:10px;text-align:center">
          <div style="font-size:13px;font-weight:700;color:#3730a3;margin-bottom:4px">あなた自身のデータでこのレポートを作成できます</div>
          <div style="font-size:11px;color:#4338ca;margin-bottom:10px">記録を続けると 90 日分の症状・服薬・検査結果を医師に説明しやすい形にまとめます</div>
          <button onclick="document.getElementById('login-section').scrollIntoView({behavior:'smooth'})"
            style="padding:10px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">
            無料で登録して使ってみる
          </button>
        </div>
      </div>`;
  }

  async generateDoctorReport() {
    const textEntries = store.get('textEntries') || [];
    const symptoms = store.get('symptoms') || [];
    const medications = store.get('medications') || [];
    const bloodTests = store.get('bloodTests') || [];
    const profile = store.get('userProfile') || {};
    const selectedDiseases = store.get('selectedDiseases') || [];

    if (textEntries.length + symptoms.length < 3) {
      try { Components.showToast('レポートを作成するには 3 件以上の記録が必要です', 'info'); } catch (_) {}
      return;
    }

    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const titleEl = document.getElementById('modal-title');
    if (!overlay || !body) {
      try { Components.showToast('モーダルを表示できません。ページを再読み込みしてください。', 'error'); } catch (_) {}
      return;
    }

    if (titleEl) titleEl.textContent = '🏥 医師提出用レポートを作成中…';
    body.innerHTML = Components.loading('過去の記録を整理しています...', { subtext: '90 日分のデータから医師向けサマリーを生成します（30〜60 秒）' });
    overlay.classList.add('active');

    let diseases = '未設定';
    try {
      diseases = selectedDiseases.map(id => {
        for (const cat of (CONFIG.DISEASE_CATEGORIES || [])) {
          const d = (cat.diseases || []).find(x => x.id === id);
          if (d) return d.name;
        }
        return id;
      }).join('、') || '未設定';
    } catch (_) {}

    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const recentEntries = textEntries.filter(e => e && e.timestamp >= cutoff).slice(-30);
    const recentSymptoms = symptoms.filter(s => s && s.timestamp >= cutoff).slice(-30);
    const recentMeds = medications.filter(m => m && m.timestamp >= cutoff).slice(-10);
    const recentBlood = bloodTests.filter(b => b && b.timestamp >= cutoff).slice(-5);

    const entryText = recentEntries.map(e =>
      `${String(e.timestamp).substring(0,10)} [${e.category||'diary'}] ${e.content||''}`
    ).join('\n');
    const symptomText = recentSymptoms.map(s =>
      `${String(s.timestamp).substring(0,10)} 疲労:${s.fatigue_level??'-'} 痛み:${s.pain_level??'-'} 脳霧:${s.brain_fog??'-'} 睡眠:${s.sleep_quality??'-'}`
    ).join('\n');
    const medText = recentMeds.map(m => `${m.name||''} ${m.dose||''} ${m.notes||''}`.trim()).join('、');
    const bloodText = recentBlood.map(b => `${b.name||''}: ${b.findings||''}`).join('；');

    const profileSummary = [
      profile.age ? profile.age + '歳' : '',
      profile.gender === 'female' ? '女性' : profile.gender === 'male' ? '男性' : '',
      profile.height ? profile.height + 'cm' : '',
      profile.weight ? profile.weight + 'kg' : ''
    ].filter(Boolean).join('、');

    const lang = profile.language || 'ja';
    const langDir = (typeof aiEngine !== 'undefined' && aiEngine._languageDirectiveFor)
      ? aiEngine._languageDirectiveFor(lang) : '';

    const prompt = `${langDir}
あなたは慢性疾患患者が医師に提出する診察レポートを作成するアシスタントです。
以下のデータから、受診時に医師に手渡せる形式のレポートを生成してください。

【患者基本情報】
${profileSummary}
対象疾患: ${diseases}

【過去 90 日の日記（最大 30 件）】
${entryText || '記録なし'}

【症状スコア推移】
${symptomText || '記録なし'}

【服薬記録】
${medText || '記録なし'}

【検査結果】
${bloodText || '記録なし'}

【出力形式】
以下の見出しを使った日本語の医師向けレポートを作成してください:
1. 主訴・経過サマリー（200〜300文字）
2. 症状の推移と傾向（箇条書き）
3. 服薬・治療内容
4. 検査結果ハイライト（あれば）
5. 医師への質問・確認事項（患者が聞きたいこと 3〜5 点）
6. 生活への影響度（就労・日常活動への影響）

レポートは医師が 3 分で読める簡潔な形式にしてください。`;

    try {
      const response = await aiEngine.callModel(store.get('selectedModel'), prompt, {
        maxTokens: 2000,
        temperature: 0.3,
        globalTimeoutMs: 60000
      });
      const text = typeof response === 'string' ? response : JSON.stringify(response);

      body.innerHTML = `
        <div style="font-size:14px;font-weight:700;color:#155e75;margin-bottom:12px">🏥 医師提出用レポート</div>
        <div style="font-size:11px;color:#0891b2;margin-bottom:14px;padding:8px 12px;background:#ecfeff;border-radius:8px">
          期間: 過去 90 日 ／ 対象: ${Components.escapeHtml(diseases)} ／ ${profileSummary ? Components.escapeHtml(profileSummary) : ''}
        </div>
        <div style="font-size:13px;line-height:1.8;white-space:pre-wrap;color:#1e293b;max-height:60vh;overflow-y:auto;padding:4px">${Components.escapeHtml(text)}</div>
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" style="flex:1" onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(text)}).then(()=>Components.showToast('レポートをクリップボードにコピーしました','success'))">📋 コピーして印刷</button>
          <button class="btn btn-outline" onclick="app.closeModal()">閉じる</button>
        </div>`;
    } catch (err) {
      const msg = (err && err.message) ? String(err.message) : String(err);
      body.innerHTML = `
        <div style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
          <div style="font-size:13px;font-weight:700;color:#991b1b;margin-bottom:6px">レポートの生成に失敗しました</div>
          <div style="font-size:12px;color:#7f1d1d;line-height:1.7;margin-bottom:10px;white-space:pre-wrap;word-break:break-word">${Components.escapeHtml(msg)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="app.generateDoctorReport()">🔄 再試行</button>
            <button class="btn btn-outline" onclick="app.closeModal()">閉じる</button>
          </div>
        </div>`;
    }
  }

  // ---- Manual proxy URL override -------------------------------------
  // When the hardcoded Worker URL doesn't resolve (e.g. workers.dev
  // trigger disabled, custom domain used, account subdomain differs)
  // and admin/config sync hasn't reached the user yet, give them a
  // way to type the correct URL directly. Stored in localStorage so
  // it sticks across reloads.
  // -------------------------------------------------------------------
  setProxyUrlFromInput() {
    const input = document.getElementById('proxy-url-override-input');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) {
      try { Components.showToast('URL を入力してください', 'error'); } catch (_) {}
      return;
    }
    // Strip trailing /v1/messages if user pasted the full path
    let url = raw.replace(/\/v1\/messages\/?$/, '');
    // Basic URL sanity check
    if (!/^https?:\/\//.test(url)) {
      try { Components.showToast('URL は https:// で始まる必要があります', 'error'); } catch (_) {}
      return;
    }
    try {
      localStorage.setItem('anthropic_proxy_url', url);
      try { Components.showToast('Proxy URL を保存しました。リロードします…', 'success'); } catch (_) {}
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      try { Components.showToast('保存に失敗しました: ' + e.message, 'error'); } catch (_) {}
    }
  }

  // ---- AI connection diagnostic --------------------------------------
  // When users see "接続できませんでした" from the AI proxy and we can't
  // reproduce the failure ourselves (Worker reachable from our side,
  // Cloudflare logs absent, etc.), we need an actionable way for the
  // affected user to surface what their browser actually saw. This
  // method runs three probes against the Worker URL — preflight,
  // simple GET, real POST — and renders a copyable diagnostic block
  // next to the error. Triggered from the "🔍 接続を診断する" button
  // in the error UI.
  // -------------------------------------------------------------------
  async diagnoseAiConnection(targetEl) {
    const url = (typeof getAnthropicEndpoint === 'function')
      ? getAnthropicEndpoint(false)
      : 'https://stock-screener.agewaller.workers.dev/v1/messages';
    const out = (targetEl && targetEl.tagName) ? targetEl : document.getElementById('ai-diag-output');
    if (!out) return;
    out.innerHTML = '<div style="font-size:11px;color:#475569">診断中…（数秒お待ちください）</div>';

    const probe = async (label, init) => {
      const start = Date.now();
      try {
        const r = await fetch(url, init);
        const ms = Date.now() - start;
        let bodyPreview = '';
        try { bodyPreview = (await r.text()).substring(0, 160); } catch (_) {}
        return {
          label,
          ok: r.ok,
          status: r.status,
          statusText: r.statusText,
          ms,
          cors: r.headers.get('Access-Control-Allow-Origin') || '(none)',
          contentType: r.headers.get('Content-Type') || '(none)',
          body: bodyPreview
        };
      } catch (err) {
        return {
          label,
          fatal: true,
          ms: Date.now() - start,
          name: err && err.name,
          message: (err && err.message) ? String(err.message) : String(err)
        };
      }
    };

    const results = [];
    results.push(await probe('OPTIONS preflight', {
      method: 'OPTIONS',
      headers: {
        'Origin': location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,anthropic-version'
      }
    }));
    results.push(await probe('GET (no body)', { method: 'GET' }));
    results.push(await probe('POST minimal payload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 32, messages: [{ role: 'user', content: 'ping' }] })
    }));

    const summary = {
      timestamp: new Date().toISOString(),
      probedUrl: url,
      origin: location.origin,
      ua: navigator.userAgent || '',
      results
    };
    const json = JSON.stringify(summary, null, 2);

    const rows = results.map(r => {
      if (r.fatal) {
        return `<tr><td style="padding:4px 8px;font-weight:600;color:#991b1b">${Components.escapeHtml(r.label)}</td><td style="padding:4px 8px;color:#991b1b">FATAL: ${Components.escapeHtml(r.name || '?')} — ${Components.escapeHtml(r.message)}</td><td style="padding:4px 8px;color:#64748b">${r.ms}ms</td></tr>`;
      }
      const okColor = r.ok ? '#166534' : (r.status >= 400 && r.status < 500 ? '#9a3412' : '#991b1b');
      return `<tr>
        <td style="padding:4px 8px;font-weight:600">${Components.escapeHtml(r.label)}</td>
        <td style="padding:4px 8px;color:${okColor}">${r.status} ${Components.escapeHtml(r.statusText || '')} ／ CORS: ${Components.escapeHtml(r.cors)}</td>
        <td style="padding:4px 8px;color:#64748b">${r.ms}ms</td>
      </tr>`;
    }).join('');

    out.innerHTML = `
      <div style="margin-top:10px;padding:10px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;font-size:11px">
        <div style="font-weight:700;margin-bottom:6px;color:#1e293b">🔍 接続診断結果</div>
        <div style="font-size:10px;color:#64748b;margin-bottom:6px;font-family:monospace;word-break:break-all">${Components.escapeHtml(url)}</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px">${rows}</table>
        <details style="margin-top:8px">
          <summary style="cursor:pointer;font-weight:600;color:#475569">詳細（運営者に共有）</summary>
          <pre style="margin-top:6px;padding:8px;background:#f8fafc;border-radius:6px;font-size:10px;white-space:pre-wrap;word-break:break-all;line-height:1.5">${Components.escapeHtml(json)}</pre>
          <button onclick="(navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(json)}))?.then(()=>Components.showToast('診断情報をコピーしました','success'))"
            style="margin-top:6px;padding:6px 12px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:10px;cursor:pointer">📋 診断情報をコピー</button>
        </details>
      </div>`;
  }

  // ---- Client cache / SW reset ---------------------------------------
  // Last-resort recovery for users stuck behind a stale Service Worker
  // or corrupted localStorage proxy URL. Earlier app builds registered
  // /sw.js with a cache-first strategy — even after we shipped fixes,
  // those users kept getting cached pre-fix code on every visit, which
  // is what produced the "永遠にエラー" feedback. This wipes everything
  // that could be holding them back and hard-reloads.
  // -------------------------------------------------------------------
  async resetClientCacheAndReload() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => { try { return r.unregister(); } catch (_) { return null; } }));
      }
    } catch (_) {}
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => { try { return caches.delete(n); } catch (_) { return null; } }));
      }
    } catch (_) {}
    // Wipe ONLY the diagnostic / behavioral flags that might be
    // stuck in a bad state. We deliberately KEEP:
    //   - `apikey_anthropic` (admin's shared key from Firestore)
    //   - `anthropic_proxy_url` (admin's Worker URL — wiping it would
    //     fall through to the hardcoded `agewaller` URL which may be
    //     wrong for the deployed Cloudflare account)
    // Both come from admin/config sync; clearing them strands the
    // user when re-sync also fails, which is exactly the "can't
    // recover from reset" scenario reported.
    try {
      ['sw_purged_v1', 'dismissed_inapp_banner']
        .forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    } catch (_) {}
    // Hard reload, bypass HTTP cache.
    try { location.reload(); } catch (_) { window.location.href = window.location.href; }
  }

  // ---- User content edit / delete -----------------------------------
  // Lets the user freely modify or remove anything they wrote / uploaded
  // (text entries, photos, file uploads). Each entry carries a stable
  // id, so we look up by that and rewrite the whole textEntries array.
  // Cleans up linked aiComments and photos so deleted records don't
  // leave orphan references behind. Re-render is automatic via the
  // store listener on textEntries (scheduleDashRefresh).
  // -------------------------------------------------------------------
  deleteTextEntry(id) {
    if (!id) return;
    const entries = store.get('textEntries') || [];
    const target = entries.find(e => e && e.id === id);
    const next = entries.filter(e => !e || e.id !== id);
    store.set('textEntries', next);

    // Remove linked AI comment so it doesn't appear without an entry
    const comments = store.get('aiComments') || {};
    if (comments[id]) {
      delete comments[id];
      store.set('aiComments', comments);
    }

    // If this was a photo / file upload, also remove the photo blob
    if (target && target.photoId) {
      const photos = store.get('photos') || [];
      const remainingPhotos = photos.filter(p => p && p.id !== target.photoId);
      if (remainingPhotos.length !== photos.length) {
        store.set('photos', remainingPhotos);
      }
    }

    Components.showToast('削除しました', 'success');
  }

  // Switches the rendered entry card into an inline edit form.
  // Avoids a full re-render so the user keeps their scroll position
  // and any unrelated state. Save / cancel restore the normal view.
  beginEditTextEntry(id) {
    const card = document.querySelector(`[data-entry-id="${CSS.escape(id)}"]`);
    if (!card) return;
    const entries = store.get('textEntries') || [];
    const entry = entries.find(e => e && e.id === id);
    if (!entry) return;
    const safeContent = (entry.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeTitle = (entry.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    card.dataset.editing = '1';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:11px;color:var(--text-muted)">編集中</span>
      </div>
      <input type="text" id="edit-title-${id}" value="${safeTitle}" placeholder="タイトル（任意）"
        style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;box-sizing:border-box">
      <textarea id="edit-content-${id}" rows="4"
        style="width:100%;padding:8px;font-size:13px;line-height:1.6;border:1px solid var(--border);border-radius:6px;resize:vertical;box-sizing:border-box;font-family:inherit">${safeContent}</textarea>
      <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">
        <button onclick="app.cancelEditTextEntry('${id}')"
          style="padding:6px 12px;font-size:12px;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;cursor:pointer">キャンセル</button>
        <button onclick="app.saveEditTextEntry('${id}')"
          style="padding:6px 12px;font-size:12px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">保存</button>
      </div>`;
    const ta = document.getElementById(`edit-content-${id}`);
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }

  saveEditTextEntry(id) {
    const titleEl = document.getElementById(`edit-title-${id}`);
    const contentEl = document.getElementById(`edit-content-${id}`);
    if (!contentEl) return;
    const newContent = contentEl.value.trim();
    if (!newContent) {
      Components.showToast('内容を入力してください', 'error');
      return;
    }
    const newTitle = titleEl ? titleEl.value.trim() : '';
    const entries = store.get('textEntries') || [];
    const next = entries.map(e => {
      if (!e || e.id !== id) return e;
      return Object.assign({}, e, {
        content: newContent,
        title: newTitle || e.title || '',
        editedAt: new Date().toISOString()
      });
    });
    store.set('textEntries', next);
    Components.showToast('編集を保存しました', 'success');
  }

  cancelEditTextEntry(_id) {
    // Easiest path back to the read-only view: trigger a re-render via
    // the same store listener everything else uses. Setting textEntries
    // to its current value still fires the listener.
    const entries = store.get('textEntries') || [];
    store.set('textEntries', entries.slice());
  }

  // One-shot purge of aiComments entries matching the old demo
  // output shape. These got persisted before the rejection guards
  // were added and keep resurfacing as garbled JSON in the dashboard.
  cleanupLegacyAIComments() {
    const comments = store.get('aiComments') || {};
    const keys = Object.keys(comments);
    let removed = 0;
    const isLegacy = (r) => {
      if (!r || typeof r !== 'object') return false;
      if (typeof r.healthScore === 'number' && r.trends?.fatigue?.direction) return true;
      if (Array.isArray(r.actionItems) && Array.isArray(r.researchUpdates)) return true;
      if (typeof r.summary === 'string' && /入力データ\s*\d+\s*件を分析/.test(r.summary)) return true;
      for (const f of ['summary', 'findings', '_raw']) {
        const v = r[f];
        if (typeof v === 'string' && /^\s*\{\s*"(summary|healthScore|trends)"/.test(v)) return true;
      }
      return false;
    };
    for (const k of keys) {
      const c = comments[k];
      if (c && isLegacy(c.result)) {
        delete comments[k];
        removed++;
      }
    }
    store.set('aiComments', comments);
    const fb = store.get('latestFeedback');
    if (isLegacy(fb)) {
      store.set('latestFeedback', null);
      removed++;
    }
    if (removed === 0) {
      Components.showToast('古い分析データは見つかりませんでした', 'info');
    } else {
      Components.showToast(`${removed}件の古い分析データを削除しました`, 'success');
      setTimeout(() => this.navigate('dashboard'), 800);
    }
  }

  // Auto-translate URLs for non-tech-savvy users (avg age 65)
  // Uses translate.goog format which works better than translate.google.com/translate
  translateUrl(url) {
    if (!url || url.length < 10) return url || '#';

    // Clean URL: remove non-ASCII chars that may have been appended
    let cleanUrl = url.replace(/[^\x20-\x7E]/g, '').trim().replace(/[.,;:!?]+$/, '');
    if (cleanUrl.length < 10) return url;

    // Don't translate if already translated or internal
    if (cleanUrl.includes('translate.goog') || cleanUrl.includes('translate.google')) return cleanUrl;
    if (cleanUrl.includes('cares.advisers.jp')) return cleanUrl;

    const profile = store.get('userProfile') || {};
    const lang = profile.language || 'ja';

    // Same-language sites: direct link
    const lowerUrl = cleanUrl.toLowerCase();
    const sameLang = {
      'ja': ['.co.jp', '.jp/', '.jp?', 'peatix.com', 'note.com', 'amazon.co.jp'],
      'en': ['.com/', '.com?', '.org/', '.io/', 'pubmed', 'clinicaltrials.gov', 'iherb.com'],
      'ko': ['.co.kr', 'naver.com'],
      'zh': ['.cn/', '.tw/'],
    };
    if ((sameLang[lang] || []).some(p => lowerUrl.includes(p))) return cleanUrl;

    // Translate using translate.goog
    try {
      const parsed = new URL(cleanUrl);
      return `https://${parsed.hostname.replace(/\./g, '-')}.translate.goog${parsed.pathname}${parsed.search ? parsed.search + '&' : '?'}_x_tr_sl=auto&_x_tr_tl=${lang}&_x_tr_hl=${lang}`;
    } catch(e) {
      return cleanUrl;
    }
  }

  // ---- Guest Mode (no registration) ----
  // Lazy-load the public user count for the social-proof widget on
  // the login page. The count is read from the Firestore users
  // collection; we only show the number (no per-user data). If the
  // collection read fails (unauth, offline, rules), we fail silent
  // — the widget then just shows a generic message.
  async loadPublicUserCount() {
    const el = document.getElementById('public-user-count-inline');
    if (!el) return;
    // Cache the value in localStorage for 1 hour so repeat visitors
    // don't incur a Firestore read per page load.
    const CACHE_KEY = 'public_user_count_cache';
    const cache = (() => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const j = JSON.parse(raw);
        if (Date.now() - j.at > 3600000) return null;
        return j;
      } catch (_) { return null; }
    })();
    if (cache && typeof cache.count === 'number') {
      el.textContent = `🌱 ${cache.count.toLocaleString()} 人が使用中`;
      return;
    }
    if (typeof FirebaseBackend === 'undefined' || !FirebaseBackend.initialized) {
      el.textContent = '';
      return;
    }
    try {
      // Use count() aggregation if available (Firebase v9+); fall
      // back to a bounded .get() otherwise so we don't blow up
      // read costs for very large collections.
      const db = firebase.firestore();
      let total = 0;
      try {
        // Firebase compat: query.count() may not exist on some SDK versions.
        const countSnap = await db.collection('users').get();
        total = countSnap.size;
      } catch (e) {
        total = 0;
      }
      if (total > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ count: total, at: Date.now() }));
        el.textContent = `🌱 ${total.toLocaleString()} 人が使用中`;
      } else {
        el.textContent = '';
      }
    } catch (err) {
      // Firestore rules may block anonymous reads until the user
      // signs in. This is expected — we silently hide the widget.
      el.textContent = '';
    }
  }

  // Show a 3-step onboarding widget to users with 0 records. This
  // is the single best moment to guide them into their first
  // action. Removes itself after the first record is posted.
  maybeShowFirstTimeOnboarding() {
    const entries = store.get('textEntries') || [];
    const symptoms = store.get('symptoms') || [];
    if (entries.length > 0 || symptoms.length > 0) return;
    // Inject the onboarding card right above #page-content's first
    // card. Avoid duplicates on re-render.
    if (document.getElementById('onboarding-first-time')) return;
    const host = document.getElementById('page-content');
    if (!host) return;
    const card = document.createElement('div');
    card.id = 'onboarding-first-time';
    card.innerHTML = `
      <div style="margin-bottom:16px;padding:18px 20px;background:linear-gradient(135deg,#ecfeff 0%,#eef2ff 100%);border:1.5px solid #6366f1;border-radius:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:14px;font-weight:800;color:#3730a3">🌱 ようこそ。3 ステップで始めましょう</div>
          <button onclick="document.getElementById('onboarding-first-time').remove()"
            style="padding:3px 10px;background:transparent;color:#6366f1;border:none;cursor:pointer;font-size:11px">閉じる</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:10px;align-items:center">
            <div style="width:26px;height:26px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">1</div>
            <div style="font-size:12px;color:#1e293b;line-height:1.6"><strong>今日の体調を 1 行でも書く</strong>（上の入力欄）。「だるい」だけでも AI が分析します</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <div style="width:26px;height:26px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">2</div>
            <div style="font-size:12px;color:#1e293b;line-height:1.6"><strong>今日の新処方を受け取る</strong>。毎日 14 軸から違う処方が届きます</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <div style="width:26px;height:26px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">3</div>
            <div style="font-size:12px;color:#1e293b;line-height:1.6"><strong>明日も記録を続ける</strong>。7 日続けるとパターンが見え始めます</div>
          </div>
        </div>
        <div style="margin-top:10px;padding:8px 12px;background:#fff;border-radius:8px;font-size:11px;color:#64748b;line-height:1.6">
          💡 <strong>ヒント:</strong> 📎 ボタンで食事・薬・検査結果の写真もアップできます。AI がカロリー・栄養・薬効を自動解析します
        </div>
      </div>
    `;
    host.insertBefore(card.firstElementChild, host.firstElementChild);
  }

  // Update the "選択疾患の規模" badge when the user ticks disease
  // checkboxes in the login-screen disease picker. Emits both the
  // world and Japan patient counts so the user can see immediately
  // that they are part of a larger community. Silently no-ops if
  // no container exists (e.g. on pages that don't show the picker).
  updateSelectedDiseaseScale() {
    const el = document.getElementById('selected-disease-scale');
    if (!el) return;
    const selectedIds = Array.from(document.querySelectorAll('.disease-checkbox:checked'))
      .map(c => c.value);
    if (selectedIds.length === 0) {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    const parts = selectedIds.slice(0, 4).map(id => {
      const epi = (CONFIG.DISEASE_EPIDEMIOLOGY || {})[id];
      if (!epi) return null;
      const name = (CONFIG.DISEASE_CATEGORIES
        .flatMap(c => c.diseases).find(d => d.id === id) || {}).name || id;
      const parts2 = [];
      if (epi.label && epi.label !== '世界推計は策定中') parts2.push(`世界 ${epi.label}`);
      if (epi.japanLabel && epi.japanLabel !== '国内推計策定中') parts2.push(`国内 ${epi.japanLabel}`);
      if (parts2.length === 0) return null;
      return `<div style="margin-bottom:4px"><strong style="color:#3730a3">${Components.escapeHtml(name)}</strong>: ${Components.escapeHtml(parts2.join(' / '))}</div>`;
    }).filter(Boolean);
    if (parts.length === 0) {
      el.style.display = 'none';
      return;
    }
    const overflowNote = selectedIds.length > 4
      ? `<div style="font-size:10px;color:var(--text-muted);margin-top:4px">…他 ${selectedIds.length - 4} 件</div>`
      : '';
    el.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:#3730a3;margin-bottom:6px">📊 あなたは決して一人ではありません</div>
      <div style="font-size:11px;color:#4338ca;line-height:1.7">${parts.join('')}${overflowNote}</div>
    `;
    el.style.display = '';
  }

  // Update the "あなただけじゃない" scale message below the guest
  // disease tag row. Called by each tag's onclick handler so the
  // user sees the world-scale number for their selected condition
  // the moment they tap a tag — a small but emotionally powerful
  // signal that they are part of a large global patient community.
  updateGuestDiseaseScale() {
    const scaleEl = document.getElementById('guest-disease-scale');
    const textEl = document.getElementById('guest-disease-scale-text');
    if (!scaleEl || !textEl) return;
    const selectedTags = document.querySelectorAll('.guest-disease-tag.selected');
    if (selectedTags.length === 0) {
      scaleEl.style.display = 'none';
      return;
    }
    // Collect labels for selected diseases that have world data.
    const parts = [];
    selectedTags.forEach(t => {
      const label = t.dataset.worldLabel;
      const name = t.textContent.trim();
      if (label) parts.push(`${name}: 世界で ${label}`);
    });
    if (parts.length === 0) {
      scaleEl.style.display = 'none';
      return;
    }
    textEl.innerHTML = parts.join(' ／ ') + ' が同じ症状と向き合っています。';
    scaleEl.style.display = '';
  }

  async guestAnalyze() {
    const input = document.getElementById('guest-input');
    if (!input || !input.value.trim()) {
      Components.showToast('体調や気になることを書いてみてください', 'info');
      return;
    }
    const text = input.value.trim();
    const resultEl = document.getElementById('guest-result');
    if (resultEl) resultEl.innerHTML = Components.loading('寄り添い中...', {
      subtext: 'まもなくアドバイスが届きます'
    });

    // Hard timeout for guest mode — 20s max. Prevents the eternal
    // spinner when Firebase/Worker/Anthropic is slow or hanging.
    const GUEST_TIMEOUT = 20000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GUEST_TIMEOUT: 20秒以内に応答がありませんでした')), GUEST_TIMEOUT)
    );

    const authOk = await Promise.race([
      FirebaseBackend.ensureGuestAuth(),
      new Promise(resolve => setTimeout(() => resolve(false), 5000))
    ]);
    if (!authOk) {
      console.warn('[guestAnalyze] ensureGuestAuth returned false — proceeding with Worker env fallback');
    }

    // Collect selected diseases from guest tags
    const selectedTags = document.querySelectorAll('.guest-disease-tag.selected');
    const diseases = Array.from(selectedTags).map(t => t.dataset.id);
    const prevDiseases = store.get('selectedDiseases');
    if (diseases.length > 0) store.set('selectedDiseases', diseases);

    try {
      // Speed/empathy balance: use Claude Haiku 4.5 (2-3x faster than
      // Opus) + compact warm prompt (~400 chars, no PROMPT_HEADER) +
      // small maxTokens (600) to deliver a structured empathetic
      // response in ~5-10 seconds. This satisfies both:
      //   "簡易分析に戻して" (fast)
      //   "寄り添い分析できるように" (empathetic)
      const diseaseLabel = diseases.length > 0 ? diseases.join('・') : '';
      const profile = store.get('userProfile') || {};
      const langDirective = aiEngine._languageDirectiveFor(profile.language || 'ja');
      // Guest mode uses a compact prompt (no full PROMPT_HEADER) to
      // hit the 10-second target. We still want the "today's new
      // prescription axis" behavior though, so we inject JUST the
      // axis (not the full recent-proposals block, which would bloat
      // tokens and slow the response).
      const todayAxis = aiEngine._getTodayPrescriptionAxis();
      const axisHint = todayAxis
        ? `\n【本日の新処方の指定軸】${todayAxis.icon} ${todayAxis.name}\n  候補例: ${todayAxis.desc}\n  → new_approach の内容はこの軸から具体的に 1 つ選んでください。`
        : '';
      const compactPrompt = `${langDirective}

あなたは慢性疾患患者の伴走パートナーです。初めて訪れたユーザーの相談に
温かく寄り添って、短くても希望のあるアドバイスを返してください。

【ユーザーの相談】
${text.substring(0, 1500)}
${diseaseLabel ? `\n【気になる症状】${diseaseLabel}` : ''}
${axisHint}

【応答ルール】
1. 必ず共感の言葉から始める（「その症状、つらいですね」等）
2. 考えられる原因や状態を 2-3 行で簡潔に解説
3. 今日から試せる具体的な一歩を 1 つ提示
4. new_approach には指定軸 (${todayAxis ? todayAxis.name : '新しい打ち手'}) から具体的な処方を書く
5. 「もっと詳しく知りたい場合は登録して継続記録すると追跡できます」と添える
6. 命令形を使わず、選択肢として提示する

【出力形式】純粋な JSON のみ（前置き・後書き・コードブロックなし）:
{
  "summary": "共感の一言（30文字以内）",
  "findings": "考えられる状態・原因の解説（80-120文字）",
  "actions": ["今日から試せる一歩（30-50文字）"],
  "new_approach": "今日の新処方: ${todayAxis ? todayAxis.name + 'から' : ''}具体的な提案（用量・頻度・期待効果を 40-80 文字）"
}`;

      // Try Haiku first for speed; if no key/proxy, fall back to
      // whatever the user has configured.
      let modelId = 'claude-haiku-4-5';
      const haveHaikuKey = !!aiEngine.getApiKey(modelId);
      const sharedOk = aiEngine.canUseSharedProxy && aiEngine.canUseSharedProxy();
      if (!haveHaikuKey && !sharedOk) {
        modelId = store.get('selectedModel') || 'claude-opus-4-6';
      }

      const rawResponse = await Promise.race([
        aiEngine.callModel(modelId, compactPrompt, {
          maxTokens: 600,
          temperature: 0.5,
          globalTimeoutMs: 15000
        }),
        timeoutPromise
      ]);
      const responseText = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse);
      let result = this.parseAIResponse(responseText);
      if (!result || (typeof result !== 'object')) {
        result = { summary: 'アドバイス', findings: responseText, actions: [] };
      }
      result._fromAPI = true;
      if (resultEl) {
        resultEl.innerHTML = this.renderAnalysisCard(result) +
          `<div style="margin-top:12px;padding:12px;background:#f0fdf4;border-radius:12px;text-align:center">
            <div style="font-size:13px;font-weight:600;color:#166534;margin-bottom:6px">記録を続けると、さらに詳しい分析ができます</div>
            <div style="font-size:11px;color:#15803d;margin-bottom:10px">登録すると毎日の変化を追跡し、あなたに合った情報をお届けします</div>
            <button onclick="document.getElementById('login-section').scrollIntoView({behavior:'smooth'})" style="padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">無料で登録する ↓</button>
          </div>`;
      }
    } catch (err) {
      console.warn('[guestAnalyze] Failed:', err?.message || err);
      const isAdmin = this.isAdmin();
      const errMessage = err?.message || String(err);
      // Build a user-friendly one-line hint from the error. We surface
      // enough info for the user to report the issue back (HTTP status,
      // short reason) without dumping full stack traces onto the UI.
      let friendlyHint = '一時的に AI 分析サービスに接続できませんでした。少し時間を置いてもう一度お試しください。';
      if (/no API key|ALL_PROVIDERS_FAILED.*no API key/i.test(errMessage)) {
        friendlyHint = 'AIサービスのAPIキーが設定されていません。管理者がAPIキーを設定するまでお待ちください。';
      } else if (/403|Origin not allowed|Forbidden/i.test(errMessage)) {
        friendlyHint = 'このドメインからの接続が許可されていません (403)。本番サイト (cares.advisers.jp) からご利用ください。';
      } else if (/401/.test(errMessage)) {
        friendlyHint = 'APIキーが設定されていません (401)。管理者に連絡してください。';
      } else if (/404|not found|deprecat/i.test(errMessage)) {
        friendlyHint = 'AI モデルが一時的に利用できません。別のモデルを試しています…';
      } else if (/429|rate limit/i.test(errMessage)) {
        friendlyHint = '一時的に混雑しています (429)。30 秒ほど待ってから再度お試しください。';
      } else if (/Failed to fetch|NetworkError|TypeError/.test(errMessage)) {
        friendlyHint = 'ネットワーク接続に失敗しました。Wi-Fi または通信状況をご確認ください。';
      } else if (/500|502|503|504/.test(errMessage)) {
        friendlyHint = 'AI サービスが一時的に応答していません (5xx)。数分後に再度お試しください。';
      }
      // Build a diagnostic string that users can copy back to us when
      // reporting the issue. Includes browser UA + timestamp so we can
      // correlate with Worker logs.
      const diag = [
        'Timestamp: ' + new Date().toISOString(),
        'Error: ' + errMessage,
        'Model requested: ' + (modelId || 'unknown'),
        'UA: ' + (navigator.userAgent || '')
      ].join('\n');
      const diagEscaped = Components.escapeHtml(diag);
      if (resultEl) {
        resultEl.innerHTML = `
          <div style="padding:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
            <div style="font-size:13px;font-weight:600;color:#991b1b;margin-bottom:6px">分析サービスに接続できませんでした</div>
            <div style="font-size:12px;color:#7f1d1d;line-height:1.7;margin-bottom:10px">
              ${Components.escapeHtml(friendlyHint)}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
              <button onclick="app.guestAnalyze()" style="padding:8px 16px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">🔄 もう一度試す</button>
              <button onclick="document.getElementById('login-section').scrollIntoView({behavior:'smooth'})" style="padding:8px 16px;background:#fff;color:#6366f1;border:1.5px solid #6366f1;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">無料で登録して使う ↓</button>
            </div>
            <details style="font-size:11px;color:#7f1d1d;margin-top:6px">
              <summary style="cursor:pointer;font-weight:600">🔍 詳細（運営者への報告に使えます）</summary>
              <pre style="margin-top:6px;padding:10px;background:#fff;border:1px solid #fecaca;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#334155;white-space:pre-wrap;word-break:break-all;line-height:1.5">${diagEscaped}</pre>
              <button onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(diag)}).then(()=>Components.showToast('診断情報をコピーしました。info@bluemarl.in までお送りください','success'))"
                style="margin-top:6px;padding:6px 12px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;border-radius:6px;font-size:10px;cursor:pointer">📋 診断情報をコピー</button>
              ${isAdmin
                ? `<div style="margin-top:10px;padding:10px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;color:#78350f;font-size:11px;line-height:1.7">
                     <strong>管理者向けヒント:</strong><br>
                     ゲストモードは Cloudflare Worker <code>stock-screener</code> 経由で動きます。<br>
                     ① Worker に <code>ANTHROPIC_API_KEY</code> シークレットが設定されているか確認:<br>
                     <code style="background:#fef2f2;padding:2px 6px;border-radius:3px;display:inline-block;margin-top:4px">wrangler secret put ANTHROPIC_API_KEY --name stock-screener</code><br>
                     ② モデル ID が有効か確認 (現在 MODEL_MAP は <code>claude-haiku-4-5</code> / <code>claude-opus-4-6</code> / <code>claude-sonnet-4-6</code> を使用)<br>
                     ③ Cloudflare Dashboard → Workers → stock-screener → Logs で Worker の実際のエラーを確認
                   </div>`
                : ''}
            </details>
          </div>`;
      }
    } finally {
      // Restore selectedDiseases even when analysis fails.
      if (prevDiseases) {
        store.set('selectedDiseases', prevDiseases);
      } else {
        store.set('selectedDiseases', []);
      }
    }
  }

  async guestFileAnalyze(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const resultEl = document.getElementById('guest-result');
    if (resultEl) resultEl.innerHTML = Components.loading('写真を認識中...');

    // Same anonymous-auth bootstrapping as guestAnalyze — without
    // this the API falls back to a canned message every time.
    await FirebaseBackend.ensureGuestAuth();

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        const rawDataUrl = ev.target.result;
        // iPhone photos are 3-5MB raw which base64-encodes to 5-7MB.
        // Without compression, the vision API path rejects the payload
        // (either at the Worker with a 413 or at Anthropic with a 400
        // about image size) and the user sees a generic failure. The
        // other photo paths (dashboard / journal) already call
        // Components.compressImage → 800px JPEG@0.7 (~100-300KB). This
        // path was missing it, which is why guest食事写真 never reached
        // the AI even on a real browser.
        const payload = isImage
          ? await Components.compressImage(rawDataUrl)
          : rawDataUrl;
        const rawKB = Math.round((rawDataUrl || '').length / 1024);
        const sentKB = Math.round((payload || '').length / 1024);
        console.log(`[guestFileAnalyze] ${file.name} ${file.type} raw=${rawKB}KB sent=${sentKB}KB`);

        const attachOpts = isImage
          ? { imageBase64: payload }
          : (isPDF ? { pdfBase64: payload } : {});
        // Bump temperature for guest file uploads so identical images
        // don't always yield the same canned output. Also stamp the
        // filename caption with a timestamp to break any request-level
        // cache on upstream providers.
        attachOpts.temperature = 0.6;
        const analyzeType = isImage ? 'image_analysis' : (isPDF ? 'document_analysis' : 'text_analysis');
        const kind = isPDF ? 'PDF 文書' : '写真';
        const result = await this.analyzeViaAPI(
          `[${kind}: ${file.name} · ${new Date().toLocaleString('ja-JP')}]`,
          analyzeType,
          attachOpts
        );

        if (resultEl) {
          resultEl.innerHTML = this.renderAnalysisCard(result) +
            `<div style="margin-top:12px;padding:12px;background:#f0fdf4;border-radius:12px;text-align:center">
              <div style="font-size:13px;font-weight:600;color:#166534;margin-bottom:6px">この分析を保存して続けませんか？</div>
              <button onclick="document.getElementById('login-section').scrollIntoView({behavior:'smooth'})" style="padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">無料で登録する ↓</button>
            </div>`;
        }
      } catch (err) {
        console.warn('[guestFileAnalyze] Failed:', err?.message || err);
        if (resultEl) {
          // Surface the actual error message instead of a canned
          // "通信エラー" line. For in-app-browser / CORS failures the
          // thrower (ai-engine.js callAnthropic) now returns a
          // Japanese message telling the user to open in an external
          // browser — swallowing it hid the actionable advice.
          const friendly = (err && err.message)
            ? String(err.message)
            : '通信エラーが発生しました。時間をおいて再度お試しください。';
          resultEl.innerHTML = this.renderAnalysisCard({
            summary: 'ファイル分析に失敗しました',
            findings: friendly,
            actions: []
          });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  // ---- Dashboard Quick Input ----
  dashQuickSubmit() {
    if (store.get('isAnalyzing')) {
      Components.showToast('分析中です。完了までお待ちください。', 'info');
      return;
    }
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

    input.value = '';

    // Flip analyzing/feedback flags BEFORE appending textEntries so
    // any downstream re-render (scheduleDashRefresh fires 200ms after
    // store.set('textEntries', ...)) renders the loading spinner
    // instead of the old feedback. Without these flags the spinner
    // we inject below gets wiped by the scheduled refresh and the
    // user stares at an empty feedback area for the entire API
    // roundtrip — the symptom users saw as "AI アドバイスが出ない".
    store.set('latestFeedback', null);
    store.set('latestFeedbackError', null);
    store.set('isAnalyzing', true);
    // Record start timestamp so the spinner can show staged progress
    // messages ("...認識中" → "組み立て中" → "分析中" → "時間がかかっています")
    store.set('analyzeStartedAt', Date.now());

    const textEntries = store.get('textEntries') || [];
    textEntries.push(entry);
    store.set('textEntries', textEntries);

    const history = store.get('conversationHistory') || [];
    history.push({ role: 'user', content: content, timestamp: entry.timestamp, type: 'data_entry' });
    store.set('conversationHistory', history);

    // Re-render the dashboard so the new text entry appears in the
    // feed and dash-ai-feedback shows the loading spinner via the
    // isAnalyzing branch in render_dashboard.
    this.navigate('dashboard');

    // Simple direct API call — no heavy prompt interpolation, no fallback chain.
    const entryId = entry.id;
    const apiKey = localStorage.getItem('apikey_anthropic') || '';
    if (!apiKey) {
      store.set('isAnalyzing', false);
      store.set('latestFeedbackError', 'APIキーが設定されていません。管理パネル→APIキーで設定してください。');
      return;
    }

    const diseases = (store.get('selectedDiseases') || []).join('・');
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 25000);

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: store.get('selectedModel') || 'claude-sonnet-4-6',
        max_tokens: 800,
        temperature: 0.4,
        system: 'あなたは慢性疾患患者の日記分析パートナーです。温かく寄り添い、具体的なアドバイスを日本語で返してください。',
        messages: [{ role: 'user', content: (diseases ? '【疾患: ' + diseases + '】\n' : '') + content }]
      }),
      signal: ctrl.signal
    })
    .then(res => {
      clearTimeout(tid);
      if (!res.ok) return res.text().then(t => { throw new Error('API ' + res.status + ': ' + t.substring(0, 200)); });
      return res.json();
    })
    .then(data => {
      store.set('isAnalyzing', false);
      const text = data?.content?.[0]?.text || '';
      const result = { summary: '分析結果', findings: text, actions: [], _fromAPI: true };
      try { const p = this.parseAIResponse(text); if (p && p.summary) Object.assign(result, p); } catch(_){}
      store.set('latestFeedback', result);
      this.saveAIComment(entryId, result);
    })
    .catch(err => {
      clearTimeout(tid);
      store.set('isAnalyzing', false);
      const msg = err.name === 'AbortError' ? '25秒以内に応答がありませんでした。もう一度お試しください。' : (err.message || String(err));
      store.set('latestFeedbackError', msg);
    });
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

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rawDataUrl = ev.target.result;
        const compressed = isImage ? await Components.compressImage(rawDataUrl) : '';
        const photoId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        store.addHealthData('photos', {
          id: photoId,
          filename: file.name, type: file.type, size: file.size,
          dataUrl: compressed,
          category: category
        });

        const textEntries = store.get('textEntries') || [];
        textEntries.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          timestamp: new Date().toISOString(),
          category: category,
          type: 'file_upload',
          photoId: isImage ? photoId : '',
          previewImage: compressed,
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

        Components.showToast(`${file.name} を認識中...`, 'info');

        // Use the same isAnalyzing-based loading pattern as
        // dashQuickSubmit so the spinner survives scheduleDashRefresh.
        store.set('latestFeedback', null);
        store.set('latestFeedbackError', null);
        store.set('isAnalyzing', true);
        this.navigate('dashboard');

        // ALL analysis via API prompt. Pass a richer user input so
        // the model has strong context about what it's looking at.
        // PDFs go through the same 2-pass classifier as images via the
        // Anthropic `document` content block, so Claude can natively
        // read the file content (검사 결과 PDF・처방전 PDF・식단표 PDF 등).
        // Send compressed image (already computed above) — the raw
        // dataURL is 5-7MB for iPhone photos which exceeds Anthropic's
        // vision block size. PDFs are not compressed (compressImage
        // only handles images) so the raw stream goes through.
        const attachOpts = isImage
          ? { imageBase64: compressed }
          : (isPDF ? { pdfBase64: ev.target.result } : {});
        const analyzeType = (isImage || isPDF) ? (isImage ? 'image_analysis' : 'document_analysis') : 'text_analysis';
        const userNote = isImage
          ? `ユーザーが写真をアップロードしました (${file.name})。画像を見て、食事・薬・検査結果・身体の状態などを判別し、該当するカテゴリの完全解析を JSON で返してください。食事の写真（デザートやお菓子も含む）の場合は image_type を "food" にして、栄養成分・カロリー・PFC・改善提案を全て含めてください。`
          : isPDF
          ? `ユーザーが PDF 文書をアップロードしました (${file.name})。文書の内容を読み取り、検査結果・処方箋・診断書・食事記録などの種別を判別し、該当するカテゴリの完全解析を JSON で返してください。`
          : `ユーザーがファイルをアップロードしました (${file.name})。内容を解析してください。`;
        this.analyzeViaAPI(
          userNote,
          analyzeType,
          attachOpts
        ).then(result => {
          store.set('isAnalyzing', false);
          if (result && result._fromAPI === false) {
            store.set('latestFeedbackError', result._error || result.findings || '分析に失敗しました');
            return;
          }
          store.set('latestFeedback', result);
          const fileEntries = store.get('textEntries') || [];
          const lastFileEntry = fileEntries.filter(e => e.type === 'file_upload').pop();
          if (lastFileEntry) this.saveAIComment(lastFileEntry.id, result);
        }).catch(err => {
          console.error('[dashQuickFile] analyzeViaAPI failed:', err);
          store.set('isAnalyzing', false);
          store.set('latestFeedbackError', err?.message || String(err));
        });
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
    if (resultEl) resultEl.innerHTML = Components.loading('ファイルを認識中...');

    Array.from(files).forEach(async (file) => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';

      // Try auto-import for structured non-image files (CSV/JSON/XML).
      // PDFs skip this step because Integrations.importFile only knows
      // parsing rules for row-based data — PDFs are handed straight to
      // the AI document-analysis path below.
      if (!isImage && !isPDF) {
        try {
          const count = await Integrations.importFile(file);
          if (count > 0) Components.showToast(`${file.name}: ${count}件のデータを取り込みました`, 'success');
        } catch(e) { /* fall through */ }
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rawDataUrl = ev.target.result;
        const compressed = isImage ? await Components.compressImage(rawDataUrl) : '';
        const photoId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        store.addHealthData('photos', {
          id: photoId,
          filename: file.name, type: file.type, size: file.size,
          dataUrl: compressed,
          category: isImage ? '写真' : 'ファイル'
        });

        const entryId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const textEntries = store.get('textEntries') || [];
        textEntries.push({
          id: entryId,
          timestamp: new Date().toISOString(),
          category: isImage ? '写真' : 'ファイル',
          type: 'file_upload',
          photoId: isImage ? photoId : '',
          previewImage: compressed,
          title: `📎 ${file.name}`,
          content: `${isImage ? '写真' : 'ファイル'}をアップロード（${(file.size/1024).toFixed(0)}KB）`
        });
        store.set('textEntries', textEntries);

        // Add to conversation history
        const history = store.get('conversationHistory') || [];
        history.push({ role: 'user', content: `[ファイル: ${file.name}]`, timestamp: new Date().toISOString(), type: 'file_upload' });
        store.set('conversationHistory', history);

        Components.showToast(`${file.name} を認識中...`, 'info');

        // Run API analysis. PDFs ride the same 2-pass classifier as
        // images via the Anthropic `document` content block so Claude
        // natively reads 検査結果 PDF・処方箋 PDF・診断書 PDF 等.
        // Send compressed (not raw) for images — otherwise iPhone
        // photos at 5-7MB exceed the vision block size limit.
        const attachOpts = isImage
          ? { imageBase64: compressed }
          : (isPDF ? { pdfBase64: ev.target.result } : {});
        const analyzeType = isImage ? 'image_analysis' : (isPDF ? 'document_analysis' : 'text_analysis');
        const result = await this.analyzeViaAPI(
          `[${isPDF ? 'PDF 文書' : isImage ? '写真' : 'ファイル'}: ${file.name}]`,
          analyzeType,
          attachOpts
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

    // Invalidate disease-dependent caches so the dashboard reflects the
    // new disease list immediately. Without this, users see stale
    // research/actions/feedback computed against the old diseases and
    // think the prompts aren't reading their settings.
    store.set('cachedResearch', null);
    store.set('cachedActions', null);
    store.set('latestFeedback', null);

    if (FirebaseBackend.initialized) {
      FirebaseBackend.saveProfile({ settings: { selectedDiseases: selected, selectedDisease: store.get('selectedDisease') } });
    }

    const countEl = document.getElementById('settings-disease-count');
    if (countEl) countEl.textContent = selected.length + '件選択';
    Components.showToast(`${selected.length}件の疾患を保存しました。関連情報を更新します。`, 'success');

    // Navigate back to dashboard so the user sees fresh content
    // (research + actions will auto-reload via afterRender).
    setTimeout(() => this.navigate('dashboard'), 600);
  }

  async saveProfile() {
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
      const ok = await FirebaseBackend.saveProfile({ userProfile: profile });
      if (!ok) return;
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
      privacy: { title: '個人情報保護方針（プライバシーポリシー）', content: `
<h3>個人情報保護方針</h3>
<p><strong>シェアーズ株式会社</strong>（以下「当社」）は、当社が運営する健康日記（以下「本サービス」）において取り扱う個人情報の保護の重要性を認識し、<strong>個人情報の保護に関する法律</strong>（個人情報保護法）および <strong>JIS Q 15001:2017</strong>（個人情報保護マネジメントシステム — 要求事項）を参考とし、以下の方針に従って個人情報を適切に取り扱います。</p>

<h4>1. 事業者情報</h4>
<p>事業者名: シェアーズ株式会社<br>
代表者: agewaller<br>
所在地: 日本国内<br>
連絡先: ${CONFIG.CONTACT_EMAIL}</p>

<h4>2. 個人情報保護管理責任者</h4>
<p>氏名（職名）: agewaller（代表者兼務）<br>
所属: シェアーズ株式会社<br>
連絡先: ${CONFIG.CONTACT_EMAIL}</p>

<h4>3. 取得する個人情報の項目</h4>
<p>本サービスは以下の項目を取得します:</p>
<p>
<strong>(1) 利用者が自ら入力する情報</strong><br>
・体調記録、症状、バイタル、服薬・サプリメント履歴<br>
・食事記録、睡眠記録、活動量<br>
・血液検査等の検査結果の入力・画像<br>
・医師との会話記録、カウンセリング記録（利用者が登録した場合）<br>
・写真（食事・薬・検査結果等、利用者が添付した場合）<br>
・プロフィール情報（年齢、性別、身長、体重、居住地、備考）<br><br>

<strong>(2) 認証に伴い自動的に取得する情報</strong><br>
・Google アカウント情報（メールアドレス、表示名、プロフィール画像 URL）<br>
・メール認証の場合はメールアドレスのみ<br><br>

<strong>(3) 連携機能により取得する情報</strong><br>
・Google カレンダーの予定（利用者が連携した場合）<br>
・Fitbit, Apple Health のアクティビティ・睡眠データ（利用者がインポートした場合）<br>
・Plaud 会話録音の文字起こし（利用者がメール連携した場合）<br><br>

<strong>(4) 利用ログ</strong><br>
・アクセス日時、使用機能、API 呼び出し量<br>
・ブラウザ情報（エラー診断のため）
</p>

<h4>4. 要配慮個人情報の取扱い</h4>
<p>本サービスで取り扱う<strong>健康情報・病歴情報・服薬履歴</strong>は、個人情報保護法第 2 条第 3 項に規定される「<strong>要配慮個人情報</strong>」に該当します。当社は以下を遵守します:</p>
<p>・取得は本人の明示的な同意に基づく（利用者自らの入力行為をもって同意とみなす）<br>
・第三者提供は本人の同意なく行わない（§7 参照）<br>
・利用目的の範囲内でのみ利用し、目的外利用は行わない<br>
・安全管理措置を特に厳格に適用する（§9 参照）</p>

<h4>5. 個人情報の利用目的</h4>
<p>当社は取得した個人情報を、以下の目的のためにのみ利用します:</p>
<p>(1) 本サービスの提供（記録の保存、AI による分析、ダッシュボード表示、リマインダー）<br>
(2) 利用者サポートへの対応<br>
(3) サービス改善のための統計的分析（個人を特定しない集計形式に限る）<br>
(4) 重要な通知（セキュリティインシデント、サービス変更等）<br>
(5) 法令に基づく対応</p>
<p>上記以外の目的での利用は、事前に本人の同意を得た場合に限ります。</p>

<h4>6. 個人情報の安全管理措置</h4>
<p><strong>組織的安全管理措置</strong>: 個人情報保護管理責任者を設置し、事故発生時の 72 時間以内通知体制を確立しています。</p>
<p><strong>人的安全管理措置</strong>: 個人情報を取り扱う担当者を限定し、守秘義務を課しています。</p>
<p><strong>物理的安全管理措置</strong>: データは物理媒体ではなく Google Cloud Firestore（東京リージョン）に保管し、運営者端末には端末ロック・暗号化ディスクを適用しています。</p>
<p><strong>技術的安全管理措置</strong>: 通信経路は TLS 1.2 以上で暗号化、保存データは AES-256 相当で暗号化。Firebase Authentication と Firestore Security Rules により、利用者本人以外は一切アクセスできない構造を採用しています。</p>

<h4>7. 個人情報の第三者提供</h4>
<p>当社は以下の場合を除き、本人の同意なく個人情報を第三者に提供しません:</p>
<p>・本人の明示的同意がある場合<br>
・法令に基づく開示要請がある場合<br>
・人の生命、身体または財産の保護のために必要がある場合</p>
<p><strong>健康データを販売したり、広告配信事業者や保険会社等に提供することは一切ありません。</strong></p>

<h4>8. 個人情報の取扱いの委託</h4>
<p>本サービスは、サービス提供のため以下の委託先（サブプロセッサ）を利用します。いずれも API 経由で送信されたデータをモデル学習に使用しないことを公式ポリシーで明示しています。</p>
<p>・<strong>Google Cloud (Firebase)</strong>: データ保存・認証・ホスティング（日本・東京リージョン）<br>
・<strong>Cloudflare</strong>: Edge Worker・メールルーティング<br>
・<strong>Anthropic</strong>: AI 分析（Claude API、米国）<br>
・<strong>OpenAI</strong>: AI 分析（GPT-4o API、米国）<br>
・<strong>Google</strong>: AI 分析（Gemini API、米国）</p>
<p>委託先の選定にあたっては、情報セキュリティに関する第三者認証（ISO/IEC 27001, SOC 2 等）を取得していることを条件としています。</p>

<h4>9. 外国にある第三者への提供</h4>
<p>§8 に記載の Anthropic、OpenAI、Google（Gemini）は<strong>米国</strong>を本拠とする事業者です。個人情報保護法第 28 条に基づき、以下を情報提供します:</p>
<p>・提供先の国名: アメリカ合衆国<br>
・当該国の個人情報保護制度: 連邦レベルの包括的な個人情報保護法はなく、カリフォルニア州消費者プライバシー法（CCPA）等の州法が存在<br>
・提供先が講ずる措置: 各社は SOC 2 Type II 認証を取得し、TLS 暗号化通信・データ学習除外・アクセス制御を実施</p>
<p>なお、利用者は本サービスの設定画面 → プライバシー設定の「<strong>AI 送信前の匿名化</strong>」をオンにすることで、個人を特定し得る情報を自動マスクしてから AI に送信することを選択できます。</p>

<h4>10. 本人の権利（開示・訂正・利用停止・削除）</h4>
<p>利用者（本人）は、自己の個人情報について以下の権利を行使できます:</p>
<p>(1) <strong>開示請求</strong>: 設定画面 → 「すべてのデータをエクスポート」ボタンにて、JSON 形式で一括取得できます。<br>
(2) <strong>訂正請求</strong>: 各記録画面の編集機能により、いつでも訂正できます。<br>
(3) <strong>利用停止請求</strong>: 設定画面のログアウトにより一時停止、完全退会により恒久停止できます。<br>
(4) <strong>削除請求</strong>: 各記録の削除、または「アカウントを完全削除（退会）」ボタンにより、クラウド上の全データと認証アカウントを即時削除できます。</p>
<p>上記の自動機能で対応できない請求がある場合は ${CONFIG.CONTACT_EMAIL} までご連絡ください。受領から 30 日以内に回答します。</p>

<h4>11. クッキー・ローカルストレージ・アクセスログ</h4>
<p>本サービスは以下を使用します:</p>
<p>・<strong>Cookie / localStorage</strong>: 認証状態の保持、表示言語の記憶、API キー（暗号化）の保持<br>
・<strong>アクセスログ</strong>: Google Cloud 標準機能により、IP アドレス・アクセス日時・操作内容が一定期間保持される</p>
<p>本サービスは第三者広告ネットワーク・トラッキング SDK・行動追跡ツール・解析ツール（Google Analytics 等）を<strong>一切使用しません</strong>。</p>

<h4>12. 苦情・相談窓口</h4>
<p>個人情報の取扱いに関する苦情・相談・お問い合わせは以下の窓口にてお受けします:</p>
<p>シェアーズ株式会社 個人情報保護担当<br>
メール: ${CONFIG.CONTACT_EMAIL}<br>
受付: 平日 9:00〜18:00（祝日・年末年始を除く）<br>
対応期限: 受領から 30 日以内に書面（電子メール）で回答</p>

<h4>13. 認定個人情報保護団体について</h4>
<p>当社は、本書作成時点において認定個人情報保護団体の対象事業者ではありません。プライバシーマーク取得申請を進めており、取得後は一般財団法人日本情報経済社会推進協会（JIPDEC）が指定する相談窓口をご案内します。</p>

<h4>14. 継続的改善と方針の変更</h4>
<p>本方針は、関連法令の改正、業務内容の変更、社会情勢の変化等に応じて随時見直し、改善します。重要な変更がある場合は、本サービス上で通知し、変更後の方針は本ページに掲載します。</p>

<h4>15. 関連文書</h4>
<p>本サービスの個人情報保護に関する詳細な取り組みは、以下の関連文書もご参照ください:</p>
<p>・「プライバシーと安全」ページ（本サービス内）<br>
・「3省2ガイドライン準拠宣言書」（<a href="https://github.com/agewaller/stock-screener/blob/main/docs/3省2GL準拠宣言.md" target="_blank" rel="noopener">GitHub で公開</a>）<br>
・セキュリティ脆弱性報告窓口: /.well-known/security.txt</p>

<h4>16. 制定日・改定履歴</h4>
<p>・2025 年 4 月 初版制定<br>
・2026 年 4 月 14 日 JIS Q 15001:2017 形式への全面改訂</p>

<p style="margin-top:20px;padding:12px;background:#f1f5f9;border-radius:6px;font-size:11px;line-height:1.7">
<strong>📌 ご不明な点がある場合</strong><br>
本方針の内容について分かりにくい点・ご不明な点がある場合は、遠慮なく ${CONFIG.CONTACT_EMAIL} までお問い合わせください。お寄せいただいたご意見は、今後の改訂に反映します。
</p>` },

      terms: { title: '利用規約', content: `
<h3>健康日記 利用規約</h3>

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
<p>健康日記は体調記録・情報整理ツールであり、<strong>医療機器プログラム（SaMD）には該当しません</strong>。本サービスは診断、治療、処方、または医学的助言を提供するものではありません。</p>

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
    // Must match the order of <div class="tab"> in render_admin.
    const tabNames = ['prompts', 'models', 'api', 'usage', 'users', 'priority', 'affiliate', 'professionals', 'firebase', 'data'];
    const idx = tabNames.indexOf(tabId);
    if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');

    // Load fields for specific tabs
    if (tabId === 'api') this.loadApiKeyFields();
    if (tabId === 'firebase') this.loadFirebaseConfigFields();
    if (tabId === 'usage') setTimeout(() => this.initUsageCharts(), 50);
    if (tabId === 'users') this.loadUsersDashboard();
    if (tabId === 'priority') setTimeout(() => this.loadPriorityMatrix(), 50);
    if (tabId === 'professionals') this.renderProfessionalsList();
  }

  // ---- API Usage Dashboard (admin) ----
  // Renders a complete usage breakdown from store.apiUsage records.
  // Shows: today / this month totals, per-model breakdown, daily
  // trend chart (last 30 days), and recent API calls.
  renderUsageDashboard() {
    const log = store.get('apiUsage') || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Aggregations
    const today = log.filter(e => e.ts.startsWith(todayStr));
    const month = log.filter(e => e.ts >= monthStart);

    const sumCost = arr => arr.reduce((s, e) => s + (e.costJpy || 0), 0);
    const sumIn = arr => arr.reduce((s, e) => s + (e.input || 0), 0);
    const sumOut = arr => arr.reduce((s, e) => s + (e.output || 0), 0);

    const todayCost = sumCost(today).toFixed(2);
    const monthCost = sumCost(month).toFixed(2);
    const todayCalls = today.length;
    const monthCalls = month.length;

    // Per-model breakdown for current month
    const byModel = {};
    month.forEach(e => {
      if (!byModel[e.model]) byModel[e.model] = { calls: 0, input: 0, output: 0, cost: 0 };
      byModel[e.model].calls++;
      byModel[e.model].input += (e.input || 0);
      byModel[e.model].output += (e.output || 0);
      byModel[e.model].cost += (e.costJpy || 0);
    });

    // Per-source breakdown (guest vs auth)
    const bySource = { guest: 0, auth: 0 };
    month.forEach(e => { bySource[e.source || 'auth'] = (bySource[e.source || 'auth'] || 0) + (e.costJpy || 0); });

    // Recent 10 calls
    const recent = log.slice(-10).reverse();

    if (log.length === 0) {
      return `
        <div class="card"><div class="card-body" style="padding:24px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px;opacity:0.4">📊</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:6px">使用量データがまだありません</div>
          <div style="font-size:12px;color:var(--text-muted)">ユーザーが分析を実行すると、ここに集計が表示されます。</div>
        </div></div>`;
    }

    const modelRows = Object.entries(byModel)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([m, s]) => `
        <tr>
          <td style="padding:8px 12px;font-family:'JetBrains Mono',monospace;font-size:11px">${Components.escapeHtml(m)}</td>
          <td style="padding:8px 12px;text-align:right;font-size:12px">${s.calls.toLocaleString()}</td>
          <td style="padding:8px 12px;text-align:right;font-size:12px">${(s.input / 1000).toFixed(1)}K</td>
          <td style="padding:8px 12px;text-align:right;font-size:12px">${(s.output / 1000).toFixed(1)}K</td>
          <td style="padding:8px 12px;text-align:right;font-size:12px;font-weight:600;color:var(--accent)">¥${s.cost.toFixed(2)}</td>
        </tr>`).join('');

    const recentRows = recent.map(e => {
      const t = new Date(e.ts);
      const time = `${(t.getMonth() + 1)}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
      return `
        <tr>
          <td style="padding:6px 10px;font-size:10px;color:var(--text-muted);font-family:monospace">${time}</td>
          <td style="padding:6px 10px;font-size:10px;font-family:monospace">${Components.escapeHtml(e.model)}</td>
          <td style="padding:6px 10px;font-size:10px;text-align:right">${(e.input || 0).toLocaleString()}</td>
          <td style="padding:6px 10px;font-size:10px;text-align:right">${(e.output || 0).toLocaleString()}</td>
          <td style="padding:6px 10px;font-size:10px;text-align:right;color:var(--accent)">¥${(e.costJpy || 0).toFixed(3)}</td>
          <td style="padding:6px 10px;font-size:9px;color:var(--text-muted)">${e.source || 'auth'}</td>
        </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:18px">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">📊 API 使用量ダッシュボード</h3>
        <p style="font-size:12px;color:var(--text-muted)">トークン消費量と推定コスト (1 USD = ¥${Store.USD_JPY})</p>
      </div>

      <!-- Top metric cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px">
        <div class="card"><div class="card-body" style="padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">今日のコスト</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent)">¥${todayCost}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${todayCalls} リクエスト</div>
        </div></div>
        <div class="card"><div class="card-body" style="padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">今月のコスト</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent)">¥${monthCost}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${monthCalls} リクエスト</div>
        </div></div>
        <div class="card"><div class="card-body" style="padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">入力トークン (今月)</div>
          <div style="font-size:20px;font-weight:700">${(sumIn(month) / 1000).toFixed(1)}K</div>
        </div></div>
        <div class="card"><div class="card-body" style="padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">出力トークン (今月)</div>
          <div style="font-size:20px;font-weight:700">${(sumOut(month) / 1000).toFixed(1)}K</div>
        </div></div>
      </div>

      <!-- Daily trend chart -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">過去 30 日の日次コスト推移</span></div>
        <div class="card-body" style="height:240px;padding:14px"><canvas id="usage-trend-chart"></canvas></div>
      </div>

      <!-- Per-model breakdown -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">モデル別内訳 (今月)</span></div>
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:var(--bg-tertiary)">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted)">モデル</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted)">回数</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted)">入力</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted)">出力</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted)">コスト</th>
            </tr></thead>
            <tbody>${modelRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Source breakdown -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">利用区分 (今月)</span></div>
        <div class="card-body" style="padding:14px;display:flex;gap:20px;flex-wrap:wrap">
          <div>
            <div style="font-size:11px;color:var(--text-muted)">ログイン後</div>
            <div style="font-size:18px;font-weight:700">¥${(bySource.auth || 0).toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">ゲスト (登録前)</div>
            <div style="font-size:18px;font-weight:700">¥${(bySource.guest || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <!-- Recent calls -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-title">最近の 10 件</span>
          <button class="btn btn-outline btn-sm" style="font-size:10px" onclick="app.confirmAction(this,'ログをクリア',()=>{store.set('apiUsage',[]);app.navigate('admin');setTimeout(()=>app.switchAdminTab('usage'),50)})">ログをクリア</button>
        </div>
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--bg-tertiary)">
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">時刻</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">モデル</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--text-muted)">入力</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--text-muted)">出力</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:600;color:var(--text-muted)">コスト</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">区分</th>
            </tr></thead>
            <tbody>${recentRows}</tbody>
          </table>
        </div>
      </div>

      <div style="font-size:11px;color:var(--text-muted);padding:8px 0">
        ※ コストは Anthropic / OpenAI / Google の公開単価から算出した推定値です。実際の請求とは多少のズレがあります。
      </div>`;
  }

  // Render the 30-day trend chart for usage dashboard.
  initUsageCharts() {
    if (typeof Chart === 'undefined') return;
    const log = store.get('apiUsage') || [];
    if (log.length === 0) return;

    // Build last 30 days bucket
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toISOString().split('T')[0],
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        cost: 0
      });
    }
    const byDay = new Map(days.map(d => [d.key, d]));
    log.forEach(e => {
      const dayKey = (e.ts || '').split('T')[0];
      const bucket = byDay.get(dayKey);
      if (bucket) bucket.cost += (e.costJpy || 0);
    });

    const canvas = document.getElementById('usage-trend-chart');
    if (!canvas) return;
    if (this.chartInstances.usageTrend) { try { this.chartInstances.usageTrend.destroy(); } catch (_) {} }
    this.chartInstances.usageTrend = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: days.map(d => d.label),
        datasets: [{
          label: '日次コスト (円)',
          data: days.map(d => d.cost.toFixed(2)),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: '#6366f1',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8896b0', font: { size: 10 } } },
          y: {
            beginAtZero: true,
            ticks: { color: '#8896b0', font: { size: 10 }, callback: v => '¥' + v }
          }
        }
      }
    });
  }

  // ---- User Management Dashboard (admin) ----
  // Lists all registered users with their email / displayName /
  // lastSeenAt. Per-user "詳細" expansion lazy-fetches subcollection
  // counts so the operator can see what each user has been doing.
  //
  // Requires:
  //   - firestore.rules grants admin (agewaller@gmail.com) read on
  //     /users/{*} and /users/{*}/{**}/{*}.
  //   - FirebaseBackend.touchUserMetadata writes email/lastSeenAt to
  //     each users/{uid} document on every sign-in.
  // ---- Business Priority Matrix (admin) ----
  // Renders a 2D plot of CARES diseases where the X axis is world
  // patient count (log scale, volume → SEO/marketing reach) and the
  // Y axis is management density (low/medium/high, LTV / retention
  // potential). The four quadrants correspond to the strategic
  // tiers described in docs/世界患者数一覧.md §事業戦略:
  //   Q-TL (low volume, high density):  Tier A — ME/CFS, Long COVID, FM
  //   Q-TR (high volume, high density): Tier A+ / massive impact
  //   Q-BL (low volume, low density):   Tier D — niche, low priority
  //   Q-BR (high volume, low density):  Tier C — mass SEO play
  loadPriorityMatrix() {
    const container = document.getElementById('priority-matrix-container');
    if (!container) return;
    if (!this.isAdmin || !this.isAdmin()) {
      container.innerHTML = `<div class="card"><div class="card-body" style="padding:20px;text-align:center;color:var(--text-muted)">管理者権限が必要です</div></div>`;
      return;
    }
    const epi = CONFIG.DISEASE_EPIDEMIOLOGY || {};

    // Collect only diseases that have a numeric world patient count
    // (we can't plot NULL tier-0 entries on a log axis). Fall back to
    // Japan count for diseases where world is null but Japan isn't.
    const diseaseNameById = {};
    CONFIG.DISEASE_CATEGORIES.forEach(cat => {
      cat.diseases.forEach(d => { diseaseNameById[d.id] = d.name; });
    });

    const densityToY = { low: 1, medium: 2, high: 3 };
    const tierColor = {
      1: { bg: 'rgba(16,185,129,0.45)',  border: '#059669' },  // tier 1 = green
      2: { bg: 'rgba(99,102,241,0.45)',  border: '#4f46e5' },  // tier 2 = indigo
      3: { bg: 'rgba(245,158,11,0.45)',  border: '#d97706' },  // tier 3 = amber
      0: { bg: 'rgba(148,163,184,0.35)', border: '#64748b' }   // tier 0 = slate
    };
    const points = [];
    Object.entries(epi).forEach(([id, data]) => {
      const world = data.world;
      const japan = data.japan;
      // Require SOME numeric scale to plot. Prefer world, fall back to
      // japan × 50 as a rough substitute so domestic-only entries show
      // up somewhere on the chart.
      const xRaw = world || (japan ? japan * 50 : null);
      if (!xRaw) return;
      const y = densityToY[data.density] || 2;
      const color = tierColor[data.tier || 0] || tierColor[0];
      points.push({
        x: xRaw,
        y,
        r: world ? Math.min(18, Math.max(6, Math.log10(world) - 4)) : 6,
        label: diseaseNameById[id] || id,
        id,
        tier: data.tier,
        density: data.density,
        worldLabel: data.label,
        japanLabel: data.japanLabel || '',
        bgColor: color.bg,
        borderColor: color.border
      });
    });

    // Sort the strategic-tier list for the table beneath the chart.
    const tiers = { A: [], B: [], C: [], D: [] };
    points.forEach(p => {
      const isVolume = p.x >= 100_000_000;   // ≥1 億人 = volume
      const isDeep   = p.density === 'high';
      if (isDeep && !isVolume) tiers.A.push(p);
      else if (isDeep && isVolume) tiers.B.push(p);
      else if (isVolume && !isDeep) tiers.C.push(p);
      else tiers.D.push(p);
    });

    const tierBox = (label, color, desc, items) => `
      <div style="padding:14px 16px;background:${color};border-radius:10px;margin-bottom:10px">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">${label}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">${desc}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${items.length === 0
            ? '<span style="font-size:11px;color:var(--text-muted)">該当なし</span>'
            : items.slice(0, 20).map(p => `<span title="${Components.escapeHtml('世界: '+(p.worldLabel||'')+(p.japanLabel?' ／ 国内: '+p.japanLabel:''))}" style="padding:3px 10px;background:#fff;border:1px solid var(--border);border-radius:14px;font-size:11px">${Components.escapeHtml(p.label)}</span>`).join('')
          }
        </div>
      </div>`;

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">散布図: 患者数 × 管理密度</span></div>
        <div class="card-body" style="padding:14px;height:460px;position:relative">
          <canvas id="priority-matrix-chart"></canvas>
        </div>
        <div style="padding:0 16px 14px;font-size:10px;color:var(--text-muted);line-height:1.7">
          横軸: 世界患者数 (対数スケール) ・ 縦軸: 管理密度 (low=1 / medium=2 / high=3) ・
          バブルサイズ: 相対的な患者数規模 ・
          色: <span style="color:#059669">■ Tier 1 固い数字</span>
              <span style="color:#4f46e5">■ Tier 2 数千万規模</span>
              <span style="color:#d97706">■ Tier 3 粗推計</span>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">戦略的分類 (ボリューム × 管理密度)</span></div>
        <div class="card-body" style="padding:14px">
          ${tierBox('🎯 Tier A (最優先: 深エンゲージ中心)', '#fef3c7',
            '管理密度 高 × 世界患者数 < 1 億人。1 人あたり LTV 高、ニッチ専門性で差別化。', tiers.A)}
          ${tierBox('💫 Tier B (高優先: スケール + エンゲージ)', '#dbeafe',
            '管理密度 高 × 世界患者数 ≥ 1 億人。到達数も LTV も大きい最有力ゾーン。', tiers.B)}
          ${tierBox('📢 Tier C (ボリュームで稼ぐ)', '#f0fdf4',
            '管理密度 中-低 × 世界患者数 ≥ 1 億人。SEO 流入・マス認知で使う。', tiers.C)}
          ${tierBox('🗂 Tier D (副次)', '#f8fafc',
            '管理密度 中-低 × 世界患者数 < 1 億人。併発記録として価値。', tiers.D)}
        </div>
      </div>

      <div style="font-size:11px;color:var(--text-muted);padding:0 4px;line-height:1.7">
        ※ 散布図は numeric な世界患者数がある疾患のみプロット。POTS / MCAS / EDS など
        「世界推計策定中」の tier 0 疾患は表示対象外です。詳細は
        <a href="https://github.com/agewaller/stock-screener/blob/main/docs/世界患者数一覧.md" target="_blank" rel="noopener" style="color:#6366f1">docs/世界患者数一覧.md</a>
        を参照してください。
      </div>
    `;

    // Initialize Chart.js scatter. Chart.js is already loaded in
    // <head> so no external dependency needed.
    setTimeout(() => {
      if (typeof Chart === 'undefined') return;
      const canvas = document.getElementById('priority-matrix-chart');
      if (!canvas) return;
      if (this.chartInstances?.priorityMatrix) {
        try { this.chartInstances.priorityMatrix.destroy(); } catch(_) {}
      }
      this.chartInstances = this.chartInstances || {};
      this.chartInstances.priorityMatrix = new Chart(canvas, {
        type: 'bubble',
        data: {
          datasets: [{
            label: '疾患',
            data: points.map(p => ({ x: p.x, y: p.y, r: p.r, _label: p.label, _worldLabel: p.worldLabel, _japanLabel: p.japanLabel })),
            backgroundColor: points.map(p => p.bgColor),
            borderColor: points.map(p => p.borderColor),
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const d = ctx.raw;
                  const densityLabel = { 1: 'low', 2: 'medium', 3: 'high' }[d.y] || '';
                  return [
                    d._label,
                    '世界: ' + d._worldLabel,
                    d._japanLabel ? '国内: ' + d._japanLabel : '',
                    '管理密度: ' + densityLabel
                  ].filter(Boolean);
                }
              }
            }
          },
          scales: {
            x: {
              type: 'logarithmic',
              title: { display: true, text: '世界患者数 (対数スケール)', color: '#64748b', font: { size: 11 } },
              ticks: {
                color: '#8896b0',
                font: { size: 10 },
                callback: (v) => {
                  if (v >= 1e9) return (v/1e9).toFixed(0) + '億';
                  if (v >= 1e8) return (v/1e8).toFixed(0) + '億';
                  if (v >= 1e6) return (v/1e6).toFixed(0) + '百万';
                  if (v >= 1e4) return (v/1e4).toFixed(0) + '万';
                  return v;
                }
              }
            },
            y: {
              min: 0.5,
              max: 3.5,
              title: { display: true, text: '管理密度 (LTV ポテンシャル)', color: '#64748b', font: { size: 11 } },
              ticks: {
                stepSize: 1,
                color: '#8896b0',
                font: { size: 10 },
                callback: (v) => ({ 1: 'low', 2: 'medium', 3: 'high' }[v] || '')
              }
            }
          }
        }
      });
    }, 0);
  }

  async loadUsersDashboard() {
    const container = document.getElementById('users-dashboard-content');
    if (!container) return;
    if (!this.isAdmin || !this.isAdmin()) {
      container.innerHTML = `<div class="card"><div class="card-body" style="padding:20px;text-align:center;color:var(--text-muted)">管理者権限が必要です</div></div>`;
      return;
    }
    if (!FirebaseBackend.initialized || !firebase?.firestore) {
      container.innerHTML = `<div class="card"><div class="card-body" style="padding:20px;text-align:center;color:var(--text-muted)">Firebase が未接続です。Firebase タブから設定してください。</div></div>`;
      return;
    }
    container.innerHTML = `<div class="card"><div class="card-body" style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">読み込み中…</div></div>`;
    try {
      // Pull all user docs. The collection scan reads N documents
      // (1 per user) which scales linearly — fine for hundreds of
      // users, would need pagination for tens of thousands.
      const snap = await firebase.firestore().collection('users').get();
      const users = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        const toMs = (v) => {
          if (!v) return 0;
          if (typeof v.toMillis === 'function') return v.toMillis();
          if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? 0 : t; }
          if (typeof v === 'number') return v;
          return 0;
        };
        users.push({
          uid: doc.id,
          email: d.email || '',
          displayName: d.displayName || '',
          photoURL: d.photoURL || '',
          firstSeenAt: toMs(d.firstSeenAt),
          lastSeenAt: toMs(d.lastSeenAt),
          selectedDiseases: Array.isArray(d.settings?.selectedDiseases) ? d.settings.selectedDiseases : (d.settings?.selectedDisease ? [d.settings.selectedDisease] : []),
          language: d.userProfile?.language || ''
        });
      });
      // Sort by most-recent activity first
      users.sort((a, b) => b.lastSeenAt - a.lastSeenAt);

      const now = Date.now();
      const day = 86400000;
      const totalUsers = users.length;
      const activeLast24h = users.filter(u => u.lastSeenAt > now - day).length;
      const activeLast7  = users.filter(u => u.lastSeenAt > now - 7 * day).length;
      const activeLast30 = users.filter(u => u.lastSeenAt > now - 30 * day).length;
      const newLast30    = users.filter(u => u.firstSeenAt > now - 30 * day).length;

      const fmtDate = (ms) => {
        if (!ms) return '—';
        const d = new Date(ms);
        const Y = d.getFullYear(), M = String(d.getMonth() + 1).padStart(2, '0'), D = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0');
        return `${Y}/${M}/${D} ${h}:${m}`;
      };
      const fmtRelative = (ms) => {
        if (!ms) return '—';
        const diff = now - ms;
        if (diff < 60_000) return 'たった今';
        if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分前`;
        if (diff < day) return `${Math.floor(diff / 3600_000)} 時間前`;
        if (diff < 30 * day) return `${Math.floor(diff / day)} 日前`;
        if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} ヶ月前`;
        return `${Math.floor(diff / (365 * day))} 年前`;
      };

      // Disease id → name lookup
      const diseaseNames = { '_universal': '共通' };
      CONFIG.DISEASE_CATEGORIES.forEach(cat => cat.diseases.forEach(d => { diseaseNames[d.id] = d.name; }));
      const diseaseLabel = (ids) => {
        if (!ids || !ids.length) return '<span style="color:var(--text-muted)">未設定</span>';
        return ids.slice(0, 3).map(id => `<span class="tag tag-accent" style="font-size:9px">${Components.escapeHtml(diseaseNames[id] || id)}</span>`).join(' ') + (ids.length > 3 ? ` <span style="font-size:10px;color:var(--text-muted)">+${ids.length - 3}</span>` : '');
      };

      const userRows = users.length === 0
        ? `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">登録ユーザーがまだいません。</td></tr>`
        : users.map((u, idx) => {
            const safeUid = Components.escapeHtml(u.uid);
            const initial = (u.displayName || u.email || '?')[0].toUpperCase();
            const photo = u.photoURL
              ? `<img src="${Components.escapeHtml(u.photoURL)}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover">`
              : `<div style="width:28px;height:28px;border-radius:50%;background:var(--accent-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600">${Components.escapeHtml(initial)}</div>`;
            return `
              <tr style="border-top:1px solid var(--border)" data-user-row="${safeUid}">
                <td style="padding:10px 12px;font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${idx + 1}</td>
                <td style="padding:10px 12px">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0">
                    ${photo}
                    <div style="min-width:0">
                      <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">${Components.escapeHtml(u.displayName || u.email || '(no name)')}</div>
                      <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">${Components.escapeHtml(u.email || u.uid)}</div>
                    </div>
                  </div>
                </td>
                <td style="padding:10px 12px">${diseaseLabel(u.selectedDiseases)}</td>
                <td style="padding:10px 12px;font-size:11px;color:var(--text-muted);white-space:nowrap" title="${fmtDate(u.firstSeenAt)}">${fmtRelative(u.firstSeenAt)}</td>
                <td style="padding:10px 12px;font-size:11px;white-space:nowrap" title="${fmtDate(u.lastSeenAt)}">
                  <span style="color:${u.lastSeenAt > now - 7 * day ? 'var(--success,#16a34a)' : 'var(--text-muted)'}">${fmtRelative(u.lastSeenAt)}</span>
                </td>
                <td style="padding:10px 12px;text-align:right;white-space:nowrap">
                  <button class="btn btn-outline btn-sm" style="font-size:10px;padding:4px 10px" onclick="app.loadUserActivity('${safeUid}')">詳細</button>
                </td>
              </tr>
              <tr id="user-activity-${safeUid}" style="display:none;border-top:1px dashed var(--border)">
                <td colspan="6" style="padding:14px 18px;background:var(--bg-tertiary)">
                  <div style="font-size:12px;color:var(--text-muted)">読み込み中…</div>
                </td>
              </tr>
            `;
          }).join('');

      container.innerHTML = `
        <!-- Summary cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px">
          <div class="card"><div class="card-body" style="padding:14px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">登録ユーザー総数</div>
            <div style="font-size:26px;font-weight:700;color:var(--accent)">${totalUsers.toLocaleString()}</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:14px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">過去 24 時間</div>
            <div style="font-size:22px;font-weight:700">${activeLast24h.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">アクティブ</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:14px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">過去 7 日</div>
            <div style="font-size:22px;font-weight:700">${activeLast7.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">アクティブ</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:14px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">過去 30 日</div>
            <div style="font-size:22px;font-weight:700">${activeLast30.toLocaleString()}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">アクティブ</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:14px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">新規 (30 日)</div>
            <div style="font-size:22px;font-weight:700;color:var(--success,#16a34a)">+${newLast30.toLocaleString()}</div>
          </div></div>
        </div>

        <!-- User list -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">ユーザー一覧（${totalUsers}）</span>
            <button class="btn btn-outline btn-sm" style="font-size:10px" onclick="app.loadUsersDashboard()">🔄 再読込</button>
          </div>
          <div class="card-body" style="padding:0;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:var(--bg-tertiary)">
                <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">#</th>
                <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">ユーザー</th>
                <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">疾患</th>
                <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">登録日</th>
                <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:var(--text-muted)">最終アクセス</th>
                <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:600;color:var(--text-muted)">アクション</th>
              </tr></thead>
              <tbody>${userRows}</tbody>
            </table>
          </div>
        </div>

        <div style="font-size:11px;color:var(--text-muted);padding:12px 4px 0;line-height:1.6">
          ※ メタデータ (email / displayName / lastSeenAt) は、各ユーザーがログインした時点で <code>users/{uid}</code> に書き込まれます。古いユーザーがまだ一度も再ログインしていない場合、表示されない可能性があります。<br>
          ※ 「詳細」をクリックすると、そのユーザーの記録件数 (テキスト・症状・バイタル・食事・写真など) を読み込みます。
        </div>
      `;
    } catch (err) {
      console.error('[loadUsersDashboard]', err);
      if (err?.code === 'permission-denied') {
        container.innerHTML = this._renderFirestoreRulesHelp();
        this._wireFirestoreRulesHelp();
      } else {
        const msg = `読み込みエラー: ${err.message || err}`;
        container.innerHTML = `<div class="card"><div class="card-body" style="padding:20px;color:var(--danger,#dc2626);font-size:13px">${Components.escapeHtml(msg)}</div></div>`;
      }
    }
  }

  // Render an actionable error card when Firestore rules are out of
  // date. Shows a copy-to-clipboard button + a direct link to the
  // Firebase Console rules editor so the admin can paste-and-publish
  // in ~30 seconds without leaving the phone.
  _renderFirestoreRulesHelp() {
    const consoleUrl = 'https://console.firebase.google.com/project/care-14c31/firestore/rules';
    return `
      <div class="card" style="border:1px solid var(--danger,#dc2626)">
        <div class="card-header">
          <span class="card-title" style="color:var(--danger,#dc2626)">⚠️ Firestore ルールの更新が必要です</span>
        </div>
        <div class="card-body" style="font-size:13px;line-height:1.7">
          <p style="margin:0 0 12px">
            ユーザー一覧を取得できません。<br>
            最新の <code>firestore.rules</code> がまだ Firebase に反映されていないためです。
          </p>

          <!-- Auto deploy via OAuth (recommended) -->
          <div style="background:linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%);padding:14px;border-radius:8px;margin:12px 0;border:1px solid #c4b5fd">
            <div style="font-weight:600;margin-bottom:6px;color:#5b21b6">🚀 自動デプロイ（推奨・1 タップ）</div>
            <div style="font-size:12px;color:#4c1d95;margin-bottom:10px;line-height:1.6">
              Google で再認証して、ブラウザから直接 Firebase にルールを反映します。<br>
              （プロジェクト所有者の Google アカウントが必要です）
            </div>
            <button id="btn-auto-deploy-rules" class="btn btn-primary btn-sm" style="font-size:13px;background:#7c3aed;border-color:#7c3aed">
              🚀 Google で認証してデプロイ
            </button>
          </div>

          <!-- Manual fallback -->
          <details style="margin:12px 0">
            <summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--text-muted)">📋 手動デプロイ（自動が使えない場合）</summary>
            <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin:8px 0">
              <ol style="margin:0;padding-left:20px;font-size:12px">
                <li style="margin-bottom:6px">下の「<strong>ルールをコピー</strong>」を押す</li>
                <li style="margin-bottom:6px">「<strong>Firebase Console を開く</strong>」を押す（新しいタブ）</li>
                <li style="margin-bottom:6px">エディタの中身を全選択 → 削除 → 貼り付け</li>
                <li>右上の「<strong>公開</strong>」ボタンを押す</li>
              </ol>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
              <button id="btn-copy-fs-rules" class="btn btn-outline btn-sm" style="font-size:12px">
                📋 ルールをコピー
              </button>
              <a href="${consoleUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="font-size:12px;text-decoration:none">
                🔗 Firebase Console を開く
              </a>
            </div>
          </details>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
            <button class="btn btn-outline btn-sm" style="font-size:13px" onclick="app.loadUsersDashboard()">
              🔄 再読込
            </button>
          </div>

          <details style="margin-top:12px">
            <summary style="cursor:pointer;font-size:12px;color:var(--text-muted)">ルールのプレビューを表示</summary>
            <pre id="fs-rules-preview" style="margin:8px 0 0;padding:12px;background:var(--bg-tertiary);border-radius:6px;font-size:11px;overflow-x:auto;white-space:pre-wrap;max-height:300px;overflow-y:auto">読み込み中…</pre>
          </details>
          <div id="fs-rules-status" style="margin-top:8px;font-size:12px;color:var(--text-muted);min-height:18px"></div>
        </div>
      </div>
    `;
  }

  async _wireFirestoreRulesHelp() {
    const status = document.getElementById('fs-rules-status');
    const preview = document.getElementById('fs-rules-preview');
    const copyBtn = document.getElementById('btn-copy-fs-rules');
    const autoBtn = document.getElementById('btn-auto-deploy-rules');
    let rulesText = '';
    try {
      const res = await fetch('firestore.rules?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      rulesText = await res.text();
      if (preview) preview.textContent = rulesText;
    } catch (e) {
      const rawUrl = 'https://raw.githubusercontent.com/agewaller/stock-screener/main/firestore.rules';
      if (preview) {
        preview.innerHTML = '取得失敗: ' + Components.escapeHtml(e.message || String(e))
          + '<br><br>こちらから手動でコピーしてください: <a href="' + rawUrl + '" target="_blank" rel="noopener">' + rawUrl + '</a>';
      }
      if (status) status.textContent = 'ルールファイルの取得に失敗しました。上のリンクから手動でコピーしてください。';
      if (copyBtn) copyBtn.disabled = true;
      if (autoBtn) autoBtn.disabled = true;
      return;
    }
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(rulesText);
          if (status) {
            status.style.color = 'var(--success,#16a34a)';
            status.textContent = '✓ コピー完了。Firebase Console を開いて貼り付けてください。';
          }
        } catch (e) {
          if (status) {
            status.style.color = 'var(--danger,#dc2626)';
            status.textContent = 'コピーに失敗しました: ' + (e.message || e) + '（プレビューから手動でコピーしてください）';
          }
        }
      };
    }
    if (autoBtn) {
      autoBtn.onclick = () => this._autoDeployFirestoreRules(rulesText);
    }
  }

  // OAuth-flow deploy: re-authenticate the admin with an extra Google
  // scope (https://www.googleapis.com/auth/firebase) to get an access
  // token that can call the Firebase Rules REST API directly from the
  // browser. No service account, no GitHub secret, no firebase-tools
  // — works entirely from the phone.
  async _autoDeployFirestoreRules(rulesText) {
    const status = document.getElementById('fs-rules-status');
    const btn = document.getElementById('btn-auto-deploy-rules');
    const setStatus = (color, msg) => {
      if (status) {
        status.style.color = color;
        status.innerHTML = msg;
      }
    };
    if (!rulesText) {
      setStatus('var(--danger,#dc2626)', 'ルールが取得できていません。ページを再読込してください。');
      return;
    }
    if (!window.firebase || !FirebaseBackend?.auth) {
      setStatus('var(--danger,#dc2626)', 'Firebase が初期化されていません。');
      return;
    }
    const origLabel = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ 認証中…'; }
    try {
      // Step 1: get OAuth access token with firebase scope
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/firebase');
      provider.setCustomParameters({ prompt: 'consent', include_granted_scopes: 'true' });
      const extractToken = (res) => {
        try {
          const cred = firebase.auth.GoogleAuthProvider.credentialFromResult(res);
          if (cred?.accessToken) return cred.accessToken;
        } catch (_) {}
        return res?._tokenResponse?.oauthAccessToken || res?.credential?.accessToken || null;
      };
      const currentUser = FirebaseBackend.auth.currentUser;
      if (!currentUser) {
        throw new Error('ログイン情報が取得できません。一度ログアウトして Google で再ログインしてください。');
      }
      const hasGoogle = Array.isArray(currentUser.providerData)
        && currentUser.providerData.some(p => p.providerId === 'google.com');
      let accessToken = null;
      try {
        const r = hasGoogle
          ? await currentUser.reauthenticateWithPopup(provider)
          : await currentUser.linkWithPopup(provider);
        accessToken = extractToken(r);
      } catch (e) {
        if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-blocked') throw e;
        throw new Error('Google 認証に失敗しました: ' + (e?.message || e?.code || String(e)));
      }
      if (!accessToken) throw new Error('Google からアクセストークンを取得できませんでした。Google アカウントで再ログインしてからお試しください。');

      // Step 2: create a new ruleset
      if (btn) btn.innerHTML = '⏳ ルールをアップロード中…';
      const projectId = firebase.app?.()?.options?.projectId || 'care-14c31';
      const rulesetRes = await fetch(
        `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: { files: [{ name: 'firestore.rules', content: rulesText }] }
          })
        }
      );
      if (!rulesetRes.ok) {
        const txt = await rulesetRes.text();
        throw new Error('ルール作成失敗 (HTTP ' + rulesetRes.status + '): ' + txt.slice(0, 500));
      }
      const ruleset = await rulesetRes.json();
      if (!ruleset?.name) throw new Error('ルール作成のレスポンスが不正: ' + JSON.stringify(ruleset).slice(0, 300));

      // Step 3: point the cloud.firestore release at the new ruleset.
      // Firebase Rules API's PATCH endpoint is documented inconsistently
      // across Google sources. firebase-tools uses unwrapped body +
      // updateMask=rulesetName; the public REST docs say wrapped body
      // + updateMask=release.rulesetName. Some accounts accept only
      // one. We try each variant in sequence and fall through on 400.
      // The DELETE-then-CREATE path is the ultimate fallback (always
      // works because there's no PATCH involved).
      if (btn) btn.innerHTML = '⏳ 公開中…';
      const baseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
      const releaseFullName = `projects/${projectId}/releases/cloud.firestore`;
      const variants = [
        {
          label: 'unwrapped + mask=rulesetName',
          url: baseUrl + '?updateMask=rulesetName',
          method: 'PATCH',
          body: { name: releaseFullName, rulesetName: ruleset.name }
        },
        {
          label: 'wrapped + mask=release.rulesetName',
          url: baseUrl + '?updateMask=release.rulesetName',
          method: 'PATCH',
          body: { release: { name: releaseFullName, rulesetName: ruleset.name } }
        },
        {
          label: 'unwrapped, no mask',
          url: baseUrl,
          method: 'PATCH',
          body: { name: releaseFullName, rulesetName: ruleset.name }
        },
        {
          label: 'wrapped, mask in body',
          url: baseUrl,
          method: 'PATCH',
          body: {
            release: { name: releaseFullName, rulesetName: ruleset.name },
            updateMask: 'rulesetName'
          }
        }
      ];
      let releaseOk = false;
      let lastErr = '';
      for (const v of variants) {
        try {
          const r = await fetch(v.url, {
            method: v.method,
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(v.body)
          });
          if (r.ok) {
            console.log('[autoDeployRules] variant succeeded:', v.label);
            releaseOk = true;
            break;
          }
          const t = await r.text();
          lastErr = 'HTTP ' + r.status + ' [' + v.label + ']: ' + t.slice(0, 400);
          console.warn('[autoDeployRules] variant failed:', v.label, r.status, t.slice(0, 200));
        } catch (e) {
          lastErr = 'network [' + v.label + ']: ' + (e.message || String(e));
          console.warn('[autoDeployRules] variant network error:', v.label, e);
        }
      }
      // Last resort: DELETE the release, then POST a new one.
      if (!releaseOk) {
        console.log('[autoDeployRules] all PATCH variants failed; trying DELETE + POST');
        try {
          await fetch(baseUrl, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + accessToken }
          });
          const createR = await fetch(
            `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name: releaseFullName, rulesetName: ruleset.name })
            }
          );
          if (createR.ok) {
            releaseOk = true;
            console.log('[autoDeployRules] DELETE + POST succeeded');
          } else {
            const t = await createR.text();
            lastErr = 'DELETE/POST HTTP ' + createR.status + ': ' + t.slice(0, 400);
          }
        } catch (e) {
          lastErr += ' | DELETE/POST error: ' + (e.message || String(e));
        }
      }
      if (!releaseOk) {
        throw new Error('公開失敗 (全方式試行): ' + lastErr);
      }
      setStatus('var(--success,#16a34a)', '✓ デプロイ成功。3 秒後に再読込します…');
      Components.showToast?.('Firestore ルールを公開しました', 'success');
      setTimeout(() => this.loadUsersDashboard(), 3000);
    } catch (err) {
      console.error('[autoDeployRules]', err);
      let msg = err?.message || String(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        msg = 'キャンセルされました';
      } else if (err?.code === 'auth/popup-blocked') {
        msg = 'ポップアップがブロックされました。ブラウザ設定でこのサイトのポップアップを許可してください。';
      } else if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
        msg = '権限不足: このアカウントは Firebase プロジェクトのオーナー / 編集者ではありません。<br>'
            + '<code>care-14c31</code> プロジェクトの所有者アカウントで再ログインしてください。';
      } else if (msg.includes('SERVICE_DISABLED') || msg.includes('has not been used')) {
        msg = 'Firebase Rules API が有効化されていません。<br>'
            + '<a href="https://console.developers.google.com/apis/api/firebaserules.googleapis.com/overview?project=care-14c31" target="_blank" rel="noopener">こちらから API を有効化</a>してから再度お試しください。';
      }
      setStatus('var(--danger,#dc2626)', '✗ ' + msg);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = origLabel; }
    }
  }

  // Lazy-fetch subcollection counts for one user. The same row is
  // toggled open/closed on repeated clicks so the operator can drill
  // into multiple users without re-loading.
  async loadUserActivity(uid) {
    if (!uid) return;
    const row = document.getElementById('user-activity-' + uid);
    if (!row) return;
    if (row.style.display !== 'none') {
      row.style.display = 'none';
      return;
    }
    row.style.display = '';
    const cell = row.querySelector('td');
    if (!cell) return;
    cell.innerHTML = `<div style="font-size:12px;color:var(--text-muted)">読み込み中…</div>`;
    try {
      const ref = firebase.firestore().collection('users').doc(uid);
      // Subcollections we know about. Each one is fetched with a
      // limit so a single super-active user can't blow up the read
      // bill. Anything at the cap is shown as "500+".
      const subs = [
        { key: 'textEntries',     label: 'テキスト記録' },
        { key: 'symptoms',        label: '症状' },
        { key: 'vitals',          label: 'バイタル' },
        { key: 'sleep',           label: '睡眠' },
        { key: 'medications',     label: '薬' },
        { key: 'supplements',     label: 'サプリ' },
        { key: 'meals',           label: '食事' },
        { key: 'bloodTests',      label: '血液検査' },
        { key: 'photos',          label: '写真' },
        { key: 'plaudAnalyses',   label: '禅トラック' },
        { key: 'conversations',   label: 'AIチャット' },
        { key: 'analysisHistory', label: '分析履歴' }
      ];
      const CAP = 500;
      const results = await Promise.all(subs.map(async (s) => {
        try {
          const snap = await ref.collection(s.key).limit(CAP).get();
          let latest = 0;
          snap.forEach(d => {
            const created = d.data()?.createdAt;
            const ms = created?.toMillis?.() || (typeof created === 'string' ? Date.parse(created) : 0);
            if (ms && ms > latest) latest = ms;
          });
          return { ...s, count: snap.size, capped: snap.size >= CAP, latest };
        } catch (e) {
          return { ...s, count: -1, error: e.code || e.message };
        }
      }));
      const totalRecords = results.reduce((sum, r) => sum + (r.count > 0 ? r.count : 0), 0);
      const fmtRel = (ms) => {
        if (!ms) return '—';
        const diff = Date.now() - ms;
        const day = 86400000;
        if (diff < 60_000) return 'たった今';
        if (diff < 3600_000) return Math.floor(diff / 60_000) + ' 分前';
        if (diff < day) return Math.floor(diff / 3600_000) + ' 時間前';
        if (diff < 30 * day) return Math.floor(diff / day) + ' 日前';
        return Math.floor(diff / (30 * day)) + ' ヶ月前';
      };
      const cards = results.map(r => {
        if (r.count < 0) {
          return `<div style="padding:8px 12px;background:#fff;border:1px solid var(--border);border-radius:6px;font-size:11px;color:var(--text-muted)">
            <div style="font-weight:600;margin-bottom:2px">${Components.escapeHtml(r.label)}</div>
            <div style="font-size:10px">取得失敗 (${Components.escapeHtml(r.error || '')})</div>
          </div>`;
        }
        const empty = r.count === 0;
        return `<div style="padding:8px 12px;background:#fff;border:1px solid var(--border);border-radius:6px;min-width:120px">
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">${Components.escapeHtml(r.label)}</div>
          <div style="font-size:18px;font-weight:700;color:${empty ? 'var(--text-muted)' : 'var(--accent)'}">${r.capped ? CAP + '+' : r.count}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${empty ? '—' : '最終: ' + fmtRel(r.latest)}</div>
        </div>`;
      }).join('');
      cell.innerHTML = `
        <div style="margin-bottom:10px;font-size:12px;color:var(--text-muted)">
          <span style="font-weight:600;color:var(--text-primary)">合計レコード: ${totalRecords.toLocaleString()}</span>
          <span style="margin-left:12px;font-family:'JetBrains Mono',monospace;font-size:10px">uid: ${Components.escapeHtml(uid)}</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">${cards}</div>
      `;
    } catch (err) {
      console.error('[loadUserActivity]', err);
      cell.innerHTML = `<div style="font-size:12px;color:var(--danger,#dc2626)">読み込みエラー: ${Components.escapeHtml(err.message || String(err))}</div>`;
    }
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
    const btn = document.querySelector('[onclick*="resetPromptsToDefault"]');
    if (btn && !btn.dataset.confirmed) {
      btn.dataset.confirmed = 'pending';
      btn.textContent = '本当にリセットしますか？もう一度押して確定';
      btn.style.background = 'var(--danger)';
      setTimeout(() => { btn.textContent = 'すべてデフォルトに戻す'; btn.style.background = ''; delete btn.dataset.confirmed; }, 4000);
      return;
    }
    store.set('customPrompts', {});
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
    if (!this.isAdmin()) {
      Components.showToast('モデル選択は管理者専用です', 'error');
      return;
    }
    store.set('selectedModel', modelId);
    // Save to global admin config so all users use the same model
    if (FirebaseBackend.initialized) {
      FirebaseBackend.saveGlobalConfig({ selectedModel: modelId });
    }
    Components.showToast(`モデルを ${modelId} に変更しました（全ユーザー共通）`, 'success');
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

  // ---- Professional registration (admin) ----
  // Professionals are stored in admin/config.professionals (global doc).
  // Each entry: { id, type, name, email, phone, region, notes }
  // `type` references CONFIG.PROFESSIONAL_TYPES[].id (sharoushi, tax_accountant, etc.)

  _getProfessionals() {
    return store.get('globalProfessionals') || [];
  }

  async renderProfessionalsList() {
    const container = document.getElementById('professionals-list');
    if (!container) return;

    // Load from Firestore if available (admin only)
    if (FirebaseBackend.initialized) {
      try {
        const cfg = await FirebaseBackend.loadGlobalConfig();
        if (cfg && Array.isArray(cfg.professionals)) {
          store.set('globalProfessionals', cfg.professionals);
        }
        if (cfg && cfg.mailerUrl !== undefined) {
          const el = document.getElementById('input-mailer-url');
          if (el) el.value = cfg.mailerUrl || '';
        }
        if (cfg && cfg.mailerSenderName !== undefined) {
          const el = document.getElementById('input-mailer-sender-name');
          if (el) el.value = cfg.mailerSenderName || '';
        }
      } catch (e) {
        console.warn('load professionals failed:', e.message);
      }
    }

    const pros = this._getProfessionals();
    if (!pros.length) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
        まだ登録された専門家はいません。「＋ 追加」で登録してください。
      </div>`;
      return;
    }

    const typeOptions = CONFIG.PROFESSIONAL_TYPES.map(t =>
      `<option value="${t.id}">${t.icon} ${t.name}</option>`
    ).join('');

    container.innerHTML = pros.map((p, idx) => `
      <div class="card" data-pro-row="${idx}" style="margin-bottom:10px">
        <div class="card-body" style="padding:12px 14px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:10px">専門家の種類</label>
              <select class="form-select" data-pro-field="type" data-pro-idx="${idx}" style="padding:6px 10px;font-size:12px">
                ${CONFIG.PROFESSIONAL_TYPES.map(t =>
                  `<option value="${t.id}" ${p.type===t.id?'selected':''}>${t.icon} ${t.name}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:10px">氏名（事務所名）</label>
              <input class="form-input" data-pro-field="name" data-pro-idx="${idx}" value="${Components.escapeHtml(p.name || '')}" placeholder="山田太郎（〇〇社労士事務所）" style="padding:6px 10px;font-size:12px">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:10px">メールアドレス *</label>
              <input type="email" class="form-input" data-pro-field="email" data-pro-idx="${idx}" value="${Components.escapeHtml(p.email || '')}" placeholder="pro@example.com" style="padding:6px 10px;font-size:12px">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:10px">電話番号</label>
              <input class="form-input" data-pro-field="phone" data-pro-idx="${idx}" value="${Components.escapeHtml(p.phone || '')}" placeholder="03-0000-0000" style="padding:6px 10px;font-size:12px">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-bottom:8px">
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:10px">対応地域</label>
              <input class="form-input" data-pro-field="region" data-pro-idx="${idx}" value="${Components.escapeHtml(p.region || '')}" placeholder="全国 / 神奈川県 / 関東圏" style="padding:6px 10px;font-size:12px">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label" style="font-size:10px">紹介文・得意分野</label>
              <input class="form-input" data-pro-field="notes" data-pro-idx="${idx}" value="${Components.escapeHtml(p.notes || '')}" placeholder="障害年金が得意 / 初回相談無料 など" style="padding:6px 10px;font-size:12px">
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-sm btn-danger" onclick="app.removeProfessionalRow(${idx})" style="font-size:11px;padding:3px 10px">削除</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  addProfessionalRow() {
    const pros = this._getProfessionals().slice();
    pros.push({
      id: 'pro_' + Date.now().toString(36),
      type: 'sharoushi',
      name: '',
      email: '',
      phone: '',
      region: '',
      notes: ''
    });
    store.set('globalProfessionals', pros);
    this.renderProfessionalsList();
  }

  removeProfessionalRow(idx) {
    const pros = this._getProfessionals().slice();
    if (idx < 0 || idx >= pros.length) return;
    pros.splice(idx, 1);
    store.set('globalProfessionals', pros);
    this.renderProfessionalsList();
  }

  _collectProfessionalsFromUI() {
    const container = document.getElementById('professionals-list');
    if (!container) return this._getProfessionals();
    const rows = container.querySelectorAll('[data-pro-row]');
    const existing = this._getProfessionals();
    const out = [];
    rows.forEach((row, idx) => {
      const getVal = (field) => {
        const el = row.querySelector(`[data-pro-field="${field}"]`);
        return el ? el.value.trim() : '';
      };
      out.push({
        id: existing[idx]?.id || ('pro_' + Date.now().toString(36) + '_' + idx),
        type: getVal('type') || 'sharoushi',
        name: getVal('name'),
        email: getVal('email'),
        phone: getVal('phone'),
        region: getVal('region'),
        notes: getVal('notes')
      });
    });
    return out;
  }

  async saveProfessionalsFromUI() {
    if (!this.isAdmin()) {
      Components.showToast('管理者のみが保存できます', 'error');
      return;
    }
    const pros = this._collectProfessionalsFromUI();
    const invalid = pros.find(p => p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email));
    if (invalid) {
      Components.showToast(`メール形式が不正です: ${invalid.email}`, 'error');
      return;
    }
    const missingEmail = pros.find(p => !p.email);
    if (missingEmail) {
      Components.showToast('メールアドレスは必須です', 'error');
      return;
    }
    store.set('globalProfessionals', pros);
    if (FirebaseBackend.initialized) {
      const ok = await FirebaseBackend.saveGlobalConfig({ professionals: pros });
      if (!ok) return;
    }
    Components.showToast(`${pros.length}件の専門家情報を保存しました`, 'success');
  }

  async saveMailerConfig() {
    if (!this.isAdmin()) {
      Components.showToast('管理者のみが保存できます', 'error');
      return;
    }
    const urlEl = document.getElementById('input-mailer-url');
    const nameEl = document.getElementById('input-mailer-sender-name');
    const mailerUrl = urlEl ? urlEl.value.trim() : '';
    const mailerSenderName = nameEl ? nameEl.value.trim() : '';
    if (mailerUrl && !/^https?:\/\//.test(mailerUrl)) {
      Components.showToast('URL は http(s):// で始まる必要があります', 'error');
      return;
    }
    if (FirebaseBackend.initialized) {
      const ok = await FirebaseBackend.saveGlobalConfig({ mailerUrl, mailerSenderName });
      if (!ok) return;
    }
    store.set('mailerUrl', mailerUrl);
    store.set('mailerSenderName', mailerSenderName);
    Components.showToast('メール送信設定を保存しました', 'success');
  }

  // ---- Financial support application flow (user-facing) ----
  // 1. openFinancialSupportForm(programId): opens a modal with a form
  //    built from CONFIG.FINANCIAL_SUPPORT[programId].form_fields, plus
  //    the user's contact info and a choice of registered専門家.
  // 2. submitFinancialApplication(): collects the form, generates a
  //    polite email via AI, sends via Cloudflare Worker (or mailto: as
  //    fallback), and writes an audit-log entry to Firestore.

  openFinancialSupportForm(programId) {
    const program = (CONFIG.FINANCIAL_SUPPORT || []).find(p => p.id === programId);
    if (!program) {
      Components.showToast('制度情報が見つかりません', 'error');
      return;
    }
    const user = store.get('user') || {};
    if (!user.uid || user.isAnonymous) {
      Components.showToast('申請サポートを使うにはサインインが必要です', 'warning');
      return;
    }

    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    if (!overlay || !body) return;

    const pros = (store.get('globalProfessionals') || []).filter(p =>
      !program.professional || p.type === program.professional || !p.type
    );
    const proTypeMap = {};
    (CONFIG.PROFESSIONAL_TYPES || []).forEach(t => { proTypeMap[t.id] = t; });
    const proType = proTypeMap[program.professional] || {};

    title.textContent = `${program.icon} ${program.name} — 申請サポート`;

    const fieldLabels = CONFIG.FINANCIAL_SUPPORT_FIELDS || {};
    const userProfile = store.get('userProfile') || {};

    const renderField = (fieldId) => {
      const meta = fieldLabels[fieldId] || { label: fieldId, type: 'text', placeholder: '' };
      const unit = meta.unit ? `<span style="font-size:11px;color:var(--text-muted);margin-left:6px">${meta.unit}</span>` : '';
      if (meta.type === 'textarea') {
        return `<div class="form-group">
          <label class="form-label">${Components.escapeHtml(meta.label)}</label>
          <textarea class="form-textarea" data-fs-field="${fieldId}" rows="3" placeholder="${Components.escapeHtml(meta.placeholder || '')}"></textarea>
        </div>`;
      }
      if (meta.type === 'select') {
        return `<div class="form-group">
          <label class="form-label">${Components.escapeHtml(meta.label)}</label>
          <select class="form-select" data-fs-field="${fieldId}">
            <option value="">選択してください</option>
            ${(meta.options || []).map(o => `<option value="${Components.escapeHtml(o)}">${Components.escapeHtml(o)}</option>`).join('')}
          </select>
        </div>`;
      }
      return `<div class="form-group">
        <label class="form-label">${Components.escapeHtml(meta.label)}${unit}</label>
        <input type="${meta.type || 'text'}" class="form-input" data-fs-field="${fieldId}" placeholder="${Components.escapeHtml(meta.placeholder || '')}">
      </div>`;
    };

    const formFields = (program.form_fields || []).map(renderField).join('');

    const proOptions = pros.length > 0 ? `
      <div class="form-group">
        <label class="form-label">依頼する専門家 ${proType.name ? `（${proType.icon} ${Components.escapeHtml(proType.name)}）` : ''}</label>
        <select class="form-select" id="fs-professional-select">
          <option value="auto">自動で最適な担当者に依頼（推奨）</option>
          ${pros.map((p, i) => `<option value="${i}">${Components.escapeHtml(p.name || p.email)} ${p.region ? '／' + Components.escapeHtml(p.region) : ''}</option>`).join('')}
        </select>
      </div>` : `
      <div style="padding:10px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;margin-bottom:10px">
        現在、提携する${proType.name || '専門家'}が登録されていません。管理者が専門家を登録するまで、下書きのみ保存できます。
      </div>`;

    body.innerHTML = `
      <div style="padding:0">
        <div style="background:#f0fdf4;padding:12px 14px;border-left:3px solid #059669;border-radius:6px;font-size:12px;color:#065f46;line-height:1.7;margin-bottom:14px">
          <strong>${Components.escapeHtml(program.amount || '')}</strong><br>
          <span style="color:#047857">${Components.escapeHtml(program.description || '')}</span>
        </div>

        <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">■ 申請に必要な情報</div>
        ${formFields}

        <div style="font-size:12px;font-weight:600;margin:16px 0 8px;color:var(--text-secondary)">■ あなたの連絡先（専門家からの返信に使われます）</div>
        <div class="form-group">
          <label class="form-label">氏名</label>
          <input type="text" class="form-input" data-fs-field="_user_name" value="${Components.escapeHtml(user.displayName || '')}" placeholder="山田花子">
        </div>
        <div class="form-group">
          <label class="form-label">メールアドレス</label>
          <input type="email" class="form-input" data-fs-field="_user_email" value="${Components.escapeHtml(user.email || '')}" placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">電話番号（任意）</label>
          <input type="tel" class="form-input" data-fs-field="_user_phone" placeholder="090-0000-0000">
        </div>
        <div class="form-group">
          <label class="form-label">連絡希望時間帯</label>
          <input type="text" class="form-input" data-fs-field="_user_contact_time" placeholder="平日 10-17時 等">
        </div>
        <div class="form-group">
          <label class="form-label">補足メモ（任意）</label>
          <textarea class="form-textarea" data-fs-field="_user_notes" rows="3" placeholder="その他、専門家に伝えたいこと"></textarea>
        </div>

        ${proOptions}

        <div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.7;margin-bottom:14px">
          🔒 送信内容は専門家のみに届きます。管理者・第三者には共有されません。申請履歴は後から「マイページ」で確認できます。
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="app.closeModal()">キャンセル</button>
          <button class="btn btn-primary" onclick="app.submitFinancialApplication('${programId}')" style="background:#059669;border-color:#047857">
            丁寧なメールを作成して専門家に送る
          </button>
        </div>
      </div>
    `;
    overlay.classList.add('active');
  }

  async submitFinancialApplication(programId) {
    const program = (CONFIG.FINANCIAL_SUPPORT || []).find(p => p.id === programId);
    if (!program) { Components.showToast('制度情報が見つかりません', 'error'); return; }
    const user = store.get('user') || {};
    if (!user.uid || user.isAnonymous) {
      Components.showToast('申請サポートを使うにはサインインが必要です', 'warning');
      return;
    }

    const body = document.getElementById('modal-body');
    if (!body) return;

    // Collect all form values
    const inputs = body.querySelectorAll('[data-fs-field]');
    const values = {};
    inputs.forEach(el => { values[el.dataset.fsField] = (el.value || '').trim(); });

    if (!values._user_name || !values._user_email) {
      Components.showToast('氏名とメールアドレスは必須です', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values._user_email)) {
      Components.showToast('メールアドレスの形式が不正です', 'error');
      return;
    }

    // Pick professional
    const pros = store.get('globalProfessionals') || [];
    const filtered = pros.filter(p => !program.professional || p.type === program.professional || !p.type);
    const selEl = document.getElementById('fs-professional-select');
    let professional = null;
    if (selEl) {
      const v = selEl.value;
      if (v === 'auto') {
        professional = filtered[0] || null;
      } else {
        const idx = parseInt(v, 10);
        if (!isNaN(idx) && filtered[idx]) professional = filtered[idx];
      }
    } else {
      professional = filtered[0] || null;
    }

    const fieldLabels = CONFIG.FINANCIAL_SUPPORT_FIELDS || {};
    const proTypeMap = {};
    (CONFIG.PROFESSIONAL_TYPES || []).forEach(t => { proTypeMap[t.id] = t; });
    const proType = proTypeMap[program.professional] || {};

    // Build a nice human-readable structured summary for the AI prompt
    const formDetails = (program.form_fields || [])
      .map(f => {
        const meta = fieldLabels[f] || { label: f };
        const v = values[f];
        if (!v) return null;
        return `- ${meta.label}: ${v}${meta.unit ? meta.unit : ''}`;
      })
      .filter(Boolean)
      .join('\n');

    const contactDetails = [
      `- 氏名: ${values._user_name}`,
      `- メール: ${values._user_email}`,
      values._user_phone ? `- 電話: ${values._user_phone}` : null,
      values._user_contact_time ? `- 連絡希望時間帯: ${values._user_contact_time}` : null,
      values._user_notes ? `- 補足: ${values._user_notes}` : null
    ].filter(Boolean).join('\n');

    Components.showToast('AIが丁寧な依頼メールを作成しています…', 'info');

    // Build AI prompt using CONFIG template
    const tpl = CONFIG.FINANCIAL_SUPPORT_EMAIL_PROMPT || '';
    const proName = professional?.name || '';
    const systemPrompt = tpl
      .replace(/{{PROFESSIONAL_NAME}}/g, proName)
      .replace(/{{PROFESSIONAL_TYPE}}/g, proType.name || '専門家')
      .replace(/{{PROGRAM_NAME}}/g, program.name);

    const userMessage = `【制度】${program.name}
【制度概要】${program.description || ''}
【申請金額・効果】${program.amount || ''}

【利用者からの申請情報】
${formDetails || '（特記事項なし）'}

【利用者連絡先】
${contactDetails}

上記を踏まえて、${proType.name || '専門家'}宛の丁寧な依頼メール（subject と body の JSON）を作成してください。`;

    let emailSubject = `【申請相談】${program.name}について`;
    let emailBody = '';
    let aiSucceeded = false;
    try {
      const modelId = store.get('selectedModel') || 'claude-opus-4-6';
      const raw = await aiEngine.callModel(modelId, userMessage, {
        systemPrompt,
        maxTokens: 1500,
        temperature: 0.4
      });
      const text = typeof raw === 'string' ? raw : String(raw || '');
      // Accept either pure JSON or fenced ```json blocks
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (_) {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
      }
      if (parsed && parsed.body && typeof parsed.body === 'string') {
        if (parsed.subject) emailSubject = parsed.subject;
        emailBody = parsed.body;
        aiSucceeded = true;
      }
    } catch (err) {
      console.warn('[financial] AI email generation failed:', err.message);
    }

    // Fallback template if AI didn't produce a usable body
    if (!aiSucceeded) {
      emailBody = this._buildFallbackEmailBody(program, proType, professional, values, formDetails, contactDetails);
    }

    // Attempt to send the email
    const mailerUrl = store.get('mailerUrl') || '';
    const senderName = store.get('mailerSenderName') || '健康日記 申請サポート';
    const appId = 'app_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    let deliveryStatus = 'pending';
    let deliveryError = '';
    let deliveryPath = '';

    if (professional && mailerUrl) {
      try {
        const res = await fetch(mailerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: professional.email,
            toName: professional.name || '',
            replyTo: values._user_email,
            replyToName: values._user_name,
            from: null,
            fromName: senderName,
            subject: emailSubject,
            text: emailBody,
            meta: {
              programId: program.id,
              programName: program.name,
              applicationId: appId,
              userUid: user.uid
            }
          })
        });
        if (res.ok) {
          deliveryStatus = 'sent';
          deliveryPath = 'worker';
        } else {
          deliveryStatus = 'failed';
          deliveryError = `worker http ${res.status}`;
        }
      } catch (e) {
        deliveryStatus = 'failed';
        deliveryError = 'worker fetch error: ' + e.message;
      }
    } else if (!professional) {
      deliveryStatus = 'draft_saved';
      deliveryError = '登録された専門家がいません';
    } else {
      // No worker → open mailto: as fallback
      deliveryPath = 'mailto';
      deliveryStatus = 'mailto_opened';
      const mailtoHref = `mailto:${encodeURIComponent(professional.email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      try {
        const a = document.createElement('a');
        a.href = mailtoHref;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) { /* ignore */ }
    }

    // Write audit log to Firestore (always, even if send failed).
    // users/{uid}/applications/{appId}
    const auditEntry = {
      id: appId,
      programId: program.id,
      programName: program.name,
      professionalId: professional?.id || null,
      professionalName: professional?.name || null,
      professionalEmail: professional?.email || null,
      professionalType: program.professional || null,
      subject: emailSubject,
      body: emailBody,
      fieldValues: values,
      deliveryStatus,
      deliveryPath,
      deliveryError,
      aiGenerated: aiSucceeded,
      createdAt: new Date().toISOString()
    };
    try {
      if (FirebaseBackend.initialized && FirebaseBackend.userId) {
        await firebase.firestore()
          .collection('users').doc(FirebaseBackend.userId)
          .collection('applications').doc(appId)
          .set(auditEntry);
      } else {
        // Fallback to localStorage audit log
        const log = store.get('applicationLog') || [];
        log.push(auditEntry);
        store.set('applicationLog', log);
      }
    } catch (e) {
      console.warn('[financial] audit log save failed:', e.message);
    }

    // User feedback + show generated email for verification
    const escapedSubject = Components.escapeHtml(emailSubject);
    const escapedBody = Components.escapeHtml(emailBody);
    const escapedTo = Components.escapeHtml(professional?.email || '');
    const statusMsg = {
      'sent': `✅ ${professional?.name || '専門家'} 様宛にメールを送信しました`,
      'mailto_opened': `📧 メールクライアントを開きました。送信ボタンを押してください。`,
      'draft_saved': `📝 下書きを保存しました。管理者が専門家を登録すると送信されます。`,
      'failed': `⚠ 送信に失敗しました: ${deliveryError}。下書きは保存されました。`
    }[deliveryStatus] || deliveryStatus;
    const statusColor = deliveryStatus === 'sent' ? '#059669' : deliveryStatus === 'failed' ? '#dc2626' : '#d97706';
    body.innerHTML = `
      <div style="padding:4px">
        <div style="padding:12px 14px;background:#f0fdf4;border-left:3px solid ${statusColor};border-radius:6px;font-size:13px;color:${statusColor};font-weight:600;margin-bottom:14px">
          ${statusMsg}
        </div>
        ${professional ? `
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">
            <strong>宛先:</strong> ${escapedTo}${professional.name ? '（' + Components.escapeHtml(professional.name) + '）' : ''}
          </div>
        ` : ''}
        <div style="font-size:12px;font-weight:600;margin-bottom:4px">件名</div>
        <div style="padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;font-size:12px;margin-bottom:10px">${escapedSubject}</div>
        <div style="font-size:12px;font-weight:600;margin-bottom:4px">本文 ${aiSucceeded ? '<span style="font-weight:400;font-size:10px;color:#059669">（AI生成）</span>' : '<span style="font-weight:400;font-size:10px;color:#d97706">（テンプレート）</span>'}</div>
        <pre style="padding:12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;font-size:12px;line-height:1.7;white-space:pre-wrap;font-family:inherit;max-height:300px;overflow-y:auto">${escapedBody}</pre>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">
          <button class="btn btn-secondary" onclick="app.closeModal()">閉じる</button>
        </div>
      </div>
    `;
    Components.showToast(statusMsg, deliveryStatus === 'sent' || deliveryStatus === 'mailto_opened' ? 'success' : 'warning');
  }

  _buildFallbackEmailBody(program, proType, professional, values, formDetails, contactDetails) {
    const greetingName = professional?.name ? `${professional.name} 様` : `${proType.name || '専門家'} 御中`;
    return `${greetingName}

お世話になっております。
${values._user_name} と申します。

このたび、以下の制度について申請を検討しており、手続きについてご相談させていただきたくご連絡いたしました。

【対象制度】${program.name}
【制度概要】${program.description || ''}
【想定される支給内容】${program.amount || ''}

■ 現状の情報
${formDetails || '（後日お伝えします）'}

■ 連絡先
${contactDetails}

つきましては、初回のご相談の日程調整、および費用のお見積りをいただけますと幸いです。
ご多忙のところ恐れ入りますが、ご返信をお待ちしております。

何卒よろしくお願い申し上げます。
${values._user_name}
`;
  }

  // ---- Dashboard Charts ----
  // ─── 禅トラック / Plaud dashboard widget ───
  // Renders the most recent analysis as a four-panel dashboard:
  //   • Radar chart of 意識の焦点 dimensions (1, 2, 3, 3.5, 4, 5, 6, 7)
  //   • Horizontal bar of 欲/徳/エネルギー signal counts
  //   • Calorie balance gauge (intake vs burn)
  //   • Net value (純価値) trend line across recent analyses
  // Returns empty string if no analyses exist yet so the widget
  // quietly hides until the user's first Plaud transcript arrives.
  renderPlaudWidget() {
    const analyses = store.get('plaudAnalyses') || [];
    if (analyses.length === 0) return '';
    const latest = analyses[analyses.length - 1];
    const j = latest.json || {};
    const cf = j.conscious_focus || {};
    const dims = cf.dims_pct || {};
    const signals = j.signals || {};
    const cal = j.calories || {};

    // Build a one-line summary snippet from summary or raw_bullets
    let headline = '';
    if (j.summary && typeof j.summary === 'object') {
      headline = j.summary.overall_note || j.summary.summary || '';
    }
    if (!headline && Array.isArray(j.raw_bullets) && j.raw_bullets.length) {
      headline = j.raw_bullets[0].replace(/^[・\s]+/, '').substring(0, 140);
    }

    // Net value history for the trend line
    const netHistory = analyses.slice(-14).map(a => {
      const jj = a.json || {};
      const nv = jj.summary?.net_value ?? jj.summary?.pure_value ?? jj.summary?.純価値 ?? null;
      return { date: a.dateLabel, nv: typeof nv === 'number' ? nv : null };
    });

    return `
    <div class="card" id="plaud-widget-card" style="margin-bottom:16px;border:1.5px solid #8b5cf6">
      <div class="card-header" style="background:linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);display:flex;justify-content:space-between;align-items:center">
        <span class="card-title" style="color:#6b21a8">🎙️ 禅トラック（${latest.dateLabel}）</span>
        <span class="tag" style="font-size:10px;background:#8b5cf6;color:#fff">${analyses.length}件の分析</span>
      </div>
      <div class="card-body" style="padding:16px">
        ${headline ? `<div style="font-size:12px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px;padding:8px 12px;background:var(--bg-tertiary);border-left:3px solid #8b5cf6;border-radius:var(--radius-sm)">${Components.escapeHtml(headline)}</div>` : ''}

        <!-- 4-panel graph grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:var(--bg-primary);padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:4px">意識の焦点</div>
            <div style="position:relative;height:180px"><canvas id="plaud-focus-chart"></canvas></div>
          </div>
          <div style="background:var(--bg-primary);padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:4px">欲 / 徳 / エネルギー</div>
            <div style="position:relative;height:180px"><canvas id="plaud-signals-chart"></canvas></div>
          </div>
          <div style="background:var(--bg-primary);padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:4px">カロリー収支</div>
            <div style="position:relative;height:180px"><canvas id="plaud-calorie-chart"></canvas></div>
          </div>
          <div style="background:var(--bg-primary);padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:4px">純価値（エネルギー+徳-欲）</div>
            <div style="position:relative;height:180px"><canvas id="plaud-netvalue-chart"></canvas></div>
          </div>
        </div>

        <details style="font-size:11px;color:var(--text-secondary)">
          <summary style="cursor:pointer;color:var(--accent);padding:4px 0">フル版レポートを表示</summary>
          <div style="padding:10px 0;white-space:pre-wrap;line-height:1.7;max-height:300px;overflow-y:auto">${Components.escapeHtml(latest.fullText || '')}</div>
        </details>
      </div>
    </div>`;
  }

  // Instantiate the four Plaud charts. Destroys any prior instance
  // first so re-rendering (e.g., after a new analysis arrives) doesn't
  // leak Chart.js contexts.
  initPlaudCharts(dims, signals, cal, netHistory) {
    if (typeof Chart === 'undefined') return;
    const destroy = (key) => {
      if (this.chartInstances[key]) { try { this.chartInstances[key].destroy(); } catch (e) {} this.chartInstances[key] = null; }
    };

    // 1. Radar chart of 意識の焦点 dimensions
    const focusEl = document.getElementById('plaud-focus-chart');
    if (focusEl) {
      destroy('plaudFocus');
      const dimKeys = ['1', '2', '3', '3.5', '4', '5', '6', '7'];
      const dimLabels = ['1 計測', '2 論理', '3 現場', '3.5 心身', '4 構想', '5 直観', '6 統合', '7 空'];
      const values = dimKeys.map(k => (dims && typeof dims[k] === 'number') ? dims[k] : 0);
      this.chartInstances.plaudFocus = new Chart(focusEl, {
        type: 'radar',
        data: {
          labels: dimLabels,
          datasets: [{
            data: values,
            backgroundColor: 'rgba(139,92,246,0.2)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            pointBackgroundColor: '#8b5cf6'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              beginAtZero: true,
              suggestedMax: Math.max(30, ...values.map(v => v || 0)),
              ticks: { display: false },
              pointLabels: { font: { size: 9 } }
            }
          }
        }
      });
    }

    // 2. Horizontal bar of signal counts
    const sigEl = document.getElementById('plaud-signals-chart');
    if (sigEl) {
      destroy('plaudSignals');
      const desire = signals.desire_count || 0;
      const virtue = signals.virtue_count || 0;
      const energy = signals.energy_count || 0;
      this.chartInstances.plaudSignals = new Chart(sigEl, {
        type: 'bar',
        data: {
          labels: ['欲', '徳', 'エネルギー'],
          datasets: [{
            data: [desire, virtue, energy],
            backgroundColor: ['#ef4444', '#22c55e', '#f59e0b'],
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // 3. Calorie balance bar (intake vs burn)
    const calEl = document.getElementById('plaud-calorie-chart');
    if (calEl) {
      destroy('plaudCal');
      const parseRange = (r) => {
        if (typeof r === 'number') return r;
        if (Array.isArray(r) && r.length) return (r[0] + (r[1] || r[0])) / 2;
        if (typeof r === 'string') {
          const m = r.match(/(\d+)\s*[〜\-~]\s*(\d+)?/);
          if (m) return (parseInt(m[1], 10) + parseInt(m[2] || m[1], 10)) / 2;
          const n = parseFloat(r);
          if (!isNaN(n)) return n;
        }
        return 0;
      };
      const intake = parseRange(cal.intake_kcal_range);
      const burn = parseRange(cal.burn_kcal_range);
      this.chartInstances.plaudCal = new Chart(calEl, {
        type: 'bar',
        data: {
          labels: ['摂取', '消費'],
          datasets: [{
            data: [intake, burn],
            backgroundColor: ['#f59e0b', '#22c55e'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `収支 ${(intake - burn >= 0 ? '+' : '')}${Math.round(intake - burn)} kcal`,
              font: { size: 11 }
            }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // 4. Net value trend line
    const nvEl = document.getElementById('plaud-netvalue-chart');
    if (nvEl) {
      destroy('plaudNV');
      const labels = netHistory.map(p => p.date || '');
      const data = netHistory.map(p => p.nv);
      this.chartInstances.plaudNV = new Chart(nvEl, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            tension: 0.3,
            fill: true,
            spanGaps: true,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100 } }
        }
      });
    }
  }

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

  // ---- Nutrition / BMR / PFC ----
  initNutritionCharts() {
    if (typeof Chart === 'undefined') return;
    const log = store.get('nutritionLog') || [];
    const bmr = store.calculateBMR();
    // Show the last 14 days so the chart still has room even if logs
    // are sparse.
    const recent = log.slice(-14);
    const labels = recent.map(e => {
      const d = new Date(e.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const emptyLabels = labels.length ? labels : ['データなし'];
    const emptyData = labels.length ? null : [0];

    const calCtx = document.getElementById('nutrition-calorie-chart');
    if (calCtx) {
      if (this.chartInstances.nutritionCal) this.chartInstances.nutritionCal.destroy();
      const datasets = [
        {
          label: '摂取カロリー',
          data: emptyData || recent.map(e => e.calories || 0),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.15)',
          tension: 0.3, fill: true,
        }
      ];
      if (bmr != null) {
        datasets.push({
          label: '基礎代謝 BMR',
          data: new Array((emptyData || recent).length).fill(bmr),
          borderColor: '#ef4444',
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
        });
      }
      this.chartInstances.nutritionCal = new Chart(calCtx, {
        type: 'line',
        data: { labels: emptyLabels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { color: '#8896b0' } },
            x: { grid: { display: false }, ticks: { color: '#8896b0' } }
          },
          plugins: { legend: { labels: { color: '#8896b0', font: { size: 11 } } } }
        }
      });
    }

    const pfcCtx = document.getElementById('nutrition-pfc-chart');
    if (pfcCtx) {
      if (this.chartInstances.nutritionPfc) this.chartInstances.nutritionPfc.destroy();
      this.chartInstances.nutritionPfc = new Chart(pfcCtx, {
        type: 'bar',
        data: {
          labels: emptyLabels,
          datasets: [
            {
              label: 'タンパク質',
              data: emptyData || recent.map(e => e.protein_g || 0),
              backgroundColor: '#3b82f6',
            },
            {
              label: '脂質',
              data: emptyData || recent.map(e => e.fat_g || 0),
              backgroundColor: '#f59e0b',
            },
            {
              label: '炭水化物',
              data: emptyData || recent.map(e => e.carbs_g || 0),
              backgroundColor: '#10b981',
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: '#8896b0' } },
            y: { stacked: true, beginAtZero: true, ticks: { color: '#8896b0' } }
          },
          plugins: { legend: { labels: { color: '#8896b0', font: { size: 11 } } } }
        }
      });
    }
  }

  // Aggregate today's text entries into a single nutrition estimate via
  // the model. Uses a dedicated JSON-shaped prompt so the result can be
  // parsed directly into a nutritionLog row.
  async extractTodayNutrition() {
    const today = new Date().toISOString().split('T')[0];
    const entries = (store.get('textEntries') || []).filter(e => {
      if (!e.timestamp) return false;
      return new Date(e.timestamp).toISOString().split('T')[0] === today;
    });
    if (entries.length === 0) {
      Components.showToast('今日の記録がまだありません', 'info');
      return;
    }
    const model = store.get('selectedModel') || 'claude-opus-4-6';
    const apiKey = aiEngine.getApiKey(model);
    if (!apiKey) {
      Components.showToast('モデルのAPIキーが未設定です（設定ページから登録してください）', 'error');
      return;
    }
    Components.showToast('今日の記録から栄養を集計中...', 'info');

    const joined = entries.map(e => (e.title ? `[${e.title}] ` : '') + (e.content || '')).join('\n---\n');
    const prompt = `以下は今日（${today}）のユーザーの食事・生活記録です。記録全体から1日の合計摂取カロリーとPFC内訳を推定してください。記録に含まれない食事は0として扱わず、「記録された範囲」を反映してください。

応答は必ず次のJSON 1 オブジェクトだけを返してください（前後の説明・コードブロックなし）:
{"calories": <整数kcal>, "protein_g": <整数>, "fat_g": <整数>, "carbs_g": <整数>, "confidence": <0-1の小数>, "note": "<日本語の短い注記>"}

記録:
${joined.substring(0, 8000)}`;

    try {
      const result = await this.analyzeViaAPI(prompt, 'text_analysis');
      // analyzeViaAPI may return a parsed object or a string; extract JSON robustly.
      let parsed = null;
      if (result && typeof result === 'object' && result.calories != null) {
        parsed = result;
      } else {
        const text = typeof result === 'string' ? result : (result?._raw || result?.summary || result?.findings || '');
        const m = typeof text === 'string' ? text.match(/\{[\s\S]*?\}/) : null;
        if (m) {
          try { parsed = JSON.parse(m[0]); } catch (e) {}
        }
      }
      if (!parsed || parsed.calories == null) {
        Components.showToast('栄養データの解析に失敗しました。記録を増やしてから再度お試しください。', 'error');
        return;
      }
      const entry = {
        date: today,
        calories: Number(parsed.calories) || 0,
        protein_g: Number(parsed.protein_g) || 0,
        fat_g: Number(parsed.fat_g) || 0,
        carbs_g: Number(parsed.carbs_g) || 0,
        confidence: Number(parsed.confidence) || 0,
        note: typeof parsed.note === 'string' ? parsed.note : ''
      };
      store.upsertNutritionEntry(entry);
      Components.showToast(`今日: ${entry.calories} kcal を記録しました`, 'success');
      this.navigate('dashboard');
      setTimeout(() => this.initNutritionCharts(), 100);
    } catch (err) {
      console.error('[extractTodayNutrition] error:', err);
      Components.showToast('栄養集計中にエラーが発生しました: ' + (err.message || err), 'error');
    }
  }

  clearNutritionLog() {
    // Inline confirmation UI — CLAUDE.md forbids the built-in modal
    // dialogs because they are silently blocked on mobile browsers.
    // Show a toast with explicit cancel/delete buttons instead.
    const container = document.getElementById('toast-container') || (() => {
      const c = document.createElement('div'); c.id = 'toast-container'; c.className = 'toast-container';
      document.body.appendChild(c); return c;
    })();
    const toast = document.createElement('div');
    toast.className = 'toast toast-warning';
    toast.innerHTML = `<span>栄養ログを削除しますか？</span>
      <button class="btn btn-sm btn-danger" style="margin-left:10px">削除</button>
      <button class="btn btn-sm btn-outline" style="margin-left:6px">キャンセル</button>`;
    container.appendChild(toast);
    const [okBtn, cancelBtn] = toast.querySelectorAll('button');
    const close = () => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); };
    okBtn.onclick = () => {
      store.set('nutritionLog', []);
      close();
      Components.showToast('栄養ログを削除しました', 'success');
      this.navigate('dashboard');
      setTimeout(() => this.initNutritionCharts(), 100);
    };
    cancelBtn.onclick = close;
  }

  // ---- Deduplicate existing records in Firestore ----
  // One-shot cleanup for users who accumulated duplicates before the
  // autosync-on-load bug was fixed.
  async deduplicateRecords() {
    if (!FirebaseBackend.initialized) {
      Components.showToast('Firebaseに接続されていません', 'error');
      return;
    }
    Components.showToast('重複レコードを確認中...', 'info');
    try {
      const result = await FirebaseBackend.deduplicateAll();
      const total = (result.textEntries || 0) + (result.symptoms || 0) + (result.vitals || 0);
      if (total === 0) {
        Components.showToast('重複はありませんでした', 'success');
      } else {
        Components.showToast(`${total}件の重複を削除しました。再読み込みします...`, 'success');
        setTimeout(() => location.reload(), 1500);
      }
    } catch (err) {
      console.error('Deduplicate error:', err);
      Components.showToast('重複削除に失敗しました', 'error');
    }
  }

  // ---- Backup management ----
  // List existing weekly snapshots stored in Firestore at
  // users/{uid}/backups. Each one is a single doc keyed by YYYYMMDD
  // containing arrays of all health subcollections at that point in
  // time. Restore is "merge" semantics: documents in the backup that
  // are missing from the live collection get re-created (we do NOT
  // delete live docs that are absent from the backup, so a restore
  // never destroys data).
  async loadBackupList() {
    const out = document.getElementById('backup-list-result');
    if (!out) return;
    if (!FirebaseBackend?.userId) {
      out.innerHTML = '<div style="color:var(--danger,#dc2626)">未ログインです。</div>';
      return;
    }
    out.innerHTML = '<div style="color:var(--text-muted)">⏳ 取得中…</div>';
    try {
      const snap = await FirebaseBackend.userDoc().collection('backups').orderBy(firebase.firestore.FieldPath.documentId(), 'desc').limit(20).get();
      if (snap.empty) {
        out.innerHTML = '<div style="color:var(--text-muted)">バックアップはまだありません。「今すぐバックアップ」を押すと初回スナップショットが作成されます。</div>';
        return;
      }
      const rows = [];
      snap.forEach(d => {
        const data = d.data() || {};
        const id = d.id;
        const niceDate = id.slice(0,4) + '/' + id.slice(4,6) + '/' + id.slice(6,8);
        let totalDocs = 0;
        Object.keys(data).forEach(k => {
          if (Array.isArray(data[k])) totalDocs += data[k].length;
        });
        rows.push(`
          <tr>
            <td style="padding:6px 8px">${niceDate}</td>
            <td style="padding:6px 8px;text-align:right;font-weight:600">${totalDocs.toLocaleString()} 件</td>
            <td style="padding:6px 8px;text-align:right">
              <button class="btn btn-outline btn-sm" style="font-size:11px" onclick="app.restoreFromBackup('${id}')">復元</button>
              <button class="btn btn-outline btn-sm" style="font-size:11px" onclick="app.downloadBackup('${id}')">📥 JSON</button>
            </td>
          </tr>
        `);
      });
      out.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid var(--border);border-radius:6px;overflow:hidden">
          <thead><tr style="background:var(--bg-tertiary)">
            <th style="padding:8px;text-align:left;font-size:11px;font-weight:600">日付</th>
            <th style="padding:8px;text-align:right;font-size:11px;font-weight:600">件数</th>
            <th style="padding:8px;text-align:right;font-size:11px;font-weight:600">操作</th>
          </tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      `;
    } catch (err) {
      out.innerHTML = '<div style="color:var(--danger,#dc2626)">取得エラー: ' + Components.escapeHtml(err.message || String(err)) + '</div>';
    }
  }

  async runBackupNow() {
    const out = document.getElementById('backup-list-result');
    if (!FirebaseBackend?.userId) {
      if (out) out.innerHTML = '<div style="color:var(--danger,#dc2626)">未ログインです。</div>';
      return;
    }
    if (out) out.innerHTML = '<div style="color:var(--text-muted)">⏳ バックアップ作成中…</div>';
    try {
      // Force-run by clearing the 7-day cooldown logic — call the snapshot directly.
      const today = new Date();
      const todayId = today.getFullYear().toString()
        + String(today.getMonth() + 1).padStart(2, '0')
        + String(today.getDate()).padStart(2, '0');
      const collections = ['textEntries','symptoms','vitals','sleep','activity','bloodTests','medications','meals','photos','plaudAnalyses','conversations'];
      const snapshot = { createdAt: firebase.firestore.FieldValue.serverTimestamp(), schemaVersion: 1, manualTrigger: true };
      let totalDocs = 0;
      for (const c of collections) {
        const snap = await FirebaseBackend.userCollection(c).limit(2000).get();
        const arr = [];
        snap.forEach(d => arr.push(Object.assign({ id: d.id }, d.data())));
        if (arr.length) { snapshot[c] = arr; totalDocs += arr.length; }
      }
      await FirebaseBackend.userDoc().collection('backups').doc(todayId).set(snapshot);
      Components.showToast?.(`バックアップ完了 (${totalDocs} 件)`, 'success');
      await this.loadBackupList();
    } catch (err) {
      if (out) out.innerHTML = '<div style="color:var(--danger,#dc2626)">バックアップ失敗: ' + Components.escapeHtml(err.message || String(err)) + '</div>';
    }
  }

  async downloadBackup(backupId) {
    if (!FirebaseBackend?.userId) return;
    try {
      const doc = await FirebaseBackend.userDoc().collection('backups').doc(backupId).get();
      if (!doc.exists) { Components.showToast?.('バックアップが見つかりません', 'error'); return; }
      const data = doc.data();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `health-diary-backup-${backupId}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      Components.showToast?.('ダウンロード失敗: ' + (err.message || err), 'error');
    }
  }

  // Restore: merge each subcollection from the backup into the live
  // collection. We use the original document id so existing live docs
  // are overwritten (idempotent), and missing ones are recreated. We
  // never delete a live doc that's not in the backup, so a restore
  // is non-destructive.
  async restoreFromBackup(backupId) {
    const out = document.getElementById('backup-list-result');
    if (!FirebaseBackend?.userId) return;
    const ok = window.prompt('"' + backupId + '" のバックアップから復元します。\n\n本日のデータも残ります（マージ動作）。\n復元するには「復元」と入力してください:');
    if (ok !== '復元') return;
    if (out) out.innerHTML = '<div style="color:var(--text-muted)">⏳ 復元中…（時間がかかる場合があります）</div>';
    try {
      const doc = await FirebaseBackend.userDoc().collection('backups').doc(backupId).get();
      if (!doc.exists) { Components.showToast?.('バックアップが見つかりません', 'error'); return; }
      const data = doc.data();
      const collections = ['textEntries','symptoms','vitals','sleep','activity','bloodTests','medications','meals','photos','plaudAnalyses','conversations'];
      let restored = 0;
      for (const c of collections) {
        const arr = data[c];
        if (!Array.isArray(arr) || !arr.length) continue;
        const batch = firebase.firestore().batch();
        let batchCount = 0;
        for (const entry of arr) {
          const id = entry.id || FirebaseBackend.userCollection(c).doc().id;
          const cleaned = Object.assign({}, entry);
          delete cleaned.id;
          batch.set(FirebaseBackend.userCollection(c).doc(id), cleaned, { merge: true });
          batchCount++;
          restored++;
          if (batchCount >= 400) {
            await batch.commit();
            batchCount = 0;
          }
        }
        if (batchCount > 0) await batch.commit();
      }
      Components.showToast?.(`復元完了 (${restored} 件)。3 秒後にリロードします。`, 'success');
      setTimeout(() => location.reload(), 3000);
    } catch (err) {
      if (out) out.innerHTML = '<div style="color:var(--danger,#dc2626)">復元失敗: ' + Components.escapeHtml(err.message || String(err)) + '</div>';
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


