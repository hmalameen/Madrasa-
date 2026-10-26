import crypto from 'node:crypto';
import { cert, getApps, initializeApp, type App as AdminApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export const DEFAULT_FIREBASE_PROJECT_ID = 'amazing-haven-348x0';
export const DEFAULT_FIRESTORE_DATABASE_ID = 'ai-studio-1b55b05f-f4f5-4207-bc43-a2855e1a028e';
export const DEFAULT_ALLOWED_SUPER_ADMIN_EMAIL = 'hmalameenemob@gmail.com';

export interface FirebaseAdminConfigInspection {
  readyForAdminSdk: boolean;
  readyForBootstrapEndpoint: boolean;
  missingVariables: string[];
  invalidFormatVariables: { variable: string; reason: string }[];
  securityViolations: string[];
  normalizedConfig: {
    projectId: string;
    clientEmail: string;
    privateKeyPresent: boolean;
    privateKeyValidPem: boolean;
    bootstrapSecretPresent: boolean;
    bootstrapSecretStrong: boolean;
    firestoreDatabaseId: string;
    allowedOwnerEmail: string;
  };
}

/**
 * Normalizes a PEM private key read from environment variables (.env, Vercel, or AI Studio Secrets).
 * Handles surrounding quotes and converts escaped literal "\\n" sequences into real newlines ("\n").
 * Never logs or returns the raw private key in error messages.
 */
export function normalizePemPrivateKey(rawKey: string | undefined): string {
  if (!rawKey) return '';
  let cleaned = rawKey.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/\\n/g, '\n');
}

/**
 * Inspects server environment variables to verify whether Firebase Admin SDK and
 * the One-Time Super Admin Bootstrap endpoint have all required credentials.
 *
 * Explicitly verifies that SUPER_ADMIN_BOOTSTRAP_SECRET, FIREBASE_ADMIN_PROJECT_ID,
 * and FIREBASE_ADMIN_CLIENT_EMAIL alone are NOT sufficient without FIREBASE_ADMIN_PRIVATE_KEY.
 */
export function inspectFirebaseAdminEnv(
  env: Record<string, string | undefined> = process.env
): FirebaseAdminConfigInspection {
  const missingVariables: string[] = [];
  const invalidFormatVariables: { variable: string; reason: string }[] = [];
  const securityViolations: string[] = [];

  // 1. Ensure secrets are NEVER exposed in client-visible VITE_ variables
  if (env.VITE_SUPER_ADMIN_BOOTSTRAP_SECRET || env.VITE_SUPER_ADMIN_BOOTSTRAP_HINT) {
    securityViolations.push(
      'CRITICAL: Do not expose SUPER_ADMIN_BOOTSTRAP_SECRET with a VITE_ prefix. It must remain server-side only.'
    );
  }
  if (env.VITE_FIREBASE_ADMIN_PRIVATE_KEY) {
    securityViolations.push(
      'CRITICAL: Never expose FIREBASE_ADMIN_PRIVATE_KEY with a VITE_ prefix.'
    );
  }

  const projectId = (env.FIREBASE_ADMIN_PROJECT_ID || '').trim();
  const clientEmail = (env.FIREBASE_ADMIN_CLIENT_EMAIL || '').trim();
  const normalizedPrivateKey = normalizePemPrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY);
  const bootstrapSecret = (env.SUPER_ADMIN_BOOTSTRAP_SECRET || '').trim();
  const firestoreDatabaseId = (
    env.FIREBASE_FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID
  ).trim();
  const allowedOwnerEmail = (
    env.SUPER_ADMIN_ALLOWED_EMAIL || DEFAULT_ALLOWED_SUPER_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();

  // 2. Check required variables
  if (!projectId) {
    missingVariables.push('FIREBASE_ADMIN_PROJECT_ID');
  } else if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) {
    invalidFormatVariables.push({
      variable: 'FIREBASE_ADMIN_PROJECT_ID',
      reason: 'Must be a valid GCP/Firebase project ID (lowercase letters, digits, hyphens).',
    });
  }

  if (!clientEmail) {
    missingVariables.push('FIREBASE_ADMIN_CLIENT_EMAIL');
  } else if (
    !clientEmail.includes('@') ||
    !clientEmail.endsWith('.gserviceaccount.com')
  ) {
    invalidFormatVariables.push({
      variable: 'FIREBASE_ADMIN_CLIENT_EMAIL',
      reason:
        'Must be a service account email ending in .iam.gserviceaccount.com.',
    });
  }

  // CRITICAL CHECK: FIREBASE_ADMIN_PRIVATE_KEY is mandatory for cert() initialization
  const privateKeyPresent = Boolean(normalizedPrivateKey);
  const privateKeyValidPem =
    normalizedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') &&
    normalizedPrivateKey.includes('-----END PRIVATE KEY-----') &&
    normalizedPrivateKey.length > 200;

  if (!privateKeyPresent) {
    missingVariables.push('FIREBASE_ADMIN_PRIVATE_KEY');
  } else if (!privateKeyValidPem) {
    invalidFormatVariables.push({
      variable: 'FIREBASE_ADMIN_PRIVATE_KEY',
      reason:
        'Must be a valid PKCS#8 PEM string starting with "-----BEGIN PRIVATE KEY-----" and ending with "-----END PRIVATE KEY-----".',
    });
  }

  const bootstrapSecretPresent =
    Boolean(bootstrapSecret) &&
    bootstrapSecret !== 'SET_SERVER_SIDE_SECRET_IN_VERCEL_OR_CLOUD_FUNCTIONS';
  const bootstrapSecretStrong = bootstrapSecretPresent && bootstrapSecret.length >= 16;

  if (!bootstrapSecretPresent) {
    missingVariables.push('SUPER_ADMIN_BOOTSTRAP_SECRET');
  } else if (!bootstrapSecretStrong) {
    invalidFormatVariables.push({
      variable: 'SUPER_ADMIN_BOOTSTRAP_SECRET',
      reason: 'Must be a high-entropy secret of at least 16 characters.',
    });
  }

  const readyForAdminSdk =
    Boolean(projectId) &&
    Boolean(clientEmail) &&
    privateKeyValidPem &&
    invalidFormatVariables.filter((i) => i.variable !== 'SUPER_ADMIN_BOOTSTRAP_SECRET')
      .length === 0 &&
    securityViolations.length === 0;

  const readyForBootstrapEndpoint =
    readyForAdminSdk &&
    bootstrapSecretStrong &&
    missingVariables.length === 0 &&
    invalidFormatVariables.length === 0 &&
    securityViolations.length === 0;

  return {
    readyForAdminSdk,
    readyForBootstrapEndpoint,
    missingVariables,
    invalidFormatVariables,
    securityViolations,
    normalizedConfig: {
      projectId: projectId || DEFAULT_FIREBASE_PROJECT_ID,
      clientEmail,
      privateKeyPresent,
      privateKeyValidPem,
      bootstrapSecretPresent,
      bootstrapSecretStrong,
      firestoreDatabaseId,
      allowedOwnerEmail,
    },
  };
}

/**
 * Constant-time comparison of the one-time bootstrap secret to prevent timing attacks.
 */
export function verifyBootstrapSecretTimingSafe(
  providedSecret: string | undefined,
  expectedSecret: string | undefined
): boolean {
  const cleanProvided = (providedSecret || '').trim();
  const cleanExpected = (expectedSecret || '').trim();
  if (
    !cleanProvided ||
    !cleanExpected ||
    cleanExpected === 'SET_SERVER_SIDE_SECRET_IN_VERCEL_OR_CLOUD_FUNCTIONS' ||
    cleanExpected.length < 16
  ) {
    return false;
  }
  const bufA = Buffer.from(cleanProvided, 'utf8');
  const bufB = Buffer.from(cleanExpected, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function getOrInitializeAdminApp(env: Record<string, string | undefined> = process.env): AdminApp {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }
  const inspection = inspectFirebaseAdminEnv(env);
  if (!inspection.readyForAdminSdk) {
    throw new Error(
      `Firebase Admin SDK credentials incomplete. Missing: [${inspection.missingVariables.join(', ')}]`
    );
  }
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID!.trim(),
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL!.trim(),
      privateKey: normalizePemPrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY),
    }),
    projectId: env.FIREBASE_ADMIN_PROJECT_ID!.trim(),
  });
}

export interface ServerBootstrapRequestPayload {
  ownerEmail: string;
  displayName: string;
  phone: string;
  setupPassword?: string;
  setupToken?: string;
  idToken?: string;
}

export interface ServerBootstrapResponse {
  statusCode: number;
  body: {
    ok: boolean;
    code:
      | 'SUPER_ADMIN_PROVISIONED'
      | 'BOOTSTRAP_ALREADY_LOCKED'
      | 'ADMIN_SDK_CREDENTIALS_MISSING'
      | 'UNAUTHORIZED_BOOTSTRAP_SECRET'
      | 'UNAUTHORIZED_OWNER_IDENTITY'
      | 'INVALID_PAYLOAD'
      | 'INTERNAL_ERROR';
    messageBn: string;
    messageEn: string;
    missingCredentials?: string[];
    superAdminUid?: string;
    lockId?: 'super_admin_lock';
  };
}

/**
 * Trusted server-side execution of the One-Time Super Admin Bootstrap.
 *
 * Security Guarantees:
 * 1. Verifies all 4 server-side secrets (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 *    FIREBASE_ADMIN_PRIVATE_KEY, SUPER_ADMIN_BOOTSTRAP_SECRET).
 * 2. Verifies SUPER_ADMIN_BOOTSTRAP_SECRET via timingSafeEqual.
 * 3. Verifies owner email matches SUPER_ADMIN_ALLOWED_EMAIL.
 * 4. Runs an atomic Firestore transaction on /systemBootstrap/super_admin_lock and /users:
 *    if already provisioned, immediately rejects with HTTP 409 (making the endpoint permanently unusable after first run).
 */
export async function executeServerSuperAdminBootstrap(
  payload: ServerBootstrapRequestPayload,
  headerSecret?: string,
  bearerToken?: string,
  env: Record<string, string | undefined> = process.env
): Promise<ServerBootstrapResponse> {
  const inspection = inspectFirebaseAdminEnv(env);

  if (!inspection.readyForBootstrapEndpoint) {
    return {
      statusCode: 503,
      body: {
        ok: false,
        code: 'ADMIN_SDK_CREDENTIALS_MISSING',
        messageBn: `সার্ভার-সাইড Firebase Admin SDK ক্রেডেনশিয়াল সম্পূর্ণ নয়। অনুপস্থিত ভেরিয়েবল: ${inspection.missingVariables.join(', ')}`,
        messageEn: `Server-side Firebase Admin SDK credentials incomplete. Missing variables: ${inspection.missingVariables.join(', ')}`,
        missingCredentials: inspection.missingVariables,
      },
    };
  }

  const providedSecret = (headerSecret || payload.setupToken || '').trim();
  const secretValid = verifyBootstrapSecretTimingSafe(
    providedSecret,
    env.SUPER_ADMIN_BOOTSTRAP_SECRET
  );

  if (!secretValid) {
    return {
      statusCode: 403,
      body: {
        ok: false,
        code: 'UNAUTHORIZED_BOOTSTRAP_SECRET',
        messageBn:
          'অননুমোদিত বুটস্ট্র্যাপ প্রচেষ্টা: সার্ভার-সাইড SUPER_ADMIN_BOOTSTRAP_SECRET টোকেন সঠিক নয়।',
        messageEn:
          'Unauthorized bootstrap attempt: invalid SUPER_ADMIN_BOOTSTRAP_SECRET.',
      },
    };
  }

  const cleanEmail = (payload.ownerEmail || '').trim().toLowerCase();
  const cleanName = (payload.displayName || '').trim();
  const cleanPhone = (payload.phone || '01711-000000').trim();

  if (!cleanEmail || !cleanEmail.includes('@') || cleanName.length < 2) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        code: 'INVALID_PAYLOAD',
        messageBn: 'সুপার অ্যাডমিনের বৈধ ইমেইল এবং পূর্ণ নাম প্রদান করা আবশ্যক।',
        messageEn: 'Valid Super Admin email and full name are required.',
      },
    };
  }

  if (cleanEmail !== inspection.normalizedConfig.allowedOwnerEmail) {
    return {
      statusCode: 403,
      body: {
        ok: false,
        code: 'UNAUTHORIZED_OWNER_IDENTITY',
        messageBn:
          'শুধুমাত্র নির্ধারিত প্রতিষ্ঠান মালিকের ইমেইল দিয়ে প্রথমবার সুপার অ্যাডমিন বুটস্ট্র্যাপ করা যাবে।',
        messageEn:
          'Only the designated institutional owner email is permitted to bootstrap Super Admin.',
      },
    };
  }

  try {
    const adminApp = getOrInitializeAdminApp(env);
    const adminAuth = getAuth(adminApp);
    const adminDb = getFirestore(
      adminApp,
      inspection.normalizedConfig.firestoreDatabaseId
    );

    // Pre-check lock before touching Firebase Auth
    const lockRef = adminDb.collection('systemBootstrap').doc('super_admin_lock');
    const existingLockSnap = await lockRef.get();
    if (existingLockSnap.exists && existingLockSnap.data()?.isProvisioned === true) {
      return {
        statusCode: 409,
        body: {
          ok: false,
          code: 'BOOTSTRAP_ALREADY_LOCKED',
          messageBn:
            'সুপার অ্যাডমিন ইতিমধ্যে প্রভিশন করা হয়েছে (Locked)। এই বুটস্ট্র্যাপ এন্ডপয়েন্টটি স্থায়ীভাবে নিষ্ক্রিয়।',
          messageEn:
            'Super Admin is already provisioned and locked. This bootstrap endpoint is permanently disabled.',
        },
      };
    }

    // Verify optional Firebase ID token if provided, or resolve/create the Auth user via Admin SDK
    let targetUid = '';
    const tokenToVerify = (bearerToken || payload.idToken || '').trim();
    if (tokenToVerify) {
      const decoded = await adminAuth.verifyIdToken(tokenToVerify, true);
      if ((decoded.email || '').toLowerCase() !== cleanEmail) {
        return {
          statusCode: 403,
          body: {
            ok: false,
            code: 'UNAUTHORIZED_OWNER_IDENTITY',
            messageBn: 'লগইনকৃত সেশনের ইমেইল অনুমোদিত সুপার অ্যাডমিন ইমেইলের সাথে মিলছে না।',
            messageEn: 'Authenticated session email does not match allowed Super Admin email.',
          },
        };
      }
      targetUid = decoded.uid;
    } else {
      try {
        const existingUser = await adminAuth.getUserByEmail(cleanEmail);
        targetUid = existingUser.uid;
        if (payload.setupPassword && payload.setupPassword.trim().length >= 8) {
          await adminAuth.updateUser(targetUid, {
            password: payload.setupPassword.trim(),
            displayName: cleanName,
            emailVerified: true,
          });
        }
      } catch {
        if (!payload.setupPassword || payload.setupPassword.trim().length < 8) {
          return {
            statusCode: 400,
            body: {
              ok: false,
              code: 'INVALID_PAYLOAD',
              messageBn:
                'নতুন সুপার অ্যাডমিন অ্যাকাউন্ট তৈরির জন্য কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড অথবা যাচাইকৃত সেশন আবশ্যক।',
              messageEn:
                'A password of at least 8 characters or a verified session is required to create the Super Admin user.',
            },
          };
        }
        const createdUser = await adminAuth.createUser({
          email: cleanEmail,
          password: payload.setupPassword.trim(),
          displayName: cleanName,
          emailVerified: true,
        });
        targetUid = createdUser.uid;
      }
    }

    const nowIso = new Date().toISOString().slice(0, 10);

    // Atomic transaction: verify no super_admin exists and lock /systemBootstrap/super_admin_lock
    await adminDb.runTransaction(async (tx) => {
      const txLockSnap = await tx.get(lockRef);
      if (txLockSnap.exists && txLockSnap.data()?.isProvisioned === true) {
        throw new Error('BOOTSTRAP_ALREADY_LOCKED');
      }

      const existingSuperAdminsSnap = await tx.get(
        adminDb.collection('users').where('role', '==', 'super_admin').limit(1)
      );
      if (!existingSuperAdminsSnap.empty) {
        throw new Error('BOOTSTRAP_ALREADY_LOCKED');
      }

      const userRef = adminDb.collection('users').doc(targetUid);
      const auditRef = adminDb
        .collection('adminAuditLogs')
        .doc(`aud-boot-${targetUid}`);

      tx.set(userRef, {
        uid: targetUid,
        email: cleanEmail,
        displayName: cleanName,
        role: 'super_admin',
        status: 'active',
        linkedStudentIds: '',
        assignedClasses: 'সকল জামাত',
        phone: cleanPhone,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(lockRef, {
        lockId: 'super_admin_lock',
        isProvisioned: true,
        superAdminUid: targetUid,
        superAdminEmail: cleanEmail,
        superAdminName: cleanName,
        provisionedAt: nowIso,
        bootstrapMethod: 'one_time_setup_token',
        authorId: targetUid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(auditRef, {
        action: 'super_admin_bootstrapped',
        actorUid: targetUid,
        actorEmail: cleanEmail,
        actorRole: 'super_admin',
        targetUid,
        targetEmail: cleanEmail,
        targetRole: 'super_admin',
        summaryBn: `সার্ভার-ভেরিফাইড ওয়ান-টাইম বুটস্ট্র্যাপের মাধ্যমে সুপার অ্যাডমিন (${cleanName} • ${cleanEmail}) প্রভিশন ও চিরতরে লক করা হয়েছে।`,
        timestamp: nowIso,
        authorId: targetUid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await adminAuth.setCustomUserClaims(targetUid, {
      role: 'super_admin',
      bootstrapLocked: true,
    });

    return {
      statusCode: 200,
      body: {
        ok: true,
        code: 'SUPER_ADMIN_PROVISIONED',
        messageBn: `সুপার অ্যাডমিন (${cleanName}) সফলভাবে সক্রিয় ও চিরতরে লক করা হয়েছে।`,
        messageEn: `Super Admin (${cleanName}) provisioned and permanently locked.`,
        superAdminUid: targetUid,
        lockId: 'super_admin_lock',
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('BOOTSTRAP_ALREADY_LOCKED')) {
      return {
        statusCode: 409,
        body: {
          ok: false,
          code: 'BOOTSTRAP_ALREADY_LOCKED',
          messageBn:
            'সুপার অ্যাডমিন ইতিমধ্যে প্রভিশন করা হয়েছে (Locked)। দ্বিতীয়বার সুপার অ্যাডমিন তৈরি করা সম্পূর্ণ নিষিদ্ধ।',
          messageEn:
            'Super Admin has already been provisioned and locked. Repeated bootstrap is forbidden.',
        },
      };
    }
    return {
      statusCode: 500,
      body: {
        ok: false,
        code: 'INTERNAL_ERROR',
        messageBn: 'সার্ভার-সাইড সুপার অ্যাডমিন বুটস্ট্র্যাপ সম্পন্ন করা যায়নি।',
        messageEn: 'Server-side Super Admin bootstrap failed.',
      },
    };
  }
}
