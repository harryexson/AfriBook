import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await req.json();

    if (!reportId && !user.checkr_report_id) {
      return Response.json(
        { error: 'No report ID provided or found' },
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

    const checkReportId = reportId || user.checkr_report_id;

    // Fetch report status from Checkr
    const reportResponse = await fetch(`https://api.checkr.com/v1/reports/${checkReportId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      }
    });

    if (!reportResponse.ok) {
      const error = await reportResponse.json();
      return Response.json(
        { error: 'Failed to fetch report', details: error },
        { status: reportResponse.status }
      );
    }

    const report = await reportResponse.json();

    // Parse report results
    const result = {
      status: report.status, // pending, complete, disputed
      result: report.result, // clear, consider
      completed_at: report.completed_at,
      turnaround_time: report.turnaround_time,
      mvr_status: null,
      criminal_status: null,
      ssn_trace_status: null
    };

    // Check MVR (Motor Vehicle Record)
    if (report.mvr) {
      result.mvr_status = {
        status: report.mvr.status,
        result: report.mvr.result,
        license_status: report.mvr.license_status,
        violations_count: report.mvr.violations?.length || 0,
        accidents_count: report.mvr.accidents?.length || 0
      };
    }

    // Check Criminal Records
    if (report.county_criminal_searches) {
      const criminalRecords = report.county_criminal_searches.filter(s => s.records?.length > 0);
      result.criminal_status = {
        records_found: criminalRecords.length > 0,
        count: criminalRecords.reduce((sum, s) => sum + (s.records?.length || 0), 0)
      };
    }

    // Check SSN Trace
    if (report.ssn_trace) {
      result.ssn_trace_status = {
        status: report.ssn_trace.status,
        ssn_valid: report.ssn_trace.ssn_valid
      };
    }

    // Update user profile with latest status
    let updateData = {
      background_check_status: report.status,
      background_check_result: report.result,
      background_check_completed_at: report.completed_at
    };

    // If check is complete, update verification status
    if (report.status === 'complete') {
      if (report.result === 'clear') {
        updateData.background_check_verified = true;
      } else {
        updateData.background_check_verified = false;
        updateData.background_check_issues = report.adjudication || 'Requires review';
      }
    }

    await base44.auth.updateMe(updateData);

    return Response.json({
      success: true,
      ...result,
      recommendation: report.result === 'clear' ? 'approved' : 'review_required'
    });

  } catch (error) {
    console.error('Error checking background status:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});