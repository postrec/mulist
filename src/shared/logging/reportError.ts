import { getRepositories } from '../../storage';

export function reportError(context: string, reason: unknown): void {
  const error =
    reason instanceof Error
      ? reason
      : new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
  console.error(`[MuList] ${context}`, error);
  void persist('error', `${context}: ${error.message}`);
}

export function reportInfo(message: string): void {
  console.info(`[MuList] ${message}`);
  void persist('info', message);
}

export function reportWarning(message: string): void {
  console.warn(`[MuList] ${message}`);
  void persist('warning', message);
}

async function persist(
  level: 'error' | 'info' | 'warning',
  message: string,
): Promise<void> {
  try {
    const { logs } = await getRepositories();
    await logs.add(level, message);
  } catch (loggingError: unknown) {
    console.warn('[MuList] 로그 저장 실패', loggingError);
  }
}
