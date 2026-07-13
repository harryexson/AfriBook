import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { groupOrderId, action, details, userEmail, userName } = await req.json();

    if (!groupOrderId || !action || !details) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the group order
    const groupOrders = await base44.asServiceRole.entities.GroupOrder.filter({});
    const groupOrder = groupOrders.find(g => g.id === groupOrderId);

    if (!groupOrder) {
      return Response.json({ error: 'Group order not found' }, { status: 404 });
    }

    // Update activity log
    const updatedActivityLog = [
      ...(groupOrder.activity_log || []),
      {
        timestamp: new Date().toISOString(),
        action,
        user_name: userName || 'System',
        user_email: userEmail || '',
        details
      }
    ];

    await base44.asServiceRole.entities.GroupOrder.update(groupOrderId, {
      activity_log: updatedActivityLog
    });

    // Notify all party members and organizer
    const recipientsEmails = [
      groupOrder.organizer_email,
      ...groupOrder.party_members.map(m => m.email)
    ];

    const uniqueEmails = [...new Set(recipientsEmails)];
    let notificationsSent = 0;

    for (const email of uniqueEmails) {
      try {
        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          customer_email: email,
          title: `Group Order Update: ${groupOrder.title}`,
          message: details,
          type: 'order_update',
          priority: 'medium',
          status: 'unread',
          action_url: `/manage-group-order?id=${groupOrderId}`,
          action_label: 'View Order',
          icon: 'bell'
        });

        // Send email notification
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `🔔 Group Order Update: ${groupOrder.title}`,
          body: `
Hi there,

${details}

Group Order: ${groupOrder.title}
Restaurant: ${groupOrder.restaurant_name}

View full details: ${Deno.env.get('BASE_URL') || window.location.origin}/manage-group-order?id=${groupOrderId}

- RESTROBUDDY Team
          `.trim()
        });

        notificationsSent++;
      } catch (error) {
        console.error(`Failed to notify ${email}:`, error);
      }
    }

    return Response.json({
      success: true,
      notificationsSent,
      activityLogged: true
    });
  } catch (error) {
    console.error('Error in notifyGroupOrderUpdate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});