export type AppLanguage = 'ko' | 'en' | 'ja';

export const supportedLanguages: readonly AppLanguage[] = ['ko', 'en', 'ja'];

export const languageNames: Record<AppLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

export function detectAppLanguage(): AppLanguage {
  try {
    const locale = new Intl.DateTimeFormat()
      .resolvedOptions()
      .locale.toLowerCase();
    if (locale.startsWith('en')) return 'en';
    if (locale.startsWith('ja')) return 'ja';
  } catch {
    // fall through to Korean.
  }
  return 'ko';
}
