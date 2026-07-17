import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfriBook — Africa\'s Global Marketplace',
    short_name: 'AfriBook',
    description:
      'Book services, order products, request rides, and get deliveries across the globe. One marketplace, every country.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    categories: ['shopping', 'business', 'travel', 'food', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcuts: [
      {
        name: 'Find Services',
        short_name: 'Services',
        url: '/services',
        description: 'Browse and book local services',
      },
      {
        name: 'Order Food',
        short_name: 'Food',
        url: '/food',
        description: 'Order food from nearby vendors',
      },
      {
        name: 'Book a Ride',
        short_name: 'Rides',
        url: '/rides',
        description: 'Request a ride anywhere',
      },
    ],
  }
}
