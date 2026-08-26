export type VoiceCommand =
  | 'next'
  | 'previous'
  | 'repeat'
  | 'start-timer'
  | 'pause-timer'
  | 'reset-timer'
  | null;

/** Fuzzy command matching — tolerates common mis-hearings from speech engines. */
export function matchCommand(rawTranscript: string): VoiceCommand {
  const t = rawTranscript.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;

  const has = (words: string[]) => words.some(w => t.includes(w));

  if (has(['reset timer', 'restart timer', 'reset the timer', 'टाइमर रीसेट', 'टाइमर फिर'])) return 'reset-timer';
  if (has(['start timer', 'start the timer', 'begin timer', 'stat timer', 'timer start', 'टाइमर चालू', 'टाइमर शुरू'])) return 'start-timer';
  if (has(['pause timer', 'stop timer', 'pause', 'stop', 'रोको', 'रुको', 'टाइमर बंद'])) return 'pause-timer';
  if (has(['repeat', 'again', 'say again', 'read it', 'what', 'रिपीट', 'रीपीट', 'ریپیٹ', 'رپیٹ', 'दोबारा', 'फिर से', 'दोहराओ'])) return 'repeat';
  if (has(['previous', 'preview', 'previews', 'prev', 'go back', 'back', 'last step', 'पीछे', 'पिछला', 'वापस'])) return 'previous';
  if (has(['next', 'neck', 'nex', 'necks', 'नेक्स्ट', 'नैक्स्ट', 'नेकस्ट', 'نیکسٹ', 'نیکست', 'نيكست', 'text step', 'next step', 'forward', 'continue', 'go on', 'done', 'आगे', 'अगला', 'हो गया'])) return 'next';
  return null;
}

export const COMMAND_LABEL: Record<Exclude<VoiceCommand, null>, string> = {
  next: 'Next step',
  previous: 'Previous step',
  repeat: 'Repeat',
  'start-timer': 'Timer started',
  'pause-timer': 'Timer paused',
  'reset-timer': 'Timer reset',
};

/** Encode mono Float32 PCM chunks into a complete 16-bit WAV (downsampled to 16 kHz). */
export function encodeWav(chunks: Float32Array[], sampleRate: number, targetRate = 16000): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.length;
  }

  const ratio = sampleRate / targetRate;
  const outLength = ratio > 1 ? Math.floor(merged.length / ratio) : merged.length;
  const samples = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    samples[i] = merged[Math.min(merged.length - 1, Math.floor(i * ratio))];
  }
  const rate = ratio > 1 ? targetRate : sampleRate;

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let p = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    p += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** Simple push-to-talk WAV recorder using the Web Audio API. */
export async function startWavRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const pcm: Float32Array[] = [];
  node.onaudioprocess = e => pcm.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(node);
  node.connect(ctx.destination);

  return async function stop(): Promise<Blob> {
    stream.getTracks().forEach(t => t.stop());
    node.disconnect();
    source.disconnect();
    const blob = encodeWav(pcm, ctx.sampleRate);
    await ctx.close();
    return blob;
  };
}
