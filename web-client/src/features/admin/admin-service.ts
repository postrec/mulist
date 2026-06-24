import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase';

export interface AdminUser {
  createdAt: string;
  disabled: boolean;
  displayName: string | null;
  email: string | null;
  lastSignInAt: string;
  uid: string;
}

export interface AdminMetrics {
  firestoreSetlists: number;
  firestoreSongs: number;
  storageBytes: number;
  storageFiles: number;
  users: number;
}

export interface AdminDashboardData {
  auditLogs: Array<{
    action: string;
    actorEmail: string;
    createdAt: unknown;
    id: string;
    target: string;
  }>;
  catalog: { artists?: unknown[]; tags?: unknown[] };
  metrics: AdminMetrics;
  users: AdminUser[];
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const result = await httpsCallable<void, AdminDashboardData>(
    functions,
    'adminGetDashboard',
  )();
  return result.data;
}

export async function setAdminUserDisabled(
  uid: string,
  disabled: boolean,
): Promise<void> {
  await httpsCallable(functions, 'adminSetUserDisabled')({ uid, disabled });
}

export async function saveNormalizationCatalog(
  tags: unknown[],
  artists: unknown[],
): Promise<void> {
  await httpsCallable(
    functions,
    'adminSaveNormalizationCatalog',
  )({
    artists,
    tags,
  });
}
