import type { AppLanguage } from '../../../shared/i18n/language';

export const profileColors = [
  '#345C52',
  '#3F6FA8',
  '#7356A8',
  '#B14E69',
  '#C26A3A',
  '#B08A2E',
  '#5F6875',
] as const;

export type ProfileColor = (typeof profileColors)[number];

export const musicianParts = [
  '보컬',
  '드럼',
  '베이스',
  '건반',
  '일렉기타',
  '바이올린',
  '비올라',
  '첼로',
  '콘트라베이스',
  '피아노',
  '작곡',
  '편곡',
  '작사',
  '음향엔지니어',
  '조명엔지니어',
] as const;

export type MusicianPart = (typeof musicianParts)[number];

const musicianPartLabels: Record<MusicianPart, Record<AppLanguage, string>> = {
  보컬: { ko: '보컬', en: 'Vocal', ja: 'ボーカル' },
  드럼: { ko: '드럼', en: 'Drums', ja: 'ドラム' },
  베이스: { ko: '베이스', en: 'Bass', ja: 'ベース' },
  건반: { ko: '건반', en: 'Keyboard', ja: 'キーボード' },
  일렉기타: { ko: '일렉기타', en: 'Electric Guitar', ja: 'エレキギター' },
  바이올린: { ko: '바이올린', en: 'Violin', ja: 'バイオリン' },
  비올라: { ko: '비올라', en: 'Viola', ja: 'ビオラ' },
  첼로: { ko: '첼로', en: 'Cello', ja: 'チェロ' },
  콘트라베이스: { ko: '콘트라베이스', en: 'Double Bass', ja: 'コントラバス' },
  피아노: { ko: '피아노', en: 'Piano', ja: 'ピアノ' },
  작곡: { ko: '작곡', en: 'Composer', ja: '作曲' },
  편곡: { ko: '편곡', en: 'Arranger', ja: '編曲' },
  작사: { ko: '작사', en: 'Lyricist', ja: '作詞' },
  음향엔지니어: {
    ko: '음향엔지니어',
    en: 'Audio Engineer',
    ja: '音響エンジニア',
  },
  조명엔지니어: {
    ko: '조명엔지니어',
    en: 'Lighting Engineer',
    ja: '照明エンジニア',
  },
};

export function getMusicianPartLabel(
  part: MusicianPart,
  language: AppLanguage,
): string {
  return musicianPartLabels[part][language];
}

export interface UserProfile {
  bio: string;
  color: ProfileColor;
  name: string;
  primaryPart: MusicianPart | null;
}

export const defaultUserProfile: UserProfile = {
  bio: '',
  color: profileColors[0],
  name: '',
  primaryPart: null,
};
