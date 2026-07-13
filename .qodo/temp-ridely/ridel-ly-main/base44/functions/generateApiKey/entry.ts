import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const { restaurantId } = await req.json();
        if (!restaurantId) {
            return new Response(JSON.stringify({ error: 'Restaurant ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const restaurant = await base44.entities.Restaurant.get(restaurantId);

        if (restaurant.owner_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const newApiKey = `ridely_${crypto.randomUUID().replaceAll('-', '')}`;

        await base44.entities.Restaurant.update(restaurantId, { api_key: newApiKey });

        return new Response(JSON.stringify({ apiKey: newApiKey }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});