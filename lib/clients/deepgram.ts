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

