export type OcrJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OcrJob {
  attempts: number;
  createdAt: string;
  errorMessage: string | null;
  id: string;
  scoreId: string;
  status: OcrJobStatus;
  updatedAt: string;
}
