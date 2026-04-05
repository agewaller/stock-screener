/* ============================================
   DD Store - State Management & Persistence
   ============================================ */

const DDStore = {
  _state: {
    user: null,
    isAdmin: false,
    subscription: { active: false, expiresAt: null, paypalSubscriptionId: null },
    reports: [],
    sampleReports: [],
    prompts: [],
    apiKeys: {},
    selectedModel: 'claude-opus-4-6',
    outputLang: 'ja',
    currentReport: null,
    currentPage: 'landing'
  },

  _listeners: [],

  // Initialize store, load from localStorage
  init() {
    const saved = localStorage.getItem('dd_store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved state (but don't overwrite runtime-only fields)
        this._state.apiKeys = parsed.apiKeys || {};
        this._state.selectedModel = parsed.selectedModel || 'claude-opus-4-6';
        this._state.outputLang = parsed.outputLang || 'ja';
        this._state.reports = parsed.reports || [];
        this._state.prompts = parsed.prompts || [];
        this._state.sampleReports = parsed.sampleReports || [];
      } catch (e) {
        console.warn('Failed to load saved state:', e);
      }
    }
    // Initialize default prompts if empty
    if (this._state.prompts.length === 0) {
      this._initDefaultPrompts();
    }
  },

  _initDefaultPrompts() {
    this._state.prompts = DDConfig.promptCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameJa: cat.nameJa,
      icon: cat.icon,
      content: cat.id === 'business' ? DDDefaultPrompts.business : '',
      isDefault: true,
      updatedAt: new Date().toISOString()
    }));
  },

  // Getters
  get(key) { return this._state[key]; },
  getState() { return { ...this._state }; },

  // Setters
  set(key, value) {
    this._state[key] = value;
    this._persist();
    this._notify(key);
  },

  // Subscribe to changes
  subscribe(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  },

  _notify(key) {
    this._listeners.forEach(fn => fn(key, this._state[key]));
  },

  _persist() {
    const toSave = {
      apiKeys: this._state.apiKeys,
      selectedModel: this._state.selectedModel,
      outputLang: this._state.outputLang,
      reports: this._state.reports,
      prompts: this._state.prompts,
      sampleReports: this._state.sampleReports,
      subscription: this._state.subscription
    };
    localStorage.setItem('dd_store', JSON.stringify(toSave));
  },

  // Reports management
  addReport(report) {
    report.id = report.id || 'rpt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    report.createdAt = report.createdAt || new Date().toISOString();
    this._state.reports.unshift(report);
    this._persist();
    this._notify('reports');
    return report;
  },

  updateReport(id, updates) {
    const idx = this._state.reports.findIndex(r => r.id === id);
    if (idx >= 0) {
      this._state.reports[idx] = { ...this._state.reports[idx], ...updates };
      this._persist();
      this._notify('reports');
    }
  },

  getReport(id) {
    return this._state.reports.find(r => r.id === id);
  },

  deleteReport(id) {
    this._state.reports = this._state.reports.filter(r => r.id !== id);
    this._state.sampleReports = this._state.sampleReports.filter(sid => sid !== id);
    this._persist();
    this._notify('reports');
  },

  // Sample reports
  toggleSampleReport(reportId) {
    const idx = this._state.sampleReports.indexOf(reportId);
    if (idx >= 0) {
      this._state.sampleReports.splice(idx, 1);
    } else {
      this._state.sampleReports.push(reportId);
    }
    this._persist();
    this._notify('sampleReports');
  },

  isSampleReport(reportId) {
    return this._state.sampleReports.includes(reportId);
  },

  getSampleReports() {
    return this._state.sampleReports
      .map(id => this._state.reports.find(r => r.id === id))
      .filter(Boolean);
  },

  // Prompts management
  getPrompt(id) {
    return this._state.prompts.find(p => p.id === id);
  },

  updatePrompt(id, updates) {
    const idx = this._state.prompts.findIndex(p => p.id === id);
    if (idx >= 0) {
      this._state.prompts[idx] = { ...this._state.prompts[idx], ...updates, updatedAt: new Date().toISOString() };
      this._persist();
      this._notify('prompts');
    }
  },

  // API Keys (stored in localStorage, encrypted in production)
  setApiKey(provider, key) {
    this._state.apiKeys[provider] = key;
    this._persist();
  },

  getApiKey(provider) {
    return this._state.apiKeys[provider] || '';
  },

  // Subscription
  setSubscription(sub) {
    this._state.subscription = { ...this._state.subscription, ...sub };
    this._persist();
    this._notify('subscription');
  },

  isSubscribed() {
    const sub = this._state.subscription;
    if (!sub.active) return false;
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return false;
    return true;
  }
};

DDStore.init();
