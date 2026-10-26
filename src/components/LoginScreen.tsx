import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Ban,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  Heart,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react';
import type { InvitationTargetRole, Language, UserRole } from '../types/madrasa';
import { TRANSLATIONS } from '../i18n/translations';
import {
  type AuthScreenState,
  classifyLoginIdentifier,
  mapFirebaseAuthErrorToMessage,
  type RegistrationFormInput,
  validateLoginInput,
  validateRegistrationInput,
} from '../utils/madrasaLogic';

export interface LoginScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onGoogleLogin: () => Promise<void>;
  onEmailPasswordLogin?: (
    identifier: string,
    password: string,
    rememberMe: boolean
  ) => Promise<{
    ok: boolean;
    errorCode?: string;
    status?: 'active' | 'pending' | 'suspended';
  }>;
  onRegisterAccount?: (
    input: RegistrationFormInput
  ) => Promise<{
    ok: boolean;
    errorCode?: string;
    status?: 'pending';
  }>;
  onForgotPassword?: (
    identifier: string
  ) => Promise<{
    ok: boolean;
    messageBn: string;
    messageEn: string;
    messageAr: string;
  }>;
  onSelectSandboxRole?: (role: UserRole) => void;
  onOpenOnlineAdmission?: () => void;
  onActivateInvitation?: (payload: {
    invitationCode: string;
    verificationSecret: string;
    email: string;
    newPassword: string;
  }) => Promise<{
    ok: boolean;
    messageBn: string;
    messageEn: string;
    backendNoticeBn?: string;
    targetRole?: InvitationTargetRole;
    studentId?: string;
  }>;
  isSuperAdminProvisioned?: boolean;
  bootstrapOwnerEmail?: string;
  onBootstrapSuperAdmin?: (payload: {
    ownerEmail: string;
    displayName: string;
    phone: string;
    setupPassword?: string;
    setupToken?: string;
  }) => Promise<{
    ok: boolean;
    messageBn: string;
    messageEn: string;
  }>;
  initialInvitationCode?: string;
  isSigningIn: boolean;
  authError: string | null;
  currentAccountStatus?: 'active' | 'pending' | 'suspended' | null;
  onSignOut?: () => Promise<void>;
}

const PARTICLES = [
  { id: 1, top: '12%', left: '8%', size: 4, color: '#E5B84B', delay: '0s' },
  { id: 2, top: '24%', left: '19%', size: 3, color: '#10B981', delay: '1.2s' },
  { id: 3, top: '16%', left: '44%', size: 5, color: '#F3D37A', delay: '2.4s' },
  { id: 4, top: '36%', left: '38%', size: 3, color: '#34D399', delay: '0.7s' },
  { id: 5, top: '62%', left: '12%', size: 4, color: '#E5B84B', delay: '1.9s' },
  { id: 6, top: '74%', left: '46%', size: 4, color: '#10B981', delay: '3.1s' },
  { id: 7, top: '18%', left: '88%', size: 5, color: '#F3D37A', delay: '1.5s' },
  { id: 8, top: '52%', left: '92%', size: 3, color: '#34D399', delay: '2.8s' },
  { id: 9, top: '82%', left: '84%', size: 4, color: '#E5B84B', delay: '0.4s' },
];

const FEATURE_BADGES = [
  {
    id: 'quran',
    icon: BookOpen,
    labelEn: 'Quran & Hifz',
    labelBn: 'কুরআন ও হিফয',
    labelAr: 'القرآن والتحفيظ',
  },
  {
    id: 'modern',
    icon: GraduationCap,
    labelEn: 'Modern Education',
    labelBn: 'আধুনিক শিক্ষা',
    labelAr: 'التعليم الحديث',
  },
  {
    id: 'character',
    icon: Heart,
    labelEn: 'Character Building',
    labelBn: 'চরিত্র গঠন',
    labelAr: 'بناء الشخصية',
  },
  {
    id: 'future',
    icon: Sparkles,
    labelEn: 'Bright Future',
    labelBn: 'উজ্জ্বল ভবিষ্যৎ',
    labelAr: 'مستقبل مشرق',
  },
];

function MadrasaGoldenCrest() {
  return (
    <div className="relative mx-auto flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
      {/* Ambient golden-emerald radial halo */}
      <div
        className="absolute inset-0 rounded-full bg-radial from-[#E5B84B]/30 via-[#10B981]/15 to-transparent blur-xl animate-uqcm-glow pointer-events-none"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full drop-shadow-[0_6px_20px_rgba(229,184,75,0.35)]"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="uqcmGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="45%" stopColor="#E5B84B" />
            <stop offset="100%" stopColor="#B38222" />
          </linearGradient>
          <linearGradient id="uqcmEmeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#044E36" />
          </linearGradient>
        </defs>

        {/* Outer ornate Islamic pointed arch shield */}
        <path
          d="M80 10 C112 28, 136 52, 136 88 C136 122, 112 142, 80 150 C48 142, 24 122, 24 88 C24 52, 48 28, 80 10 Z"
          fill="url(#uqcmEmeraldGrad)"
          fillOpacity="0.85"
          stroke="url(#uqcmGoldGrad)"
          strokeWidth="3"
        />
        <path
          d="M80 18 C107 34, 128 55, 128 87 C128 116, 107 134, 80 142 C53 134, 32 116, 32 87 C32 55, 53 34, 80 18 Z"
          stroke="url(#uqcmGoldGrad)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.8"
        />

        {/* Top Crescent & Finial Spire */}
        <circle cx="80" cy="29" r="5" stroke="url(#uqcmGoldGrad)" strokeWidth="1.8" />
        <path d="M80 20 L80 25" stroke="url(#uqcmGoldGrad)" strokeWidth="1.8" />

        {/* Central Mosque Dome & Twin Minarets */}
        <path
          d="M56 76 C56 54, 67 42, 80 35 C93 42, 104 54, 104 76 Z"
          fill="url(#uqcmGoldGrad)"
          fillOpacity="0.92"
        />
        {/* Left & Right Minarets */}
        <rect x="44" y="48" width="6" height="30" rx="2" fill="url(#uqcmGoldGrad)" />
        <path d="M44 48 L47 40 L50 48 Z" fill="url(#uqcmGoldGrad)" />
        <rect x="110" y="48" width="6" height="30" rx="2" fill="url(#uqcmGoldGrad)" />
        <path d="M110 48 L113 40 L116 48 Z" fill="url(#uqcmGoldGrad)" />

        {/* Arch doorway inside dome */}
        <path
          d="M73 76 L73 63 C73 58, 87 58, 87 63 L87 76 Z"
          fill="#052E22"
        />

        {/* Radiating light rays above Open Quran */}
        <path
          d="M80 78 L64 68 M80 78 L96 68 M80 78 L80 62"
          stroke="#FFF2B2"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Open Holy Quran Pages */}
        <path
          d="M44 86 C58 84, 70 88, 80 95 C90 88, 102 84, 116 86 L116 112 C102 110, 90 114, 80 121 C70 114, 58 110, 44 112 Z"
          fill="#04281E"
          stroke="url(#uqcmGoldGrad)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M48 90 C60 88, 71 92, 80 98 C89 92, 100 88, 112 90 L112 108 C100 106, 89 110, 80 116 C71 110, 60 106, 48 108 Z"
          fill="url(#uqcmGoldGrad)"
          fillOpacity="0.22"
          stroke="url(#uqcmGoldGrad)"
          strokeWidth="1.2"
        />
        {/* Spine line */}
        <path d="M80 95 L80 121" stroke="url(#uqcmGoldGrad)" strokeWidth="2" />

        {/* Rehal (Book stand) base */}
        <path
          d="M56 124 L80 115 L104 124 M64 129 L96 129"
          stroke="url(#uqcmGoldGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function HangingIslamicLantern() {
  return (
    <div
      className="hidden sm:block absolute -top-6 -right-5 lg:-right-8 z-20 pointer-events-none select-none animate-uqcm-lantern"
      aria-hidden="true"
    >
      {/* Warm golden lantern halo */}
      <div className="absolute top-14 -left-6 w-28 h-28 rounded-full bg-radial from-[#F3D37A]/55 via-[#E5B84B]/20 to-transparent blur-xl animate-uqcm-glow" />
      <svg viewBox="0 0 80 180" className="w-16 lg:w-20 h-40 drop-shadow-[0_0_16px_rgba(243,211,122,0.5)]" fill="none">
        <defs>
          <linearGradient id="lanternGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF3B8" />
            <stop offset="50%" stopColor="#E5B84B" />
            <stop offset="100%" stopColor="#9A6B15" />
          </linearGradient>
          <radialGradient id="lanternFlame" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#FFE484" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Suspension chain */}
        <line x1="40" y1="0" x2="40" y2="38" stroke="url(#lanternGold)" strokeWidth="2" strokeDasharray="4 2" />
        <circle cx="40" cy="40" r="4" stroke="url(#lanternGold)" strokeWidth="2" />
        {/* Top dome of lantern */}
        <path d="M24 62 C24 48, 34 44, 40 38 C46 44, 56 48, 56 62 Z" fill="url(#lanternGold)" />
        <rect x="20" y="62" width="40" height="4" rx="2" fill="url(#lanternGold)" />
        {/* Lantern body glass & warm light */}
        <polygon
          points="23,66 57,66 52,122 28,122"
          fill="url(#lanternFlame)"
          stroke="url(#lanternGold)"
          strokeWidth="2.2"
        />
        {/* Lattice ribs */}
        <line x1="33" y1="66" x2="35" y2="122" stroke="url(#lanternGold)" strokeWidth="1.4" />
        <line x1="47" y1="66" x2="45" y2="122" stroke="url(#lanternGold)" strokeWidth="1.4" />
        <path d="M25 84 Q40 76 55 84" stroke="url(#lanternGold)" strokeWidth="1.2" fill="none" />
        <path d="M27 104 Q40 112 53 104" stroke="url(#lanternGold)" strokeWidth="1.2" fill="none" />
        {/* Base */}
        <rect x="25" y="122" width="30" height="5" rx="2" fill="url(#lanternGold)" />
        <path d="M30 127 L40 142 L50 127 Z" fill="url(#lanternGold)" />
        <circle cx="40" cy="146" r="3" fill="#FFF3B8" />
      </svg>
    </div>
  );
}

function GoogleBrandIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
      />
    </svg>
  );
}

export function LoginScreen({
  language,
  onLanguageChange,
  onGoogleLogin,
  onEmailPasswordLogin,
  onRegisterAccount,
  onForgotPassword,
  onOpenOnlineAdmission,
  onActivateInvitation,
  isSuperAdminProvisioned = false,
  bootstrapOwnerEmail = '',
  onBootstrapSuperAdmin,
  initialInvitationCode = '',
  isSigningIn,
  authError,
  currentAccountStatus,
  onSignOut,
}: LoginScreenProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  // Active screen state inside the Glassmorphism card
  const [screenState, setScreenState] = useState<AuthScreenState>(
    initialInvitationCode ? 'register' : 'login'
  );

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginFieldErrors, setLoginFieldErrors] = useState<Record<string, string>>({});

  // Register Form State (Student/Guardian account request & Single-Use Activation)
  const [regSubMode, setRegSubMode] = useState<'activate' | 'request'>(
    initialInvitationCode ? 'activate' : 'activate'
  );
  const [actCode, setActCode] = useState<string>(initialInvitationCode);
  const [actSecret, setActSecret] = useState<string>('');
  const [actEmail, setActEmail] = useState<string>('');
  const [actPassword, setActPassword] = useState<string>('');
  const [actFeedback, setActFeedback] = useState<{
    ok: boolean;
    message: string;
    backendNotice?: string;
  } | null>(null);
  const [regRole, setRegRole] = useState<'student' | 'guardian'>('student');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regIdentifier, setRegIdentifier] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialInvitationCode) {
      setActCode(initialInvitationCode);
      setRegSubMode('activate');
      setScreenState('register');
    }
  }, [initialInvitationCode]);

  // Forgot Password Form State
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetFeedback, setResetFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [resetFieldError, setResetFieldError] = useState<string | null>(null);

  // Error / Pending / Suspended detail states
  const [errorDisplay, setErrorDisplay] = useState<{
    title: string;
    message: string;
    technicalNote?: string;
  } | null>(null);
  const [showPendingDetails, setShowPendingDetails] = useState<boolean>(false);
  const [showSuspendedContact, setShowSuspendedContact] = useState<boolean>(false);

  // One-Time Super Admin Bootstrap Drawer State (Phase B)
  const [showBootstrapDrawer, setShowBootstrapDrawer] = useState<boolean>(false);
  const [bootEmail, setBootEmail] = useState<string>(bootstrapOwnerEmail || '');
  const [bootName, setBootName] = useState<string>('প্রধান প্রশাসক (Super Admin)');
  const [bootPhone, setBootPhone] = useState<string>('01711-984321');
  const [bootPassword, setBootPassword] = useState<string>('');
  const [bootFeedback, setBootFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Sync external auth state / account status into card screen state
  useEffect(() => {
    if (isSigningIn) {
      setScreenState('loading');
      return;
    }
    if (authError) {
      const mapped = mapFirebaseAuthErrorToMessage(authError, language);
      setErrorDisplay(mapped);
      setScreenState('error');
      return;
    }
    if (currentAccountStatus === 'pending') {
      setScreenState('pending');
      return;
    }
    if (currentAccountStatus === 'suspended') {
      setScreenState('suspended');
    }
  }, [isSigningIn, authError, currentAccountStatus, language]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginFieldErrors({});
    setErrorDisplay(null);

    const validation = validateLoginInput(loginIdentifier, loginPassword);
    if (!validation.valid) {
      setLoginFieldErrors(validation.errors);
      return;
    }

    setScreenState('loading');

    if (onEmailPasswordLogin) {
      const result = await onEmailPasswordLogin(loginIdentifier, loginPassword, rememberMe);
      if (!result.ok) {
        const mapped = mapFirebaseAuthErrorToMessage(
          result.errorCode || 'auth/invalid-credential',
          language
        );
        setErrorDisplay(mapped);
        setScreenState('error');
        return;
      }
      if (result.status === 'pending') {
        setScreenState('pending');
        return;
      }
      if (result.status === 'suspended') {
        setScreenState('suspended');
        return;
      }
    } else {
      const classified = classifyLoginIdentifier(loginIdentifier);
      const mapped = mapFirebaseAuthErrorToMessage(
        classified.kind === 'email'
          ? 'auth/invalid-credential'
          : 'USERNAME_REQUIRES_BACKEND_LOOKUP',
        language
      );
      setErrorDisplay(mapped);
      setScreenState('error');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegFieldErrors({});
    setErrorDisplay(null);

    const payload: RegistrationFormInput = {
      role: regRole,
      fullName: regFullName,
      phone: regPhone,
      identifier: regIdentifier,
      password: regPassword,
    };

    const validation = validateRegistrationInput(payload);
    if (!validation.valid) {
      setRegFieldErrors(validation.errors);
      return;
    }

    setScreenState('loading');

    if (onRegisterAccount) {
      const res = await onRegisterAccount(payload);
      if (!res.ok) {
        const mapped = mapFirebaseAuthErrorToMessage(
          res.errorCode || 'auth/operation-not-allowed',
          language
        );
        setErrorDisplay(mapped);
        setScreenState('error');
        return;
      }
      setScreenState('pending');
    } else {
      setScreenState('pending');
    }
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActFeedback(null);
    if (!onActivateInvitation) return;
    const res = await onActivateInvitation({
      invitationCode: actCode,
      verificationSecret: actSecret,
      email: actEmail,
      newPassword: actPassword,
    });
    setActFeedback({
      ok: res.ok,
      message: language === 'bn' ? res.messageBn : res.messageEn,
      backendNotice: res.backendNoticeBn,
    });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFieldError(null);
    setResetFeedback(null);

    const classified = classifyLoginIdentifier(resetIdentifier);
    if (classified.kind === 'invalid') {
      setResetFieldError(
        language === 'bn'
          ? 'সঠিক নিবন্ধিত ইমেইল অথবা ইউজারনেম প্রদান করুন'
          : language === 'ar'
            ? 'يرجى إدخال بريد إلكتروني أو اسم مستخدم صحيح'
            : 'Please enter a valid registered email or username'
      );
      return;
    }

    if (onForgotPassword) {
      const res = await onForgotPassword(resetIdentifier);
      const msg =
        language === 'bn' ? res.messageBn : language === 'ar' ? res.messageAr : res.messageEn;
      setResetFeedback({ ok: res.ok, message: msg });
    } else {
      if (classified.kind === 'email') {
        setResetFeedback({
          ok: true,
          message:
            language === 'bn'
              ? `${classified.normalized} ঠিকানায় পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে।`
              : language === 'ar'
                ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
                : `Password reset instructions sent to ${classified.normalized}.`,
        });
      } else {
        setResetFeedback({
          ok: false,
          message:
            language === 'bn'
              ? 'স্টুডেন্ট আইডি বা ইউজারনেম দিয়ে পাসওয়ার্ড রিসেটের জন্য মাদ্রাসা প্রশাসন দপ্তরে (+৮৮০ ১৭১১-০০০০০০) যোগাযোগ করুন অথবা নিবন্ধিত ইমেইল দিন।'
              : language === 'ar'
                ? 'لإعادة تعيين كلمة المرور برقم الطالب، يرجى التواصل مع مكتب إدارة المدرسة أو إدخال البريد الإلكتروني المسجل.'
                : 'For Student ID / Username recovery, please contact the Madrasa Administration Office (+880 1711-000000) or enter your registered email address.',
        });
      }
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#020A14] via-[#061A2E] to-[#042825] animate-uqcm-bg text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white"
    >
      {/* =====================================================================
          1. ANIMATED ARCHITECTURAL & ISLAMIC GEOMETRIC BACKGROUND SCENE
         ===================================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Ambient radial light blooms */}
        <div className="absolute -top-28 -left-28 w-[34rem] h-[34rem] rounded-full bg-radial from-[#0E5E48]/35 via-[#072B3A]/15 to-transparent blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[36rem] h-[36rem] rounded-full bg-radial from-[#D4AF37]/18 via-[#10B981]/12 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[42rem] h-[24rem] rounded-full bg-radial from-[#10B981]/20 via-[#E5B84B]/10 to-transparent blur-3xl" />

        {/* Top-left Islamic Arabesque Geometric Lattice SVG */}
        <svg
          className="absolute top-0 left-0 w-80 h-80 sm:w-[28rem] sm:h-[28rem] text-[#E5B84B]/12"
          viewBox="0 0 400 400"
          fill="none"
        >
          <g stroke="currentColor" strokeWidth="1.1">
            <circle cx="80" cy="80" r="140" />
            <circle cx="80" cy="80" r="105" strokeDasharray="5 5" />
            <rect x="-20" y="-20" width="200" height="200" transform="rotate(15 80 80)" />
            <rect x="-20" y="-20" width="200" height="200" transform="rotate(45 80 80)" />
            <rect x="-20" y="-20" width="200" height="200" transform="rotate(75 80 80)" />
            <path d="M0 240 Q120 180 240 0" stroke="#10B981" strokeOpacity="0.3" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Glowing Crescent Moon & Star Cluster (Center-Left Sky) */}
        <svg
          className="hidden md:block absolute top-24 left-[44%] w-24 h-24 text-[#F3D37A]/80 drop-shadow-[0_0_16px_rgba(243,211,122,0.45)]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M62 20 A28 28 0 1 0 82 64 A22 22 0 1 1 62 20 Z" />
          <polygon points="44,32 46,37 51,37 47,40 48,45 44,42 40,45 41,40 37,37 42,37" opacity="0.85" />
        </svg>

        {/* Subtle Drifting Gold & Emerald Particles */}
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animationDelay: p.delay,
              boxShadow: `0 0 10px ${p.color}`,
            }}
            className="absolute rounded-full animate-uqcm-particle"
          />
        ))}

        {/* Flowing Luminous Gold & Emerald Light Trails at Horizon */}
        <svg
          className="absolute bottom-0 left-0 w-full h-56 sm:h-72 object-cover"
          viewBox="0 0 1440 320"
          preserveAspectRatio="xMidYMax slice"
          fill="none"
        >
          <defs>
            <linearGradient id="goldTrailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E5B84B" stopOpacity="0.05" />
              <stop offset="35%" stopColor="#F3D37A" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#E5B84B" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="emeraldTrailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#34D399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E5B84B" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          <path
            d="M-60 255 C 240 180, 520 300, 860 210 C 1120 140, 1290 240, 1500 170"
            stroke="url(#goldTrailGrad)"
            strokeWidth="3"
            fill="none"
            className="animate-uqcm-trail"
          />
          <path
            d="M-40 280 C 310 220, 590 320, 920 230 C 1180 160, 1340 260, 1520 200"
            stroke="url(#emeraldTrailGrad)"
            strokeWidth="2.2"
            fill="none"
            className="animate-uqcm-trail-reverse"
          />
          <path
            d="M120 300 C 460 240, 740 280, 1080 190 C 1260 140, 1390 210, 1500 185"
            stroke="url(#goldTrailGrad)"
            strokeWidth="1.4"
            strokeOpacity="0.6"
            fill="none"
          />
        </svg>
      </div>

      {/* =====================================================================
          2. TOP BAR: LANGUAGE SWITCHER (বাংলা DEFAULT | ENGLISH | عربي) & PREVIEW ACTION
         ===================================================================== */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-8 pt-3 sm:pt-5 flex items-center justify-between gap-2">
        {/* Language Switcher Pill matching Reference Top-Left */}
        <div
          role="group"
          aria-label="Language selection"
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#071E32]/85 backdrop-blur-md border border-emerald-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400 me-0.5 shrink-0" aria-hidden="true" />
          {(
            [
              { code: 'bn', label: 'বাংলা' },
              { code: 'en', label: 'English' },
              { code: 'ar', label: 'عربي' },
            ] as const
          ).map((item, idx) => {
            const active = language === item.code;
            return (
              <React.Fragment key={item.code}>
                {idx > 0 && <span className="text-slate-600 text-xs select-none">|</span>}
                <button
                  type="button"
                  onClick={() => onLanguageChange(item.code)}
                  className={`px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    active
                      ? 'text-emerald-300 bg-emerald-500/20 border-b-2 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Header Status: One-Time Super Admin Bootstrap OR Locked Governance Badge */}
        <div className="flex items-center gap-2">
          {!isSuperAdminProvisioned && onBootstrapSuperAdmin ? (
            <button
              type="button"
              onClick={() => {
                setBootFeedback(null);
                setShowBootstrapDrawer((prev) => !prev);
              }}
              data-testid="open-super-admin-bootstrap-btn"
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#071E32]/90 hover:bg-[#0B2D48] backdrop-blur-md border border-[#E5B84B]/50 text-[11px] sm:text-xs font-semibold text-[#F3D37A] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {language === 'bn'
                  ? 'এককালীন সুপার অ্যাডমিন সেটআপ'
                  : language === 'ar'
                    ? 'إعداد المشرف العام لأول مرة'
                    : 'First-Time Super Admin Setup'}
              </span>
            </button>
          ) : (
            <div
              data-testid="super-admin-locked-badge"
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#071E32]/85 backdrop-blur-md border border-emerald-500/35 text-[11px] sm:text-xs font-semibold text-emerald-300 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E5B84B] shrink-0" />
              <span>
                {language === 'bn'
                  ? 'সিস্টেম গভর্ন্যান্স সক্রিয় (Super Admin Provisioned)'
                  : 'Governance Locked · Super Admin Provisioned'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Expandable One-Time Super Admin Bootstrap Drawer (Hidden permanently once provisioned) */}
      {!isSuperAdminProvisioned && showBootstrapDrawer && onBootstrapSuperAdmin && (
        <div
          data-testid="super-admin-bootstrap-drawer"
          className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-8 mt-2.5 animate-uqcm-view"
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-[#061A2C]/95 backdrop-blur-xl border border-[#E5B84B]/45 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#F3D37A] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'bn'
                      ? 'এককালীন সুপার অ্যাডমিন প্রভিশনিং (One-Time Super Admin Bootstrap)'
                      : 'One-Time Super Admin Provisioning (Atomic Lock)'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {language === 'bn'
                    ? 'শুধুমাত্র অনুমোদিত প্রতিষ্ঠান প্রধানের ইমেইল যাচাইয়ের মাধ্যমে প্রথমবার সুপার অ্যাডমিন সক্রিয় করা যাবে। একবার সম্পন্ন হলে এই প্যানেল চিরতরে লক হয়ে যাবে।'
                    : 'Only the verified institutional owner email can complete first-time Super Admin provisioning. Once completed, this bootstrap lock is permanent.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBootstrapDrawer(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBootFeedback(null);
                const res = await onBootstrapSuperAdmin({
                  ownerEmail: bootEmail,
                  displayName: bootName,
                  phone: bootPhone,
                  setupPassword: bootPassword,
                });
                setBootFeedback({
                  ok: res.ok,
                  message: language === 'bn' ? res.messageBn : res.messageEn,
                });
                if (res.ok) {
                  setShowBootstrapDrawer(false);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-200 mb-1">
                  {language === 'bn' ? 'অনুমোদিত মালিকানা ইমেইল *' : 'Verified Owner Email *'}
                </label>
                <input
                  type="email"
                  value={bootEmail}
                  onChange={(e) => setBootEmail(e.target.value)}
                  placeholder="hmalameenemob@gmail.com"
                  data-testid="bootstrap-input-email"
                  className="w-full px-3 py-2 rounded-xl bg-[#041220] border border-slate-600/80 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-200 mb-1">
                  {language === 'bn' ? 'প্রশাসকের নাম *' : 'Super Admin Name *'}
                </label>
                <input
                  type="text"
                  value={bootName}
                  onChange={(e) => setBootName(e.target.value)}
                  data-testid="bootstrap-input-name"
                  className="w-full px-3 py-2 rounded-xl bg-[#041220] border border-slate-600/80 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-200 mb-1">
                  {language === 'bn' ? 'দাপ্তরিক মোবাইল নম্বর *' : 'Official Phone *'}
                </label>
                <input
                  type="text"
                  value={bootPhone}
                  onChange={(e) => setBootPhone(e.target.value)}
                  data-testid="bootstrap-input-phone"
                  className="w-full px-3 py-2 rounded-xl bg-[#041220] border border-slate-600/80 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  data-testid="bootstrap-submit-btn"
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#059669] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {language === 'bn'
                    ? 'সুপার অ্যাডমিন সক্রিয় ও লক করুন'
                    : 'Provision & Lock Super Admin'}
                </button>
              </div>
            </form>

            {bootFeedback && (
              <div
                role="alert"
                data-testid="bootstrap-feedback-box"
                className={`mt-3 p-2.5 rounded-xl border text-xs font-medium ${
                  bootFeedback.ok
                    ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-100'
                    : 'bg-rose-950/80 border-rose-400/60 text-rose-200'
                }`}
              >
                {bootFeedback.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. MAIN SPLIT WORKSPACE (BRANDED ARCH SCENE LEFT + GLASS CARD RIGHT)
         ===================================================================== */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-8 py-2 sm:py-6 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-10 items-center">
          {/* LEFT COLUMN: INSTITUTIONAL BRANDING, POINTED ARCH & FEATURE HIGHLIGHTS */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center text-center animate-uqcm-brand">
            <div className="relative w-full max-w-xl mx-auto pt-1 pb-2 sm:py-6 px-3 sm:px-8 rounded-3xl">
              {/* Decorative Pointed Islamic Arch SVG Frame (Desktop/Tablet) */}
              <svg
                className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none opacity-85"
                viewBox="0 0 500 560"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="archFrameStroke" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F3D37A" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#10B981" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#E5B84B" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path
                  d="M250 10 C375 55, 474 140, 474 260 L474 548 L26 548 L26 260 C26 140, 125 55, 250 10 Z"
                  fill="#041524"
                  fillOpacity="0.45"
                  stroke="url(#archFrameStroke)"
                  strokeWidth="2"
                />
                <path
                  d="M250 24 C365 66, 458 148, 458 262 L458 536 L42 536 L42 262 C42 148, 135 66, 250 24 Z"
                  stroke="#E5B84B"
                  strokeWidth="0.9"
                  strokeOpacity="0.35"
                  strokeDasharray="6 4"
                />
              </svg>

              {/* Institution Emblem (Logo) */}
              <div className="relative z-10 flex flex-col items-center">
                <MadrasaGoldenCrest />

                {/* Exact Institution Name: UMMUL QURAN CADET MADRASA */}
                <h1 className="mt-1.5 sm:mt-3 tracking-wider uppercase text-center">
                  <span className="block text-xl sm:text-4xl xl:text-[38px] font-extrabold bg-gradient-to-r from-[#FFF3B8] via-[#E5B84B] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(229,184,75,0.3)] leading-tight">
                    UMMUL QURAN
                  </span>
                  <span className="block text-sm sm:text-2xl xl:text-[25px] font-bold tracking-[0.22em] text-white mt-0.5">
                    CADET MADRASA
                  </span>
                </h1>

                {/* Exact Tagline: Knowledge · Character · Excellence */}
                <div className="mt-1.5 sm:mt-2.5 flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-sm font-medium text-slate-200 tracking-wide">
                  <span className="w-6 sm:w-12 h-px bg-gradient-to-r from-transparent to-[#E5B84B]/80" />
                  <span>Knowledge</span>
                  <span className="text-[#E5B84B]" aria-hidden="true">
                    ·
                  </span>
                  <span>Character</span>
                  <span className="text-[#E5B84B]" aria-hidden="true">
                    ·
                  </span>
                  <span>Excellence</span>
                  <span className="w-6 sm:w-12 h-px bg-gradient-to-l from-transparent to-[#E5B84B]/80" />
                </div>

                {/* Bengali Motto Quote */}
                <p className="mt-1 sm:mt-2 text-xs sm:text-base font-medium text-[#F3D37A] tracking-wide">
                  {language === 'ar'
                    ? '«التزامنا ببناء جيل مستنير بالقرآن والعلم»'
                    : '“আলোকিত মানুষ গড়ার প্রতিশ্রুতি আমাদের”'}
                </p>

                {/* Scenic Mosque Waterfront Illustration Inside Arch (Desktop & Tablet) */}
                <div className="hidden sm:block w-full mt-4 overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-b from-[#051B2E]/60 to-[#03101C]/90">
                  <svg
                    viewBox="0 0 520 115"
                    className="w-full h-24 lg:h-28"
                    fill="none"
                    aria-hidden="true"
                  >
                    <ellipse cx="260" cy="70" rx="160" ry="45" fill="#E5B84B" fillOpacity="0.12" />
                    <path
                      d="M20 92 L95 92 L95 36 L100 20 L105 36 L105 92 L135 92 C135 64, 158 50, 178 40 C198 50, 220 64, 220 92 L232 92 C232 50, 265 28, 295 14 C325 28, 358 50, 358 92 L372 92 C372 68, 390 54, 406 46 C422 54, 440 68, 440 92 L458 92 L458 32 L463 16 L468 32 L468 92 L500 92"
                      fill="#062336"
                      stroke="#E5B84B"
                      strokeWidth="1.2"
                      strokeOpacity="0.55"
                    />
                    <g fill="#F3D37A" opacity="0.85">
                      <rect x="276" y="64" width="6" height="14" rx="3" />
                      <rect x="287" y="61" width="7" height="17" rx="3.5" />
                      <rect x="299" y="61" width="7" height="17" rx="3.5" />
                      <rect x="311" y="64" width="6" height="14" rx="3" />
                      <rect x="171" y="68" width="5" height="12" rx="2.5" />
                      <rect x="180" y="68" width="5" height="12" rx="2.5" />
                      <rect x="400" y="70" width="5" height="11" rx="2.5" />
                      <rect x="409" y="70" width="5" height="11" rx="2.5" />
                    </g>
                    <line x1="20" y1="92" x2="500" y2="92" stroke="#10B981" strokeOpacity="0.4" strokeWidth="1" />
                    <line x1="255" y1="99" x2="335" y2="99" stroke="#F3D37A" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="270" y1="105" x2="320" y2="105" stroke="#E5B84B" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="158" y1="100" x2="198" y2="100" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="388" y1="100" x2="426" y2="100" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>

                {/* 4 Feature Highlight Badges (Shown inside arch on sm+) */}
                <div className="hidden sm:grid mt-5 pt-4 border-t border-emerald-500/25 w-full grid-cols-4 gap-3">
                  {FEATURE_BADGES.map((feat) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={feat.id}
                        className="flex flex-col items-center text-center group"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#062335]/90 border border-emerald-400/45 group-hover:border-[#E5B84B] shadow-[0_0_15px_rgba(16,185,129,0.22)] flex items-center justify-center text-emerald-300 group-hover:text-[#F3D37A] transition-all">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="mt-1.5 text-xs font-medium text-slate-200 leading-tight">
                          {language === 'ar' ? feat.labelAr : feat.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: GLASSMORPHISM AUTHENTICATION CARD */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto relative animate-uqcm-card">
            {/* Hanging Glowing Islamic Lantern on Right Edge */}
            <HangingIslamicLantern />

            {/* Outer Luminous Gradient Border Wrapper */}
            <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-b from-[#F3D37A]/70 via-[#10B981]/50 to-[#E5B84B]/60 shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_35px_rgba(16,185,129,0.18)]">
              {/* Inner Frosted Glass Card */}
              <div className="relative rounded-[22.5px] bg-[#061829]/85 backdrop-blur-2xl px-5 sm:px-8 py-5 sm:py-7 overflow-hidden">
                {/* Subtle inner top glow */}
                <div
                  className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full bg-radial from-emerald-500/20 via-[#E5B84B]/10 to-transparent blur-2xl pointer-events-none"
                  aria-hidden="true"
                />

                {/* Segmented Login / Register Switcher Tabs (Shown on login & register views) */}
                {(screenState === 'login' || screenState === 'register') && (
                  <div
                    role="tablist"
                    aria-label="Authentication mode"
                    className="relative z-10 grid grid-cols-2 p-1 rounded-xl bg-[#04111E]/90 border border-slate-700/70 mb-5 sm:mb-6"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={screenState === 'login'}
                      onClick={() => {
                        setScreenState('login');
                        setErrorDisplay(null);
                      }}
                      className={`py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer relative ${
                        screenState === 'login'
                          ? 'bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#065F46] text-white shadow-[0_2px_12px_rgba(16,185,129,0.35)]'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {language === 'bn' ? 'লগইন' : language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                      {screenState === 'login' && (
                        <span className="absolute bottom-0 inset-x-6 h-0.5 bg-[#E5B84B] rounded-full" />
                      )}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={screenState === 'register'}
                      onClick={() => {
                        setScreenState('register');
                        setErrorDisplay(null);
                      }}
                      className={`py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer relative ${
                        screenState === 'register'
                          ? 'bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#065F46] text-white shadow-[0_2px_12px_rgba(16,185,129,0.35)]'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {language === 'bn' ? 'রেজিস্টার' : language === 'ar' ? 'إنشاء حساب' : 'Register'}
                      {screenState === 'register' && (
                        <span className="absolute bottom-0 inset-x-6 h-0.5 bg-[#E5B84B] rounded-full" />
                      )}
                    </button>
                  </div>
                )}

                {/* =========================================================
                    VIEW 1: LOGIN SCREEN
                   ========================================================= */}
                {screenState === 'login' && (
                  <div key="login-view" className="relative z-10 animate-uqcm-view">
                    <div className="mb-4 sm:mb-5">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        {language === 'bn'
                          ? 'স্বাগতম!'
                          : language === 'ar'
                            ? 'مرحباً بكم!'
                            : 'Welcome!'}
                      </h2>
                      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-300">
                        {language === 'bn'
                          ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন'
                          : language === 'ar'
                            ? 'قم بتسجيل الدخول إلى حسابك'
                            : 'Sign in to your institutional account'}
                      </p>
                    </div>

                    <form onSubmit={handleLoginSubmit} noValidate className="space-y-3.5 sm:space-y-4">
                      {/* Username / Student ID Input */}
                      <div>
                        <label
                          htmlFor="uqcm-login-id"
                          className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5"
                        >
                          {language === 'bn'
                            ? 'ইউজারনেম / স্টুডেন্ট আইডি'
                            : language === 'ar'
                              ? 'اسم المستخدم / رقم الطالب'
                              : 'Username / Student ID'}
                        </label>
                        <div className="uqcm-input-shell flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                          <User className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                          <input
                            id="uqcm-login-id"
                            type="text"
                            autoComplete="username"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            placeholder={
                              language === 'bn'
                                ? 'আপনার ইউজারনেম বা আইডি লিখুন'
                                : language === 'ar'
                                  ? 'أدخل اسم المستخدم أو رقم الطالب'
                                  : 'Enter Username, Student ID or Email'
                            }
                            className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                        {loginFieldErrors.identifier && (
                          <p role="alert" className="mt-1.5 text-xs text-rose-300 font-medium">
                            {loginFieldErrors.identifier}
                          </p>
                        )}
                      </div>

                      {/* Password Input with Visibility Toggle */}
                      <div>
                        <label
                          htmlFor="uqcm-login-password"
                          className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5"
                        >
                          {language === 'bn'
                            ? 'পাসওয়ার্ড'
                            : language === 'ar'
                              ? 'كلمة المرور'
                              : 'Password'}
                        </label>
                        <div className="uqcm-input-shell flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                          <Lock className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                          <input
                            id="uqcm-login-password"
                            type={showLoginPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                            className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer p-0.5"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {loginFieldErrors.password && (
                          <p role="alert" className="mt-1.5 text-xs text-rose-300 font-medium">
                            {loginFieldErrors.password}
                          </p>
                        )}
                      </div>

                      {/* Remember Me & Forgot Password Row */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-[#041220] text-emerald-500 focus:ring-emerald-400 accent-emerald-500"
                          />
                          <span>
                            {language === 'bn'
                              ? 'আমাকে মনে রাখুন'
                              : language === 'ar'
                                ? 'تذكرني'
                                : 'Remember me'}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setResetIdentifier(loginIdentifier);
                            setResetFeedback(null);
                            setResetFieldError(null);
                            setScreenState('forgot_password');
                          }}
                          className="text-xs font-semibold text-[#F3D37A] hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          {language === 'bn'
                            ? 'পাসওয়ার্ড ভুলে গেছেন?'
                            : language === 'ar'
                              ? 'نسيت كلمة المرور؟'
                              : 'Forgot Password?'}
                        </button>
                      </div>

                      {/* Primary Login CTA Button */}
                      <button
                        type="submit"
                        disabled={isSigningIn}
                        className="w-full py-2.5 sm:py-3 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-[0_6px_24px_rgba(16,185,129,0.4)] hover:shadow-[0_8px_28px_rgba(16,185,129,0.55)] border border-emerald-300/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {language === 'bn'
                            ? 'লগইন করুন'
                            : language === 'ar'
                              ? 'تسجيل الدخول'
                              : 'Sign In'}
                        </span>
                        <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    </form>

                    {/* Divider: অথবা */}
                    <div className="my-3.5 sm:my-4 flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-700/80" />
                      <span className="text-xs text-slate-300 font-medium">
                        {language === 'bn' ? 'অথবা' : language === 'ar' ? 'أو' : 'OR'}
                      </span>
                      <div className="flex-1 h-px bg-slate-700/80" />
                    </div>

                    {/* Google Sign-In Button */}
                    <button
                      type="button"
                      onClick={onGoogleLogin}
                      disabled={isSigningIn}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0A2236]/90 hover:bg-[#0F2E47] active:scale-[0.99] border border-slate-600/80 hover:border-emerald-400/50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <GoogleBrandIcon />
                      <span>
                        {language === 'bn'
                          ? 'Google দিয়ে প্রবেশ করুন'
                          : language === 'ar'
                            ? 'الدخول باستخدام Google'
                            : 'Continue with Google'}
                      </span>
                    </button>

                    {/* Bottom Switch to Register & Online Admission */}
                    <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-800/90 text-center space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setScreenState('register')}
                        className="text-xs sm:text-sm font-medium text-slate-300 hover:text-[#F3D37A] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>
                          {language === 'bn'
                            ? 'নতুন অ্যাকাউন্টের জন্য আবেদন করুন'
                            : language === 'ar'
                              ? 'التقدم بطلب للحصول على حساب جديد'
                              : 'Apply for a new Student/Guardian account'}
                        </span>
                        <ArrowRight className={`w-3.5 h-3.5 text-[#F3D37A] ${isRtl ? 'rotate-180' : ''}`} />
                      </button>

                      {onOpenOnlineAdmission && (
                        <div>
                          <button
                            type="button"
                            onClick={onOpenOnlineAdmission}
                            data-testid="login-open-online-admission-btn"
                            className="w-full py-2 px-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-[#E5B84B]/40 text-[#F3D37A] text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <GraduationCap className="w-4 h-4 text-[#E5B84B]" />
                            <span>
                              {language === 'bn'
                                ? 'অনলাইন ভর্তি ফরম ও আবেদন ট্র্যাকিং (Online Admission)'
                                : language === 'ar'
                                  ? 'نموذج القبول الإلكتروني ومتابعة الطلب'
                                  : 'Online Admission Form & Status Tracker'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* =========================================================
                    VIEW 2: PUBLIC REGISTRATION PAGE (NEW ADMISSION + EXISTING LOGIN + SINGLE-USE ACTIVATION)
                   ========================================================= */}
                {screenState === 'register' && (
                  <div key="register-view" className="relative z-10 animate-uqcm-view">
                    <div className="mb-3.5">
                      <h2 className="text-lg sm:text-xl font-bold text-white">
                        {language === 'bn'
                          ? 'পাবলিক রেজিস্ট্রেশন ও ভর্তি পোর্টাল'
                          : language === 'ar'
                            ? 'بوابة التسجيل والقبول الإلكتروني'
                            : 'Public Registration & Admission Gateway'}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {language === 'bn'
                          ? 'লগইন ছাড়াই নতুন অনলাইন ভর্তি আবেদন করুন অথবা বিদ্যমান ইউজার হিসেবে প্রবেশ করুন'
                          : 'Submit a new online admission application without logging in, or sign in as an existing user'}
                      </p>
                    </div>

                    {/* PART A: TWO CLEAR PRIMARY OPTIONS ON PUBLIC REGISTRATION PAGE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenOnlineAdmission) onOpenOnlineAdmission();
                        }}
                        data-testid="reg-option-new-admission"
                        className="p-3 rounded-xl bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#065F46] hover:from-[#047857] hover:to-[#059669] border border-[#E5B84B]/60 text-start transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#E5B84B]/20 border border-[#E5B84B]/50 text-[#F3D37A]">
                            <GraduationCap className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E5B84B]/20 text-[#F3D37A]">
                            {language === 'bn' ? 'লগইন নিষ্প্রয়োজন' : 'No Login Needed'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white mt-2 group-hover:text-[#F3D37A]">
                          {language === 'bn'
                            ? '১. নতুন ভর্তি আবেদন'
                            : '1. New Admission Application'}
                        </p>
                        <p className="text-[11px] text-emerald-100/90 mt-0.5 leading-snug">
                          {language === 'bn'
                            ? '৪-ধাপের ভর্তি ফরম, ছবি আপলোড ও রেফারেন্স ট্র্যাকিং'
                            : '4-step form, photo upload & status tracking'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorDisplay(null);
                          setScreenState('login');
                        }}
                        data-testid="reg-option-existing-login"
                        className="p-3 rounded-xl bg-[#041220]/90 hover:bg-[#0A253B] border border-emerald-500/35 hover:border-[#E5B84B]/60 text-start transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                            <UserCheck className="w-4 h-4" />
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white mt-2 group-hover:text-[#F3D37A]">
                          {language === 'bn'
                            ? '২. বিদ্যমান ইউজার লগইন'
                            : '2. Existing User Login'}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          {language === 'bn'
                            ? 'অনুমোদিত শিক্ষার্থী, অভিভাবক, শিক্ষক ও মুহতামিম লগইন'
                            : 'Sign in to Student, Guardian, Teacher or Admin portal'}
                        </p>
                      </button>
                    </div>

                    {/* Sub-mode switcher: Single-Use Account Activation vs General Account Request */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#04111E]/90 border border-slate-700/70 mb-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRegSubMode('activate');
                          setActFeedback(null);
                        }}
                        data-testid="reg-mode-activate"
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          regSubMode === 'activate'
                            ? 'bg-emerald-800/80 text-[#F3D37A] border border-[#E5B84B]/40'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {language === 'bn'
                          ? 'অনুমোদিত অ্যাকাউন্ট সক্রিয়করণ'
                          : 'Activate Approved Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRegSubMode('request');
                          setActFeedback(null);
                        }}
                        data-testid="reg-mode-request"
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          regSubMode === 'request'
                            ? 'bg-emerald-800/80 text-[#F3D37A] border border-[#E5B84B]/40'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {language === 'bn'
                          ? 'অ্যাকাউন্ট রিকোয়েস্ট'
                          : 'Account Request'}
                      </button>
                    </div>

                    {regSubMode === 'activate' ? (
                      <form onSubmit={handleActivationSubmit} noValidate className="space-y-3">
                        <div className="p-2.5 rounded-xl bg-[#041220]/90 border border-[#E5B84B]/30 text-[11px] text-slate-200 leading-relaxed">
                          {language === 'bn'
                            ? 'সুপার অ্যাডমিন বা মুহতামিম কর্তৃক ইস্যুকৃত এককালীন অ্যাক্টিভেশন কোড (মুহতামিম: ACT-MUH-..., শিক্ষক/স্টাফ: ACT-TCH-..., শিক্ষার্থী: ACT-STU-..., অভিভাবক: ACT-GRD-...) ও পাসওয়ার্ড সেট করে পোর্টালে প্রবেশ করুন।'
                            : 'Enter the single-use activation code (Muhtamim: ACT-MUH-..., Teacher: ACT-TCH-..., Student: ACT-STU-..., Guardian: ACT-GRD-...) and set your password.'}
                        </div>

                        <div>
                          <label
                            htmlFor="uqcm-act-code"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn'
                              ? 'এককালীন অ্যাক্টিভেশন কোড (Single-Use Activation Code) *'
                              : 'Single-Use Activation Code *'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <ShieldCheck className="w-4 h-4 text-[#E5B84B] shrink-0" />
                            <input
                              id="uqcm-act-code"
                              type="text"
                              value={actCode}
                              onChange={(e) => setActCode(e.target.value)}
                              placeholder="ACT-MUH-... / ACT-TCH-... / ACT-STU-..."
                              data-testid="act-input-code"
                              className="w-full bg-transparent text-xs sm:text-sm font-mono text-white placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label
                              htmlFor="uqcm-act-secret"
                              className="block text-xs font-semibold text-slate-200 mb-1"
                            >
                              {language === 'bn'
                                ? 'ভেরিফিকেশন মোবাইল / আইডি কোড *'
                                : 'Registered Mobile / ID Code *'}
                            </label>
                            <div className="uqcm-input-shell flex items-center gap-2 px-3 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <input
                                id="uqcm-act-secret"
                                type="text"
                                value={actSecret}
                                onChange={(e) => setActSecret(e.target.value)}
                                placeholder="01711-001122 / UQCM-EMP-01 / UQCM-2026-103"
                                data-testid="act-input-secret"
                                className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="uqcm-act-email"
                              className="block text-xs font-semibold text-slate-200 mb-1"
                            >
                              {language === 'bn'
                                ? 'লগইন ইমেইল (ঐচ্ছিক)'
                                : 'Login Email (Optional)'}
                            </label>
                            <div className="uqcm-input-shell flex items-center gap-2 px-3 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <input
                                id="uqcm-act-email"
                                type="email"
                                value={actEmail}
                                onChange={(e) => setActEmail(e.target.value)}
                                placeholder="student@ummulquran.edu.bd"
                                data-testid="act-input-email"
                                className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="uqcm-act-password"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn'
                              ? 'নতুন গোপন পাসওয়ার্ড সেট করুন (কমপক্ষে ৮ অক্ষর) *'
                              : 'Set New Password (Min 8 chars) *'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                            <input
                              id="uqcm-act-password"
                              type={showRegPassword ? 'text' : 'password'}
                              value={actPassword}
                              onChange={(e) => setActPassword(e.target.value)}
                              placeholder="••••••••••••"
                              data-testid="act-input-password"
                              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword((prev) => !prev)}
                              className="text-slate-400 hover:text-emerald-300 cursor-pointer"
                            >
                              {showRegPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {actFeedback && (
                          <div
                            role="alert"
                            data-testid="act-feedback-box"
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              actFeedback.ok
                                ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-100'
                                : 'bg-rose-950/80 border-rose-400/60 text-rose-200'
                            }`}
                          >
                            <p className="font-bold">{actFeedback.message}</p>
                            {actFeedback.backendNotice && (
                              <p className="text-[11px] text-amber-200/90">
                                {actFeedback.backendNotice}
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          data-testid="act-btn-submit"
                          className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_6px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {language === 'bn'
                              ? 'অ্যাকাউন্ট সক্রিয় করুন ও পোর্টালে প্রবেশ করুন'
                              : 'Activate Account & Enter Portal'}
                          </span>
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
                        <div>
                          <label
                            htmlFor="uqcm-reg-role"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn'
                              ? 'অ্যাকাউন্টের ধরন'
                              : language === 'ar'
                                ? 'نوع الحساب'
                                : 'Account Role'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <UserCheck className="w-4 h-4 text-[#E5B84B] shrink-0" />
                            <select
                              id="uqcm-reg-role"
                              value={regRole}
                              onChange={(e) =>
                                setRegRole(e.target.value as 'student' | 'guardian')
                              }
                              className="w-full bg-[#041220] text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                            >
                              <option value="student">
                                {language === 'bn'
                                  ? 'শিক্ষার্থী (Student Portal)'
                                  : 'Student (শিক্ষার্থী)'}
                              </option>
                              <option value="guardian">
                                {language === 'bn'
                                  ? 'অভিভাবক (Guardian Portal)'
                                  : 'Guardian (অভিভাবক)'}
                              </option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="uqcm-reg-name"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn' ? 'পূর্ণ নাম' : language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <User className="w-4 h-4 text-emerald-400 shrink-0" />
                            <input
                              id="uqcm-reg-name"
                              type="text"
                              value={regFullName}
                              onChange={(e) => setRegFullName(e.target.value)}
                              placeholder={
                                language === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'
                              }
                              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                          {regFieldErrors.fullName && (
                            <p role="alert" className="mt-1 text-xs text-rose-300">
                              {regFieldErrors.fullName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="uqcm-reg-phone"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn' ? 'মোবাইল নম্বর' : language === 'ar' ? 'رقم الجوال' : 'Mobile Number'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                            <input
                              id="uqcm-reg-phone"
                              type="tel"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="01711-223344"
                              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                          {regFieldErrors.phone && (
                            <p role="alert" className="mt-1 text-xs text-rose-300">
                              {regFieldErrors.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="uqcm-reg-id"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn'
                              ? 'ইউজারনেম / স্টুডেন্ট আইডি (অথবা ইমেইল)'
                              : language === 'ar'
                                ? 'رقم الطالب أو البريد الإلكتروني'
                                : 'Student ID / Username or Email'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <input
                              id="uqcm-reg-id"
                              type="text"
                              value={regIdentifier}
                              onChange={(e) => setRegIdentifier(e.target.value)}
                              placeholder="UQCM-2026-101 / email@domain.com"
                              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                          {regFieldErrors.identifier && (
                            <p role="alert" className="mt-1 text-xs text-rose-300">
                              {regFieldErrors.identifier}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="uqcm-reg-password"
                            className="block text-xs font-semibold text-slate-200 mb-1"
                          >
                            {language === 'bn' ? 'পাসওয়ার্ড' : language === 'ar' ? 'كلمة المرور' : 'Password'}
                          </label>
                          <div className="uqcm-input-shell flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                            <input
                              id="uqcm-reg-password"
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword((prev) => !prev)}
                              aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                              className="text-slate-400 hover:text-emerald-300 cursor-pointer"
                            >
                              {showRegPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {regFieldErrors.password && (
                            <p role="alert" className="mt-1 text-xs text-rose-300">
                              {regFieldErrors.password}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSigningIn}
                          className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-sm shadow-[0_6px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <span>
                            {language === 'bn'
                              ? 'আবেদন পাঠান'
                              : language === 'ar'
                                ? 'إرسال الطلب'
                                : 'Submit Request'}
                          </span>
                          <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                        </button>
                      </form>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-800/90 text-center">
                      <button
                        type="button"
                        onClick={() => setScreenState('login')}
                        className="text-xs text-slate-300 hover:text-[#F3D37A] transition-colors cursor-pointer"
                      >
                        {language === 'bn'
                          ? 'আগেই অ্যাকাউন্ট আছে? লগইন করুন'
                          : language === 'ar'
                            ? 'لديك حساب بالفعل؟ تسجيل الدخول'
                            : 'Already have an account? Sign In'}
                      </button>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    VIEW 3: FORGOT PASSWORD SCREEN
                   ========================================================= */}
                {screenState === 'forgot_password' && (
                  <div key="forgot-view" className="relative z-10 animate-uqcm-view">
                    <button
                      type="button"
                      onClick={() => setScreenState('login')}
                      aria-label="Back to login"
                      className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                      <span>{language === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                    </button>

                    <div className="flex flex-col items-center text-center mb-5">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#E5B84B]/25 to-[#10B981]/20 border border-[#E5B84B]/60 flex items-center justify-center shadow-[0_0_25px_rgba(229,184,75,0.25)] mb-3">
                        <Lock className="w-7 h-7 text-[#F3D37A]" />
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        {language === 'bn'
                          ? 'পাসওয়ার্ড ভুলে গেছেন?'
                          : language === 'ar'
                            ? 'نسيت كلمة المرور؟'
                            : 'Forgot Password?'}
                      </h2>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {language === 'bn'
                          ? 'আপনার নিবন্ধিত ইমেইল বা ইউজারনেম দিন, আমরা আপনাকে নতুন পাসওয়ার্ড সেট করতে সাহায্য করব।'
                          : language === 'ar'
                            ? 'أدخل بريدك الإلكتروني المسجل أو اسم المستخدم لمساعدتك في استعادة كلمة المرور.'
                            : 'Enter your registered email or username and we will help you reset your password.'}
                      </p>
                    </div>

                    <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
                      <div>
                        <label htmlFor="uqcm-reset-id" className="sr-only">
                          {language === 'bn' ? 'ইউজারনেম / ইমেইল' : 'Username or Email'}
                        </label>
                        <div className="uqcm-input-shell flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#041220]/90 border border-slate-600/80">
                          <User className="w-4 h-4 text-emerald-400 shrink-0" />
                          <input
                            id="uqcm-reset-id"
                            type="text"
                            value={resetIdentifier}
                            onChange={(e) => setResetIdentifier(e.target.value)}
                            placeholder={
                              language === 'bn'
                                ? 'ইউজারনেম / ইমেইল'
                                : language === 'ar'
                                  ? 'اسم المستخدم / البريد الإلكتروني'
                                  : 'Username / Registered Email'
                            }
                            className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                        {resetFieldError && (
                          <p role="alert" className="mt-1.5 text-xs text-rose-300">
                            {resetFieldError}
                          </p>
                        )}
                      </div>

                      {resetFeedback && (
                        <div
                          role="status"
                          className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            resetFeedback.ok
                              ? 'bg-emerald-950/70 border-emerald-400/50 text-emerald-100'
                              : 'bg-amber-950/70 border-amber-400/50 text-amber-100'
                          }`}
                        >
                          {resetFeedback.message}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-sm shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                      >
                        {language === 'bn'
                          ? 'রিসেট লিংক পাঠান'
                          : language === 'ar'
                            ? 'إرسال رابط الاستعادة'
                            : 'Send Reset Link'}
                      </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-slate-800/90 text-center">
                      <button
                        type="button"
                        onClick={() => setScreenState('login')}
                        className="text-xs sm:text-sm text-slate-300 hover:text-[#F3D37A] transition-colors cursor-pointer"
                      >
                        {language === 'bn'
                          ? 'মনে আছে? লগইন করুন'
                          : language === 'ar'
                            ? 'تذكرت كلمة المرور؟ تسجيل الدخول'
                            : 'Remembered your password? Sign In'}
                      </button>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    VIEW 4: LOADING STATE
                   ========================================================= */}
                {screenState === 'loading' && (
                  <div
                    key="loading-view"
                    role="status"
                    aria-live="polite"
                    className="relative z-10 py-10 flex flex-col items-center justify-center text-center animate-uqcm-view"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center mb-5">
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-r-[#E5B84B] animate-spin" />
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-[#E5B84B]/40 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-[#F3D37A]" />
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-white">
                      {language === 'bn'
                        ? 'লগইন হচ্ছে...'
                        : language === 'ar'
                          ? 'جاري تسجيل الدخول...'
                          : 'Signing in...'}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
                      {language === 'bn'
                        ? 'অনুগ্রহ করে অপেক্ষা করুন'
                        : language === 'ar'
                          ? 'يرجى الانتظار'
                          : 'Please wait while we verify your credentials'}
                    </p>

                    <svg className="w-full h-10 mt-6" viewBox="0 0 300 40" fill="none" aria-hidden="true">
                      <path
                        d="M0 25 Q75 5 150 25 T300 20"
                        stroke="#E5B84B"
                        strokeWidth="2"
                        className="animate-uqcm-trail"
                      />
                      <path
                        d="M0 32 Q75 15 150 32 T300 28"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        className="animate-uqcm-trail-reverse"
                      />
                    </svg>
                  </div>
                )}

                {/* =========================================================
                    VIEW 5: INVALID CREDENTIALS / ERROR STATE (ভুল তথ্য)
                   ========================================================= */}
                {screenState === 'error' && (
                  <div
                    key="error-view"
                    role="alert"
                    className="relative z-10 py-6 flex flex-col items-center text-center animate-uqcm-view"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-rose-500/30 to-rose-900/40 border-2 border-rose-400/70 shadow-[0_0_25px_rgba(244,63,94,0.35)] flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-rose-300" />
                    </div>

                    <h2 className="text-xl font-bold text-white">
                      {errorDisplay?.title ||
                        (language === 'bn'
                          ? 'ভুল তথ্য'
                          : language === 'ar'
                            ? 'بيانات غير صحيحة'
                            : 'Invalid Credentials')}
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xs">
                      {errorDisplay?.message ||
                        (language === 'bn'
                          ? 'আপনার ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।'
                          : language === 'ar'
                            ? 'اسم المستخدم أو كلمة المرور غير صحيحة. حاول مرة أخرى.'
                            : 'Your username or password is incorrect. Please try again.')}
                    </p>

                    {errorDisplay?.technicalNote && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] text-amber-200/90 leading-relaxed">
                        {errorDisplay.technicalNote}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setErrorDisplay(null);
                        setScreenState('login');
                      }}
                      className="mt-6 w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-sm shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                    >
                      {language === 'bn'
                        ? 'আবার চেষ্টা করুন'
                        : language === 'ar'
                          ? 'حاول مرة أخرى'
                          : 'Try Again'}
                    </button>
                  </div>
                )}

                {/* =========================================================
                    VIEW 6: ACCOUNT PENDING APPROVAL STATE
                   ========================================================= */}
                {screenState === 'pending' && (
                  <div
                    key="pending-view"
                    role="status"
                    className="relative z-10 py-5 flex flex-col items-center text-center animate-uqcm-view"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#E5B84B]/30 to-emerald-900/40 border-2 border-[#E5B84B]/70 shadow-[0_0_25px_rgba(229,184,75,0.3)] flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-[#F3D37A]" />
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {language === 'bn'
                        ? 'অ্যাকাউন্ট অনুমোদনের অপেক্ষায়'
                        : language === 'ar'
                          ? 'الحساب قيد المراجعة والاعتماد'
                          : 'Account Pending Approval'}
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xs">
                      {language === 'bn'
                        ? 'আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি। প্রশাসনের সাথে যোগাযোগ করুন।'
                        : language === 'ar'
                          ? 'لم يتم اعتماد حسابك بعد. يرجى التواصل مع إدارة المدرسة.'
                          : 'Your account has not been approved yet. Please contact the Madrasa administration.'}
                    </p>

                    {showPendingDetails && (
                      <div className="mt-3 p-3 rounded-xl bg-[#041220]/90 border border-emerald-500/30 text-start text-xs text-slate-200 space-y-1.5 w-full">
                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {language === 'bn'
                              ? 'আবেদনটি সিস্টেমে নিবন্ধিত হয়েছে'
                              : 'Application recorded in system'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {language === 'bn'
                            ? 'মুহতামিম অথবা সুপার অ্যাডমিন আপনার স্টুডেন্ট আইডি যাচাই করে অনুমোদন দিলে আপনি পোর্টালে সকল তথ্য দেখতে পারবেন।'
                            : 'Once the Muhtamim or Super Admin links and approves your Student ID, full portal access will unlock automatically.'}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowPendingDetails((prev) => !prev)}
                      className="mt-5 w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-sm shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                    >
                      {language === 'bn'
                        ? 'বিস্তারিত দেখুন'
                        : language === 'ar'
                          ? 'عرض التفاصيل'
                          : 'View Details'}
                    </button>

                    <div className="mt-3 flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSignOut) onSignOut();
                          setScreenState('login');
                        }}
                        className="text-xs text-slate-300 hover:text-[#F3D37A] cursor-pointer"
                      >
                        {language === 'bn' ? '← লগইন পেজে ফিরুন' : '← Back to Login'}
                      </button>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    VIEW 7: ACCOUNT SUSPENDED STATE
                   ========================================================= */}
                {screenState === 'suspended' && (
                  <div
                    key="suspended-view"
                    role="alert"
                    className="relative z-10 py-5 flex flex-col items-center text-center animate-uqcm-view"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-rose-600/35 to-amber-900/40 border-2 border-rose-400/70 shadow-[0_0_25px_rgba(244,63,94,0.35)] flex items-center justify-center mb-4">
                      <Ban className="w-8 h-8 text-rose-300" />
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {language === 'bn'
                        ? 'অ্যাকাউন্ট সাময়িকভাবে নিষ্ক্রিয়'
                        : language === 'ar'
                          ? 'تم إيقاف الحساب مؤقتاً'
                          : 'Account Temporarily Suspended'}
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xs">
                      {language === 'bn'
                        ? 'আপনার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ রয়েছে। প্রয়োজনে প্রশাসনের সাথে যোগাযোগ করুন।'
                        : language === 'ar'
                          ? 'حسابك متوقف مؤقتاً. يرجى التواصل مع الإدارة عند الحاجة.'
                          : 'Your account is temporarily deactivated. Please contact the administration office for assistance.'}
                    </p>

                    {showSuspendedContact && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-400/40 text-xs text-rose-100 space-y-1 w-full">
                        <div className="font-bold text-[#F3D37A]">
                          {language === 'bn'
                            ? 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা দপ্তর'
                            : 'Ummul Quran Cadet Madrasa Office'}
                        </div>
                        <div>হেল্পলাইন: +৮৮০ ১৭১১-০০০০০০</div>
                        <div>ইমেইল: info@ummulquranmadrasa.edu.bd</div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowSuspendedContact((prev) => !prev)}
                      className="mt-5 w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#0D9488] hover:from-[#10B981] hover:to-[#059669] active:scale-[0.99] text-white font-bold text-sm shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                    >
                      {language === 'bn'
                        ? 'যোগাযোগ করুন'
                        : language === 'ar'
                          ? 'تواصل مع الإدارة'
                          : 'Contact Administration'}
                    </button>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSignOut) onSignOut();
                          setScreenState('login');
                        }}
                        className="text-xs text-slate-300 hover:text-[#F3D37A] cursor-pointer"
                      >
                        {language === 'bn' ? '← লগইন পেজে ফিরুন' : '← Back to Login'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================================
          4. PRODUCTION INSTITUTIONAL FOOTER & SECURITY TRUST RIBBON
         ===================================================================== */}
      <footer className="relative z-20 w-full border-t border-emerald-500/20 bg-[#030D18]/85 backdrop-blur-md py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-[#F3D37A]">
              {language === 'bn'
                ? 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা · অনুমোদিত রোলভিত্তিক অ্যাক্সেস কন্ট্রোল (RBAC)'
                : 'Ummul Quran Cadet Madrasa · Role-Based Access Governance'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
            <span className="text-emerald-300 font-medium">Secure Access</span>
            <span className="text-[#E5B84B]" aria-hidden="true">
              ·
            </span>
            <span>Responsive Design</span>
            <span className="text-[#E5B84B]" aria-hidden="true">
              ·
            </span>
            <span>বাংলা / English / العربية</span>
            <span className="hidden sm:inline text-slate-500 ms-1">
              ({t.institutionName})
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

