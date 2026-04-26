/**
 * In-app browser detector + external-browser nudge banner.
 *
 * Facebook, Instagram, LINE, X, Yahoo!Japan, Naver, Kakao etc all
 * ship with WebViews that have notorious fetch / CORS / cookie
 * restrictions which break our AI proxy calls with a generic
 * "Load failed" error. They also can't complete Firebase auth
 * flows reliably. The universal fix is to tell the user to open
 * the page in the OS default browser.
 *
 * Behavior:
 * 1. Detect the in-app browser by UA
 * 2. Show a dismissable top banner with two options:
 *    - 「外部ブラウザで開く」→ tries intent:// → window.open → clipboard fallback
 *    - 「このまま続ける」→ set localStorage.dismissed_inapp_banner = '1'
 *
 * Exposes globals so other code (notably the friendly error renderer
 * in index.html guestAnalyze) can reuse the same open-external logic
 * without re-implementing it:
 *   - window.detectInAppBrowser()  → { kind, label } | null
 *   - window.openInExternalBrowser() → tries to launch external browser
 *
 * No styling dependencies — all inline so it can run even on the
 * static disease LPs that don't load the main app CSS.
 */
(function () {
  'use strict';

  function detectInApp() {
    var ua = (navigator.userAgent || '').toLowerCase();
    // FB / Instagram share the FBAN/FBAV tokens in their WebViews
    if (/fbav|fban|instagram/i.test(ua)) return { kind: 'facebook', label: 'Facebook / Instagram' };
    if (/line\//i.test(ua)) return { kind: 'line', label: 'LINE' };
    if (/twitter|twitterandroid/i.test(ua)) return { kind: 'twitter', label: 'X (Twitter)' };
    if (/micromessenger/i.test(ua)) return { kind: 'wechat', label: 'WeChat' };
    if (/tiktok|bytedancewebview/i.test(ua)) return { kind: 'tiktok', label: 'TikTok' };
    // Yahoo!JAPAN: iOS = "YJApp-IOS/...", Android = "jp.co.yahoo.android.yjtop/..."
    // (also yjmobile / yjnews / etc — match on any yj* token).
    if (/yjapp|yj-?ios|yj-?android|jp\.co\.yahoo|yjmobile|yjnews/i.test(ua)) return { kind: 'yahoo', label: 'Yahoo!JAPAN' };
    if (/naver/i.test(ua)) return { kind: 'naver', label: 'NAVER' };
    if (/kakaotalk|kakaostory/i.test(ua)) return { kind: 'kakao', label: 'Kakao' };
    if (/pinterest/i.test(ua)) return { kind: 'pinterest', label: 'Pinterest' };
    if (/snapchat/i.test(ua)) return { kind: 'snapchat', label: 'Snapchat' };
    // Meta Threads ships its own WebView token
    if (/barcelona/i.test(ua)) return { kind: 'threads', label: 'Threads' };
    return null;
  }

  function openExternal() {
    var ua = navigator.userAgent || '';
    var isAndroid = /android/i.test(ua);
    var currentUrl = window.location.href;
    if (isAndroid) {
      try {
        window.location.href = 'intent:' + currentUrl.replace(/^https?:/, '') +
          '#Intent;scheme=https;package=com.android.chrome;end';
        return;
      } catch (_) {}
    }
    try {
      var w = window.open(currentUrl, '_blank', 'noopener');
      if (w) return;
    } catch (_) {}
    copyUrlAndPrompt();
  }

  function copyUrlAndPrompt() {
    var currentUrl = window.location.href;
    var copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentUrl);
        copied = true;
      }
    } catch (_) {}
    if (!copied) {
      try {
        var ta = document.createElement('textarea');
        ta.value = currentUrl;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copied = true;
      } catch (_) {}
    }
    var toast = document.createElement('div');
    toast.textContent = copied
      ? 'URL をコピーしました。Safari または Chrome を開いてペーストしてください。'
      : 'URL のコピーに失敗しました。アドレスバーからコピーしてください。';
    toast.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
      'padding:12px 18px;background:#1e293b;color:#fff;border-radius:10px;' +
      'font-size:12px;z-index:10001;max-width:90%;text-align:center';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3500);
  }

  // Expose helpers so the AI error renderer can offer the same
  // "外部ブラウザで開く" button inside its error UI without redoing
  // the intent / window.open / clipboard fallback chain.
  window.detectInAppBrowser = detectInApp;
  window.openInExternalBrowser = openExternal;
  window.copyAppUrl = copyUrlAndPrompt;

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var hit = detectInApp();
    if (!hit) return;

    try {
      if (localStorage.getItem('dismissed_inapp_banner') === '1') return;
    } catch (_) { /* fall through */ }

    var bar = document.createElement('div');
    bar.id = 'inapp-browser-banner';
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:10000;' +
      'padding:12px 14px;background:#fff7ed;border-bottom:1.5px solid #fb923c;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.08);font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;' +
      'font-size:13px;color:#7c2d12;line-height:1.6';

    var msg = hit.label + ' 内のブラウザでは一部機能が動作しない場合があります。';
    bar.innerHTML =
      '<div style="display:flex;align-items:start;gap:10px;max-width:820px;margin:0 auto">' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;margin-bottom:2px">⚠️ ' + msg + '</div>' +
          '<div style="font-size:11px;color:#9a3412">「外部ブラウザで開く」をタップ、または URL をコピーして Safari / Chrome でお開きください。</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:8px;max-width:820px;margin-left:auto;margin-right:auto">' +
        '<button id="inapp-open-external" style="flex:1;padding:10px 12px;background:#ea580c;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">🌐 外部ブラウザで開く</button>' +
        '<button id="inapp-copy-url" style="padding:10px 12px;background:#fff;color:#ea580c;border:1.5px solid #ea580c;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">📋 URL をコピー</button>' +
        '<button id="inapp-dismiss" style="padding:10px 10px;background:transparent;color:#9a3412;border:none;font-size:12px;cursor:pointer" aria-label="閉じる">✕</button>' +
      '</div>';

    document.body.appendChild(bar);
    // Shift page content down so the banner doesn't hide the hero.
    document.body.style.paddingTop = '104px';

    document.getElementById('inapp-open-external').addEventListener('click', openExternal);
    document.getElementById('inapp-copy-url').addEventListener('click', copyUrlAndPrompt);

    document.getElementById('inapp-dismiss').addEventListener('click', function () {
      try { localStorage.setItem('dismissed_inapp_banner', '1'); } catch (_) {}
      bar.remove();
      document.body.style.paddingTop = '';
    });
  });
})();
