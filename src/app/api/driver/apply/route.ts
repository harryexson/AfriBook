import { NextRequest, NextResponse } from 'next/server';

async function getDb() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as any;
}

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

// --- POST: Submit a driver application ----------------------
// Accepts the onboarding wizard data, creates/updates the driver
// profile + vehicle, and upgrades the user role to "driver".
export async function POST(req: NextRequest) {
  try {
    const supabase = await getDb();
    const adminDb = await getAdminDb();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
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
      .eq('profile_id', user.id)
      .maybeSingle();

    if (existingDriver) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a driver application' },
        { status: 409 },
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
        profile_id: user.id,
        status: 'pending_review',
        is_available: false,
        rating: 0,
        earnings_total: 0,
        vehicle_info: vehicleInfo,
        documents,
        payout_info: payoutInfo,
        city,
        country_code: countryCode || 'US',
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

    // -- Create vehicle record ---------------------------------
    const { error: vehicleError } = await supabase.from('vehicles').insert({
      driver_id: driver.id,
      make: vehicleMake,
      model: vehicleModel,
      year: parseInt(vehicleYear, 10) || null,
      color: vehicleColor ?? null,
      plate_number: licensePlate,
      type: vehicleType ?? null,
      documents: [documents],
      is_active: true,
    });

    if (vehicleError) {
      console.error('[driver-apply] Failed to create vehicle:', vehicleError);
    }

    // -- Update user role to driver ----------------------------
    // Done via the service-role client: trg_profiles_protect_privileged_columns
    // blocks direct role changes from the session client.
    const { error: roleError } = await adminDb
      .from('profiles')
      .update({ role: 'driver' })
      .eq('id', user.id);

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
    const supabase = await getDb();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, status, created_at, updated_at')
      .eq('profile_id', user.id)
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
