import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req, { useServiceRole: true });

    try {
        const { rideId } = await req.json();
        
        if (!rideId) {
            return new Response(JSON.stringify({ error: "rideId is required" }), { status: 400 });
        }

        // Get ride details
        const ride = await base44.entities.Ride.get(rideId);
        if (!ride) {
            return new Response(JSON.stringify({ error: "Ride not found" }), { status: 404 });
        }

        // Trigger analytics recording
        await base44.functions.invoke('recordRideAnalytics', { rideId });

        // Send receipt
        await base44.functions.invoke('sendRideReceipt', { rideId });

        // Update heat maps and surge pricing in background (don't wait)
        base44.functions.invoke('updateDemandHeatMap', {}).catch(console.error);
        base44.functions.invoke('calculateSurgePricing', {}).catch(console.error);

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error("Error in completion message:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});