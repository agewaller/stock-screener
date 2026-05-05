// === js/firebase-backend.js ===
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

      // Handle redirect result — only used when a popup path fell through
      // to signInWithRedirect (very rare now that we use popups
      // everywhere). Drive the post-login flow directly so the redirect
      // return still navigates into the dashboard.
      this.auth.getRedirectResult().then(result => {
        if (result?.user) {
          Components.showToast(`${result.user.displayName || result.user.email} でログインしました`, 'success');
          this.handleSignedInUser(result.user);
        }
      }).catch(err => {
        console.warn('Redirect result error:', err.message);
      });

      // Listen for auth state changes
      this.auth.onAuthStateChanged(user => {
        if (user) {
          // Anonymous guest users: sign them in just to read admin/config
          // (the API keys). Don't treat them as a real authenticated
          // session — no navigation, no Plaud subscription, no user
          // doc loading. The guest stays on the login page and can use
          // the "試してみる" box immediately.
          if (user.isAnonymous) {
            console.log('[auth] anonymous guest session started');
            this.userId = null; // block all user-scoped writes
            this._loadGlobalConfigOnly().catch(e => console.warn('guest config load:', e));
            return;
          }
          this.handleSignedInUser(user);
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

  // Unified "a user just signed in" flow. Called from both
  // onAuthStateChanged and signInWithGoogle/Email so that login works
  // even when the popup's postMessage handshake to the main page is
  // delayed by Cross-Origin-Opener-Policy (Chrome 2024+) or ITP
  // (Safari). Idempotent — calling it twice for the same user is
  // harmless: store.update is idempotent, and loadAllData short-
  // circuits via its re-entry guard.
  handleSignedInUser(user) {
    if (!user) return;
    try {
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

      // Kick off the heavy work without blocking navigation. Errors
      // in the async body are swallowed by the .catch so they can't
      // interrupt the flow to the dashboard.
      try {
        const p = this.loadAllData();
        if (p && typeof p.catch === 'function') p.catch(err => console.warn('[loadAllData]', err));
      } catch (e) { console.warn('[loadAllData sync]', e); }
      try { this.subscribeToInbox(); } catch (e) { console.warn('[subscribeToInbox]', e); }
      // Touch user metadata on every sign-in so the admin "ユーザ管理"
      // dashboard can list users with email / displayName / lastSeenAt
      // without having to rely on the Firebase Admin SDK (which the
      // browser cannot use). firstSeenAt is only written if absent so
      // the registration date is preserved across logins.
      try {
        const p = this.touchUserMetadata(user);
        if (p && typeof p.catch === 'function') p.catch(err => console.warn('[touchUserMetadata]', err));
      } catch (e) { console.warn('[touchUserMetadata sync]', e); }

      // Always navigate to dashboard after a real sign-in. The previous
      // `if (currentPage === 'login')` guard missed the case where
      // signInWithPopup drives this flow directly without ever flipping
      // currentPage — the main cause of "popup closed but user stayed on
      // login page" reported by users.
      if (typeof app !== 'undefined' && app && typeof app.navigate === 'function') {
        app.navigate('dashboard');
      } else {
        console.error('[handleSignedInUser] app.navigate unavailable');
      }
    } catch (err) {
      console.error('[handleSignedInUser] internal error:', err);
      // Bubble up so signInWithGoogle's caller can show it on the
      // login banner rather than silently staying on the login page.
      throw err;
    }
  },

  // ---- Authentication ----
  async signInWithGoogle() {
    // Use signInWithPopup on ALL devices, desktop and mobile.
    //
    // Why NOT signInWithRedirect on mobile: Firebase's redirect flow is
    // broken on iOS Safari and other ITP-enforcing browsers whenever
    // the hosting domain (cares.advisers.jp) differs from the Firebase
    // authDomain (care-14c31.firebaseapp.com). On redirect return,
    // Firebase cannot read the auth state that was set on the third-
    // party authDomain, so login silently fails and the user ends up
    // back on the login screen. signInWithPopup avoids this by
    // communicating via postMessage, which ITP does not block. This
    // is Firebase's recommended path (SDK 10+) when not hosting on
    // the authDomain.
    //
    // We ALSO can't rely solely on onAuthStateChanged after the popup
    // closes: Chrome's Cross-Origin-Opener-Policy can delay or drop
    // the popup→opener postMessage, leaving the auth state handler
    // un-notified even though the popup itself completed. Driving
    // handleSignedInUser directly from the popup return value makes
    // navigation deterministic. A later onAuthStateChanged fire is
    // harmless because handleSignedInUser is idempotent.
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // #6 Guest upgrade: if currently anonymous, link instead of sign-in
      // to preserve any data the guest created during their trial session.
      const currentUser = this.auth.currentUser;
      let result;
      if (currentUser && currentUser.isAnonymous) {
        try {
          result = await currentUser.linkWithPopup(provider);
          console.log('[auth] anonymous user linked to Google account');
        } catch (linkErr) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            result = await this.auth.signInWithPopup(provider);
          } else {
            throw linkErr;
          }
        }
      } else {
        result = await this.auth.signInWithPopup(provider);
      }
      Components.showToast(`${result.user.displayName || result.user.email} でログインしました`, 'success');
      this.handleSignedInUser(result.user);
      return result.user;
    } catch (err) {
      // User closed the popup — silent, no toast
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return null;
      }
      // Popup blocked by the browser (e.g. in-app browsers / strict
      // privacy settings). Don't fall back to signInWithRedirect — it
      // silently fails on the ITP path described above. Guide the
      // user to email sign-in instead.
      if (err.code === 'auth/popup-blocked') {
        Components.showToast('ポップアップがブロックされました。メールアドレスでの登録をお試しください。', 'error');
        return null;
      }
      if (err.code === 'auth/unauthorized-domain') {
        Components.showToast('このURLではGoogleログインできません。公式サイト（cares.advisers.jp）からお試しください。', 'error');
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
        this.handleSignedInUser(result.user);
        return result.user;
      } catch (err) {
        // Firebase 10+ merged auth/wrong-password into auth/invalid-credential.
        // Only treat auth/user-not-found as "new user → create account".
        // auth/invalid-credential means the user EXISTS but the password is
        // wrong — routing it to createUser would confusingly attempt to
        // re-register an existing email.
        if (err.code === 'auth/user-not-found') {
          // New user - create account
          try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            Components.showToast('アカウントを作成しました。ようこそ！', 'success');
            this.handleSignedInUser(result.user);
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
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
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
      return true;
    } catch (err) {
      console.error('Save profile error:', err);
      this._handleFirestoreError(err, 'プロフィールの保存');
      return false;
    }
  },

  // #5 Session monitoring — detect permission-denied and trigger re-auth
  _handleFirestoreError(err, context) {
    const code = err?.code || '';
    if (code === 'permission-denied' || code === 'unauthenticated') {
      Components.showToast('セッションが切れました。再ログインしてください。', 'error');
      if (typeof app !== 'undefined') {
        setTimeout(() => app.navigate('login'), 1500);
      }
    } else if (code === 'unavailable' || code === 'deadline-exceeded') {
      Components.showToast(`${context}に失敗しました。ネットワークを確認してください。`, 'error');
    } else {
      Components.showToast(`${context}に失敗しました: ${err.message || code}`, 'error');
    }
  },

  // Write per-user metadata (email, displayName, lastSeenAt). Called
  // from handleSignedInUser on every sign-in so the admin dashboard
  // can enumerate users without the Firebase Admin SDK. firstSeenAt
  // is only set on the first call so the original registration date
  // is preserved across logins.
  //
  // Also attaches referredBy (the ?ref= param captured on first visit)
  // exactly once, so the admin can later measure viral referrals by
  // scanning users for non-empty referredBy values.
  async touchUserMetadata(user) {
    if (!user || !this.userId) return;
    try {
      const ref = this.userDoc();
      const snap = await ref.get();
      const meta = {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      // First sign-in for this uid → record firstSeenAt as well.
      if (!snap.exists || !snap.data()?.firstSeenAt) {
        meta.firstSeenAt = firebase.firestore.FieldValue.serverTimestamp();
        // Pull the referrer ID captured on app bootstrap (if any).
        try {
          const refId = localStorage.getItem('referrer_id');
          if (refId) meta.referredBy = refId;
        } catch (_) {}
      }
      await ref.set(meta, { merge: true });
    } catch (err) {
      console.warn('[touchUserMetadata]', err.message);
    }
  },

  // Save health data entry to a subcollection
  async saveHealthEntry(collection, entry) {
    try {
      const cleaned = { ...entry };
      delete cleaned.dataUrl;
      delete cleaned.previewImage;
      const docRef = await this.userCollection(collection).add({
        ...cleaned,
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

  // Update an existing health entry in Firestore by its local `id` field.
  // Queries the collection, finds the doc(s) matching localId, and merges changes.
  async updateHealthEntry(collection, localId, changes) {
    if (!this.userId || !this.initialized || !localId) return false;
    try {
      const snap = await this.userCollection(collection).where('id', '==', localId).get();
      if (snap.empty) return false;
      const cleaned = { ...changes };
      delete cleaned.dataUrl;
      delete cleaned.previewImage;
      const batch = this.db.batch();
      snap.forEach(doc => batch.update(doc.ref, cleaned));
      await batch.commit();
      return true;
    } catch (err) {
      console.error('[FirebaseBackend] updateHealthEntry error:', err);
      return false;
    }
  },

  // Save a single AI comment (per-entry analysis result) to Firestore.
  // Stored in users/{uid}/aiComments/{entryId} so it can be loaded back
  // on any device without reconstructing the entire aiComments dictionary.
  async saveAIComment(entryId, comment) {
    if (!this.userId || !this.initialized || !entryId) return;
    try {
      await this.userCollection('aiComments').doc(entryId).set({
        timestamp: comment.timestamp || new Date().toISOString(),
        result: comment.result || comment,
        savedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseBackend] saveAIComment error:', err.message);
    }
  },

  // Delete a health entry from a Firestore collection by its local `id` field.
  // Queries for documents where id == localId and deletes them all.
  async deleteHealthEntry(collection, localId) {
    if (!this.userId || !this.initialized || !localId) return false;
    try {
      const snap = await this.userCollection(collection).where('id', '==', localId).get();
      if (snap.empty) return false;
      const batch = this.db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch (err) {
      console.error('[FirebaseBackend] deleteHealthEntry error:', err);
      return false;
    }
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

  // Lightweight version of loadAllData for anonymous guest sessions —
  // only pulls the global admin config (API keys, selected model,
  // proxy URL, anthropic mode) and skips all per-user collections.
  // This is what makes guest mode's "試してみる" box actually reach
  // the AI instead of hitting the "no API key" fallback every time.
  async _loadGlobalConfigOnly() {
    try {
      const globalConfig = await this.loadGlobalConfig();
      const hasGlobalKeys = globalConfig.apiKeys && Object.values(globalConfig.apiKeys).some(v => v);
      if (hasGlobalKeys) {
        if (globalConfig.apiKeys.anthropic) localStorage.setItem('apikey_anthropic', globalConfig.apiKeys.anthropic);
        if (globalConfig.apiKeys.openai)    localStorage.setItem('apikey_openai',    globalConfig.apiKeys.openai);
        if (globalConfig.apiKeys.google)    localStorage.setItem('apikey_google',    globalConfig.apiKeys.google);
        console.log('[auth] loaded global API keys for guest session');
      }
      if (globalConfig.proxyUrl) localStorage.setItem('anthropic_proxy_url', globalConfig.proxyUrl);
      if (globalConfig.selectedModel) store.set('selectedModel', globalConfig.selectedModel);
      if (globalConfig.anthropicMode === 'direct' || globalConfig.anthropicMode === 'proxy') {
        localStorage.setItem('anthropic_mode', globalConfig.anthropicMode);
      }
      // Professional-registry bits (global, read by everyone, written by admin).
      if (Array.isArray(globalConfig.professionals)) store.set('globalProfessionals', globalConfig.professionals);
      if (typeof globalConfig.mailerUrl === 'string') store.set('mailerUrl', globalConfig.mailerUrl);
      if (typeof globalConfig.mailerSenderName === 'string') store.set('mailerSenderName', globalConfig.mailerSenderName);
    } catch (e) {
      console.warn('[auth] guest config load failed:', e.message);
    }
  },

  // Sign in anonymously if there is no current auth session. Used by
  // guestAnalyze / guestFileAnalyze so guests can read admin/config
  // and inherit the shared API keys. Returns true when keys become
  // available, false if the operation can't complete in time.
  async ensureGuestAuth() {
    if (!this.initialized || !this.auth) return false;
    const hasKeys = () => !!(localStorage.getItem('apikey_anthropic') ||
                             localStorage.getItem('apikey_openai') ||
                             localStorage.getItem('apikey_google'));
    if (this.auth.currentUser) {
      if (!hasKeys()) await this._loadGlobalConfigOnly();
      return hasKeys();
    }
    try {
      await this.auth.signInAnonymously();
      for (let i = 0; i < 16; i++) {
        await new Promise(r => setTimeout(r, 250));
        if (hasKeys()) return true;
      }
      // Keys still not loaded — Worker env fallback will handle this
      // but we return false so callers know keys aren't local.
      return false;
    } catch (err) {
      console.warn('[auth] anonymous sign-in failed:', err.message);
      return false;
    }
  },

  // ─── Plaud inbox subscription ───
  // The plaud-inbox Cloudflare Worker writes incoming Plaud emails to
  // inbox/{hash}/plaud/{messageId}. This method opens a Firestore
  // realtime listener on that path so any new email triggers an
  // immediate import + 禅トラック analysis without the user having to
  // refresh. Each processed message is marked processed: true so we
  // never run the analysis twice.
  subscribeToInbox() {
    if (!this.db || !this.userId) return;
    if (this._inboxUnsubscribe) {
      try { this._inboxUnsubscribe(); } catch (e) {}
      this._inboxUnsubscribe = null;
    }
    const hash = this._userHash();
    if (!hash) return;
    // Track listener status so the integrations page can display it.
    // Any error here (permission denied / no such index / offline)
    // would otherwise be silent in console only.
    store.set('inboxStatus', { state: 'connecting', hash, at: Date.now() });
    try {
      this._inboxUnsubscribe = this.db
        .collection('inbox').doc(hash).collection('plaud')
        .where('processed', '==', false)
        // NOTE: .orderBy('receivedAt', 'asc') was removed because it
        // requires a Firestore composite index that must be manually
        // created in the Firebase Console. Without the index, the
        // onSnapshot listener fails with "failed-precondition: The
        // query requires an index". Since we process ALL unprocessed
        // messages in a single batch anyway, ordering is not critical
        // — we sort client-side instead.
        .onSnapshot(async (snapshot) => {
          store.set('inboxStatus', {
            state: 'live',
            hash,
            pending: snapshot.size,
            at: Date.now()
          });
          // Sort by receivedAt client-side (Firestore timestamps)
          const docs = snapshot.docs.slice().sort((a, b) => {
            const ta = a.data()?.receivedAt?.toMillis?.() || 0;
            const tb = b.data()?.receivedAt?.toMillis?.() || 0;
            return ta - tb;
          });
          for (const docSnap of docs) {
            const data = docSnap.data() || {};
            try {
              const subject = data.subject || 'Plaud会話記録';
              const text = data.text || '';
              if (!text.trim()) { await docSnap.ref.update({ processed: true, skipped: 'empty' }).catch(()=>{}); continue; }
              const parsed = Integrations.plaud.parseTranscript(text);
              Integrations.plaud.saveTranscript(parsed, {
                title: subject,
                date: data.receivedAt?.toDate?.()?.toISOString() || new Date().toISOString()
              });
              await docSnap.ref.update({ processed: true, processedAt: new Date().toISOString() }).catch(()=>{});
            } catch (procErr) {
              console.warn('[inbox] failed to process message', docSnap.id, procErr);
              await docSnap.ref.update({ processed: true, error: procErr.message }).catch(()=>{});
            }
          }
        }, (err) => {
          console.warn('[inbox] snapshot error:', err.code || '', err.message);
          store.set('inboxStatus', {
            state: 'error',
            hash,
            error: (err.code ? err.code + ': ' : '') + (err.message || String(err)),
            at: Date.now()
          });
        });
      console.log('[inbox] subscribed to plaud inbox for hash', hash);
    } catch (err) {
      console.warn('[inbox] subscribe failed:', err.message);
      store.set('inboxStatus', {
        state: 'error',
        hash,
        error: 'subscribe failed: ' + (err.message || String(err)),
        at: Date.now()
      });
    }
  },

  // One-shot read of the 10 most recent inbox messages (processed
  // and unprocessed) for the current user's hash. Used by the
  // diagnostic panel on the Integrations page to confirm whether
  // emails are actually arriving at Firestore, independently of
  // whether the onSnapshot listener has processed them.
  async fetchRecentInbox(kind = 'plaud', limit = 10) {
    if (!this.db || !this.userId) return [];
    const hash = this._userHash();
    if (!hash) return [];
    try {
      // No orderBy() here — ordering requires a composite index
      // which would have to be created manually in the Firebase
      // Console. We fetch more than needed, sort client-side, and
      // then slice to `limit`.
      const snap = await this.db
        .collection('inbox').doc(hash).collection(kind)
        .limit(Math.max(limit * 3, 30))
        .get();
      const docs = [];
      snap.forEach(d => {
        const data = d.data() || {};
        docs.push({
          id: d.id,
          subject: data.subject || '',
          from: data.from || '',
          text: data.text || '',
          textLength: (data.text || '').length,
          receivedAt: data.receivedAt?.toMillis?.() || 0,
          processed: data.processed === true,
          processedAt: data.processedAt || '',
          parsePath: data.parsePath || '',
          error: data.error || '',
          skipped: data.skipped || ''
        });
      });
      docs.sort((a, b) => b.receivedAt - a.receivedAt);
      return docs.slice(0, limit);
    } catch (err) {
      console.warn('[fetchRecentInbox]', err.code || '', err.message);
      throw err;
    }
  },

  // Mirror of Integrations.simpleHash so the inbox subscription uses
  // the exact same hash that's printed on the integrations page.
  _userHash() {
    const u = this.auth?.currentUser;
    if (!u) return null;
    const str = u.email || u.uid || '';
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36).substring(0, 8);
  },

  // ---- Batch Load All User Data ----
  async loadAllData() {
    if (!this.userId) return;
    // Re-entry guard: handleSignedInUser may be called both from the
    // popup success path (signInWithGoogle) and from onAuthStateChanged
    // almost simultaneously. Without this guard, the second call would
    // trigger a second round of Firestore reads while the first is
    // still in flight.
    if (this._loading) return;

    // Guard against autosync listeners re-writing loaded data back to
    // Firestore. Without this, every store.set() below fires listeners in
    // enableAutoSync() that call saveHealthEntry() → .add() → a fresh doc
    // in Firestore. The result: one duplicate of the latest entry per
    // page reload, per collection. Must be set before the first store.set.
    this._loading = true;

    try {
      // Load global admin-managed config FIRST so API keys are in
      // localStorage before the user can submit any text box on the
      // dashboard. Previously this was the last step, and on slow
      // connections the user could submit a quick entry before the
      // keys arrived, landing them in the no-api-key fallback branch
      // that returns "ただいま詳細分析をご用意できません".
      try {
        const globalConfig = await this.loadGlobalConfig();
        const hasGlobalKeys = globalConfig && globalConfig.apiKeys
          && Object.values(globalConfig.apiKeys).some(v => v);
        if (hasGlobalKeys) {
          if (globalConfig.apiKeys.anthropic) localStorage.setItem('apikey_anthropic', globalConfig.apiKeys.anthropic);
          if (globalConfig.apiKeys.openai)    localStorage.setItem('apikey_openai',    globalConfig.apiKeys.openai);
          if (globalConfig.apiKeys.google)    localStorage.setItem('apikey_google',    globalConfig.apiKeys.google);
          console.log('[Firebase] Loaded global API keys (early)');
        }
        if (globalConfig && globalConfig.proxyUrl !== undefined) {
          localStorage.setItem('anthropic_proxy_url', globalConfig.proxyUrl || '');
        }
        if (globalConfig && globalConfig.selectedModel) store.set('selectedModel', globalConfig.selectedModel);
        if (globalConfig && (globalConfig.anthropicMode === 'direct' || globalConfig.anthropicMode === 'proxy')) {
          localStorage.setItem('anthropic_mode', globalConfig.anthropicMode);
        }
        // Professional-registry bits (global, read by everyone, written by admin).
        if (globalConfig && Array.isArray(globalConfig.professionals)) store.set('globalProfessionals', globalConfig.professionals);
        if (globalConfig && typeof globalConfig.mailerUrl === 'string') store.set('mailerUrl', globalConfig.mailerUrl);
        if (globalConfig && typeof globalConfig.mailerSenderName === 'string') store.set('mailerSenderName', globalConfig.mailerSenderName);
      } catch (e) {
        console.warn('[Firebase] Early globalConfig load failed:', e?.message || e);
      }

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
        supplements: 'supplements',
        meals: 'meals',
        conversations: 'conversationHistory'
      };

      const loadPromises = Object.entries(collections).map(async ([storeKey, fbCollection]) => {
        try {
          const snapshot = await this.userCollection(fbCollection)
            .orderBy('createdAt', 'desc')
            .limit(200)
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

      // Legacy per-user keys (backward compatibility). Global config
      // already ran at the top of this function, so re-fetch just for
      // the hasGlobalKeys check used by the legacy migration branch.
      const globalConfig = await this.loadGlobalConfig();
      const hasGlobalKeys = globalConfig && globalConfig.apiKeys
        && Object.values(globalConfig.apiKeys).some(v => v);
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

      // Load AI comments per entry — stored in aiComments subcollection
      // so they survive device switches. Merge into any locally cached
      // comments so entries analyzed on this device aren't lost.
      try {
        const aiCommentsSnap = await this.userCollection('aiComments').limit(500).get();
        if (!aiCommentsSnap.empty) {
          const existing = store.get('aiComments') || {};
          aiCommentsSnap.forEach(doc => {
            const d = doc.data();
            if (!existing[doc.id]) {
              existing[doc.id] = { timestamp: d.timestamp, result: d.result };
            }
          });
          store.set('aiComments', existing);
        }
      } catch (err) {
        console.warn('Load aiComments:', err.message);
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

    store.on('textEntries',  syncLatest('textEntries'));
    store.on('symptoms',     syncLatest('symptoms'));
    store.on('vitals',       syncLatest('vitals'));
    store.on('medications',  syncLatest('medications'));
    store.on('supplements',  syncLatest('supplements'));
    store.on('meals',        syncLatest('meals'));
    store.on('sleepData',    syncLatest('sleepData'));
    store.on('activityData', syncLatest('activityData'));
    store.on('bloodTests',   syncLatest('bloodTests'));

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


