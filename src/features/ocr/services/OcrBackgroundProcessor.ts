import { getRepositories } from '../../../storage';
import type { OcrRecognizer } from './OcrPipeline';
import { processNextOcrJob } from './OcrPipeline';

let processingPromise: Promise<number> | null = null;

export function processOcrQueueInBackground(
  recognizer: OcrRecognizer,
  maxJobs = 3,
): Promise<number> {
  processingPromise ??= run(recognizer, maxJobs).finally(() => {
    processingPromise = null;
  });
  return processingPromise;
}

async function run(
  recognizer: OcrRecognizer,
  maxJobs: number,
): Promise<number> {
  const repositories = await getRepositories();
  let processed = 0;

  while (processed < maxJobs) {
    const didProcess = await processNextOcrJob(repositories, recognizer);
    if (!didProcess) break;
    processed += 1;
    await yieldToUi();
  }
  return processed;
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
