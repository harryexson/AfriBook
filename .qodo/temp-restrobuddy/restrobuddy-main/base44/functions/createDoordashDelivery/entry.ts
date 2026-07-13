import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, pickup_address, dropoff_address, order_value } = await req.json();

    if (!order_id || !pickup_address || !dropoff_address) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doordashApiKey = Deno.env.get('DOORDASH_API_KEY');
    
    if (!doordashApiKey) {
      return Response.json({ 
        error: 'DoorDash API credentials not configured',
        setup_required: true 
      }, { status: 400 });
    }

    // Create DoorDash delivery
    const deliveryResponse = await fetch('https://openapi.doordash.com/drive/v2/deliveries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${doordashApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_delivery_id: order_id,
        pickup_address: pickup_address.street,
        pickup_business_name: pickup_address.business_name,
        pickup_phone_number: pickup_address.phone,
        pickup_instructions: pickup_address.instructions,
        dropoff_address: dropoff_address.street,
        dropoff_business_name: dropoff_address.name,
        dropoff_phone_number: dropoff_address.phone,
        dropoff_instructions: dropoff_address.instructions,
        order_value: Math.round(order_value * 100), // Convert to cents
        tip: 0,
        pickup_time: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min from now
      })
    });

    const deliveryData = await deliveryResponse.json();

    if (!deliveryResponse.ok) {
      return Response.json({ 
        error: 'Failed to create DoorDash delivery',
        details: deliveryData 
      }, { status: deliveryResponse.status });
    }

    return Response.json({
      success: true,
      delivery_id: deliveryData.delivery_id,
      status: deliveryData.delivery_status,
      tracking_url: deliveryData.tracking_url,
      fee: deliveryData.fee / 100, // Convert from cents
      estimated_pickup: deliveryData.pickup_time,
      estimated_dropoff: deliveryData.dropoff_time
    });

  } catch (error) {
    console.error('DoorDash delivery error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create delivery' 
    }, { status: 500 });
  }
});