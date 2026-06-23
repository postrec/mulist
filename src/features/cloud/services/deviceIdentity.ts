import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const KEY = 'mulist.cloud.device-id';

export async function getDeviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(KEY);
  if (saved) return saved;
  const id = randomUUID();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
