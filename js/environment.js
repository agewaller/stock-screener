// === js/environment.js ===
/* ============================================================
   Environment detection — switches Firebase project and
   Cloudflare Worker URL based on the hostname so we can run a
   completely isolated staging copy at staging.cares.advisers.jp
   without touching production data.

   Resolution order for both Firebase config and worker URL is:
     1. localStorage override (admin panel "API キー設定" など)
     2. Environment.<env>.firebaseConfig / workerUrl
     3. null → admin must configure via panel

   Firebase configs are injected at deploy time by
   scripts/inject-firebase-config.sh:
     - Production: GitHub Actions (pages.yml) reads repo Secrets
       (FB_PROD_API_KEY etc.) and substitutes the FB_PROD
       placeholders below.
     - Staging: Cloudflare Pages runs the same script with its
       project-level environment variables (FB_STAGING_API_KEY etc.).

   Until injection runs the placeholders remain literal — their
   apiKey value starts with the marker checked by injected() —
   and firebaseConfig() returns null. FirebaseBackend then falls
   back to localStorage so an admin can configure manually for
   local development.

   This file is loaded BEFORE config.js so other modules can
   read Environment.current safely. It is intentionally small
   and dependency-free.
   ============================================================ */
var Environment = (function () {
  var host = '';
  try { host = (location && location.hostname || '').toLowerCase(); } catch (_) {}

  var current;
  if (host === 'staging.cares.advisers.jp') {
    current = 'staging';
  } else if (host === 'cares.advisers.jp' || host.endsWith('.github.io')) {
    current = 'production';
  } else {
    current = 'local';
  }

  // Placeholders below are substituted by scripts/inject-firebase-config.sh.
  // Keep the __FB_<ENV>_<KEY>__ shape — the script and the placeholder
  // check in injected() both depend on it.
  var PRODUCTION_FIREBASE = {
    apiKey: '__FB_PROD_API_KEY__',
    authDomain: '__FB_PROD_AUTH_DOMAIN__',
    projectId: '__FB_PROD_PROJECT_ID__',
    storageBucket: '__FB_PROD_STORAGE_BUCKET__',
    messagingSenderId: '__FB_PROD_MESSAGING_SENDER_ID__',
    appId: '__FB_PROD_APP_ID__',
    measurementId: '__FB_PROD_MEASUREMENT_ID__'
  };

  var STAGING_FIREBASE = {
    apiKey: '__FB_STAGING_API_KEY__',
    authDomain: '__FB_STAGING_AUTH_DOMAIN__',
    projectId: '__FB_STAGING_PROJECT_ID__',
    storageBucket: '__FB_STAGING_STORAGE_BUCKET__',
    messagingSenderId: '__FB_STAGING_MESSAGING_SENDER_ID__',
    appId: '__FB_STAGING_APP_ID__',
    measurementId: '__FB_STAGING_MEASUREMENT_ID__'
  };

  var STAGING_WORKER_URL = 'https://stock-screener-staging.agewaller.workers.dev';
  var PRODUCTION_WORKER_URL = 'https://cares-relay.agewaller.workers.dev';

  // Return cfg only if the injector has substituted the placeholders.
  // Un-injected placeholders begin with "__FB_" so we detect that and
  // return null, letting FirebaseBackend fall back to localStorage.
  function injected(cfg) {
    if (!cfg || !cfg.apiKey) return null;
    if (cfg.apiKey.indexOf('__FB_') === 0) return null;
    return cfg;
  }

  return {
    current: current,
    isStaging: current === 'staging',
    isProduction: current === 'production',
    isLocal: current === 'local',

    firebaseConfig: function () {
      if (current === 'production') return injected(PRODUCTION_FIREBASE);
      if (current === 'staging') return injected(STAGING_FIREBASE);
      return null;
    },

    workerUrl: function () {
      if (current === 'staging') return STAGING_WORKER_URL;
      if (current === 'production') return PRODUCTION_WORKER_URL;
      return null;
    }
  };
})();
