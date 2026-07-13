import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Haversine formula to calculate distance between two lat/lng points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Estimate time in minutes based on distance (assuming average speed of 40 km/h in city)
function estimateArrivalTime(distanceKm) {
    const averageSpeedKmh = 40;
    return Math.round((distanceKm / averageSpeedKmh) * 60);
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (!user) {
            console.error('[DISPATCH] Unauthorized request');
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { rideId } = await req.json();
        console.log(`[DISPATCH] Starting dispatch for ride: ${rideId}`);
        
        if (!rideId) {
            return new Response(JSON.stringify({ error: "rideId is required" }), { status: 400 });
        }
        
        const serviceClient = base44.asServiceRole;
        const ride = await serviceClient.entities.Ride.get(rideId);
        
        if (!ride) {
            console.error(`[DISPATCH] Ride not found: ${rideId}`);
            return new Response(JSON.stringify({ error: "Ride not found" }), { status: 404 });
        }

        console.log(`[DISPATCH] Ride ${rideId} - Rider: ${ride.rider_id}, Pickup: ${ride.pickup_location?.address}`);

        if (!ride.pickup_location?.latitude || !ride.pickup_location?.longitude) {
            console.error('[DISPATCH] Invalid pickup location');
            return new Response(JSON.stringify({ error: "Invalid pickup location" }), { status: 400 });
        }

        // SIMPLIFIED: Just get all available drivers directly from User entity
        console.log('[DISPATCH] Fetching all available drivers...');
        const allDrivers = await serviceClient.entities.User.filter({
            user_type: { $in: ['driver', 'both'] },
            'driver_info.is_available': true,
            id: { $ne: ride.rider_id }
        });

        console.log(`[DISPATCH] Found ${allDrivers.length} available drivers`);

        if (allDrivers.length === 0) {
            console.error('[DISPATCH] No available drivers found');
            await serviceClient.entities.Ride.update(rideId, { 
                status: "cancelled", 
                notes: "No available drivers found in your area." 
            });
            return new Response(JSON.stringify({ 
                success: false, 
                message: "No available drivers found." 
            }), { status: 200 });
        }

        // Calculate distance for each driver
        const driversWithDistance = allDrivers
            .filter(driver => driver.driver_info?.current_location?.latitude && driver.driver_info?.current_location?.longitude)
            .map(driver => {
                const distance = calculateDistance(
                    ride.pickup_location.latitude,
                    ride.pickup_location.longitude,
                    driver.driver_info.current_location.latitude,
                    driver.driver_info.current_location.longitude
                );
                const eta = estimateArrivalTime(distance);
                
                return {
                    driver,
                    distance: distance,
                    eta: eta
                };
            })
            .sort((a, b) => a.distance - b.distance); // Sort by closest first

        console.log(`[DISPATCH] ${driversWithDistance.length} drivers have valid locations`);

        if (driversWithDistance.length === 0) {
            await serviceClient.entities.Ride.update(rideId, { 
                status: "cancelled", 
                notes: "No drivers with valid location found." 
            });
            return new Response(JSON.stringify({ 
                success: false, 
                message: "No drivers with location data available." 
            }), { status: 200 });
        }

        // Send to closest 5 drivers
        const MAX_INITIAL_DRIVERS = 5;
        const closestDrivers = driversWithDistance.slice(0, MAX_INITIAL_DRIVERS);

        console.log(`[DISPATCH] Ride ${rideId}: Sending to ${closestDrivers.length} closest drivers`);
        closestDrivers.forEach((driverData, index) => {
            console.log(`  ${index + 1}. Driver ${driverData.driver.email} (${driverData.driver.id}): ${driverData.distance.toFixed(2)}km away, ETA ${driverData.eta}min`);
        });

        // Create RideRequest for each driver
        const rideRequestPromises = closestDrivers.map(driverData => {
            console.log(`[DISPATCH] Creating RideRequest for driver ${driverData.driver.email}`);
            return serviceClient.entities.RideRequest.create({
                ride_id: ride.id,
                rider_id: ride.rider_id,
                driver_id: driverData.driver.id,
                pickup_location: ride.pickup_location,
                destination: ride.destination,
                ride_type: ride.ride_type,
                estimated_fare: ride.fare?.total_fare,
                estimated_distance: driverData.distance,
                estimated_duration: driverData.eta,
                status: 'pending',
                expires_at: new Date(Date.now() + 60 * 1000).toISOString(), // 60 seconds
            });
        });

        const createdRequests = await Promise.all(rideRequestPromises);
        console.log(`[DISPATCH] Created ${createdRequests.length} RideRequest records`);

        // Update ride with estimated info
        await serviceClient.entities.Ride.update(rideId, {
            distance_km: closestDrivers[0].distance,
            duration_minutes: closestDrivers[0].eta
        });

        console.log(`[DISPATCH] SUCCESS - Dispatch complete for ride ${rideId}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Dispatched to ${closestDrivers.length} nearby drivers`,
            closest_driver_distance_km: closestDrivers[0].distance.toFixed(2),
            closest_driver_eta_min: closestDrivers[0].eta,
            drivers_notified: closestDrivers.map(d => ({ email: d.driver.email, id: d.driver.id }))
        }), { status: 200 });

    } catch (error) {
        console.error("[DISPATCH ERROR]:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});