import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';

// Simple test endpoint to verify webhook connectivity
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Test database connection
    const { data: firms, error } = await supabase
      .from('firms')
      .select('id, firm_name, vapi_assistant_id, vapi_phone_number_id, inbound_number_e164')
      .limit(5);
    
    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint is reachable',
      database: {
        connected: !error,
        error: error?.message || null,
        firmsFound: firms?.length || 0,
        firms: firms?.map(f => ({
          id: (f as any).id,
          name: (f as any).firm_name,
          hasAssistantId: !!(f as any).vapi_assistant_id,
          hasPhoneNumberId: !!(f as any).vapi_phone_number_id,
          hasInboundNumber: !!(f as any).inbound_number_e164,
        })) || [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

