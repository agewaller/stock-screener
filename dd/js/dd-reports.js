/* ============================================
   DD Reports - Report Rendering & Management
   ============================================ */

const DDReports = {
  _currentView: 'list', // 'list' | 'detail'
  _detailId: null,
  _followUpInProgress: false,

  render() {
    const t = DDi18n.t.bind(DDi18n);

    if (this._currentView === 'detail' && this._detailId) {
      return this._renderDetail(this._detailId);
    }
    return this._renderList();
  },

  _renderList() {
    const t = DDi18n.t.bind(DDi18n);
    const reports = DDStore.get('reports') || [];

    return `
      <div class="container-wide" style="padding-top:32px;">
        <h2>${t('dash.history')}</h2>
        ${reports.length === 0
          ? `<div class="empty-state" style="margin-top:40px;">
               <div class="empty-icon">&#x1F4C4;</div>
               <p>${t('common.nodata')}<br>Run an analysis from the Dashboard to see reports here.</p>
             </div>`
          : `<div class="report-list">
               ${reports.map(r => `
                 <div class="report-list-item" onclick="DDReports.viewReport('${r.id}')">
                   <div class="report-list-meta">
                     <div>
                       <div class="report-list-company">${this._escapeHtml(r.company)}</div>
                       <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
                         ${r.promptName || 'N/A'} | ${r.model || 'N/A'} | ${r.outputLang || 'ja'}
                       </div>
                     </div>
                   </div>
                   <div style="display:flex; align-items:center; gap:12px;">
                     <span class="report-list-date">${new Date(r.createdAt).toLocaleString()}</span>
                     ${r.action ? `<span class="report-list-action action-${r.action.toLowerCase()}">${r.action}</span>` : ''}
                     <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); DDReports.deleteReport('${r.id}')">&#x1F5D1;</button>
                   </div>
                 </div>
               `).join('')}
             </div>`
        }
      </div>`;
  },

  _renderDetail(reportId) {
    const t = DDi18n.t.bind(DDi18n);
    const report = DDStore.getReport(reportId);
    if (!report) return '<div class="empty-state"><p>Report not found</p></div>';

    const isSample = DDStore.isSampleReport(reportId);
    const isAdmin = DDAuth.isAdmin();

    // Parse markdown content
    let htmlContent = '';
    try {
      htmlContent = marked.parse(report.content || '');
    } catch (e) {
      htmlContent = `<pre>${this._escapeHtml(report.content || '')}</pre>`;
    }

    // Follow-up analyses
    const followUps = report.followUps || [];

    return `
      <div class="container-wide" style="padding-top:24px;">
        <button class="btn btn-ghost btn-sm" onclick="DDReports.backToList()" style="margin-bottom:16px;">
          &larr; ${t('common.back')}
        </button>

        <div class="report-container">
          <!-- Header -->
          <div class="report-header">
            <div>
              <h2 style="margin-bottom:4px;">${this._escapeHtml(report.company)}</h2>
              <div class="report-meta">
                <span class="report-meta-item"><strong>Category:</strong> ${report.promptName || 'N/A'}</span>
                <span class="report-meta-item"><strong>Model:</strong> ${report.model || 'N/A'}</span>
                <span class="report-meta-item"><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</span>
                ${report.action ? `<span class="report-list-action action-${report.action.toLowerCase()}">${report.action}</span>` : ''}
              </div>
            </div>
            <div style="display:flex; gap:8px;">
              ${isAdmin ? `
                <button class="btn btn-sm ${isSample ? 'btn-danger' : 'btn-secondary'}"
                        onclick="DDStore.toggleSampleReport('${reportId}'); DDApp.render();">
                  ${isSample ? t('report.removeSample') : t('report.makeSample')}
                </button>
              ` : ''}
              <button class="btn btn-secondary btn-sm" onclick="DDReports.exportReport('${reportId}')">
                ${t('report.export')}
              </button>
            </div>
          </div>

          <!-- Report Body -->
          <div class="report-body" id="report-body">
            ${htmlContent}
          </div>

          <!-- Follow-up analyses -->
          ${followUps.map((fu, i) => `
            <div style="border-top: 2px solid var(--accent); margin: 0;">
              <div style="padding: 16px 32px; background: var(--accent-glow); font-size:0.85rem;">
                <strong>Follow-up #${i + 1}</strong> - ${new Date(fu.createdAt).toLocaleString()}
                <div style="color:var(--text-secondary); margin-top:4px;">Q: ${this._escapeHtml(fu.question)}</div>
              </div>
              <div class="report-body">${this._parseMarkdown(fu.content)}</div>
            </div>
          `).join('')}

          <!-- Additional Analysis Section -->
          <div class="analysis-addon">
            <h3>${t('report.additional')}</h3>
            <div class="analysis-addon-row">
              <textarea class="textarea" id="followup-question"
                        placeholder="${t('report.additional.placeholder')}"
                        style="min-height:80px;"></textarea>
            </div>
            <div class="analysis-addon-row">
              <textarea class="textarea" id="followup-info"
                        placeholder="${t('report.additional.info')}"
                        style="min-height:60px; font-size:0.85rem;"></textarea>
            </div>
            <div class="info-upload" onclick="DDReports.uploadInfo()">
              &#x1F4CE; Click to upload supplementary files (PDF, CSV, TXT)
            </div>
            <div style="margin-top:12px; display:flex; justify-content:flex-end;">
              <button class="btn btn-primary" onclick="DDReports.runFollowUp('${reportId}')"
                      id="followup-btn" ${this._followUpInProgress ? 'disabled' : ''}>
                ${this._followUpInProgress ? 'Analyzing...' : t('report.additional.btn')}
              </button>
            </div>
            <div id="followup-stream" style="display:none;"></div>
          </div>
        </div>
      </div>`;
  },

  // Render a report for public (sample) view
  renderPublicReport(report) {
    let htmlContent = '';
    try {
      htmlContent = marked.parse(report.content || '');
    } catch (e) {
      htmlContent = `<pre>${this._escapeHtml(report.content || '')}</pre>`;
    }

    return `
      <div class="report-container" style="max-width:1200px; margin:0 auto;">
        <div class="report-header">
          <div>
            <h2 style="margin-bottom:4px;">${this._escapeHtml(report.company)}</h2>
            <div class="report-meta">
              <span class="report-meta-item"><strong>Category:</strong> ${report.promptName || 'N/A'}</span>
              <span class="report-meta-item"><strong>Model:</strong> ${report.model || 'N/A'}</span>
              <span class="report-meta-item"><strong>Date:</strong> ${new Date(report.createdAt).toLocaleString()}</span>
              ${report.action ? `<span class="report-list-action action-${report.action.toLowerCase()}">${report.action}</span>` : ''}
            </div>
          </div>
          <span class="badge badge-free">SAMPLE</span>
        </div>
        <div class="report-body">${htmlContent}</div>
      </div>`;
  },

  viewReport(id) {
    this._currentView = 'detail';
    this._detailId = id;
    DDStore.set('currentReport', id);
    DDApp.render();
  },

  backToList() {
    this._currentView = 'list';
    this._detailId = null;
    DDStore.set('currentReport', null);
    DDApp.render();
  },

  async runFollowUp(reportId) {
    const question = document.getElementById('followup-question')?.value?.trim();
    if (!question) {
      DDApp.showToast('Please enter a question or instruction', 'info');
      return;
    }

    const additionalInfo = document.getElementById('followup-info')?.value?.trim() || '';
    this._followUpInProgress = true;
    DDApp.render();

    // Show streaming output
    const streamEl = document.getElementById('followup-stream');
    if (streamEl) {
      streamEl.style.display = 'block';
      streamEl.innerHTML = '<div class="stream-output" id="followup-output"></div>';
    }

    try {
      const result = await DDEngine.followUp(reportId, question, additionalInfo);
      if (result) {
        const report = DDStore.getReport(reportId);
        const followUps = report.followUps || [];
        followUps.push({
          question,
          additionalInfo,
          content: result,
          createdAt: new Date().toISOString()
        });
        DDStore.updateReport(reportId, { followUps });
        DDApp.showToast('Follow-up analysis complete', 'success');
      }
    } catch (e) {
      DDApp.showToast('Follow-up failed: ' + e.message, 'error');
    } finally {
      this._followUpInProgress = false;
      DDApp.render();
    }
  },

  deleteReport(id) {
    if (confirm('Delete this report?')) {
      DDStore.deleteReport(id);
      if (this._detailId === id) {
        this._currentView = 'list';
        this._detailId = null;
      }
      DDApp.render();
      DDApp.showToast('Report deleted', 'info');
    }
  },

  exportReport(id) {
    const report = DDStore.getReport(id);
    if (!report) return;

    const content = `# ${report.company} - Due Diligence Report\n\n` +
      `**Category:** ${report.promptName}\n` +
      `**Model:** ${report.model}\n` +
      `**Date:** ${new Date(report.createdAt).toLocaleString()}\n` +
      `**Action:** ${report.action || 'N/A'}\n\n---\n\n` +
      report.content;

    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DD_${report.company.replace(/\s+/g, '_')}_${new Date(report.createdAt).toISOString().slice(0, 10)}.md`;
    a.click();
  },

  uploadInfo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.csv,.txt,.json,.xlsx';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      const infoEl = document.getElementById('followup-info');
      if (!infoEl) return;

      for (const file of files) {
        if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          const text = await file.text();
          infoEl.value += `\n\n--- [${file.name}] ---\n${text}`;
        } else {
          infoEl.value += `\n\n[Attached: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]`;
        }
      }
      DDApp.showToast(`${files.length} file(s) loaded`, 'success');
    };
    input.click();
  },

  _parseMarkdown(text) {
    try { return marked.parse(text || ''); }
    catch (e) { return `<pre>${this._escapeHtml(text || '')}</pre>`; }
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
