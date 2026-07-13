import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { promoCode, fareAmount, serviceType = 'ride' } = await req.json();

        if (!promoCode || !fareAmount) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Promo code and fare amount are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const serviceClient = base44.asServiceRole;

        // Find the promo code
        const promoCodes = await serviceClient.entities.PromoCode.filter({
            code: promoCode.toUpperCase(),
            is_active: true
        });

        if (promoCodes.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid or expired promo code'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const promo = promoCodes[0];
        const now = new Date();

        // Validate date range
        if (promo.valid_from && new Date(promo.valid_from) > now) {
            return new Response(JSON.stringify({
                success: false,
                error: 'This promo code is not yet active'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (new Date(promo.valid_until) < now) {
            return new Response(JSON.stringify({
                success: false,
                error: 'This promo code has expired'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check total usage limit
        if (promo.total_usage_limit && promo.times_used >= promo.total_usage_limit) {
            return new Response(JSON.stringify({
                success: false,
                error: 'This promo code has reached its usage limit'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check service type applicability
        if (promo.applicable_to && promo.applicable_to.length > 0) {
            if (!promo.applicable_to.includes('all') && !promo.applicable_to.includes(serviceType)) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `This promo code is not valid for ${serviceType}s`
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Check minimum fare requirement
        if (promo.min_ride_value && fareAmount < promo.min_ride_value) {
            return new Response(JSON.stringify({
                success: false,
                error: `Minimum fare of $${promo.min_ride_value.toFixed(2)} required to use this code`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check user type restriction
        if (promo.user_type_restriction === 'new_users') {
            const userRides = await serviceClient.entities.Ride.filter({
                rider_id: user.id,
                status: 'completed'
            });
            if (userRides.length > 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'This promo code is only for new users'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Check per-user usage limit
        const userUsage = await serviceClient.entities.UserPromoUsage.filter({
            user_id: user.id,
            promo_code_id: promo.id
        });

        if (userUsage.length >= promo.per_user_limit) {
            return new Response(JSON.stringify({
                success: false,
                error: `You have already used this promo code ${promo.per_user_limit} time(s)`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate discount
        let discountAmount = 0;

        if (promo.discount_type === 'percentage') {
            discountAmount = (fareAmount * promo.discount_value) / 100;
            if (promo.max_discount && discountAmount > promo.max_discount) {
                discountAmount = promo.max_discount;
            }
        } else if (promo.discount_type === 'fixed_amount') {
            discountAmount = Math.min(promo.discount_value, fareAmount);
        } else if (promo.discount_type === 'free_delivery') {
            discountAmount = fareAmount;
        }

        const finalFare = Math.max(0, fareAmount - discountAmount);

        console.log('[PROMO CODE] Applied:', {
            code: promoCode,
            user_id: user.id,
            original_fare: fareAmount,
            discount: discountAmount,
            final_fare: finalFare
        });

        return new Response(JSON.stringify({
            success: true,
            promo_id: promo.id,
            discount_type: promo.discount_type,
            discount_amount: Math.round(discountAmount * 100) / 100,
            original_fare: fareAmount,
            final_fare: Math.round(finalFare * 100) / 100,
            message: `${promo.discount_type === 'percentage' ? promo.discount_value + '%' : '$' + promo.discount_value} discount applied!`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[PROMO CODE ERROR]:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});