import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/clients/supabase';
import { vapi } from '@/lib/clients/vapi';

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

    // Get firm data
    const { data: firmData, error: firmError } = await supabase
      .from('firms')
      .select('*')
      .eq('id', firmId)
      .single();

    if (firmError || !firmData || (firmData as any).owner_user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const firm = firmData as any;

    // Extract phone number ID from stored value (might be UUID or actual number)
    const phoneNumberId = firm.vapi_phone_number?.includes('ID:') 
      ? firm.vapi_phone_number.split('ID: ')[1]?.split(')')[0]
      : firm.vapi_phone_number;

    if (!phoneNumberId || phoneNumberId.length < 30) {
      // If it's already a phone number format, return it
      if (phoneNumberId?.match(/^\+?[1-9]\d{1,14}$/)) {
        return NextResponse.json({ phoneNumber: phoneNumberId });
      }
      return NextResponse.json({ error: 'No phone number ID found' }, { status: 400 });
    }

    // Fetch phone number details from Vapi
    try {
      const getResponse = await vapi.get(`/phone-number/${phoneNumberId}`);
      const phoneNumber = getResponse.data.number 
        || getResponse.data.phoneNumber 
        || getResponse.data.phone 
        || getResponse.data.value
        || getResponse.data.numberValue
        || null;

      if (phoneNumber) {
        // Update firm with actual phone number
        await supabase
          .from('firms')
          // @ts-ignore
          .update({ vapi_phone_number: phoneNumber })
          .eq('id', firmId);

        return NextResponse.json({ phoneNumber });
      } else {
        return NextResponse.json({ 
          message: 'Phone number not yet assigned by Vapi',
          phoneNumberId: phoneNumberId
        });
      }
    } catch (vapiError: any) {
      console.error('[Refresh Phone] Error:', vapiError?.response?.data || vapiError?.message);
      return NextResponse.json({ 
        error: 'Failed to fetch phone number',
        details: vapiError?.response?.data || vapiError?.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Refresh Phone] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

