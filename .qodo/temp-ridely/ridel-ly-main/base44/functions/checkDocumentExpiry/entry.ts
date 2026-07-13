import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { differenceInDays, parseISO, format } from 'npm:date-fns@3.0.0';

// This function should be called daily via cron job to check for expiring documents
// and send notifications to drivers

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin access
        const user = await base44.auth.me().catch(() => null);
        if (user && user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const serviceClient = base44.asServiceRole;
        const today = new Date();
        
        const results = {
            checked: 0,
            expiring_soon: 0,
            expired: 0,
            notifications_sent: 0,
            errors: []
        };

        console.log(`[DOCUMENT EXPIRY CHECK] Running at ${today.toISOString()}`);

        // Get all approved documents with expiry dates
        const documents = await serviceClient.entities.DriverDocument.filter({
            status: { $in: ['approved', 'expiring_soon'] },
            is_current_version: true,
            expiry_date: { $ne: null }
        });

        console.log(`[DOCUMENT EXPIRY CHECK] Found ${documents.length} documents to check`);

        for (const doc of documents) {
            results.checked++;

            try {
                const expiryDate = parseISO(doc.expiry_date);
                const daysUntilExpiry = differenceInDays(expiryDate, today);

                let newStatus = doc.status;
                let shouldNotify = false;
                let notificationType = '';

                // Determine if document is expired or expiring soon
                if (daysUntilExpiry < 0) {
                    newStatus = 'expired';
                    shouldNotify = true;
                    notificationType = 'expired';
                    results.expired++;
                } else if (daysUntilExpiry <= 30 && doc.status !== 'expiring_soon') {
                    newStatus = 'expiring_soon';
                    shouldNotify = true;
                    notificationType = 'expiring_soon';
                    results.expiring_soon++;
                } else if (daysUntilExpiry <= 7 && !doc.expiry_notification_sent) {
                    // Send urgent notification for documents expiring within 7 days
                    shouldNotify = true;
                    notificationType = 'urgent';
                }

                // Update document status if changed
                if (newStatus !== doc.status) {
                    await serviceClient.entities.DriverDocument.update(doc.id, {
                        status: newStatus
                    });
                    console.log(`[DOCUMENT EXPIRY CHECK] Updated document ${doc.id} to ${newStatus}`);
                }

                // Send notification if needed
                if (shouldNotify) {
                    try {
                        const driver = await serviceClient.entities.User.get(doc.driver_id);
                        
                        const documentTypeLabels = {
                            drivers_license: "Driver's License",
                            vehicle_registration: 'Vehicle Registration',
                            vehicle_insurance: 'Vehicle Insurance',
                            vehicle_inspection: 'Vehicle Inspection',
                            commercial_permit: 'Commercial Permit',
                            background_check: 'Background Check',
                            medical_certificate: 'Medical Certificate',
                            vehicle_photos: 'Vehicle Photos'
                        };

                        const docName = documentTypeLabels[doc.document_type] || doc.document_type;
                        const expiryDateFormatted = format(expiryDate, 'MMMM d, yyyy');

                        let subject, body;

                        if (notificationType === 'expired') {
                            subject = `⚠️ URGENT: ${docName} Has Expired`;
                            body = `Hi ${driver.full_name},\n\nYour ${docName} has expired as of ${expiryDateFormatted}.\n\n⚠️ You cannot accept rides until this document is renewed and approved.\n\nPlease upload a new document immediately:\n1. Go to Driver Documents in your app\n2. Upload the renewed ${docName}\n3. Wait for admin approval\n\nDocument Details:\n- Document Type: ${docName}\n- Expiry Date: ${expiryDateFormatted}\n- Status: EXPIRED\n\nBest regards,\nRide-ly Team`;
                        } else if (notificationType === 'urgent') {
                            subject = `🔴 URGENT: ${docName} Expires in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''}`;
                            body = `Hi ${driver.full_name},\n\nThis is an urgent reminder that your ${docName} will expire very soon.\n\nExpiry Date: ${expiryDateFormatted} (${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} remaining)\n\n⚠️ If your document expires, you won't be able to accept rides.\n\nAction Required:\n1. Renew your ${docName} as soon as possible\n2. Upload the new document through the Driver Documents page\n3. Wait for approval (usually within 24 hours)\n\nDon't wait until the last minute!\n\nBest regards,\nRide-ly Team`;
                        } else {
                            subject = `📅 ${docName} Expiring Soon`;
                            body = `Hi ${driver.full_name},\n\nYour ${docName} will expire in ${daysUntilExpiry} days.\n\nExpiry Date: ${expiryDateFormatted}\n\nTo avoid any disruption to your driving:\n1. Renew your ${docName} soon\n2. Upload the new document through the Driver Documents page\n3. We'll review and approve it within 24 hours\n\nDocument Details:\n- Document Type: ${docName}\n- Expiry Date: ${expiryDateFormatted}\n- Days Remaining: ${daysUntilExpiry}\n\nBest regards,\nRide-ly Team`;
                        }

                        await serviceClient.integrations.Core.SendEmail({
                            to: driver.email,
                            subject: subject,
                            body: body
                        });

                        // Mark notification as sent
                        await serviceClient.entities.DriverDocument.update(doc.id, {
                            expiry_notification_sent: true,
                            expiry_notification_sent_at: new Date().toISOString()
                        });

                        results.notifications_sent++;
                        console.log(`[DOCUMENT EXPIRY CHECK] ✅ Notification sent to ${driver.email} for ${docName}`);

                    } catch (emailError) {
                        console.error(`[DOCUMENT EXPIRY CHECK] Failed to send notification for document ${doc.id}:`, emailError);
                        results.errors.push(`Notification failed for document ${doc.id}: ${emailError.message}`);
                    }
                }

            } catch (docError) {
                console.error(`[DOCUMENT EXPIRY CHECK] Error processing document ${doc.id}:`, docError);
                results.errors.push(`Document ${doc.id}: ${docError.message}`);
            }
        }

        console.log('[DOCUMENT EXPIRY CHECK] ✅ Check complete:', JSON.stringify(results, null, 2));

        return new Response(JSON.stringify({
            success: true,
            timestamp: today.toISOString(),
            ...results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[DOCUMENT EXPIRY CHECK] ❌ Fatal error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});