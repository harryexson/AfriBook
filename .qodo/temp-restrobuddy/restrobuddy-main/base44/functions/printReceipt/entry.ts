import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { order, printerType } = body;

        if (!order) {
            return Response.json({
                success: false,
                error: 'Order data is required'
            }, { status: 400 });
        }

        console.log(`Processing print request for order ${order.id}`);

        // In production, this would integrate with actual POS printers
        // Options include:
        // 1. Star Micronics CloudPRNT
        // 2. Epson ePOS SDK
        // 3. Receipt printer via USB/Network
        // 4. Cloud printing services

        // For now, return success in demo mode
        // The frontend will trigger window.print() as backup

        const printerEndpoint = Deno.env.get("PRINTER_ENDPOINT");
        
        if (!printerEndpoint) {
            console.log('Demo mode: No printer configured');
            return Response.json({
                success: true,
                demo: true,
                message: 'Demo mode - Configure printer endpoint in production. Receipt will print via browser.'
            });
        }

        // In production, send to actual printer
        try {
            const printResponse = await fetch(printerEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order: order,
                    printerType: printerType || 'pos',
                    timestamp: new Date().toISOString()
                })
            });

            if (!printResponse.ok) {
                throw new Error(`Printer returned ${printResponse.status}`);
            }

            return Response.json({
                success: true,
                demo: false,
                message: 'Receipt sent to printer successfully'
            });
        } catch (printerError) {
            console.error('Printer error:', printerError);
            return Response.json({
                success: false,
                error: 'Failed to send to printer',
                details: printerError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in printReceipt:', error);
        return Response.json({
            success: false,
            error: error.message || 'Failed to process print request',
            stack: error.stack
        }, { status: 500 });
    }
});