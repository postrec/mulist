import { useEffect, useMemo, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors } from '../../../shared/theme/colors';
import type {
  NoteLayer,
  ScoreNavigationMode,
  StrokeTool,
} from '../../../domain/models';
import { createPdfJsHtml } from '../services/createPdfJsHtml';
import {
  type PdfJsAssetUris,
  preparePdfJsAssets,
} from '../services/pdfJsAssets';
import type { PageLayout } from './ViewerControls';

interface PdfJsViewerProps {
  drawingColor?: string;
  drawingWidth?: number;
  fileUri: string;
  drawingTool?: DrawingTool | null;
  layout: PageLayout;
  navigationMode: ScoreNavigationMode;
  initialPage: number;
  menuVisible?: boolean;
  noteLayer?: NoteLayer;
  onNoteLayerChange?: (noteLayer: NoteLayer) => void;
  onTap: (page: number | null) => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  pencilSmoothing?: number;
  zoom: number;
}

type DrawingTool = StrokeTool | 'eraser';

const emptyNoteLayer: NoteLayer = { strokes: [], texts: [], version: 2 };

export function PdfJsViewer({
  drawingColor = '#C62828',
  drawingWidth = 3.5,
  drawingTool = null,
  fileUri,
  layout,
  navigationMode,
  initialPage,
  menuVisible = true,
  noteLayer = emptyNoteLayer,
  onNoteLayerChange,
  onTap,
  onPageChange,
  onZoomChange,
  pencilSmoothing = 2,
  zoom,
}: PdfJsViewerProps) {
  const webView = useRef<WebView>(null);
  const lastViewerZoom = useRef<number | null>(null);
  const initialLayout = useRef(layout).current;
  const initialNavigationMode = useRef(navigationMode).current;
  const restoredPage = useRef(initialPage).current;
  const initialZoom = useRef(zoom).current;
  const initialNoteLayer = useRef(noteLayer).current;
  const initialDrawingColor = useRef(drawingColor).current;
  const initialDrawingWidth = useRef(drawingWidth).current;
  const initialPencilSmoothing = useRef(pencilSmoothing).current;
  const [assets, setAssets] = useState<PdfJsAssetUris | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void preparePdfJsAssets()
      .then((prepared) => {
        if (active) setAssets(prepared);
      })
      .catch((assetError: unknown) => {
        if (active) {
          setError(
            assetError instanceof Error
              ? assetError.message
              : 'PDF.js를 준비하지 못했습니다.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setPdfBase64(null);
    void FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
      .then((data) => {
        if (active) setPdfBase64(data);
      })
      .catch((fileError: unknown) => {
        if (active) {
          setError(
            fileError instanceof Error
              ? fileError.message
              : 'PDF 파일을 읽지 못했습니다.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [fileUri]);

  const html = useMemo(
    () =>
      assets && pdfBase64
        ? createPdfJsHtml({
            ...assets,
            fileUri,
            initialLayout,
            initialNavigationMode,
            initialPage: restoredPage,
            initialZoom,
            initialNoteLayer,
            initialDrawingColor,
            initialDrawingWidth,
            initialPencilSmoothing,
            pdfBase64,
          })
        : null,
    [
      assets,
      fileUri,
      initialLayout,
      initialNavigationMode,
      initialZoom,
      initialNoteLayer,
      initialDrawingColor,
      initialDrawingWidth,
      initialPencilSmoothing,
      pdfBase64,
      restoredPage,
    ],
  );

  useEffect(() => {
    if (!isReady || lastViewerZoom.current === zoom) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setZoom(${zoom});true;`,
    );
  }, [isReady, zoom]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setLayout(${JSON.stringify(layout)});true;`,
    );
  }, [isReady, layout]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setNavigationMode(${JSON.stringify(navigationMode)});true;`,
    );
  }, [isReady, navigationMode]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setMenuVisible(${menuVisible});true;`,
    );
  }, [isReady, menuVisible]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setDrawingTool(${JSON.stringify(drawingTool)});true;`,
    );
  }, [drawingTool, isReady]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setDrawingColor(${JSON.stringify(drawingColor)});true;`,
    );
  }, [drawingColor, isReady]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setDrawingWidth(${drawingWidth});true;`,
    );
  }, [drawingWidth, isReady]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setPencilSmoothing(${pencilSmoothing});true;`,
    );
  }, [isReady, pencilSmoothing]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setNoteLayer(${JSON.stringify(noteLayer)});true;`,
    );
  }, [isReady, noteLayer]);

  const receiveMessage = (event: WebViewMessageEvent) => {
    const message = parseViewerMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'ready') {
      setIsReady(true);
    } else if (message.type === 'zoom') {
      lastViewerZoom.current = message.zoom;
      onZoomChange(message.zoom);
    } else if (message.type === 'tap') {
      onTap(message.page);
    } else if (message.type === 'diagnostic') {
      console.warn(message.message);
    } else if (message.type === 'page') {
      onPageChange(message.page);
    } else if (message.type === 'noteLayer') {
      onNoteLayerChange?.(message.noteLayer);
    } else {
      setError(message.message);
    }
  };

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!assets || !pdfBase64 || !html) {
    return <ActivityIndicator color={colors.primary} style={styles.center} />;
  }
  return (
    <View style={styles.container}>
      <WebView
        allowFileAccess
        allowingReadAccessToURL={assets.readAccessUri}
        javaScriptEnabled
        onMessage={receiveMessage}
        originWhitelist={['file://*']}
        ref={webView}
        source={{ baseUrl: assets.readAccessUri, html }}
        style={styles.webView}
      />
    </View>
  );
}

type ViewerMessage =
  | { type: 'ready' }
  | { type: 'zoom'; zoom: number }
  | { page: number | null; type: 'tap' }
  | { page: number; type: 'page' }
  | { message: string; type: 'diagnostic' }
  | { message: string; type: 'error' }
  | { noteLayer: NoteLayer; type: 'noteLayer' };

function parseViewerMessage(value: string): ViewerMessage | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || typeof parsed.type !== 'string') return null;
    if (parsed.type === 'ready') return { type: 'ready' };
    if (parsed.type === 'zoom' && typeof parsed.zoom === 'number') {
      return { type: 'zoom', zoom: parsed.zoom };
    }
    if (parsed.type === 'tap') {
      return {
        page: typeof parsed.page === 'number' ? parsed.page : null,
        type: 'tap',
      };
    }
    if (parsed.type === 'page' && typeof parsed.page === 'number') {
      return { page: parsed.page, type: 'page' };
    }
    if (parsed.type === 'diagnostic' && typeof parsed.message === 'string') {
      return { message: parsed.message, type: 'diagnostic' };
    }
    if (parsed.type === 'error' && typeof parsed.message === 'string') {
      return { message: parsed.message, type: 'error' };
    }
    if (parsed.type === 'noteLayer' && isNoteLayer(parsed.noteLayer)) {
      return { noteLayer: parsed.noteLayer, type: 'noteLayer' };
    }
    return null;
  } catch {
    return null;
  }
}

function isNoteLayer(value: unknown): value is NoteLayer {
  return (
    isRecord(value) &&
    typeof value.version === 'number' &&
    Array.isArray(value.strokes) &&
    value.strokes.every(isAnnotationStroke) &&
    Array.isArray(value.texts)
  );
}

function isAnnotationStroke(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== 'string' ||
    typeof value.color !== 'string' ||
    typeof value.opacity !== 'number' ||
    typeof value.width !== 'number' ||
    (value.page !== undefined && typeof value.page !== 'number') ||
    (value.tool !== 'pen' && value.tool !== 'highlighter') ||
    !Array.isArray(value.points)
  ) {
    return false;
  }
  return value.points.every(
    (point) =>
      isRecord(point) &&
      typeof point.x === 'number' &&
      typeof point.y === 'number' &&
      typeof point.pressure === 'number',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  webView: { backgroundColor: '#272927', flex: 1 },
  center: { flex: 1 },
  error: { color: '#E9897E', padding: 24, textAlign: 'center' },
});
