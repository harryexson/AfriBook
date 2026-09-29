'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatMoneySymbol } from '@/lib/money'
import { imageSourceFor } from '@/lib/media/images'
import type { RestaurantSummary } from '@/app/food/page'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function FeaturedRestaurants({ restaurants }: { restaurants: RestaurantSummary[] }) {
  const featured = [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 3)

  if (featured.length === 0) return null

  return (
    <section className="py-16 sm:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <p className="text-sm uppercase tracking-[0.28em] text-amber-500">
              Popular picks
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Top-rated restaurants for your next order
            </h2>
          </motion.div>

          <Link
            href="/food"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-500/20"
          >
            Explore restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {featured.map((restaurant) => {
            const photo = imageSourceFor(restaurant.id, restaurant.cuisineType, null, {
              width: 640,
              ratio: 0.56,
            })
            const deliveryFeeText =
              restaurant.deliveryFee > 0
                ? formatMoneySymbol(restaurant.deliveryFee, restaurant.currency)
                : 'Free'

            return (
              <motion.div key={restaurant.id} variants={fadeIn}>
                <Link href={`/food/${restaurant.id}`} className="group block h-full">
                  <Card padding="none" interactive className="overflow-hidden">
                    <div className="relative h-52 overflow-hidden bg-surface-secondary">
                      <img
                        src={photo}
                        alt={restaurant.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                        {deliveryFeeText} delivery
                      </div>
                      <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                        {restaurant.preparationTime}-{restaurant.preparationTime + 10} min
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-text-primary group-hover:text-amber-600 transition-colors">
                            {restaurant.name}
                          </h3>
                          <p className="mt-1 text-sm text-text-secondary">
                            {restaurant.cuisineType}
                          </p>
                        </div>
                        <Badge variant="amber" icon={<Star className="h-3.5 w-3.5" />}>
                          {restaurant.rating.toFixed(1)}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                          <p className="font-semibold text-text-primary">Delivery fee</p>
                          <p>{deliveryFeeText}</p>
                        </div>
                        <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                          <p className="font-semibold text-text-primary">Location</p>
                          <p className="truncate">{restaurant.address}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="amber">Featured</Badge>
                        <Badge variant="neutral">{restaurant.cuisineType}</Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
