import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rideId, priceId, mode = 'payment' } = await req.json();

    // Get app URL for redirect URLs
    const appUrl = new URL(req.url).origin;
    
    let sessionData = {
      customer_email: user.email,
      client_reference_id: user.id,
      mode: mode,
      success_url: `${appUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/PaymentCancel`,
      metadata: {
        user_id: user.id,
        user_email: user.email
      }
    };

    // If paying for a ride
    if (rideId) {
      const ride = await base44.entities.Ride.get(rideId);
      
      if (!ride) {
        return Response.json({ error: 'Ride not found' }, { status: 404 });
      }

      if (ride.rider_id !== user.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const totalAmount = Math.round((ride.fare?.total_fare || 0) * 100); // Convert to cents

      sessionData.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Ride from ${ride.pickup_location?.address || 'Pickup'} to ${ride.destination?.address || 'Destination'}`,
            description: `${ride.distance_km?.toFixed(2) || 0} km • ${ride.duration_minutes || 0} min`,
            metadata: {
              ride_id: rideId,
              ride_type: ride.ride_type
            }
          },
          unit_amount: totalAmount
        },
        quantity: 1
      }];

      sessionData.metadata.ride_id = rideId;
    } 
    // If subscribing to a plan (e.g., Prime)
    else if (priceId) {
      sessionData.line_items = [{
        price: priceId,
        quantity: 1
      }];
      sessionData.mode = 'subscription';
      sessionData.metadata.subscription_type = 'prime';
    } 
    else {
      return Response.json({ error: 'Either rideId or priceId is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return Response.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});