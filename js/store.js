// === js/store.js ===
/* ============================================================
   State Management Store
   Simple reactive store for the application.

   User-data isolation (added 2026-05): every persisted entry is
   classified as either DEVICE (one value per browser, e.g. theme,
   the cached "who is logged in" pointer) or USER (everything that
   belongs to a specific account — diary, vitals, settings, etc.).
   USER keys are namespaced in localStorage as `cc_u_<uid>_<key>`
   so multiple accounts sharing a browser never see each other's
   data. The active-user identity is set explicitly by the auth
   layer via `setActiveUser(uid)` / `clearActiveUser()`; the Store
   never guesses identity from cached blobs.
   ============================================================ */
var Store = class Store {
  // Keys that follow user identity. Stored as cc_u_<uid>_<key>.
  static USER_KEYS = [
    'selectedDisease', 'selectedDiseases', 'customDiseaseName',
    'selectedModel', 'customPrompts', 'dashboardLayout', 'affiliateConfig',
    'symptoms', 'vitals', 'bloodTests', 'medications', 'supplements',
    'meals', 'sleepData', 'activityData', 'geneticData', 'photos',
    'wearableData', 'conversationHistory', 'textEntries',
    'healthScore', 'analysisHistory', 'latestAnalysis',
    'recommendations', 'actionItems', 'aiComments',
    'userProfile', 'calendarEvents', 'latestFeedback', 'latestFeedbackError',
    'cachedResearch', 'integrationSyncs', 'nutritionLog',
    'plaudAnalyses', 'apiUsage', 'applicationLog',
    'deepAnalyses', 'deepAnalysisLastRun', 'doctorReports',
    'researchQuery', 'researchDays', 'researchResults',
    'cachedActions'
  ];

  // Keys that are per-device (one value regardless of which account is
  // active). `user` and `isAuthenticated` identify which uid's data to
  // hydrate next — they MUST be device-level for the boot flow to know
  // which namespace to load.
  static DEVICE_KEYS = [
    'user', 'isAuthenticated', 'theme', 'globalProfessionals',
    'mailerUrl', 'mailerSenderName'
  ];

  // Preserved for backward compatibility with anything that reflected
  // on the previous flat PERSIST_KEYS contract.
  static get PERSIST_KEYS() { return [...Store.USER_KEYS, ...Store.DEVICE_KEYS]; }

  // Stable defaults so a uid switch can return USER keys to a clean
  // baseline before hydrating the new uid's cache. Arrays/objects
  // here are templates — they are deep-copied per switch so listeners
  // never share mutable state across users.
  static USER_DEFAULTS = {
    selectedDisease: null,
    selectedDiseases: [],
    customDiseaseName: '',
    selectedModel: 'claude-opus-4-6',
    customPrompts: {},
    dashboardLayout: 'default',
    affiliateConfig: {},
    symptoms: [], vitals: [], bloodTests: [], medications: [], supplements: [],
    meals: [], sleepData: [], activityData: [], geneticData: null, photos: [],
    wearableData: [], conversationHistory: [], textEntries: [],
    healthScore: 0, analysisHistory: [], latestAnalysis: null,
    recommendations: [], actionItems: [], aiComments: {},
    userProfile: null, calendarEvents: [], latestFeedback: null, latestFeedbackError: null,
    cachedResearch: null, integrationSyncs: {}, nutritionLog: [],
    plaudAnalyses: [], apiUsage: [], applicationLog: [],
    deepAnalyses: [], deepAnalysisLastRun: null, doctorReports: [],
    researchQuery: '', researchDays: 30, researchResults: null,
    cachedActions: null
  };

  // Namespace used before the first sign-in (and during signed-out
  // windows). Per-user data written here is kept on the device until a
  // real uid is bound; on first real login we promote any guest cache
  // into that uid's namespace so pre-login disease selection / sample
  // notes are not lost.
  static GUEST_UID = '_guest';

  // Schema version — bumped whenever USER_KEYS / DEVICE_KEYS split
  // semantics change so we know to run a one-shot legacy migration.
  static SCHEMA_VERSION = 3;

  constructor() {
    this.state = this._defaultState();
    this.listeners = new Map();
    this._activeUid = null;
    // Load device-scoped state first so we know which uid was active
    // last (via the cached `user.uid`).
    this._loadDeviceFromStorage();
    this._runSchemaMigrations();
    // Hydrate user-scoped state for whoever was active last on this
    // device. If nobody, fall back to the guest namespace so any
    // pre-login interactions are still persisted.
    const cachedUser = this.state.user;
    const bootUid = (cachedUser && cachedUser.uid) ? cachedUser.uid : Store.GUEST_UID;
    this.setActiveUser(bootUid, { silent: true });
  }

  _defaultState() {
    // Start with USER defaults deep-copied so the in-memory state never
    // shares references with the defaults table (avoids cross-user
    // mutation bugs).
    const state = {};
    Object.entries(Store.USER_DEFAULTS).forEach(([k, v]) => {
      state[k] = Store._cloneDefault(v);
    });
    // Device-level + ephemeral additions.
    Object.assign(state, {
      user: null,
      isAuthenticated: false,
      currentPage: 'login',
      theme: 'light',
      sidebarOpen: (typeof window !== 'undefined' && window.innerWidth > 768),
      isAnalyzing: false,
      adminMode: false,
      notifications: [],
      unreadCount: 0,
      globalProfessionals: [],
      mailerUrl: '',
      mailerSenderName: ''
    });
    return state;
  }

  static _cloneDefault(v) {
    if (Array.isArray(v)) return [];
    if (v && typeof v === 'object') return {};
    return v;
  }

  // ───────── localStorage key helpers ─────────
  _userStorageKey(uid, key) {
    return `cc_u_${uid || Store.GUEST_UID}_${key}`;
  }
  _deviceStorageKey(key) {
    return `cc_${key}`;
  }

  get activeUid() { return this._activeUid; }

  // ───────── boot-time loaders ─────────
  _loadDeviceFromStorage() {
    Store.DEVICE_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(this._deviceStorageKey(key));
        if (raw !== null) this.state[key] = JSON.parse(raw);
      } catch (e) {
        console.warn('[Store] corrupt device key', key, '- resetting');
        localStorage.removeItem(this._deviceStorageKey(key));
      }
    });
  }

  _runSchemaMigrations() {
    const saved = parseInt(localStorage.getItem('cc_schema_version') || '0', 10);
    if (saved >= Store.SCHEMA_VERSION) return;
    try {
      // v2 → v3: legacy unscoped `cc_<userKey>` values move into the
      // namespace of whoever was authenticated when the app last ran.
      // If no user is recorded, they move into the guest namespace so
      // we can still promote them on first real sign-in.
      if (saved < 3) {
        const cachedUser = this.state.user;
        const bindTo = (cachedUser && cachedUser.uid) ? cachedUser.uid : Store.GUEST_UID;
        let moved = 0;
        Store.USER_KEYS.forEach(k => {
          const legacy = this._deviceStorageKey(k);
          const v = localStorage.getItem(legacy);
          if (v === null) return;
          const target = this._userStorageKey(bindTo, k);
          if (localStorage.getItem(target) === null) {
            localStorage.setItem(target, v);
          }
          localStorage.removeItem(legacy);
          moved++;
        });
        if (moved > 0) console.log(`[Store] migrated ${moved} legacy keys → cc_u_${bindTo}_*`);
      }
      localStorage.setItem('cc_schema_version', String(Store.SCHEMA_VERSION));
    } catch (e) {
      console.warn('[Store] schema migration failed:', e);
    }
  }

  // ───────── active-user lifecycle (called by auth layer) ─────────
  /**
   * Bind the store to a specific uid. Resets USER_KEYS to defaults,
   * then hydrates from `cc_u_<uid>_<key>` cache. Listeners are
   * notified so the UI re-renders with the new user's data.
   *
   * Special case: transitioning FROM the guest namespace TO a real uid
   * promotes any guest-scoped cache into the user's namespace (the
   * user expects pre-login disease selection / quick notes to survive
   * sign-up).
   *
   * @param {string|null} uid - Firebase uid, or null/undefined for guest.
   * @param {{silent?: boolean}} opts - When `silent`, skip listener
   *   notifications (used by the constructor before listeners attach).
   */
  setActiveUser(uid, opts = {}) {
    const newUid = uid || Store.GUEST_UID;
    if (newUid === this._activeUid) return;
    const prevUid = this._activeUid;

    // Promote guest cache on first real sign-in.
    if (prevUid === Store.GUEST_UID && newUid !== Store.GUEST_UID) {
      this._promoteGuestCacheTo(newUid);
    }

    this._activeUid = newUid;

    // Reset USER state to clean defaults, then hydrate from this uid's
    // namespace. This is the critical step that prevents cross-user
    // leakage — without it, prevUid's in-memory data would persist.
    Store.USER_KEYS.forEach(k => {
      this.state[k] = Store._cloneDefault(Store.USER_DEFAULTS[k]);
      try {
        const raw = localStorage.getItem(this._userStorageKey(newUid, k));
        if (raw !== null) this.state[k] = JSON.parse(raw);
      } catch (e) {
        console.warn('[Store] corrupt user key', k, 'for', newUid);
        localStorage.removeItem(this._userStorageKey(newUid, k));
      }
    });

    if (!opts.silent) {
      Store.USER_KEYS.forEach(k => this.notify(k, this.state[k]));
      console.log(`[Store] active user: ${prevUid || '<none>'} → ${newUid}`);
    }
  }

  /**
   * Drop the active-user binding without deleting the persisted cache.
   * Called on sign-out so the user's data is hidden from the UI but a
   * future re-login under the same uid restores their dashboard
   * instantly (and Firestore reconciles in the background).
   *
   * Implemented as a switch to the guest namespace, which also resets
   * in-memory state to defaults via setActiveUser's reset path.
   */
  clearActiveUser() {
    this.setActiveUser(Store.GUEST_UID);
    this.state.user = null;
    this.state.isAuthenticated = false;
    try {
      localStorage.removeItem(this._deviceStorageKey('user'));
      localStorage.removeItem(this._deviceStorageKey('isAuthenticated'));
    } catch (_) {}
    this.notify('user', null);
    this.notify('isAuthenticated', false);
  }

  _promoteGuestCacheTo(uid) {
    let moved = 0;
    Store.USER_KEYS.forEach(k => {
      const src = this._userStorageKey(Store.GUEST_UID, k);
      const dst = this._userStorageKey(uid, k);
      const v = localStorage.getItem(src);
      if (v === null) return;
      // Only fill if the user has no value yet — never clobber existing
      // user-scoped state with stale guest data.
      if (localStorage.getItem(dst) === null) {
        localStorage.setItem(dst, v);
        moved++;
      }
      localStorage.removeItem(src);
    });
    if (moved > 0) console.log(`[Store] promoted ${moved} guest entries → cc_u_${uid}_*`);
  }

  // ───────── public state API (unchanged contract) ─────────
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

  // ───────── persistence ─────────
  saveToStorage(key, value) {
    try {
      if (Store.DEVICE_KEYS.includes(key)) {
        localStorage.setItem(this._deviceStorageKey(key), JSON.stringify(value));
        // When the cached active-user pointer changes, mirror that into
        // the runtime activeUid binding so writes that follow land in
        // the right namespace even if the auth layer hasn't called
        // setActiveUser yet.
        if (key === 'user') {
          const newUid = (value && value.uid) ? value.uid : Store.GUEST_UID;
          if (newUid !== this._activeUid) this.setActiveUser(newUid);
        }
      } else if (Store.USER_KEYS.includes(key)) {
        const uid = this._activeUid || Store.GUEST_UID;
        localStorage.setItem(this._userStorageKey(uid, key), JSON.stringify(value));
      }
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

  // Erase the active user's local cache and reset in-memory user state.
  // Device-level config (firebase, integration tokens, theme) is
  // preserved. The previous implementation wiped the entire localStorage
  // (a CLAUDE.md禁則) — which also flattened every OTHER user's cached
  // data on the same browser, so coming back to user A after a
  // temporary user B session forced a full re-fetch from Firestore.
  clearAll() {
    const uid = this._activeUid;
    if (uid) {
      Store.USER_KEYS.forEach(k => {
        try { localStorage.removeItem(this._userStorageKey(uid, k)); } catch (_) {}
      });
    }
    // Reset USER state to defaults.
    Store.USER_KEYS.forEach(k => {
      this.state[k] = Store._cloneDefault(Store.USER_DEFAULTS[k]);
    });
    // Reset device-level auth pointers too — this is a full reset.
    this.state.user = null;
    this.state.isAuthenticated = false;
    this.state.currentPage = 'login';
    try {
      localStorage.removeItem(this._deviceStorageKey('user'));
      localStorage.removeItem(this._deviceStorageKey('isAuthenticated'));
    } catch (_) {}
    this._activeUid = Store.GUEST_UID;
    // Notify everyone that user state has collapsed.
    Store.USER_KEYS.forEach(k => this.notify(k, this.state[k]));
    this.notify('user', null);
    this.notify('isAuthenticated', false);
  }
};

var store = new Store();
