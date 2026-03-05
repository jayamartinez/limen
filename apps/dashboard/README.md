# Limen

Limen is a decentralized, pay-per-request crypto analytics platform leveraging AI for consensus-driven market signals. It provides institutional-grade market sentiment analysis using the x402 micropayment protocol on Solana, allowing users to query predictive models frictionlessly.

## Features

- **x402 Micropayment Integration**: True pay-per-request monetization on Solana without subscriptions or locked balances.
- **Web3 Authentication**: Challenge-response wallet signatures for secure, custom JWT session management.
- **AI Consensus Signals**: Aggregates models (Quant-Gamma, Macro-Correlator, OnChain Sentiment) to produce high-confidence directional vectors.
- **Terminal-Inspired UI**: Responsive, data-dense interface built with Next.js, Tailwind CSS, and shadcn/ui.

## Getting Started

### Prerequisites
- Node.js 18+
- [pnpm](https://pnpm.io/)
- A Solana Wallet (Phantom, Backpack) on **Devnet**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/limen.git
   cd limen
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure Environment Variables:
   Copy the example config and adjust as needed:
   ```bash
   cp .env.example .env.local
   ```
   *Note: For review/portfolio demonstration without a backend, ensure `NEXT_PUBLIC_DEMO_MODE="true"` is set.*

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture 

The platform is designed as a secure frontend microservice querying a private ML-powered backend:

1. **Client**: Next.js App Router (React, Tailwind, Zustand).
2. **Auth Layer**: Solana Wallet Adapter + Custom JWT signing.
3. **Payment Layer**: `x402-solana` protocol for streaming micropyayments on Devnet. 
4. **Data Layer**: Backend proxy (or mock service in Demo Mode) serving aggregated signal JSONs.

## Demo Flow

For recruiters or technical reviewers testing the application:
1. Ensure your Solana wallet is set to **Devnet**.
2. Connect your wallet via the top right button.
3. Sign the authentication challenge to generate a secure session.
4. Select a **Ticker** and **Timeframe**, then hit "Request Signal".
5. Approve the 0.1 USDC (Devnet) transaction to reveal the consensus breakdown.

---

*This project is built as a portfolio demonstration of modern Web3 frontend architecture, secure micropayment integration, and polished UX design.*
