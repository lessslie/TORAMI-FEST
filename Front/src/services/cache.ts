interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos

  /**
   * Get data from cache if not expired
   * @param key Cache key
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   * @returns Cached data or null if expired/not found
   */
  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const maxAge = ttl ?? this.defaultTTL;
    const isExpired = now - entry.timestamp > maxAge;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with current timestamp
   * @param key Cache key
   * @param data Data to cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if there's a pending request for this key
   * @param key Cache key
   * @returns Pending promise or null
   */
  getPendingRequest<T>(key: string): Promise<T> | null {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }
    return null;
  }

  /**
   * Register a pending request
   * @param key Cache key
   * @param promise Promise to track
   */
  setPendingRequest<T>(key: string, promise: Promise<T>): Promise<T> {
    this.pendingRequests.set(key, promise);

    // Auto-cleanup cuando termine (success o error)
    promise
      .then(() => {
        this.pendingRequests.delete(key);
      })
      .catch(() => {
        this.pendingRequests.delete(key);
      });

    return promise;
  }

  /**
   * Clear cache entries
   * @param prefix Optional prefix to clear only matching keys
   */
  clear(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      this.pendingRequests.clear();
      return;
    }

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingRequests: this.pendingRequests.size,
      pendingKeys: Array.from(this.pendingRequests.keys()),
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
