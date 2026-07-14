// Dummy transaction history for the signed-in user's own Settings → Profile
// → Wallet tab. Kept separate from data/walletHistory.js (the admin's
// cross-user ledger) since it isn't tied to any real user id.
export const myWalletHistory = [
  { id: 'my_txn_1', type: 'topup', description: '₹1000 Recharge Plan', amount: 1100, status: 'success', date: '2026-06-30' },
  { id: 'my_txn_2', type: 'usage', description: 'PDF Crop — Crop With SKU', amount: -5, status: 'success', date: '2026-07-02' },
  { id: 'my_txn_3', type: 'usage', description: 'Image Link — 1 Link', amount: -1, status: 'success', date: '2026-07-03' },
  { id: 'my_txn_4', type: 'usage', description: 'Order P&L — ABC', amount: -199, status: 'success', date: '2026-07-06' },
  { id: 'my_txn_5', type: 'topup', description: '₹500 Recharge Plan', amount: 500, status: 'pending', date: '2026-07-10' },
  { id: 'my_txn_6', type: 'usage', description: 'Background Remove — Batch', amount: -120, status: 'success', date: '2026-07-12' },
  { id: 'my_txn_7', type: 'topup', description: '₹5000 Recharge Plan', amount: 6000, status: 'failed', date: '2026-07-14' },
  { id: 'my_txn_8', type: 'usage', description: 'Link Generator — Bulk Export', amount: -60, status: 'success', date: '2026-07-14' },
]
