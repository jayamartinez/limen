import type { Article } from "./news-service";

const CACHE_TTL_MS = 30 * 60 * 1000;

type CachedNews = {
  articles: Article[];
  fetchedAt: number;
};

type NewsCacheStore = Map<string, CachedNews>;

const getStore = (): NewsCacheStore => {
  const globalScope = globalThis as typeof globalThis & {
    __limenNewsCache__?: NewsCacheStore;
  };
  if (!globalScope.__limenNewsCache__) {
    globalScope.__limenNewsCache__ = new Map();
  }
  return globalScope.__limenNewsCache__;
};

const normalizeSymbols = (symbols: string[]): string[] =>
  symbols.map((s) => s.trim().toUpperCase()).sort();

const buildKey = (symbols: string[]) => {
  const normalized = normalizeSymbols(symbols);
  return normalized.length ? normalized.join("|") : "__ALL__";
};

export const getCachedNews = (symbols: string[]): CachedNews | null => {
  const store = getStore();
  const key = buildKey(symbols);
  const cached = store.get(key);
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt >= CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return cached;
};

export const setCachedNews = (symbols: string[], articles: Article[]) => {
  const store = getStore();
  const key = buildKey(symbols);
  store.set(key, { articles, fetchedAt: Date.now() });
};
