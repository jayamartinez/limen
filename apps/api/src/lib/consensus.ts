import { generateText } from "ai";
import { getMarketSnapshot, MarketSnapshot } from "./market-data";

export interface TradeSignal {
  symbol: string;
  outlook: "bullish" | "bearish" | "neutral";
  probability: number;
  explanation: string;
  model: string;
}

export interface ModelOutput {
  provider: string;
  result: TradeSignal;
  time: number;
}

export interface ConsensusSummary {
  symbol: string;
  timeframe: string;
  stance: "LONG" | "SHORT" | "HOLD";
  confidence: number;
  breakdown: ModelOutput[];
  rationale: string;
}

const MODELS_IN_USE = [
  "xai/grok-4-fast-reasoning",
  "google/gemini-2.5-pro",
  "deepseek/deepseek-v3.1",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4.1-mini",
];

export class ConsensusEngine {
  async runAnalysis(input: {
    symbol: string;
    timeframe?: string;
    tweets: string[];
    news: string[];
  }): Promise<ConsensusSummary> {
    const timeframe = input.timeframe ?? "1d";

    // --- Pull Market Data ---
    const snapshot: MarketSnapshot = await getMarketSnapshot(input.symbol, timeframe);

    const results: ModelOutput[] = [];

    const jobs = MODELS_IN_USE.map(async (model) => {
      try {
        const prompt = `
        You are a professional crypto futures strategist.

        Evaluate ${input.symbol} on the ${timeframe} timeframe using BOTH technical market data AND external sentiment.

        Market Data:
        - Last Price: ${snapshot.lastPrice}
        - EMA20: ${snapshot.ema20.toFixed(2)}, EMA50: ${snapshot.ema50.toFixed(2)}, EMA100: ${snapshot.ema100.toFixed(2)}
        - Trend Bias: ${snapshot.trendBias}
        - Volume Spike: ${snapshot.volumeSpike}
        - Order Book Imbalance: ${snapshot.orderBookImbalance.toFixed(2)}
        - RSI: ${snapshot.rsi.toFixed(2)}
        - MACD: line=${snapshot.macd.macdLine.toFixed(2)}, signal=${snapshot.macd.signalLine.toFixed(2)}, hist=${snapshot.macd.histogram.toFixed(2)}
        - Bollinger Bands: upper=${snapshot.bollinger.upper.toFixed(2)}, middle=${snapshot.bollinger.middle.toFixed(2)}, lower=${snapshot.bollinger.lower.toFixed(2)}

        Sentiment Data:
        News:
        ${input.news.length ? input.news.join("\n") : "none"}

        Tweets:
        ${input.tweets.length ? input.tweets.join("\n") : "none"}

        Instructions:
        1. **Technical Analysis (TA):** Use EMA, RSI, MACD, Bollinger, volume, and order book data to assess momentum and risk.
        2. **Sentiment & Macro (FA):** Weigh news and tweets (ETF approvals, regulation, hacks, institutional flows, etc).
        3. **Synthesis:** Combine TA + FA. If they conflict, state which dominates for this timeframe.
        4. Output strictly in format:

        SENTIMENT: bullish | bearish | neutral
        CONFIDENCE: 0–100
        REASONING: [2 short and simple sentences covering catalysts, risks, and timeframe relevance]
        `;

        const maxOutputTokens = model === "google/gemini-2.5-pro" ? 2000 : 1000;
        const response = await generateText({
          model,
          prompt,
          maxOutputTokens,
          temperature: 0.3,
        });
        const { text } = response;
        const finishReason = (response as any)?.finishReason as
          | string
          | undefined;

        const outlook =
          (text.match(/SENTIMENT:\s*(bullish|bearish|neutral)/i)?.[1]?.toLowerCase() as
            | "bullish"
            | "bearish"
            | "neutral") ?? "neutral";

        const probability = parseInt(
          text.match(/CONFIDENCE:\s*(\d+)/i)?.[1] ?? "50",
          10
        );

        const explanationBase =
          text.match(/REASONING:\s*(.+)/is)?.[1]?.trim() ?? text;
        const explanation = finishReason
          ? `${explanationBase} [finishReason:${finishReason}]`
          : explanationBase;

        results.push({
          provider: model,
          result: {
            symbol: input.symbol,
            outlook,
            probability,
            explanation,
            model,
          },
          time: Date.now(),
        });
      } catch (err) {
        console.error(`[consensus] Model ${model} failed:`, err);
      }
    });

    await Promise.all(jobs);

    return this.summarizeConsensus(input.symbol, timeframe, results);
  }

  private summarizeConsensus(
    symbol: string,
    timeframe: string,
    results: ModelOutput[]
  ): ConsensusSummary {
    if (!results.length) {
      return {
        symbol,
        timeframe,
        stance: "HOLD",
        confidence: 0,
        breakdown: [],
        rationale: "No models produced an output.",
      };
    }

    const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
    const details: string[] = [];

    for (const r of results) {
      sentimentCounts[r.result.outlook]++;
      details.push(`${r.provider}: ${r.result.outlook} (${r.result.probability}%)`);
    }

    const majority = 3;
    const total = results.length;
    let stance: "LONG" | "SHORT" | "HOLD" = "HOLD";
    let confidence = 0;
    let rationale = "";

    if (sentimentCounts.bullish >= majority) {
      stance = "LONG";
      const bullish = results.filter((r) => r.result.outlook === "bullish");
      confidence = Math.round(
        bullish.reduce((sum, r) => sum + r.result.probability, 0) / bullish.length
      );
      rationale = `Consensus: ${sentimentCounts.bullish}/${total} models are bullish. ${details.join(" | ")}`;
    } else if (sentimentCounts.bearish >= majority) {
      stance = "SHORT";
      const bearish = results.filter((r) => r.result.outlook === "bearish");
      confidence = Math.round(
        bearish.reduce((sum, r) => sum + r.result.probability, 0) / bearish.length
      );
      rationale = `Consensus: ${sentimentCounts.bearish}/${total} models are bearish. ${details.join(" | ")}`;
    } else {
      rationale = `No clear majority. Breakdown → Bullish: ${sentimentCounts.bullish}, Bearish: ${sentimentCounts.bearish}, Neutral: ${sentimentCounts.neutral}. ${details.join(" | ")}`;
    }

    return {
      symbol,
      timeframe,
      stance,
      confidence,
      breakdown: results,
      rationale,
    };
  }
}
