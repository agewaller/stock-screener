// === js/calendar.js ===
/* ============================================================
   Google Calendar Integration
   Fetches and analyzes schedule data for health insights
   ============================================================ */
var CalendarIntegration = {
  // Cache calendar events in store
  saveEvents(events) {
    // Filter out birthday duplicates and format
    const seen = new Set();
    const cleaned = events
      .filter(e => {
        if (e.eventType === 'birthday') {
          if (seen.has(e.summary)) return false;
          seen.add(e.summary);
        }
        return true;
      })
      .map(e => {
        // Google Calendar API v3 encodes "all-day" implicitly: the
        // event has `start.date` (YYYY-MM-DD) instead of
        // `start.dateTime`. There's no explicit `allDay` flag on the
        // API response, so we derive it. Older code read `e.allDay`
        // directly — that was always undefined, and the downstream
        // widget/analyzer defaulted everything to "timed", which is
        // why the dashboard widget was under-counting daily events.
        const isAllDay = !e.start?.dateTime && !!e.start?.date;
        // attendees is an array on v3 ({email, responseStatus, ...}).
        // Previously this code read `e.numAttendees` which does not
        // exist on the API, so every event looked like a 1-person
        // task and analyzeLoad never classified anything as a meeting.
        const attendeeCount = Array.isArray(e.attendees) ? e.attendees.length : 0;
        return {
          id: e.id,
          // Include which calendar the event came from so we can
          // display mixed sources (primary / holidays / shared / etc.)
          // without collapsing them visually.
          calendarId: e._calendarId || '',
          calendarName: e._calendarName || '',
          title: e.summary || '',
          location: e.location || '',
          start: e.start?.dateTime || e.start?.date || '',
          end: e.end?.dateTime || e.end?.date || '',
          allDay: isAllDay,
          type: e.eventType || 'default',
          attendees: attendeeCount,
          description: (e.description || '').replace(/<[^>]*>/g, '').substring(0, 200)
        };
      });

    store.set('calendarEvents', cleaned);
    return cleaned;
  },

  // ─── ICS URL import (Google Calendar / Outlook / any RFC5545 feed) ───
  //
  // Google Calendar settings → "カレンダーの統合" → "iCal 形式の秘密アドレス"
  // をコピーして貼り付けるだけで取り込める。OAuth flow 不要。
  // CORS: Google/Apple の ICS エンドポイントはブラウザから直接 fetch 可能。
  // もしブロックされる場合は、AllOrigins の公開プロキシを経由する。
  async importFromIcsUrl(icsUrl) {
    if (!icsUrl || !/^https?:\/\//.test(icsUrl)) {
      throw new Error('有効なICS URLを入力してください');
    }
    let icsText;
    try {
      // Try direct fetch first
      const res = await fetch(icsUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      icsText = await res.text();
    } catch (directErr) {
      console.warn('[ICS] direct fetch failed, trying CORS proxy:', directErr.message);
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(icsUrl);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Proxy HTTP ' + res.status);
        icsText = await res.text();
      } catch (proxyErr) {
        throw new Error('カレンダーの取得に失敗しました: ' + (directErr.message || proxyErr.message));
      }
    }

    const events = this.parseIcs(icsText);
    if (events.length === 0) throw new Error('ICSからイベントを抽出できませんでした');

    // Filter to upcoming events only (past -7 days to future +90 days)
    const now = Date.now();
    const past = now - 7 * 86400000;
    const future = now + 90 * 86400000;
    const upcoming = events.filter(e => {
      const t = new Date(e.start).getTime();
      return !isNaN(t) && t >= past && t <= future;
    });

    store.set('calendarEvents', upcoming);
    localStorage.setItem('ics_calendar_url', icsUrl);
    // Track last sync for the integration status widget
    const syncs = store.get('integrationSyncs') || {};
    syncs.google_calendar = new Date().toISOString();
    store.set('integrationSyncs', syncs);

    return upcoming;
  },

  // Google OAuth access token (calendar.readonly) で直接イベント取得。
  // ユーザーは「Googleで連携」ボタンで同意するだけ。
  //
  // IMPORTANT: This fetches events from EVERY calendar the user has
  // access to (primary, shared, holidays, family, secondary, etc.)
  // — not just the primary calendar. Historically this code hit
  // calendars/primary/events only, which silently dropped every
  // event stored in any non-primary calendar. Users who had their
  // work schedule, family events, or national holidays in separate
  // calendars saw a small fraction of their real schedule.
  //
  // It also follows nextPageToken so calendars with more than
  // 250 events inside the window don't get truncated.
  async importFromGoogleAccessToken(accessToken) {
    if (!accessToken) {
      throw new Error('Google認可トークンが見つかりません。再度「Googleで連携」を押してください。');
    }

    const now = new Date();
    // Widened from -7/+90 days because users reported many
    // upcoming events outside the old window. -30/+180 covers
    // a full past month plus half a year forward, which matches
    // what most users expect from the Google Calendar UI.
    const timeMin = new Date(now.getTime() - 30 * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + 180 * 86400000).toISOString();

    const authFetch = (url) => fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const throwHttp = async (res, ctx) => {
      let message = `Google Calendar API ${res.status}`;
      try {
        const err = await res.json();
        message = err?.error?.message || message;
      } catch (_) {}
      throw new Error(`${ctx}: ${message}`);
    };

    // Step 1: list all calendars the user has access to.
    // minAccessRole=reader excludes calendars we can't read anyway.
    const listRes = await authFetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?' +
      new URLSearchParams({ minAccessRole: 'reader', maxResults: '250' }).toString()
    );
    if (!listRes.ok) await throwHttp(listRes, 'calendarList');
    const listData = await listRes.json();
    // Respect the user's "show in list" preference (selected !== false).
    // Hidden calendars are typically ones the user has explicitly
    // chosen not to see in Google Calendar, so we skip them too.
    const calendars = (listData.items || [])
      .filter(c => c.id && c.selected !== false)
      .map(c => ({ id: c.id, name: c.summary || c.summaryOverride || c.id }));

    // If for some reason calendarList returned nothing, fall back
    // to the primary calendar only, so the user still sees something.
    if (calendars.length === 0) {
      calendars.push({ id: 'primary', name: 'primary' });
    }

    // Step 2: for each calendar, fetch events with pagination.
    const fetchCalendarEvents = async (cal) => {
      const out = [];
      let pageToken = '';
      // Hard cap of 20 pages (×1000 events/page = 20,000 events max
      // per calendar) to avoid infinite loops on pathological data.
      for (let guard = 0; guard < 20; guard++) {
        const params = new URLSearchParams({
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '1000',
          timeMin,
          timeMax
        });
        if (pageToken) params.set('pageToken', pageToken);
        const url = 'https://www.googleapis.com/calendar/v3/calendars/' +
          encodeURIComponent(cal.id) + '/events?' + params.toString();
        const res = await authFetch(url);
        if (!res.ok) {
          // Skip calendars we can't read (404 / 403) instead of
          // failing the whole import. This commonly happens with
          // leftover shared calendars that the user no longer owns.
          console.warn('[calendar]', cal.id, 'HTTP', res.status);
          break;
        }
        const data = await res.json();
        (data.items || []).forEach(e => {
          // Tag with source calendar so saveEvents can preserve it.
          e._calendarId = cal.id;
          e._calendarName = cal.name;
          out.push(e);
        });
        if (!data.nextPageToken) break;
        pageToken = data.nextPageToken;
      }
      return out;
    };

    // Run calendars in parallel. Google's quota is generous enough
    // for the typical user's 1-10 calendars; chunking only matters
    // for extreme edge cases (50+ calendars).
    const results = await Promise.all(calendars.map(fetchCalendarEvents));
    const merged = [].concat(...results);

    // Dedupe on event id just in case the same event appears on
    // multiple calendars (e.g. an invitee's copy in primary and the
    // organizer's copy in a shared calendar share the same event id
    // after Google normalises it).
    const seen = new Set();
    const unique = merged.filter(e => {
      const key = e.id || (e.summary + ':' + (e.start?.dateTime || e.start?.date || ''));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log('[calendar] fetched', unique.length, 'events from', calendars.length, 'calendars');
    const events = this.saveEvents(unique);
    localStorage.setItem('google_calendar_oauth_connected', '1');

    const syncs = store.get('integrationSyncs') || {};
    syncs.google_calendar = new Date().toISOString();
    store.set('integrationSyncs', syncs);

    return events;
  },

  // RFC 5545 minimal parser — handles the events Google/Outlook send.
  // Not a full implementation (RRULE, VTIMEZONE etc. are ignored) but
  // sufficient for showing a daily schedule.
  parseIcs(icsText) {
    if (!icsText || typeof icsText !== 'string') return [];
    // Unfold continuation lines (RFC5545: lines starting with space/tab continue the previous)
    const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);

    const events = [];
    let current = null;
    const parseIcsDate = (v) => {
      // Formats: 20260409T100000Z, 20260409T100000, 20260409 (all-day)
      const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
      if (!m) return v;
      const [, y, mo, d, h, mi, s, z] = m;
      if (!h) return `${y}-${mo}-${d}`;
      const iso = `${y}-${mo}-${d}T${h}:${mi}:${s || '00'}${z || ''}`;
      return iso;
    };
    const unescape = (s) => (s || '').replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') { current = {}; continue; }
      if (line === 'END:VEVENT') {
        if (current && (current.start || current.startDate)) {
          events.push({
            id: current.uid || ('ics_' + events.length),
            title: unescape(current.summary || ''),
            location: unescape(current.location || ''),
            start: current.start || current.startDate || '',
            end: current.end || current.endDate || '',
            allDay: !!current.startDate && !current.start,
            type: 'default',
            attendees: current.attendees || 0,
            description: unescape(current.description || '').substring(0, 200)
          });
        }
        current = null;
        continue;
      }
      if (!current) continue;
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const keyPart = line.substring(0, colon);
      const value = line.substring(colon + 1);
      const key = keyPart.split(';')[0].toUpperCase();
      switch (key) {
        case 'UID':     current.uid = value; break;
        case 'SUMMARY': current.summary = value; break;
        case 'LOCATION': current.location = value; break;
        case 'DESCRIPTION': current.description = value; break;
        case 'DTSTART':
          if (keyPart.includes('VALUE=DATE')) current.startDate = parseIcsDate(value);
          else current.start = parseIcsDate(value);
          break;
        case 'DTEND':
          if (keyPart.includes('VALUE=DATE')) current.endDate = parseIcsDate(value);
          else current.end = parseIcsDate(value);
          break;
        case 'ATTENDEE': current.attendees = (current.attendees || 0) + 1; break;
      }
    }
    return events;
  },

  // Get today's events
  getToday() {
    const events = store.get('calendarEvents') || [];
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => {
      const eDate = e.start.split('T')[0];
      const eEnd = (e.end || '').split('T')[0];
      return eDate === today || (eDate <= today && eEnd > today);
    });
  },

  // Get events for today + tomorrow (2 days), used by the dashboard
  // widget. Sorted chronologically.
  getNext2Days() {
    const events = store.get('calendarEvents') || [];
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 2); // exclusive: covers today + tomorrow
    return events
      .filter(e => {
        if (!e.start) return false;
        const d = new Date(e.start);
        return d >= start && d < end;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  },

  // Get this week's events
  getThisWeek() {
    const events = store.get('calendarEvents') || [];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return events.filter(e => {
      const d = new Date(e.start);
      return d >= weekStart && d < weekEnd;
    });
  },

  // Analyze schedule load for health impact
  analyzeLoad(events) {
    const nonBirthday = events.filter(e => e.type !== 'birthday');
    const meetings = nonBirthday.filter(e => !e.allDay && e.attendees > 1);
    const tasks = nonBirthday.filter(e => !e.allDay && e.attendees <= 1);
    const travel = nonBirthday.filter(e => e.allDay && e.location);

    // Calculate total hours of scheduled time
    let totalMinutes = 0;
    nonBirthday.filter(e => !e.allDay).forEach(e => {
      if (e.start && e.end) {
        const diff = (new Date(e.end) - new Date(e.start)) / 60000;
        if (diff > 0 && diff < 1440) totalMinutes += diff;
      }
    });

    const totalHours = (totalMinutes / 60).toFixed(1);
    const level = totalHours > 6 ? 'high' : totalHours > 3 ? 'medium' : 'low';

    return {
      totalEvents: nonBirthday.length,
      meetings: meetings.length,
      tasks: tasks.length,
      travel: travel.length,
      totalHours,
      level,
      advice: level === 'high'
        ? 'スケジュールが詰まっています。ME/CFS等の慢性疾患では活動過多がPEMを誘発します。休憩時間を確保してください。'
        : level === 'medium'
        ? '適度なスケジュールです。予定の間に最低30分の休憩を入れましょう。'
        : 'スケジュールに余裕があります。体調に合わせて少しずつ活動を増やせます。'
    };
  },

  // Render calendar widget for dashboard
  renderWidget() {
    const events = store.get('calendarEvents') || [];
    if (events.length === 0) {
      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">📅 スケジュール</span>
          </div>
          <div class="card-body" style="text-align:center;padding:20px;font-size:13px;color:var(--text-muted)">
            カレンダーデータがありません。連携ページからGoogleカレンダーを同期してください。
            <div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="app.navigate('integrations')">連携設定</button></div>
          </div>
        </div>`;
    }

    const next2 = this.getNext2Days();
    const week = this.getThisWeek();
    const weekAnalysis = this.analyzeLoad(week);
    const levelColors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
    const levelLabels = { high: '負荷高', medium: '適度', low: '余裕' };

    // Group the 2-day window by date so we can render a "今日"/"明日"
    // header above each day's events.
    const todayKey = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowKey = tomorrowDate.toISOString().split('T')[0];

    const items = next2.filter(e => e.type !== 'birthday');
    const todayItems = items.filter(e => (e.start || '').split('T')[0] === todayKey);
    const tomorrowItems = items.filter(e => (e.start || '').split('T')[0] === tomorrowKey);
    const birthdays = next2.filter(e => e.type === 'birthday');

    const renderItem = (e) => {
      const time = e.allDay ? '終日' : new Date(e.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;min-width:40px">${time}</span>
        <span style="font-size:12px;flex:1">${Components.escapeHtml(e.title || '')}</span>
        ${e.location ? `<span style="font-size:10px;color:var(--text-muted)">📍${Components.escapeHtml(String(e.location).substring(0, 20))}</span>` : ''}
      </div>`;
    };

    const renderDaySection = (label, list) => {
      if (list.length === 0) {
        return `<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:4px">${label}</div><div style="font-size:12px;color:var(--text-muted);padding:4px 0">予定なし</div></div>`;
      }
      return `<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:4px">${label}（${list.length}件）</div>${list.map(renderItem).join('')}</div>`;
    };

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">📅 スケジュール（2日分）</span>
          <span class="tag" style="background:${levelColors[weekAnalysis.level]}22;color:${levelColors[weekAnalysis.level]}">${levelLabels[weekAnalysis.level]}（週${weekAnalysis.totalHours}h）</span>
        </div>
        <div class="card-body" style="padding:12px 16px">
          ${weekAnalysis.level !== 'low' ? `<div style="padding:6px 10px;background:${weekAnalysis.level === 'high' ? 'var(--danger-bg)' : 'var(--warning-bg)'};border-radius:var(--radius-sm);font-size:11px;margin-bottom:10px;color:${levelColors[weekAnalysis.level]}">${weekAnalysis.advice}</div>` : ''}
          ${renderDaySection('今日', todayItems)}
          ${renderDaySection('明日', tomorrowItems)}
          ${birthdays.length > 0 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:6px">🎂 ${birthdays.map(b => Components.escapeHtml(b.title.replace('さんの誕生日', ''))).join('、')}さんの誕生日</div>` : ''}
        </div>
      </div>`;
  }
};


