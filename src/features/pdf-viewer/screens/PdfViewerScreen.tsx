import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';
import { useAppSettings } from '../../settings/context/AppSettingsContext';
import { MusicControls } from '../../music/components/MusicControls';
import {
  AnnotationCanvas,
  type AnnotationTool,
} from '../components/AnnotationCanvas';
import { PdfToolbar } from '../components/PdfToolbar';
import { PdfJsViewer } from '../components/PdfJsViewer';
import {
  ScoreSettingsModal,
  type ScoreMetadata,
} from '../components/ScoreSettingsModal';
import { type PageLayout, ViewerControls } from '../components/ViewerControls';
import { usePdfViewer } from '../hooks/usePdfViewer';

interface PdfViewerScreenProps {
  onBack: () => void;
  onSongUpdate: (song: Song) => void;
  song: Song;
}

const MIN_ZOOM = 25;
const MAX_ZOOM = 250;
const ZOOM_STEP = 25;

export function PdfViewerScreen({
  onBack,
  onSongUpdate,
  song,
}: PdfViewerScreenProps) {
  const viewer = usePdfViewer(song);
  const { settings } = useAppSettings();
  const [tool, setTool] = useState<AnnotationTool | null>(null);
  const [layout, setLayout] = useState<PageLayout>('single');
  const [zoom, setZoom] = useState(() =>
    clampZoom(Math.round(settings.defaultZoom * 100)),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (settings.landscapeLock) {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      );
    } else {
      void ScreenOrientation.unlockAsync();
    }
    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, [settings.landscapeLock]);

  const saveMetadata = async (metadata: ScoreMetadata) => {
    const updatedSong = await viewer.saveMetadata(metadata);
    onSongUpdate(updatedSong);
  };

  const saveBpm = async (bpm: number) => {
    const updatedSong = await viewer.saveBpm(bpm);
    onSongUpdate(updatedSong);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>‹ 라이브러리</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text numberOfLines={1} style={styles.title}>
            {song.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {song.artist}
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.controls}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.controlsScroller}
        >
          <ViewerControls
            layout={layout}
            onLayoutChange={setLayout}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onZoomIn={() =>
              setZoom((current) => clampZoom(current + ZOOM_STEP))
            }
            onZoomOut={() =>
              setZoom((current) => clampZoom(current - ZOOM_STEP))
            }
            zoom={zoom}
          />
          <MusicControls
            initialBpm={song.bpm}
            onBpmChange={(bpm) => void saveBpm(bpm)}
          />
          <PdfToolbar onSelect={setTool} selected={tool} />
        </ScrollView>
      </View>

      {viewer.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      ) : viewer.score ? (
        <View style={styles.viewerContainer}>
          <PdfJsViewer
            fileUri={viewer.score.pdfFile}
            layout={layout}
            onZoomChange={(nextZoom) => setZoom(clampZoom(nextZoom))}
            zoom={zoom}
          />
          {tool ? (
            <AnnotationCanvas
              noteLayer={viewer.noteLayer}
              onChange={(layer) => void viewer.saveNoteLayer(layer)}
              tool={tool}
            />
          ) : null}
        </View>
      ) : (
        <Text style={styles.error}>{viewer.error}</Text>
      )}
      <ScoreSettingsModal
        onClose={() => setIsSettingsOpen(false)}
        onSave={saveMetadata}
        song={song}
        visible={isSettingsOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 10,
  },
  backButton: { paddingVertical: 9, width: 92 },
  backLabel: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  heading: { alignItems: 'center', maxWidth: 180, minWidth: 100 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  artist: { color: colors.muted, fontSize: 10, marginTop: 1 },
  controlsScroller: { flex: 1, marginLeft: 8 },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  viewerContainer: {
    alignItems: 'center',
    backgroundColor: '#272927',
    flex: 1,
    justifyContent: 'center',
  },
  center: { flex: 1 },
  error: { color: '#9A3428', padding: 24, textAlign: 'center' },
});

function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}
