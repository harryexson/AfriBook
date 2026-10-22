import CounterTerminal from '@/components/vendor/CounterTerminal'
import { notFound } from 'next/navigation'
import { z } from 'zod'

export const metadata = { title: 'Order at your own pace', robots: { index: false, follow: false } }
export default async function KioskPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  if (!z.string().uuid().safeParse(businessId).success) notFound()
  return <CounterTerminal kiosk businessId={businessId} />
}
