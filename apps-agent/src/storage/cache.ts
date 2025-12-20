export type CacheEntry<T> = { value: T; expiresAt: number };

export class MemoryCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): T | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return e.value;
  }

  set(key: string, value: T, ttlMs?: number) {
    const ttl = typeof ttlMs === "number" ? ttlMs : this.defaultTtlMs;
    this.map.set(key, { value, expiresAt: Date.now() + ttl });
  }

  delete(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}
