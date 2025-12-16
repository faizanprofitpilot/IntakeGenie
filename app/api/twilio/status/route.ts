import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;

    if (!callSid) {
      return new Response('Missing CallSid', { status: 400 });
    }

    const supabase = createServiceClient();

    // Update call ended_at when call completes
    if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
      await supabase
        .from('calls')
        // @ts-ignore - Supabase type inference issue
        .update({ ended_at: new Date().toISOString() })
        // @ts-ignore - Supabase type inference issue
        .eq('twilio_call_sid', callSid);

      // If call was handled by agent (status is in_progress or transcribing), trigger processing
      const { data: callData } = await supabase
        .from('calls')
        .select('status')
        .eq('twilio_call_sid', callSid)
        .single();

      const call = callData as any;
      if (call && (call.status === 'in_progress' || call.status === 'transcribing')) {
        // Trigger async processing (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/process-call?callSid=${callSid}`, {
          method: 'POST',
        }).catch((err) => console.error('Error triggering process-call:', err));
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in status callback:', error);
    return new Response('Error', { status: 500 });
  }
}

