export interface XPost {
  id: string
  text: string
  author: string
  createdAt: string
  engagement: number
}

/**
 * XMonitor - optional social sentiment module
 * Wraps X (formerly Twitter) API v2 search
 * Can track accounts or general ticker mentions
 */
export class XMonitor {
  private bearer: string
  private accounts: string[]

  constructor(bearer: string, accounts: string[] = []) {
    this.bearer = bearer
    this.accounts = accounts
  }

  private async queryX(query: string, limit = 10): Promise<XPost[]> {
    try {
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
        query
      )}&max_results=${limit}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.bearer}` },
      })

      if (!response.ok) {
        throw new Error(`X API error: ${response.statusText}`)
      }

      const data = await response.json()

      return (
        data.data?.map((t: any) => ({
          id: t.id,
          text: t.text,
          author:
            data.includes?.users?.find((u: any) => u.id === t.author_id)
              ?.username || "unknown",
          createdAt: t.created_at,
          engagement: t.public_metrics.like_count + t.public_metrics.retweet_count,
        })) || []
      )
    } catch (err) {
      console.error("[x-monitor] error:", err)
      return []
    }
  }

  // Track activity from a fixed watchlist
  async trackAccounts(): Promise<XPost[]> {
    const all: XPost[] = []
    for (const acc of this.accounts) {
      const posts = await this.queryX(`from:${acc}`, 5)
      all.push(...posts)
    }
    return all
  }

  // Track mentions of crypto tickers
  async trackMentions(symbols: string[]): Promise<XPost[]> {
    const all: XPost[] = []
    for (const sym of symbols) {
      const posts = await this.queryX(`${sym} crypto OR ${sym} trading`, 10)
      all.push(...posts)
    }
    // rank by engagement
    return all.sort((a, b) => b.engagement - a.engagement).slice(0, 20)
  }
}
