export default function EntriesPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="border border-[#F4C542]/20 bg-[#0B0D10] p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 bg-[#F4C542]" />
          <p className="text-xs font-mono text-[#F4C542] tracking-wider uppercase">Entries</p>
        </div>
        <h1 className="text-2xl font-mono font-bold mb-4">Coming Soon</h1>
        <p className="text-gray-400 font-mono text-sm leading-relaxed">
          This page will showcase Limen entries and on-chain execution details. Check back after
          the mainnet rollout for a full breakdown of fills, tx hashes, and performance stats.
        </p>
      </div>
    </div>
  )
}
