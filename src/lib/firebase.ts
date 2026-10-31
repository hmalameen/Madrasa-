import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  initializeFirestore,
  serverTimestamp,
  setLogLevel,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Silence internal @firebase/firestore SDK retry logs so transient network or token refresh retries do not emit console.error overlays
setLogLevel('silent');

// Enable automatic long-polling detection so Firestore connects reliably across proxies and slow networks
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'hmalameenemob@gmail.com';
export const BOOTSTRAP_SUPER_ADMIN_EMAILS = [
  'hmalameenemob@gmail.com',
  'alamin.emob@gmail.com',
];

export function isBootstrapSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAP_SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function uploadStudentPhotoAsset(
  blob: Blob,
  safeFileName: string,
  fallbackDataUrl: string
): Promise<string> {
  try {
    if (!auth.currentUser) {
      return fallbackDataUrl;
    }
    const storagePath = `student-photos/${ auth.currentUser.uid }/${ Date.now() }-${ safeFileName }`;
    const photoRef = ref(storage, storagePath);
    const uploadTask = uploadBytes(photoRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 4500)
    );
    await Promise.race([uploadTask, timeoutPromise]);
    const downloadUrl = await getDownloadURL(photoRef);
    return downloadUrl || fallbackDataUrl;
  } catch {
    // When Firebase Storage bucket is not provisioned or offline, safely store compressed portrait data URL (validated <= 75KB in Firestore rules)
    return fallbackDataUrl;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: boolean | string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isTransientOrTokenError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes('client is offline') ||
    msg.includes('unavailable') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('network-request-failed') ||
    msg.includes('token-service-api-has-not-been-used') ||
    msg.includes('fetching auth token failed')
  );
}

/**
 * Verifies that a cached Firebase Auth user session can obtain a valid ID token.
 * If the project's Token Service API (securetoken.googleapis.com) is disabled or the
 * cached token cannot be refreshed, signs out the stale session so Firestore does not
 * get stuck failing on every request.
 */
export async function verifyOrClearAuthSession(user: User): Promise<boolean> {
  try {
    await user.getIdToken(false);
    return true;
  } catch (err) {
    console.warn(
      'Clearing cached Firebase Auth session because ID token refresh failed:',
      err instanceof Error ? err.message : String(err)
    );
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore sign-out cleanup errors
    }
    return false;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  if (isTransientOrTokenError(error)) {
    console.warn(`Firestore operating in local/offline fallback mode for ${operationType} on ${path}.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDoc(doc(db, 'settings', 'default-settings'));
    return true;
  } catch (error) {
    if (isTransientOrTokenError(error)) {
      return false;
    }
    return true;
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }
  return credential;
}

export async function requestPasswordResetEmail(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export { serverTimestamp };

