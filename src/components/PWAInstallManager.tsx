import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Share, Smartphone, WifiOff, X } from 'lucide-react';
import type { Language } from '../types/madrasa';
import {
  canSafelyAutoActivateServiceWorker,
  resolvePwaInstallPresentation,
} from '../utils/pwaSecurityLogic';
import { InstitutionalCrest } from './InstitutionalCrest';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Singleton store so multiple mounted PWAInstallButton instances (e.g., Navbar + Footer) share state
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;
let globalWaitingWorker: ServiceWorker | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function isFormInputFocused(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toUpperCase();
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (el as HTMLElement).isContentEditable === true
  );
}

let swInitialized = false;

export function initSecureServiceWorker() {
  if (typeof window === 'undefined' || swInitialized) return;
  swInitialized = true;

  // Detect standalone installed state
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  globalIsInstalled =
    mediaQuery.matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const handleDisplayModeChange = (e: MediaQueryListEvent) => {
    globalIsInstalled = e.matches;
    notifyListeners();
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleDisplayModeChange);
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    notifyListeners();
  });

  if ('serviceWorker' in navigator) {
    const registerSw = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        if (registration.waiting) {
          globalWaitingWorker = registration.waiting;
          notifyListeners();
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available while an existing controller is active
              const canActivateImmediately = canSafelyAutoActivateServiceWorker({
                hasExistingController: Boolean(navigator.serviceWorker.controller),
                isFormElementFocused: isFormInputFocused(),
                hasUnsavedAdmissionDraft: Boolean(
                  window.localStorage.getItem('uqcm_admission_form_draft_v1')
                ),
              });
              if (canActivateImmediately && !isFormInputFocused()) {
                // Still keep update non-disruptive: store waiting worker so user can apply without losing state
                globalWaitingWorker = newWorker;
                notifyListeners();
              } else {
                globalWaitingWorker = newWorker;
                notifyListeners();
              }
            }
          });
        });
      } catch {
        // Ignore service worker registration errors in unsupported environments
      }
    };

    if (document.readyState === 'complete') {
      void registerSw();
    } else {
      window.addEventListener('load', () => {
        void registerSw();
      });
    }
  }
}

export function notifyServiceWorkerLogout() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_SENSITIVE_CACHES',
    });
  }
}

export function usePWAInstall() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initSecureServiceWorker();
    const rerender = () => setTick((t) => t + 1);
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const presentation =
    typeof window !== 'undefined'
      ? resolvePwaInstallPresentation({
          userAgent: window.navigator.userAgent || '',
          maxTouchPoints: window.navigator.maxTouchPoints || 0,
          isStandaloneDisplayMode: globalIsInstalled,
          navigatorStandalone:
            (window.navigator as unknown as { standalone?: boolean }).standalone === true,
          hasBeforeInstallPrompt: Boolean(globalDeferredPrompt),
        })
      : {
          isInstalled: false,
          isIOS: false,
          canTriggerNativePrompt: false,
          shouldShowInstallAction: false,
          installMode: 'hidden_unsupported' as const,
        };

  const triggerInstall = async (): Promise<boolean> => {
    if (!globalDeferredPrompt) return false;
    try {
      await globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalIsInstalled = true;
        globalDeferredPrompt = null;
        notifyListeners();
        return true;
      }
    } catch {
      // Prompt dismissed or failed
    }
    return false;
  };

  const applyWaitingUpdate = () => {
    if (!globalWaitingWorker) return;
    globalWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
    globalWaitingWorker = null;
    notifyListeners();
  };

  return {
    ...presentation,
    hasWaitingUpdate: Boolean(globalWaitingWorker),
    triggerInstall,
    applyWaitingUpdate,
  };
}

export interface PWAInstallButtonProps {
  language: Language;
  variant?: 'navbar' | 'footer' | 'mobile';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language,
  variant = 'navbar',
}) => {
  const {
    isInstalled,
    installMode,
    canTriggerNativePrompt,
    isIOS,
    triggerInstall,
  } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isRtl = language === 'ar';

  // Hide completely when already running as an installed standalone app
  // or when neither beforeinstallprompt nor iOS Safari applies
  if (isInstalled || installMode === 'hidden_installed' || installMode === 'hidden_unsupported') {
    return null;
  }

  const buttonClasses =
    variant === 'mobile'
      ? 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0A1B33] hover:bg-[#11284A] text-[#E8D58A] border border-[#D9B64C]/40 transition-all cursor-pointer'
      : variant === 'footer'
        ? 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#061326] hover:bg-[#0D2140] text-[#E8D58A] border border-[#D9B64C]/35 transition-all cursor-pointer'
        : 'hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#0A1B33] hover:bg-[#11284A] text-[#E8D58A] border border-[#D9B64C]/35 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C]';

  // 1. Android Chrome / Windows Chrome & Edge native install flow
  if (canTriggerNativePrompt && installMode === 'native_prompt') {
    return (
      <button
        type="button"
        onClick={() => void triggerInstall()}
        data-testid={`pwa-install-btn-${variant}`}
        className={buttonClasses}
      >
        <Download className="w-3.5 h-3.5 text-[#D9B64C] shrink-0" />
        <span>
          {language === 'bn'
            ? 'অ্যাপ ইনস্টল'
            : language === 'ar'
              ? 'تثبيت التطبيق'
              : 'Install App'}
        </span>
      </button>
    );
  }

  // 2. iPhone / iPad Safari guided instructions (Never show a fake native install button)
  if (isIOS && installMode === 'ios_safari_guide') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          data-testid={`pwa-ios-guide-btn-${variant}`}
          className={buttonClasses}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#D9B64C] shrink-0" />
          <span>
            {language === 'bn'
              ? 'হোম স্ক্রিনে যুক্ত করুন'
              : language === 'ar'
                ? 'إضافة للشاشة الرئيسية'
                : 'Add to Home Screen'}
          </span>
        </button>

        {showIOSGuide && (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-guide-title"
            data-testid="pwa-ios-guide-modal"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-[#061326] border border-[#D9B64C]/45 p-6 text-[#F7F4EC] shadow-[0_24px_60px_rgba(0,0,0,0.85)] space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-[#D9B64C]/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0A1B33] p-1 ring-1 ring-[#D9B64C]/55 shrink-0 flex items-center justify-center">
                    <InstitutionalCrest className="w-full h-full" />
                  </div>
                  <div>
                    <h3
                      id="pwa-ios-guide-title"
                      className="font-display-bn text-base sm:text-lg font-bold text-[#E8D58A]"
                    >
                      {language === 'bn'
                        ? 'আইফোন / আইপ্যাডে অ্যাপ যুক্ত করার নিয়ম'
                        : language === 'ar'
                          ? 'تثبيت التطبيق على iPhone / iPad'
                          : 'Install on iPhone / iPad'}
                    </h3>
                    <p className="text-xs text-[#9CA9B8]">
                      {language === 'bn'
                        ? 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা'
                        : language === 'ar'
                          ? 'مدرسة أم القرآن كاديت الإسلامية'
                          : 'Ummul Quran Cadet Madrasa'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation guide"
                  data-testid="pwa-ios-guide-close"
                  className="p-1.5 rounded-lg text-[#9CA9B8] hover:text-[#F7F4EC] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="space-y-3 text-xs sm:text-sm text-[#F7F4EC]/90">
                <li className="flex items-start gap-3 p-3 rounded-xl bg-[#0A1B33]/90 border border-[#D9B64C]/25">
                  <span className="w-6 h-6 rounded-full bg-[#D9B64C] text-[#061326] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    {language === 'bn' ? (
                      <>
                        এই ওয়েবসাইটটি <strong>Safari</strong> ব্রাউজারে খুলুন এবং নিচের টুলবারে থাকা{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[#E8D58A] font-semibold">
                          <Share className="w-3.5 h-3.5" /> Share
                        </span>{' '}
                        বাটনে ট্যাপ করুন।
                      </>
                    ) : language === 'ar' ? (
                      <>
                        افتح هذا الموقع في متصفح <strong>Safari</strong> واضغط على زر المشاركة{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[#E8D58A] font-semibold">
                          <Share className="w-3.5 h-3.5" /> Share
                        </span>{' '}
                        في شريط الأدوات.
                      </>
                    ) : (
                      <>
                        Open this page in <strong>Safari</strong> and tap the{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[#E8D58A] font-semibold">
                          <Share className="w-3.5 h-3.5" /> Share
                        </span>{' '}
                        button in the toolbar.
                      </>
                    )}
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3 rounded-xl bg-[#0A1B33]/90 border border-[#D9B64C]/25">
                  <span className="w-6 h-6 rounded-full bg-[#D9B64C] text-[#061326] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    {language === 'bn' ? (
                      <>
                        মেনু থেকে নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন এবং উপরের ডান কোণায় <strong>Add</strong> ট্যাপ করুন।
                      </>
                    ) : language === 'ar' ? (
                      <>
                        مرر لأسفل في القائمة واختر <strong>Add to Home Screen (إضافة إلى الشاشة الرئيسية)</strong> ثم اضغط <strong>Add</strong>.
                      </>
                    ) : (
                      <>
                        Scroll down the menu, select <strong>Add to Home Screen</strong>, and tap{' '}
                        <strong>Add</strong> in the top corner.
                      </>
                    )}
                  </div>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] text-xs font-bold border border-[#D9B64C]/40 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বুঝেছি, বন্ধ করুন' : language === 'ar' ? 'حسناً، إغلاق' : 'Got It, Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const PWASystemStatusBanner: React.FC<{ language: Language }> = ({ language }) => {
  const { hasWaitingUpdate, applyWaitingUpdate } = usePWAInstall();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const isRtl = language === 'ar';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !hasWaitingUpdate) {
    return null;
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="pwa-system-status-banner"
      className="fixed bottom-4 right-4 z-[70] max-w-sm flex flex-col gap-2"
    >
      {!isOnline && (
        <div
          data-testid="pwa-offline-indicator"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#061326]/95 border border-[#D9B64C]/45 text-[#F7F4EC] text-xs shadow-xl backdrop-blur-md"
        >
          <WifiOff className="w-4 h-4 text-[#E8D58A] shrink-0" />
          <span>
            {language === 'bn'
              ? 'অফলাইন মোড — সংবেদনশীল পোর্টাল ও ডাটাবেস কার্যক্রমের জন্য ইন্টারনেট সংযোগ প্রয়োজন।'
              : language === 'ar'
                ? 'وضع عدم الاتصال — تتطلب خدمات البوابة وقاعدة البيانات اتصالاً بالإنترنت.'
                : 'Offline Mode — Live internet connection is required for portal & database actions.'}
          </span>
        </div>
      )}

      {hasWaitingUpdate && (
        <div
          data-testid="pwa-update-ready-toast"
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#0A1B33]/95 border border-[#D9B64C]/45 text-[#F7F4EC] text-xs shadow-xl backdrop-blur-md"
        >
          <span>
            {language === 'bn'
              ? 'অ্যাপের নতুন সংস্করণ প্রস্তুত।'
              : language === 'ar'
                ? 'يتوفر تحديث جديد للتطبيق.'
                : 'A new app update is ready.'}
          </span>
          <button
            type="button"
            onClick={applyWaitingUpdate}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D9B64C] text-[#061326] font-bold hover:bg-[#E8D58A] transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>
              {language === 'bn' ? 'আপডেট' : language === 'ar' ? 'تحديث' : 'Update'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
