// === js/integrations.js ===
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
    const avg = (arr, field) => arr.reduce((s, v) => s + v[field], 0) / arr.length;
    const vitals = parsed.vitals || [];
    const activity = parsed.activity || [];
    const sleep = parsed.sleep || [];
    const mindfulness = parsed.mindfulness || [];

    // Heart rate family — Apple Watch provides the richest data
    const hr = vitals.filter(v => v.heart_rate);
    const rhr = vitals.filter(v => v.resting_heart_rate);
    const hrv = vitals.filter(v => v.hrv);
    const whr = vitals.filter(v => v.walking_hr);
    if (hr.length) parts.push(`💓 心拍数: 平均 ${Math.round(avg(hr, 'heart_rate'))} bpm (${hr.length}件)`);
    if (rhr.length) parts.push(`💤 安静時心拍: 平均 ${Math.round(avg(rhr, 'resting_heart_rate'))} bpm`);
    if (hrv.length) parts.push(`📊 HRV (自律神経): 平均 ${avg(hrv, 'hrv').toFixed(1)} ms`);
    if (whr.length) parts.push(`🚶 歩行時心拍: 平均 ${Math.round(avg(whr, 'walking_hr'))} bpm`);

    // Respiratory / oxygen
    const spo2 = vitals.filter(v => v.spo2);
    const resp = vitals.filter(v => v.respiratory_rate);
    if (spo2.length) parts.push(`🫁 SpO2: 平均 ${avg(spo2, 'spo2').toFixed(1)}%`);
    if (resp.length) parts.push(`🌬️ 呼吸数: 平均 ${avg(resp, 'respiratory_rate').toFixed(1)} 回/分`);

    // Body
    const weight = vitals.filter(v => v.weight);
    const temp = vitals.filter(v => v.temperature);
    const vo2 = vitals.filter(v => v.vo2max);
    if (weight.length) parts.push(`⚖️ 体重: ${avg(weight, 'weight').toFixed(1)} kg`);
    if (temp.length) parts.push(`🌡️ 体温: 平均 ${avg(temp, 'temperature').toFixed(1)}°C`);
    if (vo2.length) parts.push(`🏃 VO2Max: ${avg(vo2, 'vo2max').toFixed(1)} mL/kg/min`);

    // Blood pressure
    const sys = vitals.filter(v => v.bp_systolic);
    const dia = vitals.filter(v => v.bp_diastolic);
    if (sys.length && dia.length) {
      parts.push(`🩸 血圧: ${Math.round(avg(sys, 'bp_systolic'))}/${Math.round(avg(dia, 'bp_diastolic'))} mmHg`);
    }

    // Activity
    const steps = activity.filter(a => a.steps);
    const cal = activity.filter(a => a.calories);
    const dist = activity.filter(a => a.distance_m);
    const exercise = activity.filter(a => a.exercise_min);
    const stand = activity.filter(a => a.stand_min);
    if (steps.length) {
      const total = steps.reduce((s, v) => s + v.steps, 0);
      parts.push(`👟 歩数: ${total.toLocaleString()} 歩 (${steps.length}件)`);
    }
    if (cal.length) {
      const total = cal.reduce((s, v) => s + v.calories, 0);
      parts.push(`🔥 アクティブ消費: ${Math.round(total).toLocaleString()} kcal`);
    }
    if (dist.length) {
      const totalKm = dist.reduce((s, v) => s + v.distance_m, 0) / 1000;
      parts.push(`📏 歩行距離: ${totalKm.toFixed(1)} km`);
    }
    if (exercise.length) {
      const total = exercise.reduce((s, v) => s + v.exercise_min, 0);
      parts.push(`⏱️ エクササイズ: ${Math.round(total)} 分`);
    }
    if (stand.length) {
      const total = stand.reduce((s, v) => s + v.stand_min, 0);
      parts.push(`🧍 スタンド: ${Math.round(total)} 分`);
    }

    // Sleep & mindfulness
    if (sleep.length) {
      const totalMin = sleep.reduce((s, v) => s + (v.duration_min || 0), 0);
      const hours = (totalMin / 60).toFixed(1);
      parts.push(`😴 睡眠: ${sleep.length}件 / 合計 ${hours}h`);
    }
    if (mindfulness.length) {
      const total = mindfulness.reduce((s, v) => s + (v.duration_min || 0), 0);
      parts.push(`🧘 マインドフルネス: ${Math.round(total)} 分 (${mindfulness.length}件)`);
    }

    if (parts.length === 0) return `${sourceName} からデータを取り込みました`;
    return parts.join('\n');
  },

  // ======== USER-SPECIFIC EMAIL ENDPOINTS ========
  // Each user gets two stable per-user email addresses derived from
  // their Firebase UID. Plaud's auto-flow "Email export" feature
  // sends transcripts to the plaud address; any other data source
  // (generic CSV/JSON) goes to the data address. Domain is
  // inbox.cares.advisers.jp so the Cloudflare Email Routing worker
  // can dispatch to the right user based on the local-part.
  generateUserEmail() {
    const user = store.get('user');
    if (!user) return null;
    const hash = this.simpleHash(user.email || user.uid);
    return `data-${hash}@inbox.cares.advisers.jp`;
  },

  generatePlaudEmail() {
    const user = store.get('user');
    if (!user) return null;
    const hash = this.simpleHash(user.email || user.uid);
    return `plaud-${hash}@inbox.cares.advisers.jp`;
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

      // Auto-run the 禅トラック / Daily Dashboard analysis prompt on
      // every Plaud transcript so the dashboard graph updates
      // immediately. Fire-and-forget: failures are logged but don't
      // block the save. The async runner lives on the app instance.
      if (typeof app !== 'undefined' && app.runPlaudAnalysis) {
        app.runPlaudAnalysis(entry).catch(err => {
          console.warn('[plaud] auto-analysis failed:', err.message);
        });
      }

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
    async importToday(opts = {}) {
      const silent = opts.silent === true;
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

        // Create a dashboard-visible summary entry. In silent mode
        // (background auto-sync), skip creating a visible entry if
        // nothing new was imported — avoids spamming the feed with
        // empty "Fitbit sync" rows every 30 minutes.
        if (summaryParts.length > 0) {
          Integrations._addImportEntry({
            source: 'fitbit',
            icon: '⌚',
            title: `Fitbit 同期 (${data.date})`,
            summary: summaryParts.join('\n')
          });
        }

        if (!silent) Components.showToast('Fitbitデータを取り込みました', 'success');
        return data;
      } catch (err) {
        if (!silent) Components.showToast('Fitbitデータ取得エラー: ' + err.message, 'error');
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
    // Parse Apple Health XML export. Handles metrics from iPhone AND
    // Apple Watch — both write to the same HealthKit store, so the
    // export XML contains both. Source attribution lets us tag which
    // device produced each reading (Apple Watch, iPhone, Polar, etc.).
    parseExport(xmlText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const records = doc.querySelectorAll('Record');
      const data = { vitals: [], activity: [], sleep: [], nutrition: [], mindfulness: [] };

      records.forEach(r => {
        const type = r.getAttribute('type');
        const rawValue = r.getAttribute('value');
        const value = parseFloat(rawValue);
        const date = r.getAttribute('startDate');
        const endDate = r.getAttribute('endDate');
        const source = r.getAttribute('sourceName') || '';
        // Apple Watch / iPhone attribution: the sourceName typically
        // contains "Watch" for Apple Watch readings.
        const isAppleWatch = /watch/i.test(source);
        const device = isAppleWatch ? 'apple_watch' : 'iphone';

        switch (type) {
          // ─── Heart metrics (most are Apple Watch only) ───
          case 'HKQuantityTypeIdentifierHeartRate':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, heart_rate: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierRestingHeartRate':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, resting_heart_rate: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierWalkingHeartRateAverage':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, walking_hr: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, hrv: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierVO2Max':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, vo2max: value, source, device });
            break;
          // ─── Blood pressure (iPhone manual entry or BP cuff) ───
          case 'HKQuantityTypeIdentifierBloodPressureSystolic':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, bp_systolic: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, bp_diastolic: value, source, device });
            break;
          // ─── Respiratory / temperature / oxygen ───
          case 'HKQuantityTypeIdentifierBodyTemperature':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, temperature: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierOxygenSaturation':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, spo2: value * 100, source, device });
            break;
          case 'HKQuantityTypeIdentifierRespiratoryRate':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, respiratory_rate: value, source, device });
            break;
          // ─── Activity (mix of iPhone pedometer & Apple Watch rings) ───
          case 'HKQuantityTypeIdentifierStepCount':
            if (!isNaN(value)) data.activity.push({ timestamp: date, steps: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierActiveEnergyBurned':
            if (!isNaN(value)) data.activity.push({ timestamp: date, calories: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierBasalEnergyBurned':
            if (!isNaN(value)) data.activity.push({ timestamp: date, basal_calories: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierDistanceWalkingRunning':
            if (!isNaN(value)) data.activity.push({ timestamp: date, distance_m: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierFlightsClimbed':
            if (!isNaN(value)) data.activity.push({ timestamp: date, flights: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierAppleExerciseTime':
            if (!isNaN(value)) data.activity.push({ timestamp: date, exercise_min: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierAppleStandTime':
            if (!isNaN(value)) data.activity.push({ timestamp: date, stand_min: value, source, device });
            break;
          // ─── Body composition ───
          case 'HKQuantityTypeIdentifierBodyMass':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, weight: value, source, device });
            break;
          case 'HKQuantityTypeIdentifierBodyFatPercentage':
            if (!isNaN(value)) data.vitals.push({ timestamp: date, body_fat: value * 100, source, device });
            break;
          // ─── Sleep (Apple Watch automatic + iPhone bedtime) ───
          case 'HKCategoryTypeIdentifierSleepAnalysis': {
            // Sleep is a duration, not a value. Compute minutes from
            // startDate→endDate. rawValue is a category like
            // "HKCategoryValueSleepAnalysisInBed" / "AsleepCore" etc.
            if (date && endDate) {
              const minutes = (new Date(endDate) - new Date(date)) / 60000;
              if (minutes > 0 && minutes < 720) { // sanity cap at 12h
                data.sleep.push({ timestamp: date, duration_min: minutes, stage: rawValue, source, device });
              }
            }
            break;
          }
          // ─── Mindfulness (Apple Watch Breathe app) ───
          case 'HKCategoryTypeIdentifierMindfulSession': {
            if (date && endDate) {
              const minutes = (new Date(endDate) - new Date(date)) / 60000;
              if (minutes > 0) data.mindfulness.push({ timestamp: date, duration_min: minutes, source, device });
            }
            break;
          }
        }
      });

      return data;
    },

    // Import parsed Apple Health data
    importData(parsed) {
      let count = 0;
      const catKeys = ['vitals', 'activity', 'sleep', 'nutrition', 'mindfulness'];
      catKeys.forEach(cat => {
        if (parsed[cat]) {
          parsed[cat].forEach(d => {
            const targetKey = cat === 'mindfulness' ? 'activityData' : cat;
            store.addHealthData(targetKey === 'activityData' ? 'activity' : cat, { ...d, source: 'apple_health' });
            count++;
          });
        }
      });

      // Apple Watch attribution: count records that came from a Watch
      // source so we can show it in the summary.
      const watchCount = catKeys.reduce((sum, cat) => {
        const arr = parsed[cat] || [];
        return sum + arr.filter(x => x.device === 'apple_watch').length;
      }, 0);
      const hasAppleWatch = watchCount > 0;

      // Create a user-visible summary entry so the import shows up in
      // the dashboard feed and 記録 page integration history.
      if (count > 0) {
        const summary = Integrations._buildHealthSummary(parsed, 'Apple Health');
        const title = hasAppleWatch
          ? `iPhone & Apple Watch 同期 (${count}件, うち⌚${watchCount}件)`
          : `Apple Health 同期 (${count}件)`;
        Integrations._addImportEntry({
          source: 'apple_health',
          icon: hasAppleWatch ? '⌚' : '🍎',
          title,
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
  // Also check for URL-based imports (iOS Shortcut push mechanism)
  Integrations.urlImport.checkUrlForData();
});

// ─── URL-BASED IMPORT (iOS Shortcut → app) ───
//
// The iOS "Shortcuts" app can "Open URL" as an action. We use this to
// let a user-configured shortcut push health data into the app
// *without* a backend. The shortcut builds a URL like
//   https://cares.advisers.jp/#import=<base64-json>
// and opens it; on page load, checkUrlForData() decodes the payload
// and routes it through the normal import helpers.
//
// Payload schema (UTF-8 JSON, then base64-encoded):
//   {
//     "source": "apple_watch" | "apple_health" | "iphone",
//     "items": [
//       { "type": "heart_rate",         "value": 72, "timestamp": "2026-04-09T10:00:00Z" },
//       { "type": "resting_heart_rate", "value": 58, "timestamp": "..." },
//       { "type": "hrv",                "value": 45, "timestamp": "..." },
//       { "type": "steps",              "value": 8500, "timestamp": "..." },
//       { "type": "sleep_min",          "value": 432, "timestamp": "..." },
//       { "type": "spo2",               "value": 97, "timestamp": "..." }
//     ]
//   }
//
// This works on iPhone, Apple Watch (via iPhone), Android (via Tasker
// or similar), and any system that can construct a URL.
Integrations.urlImport = {
  checkUrlForData() {
    try {
      const hash = window.location.hash || '';
      // Support both `#import=<base64>` and `?import=<base64>` forms
      let raw = null;
      const hashMatch = hash.match(/[#&?]import=([^&]+)/);
      if (hashMatch) raw = decodeURIComponent(hashMatch[1]);
      if (!raw) {
        const search = window.location.search || '';
        const searchMatch = search.match(/[?&]import=([^&]+)/);
        if (searchMatch) raw = decodeURIComponent(searchMatch[1]);
      }
      if (!raw) return;

      // Decode base64 → JSON
      let payload;
      try {
        // Handle UTF-8 multibyte correctly via TextDecoder
        const bin = atob(raw);
        const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
        payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      } catch (e) {
        // Fallback: plain JSON (no base64) or URL-encoded JSON
        try { payload = JSON.parse(raw); } catch (e2) {
          console.warn('[urlImport] could not decode payload:', e.message);
          return;
        }
      }

      if (!payload || !Array.isArray(payload.items)) {
        console.warn('[urlImport] invalid payload shape');
        return;
      }

      const source = payload.source || 'apple_health';
      this.ingestItems(source, payload.items);

      // Clean the URL so reloads don't re-import the same payload
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (err) {
      console.error('[urlImport] error:', err);
    }
  },

  ingestItems(source, items) {
    if (!items.length) return;
    // Normalise items into the same parsed shape appleHealth.importData expects
    const parsed = { vitals: [], activity: [], sleep: [], nutrition: [], mindfulness: [] };
    const now = new Date().toISOString();
    const isWatch = /watch/i.test(source);
    const device = isWatch ? 'apple_watch' : (source === 'iphone' ? 'iphone' : 'other');

    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const ts = it.timestamp || now;
      const v = typeof it.value === 'number' ? it.value : parseFloat(it.value);
      if (isNaN(v)) continue;
      switch (it.type) {
        case 'heart_rate':         parsed.vitals.push({ timestamp: ts, heart_rate: v, device }); break;
        case 'resting_heart_rate': parsed.vitals.push({ timestamp: ts, resting_heart_rate: v, device }); break;
        case 'hrv':                parsed.vitals.push({ timestamp: ts, hrv: v, device }); break;
        case 'spo2':               parsed.vitals.push({ timestamp: ts, spo2: v, device }); break;
        case 'respiratory_rate':   parsed.vitals.push({ timestamp: ts, respiratory_rate: v, device }); break;
        case 'temperature':        parsed.vitals.push({ timestamp: ts, temperature: v, device }); break;
        case 'weight':             parsed.vitals.push({ timestamp: ts, weight: v, device }); break;
        case 'steps':              parsed.activity.push({ timestamp: ts, steps: v, device }); break;
        case 'calories':           parsed.activity.push({ timestamp: ts, calories: v, device }); break;
        case 'distance_m':         parsed.activity.push({ timestamp: ts, distance_m: v, device }); break;
        case 'exercise_min':       parsed.activity.push({ timestamp: ts, exercise_min: v, device }); break;
        case 'stand_min':          parsed.activity.push({ timestamp: ts, stand_min: v, device }); break;
        case 'sleep_min':          parsed.sleep.push({ timestamp: ts, duration_min: v, device }); break;
        case 'mindful_min':        parsed.mindfulness.push({ timestamp: ts, duration_min: v, device }); break;
      }
    }
    // Reuse the apple_health importer so all downstream logic
    // (summary, dashboard reflection, store update) stays identical.
    Integrations.appleHealth.importData(parsed);
  },

  // Build an iOS Shortcut-friendly test URL for the admin/docs.
  buildSampleUrl(items, origin) {
    const payload = { source: 'apple_watch', items };
    const json = JSON.stringify(payload);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return `${origin || window.location.origin}${window.location.pathname}#import=${encodeURIComponent(b64)}`;
  }
};

// ─── AUTO-SYNC SCHEDULER ───
//
// Connected integrations refresh automatically while the app is open,
// so the user only has to set up each integration once. This module
// coordinates periodic re-fetch + on-visibility refresh + initial
// sync-on-load, with per-source debounce and silent failure handling.
//
// Trigger points:
//   1. app.init() → 2s after load (after Firebase auth settles)
//   2. Every 30 minutes while tab is open (setInterval)
//   3. Tab visibility change from hidden→visible (user returns)
//   4. Window focus event (fallback for older browsers)
//
// Per-source gating: only fetch if that integration is connected
// (Fitbit access token present, Google Calendar ICS URL saved).
//
// Apple Health / Apple Watch and Plaud don't have web APIs we can
// poll, so they're not included here. Apple Health pushes via the
// iOS Shortcut Automation (handled by Integrations.urlImport), and
// Plaud requires manual paste.
Integrations.autoSync = {
  // Don't re-run more than once every 5 minutes regardless of triggers
  MIN_INTERVAL_MS: 5 * 60 * 1000,
  // Periodic sync while tab is open (30 minutes)
  PERIODIC_INTERVAL_MS: 30 * 60 * 1000,

  _lastRunAt: 0,
  _periodicTimer: null,
  _inFlight: false,
  _listenersAttached: false,

  // Initialize the scheduler. Idempotent: safe to call multiple times.
  init() {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    // Initial sync 2s after init — gives Firebase auth / loadAllData
    // time to settle so we don't race against the startup sequence.
    setTimeout(() => this.runIfNeeded('init'), 2000);

    // Periodic sync while the tab stays open
    this._periodicTimer = setInterval(
      () => this.runIfNeeded('periodic'),
      this.PERIODIC_INTERVAL_MS
    );

    // Refresh when the user returns to the tab
    if (typeof document !== 'undefined' && 'visibilityState' in document) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.runIfNeeded('visibility');
        }
      });
    }

    // Fallback for browsers without Page Visibility API
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.runIfNeeded('focus'));
    }
  },

  // Run all sync-able integrations in parallel. Silent failures.
  async runIfNeeded(trigger = 'manual') {
    if (this._inFlight) return;
    const now = Date.now();
    if (trigger !== 'manual' && (now - this._lastRunAt) < this.MIN_INTERVAL_MS) {
      return; // debounce
    }
    this._inFlight = true;
    this._lastRunAt = now;
    console.log('[autoSync] running (' + trigger + ')');

    try {
      const tasks = [];

      // Fitbit: only if access token exists (i.e. user connected OAuth)
      if (Integrations.fitbit.accessToken) {
        tasks.push(this._syncFitbit());
      }

      // Google Calendar: only if ICS URL is saved
      const icsUrl = localStorage.getItem('ics_calendar_url');
      if (icsUrl) {
        tasks.push(this._syncGoogleCalendar(icsUrl));
      }

      if (tasks.length === 0) {
        console.log('[autoSync] no connected integrations');
        return;
      }

      const results = await Promise.allSettled(tasks);
      // Persist the successful sync timestamp for visible "最終同期"
      // status in the integrations page without requiring a refresh.
      const syncs = store.get('integrationSyncs') || {};
      syncs._lastAutoRun = new Date().toISOString();
      store.set('integrationSyncs', syncs);

      // Aggregate any errors for the console but don't spam toasts
      const errors = results.filter(r => r.status === 'rejected');
      this._lastErrors = errors;
      if (errors.length > 0) {
        console.warn('[autoSync]', errors.length, 'sync tasks failed:',
          errors.map(e => e.reason?.message).join(', '));
      } else {
        console.log('[autoSync] all tasks OK (' + tasks.length + ')');
      }
    } finally {
      this._inFlight = false;
    }
  },

  async _syncFitbit() {
    try {
      await Integrations.fitbit.importToday({ silent: true });
    } catch (e) {
      console.warn('[autoSync] Fitbit failed:', e.message);
      throw e;
    }
  },

  async _syncGoogleCalendar(url) {
    try {
      await CalendarIntegration.importFromIcsUrl(url);
    } catch (e) {
      console.warn('[autoSync] GCal failed:', e.message);
      throw e;
    }
  },

  // Manual "sync now" — bypasses the debounce. Used when the user
  // clicks the refresh button in the integrations page.
  async runNow() {
    this._lastRunAt = 0;
    await this.runIfNeeded('manual');
    if (this._lastErrors && this._lastErrors.length > 0) {
      const msgs = this._lastErrors.map(e => e.reason?.message || '不明なエラー').join(', ');
      Components.showToast('同期に失敗しました: ' + msgs, 'error');
      if (msgs.includes('401') || msgs.includes('token') || msgs.includes('auth')) {
        localStorage.removeItem('google_calendar_oauth_connected');
      }
    } else {
      Components.showToast('連携データを同期しました', 'success');
    }
  }
};


