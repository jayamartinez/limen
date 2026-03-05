import { config } from "dotenv";

config();

const COINBASE_BASE = "https://api.coinbase.com/api/v3/brokerage/market";
const BEARER = process.env.COINBASE_BEARER!;

// --- Cache (5s TTL) ---
const cache: Record<string, { data: any; expiry: number }> = {};
function setCache(key: string, data: any, ttlMs = 5000) {
  cache[key] = { data, expiry: Date.now() + ttlMs };
}
function getCache(key: string) {
  const c = cache[key];
  if (c && c.expiry > Date.now()) return c.data;
  return null;
}

// --- Map timeframe to Coinbase granularity ---
function mapTimeframe(tf: string): string {
  const mapping: Record<string, string> = {
    "1m": "ONE_MINUTE",
    "5m": "FIVE_MINUTE",
    "15m": "FIFTEEN_MINUTE",
    "1h": "ONE_HOUR",
    "6h": "SIX_HOUR",
    "1d": "ONE_DAY",
    "1w": "ONE_WEEK",
  };
  return mapping[tf] ?? "ONE_DAY";
}

// --- Fetch candles ---
async function fetchCandles(productId: string, timeframe: string, limit = 300) {
  const cacheKey = `candles:${productId}:${timeframe}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const granularity = mapTimeframe(timeframe);

  // Coinbase max 350 candles → compute start time safely
  const end = Math.floor(Date.now() / 1000);
  const bucketSeconds: Record<string, number> = {
    ONE_MINUTE: 60,
    FIVE_MINUTE: 300,
    FIFTEEN_MINUTE: 900,
    ONE_HOUR: 3600,
    SIX_HOUR: 21600,
    ONE_DAY: 86400,
    ONE_WEEK: 604800,
  };
  const seconds = bucketSeconds[granularity] ?? 86400;
  const start = end - seconds * limit;

  const url = `${COINBASE_BASE}/products/${productId}/candles?granularity=${granularity}&start=${start}&end=${end}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BEARER}`, accept: "application/json" },
    cache: "no-cache",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Coinbase candles error: ${res.statusText} | ${msg}`);
  }

  const data = await res.json();
  setCache(cacheKey, data.candles);
  return data.candles as any[];
}

// --- Fetch order book ---
async function fetchOrderBook(productId: string, limit = 20) {
  const cacheKey = `orderbook:${productId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `${COINBASE_BASE}/product_book?product_id=${productId}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BEARER}`, accept: "application/json" },
    cache: "no-cache",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Coinbase orderbook error: ${res.statusText} | ${msg}`);
  }

  const data = await res.json();
  setCache(cacheKey, data);
  return data;
}

// --- Indicators ---
function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  return values.reduce(
    (acc, val, i) => (i === 0 ? val : val * k + acc * (1 - k)),
    values[0]
  );
}

function rsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period || 1;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  if (values.length < slow + signal) return { macdLine: 0, signalLine: 0, histogram: 0 };
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = fastEma - slowEma;
  const signalLine = ema(values, signal);
  return { macdLine, signalLine, histogram: macdLine - signalLine };
}

function bollinger(values: number[], period = 20, mult = 2) {
  if (values.length < period) {
    return { middle: 0, upper: 0, lower: 0 };
  }
  const slice = values.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance =
    slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return { middle: sma, upper: sma + mult * stdDev, lower: sma - mult * stdDev };
}

// --- Snapshot wrapper ---
export interface MarketSnapshot {
  lastPrice: number;
  ema20: number;
  ema50: number;
  ema100: number;
  trendBias: string;
  volumeSpike: boolean;
  orderBookImbalance: number;
  rsi: number;
  macd: { macdLine: number; signalLine: number; histogram: number };
  bollinger: { middle: number; upper: number; lower: number };
}

export async function getMarketSnapshot(
  symbol: string,
  timeframe: string
): Promise<MarketSnapshot> {
  const candles = await fetchCandles(symbol, timeframe);

  const closes = candles.map((c: any) => parseFloat(c.close));
  const lastPrice = closes[closes.length - 1] ?? 0;

  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema100 = ema(closes, 100);

  const trendBias =
    ema20 > ema50 && ema50 > ema100
      ? "bullish"
      : ema20 < ema50 && ema50 < ema100
      ? "bearish"
      : "neutral";

  const avgVol =
    candles.reduce((s: any, c: any) => s + parseFloat(c.volume), 0) / candles.length;
  const volumeSpike =
    parseFloat(candles[candles.length - 1].volume) > avgVol * 1.5;

  const orderBook = await fetchOrderBook(symbol);
  const bids = orderBook?.pricebook?.bids ?? [];
  const asks = orderBook?.pricebook?.asks ?? [];
  const totalBids = bids.reduce(
    (s: number, b: any) => s + parseFloat(b.size),
    0
  );
  const totalAsks = asks.reduce(
    (s: number, a: any) => s + parseFloat(a.size),
    0
  );
  const orderBookImbalance = totalBids / (totalAsks || 1);

  const rsiValue = rsi(closes);
  const macdVals = macd(closes);
  const boll = bollinger(closes);

  return {
    lastPrice,
    ema20,
    ema50,
    ema100,
    trendBias,
    volumeSpike,
    orderBookImbalance,
    rsi: rsiValue,
    macd: macdVals,
    bollinger: boll,
  };
}
