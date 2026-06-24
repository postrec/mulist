import { getAppLanguage } from '../shared/i18n';
import type { AppLanguage } from '../shared/i18n/language';

export interface TagPreset {
  aliases: readonly string[];
  id: string;
  label: string;
  labels: Record<AppLanguage, string>;
}

export const tagPresets: readonly TagPreset[] = [
  preset('kpop', 'K-Pop', 'K-Pop', 'K-Pop', ['한국', '한국노래', '케이팝']),
  preset('jpop', 'J-Pop', 'J-Pop', 'J-Pop', ['일본', '일본노래', '제이팝']),
  preset('pop', 'Pop', 'Pop', 'ポップ', ['팝', '팝송']),
  preset('rnb', 'R&B', 'R&B', 'R&B', ['알앤비', 'r&b']),
  preset('anime', '애니송', 'Anime', 'アニソン', ['애니메이션', 'anime']),
  preset('ballad', '발라드', 'Ballad', 'バラード', ['ballad']),
  preset('ccm', 'CCM', 'CCM', 'CCM', ['교회음악', '교회']),
  preset('indie', 'Indie', 'Indie', 'インディー', ['인디', '인디밴드']),
  preset('jazz', '재즈', 'Jazz', 'ジャズ', ['재즈스탠다드', 'jazz standard']),
  preset('rock', '락', 'Rock', 'ロック', ['록', 'rock']),
  preset('metal', '메탈', 'Metal', 'メタル', ['metal']),
  preset('vtuber', '버튜버', 'VTuber', 'VTuber', [
    '버츄얼',
    '버추얼',
    'vtuber',
  ]),
  preset('game', '게임음악', 'Game Music', 'ゲーム音楽', ['게임', 'game']),
  preset('gugak', '국악', 'Korean Traditional', '韓国伝統音楽', [
    '한국전통음악',
    'traditional korean',
  ]),
  preset('vocaloid', '보컬로이드', 'Vocaloid', 'ボーカロイド', ['vocaloid']),
];

let activeTagPresets: readonly TagPreset[] = tagPresets;

function preset(
  id: string,
  ko: string,
  en: string,
  ja: string,
  aliases: readonly string[],
): TagPreset {
  return { aliases, id, label: ko, labels: { en, ja, ko } };
}

const presetByKey = new Map<string, TagPreset>();
rebuildPresetIndex();

export function getTagPresets(): readonly TagPreset[] {
  return activeTagPresets;
}

export function replaceTagPresets(presets: readonly TagPreset[]): void {
  activeTagPresets = presets.length > 0 ? presets : tagPresets;
  rebuildPresetIndex();
}

export function resolveTagId(value: string): string {
  return presetByKey.get(normalizeKey(value))?.id ?? value.trim().toLowerCase();
}

export function getTagLabel(
  id: string,
  language: AppLanguage = getAppLanguage(),
): string {
  return presetByKey.get(normalizeKey(id))?.labels[language] ?? id;
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

function rebuildPresetIndex(): void {
  presetByKey.clear();
  for (const item of activeTagPresets) {
    for (const value of [
      item.id,
      item.label,
      ...Object.values(item.labels),
      ...item.aliases,
    ]) {
      presetByKey.set(normalizeKey(value), item);
    }
  }
}
