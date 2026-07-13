import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Fetch order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (!orders || orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Generate kitchen ticket HTML
    const ticketHTML = `
      <html>
        <head>
          <style>
            body { font-family: monospace; width: 80mm; margin: 0; padding: 10mm; }
            .ticket { border: 1px solid black; padding: 10mm; }
            .header { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 10mm; }
            .order-number { font-size: 18px; font-weight: bold; margin: 5mm 0; }
            .time { font-size: 10px; color: #666; }
            .divider { border-top: 1px dashed black; margin: 5mm 0; }
            .items { margin: 5mm 0; }
            .item { margin: 3mm 0; font-size: 11px; }
            .qty { display: inline-block; width: 10mm; font-weight: bold; }
            .name { display: inline-block; width: 50mm; }
            .notes { background: #fff3cd; padding: 3mm; margin-top: 5mm; font-size: 10px; border: 1px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">KITCHEN TICKET</div>
            <div class="order-number">Order #${order.id.slice(-6)}</div>
            <div class="time">${new Date().toLocaleTimeString()}</div>
            <div class="divider"></div>
            
            <div class="items">
              ${order.items.map(item => `
                <div class="item">
                  <span class="qty">${item.quantity}x</span>
                  <span class="name"><strong>${item.name}</strong></span>
                  ${item.special_instructions ? `<div style="margin-left: 15mm; font-size: 9px; color: #d9534f;">NOTE: ${item.special_instructions}</div>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="divider"></div>
            <div style="text-align: center; font-weight: bold;">
              ${order.delivery_type === 'delivery' ? 'DELIVERY' : 'PICKUP'}
            </div>

            ${order.special_requests ? `
              <div class="divider"></div>
              <div class="notes">
                <strong>SPECIAL REQUESTS:</strong><br/>
                ${order.special_requests}
              </div>
            ` : ''}

            <div class="divider"></div>
            <div style="text-align: center; font-size: 10px; margin-top: 10mm;">
              Customer: ${order.customer_name}<br/>
              Contact: ${order.customer_phone || 'N/A'}
            </div>
          </div>
        </body>
      </html>
    `;

    return Response.json({
      success: true,
      html: ticketHTML,
      orderId: order.id,
      message: 'Kitchen ticket generated successfully'
    });
  } catch (error) {
    console.error('Error printing kitchen ticket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});