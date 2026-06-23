import { randomUUID } from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';

import type { Score, Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import { reportError } from '../../../shared/logging/reportError';
import {
  createSongPackage,
  deleteSongPackage,
} from '../../../storage/songPackageFiles';
import { detectSongMetadata } from '../domain/detectSongMetadata';

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_COUNT = 30;

export type SelectedImageAsset = ImagePicker.ImagePickerAsset;

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

export async function pickScoreImages(): Promise<
  readonly SelectedImageAsset[] | null
> {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: ['images'],
    orderedSelection: true,
    quality: 1,
    selectionLimit: MAX_IMAGE_COUNT,
  });
  return result.canceled ? null : result.assets;
}

export async function importScoreImages(
  assets: readonly SelectedImageAsset[],
): Promise<PdfImportReport> {
  if (assets.length === 0) return emptyReport(true);
  if (assets.length > MAX_IMAGE_COUNT) {
    throw new Error(
      `이미지는 한 번에 ${MAX_IMAGE_COUNT}장까지 가져올 수 있습니다.`,
    );
  }
  const html = await createImagePdfHtml(assets);
  const printed = await Print.printToFileAsync({ html });
  const firstName = assets[0]?.fileName?.replace(/\.[^.]+$/, '').trim();
  const name = `${firstName || '이미지 악보'}.pdf`;
  try {
    const outcome = await importPdfAsset(
      {
        mimeType: 'application/pdf',
        name,
        uri: printed.uri,
      },
      '이미지 악보',
    );
    return {
      cancelled: false,
      duplicateCount: outcome === 'duplicate' ? 1 : 0,
      failedCount: 0,
      importedCount: outcome === 'imported' ? 1 : 0,
    };
  } finally {
    await FileSystem.deleteAsync(printed.uri, { idempotent: true }).catch(
      () => undefined,
    );
  }
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
  asset: PdfAsset,
  titleOverride?: string,
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
  const settings = await repositories.settings.get();
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
    title: titleOverride ?? metadata.title,
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
      viewState: {
        currentPage: 1,
        layout: settings.defaultPageLayout,
        navigationMode: settings.defaultNavigationMode,
      },
    };
    await repositories.songs.save(song);
    await repositories.scores.save(score);
    await repositories.ocr.enqueue(score.id);
    return 'imported';
  } catch (error: unknown) {
    reportError(`PDF 파일 가져오기 실패: ${asset.name}`, error);
    await repositories.songs.remove(songId).catch(() => undefined);
    await deleteSongPackage(songId).catch(() => undefined);
    throw error;
  }
}

interface PdfAsset {
  mimeType?: string | null;
  name: string;
  size?: number;
  uri: string;
}

async function createImagePdfHtml(
  assets: readonly SelectedImageAsset[],
): Promise<string> {
  const pages: string[] = [];
  for (const asset of assets) {
    const width = Math.min(2480, Math.max(1, asset.width));
    const optimized = await ImageManipulator.manipulateAsync(
      asset.uri,
      asset.width > width ? [{ resize: { width } }] : [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );
    try {
      const base64 = await FileSystem.readAsStringAsync(optimized.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      pages.push(
        `<section><img alt="악보 이미지" src="data:image/jpeg;base64,${base64}"></section>`,
      );
    } finally {
      await FileSystem.deleteAsync(optimized.uri, { idempotent: true }).catch(
        () => undefined,
      );
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}section{align-items:center;box-sizing:border-box;display:flex;height:297mm;justify-content:center;page-break-after:always;width:210mm}section:last-child{page-break-after:auto}img{height:100%;object-fit:contain;width:100%}</style></head><body>${pages.join('')}</body></html>`;
}

function validatePdfAsset(asset: PdfAsset): void {
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
