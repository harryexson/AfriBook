import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, orderType, newStatus, customerPhone, customerName, estimatedTime } = body;

        if (!orderId || !newStatus || !customerPhone) {
            return Response.json({ 
                success: false,
                error: 'Order ID, status, and customer phone are required' 
            }, { status: 400 });
        }

        console.log(`Sending status update for order ${orderId}: ${newStatus}`);

        // Check if Sinch is configured
        const SINCH_SERVICE_PLAN_ID = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const SINCH_API_KEY = Deno.env.get("SINCH_API_KEY");
        const SINCH_PHONE_NUMBER = Deno.env.get("SINCH_PHONE_NUMBER");

        // Demo mode if Sinch not configured
        if (!SINCH_SERVICE_PLAN_ID || !SINCH_API_KEY || !SINCH_PHONE_NUMBER) {
            console.log('Demo mode: Sinch not configured');
            return Response.json({ 
                success: true,
                demo: true,
                message: 'Demo mode - SMS would be sent in production'
            });
        }

        // Check opt-out status
        try {
            const optOutRecords = await base44.asServiceRole.entities.SmsOptOut.filter({
                phone_number: customerPhone,
                opted_out: true
            });

            if (optOutRecords.length > 0) {
                console.log(`Phone number ${customerPhone} has opted out`);
                return Response.json({ 
                    success: false,
                    error: 'Customer has opted out of SMS notifications',
                    opted_out: true
                }, { status: 403 });
            }
        } catch (optOutError) {
            console.log('Could not check opt-out status:', optOutError.message);
        }

        // Generate status message
        const orderNumber = orderId.slice(-6);
        let message = '';

        switch (newStatus) {
            case 'confirmed':
                message = `Hi ${customerName}! Your order #${orderNumber} has been confirmed. `;
                if (estimatedTime) {
                    message += `Estimated ready time: ${estimatedTime}. `;
                }
                message += `We'll notify you when it's ready!`;
                break;
            case 'preparing':
                message = `Good news ${customerName}! Your order #${orderNumber} is now being prepared by our kitchen team. `;
                if (estimatedTime) {
                    message += `Ready in approximately ${estimatedTime} minutes.`;
                }
                break;
            case 'ready':
                message = `🎉 ${customerName}, your order #${orderNumber} is ready for pickup! Please head to the restaurant when convenient.`;
                break;
            case 'out_for_delivery':
                message = `🚗 ${customerName}, your order #${orderNumber} is out for delivery! `;
                if (estimatedTime) {
                    message += `Expected delivery: ${estimatedTime}. `;
                }
                message += `You can track your driver in real-time.`;
                break;
            case 'delivered':
                message = `✅ ${customerName}, your order #${orderNumber} has been delivered! Enjoy your meal and thank you for your order!`;
                break;
            case 'completed':
                message = `Thank you ${customerName}! Your order #${orderNumber} is complete. We hope you enjoyed your meal!`;
                break;
            case 'cancelled':
                message = `${customerName}, we're sorry but order #${orderNumber} has been cancelled. Please contact us for more information.`;
                break;
            default:
                message = `Order #${orderNumber} status update: ${newStatus}`;
        }

        // Add compliance text
        const complianceText = "\n\nMsg & data rates may apply. Text STOP to opt out.";
        const fullMessage = message + complianceText;

        // Send SMS via Sinch
        const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${SINCH_SERVICE_PLAN_ID}/batches`;
        
        const sinchPayload = {
            from: SINCH_PHONE_NUMBER,
            to: [customerPhone],
            body: fullMessage
        };

        const sinchResponse = await fetch(sinchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SINCH_API_KEY}`
            },
            body: JSON.stringify(sinchPayload)
        });

        if (!sinchResponse.ok) {
            const errorText = await sinchResponse.text();
            console.error('Sinch API error:', errorText);
            return Response.json({
                success: false,
                error: `Failed to send SMS: ${sinchResponse.status}`
            }, { status: 500 });
        }

        const result = await sinchResponse.json();

        return Response.json({
            success: true,
            demo: false,
            messageId: result.id,
            message: 'Status update sent successfully via SMS!'
        });

    } catch (error) {
        console.error('Error in sendOrderStatusUpdate:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Failed to send status update'
        }, { status: 500 });
    }
});