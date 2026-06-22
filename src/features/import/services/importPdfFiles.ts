import { randomUUID } from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import type { Score, Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import {
  createSongPackage,
  deleteSongPackage,
} from '../../../storage/songPackageFiles';
import { detectSongMetadata } from '../domain/detectSongMetadata';

const MAX_PDF_BYTES = 50 * 1024 * 1024;

export interface PdfImportReport {
  cancelled: boolean;
  duplicateCount: number;
  failedCount: number;
  importedCount: number;
}

export async function pickAndImportPdfFiles(): Promise<PdfImportReport> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: 'application/pdf',
  });

  if (result.canceled) {
    return emptyReport(true);
  }

  return importPdfAssets(result.assets);
}

async function importPdfAssets(
  assets: readonly DocumentPicker.DocumentPickerAsset[],
): Promise<PdfImportReport> {
  const report = emptyReport(false);

  for (const asset of assets) {
    try {
      const outcome = await importPdfAsset(asset);
      if (outcome === 'duplicate') {
        report.duplicateCount += 1;
      } else {
        report.importedCount += 1;
      }
    } catch {
      report.failedCount += 1;
    }
  }

  return report;
}

async function importPdfAsset(
  asset: DocumentPicker.DocumentPickerAsset,
): Promise<'duplicate' | 'imported'> {
  validatePdfAsset(asset);

  const fileInfo = await FileSystem.getInfoAsync(asset.uri, { md5: true });
  if (!fileInfo.exists || fileInfo.isDirectory) {
    throw new Error('선택한 PDF 파일을 읽을 수 없습니다.');
  }
  if (fileInfo.size > MAX_PDF_BYTES) {
    throw new Error('PDF 파일은 50MB 이하여야 합니다.');
  }
  if (!fileInfo.md5) {
    throw new Error('PDF 중복 확인용 해시를 만들 수 없습니다.');
  }

  const repositories = await getRepositories();
  const duplicate = await repositories.scores.findByContentHash(fileInfo.md5);
  if (duplicate) {
    return 'duplicate';
  }

  const now = new Date().toISOString();
  const songId = randomUUID();
  const scoreId = randomUUID();
  const metadata = detectSongMetadata(asset.name);
  const song: Song = {
    id: songId,
    title: metadata.title,
    artist: metadata.artist,
    originalKey: null,
    preferredKey: null,
    bpm: null,
    tags: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const pdfFile = await createSongPackage(song, asset.uri);
    const score: Score = {
      contentHash: fileInfo.md5,
      id: scoreId,
      songId,
      pdfFile,
      noteLayer: null,
      ocrData: null,
    };
    await repositories.songs.save(song);
    await repositories.scores.save(score);
    await repositories.ocr.enqueue(score.id);
    return 'imported';
  } catch (error: unknown) {
    await repositories.songs.remove(songId).catch(() => undefined);
    await deleteSongPackage(songId).catch(() => undefined);
    throw error;
  }
}

function validatePdfAsset(asset: DocumentPicker.DocumentPickerAsset): void {
  const isPdfName = asset.name.toLocaleLowerCase().endsWith('.pdf');
  const isPdfType = !asset.mimeType || asset.mimeType === 'application/pdf';
  if (!isPdfName || !isPdfType) {
    throw new Error('PDF 파일만 가져올 수 있습니다.');
  }
  if (asset.size !== undefined && asset.size > MAX_PDF_BYTES) {
    throw new Error('PDF 파일은 50MB 이하여야 합니다.');
  }
}

function emptyReport(cancelled: boolean): PdfImportReport {
  return {
    cancelled,
    duplicateCount: 0,
    failedCount: 0,
    importedCount: 0,
  };
}
