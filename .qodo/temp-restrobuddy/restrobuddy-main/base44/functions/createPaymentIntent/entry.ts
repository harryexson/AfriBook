import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Optional: authenticate if you want to track which user/employee initiated payment
    // For kiosk mode, authentication might be optional
    const isAuth = await base44.auth.isAuthenticated();
    
    const { amount, currency = 'usd', customerEmail, customerName, orderId } = await req.json();
    
    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create payment intent for Stripe Payment Element (supports Apple Pay, Google Pay, cards)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true, // Enables Apple Pay, Google Pay, cards automatically
      },
      metadata: {
        order_id: orderId || '',
        customer_name: customerName || '',
        customer_email: customerEmail || '',
      },
      receipt_email: customerEmail || null,
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});