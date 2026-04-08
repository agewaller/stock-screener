/* ============================================================
   Firebase Backend - Auth + Firestore Cloud Database
   Replaces localStorage with cloud persistence
   ============================================================ */
var FirebaseBackend = {
  app: null,
  auth: null,
  db: null,
  initialized: false,
  userId: null,
  // True while loadAllData() is populating the store from Firestore.
  // Autosync listeners check this flag and skip, so that loaded entries
  // are not re-written back to Firestore as new docs (which would
  // duplicate the latest record on every page reload).
  _loading: false,

  // Initialize Firebase (call once on page load)
  init(firebaseConfig) {
    if (this.initialized) return;

    try {
      // Firebase v9+ compat mode (loaded via CDN)
      this.app = firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      // Persist login across browser restarts (LOCAL = survives tab/browser close)
      this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      this.db = firebase.firestore();

      // Enable offline persistence
      this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence: multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence: browser not supported');
        }
      });

      // Handle redirect result (for mobile Google sign-in)
      this.auth.getRedirectResult().then(result => {
        if (result?.user) {
          Components.showToast(`${result.user.displayName || result.user.email} でログインしました`, 'success');
        }
      }).catch(err => {
        console.warn('Redirect result error:', err.message);
      });

      // Listen for auth state changes
      this.auth.onAuthStateChanged(user => {
        if (user) {
          this.userId = user.uid;
          const userData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          };
          store.update({ user: userData, isAuthenticated: true });

          // Update sidebar user info
          const avatarEl = document.getElementById('user-avatar');
          const nameEl = document.getElementById('user-name');
          if (avatarEl) {
            if (user.photoURL) {
              avatarEl.innerHTML = `<img src="${user.photoURL}" alt="">`;
            } else {
              avatarEl.textContent = (user.displayName || user.email || '?')[0];
            }
          }
          if (nameEl) nameEl.textContent = user.displayName || user.email;

          // Load user data from Firestore
          this.loadAllData();

          // Navigate to dashboard on successful login. Users without a
          // selected disease can pick one later from settings; the
          // dashboard handles the empty-disease state.
          if (app.currentPage === 'login') {
            app.navigate('dashboard');
          }
        } else {
          this.userId = null;
          // Only force login if not already authenticated via localStorage
          if (!store.get('isAuthenticated')) {
            store.update({ user: null, isAuthenticated: false });
            app.navigate('login');
          }
        }
      });

      this.initialized = true;
      console.log('Firebase initialized');
    } catch (err) {
      console.error('Firebase init failed:', err);
      Components.showToast('Firebase初期化エラー: ' + err.message, 'error');
    }
  },

  // ---- Authentication ----
  async signInWithGoogle() {
    // NOTE: we use signInWithPopup on ALL devices (including mobile).
    //
    // Why: Firebase's signInWithRedirect is broken on iOS Safari and other
    // browsers with ITP (Intelligent Tracking Prevention) whenever the site
    // domain (cares.advisers.jp) differs from the Firebase authDomain
    // (care-14c31.firebaseapp.com). On redirect return, Firebase cannot read
    // the auth state that was set on the third-party authDomain, so login
    // silently fails. signInWithPopup avoids this by communicating via
    // postMessage, which ITP does not block. This is Firebase's current
    // recommendation since SDK 10+ when not hosting on the authDomain.
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await this.auth.signInWithPopup(provider);
      Components.showToast(`${result.user.displayName || result.user.email} でログインしました`, 'success');
      return result.user;
    } catch (err) {
      // User closed the popup — silent, no toast
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return null;
      }
      // Popup blocked by browser — guide user to email auth instead of
      // falling back to signInWithRedirect (which is broken on iOS/ITP).
      if (err.code === 'auth/popup-blocked') {
        Components.showToast('ポップアップがブロックされました。メールアドレスでの登録をお試しください。', 'error');
        return null;
      }
      console.error('[Firebase] Google sign-in error:', err);
      Components.showToast('Googleログインがうまくいきませんでした。メールアドレスでの登録もお試しください。', 'error');
      throw err;
    }
  },

  async signInWithEmail(email, password) {
    try {
      // Try sign in first, if fails try create account
      try {
        const result = await this.auth.signInWithEmailAndPassword(email, password);
        Components.showToast('おかえりなさい。ログインしました', 'success');
        return result.user;
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // New user - create account
          try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            Components.showToast('アカウントを作成しました。ようこそ！', 'success');
            return result.user;
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              Components.showToast('このメールアドレスは登録済みです。パスワードをご確認ください', 'error');
            } else if (createErr.code === 'auth/weak-password') {
              Components.showToast('パスワードは6文字以上で設定してください', 'error');
            } else if (createErr.code === 'auth/invalid-email') {
              Components.showToast('メールアドレスの形式が正しくありません', 'error');
            } else {
              Components.showToast('登録できませんでした。もう一度お試しください', 'error');
            }
            throw createErr;
          }
        }
        if (err.code === 'auth/wrong-password') {
          Components.showToast('パスワードが違います。もう一度お試しください', 'error');
        } else if (err.code === 'auth/too-many-requests') {
          Components.showToast('しばらく時間をおいてからお試しください', 'error');
        } else if (err.code === 'auth/invalid-email') {
          Components.showToast('メールアドレスの形式が正しくありません', 'error');
        } else {
          Components.showToast('ログインできませんでした。もう一度お試しください', 'error');
        }
        throw err;
      }
    } catch (err) {
      throw err;
    }
  },

  async signOut() {
    try {
      await this.auth.signOut();
      store.clearAll();
      Components.showToast('ログアウトしました', 'info');
    } catch (err) {
      Components.showToast('ログアウトエラー: ' + err.message, 'error');
    }
  },

  // ---- Firestore Data Operations ----

  // Get reference to user's document collection
  userDoc() {
    if (!this.userId) throw new Error('Not authenticated');
    return this.db.collection('users').doc(this.userId);
  },

  userCollection(name) {
    return this.userDoc().collection(name);
  },

  // Save a single key-value to user profile
  async saveProfile(data) {
    try {
      await this.userDoc().set(data, { merge: true });
    } catch (err) {
      console.error('Save profile error:', err);
    }
  },

  // Save health data entry to a subcollection
  async saveHealthEntry(collection, entry) {
    try {
      const docRef = await this.userCollection(collection).add({
        ...entry,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('Save entry error:', err);
      return null;
    }
  },

  // Save text entry
  async saveTextEntry(entry) {
    return await this.saveHealthEntry('textEntries', entry);
  },

  // Save conversation message
  async saveConversation(message) {
    return await this.saveHealthEntry('conversations', message);
  },

  // Save settings (selected disease, model, prompts, affiliate config)
  async saveSettings(settings) {
    await this.saveProfile({ settings });
  },

  // Save API keys (encrypted in Firestore, not in localStorage)
  async saveApiKeys(keys) {
    // Store in a separate secured subcollection
    try {
      await this.userDoc().collection('secrets').doc('apikeys').set(keys);
      Components.showToast('APIキーをクラウドに保存しました', 'success');
    } catch (err) {
      console.error('Save API keys error:', err);
      Components.showToast('APIキー保存エラー', 'error');
    }
  },

  async loadApiKeys() {
    try {
      const doc = await this.userDoc().collection('secrets').doc('apikeys').get();
      return doc.exists ? doc.data() : {};
    } catch (err) {
      console.error('Load API keys error:', err);
      return {};
    }
  },

  // ---- Global admin-managed config (shared by all users) ----
  // Stored at admin/config. Writable only by admin (per firestore.rules),
  // readable by any authenticated user.
  async saveGlobalConfig(config) {
    try {
      await firebase.firestore().collection('admin').doc('config').set(config, { merge: true });
      Components.showToast('全ユーザー共通設定を保存しました', 'success');
      return true;
    } catch (err) {
      console.error('Save global config error:', err);
      Components.showToast('共通設定の保存に失敗しました（管理者権限が必要）', 'error');
      return false;
    }
  },

  async loadGlobalConfig() {
    try {
      const doc = await firebase.firestore().collection('admin').doc('config').get();
      return doc.exists ? doc.data() : {};
    } catch (err) {
      console.warn('Load global config:', err.message);
      return {};
    }
  },

  // ---- Batch Load All User Data ----
  async loadAllData() {
    if (!this.userId) return;

    // Guard against autosync listeners re-writing loaded data back to
    // Firestore. Without this, every store.set() below fires listeners in
    // enableAutoSync() that call saveHealthEntry() → .add() → a fresh doc
    // in Firestore. The result: one duplicate of the latest entry per
    // page reload, per collection. Must be set before the first store.set.
    this._loading = true;

    try {
      // Load user profile
      const profileDoc = await this.userDoc().get();
      if (profileDoc.exists) {
        const profile = profileDoc.data();
        if (profile.settings?.selectedDisease) store.set('selectedDisease', profile.settings.selectedDisease);
        if (profile.settings?.selectedDiseases) store.set('selectedDiseases', profile.settings.selectedDiseases);
        if (profile.settings?.selectedModel) store.set('selectedModel', profile.settings.selectedModel);
        if (profile.settings?.customPrompts) store.set('customPrompts', profile.settings.customPrompts);
        if (profile.settings?.affiliateConfig) store.set('affiliateConfig', profile.settings.affiliateConfig);
        if (profile.settings?.dashboardLayout) store.set('dashboardLayout', profile.settings.dashboardLayout);
        if (profile.userProfile) store.set('userProfile', profile.userProfile);
        if (profile.adminEmails) {
          try { app.ADMIN_EMAILS = [...new Set(['agewaller@gmail.com', ...profile.adminEmails])]; } catch(e) {}
        }
      }

      // Load collections in parallel
      const collections = {
        textEntries: 'textEntries',
        symptoms: 'symptoms',
        vitals: 'vitals',
        sleepData: 'sleep',
        activityData: 'activity',
        bloodTests: 'bloodTests',
        medications: 'medications',
        conversations: 'conversationHistory'
      };

      const loadPromises = Object.entries(collections).map(async ([storeKey, fbCollection]) => {
        try {
          const snapshot = await this.userCollection(fbCollection)
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();
          const data = [];
          snapshot.forEach(doc => {
            // Mark loaded entries as already-synced so that any subsequent
            // store.set() that includes them (e.g. appending a new entry)
            // doesn't try to re-upload the existing ones as duplicates.
            data.push({ id: doc.id, _synced: true, ...doc.data() });
          });
          data.reverse(); // chronological order
          store.set(storeKey, data);
        } catch (err) {
          // Collection might not exist yet
          console.warn(`Load ${fbCollection}:`, err.message);
        }
      });

      await Promise.all(loadPromises);

      // Load global admin-managed config (shared by all users)
      // This takes precedence over any per-user legacy keys so that admin
      // changes propagate to everyone automatically.
      const globalConfig = await this.loadGlobalConfig();
      const hasGlobalKeys = globalConfig.apiKeys && Object.values(globalConfig.apiKeys).some(v => v);

      if (hasGlobalKeys) {
        if (globalConfig.apiKeys.anthropic) localStorage.setItem('apikey_anthropic', globalConfig.apiKeys.anthropic);
        if (globalConfig.apiKeys.openai) localStorage.setItem('apikey_openai', globalConfig.apiKeys.openai);
        if (globalConfig.apiKeys.google) localStorage.setItem('apikey_google', globalConfig.apiKeys.google);
        console.log('[Firebase] Loaded global API keys');
      }
      if (globalConfig.proxyUrl) localStorage.setItem('anthropic_proxy_url', globalConfig.proxyUrl);
      if (globalConfig.selectedModel) store.set('selectedModel', globalConfig.selectedModel);

      // Legacy per-user keys (backward compatibility)
      const legacyKeys = await this.loadApiKeys();
      const hasLegacyKeys = legacyKeys && Object.values(legacyKeys).some(v => v);

      if (!hasGlobalKeys && hasLegacyKeys) {
        // Populate localStorage from legacy keys for this user's own session
        if (legacyKeys.anthropic) localStorage.setItem('apikey_anthropic', legacyKeys.anthropic);
        if (legacyKeys.openai) localStorage.setItem('apikey_openai', legacyKeys.openai);
        if (legacyKeys.google) localStorage.setItem('apikey_google', legacyKeys.google);

        // AUTO-MIGRATION: if current user is admin and global config is empty,
        // promote their legacy per-user keys to global so all other users inherit them.
        const userEmail = this.auth.currentUser?.email;
        const adminList = (typeof app !== 'undefined' && app.ADMIN_EMAILS) || ['agewaller@gmail.com'];
        const isAdmin = userEmail && adminList.includes(userEmail);
        if (isAdmin) {
          console.log('[Firebase] Admin detected with legacy keys — migrating to global config');
          const migrationConfig = { apiKeys: {} };
          if (legacyKeys.anthropic) migrationConfig.apiKeys.anthropic = legacyKeys.anthropic;
          if (legacyKeys.openai) migrationConfig.apiKeys.openai = legacyKeys.openai;
          if (legacyKeys.google) migrationConfig.apiKeys.google = legacyKeys.google;
          const proxyUrl = localStorage.getItem('anthropic_proxy_url');
          if (proxyUrl) migrationConfig.proxyUrl = proxyUrl;
          try {
            await firebase.firestore().collection('admin').doc('config').set(migrationConfig, { merge: true });
            console.log('[Firebase] Migration complete — all users will now inherit these keys on next login');
          } catch (err) {
            console.warn('[Firebase] Migration failed:', err.message);
          }
        }
      }

      // Load calendar events (per-user, private)
      try {
        const calDoc = await this.userDoc().collection('private').doc('calendar').get();
        if (calDoc.exists && Array.isArray(calDoc.data().events)) {
          store.set('calendarEvents', calDoc.data().events);
        }
      } catch (err) {
        console.warn('Load calendar:', err.message);
      }

      store.calculateHealthScore();
      console.log('All user data loaded from Firestore');
    } catch (err) {
      console.error('Load all data error:', err);
    } finally {
      // Release the autosync guard. Any store.set() from here on (e.g.
      // a user submitting a new entry) will sync normally.
      this._loading = false;
    }
  },

  // ---- Deduplicate existing records ----
  // One-shot cleanup for users who accumulated duplicates before the
  // autosync bug was fixed. Groups documents in a collection by a
  // content signature and keeps the oldest, deleting the rest.
  // Returns the number of docs deleted.
  async deduplicateCollection(collection, keyFn) {
    if (!this.userId) return 0;
    try {
      const snap = await this.userCollection(collection).get();
      const groups = new Map();
      snap.forEach(doc => {
        const data = doc.data();
        const key = keyFn(data);
        if (!key) return; // skip ungroupable docs
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ id: doc.id, createdAt: data.createdAt });
      });
      // For each group, keep the oldest (smallest createdAt), delete the rest
      const toDelete = [];
      for (const docs of groups.values()) {
        if (docs.length <= 1) continue;
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const tb = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return ta - tb;
        });
        for (let i = 1; i < docs.length; i++) toDelete.push(docs[i].id);
      }
      // Delete in batches of 400 (Firestore limit is 500)
      for (let i = 0; i < toDelete.length; i += 400) {
        const batch = firebase.firestore().batch();
        toDelete.slice(i, i + 400).forEach(id => {
          batch.delete(this.userCollection(collection).doc(id));
        });
        await batch.commit();
      }
      return toDelete.length;
    } catch (err) {
      console.error(`Dedup ${collection}:`, err);
      return 0;
    }
  },

  // Clean up all health collections. Returns {collection: deletedCount}.
  async deduplicateAll() {
    const result = {};
    result.textEntries = await this.deduplicateCollection('textEntries',
      (d) => (d.content || '') + '|' + (d.title || '') + '|' + (d.timestamp || ''));
    result.symptoms = await this.deduplicateCollection('symptoms',
      (d) => (d.timestamp || '') + '|' + JSON.stringify({
        fatigue: d.fatigue_level, pain: d.pain_level,
        sleep: d.sleep_quality, fog: d.brain_fog
      }));
    result.vitals = await this.deduplicateCollection('vitals',
      (d) => (d.timestamp || '') + '|' + JSON.stringify({
        hr: d.heart_rate, bp: d.blood_pressure, temp: d.temperature
      }));
    return result;
  },

  // Save calendar events per-user (never commit to source code)
  async saveCalendarEvents(events) {
    if (!this.userId) return;
    try {
      await this.userDoc().collection('private').doc('calendar')
        .set({ events: events || [], updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } catch (err) {
      console.error('Save calendar error:', err);
    }
  },

  // ---- Sync store changes to Firestore ----
  //
  // IMPORTANT: every listener here MUST bail out when `this._loading` is
  // true. loadAllData() sets that flag while it populates the store from
  // Firestore; without the guard, each load fires these listeners and
  // re-writes the loaded data as fresh docs, duplicating the newest
  // record on every reload.
  //
  // Each listener also skips entries that already carry a Firestore doc
  // id (present on loaded data), as a second line of defence in case the
  // _loading flag is missed due to a late-arriving snapshot.
  enableAutoSync() {
    const isFromFirestore = (entry) => {
      if (!entry) return true;
      // Firestore doc ids are auto-generated 20-char base58-ish strings.
      // Local ids from addHealthData are timestamp-based (digits + '-').
      // If _synced is already set, it's definitely loaded data.
      if (entry._synced) return true;
      if (entry.createdAt) return true; // set by saveHealthEntry
      return false;
    };

    const syncLatest = (collection) => (entries) => {
      if (this._loading) return;
      if (!this.userId || !entries?.length) return;
      const latest = entries[entries.length - 1];
      if (!latest || isFromFirestore(latest)) return;
      this.saveHealthEntry(collection, latest).then(id => {
        if (id) {
          latest._synced = true;
          latest.createdAt = latest.createdAt || Date.now();
        }
      });
    };

    store.on('textEntries', syncLatest('textEntries'));
    store.on('symptoms', syncLatest('symptoms'));
    store.on('vitals', syncLatest('vitals'));

    // Watch for settings changes (idempotent; merge:true)
    ['selectedDisease', 'selectedDiseases', 'selectedModel', 'customPrompts', 'affiliateConfig', 'dashboardLayout'].forEach(key => {
      store.on(key, (value) => {
        if (this._loading) return;
        if (!this.userId) return;
        this.saveProfile({ settings: { [key]: value } });
      });
    });

    // Watch for user profile changes
    store.on('userProfile', (value) => {
      if (this._loading) return;
      if (!this.userId) return;
      this.saveProfile({ userProfile: value });
    });

    // Watch for analysis history
    store.on('latestAnalysis', (analysis) => {
      if (this._loading) return;
      if (!this.userId || !analysis) return;
      this.saveHealthEntry('analyses', {
        timestamp: analysis.timestamp,
        model: analysis.model,
        promptName: analysis.promptName,
        summary: analysis.parsed?.summary || '',
      });
    });
  },

  // Check if Firebase is configured
  isConfigured() {
    const cfg = this.getConfig();
    return cfg && cfg.apiKey && cfg.apiKey !== 'YOUR_FIREBASE_API_KEY';
  },

  // Get Firebase config from CONFIG or localStorage
  getConfig() {
    const stored = localStorage.getItem('firebase_config');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return CONFIG.FIREBASE;
  },

  saveConfig(config) {
    localStorage.setItem('firebase_config', JSON.stringify(config));
  }
};
