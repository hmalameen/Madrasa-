import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  canSafelyAutoActivateServiceWorker,
  classifyServiceWorkerRequest,
  resolvePwaInstallPresentation,
} from './pwaSecurityLogic';

test('Phase 6.2 Task 2 — manifest.webmanifest satisfies exact installability and branding specifications', () => {
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
  assert.equal(fs.existsSync(manifestPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  assert.equal(manifest.name, 'Ummul Quran Cadet Madrasa');
  assert.equal(manifest.short_name, 'Ummul Quran');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#061326');
  assert.equal(manifest.background_color, '#F7F4EC');

  assert.equal(Array.isArray(manifest.icons), true);
  const icon192 = manifest.icons.find(
    (i: { sizes: string; purpose: string }) => i.sizes === '192x192' && i.purpose === 'any'
  );
  const icon512 = manifest.icons.find(
    (i: { sizes: string; purpose: string }) => i.sizes === '512x512' && i.purpose === 'any'
  );
  const iconMaskable = manifest.icons.find(
    (i: { sizes: string; purpose: string }) => i.sizes === '512x512' && i.purpose === 'maskable'
  );

  assert.ok(icon192, '192x192 any icon must be declared');
  assert.ok(icon512, '512x512 any icon must be declared');
  assert.ok(iconMaskable, '512x512 maskable icon must be declared');

  // Verify the referenced PNG files exist in /public
  for (const icon of [icon192, icon512, iconMaskable]) {
    const diskPath = path.resolve(process.cwd(), 'public', icon.src.replace(/^\//, ''));
    assert.equal(fs.existsSync(diskPath), true, `Missing icon file at ${diskPath}`);
  }
});

test('Phase 6.2 Task 3 — Service Worker strictly blocks Firebase Auth, Firestore, private CMS, student/guardian/fee/exam records, and API routes', () => {
  const origin = 'https://ummulquranmadrasa.edu.bd';

  // 1. Firebase Auth & Token endpoints -> MUST NEVER CACHE
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'POST',
        url: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=abc',
      },
      origin
    ),
    'BYPASS_SENSITIVE_OR_API'
  );
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: 'https://securetoken.googleapis.com/v1/token?key=abc',
      },
      origin
    ),
    'BYPASS_SENSITIVE_OR_API'
  );

  // 2. Firestore API endpoints (including settings/website-cms-config, students, attendance, marksheets, fees) -> MUST NEVER CACHE
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: 'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects%2Famazing-haven-348x0%2Fdatabases%2Fai-studio-1b55b05f-f4f5-4207-bc43-a2855e1a028e',
      },
      origin
    ),
    'BYPASS_SENSITIVE_OR_API'
  );
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: `${origin}/settings/website-cms-config`,
      },
      origin
    ),
    'BYPASS_SENSITIVE_OR_API'
  );

  // 3. Backend serverless API routes and Authorization-bearing requests -> MUST NEVER CACHE
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'POST',
        url: `${origin}/api/resolve-login`,
      },
      origin
    ),
    'BYPASS_SENSITIVE_OR_API'
  );
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: `${origin}/assets/branding/icon-192x192.png`,
        hasAuthorizationHeader: true,
      },
      origin
    ),
    'BYPASS_SENSITIVE_OR_API'
  );

  // 4. Student profiles, attendance, marksheets, fees, payroll, guardian records -> MUST NEVER CACHE
  for (const sensitivePath of [
    '/students/stu-101',
    '/guardians/grd-101',
    '/attendance/2026-11-12',
    '/exams/results',
    '/marksheets/term-1',
    '/fees/receipt-1',
    '/payroll/staff-1',
    '/users/irkwtfGd6PVGPIdVOjTSsRC9Iat1',
    '/admissionapplications/adm-101',
  ]) {
    assert.equal(
      classifyServiceWorkerRequest(
        {
          method: 'GET',
          url: `${origin}${sensitivePath}`,
        },
        origin
      ),
      'BYPASS_SENSITIVE_OR_API',
      `Failed to block sensitive path: ${sensitivePath}`
    );
  }

  // 5. Safe static assets -> ALLOWED TO CACHE
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: `${origin}/assets/branding/Ummul_Quran_Cadet_Madrasa_Clean_Logo_Transparent.png`,
      },
      origin
    ),
    'CACHE_SAFE_STATIC_ASSET'
  );
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: `${origin}/assets/index-abc123.js`,
      },
      origin
    ),
    'CACHE_SAFE_STATIC_ASSET'
  );

  // 6. Document navigation -> Network-Only with offline.html fallback (never caches HTML pages)
  assert.equal(
    classifyServiceWorkerRequest(
      {
        method: 'GET',
        url: `${origin}/about`,
        mode: 'navigate',
      },
      origin
    ),
    'NETWORK_ONLY_NAVIGATION_WITH_OFFLINE_FALLBACK'
  );
});

test('Phase 6.2 Task 4 — resolves platform install UI accurately for Android/Desktop Chromium, iOS Safari, and installed standalone states', () => {
  // 1. Android Chrome with beforeinstallprompt
  const androidInstallable = resolvePwaInstallPresentation({
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    isStandaloneDisplayMode: false,
    hasBeforeInstallPrompt: true,
  });
  assert.equal(androidInstallable.shouldShowInstallAction, true);
  assert.equal(androidInstallable.canTriggerNativePrompt, true);
  assert.equal(androidInstallable.installMode, 'native_prompt');

  // 2. iPhone Safari (no beforeinstallprompt -> shows Safari Share -> Add to Home Screen guide, never fake native prompt)
  const iosSafari = resolvePwaInstallPresentation({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    isStandaloneDisplayMode: false,
    hasBeforeInstallPrompt: false,
  });
  assert.equal(iosSafari.isIOS, true);
  assert.equal(iosSafari.canTriggerNativePrompt, false);
  assert.equal(iosSafari.shouldShowInstallAction, true);
  assert.equal(iosSafari.installMode, 'ios_safari_guide');

  // 3. Already installed standalone app -> hides install prompt
  const installedApp = resolvePwaInstallPresentation({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    isStandaloneDisplayMode: true,
    hasBeforeInstallPrompt: true,
  });
  assert.equal(installedApp.isInstalled, true);
  assert.equal(installedApp.shouldShowInstallAction, false);
  assert.equal(installedApp.installMode, 'hidden_installed');

  // 4. Desktop browser without beforeinstallprompt -> hides install button (no dead/fake button)
  const desktopNoPrompt = resolvePwaInstallPresentation({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    isStandaloneDisplayMode: false,
    hasBeforeInstallPrompt: false,
  });
  assert.equal(desktopNoPrompt.shouldShowInstallAction, false);
  assert.equal(desktopNoPrompt.installMode, 'hidden_unsupported');
});

test('Phase 6.2 Task 3 — safe service worker update guard never interrupts active data-entry sessions', () => {
  assert.equal(
    canSafelyAutoActivateServiceWorker({
      hasExistingController: true,
      isFormElementFocused: true,
      hasUnsavedAdmissionDraft: false,
    }),
    false
  );
  assert.equal(
    canSafelyAutoActivateServiceWorker({
      hasExistingController: true,
      isFormElementFocused: false,
      hasUnsavedAdmissionDraft: true,
    }),
    false
  );
  assert.equal(
    canSafelyAutoActivateServiceWorker({
      hasExistingController: false,
      isFormElementFocused: true,
      hasUnsavedAdmissionDraft: true,
    }),
    true
  );
});
