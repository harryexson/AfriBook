import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referralCode } = await req.json();

    if (!referralCode) {
      return Response.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find referrer by code
    const referrers = await base44.entities.User.filter({
      driver_referral_code: referralCode
    });

    if (referrers.length === 0) {
      return Response.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const referrer = referrers[0];

    // Can't refer yourself
    if (referrer.id === user.id) {
      return Response.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Check if user already used a referral code
    if (user.referred_by_driver) {
      return Response.json({ error: 'You have already used a referral code' }, { status: 400 });
    }

    // Check if referral already exists
    const existingReferrals = await base44.entities.DriverReferral.filter({
      referee_driver_id: user.id
    });

    if (existingReferrals.length > 0) {
      return Response.json({ error: 'Referral already exists' }, { status: 400 });
    }

    // Create referral record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days to complete

    const referral = await base44.asServiceRole.entities.DriverReferral.create({
      referrer_driver_id: referrer.id,
      referee_driver_id: user.id,
      referral_code: referralCode,
      status: 'pending',
      qualifying_rides_required: 20,
      qualifying_rides_completed: 0,
      referrer_reward: {
        type: 'cash_bonus',
        amount: 100,
        claimed: false
      },
      referee_reward: {
        type: 'cash_bonus',
        amount: 50,
        claimed: false
      },
      expires_at: expiresAt.toISOString()
    });

    // Update referee with referral code
    await base44.auth.updateMe({
      referred_by_driver: referralCode
    });

    // Send notification to referrer
    await base44.asServiceRole.entities.Notification.create({
      user_id: referrer.id,
      type: 'promotion',
      title: '🎉 New Driver Referral!',
      message: `${user.full_name} just signed up using your referral code! You'll earn $100 when they complete 20 rides.`,
      action_url: '/DriverReferrals'
    });

    return Response.json({ 
      success: true,
      referral: referral,
      message: 'Referral applied! Complete 20 rides to unlock your $50 bonus.'
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});