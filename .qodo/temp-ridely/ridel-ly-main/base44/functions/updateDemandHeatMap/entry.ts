import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { latLngToCell } from 'npm:h3-js@4.1.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = base44.asServiceRole;
        
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        
        const recentRides = await serviceClient.entities.Ride.filter({
            created_date: { $gte: fifteenMinutesAgo.toISOString() }
        });
        
        const hexagonMap = new Map();
        
        for (const ride of recentRides) {
            if (ride.pickup_location?.latitude && ride.pickup_location?.longitude) {
                const h3Index = latLngToCell(
                    ride.pickup_location.latitude,
                    ride.pickup_location.longitude,
                    9
                );
                
                if (!hexagonMap.has(h3Index)) {
                    hexagonMap.set(h3Index, {
                        requests: 0,
                        completed: 0,
                        totalWaitTime: 0
                    });
                }
                
                const data = hexagonMap.get(h3Index);
                data.requests++;
                if (ride.status === 'completed') {
                    data.completed++;
                }
                
                // Calculate wait time if driver was assigned
                if (ride.actual_pickup_time && ride.created_date) {
                    const waitSeconds = (new Date(ride.actual_pickup_time) - new Date(ride.created_date)) / 1000;
                    data.totalWaitTime += waitSeconds;
                }
            }
        }
        
        const availableDrivers = await serviceClient.entities.DriverLocation.filter({
            is_available: true,
            last_ping: { $gte: new Date(now.getTime() - 5 * 60 * 1000).toISOString() }
        });
        
        const driversByHex = new Map();
        for (const driver of availableDrivers) {
            if (driver.h3_index) {
                driversByHex.set(
                    driver.h3_index,
                    (driversByHex.get(driver.h3_index) || 0) + 1
                );
            }
        }
        
        const updates = [];
        const timeWindowStart = fifteenMinutesAgo.toISOString();
        const timeWindowEnd = now.toISOString();
        
        for (const [h3Index, demandData] of hexagonMap.entries()) {
            const availableDriverCount = driversByHex.get(h3Index) || 0;
            const supplyDemandRatio = demandData.requests > 0 
                ? availableDriverCount / demandData.requests 
                : availableDriverCount;
            
            const suggestedSurge = supplyDemandRatio < 0.3 ? 2.5 :
                                  supplyDemandRatio < 0.5 ? 2.0 :
                                  supplyDemandRatio < 0.7 ? 1.5 :
                                  supplyDemandRatio < 0.9 ? 1.3 : 1.0;
            
            const avgWaitTime = demandData.completed > 0 && demandData.totalWaitTime > 0
                ? demandData.totalWaitTime / demandData.completed
                : 0;
            
            updates.push(
                serviceClient.entities.DemandHeatMap.create({
                    h3_index: h3Index,
                    time_window_start: timeWindowStart,
                    time_window_end: timeWindowEnd,
                    request_count: demandData.requests,
                    completed_count: demandData.completed,
                    available_drivers: availableDriverCount,
                    supply_demand_ratio: supplyDemandRatio,
                    suggested_surge: suggestedSurge,
                    average_wait_time_seconds: avgWaitTime,
                    day_of_week: now.toLocaleDateString('en-US', { weekday: 'lowercase' }),
                    time_of_day: now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'
                })
            );
        }
        
        await Promise.all(updates);
        
        console.log(`[HEATMAP] Updated ${updates.length} hexagons`);
        
        return Response.json({
            success: true,
            hexagonsUpdated: updates.length,
            timeWindow: `${fifteenMinutesAgo.toISOString()} to ${now.toISOString()}`
        });
        
    } catch (error) {
        console.error('[HEATMAP UPDATE ERROR]:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});