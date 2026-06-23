import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  ScoreNavigationMode,
  ScoreViewState,
  Setlist,
  Song,
} from '../../../domain/models';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { SCREEN_HEADER_HEIGHT } from '../../../shared/layout/metrics';
import { useAppSettings } from '../../settings/context/AppSettingsContext';
import { MusicControls } from '../../music/components/MusicControls';
import type { AnnotationTool } from '../components/AnnotationCanvas';
import { PdfJsViewer } from '../components/PdfJsViewer';
import { SetlistQuickPanel } from '../components/SetlistQuickPanel';
import {
  ScoreSettingsModal,
  type ScoreMetadata,
} from '../components/ScoreSettingsModal';
import type { PageLayout } from '../components/ViewerControls';
import {
  DrawingToolbar,
  HideMenuButton,
  ShowMenuButton,
  ViewerMenuBar,
} from '../components/ViewerMenus';
import { usePdfViewer } from '../hooks/usePdfViewer';

interface PdfViewerScreenProps {
  backLabel?: string;
  onBack: () => void;
  onSetlistSongSelect?: (song: Song) => void;
  onSongUpdate: (song: Song) => void;
  setlist?: Setlist | null;
  setlistSongs?: readonly Song[];
  song: Song;
}

const MIN_ZOOM = 25;
const MAX_ZOOM = 250;
const ZOOM_STEP = 25;

export function PdfViewerScreen({
  backLabel,
  onBack,
  onSetlistSongSelect,
  onSongUpdate,
  setlist = null,
  setlistSongs = [],
  song,
}: PdfViewerScreenProps) {
  useAppLanguage();
  const viewer = usePdfViewer(song);
  const { settings } = useAppSettings();
  const [tool, setTool] = useState<AnnotationTool | null>(null);
  const [penColor, setPenColor] = useState('#C62828');
  const [highlighterColor, setHighlighterColor] = useState('#FFE066');
  const [penWidth, setPenWidth] = useState(3.5);
  const [highlighterWidth, setHighlighterWidth] = useState(18);
  const [layout, setLayout] = useState<PageLayout>('single');
  const [zoom, setZoom] = useState(() =>
    clampZoom(Math.round(settings.defaultZoom * 100)),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [navigationMode, setNavigationMode] =
    useState<ScoreNavigationMode>('scroll');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [isViewStateReady, setIsViewStateReady] = useState(false);

  useEffect(() => {
    setIsViewStateReady(false);
    setTool(null);
    setIsDrawingOpen(false);
    setIsViewOpen(false);
  }, [song.id]);

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

  useEffect(() => {
    if (!viewer.score) return;
    setLayout(viewer.score.viewState.layout);
    setNavigationMode(viewer.score.viewState.navigationMode);
    setCurrentPage(viewer.score.viewState.currentPage);
    setIsViewStateReady(true);
  }, [viewer.score]);

  const updateViewState = (changes: Partial<ScoreViewState>) => {
    if (!viewer.score) return;
    void viewer.saveViewState({ ...viewer.score.viewState, ...changes });
  };

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
      {isMenuVisible ? (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backLabel}>
              {backLabel ?? t('common.backToLibrary')}
            </Text>
          </Pressable>
          <View style={styles.heading}>
            <Text numberOfLines={1} style={styles.title}>
              {song.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {song.artist}
            </Text>
          </View>
          <View style={[styles.controlsScroller, styles.controls]}>
            <ViewerMenuBar
              drawingOpen={isDrawingOpen}
              layout={layout}
              navigationMode={navigationMode}
              onCloseView={() => setIsViewOpen(false)}
              onLayoutChange={(next) => {
                setLayout(next);
                setIsViewOpen(false);
                updateViewState({ layout: next });
              }}
              onNavigationChange={(next) => {
                setNavigationMode(next);
                setIsViewOpen(false);
                updateViewState({ navigationMode: next });
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onToggleDrawing={() => {
                setIsDrawingOpen((current) => {
                  if (current) setTool(null);
                  return !current;
                });
                setIsViewOpen(false);
              }}
              onToggleView={() => {
                setIsViewOpen((current) => !current);
                setIsDrawingOpen(false);
                setTool(null);
              }}
              onZoomIn={() =>
                setZoom((current) => clampZoom(current + ZOOM_STEP))
              }
              onZoomOut={() =>
                setZoom((current) => clampZoom(current - ZOOM_STEP))
              }
              zoom={zoom}
              viewOpen={isViewOpen}
            />
            <MusicControls
              initialBpm={song.bpm}
              onBpmChange={(bpm) => void saveBpm(bpm)}
            />
            <HideMenuButton
              onPress={() => {
                setIsMenuVisible(false);
                setIsViewOpen(false);
              }}
            />
          </View>
        </View>
      ) : null}

      {!isMenuVisible ? (
        <ShowMenuButton onPress={() => setIsMenuVisible(true)} />
      ) : null}
      {viewer.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      ) : viewer.score && isViewStateReady ? (
        <View style={styles.viewerContainer}>
          <PdfJsViewer
            drawingColor={tool === 'highlighter' ? highlighterColor : penColor}
            drawingWidth={tool === 'highlighter' ? highlighterWidth : penWidth}
            drawingTool={
              tool === 'pen' || tool === 'highlighter' || tool === 'eraser'
                ? tool
                : null
            }
            fileUri={viewer.score.pdfFile}
            initialPage={currentPage}
            layout={layout}
            menuVisible={isMenuVisible}
            navigationMode={navigationMode}
            noteLayer={viewer.noteLayer}
            onNoteLayerChange={(noteLayer) =>
              void viewer.saveNoteLayer(noteLayer)
            }
            onTap={(page) => {
              if (isMenuVisible) {
                setIsMenuVisible(false);
              } else if (page === null) {
                setIsMenuVisible(true);
              } else {
                setCurrentPage(page);
                updateViewState({ currentPage: page });
              }
            }}
            onPageChange={(page) => {
              setCurrentPage(page);
              updateViewState({ currentPage: page });
            }}
            onZoomChange={(nextZoom) => setZoom(clampZoom(nextZoom))}
            pencilSmoothing={settings.applePencilSmoothing}
            zoom={zoom}
          />
          {isDrawingOpen ? (
            <DrawingToolbar
              color={tool === 'highlighter' ? highlighterColor : penColor}
              onColorSelect={(color) => {
                if (tool === 'highlighter') setHighlighterColor(color);
                else setPenColor(color);
              }}
              onSelect={setTool}
              onWidthSelect={(width) => {
                if (tool === 'highlighter') setHighlighterWidth(width);
                else setPenWidth(width);
              }}
              selected={tool}
              width={tool === 'highlighter' ? highlighterWidth : penWidth}
            />
          ) : null}
          {setlist && onSetlistSongSelect ? (
            <SetlistQuickPanel
              currentSongId={song.id}
              onSongPress={onSetlistSongSelect}
              setlist={setlist}
              songs={setlistSongs}
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
    height: SCREEN_HEADER_HEIGHT,
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
    flex: 1,
    gap: 8,
    justifyContent: 'space-between',
    minWidth: 0,
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
