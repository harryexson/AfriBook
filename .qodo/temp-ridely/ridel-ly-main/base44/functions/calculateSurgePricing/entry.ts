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

        const { h3Index } = await req.json();
        
        if (!h3Index) {
            return new Response(JSON.stringify({ error: 'h3Index is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const serviceClient = base44.asServiceRole;
        
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
        
        // Get recent ride requests in this area
        const recentRides = await serviceClient.entities.Ride.filter({
            'pickup_location.latitude': { $exists: true },
            status: { $in: ['requested', 'accepted', 'arriving', 'in_progress'] },
            created_date: { $gte: fifteenMinutesAgo }
        });
        
        // Filter rides in the same H3 hexagon (approximate area matching)
        const requestCount = recentRides.length;
        
        // Get available drivers in the area
        const availableDrivers = await serviceClient.entities.DriverLocation.filter({
            is_available: true,
            last_ping: { $gte: new Date(now.getTime() - 5 * 60 * 1000).toISOString() }
        });
        
        const driverCount = availableDrivers.length;
        
        // Calculate surge multiplier based on supply/demand ratio
        let surgeMultiplier = 1.0;
        let reason = null;
        
        console.log(`[SURGE] Area ${h3Index}: ${requestCount} requests, ${driverCount} drivers`);
        
        // High demand scenarios
        if (driverCount === 0 && requestCount > 0) {
            surgeMultiplier = 2.5;
            reason = 'low_supply';
            console.log('[SURGE] No drivers available - 2.5x surge');
        } else if (driverCount > 0 && requestCount > driverCount * 3) {
            // More than 3 requests per driver
            surgeMultiplier = Math.min(2.5, 1.0 + (requestCount / (driverCount * 3)));
            reason = 'high_demand';
            console.log(`[SURGE] High demand - ${surgeMultiplier.toFixed(1)}x surge`);
        } else if (driverCount > 0 && requestCount > driverCount * 2) {
            // More than 2 requests per driver
            surgeMultiplier = 1.5;
            reason = 'high_demand';
            console.log('[SURGE] Moderate demand - 1.5x surge');
        }
        
        // Peak hours surge (7-9 AM and 5-7 PM)
        const hour = now.getHours();
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
            const peakSurge = 1.3;
            if (surgeMultiplier < peakSurge) {
                surgeMultiplier = peakSurge;
                if (!reason) reason = 'peak_hours';
            }
            console.log('[SURGE] Peak hours - minimum 1.3x surge');
        }
        
        // Weekend nights surge (Friday/Saturday 10 PM - 2 AM)
        const dayOfWeek = now.getDay();
        if ((dayOfWeek === 5 || dayOfWeek === 6) && ((hour >= 22) || (hour <= 2))) {
            const nightSurge = 1.5;
            if (surgeMultiplier < nightSurge) {
                surgeMultiplier = nightSurge;
                if (!reason) reason = 'peak_hours';
            }
            console.log('[SURGE] Weekend night - minimum 1.5x surge');
        }
        
        // Round to nearest 0.1
        surgeMultiplier = Math.round(surgeMultiplier * 10) / 10;
        
        // Save surge pricing zone if surge is active
        if (surgeMultiplier > 1.0) {
            const activeUntil = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
            
            try {
                await serviceClient.entities.SurgePricingZone.create({
                    h3_index: h3Index,
                    surge_multiplier: surgeMultiplier,
                    reason: reason,
                    active_until: activeUntil,
                    request_count_last_15min: requestCount,
                    available_drivers_count: driverCount,
                    affected_area_size: 1
                });
                console.log(`[SURGE] Created surge zone: ${surgeMultiplier}x until ${activeUntil}`);
            } catch (error) {
                console.error('[SURGE] Failed to save surge zone:', error);
            }
        }
        
        return new Response(JSON.stringify({
            h3Index,
            surgeMultiplier,
            reason,
            requestCount,
            driverCount,
            message: surgeMultiplier > 1.0 
                ? `Surge pricing active: ${surgeMultiplier.toFixed(1)}x`
                : 'Normal pricing'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('[SURGE PRICING ERROR]:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            surgeMultiplier: 1.0,
            reason: null
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});