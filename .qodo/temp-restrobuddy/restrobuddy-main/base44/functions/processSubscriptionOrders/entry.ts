import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role for automated processing
    const subscriptions = await base44.asServiceRole.entities.CustomerSubscription.list();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersCreated = [];
    const errors = [];

    for (const sub of subscriptions) {
      // Skip if not active or paused
      if (sub.status !== 'active') continue;

      // Check if it's time for next delivery
      const nextDelivery = new Date(sub.next_delivery_date);
      nextDelivery.setHours(0, 0, 0, 0);
      
      if (nextDelivery > today) continue;

      try {
        // Get plan details
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.list();
        const plan = plans.find(p => p.id === sub.plan_id);
        
        if (!plan) {
          errors.push({ subscription_id: sub.id, error: 'Plan not found' });
          continue;
        }

        // Create order
        const order = await base44.asServiceRole.entities.Order.create({
          customer_name: sub.customer_name,
          customer_phone: sub.customer_phone,
          customer_email: sub.customer_email,
          items: (sub.customized_items || plan.included_items || []).map(item => ({
            menu_item_id: item.menu_item_id,
            name: item.name,
            quantity: item.quantity || 1,
            price: 0 // Included in subscription
          })),
          total_amount: 0, // Already paid via subscription
          status: 'confirmed',
          payment_status: 'completed',
          order_type: 'subscription',
          delivery_type: plan.delivery_type,
          delivery_address: sub.delivery_address,
          special_requests: `Subscription Order - ${plan.name}`,
          subscription_id: sub.id
        });

        ordersCreated.push({
          subscription_id: sub.id,
          order_id: order.id,
          customer: sub.customer_name
        });

        // Calculate next delivery date
        let nextDate = new Date(nextDelivery);
        if (plan.delivery_frequency === 'daily') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (plan.delivery_frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (plan.delivery_frequency === 'biweekly') {
          nextDate.setDate(nextDate.getDate() + 14);
        } else if (plan.delivery_frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Update subscription
        await base44.asServiceRole.entities.CustomerSubscription.update(sub.id, {
          next_delivery_date: nextDate.toISOString().split('T')[0],
          last_order_date: today.toISOString().split('T')[0],
          total_orders: (sub.total_orders || 0) + 1
        });

        // Send notification
        try {
          await base44.functions.invoke('sendOrderStatusNotification', {
            order_id: order.id,
            status: 'confirmed',
            customer_phone: sub.customer_phone,
            customer_email: sub.customer_email,
            customer_name: sub.customer_name
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }

      } catch (error) {
        console.error(`Error processing subscription ${sub.id}:`, error);
        errors.push({
          subscription_id: sub.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      orders_created: ordersCreated.length,
      details: ordersCreated,
      errors: errors.length > 0 ? errors : undefined,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Subscription processing error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process subscriptions' 
    }, { status: 500 });
  }
});