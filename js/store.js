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
    'deepAnalyses', 'deepAnalysisLastRun', 'doctorReports'
  ];

  saveToStorage(key, value) {
    if (Store.PERSIST_KEYS.includes(key)) {
      try {
        localStorage.setItem(`cc_${key}`, JSON.stringify(value));
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          console.error('[Store] localStorage quota exceeded for key:', key);
          if (typeof Components !== 'undefined' && Components.showToast) {
            Components.showToast('端末の保存容量が不足しています。古いデータを削除するか、Firebaseにバックアップしてください。', 'error');
          }
        } else {
          console.warn('Storage save failed:', e);
        }
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
  clearAll() {
    // Save device-level config that survives logout. These are not
    // per-user data — they're per-device integration settings that
    // a user explicitly configured and expects to persist.
    const PRESERVE_KEYS = [
      // System config
      'firebase_config',
      'anthropic_proxy_url',
      'anthropic_mode',
      'admin_emails',
      'enable_shared_guest_ai',
      // API keys (admin-managed, shared across users)
      'apikey_anthropic',
      'apikey_openai',
      'apikey_google',
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
    ];
    const preserved = {};
    PRESERVE_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) preserved[k] = v;
    });

    localStorage.clear();

    // Restore preserved device-level config
    Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));

    Object.keys(this.state).forEach(key => {
      if (Array.isArray(this.state[key])) this.state[key] = [];
      else if (typeof this.state[key] === 'object' && this.state[key] !== null) this.state[key] = {};
    });
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.currentPage = 'login';
    this.state.selectedModel = 'claude-opus-4-6';
  }
};

var store = new Store();


