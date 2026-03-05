type CacheValue<T> = {
  data: T
  expiry: number
}

export class SimpleCache<T = any> {
  private store = new Map<string, CacheValue<T>>()

  constructor(private ttlMs: number = 30_000) {} // default 30s

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  set(key: string, data: T) {
    this.store.set(key, { data, expiry: Date.now() + this.ttlMs })
  }
}
