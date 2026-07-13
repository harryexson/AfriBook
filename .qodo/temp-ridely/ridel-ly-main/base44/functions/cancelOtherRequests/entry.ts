import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// This function cleans up stale ride requests after one has been accepted.
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const { rideId, acceptedDriverId } = await req.json();

        if (!rideId || !acceptedDriverId) {
            return new Response(JSON.stringify({ error: "rideId and acceptedDriverId are required" }), { status: 400 });
        }

        const serviceClient = base44.asServiceRole;

        // Find all pending requests for this ride that were NOT sent to the driver who accepted.
        const otherRequests = await serviceClient.entities.RideRequest.filter({
            ride_id: rideId,
            driver_id: { $ne: acceptedDriverId },
            status: 'pending'
        });

        if (otherRequests.length === 0) {
            return new Response(JSON.stringify({ message: "No other pending requests to cancel." }), { status: 200 });
        }

        console.log(`[DISPATCH] Cancelling ${otherRequests.length} other requests for ride ${rideId}`);

        // Update all other requests to 'expired'
        const cancelPromises = otherRequests.map(request => 
            serviceClient.entities.RideRequest.update(request.id, { status: 'expired' })
        );

        await Promise.all(cancelPromises);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Cancelled ${otherRequests.length} other requests.` 
        }), { status: 200 });

    } catch (error) {
        console.error("[CANCEL REQUESTS ERROR]:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});