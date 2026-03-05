import { Loader2 } from "lucide-react"
import ModelBreakdownCard from "@/components/ModelBreakdownCard"

interface ConsensusResultBoardProps {
    loading: boolean;
    result: any;
    ticker: string;
    timeframe: string;
    lastQuery: { ticker: string; timeframe: string } | null;
}

export function ConsensusResultBoard({
    loading,
    result,
    ticker,
    timeframe,
    lastQuery,
}: ConsensusResultBoardProps) {
    const consensus = result?.consensus
    const summaryTicker =
        result?.ticker ?? result?.request?.ticker ?? lastQuery?.ticker ?? ticker
    const summaryTimeframe =
        result?.timeframe ?? result?.request?.timeframe ?? lastQuery?.timeframe ?? timeframe
    const signalStance =
        typeof consensus?.stance === "string" ? consensus.stance.toUpperCase() : null
    const signalBadgeClasses =
        signalStance === "LONG"
            ? "border-green-500/30 text-green-400"
            : signalStance === "SHORT"
                ? "border-red-500/30 text-red-400"
                : "border-gray-500/30 text-gray-300"
    const consensusNarrative = consensus?.summary || consensus?.rationale
    const consensusConfidence =
        typeof consensus?.confidence === "number" ? `${consensus.confidence}%` : "—"
    const breakdowns = Array.isArray(consensus?.breakdown) ? consensus.breakdown : []

    return (
        <div className="border border-[#F4C542]/20 bg-[#0B0D10] p-6 h-full min-h-[400px]">
            <div className="mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#F4C542]" />
                <h2 className="text-sm font-mono font-semibold text-[#F4C542] uppercase tracking-wider">
                    Signal Output
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center gap-4 text-[#F4C542]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-xs font-mono animate-pulse">Running consensus models...</span>
                    </div>
                </div>
            ) : result?.success ? (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3 font-mono text-sm text-gray-200">
                        <span className={`px-2 py-0.5 rounded border ${signalBadgeClasses} text-lg`}>
                            {signalStance || "UNKNOWN"}
                        </span>
                        <span className="text-gray-500">|</span>
                        <span className="text-white font-semibold">{summaryTicker}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400 uppercase">{summaryTimeframe}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400">Confidence {consensusConfidence}</span>
                    </div>
                    <div className="border border-[#F4C542]/30 bg-black/20 p-4 space-y-3">
                        {consensusNarrative && (
                            <p className="font-mono text-sm text-gray-200 leading-relaxed">
                                {consensusNarrative}
                            </p>
                        )}
                    </div>

                    {breakdowns.length > 0 ? (
                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Model Breakdown</h3>
                            {breakdowns.map((b: any, idx: number) => (
                                <ModelBreakdownCard key={idx} b={b} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs font-mono text-gray-500 mt-4 border-t border-[#F4C542]/20 pt-4">
                            No detailed model breakdown available for this signal.
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex justify-center items-center h-64 text-gray-500 font-mono text-sm border border-dashed border-[#F4C542]/20 bg-black/50">
                    Awaiting request...
                </div>
            )}
        </div>
    )
}
