import { createServiceClient } from '@/lib/clients/supabase';
import { generateSummary } from '@/lib/utils/summarize';
import { sendIntakeEmail } from '@/lib/clients/resend';
import { IntakeData, SummaryData, UrgencyLevel } from '@/types';

/**
 * Upsert call record with intake data (called during conversation)
 */
export async function upsertCall({
  conversationId,
  firmId,
  intake,
}: {
  conversationId: string;
  firmId?: string;
  intake?: any;
}) {
  const supabase = createServiceClient();

  // Find or create call record
  const { data: existingCall } = await supabase
    .from('calls')
    .select('id')
    .eq('vapi_conversation_id', conversationId)
    .single();

  if (existingCall && (existingCall as any).id) {
    // Update existing call
    await supabase
      .from('calls')
      // @ts-ignore
      .update({
        intake_json: intake as IntakeData,
        status: 'in_progress',
        urgency: intake?.urgency_level === 'high' ? 'high' : intake?.emergency_redirected ? 'emergency_redirected' : 'normal',
      })
      .eq('id', (existingCall as any).id);
  } else if (firmId) {
    // Create new call record
    await supabase
      .from('calls')
      // @ts-ignore
      .insert({
        vapi_conversation_id: conversationId,
        firm_id: firmId,
        intake_json: intake as IntakeData,
        status: 'in_progress',
        urgency: intake?.urgency_level === 'high' ? 'high' : intake?.emergency_redirected ? 'emergency_redirected' : 'normal',
        started_at: new Date().toISOString(),
      });
  }
}

/**
 * Finalize call: save transcript, generate summary, send email
 */
export async function finalizeCall({
  conversationId,
  transcript,
  phoneNumber,
  firmId,
}: {
  conversationId: string;
  transcript?: string;
  phoneNumber?: string;
  firmId?: string;
}) {
  const supabase = createServiceClient();

  // Find call record
  const { data: callData, error: callError } = await supabase
    .from('calls')
    .select('*, firms(*)')
    .eq('vapi_conversation_id', conversationId)
    .single();

  if (callError || !callData) {
    console.error('[Intake Processor] Call not found:', callError);
    return;
  }

  const call = callData as any;
  const intake = (call.intake_json as IntakeData) || {};

  // Update call with transcript and end time
  await supabase
    .from('calls')
    // @ts-ignore
    .update({
      transcript_text: transcript || null,
      from_number: phoneNumber || null,
      ended_at: new Date().toISOString(),
      status: 'summarizing',
    })
    .eq('id', call.id);

  // Generate summary
  let summary: SummaryData;
  try {
    summary = await generateSummary(transcript || 'No transcript available.', intake);
    await supabase
      .from('calls')
      // @ts-ignore
      .update({ summary_json: summary as any, status: 'summarizing' })
      .eq('id', call.id);
  } catch (error) {
    console.error('[Intake Processor] Summarization error:', error);
    // Create fallback summary
    summary = {
      title: `Intake Call - ${intake.full_name || 'Unknown'}`,
      summary_bullets: [
        `Caller: ${intake.full_name || 'Unknown'}`,
        `Phone: ${intake.callback_number || 'Not provided'}`,
        `Reason: ${intake.reason_for_call || 'Not specified'}`,
      ],
      key_facts: {
        incident_date: intake.incident_date_or_timeframe,
        location: intake.incident_location,
        injuries: intake.injury_description,
        treatment: intake.medical_treatment_received,
        insurance: intake.insurance_involved,
      },
      action_items: ['Review intake details', 'Follow up with caller'],
      urgency_level: (call.urgency as UrgencyLevel) || 'normal',
      follow_up_recommendation: 'Standard follow-up recommended',
    };
    await supabase
      .from('calls')
      // @ts-ignore
      .update({ summary_json: summary as any, status: 'summarizing' })
      .eq('id', call.id);
  }

  // Send email
  const firm = call.firms as any;
  if (firm && firm.notify_emails && firm.notify_emails.length > 0) {
    try {
      await sendIntakeEmail(
        firm.notify_emails,
        intake,
        summary,
        transcript || null,
        null, // Recording URL (Vapi may provide this separately)
        call.urgency as UrgencyLevel
      );
      await supabase
        .from('calls')
        // @ts-ignore
        .update({ status: 'emailed' })
        .eq('id', call.id);
    } catch (error) {
      console.error('[Intake Processor] Email sending failed:', error);
      await supabase
        .from('calls')
        // @ts-ignore
        .update({
          status: 'error',
          error_message: `Email failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        .eq('id', call.id);
    }
  } else {
    // No email addresses configured - still mark as emailed
    await supabase
      .from('calls')
      // @ts-ignore
      .update({ status: 'emailed' })
      .eq('id', call.id);
  }
}

