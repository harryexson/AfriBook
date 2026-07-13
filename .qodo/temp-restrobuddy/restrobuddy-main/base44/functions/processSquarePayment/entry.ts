import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sourceId, amount, orderId, currency = 'USD' } = body;

        if (!sourceId || !amount) {
            return Response.json({ 
                success: false,
                error: 'sourceId and amount are required' 
            }, { status: 400 });
        }

        const SQUARE_ACCESS_TOKEN = Deno.env.get("SQUARE_ACCESS_TOKEN");
        const SQUARE_ENVIRONMENT = Deno.env.get("SQUARE_ENVIRONMENT") || "sandbox";

        if (!SQUARE_ACCESS_TOKEN) {
            // Demo mode
            return Response.json({ 
                success: true,
                demo: true,
                paymentId: 'DEMO-' + Date.now(),
                status: 'COMPLETED',
                amount: { amount: Math.round(amount * 100), currency }
            });
        }

        // Actual Square payment processing would go here
        // For now, return demo response
        return Response.json({
            success: true,
            demo: true,
            paymentId: 'DEMO-' + Date.now(),
            status: 'COMPLETED',
            amount: { amount: Math.round(amount * 100), currency }
        });

    } catch (error) {
        console.error('Square payment error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Payment processing failed'
        }, { status: 500 });
    }
});