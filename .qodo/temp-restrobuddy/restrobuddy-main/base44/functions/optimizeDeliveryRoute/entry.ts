import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driver_location, delivery_addresses, restaurant_address } = await req.json();

    if (!driver_location || !delivery_addresses || !restaurant_address) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simple greedy algorithm for route optimization
    // Start from restaurant, visit nearest unvisited delivery, repeat
    const unvisited = [...delivery_addresses];
    const route = [];
    let currentLocation = restaurant_address;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = calculateDistance(currentLocation, unvisited[0]);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(currentLocation, unvisited[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      const nextStop = unvisited[nearestIndex];
      route.push({
        order_id: nextStop.order_id,
        address: nextStop.address,
        distance_from_previous: minDistance,
        estimated_time: Math.round(minDistance * 2) // 2 min per mile estimate
      });

      currentLocation = nextStop.address;
      unvisited.splice(nearestIndex, 1);
    }

    // Calculate total metrics
    const totalDistance = route.reduce((sum, stop) => sum + stop.distance_from_previous, 0);
    const totalTime = route.reduce((sum, stop) => sum + stop.estimated_time, 0);

    // Add initial pickup from driver location to restaurant
    const driverToRestaurantDistance = calculateDistance(driver_location, restaurant_address);

    return Response.json({
      success: true,
      optimized_route: route,
      total_stops: route.length,
      total_distance: totalDistance + driverToRestaurantDistance,
      estimated_total_time: totalTime + Math.round(driverToRestaurantDistance * 2),
      start_location: restaurant_address,
      driver_to_restaurant_distance: driverToRestaurantDistance
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return Response.json({ 
      error: error.message || 'Failed to optimize route' 
    }, { status: 500 });
  }
});

// Haversine formula to calculate distance between two coordinates
function calculateDistance(loc1, loc2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const lat1 = toRad(loc1.lat);
  const lat2 = toRad(loc2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}