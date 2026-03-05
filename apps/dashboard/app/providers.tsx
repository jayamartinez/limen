'use client'

import React from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#F4C542',
          // Solana-only: prevent Privy from defaulting to Ethereum wallets
          walletChainType: 'solana-only',
          showWalletLoginFirst: true,
        },
        loginMethods: ['wallet'],
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
