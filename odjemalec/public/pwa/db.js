// db.js – IndexedDB wrapper (shared between main page and service worker)
// Exposes a global `db` object with async CRUD + offline sync queue

'use strict';

const db = (() => {
  const DB_NAME = 'studysprint-db';
  const DB_VERSION = 1;
  const STORES = ['goals', 'tasks', 'sprints', 'progress', 'reminders', 'groups', 'memberships', 'challenges'];

  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const database = e.target.result;

        STORES.forEach(name => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: 'id' });
          }
        });

        if (!database.objectStoreNames.contains('pendingSync')) {
          const ps = database.createObjectStore('pendingSync', { keyPath: '_syncId', autoIncrement: true });
          ps.createIndex('resource', 'resource', { unique: false });
          ps.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror  = (e) => reject(e.target.error);
    });
  }

  function tx(store, mode, fn) {
    return open().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction(store, mode);
      const objectStore = transaction.objectStore(store);
      const req = fn(objectStore);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }));
  }

  /** Get all records from a store */
  function getAll(storeName) {
    return tx(storeName, 'readonly', s => s.getAll());
  }

  /** Get a single record by id */
  function get(storeName, id) {
    return tx(storeName, 'readonly', s => s.get(id));
  }

  /** Save (put) a single record */
  function save(storeName, item) {
    return tx(storeName, 'readwrite', s => s.put(item));
  }

  /** Save many records inside one transaction */
  function saveAll(storeName, items) {
    return open().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror    = () => reject(transaction.error);
    }));
  }

  /** Delete a record by id */
  function remove(storeName, id) {
    return tx(storeName, 'readwrite', s => s.delete(id));
  }

  /** Clear all records in a store */
  function clear(storeName) {
    return tx(storeName, 'readwrite', s => s.clear());
  }

  // ── Offline sync queue ────────────────────────────────────────────────────

  /**
   * Enqueue an operation that should be synced when back online.
   * @param {{ method: string, resource: string, id?: string, body?: object }} op
   */
  function enqueueSync(op) {
    return open().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('pendingSync', 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const req = store.add({ ...op, timestamp: Date.now() });
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }));
  }

  /** Get all pending sync operations ordered by timestamp */
  function getPendingSync() {
    return open().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('pendingSync', 'readonly');
      const index = transaction.objectStore('pendingSync').index('timestamp');
      const req = index.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }));
  }

  /** Remove a processed sync entry by its auto-incremented _syncId */
  function removeSyncEntry(syncId) {
    return open().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('pendingSync', 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const req = store.delete(syncId);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    }));
  }

  /** Clear the entire sync queue (e.g. after a successful bulk sync) */
  function clearPendingSync() {
    return tx('pendingSync', 'readwrite', s => s.clear());
  }

  /** Returns the number of pending operations */
  function pendingSyncCount() {
    return open().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('pendingSync', 'readonly');
      const req = transaction.objectStore('pendingSync').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }));
  }

  return {
    getAll,
    get,
    save,
    saveAll,
    delete: remove,
    clear,
    enqueueSync,
    getPendingSync,
    removeSyncEntry,
    clearPendingSync,
    pendingSyncCount,
  };
})();
