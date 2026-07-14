// Dummy coin recharge plans shown on the "Plan" table (Settings → Plan).
// `selectable: false` marks the free-tier row, which has nothing to add
// coins for. Replace with a real coin-packages table (`credit_packages` in
// plan/my-payment-management.md) once built.
export const coinPlans = [
  { id: 'no-signup', amount: 'No sign up', coin: 'free tools Only', experience: 'Unlimited', selectable: false },
  { id: 'signup', amount: 'Sign Up', coin: '500', experience: '30 Days', selectable: true },
  { id: 'plan-500', amount: '₹500', coin: '500', experience: '30 Days', selectable: true },
  { id: 'plan-1000', amount: '₹1000', coin: '1100', experience: '60 Days', selectable: true },
  { id: 'plan-5000', amount: '₹5000', coin: '6000', experience: '1 Year', selectable: true },
  { id: 'plan-20000', amount: '₹20000', coin: '28000', experience: '1 Year', selectable: true },
  { id: 'plan-50000', amount: '₹50000', coin: '80000', experience: '1 Year', selectable: true },
]

export const coinPlansNote = '*Offers are subject to change without notice. GST Tax is included and applicable as per Govt Norms.'
