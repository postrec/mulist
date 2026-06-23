import { useEffect, useMemo, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors } from '../../../shared/theme/colors';
import { reportInfo } from '../../../shared/logging/reportError';
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
  onPageCountChange?: (pageCount: number) => void;
  onTap: (page: number | null) => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  pencilSmoothing?: number;
  preloadOnly?: boolean;
  previewScale?: number;
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
  onPageCountChange,
  onTap,
  onPageChange,
  onZoomChange,
  pencilSmoothing = 2,
  preloadOnly = false,
  previewScale = 0.35,
  zoom,
}: PdfJsViewerProps) {
  const webView = useRef<WebView>(null);
  const nativeStartedAt = useRef(Date.now());
  const timings = useRef<string[]>([]);
  const webViewLoadStartedAt = useRef<number | null>(null);
  const lastViewerZoom = useRef<number | null>(null);
  const initialLayout = useRef(layout).current;
  const initialNavigationMode = useRef(navigationMode).current;
  const restoredPage = useRef(initialPage).current;
  const initialZoom = useRef(zoom).current;
  const initialNoteLayer = useRef(noteLayer).current;
  const initialDrawingColor = useRef(drawingColor).current;
  const initialDrawingWidth = useRef(drawingWidth).current;
  const initialPencilSmoothing = useRef(pencilSmoothing).current;
  const initialPreloadOnly = useRef(preloadOnly).current;
  const initialPreviewScale = useRef(previewScale).current;
  const wasPreloadOnly = useRef(preloadOnly);
  const [assets, setAssets] = useState<PdfJsAssetUris | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const profileLabel = `${initialPreloadOnly ? 'PRELOAD' : 'ACTIVE'} ${fileUri.split('/').at(-2) ?? fileUri}`;

  const recordTiming = (stage: string, durationMs: number, detail?: string) => {
    timings.current.push(
      `${stage}=${durationMs.toFixed(1)}ms${detail ? ` · ${detail}` : ''}`,
    );
  };

  const flushTimings = () => {
    if (timings.current.length === 0) return;
    reportInfo(
      `[PDF 성능][${profileLabel}]\n${timings.current
        .map((timing) => `- ${timing}`)
        .join('\n')}`,
    );
    timings.current = [];
  };

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    void preparePdfJsAssets()
      .then((prepared) => {
        if (active) {
          recordTiming('native_assets_prepare', Date.now() - startedAt);
          setAssets(prepared);
        }
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
    const startedAt = Date.now();
    setPdfBase64(null);
    void FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
      .then((data) => {
        if (active) {
          recordTiming(
            'native_pdf_base64_read',
            Date.now() - startedAt,
            `base64Chars=${data.length}`,
          );
          setPdfBase64(data);
        }
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

  const html = useMemo(() => {
    if (!assets || !pdfBase64) return null;
    const startedAt = Date.now();
    const value = createPdfJsHtml({
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
      initialPreloadOnly,
      initialPreviewScale,
      pdfBase64,
    });
    recordTiming('native_html_build', Date.now() - startedAt);
    return value;
  }, [
    assets,
    fileUri,
    initialLayout,
    initialNavigationMode,
    initialZoom,
    initialNoteLayer,
    initialDrawingColor,
    initialDrawingWidth,
    initialPencilSmoothing,
    initialPreloadOnly,
    initialPreviewScale,
    pdfBase64,
    restoredPage,
  ]);

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
      `window.mulistPdf.setPreviewScale(${previewScale});true;`,
    );
  }, [isReady, previewScale]);

  useEffect(() => {
    if (!isReady) return;
    webView.current?.injectJavaScript(
      `window.mulistPdf.setPreloadOnly(${preloadOnly});true;`,
    );
  }, [isReady, preloadOnly]);

  useEffect(() => {
    if (!isReady) return;
    if (wasPreloadOnly.current && !preloadOnly) {
      webView.current?.injectJavaScript(
        `window.mulistPdf.scrollToPage(${initialPage});true;`,
      );
    }
    wasPreloadOnly.current = preloadOnly;
  }, [initialPage, isReady, preloadOnly]);

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
      onPageCountChange?.(message.pageCount);
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
    } else if (message.type === 'performance') {
      recordTiming(message.stage, message.durationMs, message.detail);
      if (message.stage === 'viewer_total_ready') {
        recordTiming(
          'native_total_to_first_render',
          Date.now() - nativeStartedAt.current,
        );
        flushTimings();
      }
    } else {
      setError(message.message);
      recordTiming('viewer_error', 0, message.message);
      flushTimings();
    }
  };

  if (error)
    return preloadOnly ? (
      <View style={styles.preloadContainer} />
    ) : (
      <Text style={styles.error}>{error}</Text>
    );
  if (!assets || !pdfBase64 || !html) {
    return preloadOnly ? (
      <View style={styles.preloadContainer} />
    ) : (
      <ActivityIndicator color={colors.primary} style={styles.center} />
    );
  }
  return (
    <View
      pointerEvents={preloadOnly ? 'none' : 'auto'}
      style={preloadOnly ? styles.preloadContainer : styles.container}
    >
      <WebView
        allowFileAccess
        allowingReadAccessToURL={assets.readAccessUri}
        javaScriptEnabled
        onLoadEnd={() => {
          if (webViewLoadStartedAt.current !== null) {
            recordTiming(
              'native_webview_load',
              Date.now() - webViewLoadStartedAt.current,
            );
            webViewLoadStartedAt.current = null;
          }
        }}
        onLoadStart={() => {
          webViewLoadStartedAt.current = Date.now();
        }}
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
  | { pageCount: number; type: 'ready' }
  | { type: 'zoom'; zoom: number }
  | { page: number | null; type: 'tap' }
  | { page: number; type: 'page' }
  | { message: string; type: 'diagnostic' }
  | { message: string; type: 'error' }
  | {
      detail?: string;
      durationMs: number;
      stage: string;
      type: 'performance';
    }
  | { noteLayer: NoteLayer; type: 'noteLayer' };

function parseViewerMessage(value: string): ViewerMessage | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || typeof parsed.type !== 'string') return null;
    if (parsed.type === 'ready' && typeof parsed.pageCount === 'number') {
      return { pageCount: parsed.pageCount, type: 'ready' };
    }
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
    if (
      parsed.type === 'performance' &&
      typeof parsed.stage === 'string' &&
      typeof parsed.durationMs === 'number'
    ) {
      return {
        detail: typeof parsed.detail === 'string' ? parsed.detail : undefined,
        durationMs: parsed.durationMs,
        stage: parsed.stage,
        type: 'performance',
      };
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
  preloadContainer: {
    height: 2,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 2,
  },
  webView: { backgroundColor: '#272927', flex: 1 },
  center: { flex: 1 },
  error: { color: '#E9897E', padding: 24, textAlign: 'center' },
});
