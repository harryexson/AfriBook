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

    const { action, subscriptionId } = await req.json();

    if (action === 'cancel') {
      // Cancel subscription at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      // Update local subscription record
      const subscriptions = await base44.entities.PrimeSubscription.filter({
        user_id: user.id,
        status: 'active'
      });

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.PrimeSubscription.update(subscriptions[0].id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        });
      }

      return Response.json({ 
        success: true,
        message: 'Subscription will be cancelled at period end' 
      });
    }

    if (action === 'reactivate') {
      // Reactivate subscription
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      // Update local subscription record
      const subscriptions = await base44.entities.PrimeSubscription.filter({
        user_id: user.id
      });

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.PrimeSubscription.update(subscriptions[0].id, {
          status: 'active',
          cancelled_at: null
        });
      }

      return Response.json({ 
        success: true,
        message: 'Subscription reactivated' 
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Subscription management error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});