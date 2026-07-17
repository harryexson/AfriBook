import { createPaymentDb } from './db';
import type {
  StripeAccountLink,
  StripeAccountStatus,
  RazorpayContact,
  PaystackRecipient,
} from './types';
import { COUNTRY_PROVIDER_MAP } from './types';
import { StripeProvider } from './providers/stripe-provider';
import { RazorpayProvider } from './providers/razorpay-provider';
import { PaystackProvider } from './providers/paystack-provider';
import { AirwallexProvider } from './providers/airwallex-provider';
import { PawaPayProvider } from './providers/pawapay-provider';

// ─── Merchant / Vendor Onboarding ─────────────────────────────
// Handles Stripe Connect, Razorpay, and Paystack vendor onboarding
// for receiving payouts from the platform.
// ──────────────────────────────────────────────────────────────

// ─── Stripe Connect Onboarding ────────────────────────────────

/**
 * Create a Stripe Account Link for a vendor to complete onboarding.
 * Returns a URL the vendor should visit to submit their details.
 */
export async function createStripeAccountLink(
  vendorId: string,
): Promise<StripeAccountLink> {
  const db = await createPaymentDb();

  // 1. Get or create the Stripe connected account
  const walletResult = await db
    .from('vendor_wallets')
    .select('metadata, vendor_id')
    .eq('vendor_id', vendorId)
    .single();
  const wallet = walletResult.data as Record<string, unknown> | null;

  if (!wallet) {
    throw new Error(
      `Vendor wallet not found for ${vendorId}. Ensure the vendor has a wallet.`,
    );
  }

  const metadata = (wallet.metadata ?? {}) as Record<string, unknown>;
  let stripeAccountId = metadata.stripe_account_id as string | undefined;

  // 2. If no account exists, create one
  if (!stripeAccountId) {
    const stripe = new StripeProvider();

    // Get vendor profile for email
    const profileResult = await db
      .from('profiles')
      .select('email, full_name')
      .eq('id', vendorId)
      .single();
    const profile = profileResult.data as { email: string; full_name: string } | null;

    if (!profile?.email) {
      throw new Error(`Vendor profile or email not found for ${vendorId}.`);
    }

    stripeAccountId = await stripe.createConnectedAccount(
      vendorId,
      profile.email,
    );
  }

  // 3. Create an account link
  const stripe = new StripeProvider();
  const link = await stripe.createAccountLink(vendorId, stripeAccountId);

  return link;
}

/**
 * Get the current Stripe onboarding status for a vendor.
 */
export async function getStripeAccountStatus(
  vendorId: string,
): Promise<StripeAccountStatus> {
  const db = await createPaymentDb();

  const walletResult = await db
    .from('vendor_wallets')
    .select('metadata')
    .eq('vendor_id', vendorId)
    .single();
  const wallet = walletResult.data as { metadata: Record<string, unknown> } | null;

  const metadata = (wallet?.metadata ?? {}) as Record<string, unknown>;
  const stripeAccountId = metadata.stripe_account_id as string | undefined;

  if (!stripeAccountId) {
    return {
      accountId: '',
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      currentlyDue: [],
      eventuallyDue: [],
    };
  }

  const stripe = new StripeProvider();
  return stripe.getAccountStatus(stripeAccountId);
}

// ─── Razorpay Onboarding ──────────────────────────────────────

/**
 * Create a Razorpay contact for a vendor.
 */
export async function createRazorpayContact(
  vendorId: string,
): Promise<RazorpayContact> {
  const db = await createPaymentDb();

  // Get vendor profile
  const profileResult = await db
    .from('profiles')
    .select('email, full_name, phone')
    .eq('id', vendorId)
    .single();
  const profile = profileResult.data as {
    email: string;
    full_name: string;
    phone: string;
  } | null;

  if (!profile) {
    throw new Error(`Vendor profile not found for ${vendorId}.`);
  }

  const razorpay = new RazorpayProvider();
  return razorpay.createContact(
    vendorId,
    profile.full_name ?? 'Vendor',
    profile.email,
    profile.phone ?? '',
  );
}

// ─── Paystack Onboarding ──────────────────────────────────────

/**
 * Create a Paystack transfer recipient for a vendor.
 */
export async function createPaystackRecipient(
  vendorId: string,
  bankCode: string,
  accountNumber: string,
  accountName: string,
  currency: string = 'NGN',
): Promise<PaystackRecipient> {
  const paystack = new PaystackProvider();
  return paystack.createRecipient(
    vendorId,
    {
      accountName,
      accountNumber,
      bankCode,
      bankName: '',
    },
    currency,
  );
}

// ─── Generic Onboarding ───────────────────────────────────────

/**
 * Get the onboarding status for a vendor across all configured providers.
 * Returns a map of provider → onboarding status.
 */
export async function getVendorOnboardingStatus(
  vendorId: string,
): Promise<Record<string, { onboarded: boolean; details: Record<string, unknown> }>> {
  const db = await createPaymentDb();
  const status: Record<string, { onboarded: boolean; details: Record<string, unknown> }> = {};

  // Get vendor's country
  const businessResult = await db
    .from('businesses')
    .select('country_code')
    .eq('owner_id', vendorId)
    .single();
  const business = businessResult.data as { country_code: string } | null;
  void business; // used for future country-specific logic

  // Get wallet metadata
  const walletResult = await db
    .from('vendor_wallets')
    .select('metadata')
    .eq('vendor_id', vendorId)
    .single();
  const wallet = walletResult.data as { metadata: Record<string, unknown> } | null;

  const metadata = (wallet?.metadata ?? {}) as Record<string, unknown>;

  // Stripe status
  if (metadata.stripe_account_id) {
    try {
      const stripeStatus = await getStripeAccountStatus(vendorId);
      status.stripe = {
        onboarded:
          stripeStatus.detailsSubmitted &&
          stripeStatus.chargesEnabled &&
          stripeStatus.payoutsEnabled,
        details: stripeStatus as unknown as Record<string, unknown>,
      };
    } catch {
      status.stripe = { onboarded: false, details: {} };
    }
  } else {
    status.stripe = { onboarded: false, details: {} };
  }

  // Razorpay status
  if (metadata.razorpay_contact_id) {
    status.razorpay = {
      onboarded: true,
      details: { contactId: metadata.razorpay_contact_id },
    };
  } else {
    status.razorpay = { onboarded: false, details: {} };
  }

  // Paystack status
  if (metadata.paystack_recipient_code) {
    status.paystack = {
      onboarded: true,
      details: { recipientCode: metadata.paystack_recipient_code },
    };
  } else {
    status.paystack = { onboarded: false, details: {} };
  }

  return status;
}

// ─── Airwallex Onboarding (Global payouts) ───────────────────

/**
 * Create an Airwallex beneficiary for a vendor so they can receive payouts.
 */
export async function createAirwallexBeneficiary(
  vendorId: string,
  destination: Parameters<AirwallexProvider['createBeneficiary']>[1],
): Promise<string> {
  const airwallex = new AirwallexProvider();
  return airwallex.createBeneficiary(vendorId, destination);
}

// ─── PawaPay Onboarding (Africa mobile-money payouts) ─────────

/**
 * Persist a vendor's mobile-money payout destination for PawaPay.
 */
export async function createPawaPayRecipient(
  vendorId: string,
  destination: Parameters<PawaPayProvider['createRecipient']>[1],
): Promise<string> {
  const pawapay = new PawaPayProvider();
  return pawapay.createRecipient(vendorId, destination);
}

/**
 * Get the default provider for a vendor based on their country.
 */
export function getDefaultProviderForVendor(
  countryCode: string,
): string {
  const providers = COUNTRY_PROVIDER_MAP[countryCode];
  return providers?.[0] ?? 'stripe';
}
