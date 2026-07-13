import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { employee, invitedBy } = body;

        if (!employee || !employee.email) {
            return Response.json({
                success: false,
                error: 'Employee email is required'
            }, { status: 400 });
        }

        const APP_URL = Deno.env.get("BASE44_APP_URL") || "https://preview--gastronomy-73088ca1.base44.app";
        const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(employee.email)}&employee_id=${employee.id}`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .logo { font-size: 48px; }
        .title { font-size: 24px; font-weight: bold; color: white; margin-top: 10px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🍽️</div>
        <div class="title">Welcome to Gastronomy!</div>
    </div>

    <div class="content">
        <h2>Hello ${employee.full_name},</h2>
        
        <p>
            <strong>${invitedBy}</strong> has invited you to join the Gastronomy team as a 
            <strong>${employee.role.replace('_', ' ')}</strong>.
        </p>

        <div class="info-box">
            <strong>Your Role:</strong> ${employee.role.replace('_', ' ')}<br>
            <strong>Hourly Rate:</strong> $${employee.hourly_rate}/hour<br>
            <strong>Location:</strong> ${employee.location}<br>
            ${employee.ewa_enabled ? '<strong>✓ Earned Wage Access (EWA) Enabled</strong> - Request instant payouts<br>' : ''}
        </div>

        <p>Click the button below to create your account and start working:</p>

        <center>
            <a href="${signupUrl}" class="button">Accept Invitation & Sign Up</a>
        </center>

        <h3>What You'll Be Able To Do:</h3>
        <ul>
            <li>✓ Clock in/out and track your hours</li>
            <li>✓ View your earnings and timesheets</li>
            <li>✓ Track your PTO (Paid Time Off) balance</li>
            ${employee.ewa_enabled ? '<li>✓ Request instant payouts through EWA</li>' : ''}
            ${employee.permissions.manage_orders ? '<li>✓ Manage orders</li>' : ''}
            ${employee.permissions.manage_tables ? '<li>✓ Manage table assignments</li>' : ''}
            ${employee.permissions.manage_inventory ? '<li>✓ Manage inventory</li>' : ''}
        </ul>

        <p>This invitation link will expire in 7 days.</p>
    </div>

    <div class="footer">
        <p>Questions? Contact ${invitedBy} or reply to this email.</p>
        <p>© 2024 Gastronomy Restaurant Management System</p>
    </div>
</body>
</html>
        `;

        await base44.integrations.Core.SendEmail({
            to: employee.email,
            subject: `You're Invited to Join Gastronomy - ${employee.role.replace('_', ' ')} Position`,
            body: emailHtml
        });

        return Response.json({
            success: true,
            message: 'Employee invitation sent successfully'
        });

    } catch (error) {
        console.error('Error sending employee invitation:', error);
        return Response.json({
            success: false,
            error: error.message || 'Failed to send invitation'
        }, { status: 500 });
    }
});