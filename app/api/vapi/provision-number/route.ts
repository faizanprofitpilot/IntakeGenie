import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/clients/supabase';
import { vapi } from '@/lib/clients/vapi';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firmId } = await req.json();

    if (!firmId) {
      return NextResponse.json({ error: 'Missing firmId' }, { status: 400 });
    }

    // Verify user owns the firm
    const { data: firmData, error: firmError } = await supabase
      .from('firms')
      .select('owner_user_id')
      .eq('id', firmId)
      .single();

    if (firmError || !firmData || (firmData as any).owner_user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Provision phone number via Vapi
    const response = await vapi.post('/phone-numbers', {
      // Vapi phone number provisioning options
      // You may need to adjust this based on Vapi's actual API
    });

    const phoneNumber = response.data.phoneNumber || response.data.number;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Failed to provision number' }, { status: 500 });
    }

    // Save number to firm record
    const { error: updateError } = await supabase
      .from('firms')
      // @ts-ignore
      .update({ vapi_phone_number: phoneNumber })
      .eq('id', firmId);

    if (updateError) {
      console.error('[Vapi Provision] Error updating firm:', updateError);
      return NextResponse.json({ error: 'Failed to save number' }, { status: 500 });
    }

    return NextResponse.json({ phoneNumber });
  } catch (error) {
    console.error('[Vapi Provision] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

