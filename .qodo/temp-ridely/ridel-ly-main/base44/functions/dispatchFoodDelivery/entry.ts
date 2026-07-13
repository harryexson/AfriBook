import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// This function creates a delivery ride for a confirmed food order.
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req, { useServiceRole: true });

    try {
        const { orderId } = await req.json();
        if (!orderId) {
            return new Response(JSON.stringify({ error: "orderId is required" }), { status: 400 });
        }

        // 1. Get the Order, Customer, and Restaurant details
        const order = await base44.entities.Order.get(orderId);
        if (!order) {
            return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
        }
        
        const customer = await base44.entities.User.get(order.customer_id);
        const restaurant = await base44.entities.Restaurant.get(order.restaurant_id);

        if (!customer || !restaurant) {
            return new Response(JSON.stringify({ error: "Customer or Restaurant not found" }), { status: 404 });
        }
        
        const customerAddress = customer.profile_info?.delivery_address || { address: 'Default Customer Address', latitude: customer.driver_info?.current_location?.latitude || 34.0522, longitude: customer.driver_info?.current_location?.longitude || -118.2437};

        // INTEGRATE PRIME BENEFIT: Check if customer is a prime member
        const deliveryFee = customer.is_prime_member ? 0.00 : 5.00;

        // 2. Create the Delivery Ride
        const deliveryRideData = {
            rider_id: customer.id, // The customer is the "rider" for the package
            pickup_location: {
                address: restaurant.address.street,
                latitude: restaurant.address.latitude,
                longitude: restaurant.address.longitude,
            },
            destination: {
                address: customerAddress.address,
                latitude: customerAddress.latitude,
                longitude: customerAddress.longitude,
            },
            ride_type: 'delivery', // Special type for food delivery
            status: 'requested',
            fare: { total_fare: deliveryFee, customer_total: order.order_total + deliveryFee }, // Use dynamic delivery fee
            notes: `Order #${order.id} from ${restaurant.name}`
        };

        const newRide = await base44.entities.Ride.create(deliveryRideData);

        // 3. Link the Ride back to the Order
        await base44.entities.Order.update(order.id, {
            delivery_ride_id: newRide.id,
            status: 'ready_for_pickup' // Update order status
        });

        // 4. Find a driver for this new delivery ride
        await base44.functions.invoke('findDriversForRide', { rideId: newRide.id });

        return new Response(JSON.stringify({ success: true, rideId: newRide.id }), { status: 200 });

    } catch (error) {
        console.error("Error in dispatchFoodDelivery:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});