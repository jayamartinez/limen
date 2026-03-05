"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState, useCallback } from "react"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }))

    let frame: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.pulse += 0.02
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        const opacity = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        g.addColorStop(0, `rgba(244,197,66,${opacity})`)
        g.addColorStop(1, "rgba(244,197,66,0)")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white relative overflow-x-hidden">
      {/* Particle background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{ zIndex: 1 }}
      />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.08]"
        style={{
          zIndex: 2,
          backgroundImage: `
            linear-gradient(rgba(244,197,66,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(244,197,66,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          transform: `translateY(${scrollY * 0.2}px)`,
        }}
      />

      {/* Ambient lighting */}
      <div
        className="fixed top-0 left-0 w-full h-[700px] pointer-events-none opacity-15 blur-[80px]"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#F4C542] rounded-full opacity-25"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute top-40 right-1/3 w-[400px] h-[400px] bg-[#F4C542]/40 rounded-full opacity-20"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 border-b border-[#F4C542]/10 backdrop-blur-lg bg-[#0B0D10]/70">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpg"
                alt="Limen"
                width={42}
                height={42}
                className="rounded-xl border border-[#F4C542]/20"
              />
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Limen<span className="text-[#F4C542]">.Trade</span>
                </h1>
                <p className="text-[10px] text-gray-500 font-mono tracking-wide">
                  PROTOCOL V1
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  window.location.assign(APP_URL)
                }}
                className="bg-transparent border border-[#F4C542]/40 text-[#F4C542] hover:bg-[#F4C542]/10 font-mono cursor-pointer text-xs px-6 py-5 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(244,197,66,0.1)] hover:shadow-[0_0_30px_rgba(244,197,66,0.3)]"
              >
                Launch App
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-36 pb-24 px-6 relative">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 border border-[#F4C542]/20 rounded-full bg-[#0B0D10]/70 backdrop-blur-sm">
              <div className="w-2 h-2 bg-[#F4C542] rounded-full animate-pulse" />
              <span className="text-[#F4C542] text-[10px] font-mono tracking-widest font-bold">
                POWERED BY X402 • SOLANA
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-extrabold mb-8 leading-[0.95] tracking-tight">
              <span className="text-white block">Crypto Signals</span>
              <span className="text-[#F4C542] block mt-3">AI-Driven Insights</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light">
              Get AI-powered trade signals. Pay{" "}
              <span className="text-[#F4C542]">0.1 USDC</span> per request on Solana.
              <br />
              <span className="text-gray-500 font-mono text-sm">
                No subscriptions. No accounts. Just results.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-6">
              <Button
                type="button"
                onClick={() => window.location.assign(APP_URL)}
                className="bg-[#F4C542] text-[#0B0D10] hover:bg-[#F4C542]/90 font-mono cursor-pointer font-semibold text-sm px-10 py-6 transition-all duration-300 shadow-[0_0_40px_rgba(244,197,66,0.3)] hover:shadow-[0_0_60px_rgba(244,197,66,0.6)] hover:scale-105 active:scale-95 border-2 border-[#F4C542]"
              >
                Launch App
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto bg-[#0B0D10]/70 border border-[#F4C542]/15 rounded-2xl backdrop-blur-md overflow-hidden">
            <div className="grid md:grid-cols-3 text-center">
              {[
                { value: "0.1", label: "USDC / SIGNAL" },
                { value: "<5s", label: "RESPONSE TIME" },
                { value: "24/7", label: "LIVE PROTOCOL" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-10 border-r border-[#F4C542]/10 last:border-r-0"
                >
                  <div className="text-5xl font-mono font-bold text-[#F4C542] mb-2">
                    {stat.value}
                  </div>
                  <p className="text-xs tracking-wider text-gray-500 font-mono uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* App Preview */}
        <section className="py-24 px-6 border-t border-[#F4C542]/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                See It In <span className="text-[#F4C542]">Action</span>
              </h2>
              <p className="text-gray-400 font-light">
                Watch how a signal request works from start to finish.
              </p>
            </div>

            {/* Video container */}
            <div
              className="relative group rounded-2xl overflow-hidden border border-[#F4C542]/20 shadow-[0_0_60px_rgba(244,197,66,0.08)] bg-[#0B0D10]"
              onClick={togglePlay}
              style={{ cursor: "pointer" }}
            >
              {/* Subtle top gradient bar */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F4C542]/40 to-transparent z-10" />

              <video
                ref={videoRef}
                src="/preview.mov"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                className="w-full block"
                style={{ pointerEvents: "none" }}
              />

              {/* Play/Pause overlay — only visible on hover or when paused */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying
                  ? "opacity-0 group-hover:opacity-100"
                  : "opacity-100"
                  }`}
              >
                <div className="w-16 h-16 rounded-full bg-[#0B0D10]/80 border border-[#F4C542]/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(244,197,66,0.3)]">
                  {isPlaying ? (
                    // Pause icon
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="3" width="4" height="14" rx="1" fill="#F4C542" />
                      <rect x="12" y="3" width="4" height="14" rx="1" fill="#F4C542" />
                    </svg>
                  ) : (
                    // Play icon
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 3.5L17 10L5 16.5V3.5Z" fill="#F4C542" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Corner badge */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B0D10]/80 border border-[#F4C542]/20 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F4C542] animate-pulse" />
                <span className="text-[10px] font-mono text-[#F4C542] tracking-widest uppercase">Live Demo</span>
              </div>
            </div>

            <p className="text-center text-xs font-mono text-gray-600 mt-4 tracking-wide">
              Click to pause
            </p>
          </div>
        </section>

        {/* WHAT IS LIMEN */}
        <section className="py-24 px-6 border-t border-[#F4C542]/10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              What is <span className="text-[#F4C542]">Limen</span>?
            </h2>
            <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto leading-relaxed">
              Limen is an AI-powered crypto signal platform. Connect your Solana wallet,
              pick a trading pair, and get a LONG or SHORT signal from a panel of AI models
              all for a flat 0.1 USDC per request. No sign-up, no monthly fees, no lock-in.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-6 border-t border-[#F4C542]/10">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">How It Works</h2>
            <p className="text-gray-400 text-sm font-mono mb-16 tracking-widest uppercase">
              Simple, transparent, and fully on-chain
            </p>

            <div className="grid md:grid-cols-4 gap-8 text-left">
              {[
                {
                  step: "01",
                  title: "Connect Wallet",
                  desc: "Link your Solana wallet Phantom, Solflare, or Backpack all work.",
                },
                {
                  step: "02",
                  title: "Pick a Market",
                  desc: "Choose the trading pair and timeframe you want a signal for.",
                },
                {
                  step: "03",
                  title: "Pay 0.1 USDC",
                  desc: "Your wallet approves a small on-chain payment. No recurring charges.",
                },
                {
                  step: "04",
                  title: "Get Your Signal",
                  desc: "Multiple AI models analyze the market and return a LONG, SHORT, or HOLD within seconds.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="relative border border-[#F4C542]/10 rounded-2xl p-8 bg-[#0B0D10]/60 hover:border-[#F4C542]/30 transition-colors"
                >
                  <div className="text-[#F4C542] font-mono text-sm tracking-widest mb-3">
                    STEP {s.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-6 border-t border-[#F4C542]/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "How are payments handled?",
                  a: "Each signal costs 0.1 USDC, charged at the time you request it. Your wallet signs the payment on Solana it settles on chain instantly. There are no subscriptions, no stored payment methods, and no recurring charges.",
                },
                {
                  q: "What does a signal include?",
                  a: "Each signal includes a recommended direction (LONG, SHORT, or HOLD), the trading pair and timeframe, a confidence score, and a short explanation of the reasoning. Where applicable, you'll also see suggested entry and exit levels.",
                },
                {
                  q: "Which wallets are supported?",
                  a: "Any Solana wallet that supports the wallet standard works Phantom, Solflare, and Backpack are all tested. You just need USDC in your wallet to cover the per-request fee.",
                },
                {
                  q: "Do I need to create an account?",
                  a: "No. Your wallet is your account. Connect it, make a request, and your history is tied to your wallet address. No email, no password, no sign up form.",
                },
                {
                  q: "How accurate are the signals?",
                  a: "Limen aggregates outputs from multiple AI models and weights them into a consensus signal. Like any market analysis tool, it's not financial advice always use your own judgment before trading.",
                },
              ].map((item, i) => (
                <details
                  key={i}
                  className="group border border-[#F4C542]/15 rounded-xl p-6 bg-[#0B0D10]/60 backdrop-blur-sm hover:border-[#F4C542]/30 transition-all duration-300"
                >
                  <summary className="flex justify-between items-center cursor-pointer list-none text-left">
                    <span className="font-mono text-sm text-white">{item.q}</span>
                    <span className="text-[#F4C542] text-xl transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="text-gray-400 text-sm mt-4 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-16 pb-10 px-6 border-t border-[#F4C542]/10 text-center relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Image
                src="/logo.jpg"
                alt="Limen"
                width={36}
                height={36}
                className="rounded-xl border border-[#F4C542]/20"
              />
              <h3 className="text-lg font-bold">
                Limen<span className="text-[#F4C542]">.Trade</span>
              </h3>
            </div>
            <p className="text-gray-500 text-xs font-mono mb-6">
              AI-powered crypto signals. Pay per request on Solana.
            </p>
            <p className="text-gray-600 text-[10px] font-mono tracking-wider">
              © 2026 LIMEN.TRADE — ALL RIGHTS RESERVED
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
