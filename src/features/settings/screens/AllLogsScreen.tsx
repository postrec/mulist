import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getRepositories } from '../../../storage';
import type { AppLogEntry } from '../../../storage/repositories/LogRepository';
import { reportError } from '../../../shared/logging/reportError';
import { colors } from '../../../shared/theme/colors';

export function AllLogsScreen() {
  const [logs, setLogs] = useState<readonly AppLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { logs: repository } = await getRepositories();
      setLogs(await repository.findRecent());
    } catch (reason: unknown) {
      reportError('전체 로그 불러오기 실패', reason);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clear = async () => {
    try {
      const { logs: repository } = await getRepositories();
      await repository.clear();
      setLogs([]);
    } catch (reason: unknown) {
      reportError('전체 로그 삭제 실패', reason);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.summary}>
          {loading ? '불러오는 중…' : `최근 로그 ${logs.length}개`}
        </Text>
        <Pressable onPress={() => void load()} style={styles.button}>
          <Text style={styles.buttonLabel}>새로고침</Text>
        </Pressable>
        <Pressable onPress={() => void clear()} style={styles.button}>
          <Text style={styles.deleteLabel}>모두 지우기</Text>
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={logs}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.empty}>저장된 로그가 없습니다.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.logRow}>
            <View style={styles.logHeader}>
              <Text style={[styles.level, levelStyle(item.level)]}>
                {item.level.toUpperCase()}
              </Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text selectable style={styles.message}>
              {item.message}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function levelStyle(level: AppLogEntry['level']) {
  if (level === 'error') return styles.error;
  if (level === 'warning') return styles.warning;
  return styles.info;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  summary: { color: colors.muted, flex: 1, fontSize: 13 },
  button: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  buttonLabel: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  deleteLabel: { color: '#B23B31', fontSize: 12, fontWeight: '700' },
  list: { gap: 8, padding: 20 },
  logRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  logHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  level: { fontSize: 10, fontWeight: '900' },
  info: { color: colors.primary },
  warning: { color: '#B87B12' },
  error: { color: '#B23B31' },
  date: { color: colors.muted, fontSize: 10 },
  message: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 5 },
  empty: { color: colors.muted, padding: 40, textAlign: 'center' },
});
