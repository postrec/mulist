import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';

import { firestore } from '../../config/firebase';
import {
  replaceTagPresets,
  tagPresets,
  type TagPreset,
} from '../../domain/tagPresets';
import { getAppLanguage } from '../../shared/i18n';
import {
  reportError,
  reportWarning,
} from '../../shared/logging/reportError';
import type { AppLanguage } from '../../shared/i18n/language';

const CACHE_KEY = 'mulist.normalization-catalog.v1';

export interface ArtistDefinition {
  aliases: readonly string[];
  id: string;
  names: Record<AppLanguage, string>;
}

export interface NormalizationCatalog {
  artists: readonly ArtistDefinition[];
  tags: readonly TagPreset[];
}

const fallbackArtists: readonly ArtistDefinition[] = [
  {
    aliases: ['아이유', 'IU'],
    id: 'iu',
    names: { en: 'IU', ja: 'IU', ko: '아이유' },
  },
  {
    aliases: ['성시경', 'Sung Si Kyung'],
    id: 'sung-si-kyung',
    names: { en: 'Sung Si Kyung', ja: 'ソン・シギョン', ko: '성시경' },
  },
];

let activeCatalog: NormalizationCatalog = {
  artists: fallbackArtists,
  tags: tagPresets,
};

export function getNormalizationCatalog(): NormalizationCatalog {
  return activeCatalog;
}

export function detectCatalogArtistPrefix(
  fileBaseName: string,
): { artist: string; title: string } | null {
  const candidates = activeCatalog.artists
    .flatMap((artist) =>
      [...new Set([...artist.aliases, ...Object.values(artist.names)])].map(
        (alias) => ({ alias, artist }),
      ),
    )
    .sort((left, right) => right.alias.length - left.alias.length);
  const normalized = fileBaseName.trim();
  for (const candidate of candidates) {
    if (
      !normalized
        .toLocaleLowerCase()
        .startsWith(candidate.alias.toLocaleLowerCase())
    )
      continue;
    const title = normalized
      .slice(candidate.alias.length)
      .replace(/^[\s_\-–—]+/, '')
      .trim();
    if (!title) continue;
    return {
      artist:
        candidate.artist.names[getAppLanguage()] ||
        candidate.artist.names.ko ||
        candidate.alias,
      title,
    };
  }
  return null;
}

export function startNormalizationCatalogSync(
  onUpdate?: () => void,
): () => void {
  let active = true;
  let remoteCatalogApplied = false;
  void AsyncStorage.getItem(CACHE_KEY)
    .then((cached) => {
      if (!active || !cached || remoteCatalogApplied) return;
      applyCatalog(JSON.parse(cached) as unknown);
      onUpdate?.();
    })
    .catch((reason: unknown) =>
      reportError('정규화 카탈로그 캐시 로드 실패', reason),
    );

  const unsubscribeSnapshot = onSnapshot(
    doc(firestore, 'catalog', 'normalization'),
    (snapshot) => {
      if (!snapshot.exists()) return;
      remoteCatalogApplied = true;
      const catalog = parseCatalog(snapshot.data());
      applyCatalog(catalog);
      void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
      onUpdate?.();
    },
    (reason) => {
      if (isPermissionDenied(reason)) {
        reportWarning(
          '정규화 카탈로그 읽기 권한이 아직 적용되지 않아 로컬 카탈로그를 사용합니다.',
        );
        return;
      }
      reportError('정규화 카탈로그 구독 실패', reason);
    },
  );
  return () => {
    active = false;
    unsubscribeSnapshot();
  };
}

function isPermissionDenied(reason: unknown): boolean {
  return (
    isRecord(reason) &&
    'code' in reason &&
    reason.code === 'permission-denied'
  );
}

function applyCatalog(value: unknown): void {
  const catalog = parseCatalog(value);
  activeCatalog = catalog;
  replaceTagPresets(catalog.tags);
}

function parseCatalog(value: unknown): NormalizationCatalog {
  if (!isRecord(value)) return activeCatalog;
  const tags = Array.isArray(value.tags)
    ? value.tags
        .map(parseTag)
        .filter((item): item is TagPreset => item !== null)
    : [];
  const artists = Array.isArray(value.artists)
    ? value.artists
        .map(parseArtist)
        .filter((item): item is ArtistDefinition => item !== null)
    : [];
  return {
    artists: artists.length > 0 ? artists : fallbackArtists,
    tags: tags.length > 0 ? tags : tagPresets,
  };
}

function parseTag(value: unknown): TagPreset | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const labels = parseLabels(value.labels);
  return {
    aliases: stringArray(value.aliases),
    id: value.id,
    label: labels.ko,
    labels,
  };
}

function parseArtist(value: unknown): ArtistDefinition | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    aliases: stringArray(value.aliases),
    id: value.id,
    names: parseLabels(value.names),
  };
}

function parseLabels(value: unknown): Record<AppLanguage, string> {
  const labels = isRecord(value) ? value : {};
  const ko = typeof labels.ko === 'string' ? labels.ko : '';
  const en = typeof labels.en === 'string' ? labels.en : ko;
  const ja = typeof labels.ja === 'string' ? labels.ja : en || ko;
  return { en, ja, ko: ko || en || ja };
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
