import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log(`[STRIPE] Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const rideId = session.metadata?.ride_id;

        if (rideId) {
          // Payment for a ride
          await base44.asServiceRole.entities.Payment.create({
            ride_id: rideId,
            payer_id: userId,
            payment_type: 'ride_payment',
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            status: 'completed',
            payment_method: {
              type: 'credit_card',
              provider: 'stripe'
            },
            transaction_id: session.payment_intent,
            processed_at: new Date().toISOString()
          });

          // Update ride payment status
          const ride = await base44.asServiceRole.entities.Ride.get(rideId);
          if (ride) {
            await base44.asServiceRole.entities.Ride.update(rideId, {
              fare: {
                ...ride.fare,
                payment_method: 'stripe',
                paid: true
              }
            });
          }

          // Notify user
          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type: 'payment_received',
            title: '✅ Payment Successful',
            message: `Your payment of $${(session.amount_total / 100).toFixed(2)} has been processed successfully.`,
            action_url: `/MyRides`
          });
        } else if (session.metadata?.subscription_type === 'prime') {
          // Prime subscription
          const subscriptionId = session.subscription;
          
          await base44.asServiceRole.entities.PrimeSubscription.create({
            user_id: userId,
            status: 'active',
            started_at: new Date().toISOString(),
            plan_id: 'monthly_9_99'
          });

          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type: 'promotion',
            title: '🌟 Welcome to Ride-ly Prime!',
            message: 'Your Prime subscription is now active. Enjoy unlimited free deliveries and exclusive benefits!',
            action_url: '/Prime'
          });
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          const subs = await base44.asServiceRole.entities.PrimeSubscription.filter({
            user_id: userId,
            status: 'active'
          });

          if (subs.length > 0) {
            const status = subscription.status === 'active' ? 'active' : 
                          subscription.status === 'canceled' ? 'cancelled' : 'pending';
            
            await base44.asServiceRole.entities.PrimeSubscription.update(subs[0].id, {
              status: status,
              cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          const subs = await base44.asServiceRole.entities.PrimeSubscription.filter({
            user_id: userId
          });

          for (const sub of subs) {
            await base44.asServiceRole.entities.PrimeSubscription.update(sub.id, {
              status: 'expired',
              cancelled_at: new Date().toISOString()
            });
          }

          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type: 'promotion',
            title: 'Prime Subscription Ended',
            message: 'Your Ride-ly Prime subscription has been cancelled.',
            action_url: '/Prime'
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.user_id;

        if (userId) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type: 'payment_received',
            title: '❌ Payment Failed',
            message: 'Your payment could not be processed. Please try again or use a different payment method.',
            action_url: '/Profile'
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[STRIPE] Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});