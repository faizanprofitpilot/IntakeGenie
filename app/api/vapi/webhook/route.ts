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
    } = body;

    console.log('[Vapi Webhook] Event:', event, 'Conversation ID:', conversation_id);

    if (event === 'conversation.updated') {
      // Update call with latest intake data
      await upsertCall({
        conversationId: conversation_id,
        firmId: metadata?.firmId,
        intake: structuredData,
      });
    }

    if (event === 'conversation.completed') {
      // Finalize call: save transcript, generate summary, send email
      await finalizeCall({
        conversationId: conversation_id,
        transcript,
        phoneNumber,
        firmId: metadata?.firmId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    // Always return 200 to prevent Vapi retries
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

