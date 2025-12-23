import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';

// Debug endpoint to test firm lookup logic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    
    // Simulate webhook firm lookup logic
    const assistantId = body.assistantId || body.message?.assistant?.id || body.message?.call?.assistantId;
    const phoneNumberId = body.phoneNumberId || body.message?.phoneNumber?.id || body.message?.call?.phoneNumberId;
    const phoneNumber = body.phoneNumber || body.message?.call?.customer?.number;
    const metadata = body.metadata || body.message?.assistant?.metadata;
    const firmId = metadata?.firmId;
    
    const results: any = {
      input: {
        assistantId,
        phoneNumberId,
        phoneNumber,
        firmIdFromMetadata: firmId,
      },
      lookups: {},
    };
    
    // Try lookup by metadata firmId
    if (firmId) {
      const { data, error } = await supabase
        .from('firms')
        .select('id, firm_name, vapi_assistant_id, vapi_phone_number_id, inbound_number_e164')
        .eq('id', firmId)
        .maybeSingle();
      results.lookups.byMetadataFirmId = { found: !!data, data, error: error?.message };
    }
    
    // Try lookup by phone number ID
    if (phoneNumberId) {
      const { data, error } = await supabase
        .from('firms')
        .select('id, firm_name, vapi_assistant_id, vapi_phone_number_id, inbound_number_e164')
        .eq('vapi_phone_number_id', phoneNumberId)
        .maybeSingle();
      results.lookups.byPhoneNumberId = { found: !!data, data, error: error?.message };
    }
    
    // Try lookup by phone number
    if (phoneNumber) {
      const { data, error } = await supabase
        .from('firms')
        .select('id, firm_name, vapi_assistant_id, vapi_phone_number_id, inbound_number_e164')
        .eq('inbound_number_e164', phoneNumber)
        .maybeSingle();
      results.lookups.byPhoneNumber = { found: !!data, data, error: error?.message };
    }
    
    // Try lookup by assistant ID
    if (assistantId) {
      const { data, error } = await supabase
        .from('firms')
        .select('id, firm_name, vapi_assistant_id, vapi_phone_number_id, inbound_number_e164')
        .eq('vapi_assistant_id', assistantId)
        .maybeSingle();
      results.lookups.byAssistantId = { found: !!data, data, error: error?.message };
    }
    
    // Find which lookup succeeded
    const successfulLookup = Object.entries(results.lookups).find(([_, result]: [string, any]) => result.found);
    results.resolvedFirmId = successfulLookup ? (successfulLookup[1] as any).data?.id : null;
    
    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

