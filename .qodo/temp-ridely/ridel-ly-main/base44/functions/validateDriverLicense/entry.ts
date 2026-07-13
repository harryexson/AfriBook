import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { licenseNumber, licenseState, dob } = await req.json();

    if (!licenseNumber || !licenseState || !dob) {
      return Response.json(
        { error: 'Missing required fields: licenseNumber, licenseState, dob' },
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

    // Create an MVR (Motor Vehicle Record) check
    let candidateId = user.checkr_candidate_id;

    // If no candidate exists, create one
    if (!candidateId) {
      const candidateResponse = await fetch('https://api.checkr.com/v1/candidates', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: user.full_name?.split(' ')[0] || 'Driver',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || 'User',
          email: user.email,
          dob: dob,
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
      candidateId = candidate.id;
      
      await base44.auth.updateMe({ checkr_candidate_id: candidateId });
    }

    // Create MVR screening
    const mvrResponse = await fetch('https://api.checkr.com/v1/motor_vehicle_reports', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        state: licenseState
      })
    });

    if (!mvrResponse.ok) {
      const error = await mvrResponse.json();
      return Response.json(
        { error: 'Failed to create MVR check', details: error },
        { status: mvrResponse.status }
      );
    }

    const mvr = await mvrResponse.json();

    // Store MVR ID in user profile
    await base44.auth.updateMe({
      checkr_mvr_id: mvr.id,
      license_verification_status: 'pending',
      license_verification_initiated_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      mvr_id: mvr.id,
      status: mvr.status,
      message: 'License validation initiated'
    });

  } catch (error) {
    console.error('Error validating license:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});