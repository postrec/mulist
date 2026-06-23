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
