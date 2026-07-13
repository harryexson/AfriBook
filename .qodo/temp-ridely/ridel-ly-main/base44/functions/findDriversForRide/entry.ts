import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Haversine formula to calculate distance in MILES (changed from km)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles (changed from 6371 km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Returns miles
}

// Estimate time in minutes based on distance in miles (average speed 25 mph in city)
function estimateArrivalTime(distanceMiles) {
    const averageSpeedMph = 25; // Changed from km/h
    return Math.round((distanceMiles / averageSpeedMph) * 60);
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { rideId } = await req.json();
        if (!rideId) {
            return new Response(JSON.stringify({ error: "rideId is required" }), { status: 400 });
        }
        
        const serviceClient = base44.asServiceRole;
        const ride = await serviceClient.entities.Ride.get(rideId);
        
        if (!ride) {
            return new Response(JSON.stringify({ error: "Ride not found" }), { status: 404 });
        }

        if (!ride.pickup_location?.latitude || !ride.pickup_location?.longitude) {
            return new Response(JSON.stringify({ error: "Invalid pickup location" }), { status: 400 });
        }

        // Find all available drivers, excluding the rider
        const availableDrivers = await serviceClient.entities.User.filter({
            user_type: { $in: ['driver', 'both'] },
            'driver_info.is_available': true,
            id: { $ne: ride.rider_id }
        });

        if (availableDrivers.length === 0) {
            await serviceClient.entities.Ride.update(rideId, { 
                status: "cancelled", 
                notes: "No available drivers found in your area." 
            });
            return new Response(JSON.stringify({ 
                success: false, 
                message: "No available drivers found." 
            }), { status: 200 });
        }

        // Calculate distance in MILES for each driver and sort by proximity
        const driversWithDistance = availableDrivers
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
                    distance: distance, // Now in miles
                    eta: eta
                };
            })
            .sort((a, b) => a.distance - b.distance);

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

        // Send to the closest 5 drivers initially
        const MAX_INITIAL_DRIVERS = 5;
        const closestDrivers = driversWithDistance.slice(0, MAX_INITIAL_DRIVERS);

        console.log(`[DISPATCH] Ride ${rideId}: Sending to ${closestDrivers.length} closest drivers`);
        closestDrivers.forEach((driverData, index) => {
            console.log(`  ${index + 1}. Driver ${driverData.driver.id}: ${driverData.distance.toFixed(2)} mi away, ETA ${driverData.eta} min`);
        });

        // Create RideRequest for each of the closest drivers
        const rideRequestPromises = closestDrivers.map(driverData => {
            return serviceClient.entities.RideRequest.create({
                ride_id: ride.id,
                rider_id: ride.rider_id,
                driver_id: driverData.driver.id,
                pickup_location: ride.pickup_location,
                destination: ride.destination,
                ride_type: ride.ride_type,
                estimated_fare: ride.fare?.total_fare,
                estimated_distance: driverData.distance, // Now in miles
                estimated_duration: driverData.eta,
                status: 'pending',
                expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
            });
        });

        await Promise.all(rideRequestPromises);

        // Update the ride with estimated info from the closest driver
        await serviceClient.entities.Ride.update(rideId, {
            distance_km: closestDrivers[0].distance, // Field name still distance_km but value is in miles
            duration_minutes: closestDrivers[0].eta
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Dispatched to ${closestDrivers.length} nearby drivers`,
            closest_driver_distance_miles: closestDrivers[0].distance.toFixed(2), // Changed to miles
            closest_driver_eta_min: closestDrivers[0].eta
        }), { status: 200 });

    } catch (error) {
        console.error("[DISPATCH ERROR]:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});