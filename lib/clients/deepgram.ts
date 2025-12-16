import { createClient } from '@deepgram/sdk';

const apiKey = process.env.DEEPGRAM_API_KEY;

if (!apiKey) {
  throw new Error('Missing DEEPGRAM_API_KEY');
}

export const deepgram = createClient(apiKey);

export async function transcribeRecording(recordingUrl: string): Promise<string> {
  try {
    // Deepgram batch transcription
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: recordingUrl } as any,
      {
        model: 'nova-2',
        language: 'en-US',
        punctuate: true,
        paragraphs: true,
      }
    );

    if (error) {
      throw error;
    }

    // Extract transcript text
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript ||
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
      '';

    return transcript;
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    throw error;
  }
}

/**
 * Generate TTS audio using Deepgram Aura (premium voice)
 * Uses aura-asteria-en model for professional, calm, lawyer-safe voice
 * 
 * @param text - Text to convert to speech (use short sentences for best results)
 * @returns Buffer containing WAV audio data
 */
export async function generateTTS(text: string): Promise<Buffer> {
  try {
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY not configured');
    }

    // Deepgram TTS API returns MP3 by default
    // Request WAV format explicitly for better Twilio compatibility
    // Format: encoding=linear16 (PCM), container=wav, sample_rate=24000 (Twilio standard)
    const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=linear16&container=wav&sample_rate=24000', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram TTS failed: ${response.status} ${errorText}`);
    }

    // Deepgram returns the format we requested (WAV)
    const audioArrayBuffer = await response.arrayBuffer();
    return Buffer.from(audioArrayBuffer);
  } catch (error) {
    console.error('Deepgram TTS error:', error);
    throw error;
  }
}

