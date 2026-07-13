import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Try to authenticate, but allow unauthenticated for webhooks
        let isAuthenticated = false;
        try {
            await base44.auth.me();
            isAuthenticated = true;
        } catch (authError) {
            console.log('Unauthenticated request - webhook or public mode');
        }

        const body = await req.json();
        const { to, message } = body;

        if (!to || !message) {
            return Response.json({
                success: false,
                error: 'Phone number and message are required'
            }, { status: 400 });
        }

        console.log(`Attempting to send SMS to ${to}`);

        const SINCH_SERVICE_PLAN_ID = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const SINCH_API_KEY = Deno.env.get("SINCH_API_KEY");
        const SINCH_PHONE_NUMBER = Deno.env.get("SINCH_PHONE_NUMBER");

        // Demo mode if Sinch not configured
        if (!SINCH_SERVICE_PLAN_ID || !SINCH_API_KEY || !SINCH_PHONE_NUMBER) {
            console.log('Demo mode: Sinch credentials not configured');
            return Response.json({
                success: true,
                demo: true,
                message: 'Demo mode - SMS would be sent in production. Configure Sinch credentials in settings.',
                to: to,
                messageContent: message
            });
        }

        // Check opt-out status only if we have service role access
        if (isAuthenticated) {
            try {
                const optOutRecords = await base44.asServiceRole.entities.SmsOptOut.filter({
                    phone_number: to,
                    opted_out: true
                });

                if (optOutRecords.length > 0) {
                    console.log(`Phone number ${to} has opted out`);
                    return Response.json({
                        success: false,
                        error: 'User has opted out of SMS messages',
                        opted_out: true
                    }, { status: 403 });
                }
            } catch (optOutError) {
                console.log('Could not check opt-out status:', optOutError.message);
                // Continue anyway if we can't check opt-out status
            }
        }

        // Add compliance text if not already present
        let fullMessage = message;
        if (!message.includes("Text STOP")) {
            const complianceText = "\n\nMsg & data rates may apply. Text STOP to opt out.";
            fullMessage = message + complianceText;
        }

        // Send SMS via Sinch
        const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${SINCH_SERVICE_PLAN_ID}/batches`;
        
        const sinchPayload = {
            from: SINCH_PHONE_NUMBER,
            to: [to],
            body: fullMessage
        };

        console.log('Sending to Sinch:', { url: sinchUrl, to: [to] });

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
            console.error('Sinch API error:', sinchResponse.status, errorText);
            return Response.json({
                success: false,
                error: `Sinch API error: ${sinchResponse.status}`,
                details: errorText
            }, { status: 500 });
        }

        const result = await sinchResponse.json();
        console.log('SMS sent successfully:', result.id);

        return Response.json({
            success: true,
            demo: false,
            messageId: result.id,
            to: to,
            message: 'SMS sent successfully'
        });

    } catch (error) {
        console.error('Error in sendSms:', error);
        return Response.json({
            success: false,
            error: error.message || 'Failed to send SMS',
            stack: error.stack
        }, { status: 500 });
    }
});