# Limen

A crypto signal platform powered by on-chain micropayments. Users connect a Solana wallet, submit a trade signal request, pay 0.1 USDC via the x402 protocol, and get back a LONG/SHORT/HOLD consensus from five AI models running in parallel — no subscriptions, no accounts.

---

## Overview

The app uses the HTTP 402 flow end-to-end: the API returns payment requirements on the first request, the client builds and signs a Solana USDC transaction through the user's wallet, then retries with the signed payment header. The backend verifies the on-chain settlement, runs the AI consensus engine, stores the result in Supabase, and returns the signal.

---

## Architecture

Three apps in a pnpm monorepo:

```
apps/
  api/        Express + TypeScript backend (port 8080)
  dashboard/  Next.js 16 app (port 3000)
  web/        Next.js 16 marketing site (port 3001)
```

**Request flow:**
```
User → POST /api/analyze/signal
     ← 402 + Solana USDC payment requirements
       wallet signs USDC transaction
     → POST /api/analyze/signal + X-PAYMENT header
     ← 402 handler verifies on-chain settlement
     ← 200 OK + AI consensus result
```

**API** (`apps/api`)
- Express 4 + TypeScript
- Privy server-auth for JWT verification — every protected route resolves the user's linked Solana wallet via `privy.getUser()`
- `x402-solana` server handler for payment gating
- Vercel AI SDK v5 routing to 5 models (Grok, Gemini 2.5 Pro, DeepSeek v3, Claude 3.5 Sonnet, GPT-4.1 Mini) via AI Gateway (`AI_GATEWAY_API_KEY`)
- Supabase for persisting signal history per wallet
- Google Search API + Coinbase for news and market data context injected into prompts

**Dashboard** (`apps/dashboard`)
- Next.js 16 App Router + React 19
- Privy React SDK  Solana-only wallet login (`walletChainType: 'solana-only'`)
- `x402-solana` client intercepts 402s, serializes the `VersionedTransaction`, routes it through Privy's `signTransaction`, deserializes the signed bytes, and attaches the payment header
- Tailwind CSS v4 + shadcn/ui

**Landing** (`apps/web`)
- Next.js 16 + Tailwind CSS v4
- Autoplay app preview video with custom play/pause controls, no native browser UI

---

## Tech Stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)


**Backend**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)

![Express](https://img.shields.io/badge/Express_4-000000?style=flat&logo=express&logoColor=white)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

**Database & Auth**

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)

[Privy](https://www.privy.io)

**Payments & Blockchain**

![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)

[x402](https://www.x402.org)

**AI**

![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK_v5-000000?style=flat&logo=vercel&logoColor=white)

**Tooling**

![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white)


---

## Network Switching

The system is designed to switch between Solana environments (devnet, testnet, mainnet) by changing a few environment variables — no code changes needed. `SOLANA_NETWORK`, `SOLANA_RPC_URL`, and `USDC_MINT` in the API control the active network. The dashboard follows via `NEXT_PUBLIC_SOLANA_NETWORK`. This made it straightforward to develop locally on devnet while keeping the structure production-compatible.

---

## Features

- Privy wallet auth - Solana-only, no email/social login required
- x402 pay-per-request - 0.1 USDC per signal, settled on-chain
- Multi-model AI consensus - 5 models vote, output is LONG / SHORT / HOLD with a confidence score
- Signal history - persisted to Supabase per wallet address, viewable in the dashboard
- Market + news context - live price data and news headlines injected into every AI prompt
- Server-side auth - every API route validates the Privy token and resolves the wallet server-side
- Demo mode - set `NEXT_PUBLIC_DEMO_MODE=true` to skip payment and return mock data

---

## Environment Variables

### `apps/api/.env`

| Variable | Description |
|---|---|
| `PORT` | Port for the API server (default: `8080`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `PRIVY_APP_ID` | Privy app ID (no `NEXT_PUBLIC_` prefix — server-side only) |
| `PRIVY_APP_SECRET` | Privy app secret |
| `SOLANA_NETWORK` | Network identifier (`solana-devnet` / `solana`) |
| `TREASURY_WALLET_ADDRESS` | Solana address that receives USDC payments |
| `FACILITATOR_URL` | x402 facilitator endpoint |
| `MAX_PAYMENT_AMOUNT` | Max USDC in base units (`100000` = 0.1 USDC) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search API key |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Custom Search Engine ID |
| `COINBASE_BEARER` | Coinbase API bearer token |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (required for all AI models) |

### `apps/dashboard/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID (public, client-side) |
| `NEXT_PUBLIC_API_BASE` | API base URL (e.g. `http://localhost:8080`) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network for the client (`devnet`) |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `true` to use mock data instead of live requests |

---

## Local Development

**Prerequisites**
- Node.js 18+, pnpm v8+
- Solana wallet (Phantom, Solflare, or Backpack) on Devnet
- Devnet USDC — get some from [faucet.circle.com](https://faucet.circle.com)
- Privy app with Solana wallet login enabled — [dashboard.privy.io](https://dashboard.privy.io)
- Supabase project

**Steps**

```bash
git clone https://github.com/jayamartinez/limen.git
cd limen
pnpm install
```

```bash
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local
# fill in your values
```

```bash
pnpm dev
```

| App | URL |
|---|---|
| Dashboard | `http://localhost:3000` |
| Landing | `http://localhost:3001` |
| API | `http://localhost:8080` |

---

## Project Structure

```
limen/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── server.ts           # entry point, CORS, middleware
│   │       ├── routes/
│   │       │   ├── analyze/        # signal endpoint + x402 payment gate
│   │       │   └── history/        # paginated signal history
│   │       └── lib/
│   │           ├── privy.ts        # server Privy client + auth middleware
│   │           ├── supabase.ts     # Supabase client
│   │           ├── consensus.ts    # multi-model AI engine
│   │           ├── market-data.ts  # price + indicator fetching
│   │           └── news-service.ts # news fetching for AI context
│   │
│   ├── dashboard/
│   │   └── app/
│   │       ├── providers.tsx   # PrivyProvider, Solana-only config
│   │       ├── page.tsx        # signal console
│   │       ├── history/        # signal history view
│   │       └── settings/       # account info and API settings
│   │
│   └── web/
│       └── app/
│           └── page.tsx        # landing page + preview video
│
├── pnpm-workspace.yaml
└── package.json
```

---

## Why I Built This

I originally started this project in November 2025 when the x402 protocol started getting a lot of attention for API micropayments. I was seeing people talk about it and experiment with it, especially around Solana, and I was curious how it actually worked in a real application.

I also needed an authentication solution and had seen Privy used in a few other projects, so I decided to use it here. It wasn’t something I had deep experience with it was just the auth system I was familiar with seeing in other web3 apps. Using it in this project gave me a better understanding of how wallet-based auth works compared to a typical email/password setup.

The repo is split into multiple services (API, dashboard app, and landing page) mainly because I wanted to practice structuring projects that way. I’ve mostly worked on smaller apps before, so this was a good way to get used to keeping different parts of a system separated and communicating through APIs instead of everything living in one codebase.

I also intentionally used AI tools while building it. Part of the goal was figuring out how to actually use AI productively while developing writing prompts, reviewing generated code, and integrating it into a real workflow instead of treating it like a magic black box.

I ended up putting the project down for a while after the initial build, then recently came back to clean it up, fix some parts of the architecture, and make the repository presentable.

It’s also a portfolio project, but the main reason I built it was to experiment with newer tools and ideas especially x402-style API payments and wallet-based authentication and see what it actually looks like when everything is wired together in a working system.