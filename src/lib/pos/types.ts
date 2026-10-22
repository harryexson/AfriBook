export type SaleKind = 'product' | 'menu' | 'service'
export interface SaleItem { id: string; kind: SaleKind; name: string; price: string; currency: string; image: string | null; stock: number | null }
export interface PosSettings { enabled: boolean; kioskEnabled: boolean; taxBasisPoints: number; taxInclusive: boolean }
export interface SaleLine { id: string; kind: SaleKind; name: string; quantity: number; unitMinor: number }
export interface CounterSale { id: string; business_id: string; status: 'awaiting_payment' | 'paid' | 'cancelled'; channel: 'counter' | 'kiosk'; fulfillment: string; prep_status: 'pending' | 'preparing' | 'ready' | 'completed'; currency: string; lines: SaleLine[]; subtotal_minor: number; tax_minor: number; total_minor: number; tendered_minor: number | null; change_minor: number | null; created_at: string }
