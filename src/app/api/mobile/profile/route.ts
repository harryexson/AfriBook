import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: { ...data, id: user.id, email: user.email,
      full_name: data?.full_name || user.name || '', email_verified: user.emailVerified === true } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = (error as { status?: number }).status === 401 ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Sign in to continue' : 'Could not load your profile' }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const { name, phone } = await req.json();
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 || typeof phone !== 'string' || phone.length > 30) {
      return NextResponse.json({ error: 'Enter your name and a valid phone number' }, { status: 400 });
    }
    // Never accept a role, ID, verification status or account balance from mobile.
    const { error } = await supabase.from('profiles').upsert({ id: user.id, email: user.email,
      full_name: name.trim(), phone: phone.trim() || null }, { onConflict: 'id' });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = (error as { status?: number }).status === 401 ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Sign in to continue' : 'Could not save your profile' }, { status });
  }
}
