'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Package, Star } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  countryCode?: string
  onAddToCart?: (product: Product) => void
  index?: number
}

export default function ProductCard({ product, countryCode = 'NG', onAddToCart, index = 0 }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [added, setAdded] = useState(false)

  const inStock = product.stock > 0 && product.isAvailable
  const lowStock = product.stock > 0 && product.stock <= 5
  const currency = product.currencyCode ?? countryCode

  const handleAdd = () => {
    onAddToCart?.(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
      className="group bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/30 transition-all duration-300"
    >
      <div className="relative h-48 bg-surface-secondary flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Package className="w-12 h-12 text-text-tertiary" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted) }}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-lg backdrop-blur-sm transition-all',
            isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-text-secondary hover:text-red-500'
          )}
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
        </button>
        {lowStock && inStock && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-red-500/90 text-white text-xs font-semibold backdrop-blur-sm">
            Only {product.stock} left
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-white/90 rounded-lg text-sm font-bold text-text-primary">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-text-primary truncate group-hover:text-amber-500 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-xs text-text-secondary line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-lg font-bold text-text-primary">
            {formatCurrency(product.price, currency)}
          </span>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={cn(
              'p-2 rounded-lg transition-all',
              added
                ? 'bg-emerald-500 text-white'
                : inStock
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
            )}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
