"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth/solana"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Copy, Droplet, LogOut, RefreshCw } from "lucide-react"
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { toast } from "sonner"
import { getSolanaRpcUrl } from "@/lib/solana"

export function CustomWalletButton() {
  const { login, logout, ready, authenticated } = usePrivy()
  const { wallets } = useWallets()

  const solanaWallet = wallets[0]

  const address = solanaWallet?.address
  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : ""

  const requestAirdrop = async () => {
    if (!address) return
    const id = toast.loading("Requesting Devnet SOL...")
    try {
      const connection = new Connection(getSolanaRpcUrl())
      // Convert standard string address to PublicKey
      const { PublicKey } = await import("@solana/web3.js")
      const pubkey = new PublicKey(address)

      const sig = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL)
      await connection.confirmTransaction(sig)
      toast.success("1 SOL Airdropped! (Devnet)", { id })
    } catch (err: any) {
      console.error(err)
      toast.error("Airdrop failed. Faucet may be rate-limited.", { id })
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  // Disable button until Privy is initialized
  const isDisabled = !ready;

  if (!authenticated) {
    return (
      <button
        onClick={login}
        disabled={isDisabled}
        className="h-9 px-4 bg-transparent border-2 border-[#F4C542] text-[#F4C542] hover:bg-[#F4C542] hover:text-[#0B0D10] font-mono font-semibold cursor-pointer rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 px-4 bg-transparent border-2 border-[#F4C542] text-[#F4C542] hover:bg-[#F4C542] hover:text-[#0B0D10] font-mono font-semibold rounded-md transition-all">
          {shortAddress}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#0B0D10] border border-[#F4C542]/30 text-gray-200 font-mono text-sm">
        <DropdownMenuItem onClick={copyAddress} className="flex items-center gap-2 cursor-pointer">
          <Copy className="w-4 h-4 text-[#F4C542]" /> Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={login} className="flex items-center gap-2 cursor-pointer">
          <RefreshCw className="w-4 h-4 text-[#F4C542]" /> Switch / Link Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={requestAirdrop} className="flex items-center gap-2 cursor-pointer border-t border-[#F4C542]/20 mt-1 pt-2">
          <Droplet className="w-4 h-4 text-[#F4C542]" /> Get Devnet SOL
          <span className="text-[9px] text-gray-500 ml-auto break-keep">DEMO</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer text-red-500">
          <LogOut className="w-4 h-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
