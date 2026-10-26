import React from 'react';
import { AlertTriangle, Globe, X } from 'lucide-react';
import type { Language } from '../types/madrasa';

export function InstitutionalCrest({ className = 'w-11 h-11' }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        {/* Outer Octagonal / Lobed Islamic Emblem Frame */}
        <polygon
          points="32,3 44,8 56,8 56,20 61,32 56,44 56,56 44,56 32,61 20,56 8,56 8,44 3,32 8,20 8,8 20,8"
          fill="#EBF7F1"
          stroke="#0A6847"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <polygon
          points="32,7 42.5,11.5 52.5,11.5 52.5,21.5 57,32 52.5,42.5 52.5,52.5 42.5,52.5 32,57 21.5,52.5 11.5,52.5 11.5,42.5 7,32 11.5,21.5 11.5,11.5 21.5,11.5"
          fill="none"
          stroke="#0A6847"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
        {/* Left & Right Minarets */}
        <rect x="17" y="23" width="3.5" height="21" rx="1" fill="#0A6847" />
        <path d="M16.5 23L18.75 18L21 23H16.5Z" fill="#0A6847" />
        <rect x="43.5" y="23" width="3.5" height="21" rx="1" fill="#0A6847" />
        <path d="M43 23L45.25 18L47.5 23H43Z" fill="#0A6847" />
        {/* Central Mosque Dome */}
        <path
          d="M23 34C23 27.5 27 23 32 20.5C37 23 41 27.5 41 34H23Z"
          fill="#0A6847"
        />
        {/* Crescent finial on top of dome */}
        <line x1="32" y1="16" x2="32" y2="20.5" stroke="#0A6847" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="32" cy="15.5" r="1.3" fill="#D4AF37" />
        {/* Mosque Base & Arched Doorways */}
        <rect x="22" y="34" width="20" height="10" rx="1" fill="#0A6847" />
        <path d="M29.5 44V39C29.5 37.5 30.6 36.5 32 36.5C33.4 36.5 34.5 37.5 34.5 39V44H29.5Z" fill="#EBF7F1" />
        <path d="M24.5 44V40.5C24.5 39.7 25.1 39 26 39C26.9 39 27.5 39.7 27.5 40.5V44H24.5Z" fill="#EBF7F1" />
        <path d="M36.5 44V40.5C36.5 39.7 37.1 39 38 39C38.9 39 39.5 39.7 39.5 40.5V44H36.5Z" fill="#EBF7F1" />
        {/* Open Book Curve Beneath Mosque */}
        <path
          d="M16 46.5C21 45 26.5 45.5 32 47.5C37.5 45.5 43 45 48 46.5"
          stroke="#0A6847"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function PalmGreetingIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={`shrink-0 select-none ${className}`} aria-hidden="true">
      {/* Curved Palm Trunk */}
      <path
        d="M17 32C17.5 25 19.5 19 20 13"
        stroke="#8B5A2B"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M14 32H22" stroke="#108548" strokeWidth="2.5" strokeLinecap="round" />
      {/* Lush Green Palm Fronds */}
      <path
        d="M20 13C15 10 9 11 6 15C10 14 15 14 20 13Z"
        fill="#108548"
      />
      <path
        d="M20 13C14 7 8 6 5 9C9 9 15 10 20 13Z"
        fill="#16A34A"
      />
      <path
        d="M20 13C19 6 15 3 12 4C15 6 18 9 20 13Z"
        fill="#22C55E"
      />
      <path
        d="M20 13C24 7 29 6 32 9C28 9 24 10 20 13Z"
        fill="#16A34A"
      />
      <path
        d="M20 13C26 10 31 11 33 15C29 14 24 14 20 13Z"
        fill="#108548"
      />
      <circle cx="19" cy="14" r="1.5" fill="#D97706" />
      <circle cx="21" cy="14.5" r="1.4" fill="#B45309" />
    </svg>
  );
}

export function AdminAvatarIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div
      className={`relative rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" fill="#E2E8F0" />
        {/* Suit / Sherwani Shoulders */}
        <path d="M6 40C6 31.5 12 27.5 20 27.5C28 27.5 34 31.5 34 40H6Z" fill="#1E293B" />
        {/* White Collar & Tie */}
        <path d="M16 27.5L20 34L24 27.5H16Z" fill="#FFFFFF" />
        <path d="M19.2 30L20 37L20.8 30H19.2Z" fill="#0A6847" />
        {/* Head & Neck */}
        <rect x="17.5" y="23" width="5" height="5" fill="#D9A074" />
        <circle cx="20" cy="17" r="7" fill="#E6B38A" />
        {/* Hair / Cap & Neat Beard */}
        <path d="M13 15C13 10.8 16 8.5 20 8.5C24 8.5 27 10.8 27 15C25.5 13 23 12 20 12C17 12 14.5 13 13 15Z" fill="#1E293B" />
        <path d="M13.5 18.5C13.5 22.5 16.3 25 20 25C23.7 25 26.5 22.5 26.5 18.5C25.5 20.5 23 22 20 22C17 22 14.5 20.5 13.5 18.5Z" fill="#1E293B" />
        {/* Eyes */}
        <circle cx="17.5" cy="16.5" r="0.9" fill="#0F172A" />
        <circle cx="22.5" cy="16.5" r="0.9" fill="#0F172A" />
      </svg>
    </div>
  );
}

export function SidebarScenicFooter({ language }: { language: Language }) {
  const quoteText =
    language === 'bn'
      ? 'শিক্ষা ঈমানের আলোকবর্তিকা'
      : language === 'ar'
        ? 'العلم نور الإيمان'
        : 'Education is the Light of Faith';

  return (
    <div className="relative w-full pt-4 overflow-hidden select-none">
      {/* Inspirational Quote Overlay */}
      <div className="px-4 pb-2 text-center relative z-10">
        <p className="text-xs font-semibold text-emerald-50/95 leading-snug tracking-wide drop-shadow-xs">
          {quoteText}
        </p>
      </div>

      {/* Scenic Madrasa & River Boat SVG Artwork */}
      <svg viewBox="0 0 260 135" fill="none" className="w-full h-auto block">
        <defs>
          <linearGradient id="skyGlow" x1="130" y1="0" x2="130" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#063B27" stopOpacity="0" />
            <stop offset="55%" stopColor="#0E5A3B" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#1E824C" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="130" y1="98" x2="130" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#097969" />
            <stop offset="50%" stopColor="#064E40" />
            <stop offset="100%" stopColor="#032B21" />
          </linearGradient>
        </defs>

        {/* Soft Horizon Glow */}
        <rect x="0" y="0" width="260" height="105" fill="url(#skyGlow)" />
        <circle cx="175" cy="68" r="38" fill="#4ADE80" fillOpacity="0.14" />

        {/* Distant Mosque Silhouette on Right */}
        <g opacity="0.88">
          {/* Minarets */}
          <rect x="136" y="42" width="4" height="56" fill="#0A4D31" />
          <path d="M135 42L138 33L141 42H135Z" fill="#15803D" />
          <rect x="218" y="36" width="4.5" height="62" fill="#0A4D31" />
          <path d="M217 36L220.25 26L223.5 36H217Z" fill="#15803D" />
          <rect x="242" y="48" width="3.5" height="50" fill="#0A4D31" />
          <path d="M241 48L243.75 40L246.5 48H241Z" fill="#15803D" />

          {/* Main Mosque Dome */}
          <path d="M154 75C154 56 166 44 180 39C194 44 206 56 206 75H154Z" fill="#0D5C3A" />
          <line x1="180" y1="31" x2="180" y2="39" stroke="#4ADE80" strokeWidth="1.5" />
          {/* Secondary Dome */}
          <path d="M198 80C198 68 205 61 213 58C221 61 228 68 228 80H198Z" fill="#09482D" />
          {/* Mosque Building Base */}
          <rect x="132" y="75" width="120" height="24" fill="#073B25" />
          {/* Glowing Arch Windows */}
          <rect x="166" y="81" width="5" height="9" rx="2.5" fill="#A7F3D0" fillOpacity="0.6" />
          <rect x="177" y="79" width="6" height="11" rx="3" fill="#FEF08A" fillOpacity="0.75" />
          <rect x="189" y="81" width="5" height="9" rx="2.5" fill="#A7F3D0" fillOpacity="0.6" />
        </g>

        {/* Lush Riverbank Foliage */}
        <path d="M0 98Q45 86 98 98H0Z" fill="#0D5C3A" />
        <path d="M115 98Q185 88 260 98H115Z" fill="#063521" />

        {/* Left Palm Trees */}
        <path d="M18 96C22 72 28 50 35 28" stroke="#042617" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M35 28C23 22 12 24 6 31C15 28 25 28 35 28Z" fill="#15803D" />
        <path d="M35 28C24 16 14 14 8 19C17 19 26 22 35 28Z" fill="#22C55E" />
        <path d="M35 28C36 16 30 9 24 10C29 14 33 20 35 28Z" fill="#4ADE80" />
        <path d="M35 28C45 18 55 18 60 23C51 22 43 24 35 28Z" fill="#22C55E" />
        <path d="M35 28C46 25 56 28 60 35C51 32 43 30 35 28Z" fill="#15803D" />

        {/* Second Smaller Palm Tree */}
        <path d="M8 96C14 78 22 65 30 52" stroke="#042617" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M30 52C21 48 13 50 9 55C16 53 23 53 30 52Z" fill="#16A34A" />
        <path d="M30 52C38 46 46 47 50 52C43 50 36 50 30 52Z" fill="#22C55E" />

        {/* River Water Surface */}
        <rect x="0" y="97" width="260" height="38" fill="url(#waterGrad)" />

        {/* Water Shimmer & Ripples */}
        <path d="M12 106H72" stroke="#34D399" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M25 113H95" stroke="#6EE7B7" strokeWidth="1.5" strokeOpacity="0.65" strokeLinecap="round" />
        <path d="M10 121H115" stroke="#A7F3D0" strokeWidth="1.3" strokeOpacity="0.55" strokeLinecap="round" />
        <path d="M40 128H140" stroke="#34D399" strokeWidth="1.2" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M155 108H235" stroke="#34D399" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
        <path d="M170 118H245" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />

        {/* Traditional Wooden Houseboat (Kettuvallam / Bajra) on Left-Center */}
        <g transform="translate(26, 74)">
          {/* Woven Arched Canopy Roof */}
          <path
            d="M12 20C14 8 28 5 42 5C56 5 66 9 69 20H12Z"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <path
            d="M18 20C20 11 30 8 42 8C54 8 61 11 63 20H18Z"
            fill="#D97706"
          />
          {/* Warm Lantern Glow Inside Boat */}
          <rect x="33" y="13" width="16" height="7" rx="2" fill="#FEF08A" fillOpacity="0.85" />
          <line x1="41" y1="13" x2="41" y2="20" stroke="#92400E" strokeWidth="1" />
          {/* Wooden Hull */}
          <path
            d="M2 19L10 27H74L84 17C72 20 58 20 42 20C24 20 12 20 2 19Z"
            fill="#78350F"
          />
          <path d="M6 21H77" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.7" />
        </g>
      </svg>
    </div>
  );
}

export function LanguageSwitcher({
  language,
  onChange,
  variant = 'light',
  compact = false,
}: {
  language: Language;
  onChange: (lang: Language) => void;
  variant?: 'light' | 'dark' | 'menu';
  compact?: boolean;
}) {
  const options: { id: Language; label: string; shortLabel: string }[] = [
    { id: 'bn', label: 'বাংলা', shortLabel: 'বাং' },
    { id: 'en', label: 'English', shortLabel: 'EN' },
    { id: 'ar', label: 'العربية', shortLabel: 'ع' },
  ];

  if (variant === 'menu') {
    return (
      <div
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#042B1C]/80 border border-emerald-800/50 text-emerald-50/90"
        role="group"
        aria-label="Language Selector"
      >
        <span className="flex items-center gap-2.5 min-w-0 text-xs font-medium text-emerald-100/90">
          <Globe className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
          <span className="truncate">
            {language === 'bn' ? 'ভাষা' : language === 'ar' ? 'اللغة' : 'Language'}
          </span>
        </span>
        <div className="inline-flex items-center gap-0.5 bg-[#063B27] p-0.5 rounded-md border border-emerald-700/60 shrink-0">
          {options.map((opt) => {
            const active = language === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                title={opt.label}
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#E5C158] text-slate-950 font-bold shadow-2xs'
                    : 'text-emerald-100/80 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const baseBg =
    variant === 'dark'
      ? 'bg-[#042B1C] border border-emerald-800/70 text-emerald-100'
      : 'bg-slate-100 border border-slate-200/90 text-slate-700';

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${
        compact ? 'p-0.5 rounded-md' : 'p-1 rounded-lg'
      } ${baseBg}`}
      role="group"
      aria-label="Language Selector"
    >
      <Globe className={`${compact ? 'w-3 h-3 mx-1' : 'w-3.5 h-3.5 mx-1.5'} opacity-75 shrink-0`} />
      {options.map((opt) => {
        const active = language === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.label}
            className={`${
              compact ? 'px-1.5 py-0.5 text-[10px] rounded' : 'px-2 py-0.5 text-[11px] rounded-md'
            } font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? variant === 'dark'
                  ? 'bg-[#E5C158] text-slate-950 font-semibold'
                  : 'bg-[#063B27] text-white font-semibold shadow-2xs'
                : variant === 'dark'
                  ? 'text-emerald-100/80 hover:text-white'
                  : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            {compact ? opt.shortLabel : opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-900">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || String(error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 text-red-700 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-semibold">Application Security / Runtime Alert</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              An operation was blocked by security rules or encountered an unexpected error:
            </p>
            <pre className="text-xs font-mono bg-stone-100 p-3 rounded-lg overflow-x-auto text-slate-800 mb-4">
              {this.state.errorMessage}
            </pre>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 text-xs font-semibold bg-[#063B27] text-white rounded-lg hover:bg-emerald-950"
            >
              Return to Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
