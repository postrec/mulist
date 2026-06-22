import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { Setlist, Song } from '../../../domain/models';

export async function exportSetlistPdf(
  setlist: Setlist,
  songs: readonly Song[],
): Promise<void> {
  const rows = songs
    .map(
      (song, index) =>
        `<tr><td>${index + 1}</td><td>${escapeHtml(song.title)}</td><td>${escapeHtml(song.artist)}</td><td>${escapeHtml(song.preferredKey ?? song.originalKey ?? '-')}</td><td>${song.bpm ?? '-'}</td></tr>`,
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,sans-serif;padding:32px;color:#1c211d}h1{margin-bottom:4px}
    .meta{color:#737970;margin-bottom:28px}table{width:100%;border-collapse:collapse}
    th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}th{color:#285c46}
  </style></head><body><h1>${escapeHtml(setlist.title)}</h1>
    <div class="meta">${escapeHtml(setlist.eventName)} · ${escapeHtml(setlist.eventDate)}</div>
    <table><thead><tr><th>#</th><th>곡</th><th>아티스트</th><th>Key</th><th>BPM</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      dialogTitle: `${setlist.title} 셋리스트 내보내기`,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}
