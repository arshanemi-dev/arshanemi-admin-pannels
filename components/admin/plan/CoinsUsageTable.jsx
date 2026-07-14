import { Fragment } from 'react'

// "Coins Usage Rates" table — groups of billable tool features with a
// merged left cell (rowSpan) for multi-variant products like PDF Crop.
export default function CoinsUsageTable({ data }) {
  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="inline-block text-2xl md:text-3xl font-bold text-foreground pb-2 border-b-4 border-foreground">
          Coins Usage Rates
        </h2>
      </div>

      <div className="flex rounded-2xl border border-divider overflow-hidden">
        <div className="w-1.5 bg-[#4a5fd9] shrink-0" aria-hidden="true" />
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#4a5fd9] to-[#f0763f]">
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Product Name</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Product Name</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Fix Fees</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Coin Cost (Per Use)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((group) => (
                <Fragment key={group.id}>
                  {group.variants.map((variant, vIdx) => (
                    <tr key={`${group.id}-${vIdx}`} className="border-t border-divider">
                      {vIdx === 0 && (
                        <td
                          rowSpan={group.variants.length}
                          className="px-5 py-3.5 text-sm text-foreground font-semibold align-top border-r border-divider"
                        >
                          {group.productName}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-sm text-muted">{variant.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted">{variant.fixFees}</td>
                      <td className="px-5 py-3.5 text-sm text-muted">{variant.coinCost}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
