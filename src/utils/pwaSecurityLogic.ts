/**
 * Phase 6.2 — Pure PWA Security, Installability & Safe Update Logic
 * Decoupled for deterministic unit testing via node:test.
 */

export interface PwaRequestCandidate {
  method: string;
  url: string;
  mode?: 'navigate' | 'cors' | 'no-cors' | 'same-origin';
  hasAuthorizationHeader?: boolean;
  hasAppCheckHeader?: boolean;
}

export type PwaCacheDecision =
  | 'BYPASS_SENSITIVE_OR_API'
  | 'NETWORK_ONLY_NAVIGATION_WITH_OFFLINE_FALLBACK'
  | 'CACHE_SAFE_STATIC_ASSET'
  | 'BYPASS_NON_STATIC';

const FORBIDDEN_HOST_PATTERNS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'firebaseio.com',
  'cloudfunctions.net',
  'accounts.google.com',
  'apis.google.com',
  'www.googleapis.com',
];

const FORBIDDEN_PATH_OR_QUERY_KEYWORDS = [
  '/api/',
  '/__/auth',
  'website-cms-config',
  'firestore',
  'identitytoolkit',
  'securetoken',
  'idtoken',
  'accesstoken',
  'refreshtoken',
  'oobcode',
  '/students',
  '/guardians',
  '/attendance',
  '/exams',
  '/marksheets',
  '/fees',
  '/feeledger',
  '/payroll',
  '/portal',
  '/users',
  '/accountinvitations',
  '/guardianlinkrequests',
  '/admissionapplications',
];

const SAFE_STATIC_EXTENSION_RE =
  /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|webmanifest)$/i;

export function classifyServiceWorkerRequest(
  candidate: PwaRequestCandidate,
  appOrigin = 'https://ummulquranmadrasa.edu.bd'
): PwaCacheDecision {
  if (!candidate || candidate.method.toUpperCase() !== 'GET') {
    return 'BYPASS_SENSITIVE_OR_API';
  }
  if (candidate.hasAuthorizationHeader || candidate.hasAppCheckHeader) {
    return 'BYPASS_SENSITIVE_OR_API';
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate.url, appOrigin);
  } catch {
    return 'BYPASS_SENSITIVE_OR_API';
  }

  const hostname = parsed.hostname.toLowerCase();
  for (const hostPattern of FORBIDDEN_HOST_PATTERNS) {
    if (hostname.includes(hostPattern)) {
      return 'BYPASS_SENSITIVE_OR_API';
    }
  }

  const fullPathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
  for (const keyword of FORBIDDEN_PATH_OR_QUERY_KEYWORDS) {
    if (fullPathAndQuery.includes(keyword)) {
      return 'BYPASS_SENSITIVE_OR_API';
    }
  }

  if (candidate.mode === 'navigate') {
    return 'NETWORK_ONLY_NAVIGATION_WITH_OFFLINE_FALLBACK';
  }

  if (hostname === 'fonts.googleapis.com' || hostname === 'fonts.gstatic.com') {
    return 'CACHE_SAFE_STATIC_ASSET';
  }

  if (parsed.origin !== new URL(appOrigin).origin) {
    return 'BYPASS_NON_STATIC';
  }

  if (
    parsed.pathname.startsWith('/@') ||
    parsed.pathname.startsWith('/src/') ||
    parsed.pathname.startsWith('/node_modules/')
  ) {
    return 'BYPASS_NON_STATIC';
  }

  if (SAFE_STATIC_EXTENSION_RE.test(parsed.pathname)) {
    return 'CACHE_SAFE_STATIC_ASSET';
  }

  return 'BYPASS_NON_STATIC';
}

export interface PwaPlatformEnvironment {
  userAgent: string;
  maxTouchPoints?: number;
  isStandaloneDisplayMode: boolean;
  navigatorStandalone?: boolean;
  hasBeforeInstallPrompt: boolean;
}

export interface PwaInstallPresentation {
  isInstalled: boolean;
  isIOS: boolean;
  canTriggerNativePrompt: boolean;
  shouldShowInstallAction: boolean;
  installMode: 'hidden_installed' | 'native_prompt' | 'ios_safari_guide' | 'hidden_unsupported';
}

export function resolvePwaInstallPresentation(
  env: PwaPlatformEnvironment
): PwaInstallPresentation {
  const isInstalled = Boolean(env.isStandaloneDisplayMode || env.navigatorStandalone === true);
  const ua = (env.userAgent || '').toLowerCase();
  const isIphoneOrIpod = /iphone|ipod/.test(ua);
  const isIpad =
    /ipad/.test(ua) || (/macintosh/.test(ua) && (env.maxTouchPoints ?? 0) > 1);
  const isIOS = isIphoneOrIpod || isIpad;

  if (isInstalled) {
    return {
      isInstalled: true,
      isIOS,
      canTriggerNativePrompt: false,
      shouldShowInstallAction: false,
      installMode: 'hidden_installed',
    };
  }

  if (env.hasBeforeInstallPrompt) {
    return {
      isInstalled: false,
      isIOS: false,
      canTriggerNativePrompt: true,
      shouldShowInstallAction: true,
      installMode: 'native_prompt',
    };
  }

  if (isIOS) {
    return {
      isInstalled: false,
      isIOS: true,
      canTriggerNativePrompt: false,
      shouldShowInstallAction: true,
      installMode: 'ios_safari_guide',
    };
  }

  return {
    isInstalled: false,
    isIOS: false,
    canTriggerNativePrompt: false,
    shouldShowInstallAction: false,
    installMode: 'hidden_unsupported',
  };
}

export function canSafelyAutoActivateServiceWorker(state: {
  hasExistingController: boolean;
  isFormElementFocused: boolean;
  hasUnsavedAdmissionDraft: boolean;
}): boolean {
  if (!state.hasExistingController) {
    // First installation: safe to activate without reloading or interrupting anything
    return true;
  }
  if (state.isFormElementFocused || state.hasUnsavedAdmissionDraft) {
    return false;
  }
  return true;
}
