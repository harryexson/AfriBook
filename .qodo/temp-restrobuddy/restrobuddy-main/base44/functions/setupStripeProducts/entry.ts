import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    console.log('[Setup] Starting Stripe products setup...');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      console.error('[Setup] Unauthorized access attempt');
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    console.log('[Setup] Admin user verified:', user.email);
    
    const products = [];

    // Starter Plan
    console.log('[Setup] Creating Starter plan...');
    const starterProduct = await stripe.products.create({
      name: 'RESTROBUDDY Starter',
      description: 'Perfect for single-location restaurants',
      metadata: {
        plan: 'starter',
        app: 'restrobuddy'
      }
    });
    console.log('[Setup] Starter product created:', starterProduct.id);

    const starterMonthly = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 9900, // $99
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'starter', billing_cycle: 'monthly' }
    });
    console.log('[Setup] Starter monthly price created:', starterMonthly.id);

    const starterAnnual = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 95000, // $950
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: 'starter', billing_cycle: 'annual' }
    });
    console.log('[Setup] Starter annual price created:', starterAnnual.id);

    products.push({
      plan: 'starter',
      product_id: starterProduct.id,
      monthly_price_id: starterMonthly.id,
      annual_price_id: starterAnnual.id
    });

    // Professional Plan
    console.log('[Setup] Creating Professional plan...');
    const proProduct = await stripe.products.create({
      name: 'RESTROBUDDY Professional',
      description: 'Most popular for growing restaurants',
      metadata: {
        plan: 'professional',
        app: 'restrobuddy'
      }
    });
    console.log('[Setup] Professional product created:', proProduct.id);

    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 29900, // $299
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'professional', billing_cycle: 'monthly' }
    });
    console.log('[Setup] Professional monthly price created:', proMonthly.id);

    const proAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 286800, // $2868
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: 'professional', billing_cycle: 'annual' }
    });
    console.log('[Setup] Professional annual price created:', proAnnual.id);

    products.push({
      plan: 'professional',
      product_id: proProduct.id,
      monthly_price_id: proMonthly.id,
      annual_price_id: proAnnual.id
    });

    // Enterprise Plan
    console.log('[Setup] Creating Enterprise plan...');
    const enterpriseProduct = await stripe.products.create({
      name: 'RESTROBUDDY Enterprise',
      description: 'For multi-location restaurants',
      metadata: {
        plan: 'enterprise',
        app: 'restrobuddy'
      }
    });
    console.log('[Setup] Enterprise product created:', enterpriseProduct.id);

    const enterpriseMonthly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 59900, // $599
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'enterprise', billing_cycle: 'monthly' }
    });
    console.log('[Setup] Enterprise monthly price created:', enterpriseMonthly.id);

    const enterpriseAnnual = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 574800, // $5748
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: 'enterprise', billing_cycle: 'annual' }
    });
    console.log('[Setup] Enterprise annual price created:', enterpriseAnnual.id);

    products.push({
      plan: 'enterprise',
      product_id: enterpriseProduct.id,
      monthly_price_id: enterpriseMonthly.id,
      annual_price_id: enterpriseAnnual.id
    });

    console.log('[Setup] All products and prices created successfully!');

    return Response.json({
      success: true,
      message: 'Products and prices created successfully!',
      products: products
    });

  } catch (error) {
    console.error('[Setup] ERROR:', error);
    console.error('[Setup] Error details:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    return Response.json({ 
      error: error.message,
      type: error.type || 'unknown',
      details: error.code || 'no_code'
    }, { status: 500 });
  }
});