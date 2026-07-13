import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { latLngToCell } from 'npm:h3-js@4.1.0';

// Time of day classification
function getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 12) return 'midday';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 && hour < 24) return 'night';
    return 'late_night';
}

function getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req, { useServiceRole: true });

    try {
        const { rideId } = await req.json();
        if (!rideId) {
            return new Response(JSON.stringify({ error: "rideId is required" }), { status: 400 });
        }

        const ride = await base44.entities.Ride.get(rideId);
        if (!ride || ride.status !== 'completed') {
            return new Response(JSON.stringify({ error: "Ride not found or not completed" }), { status: 400 });
        }

        // Calculate H3 indices
        const pickupH3 = latLngToCell(
            ride.pickup_location.latitude,
            ride.pickup_location.longitude,
            9
        );
        const dropoffH3 = latLngToCell(
            ride.destination.latitude,
            ride.destination.longitude,
            9
        );

        // Calculate actual duration
        const startTime = new Date(ride.actual_pickup_time || ride.created_date);
        const endTime = new Date(ride.completion_time);
        const actualDuration = (endTime - startTime) / 1000 / 60; // minutes

        // Calculate accuracy if we had an estimate
        let accuracyScore = null;
        if (ride.duration_minutes) {
            const diff = Math.abs(actualDuration - ride.duration_minutes);
            accuracyScore = Math.max(0, 1 - (diff / ride.duration_minutes));
        }

        // Find acceptance time from RideRequest
        const rideRequests = await base44.entities.RideRequest.filter({
            ride_id: ride.id,
            driver_id: ride.driver_id,
            status: 'accepted'
        });
        
        let acceptanceTime = null;
        if (rideRequests.length > 0) {
            const request = rideRequests[0];
            const requestTime = new Date(request.created_date);
            const responseTime = new Date(request.response_time);
            acceptanceTime = (responseTime - requestTime) / 1000; // seconds
        }

        // Create analytics record
        const analyticsData = {
            ride_id: ride.id,
            pickup_h3: pickupH3,
            dropoff_h3: dropoffH3,
            time_of_day: getTimeOfDay(startTime),
            day_of_week: getDayOfWeek(startTime),
            actual_duration_minutes: actualDuration,
            estimated_duration_minutes: ride.duration_minutes,
            accuracy_score: accuracyScore,
            distance_km: ride.distance_km,
            surge_multiplier: ride.fare?.surge_multiplier || 1,
            driver_acceptance_time_seconds: acceptanceTime,
            ride_type: ride.ride_type
        };

        await base44.entities.RideAnalytics.create(analyticsData);

        console.log(`[ANALYTICS] Recorded analytics for ride ${rideId}`);

        // Check driver referral progress
        try {
            await base44.functions.invoke('checkDriverReferralProgress', { rideId });
        } catch (err) {
            console.log('[ANALYTICS] Referral check skipped:', err.message);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error("Error recording analytics:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});