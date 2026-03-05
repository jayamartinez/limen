
const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com"

export function getSolanaNetwork(): "solana" | "solana-devnet" {
  return "solana-devnet"
}

export function getSolanaRpcUrl() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET || DEFAULT_DEVNET_RPC
}
