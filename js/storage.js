// Tiny IndexedDB wrapper. Book data lives in "kv", photos in "images".
// Photos are stored as {type, data: ArrayBuffer} (works everywhere, incl. older Safari).

const DB_NAME = 'scrapbook';
const DB_VERSION = 1;
let dbPromise = null;
let memoryFallback = null; // used if IndexedDB is unavailable (e.g. some private modes)

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('no indexedDB'));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch((err) => {
      console.warn('IndexedDB unavailable, using memory only', err);
      memoryFallback = { kv: new Map(), images: new Map() };
      return null;
    });
  }
  return dbPromise;
}

async function run(storeName, mode, fn) {
  const db = await openDB();
  if (!db) return fn(memoryFallback[storeName], true);
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const req = fn(t.objectStore(storeName), false);
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// Memory fallback maps mimic the few IDB calls we use.
function mem(map, op, key, value) {
  if (op === 'get') return { result: map.get(key) };
  if (op === 'put') { map.set(key, value); return { result: key }; }
  if (op === 'delete') { map.delete(key); return { result: undefined }; }
  if (op === 'keys') return { result: [...map.keys()] };
  if (op === 'clear') { map.clear(); return { result: undefined }; }
}

function op(storeName, mode, name, key, value) {
  return run(storeName, mode, (store, isMem) => {
    if (isMem) return mem(store, name, key, value);
    if (name === 'get') return store.get(key);
    if (name === 'put') return store.put(value, key);
    if (name === 'delete') return store.delete(key);
    if (name === 'keys') return store.getAllKeys();
    if (name === 'clear') return store.clear();
  });
}

export const Store = {
  isPersistent: async () => !!(await openDB()),
  get: (key) => op('kv', 'readonly', 'get', key),
  set: (key, value) => op('kv', 'readwrite', 'put', key, value),
  getImage: (id) => op('images', 'readonly', 'get', id),
  putImage: (id, record) => op('images', 'readwrite', 'put', id, record),
  deleteImage: (id) => op('images', 'readwrite', 'delete', id),
  imageKeys: () => op('images', 'readonly', 'keys'),
  clearImages: () => op('images', 'readwrite', 'clear'),
};

export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  } catch (_) { /* ignore */ }
}
