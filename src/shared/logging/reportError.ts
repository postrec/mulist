export function reportError(context: string, reason: unknown): void {
  const error =
    reason instanceof Error
      ? reason
      : new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
  console.error(`[MuList] ${context}`, error);
}
