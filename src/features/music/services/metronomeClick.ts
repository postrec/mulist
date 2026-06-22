import * as FileSystem from 'expo-file-system/legacy';

const FILE_NAME = 'mulist-metronome-click.wav';

export async function ensureMetronomeClick(): Promise<string> {
  if (!FileSystem.cacheDirectory)
    throw new Error('오디오 캐시를 사용할 수 없습니다.');
  const uri = `${FileSystem.cacheDirectory}${FILE_NAME}`;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(uri, createClickWavBase64(), {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  return uri;
}

function createClickWavBase64(): string {
  const sampleRate = 8000;
  const sampleCount = 480;
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);
  writeText(bytes, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(bytes, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(bytes, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.exp(-index / 75);
    const sample =
      Math.sin((2 * Math.PI * 1450 * index) / sampleRate) * envelope;
    view.setInt16(44 + index * 2, Math.round(sample * 26000), true);
  }
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary);
}

function writeText(bytes: Uint8Array, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    bytes[offset + index] = text.charCodeAt(index);
  }
}
