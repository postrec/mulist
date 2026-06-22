import { useEffect, useMemo, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors } from '../../../shared/theme/colors';
import { createPdfJsHtml } from '../services/createPdfJsHtml';
import {
  type PdfJsAssetUris,
  preparePdfJsAssets,
} from '../services/pdfJsAssets';
import type { PageLayout } from './ViewerControls';

interface PdfJsViewerProps {
  fileUri: string;
  layout: PageLayout;
  onZoomChange: (zoom: number) => void;
  zoom: number;
}

export function PdfJsViewer({
  fileUri,
  layout,
  onZoomChange,
  zoom,
}: PdfJsViewerProps) {
  const webView = useRef<WebView>(null);
  const lastViewerZoom = useRef<number | null>(null);
  const initialLayout = useRef(layout).current;
  const initialZoom = useRef(zoom).current;
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
            initialZoom,
            pdfBase64,
          })
        : null,
    [assets, fileUri, initialLayout, initialZoom, pdfBase64],
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

  const receiveMessage = (event: WebViewMessageEvent) => {
    const message = parseViewerMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'ready') {
      setIsReady(true);
    } else if (message.type === 'zoom') {
      lastViewerZoom.current = message.zoom;
      onZoomChange(message.zoom);
    } else if (message.type === 'diagnostic') {
      console.warn(message.message);
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
  | { message: string; type: 'diagnostic' }
  | { message: string; type: 'error' };

function parseViewerMessage(value: string): ViewerMessage | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || typeof parsed.type !== 'string') return null;
    if (parsed.type === 'ready') return { type: 'ready' };
    if (parsed.type === 'zoom' && typeof parsed.zoom === 'number') {
      return { type: 'zoom', zoom: parsed.zoom };
    }
    if (parsed.type === 'diagnostic' && typeof parsed.message === 'string') {
      return { message: parsed.message, type: 'diagnostic' };
    }
    if (parsed.type === 'error' && typeof parsed.message === 'string') {
      return { message: parsed.message, type: 'error' };
    }
    return null;
  } catch {
    return null;
  }
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
