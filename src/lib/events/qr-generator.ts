import QRCode from 'qrcode';

// ─── Types ────────────────────────────────────────────────────

export interface TicketQRData {
  type: 'ticket';
  ticketCode: string;
  eventId: string;
  buyerId: string;
  guestId?: string;
}

export interface GeneratedTicket {
  ticketCode: string;
  qrCodeDataUrl: string;
  ticketHTML: string;
}

// ─── QR Code Generation ───────────────────────────────────────

export async function generateTicketQR(
  ticketId: string,
  ticketCode: string,
): Promise<string> {
  const payload: TicketQRData = {
    type: 'ticket',
    ticketCode,
    eventId: ticketId,
    buyerId: '',
  };

  const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return dataUrl;
}

export async function generateTicketQRSVG(
  ticketId: string,
  ticketCode: string,
): Promise<string> {
  const payload: TicketQRData = {
    type: 'ticket',
    ticketCode,
    eventId: ticketId,
    buyerId: '',
  };

  const svg = await QRCode.toString(JSON.stringify(payload), {
    type: 'svg',
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return svg;
}

// ─── Ticket Code Generation ───────────────────────────────────

export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// ─── QR Validation ────────────────────────────────────────────

export interface QRValidationResult {
  valid: boolean;
  ticketCode?: string;
  eventId?: string;
  error?: string;
}

export function validateTicketQRPayload(raw: string): QRValidationResult {
  try {
    const data = JSON.parse(raw) as TicketQRData;

    if (data.type !== 'ticket') {
      return { valid: false, error: 'Invalid QR code type' };
    }

    if (!data.ticketCode || typeof data.ticketCode !== 'string') {
      return { valid: false, error: 'Missing ticket code' };
    }

    if (!data.eventId || typeof data.eventId !== 'string') {
      return { valid: false, error: 'Missing event ID' };
    }

    return {
      valid: true,
      ticketCode: data.ticketCode,
      eventId: data.eventId,
    };
  } catch {
    return { valid: false, error: 'Invalid QR code format' };
  }
}

export async function validateTicketQR(
  ticketCode: string,
  eventId: string,
): Promise<{ valid: boolean; ticketId?: string; error?: string }> {
  // This is a placeholder that would query the database
  // The actual validation happens in check-in.ts with Supabase
  if (!ticketCode || ticketCode.length !== 8) {
    return { valid: false, error: 'Invalid ticket code format' };
  }

  if (!eventId) {
    return { valid: false, error: 'Event ID is required' };
  }

  return { valid: true };
}

// ─── Ticket HTML Generation ───────────────────────────────────

export interface TicketHTMLParams {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  ticketType: string;
  ticketCode: string;
  qrCodeDataUrl: string;
  attendeeName: string;
  attendeeEmail: string;
  orderNumber: string;
  currency: string;
  totalPrice: number;
  eventUrl: string;
}

export function generateTicketHTML(params: TicketHTMLParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - ${params.eventName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f0f2f5; padding: 20px; }
    .ticket {
      max-width: 480px; margin: 0 auto; background: #fff;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .ticket-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 24px; text-align: center;
    }
    .ticket-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .ticket-header p { font-size: 13px; opacity: 0.85; }
    .ticket-body { padding: 24px; }
    .event-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid #f0f2f5;
    }
    .detail-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; color: #1a1a2e; font-weight: 500; text-align: right; }
    .qr-section {
      text-align: center; padding: 24px;
      border-top: 2px dashed #e5e7eb;
    }
    .qr-section img { width: 180px; height: 180px; border-radius: 8px; }
    .qr-code { font-family: monospace; font-size: 16px; font-weight: 700; color: #667eea; margin-top: 12px; letter-spacing: 3px; }
    .ticket-footer {
      background: #f8f9fa; padding: 16px 24px;
      text-align: center; font-size: 11px; color: #9ca3af;
    }
    .ticket-footer a { color: #667eea; text-decoration: none; }
    .badge {
      display: inline-block; background: rgba(255,255,255,0.2);
      padding: 4px 12px; border-radius: 12px; font-size: 12px;
      font-weight: 600; margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <h1>AfriBook</h1>
      <p>Your Event Ticket</p>
      <span class="badge">${params.ticketType}</span>
    </div>
    <div class="ticket-body">
      <div class="event-title">${escapeHTML(params.eventName)}</div>

      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${escapeHTML(params.eventDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${escapeHTML(params.eventTime)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">${escapeHTML(params.venue)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Attendee</span>
        <span class="detail-value">${escapeHTML(params.attendeeName)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${escapeHTML(params.attendeeEmail)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Order</span>
        <span class="detail-value">#${escapeHTML(params.orderNumber)}</span>
      </div>
      ${params.totalPrice > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Total Paid</span>
        <span class="detail-value">${params.currency} ${params.totalPrice.toFixed(2)}</span>
      </div>` : `
      <div class="detail-row">
        <span class="detail-label">Admission</span>
        <span class="detail-value">FREE</span>
      </div>`}
    </div>
    <div class="qr-section">
      <img src="${params.qrCodeDataUrl}" alt="QR Code" />
      <div class="qr-code">${escapeHTML(params.ticketCode)}</div>
    </div>
    <div class="ticket-footer">
      <p>Present this QR code at the entrance for check-in.</p>
      <p style="margin-top: 8px;">
        <a href="${escapeHTML(params.eventUrl)}">View Event on AfriBook</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Ticket PDF Generation (HTML-based) ───────────────────────

export async function generateTicketPDF(
  params: TicketHTMLParams,
): Promise<string> {
  // In production, this would use puppeteer or a PDF API.
  // For now, return the HTML which can be converted to PDF on the client
  // or via a serverless function.
  const html = generateTicketHTML(params);

  // Return as a data URL for client-side PDF generation
  const encoder = new TextEncoder();
  const data = encoder.encode(html);
  const base64 = btoa(String.fromCharCode(...data));

  return `data:text/html;base64,${base64}`;
}

// ─── Batch Generation ─────────────────────────────────────────

export async function generateTicketsForRegistration(registration: {
  id: string;
  eventId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  ticketType: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  currency: string;
  totalPrice: number;
  eventUrl: string;
}): Promise<GeneratedTicket[]> {
  const tickets: GeneratedTicket[] = [];

  for (let i = 0; i < registration.quantity; i++) {
    const ticketCode = generateTicketCode();
    const qrCodeDataUrl = await generateTicketQR(registration.eventId, ticketCode);

    const ticketHTML = generateTicketHTML({
      eventName: registration.eventName,
      eventDate: registration.eventDate,
      eventTime: registration.eventTime,
      venue: registration.venue,
      ticketType: registration.ticketType,
      ticketCode,
      qrCodeDataUrl,
      attendeeName: registration.buyerName,
      attendeeEmail: registration.buyerEmail,
      orderNumber: registration.id.slice(0, 8).toUpperCase(),
      currency: registration.currency,
      totalPrice: registration.totalPrice,
      eventUrl: registration.eventUrl,
    });

    tickets.push({ ticketCode, qrCodeDataUrl, ticketHTML });
  }

  return tickets;
}

// ─── Helpers ──────────────────────────────────────────────────

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
