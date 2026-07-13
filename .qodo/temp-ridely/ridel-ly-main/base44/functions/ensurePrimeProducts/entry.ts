import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Search for existing Prime products
    const products = await stripe.products.search({
      query: 'metadata["app"]:"ride-ly" AND metadata["type"]:"prime"',
      limit: 10
    });

    let monthlyPriceId = null;
    let yearlyPriceId = null;

    // Check if products already exist
    for (const product of products.data) {
      if (product.metadata.plan === 'monthly') {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        if (prices.data.length > 0) {
          monthlyPriceId = prices.data[0].id;
        }
      } else if (product.metadata.plan === 'yearly') {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        if (prices.data.length > 0) {
          yearlyPriceId = prices.data[0].id;
        }
      }
    }

    // Create monthly product if it doesn't exist
    if (!monthlyPriceId) {
      const monthlyProduct = await stripe.products.create({
        name: 'Ride-ly Prime - Monthly',
        description: '20% off all rides, priority driver matching, free food delivery, and 24/7 priority support',
        metadata: {
          app: 'ride-ly',
          type: 'prime',
          plan: 'monthly'
        }
      });

      const monthlyPrice = await stripe.prices.create({
        product: monthlyProduct.id,
        unit_amount: 999, // $9.99
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          app: 'ride-ly',
          type: 'prime',
          plan: 'monthly'
        }
      });

      monthlyPriceId = monthlyPrice.id;
      console.log('Created monthly Prime product:', monthlyPriceId);
    }

    // Create yearly product if it doesn't exist
    if (!yearlyPriceId) {
      const yearlyProduct = await stripe.products.create({
        name: 'Ride-ly Prime - Annual',
        description: '20% off all rides, priority driver matching, free food delivery, and 24/7 priority support. Save 20% with annual billing!',
        metadata: {
          app: 'ride-ly',
          type: 'prime',
          plan: 'yearly'
        }
      });

      const yearlyPrice = await stripe.prices.create({
        product: yearlyProduct.id,
        unit_amount: 9999, // $99.99
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          app: 'ride-ly',
          type: 'prime',
          plan: 'yearly'
        }
      });

      yearlyPriceId = yearlyPrice.id;
      console.log('Created yearly Prime product:', yearlyPriceId);
    }

    return Response.json({
      success: true,
      priceIds: {
        monthly_9_99: monthlyPriceId,
        yearly_99_99: yearlyPriceId
      }
    });

  } catch (error) {
    console.error('Error ensuring Prime products:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});