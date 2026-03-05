import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TICKERS = ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD"]
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "6h", "1d", "1w"]

interface SignalRequestFormProps {
    ticker: string;
    setTicker: (val: string) => void;
    timeframe: string;
    setTimeframe: (val: string) => void;
    loading: boolean;
    onRequest: () => void;
}

export function SignalRequestForm({
    ticker,
    setTicker,
    timeframe,
    setTimeframe,
    loading,
    onRequest,
}: SignalRequestFormProps) {
    return (
        <div className="border border-[#F4C542]/20 bg-[#0B0D10] p-6">
            <div className="mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#F4C542]" />
                <h2 className="text-sm font-mono font-semibold text-[#F4C542] uppercase tracking-wider">
                    Parameters
                </h2>
            </div>

            <div className="space-y-4">
                {/* Ticker */}
                <div>
                    <label className="text-xs font-mono text-gray-400 block uppercase tracking-wider mb-2">
                        Ticker
                    </label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-between w-full bg-[#0B0D10] border border-[#F4C542]/30 px-3 py-2 rounded-md font-mono text-sm text-white">
                                {ticker}
                                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0B0D10] border border-[#F4C542]/20 text-sm font-mono text-white min-w-[var(--radix-dropdown-menu-trigger-width)]">
                            {TICKERS.map((t) => (
                                <DropdownMenuItem
                                    key={t}
                                    onClick={() => setTicker(t)}
                                    className={`cursor-pointer ${ticker === t ? "text-[#F4C542]" : ""}`}
                                >
                                    {t}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Timeframe */}
                <div>
                    <label className="text-xs font-mono text-gray-400 block uppercase tracking-wider mb-2">
                        Timeframe
                    </label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-between w-full bg-[#0B0D10] border border-[#F4C542]/30 px-3 py-2 rounded-md font-mono text-sm text-white">
                                {timeframe}
                                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#0B0D10] border border-[#F4C542]/20 text-sm font-mono text-white min-w-[var(--radix-dropdown-menu-trigger-width)]">
                            {TIMEFRAMES.map((tf) => (
                                <DropdownMenuItem
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`cursor-pointer ${timeframe === tf ? "text-[#F4C542]" : ""}`}
                                >
                                    {tf}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="pt-4 border-t border-[#F4C542]/20 space-y-3">
                    <div className="flex justify-between text-xs font-mono text-gray-400 uppercase">
                        <span>Cost</span>
                        <span className="text-[#F4C542]">0.1 USDC</span>
                    </div>
                    <Button
                        onClick={onRequest}
                        disabled={loading}
                        className="w-full border-2 border-[#F4C542] bg-transparent text-[#F4C542] font-mono font-semibold hover:bg-[#F4C542] hover:text-[#0B0D10] transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Request Signal
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
