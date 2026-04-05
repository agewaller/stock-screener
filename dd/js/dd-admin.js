/* ============================================
   DD Admin - Prompt Management Panel
   ============================================ */

const DDAdmin = {
  _selectedPromptId: null,

  render() {
    const t = DDi18n.t.bind(DDi18n);
    const prompts = DDStore.get('prompts');
    const isAdmin = DDAuth.isAdmin();

    if (!isAdmin) {
      return `
        <div class="container" style="padding-top:40px;">
          <div class="empty-state">
            <div class="empty-icon">&#x1F512;</div>
            <h3>Admin Access Required</h3>
            <p>Only administrators can access prompt management.</p>
          </div>
        </div>`;
    }

    const selectedId = this._selectedPromptId || (prompts[0]?.id || '');
    const selectedPrompt = prompts.find(p => p.id === selectedId);

    return `
      <div class="container-wide" style="padding-top:32px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div>
            <h2>${t('admin.title')}</h2>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:4px;">
              Configure up to 10 due diligence prompts for different domains
            </p>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="DDAdmin.exportPrompts()">Export All</button>
            <button class="btn btn-secondary btn-sm" onclick="DDAdmin.importPrompts()">Import</button>
          </div>
        </div>

        <div class="admin-grid">
          <!-- Sidebar: Prompt List -->
          <div class="admin-sidebar">
            <div style="margin-bottom:12px; font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em; padding:0 4px;">
              DD Prompts (${prompts.length}/10)
            </div>
            <div class="admin-prompt-list">
              ${prompts.map((p, i) => `
                <div class="admin-prompt-item ${p.id === selectedId ? 'active' : ''}"
                     onclick="DDAdmin.selectPrompt('${p.id}')">
                  <span class="prompt-idx">${i + 1}</span>
                  <div>
                    <div style="font-weight:500;">${p.icon || ''} ${p.nameJa || p.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">
                      ${p.content ? (p.content.length + ' chars') : 'Empty'}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Editor -->
          <div class="admin-editor">
            ${selectedPrompt ? this._renderEditor(selectedPrompt) : '<div class="empty-state"><p>Select a prompt to edit</p></div>'}
          </div>
        </div>

        <!-- System Settings Section -->
        <div class="card" style="margin-top:24px;">
          <div class="card-header">
            <h3 class="card-title">${t('admin.settings')}</h3>
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">
            <div class="form-group">
              <label class="label">Admin Email(s)</label>
              <input class="input" value="${DDConfig.adminEmails.join(', ')}"
                     onchange="DDAdmin.updateAdminEmails(this.value)"
                     placeholder="admin@example.com, admin2@example.com">
            </div>
            <div class="form-group">
              <label class="label">PayPal Plan ID</label>
              <input class="input" value="${DDConfig.paypal.planId}"
                     onchange="DDAdmin.updatePaypalPlan(this.value)"
                     placeholder="P-XXXXXXXXXXXX">
            </div>
            <div class="form-group">
              <label class="label">Monthly Price (USD)</label>
              <input class="input" type="number" value="${DDConfig.paypal.monthlyPrice}"
                     onchange="DDConfig.paypal.monthlyPrice = parseFloat(this.value)">
            </div>
          </div>
          <!-- Sample Report Management -->
          <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:20px;">
            <h4 style="margin-bottom:12px; font-size:0.9rem;">Sample Reports for Landing Page</h4>
            ${this._renderSampleReportManager()}
          </div>
        </div>
      </div>`;
  },

  _renderEditor(prompt) {
    const t = DDi18n.t.bind(DDi18n);
    return `
      <div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="label">${t('admin.prompt.name')} (EN)</label>
            <input class="input" id="prompt-name-en" value="${this._escapeHtml(prompt.name)}"
                   onchange="DDAdmin.updateField('${prompt.id}', 'name', this.value)">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="label">${t('admin.prompt.name')} (JA)</label>
            <input class="input" id="prompt-name-ja" value="${this._escapeHtml(prompt.nameJa || '')}"
                   onchange="DDAdmin.updateField('${prompt.id}', 'nameJa', this.value)">
          </div>
        </div>

        <div class="form-group">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;">${t('admin.prompt.content')}</label>
            <span style="font-size:0.7rem; color:var(--text-dim); font-family:var(--font-mono);">
              <span id="prompt-char-count">${(prompt.content || '').length}</span> chars
            </span>
          </div>
          <textarea class="textarea" id="prompt-content"
                    style="min-height:450px; font-family:var(--font-mono); font-size:0.8rem; line-height:1.7;"
                    oninput="document.getElementById('prompt-char-count').textContent = this.value.length"
          >${this._escapeHtml(prompt.content || '')}</textarea>
        </div>

        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn btn-danger btn-sm" onclick="DDAdmin.resetPrompt('${prompt.id}')">
            ${t('admin.prompt.reset')}
          </button>
          <button class="btn btn-primary" onclick="DDAdmin.savePrompt('${prompt.id}')">
            ${t('admin.prompt.save')}
          </button>
        </div>
      </div>`;
  },

  _renderSampleReportManager() {
    const reports = DDStore.get('reports');
    const sampleIds = DDStore.get('sampleReports') || [];

    if (reports.length === 0) {
      return '<p style="color:var(--text-dim); font-size:0.85rem;">No reports yet. Generate reports from the dashboard first.</p>';
    }

    return `
      <div style="display:grid; gap:8px;">
        ${reports.map(r => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--surface2); border-radius:var(--radius); font-size:0.85rem;">
            <span><strong>${this._escapeHtml(r.company)}</strong> - ${r.promptName || 'N/A'} (${new Date(r.createdAt).toLocaleDateString()})</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" ${sampleIds.includes(r.id) ? 'checked' : ''}
                     onchange="DDStore.toggleSampleReport('${r.id}'); DDApp.render();">
              Public
            </label>
          </div>
        `).join('')}
      </div>`;
  },

  selectPrompt(id) {
    this._selectedPromptId = id;
    DDApp.render();
  },

  savePrompt(id) {
    const content = document.getElementById('prompt-content')?.value || '';
    const nameEn = document.getElementById('prompt-name-en')?.value || '';
    const nameJa = document.getElementById('prompt-name-ja')?.value || '';

    DDStore.updatePrompt(id, { content, name: nameEn, nameJa });
    DDApp.showToast('Prompt saved successfully', 'success');
  },

  updateField(id, field, value) {
    DDStore.updatePrompt(id, { [field]: value });
  },

  resetPrompt(id) {
    if (confirm('Reset this prompt to default? This cannot be undone.')) {
      DDStore.updatePrompt(id, { content: '', isDefault: true });
      DDApp.render();
      DDApp.showToast('Prompt reset to default', 'info');
    }
  },

  exportPrompts() {
    const prompts = DDStore.get('prompts');
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dd-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  },

  importPrompts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) {
            DDStore.set('prompts', imported);
            DDApp.render();
            DDApp.showToast('Prompts imported successfully', 'success');
          }
        } catch (err) {
          DDApp.showToast('Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  updateAdminEmails(value) {
    DDConfig.adminEmails = value.split(',').map(e => e.trim()).filter(Boolean);
  },

  updatePaypalPlan(value) {
    DDConfig.paypal.planId = value;
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
