import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { firebaseAuth } from '../../../config/firebase';

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<void> {
  validateCredentials(email, password);
  await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim().toLowerCase(),
    password,
  );
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  validateCredentials(email, password);
  await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim().toLowerCase(),
    password,
  );
}

function validateCredentials(email: string, password: string): void {
  if (!email.trim() || !email.includes('@')) {
    throw new Error('올바른 이메일 주소를 입력해 주세요.');
  }
  if (password.length < 6) {
    throw new Error('비밀번호는 6자 이상 입력해 주세요.');
  }
}
