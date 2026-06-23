export interface TagPreset {
  aliases: readonly string[];
  id: string;
  label: string;
}

export const tagPresets: readonly TagPreset[] = [
  { id: 'kpop', label: 'K-Pop', aliases: ['한국', '한국노래', '케이팝'] },
  { id: 'jpop', label: 'J-Pop', aliases: ['일본', '일본노래', '제이팝'] },
  { id: 'pop', label: 'Pop', aliases: ['팝', '팝송'] },
  { id: 'rnb', label: 'R&B', aliases: ['알앤비', 'r&b'] },
  { id: 'anime', label: '애니송', aliases: ['애니메이션', 'anime'] },
  { id: 'ballad', label: '발라드', aliases: ['ballad'] },
  { id: 'ccm', label: 'CCM', aliases: ['교회음악', '교회'] },
  { id: 'indie', label: 'Indie', aliases: ['인디', '인디밴드'] },
  { id: 'jazz', label: '재즈', aliases: ['재즈스탠다드', 'jazz standard'] },
  { id: 'rock', label: '락', aliases: ['록', 'rock'] },
  { id: 'metal', label: '메탈', aliases: ['metal'] },
  { id: 'vtuber', label: '버튜버', aliases: ['버츄얼', '버추얼', 'vtuber'] },
  { id: 'game', label: '게임음악', aliases: ['게임', 'game'] },
  {
    id: 'gugak',
    label: '국악',
    aliases: ['한국전통음악', 'traditional korean'],
  },
  { id: 'vocaloid', label: '보컬로이드', aliases: ['vocaloid'] },
];

const presetByKey = new Map<string, TagPreset>();
for (const preset of tagPresets) {
  for (const value of [preset.id, preset.label, ...preset.aliases]) {
    presetByKey.set(normalizeKey(value), preset);
  }
}

export function resolveTagId(value: string): string {
  return presetByKey.get(normalizeKey(value))?.id ?? value.trim().toLowerCase();
}

export function getTagLabel(id: string): string {
  return presetByKey.get(normalizeKey(id))?.label ?? id;
}

export function normalizeTagIds(values: readonly string[]): readonly string[] {
  return [...new Set(values.map(resolveTagId).filter(Boolean))];
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}
