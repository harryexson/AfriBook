import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Get the order
    const orders = await base44.asServiceRole.entities.Order.filter({});
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find associated group order
    const groupOrders = await base44.asServiceRole.entities.GroupOrder.filter({});
    const groupOrder = groupOrders.find(g => g.order_id === orderId);

    if (!groupOrder) {
      return Response.json({ error: 'No group order associated with this order' }, { status: 404 });
    }

    // Map order status to group order status
    const statusMap = {
      'pending': 'confirmed',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'ready': 'ready',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };

    const newStatus = statusMap[order.status] || 'submitted';
    const oldStatus = groupOrder.status;

    // Only update if status changed
    if (newStatus === oldStatus) {
      return Response.json({ success: true, message: 'No status change' });
    }

    // Update group order
    const updateData = {
      status: newStatus,
      order_status: order.status,
      status_history: [
        ...(groupOrder.status_history || []),
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          notes: `Order status updated to ${order.status}`
        }
      ],
      activity_log: [
        ...(groupOrder.activity_log || []),
        {
          timestamp: new Date().toISOString(),
          action: 'status_updated',
          user_name: 'System',
          user_email: '',
          details: `Order status changed from ${oldStatus} to ${newStatus}`
        }
      ]
    };

    // Add timing info if available
    if (order.estimated_ready_time) {
      updateData.estimated_ready_time = order.estimated_ready_time;
    }
    if (order.estimated_delivery_time) {
      updateData.estimated_delivery_time = order.estimated_delivery_time;
    }
    if (order.actual_delivery_time) {
      updateData.actual_delivery_time = order.actual_delivery_time;
    }
    if (order.driver_name || order.driver_phone) {
      updateData.driver_info = {
        name: order.driver_name,
        phone: order.driver_phone,
        location: order.driver_location
      };
    }

    await base44.asServiceRole.entities.GroupOrder.update(groupOrder.id, updateData);

    // Notify all members
    const statusMessages = {
      'confirmed': '✅ Your group order has been confirmed by the restaurant!',
      'preparing': '👨‍🍳 Your group order is being prepared!',
      'ready': '🎉 Your group order is ready for pickup!',
      'out_for_delivery': '🚚 Your group order is out for delivery!',
      'delivered': '✓ Your group order has been delivered!',
      'completed': '✓ Your group order is complete!',
      'cancelled': '❌ Your group order has been cancelled.'
    };

    const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`;
    
    // Get all unique recipient emails
    const recipientEmails = [
      groupOrder.organizer_email,
      ...groupOrder.party_members.map(m => m.email)
    ];
    const uniqueEmails = [...new Set(recipientEmails)];

    // Send notifications to all members
    for (const email of uniqueEmails) {
      try {
        // In-app notification
        await base44.asServiceRole.entities.Notification.create({
          customer_email: email,
          title: `${groupOrder.title} - ${message}`,
          message: `${message}\n\nRestaurant: ${groupOrder.restaurant_name}`,
          type: 'order_update',
          priority: 'high',
          status: 'unread',
          action_url: `/manage-group-order?id=${groupOrder.id}`,
          action_label: 'Track Order',
          related_order_id: orderId,
          icon: 'package'
        });

        // Email notification
        let emailBody = `
Hi there,

${message}

Group Order: ${groupOrder.title}
Restaurant: ${groupOrder.restaurant_name}
Status: ${newStatus}
`;

        if (updateData.estimated_ready_time) {
          emailBody += `\nEstimated Ready Time: ${new Date(updateData.estimated_ready_time).toLocaleString()}`;
        }
        if (updateData.estimated_delivery_time) {
          emailBody += `\nEstimated Delivery Time: ${new Date(updateData.estimated_delivery_time).toLocaleString()}`;
        }
        if (updateData.driver_info?.name) {
          emailBody += `\n\nDriver: ${updateData.driver_info.name}`;
          if (updateData.driver_info.phone) {
            emailBody += `\nDriver Phone: ${updateData.driver_info.phone}`;
          }
        }

        emailBody += `\n\nTrack your order: ${Deno.env.get('BASE_URL') || 'https://your-app.com'}/manage-group-order?id=${groupOrder.id}

- RESTROBUDDY Team`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'RESTROBUDDY',
          to: email,
          subject: `📦 ${groupOrder.title} - ${message}`,
          body: emailBody.trim()
        });
      } catch (error) {
        console.error(`Failed to notify ${email}:`, error);
      }
    }

    return Response.json({
      success: true,
      groupOrderId: groupOrder.id,
      newStatus,
      oldStatus,
      notified: uniqueEmails.length
    });
  } catch (error) {
    console.error('Error in syncGroupOrderStatus:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});