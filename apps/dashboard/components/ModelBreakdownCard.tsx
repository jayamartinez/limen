"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function ModelBreakdownCard({ b }: { b: any }) {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = useState<string>("0px")
  const transitionCleanupRef = useRef<(() => void) | null>(null)

  // Animate open/close using measured height so the transition is smooth
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    // Clear any previous transition listener
    if (transitionCleanupRef.current) {
      transitionCleanupRef.current()
      transitionCleanupRef.current = null
    }

    if (expanded) {
      // expand: set to measured height then clear to allow dynamic content
      const height = `${el.scrollHeight}px`
      // ensure we start from a concrete height so the transition runs
      setMaxHeight(height)

      const handle = (ev?: TransitionEvent) => {
        // Only respond to max-height transitionend to avoid duplicate triggers
        if (ev && ev.propertyName !== "max-height") return
        // only clear to 'none' if still expanded
        setMaxHeight("none")
      }

      el.addEventListener("transitionend", handle)
      transitionCleanupRef.current = () => el.removeEventListener("transitionend", handle)
    } else {
      // collapse: if currently 'none', measure the real height first so we can animate to 0
      const height = `${el.scrollHeight}px`
      // set to measured height synchronously, then in the next frame collapse to 0
      // double rAF to ensure the browser registers the starting height
      setMaxHeight(height)
      requestAnimationFrame(() => requestAnimationFrame(() => setMaxHeight("0px")))
    }
  }, [expanded])

  return (
    <div className="border border-[#F4C542]/20 p-4 rounded">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-sm text-[#F4C542]">{b.provider}</div>
          <div className="flex gap-6 mt-1 text-sm font-mono">
            <div>
              <span className="text-gray-500 uppercase text-xs mr-1">Outlook:</span>
              <span
                className={
                  b.result.outlook === "bullish"
                    ? "text-green-500 font-semibold"
                    : b.result.outlook === "bearish"
                    ? "text-red-500 font-semibold"
                    : "text-yellow-500 font-semibold"
                }
              >
                {b.result.outlook}
              </span>
            </div>
            <div>
              <span className="text-gray-500 uppercase text-xs mr-1">Probability:</span>
              <span className="text-white font-semibold">{b.result.probability}%</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-[#F4C542] hover:underline"
        >
          {expanded ? (
            <span className="inline-flex items-center gap-1">
              Close Explanation <ChevronUp />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              View Explanation <ChevronDown />
            </span>
          )}
        </button>
      </div>

      <div
        aria-hidden={!expanded}
        aria-expanded={expanded}
        ref={contentRef}
        style={{
          maxHeight: maxHeight,
          overflow: "hidden",
          transition: "max-height 260ms ease, opacity 200ms ease",
          opacity: expanded ? 1 : 0,
        }}
        className={`mt-3 text-sm text-gray-300 font-mono leading-relaxed border-t border-[#F4C542]/20 pt-3`}
      >
        {b.result.explanation}
      </div>
    </div>
  )
}
