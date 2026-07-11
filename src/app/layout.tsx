import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AfriBook — Africa\'s Global Marketplace',
    template: '%s | AfriBook',
  },
  description:
    'Book services, order products, request rides, and get deliveries across 16+ countries. Africa\'s global marketplace.',
  keywords: [
    'AfriBook', 'marketplace', 'Africa', 'services', 'booking',
    'food delivery', 'rides', 'ecommerce', 'M-Pesa', 'Paystack',
  ],
  openGraph: {
    title: 'AfriBook — Africa\'s Global Marketplace',
    description:
      'Book services, order products, request rides, and get deliveries across 16+ countries.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AfriBook',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriBook — Africa\'s Global Marketplace',
    description:
      'Book services, order products, request rides, and get deliveries across 16+ countries.',
  },
  robots: { index: true, follow: true },
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
      className={`${inter.variable} ${poppins.variable} h-full`}
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
