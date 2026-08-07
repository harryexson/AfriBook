import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LegalAgreementRenderer from '@/components/legal/LegalAgreementRenderer'
import { getAgreementBySlug, LEGAL_DOCUMENTS } from '@/lib/legal-agreements'

interface LegalAgreementPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({
  params,
}: LegalAgreementPageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = getAgreementBySlug(slug)
  if (!doc) return { title: 'Not Found' }
  return {
    title: doc.title,
    description: doc.subtitle,
  }
}

export default async function LegalAgreementPage({ params }: LegalAgreementPageProps) {
  const { slug } = await params
  const doc = getAgreementBySlug(slug)

  if (!doc) {
    notFound()
  }

  return (
    <LegalAgreementRenderer doc={doc} signable={doc.slug === 'host-agreement'} />
  )
}
