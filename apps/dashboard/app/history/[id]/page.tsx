"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import ModelBreakdownCard from "@/components/ModelBreakdownCard"
import {
  fetchHistoryEntries,
} from "@/lib/api"

type HistoryItem = {
  id: string
  wallet: string
  ticker: string
  timeframe: string
  consensus: any
  created_at: string
}

export default function HistoryDetailPage() {
  const { id } = useParams() as { id: string }
  const { authenticated, user, getAccessToken } = usePrivy()
  const [item, setItem] = useState<HistoryItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadHistoryItem = useCallback(async () => {
    if (!id) return
    if (!authenticated) {
      setError("Connect your wallet to view this history entry.")
      setItem(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      let authToken: string | null = null
      try {
        authToken = await getAccessToken()
      } catch { }

      if (!authToken) {
        setError("Authentication required. Please reconnect your wallet.")
        setItem(null)
        return
      }

      const response = await fetchHistoryEntries<HistoryItem>(authToken, { all: true })
      const found = response.history.find((entry: HistoryItem) => entry.id === id) || null
      setItem(found)
      if (!found) setError("History entry not found.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load history entry."
      setError(message)
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [authenticated, getAccessToken, id])

  useEffect(() => {
    if (authenticated && id) {
      loadHistoryItem().catch((err) => {
        console.error("[history detail] load failed", err)
        setError(err instanceof Error ? err.message : "Unable to load history entry.")
      })
    }
  }, [authenticated, id, loadHistoryItem])

  if (loading && !item) return <div className="text-gray-500">Loading...</div>

  if (error && !item) {
    return <div className="text-[#F4C542] font-mono text-sm">{error}</div>
  }

  if (!authenticated && !item) {
    return <div className="text-gray-500 font-mono text-sm">Connect your wallet to view history.</div>
  }

  if (!item) return null

  const { consensus } = item
  const signalStance =
    typeof consensus?.stance === "string" ? consensus.stance.toUpperCase() : null
  const signalBadgeClasses =
    signalStance === "LONG"
      ? "border-green-500/30 text-green-400"
      : signalStance === "SHORT"
        ? "border-red-500/30 text-red-400"
        : "border-gray-500/30 text-gray-300"
  const confidenceLabel =
    typeof consensus?.confidence === "number" ? `${consensus.confidence}%` : "—"
  const consensusNarrative = consensus?.summary || consensus?.rationale
  const breakdowns = Array.isArray(consensus?.breakdown) ? consensus.breakdown : []
  const friendlySignal =
    signalStance === "LONG"
      ? "Long"
      : signalStance === "SHORT"
        ? "Short"
        : signalStance
          ? signalStance.charAt(0) + signalStance.slice(1).toLowerCase()
          : "Unknown"
  const signalHeading = `${friendlySignal} Signal`

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-mono font-bold">{signalHeading}</h1>
        <p className="text-gray-500 font-mono text-sm">
          Generated {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
      <div className="border border-[#F4C542]/20 bg-[#0B0D10] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F4C542]/20 pb-4">
          <div className="flex flex-wrap items-center gap-3 font-mono text-sm text-gray-300">
            <span className={`px-3 py-1 rounded border text-base ${signalBadgeClasses}`}>
              {signalStance || "UNKNOWN"}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-white font-semibold">{item.ticker}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 uppercase">{item.timeframe}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Confidence {confidenceLabel}</span>
          </div>
          <div className="text-xs font-mono text-gray-500">
            Wallet {item.wallet.slice(0, 4)}...{item.wallet.slice(-4)}
          </div>
        </div>

        {consensusNarrative && (
          <div>
            <h2 className="text-sm font-mono text-[#F4C542] mb-2 uppercase">
              Consensus Summary
            </h2>
            <div className="border border-[#F4C542]/30 p-4 text-sm text-gray-200 font-mono leading-relaxed">
              {consensusNarrative}
            </div>
          </div>
        )}

        {breakdowns.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-mono text-[#F4C542] uppercase">Model Breakdown</h3>
            {breakdowns.map((b: any, idx: number) => (
              <ModelBreakdownCard key={idx} b={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
