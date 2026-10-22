import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { COUNTRIES } from '@/lib/localization/countries'
import MarketplaceHome from '@/components/marketplace/MarketplaceHome'

type Props = { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  const market = COUNTRIES[country.toUpperCase()]
  if (!market) return {}
  return {
    title: `${market.name} — Your city, all in one place`,
    description: `Discover rides, meals, stays, services and local finds in ${market.name} with AfriBook.`,
  }
}

export default async function CountryHomePage({ params }: Props) {
  const { country } = await params
  if (!COUNTRIES[country.toUpperCase()]) notFound()
  return <MarketplaceHome />
}
