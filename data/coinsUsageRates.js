// Dummy per-tool coin pricing shown on the "Coins Usage Rates" table
// (Settings → Plan). Replace with a real `tools_usage_rates` fetch once
// pricing moves server-side per plan/my-payment-management.md.
export const coinsUsageRates = [
  {
    id: 'image-link-1',
    productName: 'Image Link',
    variants: [
      { name: '1 Link', fixFees: 0, coinCost: '0.01 Coins' },
    ],
  },
  {
    id: 'pdf-crop',
    productName: 'PDF Crop',
    variants: [
      { name: 'Only Crop', fixFees: 0, coinCost: '0.01 Coins' },
      { name: 'Crop With SKU', fixFees: 1, coinCost: '0.05 Coins' },
    ],
  },
  {
    id: 'order-pl',
    productName: 'Order P&L',
    variants: [
      { name: 'ABC', fixFees: 199, coinCost: '1.00 Coin' },
    ],
  },
  {
    id: 'image-link-2',
    productName: 'Image Link',
    variants: [
      { name: 'ABC', fixFees: 0, coinCost: '1.00 Coin' },
    ],
  },
  {
    id: 'image-link-3',
    productName: 'Image Link',
    variants: [
      { name: 'ABC', fixFees: 0, coinCost: '1.00 Coin' },
    ],
  },
]
