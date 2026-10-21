import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface PhotoLink {
  label: string
  href: string
  src: string
  alt: string
  /** Short supporting line (discovery cards only). */
  tagline?: string
  /** Pre-formatted "from" price, only when it comes from real catalogue data. */
  fromPrice?: string
}

/** The reference's row of six photo shortcuts directly under the hero. */
export function CategoryPhotoRail({ items }: { items: PhotoLink[] }) {
  return (
    <section className="bg-surface-secondary pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="group w-40 shrink-0 snap-start sm:w-auto">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface-tertiary">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary group-hover:text-amber-700">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** "Discover near you — Good things, closer to home." */
export function DiscoverGrid({ items, viewAllHref }: { items: PhotoLink[]; viewAllHref: string }) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">Discover near you</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Good things, closer to home
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            Explore all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-tertiary">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <div className="p-3.5">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                {item.tagline && <p className="mt-0.5 text-xs text-text-tertiary">{item.tagline}</p>}
                {item.fromPrice && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    From <span className="font-mono tabular-nums">{item.fromPrice}</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

interface BannerProps {
  eyebrow: string
  title: string
  body: string
  cta: string
  href: string
  src: string
  alt: string
}

/** Events + vendor recruitment pair at the foot of the reference homepage. */
export function TwinBanners({ events, vendor }: { events: BannerProps; vendor: BannerProps }) {
  return (
    <section className="pb-20">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Banner {...events} tone="dark" />
        <Banner {...vendor} tone="light" />
      </div>
    </section>
  )
}

function Banner({ eyebrow, title, body, cta, href, src, alt, tone }: BannerProps & { tone: 'dark' | 'light' }) {
  const dark = tone === 'dark'
  return (
    <div
      className={`grid overflow-hidden rounded-[1.75rem] border sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] ${
        dark ? 'border-dark-300 bg-dark-400' : 'border-border bg-surface-secondary'
      }`}
    >
      <div className="relative min-h-[180px]">
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-7">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-amber-300' : 'text-text-tertiary'}`}>
          {eyebrow}
        </p>
        <h3 className={`mt-2 text-xl font-bold leading-snug tracking-tight ${dark ? 'text-white' : 'text-text-primary'}`}>
          {title}
        </h3>
        <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-white/70' : 'text-text-secondary'}`}>{body}</p>
        <Link
          href={href}
          className={`mt-5 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
            dark ? 'bg-white text-text-primary hover:bg-amber-50' : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
