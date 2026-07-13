import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { order_id, status, customer_phone, customer_email, customer_name } = await req.json();

    if (!order_id || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const statusMessages = {
      confirmed: "Your order has been confirmed and is being prepared! 🎉",
      preparing: "Your order is now being prepared by our kitchen team! 👨‍🍳",
      ready: "Your order is ready for pickup! 📦",
      out_for_delivery: "Your order is on the way! 🚗",
      delivered: "Your order has been delivered! Enjoy your meal! 😋",
      completed: "Thank you for your order! Hope you enjoyed it! ⭐"
    };

    const message = statusMessages[status] || `Order status updated to: ${status}`;
    const fullMessage = `${customer_name}, ${message}\n\nOrder #${order_id.slice(-6)}`;

    let smsResult = null;
    let emailResult = null;

    // Send SMS if phone number provided
    if (customer_phone) {
      try {
        const sinchApiKey = Deno.env.get('SINCH_API_KEY');
        const sinchServicePlanId = Deno.env.get('SINCH_SERVICE_PLAN_ID');
        const sinchPhoneNumber = Deno.env.get('SINCH_PHONE_NUMBER');

        if (sinchApiKey && sinchServicePlanId && sinchPhoneNumber) {
          const smsResponse = await fetch(
            `https://us.sms.api.sinch.com/xms/v1/${sinchServicePlanId}/batches`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sinchApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: sinchPhoneNumber,
                to: [customer_phone],
                body: fullMessage
              })
            }
          );

          if (smsResponse.ok) {
            smsResult = { success: true, channel: 'sms' };
          }
        }
      } catch (error) {
        console.error('SMS error:', error);
      }
    }

    // Send email if email provided
    if (customer_email) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Order Update</h2>
            <p>Hi ${customer_name},</p>
            <p style="font-size: 18px; font-weight: bold;">${message}</p>
            <p>Order ID: #${order_id.slice(-6)}</p>
            <p>Status: <strong>${status}</strong></p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 14px;">Thank you for choosing us!</p>
          </div>
        `;

        const emailResponse = await base44.integrations.Core.SendEmail({
          to: customer_email,
          subject: `Order Update - ${status}`,
          body: emailHtml
        });

        if (emailResponse) {
          emailResult = { success: true, channel: 'email' };
        }
      } catch (error) {
        console.error('Email error:', error);
      }
    }

    return Response.json({
      success: true,
      order_id,
      status,
      notifications_sent: [smsResult, emailResult].filter(r => r !== null),
      message: fullMessage
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send notifications' 
    }, { status: 500 });
  }
});