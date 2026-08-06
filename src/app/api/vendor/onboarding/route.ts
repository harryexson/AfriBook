import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createStripeAccountLink, getStripeAccountStatus, getVendorOnboardingStatus } from '@/lib/payments/merchant-onboarding';
import { COUNTRY_PROVIDER_MAP } from '@/lib/payments/types';
import { RazorpayProvider } from '@/lib/payments/providers/razorpay-provider';
import { PaystackProvider } from '@/lib/payments/providers/paystack-provider';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, country_code')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string; country_code: string } | null };

  if (!profile || !['vendor', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only vendors can onboard' }, { status: 403 });
  }

  const body = await req.json();
  const { provider } = body as { provider?: string };

  const countryCode = profile.country_code ?? 'US';
  const availableProviders = COUNTRY_PROVIDER_MAP[countryCode] ?? ['stripe'];
  const selectedProvider = provider ?? availableProviders[0];

  if (!availableProviders.includes(selectedProvider)) {
    return NextResponse.json(
      { error: `Provider ${selectedProvider} not available in ${countryCode}` },
      { status: 400 },
    );
  }

  try {
    let result: { url?: string; status?: Record<string, unknown> };

    switch (selectedProvider) {
      case 'stripe': {
        const link = await createStripeAccountLink(user.id);
        result = { url: link.url };
        break;
      }
      case 'razorpay': {
        const { createRazorpayContact } = await import('@/lib/payments/merchant-onboarding');
        const contact = await createRazorpayContact(user.id);

        const db = await (await import('@/lib/payments/db')).createPaymentDb();
        const { data: wallet } = await db
          .from('vendor_wallets')
          .select('id, metadata')
          .eq('vendor_id', user.id)
          .single() as unknown as { data: { id: string; metadata: Record<string, unknown> } | null };

        if (wallet) {
          await db
            .from('vendor_wallets')
            .update({
              metadata: {
                ...wallet.metadata,
                razorpay_contact_id: contact.id,
              },
            })
            .eq('id', wallet.id);
        }

        result = {
          url: `https://dashboard.razorpay.com/app/contacts/${contact.id}`,
        };
        break;
      }
      case 'paystack': {
        const bankBody = body as { bankCode?: string; accountNumber?: string; accountName?: string };
        if (!bankBody.bankCode || !bankBody.accountNumber || !bankBody.accountName) {
          return NextResponse.json(
            { error: 'bankCode, accountNumber, and accountName required for Paystack' },
            { status: 400 },
          );
        }

        const { createPaystackRecipient } = await import('@/lib/payments/merchant-onboarding');
        const recipient = await createPaystackRecipient(
          user.id,
          bankBody.bankCode,
          bankBody.accountNumber,
          bankBody.accountName,
        );

        const db = await (await import('@/lib/payments/db')).createPaymentDb();
        await db
          .from('vendor_wallets')
          .update({
            metadata: { paystack_recipient_code: (recipient as { recipient_code?: string }).recipient_code },
          })
          .eq('vendor_id', user.id);

        result = { url: undefined, status: { message: 'Paystack recipient created' } };
        break;
      }
      default:
        return NextResponse.json({ error: `Unsupported provider: ${selectedProvider}` }, { status: 400 });
    }

    return NextResponse.json({ provider: selectedProvider, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onboarding failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') ?? 'stripe';

  try {
    let status: { provider?: string; onboarded: boolean; details: Record<string, unknown> };

    switch (provider) {
      case 'stripe': {
        const stripeStatus = await getStripeAccountStatus(user.id);
        status = {
          provider: 'stripe',
          onboarded: stripeStatus.detailsSubmitted && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled,
          details: stripeStatus as unknown as Record<string, unknown>,
        };
        break;
      }
      case 'razorpay':
      case 'paystack': {
        const allStatus = await getVendorOnboardingStatus(user.id);
        status = allStatus[provider] ?? { onboarded: false, details: {} };
        status.provider = provider;
        break;
      }
      default: {
        const allStatus = await getVendorOnboardingStatus(user.id);
        return NextResponse.json(allStatus);
      }
    }

    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get onboarding status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
