import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type ConfirmationResult,
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
import type { UserRole } from '../types/madrasa';
import { canManageWebsiteCms } from '../utils/websiteCmsLogic';

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

export const ALLOWED_CMS_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
];

export const MAX_CMS_MEDIA_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadCmsMediaAsset(
  file: Blob,
  safeFileName: string
): Promise<{
  ok: boolean;
  url?: string;
  errorBn?: string;
  errorEn?: string;
}> {
  if (!auth.currentUser) {
    return {
      ok: false,
      errorBn:
        'Firebase Storage-এ ফাইল আপলোড করতে অনুমোদিত সুপার অ্যাডমিন বা মুহতামিম হিসেবে Firebase Auth-এ সাইন ইন করা আবশ্যক। বিকল্প হিসেবে অনুমোদিত HTTPS ইমেজ URL ব্যবহার করুন।',
      errorEn:
        'You must be signed in with Firebase Auth as Super Admin or Muhtamim to upload files to Firebase Storage. Alternatively, paste an approved HTTPS image URL.',
    };
  }

  // 1. File size validation (max 5 MB)
  if (file.size > MAX_CMS_MEDIA_FILE_SIZE_BYTES) {
    return {
      ok: false,
      errorBn: 'ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইট (5 MB) হতে পারে।',
      errorEn: 'File size must not exceed 5 MB.',
    };
  }

  // 2. MIME type validation
  const normalizedType = (file.type || '').trim().toLowerCase();
  if (normalizedType && !ALLOWED_CMS_MEDIA_MIME_TYPES.includes(normalizedType)) {
    return {
      ok: false,
      errorBn:
        'শুধুমাত্র অনুমোদিত ইমেজ (JPEG, PNG, WebP, SVG, GIF) বা পিডিএফ ফাইল আপলোড করা যাবে।',
      errorEn:
        'Only allowed image types (JPEG, PNG, WebP, SVG, GIF) or PDF files may be uploaded.',
    };
  }

  // 3. Trusted authorization check: verified session + Firestore role lookup
  const user = auth.currentUser;
  let isAuthorized = false;

  if (isBootstrapSuperAdminEmail(user.email)) {
    isAuthorized = true;
  } else {
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const userRole = userSnap.data()?.role as UserRole | undefined;
        if (userRole && canManageWebsiteCms(userRole)) {
          isAuthorized = true;
        }
      }
    } catch {
      isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    return {
      ok: false,
      errorBn:
        'অননুমোদিত অনুরোধ। শুধুমাত্র সুপার অ্যাডমিন বা মুহতামিম ওয়েবসাইট মিডিয়া আপলোড করতে পারবেন।',
      errorEn:
        'Unauthorized. Only Super Admin or Muhtamim roles are permitted to upload website media assets.',
    };
  }

  try {
    const storagePath = `website-cms/${user.uid}/${Date.now()}-${safeFileName}`;
    const mediaRef = ref(storage, storagePath);
    const uploadTask = uploadBytes(mediaRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 5000)
    );
    await Promise.race([uploadTask, timeoutPromise]);
    const downloadUrl = await getDownloadURL(mediaRef);
    return {
      ok: true,
      url: downloadUrl,
    };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      errorBn: `Firebase Storage আপলোড সম্পন্ন হয়নি (${rawMsg})। বিনা অনুমতিতে বড় Base64 ছবি Firestore-এ সংরক্ষণ করা নিষিদ্ধ—অনুগ্রহ করে অনুমোদিত HTTPS ইমেজ URL প্রদান করুন।`,
      errorEn: `Firebase Storage upload did not complete (${rawMsg}). Storing large raw Base64 images in Firestore is blocked—please provide an approved HTTPS image URL.`,
    };
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

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function clearRecaptchaVerifier(): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // ignore cleanup error
    }
    activeRecaptchaVerifier = null;
  }
}

/**
 * Initiates Firebase Phone Authentication SMS OTP to a Bangladesh (+8801XXXXXXXXX) phone number.
 * Uses invisible reCAPTCHA attached to `containerId`. Never stores OTP values in Firestore.
 */
export async function sendGuardianPhoneOtp(
  phoneNumberE164: string,
  containerId = 'uqcm-recaptcha-container'
): Promise<ConfirmationResult> {
  clearRecaptchaVerifier();
  activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  return signInWithPhoneNumber(auth, phoneNumberE164.trim(), activeRecaptchaVerifier);
}

export async function confirmGuardianPhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
) {
  return confirmationResult.confirm(otpCode.trim());
}

/**
 * Sends a Firebase Email Verification link to the currently signed-in guardian account.
 */
export async function sendGuardianVerificationEmail(targetUser?: User | null): Promise<void> {
  const user = targetUser || auth.currentUser;
  if (!user) {
    throw new Error('NO_ACTIVE_AUTH_USER');
  }
  await sendEmailVerification(user);
}

/**
 * Reloads the Firebase Auth user state from the server and checks whether `emailVerified` is true.
 * Never marks an account verified purely by visiting a URL without checking Firebase's verified status.
 */
export async function reloadAndCheckEmailVerified(targetUser?: User | null): Promise<boolean> {
  const user = targetUser || auth.currentUser;
  if (!user) return false;
  await reload(user);
  return Boolean(user.emailVerified);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export { serverTimestamp, type ConfirmationResult };


