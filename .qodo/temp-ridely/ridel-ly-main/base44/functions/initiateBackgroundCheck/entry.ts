import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, email, dob, ssn, licenseNumber, licenseState, zipCode } = await req.json();

    if (!firstName || !lastName || !email || !dob || !ssn || !licenseNumber || !licenseState) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = Deno.env.get('CHECKR_API_KEY');
    if (!apiKey) {
      return Response.json(
        { error: 'Checkr API key not configured' },
        { status: 500 }
      );
    }

    // Step 1: Create candidate in Checkr
    const candidateResponse = await fetch('https://api.checkr.com/v1/candidates', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        dob: dob, // Format: YYYY-MM-DD
        ssn: ssn,
        zipcode: zipCode || '00000',
        driver_license_number: licenseNumber,
        driver_license_state: licenseState
      })
    });

    if (!candidateResponse.ok) {
      const error = await candidateResponse.json();
      return Response.json(
        { error: 'Failed to create candidate', details: error },
        { status: candidateResponse.status }
      );
    }

    const candidate = await candidateResponse.json();

    // Step 2: Create background check report (MVR + SSN Trace + Criminal)
    const reportResponse = await fetch('https://api.checkr.com/v1/reports', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidate_id: candidate.id,
        package: 'driver_pro', // Includes MVR, SSN Trace, Criminal records
        tags: [`user_${user.id}`]
      })
    });

    if (!reportResponse.ok) {
      const error = await reportResponse.json();
      return Response.json(
        { error: 'Failed to create report', details: error },
        { status: reportResponse.status }
      );
    }

    const report = await reportResponse.json();

    // Step 3: Store Checkr IDs in user profile
    await base44.auth.updateMe({
      checkr_candidate_id: candidate.id,
      checkr_report_id: report.id,
      background_check_status: 'pending',
      background_check_initiated_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      candidate_id: candidate.id,
      report_id: report.id,
      status: report.status,
      message: 'Background check initiated successfully'
    });

  } catch (error) {
    console.error('Error initiating background check:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});