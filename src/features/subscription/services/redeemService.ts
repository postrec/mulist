import { httpsCallable } from 'firebase/functions';

import { firebaseAuth, firebaseFunctions } from '../../../config/firebase';

export async function redeemSubscriptionCode(code: string): Promise<void> {
  if (!firebaseAuth.currentUser) {
    throw new Error('리딤 코드를 사용하려면 먼저 로그인해 주세요.');
  }
  await httpsCallable<
    { code: string },
    { plan: 'premium'; status: 'already-redeemed' | 'redeemed' }
  >(
    firebaseFunctions,
    'redeemSubscriptionCode',
  )({ code });
}
