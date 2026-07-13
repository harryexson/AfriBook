import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurant_id, driver_id, order_ids } = await req.json();

    if (!restaurant_id || !driver_id || !order_ids || order_ids.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch orders and driver details
    const orders = await base44.asServiceRole.entities.Order.list();
    const batchOrders = orders.filter(o => order_ids.includes(o.id));
    
    const drivers = await base44.asServiceRole.entities.DeliveryDriver.list();
    const driver = drivers.find(d => d.id === driver_id);

    if (!driver) {
      return Response.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get restaurant location for route optimization
    const restaurants = await base44.asServiceRole.entities.Restaurant.list();
    const restaurant = restaurants.find(r => r.id === restaurant_id);

    // Optimize route
    const deliveryAddresses = batchOrders
      .filter(o => o.delivery_address && o.delivery_address.lat && o.delivery_address.lng)
      .map(o => ({
        order_id: o.id,
        address: {
          lat: o.delivery_address.lat,
          lng: o.delivery_address.lng,
          street: o.delivery_address.street
        }
      }));

    let optimizedRoute = [];
    let totalDistance = 0;
    let estimatedDuration = 0;

    if (deliveryAddresses.length > 0 && restaurant?.location) {
      try {
        const routeResponse = await base44.functions.invoke('optimizeDeliveryRoute', {
          driver_location: driver.current_location || restaurant.location,
          delivery_addresses: deliveryAddresses,
          restaurant_address: restaurant.location
        });

        if (routeResponse?.data?.optimized_route) {
          optimizedRoute = routeResponse.data.optimized_route;
          totalDistance = routeResponse.data.total_distance || 0;
          estimatedDuration = routeResponse.data.estimated_total_time || 0;
        }
      } catch (error) {
        console.error('Route optimization error:', error);
      }
    }

    // Create batch
    const batch = await base44.asServiceRole.entities.DeliveryBatch.create({
      restaurant_id,
      driver_id,
      driver_name: driver.name,
      order_ids,
      orders: batchOrders.map((o, idx) => ({
        order_id: o.id,
        customer_name: o.customer_name,
        delivery_address: o.delivery_address,
        total_amount: o.total_amount,
        status: o.status,
        sequence: optimizedRoute.findIndex(r => r.order_id === o.id) + 1 || idx + 1
      })),
      status: 'assigned',
      optimized_route: optimizedRoute,
      total_distance: totalDistance,
      estimated_duration: estimatedDuration
    });

    // Update driver status
    await base44.asServiceRole.entities.DeliveryDriver.update(driver_id, {
      status: 'on_delivery'
    });

    // Update order statuses
    for (const orderId of order_ids) {
      await base44.asServiceRole.entities.Order.update(orderId, {
        status: 'out_for_delivery',
        driver_id: driver_id,
        driver_name: driver.name
      });
    }

    return Response.json({
      success: true,
      batch_id: batch.id,
      total_orders: order_ids.length,
      total_distance: totalDistance,
      estimated_duration: estimatedDuration,
      optimized_route: optimizedRoute
    });

  } catch (error) {
    console.error('Batch creation error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create delivery batch' 
    }, { status: 500 });
  }
});