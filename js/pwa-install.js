/**
 * PWA "ホーム画面に追加" prompt — progressive enhancement.
 *
 * On Android Chrome: captures `beforeinstallprompt` and shows a
 * dismissable bottom banner with a native-install button.
 * On iOS Safari: shows manual instructions since iOS doesn't fire
 * beforeinstallprompt. Detects iOS + standalone mode to avoid
 * showing after the app is already installed.
 *
 * Cooldown: dismissed banner is hidden for 30 days via localStorage.
 * Auto-trigger: shows after user's first successful entry (listens for
 * custom event `health-diary:first-entry`) OR after 90 s of idle time,
 * whichever comes first.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pwa_install_dismissed_at';
  var COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  function isDismissedRecently() {
    try {
      var ts = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return ts && (Date.now() - ts) < COOLDOWN_MS;
    } catch (_) { return false; }
  }

  function setDismissed() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isAndroid() {
    return /android/i.test(navigator.userAgent);
  }

  // Banner factory — shared between Android (native prompt) and iOS (manual guide).
  function createBanner(config) {
    var bar = document.createElement('div');
    bar.id = 'pwa-install-banner';
    bar.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
      'padding:14px 16px 16px;background:#fff;' +
      'border-top:2px solid #c7d2fe;' +
      'box-shadow:0 -4px 16px rgba(99,102,241,0.12);' +
      'font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;' +
      'animation:pwa-slide-up 0.3s ease-out';

    if (!document.getElementById('pwa-install-style')) {
      var st = document.createElement('style');
      st.id = 'pwa-install-style';
      st.textContent =
        '@keyframes pwa-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}';
      document.head.appendChild(st);
    }

    bar.innerHTML =
      '<div style="display:flex;align-items:start;gap:12px;max-width:540px;margin:0 auto">' +
        '<div style="font-size:32px;flex:0 0 auto;line-height:1">📱</div>' +
        '<div style="flex:1">' +
          '<div style="font-size:14px;font-weight:700;color:#3730a3;margin-bottom:3px">ホーム画面に追加しませんか？</div>' +
          '<div style="font-size:11px;color:#6366f1;line-height:1.6">' + config.desc + '</div>' +
        '</div>' +
        '<button id="pwa-install-close" aria-label="閉じる" ' +
          'style="flex:0 0 auto;background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 2px;line-height:1">✕</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;max-width:540px;margin-left:auto;margin-right:auto">' +
        config.buttons +
      '</div>';

    document.body.appendChild(bar);

    document.getElementById('pwa-install-close').addEventListener('click', function () {
      setDismissed();
      bar.style.animation = 'none';
      bar.style.transform = 'translateY(100%)';
      bar.style.transition = 'transform 0.25s ease-in';
      setTimeout(function () { bar.remove(); }, 280);
    });

    return bar;
  }

  // Android / Chrome: native install prompt flow.
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function showAndroidBanner() {
    if (!deferredPrompt || isDismissedRecently() || isStandalone()) return;

    var bar = createBanner({
      desc: 'アプリとして使うと素早く開けて、オフラインでも記録できます。',
      buttons:
        '<button id="pwa-install-btn" ' +
          'style="flex:1;padding:11px;background:#6366f1;color:#fff;border:none;border-radius:10px;' +
          'font-size:13px;font-weight:700;cursor:pointer">ホーム画面に追加</button>' +
        '<button id="pwa-install-later" ' +
          'style="padding:11px 16px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;' +
          'font-size:12px;cursor:pointer">後で</button>'
    });

    document.getElementById('pwa-install-btn').addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (result) {
        if (result.outcome === 'accepted') setDismissed();
        deferredPrompt = null;
        bar.remove();
      });
    });

    document.getElementById('pwa-install-later').addEventListener('click', function () {
      setDismissed();
      bar.remove();
    });
  }

  // iOS Safari: manual share-sheet instructions.
  function showIOSBanner() {
    if (isDismissedRecently() || isStandalone()) return;

    createBanner({
      desc: 'Safari の共有ボタン（⎋）→「ホーム画面に追加」をタップすると、アプリとして使えます。',
      buttons:
        '<button id="pwa-install-later" ' +
          'style="flex:1;padding:11px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;' +
          'font-size:13px;cursor:pointer">わかりました</button>'
    });

    document.getElementById('pwa-install-later').addEventListener('click', function () {
      setDismissed();
      var bar = document.getElementById('pwa-install-banner');
      if (bar) bar.remove();
    });
  }

  function maybeShow() {
    if (isStandalone() || isDismissedRecently()) return;
    if (deferredPrompt && isAndroid()) {
      showAndroidBanner();
    } else if (isIOS()) {
      showIOSBanner();
    }
  }

  // Trigger: show on first entry event or after 90 s idle.
  var shown = false;
  function triggerOnce() {
    if (shown) return;
    shown = true;
    maybeShow();
  }

  window.addEventListener('health-diary:first-entry', triggerOnce);
  setTimeout(triggerOnce, 90000);
})();
