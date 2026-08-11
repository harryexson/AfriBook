'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, ScanLine, Loader2, Check, X, Pencil,
  RotateCcw, Sparkles, EyeOff, Trash2, Image as ImageIcon,
} from 'lucide-react'

export interface ImportItem {
  name: string
  description: string
  price: number
  category?: string
  image?: string
  preparationTime?: number
  ingredients?: string[]
  allergens?: string[]
  dietaryTags?: string[]
}

interface MenuPhotoScannerProps {
  onImport: (items: ImportItem[]) => void
  onCancel: () => void
}

const CATEGORIES = ['Appetizers', 'Mains', 'Desserts', 'Drinks', 'Sides', 'Other']

const MOCK_MENU_SETS: ImportItem[][] = [
  [
    { name: 'Jollof Rice & Chicken', description: 'Classic Nigerian jollof rice with grilled chicken', price: 4500, category: 'Mains', preparationTime: 25, ingredients: ['rice', 'tomato paste', 'chicken', 'scotch bonnet', 'onions', 'mixed spices'], allergens: [], dietaryTags: ['Halal'] },
    { name: 'Suya Skewers', description: 'Spiced grilled beef skewers with yaji spice and onions', price: 2800, category: 'Appetizers', preparationTime: 15, ingredients: ['beef', 'yaji spice', 'onions', 'groundnut oil'], allergens: ['Peanuts'], dietaryTags: ['Halal', 'Gluten-Free'] },
    { name: 'Pepper Soup', description: 'Rich and spicy catfish pepper soup', price: 3500, category: 'Mains', preparationTime: 30, ingredients: ['catfish', 'pepper soup spice', 'utazi leaves', 'onions', 'scotch bonnet'], allergens: ['Fish'], dietaryTags: ['Halal'] },
    { name: 'Fried Plantain', description: 'Sweet ripe plantain, golden fried', price: 1200, category: 'Sides', preparationTime: 8, ingredients: ['ripe plantain', 'palm oil', 'salt'], allergens: [], dietaryTags: ['Vegan', 'Gluten-Free'] },
    { name: 'Chapman', description: 'Refreshing cocktail mocktail with Fanta, Sprite, and grenadine', price: 1500, category: 'Drinks', preparationTime: 3, ingredients: ['fanta', 'sprite', 'grenadine', 'cucumber', 'Angostura bitters'], allergens: [], dietaryTags: ['Vegan'] },
    { name: 'Moi Moi', description: 'Steamed blended bean pudding with eggs and peppers', price: 1800, category: 'Appetizers', preparationTime: 20, ingredients: ['black-eyed beans', 'palm oil', 'scotch bonnet', 'onions', 'eggs'], allergens: ['Eggs'], dietaryTags: ['Vegetarian'] },
    { name: 'Egusi Soup & Pounded Yam', description: 'Rich melon seed soup with assorted meats, served with pounded yam', price: 5500, category: 'Mains', preparationTime: 35, ingredients: ['egusi seeds', 'spinach', 'palm oil', 'assorted meat', 'yam', 'crayfish'], allergens: ['Shellfish'], dietaryTags: ['Halal'] },
    { name: 'Chin Chin', description: 'Crunchy fried dough snack, lightly sweetened', price: 800, category: 'Desserts', preparationTime: 5, ingredients: ['flour', 'sugar', 'butter', 'nutmeg', 'milk'], allergens: ['Gluten', 'Dairy'], dietaryTags: [] },
    { name: 'Zobo Drink', description: 'Chilled hibiscus flower drink with pineapple and ginger', price: 1000, category: 'Drinks', preparationTime: 3, ingredients: ['dried hibiscus', 'pineapple', 'ginger', 'cloves', 'sugar'], allergens: [], dietaryTags: ['Vegan'] },
    { name: 'Fried Rice', description: 'Nigerian-style fried rice with mixed vegetables and chicken', price: 4200, category: 'Mains', preparationTime: 25, ingredients: ['rice', 'vegetable oil', 'mixed vegetables', 'chicken', 'curry', 'thyme'], allergens: [], dietaryTags: ['Halal'] },
    { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls with sweet chili sauce', price: 1500, category: 'Appetizers', preparationTime: 12, ingredients: ['cabbage', 'carrots', 'spring roll wrapper', 'seasoning'], allergens: ['Gluten'], dietaryTags: ['Vegan'] },
    { name: 'Puff Puff', description: 'Light and fluffy deep-fried dough balls', price: 700, category: 'Desserts', preparationTime: 10, ingredients: ['flour', 'sugar', 'yeast', 'nutmeg', 'vegetable oil'], allergens: ['Gluten'], dietaryTags: ['Vegetarian'] },
  ],
  [
    { name: 'Grilled Tilapia', description: 'Whole tilapia grilled with peppers, onions, and special spices', price: 6500, category: 'Mains', preparationTime: 30, ingredients: ['tilapia', 'bell peppers', 'onions', 'thyme', 'garlic'], allergens: ['Fish'], dietaryTags: ['Halal', 'Gluten-Free'] },
    { name: 'Shawarma Platter', description: 'Loaded chicken shawarma wrap with fries and coleslaw', price: 3800, category: 'Mains', preparationTime: 15, ingredients: ['chicken', 'pita bread', 'cabbage', 'carrots', 'mayonnaise', 'garlic sauce'], allergens: ['Gluten', 'Dairy', 'Eggs'], dietaryTags: [] },
    { name: 'Boli & Groundnut', description: 'Roasted plantain paired with fresh groundnuts', price: 1000, category: 'Sides', preparationTime: 15, ingredients: ['plantain', 'groundnuts'], allergens: ['Peanuts'], dietaryTags: ['Vegan', 'Gluten-Free'] },
    { name: 'Chicken Wings', description: 'Spicy buffalo chicken wings with dipping sauce', price: 3200, category: 'Appetizers', preparationTime: 18, ingredients: ['chicken wings', 'buffalo sauce', 'celery', 'blue cheese dip'], allergens: ['Dairy'], dietaryTags: ['Halal'] },
    { name: 'Ofada Rice & Ayamase', description: 'Local ofada rice served with spicy green pepper stew', price: 4800, category: 'Mains', preparationTime: 40, ingredients: ['ofada rice', 'green peppers', 'locust beans', 'assorted offals', 'palm oil'], allergens: [], dietaryTags: ['Halal'] },
    { name: 'Coconut Candy', description: 'Sweet chewy coconut candy pieces', price: 500, category: 'Desserts', preparationTime: 3, ingredients: ['coconut', 'sugar', 'vanilla'], allergens: [], dietaryTags: ['Vegan'] },
    { name: 'Fresh Palm Wine', description: 'Naturally tapped palm wine, served chilled', price: 2000, category: 'Drinks', preparationTime: 2, ingredients: ['palm wine'], allergens: [], dietaryTags: ['Vegan'] },
    { name: 'Gizdodo', description: 'Spicy gizzard and plantain stir-fry', price: 2500, category: 'Appetizers', preparationTime: 20, ingredients: ['gizzard', 'plantain', 'bell peppers', 'onions', 'tomato'], allergens: [], dietaryTags: ['Halal'] },
    { name: 'Yam Fries', description: 'Crispy thick-cut yam chips with pepper sauce', price: 1500, category: 'Sides', preparationTime: 12, ingredients: ['yam', 'vegetable oil', 'salt', 'pepper sauce'], allergens: [], dietaryTags: ['Vegan'] },
    { name: 'Chilled Chapman', description: 'Signature fruit punch with Fanta, Sprite, and fresh fruit slices', price: 1800, category: 'Drinks', preparationTime: 3, ingredients: ['fanta', 'sprite', 'grenadine', 'cucumber', 'orange slices'], allergens: [], dietaryTags: ['Vegan'] },
    { name: 'Akara', description: 'Deep-fried bean cakes, crispy outside, fluffy inside', price: 600, category: 'Appetizers', preparationTime: 15, ingredients: ['black-eyed beans', 'onions', 'scotch bonnet', 'vegetable oil'], allergens: [], dietaryTags: ['Vegan'] },
  ],
]

function generateMockItems(): ImportItem[] {
  return MOCK_MENU_SETS[Math.floor(Math.random() * MOCK_MENU_SETS.length)]
}

interface ScannedItemCardProps {
  item: ImportItem
  index: number
  onChange: (index: number, updated: ImportItem) => void
  onRemove: (index: number) => void
}

function ScannedItemCard({ item, index, onChange, onRemove }: ScannedItemCardProps) {
  const [kept, setKept] = useState(true)

  const update = (field: keyof ImportItem, value: string | number) => {
    onChange(index, { ...item, [field]: value })
  }

  if (!kept) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.5, scale: 0.98 }}
        exit={{ opacity: 0, scale: 0.9, height: 0 }}
        className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm line-through text-text-tertiary">{item.name}</span>
          <span className="text-xs text-text-tertiary">Skipped</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setKept(true)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-text-secondary" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-border bg-surface p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-amber-600">#{index + 1}</span>
          </div>
          <input
            type="text"
            value={item.name}
            onChange={(e) => update('name', e.target.value)}
            className="text-sm font-semibold text-text-primary bg-transparent border-none outline-none focus:ring-0 p-0"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setKept(false)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            title="Skip this item"
          >
            <EyeOff className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Description</label>
          <input
            type="text"
            value={item.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Price</label>
          <input
            type="number"
            value={item.price}
            onChange={(e) => update('price', Number(e.target.value))}
            className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Category</label>
        <select
          value={item.category ?? ''}
          onChange={(e) => update('category', e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </motion.div>
  )
}

export default function MenuPhotoScanner({ onImport, onCancel }: MenuPhotoScannerProps) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [items, setItems] = useState<ImportItem[]>([])
  const [, setEditMode] = useState(false)
  const [, setPreFillForEdit] = useState<ImportItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result as string)
      setScanComplete(false)
      setItems([])
    }
    reader.readAsDataURL(file)
  }, [])

  const startScan = useCallback(() => {
    if (!photo) return
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setScanComplete(true)
      setItems(generateMockItems())
    }, 2500)
  }, [photo])

  const resetScanner = useCallback(() => {
    setPhoto(null)
    setScanComplete(false)
    setItems([])
    setPreFillForEdit(null)
  }, [])

  const updateItem = useCallback((index: number, updated: ImportItem) => {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const keptItems = items.filter((item) => items.indexOf(item) >= 0)

  const handleImportAll = useCallback(() => {
    onImport(keptItems)
  }, [keptItems, onImport])

  const handleEditAndAdd = useCallback(() => {
    if (keptItems.length > 0) {
      setPreFillForEdit(keptItems[0])
      setEditMode(true)
    }
  }, [keptItems])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary font-heading">Scan Menu</h2>
              <p className="text-xs text-text-secondary">Upload a photo to extract menu items</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {!photo && !scanComplete && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-amber-500/50 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-text-tertiary" />
                  </div>
                  <p className="text-text-primary font-medium mb-1">Upload a photo of your menu</p>
                  <p className="text-sm text-text-secondary mb-6">
                    Take a photo or upload an image of your physical menu or price list
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                  </div>
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCapture}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCapture}
                  className="hidden"
                />
              </motion.div>
            )}

            {(photo || scanComplete) && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="relative rounded-2xl overflow-hidden border border-border">
                  <img src={photo!} alt="Menu photo" className="w-full max-h-64 object-cover" />

                  {isScanning && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                        initial={{ top: '0%' }}
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ boxShadow: '0 0 20px 8px rgba(245, 158, 11, 0.4)' }}
                      />
                      <div className="flex items-center gap-3 bg-surface/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg">
                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Scanning menu...</p>
                          <p className="text-xs text-text-secondary">Detecting text and prices</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {scanComplete && !isScanning && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      {items.length} items found
                    </div>
                  )}
                </div>

                {scanComplete && !isScanning && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetScanner}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Scan Another
                    </button>
                    <button
                      onClick={startScan}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      <ScanLine className="w-4 h-4" /> Rescan
                    </button>
                  </div>
                )}

                {!scanComplete && (
                  <button
                    onClick={startScan}
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-4 h-4" /> Scan Menu
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {scanComplete && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Extracted Items ({keptItems.length})
                </h3>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <ScannedItemCard
                      key={`${item.name}-${i}`}
                      item={item}
                      index={i}
                      onChange={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {scanComplete && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 pt-2 border-t border-border"
            >
              <button
                onClick={handleEditAndAdd}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <Pencil className="w-4 h-4" /> Edit & Add
              </button>
              <button
                onClick={handleImportAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                <Check className="w-4 h-4" /> Add All ({keptItems.length} items)
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
