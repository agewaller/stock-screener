// === js/environment.js ===
/* ============================================================
   Environment detection — switches Firebase project and
   Cloudflare Worker URL based on the hostname so we can run a
   completely isolated staging copy at staging.cares.advisers.jp
   without touching production data.

   Resolution order for both Firebase config and worker URL is:
     1. localStorage override (admin panel "API キー設定" など)
     2. Environment.<env>.firebaseConfig / workerUrl
     3. CONFIG.FIREBASE / hardcoded fallback (production)

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

  // Staging Firebase config — filled in after the staging Firebase
  // project is created (Phase 3). Until then it stays empty so
  // FirebaseBackend.isConfigured() returns false on staging and the
  // admin can paste the config via the admin panel without a deploy.
  var STAGING_FIREBASE = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  var STAGING_WORKER_URL = 'https://stock-screener-staging.agewaller.workers.dev';
  var PRODUCTION_WORKER_URL = 'https://cares-relay.agewaller.workers.dev';

  return {
    current: current,
    isStaging: current === 'staging',
    isProduction: current === 'production',
    isLocal: current === 'local',

    // Returns the per-environment Firebase config, or null if the
    // environment has no preset (caller should fall back to CONFIG.FIREBASE).
    firebaseConfig: function () {
      if (current === 'staging') {
        return STAGING_FIREBASE.apiKey ? STAGING_FIREBASE : null;
      }
      return null;
    },

    // Returns the per-environment Anthropic proxy URL, or null if
    // the environment has no preset (caller should fall back).
    workerUrl: function () {
      if (current === 'staging') return STAGING_WORKER_URL;
      if (current === 'production') return PRODUCTION_WORKER_URL;
      return null;
    }
  };
})();
