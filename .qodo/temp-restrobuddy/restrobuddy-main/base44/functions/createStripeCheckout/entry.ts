import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

const PLAN_CONFIG = {
  starter: {
    name: 'RESTROBUDDY Starter',
    description: 'Perfect for single-location restaurants',
    prices: {
      USD: { monthly: 9900, annual: 95000 },
      CAD: { monthly: 12900, annual: 125000 },
      EUR: { monthly: 8900, annual: 85000 },
      GBP: { monthly: 7900, annual: 75000 }
    }
  },
  professional: {
    name: 'RESTROBUDDY Professional',
    description: 'Most popular for growing restaurants',
    prices: {
      USD: { monthly: 29900, annual: 286800 },
      CAD: { monthly: 38900, annual: 375000 },
      EUR: { monthly: 26900, annual: 258000 },
      GBP: { monthly: 23900, annual: 229000 }
    }
  },
  enterprise: {
    name: 'RESTROBUDDY Enterprise',
    description: 'For multi-location restaurants',
    prices: {
      USD: { monthly: 59900, annual: 574800 },
      CAD: { monthly: 77900, annual: 750000 },
      EUR: { monthly: 53900, annual: 517000 },
      GBP: { monthly: 47900, annual: 459000 }
    }
  }
};

// Find or create product and price automatically
async function getOrCreatePrice(plan, billingCycle, currency = 'USD') {
  const config = PLAN_CONFIG[plan];
  const interval = billingCycle === 'annual' ? 'year' : 'month';
  const amount = config.prices[currency][billingCycle];
  
  console.log('[getOrCreatePrice] Looking for:', { plan, billingCycle, currency, amount });
  
  try {
    // Search for existing product
    const products = await stripe.products.list({ active: true, limit: 100 });
    let product = products.data.find(p => p.name === config.name);
    
    // Create product if not found
    if (!product) {
      console.log('[getOrCreatePrice] Creating product:', config.name);
      product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: { app: 'restrobuddy', plan }
      });
      console.log('[getOrCreatePrice] Created product:', product.id);
    } else {
      console.log('[getOrCreatePrice] Found existing product:', product.id);
    }
    
    // Search for existing price
    const prices = await stripe.prices.list({ 
      product: product.id,
      active: true,
      limit: 20
    });
    
    let price = prices.data.find(p => 
      p.recurring?.interval === interval &&
      p.unit_amount === amount
    );
    
    // Create price if not found
    if (!price) {
      console.log('[getOrCreatePrice] Creating price:', { interval, amount, currency });
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: currency.toLowerCase(),
        recurring: { interval },
        metadata: { plan, billing_cycle: billingCycle, currency }
      });
      console.log('[getOrCreatePrice] Created price:', price.id);
    } else {
      console.log('[getOrCreatePrice] Found existing price:', price.id);
    }
    
    return price.id;
    
  } catch (error) {
    // If permission error, provide helpful message
    if (error.type === 'StripePermissionError') {
      console.error('[getOrCreatePrice] Permission error - restricted API key');
      throw new Error(
        'Your Stripe API key has restricted permissions. ' +
        'Please either: (1) Use a full secret key (sk_test_...), or ' +
        '(2) Manually create products in Stripe Dashboard. ' +
        'Visit /StripeSetupGuide for detailed instructions.'
      );
    }
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    console.log('[Checkout] Starting checkout request...');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    console.log('[Checkout] User authenticated:', user?.email);

    if (!user) {
      console.error('[Checkout] No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[Checkout] Request body:', JSON.stringify(body));

    const { plan, billingCycle, restaurantId, restaurantName, currency = 'USD' } = body;

    const validPlans = ['starter', 'professional', 'enterprise'];
    const validCycles = ['monthly', 'annual'];
    
    if (!plan || !billingCycle) {
      console.error('[Checkout] Missing required fields:', { plan, billingCycle });
      return Response.json({ error: 'Missing plan or billing cycle' }, { status: 400 });
    }

    if (!validPlans.includes(plan)) {
      console.error('[Checkout] Invalid plan:', plan);
      return Response.json({ error: `Invalid plan: ${plan}. Valid plans are: ${validPlans.join(', ')}` }, { status: 400 });
    }
    
    if (!validCycles.includes(billingCycle)) {
      console.error('[Checkout] Invalid billing cycle:', billingCycle);
      return Response.json({ error: `Invalid billing cycle: ${billingCycle}. Valid cycles are: ${validCycles.join(', ')}` }, { status: 400 });
    }

    console.log('[Checkout] Getting or creating price for:', { plan, billingCycle, currency });

    // Get or create the price for this plan and currency
    const priceId = await getOrCreatePrice(plan, billingCycle, currency);
    console.log('[Checkout] Price ID obtained:', priceId);

    console.log('[Checkout] Looking up customer:', user.email);
    
    // Create or retrieve customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log('[Checkout] Found existing customer:', customer.id);
    } else {
      console.log('[Checkout] Creating new customer...');
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          restaurant_id: restaurantId || '',
          restaurant_name: restaurantName || ''
        }
      });
      console.log('[Checkout] Created customer:', customer.id);
    }

    // Determine the base URL from the request origin or use a default
    const origin = req.headers.get('origin') || 'https://restrobudyy.app';
    console.log('[Checkout] Using origin for redirects:', origin);

    console.log('[Checkout] Creating Stripe checkout session...');
    
    // Create checkout session with pre-configured price ID
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${origin}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/Pricing`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan: plan,
        billing_cycle: billingCycle,
        restaurant_id: restaurantId || '',
        restaurant_name: restaurantName || '',
        currency: currency
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
          billing_cycle: billingCycle,
          restaurant_id: restaurantId || ''
        }
      }
    });

    console.log('[Checkout] Session created successfully:', session.id);
    console.log('[Checkout] Checkout URL:', session.url);

    return Response.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('[Checkout] ERROR:', error);
    console.error('[Checkout] Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    return Response.json({ 
      error: error.message,
      type: error.type || 'unknown',
      details: error.code || 'no_code'
    }, { status: 500 });
  }
});