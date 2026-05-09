// === js/store.js ===
/* ============================================================
   State Management Store
   Simple reactive store for the application
   ============================================================ */
var Store = class Store {
  // Canonical initial state. clearAll() resets to this so types never
  // break (null stays null, [] stays [], etc.).
  static DEFAULT_STATE = {
    user: null,
    isAuthenticated: false,
    currentPage: 'login',
    selectedDisease: null,
    theme: 'light',
    sidebarOpen: window.innerWidth > 768,
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
    latestAnalysis: null,
    analysisHistory: [],
    isAnalyzing: false,
    recommendations: [],
    actionItems: [],
    nutritionLog: [],
    apiUsage: [],
    adminMode: false,
    selectedModel: 'claude-opus-4-6',
    customPrompts: {},
    dashboardLayout: 'default',
    affiliateConfig: {},
    notifications: [],
    unreadCount: 0
  };

  constructor() {
    this.state = Object.assign({}, Store.DEFAULT_STATE);
    this.listeners = new Map();
    this._currentUid = null;
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
    if (!Store.PERSIST_KEYS.includes(key)) return;
    try {
      localStorage.setItem('cc_' + key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('[Store] quota exceeded for', key, '— evicting old data');
        this._evictOldData();
        try {
          localStorage.setItem('cc_' + key, JSON.stringify(value));
        } catch (e2) {
          console.error('[Store] still exceeded after eviction for', key);
        }
      } else {
        console.warn('Storage save failed:', e);
      }
    }
  }

  _evictOldData() {
    var evictable = ['analysisHistory', 'cachedResearch', 'cachedActions',
      'researchResults', 'apiUsage', 'applicationLog', 'deepAnalyses'];
    for (var i = 0; i < evictable.length; i++) {
      var k = 'cc_' + evictable[i];
      if (localStorage.getItem(k)) {
        var size = (localStorage.getItem(k) || '').length;
        localStorage.removeItem(k);
        if (Array.isArray(this.state[evictable[i]])) this.state[evictable[i]] = [];
        console.log('[Store] evicted', evictable[i], '(' + Math.round(size/1024) + 'KB)');
        return;
      }
    }
    // If evictable keys are empty, trim large arrays (keep last 50)
    var trimmable = ['conversationHistory', 'textEntries', 'symptoms', 'vitals'];
    for (var j = 0; j < trimmable.length; j++) {
      var arr = this.state[trimmable[j]];
      if (Array.isArray(arr) && arr.length > 50) {
        this.state[trimmable[j]] = arr.slice(-50);
        localStorage.setItem('cc_' + trimmable[j], JSON.stringify(this.state[trimmable[j]]));
        console.log('[Store] trimmed', trimmable[j], 'to 50 entries');
        return;
      }
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
        console.warn('[Store] corrupt data for', key, '- resetting to default');
        localStorage.removeItem(`cc_${key}`);
      }
    });
    if (savedVersion < Store.SCHEMA_VERSION) {
      this._runMigrations(savedVersion);
      localStorage.setItem('cc_schema_version', String(Store.SCHEMA_VERSION));
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
  // Device-level keys that survive logout (not per-user data).
  static PRESERVE_KEYS = [
    'firebase_config', 'anthropic_proxy_url', 'anthropic_mode',
    'admin_emails', 'enable_shared_guest_ai',
    'apikey_anthropic', 'apikey_openai', 'apikey_google',
    'ics_calendar_url', 'google_calendar_oauth_connected',
    'fitbit_token', 'fitbit_client_id', 'fitbit_refresh_token',
    'apple_health_last_import', 'plaud_email',
    'cc_schema_version', 'cc_language', 'cc_migration_v2_done',
  ];

  clearAll() {
    // Preserve device-level config across logout
    var preserved = {};
    Store.PRESERVE_KEYS.forEach(function(k) {
      var v = localStorage.getItem(k);
      if (v !== null) preserved[k] = v;
    });

    // Remove all cc_ prefixed keys (user data)
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith('cc_')) toRemove.push(k);
    }
    toRemove.forEach(function(k) { localStorage.removeItem(k); });

    // Restore preserved keys
    Object.keys(preserved).forEach(function(k) { localStorage.setItem(k, preserved[k]); });

    // Reset in-memory state to exact DEFAULT_STATE (type-safe)
    var defaults = Store.DEFAULT_STATE;
    for (var key in this.state) {
      if (key in defaults) {
        var def = defaults[key];
        this.state[key] = Array.isArray(def) ? [] :
          (def !== null && typeof def === 'object') ? Object.assign({}, def) :
          def;
      } else {
        this.state[key] = undefined;
      }
    }

    this._currentUid = null;
    console.log('[Store] clearAll: user data cleared, device config preserved');
  }

  // Switch localStorage namespace when a different user logs in.
  // Prevents data from user A leaking to user B on the same device.
  switchUser(uid) {
    if (!uid || uid === this._currentUid) return;
    // Save current user's data under their prefix
    if (this._currentUid) {
      Store.PERSIST_KEYS.forEach(function(key) {
        var v = localStorage.getItem('cc_' + key);
        if (v !== null) localStorage.setItem('cc_' + this._currentUid + '_' + key, v);
      }.bind(this));
    }
    // Clear generic cc_ keys
    Store.PERSIST_KEYS.forEach(function(key) {
      localStorage.removeItem('cc_' + key);
    });
    // Restore new user's data if it exists
    var restored = 0;
    Store.PERSIST_KEYS.forEach(function(key) {
      var v = localStorage.getItem('cc_' + uid + '_' + key);
      if (v !== null) {
        localStorage.setItem('cc_' + key, v);
        restored++;
      }
    });
    this._currentUid = uid;
    if (restored > 0) {
      this.loadFromStorage();
      console.log('[Store] switchUser: restored', restored, 'keys for', uid.substring(0, 8));
    }
  }
};

var store = new Store();


