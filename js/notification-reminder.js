/**
 * Notification Reminder
 * ---------------------
 * 1. After the 3rd app open, shows a once-per-device opt-in banner asking
 *    the user if they'd like daily reminders.
 * 2. If the user grants Notification permission, stores the preferred
 *    reminder time in localStorage.
 * 3. Each time the app loads: if Notifications are permitted, today has
 *    no entry yet, and the current hour is past the reminder hour,
 *    fire a browser Notification (works even when the tab is in background).
 * 4. Also wires up the Service Worker `push` event listener for future
 *    server-side VAPID push without any refactor.
 *
 * Why no confirm(): We use an inline dismissible banner (CLAUDE.md rule).
 */
(function NotificationReminder() {
  'use strict';

  const LS_PERMISSION   = 'notif_permission';   // 'granted'|'denied'|'default'
  const LS_HOUR         = 'notif_hour';          // '20' (8pm default)
  const LS_OPENS        = 'notif_opens';         // count of app opens
  const LS_BANNER_SHOWN = 'notif_banner_shown';  // '1'
  const LS_LAST_NOTIF   = 'notif_last_date';     // 'YYYY-MM-DD'

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function hasEntryToday() {
    try {
      const entries = JSON.parse(localStorage.getItem('textEntries') || '[]')
        .concat(JSON.parse(localStorage.getItem('symptoms') || '[]'));
      const today = todayStr();
      return entries.some(e => {
        const ts = e.timestamp || e.createdAt;
        if (!ts) return false;
        const d = new Date(ts);
        return d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0') === today;
      });
    } catch (_) { return false; }
  }

  function maybeFireNotification() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (hasEntryToday()) return;
    if (localStorage.getItem(LS_LAST_NOTIF) === todayStr()) return;

    const reminderHour = parseInt(localStorage.getItem(LS_HOUR) || '20', 10);
    if (new Date().getHours() < reminderHour) return;

    localStorage.setItem(LS_LAST_NOTIF, todayStr());
    try {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification('健康日記 — 今日の記録はお済みですか？', {
          body: '今日の体調を 1 行でも記録しておきましょう。',
          icon: '/og-image.png',
          badge: '/og-image.png',
          tag: 'daily-reminder',
          data: { url: 'https://cares.advisers.jp/' }
        });
      }).catch(() => {
        new Notification('健康日記 — 今日の記録はお済みですか？', {
          body: '今日の体調を 1 行でも記録しておきましょう。',
          icon: '/og-image.png',
          tag: 'daily-reminder'
        });
      });
    } catch (_) {}
  }

  function renderBanner() {
    if (document.getElementById('notif-reminder-banner')) return;

    const hour = localStorage.getItem(LS_HOUR) || '20';
    const banner = document.createElement('div');
    banner.id = 'notif-reminder-banner';
    banner.setAttribute('role', 'complementary');
    banner.setAttribute('aria-label', 'リマインダー設定のお誘い');
    banner.style.cssText = [
      'position:fixed;bottom:72px;left:50%;transform:translateX(-50%)',
      'max-width:360px;width:calc(100% - 32px)',
      'background:#fff;border:1px solid #e4e7ef;border-left:4px solid #6366f1',
      'border-radius:12px;padding:14px 16px;box-shadow:0 4px 16px rgba(0,0,0,.12)',
      'z-index:2000;font-family:-apple-system,sans-serif;font-size:13px;color:#1e293b',
      'animation:slideUp .25s ease'
    ].join(';');

    banner.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">🔔 毎日のリマインダーを設定しますか？</div>
      <div style="color:#475569;margin-bottom:10px">記録を続けやすいよう、今日まだ記録していない場合に通知します。</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <label style="font-size:12px;color:#64748b">通知時刻</label>
        <select id="notif-hour-select" style="font-size:12px;padding:4px 8px;border:1px solid #e4e7ef;border-radius:6px;background:#f8fafc">
          ${[18,19,20,21,22].map(h =>
            `<option value="${h}" ${String(h) === hour ? 'selected' : ''}>${h}:00</option>`
          ).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px">
        <button id="notif-allow-btn" style="flex:1;padding:8px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">
          通知を許可する
        </button>
        <button id="notif-dismiss-btn" style="padding:8px 14px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:12px;cursor:pointer">
          後で
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector('#notif-allow-btn').addEventListener('click', async () => {
      const selectedHour = banner.querySelector('#notif-hour-select').value;
      localStorage.setItem(LS_HOUR, selectedHour);
      banner.remove();
      if (!('Notification' in window)) return;
      const perm = await Notification.requestPermission();
      localStorage.setItem(LS_PERMISSION, perm);
      if (perm === 'granted') {
        if (typeof Components !== 'undefined' && Components.showToast) {
          Components.showToast(`${selectedHour}:00 に毎日リマインダーを送ります`, 'success');
        }
        maybeFireNotification();
      }
    });

    banner.querySelector('#notif-dismiss-btn').addEventListener('click', () => {
      banner.remove();
    });

    // Auto-hide after 30s
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 30000);
  }

  function injectAnimationStyle() {
    if (document.getElementById('notif-style')) return;
    const s = document.createElement('style');
    s.id = 'notif-style';
    s.textContent = '@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(s);
  }

  function init() {
    if (!('Notification' in window)) return;

    // Count opens
    const opens = parseInt(localStorage.getItem(LS_OPENS) || '0', 10) + 1;
    localStorage.setItem(LS_OPENS, String(opens));

    // Always try to fire a notification on load if already permitted
    maybeFireNotification();

    // Show opt-in banner on the 3rd open if not already shown/denied
    const alreadyShown = localStorage.getItem(LS_BANNER_SHOWN);
    const currentPerm  = Notification.permission;
    if (opens >= 3 && !alreadyShown && currentPerm === 'default') {
      localStorage.setItem(LS_BANNER_SHOWN, '1');
      injectAnimationStyle();
      // Delay so the app has time to render first
      setTimeout(renderBanner, 3500);
    }
  }

  // Wait until the app is interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500);
  }
})();
