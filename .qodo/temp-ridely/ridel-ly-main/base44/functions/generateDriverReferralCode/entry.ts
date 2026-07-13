import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a driver
    if (user.user_type !== 'driver' && user.user_type !== 'both') {
      return Response.json({ error: 'Only drivers can have referral codes' }, { status: 403 });
    }

    // Check if user already has a referral code
    if (user.driver_referral_code) {
      return Response.json({ 
        success: true, 
        referral_code: user.driver_referral_code 
      });
    }

    // Generate unique referral code (DRIVER-FIRSTNAME-XXXX format)
    const firstName = user.full_name?.split(' ')[0]?.toUpperCase() || 'DRIVER';
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `DRIVER-${firstName}-${randomCode}`;

    // Update user with referral code
    await base44.auth.updateMe({
      driver_referral_code: referralCode
    });

    return Response.json({ 
      success: true, 
      referral_code: referralCode 
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});