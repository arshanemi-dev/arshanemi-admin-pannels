// Dummy customer rows for the "Customer Dashboard" table (Settings → Customer Dashboard).
// status cycles through the three states shown in the mockup; toolsUse
// reflects the real embedded tool apps from data/tools.js. firstLoginDate is
// the raw ISO value the shared DataTable's date-range filter reads;
// firstLogin stays the short display string shown in the column.
//
// userName matches data/walletBalances.js's names for the same userId, so
// the dummy dataset reads as one consistent person across pages. lastLogin
// and exp are computed from firstLoginDate (short M/D/YY, matching the
// Report drill-down mockup's date style) instead of hand-typed, so adding a
// row never requires picking two more plausible-looking dates by hand.
function shortDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`
}

function daysAfter(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return shortDate(d)
}

const rows = [
  { userId: '#100231', userName: 'Rehan Shaikh', email: 'rehan.shaikh@gmail.com', mobile: '9123456780', status: 'Paid', toolsUse: 'PDF Crop', firstLogin: '12 Jun', firstLoginDate: '2026-06-12', balance: 1240 },
  { userId: '#100232', userName: 'Priya Mehta', email: 'priya.mehta@gmail.com', mobile: '9876543210', status: 'Login', toolsUse: 'Background Remove', firstLogin: '18 Jun', firstLoginDate: '2026-06-18', balance: 320 },
  { userId: '#100233', userName: 'Arjun Verma', email: 'arjun.verma@gmail.com', mobile: '9000011122', status: 'Without Login', toolsUse: 'Listing', firstLogin: '22 Jun', firstLoginDate: '2026-06-22', balance: 0 },
  { userId: '#100234', userName: 'Neha Kapoor', email: 'neha.kapoor@gmail.com', mobile: '9988776655', status: 'Paid', toolsUse: 'Profit-Loss', firstLogin: '25 Jun', firstLoginDate: '2026-06-25', balance: 875 },
  { userId: '#100235', userName: 'Sanket Joshi', email: 'sanket.joshi@gmail.com', mobile: '8564368952', status: 'Paid', toolsUse: 'Link Generator', firstLogin: '30 Jun', firstLoginDate: '2026-06-30', balance: 4560 },
  { userId: '#100236', userName: 'Divya Rao', email: 'divya.rao@gmail.com', mobile: '8765432109', status: 'Login', toolsUse: 'PDF Crop', firstLogin: '4 Jul', firstLoginDate: '2026-07-04', balance: 210 },
  { userId: '#100237', userName: 'Karan Singh', email: 'karan.singh@gmail.com', mobile: '9345678123', status: 'Without Login', toolsUse: 'Background Remove', firstLogin: '9 Jul', firstLoginDate: '2026-07-09', balance: 0 },
  { userId: '#100238', userName: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', mobile: '9112233445', status: 'Paid', toolsUse: 'Listing', firstLogin: '15 Jul', firstLoginDate: '2026-07-15', balance: 1980 },
  { userId: '#100239', userName: 'Vikram Nair', email: 'vikram.nair@gmail.com', mobile: '9001122334', status: 'Login', toolsUse: 'Profit-Loss', firstLogin: '21 Jul', firstLoginDate: '2026-07-21', balance: 640 },
  { userId: '#100240', userName: 'Isha Patel', email: 'isha.patel@gmail.com', mobile: '9812345670', status: 'Paid', toolsUse: 'Link Generator', firstLogin: '27 Jul', firstLoginDate: '2026-07-27', balance: 3025 },
]

export const customers = rows.map((row) => ({
  ...row,
  lastLogin: daysAfter(row.firstLoginDate, 14),
  exp: daysAfter(row.firstLoginDate, 365),
}))
