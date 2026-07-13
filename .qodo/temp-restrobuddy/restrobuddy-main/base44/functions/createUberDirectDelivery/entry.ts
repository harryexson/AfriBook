import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, pickup_address, dropoff_address, manifest } = await req.json();

    if (!order_id || !pickup_address || !dropoff_address) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uberClientId = Deno.env.get('UBER_DIRECT_CLIENT_ID');
    const uberClientSecret = Deno.env.get('UBER_DIRECT_CLIENT_SECRET');
    const uberCustomerId = Deno.env.get('UBER_DIRECT_CUSTOMER_ID');
    
    if (!uberClientId || !uberClientSecret || !uberCustomerId) {
      return Response.json({ 
        error: 'Uber Direct API credentials not configured',
        setup_required: true 
      }, { status: 400 });
    }

    // Get OAuth token
    const tokenResponse = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: uberClientId,
        client_secret: uberClientSecret,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return Response.json({ 
        error: 'Failed to authenticate with Uber Direct',
        details: tokenData 
      }, { status: tokenResponse.status });
    }

    // Create delivery
    const deliveryResponse = await fetch('https://api.uber.com/v1/customers/' + uberCustomerId + '/deliveries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_id: order_id,
        pickup: {
          address: pickup_address.street,
          name: pickup_address.business_name,
          phone_number: pickup_address.phone,
          instructions: pickup_address.instructions,
          ready_dt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        },
        dropoff: {
          address: dropoff_address.street,
          name: dropoff_address.name,
          phone_number: dropoff_address.phone,
          instructions: dropoff_address.instructions
        },
        manifest: {
          total_value: manifest?.total_value || 0
        },
        pickup_verification: {
          signature_required: false
        },
        dropoff_verification: {
          signature_required: false,
          picture_required: false
        }
      })
    });

    const deliveryData = await deliveryResponse.json();

    if (!deliveryResponse.ok) {
      return Response.json({ 
        error: 'Failed to create Uber Direct delivery',
        details: deliveryData 
      }, { status: deliveryResponse.status });
    }

    return Response.json({
      success: true,
      delivery_id: deliveryData.id,
      tracking_url: deliveryData.tracking_url,
      fee: deliveryData.fee,
      status: deliveryData.status,
      courier: deliveryData.courier
    });

  } catch (error) {
    console.error('Uber Direct delivery error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create delivery' 
    }, { status: 500 });
  }
});