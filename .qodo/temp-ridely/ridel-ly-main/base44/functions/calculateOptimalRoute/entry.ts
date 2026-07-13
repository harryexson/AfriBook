import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Haversine distance calculation in MILES
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles (changed from km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Returns miles
}

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

// Get time-based traffic multiplier
function getTrafficMultiplier(hour, dayOfWeek) {
    // Peak morning rush: 7-9 AM
    if (hour >= 7 && hour <= 9 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        return 1.6;
    }
    // Peak evening rush: 5-7 PM
    if (hour >= 17 && hour <= 19 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        return 1.7;
    }
    // Late evening: 7-10 PM
    if (hour >= 19 && hour <= 22) {
        return 1.2;
    }
    // Late night: 10 PM - 6 AM
    if (hour >= 22 || hour <= 6) {
        return 0.7;
    }
    // Weekend nights: 10 PM - 2 AM
    if ((dayOfWeek === 5 || dayOfWeek === 6) && (hour >= 22 || hour <= 2)) {
        return 1.3;
    }
    // Regular daytime
    return 1.0;
}

// Generate waypoints along the route
function generateRouteWaypoints(startLat, startLng, endLat, endLng, segments = 10) {
    const waypoints = [];
    
    for (let i = 0; i <= segments; i++) {
        const fraction = i / segments;
        const lat = startLat + (endLat - startLat) * fraction;
        const lng = startLng + (endLng - startLng) * fraction;
        
        waypoints.push({ lat, lng });
    }
    
    return waypoints;
}

// Get turn instruction based on bearing change
function getTurnInstruction(bearingChange) {
    const absBearing = Math.abs(bearingChange);
    
    if (absBearing < 20) {
        return { type: 'continue', instruction: 'Continue straight' };
    } else if (absBearing < 45) {
        return { 
            type: bearingChange > 0 ? 'slight_right' : 'slight_left',
            instruction: bearingChange > 0 ? 'Turn slight right' : 'Turn slight left'
        };
    } else if (absBearing < 135) {
        return { 
            type: bearingChange > 0 ? 'turn_right' : 'turn_left',
            instruction: bearingChange > 0 ? 'Turn right' : 'Turn left'
        };
    } else {
        return { type: 'u_turn', instruction: 'Make a U-turn' };
    }
}

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

        const { 
            startLat, 
            startLng, 
            endLat, 
            endLng,
            avoidTolls = false,
            avoidHighways = false,
            routePreference = 'fastest'
        } = await req.json();

        if (!startLat || !startLng || !endLat || !endLng) {
            return new Response(JSON.stringify({ 
                error: 'Missing required coordinates' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const currentTime = new Date();
        const hour = currentTime.getHours();
        const dayOfWeek = currentTime.getDay();
        
        // Generate waypoints along the route
        const waypoints = generateRouteWaypoints(startLat, startLng, endLat, endLng, 10);
        
        // Calculate route details in MILES
        let totalDistance = 0;
        let previousBearing = null;
        const instructions = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const current = waypoints[i];
            const next = waypoints[i + 1];
            
            const segmentDistance = calculateDistance(
                current.lat, current.lng,
                next.lat, next.lng
            );
            
            totalDistance += segmentDistance;
            
            const bearing = calculateBearing(
                current.lat, current.lng,
                next.lat, next.lng
            );
            
            if (previousBearing !== null && i % 3 === 0) {
                const bearingChange = bearing - previousBearing;
                const turnInstruction = getTurnInstruction(bearingChange);
                
                instructions.push({
                    distance_from_start: totalDistance,
                    instruction: turnInstruction.instruction,
                    type: turnInstruction.type,
                    location: { lat: current.lat, lng: current.lng },
                    traffic_level: 'light'
                });
            }
            
            previousBearing = bearing;
        }
        
        const trafficMultiplier = getTrafficMultiplier(hour, dayOfWeek);
        const baseSpeed = 25; // Average speed in mph (changed from km/h)
        const adjustedSpeed = baseSpeed / trafficMultiplier;
        const totalDuration = (totalDistance / adjustedSpeed) * 60; // minutes
        
        const route = {
            total_distance_miles: totalDistance, // Changed from km
            total_duration_minutes: Math.round(totalDuration),
            waypoints,
            instructions,
            traffic_multiplier: trafficMultiplier,
            name: 'Primary Route',
            is_recommended: true
        };
        
        const trafficCondition = trafficMultiplier > 1.4 ? 'heavy' : 
                                 trafficMultiplier > 1.1 ? 'moderate' : 'light';
        
        const trafficSummary = {
            current_condition: trafficCondition,
            peak_hours: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19),
            estimated_delay_minutes: Math.round((trafficMultiplier - 1) * 10),
            recommendation: trafficCondition === 'heavy' 
                ? 'Consider waiting or taking alternative route'
                : 'Good time to drive'
        };
        
        console.log('[ROUTE CALCULATION]', {
            distance: route.total_distance_miles.toFixed(2) + ' mi',
            duration: route.total_duration_minutes + ' min',
            traffic: trafficCondition
        });
        
        return new Response(JSON.stringify({
            success: true,
            routes: [route],
            recommended_route: route,
            traffic_summary: trafficSummary,
            calculated_at: currentTime.toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[ROUTE CALCULATION ERROR]:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            success: false
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});