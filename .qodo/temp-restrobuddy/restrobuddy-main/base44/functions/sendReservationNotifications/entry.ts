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
            reservationId, 
            notificationType, // 'confirmation', 'reminder_24h', 'reminder_1h'
            customMessage 
        } = body;

        if (!reservationId || !notificationType) {
            return Response.json({ 
                error: 'Reservation ID and notification type required' 
            }, { status: 400 });
        }

        // Get reservation details
        const reservations = await base44.asServiceRole.entities.Reservation.filter({ 
            id: reservationId 
        });

        if (reservations.length === 0) {
            return Response.json({ error: 'Reservation not found' }, { status: 404 });
        }

        const reservation = reservations[0];
        const phone = reservation.customer_phone;
        const name = reservation.customer_name;
        const confirmationCode = reservation.confirmation_code;
        const date = reservation.reservation_date;
        const time = reservation.reservation_time;
        const partySize = reservation.party_size;

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
                case 'confirmation':
                    message = `Hi ${name}! Your reservation for ${partySize} at RESTROBUDDY is confirmed for ${date} at ${time}. Confirmation code: ${confirmationCode}. We look forward to seeing you!`;
                    break;
                    
                case 'reminder_24h':
                    message = `Hi ${name}! This is a reminder that you have a reservation for ${partySize} tomorrow (${date}) at ${time}. Confirmation code: ${confirmationCode}. Reply CANCEL to cancel.`;
                    break;
                    
                case 'reminder_1h':
                    message = `Hi ${name}! Your reservation for ${partySize} is in 1 hour (${time}). We're looking forward to seeing you at RESTROBUDDY! Address: [Restaurant Address]`;
                    break;
                    
                case 'table_ready':
                    message = `Hi ${name}! Your table for ${partySize} is ready at RESTROBUDDY. Please head to the host stand. Confirmation: ${confirmationCode}`;
                    break;
                    
                case 'cancelled':
                    message = `Hi ${name}, your reservation for ${date} at ${time} has been cancelled. If this was an error, please call us immediately.`;
                    break;
                    
                default:
                    message = `RESTROBUDDY reservation update for ${name} - ${date} at ${time}`;
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

        // Update reservation with notification sent flag
        const updateData = {};
        if (notificationType === 'reminder_24h' || notificationType === 'reminder_1h') {
            updateData.reminder_sent = true;
            updateData.reminder_sent_at = new Date().toISOString();
        }
        
        if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.Reservation.update(reservationId, updateData);
        }

        return Response.json({
            success: true,
            messageId: result.id,
            notificationType,
            message: 'SMS notification sent successfully'
        });

    } catch (error) {
        console.error('Error in sendReservationNotifications:', error);
        return Response.json({ 
            error: error.message || 'Failed to send notification'
        }, { status: 500 });
    }
});