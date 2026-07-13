import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { groupOrder } = payload;
    const submittedCount = groupOrder.party_members.filter(m => m.status === "submitted").length;

    // Combine all member items
    const allItems = [];
    groupOrder.party_members
      .filter(m => m.status === "submitted")
      .forEach(member => {
        member.items?.forEach(item => {
          const existing = allItems.find(i => i.menu_item_id === item.menu_item_id);
          if (existing) {
            existing.quantity += item.quantity;
            if (item.special_instructions) {
              existing.special_instructions = 
                (existing.special_instructions ? existing.special_instructions + "; " : "") +
                `${member.name}: ${item.special_instructions}`;
            }
          } else {
            allItems.push({
              ...item,
              special_instructions: item.special_instructions 
                ? `${member.name}: ${item.special_instructions}` 
                : ""
            });
          }
        });
      });

    // Create the main order
    const order = await base44.entities.Order.create({
      restaurant_id: groupOrder.restaurant_id,
      restaurant_name: groupOrder.restaurant_name,
      customer_name: groupOrder.organizer_name,
      customer_phone: groupOrder.organizer_phone || "",
      customer_email: groupOrder.organizer_email,
      items: allItems,
      total_amount: groupOrder.total_amount,
      status: "pending",
      payment_status: "pending",
      order_type: "web",
      delivery_type: groupOrder.delivery_type,
      delivery_address: groupOrder.delivery_address,
      special_requests: `Group Order: ${groupOrder.title} (${submittedCount} people)`,
      status_history: [{
        status: "pending",
        timestamp: new Date().toISOString(),
        notes: "Group order submitted"
      }]
    });

    // Update group order status
    await base44.entities.GroupOrder.update(groupOrder.id, {
      status: "submitted",
      order_id: order.id
    });

    // Notify all members via email
    for (const member of groupOrder.party_members.filter(m => m.status === "submitted")) {
      try {
        await base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `✅ Group order "${groupOrder.title}" submitted!`,
          body: `Hi ${member.name},

Great news! The group order from ${groupOrder.restaurant_name} has been submitted by ${groupOrder.organizer_name}.

Your items:
${member.items?.map(i => `- ${i.quantity}x ${i.name}`).join("\n")}

Your subtotal: $${member.subtotal?.toFixed(2)}

Track your order and receive updates as the restaurant prepares your order.

Enjoy your meal!
- RESTROBUDDY Team`
        });
      } catch (error) {
        console.error(`Failed to notify ${member.name}:`, error);
      }
    }

    return Response.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Error submitting group order:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});