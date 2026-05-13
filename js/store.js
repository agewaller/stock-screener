// === js/store.js ===
/* ============================================================
   State Management Store
   Simple reactive store for the application
   ============================================================ */
var Store = class Store {
  constructor() {
    this.state = {
      // Auth
      user: null,
      isAuthenticated: false,

      // App state
      currentPage: 'login',
      selectedDisease: null,
      theme: 'light',
      sidebarOpen: window.innerWidth > 768,

      // Health data
      healthScore: 0,
      symptoms: [],
      vitals: [],
      bloodTests: [],
      medications: [],
      supplements: [],
      meals: [],
      sleepData: [],
      activityData: [],
      geneticData: null,
      photos: [],
      wearableData: [],
      conversationHistory: [],

      // AI Analysis
      latestAnalysis: null,
      analysisHistory: [],
      isAnalyzing: false,

      // Actions / Recommendations
      recommendations: [],
      actionItems: [],

      // Nutrition / BMR / PFC dashboard
      nutritionLog: [],

      // API usage tracking (admin dashboard). Each entry:
      //   { ts: ISO string, model: string, input: int, output: int,
      //     costJpy: number, source: 'guest'|'auth'|'admin' }
      // Capped at 5000 records (~3 months at 50 req/day).
      apiUsage: [],

      // Admin
      adminMode: false,
      selectedModel: 'claude-opus-4-6',
      customPrompts: {},
      dashboardLayout: 'default',
      affiliateConfig: {},

      // Notifications
      notifications: [],
      unreadCount: 0
    };

    this.listeners = new Map();
    this.loadFromStorage();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const old = this.state[key];
    this.state[key] = value;
    this.notify(key, value, old);
    this.saveToStorage(key, value);
  }

  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.state[key] = value;
      this.notify(key, value);
    });
    Object.keys(updates).forEach(key => this.saveToStorage(key, updates[key]));
  }

  // #11 EventBus with lifecycle management
  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    const unsub = () => this.listeners.get(key)?.delete(callback);
    if (!this._subscriptions) this._subscriptions = [];
    this._subscriptions.push(unsub);
    return unsub;
  }

  off(key, callback) {
    this.listeners.get(key)?.delete(callback);
  }

  once(key, callback) {
    const unsub = this.on(key, (val, old) => {
      unsub();
      callback(val, old);
    });
    return unsub;
  }

  cleanupListeners() {
    if (this._subscriptions) {
      this._subscriptions.forEach(u => u());
      this._subscriptions = [];
    }
  }

  notify(key, value, old) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => {
        try { cb(value, old); } catch (e) { console.error('[Store] listener error for', key, e); }
      });
    }
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => {
        try { cb(key, value, old); } catch (e) { console.error('[Store] wildcard listener error', e); }
      });
    }
  }

  // Persistence
  static PERSIST_KEYS = [
    'user', 'isAuthenticated',
    'theme', 'selectedDisease', 'selectedModel', 'customPrompts',
    'dashboardLayout', 'affiliateConfig', 'symptoms', 'vitals',
    'bloodTests', 'medications', 'supplements', 'meals', 'sleepData',
    'activityData', 'healthScore', 'analysisHistory', 'recommendations',
    'actionItems', 'conversationHistory', 'textEntries', 'selectedDiseases',
    'customDiseaseName', 'userProfile', 'calendarEvents', 'latestFeedback',
    'cachedResearch', 'aiComments', 'integrationSyncs', 'nutritionLog',
    'plaudAnalyses', 'apiUsage', 'photos', 'applicationLog',
    'globalProfessionals', 'latestFeedbackError',
    // Deep-analysis feature additions: archive of past runs + today's
    // JST date string so the 「本格的な分析」button grays out after use.
    // doctorReports persists the 医師提出用レポート generator output.
    'deepAnalyses', 'deepAnalysisLastRun', 'doctorReports',
    // Research tab state — persisted so tab switches don't wipe the
    // user's keyword / results (B-2 / B-3). researchResults caches the
    // rendered HTML along with the language it was rendered in so we
    // can invalidate on language change.
    'researchQuery', 'researchDays', 'researchResults',
    // Cached セルフケア panel — needs to survive reloads so the 1-per-day
    // cap and 5-minute throttle (B-7) can be enforced across sessions.
    'cachedActions'
  ];

  saveToStorage(key, value) {
    if (Store.PERSIST_KEYS.includes(key)) {
      this._setSafe(`cc_${key}`, JSON.stringify(value), key);
    }
  }

  // Quota-aware localStorage write. On QuotaExceededError, archives the
  // oldest entries of large array keys (photos, analysisHistory,
  // apiUsage) and retries. If still failing, drops a warning toast
  // but never silently loses data — the in-memory state.{key} is
  // untouched so an explicit user retry will succeed.
  _setSafe(storageKey, serialized, logicalKey) {
    const tryWrite = () => localStorage.setItem(storageKey, serialized);
    try {
      tryWrite();
      return true;
    } catch (e) {
      if (!(e && (e.name === 'QuotaExceededError' || e.code === 22))) {
        console.warn('[Store] storage write failed (non-quota):', storageKey, e);
        return false;
      }
      console.warn('[Store] quota exceeded for', storageKey, '— archiving and retrying');
      // Archive the heaviest array keys first. Photos win because each
      // base64 JPEG is ~50-200KB. Then analysisHistory (long markdown
      // strings), then apiUsage (5000 row cap is generous). For each
      // pass we trim 50% and try again.
      const HEAVY_KEYS = ['photos', 'analysisHistory', 'apiUsage', 'plaudAnalyses', 'deepAnalyses'];
      for (const k of HEAVY_KEYS) {
        const cur = this.state[k];
        if (!Array.isArray(cur) || cur.length === 0) continue;
        const half = Math.max(1, Math.floor(cur.length / 2));
        const archived = cur.slice(0, half);
        const remaining = cur.slice(half);
        try {
          // Save archived items separately so the user can recover later.
          const archiveKey = `cc_archive_${k}_${Date.now().toString(36)}`;
          try { localStorage.setItem(archiveKey, JSON.stringify(archived)); } catch (_) {}
          this.state[k] = remaining;
          localStorage.setItem(`cc_${k}`, JSON.stringify(remaining));
          tryWrite();
          console.log('[Store] archived', archived.length, k, 'and recovered');
          if (typeof Components !== 'undefined' && Components.showToast) {
            Components.showToast(`端末の容量を確保するため、古い${k}を${archived.length}件アーカイブしました`, 'warning');
          }
          return true;
        } catch (_) {
          // Keep trying with the next heavy key
        }
      }
      console.error('[Store] could not free space; write skipped:', storageKey);
      if (typeof Components !== 'undefined' && Components.showToast) {
        Components.showToast('端末の保存容量が不足しています。設定 → データ管理 から古い記録を削除してください。', 'error');
      }
      return false;
    }
  }

  // #20 Schema versioning + migration
  static SCHEMA_VERSION = 2;

  loadFromStorage() {
    const savedVersion = parseInt(localStorage.getItem('cc_schema_version') || '0', 10);
    const keys = Store.PERSIST_KEYS;
    keys.forEach(key => {
      try {
        const val = localStorage.getItem(`cc_${key}`);
        if (val !== null) {
          this.state[key] = JSON.parse(val);
        }
      } catch (e) {
        // Corrupt JSON — copy it aside so we can inspect/recover later,
        // then leave the in-memory default in place. Never silently
        // removeItem(): that's the kind of "small fix" that erases
        // someone's only copy of their data.
        console.warn('[Store] corrupt data for', key, '- archiving and keeping default');
        try {
          const corrupt = localStorage.getItem(`cc_${key}`);
          if (corrupt) localStorage.setItem(`cc_corrupt_${key}_${Date.now().toString(36)}`, corrupt);
        } catch (_) {}
        // Note: we deliberately do NOT remove the original. If the
        // user has a backup/restore tool later, they can recover.
      }
    });
    if (savedVersion < Store.SCHEMA_VERSION) {
      try {
        this._runMigrations(savedVersion);
        localStorage.setItem('cc_schema_version', String(Store.SCHEMA_VERSION));
      } catch (e) {
        // Migration crashed mid-way — do NOT bump the schema version,
        // so the next load can retry from where we are. Log to
        // applicationLog for the admin "セーフティ" tab to surface.
        console.error('[Store] migration failed, keeping old schema version', savedVersion, e);
        try {
          const log = (this.state.applicationLog || []);
          log.push({ ts: new Date().toISOString(), level: 'error',
            source: 'migration', message: String(e && e.message || e),
            fromVersion: savedVersion, targetVersion: Store.SCHEMA_VERSION });
          if (log.length > 200) log.splice(0, log.length - 200);
          this.state.applicationLog = log;
          this._setSafe('cc_applicationLog', JSON.stringify(log), 'applicationLog');
        } catch (_) {}
      }
    }
  }

  _runMigrations(fromVersion) {
    console.log('[Store] migrating schema', fromVersion, '→', Store.SCHEMA_VERSION);
    if (fromVersion < 1) {
      // v0→v1: ensure arrays are arrays, not null/undefined
      Store.PERSIST_KEYS.forEach(key => {
        if (Array.isArray(this.state[key])) return;
        const defaults = { symptoms:[], vitals:[], bloodTests:[], medications:[],
          supplements:[], meals:[], sleepData:[], activityData:[], photos:[],
          conversationHistory:[], analysisHistory:[], recommendations:[],
          actionItems:[], nutritionLog:[], plaudAnalyses:[], apiUsage:[] };
        if (key in defaults && !Array.isArray(this.state[key])) {
          this.state[key] = defaults[key];
          this.saveToStorage(key, this.state[key]);
        }
      });
    }
    if (fromVersion < 2) {
      // v1→v2: photos key now persisted (was missing in v0/v1)
      const photos = this.state.photos;
      if (Array.isArray(photos) && photos.length > 0) {
        this.saveToStorage('photos', photos);
      }
    }
  }

  // Add health data entry
  addHealthData(category, data) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      category,
      ...data
    };

    const key = this.categoryToStateKey(category);
    if (key && Array.isArray(this.state[key])) {
      this.state[key] = [...this.state[key], entry];
      this.notify(key, this.state[key]);
      this.saveToStorage(key, this.state[key]);
    }

    return entry;
  }

  categoryToStateKey(category) {
    const map = {
      'vitals': 'vitals',
      'symptoms': 'symptoms',
      'blood_test': 'bloodTests',
      'medication': 'medications',
      'nutrition': 'meals',
      'sleep': 'sleepData',
      'activity': 'activityData',
      'photos': 'photos',
      'wearable': 'wearableData',
      'genetic': 'geneticData'
    };
    return map[category];
  }

  // Get data for a time range
  getDataRange(key, days = 7) {
    const data = this.state[key];
    if (!Array.isArray(data)) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter(d => new Date(d.timestamp) >= cutoff);
  }

  // Calculate health score from recent data
  calculateHealthScore() {
    const recentSymptoms = this.getDataRange('symptoms', 7);
    if (recentSymptoms.length === 0) return 50;

    // Use simple condition_level (1-10) if available
    const conditionScores = recentSymptoms.map(s => s.condition_level).filter(v => v != null);
    if (conditionScores.length > 0) {
      const avg = conditionScores.reduce((a, b) => a + b, 0) / conditionScores.length;
      const score = Math.round(avg * 10); // 1-10 → 10-100
      this.set('healthScore', score);
      return score;
    }

    // Fallback to detailed scores
    const avgFatigue = this.avg(recentSymptoms, 'fatigue_level');
    const avgPain = this.avg(recentSymptoms, 'pain_level');
    const avgBrainFog = this.avg(recentSymptoms, 'brain_fog');
    const avgSleep = this.avg(recentSymptoms, 'sleep_quality');

    const symptomScore = Math.max(0, 100 - ((avgFatigue + avgPain + avgBrainFog) / 3) * (100 / 7));
    const sleepScore = (avgSleep / 7) * 100;

    const score = Math.round(symptomScore * 0.7 + sleepScore * 0.3);
    this.set('healthScore', score);
    return score;
  }

  avg(arr, field) {
    const vals = arr.map(d => d[field]).filter(v => v !== undefined && v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  // ---- Nutrition / BMR / PFC ----

  // Mifflin-St Jeor basal metabolic rate (kcal/day). Returns null if
  // the user hasn't filled in enough profile info so the caller can
  // show "--" instead of a misleading number.
  calculateBMR() {
    const profile = this.state.userProfile || {};
    const weight = parseFloat(profile.weight);
    const height = parseFloat(profile.height);
    const age = parseFloat(profile.age);
    if (!weight || !height || !age) return null;
    const base = 10 * weight + 6.25 * height - 5 * age;
    if (profile.gender === 'male') return Math.round(base + 5);
    if (profile.gender === 'female') return Math.round(base - 161);
    // Unspecified or "other" — midpoint of the two formulas.
    return Math.round(base - 78);
  }

  // Add or overwrite today's nutrition entry. Keeps the log sorted
  // ascending by date so the chart renders without re-sorting.
  upsertNutritionEntry(entry) {
    if (!entry || !entry.date) return;
    const log = (this.state.nutritionLog || []).filter(e => e.date !== entry.date);
    log.push(entry);
    log.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    this.set('nutritionLog', log);
  }

  // ---- API usage tracking ----
  // Cost-per-million-tokens (USD). Updated to reflect Anthropic /
  // OpenAI / Google public pricing as of 2026. Multiply tokens × rate
  // ÷ 1,000,000 ÷ usdJpy to get JPY.
  static COSTS_PER_MTOKEN_USD = {
    'claude-opus-4-6':   { input: 15,   output: 75   },
    'claude-sonnet-4-6': { input: 3,    output: 15   },
    'claude-haiku-4-5':  { input: 1,    output: 5    },
    'gpt-4o':            { input: 2.5,  output: 10   },
    'gemini-2.5-pro':    { input: 1.25, output: 5    }
  };
  static USD_JPY = 150;

  // Record one API call. Cost is computed automatically from the
  // model + token counts. The admin usage dashboard reads from this
  // log to render daily/monthly stats and trend charts.
  recordApiUsage(model, inputTokens, outputTokens, source) {
    if (!model) return;
    const inT = Number(inputTokens) || 0;
    const outT = Number(outputTokens) || 0;
    if (inT === 0 && outT === 0) return;
    const rates = Store.COSTS_PER_MTOKEN_USD[model] || { input: 5, output: 25 };
    const costUsd = (inT * rates.input + outT * rates.output) / 1_000_000;
    const costJpy = Math.round(costUsd * Store.USD_JPY * 100) / 100;
    const log = this.state.apiUsage || [];
    log.push({
      ts: new Date().toISOString(),
      model,
      input: inT,
      output: outT,
      costJpy,
      source: source || 'auth'
    });
    // Cap the log at 5000 entries (~3 months of typical usage)
    if (log.length > 5000) log.splice(0, log.length - 5000);
    this.set('apiUsage', log);
  }

  // Clear user data on logout, but PRESERVE device-level config and
  // integration tokens so the user doesn't have to re-paste their
  // ICS URL / re-OAuth Fitbit / re-enter Firebase config every time
  // they log out and back in.
  //
  // Before nuking anything we snapshot the full localStorage to a
  // dated archive key (kept for the last 3 logouts) so even an
  // accidental logout can be recovered by an admin via the data
  // management tab.
  clearAll() {
    // Take a recovery snapshot BEFORE doing anything destructive.
    try {
      const snapshot = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // Skip previous backups so we don't recursively bloat.
        if (k.startsWith('cc_last_clear_backup_')) continue;
        snapshot[k] = localStorage.getItem(k);
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      localStorage.setItem(`cc_last_clear_backup_${stamp}`, JSON.stringify(snapshot));
      // Prune backups beyond the last 3.
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cc_last_clear_backup_')) backupKeys.push(k);
      }
      backupKeys.sort();
      while (backupKeys.length > 3) {
        const old = backupKeys.shift();
        try { localStorage.removeItem(old); } catch (_) {}
      }
    } catch (e) {
      console.warn('[Store] could not create clearAll backup', e);
    }

    // Save device-level config that survives logout. These are not
    // per-user data — they're per-device integration settings that
    // a user explicitly configured and expects to persist.
    //
    // API keys are intentionally NOT preserved any more. In v2 they
    // live exclusively in the Cloudflare Worker environment; any key
    // still found in localStorage is a leftover from v1 and should
    // be cleared on logout for safety.
    const PRESERVE_KEYS = [
      // System config
      'firebase_config',
      'anthropic_proxy_url',
      'anthropic_mode',
      'admin_emails',
      'enable_shared_guest_ai',
      // Calendar integrations
      'ics_calendar_url',
      'google_calendar_oauth_connected',
      // Fitbit integration
      'fitbit_token',
      'fitbit_client_id',
      'fitbit_refresh_token',
      // Apple Health / Plaud integrations
      'apple_health_last_import',
      'plaud_email',
      // Privacy choice (anonymize before AI)
      'privacy_anonymize_ai',
      // Language preference
      'cc_language',
    ];
    const preserved = {};
    PRESERVE_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) preserved[k] = v;
    });

    // Also preserve all backup keys (clear-backups + archives + corrupt)
    // so this clearAll() doesn't destroy our recovery surface.
    const recoveryKeys = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('cc_last_clear_backup_') ||
            k.startsWith('cc_archive_') ||
            k.startsWith('cc_corrupt_')) {
          recoveryKeys[k] = localStorage.getItem(k);
        }
      }
    } catch (_) {}

    localStorage.clear();

    // Restore preserved device-level config
    Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));
    Object.entries(recoveryKeys).forEach(([k, v]) => {
      try { localStorage.setItem(k, v); } catch (_) {}
    });

    Object.keys(this.state).forEach(key => {
      if (Array.isArray(this.state[key])) this.state[key] = [];
      else if (typeof this.state[key] === 'object' && this.state[key] !== null) this.state[key] = {};
    });
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.currentPage = 'login';
    this.state.selectedModel = 'claude-opus-4-6';
  }

  // ---- Metrics (A.3) ----
  // Append a single metric event. Used to track value-validation
  // KPIs (record_save, ai_success, ai_failure, quick_input, etc.).
  // Stored in localStorage under cc_metricEvents (capped at 500
  // events per device) and rolled up to Firestore by the daily
  // metrics-aggregator Worker. Failure to record is silent — never
  // let metrics get in the way of the actual operation.
  recordMetric(name, value, meta) {
    if (!name) return;
    try {
      const events = this._metricEvents || [];
      events.push({
        ts: new Date().toISOString(),
        name,
        value: typeof value === 'number' ? value : 1,
        meta: meta || null,
        uid: (this.state.user && this.state.user.uid) || null
      });
      if (events.length > 500) events.splice(0, events.length - 500);
      this._metricEvents = events;
      this._setSafe('cc_metricEvents', JSON.stringify(events), 'metricEvents');
    } catch (e) {
      // metrics are best-effort; swallow errors silently
    }
  }

  getMetricEvents() {
    try {
      if (this._metricEvents) return this._metricEvents;
      const raw = localStorage.getItem('cc_metricEvents');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      this._metricEvents = Array.isArray(parsed) ? parsed : [];
      return this._metricEvents;
    } catch (_) { return []; }
  }
};

var store = new Store();


