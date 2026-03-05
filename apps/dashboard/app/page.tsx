"use client"

import { useState, useMemo, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth/solana"
import { VersionedTransaction } from "@solana/web3.js"
import { createX402Client } from "x402-solana/client"
import { toast } from "sonner"
import { API_BASE, IS_DEMO_MODE } from "@/lib/api"
import { getSolanaNetwork, getSolanaRpcUrl } from "@/lib/solana"
import { SignalRequestForm } from "@/components/consensus/SignalRequestForm"
import { ConsensusResultBoard } from "@/components/consensus/ConsensusResultBoard"
import { MOCK_SIGNAL_RESPONSE } from "@/lib/mock"

const SOLANA_NETWORK = getSolanaNetwork()
const SOLANA_RPC_URL = getSolanaRpcUrl()

export default function ConsensusPage() {
  const { authenticated, getAccessToken } = usePrivy()
  const { wallets } = useWallets()

  // Choose the first available Solana wallet connection for x402 signing
  const solanaWallet = wallets[0]

  const [ticker, setTicker] = useState("SOL-USD")
  const [timeframe, setTimeframe] = useState("1d")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [lastQuery, setLastQuery] = useState<{ ticker: string; timeframe: string } | null>(null)

  const hasShownToast = useRef(false)

  const x402Client = useMemo(() => {
    if (!authenticated || !solanaWallet) return null

    // Map Privy wallet to the interface x402-solana expects:
    // x402-solana calls: signTransaction(tx: VersionedTransaction) => Promise<VersionedTransaction>
    // Privy returns: { signedTransaction: Uint8Array }
    // We must deserialize the Uint8Array back into a VersionedTransaction
    const browserWallet = {
      address: solanaWallet.address,
      signTransaction: async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
        const serialized = tx.serialize()
        const result = await (solanaWallet as any).signTransaction({
          transaction: serialized,
          chain: `solana:devnet`,
        })
        const signedBytes: Uint8Array =
          result?.signedTransaction ?? result?.transaction ?? result
        return VersionedTransaction.deserialize(signedBytes)
      },
    }

    if (!hasShownToast.current) {
      hasShownToast.current = true
      toast.success(`✅ Wallet Connected: ${solanaWallet.address.slice(0, 6)}...`)
    }

    return createX402Client({
      wallet: browserWallet as any, // Cast to any to satisfy strict x402 wallet types
      network: SOLANA_NETWORK,
      rpcUrl: SOLANA_RPC_URL,
      maxPaymentAmount: BigInt(1_000_000),
    })
  }, [authenticated, solanaWallet])

  const handleRequest = async () => {
    setLastQuery({ ticker, timeframe })
    setLoading(true)
    setResult(null)

    if (IS_DEMO_MODE) {
      setTimeout(() => {
        setResult({ ...MOCK_SIGNAL_RESPONSE, request: { ticker, timeframe } })
        setLoading(false)
      }, 1500)
      return
    }

    if (!authenticated) {
      toast.error("Please connect your wallet to authenticate.")
      setLoading(false)
      return
    }

    if (!x402Client) {
      toast.error("Wallet signing provider not ready. Please try refreshing.")
      setLoading(false)
      return
    }

    let jwtToken: string | null = null;
    try {
      jwtToken = await getAccessToken()
    } catch {
      toast.error("Failed to retrieve Privy access token.")
      setLoading(false)
      return
    }

    if (!jwtToken) {
      toast.error("Authentication failed or session expired.")
      setLoading(false)
      return
    }

    setLastQuery({ ticker, timeframe })
    setLoading(true)
    setResult(null)

    try {
      const res = await x402Client.fetch(`${API_BASE}/api/analyze/signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ ticker, timeframe }),
      })

      const data = await res.json()
      setResult(data)
    } catch (error) {
      const message = (error as Error).message || String(error)

      if (message.toLowerCase().includes("user rejected")) {
        toast.error("User rejected the transaction.")
      } else if (message.toLowerCase().includes("walletsig")) {
        toast.error("Wallet signing failed. Try again.")
      } else {
        toast.error(`Error: ${message}`)
      }

      console.error("[handleRequest error]", message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 border-b border-[#F4C542]/20 pb-4">
        <h1 className="text-3xl font-mono font-bold mb-2 tracking-tight">Signal Console</h1>
        <p className="text-gray-400 font-mono text-sm max-w-2xl">
          Pick a market, pay 0.1 USDC, and get a LONG / SHORT signal from multiple AI models.
          Each request is settled on-chain via Solana — no subscription required.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <div className="h-full flex flex-col">
          <SignalRequestForm
            ticker={ticker}
            setTicker={setTicker}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            loading={loading}
            onRequest={handleRequest}
          />
        </div>

        <div className="h-full flex flex-col">
          <ConsensusResultBoard
            loading={loading}
            result={result}
            ticker={ticker}
            timeframe={timeframe}
            lastQuery={lastQuery}
          />
        </div>
      </div>
    </div>
  )
}
