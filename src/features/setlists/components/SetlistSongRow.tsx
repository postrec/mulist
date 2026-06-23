import { useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';

const ROW_HEIGHT = 62;

interface SetlistSongRowProps {
  count: number;
  editing: boolean;
  index: number;
  onMoveTo: (from: number, to: number) => void;
  onPress: () => void;
  selected: boolean;
  song: Song;
}

export function SetlistSongRow(props: SetlistSongRowProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          props.editing && Math.abs(gesture.dy) > 3,
        onPanResponderGrant: () => translateY.setValue(0),
        onPanResponderMove: (_event, gesture) =>
          translateY.setValue(gesture.dy),
        onPanResponderRelease: (_event, gesture) => {
          const offset = Math.round(gesture.dy / ROW_HEIGHT);
          const destination = Math.max(
            0,
            Math.min(props.count - 1, props.index + offset),
          );
          Animated.spring(translateY, {
            friction: 8,
            toValue: 0,
            useNativeDriver: true,
          }).start();
          if (destination !== props.index)
            props.onMoveTo(props.index, destination);
        },
        onPanResponderTerminate: () =>
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start(),
      }),
    [props, translateY],
  );

  return (
    <Animated.View
      style={[
        styles.row,
        props.selected && styles.selectedRow,
        { transform: [{ translateY }] },
      ]}
    >
      <Pressable onPress={props.onPress} style={styles.selection}>
        <Text style={styles.order}>{props.index + 1}</Text>
        <View style={styles.songInfo}>
          <Text numberOfLines={1} style={styles.title}>
            {props.song.title}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {props.song.artist}
          </Text>
        </View>
      </Pressable>
      {props.editing ? (
        <>
          <Arrow
            disabled={props.index === 0}
            label="↑"
            onPress={() => props.onMoveTo(props.index, props.index - 1)}
          />
          <Arrow
            disabled={props.index === props.count - 1}
            label="↓"
            onPress={() => props.onMoveTo(props.index, props.index + 1)}
          />
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <Text style={styles.dragLabel}>≡</Text>
          </View>
        </>
      ) : null}
    </Animated.View>
  );
}

function Arrow({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, disabled && styles.disabled]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 7,
    minHeight: ROW_HEIGHT,
    padding: 8,
    zIndex: 1,
  },
  selectedRow: { backgroundColor: colors.primarySoft },
  selection: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  order: { color: colors.muted, fontWeight: '700', width: 28 },
  songInfo: { flex: 1 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  arrow: { padding: 7 },
  arrowText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.25 },
  dragHandle: { paddingHorizontal: 8, paddingVertical: 10 },
  dragLabel: { color: colors.muted, fontSize: 21, fontWeight: '800' },
});
