import { create } from 'zustand';
import type { Service, Product, MenuItem } from '../types';

export interface BookingCartItem {
  type: 'booking';
  service: Service;
  staffId?: string;
  startTime: string;
  endTime: string;
  quantity: number;
  notes?: string;
}

export interface ProductCartItem {
  type: 'product';
  product: Product;
  variantId?: string;
  quantity: number;
  notes?: string;
}

export interface MenuCartItem {
  type: 'menu';
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export type CartItem = BookingCartItem | ProductCartItem | MenuCartItem;

type CartMode = 'booking' | 'order' | 'mixed';

interface CartState {
  items: CartItem[];
  businessId: string | null;
  mode: CartMode;
  deliveryAddressId: string | null;
  tip: number;
  notes: string;
  promoCode: string | null;
  discount: number;

  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  setBusinessId: (id: string | null) => void;
  setMode: (mode: CartMode) => void;
  setDeliveryAddressId: (id: string | null) => void;
  setTip: (tip: number) => void;
  setNotes: (notes: string) => void;
  setPromoCode: (code: string | null) => void;
  setDiscount: (discount: number) => void;

  itemCount: () => number;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  businessId: null,
  mode: 'order',
  deliveryAddressId: null,
  tip: 0,
  notes: '',
  promoCode: null,
  discount: 0,

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
      businessId:
        item.type === 'booking'
          ? item.service.businessId
          : item.type === 'product'
            ? item.product.businessId
            : item.item.businessId,
    })),

  removeItem: (index) =>
    set((state) => {
      const items = state.items.filter((_, i) => i !== index);
      return { items, businessId: items.length > 0 ? state.businessId : null };
    }),

  updateQuantity: (index, quantity) =>
    set((state) => {
      const items = [...state.items];
      const existing = items[index];
      if (existing) {
        items[index] = { ...existing, quantity } as CartItem;
      }
      return { items };
    }),

  clearCart: () =>
    set({
      items: [],
      businessId: null,
      mode: 'order',
      deliveryAddressId: null,
      tip: 0,
      notes: '',
      promoCode: null,
      discount: 0,
    }),

  setBusinessId: (id) => set({ businessId: id }),
  setMode: (mode) => set({ mode }),
  setDeliveryAddressId: (id) => set({ deliveryAddressId: id }),
  setTip: (tip) => set({ tip }),
  setNotes: (notes) => set({ notes }),
  setPromoCode: (code) => set({ promoCode: code }),
  setDiscount: (discount) => set({ discount }),

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: () =>
    get().items.reduce((sum, item) => {
      const price =
        item.type === 'booking'
          ? item.service.price
          : item.type === 'product'
            ? item.product.price
            : item.item.price;
      return sum + price * item.quantity;
    }, 0),
  total: () => {
    const state = get();
    return state.subtotal() + state.tip - state.discount;
  },
}));
