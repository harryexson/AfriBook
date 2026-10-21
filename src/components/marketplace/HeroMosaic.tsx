import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { CountryConfig } from '@/lib/localization/countries'
import { photoFor } from '@/lib/media/images'
import { getStayCities } from '@/lib/stays/stays-data'
import HeroSearch from './HeroSearch'

interface HeroMosaicProps {
  country: CountryConfig
  code: string
  /** Pre-formatted catalogue total (e.g. "48K+"), not the page's slice. */
  businessCount: string
}

/**
 * Homepage hero, following docs/design-references/afribook-reference.webp:
 * headline and a tabbed search card on the left, a three-photo collage
 * (ride, food, stay) on the right, set on the warm cream canvas rather than
 * a dark gradient. Photos are bundled (public/people, public/food) or come
 * from the same verified stock pool the rest of the app uses.
 */
export default function HeroMosaic({ country, code, businessCount }: HeroMosaicProps) {
  const city = getStayCities(code)[0] ?? country.name
  return (
    <section className="relative overflow-hidden bg-surface-secondary">
      {/* pt clears the fixed 80px site header. */}
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 lg:px-8 lg:pb-20 lg:pt-32">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
            The African multi-service marketplace · {country.flag} {country.name}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight text-text-primary text-balance sm:text-6xl">
            Your city, all in one place.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg">
            Rides, meals, stays, services and local finds. Everything you need,
            right at your fingertips — priced in {country.currency.code}.
          </p>

          <div className="mt-8 max-w-xl">
            <HeroSearch code={code} city={city} />
          </div>

          <p className="mt-5 text-sm text-text-tertiary">
            {businessCount} vetted businesses in {country.name}
          </p>
        </div>

        {/* Collage: one tall lead photo, two stacked on the right. */}
        <div className="relative grid h-[340px] grid-cols-5 grid-rows-2 gap-3 sm:h-[460px] lg:h-[520px]">
          <CollageTile
            href="/rides/book"
            src="/people/rides.jpg"
            alt="Driver smiling from behind the wheel"
            label="Rides"
            className="col-span-3 row-span-2"
          />
          <CollageTile
            href="/food"
            src="/food/local.jpg"
            alt="Jollof rice and grilled chicken"
            label="Food"
            className="col-span-2"
          />
          <CollageTile
            href="/stays"
            src={photoFor('hero-stay', 'stays', null, { width: 420, ratio: 1 })}
            alt="Boutique hotel room"
            label="Stays"
            className="col-span-2"
          />

          <Link
            href={`/${code}/search`}
            className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-2xl bg-surface/95 px-4 py-3 text-xs font-medium text-text-primary shadow-md backdrop-blur sm:flex"
          >
            <span className="leading-tight">
              More than a marketplace.
              <br />A better way to live.
            </span>
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CollageTile({
  href,
  src,
  alt,
  label,
  className,
}: {
  href: string
  src: string
  alt: string
  label: string
  className?: string
}) {
  return (
    <Link href={href} className={`group relative overflow-hidden rounded-[1.75rem] ${className ?? ''}`}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1 text-xs font-semibold text-text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </Link>
  )
}
