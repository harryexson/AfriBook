import {
  Store, Heart, GraduationCap, Laptop, UtensilsCrossed, Sparkles, Car, Scale,
  Building2, Ticket, Shirt, Sprout, Bus, Compass, Truck, BookOpen, PartyPopper,
  Dumbbell, Wrench, Scissors, Camera, Wand2, Video, Droplets, Flower2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Single category → icon map, shared by the country homepage and the
 * search/browse page so both agree on the same icon for the same
 * category instead of each maintaining its own list (previously only
 * `[country]/page.tsx` had one, and it had no entries at all for the
 * granular beauty-provider subcategories below — every barber/spa/
 * photographer/etc. fell through to a generic Store icon).
 */
export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Home Services': Wrench,
  'Healthcare': Heart,
  'Education': GraduationCap,
  'Technology': Laptop,
  'Food & Dining': UtensilsCrossed,
  'Beauty & Wellness': Sparkles,
  'Automotive': Car,
  'Legal & Financial': Scale,
  'Real Estate': Building2,
  'Entertainment': Ticket,
  'Fashion & Tailoring': Shirt,
  'Agriculture': Sprout,
  'Transportation': Bus,
  'Tourism': Compass,
  'Logistics': Truck,
  'Tutoring': BookOpen,
  'Event Planning': PartyPopper,
  'Fitness': Dumbbell,
  // Granular personal-care/gig subcategories (src/lib/localization/categories.ts
  // BEAUTY_PROVIDER_SUBCATEGORIES) — previously missing entirely.
  'Barber': Scissors,
  'Mobile Barber': Scissors,
  'Spa': Flower2,
  'Photographer': Camera,
  'Videographer': Video,
  'Cosmetician': Wand2,
  'Beauty Salon': Sparkles,
  'Mobile Carwash': Droplets,
}

export default function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICON_MAP[name] ?? Store
  return <Icon className={cn('w-6 h-6', className)} />
}
