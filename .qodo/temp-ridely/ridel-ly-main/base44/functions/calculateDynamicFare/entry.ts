import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Calculate distance in MILES (for US market)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles (changed from 6371 km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
}

function estimateDuration(distanceMiles) {
    const avgSpeedMph = 25; // Average speed in mph (changed from km/h)
    return (distanceMiles / avgSpeedMph) * 60; // Returns minutes
}

async function calculateSurgeMultiplier(base44, pickupLat, pickupLng, isScheduled, scheduledTime) {
    if (isScheduled) {
        return { multiplier: 1.0, reason: null };
    }

    try {
        const h3 = await import('npm:h3-js@4.1.0');
        const pickupH3 = h3.latLngToCell(pickupLat, pickupLng, 9);

        const activeSurgeZones = await base44.asServiceRole.entities.SurgePricingZone.filter({
            h3_index: pickupH3,
            active_until: { $gte: new Date().toISOString() }
        });

        if (activeSurgeZones.length > 0) {
            const zone = activeSurgeZones[0];
            return {
                multiplier: zone.surge_multiplier,
                reason: zone.reason
            };
        }
    } catch (error) {
        console.log('[SURGE] Could not check surge zones:', error.message);
    }

    return { multiplier: 1.0, reason: null };
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await req.json();
        const { 
            pickupLat, 
            pickupLng, 
            dropoffLat, 
            dropoffLng, 
            rideType = 'standard',
            isScheduled = false,
            scheduledTime = null
        } = body;

        if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
            return new Response(JSON.stringify({ 
                error: 'Missing required location parameters' 
            }), { status: 400 });
        }

        // Calculate distance in MILES
        const distanceMiles = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
        const durationMinutes = estimateDuration(distanceMiles);

        // Base fare structure (adjusted for miles)
        const rideTypeFares = {
            standard: { base: 2.50, perMile: 1.50, perMinute: 0.25 },
            premium: { base: 5.00, perMile: 2.50, perMinute: 0.40 },
            xl: { base: 4.00, perMile: 2.00, perMinute: 0.35 },
            pool: { base: 1.50, perMile: 1.00, perMinute: 0.20 }
        };

        const fareConfig = rideTypeFares[rideType] || rideTypeFares.standard;

        const baseFare = fareConfig.base;
        const distanceFare = distanceMiles * fareConfig.perMile;
        const timeFare = durationMinutes * fareConfig.perMinute;
        const subtotalBeforeSurge = baseFare + distanceFare + timeFare;

        // Calculate surge
        const surgeData = await calculateSurgeMultiplier(
            base44, 
            pickupLat, 
            pickupLng, 
            isScheduled, 
            scheduledTime
        );

        const totalFare = subtotalBeforeSurge * surgeData.multiplier;
        const platformFee = totalFare * 0.20; // 20% platform fee
        const driverEarnings = totalFare - platformFee;

        const fare = {
            base_fare: baseFare,
            distance_fare: distanceFare,
            time_fare: timeFare,
            subtotal_before_surge: subtotalBeforeSurge,
            surge_multiplier: surgeData.multiplier,
            surge_reason: surgeData.reason,
            total_fare: totalFare,
            platform_fee: platformFee,
            driver_earnings: driverEarnings,
            estimated_distance_miles: distanceMiles, // Changed from km
            estimated_duration_minutes: Math.round(durationMinutes),
            currency: 'USD'
        };

        console.log('[FARE CALCULATION]', {
            distance: distanceMiles.toFixed(2) + ' mi',
            duration: Math.round(durationMinutes) + ' min',
            surge: surgeData.multiplier + 'x',
            total: '$' + totalFare.toFixed(2)
        });

        return new Response(JSON.stringify({
            success: true,
            fare: fare
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[FARE CALCULATION ERROR]:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            success: false
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});