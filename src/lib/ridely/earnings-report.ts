// ─── Detailed Earnings Statement ──────────────────────────────
// Builds the Uber/Lyft-style "where did the fare go" breakdown
// (total customer fare → taxes/fees → insurance & operational costs
// → promotions → amount the platform kept → driver's earnings from
// fares → tips → total earnings) from the same driver_earnings rows
// that already power the earnings dashboard — no new tables needed.
//
// AfriBook's own platform take-rate is disclosed and deliberately
// lower than the ~25-30% Uber/Lyft commonly charge (see the Fee &
// Commission Policy in src/lib/legal-agreements.ts).
// ──────────────────────────────────────────────────────────────

import { getEarningsSummary } from './driver-payouts';

/** AfriBook's published driver take-rate: it keeps at most this
 *  fraction of the fare as its own margin — the rest of the platform
 *  fee is a transparent pass-through for tax/regulatory charges and
 *  commercial insurance + operational costs, itemised below. */
export const PLATFORM_FEE_BREAKDOWN = {
  /** Government taxes, licensing & regulatory pass-through. */
  governmentFeesShare: 0.12,
  /** Commercial auto insurance + operational costs (support, safety, mapping). */
  insuranceOperationalShare: 0.45,
  /** What's left is AfriBook's own margin — capped well under industry norm. */
  get platformMarginShare() {
    return 1 - this.governmentFeesShare - this.insuranceOperationalShare;
  },
} as const;

export interface EarningsStatementLine {
  label: string;
  amount: number;
  percentage: number;
}

export interface DetailedEarningsStatement {
  currencyCode: string;
  tripCount: number;
  /** Total fare the customer(s) paid across all trips, tip excluded. */
  totalCustomerFare: number;
  lines: {
    totalCustomerFare: EarningsStatementLine;
    governmentTaxesFees: EarningsStatementLine;
    insuranceOperationalExpenses: EarningsStatementLine;
    customerPromotions: EarningsStatementLine;
    amountPlatformKept: EarningsStatementLine;
    earningsFromFares: EarningsStatementLine;
  };
  /** Always 100% yours, shown separately as on the rider-facing receipt. */
  tips: number;
  /** Bonus categories that are not part of the original fare split. */
  extras: {
    waitTimePay: number;
    cancellationFees: number;
    insurancePremiumsPaid: number;
  };
  yourTotalEarnings: number;
}

export async function getDetailedEarningsStatement(
  driverId: string,
  period: 'day' | 'week' | 'month' | 'all' = 'week',
): Promise<DetailedEarningsStatement> {
  const summary = await getEarningsSummary(driverId, period);

  // Reconstruct the driver's base fare component (before AfriBook's fee
  // was deducted) from the stored totals — see driver-payouts.ts
  // recordEarning() for how totalEarnings is composed.
  const fareComponent = Math.max(
    0,
    summary.totalEarnings -
      summary.tips -
      summary.waitTimePay -
      summary.cancellationFees +
      summary.platformFees +
      summary.insurancePremiums,
  );

  const totalCustomerFare = fareComponent + summary.platformFees;
  const governmentTaxesFees = round2(summary.platformFees * PLATFORM_FEE_BREAKDOWN.governmentFeesShare);
  const insuranceOperationalExpenses = round2(
    summary.platformFees * PLATFORM_FEE_BREAKDOWN.insuranceOperationalShare,
  );
  const amountPlatformKept = round2(
    summary.platformFees - governmentTaxesFees - insuranceOperationalExpenses,
  );
  const customerPromotions = summary.promotionEarnings;

  const base = Math.max(1, totalCustomerFare);
  const pct = (n: number) => Math.round((n / base) * 100);

  return {
    currencyCode: 'USD', // caller may override for display; see /api/ridely/earnings
    tripCount: summary.tripCount,
    totalCustomerFare: round2(totalCustomerFare),
    lines: {
      totalCustomerFare: { label: 'Total customer fare', amount: round2(totalCustomerFare), percentage: 100 },
      governmentTaxesFees: {
        label: 'Government taxes, third-party fees & regulatory charges',
        amount: -governmentTaxesFees,
        percentage: pct(governmentTaxesFees),
      },
      insuranceOperationalExpenses: {
        label: 'Commercial auto insurance & operational expenses',
        amount: -insuranceOperationalExpenses,
        percentage: pct(insuranceOperationalExpenses),
      },
      customerPromotions: {
        label: 'Customer promotions',
        amount: -customerPromotions,
        percentage: pct(customerPromotions),
      },
      amountPlatformKept: {
        label: 'Amount AfriBook kept',
        amount: -amountPlatformKept,
        percentage: pct(amountPlatformKept),
      },
      earningsFromFares: {
        label: 'Your earnings from fares',
        amount: round2(fareComponent),
        percentage: pct(fareComponent),
      },
    },
    tips: round2(summary.tips),
    extras: {
      waitTimePay: round2(summary.waitTimePay),
      cancellationFees: round2(summary.cancellationFees),
      insurancePremiumsPaid: round2(summary.insurancePremiums),
    },
    yourTotalEarnings: round2(summary.totalEarnings),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
