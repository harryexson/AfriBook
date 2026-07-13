import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId, status, orderedVia = 'web' } = await req.json();

    if (!orderId || !status) {
      return Response.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    // Fetch order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (!orders || orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    const customer_email = order.customer_email;
    const customer_phone = order.customer_phone;
    const customer_name = order.customer_name;

    // Status message templates
    const messages = {
      pending: `Your order #${orderId.slice(-6)} has been received! We're preparing it now.`,
      confirmed: `Great! Order #${orderId.slice(-6)} confirmed and sent to the kitchen.`,
      preparing: `Your order #${orderId.slice(-6)} is being prepared. Should be ready soon!`,
      ready: `Your order #${orderId.slice(-6)} is ready! Come pick it up now.`,
      out_for_delivery: `Your order #${orderId.slice(-6)} is on the way! Track your delivery on the app.`,
      delivered: `Your order #${orderId.slice(-6)} has been delivered. Thank you for your order!`,
      completed: `Your order #${orderId.slice(-6)} is complete. We hope you enjoyed!`,
      cancelled: `Your order #${orderId.slice(-6)} has been cancelled.`
    };

    const message = messages[status] || `Order status updated: ${status}`;

    // Send email
    if (customer_email) {
      await base44.integrations.Core.SendEmail({
        to: customer_email,
        subject: `Order #${orderId.slice(-6)} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: `Hi ${customer_name},\n\n${message}\n\nOrder ID: #${orderId.slice(-6)}\n\nThank you for your order!`
      });
    }

    // Send SMS if available and order came via web/app
    if (customer_phone && orderedVia !== 'sms') {
      try {
        await base44.functions.invoke('sendSms', {
          phone: customer_phone,
          message: `${message}\n\nTrack: [app-link]`
        });
      } catch (smsError) {
        console.log('SMS sending failed (non-critical):', smsError);
      }
    }

    // Create notification record
    try {
      await base44.asServiceRole.entities.Notification.create({
        customer_email,
        order_id: orderId,
        type: 'order_status',
        status,
        message,
        read: false
      });
    } catch (notificationError) {
      console.log('Notification creation failed (non-critical):', notificationError);
    }

    return Response.json({
      success: true,
      message: 'Order update sent',
      channels: {
        email: !!customer_email,
        sms: !!customer_phone
      }
    });
  } catch (error) {
    console.error('Error sending order update:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});