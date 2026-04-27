/**
 * Cookie / Privacy Consent Banner for 健康日記
 *
 * 個人情報保護法（改正 2022）・GDPR Art.7 対応。
 * 健康情報（要配慮個人情報）を扱うサービスのため、
 * 利用目的の明示と同意取得を初回訪問時に実施する。
 *
 * 設計方針:
 * - クッキーレス（localStorage のみ使用）
 * - 解析トラッキング（CF Web Analytics）はオプトイン
 * - 機能維持に必要な localStorage（設定・健康データ）は必須扱い
 * - 同意状態は 'health_diary_consent' キーに JSON で保存
 * - 同意後は analytics.js が CF ビーコンを読み込む
 */
(function () {
  'use strict';

  var LS_KEY = 'health_diary_consent';
  var CONSENT_VERSION = 1;

  function getConsent() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function saveConsent(analyticsOk) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        analytics: analyticsOk,
        timestamp: Date.now()
      }));
    } catch (_) {}
  }

  function removeBanner() {
    var el = document.getElementById('hd-consent-banner');
    if (el) {
      el.style.transform = 'translateY(100%)';
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
  }

  function injectStyles() {
    if (document.getElementById('hd-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'hd-consent-styles';
    style.textContent = [
      '#hd-consent-banner{',
        'position:fixed;bottom:0;left:0;right:0;z-index:99999;',
        'background:#fff;border-top:2px solid #6C63FF;',
        'padding:14px 20px;',
        'display:flex;flex-wrap:wrap;gap:10px;align-items:center;',
        'box-shadow:0 -4px 20px rgba(0,0,0,0.12);',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'font-size:13px;color:#374151;line-height:1.5;',
        'transition:transform .3s ease,opacity .3s ease;',
      '}',
      '#hd-consent-banner .hd-consent-text{flex:1;min-width:220px}',
      '#hd-consent-banner .hd-consent-text a{color:#6C63FF;text-decoration:none}',
      '#hd-consent-banner .hd-consent-text a:hover{text-decoration:underline}',
      '#hd-consent-banner .hd-consent-btns{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}',
      '.hd-btn-accept{background:#6C63FF;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap}',
      '.hd-btn-accept:hover{background:#5a52e8}',
      '.hd-btn-essential{background:#fff;color:#6C63FF;border:1.5px solid #6C63FF;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap}',
      '.hd-btn-essential:hover{background:#f5f4ff}',
      '@media(max-width:480px){',
        '#hd-consent-banner{flex-direction:column;align-items:flex-start}',
        '#hd-consent-banner .hd-consent-btns{width:100%}',
        '.hd-btn-accept,.hd-btn-essential{flex:1;text-align:center}',
      '}'
    ].join('');
    (document.head || document.body).appendChild(style);
  }

  function buildBanner() {
    var privacyUrl = '/about.html#privacy';
    // Detect if we're on a disease LP or the main app
    try {
      var host = window.location.hostname;
      if (host.indexOf('cares.advisers.jp') !== -1 || host === 'localhost') {
        privacyUrl = '/about.html#privacy';
      }
    } catch (_) {}

    var banner = document.createElement('div');
    banner.id = 'hd-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'プライバシー設定');
    banner.innerHTML = [
      '<div class="hd-consent-text">',
        '<strong>プライバシー設定</strong>　',
        'このサービスは体調データを記録・分析するために機能的 Cookie（localStorage）を使用します。',
        '匿名のアクセス解析（クッキーレス）へのご同意もお願いできますか？',
        ' <a href="' + privacyUrl + '" target="_blank" rel="noopener">プライバシーポリシー</a>',
      '</div>',
      '<div class="hd-consent-btns">',
        '<button class="hd-btn-essential" id="hd-btn-essential" type="button">機能のみ同意</button>',
        '<button class="hd-btn-accept" id="hd-btn-accept" type="button">すべて同意</button>',
      '</div>'
    ].join('');
    return banner;
  }

  function init() {
    var consent = getConsent();
    // Skip if already consented (any version)
    if (consent && typeof consent.analytics === 'boolean') return;

    injectStyles();
    var banner = buildBanner();
    document.body.appendChild(banner);

    document.getElementById('hd-btn-accept').addEventListener('click', function () {
      saveConsent(true);
      removeBanner();
      // Reload analytics script so tracking starts immediately
      if (typeof window._hdReloadAnalytics === 'function') window._hdReloadAnalytics();
    });

    document.getElementById('hd-btn-essential').addEventListener('click', function () {
      saveConsent(false);
      removeBanner();
    });

    // Keyboard: Escape = essential-only (safe default)
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        saveConsent(false);
        removeBanner();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external use (e.g., settings page "プライバシー設定を変更")
  window.hdConsentBanner = {
    reset: function () {
      try { localStorage.removeItem(LS_KEY); } catch (_) {}
      init();
    },
    getConsent: getConsent
  };
})();
