import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// This function should be called via a cron job or scheduler
// to check for upcoming reservations and send reminders

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // This is a background job - use service role
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        console.log('Checking for reservations needing reminders...');

        // Get all confirmed reservations
        const allReservations = await base44.asServiceRole.entities.Reservation.filter({
            status: { $in: ['confirmed', 'checked_in'] }
        });

        const reminders24h = [];
        const reminders1h = [];

        for (const reservation of allReservations) {
            if (!reservation.reservation_datetime) continue;

            const resDateTime = new Date(reservation.reservation_datetime);
            
            // Check if reservation is approximately 24 hours away
            const timeDiff24h = Math.abs(resDateTime - twentyFourHoursFromNow);
            if (timeDiff24h < 30 * 60 * 1000 && !reservation.reminder_sent) { // Within 30 min window
                reminders24h.push(reservation);
            }

            // Check if reservation is approximately 1 hour away
            const timeDiff1h = Math.abs(resDateTime - oneHourFromNow);
            if (timeDiff1h < 15 * 60 * 1000 && !reservation.reminder_sent) { // Within 15 min window
                reminders1h.push(reservation);
            }
        }

        console.log(`Found ${reminders24h.length} reservations for 24h reminders`);
        console.log(`Found ${reminders1h.length} reservations for 1h reminders`);

        const results = {
            reminders24h_sent: 0,
            reminders1h_sent: 0,
            errors: []
        };

        // Send 24-hour reminders
        for (const reservation of reminders24h) {
            try {
                await base44.asServiceRole.functions.invoke('sendReservationNotifications', {
                    reservationId: reservation.id,
                    notificationType: 'reminder_24h'
                });
                results.reminders24h_sent++;
            } catch (error) {
                console.error(`Error sending 24h reminder for ${reservation.id}:`, error);
                results.errors.push({
                    reservationId: reservation.id,
                    error: error.message
                });
            }
        }

        // Send 1-hour reminders
        for (const reservation of reminders1h) {
            try {
                await base44.asServiceRole.functions.invoke('sendReservationNotifications', {
                    reservationId: reservation.id,
                    notificationType: 'reminder_1h'
                });
                results.reminders1h_sent++;
            } catch (error) {
                console.error(`Error sending 1h reminder for ${reservation.id}:`, error);
                results.errors.push({
                    reservationId: reservation.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            timestamp: now.toISOString(),
            ...results
        });

    } catch (error) {
        console.error('Error in scheduleReservationReminders:', error);
        return Response.json({ 
            error: error.message || 'Failed to process reminders'
        }, { status: 500 });
    }
});