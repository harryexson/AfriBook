import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status, customerEmail, customerPhone, customerName } = await req.json();

    if (!orderId || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create in-app notification with detailed messages
    const notificationMessages = {
      pending: '📋 Order Received - We got your order!',
      confirmed: '✅ Order Confirmed - Your order has been confirmed by the restaurant',
      preparing: '👨‍🍳 Being Prepared - Your delicious food is being prepared',
      ready: '🎉 Ready for Pickup - Your order is ready!',
      out_for_delivery: '🚚 Out for Delivery - Your order is on the way to you!',
      delivered: '✓ Delivered - Your order has been delivered. Enjoy your meal!',
      completed: '✓ Order Completed - Thank you for your order!',
      cancelled: '❌ Order Cancelled - Your order has been cancelled'
    };

    const detailedMessages = {
      pending: 'Your order has been received and is waiting for restaurant confirmation.',
      confirmed: 'The restaurant has confirmed your order and will start preparing it soon.',
      preparing: 'Your food is being freshly prepared by our chefs.',
      ready: 'Your order is ready! Please come pick it up or wait for delivery.',
      out_for_delivery: 'Your driver is on the way with your order. Track them in real-time.',
      delivered: 'Your order has been delivered. We hope you enjoy your meal!',
      completed: 'Thank you for ordering with us. We hope to serve you again soon!',
      cancelled: 'Your order has been cancelled. If you have questions, please contact the restaurant.'
    };

    const message = notificationMessages[status] || `Order status: ${status}`;
    const detailedMessage = detailedMessages[status] || message;

    // Create notification
    let notificationId = null;
    if (customerEmail) {
      const notification = await base44.asServiceRole.entities.Notification.create({
        customer_email: customerEmail,
        customer_phone: customerPhone,
        title: `Order #${orderId.slice(-6)} Update`,
        message: detailedMessage,
        type: 'order_update',
        priority: status === 'ready' || status === 'out_for_delivery' ? 'high' : 'medium',
        status: 'unread',
        related_order_id: orderId,
        icon: 'package'
      });
      notificationId = notification.id;
    }

    // Send email notification for all status changes
    let emailSent = false;
    if (customerEmail) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customerEmail,
          subject: `Order Update: ${notificationMessages[status]}`,
          body: `
Hi ${customerName || 'Customer'},

${detailedMessage}

Order ID: #${orderId.slice(-6)}
Status: ${status.replace(/_/g, ' ').toUpperCase()}

You can track your order here:
${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/order-status?id=${orderId}

Thank you for your order!

- RESTROBUDDY Team
          `.trim()
        });
        emailSent = true;
      } catch (error) {
        console.log('Email notification failed:', error);
      }
    }

    // Try SMS notification for critical statuses
    let smsSent = false;
    if (customerPhone && ['ready', 'out_for_delivery', 'delivered'].includes(status)) {
      try {
        const smsResponse = await base44.functions.invoke('sendOrderStatusUpdate', {
          orderId: orderId,
          newStatus: status,
          customerPhone: customerPhone,
          customerName: customerName || 'Customer'
        });
        
        if (smsResponse?.data?.success) {
          smsSent = true;
        }
      } catch (error) {
        console.log('SMS notification failed:', error);
      }
    }

    return Response.json({
      success: true,
      notificationId: notificationId,
      notificationSent: true,
      emailSent: emailSent,
      smsSent: smsSent,
      status: status
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send notification' 
    }, { status: 500 });
  }
});