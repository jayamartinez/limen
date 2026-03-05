import { config } from "dotenv";
import { getCachedNews, setCachedNews } from "./news-cache";

config();

export interface Article {
  headline: string
  link: string
  domain: string
  date: string
  snippet: string
}

const SOURCES = [
  "bloomberg.com",      
  "reuters.com",
  "marketwatch.com",
  "coindesk.com",
  "bitcoinmagazine.com",
  "cointelegraph.com",
  "cryptonews.com",
  "decrypt.co",
  "theblock.co",
]


const QUERY_TOPICS = ["crypto news", "futures", "perpetuals", "funding rates", "options"]

export class NewsFetcher {
  async fetchArticles(query: string, site?: string): Promise<Article[]> {
    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY
      const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID

      if (!apiKey || !engineId) {
        console.warn("[news] API not configured, returning fallback data")
        return this.mockArticles(query)
      }

      let apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(
        query
      )}&num=10`

      if (site) apiUrl += `&siteSearch=${site}`

      const response = await fetch(apiUrl)
      const data = await response.json()

      return (
        data.items?.map((item: any) => ({
          headline: item.title,
          link: item.link,
          domain: new URL(item.link).hostname,
          date:
            item.pagemap?.metatags?.[0]?.["article:published_time"] ??
            new Date().toISOString(),
          snippet: item.snippet,
        })) ?? []
      )
    } catch (err) {
      console.error("[news] error:", err)
      return this.mockArticles(query)
    }
  }

  async collectNews(symbols: string[]): Promise<Article[]> {
    const cached = getCachedNews(symbols)
    if (cached) {
      return cached.articles
    }

    const grouped: Record<string, Article[]> = {}
    const tasks: Promise<{ site: string; items: Article[] }>[] = []

    for (const s of symbols) {
      for (const topic of QUERY_TOPICS) {
        for (const site of SOURCES) {
          const q = `${s} ${topic}`
          tasks.push(
            this.fetchArticles(q, site).then((items) => ({
              site,
              items,
            }))
          )
        }
      }
    }

    const results = await Promise.all(tasks)

    for (const { site, items } of results) {
      if (!grouped[site]) grouped[site] = []
      grouped[site].push(...items)
    }

    for (const site of Object.keys(grouped)) {
      const deduped = Array.from(new Map(grouped[site].map((a) => [a.link, a])).values())
      deduped.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      grouped[site] = deduped.slice(0, 5)
    }

    const merged = Object.values(grouped).flat()
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const latest = merged.slice(0, 20)
    setCachedNews(symbols, latest)
    return latest
  }

  private mockArticles(query: string): Article[] {
    return [
      {
        headline: `${query} momentum builds`,
        link: "https://example.com/mock1",
        domain: "mocksite",
        date: new Date().toISOString(),
        snippet: `Synthetic article about ${query} market trends.`,
      },
      {
        headline: `${query} market outlook improves`,
        link: "https://example.com/mock2",
        domain: "mocksite",
        date: new Date().toISOString(),
        snippet: `Analysts suggest ${query} could experience volatility soon.`,
      },
    ]
  }
}
