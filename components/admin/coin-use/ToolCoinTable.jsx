// "Tools Name / Coin Use" list — the bottom half of the Coin Use panel.
export default function ToolCoinTable({ tools }) {
  return (
    <div className="rounded-2xl border border-divider overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse">
        <thead>
          <tr className="bg-surface">
            <th className="px-5 py-3.5 text-left text-sm font-bold text-foreground">Tools Name</th>
            <th className="px-5 py-3.5 text-left text-sm font-bold text-foreground">Coin Use</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool.name} className="border-t border-divider hover:bg-surface transition-colors">
              <td className="px-5 py-3.5 text-sm text-muted">{tool.name}</td>
              <td className="px-5 py-3.5 text-sm text-muted">{tool.coinUse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
