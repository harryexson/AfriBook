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
        const { customerName, customerPhone, orderNumber } = body;

        if (!customerPhone || !orderNumber) {
            return Response.json({ 
                success: false,
                error: 'Customer phone and order number are required' 
            }, { status: 400 });
        }

        console.log(`Notifying customer ${customerPhone} for order ${orderNumber}`);

        const message = `Hi ${customerName}! 🎉 Your order #${orderNumber} is ready for pickup at RESTROBUDDY. Thank you for your order!`;

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
                message: 'Demo mode - SMS would be sent in production. Configure Sinch credentials to send real SMS.'
            });
        }

        // Check opt-out status using service role
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
            console.log('Could not check opt-out status, proceeding with SMS:', optOutError.message);
            // Continue anyway if we can't check opt-out
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
                error: `Failed to send SMS: ${sinchResponse.status} - ${errorText}`
            }, { status: 500 });
        }

        const result = await sinchResponse.json();

        return Response.json({
            success: true,
            demo: false,
            messageId: result.id,
            message: 'Customer notified successfully via SMS!'
        });

    } catch (error) {
        console.error('Error in notifyCustomer:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Failed to send notification',
            details: error.toString()
        }, { status: 500 });
    }
});