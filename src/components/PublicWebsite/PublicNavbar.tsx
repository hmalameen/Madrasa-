import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  FileText,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Info,
  Layers,
  LogIn,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type { InstitutionSettings, Language } from '../../types/madrasa';
import { InstitutionalCrest } from '../InstitutionalCrest';

export type PublicPagePath =
  | '/'
  | '/about'
  | '/academic'
  | '/departments'
  | '/teachers'
  | '/administration'
  | '/admission'
  | '/notices'
  | '/events'
  | '/gallery'
  | '/contact';

export type PublicRoutePath = PublicPagePath;

export interface PublicNavbarProps {
  activePath: PublicPagePath;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  settings: InstitutionSettings;
  isAuthenticated: boolean;
  onNavigatePage: (page: PublicPagePath) => void;
  onOpenLoginPortal: () => void;
  onOpenOnlineAdmission: () => void;
  onEnterManagementPortal: () => void;
}

interface NavItemConfig {
  path: PublicPagePath;
  labelBn: string;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'primary' | 'secondary';
}

export const PUBLIC_NAV_ITEMS: NavItemConfig[] = [
  {
    path: '/',
    labelBn: 'হোম',
    labelEn: 'Home',
    labelAr: 'الرئيسية',
    icon: Home,
    group: 'primary',
  },
  {
    path: '/about',
    labelBn: 'পরিচিতি',
    labelEn: 'About',
    labelAr: 'عن المدرسة',
    icon: Info,
    group: 'primary',
  },
  {
    path: '/academic',
    labelBn: 'একাডেমিক',
    labelEn: 'Academic',
    labelAr: 'الأكاديمية',
    icon: BookOpen,
    group: 'primary',
  },
  {
    path: '/departments',
    labelBn: 'বিভাগসমূহ',
    labelEn: 'Departments',
    labelAr: 'الأقسام',
    icon: Layers,
    group: 'primary',
  },
  {
    path: '/admission',
    labelBn: 'ভর্তি তথ্য',
    labelEn: 'Admission',
    labelAr: 'القبول والتسجيل',
    icon: GraduationCap,
    group: 'primary',
  },
  {
    path: '/notices',
    labelBn: 'নোটিশ',
    labelEn: 'Notices',
    labelAr: 'الإعلانات',
    icon: FileText,
    group: 'primary',
  },
  {
    path: '/contact',
    labelBn: 'যোগাযোগ',
    labelEn: 'Contact',
    labelAr: 'اتصل بنا',
    icon: Phone,
    group: 'primary',
  },
  {
    path: '/teachers',
    labelBn: 'শিক্ষকমণ্ডলী',
    labelEn: 'Teachers',
    labelAr: 'هيئة التدريس',
    icon: Users,
    group: 'secondary',
  },
  {
    path: '/administration',
    labelBn: 'প্রশাসন',
    labelEn: 'Administration',
    labelAr: 'الإدارة',
    icon: UserCheck,
    group: 'secondary',
  },
  {
    path: '/events',
    labelBn: 'ইভেন্ট ও সংবাদ',
    labelEn: 'Events',
    labelAr: 'الفعاليات',
    icon: Calendar,
    group: 'secondary',
  },
  {
    path: '/gallery',
    labelBn: 'গ্যালারি',
    labelEn: 'Gallery',
    labelAr: 'معرض الصور',
    icon: ImageIcon,
    group: 'secondary',
  },
];

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  activePath,
  language,
  onLanguageChange,
  settings,
  isAuthenticated,
  onNavigatePage,
  onOpenLoginPortal,
  onOpenOnlineAdmission,
  onEnterManagementPortal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isRtl = language === 'ar';

  const getLabel = (item: NavItemConfig) => {
    if (language === 'bn') return item.labelBn;
    if (language === 'ar') return item.labelAr;
    return item.labelEn;
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [activePath]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const primaryItems = PUBLIC_NAV_ITEMS.filter((item) => item.group === 'primary');
  const secondaryItems = PUBLIC_NAV_ITEMS.filter((item) => item.group === 'secondary');
  const isSecondaryActive = secondaryItems.some((item) => item.path === activePath);

  const institutionTitle =
    language === 'bn'
      ? settings.institutionNameBn || 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা'
      : language === 'ar'
        ? settings.institutionNameAr || 'مدرسة أم القرآن كاديت الإسلامية'
        : settings.institutionNameEn || 'Ummul Quran Cadet Madrasa';

  const institutionSubtitle =
    language === 'bn'
      ? 'কুরআন, সুন্নাহ ও আধুনিক শিক্ষার সমন্বিত দ্বীনি শিক্ষাপ্রতিষ্ঠান'
      : language === 'ar'
        ? 'القرآن والسنة والتعليم الحديث المتكامل'
        : 'Integrated Quranic, Sunnah & Modern Cadet Education';

  return (
    <header
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="public-sticky-navbar"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#061326]/98 border-b border-[#D9B64C]/35 shadow-[0_18px_42px_-14px_rgba(4,10,20,0.88)] backdrop-blur-xl'
          : 'bg-[#061326]/95 border-b border-[#D9B64C]/22 shadow-[0_10px_30px_-15px_rgba(4,10,20,0.65)] backdrop-blur-md'
      }`}
    >
      {/* Top Champagne-Gold Hairline Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D9B64C]/70 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[72px] sm:min-h-[82px] gap-2 sm:gap-4">
          {/* 1. Institutional Logo & Brand Identity */}
          <button
            type="button"
            onClick={() => onNavigatePage('/')}
            data-testid="public-brand-home-btn"
            className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C] rounded-xl py-1 min-w-0 cursor-pointer"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#F7F4EC] to-[#E8D58A] p-0.5 shadow-[0_6px_20px_rgba(217,182,76,0.28)] ring-1 ring-[#D9B64C]/60 shrink-0 transition-transform duration-200 group-hover:scale-[1.03] flex items-center justify-center">
              <InstitutionalCrest className="w-10 h-10 sm:w-11 sm:h-11" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display-bn text-sm sm:text-base lg:text-[17px] font-bold tracking-tight text-[#F7F4EC] group-hover:text-[#E8D58A] transition-colors truncate">
                  {institutionTitle}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#E8D58A]/80 truncate max-w-[195px] sm:max-w-[290px] xl:max-w-[330px]">
                {institutionSubtitle}
              </p>
            </div>
          </button>

          {/* 2. Desktop Primary Navigation + Campus Dropdown */}
          <nav
            aria-label="Primary Navigation"
            className="hidden xl:flex items-center gap-0.5 bg-[#0A1B33]/90 border border-[#D9B64C]/20 rounded-xl p-1 shadow-inner"
          >
            {primaryItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigatePage(item.path)}
                  data-testid={`public-nav-link-${item.path === '/' ? 'home' : item.path.slice(1)}`}
                  className={`relative px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C] ${
                    isActive
                      ? 'bg-gradient-to-b from-[#D9B64C] to-[#C49E35] text-[#061326] font-bold shadow-[0_4px_14px_rgba(217,182,76,0.32)]'
                      : 'text-[#F7F4EC]/85 hover:text-[#E8D58A] hover:bg-white/[0.06]'
                  }`}
                >
                  {getLabel(item)}
                </button>
              );
            })}

            {/* Secondary items dropdown (Teachers, Administration, Events, Gallery) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen((prev) => !prev)}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
                data-testid="public-nav-more-dropdown-btn"
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C] ${
                  isSecondaryActive || moreDropdownOpen
                    ? 'bg-gradient-to-b from-[#D9B64C] to-[#C49E35] text-[#061326] font-bold shadow-[0_4px_14px_rgba(217,182,76,0.32)]'
                    : 'text-[#F7F4EC]/85 hover:text-[#E8D58A] hover:bg-white/[0.06]'
                }`}
              >
                <span>
                  {language === 'bn'
                    ? 'ক্যাম্পাস ও প্রশাসন'
                    : language === 'ar'
                      ? 'الحرم والإدارة'
                      : 'Campus & People'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {moreDropdownOpen && (
                <div
                  data-testid="public-nav-dropdown-menu"
                  className={`absolute ${
                    isRtl ? 'left-0' : 'right-0'
                  } mt-2.5 w-60 rounded-xl bg-[#0A1B33] border border-[#D9B64C]/35 shadow-[0_24px_48px_rgba(4,10,20,0.92)] py-2 z-50 backdrop-blur-xl`}
                >
                  <div className="px-3.5 py-1.5 border-b border-[#D9B64C]/15 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E8D58A]/75">
                      {language === 'bn'
                        ? 'প্রাতিষ্ঠানিক পাতা'
                        : language === 'ar'
                          ? 'صفحات المؤسسة'
                          : 'Institutional Directory'}
                    </span>
                  </div>
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePath === item.path;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          onNavigatePage(item.path);
                          setMoreDropdownOpen(false);
                        }}
                        data-testid={`public-nav-dropdown-link-${item.path.slice(1)}`}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#D9B64C]/20 text-[#E8D58A] border-s-2 border-[#D9B64C]'
                            : 'text-[#F7F4EC]/85 hover:bg-white/[0.06] hover:text-[#E8D58A]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#D9B64C] shrink-0" />
                        <span>{getLabel(item)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* 3. Language Switcher + Online Admission CTA + Portal Login CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div
              role="group"
              aria-label="Language Switcher"
              className="flex items-center bg-[#0A1B33] p-0.5 rounded-lg border border-[#D9B64C]/25"
            >
              {(['bn', 'en', 'ar'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onLanguageChange(lang)}
                  data-testid={`public-lang-switch-${lang}`}
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D9B64C] ${
                    language === lang
                      ? 'bg-[#D9B64C] text-[#061326] shadow-sm'
                      : 'text-[#F7F4EC]/80 hover:text-[#E8D58A]'
                  }`}
                >
                  {lang === 'bn' ? 'বাংলা' : lang === 'en' ? 'EN' : 'عربي'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenOnlineAdmission}
              data-testid="public-nav-admission-cta"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/45 shadow-[0_8px_20px_-6px_rgba(8,122,89,0.65)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8D58A]" />
              <span>
                {language === 'bn'
                  ? 'অনলাইন ভর্তি'
                  : language === 'ar'
                    ? 'التسجيل الإلكتروني'
                    : 'Online Admission'}
              </span>
            </button>

            <button
              type="button"
              onClick={isAuthenticated ? onEnterManagementPortal : onOpenLoginPortal}
              data-testid="public-nav-portal-btn"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-b from-[#E8D58A] to-[#D9B64C] hover:from-[#F2E2A2] hover:to-[#DFBC52] text-[#061326] shadow-[0_8px_22px_-6px_rgba(217,182,76,0.45)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D58A]"
            >
              {isAuthenticated ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#061326]" />
                  <span>
                    {language === 'bn'
                      ? 'ড্যাশবোর্ড'
                      : language === 'ar'
                        ? 'لوحة التحكم'
                        : 'Dashboard'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-[#061326]" />
                  <span>
                    {language === 'bn'
                      ? 'পোর্টাল লগইন'
                      : language === 'ar'
                        ? 'دخول البوابة'
                        : 'Portal Login'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              data-testid="public-mobile-menu-toggle"
              className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#0A1B33] border border-[#D9B64C]/35 text-[#E8D58A] hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          data-testid="public-mobile-drawer"
          className="xl:hidden border-t border-[#D9B64C]/25 bg-[#061326]/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 shadow-[0_28px_60px_rgba(0,0,0,0.85)]"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    onNavigatePage(item.path);
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`public-mobile-nav-link-${
                    item.path === '/' ? 'home' : item.path.slice(1)
                  }`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D9B64C] to-[#C69F34] text-[#061326] font-bold shadow-md'
                      : 'bg-[#0A1B33]/90 text-[#F7F4EC]/90 border border-[#D9B64C]/18 hover:border-[#D9B64C]/40'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#061326]' : 'text-[#D9B64C]'
                    }`}
                  />
                  <span className="truncate">{getLabel(item)}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#D9B64C]/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOnlineAdmission();
              }}
              data-testid="public-mobile-admission-cta"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/40 shadow-md cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#E8D58A]" />
              <span>
                {language === 'bn'
                  ? 'অনলাইন ভর্তি আবেদন'
                  : language === 'ar'
                    ? 'طلب القبول عبر الإنترنت'
                    : 'Apply for Online Admission'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (isAuthenticated) {
                  onEnterManagementPortal();
                } else {
                  onOpenLoginPortal();
                }
              }}
              data-testid="public-mobile-portal-btn"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E8D58A] to-[#D9B64C] text-[#061326] shadow-md cursor-pointer"
            >
              {isAuthenticated ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? 'ম্যানেজমেন্ট ড্যাশবোর্ডে প্রবেশ'
                      : language === 'ar'
                        ? 'الدخول إلى لوحة الإدارة'
                        : 'Open Management Dashboard'}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? 'শিক্ষার্থী / অভিভাবক / স্টাফ লগইন'
                      : language === 'ar'
                        ? 'دخول الطلاب وأولياء الأمور والموظفين'
                        : 'Student / Guardian / Staff Login'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
