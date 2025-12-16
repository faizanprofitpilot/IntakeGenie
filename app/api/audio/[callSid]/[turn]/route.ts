import { NextRequest, NextResponse } from 'next/server';
import { generateTTS } from '@/lib/clients/deepgram';
import { normalizeAppUrl } from '@/lib/clients/twilio';

// In-memory cache for generated audio (key: text, value: Buffer)
// In production, consider using Redis or file storage
const audioCache = new Map<string, Buffer>();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Generate a cache key from text
function getCacheKey(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callSid: string; turn: string }> }
) {
  try {
    const { callSid, turn } = await params;
    const text = request.nextUrl.searchParams.get('text');

    if (!text) {
      return new NextResponse('Missing text parameter', { status: 400 });
    }

    // Check cache first
    const cacheKey = getCacheKey(text);
    let audioBuffer: Buffer;

    if (audioCache.has(cacheKey)) {
      console.log(`[Audio Cache] Hit for: "${text.substring(0, 50)}..."`);
      audioBuffer = audioCache.get(cacheKey)!;
    } else {
      console.log(`[Deepgram TTS] Generating audio for: "${text.substring(0, 50)}..."`);
      
      try {
        // Generate TTS with Deepgram Aura
        audioBuffer = await generateTTS(text);
        
        // Cache the result (limit cache size to prevent memory issues)
        if (audioCache.size < 100) {
          audioCache.set(cacheKey, audioBuffer);
        }
      } catch (error) {
        console.error('[Deepgram TTS] Error generating audio:', error);
        // Return 404 so Twilio will skip this Play and continue
        // The caller should have fallback logic, but this prevents Twilio from trying to play error text
        return new NextResponse(null, { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
    }

    // Return audio - use audio/x-wav for better Twilio compatibility
    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/x-wav', // Twilio prefers audio/x-wav over audio/wav
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Audio Route] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

