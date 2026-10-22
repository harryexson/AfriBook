'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, MapPin, Package, Store, HeartHandshake, Car, UtensilsCrossed, BedDouble, Wrench, ShoppingBag, CalendarDays } from 'lucide-react'
import { useCountry } from '@/components/shared/CountryProvider'
import HeroSearch from './HeroSearch'
import EditorialMotion from './EditorialMotion'
import styles from './MarketplaceHome.module.css'

// Editorial photography describes categories, never live merchant inventory.
const photos = {
  rides: '/editorial/city-ride.webp', food: '/food/local.jpg',
  stays: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&auto=format&fit=crop&q=85',
  home: '/people/cleaning.jpg', beauty: '/people/spa.jpg',
  marketplace: '/people/tailoring.jpg', barber: '/people/barber.jpg',
  photography: '/people/photography.jpg', repair: '/people/automotive.jpg',
  events: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop&q=85',
  vendor: '/people/community.jpg',
}
const shortcuts = [
  { label: 'Rides', detail: 'A better way to get there', href: '/rides/book', photo: photos.rides, icon: Car },
  { label: 'Food delivery', detail: 'Your next favourite meal', href: '/food', photo: photos.food, icon: UtensilsCrossed },
  { label: 'Stays', detail: 'Somewhere to feel at home', href: '/stays', photo: photos.stays, icon: BedDouble },
  { label: 'Home services', detail: 'A little help goes a long way', href: '/marketplace/services?category=Home%20Services', photo: photos.home, icon: Wrench },
  { label: 'Beauty & wellness', detail: 'Make a little time for you', href: '/marketplace/services?category=Beauty%20%26%20Wellness', photo: photos.beauty, icon: HeartHandshake },
  { label: 'Local marketplace', detail: 'Find something with a story', href: '/marketplace/products', photo: photos.marketplace, icon: ShoppingBag },
]
const discoveries = [
  { label: 'Restaurants', detail: 'Local flavours. New favourites.', href: '/food', photo: '/food/grill.jpg', alt: 'Freshly grilled food with colourful sides' },
  { label: 'Hotels & stays', detail: 'Check in. Settle in.', href: '/stays', photo: photos.stays, alt: 'Warmly lit boutique hotel bedroom' },
  { label: 'Barber & salon', detail: 'Look good. Feel like you.', href: '/marketplace/services?category=Beauty%20%26%20Wellness', photo: photos.barber, alt: 'Barber carefully cutting a customer’s hair' },
  { label: 'Photography', detail: 'Keep the moments that matter.', href: '/marketplace/services?q=photography', photo: photos.photography, alt: 'Professional photographer working with a camera' },
  { label: 'Home & repairs', detail: 'Good people. Skilled hands.', href: '/marketplace/services?category=Home%20Services', photo: photos.repair, alt: 'Technician working on a vehicle' },
  { label: 'Fashion & local finds', detail: 'Something new. Something you.', href: '/marketplace/products', photo: photos.marketplace, alt: 'Local tailor working with fabric' },
]
const cities: Record<string, string> = { US: 'New York', GB: 'London', CA: 'Toronto', MW: 'Lilongwe', ZA: 'Johannesburg', NG: 'Lagos' }

export default function MarketplaceHome() {
  const { country, countryCode, city } = useCountry()
  const localCity = city || cities[countryCode] || country.name
  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-heading">
        <div className={styles.heroPhotos} aria-hidden="true"><img className={styles.heroRide} src={photos.rides} alt="" fetchPriority="high" /><div className={styles.heroStack}><img src={photos.food} alt="" /><img src={photos.stays} alt="" /></div></div>
        <EditorialMotion className={styles.heroInner}>
          <div className={styles.heroCopy}><p className={styles.eyebrow}>The African multi-service marketplace</p><h1 id="home-heading">Your city, all in<br />one place.</h1><p className={styles.intro}>Rides, meals, stays, services and local finds.<br />Everything you need, right at your fingertips.</p></div>
          <div className={styles.searchCard}><HeroSearch code={countryCode} city={localCity} /></div>
          <p className={styles.market}><MapPin size={13} /> Exploring {country.name} <span>·</span> {country.currency.code}</p>
        </EditorialMotion>
        <div className={styles.photoNote}>More than a marketplace.<br /><strong>A better way to live.</strong><ArrowUpRight size={16} /></div>
      </section>
      <section className={styles.shortcutSection} aria-label="Explore AfriBook"><div className={styles.shortcuts}>{shortcuts.map(({ label, detail, href, photo, icon: Icon }) => (<Link key={label} href={href} className={styles.shortcut}><div className={styles.shortcutPhoto}><img src={photo} alt="" loading="lazy" /><span><Icon size={17} /></span></div><h2>{label}</h2><p>{detail}</p></Link>))}</div></section>
      <section className={styles.discover} aria-labelledby="discover-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Discover near you</p><h2 id="discover-heading">Good things, closer to home.</h2></div><Link href={`/${countryCode}/search`}>Explore all <ArrowRight size={15} /></Link></div>
        <div className={styles.discoveryGrid}>{discoveries.map(item => (<Link key={item.label} href={item.href} className={styles.discoveryCard}><div className={styles.discoveryPhoto}><img src={item.photo} alt={item.alt} loading="lazy" /></div><div className={styles.discoveryBody}><h3>{item.label}</h3><p>{item.detail}</p><span>Explore <ArrowUpRight size={13} /></span></div></Link>))}</div>
        <p className={styles.availability}>Discover what’s available in your area. Prices and availability are shown by each business.</p>
      </section>
      <section className={styles.banners} aria-label="Events and local businesses">
        <article className={styles.banner}><img src={photos.events} alt="Concert lights over a crowd" loading="lazy" /><div><p className={styles.eyebrow}>Out in your city</p><h2>Music. Culture.<br />Community.</h2><p>Make room for a night to remember.<br />Discover events happening around you.</p><Link href="/events" className={styles.espressoButton}>Find your next event <ArrowRight size={14} /></Link></div></article>
        <article className={styles.banner}><img src={photos.vendor} alt="Local business and community" loading="lazy" /><div><p className={styles.eyebrow}>For local businesses</p><h2>Your talent. Your<br />customers. Your business.</h2><p>Bring your business to your community.<br />We’ll help you make the connection.</p><Link href="/onboarding/vendor" className={styles.orangeButton}>Become a vendor <ArrowRight size={14} /></Link></div></article>
      </section>
      <section className={styles.everyday} aria-label="More ways to use AfriBook">
        <Link href="/deliveries"><Package /><div><h2>A parcel. A person. A connection.</h2><p>Arrange a delivery across your city.</p></div><ArrowUpRight /></Link>
        <Link href="/sell"><Store /><div><h2>A new home for your old favourites.</h2><p>Sell what you no longer need, locally.</p></div><ArrowUpRight /></Link>
      </section>
      <section className={styles.businessStrip}>
        <div><p className={styles.eyebrow}>Built around your business</p><h2>Less admin.<br />More of what you love.</h2><p>Bookings, menus, orders and your business overview.<br />One place to keep your day moving.</p><Link href="/business">Explore AfriBook for business <ArrowRight size={16} /></Link></div>
        <div className={styles.businessLinks}>
          <Link href="/vendor"><Store /><span><strong>Your business overview</strong><small>Bookings, revenue and customer activity</small></span><ArrowUpRight /></Link>
          <Link href="/vendor/restaurant/orders"><UtensilsCrossed /><span><strong>Your restaurant, connected</strong><small>Menu management and live order operations</small></span><ArrowUpRight /></Link>
          <Link href="/vendor/restaurant/kitchen"><Wrench /><span><strong>A clearer view of your kitchen</strong><small>Preparation queues and ready-for-pickup updates</small></span><ArrowUpRight /></Link>
          <Link href="/vendor/bookings"><CalendarDays /><span><strong>Your day, beautifully organised</strong><small>Appointments for service professionals</small></span><ArrowUpRight /></Link>
        </div>
      </section>
      <section className={styles.trust}><HeartHandshake size={24} /><div><h2>A little more peace of mind.</h2><p>Know your provider, check the details, and find support when you need it.</p></div><Link href="/safety">Explore safety <ArrowRight size={15} /></Link></section>
    </div>
  )
}
