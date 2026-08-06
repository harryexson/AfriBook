// RetroBuddy restaurant food-delivery types, reconciled to the real
// `ridely_food_deliveries` schema (migration 002 + 012 additions). Only
// delivery orders are supported: dine-in/pickup have no table in the schema.
export type RestaurantOrderStatus =
  | 'requesting'
  | 'searching'
  | 'matched'
  | 'accepted'
  | 'en_route_to_pickup'
  | 'at_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'at_dropoff'
  | 'delivered'
  | 'cancelled';

export type KitchenDisplayPriority = 'normal' | 'urgent' | 'rush';
export type PrepTimeStatus = 'on_time' | 'delayed' | 'critical';

export interface RestaurantOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerId: string;
  items: RestaurantOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currencyCode: string;
  status: RestaurantOrderStatus;
  type: 'delivery';
  deliveryAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  driverId?: string;
  estimatedPrepTime: number;
  estimatedDeliveryTime: number;
  specialInstructions?: string;
  paymentMethod: string;
  requestedAt: string;
  restaurantAcceptedAt?: string;
  restaurantReadyAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface KitchenDisplayItem {
  id: string;
  orderId: string;
  orderNumber: number;
  items: RestaurantOrderItem[];
  priority: KitchenDisplayPriority;
  status: 'pending' | 'in_progress' | 'ready';
  prepTimeStatus: PrepTimeStatus;
  estimatedReadyAt: string;
  actualReadyAt?: string;
  assignedTo?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderCancelledBy = 'customer' | 'restaurant' | 'driver' | 'system';

export interface OrderStatusMetadata {
  note?: string;
  estimatedMinutes?: number;
  driverId?: string;
  reason?: string;
}

export interface CreateOrderParams {
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
  type: 'delivery';
  deliveryAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  specialInstructions?: string;
  paymentMethod: string;
  tip?: number;
}
