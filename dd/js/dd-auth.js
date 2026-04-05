/* ============================================
   DD Auth - Firebase Google Authentication
   ============================================ */

const DDAuth = {
  _firebaseApp: null,
  _auth: null,
  _db: null,
  _initialized: false,

  init() {
    try {
      // Initialize Firebase
      if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        this._firebaseApp = firebase.initializeApp(DDConfig.firebase);
      } else if (typeof firebase !== 'undefined') {
        this._firebaseApp = firebase.app();
      }

      if (this._firebaseApp) {
        this._auth = firebase.auth();
        this._db = firebase.firestore();

        // Listen for auth state changes
        this._auth.onAuthStateChanged((user) => this._onAuthStateChanged(user));
        this._initialized = true;
      }
    } catch (e) {
      console.warn('Firebase init failed (expected in dev without config):', e.message);
      // In dev mode, allow demo mode
      this._initialized = false;
    }
  },

  _onAuthStateChanged(firebaseUser) {
    if (firebaseUser) {
      const user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      };
      DDStore.set('user', user);
      DDStore.set('isAdmin', DDConfig.adminEmails.includes(user.email));
      this._loadUserData(user.uid);
    } else {
      DDStore.set('user', null);
      DDStore.set('isAdmin', false);
    }
    // Trigger app re-render
    if (typeof DDApp !== 'undefined' && DDApp.render) {
      DDApp.render();
    }
  },

  async signInWithGoogle() {
    if (!this._initialized) {
      // Demo mode: create a mock user
      return this._demoSignIn();
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await this._auth.signInWithPopup(provider);
    } catch (e) {
      console.error('Google sign-in failed:', e);
      DDApp.showToast(e.message, 'error');
      throw e;
    }
  },

  async signOut() {
    if (!this._initialized) {
      DDStore.set('user', null);
      DDStore.set('isAdmin', false);
      DDApp.navigate('landing');
      DDApp.render();
      return;
    }

    try {
      await this._auth.signOut();
    } catch (e) {
      console.error('Sign-out failed:', e);
    }
  },

  // Demo mode sign-in (for development without Firebase config)
  _demoSignIn() {
    const demoUser = {
      uid: 'demo_' + Date.now(),
      email: 'demo@vmdd.dev',
      displayName: 'Demo User',
      photoURL: null
    };
    DDStore.set('user', demoUser);
    DDStore.set('isAdmin', true); // Give admin in demo
    // Auto-subscribe in demo mode
    DDStore.setSubscription({
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paypalSubscriptionId: 'demo'
    });
    if (typeof DDApp !== 'undefined') {
      DDApp.navigate('dashboard');
      DDApp.render();
    }
    return demoUser;
  },

  // Load user data from Firestore
  async _loadUserData(uid) {
    if (!this._db) return;

    try {
      const doc = await this._db.collection('users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.subscription) {
          DDStore.setSubscription(data.subscription);
        }
        if (data.reports) {
          // Merge cloud reports with local
        }
      }
    } catch (e) {
      console.warn('Failed to load user data:', e);
    }
  },

  // Save user data to Firestore
  async saveUserData() {
    const user = DDStore.get('user');
    if (!user || !this._db) return;

    try {
      await this._db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName,
        subscription: DDStore.get('subscription'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to save user data:', e);
    }
  },

  isLoggedIn() {
    return !!DDStore.get('user');
  },

  getUser() {
    return DDStore.get('user');
  },

  isAdmin() {
    return DDStore.get('isAdmin');
  }
};
