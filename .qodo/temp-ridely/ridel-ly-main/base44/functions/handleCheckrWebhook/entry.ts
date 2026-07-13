import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify webhook signature from Checkr
    const signature = req.headers.get('x-checkr-signature');
    const webhookSecret = Deno.env.get('CHECKR_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.log('[CHECKR WEBHOOK] No webhook secret configured');
      return Response.json({ received: true });
    }

    const payload = await req.text();
    
    // Verify signature (Checkr uses HMAC SHA256)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signature !== expectedSignature) {
      console.log('[CHECKR WEBHOOK] Invalid signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    
    console.log('[CHECKR WEBHOOK] Received event:', event.type);

    // Handle different webhook types
    if (event.type === 'report.completed') {
      const report = event.data.object;
      
      // Find user by candidate_id
      const users = await base44.asServiceRole.entities.User.filter({
        checkr_candidate_id: report.candidate_id
      });
      
      if (users.length === 0) {
        console.log('[CHECKR WEBHOOK] User not found for candidate:', report.candidate_id);
        return Response.json({ received: true });
      }
      
      const userId = users[0].id;
      
      // Update user with report results
      const updateData = {
        background_check_status: 'complete',
        background_check_result: report.result,
        background_check_completed_at: report.completed_at,
        checkr_report_id: report.id
      };
      
      if (report.result === 'clear') {
        updateData.background_check_verified = true;
        
        // Send approval notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'document_approved',
          title: '✅ Background Check Approved!',
          message: 'Your background check has been cleared. You can now start accepting rides!',
          action_url: '/DriverDashboard'
        });
        
        toast.success('Background check approved!');
      } else {
        updateData.background_check_verified = false;
        updateData.background_check_issues = report.adjudication || 'Requires manual review';
        
        // Send review notification
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'document_rejected',
          title: 'Background Check Requires Review',
          message: 'Your background check requires additional review. Our team will contact you shortly.',
          action_url: '/DriverDocuments'
        });
      }
      
      await base44.asServiceRole.entities.User.update(userId, updateData);
      
      // Send email notification
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: users[0].email,
        subject: report.result === 'clear' ? 'Background Check Approved!' : 'Background Check Update',
        body: report.result === 'clear' 
          ? 'Congratulations! Your background check has been approved. You can now start accepting rides on Ride-ly.'
          : 'Your background check requires additional review. Our team will contact you within 24-48 hours.'
      });
    }
    
    if (event.type === 'motor_vehicle_report.completed') {
      const mvr = event.data.object;
      
      // Find user by candidate_id
      const users = await base44.asServiceRole.entities.User.filter({
        checkr_candidate_id: mvr.candidate_id
      });
      
      if (users.length === 0) {
        return Response.json({ received: true });
      }
      
      const userId = users[0].id;
      
      // Update user with MVR results
      await base44.asServiceRole.entities.User.update(userId, {
        checkr_mvr_id: mvr.id,
        license_verification_status: mvr.status,
        license_verification_result: mvr.result,
        license_violations_count: mvr.violations?.length || 0,
        license_accidents_count: mvr.accidents?.length || 0
      });
      
      if (mvr.result === 'clear') {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'document_approved',
          title: '✅ License Verified!',
          message: 'Your driver\'s license has been verified successfully.',
          action_url: '/DriverDocuments'
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[CHECKR WEBHOOK] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});