import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';
import { upsertCall, finalizeCall } from '@/lib/intake/processor';

// Ensure this route is public (no authentication required)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      conversation_id,
      event,
      transcript,
      structuredData,
      phoneNumber,
      metadata,
      phoneNumberId,
    } = body;

    console.log('[Vapi Webhook] Event:', event, 'Conversation ID:', conversation_id, 'Phone Number:', phoneNumber, 'Phone Number ID:', phoneNumberId, 'Metadata:', metadata);

    const supabase = createServiceClient();

    // Look up firm by phone number ID or phone number if not provided in metadata
    let firmId = metadata?.firmId;
    if (!firmId) {
      if (phoneNumberId) {
        // Look up by phone number ID (stored in vapi_phone_number field)
        const { data: firmData, error: lookupError } = await supabase
          .from('firms')
          .select('id, vapi_phone_number')
          .or(`vapi_phone_number.eq.${phoneNumberId},vapi_phone_number.ilike.%${phoneNumberId}%`)
          .limit(1)
          .maybeSingle();
        
        console.log('[Vapi Webhook] Firm lookup by phoneNumberId:', phoneNumberId, 'Result:', firmData, 'Error:', lookupError);
        
        if (firmData && (firmData as any).id) {
          firmId = (firmData as any).id;
          
          // If we have the actual phone number from webhook and firm only has ID stored, update it
          if (phoneNumber && phoneNumber.match(/^\+?[1-9]\d{1,14}$/) && 
              (firmData as any).vapi_phone_number && 
              !(firmData as any).vapi_phone_number.match(/^\+?[1-9]\d{1,14}$/)) {
            console.log('[Vapi Webhook] Updating firm with actual phone number from webhook:', phoneNumber);
            await supabase
              .from('firms')
              // @ts-ignore
              .update({ vapi_phone_number: phoneNumber })
              .eq('id', firmId);
          }
        }
      }
      
      // Fallback: look up by phone number if we have it
      if (!firmId && phoneNumber) {
        const { data: firmData, error: phoneLookupError } = await supabase
          .from('firms')
          .select('id')
          .eq('vapi_phone_number', phoneNumber)
          .maybeSingle();
        
        console.log('[Vapi Webhook] Firm lookup by phoneNumber:', phoneNumber, 'Result:', firmData, 'Error:', phoneLookupError);
        
        if (firmData && (firmData as any).id) {
          firmId = (firmData as any).id;
        }
      }
    } else if (phoneNumber && phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      // If we have firmId and actual phone number, check if we need to update the stored number
      const { data: firmData } = await supabase
        .from('firms')
        .select('vapi_phone_number')
        .eq('id', firmId)
        .single();
      
      if (firmData && (firmData as any).vapi_phone_number && 
          !(firmData as any).vapi_phone_number.match(/^\+?[1-9]\d{1,14}$/)) {
        // Firm has ID stored but we have actual number - update it
        console.log('[Vapi Webhook] Updating firm with actual phone number from webhook:', phoneNumber);
        await supabase
          .from('firms')
          // @ts-ignore
          .update({ vapi_phone_number: phoneNumber })
          .eq('id', firmId);
      }
    }

    console.log('[Vapi Webhook] Resolved firmId:', firmId);

    // If we still don't have firmId, try one more lookup by assistant ID
    if (!firmId && metadata?.assistantId) {
      console.log('[Vapi Webhook] Trying firm lookup by assistantId:', metadata.assistantId);
      const { data: firmData } = await supabase
        .from('firms')
        .select('id')
        .eq('vapi_assistant_id', metadata.assistantId)
        .maybeSingle();
      
      if (firmData && (firmData as any).id) {
        firmId = (firmData as any).id;
        console.log('[Vapi Webhook] Found firm by assistantId:', firmId);
      }
    }

    if (!firmId) {
      console.error('[Vapi Webhook] CRITICAL: Could not resolve firmId for conversation:', conversation_id);
      console.error('[Vapi Webhook] Phone Number:', phoneNumber);
      console.error('[Vapi Webhook] Phone Number ID:', phoneNumberId);
      console.error('[Vapi Webhook] Metadata:', metadata);
      // Still return 200 to prevent Vapi retries, but log the error
      return NextResponse.json({ ok: true, warning: 'Could not resolve firmId' });
    }

    if (event === 'conversation.updated') {
      // Update call with latest intake data
      console.log('[Vapi Webhook] Processing conversation.updated event');
      await upsertCall({
        conversationId: conversation_id,
        firmId: firmId,
        intake: structuredData,
      });
    }

    if (event === 'conversation.completed') {
      // Finalize call: save transcript, generate summary, send email
      console.log('[Vapi Webhook] Processing conversation.completed event');
      await finalizeCall({
        conversationId: conversation_id,
        transcript,
        phoneNumber,
        firmId: firmId,
      });
    }

    // Check if agent said goodbye and end call if needed
    // This handles the case where agent says goodbye but call hasn't ended
    if (event === 'conversation.updated' && transcript) {
      const lastMessage = transcript.split('\n').pop() || '';
      const agentSaidGoodbye = lastMessage.toLowerCase().includes('goodbye') || 
                                lastMessage.toLowerCase().includes('take care') ||
                                lastMessage.toLowerCase().includes('thank you for calling');
      
      if (agentSaidGoodbye) {
        console.log('[Vapi Webhook] Agent said goodbye, ending call');
        // The call should end automatically, but we log it
        // Vapi should handle call ending when agent says goodbye
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    // Always return 200 to prevent Vapi retries
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

