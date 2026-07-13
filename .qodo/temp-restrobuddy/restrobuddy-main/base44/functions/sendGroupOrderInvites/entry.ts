const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  try {
    const { members, groupOrder, organizerName, restaurantName } = await req.json();

    if (!members || !Array.isArray(members) || members.length === 0) {
      return Response.json({ error: 'No members provided' }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const results = [];
    const errors = [];

    for (const member of members) {
      try {
        if (!member.email || !member.name) {
          errors.push({ member: member.name || 'Unknown', error: 'Missing name or email' });
          continue;
        }

        const memberLink = `${groupOrder.share_link}&memberId=${member.id}`;
        
        const emailBody = `Hi ${member.name},

${organizerName} has invited you to join a group order from ${restaurantName}!

📦 Order: ${groupOrder.title}
🍴 Restaurant: ${restaurantName}
⏰ Deadline: ${new Date(groupOrder.deadline).toLocaleString()}

Click the link below to browse the menu and make your food selection:
${memberLink}

Once everyone has made their selections, ${organizerName} will submit and pay for the entire order.

Enjoy your meal!
- RESTROBUDDY Team`;

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: "RESTROBUDDY <onboarding@resend.dev>",
            to: member.email,
            subject: `You're invited to a group order: ${groupOrder.title}`,
            html: emailBody.replace(/\n/g, "<br/>")
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to send email");
        }

        results.push({ member: member.name, status: 'sent', email: member.email });
      } catch (error) {
        console.error(`Failed to send invite to ${member.name}:`, error.message);
        errors.push({ member: member.name, error: error.message });
      }
    }

    return Response.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Send invites error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send invitations' 
    }, { status: 500 });
  }
});