import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, from_name } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const fromEmail = 'RESTROBUDDY <noreply@resend.dev>'; // Update with your verified domain
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        text: body
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return Response.json({ 
        error: 'Failed to send email',
        details: error 
      }, { status: response.status });
    }

    const result = await response.json();
    
    return Response.json({
      success: true,
      messageId: result.id
    });
  } catch (error) {
    console.error('Send email error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send email' 
    }, { status: 500 });
  }
});