import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, type, title, message, rideId, actionUrl, metadata } = await req.json();

    if (!userId || !type || !title || !message) {
      return Response.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    // Create notification in database
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      type,
      title,
      message,
      ride_id: rideId,
      action_url: actionUrl,
      metadata,
      is_read: false
    });

    // Send browser push notification if user has granted permission
    // Note: This would require a service worker and push subscription
    // For now, we'll just create the DB record

    // Optionally send email notification for critical events
    if (['ride_accepted', 'driver_arriving', 'ride_completed'].includes(type)) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: (await base44.asServiceRole.entities.User.get(userId)).email,
          subject: title,
          body: message
        });
      } catch (emailError) {
        console.log('Email notification failed (non-critical):', emailError);
      }
    }

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});