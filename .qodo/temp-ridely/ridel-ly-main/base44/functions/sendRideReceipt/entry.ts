import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const generateReceiptHtml = (ride, rider, driver) => {
    const defaultPayment = rider.payment_methods?.find(p => p.is_default) || rider.payment_methods?.[0] || { type: 'Card', last_four: '****' };
    
    // Calculate fare components
    const baseFare = ride.fare?.base_fare || 0;
    const distanceFare = ride.fare?.distance_fare || 0;
    const timeFare = ride.fare?.time_fare || 0;
    const platformFee = ride.fare?.platform_fee || 0;
    const surgeMultiplier = ride.fare?.surge_multiplier || 1;
    const tipAmount = ride.fare?.tip_amount || 0;
    
    // Calculate surge amount
    const fareBeforeSurge = baseFare + distanceFare + timeFare;
    const surgeAmount = surgeMultiplier > 1 ? (fareBeforeSurge * (surgeMultiplier - 1)) : 0;
    
    // Customer total
    const subtotal = fareBeforeSurge + surgeAmount;
    const customerTotal = subtotal + platformFee + tipAmount;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Ride-ly Receipt</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                color: #333; 
                background-color: #f7f7f7; 
                padding: 20px; 
                margin: 0;
            }
            .container { 
                max-width: 600px; 
                margin: auto; 
                padding: 40px 30px; 
                border: 1px solid #eee; 
                background-color: #fff; 
                border-radius: 12px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
            }
            .header { 
                text-align: center; 
                margin-bottom: 35px; 
                border-bottom: 2px solid #f0f0f0; 
                padding-bottom: 25px; 
            }
            .header-logo { 
                height: 50px; 
                width: auto; 
                margin-bottom: 12px; 
            }
            .header h1 { 
                font-size: 24px; 
                font-weight: 600; 
                color: #1C3B4A; 
                margin: 8px 0 0 0; 
            }
            .header p { 
                font-size: 14px; 
                color: #888; 
                margin: 5px 0 0 0; 
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #1C3B4A;
                margin: 30px 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #A0499F;
            }
            .details { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 25px; 
            }
            .details td { 
                padding: 12px 0; 
                border-bottom: 1px solid #f5f5f5;
            }
            .details td:first-child {
                color: #666;
                width: 140px;
            }
            .details td:last-child {
                font-weight: 500;
                color: #333;
            }
            .fare { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 25px; 
                background: #fafafa;
                border-radius: 8px;
                padding: 15px;
            }
            .fare td { 
                padding: 10px 0; 
            }
            .fare .row-item td:first-child {
                color: #666;
            }
            .fare .row-item td:last-child {
                text-align: right;
                font-weight: 500;
            }
            .fare .surge-row {
                background: #fff3e0;
                padding: 8px 12px;
                border-radius: 6px;
                margin: 5px 0;
            }
            .fare .surge-row td {
                padding: 8px 0;
            }
            .fare .surge-badge {
                display: inline-block;
                background: #ff9800;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                margin-left: 6px;
            }
            .fare .subtotal {
                border-top: 1px solid #e0e0e0;
                margin-top: 8px;
                padding-top: 12px;
                font-weight: 600;
                font-size: 15px;
            }
            .fare .total { 
                border-top: 2px solid #1C3B4A;
                margin-top: 8px;
                padding-top: 15px;
                font-weight: bold; 
                font-size: 20px;
                color: #1C3B4A;
            }
            .payment-info {
                background: #f0f7ff;
                padding: 15px;
                border-radius: 8px;
                margin: 25px 0;
                border-left: 4px solid #2196F3;
            }
            .payment-info p {
                margin: 0;
                color: #555;
                font-size: 14px;
            }
            .route-card {
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .route-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 15px;
            }
            .route-item:last-child {
                margin-bottom: 0;
            }
            .route-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 12px;
                margin-top: 4px;
                flex-shrink: 0;
            }
            .route-dot.pickup {
                background: #4CAF50;
            }
            .route-dot.dropoff {
                background: #f44336;
            }
            .route-content label {
                display: block;
                font-size: 12px;
                color: #888;
                margin-bottom: 3px;
            }
            .route-content p {
                margin: 0;
                font-weight: 500;
                color: #333;
            }
            .footer { 
                text-align: center; 
                font-size: 13px; 
                color: #888; 
                margin-top: 40px; 
                padding-top: 25px;
                border-top: 1px solid #eee;
            }
            .footer p {
                margin: 8px 0;
            }
            .highlight-box {
                background: #e8f5e9;
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .highlight-box p {
                margin: 0;
                color: #2e7d32;
                font-weight: 600;
                font-size: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/9c466391c_RidelyredLogofile_01c38620ea6e26681e4ae899e1.png" alt="Ride-ly Logo" class="header-logo">
                <h1>Your Ride Receipt</h1>
                <p>${formatDate(ride.completion_time || ride.created_date)}</p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px;">Thank you for riding with us, <strong>${rider.full_name?.split(' ')[0] || 'Customer'}</strong>!</p>
            
            <div class="route-card">
                <div class="route-item">
                    <div class="route-dot pickup"></div>
                    <div class="route-content">
                        <label>Pickup Location</label>
                        <p>${ride.pickup_location?.address || 'N/A'}</p>
                    </div>
                </div>
                <div class="route-item">
                    <div class="route-dot dropoff"></div>
                    <div class="route-content">
                        <label>Dropoff Location</label>
                        <p>${ride.destination?.address || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div class="section-title">Trip Details</div>
            <table class="details">
                <tr>
                    <td><strong>Ride Type:</strong></td>
                    <td style="text-transform: capitalize;">${ride.ride_type || 'Standard'}</td>
                </tr>
                ${driver ? `
                <tr>
                    <td><strong>Driver:</strong></td>
                    <td>${driver.full_name?.split(' ')[0] || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Vehicle:</strong></td>
                    <td>${driver.driver_info?.vehicle_color || ''} ${driver.driver_info?.vehicle_make || ''} ${driver.driver_info?.vehicle_model || ''}</td>
                </tr>
                ` : ''}
                <tr>
                    <td><strong>Distance:</strong></td>
                    <td>${ride.distance_km ? ride.distance_km.toFixed(1) + ' km' : 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Duration:</strong></td>
                    <td>${ride.duration_minutes ? Math.round(ride.duration_minutes) + ' minutes' : 'N/A'}</td>
                </tr>
            </table>

            <div class="section-title">Fare Breakdown</div>
            <div class="fare">
                <table style="width: 100%;">
                    <tr class="row-item">
                        <td>Base Fare</td>
                        <td align="right">${formatCurrency(baseFare)}</td>
                    </tr>
                    ${distanceFare > 0 ? `
                    <tr class="row-item">
                        <td>Distance Charge</td>
                        <td align="right">${formatCurrency(distanceFare)}</td>
                    </tr>
                    ` : ''}
                    ${timeFare > 0 ? `
                    <tr class="row-item">
                        <td>Time Charge</td>
                        <td align="right">${formatCurrency(timeFare)}</td>
                    </tr>
                    ` : ''}
                    ${surgeMultiplier > 1 ? `
                    <tr class="row-item surge-row">
                        <td>
                            Surge Pricing
                            <span class="surge-badge">${surgeMultiplier.toFixed(1)}x</span>
                        </td>
                        <td align="right" style="color: #ff9800; font-weight: 600;">+${formatCurrency(surgeAmount)}</td>
                    </tr>
                    ` : ''}
                    ${platformFee > 0 ? `
                    <tr class="row-item">
                        <td>Service Fee</td>
                        <td align="right">${formatCurrency(platformFee)}</td>
                    </tr>
                    ` : ''}
                    ${tipAmount > 0 ? `
                    <tr class="row-item">
                        <td>Tip</td>
                        <td align="right" style="color: #4CAF50; font-weight: 600;">${formatCurrency(tipAmount)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total">
                        <td>Total Charged</td>
                        <td align="right">${formatCurrency(customerTotal)}</td>
                    </tr>
                </table>
            </div>

            ${surgeMultiplier > 1 ? `
            <div class="highlight-box">
                <p>⚡ Surge pricing was in effect during your ride due to high demand</p>
            </div>
            ` : ''}

            <div class="payment-info">
                <p>💳 Paid with ${defaultPayment.type} ending in **** ${defaultPayment.last_four}</p>
            </div>
            
            <div class="footer">
                <p><strong>Everyone Deserves A Fair Deal.</strong></p>
                <p>That's the Ride-ly promise.</p>
                <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Ride-ly Technologies Inc. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req, {
        useServiceRole: true
    });

    try {
        const { rideId } = await req.json();

        if (!rideId) {
            return new Response(JSON.stringify({ error: "rideId is required" }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const ride = await base44.entities.Ride.get(rideId);
        if (!ride) {
            return new Response(JSON.stringify({ error: "Ride not found" }), { 
                status: 404, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const [rider, driver] = await Promise.all([
            base44.entities.User.get(ride.rider_id),
            ride.driver_id ? base44.entities.User.get(ride.driver_id) : Promise.resolve(null)
        ]);

        if (!rider) {
            return new Response(JSON.stringify({ error: "Rider not found" }), { 
                status: 404, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const receiptHtml = generateReceiptHtml(ride, rider, driver);
        
        await base44.integrations.Core.SendEmail({
            to: rider.email,
            subject: `Your Ride-ly Receipt - ${formatDate(ride.completion_time || ride.created_date).split(',')[0]}`,
            body: receiptHtml
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Receipt sent successfully." 
        }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error) {
        console.error("Error sending receipt:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
});