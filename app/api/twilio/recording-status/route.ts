import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = request.nextUrl.searchParams.get('callSid');
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingSid = formData.get('RecordingSid') as string;

    if (callSid && recordingUrl) {
      const supabase = createServiceClient();
      await supabase
        .from('calls')
        // @ts-ignore - Supabase type inference issue
        .update({ recording_url: recordingUrl })
        // @ts-ignore - Supabase type inference issue
        .eq('twilio_call_sid', callSid);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in recording status callback:', error);
    return new Response('Error', { status: 500 });
  }
}

