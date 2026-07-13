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
        const { 
            waitlistId, 
            notificationType, // 'joined', 'position_update', 'almost_ready', 'table_ready'
            position,
            estimatedWait,
            customMessage 
        } = body;

        if (!waitlistId || !notificationType) {
            return Response.json({ 
                error: 'Waitlist ID and notification type required' 
            }, { status: 400 });
        }

        // Get waitlist entry details
        const waitlistEntries = await base44.asServiceRole.entities.WaitlistEntry.filter({ 
            id: waitlistId 
        });

        if (waitlistEntries.length === 0) {
            return Response.json({ error: 'Waitlist entry not found' }, { status: 404 });
        }

        const entry = waitlistEntries[0];
        const phone = entry.customer_phone;
        const name = entry.customer_name;
        const partySize = entry.party_size;
        const currentPosition = position || entry.position;
        const wait = estimatedWait || entry.estimated_wait_time;

        // Check notification preferences
        if (entry.notification_method === 'none' || entry.notification_method === 'in_person') {
            console.log('Customer prefers not to receive SMS notifications');
            return Response.json({ 
                success: true,
                skipped: true,
                message: 'Customer prefers no SMS notifications'
            });
        }

        // Check if Sinch is configured
        const SINCH_SERVICE_PLAN_ID = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const SINCH_API_KEY = Deno.env.get("SINCH_API_KEY");
        const SINCH_PHONE_NUMBER = Deno.env.get("SINCH_PHONE_NUMBER");

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
                phone_number: phone,
                opted_out: true
            });

            if (optOutRecords.length > 0) {
                console.log(`Phone number ${phone} has opted out`);
                return Response.json({ 
                    success: false,
                    error: 'Customer has opted out of SMS notifications',
                    opted_out: true
                }, { status: 403 });
            }
        } catch (error) {
            console.log('Could not check opt-out status:', error.message);
        }

        // Generate message based on type
        let message = customMessage;
        
        if (!message) {
            switch (notificationType) {
                case 'joined':
                    message = `Hi ${name}! You've been added to the waitlist at RESTROBUDDY. You are #${currentPosition} in line for a party of ${partySize}. Estimated wait: ~${wait} minutes. We'll text you when your table is ready!`;
                    break;
                    
                case 'position_update':
                    message = `Hi ${name}! Update: You are now #${currentPosition} in line at RESTROBUDDY. Estimated wait: ~${wait} minutes. Your table will be ready soon!`;
                    break;
                    
                case 'almost_ready':
                    message = `Hi ${name}! You're next in line at RESTROBUDDY! Your table for ${partySize} will be ready in approximately 5-10 minutes. Please stay nearby.`;
                    break;
                    
                case 'table_ready':
                    message = `🎉 ${name}, your table for ${partySize} is ready at RESTROBUDDY! Please come to the host stand within the next 10 minutes to be seated.`;
                    break;
                    
                case 'cancelled':
                    message = `Hi ${name}, you have been removed from the waitlist at RESTROBUDDY. If this was an error, please speak with the host.`;
                    break;
                    
                default:
                    message = `RESTROBUDDY waitlist update for ${name} - party of ${partySize}`;
            }
        }

        // Add compliance text
        const complianceText = "\n\nReply STOP to opt out of SMS notifications.";
        const fullMessage = message + complianceText;

        // Send SMS via Sinch
        const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${SINCH_SERVICE_PLAN_ID}/batches`;
        
        const sinchPayload = {
            from: SINCH_PHONE_NUMBER,
            to: [phone],
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

        // Update waitlist entry with notification sent flag
        await base44.asServiceRole.entities.WaitlistEntry.update(waitlistId, {
            notification_sent: true,
            notified_at: new Date().toISOString()
        });

        return Response.json({
            success: true,
            messageId: result.id,
            notificationType,
            message: 'SMS notification sent successfully'
        });

    } catch (error) {
        console.error('Error in sendWaitlistNotifications:', error);
        return Response.json({ 
            error: error.message || 'Failed to send notification'
        }, { status: 500 });
    }
});