import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/theme/colors';
import type { SelectedImageAsset } from '../services/importPdfFiles';

interface ImageOrderModalProps {
  assets: readonly SelectedImageAsset[];
  importing: boolean;
  onCancel: () => void;
  onConfirm: (assets: readonly SelectedImageAsset[]) => void;
  visible: boolean;
}

export function ImageOrderModal({
  assets,
  importing,
  onCancel,
  onConfirm,
  visible,
}: ImageOrderModalProps) {
  const [ordered, setOrdered] = useState<readonly SelectedImageAsset[]>(assets);

  useEffect(() => {
    if (visible) setOrdered(assets);
  }, [assets, visible]);

  const move = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (destination < 0 || destination >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[destination]] = [next[destination]!, next[index]!];
    setOrdered(next);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>이미지 페이지 순서</Text>
          <Text style={styles.description}>
            위에서부터 PDF의 첫 페이지가 됩니다. {ordered.length}장
          </Text>
          <FlatList
            contentContainerStyle={styles.list}
            data={ordered}
            keyExtractor={(asset, index) =>
              `${asset.assetId ?? asset.uri}-${index}`
            }
            renderItem={({ index, item }) => (
              <View style={styles.row}>
                <Text style={styles.index}>{index + 1}</Text>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <Text numberOfLines={1} style={styles.name}>
                  {item.fileName ?? `이미지 ${index + 1}`}
                </Text>
                <Pressable
                  accessibilityLabel="앞 페이지로 이동"
                  disabled={index === 0 || importing}
                  onPress={() => move(index, -1)}
                  style={styles.moveButton}
                >
                  <Text style={styles.moveLabel}>↑</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="뒤 페이지로 이동"
                  disabled={index === ordered.length - 1 || importing}
                  onPress={() => move(index, 1)}
                  style={styles.moveButton}
                >
                  <Text style={styles.moveLabel}>↓</Text>
                </Pressable>
              </View>
            )}
            style={styles.flatList}
          />
          <View style={styles.actions}>
            <Pressable
              disabled={importing}
              onPress={onCancel}
              style={styles.secondary}
            >
              <Text style={styles.secondaryLabel}>취소</Text>
            </Pressable>
            <Pressable
              disabled={importing}
              onPress={() => onConfirm(ordered)}
              style={styles.primary}
            >
              <Text style={styles.primaryLabel}>
                {importing ? 'PDF 만드는 중…' : '이 순서로 PDF 만들기'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxHeight: '86%',
    maxWidth: 680,
    padding: 20,
    width: '100%',
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, marginTop: 5 },
  flatList: { marginVertical: 16 },
  list: { gap: 8 },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  index: { color: colors.muted, fontSize: 13, textAlign: 'center', width: 24 },
  thumbnail: {
    backgroundColor: colors.background,
    borderRadius: 5,
    height: 58,
    width: 44,
  },
  name: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' },
  moveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    width: 38,
  },
  moveLabel: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  secondary: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryLabel: { color: colors.muted, fontWeight: '700' },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryLabel: { color: colors.surface, fontWeight: '800' },
});
