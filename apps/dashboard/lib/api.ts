
import { MOCK_HISTORY_RESPONSE } from "./mock"

const DEFAULT_API_BASE = "https://api.limen.trade"


export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

export type HistoryPagination = {
  limit: number | null
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export type HistoryResponse<T = any> = {
  history: T[]
  pagination: HistoryPagination | null
}

type HistoryQuery = {
  page?: number
  limit?: number | "all"
  all?: boolean
}

export async function fetchHistoryEntries<T = any>(
  token: string,
  query: HistoryQuery = {}
): Promise<HistoryResponse<T>> {
  if (IS_DEMO_MODE) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_HISTORY_RESPONSE as unknown as HistoryResponse<T>;
  }

  const params = new URLSearchParams()

  if (query.all) {
    params.set("all", "true")
  } else if (query.limit) {
    params.set("limit", query.limit === "all" ? "all" : String(query.limit))
  }

  if (query.page) {
    params.set("page", String(query.page))
  }

  const qs = params.toString()
  const url = `${API_BASE}/api/history${qs ? `?${qs}` : ""}`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    // Privy automatically handles revoking/refreshing its tokens for us
    console.warn("History fetch returned 401 Unauthorized")
  }

  if (!res.ok) {
    throw new Error(`History fetch failed (${res.status})`)
  }

  const body = await res.json()
  const history = Array.isArray(body?.history) ? body.history : []
  const pagination: HistoryPagination | null = body?.pagination ?? null
  return { history, pagination }
}
