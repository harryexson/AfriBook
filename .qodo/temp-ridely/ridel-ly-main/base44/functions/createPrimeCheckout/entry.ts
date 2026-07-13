import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();
    
    if (!planId || !['monthly_9_99', 'yearly_99_99'].includes(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Ensure Prime products exist in Stripe and get price IDs
    const productsResult = await base44.functions.invoke('ensurePrimeProducts', {});
    
    if (!productsResult.data?.success) {
      return Response.json({ error: 'Failed to setup products' }, { status: 500 });
    }

    const priceId = productsResult.data.priceIds[planId];
    
    if (!priceId) {
      return Response.json({ error: 'Price not found' }, { status: 500 });
    }

    // Get app URL from environment
    const appUrl = req.headers.get('origin') || 'https://app.base44.com';

    // Create or get Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          app_type: 'ridely'
        }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/PrimeSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Prime?cancelled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId
        }
      }
    });

    return Response.json({ 
      success: true,
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});