import type { OcrData, Score } from '../../../domain/models';
import type { Repositories } from '../../../storage';

export interface OcrRecognizer {
  recognize(score: Score): Promise<OcrData>;
}

export async function processNextOcrJob(
  repositories: Repositories,
  recognizer: OcrRecognizer,
): Promise<boolean> {
  const job = await repositories.ocr.claimNext();
  if (!job) return false;

  try {
    const score = await repositories.scores.findById(job.scoreId);
    if (!score) throw new Error('OCR 대상 PDF를 찾을 수 없습니다.');
    const ocrData = await recognizer.recognize(score);
    await repositories.scores.save({ ...score, ocrData });
    await repositories.ocr.complete(job.id);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OCR 처리 실패';
    await repositories.ocr.fail(job.id, message);
  }
  return true;
}
