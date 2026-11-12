/**
 * Safe Storage Service
 * Provides resilient persistence using IndexedDB for large media/files
 * and protected localStorage with automatic quota management and memory fallback.
 */

// Simple lightweight IndexedDB wrapper for large media/blobs (no size limit)
class IndexedDBStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB not supported'));
          return;
        }
        const request = window.indexedDB.open('whisperwave_media_db', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media');
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  async setMedia(id: string, dataUrl: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('media', 'readwrite');
        const store = tx.objectStore('media');
        const req = store.put(dataUrl, id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB setMedia fallback:', e);
    }
  }

  async getMedia(id: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('media', 'readonly');
        const store = tx.objectStore('media');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }
}

export const mediaStore = new IndexedDBStore();

// In-memory fallback if localStorage fails or is completely exhausted
const memoryStorage = new Map<string, string>();

/**
 * Strips huge base64 media strings from objects before saving to localStorage
 * to ensure we never hit the browser 5MB quota limit.
 */
export function sanitizeForStorage<T>(data: T): T {
  try {
    const clone = JSON.parse(JSON.stringify(data));

    // Recursively strip or truncate huge base64 strings (> 15KB)
    const sanitizeValue = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitizeValue);
      }

      const res: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && val.length > 15000 && val.startsWith('data:')) {
          // If message has an ID, store in IndexedDB in the background
          if (obj.id) {
            mediaStore.setMedia(obj.id, val).catch(() => {});
            res[key] = `idb://${obj.id}`;
          } else {
            // Truncate to placeholder
            res[key] = val.slice(0, 100) + '...[media_saved]';
          }
        } else if (typeof val === 'object' && val !== null) {
          res[key] = sanitizeValue(val);
        } else {
          res[key] = val;
        }
      }
      return res;
    };

    return sanitizeValue(clone);
  } catch {
    return data;
  }
}

/**
 * Rehydrates objects retrieved from storage, restoring any large media from IndexedDB if needed.
 */
export async function rehydrateFromStorage<T>(data: T): Promise<T> {
  if (!data || typeof data !== 'object') return data;

  const restore = async (obj: any): Promise<any> => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(restore));
    }

    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string' && val.startsWith('idb://')) {
        const id = val.replace('idb://', '');
        const loadedMedia = await mediaStore.getMedia(id);
        res[key] = loadedMedia || val;
      } else if (typeof val === 'object' && val !== null) {
        res[key] = await restore(val);
      } else {
        res[key] = val;
      }
    }
    return res;
  };

  try {
    return await restore(data);
  } catch {
    return data;
  }
}

/**
 * Safe wrapper around localStorage with quota error recovery
 */
export const safeStorage = {
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, value);
      memoryStorage.set(key, value);
    } catch (err: any) {
      console.warn(`[safeStorage] localStorage quota reached or error for key "${key}". Recovering...`, err);

      // Attempt recovery: Clear temporary keys
      try {
        localStorage.removeItem('whisperwave-signal-event');
        // If still failing, try to free old messages or stories
        const testKeys = ['whisperwave_stories_v1', 'whisperwave_call_history_v1'];
        for (const k of testKeys) {
          if (k !== key) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, value);
        memoryStorage.set(key, value);
        return;
      } catch {
        // Fall back completely to memory storage without throwing an exception!
        memoryStorage.set(key, value);
      }
    }
  },

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const fromLocal = localStorage.getItem(key);
      if (fromLocal !== null) return fromLocal;
      return memoryStorage.get(key) || null;
    } catch {
      return memoryStorage.get(key) || null;
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
    memoryStorage.delete(key);
  },
};
