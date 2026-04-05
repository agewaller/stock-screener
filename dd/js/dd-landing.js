/* ============================================
   DD Landing - Landing Page & Sample Reports
   ============================================ */

const DDLanding = {
  _viewingSampleId: null,

  render() {
    const t = DDi18n.t.bind(DDi18n);

    return `
      <!-- Hero -->
      <div class="landing-hero">
        <h1>${t('landing.title')}</h1>
        <p class="subtitle">${t('landing.subtitle')}</p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" onclick="DDAuth.signInWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:6px;"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            ${t('landing.cta')}
          </button>
          <button class="btn btn-secondary btn-lg" onclick="DDLanding.scrollToSamples()">
            ${t('landing.sample')}
          </button>
        </div>
      </div>

      <!-- Features -->
      <div class="container">
        <div class="landing-features">
          <div class="landing-feature">
            <div class="feat-icon">&#x1F50D;</div>
            <h3>${t('landing.feat1.title')}</h3>
            <p>${t('landing.feat1.desc')}</p>
          </div>
          <div class="landing-feature">
            <div class="feat-icon">&#x1F30E;</div>
            <h3>${t('landing.feat2.title')}</h3>
            <p>${t('landing.feat2.desc')}</p>
          </div>
          <div class="landing-feature">
            <div class="feat-icon">&#x1F916;</div>
            <h3>${t('landing.feat3.title')}</h3>
            <p>${t('landing.feat3.desc')}</p>
          </div>
          <div class="landing-feature">
            <div class="feat-icon">&#x1F4C8;</div>
            <h3>${t('landing.feat4.title')}</h3>
            <p>${t('landing.feat4.desc')}</p>
          </div>
        </div>

        <!-- Pricing -->
        <div class="landing-pricing">
          <h2>${t('landing.pricing.title')}</h2>
          <div class="pricing-card">
            <div style="font-size:0.8rem; color:var(--accent-light); font-weight:600; margin-bottom:8px;">PRO PLAN</div>
            <div class="pricing-amount">${t('landing.pricing.price')}<span>${t('landing.pricing.period')}</span></div>
            <ul class="pricing-features">
              <li>${t('landing.pricing.f1')}</li>
              <li>${t('landing.pricing.f2')}</li>
              <li>${t('landing.pricing.f3')}</li>
              <li>${t('landing.pricing.f4')}</li>
              <li>${t('landing.pricing.f5')}</li>
              <li>${t('landing.pricing.f6')}</li>
            </ul>
            <button class="btn btn-gold btn-lg" style="width:100%;" onclick="DDAuth.signInWithGoogle()">
              ${t('landing.pricing.cta')}
            </button>
            <div id="landing-paypal-btn" style="margin-top:16px;"></div>
          </div>
        </div>

        <!-- Sample Reports -->
        <div class="sample-reports" id="sample-reports">
          <h2>${t('landing.samples.title')}</h2>
          ${this._renderSampleCards()}
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>${DDConfig.app.name} v${DDConfig.app.version} &copy; ${new Date().getFullYear()}</p>
      </div>

      <!-- Sample Viewer Overlay -->
      ${this._renderSampleViewer()}
    `;
  },

  _renderSampleCards() {
    const samples = DDStore.getSampleReports();

    if (samples.length === 0) {
      return `
        <div style="text-align:center; padding:40px; color:var(--text-dim);">
          <p>Sample reports will appear here once published by administrators.</p>
          <p style="margin-top:8px; font-size:0.85rem;">Sign up and generate your first report to see the full power of AI Due Diligence.</p>
        </div>`;
    }

    return `
      <div class="sample-grid">
        ${samples.map(r => {
          const action = r.action || 'WATCH';
          const excerpt = (r.content || '').substring(0, 200).replace(/[#*\n]/g, ' ').trim();
          return `
            <div class="sample-card" onclick="DDLanding.viewSample('${r.id}')">
              <div class="sample-card-header">
                <span class="sample-card-company">${this._escapeHtml(r.company)}</span>
                <span class="sample-card-badge">${r.promptName || 'Business DD'}</span>
              </div>
              <div class="sample-card-body">
                <p>${this._escapeHtml(excerpt)}...</p>
              </div>
              <div class="sample-card-scores">
                <div class="sample-score">
                  <div class="score-val">${r.valueScore || '-'}</div>
                  <div class="score-lbl">Value</div>
                </div>
                <div class="sample-score">
                  <div class="score-val">${r.changeScore || '-'}</div>
                  <div class="score-lbl">Change</div>
                </div>
                <div class="sample-score">
                  <div class="score-val">${r.confidenceScore || '-'}</div>
                  <div class="score-lbl">Confidence</div>
                </div>
                <div class="sample-score">
                  <div class="score-val action-${action.toLowerCase()}" style="font-size:0.9rem;">${action}</div>
                  <div class="score-lbl">Action</div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  },

  _renderSampleViewer() {
    if (!this._viewingSampleId) return '';

    const report = DDStore.getReport(this._viewingSampleId);
    if (!report) return '';

    return `
      <div class="sample-viewer-overlay open" id="sample-viewer">
        <div class="sample-viewer-bar">
          <div style="display:flex; align-items:center; gap:12px;">
            <button class="btn btn-ghost btn-sm" onclick="DDLanding.closeSampleViewer()">
              &larr; Back
            </button>
            <span style="font-weight:600;">${this._escapeHtml(report.company)} - Sample Report</span>
            <span class="badge badge-free">SAMPLE</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="DDLanding.closeSampleViewer(); DDAuth.signInWithGoogle();">
            Sign up for full access
          </button>
        </div>
        <div style="padding:32px 24px;">
          ${DDReports.renderPublicReport(report)}
        </div>
      </div>`;
  },

  viewSample(id) {
    this._viewingSampleId = id;
    DDApp.render();
  },

  closeSampleViewer() {
    this._viewingSampleId = null;
    DDApp.render();
  },

  scrollToSamples() {
    const el = document.getElementById('sample-reports');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
