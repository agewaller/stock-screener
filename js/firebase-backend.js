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

  // Initialize Firebase (call once on page load)
  init(firebaseConfig) {
    if (this.initialized) return;

    try {
      // Firebase v9+ compat mode (loaded via CDN)
      this.app = firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Enable offline persistence
      this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence: multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence: browser not supported');
        }
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

          // Navigate to appropriate page
          if (app.currentPage === 'login') {
            const disease = store.get('selectedDisease');
            app.navigate(disease ? 'dashboard' : 'disease-select');
          }
        } else {
          this.userId = null;
          store.update({ user: null, isAuthenticated: false });
          app.navigate('login');
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
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await this.auth.signInWithPopup(provider);
      Components.showToast(`${result.user.displayName || result.user.email} でログインしました`, 'success');
      return result.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return null;
      Components.showToast('Googleログインエラー: ' + err.message, 'error');
      throw err;
    }
  },

  async signInWithEmail(email, password) {
    try {
      // Try sign in first, if fails try create account
      try {
        const result = await this.auth.signInWithEmailAndPassword(email, password);
        Components.showToast('ログインしました', 'success');
        return result.user;
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          const result = await this.auth.createUserWithEmailAndPassword(email, password);
          Components.showToast('アカウントを作成しました', 'success');
          return result.user;
        }
        throw err;
      }
    } catch (err) {
      Components.showToast('ログインエラー: ' + err.message, 'error');
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

  // ---- Batch Load All User Data ----
  async loadAllData() {
    if (!this.userId) return;

    try {
      // Load user profile
      const profileDoc = await this.userDoc().get();
      if (profileDoc.exists) {
        const profile = profileDoc.data();
        if (profile.settings?.selectedDisease) store.set('selectedDisease', profile.settings.selectedDisease);
        if (profile.settings?.selectedModel) store.set('selectedModel', profile.settings.selectedModel);
        if (profile.settings?.customPrompts) store.set('customPrompts', profile.settings.customPrompts);
        if (profile.settings?.affiliateConfig) store.set('affiliateConfig', profile.settings.affiliateConfig);
        if (profile.settings?.dashboardLayout) store.set('dashboardLayout', profile.settings.dashboardLayout);
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
          snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
          data.reverse(); // chronological order
          store.set(storeKey, data);
        } catch (err) {
          // Collection might not exist yet
          console.warn(`Load ${fbCollection}:`, err.message);
        }
      });

      await Promise.all(loadPromises);

      // Load API keys
      const apiKeys = await this.loadApiKeys();
      if (apiKeys.anthropic) localStorage.setItem('apikey_anthropic', apiKeys.anthropic);
      if (apiKeys.openai) localStorage.setItem('apikey_openai', apiKeys.openai);
      if (apiKeys.google) localStorage.setItem('apikey_google', apiKeys.google);

      store.calculateHealthScore();
      console.log('All user data loaded from Firestore');
    } catch (err) {
      console.error('Load all data error:', err);
    }
  },

  // ---- Sync store changes to Firestore ----
  enableAutoSync() {
    // Watch for text entries
    store.on('textEntries', (entries) => {
      if (!this.userId || !entries?.length) return;
      const latest = entries[entries.length - 1];
      if (latest && !latest._synced) {
        this.saveHealthEntry('textEntries', latest);
        latest._synced = true;
      }
    });

    // Watch for symptom data
    store.on('symptoms', (entries) => {
      if (!this.userId || !entries?.length) return;
      const latest = entries[entries.length - 1];
      if (latest && !latest._synced) {
        this.saveHealthEntry('symptoms', latest);
        latest._synced = true;
      }
    });

    // Watch for vitals
    store.on('vitals', (entries) => {
      if (!this.userId || !entries?.length) return;
      const latest = entries[entries.length - 1];
      if (latest && !latest._synced) {
        this.saveHealthEntry('vitals', latest);
        latest._synced = true;
      }
    });

    // Watch for settings changes
    ['selectedDisease', 'selectedModel', 'customPrompts', 'affiliateConfig', 'dashboardLayout'].forEach(key => {
      store.on(key, (value) => {
        if (!this.userId) return;
        this.saveProfile({ settings: { [key]: value } });
      });
    });

    // Watch for analysis history
    store.on('latestAnalysis', (analysis) => {
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
