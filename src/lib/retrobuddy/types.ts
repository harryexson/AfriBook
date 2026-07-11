export type RestaurantOrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type KitchenDisplayPriority = 'normal' | 'urgent' | 'rush';
export type PrepTimeStatus = 'on_time' | 'delayed' | 'critical';

export interface RestaurantConfig {
  id: string;
  businessId: string;
  restaurantName: string;
  avgPrepTimeMin: number;
  maxOrdersPerHour: number;
  acceptsOrders: boolean;
  opensAt: string;
  closesAt: string;
  deliveryRadiusKm: number;
  minimumOrder: number;
  deliveryFee: number;
  autoAcceptOrders: boolean;
  posIntegrationType?: 'toast' | 'square' | 'clover' | 'custom' | null;
  posApiKey?: string;
}

export interface RestaurantOrder {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: RestaurantOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  currencyCode: string;
  status: RestaurantOrderStatus;
  type: 'delivery' | 'dine_in' | 'pickup';
  deliveryAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  driverId?: string;
  estimatedPrepTime: number;
  estimatedDeliveryTime: number;
  actualPrepTime?: number;
  specialInstructions?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rating?: number;
  review?: string;
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
  modifications?: OrderItemModification[];
}

export interface OrderItemModification {
  type: 'add' | 'remove' | 'substitute';
  name: string;
  price: number;
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

export interface PrepTimeEstimate {
  menuItemId: string;
  baseTimeMin: number;
  complexity: 'simple' | 'moderate' | 'complex';
  currentLoad: number;
  estimatedTimeMin: number;
}

export interface RestaurantAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePrepTime: number;
  averageRating: number;
  peakHours: { hour: number; orders: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  orderStatusBreakdown: Record<RestaurantOrderStatus, number>;
  repeatCustomerRate: number;
  averageDeliveryTime: number;
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
    modifications?: OrderItemModification[];
  }[];
  type: 'delivery' | 'dine_in' | 'pickup';
  deliveryAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  specialInstructions?: string;
  paymentMethod: string;
  tip?: number;
}
