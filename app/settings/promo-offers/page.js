'use client'
import { PageHeader } from '@/components/admin/PageHeader'
import { usePromoOffer, PromoOfferForm } from '@/components/admin/promo'

export default function PromoOffersPage() {
  const { offer, updateOffer, loaded } = usePromoOffer()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Promo Offers" description="Manage the discount badge and referral code shown on the Plan page" />
      {loaded ? <PromoOfferForm offer={offer} updateOffer={updateOffer} /> : <div className="text-subtle text-sm">Loading…</div>}
    </div>
  )
}
