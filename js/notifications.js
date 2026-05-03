// === js/notifications.js ===
/* ============================================================
   Daily Reminder & Web Notifications
   Web Notifications API (browser/tab must be open).
   True push (app-closed) needs a VAPID server — deferred.
   ============================================================ */
var NotificationManager = {

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission() {
    return this.isSupported() ? Notification.permission : 'unsupported';
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  getReminderTime() {
    return localStorage.getItem('reminder_time') || '20:00';
  },

  setReminderTime(time) {
    localStorage.setItem('reminder_time', time);
  },

  isEnabled() {
    return localStorage.getItem('reminder_enabled') === 'true';
  },

  setEnabled(val) {
    localStorage.setItem('reminder_enabled', val ? 'true' : 'false');
  },

  // Has the user recorded at least one entry today (JST)?
  hasLoggedToday() {
    const entries = (typeof store !== 'undefined' ? store.get('textEntries') : null) || [];
    if (!entries.length) return false;
    const todayJst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    return entries.some(e => e.timestamp && e.timestamp.slice(0, 10) === todayJst);
  },

  show(title, body, tag) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/og-image.svg',
      badge: '/og-image.svg',
      tag: tag || 'daily-reminder',
      renotify: false
    });
    n.onclick = function() {
      window.focus();
      n.close();
    };
    return n;
  },

  // Schedule the next occurrence of the daily reminder.
  // Re-schedules itself so a single init() call keeps running.
  _scheduleNext() {
    const self = this;
    const [h, m] = (this.getReminderTime() || '20:00').split(':').map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;
    clearTimeout(this._timer);
    this._timer = setTimeout(function() {
      self._fire();
      self._scheduleNext();
    }, delay);
  },

  _fire() {
    if (!this.isEnabled()) return;
    if (Notification.permission !== 'granted') return;
    if (this.hasLoggedToday()) return;
    this.show(
      '健康日記 — 今日の記録をしましょう',
      '1行だけでも大丈夫です。体調を書いて、パターンを把握しましょう。'
    );
  },

  // Ask for permission after a user's first log entry, once per session.
  _askedThisSession: false,
  promptAfterFirstEntry() {
    if (this._askedThisSession) return;
    if (!this.isSupported()) return;
    if (Notification.permission !== 'default') return;
    if (this.isEnabled()) return;
    this._askedThisSession = true;
    // Small delay so toast doesn't overlap the entry confirmation
    setTimeout(() => {
      if (typeof Components !== 'undefined' && Components.showToast) {
        Components.showToast(
          '毎日のリマインダーを設定しますか？ → 設定 > 通知',
          'info',
          6000
        );
      }
    }, 1500);
  },

  // Called once on app init
  init() {
    if (!this.isSupported()) return;
    if (this.isEnabled() && Notification.permission === 'granted') {
      this._scheduleNext();
    }
  }
};
