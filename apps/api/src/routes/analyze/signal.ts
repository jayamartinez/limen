import { Router } from "express";
import { X402PaymentHandler } from "x402-solana/server";
import { ConsensusEngine } from "../../lib/consensus";
import { NewsFetcher } from "../../lib/news-service";
import { supabase } from "../../lib/supabase";
import { verifyPrivyToken, PrivyRequest, privy } from "../../lib/privy";

const router = Router();

const SOLANA_NETWORK = "solana-devnet";
const DEFAULT_MAINNET_RPC = "https://api.mainnet.solana.com";
const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_DEVNET || DEFAULT_DEVNET_RPC;
const USDC_MINT = process.env.USDC_DEVNET_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Standard devnet USDC format

const x402 = new X402PaymentHandler({
  network: SOLANA_NETWORK,
  treasuryAddress: process.env.TREASURY_WALLET_ADDRESS!,
  facilitatorUrl: process.env.FACILITATOR_URL!,
  rpcUrl: SOLANA_RPC_URL,
});

router.post("/signal", verifyPrivyToken, async (req: PrivyRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch the user's connected wallet address from Privy
    const user = await privy.getUser(userId);
    const walletAccount = user.linkedAccounts.find((a) => a.type === "wallet");
    const wallet = walletAccount ? walletAccount.address : user.id;

    const { ticker, timeframe = "1d" } = req.body;
    if (!ticker) return res.status(400).json({ error: "Ticker is required" });

    // --- X402 Payment Setup ---
    const paymentHeader = x402.extractPayment(req.headers);

    // IMPORTANT: make the resource match the actual URL being hit
    const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}` as `${string}://${string}`;

    const paymentRequirements = await x402.createPaymentRequirements({
      price: {
        amount: process.env.MAX_PAYMENT_AMOUNT || "100000", // 0.1 USDC
        asset: { address: USDC_MINT, decimals: 6 },
      },
      network: SOLANA_NETWORK,
      config: {
        description: `AI Consensus for ${ticker}`,
        resource: resourceUrl, // <-- dynamic match (localhost vs prod)
      },
    });

    // First request must return 402 with x402 headers so client can initiate payment
    if (!paymentHeader) {
      const response = x402.create402Response(paymentRequirements);
      return res.status(response.status).json(response.body);
    }

    // Verify the payment from the retry
    const paid = await x402.verifyPayment(paymentHeader, paymentRequirements);
    if (!paid) {
      console.warn("[/api/analyze/signal] Payment verification failed");
      return res.status(402).json({ error: "Invalid payment" });
    }

    // --- Run Analysis ---
    const newsFetcher = new NewsFetcher();
    const news = await newsFetcher.collectNews([ticker]);

    const consensusEngine = new ConsensusEngine();
    const consensus = await consensusEngine.runAnalysis({
      symbol: ticker,
      tweets: [],
      news: news.map((n) => `${n.headline} - ${n.snippet}`),
      timeframe,
    });

    // --- Save to Supabase (optional) ---
    try {
      await supabase.from("history").insert({
        wallet,
        ticker,
        timeframe,
        consensus,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr: any) {
      console.error("[/api/analyze/signal] supabase insert error:", dbErr.message || dbErr);
    }

    // ---- Settle payment ----
    try {
      const settled = await x402.settlePayment(paymentHeader, paymentRequirements);
      if (!settled) {
        console.warn("[/api/analyze/signal] Payment settlement failed");
      }
    } catch (settleErr: any) {
      console.error(
        "[/api/analyze/signal] Payment settlement threw:",
        settleErr?.message || settleErr
      );
    }

    return res.status(200).json({
      success: true,
      consensus,
      dataPoints: { newsArticles: news.length },
    });
  } catch (err: any) {
    console.error("[/api/analyze/signal] error:", err.stack || err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
