import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Score, Song } from '../../../domain/models';
import { reportError } from '../../../shared/logging/reportError';
import { colors } from '../../../shared/theme/colors';
import { getRepositories } from '../../../storage';
import { PdfJsViewer } from '../../pdf-viewer/components/PdfJsViewer';

export function SetlistScorePreview({
  onOpenViewer,
  song,
}: {
  onOpenViewer: () => void;
  song: Song;
}) {
  const [score, setScore] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let active = true;
    setScore(null);
    setError(null);
    setZoom(100);
    void getRepositories()
      .then(({ scores }) => scores.findBySongId(song.id))
      .then(([first]) => {
        if (!active) return;
        if (first) setScore(first);
        else setError('이 곡에 연결된 PDF가 없습니다.');
      })
      .catch((reason: unknown) => {
        reportError(`셋리스트 악보 미리보기 실패: ${song.id}`, reason);
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : '악보를 불러오지 못했습니다.',
          );
      });
    return () => {
      active = false;
    };
  }, [song.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onOpenViewer} style={styles.openButton}>
          <Text style={styles.openButtonText}>뷰어로 이동</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
      <View style={styles.viewer}>
        {score ? (
          <PdfJsViewer
            fileUri={score.pdfFile}
            initialPage={1}
            key={score.id}
            layout="single"
            navigationMode="scroll"
            onPageChange={() => undefined}
            onTap={() => undefined}
            onZoomChange={setZoom}
            zoom={zoom}
          />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#272927', flex: 1 },
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  openButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  openButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  chevron: { color: colors.primary, fontSize: 22, lineHeight: 22 },
  viewer: { flex: 1 },
  loading: { flex: 1 },
  error: { color: '#E9897E', padding: 24, textAlign: 'center' },
});
