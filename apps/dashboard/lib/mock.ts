export const MOCK_SIGNAL_RESPONSE = {
    success: true,
    ticker: "SOL-USD",
    timeframe: "1d",
    consensus: {
        stance: "LONG",
        confidence: 84,
        summary:
            "Institutional order flow and derivatives data suggest a strong upside bias for SOL over the next 24 hours. The aggregated models predict a high probability of a breakout above the current local resistance cluster due to positive funding rates and an increase in large holder accumulation.",
        rationale:
            "Our proprietary ensemble model detected statistically significant buying pressure in spot markets correlating with elevated open interest in perpetual futures. Time-series forecasting (ARIMA-GARCH + LSTM layers) aligns with on-chain metric improvements across active addresses and DEX volume.",
        breakdown: [
            {
                provider: "Quant-Gamma Network",
                result: {
                    outlook: "bullish",
                    probability: 88,
                    explanation:
                        "Gamma exposure model indicates dealers are short gamma, forcing them to buy into local rallies. This positioning creates structural tailwinds for the asset. Positive drift expected.",
                },
            },
            {
                provider: "OnChain Sentiment Analyzer V3",
                result: {
                    outlook: "bullish",
                    probability: 81,
                    explanation:
                        "Social volume and developer activity heuristics are diverging positively from price action, a classic leading indicator for a sustained leg up. Smart money inflow metrics are at a 14-day high.",
                },
            },
            {
                provider: "Macro-Correlator Pro",
                result: {
                    outlook: "neutral",
                    probability: 55,
                    explanation:
                        "Broader macroeconomic liquidity conditions remain mixed. While DXY weakness is supportive, the risk of a hawkish surprise from central banks keeps the probability of a sustained risk-on environment from crossing our high-confidence threshold.",
                },
            },
        ],
    },
};

export const MOCK_HISTORY_RESPONSE = {
    history: [
        {
            id: "mock-tx-001",
            wallet: "DemoWallet1234567890",
            ticker: "SOL-USD",
            timeframe: "1d",
            created_at: new Date().toISOString(),
            consensus: MOCK_SIGNAL_RESPONSE.consensus,
        },
    ],
    pagination: {
        limit: 10,
        page: 1,
        pageSize: 10,
        total: 1,
        hasMore: false,
    },
};
