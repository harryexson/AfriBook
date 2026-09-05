import {
  UtensilsCrossed, Pizza, Soup, Sandwich, Beef, Fish, Salad, Coffee,
  IceCreamCone, Croissant, Wheat, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Cuisine → icon map for the Food browse page's category row (adapted
 * from the Haneul/food-app reference: a row of circular cuisine icons
 * above the restaurant grid, e.g. Asia/Pasta/Breakfast/Pizza). Keyed by
 * substring match against the real `cuisineType` values restaurants
 * report — not an exhaustive enum, since cuisine types are free text.
 */
export const CUISINE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  pizza: Pizza,
  italian: Pizza,
  soup: Soup,
  ramen: Soup,
  noodle: Soup,
  asian: Soup,
  chinese: Soup,
  japanese: Soup,
  korean: Soup,
  thai: Soup,
  sandwich: Sandwich,
  burger: Sandwich,
  fast: Sandwich,
  bbq: Beef,
  grill: Beef,
  steak: Beef,
  meat: Beef,
  suya: Flame,
  seafood: Fish,
  fish: Fish,
  salad: Salad,
  vegan: Salad,
  vegetarian: Salad,
  healthy: Salad,
  cafe: Coffee,
  coffee: Coffee,
  breakfast: Croissant,
  bakery: Croissant,
  dessert: IceCreamCone,
  bakery2: Wheat,
}

export default function CuisineIcon({ cuisine, className }: { cuisine: string; className?: string }) {
  const key = Object.keys(CUISINE_ICON_MAP).find((k) => cuisine.toLowerCase().includes(k))
  const Icon = (key && CUISINE_ICON_MAP[key]) || UtensilsCrossed
  return <Icon className={cn('w-5 h-5', className)} />
}
