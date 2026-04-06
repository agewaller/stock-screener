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
      .map(e => ({
        id: e.id,
        title: e.summary || '',
        location: e.location || '',
        start: e.start?.dateTime || e.start?.date || '',
        end: e.end?.dateTime || e.end?.date || '',
        allDay: e.allDay || false,
        type: e.eventType || 'default',
        attendees: e.numAttendees || 0,
        description: (e.description || '').replace(/<[^>]*>/g, '').substring(0, 200)
      }));

    store.set('calendarEvents', cleaned);
    return cleaned;
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

    const today = this.getToday();
    const week = this.getThisWeek();
    const weekAnalysis = this.analyzeLoad(week);
    const levelColors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
    const levelLabels = { high: '負荷高', medium: '適度', low: '余裕' };

    const todayItems = today.filter(e => e.type !== 'birthday').slice(0, 5);
    const birthdays = today.filter(e => e.type === 'birthday');

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">📅 今日のスケジュール</span>
          <span class="tag" style="background:${levelColors[weekAnalysis.level]}22;color:${levelColors[weekAnalysis.level]}">${levelLabels[weekAnalysis.level]}（週${weekAnalysis.totalHours}h）</span>
        </div>
        <div class="card-body" style="padding:12px 16px">
          ${weekAnalysis.level !== 'low' ? `<div style="padding:6px 10px;background:${weekAnalysis.level === 'high' ? 'var(--danger-bg)' : 'var(--warning-bg)'};border-radius:var(--radius-sm);font-size:11px;margin-bottom:10px;color:${levelColors[weekAnalysis.level]}">${weekAnalysis.advice}</div>` : ''}
          ${todayItems.length > 0 ? todayItems.map(e => {
            const time = e.allDay ? '終日' : new Date(e.start).toLocaleTimeString('ja-JP', {hour:'2-digit',minute:'2-digit'});
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;min-width:40px">${time}</span>
              <span style="font-size:12px;flex:1">${e.title}</span>
              ${e.location ? `<span style="font-size:10px;color:var(--text-muted)">📍${e.location.substring(0, 20)}</span>` : ''}
            </div>`;
          }).join('') : '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">今日の予定はありません</div>'}
          ${birthdays.length > 0 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:6px">🎂 ${birthdays.map(b => b.title.replace('さんの誕生日','')).join('、')}さんの誕生日</div>` : ''}
        </div>
      </div>`;
  }
};
