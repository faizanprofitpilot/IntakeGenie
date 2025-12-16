import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';
import { twilioClient } from '@/lib/clients/twilio';
import { transcribeRecording } from '@/lib/clients/deepgram';
import { generateSummary } from '@/lib/utils/summarize';
import { sendIntakeEmail } from '@/lib/clients/resend';
import { IntakeData, SummaryData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const callSid = request.nextUrl.searchParams.get('callSid');

    if (!callSid) {
      return new Response('Missing callSid', { status: 400 });
    }

    const supabase = createServiceClient();

    // Get call record
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .select('*, firms(*)')
      .eq('twilio_call_sid', callSid)
      .single();

    if (callError || !callData) {
      console.error('Call not found:', callError);
      return new Response('Call not found', { status: 404 });
    }

    const call = callData as any;

    // Update status to transcribing
    await supabase
      .from('calls')
      // @ts-ignore - Supabase type inference issue
      .update({ status: 'transcribing' })
      // @ts-ignore - Supabase type inference issue
      .eq('id', call.id);

    let transcript = call.transcript_text;
    let recordingUrl = call.recording_url;

    // If no recording URL, try to fetch from Twilio
    if (!recordingUrl) {
      try {
        const recordings = await twilioClient.recordings.list({
          callSid: callSid,
          limit: 1,
        });

        if (recordings.length > 0) {
          recordingUrl = recordings[0].uri.replace('.json', '.mp3');
          await supabase
            .from('calls')
            // @ts-ignore - Supabase type inference issue
            .update({ recording_url: recordingUrl })
            // @ts-ignore - Supabase type inference issue
            .eq('id', call.id);
        }
      } catch (error) {
        console.error('Error fetching recording from Twilio:', error);
      }
    }

    // Transcribe if we have a recording and no transcript
    if (recordingUrl && !transcript) {
      try {
        transcript = await transcribeRecording(recordingUrl);
        await supabase
          .from('calls')
          // @ts-ignore - Supabase type inference issue
          .update({ transcript_text: transcript, status: 'summarizing' })
          // @ts-ignore - Supabase type inference issue
          .eq('id', call.id);
      } catch (error) {
        console.error('Transcription error:', error);
        await supabase
          .from('calls')
          // @ts-ignore - Supabase type inference issue
          .update({
            status: 'error',
            error_message: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
          // @ts-ignore - Supabase type inference issue
          .eq('id', call.id);
        return new Response('Transcription failed', { status: 500 });
      }
    }

    // Generate summary
    const intake = (call.intake_json as IntakeData) || {};
    let summary: SummaryData;

    try {
      summary = await generateSummary(transcript || '', intake);
      await supabase
        .from('calls')
        // @ts-ignore - Supabase type inference issue
        .update({ summary_json: summary as any, status: 'emailed' })
        // @ts-ignore - Supabase type inference issue
        .eq('id', call.id);
    } catch (error) {
      console.error('Summarization error:', error);
        await supabase
          .from('calls')
          // @ts-ignore - Supabase type inference issue
          .update({
            status: 'error',
            error_message: `Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
          // @ts-ignore - Supabase type inference issue
          .eq('id', call.id);
      return new Response('Summarization failed', { status: 500 });
    }

    // Send email
    const firm = call.firms as any;
    if (firm && firm.notify_emails && firm.notify_emails.length > 0) {
      try {
        await sendIntakeEmail(
          firm.notify_emails,
          intake,
          summary,
          transcript,
          recordingUrl,
          call.urgency as any
        );
      } catch (error) {
        console.error('Email error:', error);
        await supabase
          .from('calls')
          // @ts-ignore - Supabase type inference issue
          .update({
            status: 'error',
            error_message: `Email failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
          // @ts-ignore - Supabase type inference issue
          .eq('id', call.id);
        return new Response('Email failed', { status: 500 });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in process-call:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

