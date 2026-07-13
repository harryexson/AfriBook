import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { rideId, newStatus, recipientType } = await req.json();

        if (!rideId || !newStatus) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Get ride data
        const ride = await base44.asServiceRole.entities.Ride.get(rideId);
        if (!ride) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }

        // Get notification recipient based on status change
        let recipientId = null;
        let notificationMessage = '';
        let emailSubject = '';

        // Determine recipient and message based on who should be notified
        const shouldNotifyRider = recipientType === 'rider' || 
            (!recipientType && ['accepted', 'arriving', 'in_progress', 'completed', 'cancelled'].includes(newStatus));

        if (shouldNotifyRider) {
            recipientId = ride.rider_id;
            
            if (newStatus === 'accepted') {
                notificationMessage = 'Your driver is on the way! They will arrive at ' + (ride.pickup_location?.address || 'the pickup point') + ' shortly.';
                emailSubject = 'Your Ride-ly driver is on the way!';
            } else if (newStatus === 'arriving') {
                notificationMessage = 'Your driver has arrived at ' + (ride.pickup_location?.address || 'the pickup point') + '. Please head to the pickup point.';
                emailSubject = 'Your Ride-ly driver has arrived!';
            } else if (newStatus === 'in_progress') {
                notificationMessage = 'You are on your way to ' + (ride.destination?.address || 'your destination') + '. Enjoy your ride!';
                emailSubject = 'Your Ride-ly trip has started';
            } else if (newStatus === 'completed') {
                const fare = ride.fare?.total_fare?.toFixed(2) || '0.00';
                notificationMessage = 'Trip complete! Total fare: $' + fare + '. Thank you for riding with Ride-ly!';
                emailSubject = 'Thanks for riding with Ride-ly!';
            } else if (newStatus === 'cancelled') {
                notificationMessage = 'Your ride has been cancelled. We hope to see you again soon!';
                emailSubject = 'Ride-ly trip cancelled';
            } else {
                notificationMessage = 'Your ride status has been updated to: ' + newStatus;
                emailSubject = 'Ride-ly ride status update';
            }
        } else if (recipientType === 'driver') {
            recipientId = ride.driver_id;
            
            if (newStatus === 'cancelled') {
                notificationMessage = 'The rider has cancelled this trip.';
                emailSubject = 'Ride-ly trip cancelled by rider';
            } else {
                notificationMessage = 'Ride status updated to: ' + newStatus;
                emailSubject = 'Ride-ly trip update';
            }
        }

        if (!recipientId) {
            return Response.json({ 
                success: true, 
                message: 'No recipient to notify' 
            });
        }

        // Get recipient email
        const recipient = await base44.asServiceRole.entities.User.get(recipientId);
        if (!recipient?.email) {
            return Response.json({ 
                success: true, 
                message: 'Recipient has no email' 
            });
        }

        // Build email body
        let emailBody = 'Hi ' + (recipient.full_name || 'there') + ',\n\n' + notificationMessage;
        
        if (newStatus === 'completed') {
            emailBody += '\n\nTrip Details:\n';
            emailBody += '- Pickup: ' + (ride.pickup_location?.address || 'N/A') + '\n';
            emailBody += '- Destination: ' + (ride.destination?.address || 'N/A') + '\n';
            emailBody += '- Total Fare: $' + (ride.fare?.total_fare?.toFixed(2) || '0.00') + '\n';
            if (ride.fare?.tip_amount > 0) {
                emailBody += '- Tip: $' + ride.fare.tip_amount.toFixed(2) + '\n';
            }
            emailBody += '\nThank you for choosing Ride-ly!';
        }

        emailBody += '\n\nBest regards,\nThe Ride-ly Team';

        // Send email notification
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: recipient.email,
                subject: emailSubject,
                body: emailBody
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);
        }

        // Create in-app notification
        const notificationTypes = {
            accepted: 'ride_accepted',
            arriving: 'driver_arriving',
            in_progress: 'ride_started',
            completed: 'ride_completed',
            cancelled: 'ride_cancelled'
        };

        const notificationType = notificationTypes[newStatus];
        if (notificationType) {
            try {
                await base44.asServiceRole.entities.Notification.create({
                    user_id: recipientId,
                    type: notificationType,
                    title: emailSubject,
                    message: notificationMessage,
                    ride_id: rideId,
                    action_url: `/TrackRide?id=${rideId}`
                });
            } catch (notifError) {
                console.error('In-app notification failed:', notifError);
            }
        }

        return Response.json({ 
            success: true, 
            message: 'Notification sent for status: ' + newStatus,
            recipientEmail: recipient.email
        });

    } catch (error) {
        console.error('Notification error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});