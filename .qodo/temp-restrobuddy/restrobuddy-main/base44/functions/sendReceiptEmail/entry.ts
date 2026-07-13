import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const body = await req.json();
        const { order, customerEmail } = body;

        if (!order || !customerEmail) {
            return Response.json({
                success: false,
                error: 'Order and customer email are required'
            }, { status: 400 });
        }

        // Format receipt HTML
        const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 32px; }
        .restaurant-name { font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0; }
        .order-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .items { margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .item-name { flex: 1; }
        .item-qty { color: #6b7280; margin: 0 10px; }
        .item-price { font-weight: bold; }
        .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #10b981; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .total-row.grand-total { font-size: 20px; font-weight: bold; color: #10b981; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .thank-you { font-size: 18px; font-weight: bold; color: #10b981; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🍽️</div>
        <div class="restaurant-name">Gastronomy</div>
        <p>Thank you for your order!</p>
    </div>

    <div class="order-info">
        <div><strong>Order #:</strong> ${order.id.slice(-6)}</div>
        <div><strong>Date:</strong> ${new Date(order.created_date).toLocaleString()}</div>
        <div><strong>Customer:</strong> ${order.customer_name}</div>
        ${order.customer_phone ? `<div><strong>Phone:</strong> ${order.customer_phone}</div>` : ''}
        <div><strong>Order Type:</strong> ${order.order_type.toUpperCase()}</div>
        ${order.payment_status === 'completed' ? '<div style="color: #10b981;"><strong>✓ PAID</strong></div>' : '<div style="color: #f59e0b;"><strong>Pay at Counter</strong></div>'}
    </div>

    <div class="items">
        <h3>Order Items</h3>
        ${order.items.map(item => `
            <div class="item">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">x${item.quantity}</span>
                <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('')}
    </div>

    ${order.special_requests ? `
    <div class="order-info">
        <strong>Special Requests:</strong>
        <p>${order.special_requests}</p>
    </div>
    ` : ''}

    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>$${order.total_amount.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Tax (estimated):</span>
            <span>$${(order.total_amount * 0.08).toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
            <span>Total:</span>
            <span>$${(order.total_amount * 1.08).toFixed(2)}</span>
        </div>
    </div>

    <div class="footer">
        <div class="thank-you">Thank You!</div>
        <p>We appreciate your business.</p>
        <p>Questions? Contact us at support@gastronomy.com</p>
        <p style="margin-top: 20px; font-size: 12px;">
            This is your digital receipt. Please save for your records.
        </p>
    </div>
</body>
</html>
        `;

        // Send email using Core.SendEmail integration
        const emailResult = await base44.integrations.Core.SendEmail({
            to: customerEmail,
            subject: `Receipt for Order #${order.id.slice(-6)} - Gastronomy`,
            body: receiptHtml
        });

        return Response.json({
            success: true,
            message: 'Receipt sent successfully to email'
        });

    } catch (error) {
        console.error('Error sending receipt email:', error);
        return Response.json({
            success: false,
            error: error.message || 'Failed to send receipt email'
        }, { status: 500 });
    }
});