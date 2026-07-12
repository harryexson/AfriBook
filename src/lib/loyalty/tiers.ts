// ─── Loyalty Tiers ───────────────────────────────────────────
// Defines loyalty tiers, thresholds, multipliers, and benefits
// for the AfriBook loyalty program.
// ──────────────────────────────────────────────────────────────

export interface LoyaltyTier {
  name: string;
  displayName: string;
  threshold: number;
  pointsMultiplier: number;
  benefits: string[];
  color: string;
  icon: string;
}

// ─── Tier Definitions ────────────────────────────────────────

export const LOYALTY_TIERS: Record<string, LoyaltyTier> = {
  bronze: {
    name: 'bronze',
    displayName: 'Bronze',
    threshold: 0,
    pointsMultiplier: 1.0,
    benefits: [
      'Earn 1x points on all purchases',
      'Access to member-only deals',
      'Birthday bonus (50 points)',
    ],
    color: '#CD7F32',
    icon: '🥉',
  },
  silver: {
    name: 'silver',
    displayName: 'Silver',
    threshold: 500,
    pointsMultiplier: 1.25,
    benefits: [
      'Earn 1.25x points on all purchases',
      'Free delivery on rides over $10',
      'Priority customer support',
      'Monthly bonus (100 points)',
    ],
    color: '#C0C0C0',
    icon: '🥈',
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    threshold: 1500,
    pointsMultiplier: 1.5,
    benefits: [
      'Earn 1.5x points on all purchases',
      'Free delivery on all orders',
      'Priority driver matching',
      'Monthly bonus (250 points)',
      'Exclusive restaurant discounts',
    ],
    color: '#FFD700',
    icon: '🥇',
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum',
    threshold: 5000,
    pointsMultiplier: 2.0,
    benefits: [
      'Earn 2x points on all purchases',
      'Free delivery on all orders',
      'VIP driver matching',
      'Monthly bonus (500 points)',
      'Exclusive restaurant discounts',
      'Priority airport pickup',
      'Dedicated account manager',
    ],
    color: '#E5E4E2',
    icon: '💎',
  },
};

// ─── Helper Functions ────────────────────────────────────────

export function getTierForPoints(totalPoints: number): LoyaltyTier {
  let result = LOYALTY_TIERS.bronze;

  for (const tier of Object.values(LOYALTY_TIERS)) {
    if (totalPoints >= tier.threshold) {
      result = tier;
    }
  }

  return result;
}

export function getPointsMultiplier(tier: LoyaltyTier): number {
  return tier.pointsMultiplier;
}

export function getTierBenefits(tier: LoyaltyTier): string[] {
  return tier.benefits;
}

export function getTierByName(name: string): LoyaltyTier {
  return LOYALTY_TIERS[name] ?? LOYALTY_TIERS.bronze;
}

export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const tiers = Object.values(LOYALTY_TIERS);
  const currentIdx = tiers.findIndex((t) => t.name === currentTier.name);

  if (currentIdx < tiers.length - 1) {
    return tiers[currentIdx + 1];
  }

  return null;
}

export function getProgressToNextTier(
  totalPoints: number,
  currentTier: LoyaltyTier,
): { progress: number; pointsNeeded: number; nextTier: LoyaltyTier | null } {
  const nextTier = getNextTier(currentTier);

  if (!nextTier) {
    return { progress: 100, pointsNeeded: 0, nextTier: null };
  }

  const pointsInTier = totalPoints - currentTier.threshold;
  const tierRange = nextTier.threshold - currentTier.threshold;
  const progress = Math.min(100, Math.round((pointsInTier / tierRange) * 100));
  const pointsNeeded = nextTier.threshold - totalPoints;

  return { progress, pointsNeeded: Math.max(0, pointsNeeded), nextTier };
}
