import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_PRIME');

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  try {
    const base44 = createClientFromRequest(req);
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Prime webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          const userId = session.metadata.user_id;
          const planId = session.metadata.plan_id;
          const subscriptionId = session.subscription;

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Create or update PrimeSubscription
          const existing = await base44.asServiceRole.entities.PrimeSubscription.filter({
            user_id: userId
          });

          if (existing.length > 0) {
            await base44.asServiceRole.entities.PrimeSubscription.update(existing[0].id, {
              status: 'active',
              started_at: new Date(subscription.current_period_start * 1000).toISOString(),
              renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
              plan_id: planId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer
            });
          } else {
            await base44.asServiceRole.entities.PrimeSubscription.create({
              user_id: userId,
              status: 'active',
              started_at: new Date(subscription.current_period_start * 1000).toISOString(),
              renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
              plan_id: planId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer
            });
          }

          // Update user to mark as Prime member
          await base44.asServiceRole.entities.User.update(userId, {
            is_prime_member: true
          });

          // Send welcome notification
          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type: 'promotion',
            title: '🌟 Welcome to Ride-ly Prime!',
            message: 'Your Prime membership is now active. Enjoy discounted rides and priority booking!',
            action_url: '/Prime'
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;

        if (userId) {
          const subscriptions = await base44.asServiceRole.entities.PrimeSubscription.filter({
            user_id: userId,
            stripe_subscription_id: subscription.id
          });

          if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.PrimeSubscription.update(subscriptions[0].id, {
              status: subscription.status === 'active' ? 'active' : subscription.cancel_at_period_end ? 'cancelled' : 'active',
              renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
              cancelled_at: subscription.cancel_at_period_end ? new Date().toISOString() : null
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;

        if (userId) {
          const subscriptions = await base44.asServiceRole.entities.PrimeSubscription.filter({
            user_id: userId,
            stripe_subscription_id: subscription.id
          });

          if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.PrimeSubscription.update(subscriptions[0].id, {
              status: 'expired',
              cancelled_at: new Date().toISOString()
            });
          }

          // Update user to remove Prime status
          await base44.asServiceRole.entities.User.update(userId, {
            is_prime_member: false
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata.user_id;

          if (userId) {
            const subscriptions = await base44.asServiceRole.entities.PrimeSubscription.filter({
              user_id: userId,
              stripe_subscription_id: subscriptionId
            });

            if (subscriptions.length > 0) {
              await base44.asServiceRole.entities.PrimeSubscription.update(subscriptions[0].id, {
                status: 'active',
                renews_at: new Date(subscription.current_period_end * 1000).toISOString()
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata.user_id;

          if (userId) {
            // Notify user about failed payment
            await base44.asServiceRole.entities.Notification.create({
              user_id: userId,
              type: 'promotion',
              title: '⚠️ Prime Payment Failed',
              message: 'Your Prime subscription payment failed. Please update your payment method.',
              action_url: '/Prime'
            });
          }
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 400 });
  }
});