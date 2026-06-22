import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import pdfModuleAsset from '../../../../assets/pdfjs/pdf.min.bin';
import pdfWorkerAsset from '../../../../assets/pdfjs/pdf.worker.min.bin';

export interface PdfJsAssetUris {
  moduleCode: string;
  readAccessUri: string;
  workerCode: string;
}

let preparation: Promise<PdfJsAssetUris> | null = null;

export function preparePdfJsAssets(): Promise<PdfJsAssetUris> {
  preparation ??= copyAssetsToDocumentDirectory();
  return preparation;
}

async function copyAssetsToDocumentDirectory(): Promise<PdfJsAssetUris> {
  if (!FileSystem.documentDirectory) {
    throw new Error('PDF.js 저장소를 사용할 수 없습니다.');
  }
  const [moduleAsset, workerAsset] = await Promise.all([
    Asset.fromModule(pdfModuleAsset).downloadAsync(),
    Asset.fromModule(pdfWorkerAsset).downloadAsync(),
  ]);
  const [moduleCode, workerCode] = await Promise.all([
    FileSystem.readAsStringAsync(moduleAsset.localUri ?? moduleAsset.uri),
    FileSystem.readAsStringAsync(workerAsset.localUri ?? workerAsset.uri),
  ]);
  return {
    moduleCode,
    readAccessUri: FileSystem.documentDirectory,
    workerCode,
  };
}
