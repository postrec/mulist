import type { OcrData, Score } from '../../../domain/models';
import type { Repositories } from '../../../storage';
import { reportError } from '../../../shared/logging/reportError';

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
    const title = findOcrTitle(ocrData);
    if (title) {
      const song = await repositories.songs.findById(score.songId);
      if (song?.title === '이미지 악보') {
        await repositories.songs.save({
          ...song,
          title,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    await repositories.ocr.complete(job.id);
  } catch (error: unknown) {
    reportError(`OCR 처리 실패: ${job.scoreId}`, error);
    const message = error instanceof Error ? error.message : 'OCR 처리 실패';
    await repositories.ocr.fail(job.id, message);
  }
  return true;
}

function findOcrTitle(ocrData: OcrData): string | null {
  const largest = [...(ocrData.blocks ?? [])]
    .filter((block) => block.text.trim())
    .sort((left, right) => right.height - left.height)[0]
    ?.text.trim();
  if (largest) return largest.slice(0, 120);
  const firstLine = ocrData.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ? firstLine.slice(0, 120) : null;
}
