import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@^15';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"), {
  apiVersion: "2024-04-10",
});

// IMPORTANT: Replace these with your actual Stripe Price IDs
// You can create these in your Stripe Dashboard under "Products"
const STRIPE_PRICE_IDS = {
    monthly: 'price_1PMEhsRpR9KfsAksY37sZ9f7', // Example ID for a monthly plan
    yearly: 'price_1PMEhsRpR9KfsAksv4112u3b',  // Example ID for a yearly plan
};

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { planId, successUrl, cancelUrl } = await req.json();
        const priceId = STRIPE_PRICE_IDS[planId];
        if (!priceId) {
            return new Response(JSON.stringify({ error: "Invalid plan ID" }), { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: user.email,
            // Pass user ID to identify them in the webhook
            subscription_data: {
                metadata: {
                    user_id: user.id
                }
            },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});