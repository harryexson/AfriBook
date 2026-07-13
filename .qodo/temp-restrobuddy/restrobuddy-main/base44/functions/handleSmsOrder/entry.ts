import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        // This is a webhook endpoint - no user authentication required
        const base44 = createClientFromRequest(req);

        const body = await req.json();
        console.log('Received SMS webhook - Full payload:', JSON.stringify(body, null, 2));

        // Extract Sinch webhook data - handle multiple possible formats
        // Sinch MO (Mobile Originated) format
        const incomingMessage = body.body || body.message || body.text || '';
        const fromNumber = body.from || body.sender || body.source || body.msisdn || '';

        console.log('Extracted data:', { incomingMessage, fromNumber });

        if (!fromNumber || !incomingMessage) {
            console.error('Missing required fields in webhook payload');
            return Response.json({ 
                error: 'Invalid webhook payload - missing from or message',
                received: body
            }, { status: 400 });
        }

        const keyword = incomingMessage.trim().toUpperCase();
        const baseUrl = `https://${req.headers.get('host')}`;

        let responseMessage = '';

        // Handle STOP keyword (opt-out)
        if (keyword === 'STOP') {
            try {
                // Check if opt-out record exists
                const existingRecords = await base44.asServiceRole.entities.SmsOptOut.filter({
                    phone_number: fromNumber
                });

                if (existingRecords.length > 0) {
                    // Update existing record
                    await base44.asServiceRole.entities.SmsOptOut.update(existingRecords[0].id, {
                        opted_out: true,
                        opt_out_date: new Date().toISOString()
                    });
                } else {
                    // Create new opt-out record
                    await base44.asServiceRole.entities.SmsOptOut.create({
                        phone_number: fromNumber,
                        opted_out: true,
                        opt_out_date: new Date().toISOString()
                    });
                }

                responseMessage = "You have been unsubscribed from Gastronomy SMS notifications. You will not receive any more texts. Reply YES to opt back in.";
            } catch (error) {
                console.error('Error processing opt-out:', error);
                responseMessage = "Error processing your request. Please try again.";
            }
        }
        // Handle YES keyword (opt-in)
        else if (keyword === 'YES') {
            try {
                // Check if opt-out record exists
                const existingRecords = await base44.asServiceRole.entities.SmsOptOut.filter({
                    phone_number: fromNumber
                });

                if (existingRecords.length > 0) {
                    // Update existing record
                    await base44.asServiceRole.entities.SmsOptOut.update(existingRecords[0].id, {
                        opted_out: false,
                        opt_in_date: new Date().toISOString()
                    });
                    responseMessage = "Welcome back! You're now subscribed to Gastronomy SMS notifications. Text MENU to get started or STOP to unsubscribe anytime.";
                } else {
                    responseMessage = "You're already subscribed! Text MENU to see our menu or browse categories: APPETIZERS, ENTREES, DESSERTS.";
                }
            } catch (error) {
                console.error('Error processing opt-in:', error);
                responseMessage = "Error processing your request. Please try again.";
            }
        }
        // Handle MENU keyword
        else if (keyword === 'MENU') {
            responseMessage = `🍽️ Welcome to Gastronomy! View our full menu: ${baseUrl}/OrderMenu\n\nQuick order by texting: BURGER, PIZZA, SALAD, or text APPETIZERS, ENTREES, DESSERTS to browse categories.`;
        }
        // Handle category keywords
        else if (['APPETIZERS', 'ENTREES', 'SIDES', 'DESSERTS', 'BEVERAGES'].includes(keyword)) {
            const category = keyword.toLowerCase();
            responseMessage = `Browse ${keyword}: ${baseUrl}/OrderMenu?category=${category}\n\nText MENU for full menu or text an item name to order!`;
        }
        // Handle menu item keywords
        else {
            try {
                const menuItems = await base44.asServiceRole.entities.MenuItem.filter({ 
                    keyword: keyword 
                });

                if (menuItems.length > 0) {
                    const item = menuItems[0];
                    responseMessage = `🍔 ${item.name} - $${item.price}\n${item.description}\n\nOrder now: ${baseUrl}/OrderMenu?item=${item.id}`;
                } else {
                    responseMessage = `Item not found. Text MENU to see all options or try: BURGER, PIZZA, SALAD, APPETIZERS, ENTREES, DESSERTS`;
                }
            } catch (error) {
                console.error('Error fetching menu items:', error);
                responseMessage = `Welcome to Gastronomy! Text MENU to get started.`;
            }
        }

        // Send response SMS only if user hasn't opted out
        if (keyword !== 'STOP') {
            try {
                await base44.asServiceRole.functions.invoke('sendSms', {
                    to: fromNumber,
                    message: responseMessage
                });
            } catch (smsError) {
                console.error('Error sending response SMS:', smsError);
                // If error is due to opt-out, that's expected and OK
                if (smsError.response?.data?.opted_out) {
                    console.log('User has opted out, not sending message');
                }
            }
        } else {
            // For STOP, send one final message without compliance text
            try {
                const SINCH_SERVICE_PLAN_ID = Deno.env.get("SINCH_SERVICE_PLAN_ID");
                const SINCH_API_KEY = Deno.env.get("SINCH_API_KEY");
                const SINCH_PHONE_NUMBER = Deno.env.get("SINCH_PHONE_NUMBER");

                if (SINCH_SERVICE_PLAN_ID && SINCH_API_KEY && SINCH_PHONE_NUMBER) {
                    const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${SINCH_SERVICE_PLAN_ID}/batches`;
                    
                    await fetch(sinchUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SINCH_API_KEY}`
                        },
                        body: JSON.stringify({
                            from: SINCH_PHONE_NUMBER,
                            to: [fromNumber],
                            body: responseMessage
                        })
                    });
                }
            } catch (error) {
                console.error('Error sending STOP confirmation:', error);
            }
        }

        return Response.json({ 
            success: true,
            message: 'SMS processed'
        });

    } catch (error) {
        console.error('Error in handleSmsOrder:', error);
        return Response.json({ 
            error: error.message || 'Failed to process SMS' 
        }, { status: 500 });
    }
});