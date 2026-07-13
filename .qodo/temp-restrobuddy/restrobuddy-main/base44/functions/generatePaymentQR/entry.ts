import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { amount, currency = 'usd', orderId, customerName } = await req.json();
    
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create a payment link for QR code
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `Order #${orderId || 'NEW'}`,
              description: customerName ? `Order for ${customerName}` : 'Kiosk Order',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: orderId || '',
        customer_name: customerName || '',
        payment_type: 'qr_code',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin')}/kiosk-mode?payment=success&order=${orderId}`,
        },
      },
    });

    return Response.json({
      url: paymentLink.url,
      qrCode: paymentLink.url, // Frontend will convert this URL to QR code
      paymentLinkId: paymentLink.id,
    });
  } catch (error) {
    console.error('QR payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});