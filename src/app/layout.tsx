import type { Metadata, Viewport } from 'next'
import { DM_Sans, Manrope } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import CountryNotice from '@/components/shared/CountryNotice'
import Footer from '@/components/shared/Footer'
import ClientProviders from '@/components/providers/ClientProviders'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'
import { InlineScript } from '@/components/shared/InlineScript'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'AfriBook — Africa\'s Global Marketplace',
    template: '%s | AfriBook',
  },
  description:
    'Book services, order products, request rides, and get deliveries across 196 countries. Africa\'s global marketplace.',
  keywords: [
    'AfriBook', 'marketplace', 'Africa', 'services', 'booking',
    'food delivery', 'rides', 'ecommerce', 'M-Pesa', 'Paystack',
  ],
  openGraph: {
    title: 'AfriBook — Africa\'s Global Marketplace',
    description:
      'Book services, order products, request rides, and get deliveries across 196 countries.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AfriBook',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriBook — Africa\'s Global Marketplace',
    description:
      'Book services, order products, request rides, and get deliveries across 196 countries.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AfriBook',
  },
  applicationName: 'AfriBook',
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf4ed' },
    { media: '(prefers-color-scheme: dark)', color: '#1a0f08' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${manrope.variable} h-full`}
    >
      <head>
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem('afribook-ui');if(t){var p=JSON.parse(t);if(p.state.theme==='dark'||(p.state.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}}catch(e){}})()`}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ClientProviders>
          <Header />
          <CountryNotice />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClientProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
