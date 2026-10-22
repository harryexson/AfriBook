import 'server-only'
import { query } from '@/lib/neon/admin'

/** Ownership is checked in the API even when called outside the dashboard. */
export async function ownsRestaurant(userId: string, restaurantId: string): Promise<boolean> {
  const rows = await query(
    `SELECT r.id FROM restaurants r JOIN businesses b ON b.id = r.business_id
     WHERE r.id = $1 AND b.owner_id = $2`, [restaurantId, userId],
  )
  return rows.length === 1
}

export async function ownsKitchenOrder(userId: string, orderId: string): Promise<boolean> {
  const rows = await query(
    `SELECT f.id FROM ridely_food_deliveries f
     JOIN restaurants r ON r.id = f.restaurant_id JOIN businesses b ON b.id = r.business_id
     WHERE f.id = $1 AND b.owner_id = $2`, [orderId, userId],
  )
  return rows.length === 1
}

export async function canAssignKitchenStaff(userId: string, orderId: string, staffId: string): Promise<boolean> {
  const rows = await query(
    `SELECT f.id FROM ridely_food_deliveries f
     JOIN restaurants r ON r.id = f.restaurant_id JOIN businesses b ON b.id = r.business_id
     JOIN business_staff s ON s.business_id = b.id
     WHERE f.id = $1 AND b.owner_id = $2 AND s.id = $3 AND s.is_active = true`,
    [orderId, userId, staffId],
  )
  return rows.length === 1
}
