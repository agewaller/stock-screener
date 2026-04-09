/* ============================================================
   External Device & Service Integrations
   iPhone / Plaud / Fitbit / Wearables
   ============================================================ */
var Integrations = {

  // ======== SHARED IMPORT HELPERS ========
  // Create a user-visible text entry whenever an integration imports
  // data. This is what makes Plaud / Apple Health / Fitbit / file
  // uploads show up on the home dashboard's "あなたの記録" feed.
  // Without this, imported data lands in vitals/activity/sleep
  // collections that the dashboard doesn't render and the user thinks
  // nothing happened.
  _addImportEntry({ source, icon, title, summary }) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      category: 'integration',
      type: source + '_import',
      title: `${icon} ${title}`,
      content: summary || '',
      source
    };
    const textEntries = store.get('textEntries') || [];
    textEntries.push(entry);
    store.set('textEntries', textEntries);
    // Track last sync per source so the integrations page / dashboard
    // can show "最終同期: 2分前" etc.
    const syncs = store.get('integrationSyncs') || {};
    syncs[source] = entry.timestamp;
    store.set('integrationSyncs', syncs);
    return entry;
  },

  // Build a one-glance summary string from a parsed health export.
  _buildHealthSummary(parsed, sourceName) {
    const parts = [];
    if (parsed.vitals?.length) {
      const hrEntries = parsed.vitals.filter(v => v.heart_rate);
      const stepEntries = parsed.activity?.filter(a => a.steps) || [];
      const sleepEntries = parsed.sleep || [];
      const spo2Entries = parsed.vitals.filter(v => v.spo2);
      if (hrEntries.length) {
        const avg = hrEntries.reduce((s, v) => s + v.heart_rate, 0) / hrEntries.length;
        parts.push(`心拍数: 平均 ${Math.round(avg)} bpm (${hrEntries.length}件)`);
      }
      if (spo2Entries.length) {
        const avg = spo2Entries.reduce((s, v) => s + v.spo2, 0) / spo2Entries.length;
        parts.push(`SpO2: 平均 ${avg.toFixed(1)}%`);
      }
      if (stepEntries.length) {
        const total = stepEntries.reduce((s, v) => s + v.steps, 0);
        parts.push(`歩数: ${total.toLocaleString()} 歩`);
      }
      if (sleepEntries.length) parts.push(`睡眠: ${sleepEntries.length} 件`);
    }
    if (parts.length === 0) return `${sourceName} からデータを取り込みました`;
    return parts.join('\n');
  },

  // ======== USER-SPECIFIC EMAIL ENDPOINT ========
  // Each user gets a unique data ingestion email address
  generateUserEmail() {
    const user = store.get('user');
    if (!user) return null;
    const hash = this.simpleHash(user.email || user.uid);
    return `data-${hash}@inbox.chroniccare.ai`;
  },

  simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36).substring(0, 8);
  },

  // ======== PLAUD INTEGRATION ========
  // Plaud sends conversation transcripts to email
  plaud: {
    connected: false,

    getIngestEmail() {
      return Integrations.generateUserEmail();
    },

    // Parse Plaud transcript text
    parseTranscript(text) {
      const lines = text.split('\n').filter(l => l.trim());
      const entries = [];
      let currentEntry = { speaker: '', text: '', timestamp: '' };

      lines.forEach(line => {
        // Plaud format: [HH:MM:SS] Speaker: text
        const match = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(.+?):\s*(.+)/);
        if (match) {
          if (currentEntry.text) entries.push({ ...currentEntry });
          currentEntry = { timestamp: match[1], speaker: match[2].trim(), text: match[3].trim() };
        } else if (line.trim()) {
          currentEntry.text += ' ' + line.trim();
        }
      });
      if (currentEntry.text) entries.push(currentEntry);

      return {
        type: 'plaud_transcript',
        entries: entries,
        fullText: text,
        summary: entries.map(e => `${e.speaker}: ${e.text}`).join('\n').substring(0, 500),
        wordCount: text.split(/\s+/).length,
        speakerCount: new Set(entries.map(e => e.speaker)).size
      };
    },

    // Save parsed transcript to store
    saveTranscript(parsed, metadata = {}) {
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: metadata.date || new Date().toISOString(),
        category: 'conversation',
        type: 'plaud_transcript',
        title: `🎙️ ${metadata.title || 'Plaud会話記録'}`,
        content: parsed.fullText,
        summary: parsed.summary,
        speakerCount: parsed.speakerCount,
        wordCount: parsed.wordCount,
        source: 'plaud'
      };

      const textEntries = store.get('textEntries') || [];
      textEntries.push(entry);
      store.set('textEntries', textEntries);

      // Also add to conversation history for AI context
      const history = store.get('conversationHistory') || [];
      history.push({
        role: 'user',
        content: `[Plaud会話記録] ${entry.title}\n${parsed.summary}`,
        timestamp: entry.timestamp,
        type: 'plaud_data'
      });
      store.set('conversationHistory', history);

      // Track last sync time for the dashboard's connection status widget
      const syncs = store.get('integrationSyncs') || {};
      syncs.plaud = entry.timestamp;
      store.set('integrationSyncs', syncs);

      return entry;
    }
  },

  // ======== FITBIT INTEGRATION ========
  fitbit: {
    CLIENT_ID: localStorage.getItem('fitbit_client_id') || '',
    REDIRECT_URI: window.location.origin + window.location.pathname,
    SCOPES: 'activity heartrate sleep profile weight nutrition',
    accessToken: localStorage.getItem('fitbit_token') || '',
    connected: false,

    // Start OAuth2 implicit flow
    connect() {
      const clientId = localStorage.getItem('fitbit_client_id');
      if (!clientId) {
        Components.showToast('管理パネルでFitbit Client IDを設定してください', 'error');
        return;
      }

      const authUrl = 'https://www.fitbit.com/oauth2/authorize' +
        `?response_type=token` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(this.SCOPES)}` +
        `&expires_in=31536000`;

      window.location.href = authUrl;
    },

    // Check URL for OAuth callback token
    checkCallback() {
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        if (token) {
          localStorage.setItem('fitbit_token', token);
          this.accessToken = token;
          this.connected = true;
          // Clean URL
          history.replaceState(null, '', window.location.pathname);
          Components.showToast('Fitbitに接続しました', 'success');
          return true;
        }
      }
      if (this.accessToken) this.connected = true;
      return false;
    },

    disconnect() {
      localStorage.removeItem('fitbit_token');
      this.accessToken = '';
      this.connected = false;
      Components.showToast('Fitbit接続を解除しました', 'info');
    },

    // Fetch data from Fitbit API
    async fetchData(endpoint) {
      if (!this.accessToken) throw new Error('Fitbit未接続');

      const response = await fetch(`https://api.fitbit.com/1/user/-/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (response.status === 401) {
        this.disconnect();
        throw new Error('Fitbitトークン期限切れ。再接続してください。');
      }
      if (!response.ok) throw new Error(`Fitbit API error: ${response.status}`);

      return await response.json();
    },

    // Fetch today's summary
    async fetchDailySummary(date) {
      const d = date || new Date().toISOString().split('T')[0];
      const [activity, sleep, heart] = await Promise.allSettled([
        this.fetchData(`activities/date/${d}.json`),
        this.fetchData(`sleep/date/${d}.json`),
        this.fetchData(`activities/heart/date/${d}/1d/1min.json`)
      ]);

      return {
        date: d,
        activity: activity.status === 'fulfilled' ? activity.value : null,
        sleep: sleep.status === 'fulfilled' ? sleep.value : null,
        heart: heart.status === 'fulfilled' ? heart.value : null
      };
    },

    // Import Fitbit data into store
    async importToday() {
      try {
        const data = await this.fetchDailySummary();
        const summaryParts = [];

        // Parse activity
        if (data.activity?.summary) {
          const a = data.activity.summary;
          store.addHealthData('activity', {
            steps: a.steps,
            active_minutes: (a.fairlyActiveMinutes || 0) + (a.veryActiveMinutes || 0),
            calories: a.caloriesOut,
            rest_time: a.sedentaryMinutes,
            source: 'fitbit'
          });
          summaryParts.push(`歩数 ${a.steps?.toLocaleString() || 0}歩 / 活動 ${(a.fairlyActiveMinutes || 0) + (a.veryActiveMinutes || 0)}分 / 消費 ${a.caloriesOut || 0}kcal`);
        }

        // Parse sleep
        if (data.sleep?.summary) {
          const s = data.sleep.summary;
          const hours = ((s.totalMinutesAsleep || 0) / 60).toFixed(1);
          store.addHealthData('sleep', {
            duration: (s.totalMinutesAsleep || 0) / 60,
            deep_sleep: (s.stages?.deep || 0) / 60,
            rem_sleep: (s.stages?.rem || 0) / 60,
            awakenings: s.stages?.wake || 0,
            source: 'fitbit'
          });
          summaryParts.push(`睡眠 ${hours}h (深睡眠 ${((s.stages?.deep || 0) / 60).toFixed(1)}h)`);
        }

        // Parse heart rate
        if (data.heart?.['activities-heart']?.[0]?.value) {
          const hr = data.heart['activities-heart'][0].value;
          store.addHealthData('vitals', {
            heart_rate: hr.restingHeartRate || 0,
            hrv_data: hr.heartRateZones || [],
            source: 'fitbit'
          });
          if (hr.restingHeartRate) summaryParts.push(`安静時心拍 ${hr.restingHeartRate}bpm`);
        }

        // Create a dashboard-visible summary entry
        if (summaryParts.length > 0) {
          Integrations._addImportEntry({
            source: 'fitbit',
            icon: '⌚',
            title: `Fitbit 同期 (${data.date})`,
            summary: summaryParts.join('\n')
          });
        }

        Components.showToast('Fitbitデータを取り込みました', 'success');
        return data;
      } catch (err) {
        Components.showToast('Fitbitデータ取得エラー: ' + err.message, 'error');
        throw err;
      }
    },

    // Fetch historical data (past N days)
    async importHistory(days = 7) {
      const results = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const data = await this.fetchDailySummary(dateStr);
          if (data.activity?.summary) {
            const a = data.activity.summary;
            store.addHealthData('activity', {
              steps: a.steps,
              active_minutes: (a.fairlyActiveMinutes || 0) + (a.veryActiveMinutes || 0),
              calories: a.caloriesOut,
              source: 'fitbit'
            });
          }
          if (data.sleep?.summary) {
            const s = data.sleep.summary;
            store.addHealthData('sleep', {
              duration: (s.totalMinutesAsleep || 0) / 60,
              source: 'fitbit'
            });
          }
          results.push(data);
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.warn(`Fitbit data for ${dateStr} failed:`, err);
        }
      }
      // Single dashboard entry summarising the whole batch
      if (results.length > 0) {
        const totalSteps = results.reduce((s, r) => s + (r.activity?.summary?.steps || 0), 0);
        const avgSleep = results.reduce((s, r) => s + ((r.sleep?.summary?.totalMinutesAsleep || 0) / 60), 0) / results.length;
        Integrations._addImportEntry({
          source: 'fitbit',
          icon: '⌚',
          title: `Fitbit 過去${results.length}日分を同期`,
          summary: `合計歩数 ${totalSteps.toLocaleString()} 歩 / 平均睡眠 ${avgSleep.toFixed(1)}h`
        });
      }
      Components.showToast(`${results.length}日分のFitbitデータを取り込みました`, 'success');
      return results;
    }
  },

  // ======== APPLE HEALTH / iPhone ========
  appleHealth: {
    // Parse Apple Health XML export
    parseExport(xmlText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const records = doc.querySelectorAll('Record');
      const data = { vitals: [], activity: [], sleep: [], nutrition: [] };

      records.forEach(r => {
        const type = r.getAttribute('type');
        const value = parseFloat(r.getAttribute('value'));
        const date = r.getAttribute('startDate');
        const source = r.getAttribute('sourceName');

        if (isNaN(value)) return;

        switch (type) {
          case 'HKQuantityTypeIdentifierHeartRate':
            data.vitals.push({ timestamp: date, heart_rate: value, source });
            break;
          case 'HKQuantityTypeIdentifierBloodPressureSystolic':
            data.vitals.push({ timestamp: date, bp_systolic: value, source });
            break;
          case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
            data.vitals.push({ timestamp: date, bp_diastolic: value, source });
            break;
          case 'HKQuantityTypeIdentifierBodyTemperature':
            data.vitals.push({ timestamp: date, temperature: value, source });
            break;
          case 'HKQuantityTypeIdentifierOxygenSaturation':
            data.vitals.push({ timestamp: date, spo2: value * 100, source });
            break;
          case 'HKQuantityTypeIdentifierStepCount':
            data.activity.push({ timestamp: date, steps: value, source });
            break;
          case 'HKQuantityTypeIdentifierActiveEnergyBurned':
            data.activity.push({ timestamp: date, calories: value, source });
            break;
          case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
            data.vitals.push({ timestamp: date, hrv: value, source });
            break;
          case 'HKQuantityTypeIdentifierBodyMass':
            data.vitals.push({ timestamp: date, weight: value, source });
            break;
          case 'HKQuantityTypeIdentifierRespiratoryRate':
            data.vitals.push({ timestamp: date, respiratory_rate: value, source });
            break;
        }
      });

      return data;
    },

    // Import parsed Apple Health data
    importData(parsed) {
      let count = 0;
      ['vitals', 'activity', 'sleep', 'nutrition'].forEach(cat => {
        if (parsed[cat]) {
          parsed[cat].forEach(d => {
            store.addHealthData(cat === 'vitals' ? 'vitals' : cat, { ...d, source: 'apple_health' });
            count++;
          });
        }
      });

      // Also create a user-visible summary entry in textEntries so the
      // imported data shows up on the home dashboard's "あなたの記録"
      // feed. Without this, Apple Health data only lands in the vitals/
      // activity/sleep collections which the dashboard doesn't render.
      if (count > 0) {
        const summary = Integrations._buildHealthSummary(parsed, 'Apple Health');
        Integrations._addImportEntry({
          source: 'apple_health',
          icon: '🍎',
          title: `Apple Health 同期 (${count}件)`,
          summary
        });
      }

      Components.showToast(`Apple Health: ${count}件のデータを取り込みました`, 'success');
      return count;
    },

    // Generate iOS Shortcut instructions
    getShortcutInstructions() {
      const email = Integrations.generateUserEmail();
      return {
        email,
        steps: [
          'iPhoneで「ショートカット」アプリを開く',
          '「+」で新規ショートカット作成',
          '「ヘルスケアサンプルを検索」アクションを追加',
          '取得したいデータタイプを選択（心拍数、歩数、睡眠等）',
          '「テキスト」アクションで結果をCSV形式にフォーマット',
          `「メールを送信」アクションで宛先を ${email} に設定`,
          '「オートメーション」タブで毎日自動実行を設定',
        ]
      };
    }
  },

  // ======== GENERIC CSV/JSON IMPORT ========
  parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = isNaN(values[i]) ? values[i] : Number(values[i]); });
      return obj;
    });
  },

  parseJSON(text) {
    try { return JSON.parse(text); }
    catch { return null; }
  },

  // Auto-detect and import file
  async importFile(file) {
    const text = await file.text();
    const name = file.name.toLowerCase();

    if (name.endsWith('.xml') && text.includes('HealthData')) {
      const parsed = this.appleHealth.parseExport(text);
      return this.appleHealth.importData(parsed);
    }

    if (name.endsWith('.csv')) {
      const rows = this.parseCSV(text);
      if (rows.length > 0) {
        rows.forEach(r => {
          const cat = r.category || r.type || 'vitals';
          store.addHealthData(cat, { ...r, source: 'csv_import' });
        });
        // Make the import visible on the home dashboard
        this._addImportEntry({
          source: 'csv_import',
          icon: '📊',
          title: `${file.name} (${rows.length}件)`,
          summary: `CSVから ${rows.length} 件のデータを取り込みました\n` +
                   rows.slice(0, 3).map(r => Object.entries(r).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' / ')).join('\n')
        });
        Components.showToast(`CSV: ${rows.length}件のデータを取り込みました`, 'success');
        return rows.length;
      }
    }

    if (name.endsWith('.json')) {
      const data = this.parseJSON(text);
      if (data) {
        if (Array.isArray(data)) {
          data.forEach(d => store.addHealthData(d.category || 'vitals', { ...d, source: 'json_import' }));
          this._addImportEntry({
            source: 'json_import',
            icon: '📦',
            title: `${file.name} (${data.length}件)`,
            summary: `JSONから ${data.length} 件のデータを取り込みました`
          });
          Components.showToast(`JSON: ${data.length}件のデータを取り込みました`, 'success');
          return data.length;
        }
      }
    }

    // Treat as Plaud transcript or plain text
    if (text.length > 50) {
      const parsed = this.plaud.parseTranscript(text);
      if (parsed.entries.length > 0) {
        this.plaud.saveTranscript(parsed, { title: file.name });
        Components.showToast(`会話記録: ${parsed.entries.length}件の発言を取り込みました`, 'success');
        return parsed.entries.length;
      }

      // Plain text as diary entry
      const textEntries = store.get('textEntries') || [];
      textEntries.push({
        id: Date.now().toString(36),
        timestamp: new Date().toISOString(),
        category: 'other',
        type: 'file_import',
        title: file.name,
        content: text,
        source: 'file_import'
      });
      store.set('textEntries', textEntries);
      Components.showToast('テキストファイルを取り込みました', 'success');
      return 1;
    }

    Components.showToast('未対応のファイル形式です', 'error');
    return 0;
  }
};

// Check for Fitbit OAuth callback on page load
document.addEventListener('DOMContentLoaded', () => {
  Integrations.fitbit.checkCallback();
});
