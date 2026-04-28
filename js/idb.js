// #1 IndexedDB wrapper + #2 Write queue for Firestore sync
// Provides reliable large-data storage (images, analysis history)
// and a pending-writes queue that survives page reloads.

var IDB = {
  DB_NAME: 'health-diary',
  DB_VERSION: 1,
  _db: null,

  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('largeData')) {
          db.createObjectStore('largeData', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('pendingWrites')) {
          const ws = db.createObjectStore('pendingWrites', { keyPath: 'id', autoIncrement: true });
          ws.createIndex('collection', 'collection');
        }
      };
      req.onsuccess = () => { this._db = req.result; resolve(req.result); };
      req.onerror = () => reject(req.error);
    });
  },

  // --- Image storage (replaces localStorage for photos) ---
  async saveImage(id, dataUrl) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put({ id, dataUrl, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getImage(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const req = tx.objectStore('images').get(id);
      req.onsuccess = () => resolve(req.result?.dataUrl || null);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteImage(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // --- Write queue for Firestore sync reliability ---
  async enqueueWrite(collection, entry) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingWrites', 'readwrite');
      tx.objectStore('pendingWrites').add({
        collection,
        entry,
        createdAt: Date.now(),
        retries: 0
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getPendingWrites() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingWrites', 'readonly');
      const req = tx.objectStore('pendingWrites').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async removePendingWrite(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingWrites', 'readwrite');
      tx.objectStore('pendingWrites').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Process all pending writes — called on page load and after
  // network recovery. Returns count of successfully synced writes.
  async flushPendingWrites() {
    if (!FirebaseBackend.initialized || !FirebaseBackend.userId) return 0;
    const pending = await this.getPendingWrites();
    let synced = 0;
    for (const pw of pending) {
      try {
        const id = await FirebaseBackend.saveHealthEntry(pw.collection, pw.entry);
        if (id) {
          await this.removePendingWrite(pw.id);
          synced++;
        }
      } catch (e) {
        console.warn('[IDB] flush write failed:', e.message);
      }
    }
    if (synced > 0) {
      console.log('[IDB] flushed', synced, 'pending writes');
    }
    return synced;
  },

  // --- Large data storage (analysis history, etc.) ---
  async saveLargeData(key, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('largeData', 'readwrite');
      tx.objectStore('largeData').put({ key, data, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getLargeData(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('largeData', 'readonly');
      const req = tx.objectStore('largeData').get(key);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => reject(req.error);
    });
  },

  // --- Bulk image fetch (used by lazyLoadPhotos) ---
  // Returns a Map<id, dataUrl> for all requested ids that exist in IDB.
  async getImagesBatch(ids) {
    if (!ids || !ids.length) return new Map();
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const result = new Map();
      const tx = db.transaction('images', 'readonly');
      let remaining = ids.length;
      ids.forEach(id => {
        const req = tx.objectStore('images').get(id);
        req.onsuccess = () => {
          if (req.result?.dataUrl) result.set(id, req.result.dataUrl);
          if (--remaining === 0) resolve(result);
        };
        req.onerror = () => { if (--remaining === 0) resolve(result); };
      });
      tx.onerror = () => reject(tx.error);
    });
  },

  // --- Clear all IDB stores (called on logout) ---
  async clearAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['images', 'largeData', 'pendingWrites'], 'readwrite');
      tx.objectStore('images').clear();
      tx.objectStore('largeData').clear();
      tx.objectStore('pendingWrites').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // --- One-time migration: move dataUrl blobs from localStorage store
  // entries into IDB. Runs once on app start if there are unstripped blobs.
  // After migration, saveToStorage() keeps new entries clean automatically.
  async migrateFromStore() {
    let migrated = 0;
    const textEntries = store.get('textEntries') || [];
    for (const e of textEntries) {
      if (e && e.previewImage && e.id) {
        try {
          await this.saveImage(e.id, e.previewImage);
          migrated++;
        } catch (_) {}
      }
      // Also handle photoId cross-reference
      if (e && e.previewImage && e.photoId) {
        try {
          await this.saveImage(e.photoId, e.previewImage);
        } catch (_) {}
      }
    }
    const photos = store.get('photos') || [];
    for (const p of photos) {
      if (p && p.dataUrl && p.id) {
        try {
          await this.saveImage(p.id, p.dataUrl);
          migrated++;
        } catch (_) {}
      }
    }
    if (migrated > 0) {
      console.log('[IDB] migrated', migrated, 'blobs from localStorage to IndexedDB');
      // Flush localStorage copies now (saveToStorage will strip them)
      store.saveToStorage('textEntries', textEntries);
      store.saveToStorage('photos', photos);
    }
    return migrated;
  }
};
