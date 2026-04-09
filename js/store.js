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

  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  notify(key, value, old) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => cb(value, old));
    }
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => cb(key, value, old));
    }
  }

  // Persistence
  saveToStorage(key, value) {
    const persistKeys = [
      'user', 'isAuthenticated',
      'theme', 'selectedDisease', 'selectedModel', 'customPrompts',
      'dashboardLayout', 'affiliateConfig', 'symptoms', 'vitals',
      'bloodTests', 'medications', 'supplements', 'meals', 'sleepData',
      'activityData', 'healthScore', 'analysisHistory', 'recommendations',
      'actionItems', 'conversationHistory', 'textEntries', 'selectedDiseases', 'customDiseaseName', 'userProfile', 'calendarEvents', 'latestFeedback', 'cachedResearch', 'aiComments', 'integrationSyncs', 'nutritionLog'
    ];
    if (persistKeys.includes(key)) {
      try {
        localStorage.setItem(`cc_${key}`, JSON.stringify(value));
      } catch (e) {
        console.warn('Storage save failed:', e);
      }
    }
  }

  loadFromStorage() {
    const keys = [
      'user', 'isAuthenticated',
      'theme', 'selectedDisease', 'selectedModel', 'customPrompts',
      'dashboardLayout', 'affiliateConfig', 'symptoms', 'vitals',
      'bloodTests', 'medications', 'supplements', 'meals', 'sleepData',
      'activityData', 'healthScore', 'analysisHistory', 'recommendations',
      'actionItems', 'conversationHistory', 'textEntries', 'selectedDiseases', 'customDiseaseName', 'userProfile', 'calendarEvents', 'latestFeedback', 'cachedResearch', 'aiComments', 'integrationSyncs', 'nutritionLog'
    ];
    keys.forEach(key => {
      try {
        const val = localStorage.getItem(`cc_${key}`);
        if (val !== null) {
          this.state[key] = JSON.parse(val);
        }
      } catch (e) {
        // ignore parse errors
      }
    });
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

  // Clear user data (preserve system config like Firebase settings)
  clearAll() {
    // Save system config before clearing
    const firebaseConfig = localStorage.getItem('firebase_config');
    const proxyUrl = localStorage.getItem('anthropic_proxy_url');
    const adminEmails = localStorage.getItem('admin_emails');
    const apiKeys = {
      anthropic: localStorage.getItem('apikey_anthropic'),
      openai: localStorage.getItem('apikey_openai'),
      google: localStorage.getItem('apikey_google'),
    };

    localStorage.clear();

    // Restore system config
    if (firebaseConfig) localStorage.setItem('firebase_config', firebaseConfig);
    if (proxyUrl) localStorage.setItem('anthropic_proxy_url', proxyUrl);
    if (adminEmails) localStorage.setItem('admin_emails', adminEmails);
    Object.entries(apiKeys).forEach(([k, v]) => { if (v) localStorage.setItem('apikey_' + k, v); });

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
