import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Calculate distance between two coordinates using Haversine formula
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

// Calculate match score for a driver (higher is better)
function calculateDriverScore(driver, ride) {
    const driverInfo = driver.driver_info || {};
    const driverLoc = driverInfo.current_location;
    const pickupLoc = ride.pickup_location;
    const destLoc = ride.destination;
    
    let score = 100; // Base score
    
    // 1. Distance to pickup (most important - up to 40 points)
    // Closer drivers get higher scores
    if (driverLoc && pickupLoc) {
        const distanceToPickup = calculateDistance(
            driverLoc.latitude, driverLoc.longitude,
            pickupLoc.latitude, pickupLoc.longitude
        );
        
        // Penalize drivers too far away
        const maxPickupDistance = driverInfo.max_pickup_distance_km || 15;
        if (distanceToPickup > maxPickupDistance) {
            return -1; // Exclude this driver
        }
        
        // Score: 40 points for 0km, decreasing linearly
        const distanceScore = Math.max(0, 40 - (distanceToPickup * 3));
        score += distanceScore;
        
        // Store for response
        driver._distanceToPickup = distanceToPickup;
        driver._estimatedArrival = Math.round((distanceToPickup / 30) * 60); // Assume 30km/h avg
    } else {
        // No location data - lower priority
        score -= 20;
    }
    
    // 2. Ride type preference (up to 15 points)
    const preferredTypes = driverInfo.preferred_ride_types || [];
    if (preferredTypes.length > 0) {
        if (preferredTypes.includes(ride.ride_type)) {
            score += 15; // Bonus for preferred type
        } else {
            score -= 5; // Small penalty for non-preferred
        }
    }
    
    // 3. Vehicle class match (up to 10 points)
    const vehicleClassMap = {
        'standard': ['RideShare', 'Comfort', 'RideShare XL', 'Premium'],
        'comfort': ['Comfort', 'Premium'],
        'xl': ['RideShare XL'],
        'premium': ['Premium']
    };
    const allowedClasses = vehicleClassMap[ride.ride_type] || ['RideShare'];
    if (allowedClasses.includes(driverInfo.vehicle_class)) {
        score += 10;
    } else {
        return -1; // Vehicle doesn't match ride type
    }
    
    // 4. Destination proximity to preferred zones (up to 10 points)
    const preferredZones = driverInfo.preferred_zones || [];
    if (preferredZones.length > 0 && destLoc) {
        let inPreferredZone = false;
        for (const zone of preferredZones) {
            const distToZone = calculateDistance(
                destLoc.latitude, destLoc.longitude,
                zone.latitude, zone.longitude
            );
            if (distToZone <= (zone.radius_km || 10)) {
                inPreferredZone = true;
                score += 10;
                break;
            }
        }
    }
    
    // 5. Trip length preference (up to 10 points)
    const tripDistance = ride.distance_km || 5;
    if (driverInfo.prefer_long_trips && tripDistance > 15) {
        score += 10; // Bonus for long trip lovers
    } else if (!driverInfo.prefer_long_trips && tripDistance <= 10) {
        score += 5; // Small bonus for short trip takers
    }
    
    // 6. Airport preference (up to 5 points)
    const isAirportRide = (pickupLoc?.address || '').toLowerCase().includes('airport') ||
                          (destLoc?.address || '').toLowerCase().includes('airport');
    if (driverInfo.prefer_airport && isAirportRide) {
        score += 5;
    }
    
    // 7. Driver rating bonus (up to 10 points)
    const rating = driver.average_rating || 4.5;
    score += (rating - 4) * 5; // 5 points per star above 4
    
    // 8. Acceptance/completion rate bonus (up to 10 points)
    const acceptanceRate = driverInfo.acceptance_rate || 100;
    const completionRate = driverInfo.completion_rate || 100;
    score += (acceptanceRate / 20) + (completionRate / 20); // Up to 10 points
    
    // 9. Location freshness penalty
    if (driverLoc?.last_updated) {
        const lastUpdate = new Date(driverLoc.last_updated);
        const minutesAgo = (Date.now() - lastUpdate.getTime()) / 60000;
        if (minutesAgo > 10) {
            score -= 15; // Stale location
        } else if (minutesAgo > 5) {
            score -= 5;
        }
    }
    
    return score;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { rideId } = await req.json();

        if (!rideId) {
            return Response.json({ success: false, message: 'Ride ID required' }, { status: 400 });
        }

        const ride = await base44.asServiceRole.entities.Ride.get(rideId);
        
        if (!ride) {
            return Response.json({ success: false, message: 'Ride not found' }, { status: 404 });
        }

        // Get all available drivers
        const allDrivers = await base44.asServiceRole.entities.User.filter({
            user_type: { $in: ['driver', 'both'] },
            'driver_info.is_available': true,
            status: 'active'
        });

        if (allDrivers.length === 0) {
            return Response.json({ 
                success: false, 
                message: 'No available drivers at the moment. Please try again shortly.' 
            });
        }

        // Calculate scores for all drivers
        const scoredDrivers = allDrivers
            .map(driver => ({
                driver,
                score: calculateDriverScore(driver, ride)
            }))
            .filter(item => item.score > 0) // Remove excluded drivers
            .sort((a, b) => b.score - a.score); // Sort by score descending

        if (scoredDrivers.length === 0) {
            return Response.json({ 
                success: false, 
                message: 'No suitable drivers found for this ride type and location.' 
            });
        }

        // Take top 5 best-matched drivers
        const bestDrivers = scoredDrivers.slice(0, 5);
        const expiresAt = new Date(Date.now() + 60000); // 60 second timeout

        // Create ride requests for best-matched drivers
        const createdRequests = [];
        for (const { driver, score } of bestDrivers) {
            try {
                await base44.asServiceRole.entities.RideRequest.create({
                    ride_id: rideId,
                    rider_id: ride.rider_id,
                    driver_id: driver.id,
                    pickup_location: ride.pickup_location,
                    destination: ride.destination,
                    ride_type: ride.ride_type,
                    estimated_fare: ride.fare?.total_fare || 10,
                    estimated_distance: ride.distance_km || 5,
                    estimated_duration: ride.duration_minutes || 15,
                    status: 'pending',
                    expires_at: expiresAt.toISOString()
                });
                
                createdRequests.push({
                    driverId: driver.id,
                    driverName: driver.full_name,
                    score: Math.round(score),
                    distanceToPickup: driver._distanceToPickup?.toFixed(1) || 'N/A',
                    estimatedArrival: driver._estimatedArrival || 5
                });
            } catch (reqError) {
                console.error('Error creating request for driver:', driver.id, reqError);
            }
        }

        if (createdRequests.length === 0) {
            return Response.json({ 
                success: false, 
                message: 'Failed to send ride requests. Please try again.' 
            });
        }

        // Log matching analytics
        console.log(`[MATCHING] Ride ${rideId}: Notified ${createdRequests.length} drivers. Top match score: ${createdRequests[0]?.score}`);

        return Response.json({ 
            success: true, 
            message: `Found ${createdRequests.length} matching drivers!`,
            driversNotified: createdRequests.length,
            bestMatch: {
                estimatedArrival: createdRequests[0]?.estimatedArrival || 5,
                matchScore: createdRequests[0]?.score || 0
            },
            matches: createdRequests
        });

    } catch (error) {
        console.error('Dispatch error:', error);
        return Response.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
});