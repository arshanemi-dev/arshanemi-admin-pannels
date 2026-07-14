// Dummy per-tool coin pricing shown on the "Coins Usage Rates" table
// (Settings → Plan). Replace with a real `tools_usage_rates` fetch once
// pricing moves server-side per plan/my-payment-management.md.
//
// productName matches the real embedded tool names used elsewhere in the
// admin panel (data/customers.js's toolsUse, data/walletHistory.js's
// descriptions) instead of the original mockup's generic/duplicated rows —
// same 5 tools, real feature names, one row per feature.
export const coinsUsageRates = [
  {
    id: 'pdf-crop',
    productName: 'PDF Crop',
    variants: [
      { name: 'Single Crop', fixFees: 0, coinCost: '0.01 Coins' },
      { name: 'Batch Crop With SKU', fixFees: 1, coinCost: '0.05 Coins' },
    ],
  },
  {
    id: 'background-remove',
    productName: 'Background Remove',
    variants: [
      { name: 'Single Image', fixFees: 0, coinCost: '0.01 Coins' },
      { name: 'Batch Remove (up to 50 images)', fixFees: 0, coinCost: '5.00 Coins' },
    ],
  },
  {
    id: 'listing',
    productName: 'Listing',
    variants: [
      { name: 'Auto Listing Generator', fixFees: 0, coinCost: '1.00 Coin' },
    ],
  },
  {
    id: 'profit-loss',
    productName: 'Profit-Loss',
    variants: [
      { name: 'Order P&L Report', fixFees: 199, coinCost: '1.00 Coin' },
    ],
  },
  {
    id: 'link-generator',
    productName: 'Link Generator',
    variants: [
      { name: 'Image Link (Single)', fixFees: 0, coinCost: '0.01 Coins' },
      { name: 'Bulk Export', fixFees: 0, coinCost: '5.00 Coins' },
    ],
  },
]
