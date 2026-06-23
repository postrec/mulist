import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import {
  Alert,
  type LayoutChangeEvent,
  type PointerEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type {
  AnnotationPoint,
  AnnotationStroke,
  NoteLayer,
  StrokeTool,
} from '../../../domain/models';

export type AnnotationTool = StrokeTool | 'eraser' | 'text';

interface AnnotationCanvasProps {
  inputEnabled?: boolean;
  noteLayer: NoteLayer;
  onChange: (noteLayer: NoteLayer) => void;
  tool: AnnotationTool;
}

interface CanvasSize {
  height: number;
  width: number;
}

export function AnnotationCanvas({
  inputEnabled = true,
  noteLayer,
  onChange,
  tool,
}: AnnotationCanvasProps) {
  const [size, setSize] = useState<CanvasSize>({ height: 1, width: 1 });
  const [activeStroke, setActiveStroke] = useState<AnnotationStroke | null>(
    null,
  );
  const activePointer = useRef<number | null>(null);
  const pencilActive = useRef(false);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setSize({ height, width });
  };

  const handlePointerDown = (event: PointerEvent) => {
    const isPencil = event.nativeEvent.pointerType === 'pen';
    if (pencilActive.current && !isPencil) return;
    activePointer.current = event.nativeEvent.pointerId;
    pencilActive.current = isPencil;
    const point = toPoint(event, size);
    if (tool === 'eraser') {
      eraseAt(point, noteLayer, onChange);
      return;
    }
    if (tool === 'text') {
      promptForText(point, noteLayer, onChange);
      return;
    }
    setActiveStroke({
      color: tool === 'highlighter' ? '#FFE066' : '#C62828',
      id: randomUUID(),
      opacity: tool === 'highlighter' ? 0.35 : 1,
      points: [point],
      tool,
      width:
        tool === 'highlighter' ? 18 : pressureWidth(point.pressure, isPencil),
    });
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.nativeEvent.pointerId !== activePointer.current) return;
    const point = toPoint(event, size);
    setActiveStroke((stroke) =>
      stroke
        ? {
            ...stroke,
            points: appendPoint(stroke.points, point),
            width:
              stroke.tool === 'pen'
                ? stroke.width * 0.8 + pressureWidth(point.pressure, true) * 0.2
                : stroke.width,
          }
        : null,
    );
  };

  const handlePointerUp = () => {
    setActiveStroke((stroke) => {
      if (stroke)
        onChange({ ...noteLayer, strokes: [...noteLayer.strokes, stroke] });
      return null;
    });
    activePointer.current = null;
    pencilActive.current = false;
  };

  const strokes = activeStroke
    ? [...noteLayer.strokes, activeStroke]
    : noteLayer.strokes;

  return (
    <View
      onLayout={handleLayout}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerCancel={handlePointerUp}
      onPointerUp={handlePointerUp}
      pointerEvents={inputEnabled ? 'auto' : 'none'}
      style={styles.canvas}
    >
      <Svg height="100%" pointerEvents="none" width="100%">
        {strokes.map((stroke) => (
          <Path
            d={toPath(stroke.points, size)}
            fill="none"
            key={stroke.id}
            opacity={stroke.opacity}
            stroke={stroke.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={stroke.width}
          />
        ))}
      </Svg>
      {noteLayer.texts.map((note) => (
        <Text
          key={note.id}
          style={[
            styles.textNote,
            {
              color: note.color,
              left: note.x * size.width,
              top: note.y * size.height,
            },
          ]}
        >
          {note.text}
        </Text>
      ))}
    </View>
  );
}

function toPoint(event: PointerEvent, size: CanvasSize): AnnotationPoint {
  return {
    pressure: event.nativeEvent.pressure || 1,
    x: event.nativeEvent.offsetX / size.width,
    y: event.nativeEvent.offsetY / size.height,
  };
}

function pressureWidth(pressure: number, isPencil: boolean): number {
  if (!isPencil) return 3;
  return 1.5 + Math.max(0.05, Math.min(1, pressure)) * 4.5;
}

function appendPoint(
  points: readonly AnnotationPoint[],
  point: AnnotationPoint,
): readonly AnnotationPoint[] {
  const previous = points.at(-1);
  if (
    previous &&
    Math.hypot(previous.x - point.x, previous.y - point.y) < 0.001
  ) {
    return points;
  }
  return [...points, point];
}

function toPath(points: readonly AnnotationPoint[], size: CanvasSize): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  if (points.length === 1)
    return `M ${first.x * size.width} ${first.y * size.height}`;
  const commands = [`M ${first.x * size.width} ${first.y * size.height}`];
  for (let index = 1; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[index + 1] ?? current;
    commands.push(
      `Q ${current.x * size.width} ${current.y * size.height} ${((current.x + next.x) / 2) * size.width} ${((current.y + next.y) / 2) * size.height}`,
    );
  }
  return commands.join(' ');
}

function eraseAt(
  point: AnnotationPoint,
  layer: NoteLayer,
  onChange: (layer: NoteLayer) => void,
) {
  const strokes = layer.strokes.filter(
    (stroke) =>
      !stroke.points.some(
        (item) => Math.hypot(item.x - point.x, item.y - point.y) < 0.035,
      ),
  );
  onChange({ ...layer, strokes });
}

function promptForText(
  point: AnnotationPoint,
  layer: NoteLayer,
  onChange: (layer: NoteLayer) => void,
) {
  Alert.prompt('텍스트 메모', undefined, (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange({
      ...layer,
      texts: [
        ...layer.texts,
        {
          color: '#1C211D',
          id: randomUUID(),
          text: trimmed,
          x: point.x,
          y: point.y,
        },
      ],
    });
  });
}

const styles = StyleSheet.create({
  canvas: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  textNote: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 4,
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 240,
    padding: 4,
    position: 'absolute',
  },
});
