import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId, newStatus, customerEmail, customerName, customerPhone, restaurantName, orderDetails } = await req.json();

    if (!orderId || !newStatus) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const statusMessages = {
      confirmed: {
        subject: '✅ Order Confirmed',
        message: `Hi ${customerName || 'there'},\n\nGreat news! ${restaurantName || 'The restaurant'} has confirmed your order #${orderId.slice(-6)}.\n\nYour food is being prepared and we'll keep you updated on its progress.\n\nThank you for choosing RESTROBUDDY!`
      },
      preparing: {
        subject: '👨‍🍳 Your Order is Being Prepared',
        message: `Hi ${customerName || 'there'},\n\nYour order #${orderId.slice(-6)} is now being prepared by ${restaurantName || 'the restaurant'}.\n\nWe'll notify you when it's ready!\n\nRESTROBUDDY`
      },
      ready: {
        subject: '🎉 Your Order is Ready!',
        message: `Hi ${customerName || 'there'},\n\nYour order #${orderId.slice(-6)} is ready for ${orderDetails?.delivery_type === 'delivery' ? 'delivery' : 'pickup'}!\n\n${orderDetails?.delivery_type === 'pickup' ? 'You can pick it up at ' + (restaurantName || 'the restaurant') + ' now.' : 'A driver will pick it up shortly.'}\n\nRESTROBUDDY`
      },
      out_for_delivery: {
        subject: '🚚 Your Order is On The Way',
        message: `Hi ${customerName || 'there'},\n\nYour order #${orderId.slice(-6)} is out for delivery!\n\nYour food should arrive soon.\n\nRESTROBUDDY`
      },
      delivered: {
        subject: '✓ Order Delivered',
        message: `Hi ${customerName || 'there'},\n\nYour order #${orderId.slice(-6)} has been delivered!\n\nWe hope you enjoy your meal. Thank you for using RESTROBUDDY!\n\nPlease rate your experience when you get a chance.`
      },
      completed: {
        subject: '✓ Order Complete - Thank You!',
        message: `Hi ${customerName || 'there'},\n\nYour order #${orderId.slice(-6)} is now complete.\n\nThank you for choosing ${restaurantName || 'us'}! We'd love to serve you again soon.\n\nRESTROBUDDY`
      }
    };

    const statusInfo = statusMessages[newStatus];
    const results = { email: null, sms: null };

    // Send email notification
    if (customerEmail && statusInfo) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customerEmail,
          subject: statusInfo.subject,
          body: statusInfo.message
        });
        results.email = 'sent';
      } catch (error) {
        console.error('Email send failed:', error);
        results.email = 'failed';
      }
    }

    // Send SMS notification if phone number provided
    if (customerPhone && statusInfo) {
      try {
        const smsMessage = statusInfo.subject + '\n\n' + statusInfo.message.split('\n\n')[1];
        await base44.asServiceRole.functions.invoke('sendSms', {
          to: customerPhone,
          message: smsMessage
        });
        results.sms = 'sent';
      } catch (error) {
        console.error('SMS send failed:', error);
        results.sms = 'failed';
      }
    }

    return Response.json({
      success: true,
      orderId,
      status: newStatus,
      notifications: results
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});