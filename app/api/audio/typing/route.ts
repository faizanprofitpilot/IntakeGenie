import { NextRequest, NextResponse } from 'next/server';

// CRITICAL: Must be dynamic and use nodejs runtime for audio serving
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint to serve a short typing/thinking sound
 * This plays while the agent is processing the user's input
 * 
 * Returns a very short (0.5 second) subtle typing/thinking sound
 * For production, replace this with a real typing sound file hosted in /public/audio/
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a very short (0.5 second) subtle typing sound
    // This is a minimal WAV file with a soft typing-like tone
    // Sample rate: 8000 Hz, Mono, 16-bit PCM
    
    const sampleRate = 8000;
    const duration = 0.5; // 0.5 seconds
    const numSamples = Math.floor(sampleRate * duration);
    
    // Generate a subtle typing-like sound (soft click pattern)
    const samples: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      // Create a subtle typing pattern: soft clicks every ~0.1 seconds
      const clickInterval = sampleRate * 0.1; // Click every 0.1 seconds
      const clickPosition = i % clickInterval;
      const clickWidth = 50; // Samples
      
      if (clickPosition < clickWidth) {
        // Soft click sound (exponential decay)
        const amplitude = Math.sin((clickPosition / clickWidth) * Math.PI) * 0.1;
        samples.push(amplitude);
      } else {
        samples.push(0);
      }
    }
    
    // Convert to 16-bit PCM
    const pcmData = Buffer.allocUnsafe(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      const intSample = Math.floor(sample * 32767);
      pcmData.writeInt16LE(intSample, i * 2);
    }
    
    // WAV header
    const dataSize = numSamples * 2;
    const fileSize = 36 + dataSize;
    
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(fileSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
    wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
    wavHeader.writeUInt16LE(1, 22); // NumChannels (mono)
    wavHeader.writeUInt32LE(sampleRate, 24); // SampleRate
    wavHeader.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    wavHeader.writeUInt16LE(2, 32); // BlockAlign
    wavHeader.writeUInt16LE(16, 34); // BitsPerSample
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);
    
    const wavFile = Buffer.concat([wavHeader, pcmData]);

    return new NextResponse(wavFile, {
      status: 200,
      headers: {
        'Content-Type': 'audio/x-wav',
        'Content-Length': wavFile.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Typing Audio] Error:', error);
    // Return empty response on error
    return new NextResponse(null, { 
      status: 404,
      headers: {
        'Content-Type': 'audio/x-wav',
      },
    });
  }
}

