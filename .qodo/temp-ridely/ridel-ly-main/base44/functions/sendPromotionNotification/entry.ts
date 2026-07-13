import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.internal_role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, targetUserIds, promoCode } = await req.json();

    if (!title || !message) {
      return Response.json(
        { error: 'Missing required fields: title, message' },
        { status: 400 }
      );
    }

    // If no specific users, send to all users
    let userIds = targetUserIds;
    if (!userIds || userIds.length === 0) {
      const allUsers = await base44.asServiceRole.entities.User.filter({}, '-created_date', 1000);
      userIds = allUsers.map(u => u.id);
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      userIds.map(userId =>
        base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'promotion',
          title,
          message,
          action_url: promoCode ? `/Prime` : '/Dashboard',
          metadata: { promo_code: promoCode }
        })
      )
    );

    return Response.json({
      success: true,
      notificationsSent: notifications.length
    });
  } catch (error) {
    console.error('Error sending promotion notification:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});