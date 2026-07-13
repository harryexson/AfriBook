import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await req.json();
        const { latitude, longitude, heading, speed, accuracy } = body;

        if (!latitude || !longitude) {
            return new Response(JSON.stringify({ error: "latitude and longitude are required" }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate coordinates
        const lat = Number(latitude);
        const lng = Number(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            return new Response(JSON.stringify({ error: "Invalid coordinates format" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return new Response(JSON.stringify({ error: "Coordinates out of valid range" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate H3 index with error handling (optional, not critical)
        let h3Index = null;
        try {
            const h3 = await import('npm:h3-js@4.1.0');
            h3Index = h3.latLngToCell(lat, lng, 9);
        } catch (h3Error) {
            // Continue without H3 - not critical
        }

        // Determine network quality based on accuracy
        let networkQuality = 'excellent';
        const accuracyValue = Number(accuracy) || 0;
        if (accuracyValue > 50) networkQuality = 'poor';
        else if (accuracyValue > 20) networkQuality = 'fair';
        else if (accuracyValue > 10) networkQuality = 'good';

        // SIMPLIFIED: Only update User entity (most critical for real-time tracking)
        try {
            const currentDriverInfo = user.driver_info || {};
            
            await base44.auth.updateMe({
                driver_info: {
                    ...currentDriverInfo,
                    current_location: {
                        latitude: lat,
                        longitude: lng,
                        last_updated: new Date().toISOString()
                    }
                }
            });
            
            console.log('[LOCATION] Updated User current_location:', lat, lng);
        } catch (userUpdateError) {
            console.error("[USER UPDATE ERROR]:", userUpdateError);
            return new Response(JSON.stringify({ 
                error: "Failed to update location",
                details: userUpdateError.message
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Optional: Update DriverLocation entity (for analytics) - don't fail if this errors
        try {
            const locationData = {
                driver_id: user.id,
                latitude: lat,
                longitude: lng,
                heading: Number(heading || 0),
                speed: Number(speed || 0),
                accuracy: accuracyValue,
                h3_index: h3Index,
                is_available: user.driver_info?.is_available || false,
                battery_level: null,
                network_quality: networkQuality,
                last_ping: new Date().toISOString()
            };

            const existingLocations = await base44.entities.DriverLocation.filter({ 
                driver_id: user.id 
            }).catch(() => []);

            if (existingLocations.length > 0) {
                await base44.entities.DriverLocation.update(existingLocations[0].id, locationData);
            } else {
                await base44.entities.DriverLocation.create(locationData);
            }
        } catch (dbError) {
            console.log("[DB WARNING]:", dbError.message);
            // Don't fail - User entity is already updated
        }

        return new Response(JSON.stringify({ 
            success: true, 
            latitude: lat,
            longitude: lng,
            message: "Location updated successfully" 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[UPDATE LOCATION ERROR]:", error);
        
        return new Response(JSON.stringify({ 
            error: "Internal server error",
            message: error.message
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});