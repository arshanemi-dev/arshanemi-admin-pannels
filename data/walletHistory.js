// Dummy cross-user transaction ledger for the admin Wallet page's filterable
// history table. Two separate numbers per row, deliberately not conflated:
// `priceAmount` is the real ₹ a customer paid (only set on `topup` rows —
// spending coins on a tool doesn't move any money); `coins` is the coin
// effect (positive = added on top-up, negative = spent on usage).
export const WALLET_TXN_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'topup', label: 'Top-up' },
  { id: 'usage', label: 'Usage' },
]

export const WALLET_TXN_STATUSES = [
  { id: 'all', label: 'All Status' },
  { id: 'success', label: 'Success' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
]

export const walletHistory = [
  { id: 'txn_1001', userId: '#100231', userName: 'Rehan Shaikh', type: 'topup', description: '₹1000 Recharge Plan', priceAmount: 1000, coins: 1100, status: 'success', date: '2026-06-12' },
  { id: 'txn_1002', userId: '#100231', userName: 'Rehan Shaikh', type: 'usage', description: 'PDF Crop — Crop With SKU', priceAmount: null, coins: -5, status: 'success', date: '2026-06-14' },
  { id: 'txn_1003', userId: '#100231', userName: 'Rehan Shaikh', type: 'usage', description: 'Image Link — 1 Link', priceAmount: null, coins: -1, status: 'success', date: '2026-06-15' },
  { id: 'txn_1004', userId: '#100232', userName: 'Priya Mehta', type: 'topup', description: '₹500 Recharge Plan', priceAmount: 500, coins: 500, status: 'success', date: '2026-06-18' },
  { id: 'txn_1005', userId: '#100232', userName: 'Priya Mehta', type: 'usage', description: 'Background Remove — Batch', priceAmount: null, coins: -120, status: 'success', date: '2026-06-19' },
  { id: 'txn_1006', userId: '#100234', userName: 'Neha Kapoor', type: 'topup', description: '₹1000 Recharge Plan', priceAmount: 1000, coins: 1100, status: 'success', date: '2026-06-25' },
  { id: 'txn_1007', userId: '#100234', userName: 'Neha Kapoor', type: 'usage', description: 'Order P&L — ABC', priceAmount: null, coins: -199, status: 'success', date: '2026-06-27' },
  { id: 'txn_1008', userId: '#100235', userName: 'Sanket Joshi', type: 'topup', description: '₹5000 Recharge Plan', priceAmount: 5000, coins: 6000, status: 'success', date: '2026-06-30' },
  { id: 'txn_1009', userId: '#100235', userName: 'Sanket Joshi', type: 'usage', description: 'Link Generator — Bulk Export', priceAmount: null, coins: -456, status: 'success', date: '2026-07-02' },
  { id: 'txn_1010', userId: '#100235', userName: 'Sanket Joshi', type: 'topup', description: '₹20000 Recharge Plan', priceAmount: 20000, coins: 28000, status: 'pending', date: '2026-07-05' },
  { id: 'txn_1011', userId: '#100236', userName: 'Divya Rao', type: 'usage', description: 'PDF Crop — Only Crop', priceAmount: null, coins: -30, status: 'success', date: '2026-07-04' },
  { id: 'txn_1012', userId: '#100236', userName: 'Divya Rao', type: 'topup', description: '₹500 Recharge Plan', priceAmount: 500, coins: 500, status: 'failed', date: '2026-07-06' },
  { id: 'txn_1013', userId: '#100238', userName: 'Ananya Iyer', type: 'topup', description: '₹5000 Recharge Plan', priceAmount: 5000, coins: 6000, status: 'success', date: '2026-07-15' },
  { id: 'txn_1014', userId: '#100238', userName: 'Ananya Iyer', type: 'usage', description: 'Listing — Crop With SKU', priceAmount: null, coins: -1020, status: 'success', date: '2026-07-16' },
  { id: 'txn_1015', userId: '#100239', userName: 'Vikram Nair', type: 'topup', description: '₹1000 Recharge Plan', priceAmount: 1000, coins: 1100, status: 'success', date: '2026-07-21' },
  { id: 'txn_1016', userId: '#100239', userName: 'Vikram Nair', type: 'usage', description: 'Profit-Loss — ABC', priceAmount: null, coins: -360, status: 'success', date: '2026-07-22' },
  { id: 'txn_1017', userId: '#100240', userName: 'Isha Patel', type: 'topup', description: '₹5000 Recharge Plan', priceAmount: 5000, coins: 6000, status: 'success', date: '2026-07-27' },
  { id: 'txn_1018', userId: '#100240', userName: 'Isha Patel', type: 'usage', description: 'Link Generator — Bulk Export', priceAmount: null, coins: -1975, status: 'success', date: '2026-07-28' },
]
