import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Space_Grotesk, Manrope, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import ClientProviders from '@/components/providers/ClientProviders'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
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
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0C12' },
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
      className={`${spaceGrotesk.variable} ${manrope.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <Script
          id="theme-preload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('afribook-ui');
                  if (theme) {
                    var parsed = JSON.parse(theme);
                    if (parsed.state.theme === 'dark' ||
                        (parsed.state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ClientProviders>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClientProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
