import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// --- POST: Submit a driver application ----------------------
// Accepts the onboarding wizard data, creates/updates the driver
// profile, and upgrades the user role to "driver".
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      fullName,
      phone,
      email,
      dateOfBirth,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      vehicleType,
      licensePlate,
      driversLicense,
      vehicleRegistration,
      insuranceDocument,
      profilePhoto,
      bankName,
      accountNumber,
      accountName,
      city,
      countryCode,
    } = body;

    // -- Validate required fields ------------------------------
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    if (!fullName || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'fullName, phone, and email are required' },
        { status: 400 },
      );
    }

    if (!vehicleMake || !vehicleModel || !vehicleYear || !licensePlate) {
      return NextResponse.json(
        { success: false, error: 'Vehicle make, model, year, and license plate are required' },
        { status: 400 },
      );
    }

    if (!driversLicense) {
      return NextResponse.json(
        { success: false, error: "Driver's license is required" },
        { status: 400 },
      );
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { success: false, error: 'Bank name, account number, and account name are required' },
        { status: 400 },
      );
    }

    if (!city) {
      return NextResponse.json(
        { success: false, error: 'City is required' },
        { status: 400 },
      );
    }

    // -- Check if user already has a driver profile ------------
    const { data: existingDriver } = await supabase
      .from('drivers')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingDriver) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a driver application' },
        { status: 409 },
      );
    }

    // -- Check if user exists ----------------------------------
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    // -- Create driver profile ---------------------------------
    const vehicleInfo = {
      make: vehicleMake,
      model: vehicleModel,
      year: parseInt(vehicleYear, 10),
      color: vehicleColor,
      type: vehicleType,
      licensePlate,
    };

    const documents = {
      driversLicense,
      vehicleRegistration: vehicleRegistration ?? null,
      insuranceDocument: insuranceDocument ?? null,
      profilePhoto: profilePhoto ?? null,
    };

    const payoutInfo = {
      bankName,
      accountNumber,
      accountName,
    };

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        user_id: userId,
        status: 'pending_review',
        vehicle_info: vehicleInfo,
        documents,
        payout_info: payoutInfo,
        city,
        country_code: countryCode || 'US',
        rating: 0,
        total_trips: 0,
        total_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (driverError) {
      console.error('[driver-apply] Failed to create driver profile:', driverError);
      return NextResponse.json(
        { success: false, error: 'Failed to create driver profile' },
        { status: 500 },
      );
    }

    // -- Update user role to driver ----------------------------
    const { error: roleError } = await supabase
      .from('users')
      .update({
        role: 'driver',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (roleError) {
      console.error('[driver-apply] Failed to update user role:', roleError);
      // Non-fatal: driver profile was created, role update can be retried
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          driverId: driver.id,
          status: 'pending_review',
          message: 'Your driver application has been submitted successfully! We will review your documents and get back to you within 24-48 hours.',
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// --- GET: Check application status --------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 },
      );
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, status, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to check application status' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        hasApplication: !!driver,
        status: driver?.status ?? null,
        createdAt: driver?.created_at ?? null,
        updatedAt: driver?.updated_at ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
