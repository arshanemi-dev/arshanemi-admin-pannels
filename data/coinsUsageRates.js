// Dummy per-tool token pricing shown on the "Coins Usage Rates" table
// (Settings → Plan). Replace with a real `tools_usage_rates` fetch once
// pricing moves server-side per plan/my-payment-management.md.
export const coinsUsageRates = [
  {
    id: 'image-link-1',
    productName: 'Image Link',
    variants: [
      { name: '1 Link', fixFees: 0, tokenCost: '0.01 Tokens' },
    ],
  },
  {
    id: 'pdf-crop',
    productName: 'PDF Crop',
    variants: [
      { name: 'Only Crop', fixFees: 0, tokenCost: '0.01 Tokens' },
      { name: 'Crop With SKU', fixFees: 1, tokenCost: '0.05 Tokens' },
    ],
  },
  {
    id: 'order-pl',
    productName: 'Order P&L',
    variants: [
      { name: 'ABC', fixFees: 199, tokenCost: '1.00 Token' },
    ],
  },
  {
    id: 'image-link-2',
    productName: 'Image Link',
    variants: [
      { name: 'ABC', fixFees: 0, tokenCost: '1.00 Token' },
    ],
  },
  {
    id: 'image-link-3',
    productName: 'Image Link',
    variants: [
      { name: 'ABC', fixFees: 0, tokenCost: '1.00 Token' },
    ],
  },
]
