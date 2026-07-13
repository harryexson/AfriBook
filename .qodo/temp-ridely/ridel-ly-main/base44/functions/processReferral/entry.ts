import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Generate a unique referral code for a user
function generateReferralCode(userName, userId) {
    const prefix = userName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const suffix = userId.substring(0, 5).toUpperCase();
    return `${prefix}${suffix}`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const serviceClient = base44.asServiceRole;
        
        const { action, referralCode, rideId } = await req.json();

        // Action 1: Get or create referral code for current user
        if (action === 'get_referral_code') {
            const user = await base44.auth.me();
            if (!user) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user already has a referral code
            let userReferralCode = user.referral_code;
            
            if (!userReferralCode) {
                // Generate new referral code
                userReferralCode = generateReferralCode(user.full_name || 'USER', user.id);
                
                // Update user with referral code
                await serviceClient.entities.User.update(user.id, {
                    referral_code: userReferralCode
                });
            }

            // Get referral statistics
            const referrals = await serviceClient.entities.Referral.filter({
                referrer_id: user.id
            });

            const completedReferrals = referrals.filter(r => r.status === 'completed').length;
            const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
            
            const totalEarned = referrals
                .filter(r => r.status === 'completed' && r.referrer_reward?.claimed)
                .reduce((sum, r) => sum + (r.referrer_reward?.value || 0), 0);

            return new Response(JSON.stringify({
                success: true,
                referral_code: userReferralCode,
                stats: {
                    total_referrals: referrals.length,
                    completed: completedReferrals,
                    pending: pendingReferrals,
                    total_earned: totalEarned
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Action 2: Apply referral code during signup/first ride
        if (action === 'apply_referral') {
            const user = await base44.auth.me();
            if (!user) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!referralCode) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Referral code is required'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Check if user has already used a referral code
            const existingReferrals = await serviceClient.entities.Referral.filter({
                referee_id: user.id
            });

            if (existingReferrals.length > 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'You have already used a referral code'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Find the referrer by referral code
            const referrers = await serviceClient.entities.User.filter({
                referral_code: referralCode.toUpperCase()
            });

            if (referrers.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid referral code'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const referrer = referrers[0];

            // Can't refer yourself
            if (referrer.id === user.id) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'You cannot use your own referral code'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Create referral record
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to complete

            const referral = await serviceClient.entities.Referral.create({
                referrer_id: referrer.id,
                referee_id: user.id,
                referral_code: referralCode.toUpperCase(),
                status: 'pending',
                referrer_reward: {
                    type: 'credit',
                    value: 10,
                    claimed: false
                },
                referee_reward: {
                    type: 'credit',
                    value: 5,
                    claimed: false
                },
                expires_at: expiresAt.toISOString()
            });

            // Give immediate credit to referee
            let refereeCredit = await serviceClient.entities.UserCredit.filter({
                user_id: user.id
            });

            if (refereeCredit.length === 0) {
                await serviceClient.entities.UserCredit.create({
                    user_id: user.id,
                    total_credits: 5,
                    referral_credits: 5,
                    credit_history: [{
                        amount: 5,
                        type: 'earned',
                        source: 'referral',
                        description: `Welcome! You got $5 credit from ${referrer.full_name?.split(' ')[0] || 'a friend'}`,
                        date: new Date().toISOString()
                    }]
                });
            } else {
                const credit = refereeCredit[0];
                await serviceClient.entities.UserCredit.update(credit.id, {
                    total_credits: (credit.total_credits || 0) + 5,
                    referral_credits: (credit.referral_credits || 0) + 5,
                    credit_history: [
                        ...(credit.credit_history || []),
                        {
                            amount: 5,
                            type: 'earned',
                            source: 'referral',
                            description: `Welcome! You got $5 credit from ${referrer.full_name?.split(' ')[0] || 'a friend'}`,
                            date: new Date().toISOString()
                        }
                    ]
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Referral code applied! You received $5 credit',
                credit_earned: 5
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Action 3: Complete referral after first ride
        if (action === 'complete_referral') {
            if (!rideId) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Ride ID is required'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const ride = await serviceClient.entities.Ride.get(rideId);
            if (!ride || ride.status !== 'completed') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid or incomplete ride'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Find pending referral for this user
            const pendingReferrals = await serviceClient.entities.Referral.filter({
                referee_id: ride.rider_id,
                status: 'pending'
            });

            if (pendingReferrals.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'No pending referral found'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const referral = pendingReferrals[0];

            // Mark referral as completed
            await serviceClient.entities.Referral.update(referral.id, {
                status: 'completed',
                qualifying_ride_id: rideId,
                completed_at: new Date().toISOString(),
                'referrer_reward.claimed': true,
                'referrer_reward.claimed_at': new Date().toISOString()
            });

            // Give credit to referrer
            let referrerCredit = await serviceClient.entities.UserCredit.filter({
                user_id: referral.referrer_id
            });

            const referrerRewardValue = referral.referrer_reward?.value || 10;

            if (referrerCredit.length === 0) {
                await serviceClient.entities.UserCredit.create({
                    user_id: referral.referrer_id,
                    total_credits: referrerRewardValue,
                    referral_credits: referrerRewardValue,
                    credit_history: [{
                        amount: referrerRewardValue,
                        type: 'earned',
                        source: 'referral',
                        description: 'Referral completed! Your friend took their first ride',
                        date: new Date().toISOString()
                    }]
                });
            } else {
                const credit = referrerCredit[0];
                await serviceClient.entities.UserCredit.update(credit.id, {
                    total_credits: (credit.total_credits || 0) + referrerRewardValue,
                    referral_credits: (credit.referral_credits || 0) + referrerRewardValue,
                    credit_history: [
                        ...(credit.credit_history || []),
                        {
                            amount: referrerRewardValue,
                            type: 'earned',
                            source: 'referral',
                            description: 'Referral completed! Your friend took their first ride',
                            date: new Date().toISOString()
                        }
                    ]
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Referral completed successfully',
                reward_amount: referrerRewardValue
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid action'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[REFERRAL ERROR]:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});