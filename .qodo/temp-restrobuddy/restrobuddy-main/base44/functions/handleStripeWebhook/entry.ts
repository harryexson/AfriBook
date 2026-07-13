import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"), {
  apiVersion: '2024-12-18.acacia',
});

// Helper to check notification preferences and send email
async function sendNotificationEmail(base44, userEmail, type, subject, body) {
  try {
    // Check user's notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPreferences.filter({ user_email: userEmail });
    
    // If no preferences exist, create default (all enabled)
    if (prefs.length === 0) {
      await base44.asServiceRole.entities.NotificationPreferences.create({
        user_email: userEmail,
        welcome_emails: true,
        payment_confirmations: true,
        payment_failures: true,
        renewal_reminders: true,
        subscription_updates: true
      });
    }
    
    const pref = prefs[0] || { [type]: true };
    
    // Only send if preference is enabled
    if (pref[type]) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'RESTROBUDDY',
        to: userEmail,
        subject: subject,
        body: body
      });
      console.log(`[Email] Sent ${type} email to ${userEmail}`);
    } else {
      console.log(`[Email] Skipped ${type} email - user preference disabled`);
    }
  } catch (error) {
    console.error(`[Email] Failed to send ${type} email:`, error);
  }
}

Deno.serve(async (req) => {
  try {
    // Get raw body for signature validation
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Validate webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Initialize Base44 client with service role (webhooks don't have user context)
    const base44 = createClientFromRequest(req);

    console.log('Processing webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email || session.metadata?.customer_email;
        const restaurantId = session.metadata?.restaurant_id;

        if (!customerEmail) {
          console.error('No customer email in checkout session');
          break;
        }

        // Get subscription details
        const subscriptionId = session.subscription;
        const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;

        if (subscription) {
          const plan = session.metadata?.plan || 'starter';
          const billingCycle = session.metadata?.billing_cycle || 'monthly';

          // Create or update subscription in database
          const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
            owner_email: customerEmail
          });

          const currency = session.metadata?.currency || subscription.currency || 'USD';
          const subscriptionData = {
            restaurant_id: restaurantId,
            owner_email: customerEmail,
            plan: plan,
            billing_cycle: billingCycle,
            status: 'active',
            currency: currency.toUpperCase(),
            start_date: new Date().toISOString().split('T')[0],
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
            mrr: billingCycle === 'monthly' ? subscription.items.data[0].price.unit_amount / 100 : 
                 (subscription.items.data[0].price.unit_amount / 100) / 12,
            payment_method_last4: session.payment_method_details?.card?.last4 || null
          };

          if (existingSubscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(
              existingSubscriptions[0].id,
              subscriptionData
            );
          } else {
            await base44.asServiceRole.entities.Subscription.create(subscriptionData);
          }

          console.log('Subscription activated for:', customerEmail);

          // Send welcome email
          const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
          const restaurantName = session.metadata?.restaurant_name || 'Your Restaurant';
          await sendNotificationEmail(
            base44,
            customerEmail,
            'welcome_emails',
            `Welcome to RESTROBUDDY ${planName}!`,
            `<h2>Welcome to RESTROBUDDY!</h2>
            <p>Thank you for subscribing to our ${planName} plan.</p>
            <p><strong>Your subscription details:</strong></p>
            <ul>
              <li>Plan: ${planName}</li>
              <li>Billing: ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}</li>
              <li>Restaurant: ${restaurantName}</li>
            </ul>
            <p>You can now access all features of your plan. Visit your dashboard to get started!</p>
            <p><a href="https://restrobudyy.app/AdminDashboard" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Go to Dashboard</a></p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br/>The RESTROBUDDY Team</p>`
          );
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;

        if (customerEmail) {
          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            owner_email: customerEmail
          });

          if (subscriptions.length > 0) {
            const sub = subscriptions[0];
            await base44.asServiceRole.entities.Subscription.update(sub.id, {
              status: 'active',
              total_paid: (sub.total_paid || 0) + (invoice.amount_paid / 100),
              next_billing_date: invoice.lines.data[0]?.period?.end 
                ? new Date(invoice.lines.data[0].period.end * 1000).toISOString().split('T')[0]
                : sub.next_billing_date
            });

            console.log('Payment recorded for:', customerEmail);

            // Send payment confirmation email
            await sendNotificationEmail(
              base44,
              customerEmail,
              'payment_confirmations',
              'Payment Confirmation - RESTROBUDDY',
              `<h2>Payment Received</h2>
              <p>Thank you! Your payment has been processed successfully.</p>
              <p><strong>Payment Details:</strong></p>
              <ul>
                <li>Amount: $${(invoice.amount_paid / 100).toFixed(2)}</li>
                <li>Date: ${new Date(invoice.created * 1000).toLocaleDateString()}</li>
                <li>Invoice: ${invoice.number || invoice.id}</li>
              </ul>
              <p>Your subscription is active and all features are available.</p>
              <p><a href="https://restrobudyy.app/AdminDashboard">View Dashboard</a></p>
              <p>Thank you for choosing RESTROBUDDY!</p>`
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;

        if (customerEmail) {
          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            owner_email: customerEmail
          });

          if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
              status: 'past_due',
              suspension_reason: 'Payment failed - please update payment method'
            });

            console.log('Payment failed for:', customerEmail);

            // Send payment failure notification
            await sendNotificationEmail(
              base44,
              customerEmail,
              'payment_failures',
              'Payment Failed - Action Required',
              `<h2>Payment Failed</h2>
              <p>We were unable to process your payment for your RESTROBUDDY subscription.</p>
              <p><strong>Details:</strong></p>
              <ul>
                <li>Amount: $${(invoice.amount_due / 100).toFixed(2)}</li>
                <li>Invoice: ${invoice.number || invoice.id}</li>
                <li>Status: Payment failed</li>
              </ul>
              <p><strong>What happens next:</strong></p>
              <p>Please update your payment method to avoid service interruption. Your subscription will remain active for a grace period while we retry payment.</p>
              <p><a href="https://restrobudyy.app/SubscriptionManagement" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Update Payment Method</a></p>
              <p>If you have questions, please contact our support team.</p>`
            );
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const customerEmail = customer.email;

        if (customerEmail) {
          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            owner_email: customerEmail
          });

          if (subscriptions.length > 0) {
            const status = subscription.status === 'active' ? 'active' :
                          subscription.status === 'past_due' ? 'past_due' :
                          subscription.status === 'canceled' ? 'cancelled' : 'suspended';

            await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
              status: status,
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
            });

            console.log('Subscription updated for:', customerEmail);

            // Send renewal reminder if status changed to active (renewal)
            if (subscription.status === 'active') {
              const nextBilling = new Date(subscription.current_period_end * 1000);
              await sendNotificationEmail(
                base44,
                customerEmail,
                'renewal_reminders',
                'Subscription Renewed - RESTROBUDDY',
                `<h2>Subscription Renewed</h2>
                <p>Your RESTROBUDDY subscription has been renewed successfully.</p>
                <p><strong>Subscription Details:</strong></p>
                <ul>
                  <li>Next billing date: ${nextBilling.toLocaleDateString()}</li>
                  <li>Status: Active</li>
                </ul>
                <p>Thank you for continuing with RESTROBUDDY!</p>
                <p><a href="https://restrobudyy.app/AdminDashboard">Go to Dashboard</a></p>`
              );
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const customerEmail = customer.email;

        if (customerEmail) {
          const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            owner_email: customerEmail
          });

          if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
              status: 'cancelled',
              cancellation_date: new Date().toISOString().split('T')[0]
            });

            console.log('Subscription cancelled for:', customerEmail);
          }
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});