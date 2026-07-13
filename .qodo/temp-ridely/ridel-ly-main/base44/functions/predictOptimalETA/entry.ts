import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { latLngToCell } from 'npm:h3-js@4.1.0';

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
        const { pickupLat, pickupLng, dropoffLat, dropoffLng, distance } = await req.json();
        
        if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
            return new Response(JSON.stringify({ error: "All coordinates required" }), { status: 400 });
        }

        const now = new Date();
        const timeOfDay = getTimeOfDay(now);
        const dayOfWeek = getDayOfWeek(now);

        // Calculate H3 indices
        const pickupH3 = latLngToCell(pickupLat, pickupLng, 9);
        const dropoffH3 = latLngToCell(dropoffLat, dropoffLng, 9);

        // Get historical data for similar routes
        const historicalRides = await base44.entities.RideAnalytics.filter({
            pickup_h3: pickupH3,
            dropoff_h3: dropoffH3,
            time_of_day: timeOfDay
        }, '-created_date', 20);

        if (historicalRides.length >= 5) {
            // We have enough data for ML-based prediction
            const durations = historicalRides.map(r => r.actual_duration_minutes);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            
            // Calculate standard deviation for confidence
            const variance = durations.reduce((sum, val) => sum + Math.pow(val - avgDuration, 2), 0) / durations.length;
            const stdDev = Math.sqrt(variance);
            const confidence = Math.max(0, Math.min(1, 1 - (stdDev / avgDuration)));

            console.log(`[ML ETA] Historical prediction: ${Math.round(avgDuration)} min (confidence: ${(confidence * 100).toFixed(1)}%)`);

            return new Response(JSON.stringify({
                predicted_duration_minutes: Math.round(avgDuration),
                confidence_score: confidence,
                method: 'historical_ml',
                sample_size: historicalRides.length,
                time_of_day: timeOfDay,
                day_of_week: dayOfWeek
            }), { status: 200 });
        } else {
            // Fallback to basic calculation
            const baseSpeed = 40; // km/h
            let adjustmentFactor = 1.0;

            // Time-based adjustments
            if (timeOfDay === 'morning' || timeOfDay === 'afternoon') adjustmentFactor = 1.3; // Rush hour
            else if (timeOfDay === 'evening') adjustmentFactor = 1.2;
            else if (timeOfDay === 'night' || timeOfDay === 'late_night') adjustmentFactor = 0.8; // Faster at night

            // Day-based adjustments
            if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') adjustmentFactor *= 0.9;

            const adjustedSpeed = baseSpeed / adjustmentFactor;
            const predictedDuration = (distance / adjustedSpeed) * 60; // Convert to minutes

            console.log(`[BASIC ETA] Calculated: ${Math.round(predictedDuration)} min (insufficient historical data)`);

            return new Response(JSON.stringify({
                predicted_duration_minutes: Math.round(predictedDuration),
                confidence_score: 0.6,
                method: 'rule_based',
                time_of_day: timeOfDay,
                day_of_week: dayOfWeek
            }), { status: 200 });
        }

    } catch (error) {
        console.error("Error predicting ETA:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});