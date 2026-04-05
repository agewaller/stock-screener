/* ============================================
   DD App - Main Application Controller
   ============================================ */

const DDApp = {
  _currentPage: 'landing',
  _analysisState: null, // null | { phase, progress, text, company, promptId }

  init() {
    DDAuth.init();
    DDi18n.init();

    // Check auth state and set initial page
    const user = DDStore.get('user');
    if (user) {
      this._currentPage = 'dashboard';
    }

    this.render();
  },

  // Navigation
  navigate(page) {
    this._currentPage = page;
    DDPayment.resetRenderState();
    this.render();
    window.scrollTo(0, 0);
  },

  // Full app render
  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = this._renderNavbar() + this._renderPage() + this._renderToastContainer();

    // Post-render hooks
    if (this._currentPage === 'landing') {
      // Render PayPal button on landing if container exists
      setTimeout(() => DDPayment.renderButton('landing-paypal-btn'), 100);
    }
    if (this._currentPage === 'subscription') {
      setTimeout(() => DDPayment.renderButton('subscribe-paypal-btn'), 100);
    }
  },

  // Navbar
  _renderNavbar() {
    const t = DDi18n.t.bind(DDi18n);
    const user = DDStore.get('user');
    const isAdmin = DDAuth.isAdmin();
    const isSubscribed = DDStore.isSubscribed();
    const currentLang = DDi18n.getLang();
    const langs = DDi18n.getAvailableLanguages();

    return `
      <nav class="navbar">
        <div class="navbar-inner">
          <a class="navbar-brand" href="#" onclick="DDApp.navigate(user ? 'dashboard' : 'landing'); return false;">
            <div class="logo-mark">VM</div>
            <span>VM Due Diligence</span>
          </a>

          ${user ? `
            <div class="navbar-nav">
              <a class="${this._currentPage === 'dashboard' ? 'active' : ''}"
                 onclick="DDApp.navigate('dashboard')">${t('nav.dashboard')}</a>
              <a class="${this._currentPage === 'reports' ? 'active' : ''}"
                 onclick="DDApp.navigate('reports')">${t('nav.reports')}</a>
              ${isAdmin ? `
                <a class="${this._currentPage === 'admin' ? 'active' : ''}"
                   onclick="DDApp.navigate('admin')">${t('nav.admin')}</a>
              ` : ''}
              <a class="${this._currentPage === 'settings' ? 'active' : ''}"
                 onclick="DDApp.navigate('settings')">${t('nav.settings')}</a>
            </div>
          ` : '<div></div>'}

          <div class="navbar-actions">
            <select class="lang-select" onchange="DDi18n.setLang(this.value); DDApp.render();">
              ${langs.map(l => `<option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>${l.name}</option>`).join('')}
            </select>

            ${user ? `
              ${!isSubscribed ? `<button class="btn btn-gold btn-sm" onclick="DDApp.navigate('subscription')">${t('nav.subscribe')}</button>` : ''}
              <div class="user-pill">
                ${user.photoURL ? `<img src="${user.photoURL}" alt="">` : `<div style="width:28px;height:28px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:#fff;">${(user.displayName || 'U')[0]}</div>`}
                <span>${user.displayName || user.email}</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="DDAuth.signOut()">${t('nav.logout')}</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="DDAuth.signInWithGoogle()">${t('nav.login')}</button>
            `}
          </div>
        </div>
      </nav>`;
  },

  // Page router
  _renderPage() {
    const user = DDStore.get('user');

    switch (this._currentPage) {
      case 'landing':
        return DDLanding.render();
      case 'dashboard':
        return user ? this._renderDashboard() : DDLanding.render();
      case 'reports':
        return user ? DDReports.render() : DDLanding.render();
      case 'admin':
        return user ? DDAdmin.render() : DDLanding.render();
      case 'settings':
        return user ? this._renderSettings() : DDLanding.render();
      case 'subscription':
        return user ? this._renderSubscription() : DDLanding.render();
      default:
        return DDLanding.render();
    }
  },

  // Dashboard page
  _renderDashboard() {
    const t = DDi18n.t.bind(DDi18n);
    const prompts = DDStore.get('prompts') || [];
    const models = DDConfig.aiModels;
    const selectedModel = DDStore.get('selectedModel');
    const outputLangs = DDi18n.getOutputLanguages();
    const outputLang = DDStore.get('outputLang');
    const isSubscribed = DDStore.isSubscribed();

    return `
      <div class="container-wide" style="padding-top:24px;">
        ${!isSubscribed ? `
          <div style="background:rgba(253,203,110,0.08); border:1px solid rgba(253,203,110,0.2); border-radius:var(--radius); padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between;">
            <span style="color:var(--gold); font-size:0.9rem;">Subscribe to unlock unlimited DD reports ($50/month)</span>
            <button class="btn btn-gold btn-sm" onclick="DDApp.navigate('subscription')">Subscribe Now</button>
          </div>
        ` : ''}

        <!-- Search Box -->
        <div class="dashboard-search">
          <h2>${t('dash.search.title')}</h2>
          <p>${t('dash.search.desc')}</p>

          <div class="search-row">
            <input class="input input-lg" id="company-input" type="text"
                   placeholder="${t('dash.search.placeholder')}"
                   onkeydown="if(event.key==='Enter') DDApp.startAnalysis()">
            <button class="btn btn-primary btn-lg" onclick="DDApp.startAnalysis()" id="analyze-btn">
              ${t('dash.search.btn')}
            </button>
          </div>

          <!-- Prompt tabs -->
          <div class="prompt-tabs" id="prompt-tabs">
            ${prompts.filter(p => p.content).map(p => `
              <button class="prompt-tab ${p.id === (this._selectedPrompt || prompts.find(pp => pp.content)?.id) ? 'active' : ''}"
                      onclick="DDApp.selectPrompt('${p.id}')">
                ${p.icon || ''} ${DDi18n.getLang() === 'ja' ? (p.nameJa || p.name) : p.name}
              </button>
            `).join('')}
            ${prompts.filter(p => p.content).length === 0 ? `
              <div style="color:var(--text-dim); font-size:0.85rem; padding:8px;">
                No prompts configured. <a href="#" onclick="DDApp.navigate('admin'); return false;" style="color:var(--accent-light);">Set up prompts in Admin</a>
              </div>
            ` : ''}
          </div>

          <!-- Model & Language Selection -->
          <div class="model-select-row">
            <div>
              <label class="label">${t('dash.model')}</label>
              <select class="select" onchange="DDStore.set('selectedModel', this.value)">
                ${models.map(m => `<option value="${m.id}" ${m.id === selectedModel ? 'selected' : ''}>${m.name} — ${m.description}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">${t('dash.lang')}</label>
              <select class="select" onchange="DDStore.set('outputLang', this.value)">
                ${outputLangs.map(l => `<option value="${l.code}" ${l.code === outputLang ? 'selected' : ''}>${l.name}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Analysis Progress (shown during analysis) -->
        ${this._analysisState ? this._renderAnalysisProgress() : ''}

        <!-- Recent Reports -->
        <div style="margin-top:32px;">
          <h3 style="margin-bottom:16px;">${t('dash.history')}</h3>
          ${this._renderRecentReports()}
        </div>
      </div>`;
  },

  _renderAnalysisProgress() {
    const s = this._analysisState;
    return `
      <div class="analysis-progress">
        <div class="progress-spinner"></div>
        <h3>${s.company} - ${DDi18n.t('dash.analyzing')}</h3>
        <p class="progress-text">${s.phase || ''}</p>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width:${s.progress || 10}%"></div>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-danger btn-sm" onclick="DDApp.cancelAnalysis()">Cancel</button>
        </div>
        <div class="stream-output" id="stream-output" style="margin-top:16px; max-height:400px;">${s.text || ''}</div>
      </div>`;
  },

  _renderRecentReports() {
    const reports = (DDStore.get('reports') || []).slice(0, 10);
    if (reports.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">&#x1F4CA;</div>
          <p>No reports yet. Enter a company name above to generate your first DD report.</p>
        </div>`;
    }

    return `
      <div class="report-list">
        ${reports.map(r => `
          <div class="report-list-item" onclick="DDReports.viewReport('${r.id}'); DDApp.navigate('reports');">
            <div class="report-list-meta">
              <div>
                <div class="report-list-company">${this._escapeHtml(r.company)}</div>
                <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
                  ${r.promptName || 'N/A'} | ${r.model || 'N/A'}
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="report-list-date">${new Date(r.createdAt).toLocaleString()}</span>
              ${r.action ? `<span class="report-list-action action-${r.action.toLowerCase()}">${r.action}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
  },

  // Settings page
  _renderSettings() {
    const t = DDi18n.t.bind(DDi18n);
    const sub = DDStore.get('subscription');
    const isSubscribed = DDStore.isSubscribed();

    return `
      <div class="container" style="padding-top:32px;">
        <h2>${t('settings.title')}</h2>

        <div class="settings-grid">
          <!-- API Keys -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${t('settings.api.title')}</h3>
            </div>
            ${['anthropic', 'openai', 'google', 'deepseek', 'xai'].map(provider => `
              <div class="form-group">
                <label class="label">${t('settings.api.' + provider)}</label>
                <input class="input" type="password" value="${DDStore.getApiKey(provider)}"
                       placeholder="sk-..."
                       onchange="DDStore.setApiKey('${provider}', this.value)">
              </div>
            `).join('')}
            <p style="font-size:0.75rem; color:var(--text-dim); margin-top:8px;">
              API keys are stored locally in your browser. They are never sent to our servers.
            </p>
          </div>

          <!-- Subscription -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${t('settings.subscription')}</h3>
            </div>
            <div class="sub-status ${isSubscribed ? 'sub-active' : 'sub-inactive'}">
              ${isSubscribed ? t('settings.sub.active') : t('settings.sub.inactive')}
            </div>
            ${isSubscribed ? `
              <div style="margin-top:16px;">
                <p style="font-size:0.85rem; color:var(--text-secondary);">
                  Subscription ID: <code>${sub.paypalSubscriptionId || 'N/A'}</code><br>
                  Expires: ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'N/A'}
                </p>
                <div style="margin-top:12px; display:flex; gap:8px;">
                  <button class="btn btn-secondary btn-sm" onclick="window.open('https://www.paypal.com/myaccount/autopay/', '_blank')">
                    ${t('settings.sub.manage')}
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="DDPayment.cancelSubscription()">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            ` : `
              <div style="margin-top:16px;">
                <button class="btn btn-gold" onclick="DDApp.navigate('subscription')">
                  Subscribe ($50/month)
                </button>
              </div>
            `}
          </div>

          <!-- Account -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Account</h3>
            </div>
            ${DDAuth.isLoggedIn() ? `
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                ${DDStore.get('user')?.photoURL ? `<img src="${DDStore.get('user').photoURL}" style="width:48px;height:48px;border-radius:50%;">` : ''}
                <div>
                  <div style="font-weight:600;">${DDStore.get('user')?.displayName || 'User'}</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary);">${DDStore.get('user')?.email || ''}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="DDAuth.signOut()">Sign Out</button>
            ` : ''}
          </div>

          <!-- Data Management -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Data Management</h3>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="DDApp.exportAllData()">Export All Data</button>
              <button class="btn btn-secondary btn-sm" onclick="DDApp.importData()">Import Data</button>
              <button class="btn btn-danger btn-sm" onclick="DDApp.clearAllData()">Clear All Data</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  // Subscription page
  _renderSubscription() {
    const t = DDi18n.t.bind(DDi18n);
    const isSubscribed = DDStore.isSubscribed();

    if (isSubscribed) {
      return `
        <div class="container" style="padding-top:60px; text-align:center;">
          <h2 style="color:var(--success);">&#x2713; Active Subscription</h2>
          <p style="color:var(--text-secondary); margin:16px 0;">You have full access to all DD features.</p>
          <button class="btn btn-primary" onclick="DDApp.navigate('dashboard')">Go to Dashboard</button>
        </div>`;
    }

    return `
      <div class="container" style="padding-top:40px;">
        <div class="pricing-card" style="max-width:480px;">
          <div style="font-size:0.8rem; color:var(--accent-light); font-weight:600; margin-bottom:8px;">PRO PLAN</div>
          <div class="pricing-amount">$50<span>/month</span></div>
          <ul class="pricing-features">
            <li>${t('landing.pricing.f1')}</li>
            <li>${t('landing.pricing.f2')}</li>
            <li>${t('landing.pricing.f3')}</li>
            <li>${t('landing.pricing.f4')}</li>
            <li>${t('landing.pricing.f5')}</li>
            <li>${t('landing.pricing.f6')}</li>
          </ul>
          <div id="subscribe-paypal-btn" style="margin-top:20px;"></div>
        </div>
      </div>`;
  },

  // Prompt selection
  _selectedPrompt: null,

  selectPrompt(id) {
    this._selectedPrompt = id;
    // Re-render just the prompt tabs
    const tabs = document.getElementById('prompt-tabs');
    if (tabs) {
      const prompts = DDStore.get('prompts') || [];
      tabs.querySelectorAll('.prompt-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('onclick')?.includes(id));
      });
    }
    // Visual update without full re-render
    document.querySelectorAll('.prompt-tab').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('onclick')?.includes(id)) el.classList.add('active');
    });
  },

  // Start analysis
  async startAnalysis() {
    const companyInput = document.getElementById('company-input');
    const company = companyInput?.value?.trim();
    if (!company) {
      this.showToast('Please enter a company name', 'info');
      return;
    }

    // Check subscription
    if (!DDStore.isSubscribed()) {
      this.showToast('Please subscribe to use the analysis feature', 'info');
      this.navigate('subscription');
      return;
    }

    // Get selected prompt
    const prompts = DDStore.get('prompts') || [];
    const promptId = this._selectedPrompt || prompts.find(p => p.content)?.id;
    if (!promptId) {
      this.showToast('No prompts configured. Please set up prompts in Admin.', 'error');
      return;
    }

    const prompt = DDStore.getPrompt(promptId);
    if (!prompt?.content) {
      this.showToast('Selected prompt is empty. Configure it in Admin.', 'error');
      return;
    }

    // Check API key
    const model = DDConfig.aiModels.find(m => m.id === DDStore.get('selectedModel'));
    if (!model) {
      this.showToast('Please select a valid AI model', 'error');
      return;
    }
    if (!DDStore.getApiKey(model.provider)) {
      this.showToast(`Please set your ${model.provider} API key in Settings`, 'error');
      this.navigate('settings');
      return;
    }

    // Start analysis
    this._analysisState = {
      company,
      promptId,
      phase: DDi18n.t('dash.step1'),
      progress: 10,
      text: ''
    };
    this.render();

    try {
      const result = await DDEngine.analyze(company, promptId, {
        model: DDStore.get('selectedModel'),
        outputLang: DDStore.get('outputLang'),
        onChunk: (chunk, fullText) => {
          // Update streaming output
          const outputEl = document.getElementById('stream-output');
          if (outputEl) {
            outputEl.textContent = fullText.slice(-2000); // Show last 2000 chars
            outputEl.scrollTop = outputEl.scrollHeight;
          }
          // Update progress
          const progress = Math.min(95, 10 + (fullText.length / 500));
          const bar = document.querySelector('.progress-bar-fill');
          if (bar) bar.style.width = progress + '%';
        }
      });

      if (result) {
        // Extract action from report
        const actionMatch = result.match(/(?:ACTION|最終ACTION)[：:\s]*(BUY|HOLD|SELL|WATCH)/i);
        const action = actionMatch ? actionMatch[1].toUpperCase() : null;

        // Extract scores
        const valueMatch = result.match(/value[：:\s]*(\d+)/i);
        const changeMatch = result.match(/change[：:\s]*(\d+)/i);
        const confMatch = result.match(/confidence[：:\s]*(\d+)/i);

        const report = DDStore.addReport({
          company,
          promptId,
          promptName: DDi18n.getLang() === 'ja' ? (prompt.nameJa || prompt.name) : prompt.name,
          model: DDStore.get('selectedModel'),
          outputLang: DDStore.get('outputLang'),
          content: result,
          action,
          valueScore: valueMatch ? parseInt(valueMatch[1]) : null,
          changeScore: changeMatch ? parseInt(changeMatch[1]) : null,
          confidenceScore: confMatch ? parseInt(confMatch[1]) : null,
          followUps: []
        });

        this._analysisState = null;
        this.showToast(DDi18n.t('dash.complete'), 'success');

        // Navigate to report
        DDReports.viewReport(report.id);
        this.navigate('reports');
      }
    } catch (e) {
      this.showToast('Analysis failed: ' + e.message, 'error');
    } finally {
      this._analysisState = null;
      this.render();
    }
  },

  cancelAnalysis() {
    DDEngine.abort();
    this._analysisState = null;
    this.render();
  },

  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  _renderToastContainer() {
    return '<div class="toast-container" id="toast-container"></div>';
  },

  // Data management
  exportAllData() {
    const data = {
      reports: DDStore.get('reports'),
      prompts: DDStore.get('prompts'),
      sampleReports: DDStore.get('sampleReports'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vmdd-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.reports) DDStore.set('reports', data.reports);
          if (data.prompts) DDStore.set('prompts', data.prompts);
          if (data.sampleReports) DDStore.set('sampleReports', data.sampleReports);
          this.render();
          this.showToast('Data imported successfully', 'success');
        } catch (err) {
          this.showToast('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  clearAllData() {
    if (confirm('This will delete all reports, prompts, and settings. Are you sure?')) {
      localStorage.removeItem('dd_store');
      DDStore.init();
      this.render();
      this.showToast('All data cleared', 'info');
    }
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => DDApp.init());
// Also init if DOM already loaded
if (document.readyState !== 'loading') DDApp.init();
