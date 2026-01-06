import { CACHE_TTL_MS } from "../config.js";

class MemoryCache {
  constructor(ttlMs = CACHE_TTL_MS) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  _isExpired(entry) {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this._isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, timestamp: Date.now() });
  }
}

export const memoryCache = new MemoryCache();
