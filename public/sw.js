/* eslint-disable no-restricted-globals */
/**
 * Ummul Quran Cadet Madrasa — Production Security-Hardened Service Worker
 *
 * STRICT SECURITY POLICY (Phase 6.2):
 * 1. ONLY caches safe public static assets (branding icons, manifest, offline.html, immutable CSS/JS/fonts).
 * 2. NEVER intercepts or caches:
 *    - Firebase Authentication (identitytoolkit, securetoken, /__/auth, Google OAuth)
 *    - Firestore API (firestore.googleapis.com) or Firebase Storage/Realtime DB
 *    - Backend API routes (/api/*)
 *    - Private CMS configuration (website-cms-config), student/guardian profiles, attendance, marksheets, fees, payroll, or tokens
 *    - Private portal navigation (/portal, /login)
 * 3. Safe Updates: Does NOT force skipWaiting() over active user data-entry sessions unless explicitly requested via postMessage({ type: 'SKIP_WAITING' }).
 */

const CACHE_VERSION = 'uqcm-static-v6.2.0';
const STATIC_CACHE_NAME = `${CACHE_VERSION}-shell`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/assets/branding/Ummul_Quran_Cadet_Madrasa_Clean_Logo_Transparent.png',
  '/assets/branding/icon-192x192.png',
  '/assets/branding/icon-512x512.png',
  '/assets/branding/icon-512x512-maskable.png',
  '/assets/branding/apple-touch-icon.png',
  '/assets/branding/favicon-32x32.png',
  '/assets/branding/favicon-64x64.png',
];

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
  ' students',
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

const SAFE_STATIC_EXTENSION_RE = /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|webmanifest)$/i;

function isForbiddenRequest(request, url) {
  if (!request || request.method !== 'GET') return true;
  if (request.headers && (request.headers.has('Authorization') || request.headers.has('X-Firebase-AppCheck'))) {
    return true;
  }
  const hostname = (url.hostname || '').toLowerCase();
  for (let i = 0; i < FORBIDDEN_HOST_PATTERNS.length; i++) {
    if (hostname.includes(FORBIDDEN_HOST_PATTERNS[i])) {
      return true;
    }
  }
  const fullTarget = `${url.pathname}${url.search}`.toLowerCase();
  for (let i = 0; i < FORBIDDEN_PATH_OR_QUERY_KEYWORDS.length; i++) {
    if (fullTarget.includes(FORBIDDEN_PATH_OR_QUERY_KEYWORDS[i])) {
      return true;
    }
  }
  return false;
}

function isSafeStaticAsset(url, selfOrigin) {
  if (isForbiddenRequest({ method: 'GET', headers: new Headers() }, url)) {
    return false;
  }
  const hostname = (url.hostname || '').toLowerCase();
  if (hostname === 'fonts.googleapis.com' || hostname === 'fonts.gstatic.com') {
    return true;
  }
  if (url.origin !== selfOrigin) {
    return false;
  }
  // Never cache Vite dev module transforms or hot-update endpoints
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return false;
  }
  return SAFE_STATIC_EXTENSION_RE.test(url.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(new Request(url, { cache: 'reload' })).then((response) => {
            if (response && response.status === 200) {
              return cache.put(url, response);
            }
            return undefined;
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE_NAME) {
              return caches.delete(key);
            }
            return undefined;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CLEAR_SENSITIVE_CACHES') {
    // Defense-in-depth on logout: purge any non-shell cache and ensure only PRECACHE_URLS remain
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map(async (key) => {
            if (key !== STATIC_CACHE_NAME) {
              return caches.delete(key);
            }
            const cache = await caches.open(STATIC_CACHE_NAME);
            const requests = await cache.keys();
            await Promise.all(
              requests.map((req) => {
                const reqUrl = new URL(req.url);
                if (!PRECACHE_URLS.includes(reqUrl.pathname)) {
                  return cache.delete(req);
                }
                return undefined;
              })
            );
            return undefined;
          })
        )
      )
    );
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // 1. Strictly bypass all forbidden auth, Firestore, API, and sensitive data requests
  if (isForbiddenRequest(request, url)) {
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).catch(() =>
          caches.match('/offline.html').then((fallback) => fallback || Response.error())
        )
      );
    }
    return;
  }

  // 2. Document navigation requests: Network-First, falling back ONLY to generic /offline.html
  // Never cache HTML pages that might contain authenticated state or private dashboard views.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then((fallback) => fallback || Response.error())
      )
    );
    return;
  }

  // 3. Safe static assets (icons, manifest, production JS/CSS bundles, fonts): Stale-While-Revalidate
  if (isSafeStaticAsset(url, self.location.origin)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (
              response &&
              response.status === 200 &&
              (response.type === 'basic' || response.type === 'cors') &&
              !response.headers.get('Cache-Control')?.includes('no-store')
            ) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })
    );
  }
});
