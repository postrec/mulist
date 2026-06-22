export interface DetectedSongMetadata {
  artist: string;
  title: string;
}

export function detectSongMetadata(fileName: string): DetectedSongMetadata {
  const baseName = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const separatorIndex = baseName.indexOf(' - ');

  if (separatorIndex > 0 && separatorIndex < baseName.length - 3) {
    return {
      artist: baseName.slice(0, separatorIndex).trim(),
      title: baseName.slice(separatorIndex + 3).trim(),
    };
  }

  return {
    artist: '아티스트 미상',
    title: baseName || '제목 없는 곡',
  };
}
