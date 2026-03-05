"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePrivy } from "@privy-io/react-auth"
import {
  fetchHistoryEntries,
} from "@/lib/api"

export default function SettingsPage() {
  const { authenticated, user, getAccessToken } = usePrivy()
  const [historyCount, setHistoryCount] = useState<number | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchHistoryCount = useCallback(async () => {
    if (!authenticated) {
      setError("Connect your wallet to load settings.")
      setHistoryCount(null)
      return
    }

    setLoadingHistory(true)
    setError(null)

    try {
      let authToken: string | null = null
      try {
        authToken = await getAccessToken()
      } catch { }

      if (!authToken) {
        setError("Authentication required. Please reconnect your wallet.")
        setHistoryCount(null)
        return
      }

      const response = await fetchHistoryEntries(authToken, { limit: 1, page: 1 })
      setHistoryCount(response.pagination?.total ?? response.history.length)
      setLastFetchedAt(new Date().toLocaleString())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load settings."
      setError(message)
      setHistoryCount(null)
    } finally {
      setLoadingHistory(false)
    }
  }, [authenticated, getAccessToken])

  useEffect(() => {
    if (authenticated) {
      fetchHistoryCount().catch((err) => {
        console.error("[settings] history load failed", err)
        setError(err instanceof Error ? err.message : "Unable to load settings.")
      })
    } else {
      setHistoryCount(null)
      setLastFetchedAt(null)
    }
  }, [authenticated, fetchHistoryCount])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-mono font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="border border-[#F4C542]/20 bg-[#0B0D10] p-6">
          <h2 className="text-sm font-mono text-[#F4C542] uppercase mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 mb-2 block uppercase">Wallet</label>
              <Input readOnly value={user?.wallet?.address || "Not connected"} />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-400 mb-2 block uppercase">Requests</label>
              <Input
                readOnly
                value={
                  loadingHistory
                    ? "Loading..."
                    : historyCount != null
                      ? historyCount.toString()
                      : error || "Unavailable"
                }
              />
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-500">
                <span>
                  {lastFetchedAt ? `Last synced ${lastFetchedAt}` : "Not synced yet"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingHistory}
                  onClick={() => fetchHistoryCount().catch(() => null)}
                  className="h-7 border-[#F4C542]/30 text-[#F4C542] hover:bg-[#F4C542]/10"
                >
                  {loadingHistory ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 text-xs font-mono text-[#F4C542] bg-[#140c00]/30 px-3 py-2 border border-[#F4C542]/20">
              {error}
            </div>
          )}
        </div>


        <div className="border border-[#F4C542]/20 bg-[#0B0D10] p-6 space-y-4">
          <h2 className="text-sm font-mono text-[#F4C542] uppercase">API Access</h2>
          <p className="text-xs font-mono text-gray-400 leading-relaxed">
            Manage API integrations for external tools. Generated keys will inherit your plan
            limits and can be revoked anytime.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="border-2 border-dashed border-[#F4C542] bg-transparent text-[#F4C542]"
              disabled
            >
              Coming Soon · Generate Read Key
            </Button>
            <Button variant="outline" disabled>
              Coming Soon · Generate Write Key
            </Button>
          </div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            REST endpoints are live at {process.env.NEXT_PUBLIC_API_BASE || "https://api.limen.trade"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button className="border-2 border-[#F4C542] bg-transparent text-[#F4C542]">
          → Save Changes
        </Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  )
}
