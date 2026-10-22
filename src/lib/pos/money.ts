export function currencyDigits(currency: string): number {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid currency')
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}

/** Exact decimal conversion: never multiply binary floats for a sale. */
export function toMinor(value: string | number, currency: string): number {
  const text = String(value)
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error('Price must be a non-negative decimal')
  const digits = currencyDigits(currency)
  const [whole, fraction = ''] = text.split('.')
  if (fraction.slice(digits).replace(/0/g, '')) throw new Error('Price exceeds the currency precision')
  const amount = BigInt(whole) * BigInt(10) ** BigInt(digits) + BigInt(fraction.slice(0, digits).padEnd(digits, '0') || '0')
  if (amount > BigInt(999999999999)) throw new Error('Amount exceeds the sale limit')
  return Number(amount)
}

export function saleTotals(subtotal: number, basisPoints: number, inclusive: boolean) {
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 || subtotal > 999999999999) throw new Error('Invalid subtotal')
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) throw new Error('Invalid tax rate')
  const base = BigInt(subtotal)
  const divisor = BigInt(inclusive ? 10000 + basisPoints : 10000)
  const tax = Number((base * BigInt(basisPoints) + divisor / BigInt(2)) / divisor)
  return { subtotalMinor: inclusive ? subtotal - tax : subtotal, taxMinor: tax, totalMinor: inclusive ? subtotal : subtotal + tax }
}

export function formatMinor(amount: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 10 ** currencyDigits(currency))
}
