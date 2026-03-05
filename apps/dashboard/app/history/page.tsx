"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import Link from "next/link"
import ModelBreakdownCard from "@/components/ModelBreakdownCard"
import { usePrivy } from "@privy-io/react-auth"
import {
  fetchHistoryEntries,
  HistoryPagination,
} from "@/lib/api"

type HistoryItem = {
  id: string
  wallet: string
  ticker: string
  timeframe: string
  consensus: {
    stance?: string
    confidence?: number
    rationale?: string
    [key: string]: any
  }
  created_at: string
}

export default function HistoryPage() {
  const { authenticated, getAccessToken } = usePrivy()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<HistoryPagination | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchHistory = useCallback(async () => {
    if (!authenticated) {
      setError("Connect your wallet to view history.")
      setHistory([])
      setPagination(null)
      return
    }

    setRefreshing(true)
    setError(null)

    try {
      let authToken: string | null = null
      try {
        authToken = await getAccessToken()
      } catch { }

      if (!authToken) {
        setError("Authentication required. Please reconnect your wallet.")
        setHistory([])
        setPagination(null)
        return
      }

      const response = await fetchHistoryEntries<HistoryItem>(authToken, {
        page,
        limit: pageSize,
      })

      setHistory(response.history)
      setPagination(response.pagination)

      const resolvedPage = response.pagination?.page
      const resolvedLimit = response.pagination?.limit
      if (resolvedPage && resolvedPage !== page) {
        setPage(resolvedPage)
      }
      if (typeof resolvedLimit === "number" && resolvedLimit > 0 && resolvedLimit !== pageSize) {
        setPageSize(resolvedLimit)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load history."
      setError(message)
      setPagination(null)
    } finally {
      setRefreshing(false)
    }
  }, [authenticated, getAccessToken, page, pageSize])

  useEffect(() => {
    if (authenticated) {
      fetchHistory().catch((err) => {
        console.error("[history] load failed", err)
        setError(err instanceof Error ? err.message : "Unable to load history.")
      })
    }
  }, [authenticated, fetchHistory])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Pagination logic
  const totalEntries = pagination?.total ?? history.length
  const effectivePageSize =
    pagination?.pageSize && pagination.pageSize > 0 ? pagination.pageSize : pageSize
  const currentPage = pagination?.page ?? page
  const indexBase = effectivePageSize > 0 ? (currentPage - 1) * effectivePageSize : 0
  const totalPages =
    effectivePageSize > 0 ? Math.max(1, Math.ceil(totalEntries / effectivePageSize)) : 1

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold mb-2">Request History</h1>
          <p className="text-gray-500 font-mono text-sm">View all past signal requests</p>
        </div>
        <Button
          onClick={fetchHistory}
          disabled={refreshing}
          variant="outline"
          className="border-[#F4C542]/30 hover:bg-[#F4C542]/10 font-mono text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="border border-[#F4C542]/20 bg-[#0B0D10]">
        <div className="border-b border-[#F4C542]/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#F4C542]" />
            <h2 className="text-sm font-mono font-semibold text-[#F4C542] uppercase tracking-wider">
              Signal Log
            </h2>
            <span className="text-xs font-mono text-gray-500 ml-2">{totalEntries} entries</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-gray-500">Per Page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="bg-[#0B0D10] border border-[#F4C542]/30 text-xs font-mono text-gray-300 px-2 py-1"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="border-b border-[#F4C542]/20 bg-[#140c00]/30 px-4 py-3">
            <p className="text-xs font-mono text-[#F4C542]">{error}</p>
          </div>
        )}

        {totalEntries === 0 && !error ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-mono text-sm">
              No requests yet. Submit your first signal request.
            </p>
          </div>
        ) : history.length > 0 ? (
          <div>
            {history.map((item, idx) => (
              <div
                key={item.id}
                className={`border-b border-[#F4C542]/10 last:border-b-0 ${expandedId === item.id ? "bg-[#0B0D10]" : "hover:bg-[#0B0D10]/50"
                  } transition-colors`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 font-mono text-sm">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-gray-500 text-xs">
                          [
                          {String(indexBase + idx + 1).padStart(2, "0")}
                          ]
                        </span>
                        <span className="text-white font-semibold">{item.ticker}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400">{item.timeframe}</span>
                        <span className="text-gray-500">|</span>
                        <span
                          className={`font-semibold ${item.consensus?.stance === "LONG"
                            ? "text-green-500"
                            : item.consensus?.stance === "SHORT"
                              ? "text-red-500"
                              : "text-gray-400"
                            }`}
                        >
                          {item.consensus?.stance || "?"}
                        </span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400">
                          {item.consensus?.confidence || 0}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 ml-10">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/history/${item.id}`}
                        className="text-xs text-[#F4C542] hover:underline"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="text-[#F4C542] hover:text-[#F4C542]/80 transition-colors"
                      >
                        {expandedId === item.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="border-t border-[#F4C542]/20 p-4 bg-[#0B0D10] space-y-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="uppercase tracking-wider text-gray-500">Signal</span>
                        <span
                          className={`px-2 py-0.5 rounded border ${item.consensus?.stance === "LONG"
                            ? "border-green-500/30 text-green-400"
                            : item.consensus?.stance === "SHORT"
                              ? "border-red-500/30 text-red-400"
                              : "border-gray-500/30 text-gray-300"
                            }`}
                        >
                          {item.consensus?.stance || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="uppercase tracking-wider text-gray-500 mr-2">
                          Confidence
                        </span>
                        <span className="text-gray-200">
                          {item.consensus?.confidence != null
                            ? `${item.consensus.confidence}%`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {(item.consensus?.summary || item.consensus?.rationale) && (
                      <div className="border border-[#F4C542]/20 bg-black/20 p-4 font-mono text-xs text-gray-200 leading-relaxed">
                        {item.consensus?.summary || item.consensus?.rationale}
                      </div>
                    )}

                    {Array.isArray(item.consensus?.breakdown) &&
                      item.consensus.breakdown.length > 0 && (
                        <div className="space-y-3">
                          {item.consensus.breakdown.map((b: any, idx: number) => (
                            <ModelBreakdownCard key={idx} b={b} />
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination controls */}
            <div className="flex justify-between items-center p-4 border-t border-[#F4C542]/20">
              <Button
                variant="outline"
                className="font-mono text-xs border-[#F4C542]/30 hover:bg-[#F4C542]/10"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span className="text-xs font-mono text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                className="font-mono text-xs border-[#F4C542]/30 hover:bg-[#F4C542]/10"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || pagination?.hasMore === false}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-mono text-sm">
              No results on this page. Try a different page or adjust the page size.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
