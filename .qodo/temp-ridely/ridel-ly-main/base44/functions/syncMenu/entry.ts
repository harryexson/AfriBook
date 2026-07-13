import { createClient } from 'npm:@base44/sdk@0.7.1';

// Initialize the client with the service role key from environment variables
// This allows the function to act as an admin to query restaurants by API key
const base44 = createClient(Deno.env.get('BASE44_API_URL'), Deno.env.get('BASE44_SERVICE_ROLE_KEY'));

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid API key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const apiKey = authHeader.split(' ')[1];

        // Find the restaurant matching the API key
        // Note: The base44 JS SDK does not use .from('Table').select()... that's supabase syntax.
        // We will use the entity filter method with asServiceRole
        const restaurants = await base44.asServiceRole.entities.Restaurant.filter({ api_key: apiKey });

        if (!restaurants || restaurants.length === 0) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const restaurant = restaurants[0];

        const incomingItems = await req.json();
        if (!Array.isArray(incomingItems)) {
            return new Response(JSON.stringify({ error: 'Request body must be an array of menu items' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        let createdCount = 0;
        let updatedCount = 0;
        let errors = [];

        for (const item of incomingItems) {
            try {
                if (!item.external_id) {
                    console.warn('Skipping item without external_id:', item.name);
                    continue;
                }

                const existingItems = await base44.asServiceRole.entities.MenuItem.filter({
                    restaurant_id: restaurant.id,
                    external_id: item.external_id
                });
                
                const existingItem = existingItems?.[0];

                const itemData = {
                    restaurant_id: restaurant.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    image_url: item.image_url,
                    external_id: item.external_id,
                    is_available: item.is_available ?? true
                };

                if (existingItem) {
                    await base44.asServiceRole.entities.MenuItem.update(existingItem.id, itemData);
                    updatedCount++;
                } else {
                    await base44.asServiceRole.entities.MenuItem.create(itemData);
                    createdCount++;
                }
            } catch(e) {
                errors.push({item: item.name, error: e.message});
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Menu synced successfully.`,
            created: createdCount,
            updated: updatedCount,
            errors: errors
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Sync Menu Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});