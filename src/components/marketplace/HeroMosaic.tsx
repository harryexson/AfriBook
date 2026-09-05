import Link from 'next/link'
import { ArrowUpRight, Search, MapPin, Sparkles } from 'lucide-react'
import type { CountryConfig } from '@/lib/localization/countries'

interface HeroMosaicProps {
  country: CountryConfig
  code: string
  /** Pre-formatted catalogue total (e.g. "48K+"), not the page's slice. */
  businessCount: string
}

/**
 * Asymmetric photo mosaic hero.
 *
 * Adapted from the Sarwisi workforce-marketplace reference, whose hero is a
 * bento of photo tiles — each with a floating category chip and a corner
 * affordance — rather than the usual "headline left, illustration right".
 * The headline lives *inside* the largest tile, which is the move that makes
 * the layout memorable; collapsing it back into a text column would lose the
 * whole thing.
 *
 * One tile is deliberately not a photo: the ink panel breaks the rhythm and
 * carries the supply-side call to action. Amber stays reserved for the primary
 * CTA so it keeps meaning something.
 */

const PHOTO = 'https://images.unsplash.com/photo-'
const img = (id: string, w: number, h: number) =>
  `${PHOTO}${id}?w=${w * 2}&h=${h * 2}&q=80&auto=format&fit=crop`

export default function HeroMosaic({ country, code, businessCount }: HeroMosaicProps) {
  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        {/* Eyebrow + segmented search, mirroring the reference's utility row */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {country.flag} {country.name}
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-text-primary text-balance sm:text-5xl">
              Everything your city does, bookable in one place.
            </h1>
          </div>

          <form
            action={`/${code}/search`}
            className="flex w-full items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-sm lg:w-auto"
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 px-3 lg:w-56">
              <MapPin className="h-4 w-4 shrink-0 text-text-tertiary" />
              <input
                name="near"
                placeholder={`Where in ${country.name}?`}
                className="w-full min-w-0 bg-transparent py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </label>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <label className="hidden min-w-0 flex-1 items-center gap-2 px-3 sm:flex lg:w-56">
              <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
              <input
                name="q"
                placeholder="Service or business"
                className="w-full min-w-0 bg-transparent py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-400"
            >
              Search
            </button>
          </form>
        </div>

        {/* Mosaic */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {/* Lead tile — headline lives here */}
          <Link
            href={`/${code}/search`}
            className="group relative col-span-1 row-span-1 overflow-hidden rounded-3xl sm:col-span-2 lg:row-span-2 min-h-[260px] lg:min-h-[420px]"
          >
            <img
              src={img('1521737604893-d14cc237f11d', 800, 840)}
              alt="Local professionals at work"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
            <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
              {businessCount} vetted businesses
            </span>
            <span className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white text-text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-2xl font-bold leading-tight text-white text-balance sm:text-3xl">
                Find a trusted pro in {country.name}
              </p>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Book instantly, pay in {country.currency.code}, and track everything in one app.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950">
                Browse services
              </span>
            </div>
          </Link>

          <MosaicTile
            href={`/${code}/search?category=${encodeURIComponent('Home Services')}`}
            photo={img('1581578731548-c64695cc6952', 520, 260)}
            alt="Home cleaning and repairs"
            chip="Home services"
          />

          <MosaicTile
            href="/rides/book"
            photo={img('1449965408869-eaa3f722e40d', 520, 260)}
            alt="Driver on the road"
            chip="Rides"
          />

          {/* Ink tile: breaks the photo rhythm, carries the supply-side CTA */}
          <Link
            href="/sell"
            className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl bg-dark-300 p-6"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-amber-500 group-hover:text-amber-950">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight text-white text-balance">
                Earn on your own schedule
              </p>
              <p className="mt-1.5 text-sm text-white/60">
                List your business or drive with AfriBook.
              </p>
            </div>
          </Link>

          <MosaicTile
            href="/stays"
            photo={img('1566073771259-6a8506099945', 520, 260)}
            alt="Hotel stay"
            chip="Stays"
          />
        </div>
      </div>
    </section>
  )
}

function MosaicTile({
  href,
  photo,
  alt,
  chip,
}: {
  href: string
  photo: string
  alt: string
  chip: string
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[180px] overflow-hidden rounded-3xl"
    >
      <img
        src={photo}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
        {chip}
      </span>
      <span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}
