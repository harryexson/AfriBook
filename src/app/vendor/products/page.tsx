'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Search, Grid3X3, List, Upload, Download, AlertTriangle,
  Edit3, Trash2, Package,
} from 'lucide-react'
import ProductForm from '@/components/vendor/ProductForm'
import ImportWizard, { type ImportItem } from '@/components/vendor/ImportWizard'
import type { Product } from '@/types'

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', businessId: 'b1', name: 'Shea Butter Hair Oil', description: 'Organic cold-pressed shea butter for hair care', price: 3500, currencyCode: 'XAF', stock: 45, images: [], variants: [], category: 'Beauty', tags: ['organic', 'hair', 'natural'], isAvailable: true, requiresShipping: true, createdAt: '', updatedAt: '' },
  { id: 'p2', businessId: 'b1', name: 'African Print Headwrap', description: 'Handmade Ankara print headwrap', price: 2500, currencyCode: 'XAF', stock: 3, images: [], variants: [], category: 'Fashion', tags: ['ankara', 'handmade', 'fashion'], isAvailable: true, requiresShipping: true, createdAt: '', updatedAt: '' },
  { id: 'p3', businessId: 'b1', name: 'Coconut Hair Mask', description: 'Deep conditioning coconut treatment', price: 5000, currencyCode: 'XAF', stock: 0, images: [], variants: [], category: 'Beauty', tags: ['coconut', 'treatment'], isAvailable: false, requiresShipping: true, createdAt: '', updatedAt: '' },
]

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function ProductsPage() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showImport, setShowImport] = useState(false)

  const handleImport = async (items: ImportItem[]) => {
    console.log('Importing products:', items)
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5)

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Products</h1>
          <p className="text-sm text-text-secondary mt-1">{products.length} products total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setEditProduct(null); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </motion.div>

      {lowStock.length > 0 && (
        <motion.div variants={ITEM} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-amber-700 dark:text-amber-400">{lowStock.length} products</span> are running low on stock.
          </p>
        </motion.div>
      )}

      {/* Toolbar */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
          />
        </div>
        <div className="flex bg-surface-secondary rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Products grid/list */}
      {filtered.length === 0 ? (
        <motion.div variants={ITEM} className="text-center py-16 rounded-2xl bg-surface border border-border">
          <Package className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No products found</p>
          <p className="text-sm text-text-tertiary mt-1">Add your first product to get started.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={ITEM}
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
          )}
        >
          {filtered.map((product, i) =>
            viewMode === 'grid' ? (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl bg-surface border border-border overflow-hidden hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300 group"
              >
                <div className="aspect-square bg-surface-secondary flex items-center justify-center relative">
                  <Package className="w-10 h-10 text-text-tertiary" />
                  {product.stock === 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Out of Stock
                    </span>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Low Stock
                    </span>
                  )}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => { setEditProduct(product); setShowForm(true) }}
                      className="p-1.5 rounded-lg bg-surface shadow-sm hover:bg-surface-secondary transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-surface shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-text-primary truncate">{product.name}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{product.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(product.price, product.currencyCode)}</p>
                    <span className="text-xs text-text-tertiary">Stock: {product.stock}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{product.name}</p>
                  <p className="text-xs text-text-tertiary">{product.category} · Stock: {product.stock}</p>
                </div>
                <p className="text-sm font-bold text-amber-600 shrink-0">{formatCurrency(product.price, product.currencyCode)}</p>
                <button
                  onClick={() => { setEditProduct(product); setShowForm(true) }}
                  className="p-2 rounded-lg hover:bg-surface-secondary transition-colors shrink-0"
                >
                  <Edit3 className="w-4 h-4 text-text-secondary" />
                </button>
              </motion.div>
            )
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editProduct ?? undefined}
            onSubmit={() => { setShowForm(false); setEditProduct(null) }}
            onClose={() => { setShowForm(false); setEditProduct(null) }}
          />
        )}
      </AnimatePresence>

      <ImportWizard
        type="product"
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </motion.div>
  )
}
