export type OcrLanguage = 'ko' | 'en' | 'ja';

export interface AnnotationPoint {
  pressure: number;
  x: number;
  y: number;
}

export type StrokeTool = 'pen' | 'highlighter';

export interface AnnotationStroke {
  color: string;
  id: string;
  opacity: number;
  page?: number;
  points: readonly AnnotationPoint[];
  tool: StrokeTool;
  width: number;
}

export interface TextAnnotation {
  color: string;
  id: string;
  page?: number;
  text: string;
  x: number;
  y: number;
}

export interface NoteLayer {
  version: number;
  strokes: readonly AnnotationStroke[];
  texts: readonly TextAnnotation[];
}

export interface OcrData {
  text: string;
  languages: readonly OcrLanguage[];
}

export type ScorePageLayout = 'single' | 'two-page';
export type ScoreNavigationMode =
  | 'scroll'
  | 'snap'
  | 'snap-horizontal'
  | 'snap-horizontal-page';

export interface ScoreViewState {
  currentPage: number;
  layout: ScorePageLayout;
  navigationMode: ScoreNavigationMode;
}

export interface Score {
  contentHash: string | null;
  id: string;
  songId: string;
  pdfFile: string;
  noteLayer: NoteLayer | null;
  ocrData: OcrData | null;
  viewState: ScoreViewState;
}
