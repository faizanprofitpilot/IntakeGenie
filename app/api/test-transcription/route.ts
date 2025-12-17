import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/clients/supabase';
import { twilioClient } from '@/lib/clients/twilio';
import { transcribeRecording } from '@/lib/clients/deepgram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Test endpoint to verify transcription is working
 * Usage: GET /api/test-transcription?callSid=CAxxxxx
 * Or: GET /api/test-transcription (tests with a sample recording URL)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callSid = searchParams.get('callSid');

  const results: {
    success: boolean;
    message: string;
    callSid?: string;
    hasRecording?: boolean;
    recordingUrl?: string;
    transcriptionTest?: {
      success: boolean;
      error?: string;
      transcriptLength?: number;
    };
    recentCalls?: any[];
  } = {
    success: false,
    message: '',
  };

  try {
    const supabase = createServiceClient();

    if (callSid) {
      // Test transcription for a specific call
      console.log(`[Test Transcription] Testing transcription for call ${callSid}`);

      // Get call record
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .select('*')
        .eq('twilio_call_sid', callSid)
        .single();

      if (callError || !callData) {
        results.message = `Call not found: ${callError?.message || 'Unknown error'}`;
        return NextResponse.json(results, { status: 404 });
      }

      const call = callData as any;
      results.callSid = callSid;
      results.hasRecording = !!call.recording_url;

      let recordingUrl = call.recording_url;

      // If no recording URL, try to fetch from Twilio
      if (!recordingUrl) {
        console.log(`[Test Transcription] Fetching recordings from Twilio for call ${callSid}...`);
        try {
          // List recordings for this specific call
          const callRecordings = await (twilioClient as any).calls(callSid).recordings.list({ limit: 1 });
          const recordings = callRecordings;

          console.log(`[Test Transcription] Found ${recordings.length} recording(s)`);

          if (recordings.length > 0) {
            const recordingSid = recordings[0].sid;
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
            results.recordingUrl = recordingUrl;
            results.hasRecording = true;

            // Update the call record
            await supabase
              .from('calls')
              // @ts-ignore
              .update({ recording_url: recordingUrl })
              // @ts-ignore
              .eq('id', call.id);
          } else {
            results.message = `No recordings found for call ${callSid}`;
            return NextResponse.json(results);
          }
        } catch (error) {
          results.message = `Error fetching recordings: ${error instanceof Error ? error.message : 'Unknown error'}`;
          return NextResponse.json(results, { status: 500 });
        }
      } else {
        results.recordingUrl = recordingUrl;
      }

      // Test transcription
      if (recordingUrl) {
        console.log(`[Test Transcription] Testing transcription with URL: ${recordingUrl}`);
        try {
          const transcript = await transcribeRecording(recordingUrl);
          results.transcriptionTest = {
            success: true,
            transcriptLength: transcript.length,
          };
          results.success = true;
          results.message = `Transcription successful! Transcript length: ${transcript.length} characters`;

          // Update call with transcript
          await supabase
            .from('calls')
            // @ts-ignore
            .update({ transcript_text: transcript })
            // @ts-ignore
            .eq('id', call.id);
        } catch (error) {
          results.transcriptionTest = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          results.message = `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    } else {
      // Show recent calls and their status
      console.log('[Test Transcription] Fetching recent calls...');

      const { data: calls, error } = await supabase
        .from('calls')
        .select('id, twilio_call_sid, status, recording_url, transcript_text, started_at, ended_at')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        results.message = `Error fetching calls: ${error.message}`;
        return NextResponse.json(results, { status: 500 });
      }

      results.recentCalls = calls || [];
      results.success = true;
      results.message = `Found ${calls?.length || 0} recent calls`;

      // Test transcription with first call that has a recording
      if (calls && calls.length > 0) {
        const callWithRecording = calls.find((c: any) => c.recording_url && !c.transcript_text) as any;
        if (callWithRecording) {
          results.callSid = callWithRecording.twilio_call_sid;
          results.recordingUrl = callWithRecording.recording_url;
          results.hasRecording = true;

          console.log(`[Test Transcription] Testing transcription for call ${callWithRecording.twilio_call_sid}`);
          try {
            const transcript = await transcribeRecording(callWithRecording.recording_url);
            results.transcriptionTest = {
              success: true,
              transcriptLength: transcript.length,
            };
            results.message = `Transcription test successful! Transcript length: ${transcript.length} characters`;

            // Update call with transcript
            await supabase
              .from('calls')
              // @ts-ignore
              .update({ transcript_text: transcript })
              // @ts-ignore
              .eq('id', callWithRecording.id);
          } catch (error) {
            results.transcriptionTest = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            results.message = `Transcription test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        } else {
          results.message = 'No calls with recordings found that need transcription';
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Test Transcription] Unexpected error:', error);
    results.message = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return NextResponse.json(results, { status: 500 });
  }
}

