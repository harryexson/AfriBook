'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet,
} from 'lucide-react'
import type { ImportItem } from './ImportWizard'

export interface CsvParserProps {
  type: 'product' | 'menu' | 'service'
  onParsed: (items: ImportItem[]) => void
  onCancel: () => void
}

interface ColumnMapping {
  csvColumn: string
  targetField: string | null
}

type CsvRow = Record<string, string>

const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  product: [
    { value: 'name', label: 'Name' },
    { value: 'description', label: 'Description' },
    { value: 'price', label: 'Price' },
    { value: 'comparePrice', label: 'Compare Price' },
    { value: 'stock', label: 'Stock' },
    { value: 'category', label: 'Category' },
    { value: 'tags', label: 'Tags' },
    { value: 'image', label: 'Image URL' },
  ],
  menu: [
    { value: 'name', label: 'Name' },
    { value: 'description', label: 'Description' },
    { value: 'price', label: 'Price' },
    { value: 'category', label: 'Category' },
    { value: 'preparationTime', label: 'Prep Time (min)' },
    { value: 'ingredients', label: 'Ingredients' },
    { value: 'allergens', label: 'Allergens' },
    { value: 'dietaryTags', label: 'Dietary Tags' },
    { value: 'image', label: 'Image URL' },
  ],
  service: [
    { value: 'name', label: 'Name' },
    { value: 'description', label: 'Description' },
    { value: 'price', label: 'Price' },
    { value: 'duration', label: 'Duration (min)' },
    { value: 'maxCapacity', label: 'Max Capacity' },
    { value: 'category', label: 'Category' },
    { value: 'image', label: 'Image URL' },
  ],
}

const FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'item', 'product', 'title', 'dish', 'dish name', 'product name', 'item name', 'service name', 'service'],
  description: ['description', 'desc', 'details', 'info', 'about', 'notes'],
  price: ['price', 'cost', 'amount', 'rate', 'unit price', 'sale price', 'regular price'],
  comparePrice: ['compare price', 'compare', 'original price', 'was', 'msrp', 'regular price'],
  stock: ['stock', 'quantity', 'qty', 'inventory', 'units', 'stock qty', 'available'],
  category: ['category', 'cat', 'type', 'group', 'section', 'department', 'menu category'],
  tags: ['tags', 'labels', 'keywords', 'tag'],
  image: ['image', 'image url', 'photo', 'photo url', 'img', 'picture', 'thumbnail', 'img url'],
  preparationTime: ['prep time', 'preparation time', 'prep', 'time', 'cooking time', 'cook time', 'prep minutes'],
  ingredients: ['ingredients', 'ingredient', 'components', 'contents'],
  allergens: ['allergens', 'allergen', 'allergy', 'allergies', 'contains'],
  dietaryTags: ['dietary', 'dietary tags', 'diet', 'diet tags', 'labels', 'dietary info'],
  duration: ['duration', 'time', 'length', 'minutes', 'mins', 'session length'],
  maxCapacity: ['max capacity', 'capacity', 'max', 'slots', 'max slots', 'max per slot'],
}

function fuzzyMatch(header: string, field: string): boolean {
  const normalised = header.toLowerCase().trim()
  const aliases = FIELD_ALIASES[field] ?? [field]
  return aliases.some((alias) => normalised === alias || normalised.includes(alias) || alias.includes(normalised))
}

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const semiCount = (firstLine.match(/;/g) ?? []).length
  if (tabCount > commaCount && tabCount > semiCount) return '\t'
  if (semiCount > commaCount) return ';'
  return ','
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

function parseCsvContent(content: string): { headers: string[]; rows: CsvRow[] } {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter)
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter)
    const row: CsvRow = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function autoMapColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    for (const field of Object.keys(FIELD_ALIASES)) {
      if (fuzzyMatch(header, field)) {
        return { csvColumn: header, targetField: field }
      }
    }
    return { csvColumn: header, targetField: null }
  })
}

function mapRowToItem(row: CsvRow, mappings: ColumnMapping[]): ImportItem {
  const item: ImportItem = {
    name: '',
    description: '',
    price: 0,
  }

  for (const mapping of mappings) {
    if (!mapping.targetField) continue
    const value = row[mapping.csvColumn] ?? ''
    const field = mapping.targetField

    switch (field) {
      case 'name':
        item.name = value
        break
      case 'description':
        item.description = value
        break
      case 'price':
        item.price = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
        break
      case 'comparePrice':
        item.comparePrice = parseFloat(value.replace(/[^0-9.]/g, '')) || undefined
        break
      case 'stock':
        item.stock = parseInt(value.replace(/[^0-9]/g, ''), 10) || undefined
        break
      case 'category':
        item.category = value
        break
      case 'tags':
        item.tags = value.split(',').map((t) => t.trim()).filter(Boolean)
        break
      case 'image':
        item.image = value
        break
      case 'preparationTime':
        item.preparationTime = parseInt(value.replace(/[^0-9]/g, ''), 10) || undefined
        break
      case 'ingredients':
        item.ingredients = value.split(',').map((t) => t.trim()).filter(Boolean)
        break
      case 'allergens':
        item.allergens = value.split(',').map((t) => t.trim()).filter(Boolean)
        break
      case 'dietaryTags':
        item.dietaryTags = value.split(',').map((t) => t.trim()).filter(Boolean)
        break
      case 'duration':
        item.duration = parseInt(value.replace(/[^0-9]/g, ''), 10) || undefined
        break
      case 'maxCapacity':
        item.maxCapacity = parseInt(value.replace(/[^0-9]/g, ''), 10) || undefined
        break
    }
  }

  return item
}

function generateTemplateCsv(type: 'product' | 'menu' | 'service'): string {
  const fields = FIELD_OPTIONS[type]
  const header = fields.map((f) => f.label).join(',')

  const sampleRows: string[] = []
  if (type === 'product') {
    sampleRows.push('Ankara Tote Bag,Handcrafted African print tote bag,24.99,29.99,50,Fashion,handmade|african,https://example.com/img.jpg')
    sampleRows.push('Shea Butter Cream,Organic shea butter moisturizer,18.99,,120,Beauty,organic|skincare,https://example.com/img2.jpg')
  } else if (type === 'menu') {
    sampleRows.push('Jollof Rice,Classic West African jollof,12.99,Mains,20,rice|tomato,,Halal|Vegetarian,https://example.com/img.jpg')
    sampleRows.push('Suya Skewers,Grilled beef with suya spice,8.99,Appetizers,15,beef|onion,Gluten,Gluten-Free,https://example.com/img2.jpg')
  } else {
    sampleRows.push('Haircut & Styling,Professional haircut with consultation,25.00,45,1,Hair & Beauty,https://example.com/img.jpg')
    sampleRows.push('Full Body Massage,Relaxing 90-minute massage,55.00,90,1,Wellness & Spa,https://example.com/img2.jpg')
  }

  return [header, ...sampleRows].join('\n')
}

export default function CsvParser({ type, onParsed, onCancel }: CsvParserProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rawData, setRawData] = useState<{ headers: string[]; rows: CsvRow[] } | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [previewRows, setPreviewRows] = useState<ImportItem[]>([])
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload')

  const fields = useMemo(() => FIELD_OPTIONS[type], [type])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsvContent(text)
      setRawData(parsed)
      setMappings(autoMapColumns(parsed.headers))
      setStep('map')
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleMappingChange = useCallback((csvColumn: string, targetField: string | null) => {
    setMappings((prev) => prev.map((m) => m.csvColumn === csvColumn ? { ...m, targetField } : m))
  }, [])

  const validation = useMemo(() => {
    if (!rawData) return { valid: 0, issues: 0, errors: new Map<number, string[]>() }
    const errors = new Map<number, string[]>()
    let valid = 0

    rawData.rows.forEach((row, i) => {
      const item = mapRowToItem(row, mappings)
      const rowIssues: string[] = []
      if (!item.name.trim()) rowIssues.push('Missing name')
      if (!item.price || item.price <= 0) rowIssues.push('Invalid price')
      if (rowIssues.length > 0) {
        errors.set(i, rowIssues)
      } else {
        valid++
      }
    })

    return { valid, issues: errors.size, errors }
  }, [rawData, mappings])

  const handleGeneratePreview = useCallback(() => {
    if (!rawData) return
    const items = rawData.rows.map((row) => mapRowToItem(row, mappings))
    setPreviewRows(items)
    setStep('preview')
  }, [rawData, mappings])

  const handleConfirmImport = useCallback(() => {
    const items = previewRows.filter((item) => item.name.trim())
    onParsed(items)
  }, [previewRows, onParsed])

  const downloadTemplate = useCallback(() => {
    const csv = generateTemplateCsv(type)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `afribook-${type}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [type])

  return (
    <div className="space-y-4">
      {/* Upload Step */}
      {step === 'upload' && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-amber-500 bg-amber-500/5'
                : 'border-border hover:border-amber-300 hover:bg-surface-secondary'
            )}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-7 h-7 text-text-secondary" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Drop your CSV or spreadsheet here</h3>
            <p className="text-xs text-text-secondary mb-3">or click to browse files</p>
            <p className="text-[11px] text-text-tertiary">Supports .csv, .tsv files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              className="hidden"
            />
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download {type} template CSV
          </button>
        </>
      )}

      {/* Column Mapping Step */}
      {step === 'map' && rawData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Map Columns</h3>
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-xs font-medium flex items-center gap-1',
                validation.issues > 0 ? 'text-amber-600' : 'text-emerald-600'
              )}>
                {validation.issues > 0 ? (
                  <><AlertCircle className="w-3.5 h-3.5" /> {validation.issues} rows with issues</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> {validation.valid} valid rows</>
                )}
              </span>
              <button onClick={() => setStep('upload')} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                Change file
              </button>
            </div>
          </div>

          <p className="text-xs text-text-secondary">
            We auto-detected {mappings.filter((m) => m.targetField).length} of {mappings.length} columns. Adjust below if needed.
          </p>

          {/* Mapping dropdowns */}
          <div className="space-y-2">
            {mappings.map((mapping) => (
              <div key={mapping.csvColumn} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-text-primary truncate block">{mapping.csvColumn}</span>
                  <span className="text-[10px] text-text-tertiary truncate block">
                    Sample: {rawData.rows[0]?.[mapping.csvColumn] || '—'}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <select
                  value={mapping.targetField ?? ''}
                  onChange={(e) => handleMappingChange(mapping.csvColumn, e.target.value || null)}
                  className={cn(
                    'w-48 px-3 py-1.5 rounded-lg border bg-surface text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/30',
                    mapping.targetField ? 'border-border' : 'border-amber-300 dark:border-amber-700'
                  )}
                >
                  <option value="">— Skip column —</option>
                  {fields.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-secondary">
                  {mappings.filter((m) => m.targetField).map((m) => (
                    <th key={m.csvColumn} className="px-3 py-2 text-left font-medium text-text-secondary">
                      {fields.find((f) => f.value === m.targetField)?.label ?? m.csvColumn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawData.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {mappings.filter((m) => m.targetField).map((m) => (
                      <td key={m.csvColumn} className="px-3 py-2 text-text-primary">
                        {row[m.csvColumn] || <span className="text-text-tertiary italic">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
              Back
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={validation.valid === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Preview {validation.valid} items
            </button>
          </div>
        </motion.div>
      )}

      {/* Preview & Confirm Step */}
      {step === 'preview' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">{previewRows.length} items ready to import</h3>
            <button onClick={() => setStep('map')} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              Edit mappings
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2">
            {previewRows.map((item, i) => {
              const hasIssue = !item.name.trim() || item.price <= 0
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border',
                    hasIssue ? 'border-amber-300 bg-amber-500/5 dark:bg-amber-900/10' : 'border-border bg-surface-secondary'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.name || <span className="text-red-500 italic">Missing name</span>}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.price > 0 ? `$${item.price.toFixed(2)}` : 'No price'}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                  </div>
                  {hasIssue && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
              Back
            </button>
            <button
              onClick={handleConfirmImport}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import {previewRows.filter((i) => i.name.trim()).length} items
            </button>
          </div>
        </motion.div>
      )}

      {/* Back button on upload screen */}
      {step === 'upload' && (
        <button onClick={onCancel} className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
          Back to methods
        </button>
      )}
    </div>
  )
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
