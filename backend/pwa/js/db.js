const DB_NAME = 'studysprint';
const DB_VERSION = 1;

let db;

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('goals')) {
        d.createObjectStore('goals', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('tasks')) {
        d.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('syncQueue')) {
        d.createObjectStore('syncQueue', { autoIncrement: true });
      }
    };

    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return openDB().then((d) => {
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      const req = fn(s);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

// --- Goals ---
export function saveGoals(arr) {
  return openDB().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction('goals', 'readwrite');
    const s = t.objectStore('goals');
    s.clear();
    arr.forEach((item) => s.put(item));
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  }));
}

export function loadGoals() {
  return tx('goals', 'readonly', (s) => s.getAll());
}

// --- Tasks ---
export function saveTasks(arr) {
  return openDB().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction('tasks', 'readwrite');
    const s = t.objectStore('tasks');
    s.clear();
    arr.forEach((item) => s.put(item));
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  }));
}

export function loadTasks() {
  return tx('tasks', 'readonly', (s) => s.getAll());
}

// --- Sync Queue ---
export function enqueueOp(op) {
  return tx('syncQueue', 'readwrite', (s) => s.add(op));
}

export function dequeueAll() {
  return tx('syncQueue', 'readonly', (s) => s.getAll());
}

export function clearQueue() {
  return tx('syncQueue', 'readwrite', (s) => s.clear());
}
