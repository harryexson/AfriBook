// ─── Marketing & Sign-Up Incentive Campaigns ──────────────────
// Content module (not DB-backed) powering the public marketing pages
// that pitch each side of the marketplace on joining and sharing
// AfriBook. Kept separate from the transactional promo_codes table
// (src/app/api/admin/promos) which handles the actual redeemable
// discount codes these campaigns describe.
// ──────────────────────────────────────────────────────────────

export type CampaignAudience = 'rider' | 'driver' | 'restaurant' | 'hotel' | 'rental_company' | 'gig_provider';

export interface Campaign {
  id: string;
  name: string;
  audience: CampaignAudience;
  tagline: string;
  description: string;
  incentives: string[];
  cta: { label: string; href: string };
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'road-ready-bonus',
    name: 'Road Ready Bonus',
    audience: 'driver',
    tagline: 'Sign up, complete 20 trips in your first 2 weeks, keep the bonus.',
    description:
      'New drivers get a guaranteed activation bonus on top of every fare, paid once the first-20-trips milestone is hit — not before, so the bonus always tracks real supply added to the road.',
    incentives: [
      'Guaranteed earnings floor for your first 20 trips',
      'Zero AfriBook commission on your first week of trips',
      'Free RideShield Basic coverage from trip one',
      'Fast-tracked document verification (under 24 hours)',
    ],
    cta: { label: 'Apply to drive', href: '/rides/apply' },
  },
  {
    id: 'bring-a-friend-rider',
    name: 'Bring a Friend',
    audience: 'rider',
    tagline: 'Give a ride, get a ride — both of you ride free.',
    description:
      'Share your code. Once your friend takes their first paid ride or food order, you both get ride/order credit — capped so it never becomes a coupon farm.',
    incentives: [
      'You + your friend each get ride credit after their first trip',
      'No limit on friends referred, capped payouts per month',
      'Stacks with Road Rewards-tier discounts (riders with a linked driver referral get priority pickup in surge zones)',
    ],
    cta: { label: 'Get my code', href: '/account' },
  },
  {
    id: 'open-kitchen-boost',
    name: 'Open Kitchen Boost',
    audience: 'restaurant',
    tagline: 'List your menu in an afternoon. Pay less than Uber Eats from day one.',
    description:
      'New restaurant partners get a reduced commission for their first 90 days, free menu photography, and priority placement in the food tab while their rating builds.',
    incentives: [
      '10% commission for the first 90 days (vs. AfriBook’s already-lower standard 15-18%)',
      'Free professional menu photography package',
      'Priority placement in Food search for the launch window',
      'Same-day payouts during the onboarding period',
    ],
    cta: { label: 'List your restaurant', href: '/onboarding/vendor' },
  },
  {
    id: 'partner-launch-hotels',
    name: 'Partner Launch Program — Hotels',
    audience: 'hotel',
    tagline: 'List your rooms for less than Airbnb’s host fee, keep more of every booking.',
    description:
      'Hotels and guesthouses that join StayScape during a launch window lock in a reduced host commission for their first year and get a dedicated onboarding specialist.',
    incentives: [
      'Reduced host commission, locked for 12 months — undercuts Airbnb’s combined host+guest fee load',
      'Dedicated onboarding specialist for photos, pricing and calendar sync',
      'Featured placement in StayScape search for the first 60 days',
      'Early access to AI-assisted dynamic pricing',
    ],
    cta: { label: 'List your property', href: '/host' },
  },
  {
    id: 'partner-launch-rentals',
    name: 'Partner Launch Program — Rental Companies',
    audience: 'rental_company',
    tagline: 'Put your fleet to work between bookings.',
    description:
      'Vehicle rental companies get a fleet-wide onboarding fast-track, a lower host commission than typical marketplace norms, and optional cross-listing into AfriBook Rides for idle-fleet utilisation.',
    incentives: [
      'Fleet bulk-upload tools — list 10+ vehicles in one session',
      'Reduced host commission for your first 100 completed bookings',
      'Optional cross-listing of idle vehicles into the Rides driver-vehicle marketplace',
      'Damage-protection plan bundled at a discounted fleet rate',
    ],
    cta: { label: 'List your fleet', href: '/host/vehicles' },
  },
  {
    id: 'gig-marketplace-launch',
    name: 'Gig Marketplace Launch',
    audience: 'gig_provider',
    tagline: 'Sell your services and skills to a marketplace that already has the customers.',
    description:
      'Independent service providers — cleaners, handymen, event staff, tutors and more — get reduced marketplace fees for their first 90 days on the AfriBook Marketplace services tab.',
    incentives: [
      '10% marketplace fee for the first 90 days (vs. standard rate)',
      'Verified-provider badge after your first 5 completed jobs',
      'Instant payout eligibility once your rating hits 4.5+',
    ],
    cta: { label: 'List your services', href: '/sell' },
  },
];

export function getCampaignsForAudience(audience: CampaignAudience): Campaign[] {
  return CAMPAIGNS.filter((c) => c.audience === audience);
}
