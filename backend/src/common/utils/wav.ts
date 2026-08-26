/**
 * Wraps raw 16-bit PCM samples in a minimal 44-byte RIFF/WAVE header.
 *
 * Gemini's TTS models return headerless PCM data (no container), unlike
 * OpenAI's speech endpoint which returned a ready-to-play MP3. Everything
 * downstream — Cloudinary uploads, browser <audio> tags — expects a real
 * audio file, so this turns the raw samples into a standard, universally
 * playable .wav file. No external dependency needed; the WAV header format
 * is simple and stable enough to write by hand.
 */
export interface WavOptions {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export function pcmToWav(pcm: Buffer, { sampleRate, channels, bitDepth }: WavOptions): Buffer {
  const blockAlign = (channels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4); // total file size minus the 8 bytes for 'RIFF' + this field
  header.write('WAVE', 8, 'ascii');

  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmt chunk size (16 for PCM)
  header.writeUInt16LE(1, 20); // audio format: 1 = uncompressed PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}
