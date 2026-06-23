import * as AppleAuthentication from 'expo-apple-authentication';
import {
  CryptoDigestAlgorithm,
  digestStringAsync,
  randomUUID,
} from 'expo-crypto';
import {
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { NativeModules } from 'react-native';

import { firebaseAuth } from '../../../config/firebase';

export async function signInWithGoogle(): Promise<void> {
  if (!NativeModules.RNGoogleSignin) {
    throw new Error(
      'Google 로그인은 Expo Go에서 지원되지 않습니다. MuList Development Build에서 실행해 주세요.',
    );
  }
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId)
    throw new Error('Google OAuth Web Client ID가 설정되지 않았습니다.');
  const { GoogleSignin } =
    await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;
  if (!idToken) throw new Error('Google ID Token을 받지 못했습니다.');
  await signInWithCredential(
    firebaseAuth,
    GoogleAuthProvider.credential(idToken),
  );
}

export async function signInWithApple(): Promise<void> {
  const rawNonce = randomUUID();
  const nonce = await digestStringAsync(CryptoDigestAlgorithm.SHA256, rawNonce);
  const credential = await AppleAuthentication.signInAsync({
    nonce,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken)
    throw new Error('Apple ID Token을 받지 못했습니다.');
  const provider = new OAuthProvider('apple.com');
  await signInWithCredential(
    firebaseAuth,
    provider.credential({ idToken: credential.identityToken, rawNonce }),
  );
}
