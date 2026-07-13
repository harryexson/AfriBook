import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { rideId } = await req.json();

    if (!rideId) {
      return Response.json({ error: 'Ride ID required' }, { status: 400 });
    }

    // Get the ride
    const ride = await base44.asServiceRole.entities.Ride.get(rideId);
    if (!ride || ride.status !== 'completed') {
      return Response.json({ success: true, message: 'Ride not completed yet' });
    }

    // Get the driver
    const driver = await base44.asServiceRole.entities.User.get(ride.driver_id);
    if (!driver || !driver.referred_by_driver) {
      return Response.json({ success: true, message: 'Driver not referred' });
    }

    // Find active referral
    const referrals = await base44.asServiceRole.entities.DriverReferral.filter({
      referee_driver_id: driver.id,
      status: { $in: ['pending', 'qualified'] }
    });

    if (referrals.length === 0) {
      return Response.json({ success: true, message: 'No active referral found' });
    }

    const referral = referrals[0];

    // Check if already qualified
    if (referral.status === 'completed') {
      return Response.json({ success: true, message: 'Referral already completed' });
    }

    // Increment completed rides
    const newCount = (referral.qualifying_rides_completed || 0) + 1;
    
    await base44.asServiceRole.entities.DriverReferral.update(referral.id, {
      qualifying_rides_completed: newCount
    });

    // Check if qualified
    if (newCount >= referral.qualifying_rides_required) {
      const now = new Date().toISOString();
      
      // Update referral to qualified
      await base44.asServiceRole.entities.DriverReferral.update(referral.id, {
        status: 'qualified',
        qualified_at: now
      });

      // Award bonuses
      const referrerEarnings = await base44.asServiceRole.entities.DriverEarnings.filter({
        driver_id: referral.referrer_driver_id
      });

      if (referrerEarnings.length > 0) {
        const earnings = referrerEarnings[0];
        await base44.asServiceRole.entities.DriverEarnings.update(earnings.id, {
          available_balance: (earnings.available_balance || 0) + referral.referrer_reward.amount,
          total_earnings: (earnings.total_earnings || 0) + referral.referrer_reward.amount
        });
      } else {
        await base44.asServiceRole.entities.DriverEarnings.create({
          driver_id: referral.referrer_driver_id,
          available_balance: referral.referrer_reward.amount,
          total_earnings: referral.referrer_reward.amount
        });
      }

      const refereeEarnings = await base44.asServiceRole.entities.DriverEarnings.filter({
        driver_id: referral.referee_driver_id
      });

      if (refereeEarnings.length > 0) {
        const earnings = refereeEarnings[0];
        await base44.asServiceRole.entities.DriverEarnings.update(earnings.id, {
          available_balance: (earnings.available_balance || 0) + referral.referee_reward.amount,
          total_earnings: (earnings.total_earnings || 0) + referral.referee_reward.amount
        });
      } else {
        await base44.asServiceRole.entities.DriverEarnings.create({
          driver_id: referral.referee_driver_id,
          available_balance: referral.referee_reward.amount,
          total_earnings: referral.referee_reward.amount
        });
      }

      // Mark rewards as claimed
      await base44.asServiceRole.entities.DriverReferral.update(referral.id, {
        'referrer_reward.claimed': true,
        'referrer_reward.claimed_at': now,
        'referee_reward.claimed': true,
        'referee_reward.claimed_at': now,
        status: 'completed'
      });

      // Send notifications
      await base44.asServiceRole.entities.Notification.create({
        user_id: referral.referrer_driver_id,
        type: 'payment_received',
        title: '💰 Referral Bonus Earned!',
        message: `Your referral completed 20 rides! $${referral.referrer_reward.amount} has been added to your earnings.`,
        action_url: '/DriverEarnings'
      });

      await base44.asServiceRole.entities.Notification.create({
        user_id: referral.referee_driver_id,
        type: 'payment_received',
        title: '🎉 Welcome Bonus Unlocked!',
        message: `You completed 20 rides! $${referral.referee_reward.amount} has been added to your earnings.`,
        action_url: '/DriverEarnings'
      });
    } else {
      // Progress notification
      const remaining = referral.qualifying_rides_required - newCount;
      if (remaining === 10 || remaining === 5 || remaining === 1) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: driver.id,
          type: 'promotion',
          title: `🚀 ${remaining} Ride${remaining > 1 ? 's' : ''} to Go!`,
          message: `Complete ${remaining} more ride${remaining > 1 ? 's' : ''} to unlock your $${referral.referee_reward.amount} referral bonus.`,
          action_url: '/DriverReferrals'
        });
      }
    }

    return Response.json({ success: true, rides_completed: newCount });
  } catch (error) {
    console.error('Error checking referral progress:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});