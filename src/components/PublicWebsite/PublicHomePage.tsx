import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type {
  BannerSlide,
  ExaminationSetup,
  HomepageSectionId,
  InstitutionSettings,
  Language,
  Notice,
  WebsiteCmsConfig,
} from '../../types/madrasa';
import { InstitutionalCrest } from '../InstitutionalCrest';
import { QuranRehalScene3D } from './QuranRehalScene3D';
import { PublicNavbar, PublicPagePath } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import {
  getPublishedContactFooter,
  getPublishedGalleryItems,
  getPublishedHomepageSections,
  getPublishedPublicEvents,
  getPublishedPublicNotices,
  getPublishedPublicProfiles,
} from '../../utils/websiteCmsLogic';

export interface PublicHomePageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  settings: InstitutionSettings;
  notices: Notice[];
  bannerSlides: BannerSlide[];
  examSetups: ExaminationSetup[];
  cmsConfig?: WebsiteCmsConfig | null;
  cmsLoadStatus?: 'loading' | 'loaded' | 'empty' | 'error' | 'ready';
  cmsLoadError?: string | null;
  onRetryLoadCms?: () => void;
  isAuthenticated: boolean;
  onOpenLoginPortal: () => void;
  onOpenOnlineAdmission: () => void;
  onEnterManagementPortal: () => void;
  onNavigatePage?: (page: PublicPagePath) => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  language,
  onLanguageChange,
  settings,
  notices,
  bannerSlides,
  cmsConfig,
  cmsLoadStatus = 'ready',
  cmsLoadError = null,
  onRetryLoadCms,
  isAuthenticated,
  onOpenLoginPortal,
  onOpenOnlineAdmission,
  onEnterManagementPortal,
  onNavigatePage,
}) => {
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const isRtl = language === 'ar';

  const navigateTo = (path: PublicPagePath) => {
    if (onNavigatePage) {
      onNavigatePage(path);
    } else if (path === '/admission') {
      onOpenOnlineAdmission();
    }
  };

  // Published CMS Data Selectors
  const cmsSectionsRecord = getPublishedHomepageSections(cmsConfig);
  const getSection = (id: HomepageSectionId) => cmsSectionsRecord[id];
  const isSectionVisible = (id: HomepageSectionId) => {
    const found = getSection(id);
    return found ? found.visible : true;
  };

  const heroSection = getSection('hero');
  const introSection = getSection('intro');
  const muhtamimSection = getSection('muhtamim_message');
  const admissionSection = getSection('admission_highlights');

  const publishedNotices = getPublishedPublicNotices(notices).slice(0, 5);
  const publishedEvents = getPublishedPublicEvents(cmsConfig, bannerSlides).slice(0, 4);
  const publishedGallery = getPublishedGalleryItems(cmsConfig).slice(0, 6);
  const publishedTeachers = getPublishedPublicProfiles(cmsConfig, 'teacher').slice(0, 4);
  const publishedAdmins = getPublishedPublicProfiles(cmsConfig, 'administration').slice(0, 4);
  const cmsContact = getPublishedContactFooter(cmsConfig, settings);

  const selectedGalleryItem =
    publishedGallery.find((item) => item.id === selectedGalleryId) || null;

  const pickLang = (bn?: string, en?: string, ar?: string, fallback = '') => {
    if (language === 'bn') return bn || en || fallback;
    if (language === 'ar') return ar || en || bn || fallback;
    return en || bn || fallback;
  };

  const departmentStreams = [
    {
      code: 'NOORANI',
      badgeBn: 'প্রাথমিক বুনিয়াদ',
      badgeEn: 'Foundational Stage',
      badgeAr: 'المرحلة التأسيسية',
      titleBn: 'নূরানী ও মক্তব বিভাগ',
      titleEn: 'Noorani & Foundational Maktab',
      titleAr: 'القسم النوراني والكتاتيب التأسيسية',
      descBn:
        'শিশুদের জন্য মাখরাজ ও তাজবীদসহ বিশুদ্ধ কুরআন শিক্ষার প্রাথমিক ভিত্তি, মাসনূন দোয়া, নামাজের বাস্তব প্রশিক্ষণ এবং বাংলা-ইংরেজি-গণিতের প্রারম্ভিক পাঠ।',
      descEn:
        'Early childhood Quranic phonetics (Makhraj & Tajweed), daily Prophetic supplications, practical Salah training, and foundational literacy in Bengali, English, and Mathematics.',
      descAr:
        'تأسيس الأطفال في مخارج الحروف والتجويد والأدعية المأثورة والتدريب العملي على الصلاة مع مبادئ اللغات والرياضيات.',
      curriculumBn: 'কায়দা · আমপারা · মাসনূন দোয়া · প্রাক-প্রাথমিক সাধারণ শিক্ষা',
      curriculumEn: 'Qaida · Ampara · Masnoon Duas · Early General Subjects',
      curriculumAr: 'القاعدة النورانية · جزء عم · الأدعية · المواد الأساسية',
    },
    {
      code: 'NAZERA',
      badgeBn: 'বিশুদ্ধ তিলাওয়াত',
      badgeEn: 'Fluent Recitation',
      badgeAr: 'التلاوة المتقنة',
      titleBn: 'নাজেরা ও তাজবীদ বিভাগ',
      titleEn: 'Nazera & Applied Tajweed Department',
      titleAr: 'قسم الناظرة والتجويد التطبيقي',
      descBn:
        'হিফজুল কুরআন শুরুর পূর্বে পূর্ণ কুরআন মাজীদ তারতীল ও তাজবীদের নিয়ম অনুসরণ করে দেখে দেখে সাবলীলভাবে তিলাওয়াত সম্পন্ন করার বিশেষায়িত স্তর।',
      descEn:
        'Intensive sight-recitation of the complete Holy Quran with Tartil and applied Tajweed rules, preparing students thoroughly for Hifzul Quran.',
      descAr:
        'إتقان تلاوة المصحف الشريف كاملاً بالترتيل وأحكام التجويد العملية تمهيداً لمرحلة الحفظ المتقن.',
      curriculumBn: 'পূর্ণ কুরআন নাজেরা · তাজবীদ ও মাখরাজ · ইসলামি আদব ও আখলাক',
      curriculumEn: 'Complete Sight Recitation · Applied Tajweed · Islamic Etiquette',
      curriculumAr: 'تلاوة المصحف كاملاً · أحكام التجويد · الآداب الإسلامية',
    },
    {
      code: 'HIFZ',
      badgeBn: 'কুরআন হিফজ',
      badgeEn: 'Sacred Memorization',
      badgeAr: 'تحفيظ القرآن الكريم',
      titleBn: 'হিফজুল কুরআন বিভাগ',
      titleEn: 'International Standard Hifzul Quran',
      titleAr: 'قسم تحفيظ القرآن الكريم بالمعايير الدولية',
      descBn:
        'অভিজ্ঞ হাফেজ ও কারী উস্তাদদের নিবিড় তত্ত্বাবধানে সবক, সাতসবক ও আমুখতার নিয়মতান্ত্রিক পদ্ধতিতে পূর্ণ ৩০ পারা কুরআন মাজীদ হিফজ ও শুনানি।',
      descEn:
        'Structured memorization of all 30 Juz through daily Sabaq, Sabqi, and Manzil revision cycles under the close mentorship of qualified Huffaz and Qaris.',
      descAr:
        'حفظ القرآن الكريم كاملاً عبر نظام السبق والسبقي والمراجعة اليومية بإشراف نخبة من الحفاظ المتقنين.',
      curriculumBn: 'সবক · সাতসবক · আমুখতা · লাহজা ও তিলাওয়াত অনুশীলন',
      curriculumEn: 'Sabaq · Sabqi · Manzil Revision · Melodious Recitation',
      curriculumAr: 'الدرس الجديد · المراجعة القريبة · المراجعة البعيدة · تحسين الأداء',
    },
    {
      code: 'KITAB',
      badgeBn: 'উচ্চতর দ্বীনি শিক্ষা',
      badgeEn: 'Classical Islamic Sciences',
      badgeAr: 'العلوم الشرعية والعربية',
      titleBn: 'কিতাব ও আলিয়া সমন্বিত বিভাগ',
      titleEn: 'Kitab, Arabic & Alia Integrated Stream',
      titleAr: 'قسم العلوم الشرعية واللغة العربية المتكامل',
      descBn:
        'আরবি ভাষা, নাহু-সরফ, ফিকহ, উসূলুল ফিকহ, হাদীস ও তাফসীরের মৌলিক কিতাবসমূহ অধ্যয়নের পাশাপাশি বোর্ড কারিকুলামের সমন্বিত একাডেমিক পাঠদান।',
      descEn:
        'In-depth study of Arabic grammar (Nahw & Sarf), Fiqh, Hadith, and Tafsir integrated harmoniously with recognized academic board subjects.',
      descAr:
        'دراسة النحو والصرف والفقه وأصوله والحديث والتفسير جنباً إلى جنب مع المناهج الدراسية المعتمدة.',
      curriculumBn: 'আরবি সাহিত্য · ফিকহ ও হাদীস · তাফসীর · সমন্বিত বোর্ড পাঠ্যক্রম',
      curriculumEn: 'Arabic Grammar · Fiqh & Hadith · Tafsir · Board Curriculum',
      curriculumAr: 'اللغة العربية · الفقه والحديث · التفسير · المنهج المعتمد',
    },
    {
      code: 'GENERAL',
      badgeBn: 'ক্যাডেট ও আধুনিক শিক্ষা',
      badgeEn: 'Cadet & Modern Academics',
      badgeAr: 'التعليم الأكاديمي الحديث',
      titleBn: 'ক্যাডেট ও জেনারেল শিক্ষা বিভাগ',
      titleEn: 'Cadet Discipline & General Education',
      titleAr: 'قسم التعليم العام والانضباط الطلابي',
      descBn:
        'জাতীয় শিক্ষাক্রমের আলোকে বাংলা, ইংরেজি, গণিত, বিজ্ঞান ও তথ্যপ্রযুক্তি বিষয়ে দক্ষতা অর্জনের সাথে ইসলামি অনুশাসন ও ক্যাডেট শৃঙ্খলার সমন্বয়।',
      descEn:
        'Comprehensive instruction in Bengali, English, Mathematics, Science, and ICT aligned with national standards within a disciplined Islamic cadet environment.',
      descAr:
        'تدريس اللغات والرياضيات والعلوم وتقنية المعلومات وفق المعايير الوطنية في بيئة تربوية إسلامية منضبطة.',
      curriculumBn: 'বাংলা · ইংরেজি · গণিত · বিজ্ঞান ও আইসিটি · ক্যাডেট শৃঙ্খলা',
      curriculumEn: 'Bengali · English · Mathematics · Science & ICT · Cadet Etiquette',
      curriculumAr: 'اللغات · الرياضيات · العلوم والحاسوب · الانضباط التربوي',
    },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="public-cinematic-homepage"
      className="min-h-screen bg-[#F7F4EC] text-[#122033] flex flex-col selection:bg-[#087A59] selection:text-[#F7F4EC] overflow-x-hidden"
    >
      {/* Sticky Royal Islamic Luxury Navigation Bar */}
      <PublicNavbar
        activePath="/"
        language={language}
        onLanguageChange={onLanguageChange}
        settings={settings}
        isAuthenticated={isAuthenticated}
        onNavigatePage={navigateTo}
        onOpenLoginPortal={onOpenLoginPortal}
        onOpenOnlineAdmission={onOpenOnlineAdmission}
        onEnterManagementPortal={onEnterManagementPortal}
      />

      {/* Non-blocking CMS Sync Status Banner */}
      {(cmsLoadStatus === 'loading' || cmsLoadStatus === 'error') && (
        <div
          data-testid={
            cmsLoadStatus === 'loading' ? 'public-cms-loading-state' : 'public-cms-error-state'
          }
          className={`w-full px-4 py-2 text-xs font-medium border-b transition-colors ${
            cmsLoadStatus === 'error'
              ? 'bg-[#2A1215] text-[#F7F4EC] border-[#D9B64C]/30'
              : 'bg-[#0A1B33] text-[#E8D58A] border-[#D9B64C]/20'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <span>
              {cmsLoadStatus === 'loading'
                ? pickLang(
                    'প্রকাশিত ওয়েবসাইট তথ্য সিঙ্ক হচ্ছে...',
                    'Synchronizing published institutional content...',
                    'جاري مزامنة محتوى الموقع المنشور...'
                  )
                : cmsLoadError ||
                  pickLang(
                    'সর্বশেষ প্রকাশিত তথ্য লোড করতে সমস্যা হয়েছে। সংরক্ষিত সংস্করণ প্রদর্শিত হচ্ছে।',
                    'Could not refresh latest published updates. Showing verified cached content.',
                    'تعذر تحديث أحدث البيانات المنشورة. يتم عرض النسخة المحفوظة.'
                  )}
            </span>
            {cmsLoadStatus === 'error' && onRetryLoadCms && (
              <button
                type="button"
                onClick={onRetryLoadCms}
                data-testid="public-cms-retry-btn"
                className="px-3 py-1 rounded-md bg-[#D9B64C] text-[#061326] font-bold hover:bg-[#E8D58A] transition-colors cursor-pointer shrink-0"
              >
                {pickLang('পুনরায় চেষ্টা করুন', 'Retry', 'إعادة المحاولة')}
              </button>
            )}
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* ===================================================================
            SECTION 1: CINEMATIC ROYAL ISLAMIC HERO & 3D QURAN-REHAL SCENE
            Desktop: 2-column balanced layout (Left: Identity & CTAs, Right: 3D Scene)
            Mobile: 1. Identity & Headline -> 2. 3D Scene -> 3. Admission & Login CTAs
           =================================================================== */}
        {isSectionVisible('hero') && (
          <section
            data-testid="hero-3d-quran-section"
            className="relative overflow-hidden bg-gradient-to-b from-[#061326] via-[#0A1B33] to-[#062620] text-[#F7F4EC] border-b border-[#D9B64C]/35 uqcm-islamic-lattice"
          >
            {/* Ambient Royal Gold & Emerald Illumination */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 22% 28%, rgba(217, 182, 76, 0.14) 0%, transparent 50%), radial-gradient(circle at 78% 55%, rgba(8, 122, 89, 0.22) 0%, transparent 58%)',
              }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* BLOCK 1 (Mobile Order 1, Desktop Left Top): Institutional Identity, Headline & Lead */}
                <div className="order-1 lg:order-1 lg:col-span-7 space-y-5">
                  <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#0A1B33]/90 border border-[#D9B64C]/35 shadow-sm">
                    <span className="font-ar text-sm sm:text-base text-[#E8D58A] tracking-wide">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </span>
                    <span className="text-[#D9B64C]/50">·</span>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#F7F4EC]/90">
                      {pickLang(
                        heroSection?.badgeBn || 'কুরআন ও সুন্নাহর আলোকিত শিক্ষাপ্রতিষ্ঠান',
                        heroSection?.badgeEn || 'Sacred Quranic & Modern Cadet Institution',
                        heroSection?.badgeAr || 'مؤسسة تعليمية قرآنية وأكاديمية متكاملة'
                      )}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <h1
                      data-testid="hero-institution-title-bn"
                      className="font-display-bn text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#F7F4EC] leading-[1.24]"
                    >
                      {pickLang(
                        settings.institutionNameBn || 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা',
                        settings.institutionNameEn || 'Ummul Quran Cadet Madrasa',
                        settings.institutionNameAr || 'مدرسة أم القرآن كاديت الإسلامية'
                      )}
                    </h1>

                    <p
                      data-testid="hero-institution-title-en"
                      className="font-display-en text-lg sm:text-xl lg:text-2xl font-semibold text-[#E8D58A] tracking-wide"
                    >
                      {pickLang(
                        heroSection?.titleBn ||
                          'কুরআনের নূর, সুন্নাহর আদব ও আধুনিক ক্যাডেট শিক্ষার সমন্বিত দ্বীনি শিক্ষাপ্রতিষ্ঠান',
                        heroSection?.titleEn ||
                          'Illuminated by the Noble Quran, Grounded in Sunnah & Integrated Cadet Excellence',
                        heroSection?.titleAr ||
                          'منارة قرآنية تجمع بين علوم الشريعة والتربية النبوية والتعليم الأكاديمي المتكامل'
                      )}
                    </p>
                  </div>

                  <p className="text-sm sm:text-base lg:text-[17px] text-[#F7F4EC]/88 leading-relaxed max-w-2xl">
                    {pickLang(
                      heroSection?.descriptionBn ||
                        'বিশুদ্ধ হিফজুল কুরআন, তাজবীদ, কওমি-আলিয়া দ্বীনি শিক্ষা এবং আধুনিক সাধারণ শিক্ষার সমন্বয়ে আদর্শ, চরিত্রবান ও যুগোপযোগী মুসলিম প্রজন্ম গড়ে তোলার একটি নির্ভরযোগ্য দ্বীনি বিদ্যাপীঠ।',
                      heroSection?.descriptionEn ||
                        'Harmonizing authentic Hifzul Quran, classical Islamic scholarship, and modern general education within a disciplined, morally uplifting cadet environment.',
                      heroSection?.descriptionAr ||
                        'صرح تعليمي يجمع بين تحفيظ القرآن الكريم والعلوم الشرعية الأصيلة والتعليم الأكاديمي الحديث في بيئة تربوية منضبطة.'
                    )}
                  </p>
                </div>

                {/* BLOCK 2 (Mobile Order 2, Desktop Right Spanning 2 Rows): 3D Quran-Rehal Scene */}
                <div className="order-2 lg:order-2 lg:col-span-5 lg:row-span-2 w-full">
                  <QuranRehalScene3D language={language} />
                </div>

                {/* BLOCK 3 (Mobile Order 3, Desktop Left Bottom): Primary & Secondary CTAs + Verified Highlights */}
                <div className="order-3 lg:order-3 lg:col-span-7 space-y-6">
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5">
                    <button
                      type="button"
                      onClick={onOpenOnlineAdmission}
                      data-testid="hero-action-admission"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/55 shadow-[0_14px_30px_-8px_rgba(8,122,89,0.75)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D58A]"
                    >
                      <GraduationCap className="w-4 h-4 text-[#E8D58A]" />
                      <span>
                        {pickLang(
                          heroSection?.primaryCtaBn || 'অনলাইন ভর্তি আবেদন করুন',
                          heroSection?.primaryCtaEn || 'Apply for Online Admission',
                          heroSection?.primaryCtaAr || 'التقديم للقبول عبر الإنترنت'
                        )}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={isAuthenticated ? onEnterManagementPortal : onOpenLoginPortal}
                      data-testid="hero-action-login"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-b from-[#E8D58A] to-[#D9B64C] hover:from-[#F3E3A3] hover:to-[#DFBD50] text-[#061326] shadow-[0_14px_30px_-8px_rgba(217,182,76,0.45)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D58A]"
                    >
                      {isAuthenticated ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-[#061326]" />
                          <span>
                            {pickLang(
                              'ম্যানেজমেন্ট ড্যাশবোর্ড',
                              'Management Dashboard',
                              'لوحة التحكم الإدارية'
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 text-[#061326]" />
                          <span>
                            {pickLang(
                              heroSection?.secondaryCtaBn || 'শিক্ষার্থী / অভিভাবক লগইন',
                              heroSection?.secondaryCtaEn || 'Student / Guardian Login',
                              heroSection?.secondaryCtaAr || 'دخول الطلاب وأولياء الأمور'
                            )}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('/about')}
                      data-testid="hero-action-about"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-[#0A1B33]/85 hover:bg-[#0A1B33] text-[#E8D58A] border border-[#D9B64C]/35 transition-all duration-200 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#D9B64C]" />
                      <span>
                        {pickLang('প্রতিষ্ঠান পরিচিতি', 'Explore Institution', 'تعرف على المدرسة')}
                      </span>
                    </button>
                  </div>

                  {/* Verified Institutional Pillars Strip */}
                  <div className="pt-4 border-t border-[#D9B64C]/25 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#F7F4EC]">
                          {pickLang(
                            'সমন্বিত ৫টি শিক্ষা বিভাগ',
                            '5 Integrated Academic Streams',
                            '٥ أقسام تعليمية متكاملة'
                          )}
                        </p>
                        <p className="text-[#9CA9B8] mt-0.5">
                          {pickLang(
                            'নূরানী, নাজেরা, হিফজ, কিতাব ও জেনারেল',
                            'Noorani, Nazera, Hifz, Kitab & General',
                            'النوراني والناظرة والحفظ والكتاب والعام'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#F7F4EC]">
                          {pickLang(
                            'তাজবীদ ও সুন্নাহভিত্তিক আদব',
                            'Authentic Tajweed & Prophetic Adab',
                            'التجويد المتقن والأدب النبوي'
                          )}
                        </p>
                        <p className="text-[#9CA9B8] mt-0.5">
                          {pickLang(
                            'দৈনিক আমল, আখলাক ও নিবিড় তত্ত্বাবধান',
                            'Daily spiritual practice & close mentorship',
                            'التربية الإيمانية والمتابعة اليومية'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#F7F4EC]">
                          {pickLang(
                            `শিক্ষাবর্ষ ${settings.academicYear || '২০২৬-২০২৭'}`,
                            `Academic Session ${settings.academicYear || '2026-2027'}`,
                            `العام الدراسي ${settings.academicYear || '2026-2027'}`
                          )}
                        </p>
                        <p className="text-[#9CA9B8] mt-0.5">
                          {pickLang(
                            'অনলাইন ভর্তি ও ডিজিটাল পোর্টাল সুবিধা',
                            'Online admission & digital guardian portal',
                            'القبول الإلكتروني وبوابة أولياء الأمور'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 2: INSTITUTIONAL INTRODUCTION (Warm Ivory Canvas)
           =================================================================== */}
        {isSectionVisible('intro') && (
          <section
            id="about-section"
            data-testid="section-a-introduction"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 uqcm-ivory-lattice border-b border-[#D9B64C]/25"
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#087A59]">
                    <span className="w-6 h-[1.5px] bg-[#D9B64C]" />
                    <span>
                      {pickLang(
                        introSection?.badgeBn || 'প্রাতিষ্ঠানিক পরিচিতি ও লক্ষ্য',
                        introSection?.badgeEn || 'Institutional Identity & Heritage',
                        introSection?.badgeAr || 'نبذة عن المؤسسة ورسالتها'
                      )}
                    </span>
                  </div>

                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#061326] leading-tight">
                    {pickLang(
                      introSection?.titleBn ||
                        'কুরআনের নূর, নববী আদব ও আধুনিক জ্ঞানের এক অনন্য সমন্বয়',
                      introSection?.titleEn ||
                        'Where Sacred Quranic Illumination Meets Disciplined Academic Excellence',
                      introSection?.titleAr ||
                        'حيث يلتقي نور القرآن الكريم بالأدب النبوي والتميز الأكاديمي'
                    )}
                  </h2>

                  <p className="text-sm sm:text-base text-[#122033]/85 leading-relaxed">
                    {pickLang(
                      introSection?.descriptionBn ||
                        'উম্মুল কুরআন ক্যাডেট মাদ্রাসা শুধুমাত্র একটি প্রথাগত শিক্ষাপ্রতিষ্ঠান নয়; এটি এমন একটি আদর্শিক প্রাঙ্গণ যেখানে একজন শিক্ষার্থী বিশুদ্ধ কুরআন তিলাওয়াত ও হিফজের পাশাপাশি আরবি ভাষা, ইসলামি ফিকহ এবং জাতীয় শিক্ষাক্রমের বাংলা, ইংরেজি, গণিত ও বিজ্ঞানে সমানভাবে দক্ষ হয়ে ওঠে।',
                      introSection?.descriptionEn ||
                        'Ummul Quran Cadet Madrasa is built on the conviction that a Muslim student should never have to choose between authentic Quranic scholarship and strong foundational proficiency in Bengali, English, Mathematics, and Science.',
                      introSection?.descriptionAr ||
                        'تأسست مدرسة أم القرآن كاديت الإسلامية لتقدم نموذجاً تربوياً متوازناً يجمع بين إتقان القرآن الكريم والعلوم الشرعية والتفوق في العلوم الحديثة.'
                    )}
                  </p>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/90 border border-[#D9B64C]/30 shadow-sm">
                      <h3 className="text-sm font-bold text-[#061326] flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#087A59]" />
                        <span>
                          {pickLang('আমাদের লক্ষ্য (Mission)', 'Our Sacred Mission', 'رسالتنا التربوية')}
                        </span>
                      </h3>
                      <p className="mt-1.5 text-xs text-[#122033]/80 leading-relaxed">
                        {pickLang(
                          'বিশুদ্ধ আকীদা, সুন্নাহভিত্তিক আমল ও নৈতিক চরিত্র গঠনের মাধ্যমে যোগ্য আলেম, হাফেজ ও দায়িত্বশীল নাগরিক তৈরি করা।',
                          'Nurturing upright Huffaz, scholars, and responsible citizens grounded in authentic creed, Prophetic character, and intellectual clarity.',
                          'إعداد جيل من الحفاظ وطلبة العلم المتمسكين بالعقيدة الصحيحة والأخلاق النبوية.'
                        )}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/90 border border-[#D9B64C]/30 shadow-sm">
                      <h3 className="text-sm font-bold text-[#061326] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D9B64C]" />
                        <span>
                          {pickLang('আমাদের দৃষ্টিভঙ্গি (Vision)', 'Our Long-Term Vision', 'رؤيتنا المستقبلية')}
                        </span>
                      </h3>
                      <p className="mt-1.5 text-xs text-[#122033]/80 leading-relaxed">
                        {pickLang(
                          'দ্বীনি ও আধুনিক শিক্ষার দূরত্ব ঘুচিয়ে আন্তর্জাতিক মানের একটি আদর্শ ইসলামি শিক্ষাকেন্দ্র হিসেবে প্রতিষ্ঠিত হওয়া।',
                          'Bridging sacred Islamic sciences and contemporary education to serve as a benchmark institution in Bangladesh.',
                          'الريادة في تقديم تعليم إسلامي عصري متكامل يواكب المعايير العالمية.'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('/about')}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#064B3A] hover:text-[#087A59] transition-colors cursor-pointer"
                    >
                      <span>
                        {pickLang(
                          'মাদ্রাসার বিস্তারিত পরিচিতি ও ইতিহাস পড়ুন',
                          'Read Full Institutional Profile',
                          'اقرأ الملف التعريفي الكامل للمدرسة'
                        )}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#D9B64C]" />
                    </button>
                  </div>
                </div>

                {/* Right 5 Columns: Royal Architectural Identity Card */}
                <div className="lg:col-span-5">
                  <div className="uqcm-royal-panel rounded-2xl p-6 sm:p-8 text-[#F7F4EC] relative overflow-hidden">
                    <div className="flex items-center gap-4 pb-6 border-b border-[#D9B64C]/25">
                      <div className="w-16 h-16 rounded-xl bg-white p-1.5 shadow-md ring-2 ring-[#D9B64C]/60 shrink-0 flex items-center justify-center">
                        <InstitutionalCrest className="w-13 h-13" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#E8D58A]">
                          {pickLang('প্রাতিষ্ঠানিক সারসংক্ষেপ', 'Institutional Profile', 'الهوية المؤسسية')}
                        </p>
                        <h3 className="font-display-bn text-lg sm:text-xl font-bold text-[#F7F4EC] mt-0.5">
                          {pickLang(
                            settings.institutionNameBn || 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা',
                            settings.institutionNameEn || 'Ummul Quran Cadet Madrasa',
                            settings.institutionNameAr || 'مدرسة أم القرآن كاديت الإسلامية'
                          )}
                        </h3>
                      </div>
                    </div>

                    <dl className="mt-6 space-y-4 text-xs sm:text-sm">
                      <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
                        <dt className="text-[#9CA9B8]">
                          {pickLang('চলমান শিক্ষাবর্ষ', 'Active Academic Session', 'العام الدراسي الحالي')}
                        </dt>
                        <dd className="font-bold text-[#E8D58A]">
                          {settings.academicYear || '2026-2027'}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
                        <dt className="text-[#9CA9B8]">
                          {pickLang('শিক্ষা কারিকুলাম', 'Curriculum Model', 'النظام التعليمي')}
                        </dt>
                        <dd className="font-semibold text-[#F7F4EC] text-right">
                          {pickLang(
                            'হিফজ · কওমি/আলিয়া · জেনারেল',
                            'Hifz · Islamic Sciences · General',
                            'تحفيظ · علوم شرعية · تعليم عام'
                          )}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
                        <dt className="text-[#9CA9B8]">
                          {pickLang('আবাসন ও ক্যাম্পাস সুবিধা', 'Campus Modes', 'نظام الدراسة')}
                        </dt>
                        <dd className="font-semibold text-[#F7F4EC] text-right">
                          {pickLang(
                            'আবাসিক · অনাবাসিক · ডে-কেয়ার',
                            'Residential · Day-Scholar · Day-Care',
                            'داخلي · خارجي · رعاية نهارية'
                          )}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-[#9CA9B8]">
                          {pickLang('ক্যাম্পাস অবস্থান', 'Campus Location', 'موقع الحرم المدرسي')}
                        </dt>
                        <dd className="font-semibold text-[#F7F4EC] text-right max-w-[220px]">
                          {pickLang(
                            cmsContact.addressBn || settings.addressBn,
                            cmsContact.addressEn,
                            cmsContact.addressAr
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 3: ACADEMIC DEPARTMENTS (Royal Navy Canvas)
           =================================================================== */}
        {isSectionVisible('departments') && (
          <section
            id="departments-section"
            data-testid="section-b-departments"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#061326] text-[#F7F4EC] border-b border-[#D9B64C]/30 uqcm-islamic-lattice"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D9B64C]/20 pb-8">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E8D58A]">
                    <Layers className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'সমন্বিত শিক্ষা বিভাগসমূহ',
                        'Academic Departments & Streams',
                        'الأقسام والمراحل التعليمية'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F4EC]">
                    {pickLang(
                      'পাঁচটি বিশেষায়িত বিভাগে ধারাবাহিক দ্বীনি ও আধুনিক শিক্ষা',
                      'Five Specialized Streams Designed for Complete Growth',
                      'خمسة أقسام تخصصية لبناء الطالب علمياً وروحياً'
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('/departments')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0A1B33] hover:bg-[#10294D] text-[#E8D58A] border border-[#D9B64C]/35 transition-colors cursor-pointer self-start md:self-auto"
                >
                  <span>
                    {pickLang(
                      'সকল বিভাগের পাঠ্যক্রম দেখুন',
                      'View Full Department Guide',
                      'عرض دليل الأقسام الكامل'
                    )}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departmentStreams.map((dept, index) => (
                  <article
                    key={dept.code}
                    className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-200 ${
                      index === 2
                        ? 'bg-gradient-to-b from-[#064B3A] to-[#061326] border-[#D9B64C]/55 shadow-[0_20px_45px_-16px_rgba(8,122,89,0.5)]'
                        : 'bg-[#0A1B33]/90 border-[#D9B64C]/24 hover:border-[#D9B64C]/50'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#D9B64C]/15 text-[#E8D58A] border border-[#D9B64C]/30">
                          {pickLang(dept.badgeBn, dept.badgeEn, dept.badgeAr)}
                        </span>
                        <span className="font-mono-num text-xs text-[#D9B64C]/75">
                          0{index + 1}
                        </span>
                      </div>

                      <h3 className="font-display-bn text-xl font-bold text-[#F7F4EC]">
                        {pickLang(dept.titleBn, dept.titleEn, dept.titleAr)}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#F7F4EC]/80 leading-relaxed">
                        {pickLang(dept.descBn, dept.descEn, dept.descAr)}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#D9B64C]/20 space-y-3">
                      <p className="text-[11px] text-[#E8D58A]/90 font-medium">
                        {pickLang(dept.curriculumBn, dept.curriculumEn, dept.curriculumAr)}
                      </p>
                      <button
                        type="button"
                        onClick={onOpenOnlineAdmission}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D9B64C] hover:text-[#E8D58A] transition-colors cursor-pointer"
                      >
                        <span>
                          {pickLang(
                            'এই বিভাগে ভর্তির আবেদন',
                            'Apply for this Stream',
                            'التسجيل في هذا القسم'
                          )}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 4: WHY CHOOSE UMMUL QURAN (Warm Ivory Canvas)
           =================================================================== */}
        {isSectionVisible('why_choose_us') && (
          <section
            data-testid="section-c-why-choose"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 uqcm-ivory-lattice border-b border-[#D9B64C]/25"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#087A59]">
                  <span className="w-6 h-[1.5px] bg-[#D9B64C]" />
                  <span>
                    {pickLang(
                      'কেন উম্মুল কুরআন ক্যাডেট মাদ্রাসা?',
                      'Why Choose Ummul Quran Cadet Madrasa',
                      'لماذا مدرسة أم القرآن كاديت الإسلامية؟'
                    )}
                  </span>
                </div>
                <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#061326]">
                  {pickLang(
                    'অভিভাবকগণ যে কারণে সন্তানদের ভবিষ্যৎ গঠনে আমাদের ওপর আস্থা রাখেন',
                    'Six Institutional Pillars That Define Our Educational Environment',
                    'ست ركائز مؤسسية تميز بيئتنا التعليمية والتربوية'
                  )}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    titleBn: 'বিশুদ্ধ তাজবীদ ও আন্তর্জাতিক মানের হিফজ',
                    titleEn: 'Authentic Tajweed & Structured Hifz',
                    titleAr: 'إتقان التجويد والتحفيظ المنهجي',
                    descBn:
                      'প্রত্যেক শিক্ষার্থীর মাখরাজ ও সিফাত সংশোধন করে অভিজ্ঞ হাফেজ ও কারী উস্তাদদের তত্ত্বাবধানে নিয়মিত সবক ও আমুখতা নিশ্চিত করা হয়।',
                    descEn:
                      'Individualized phonetic correction and structured daily Sabaq, Sabqi, and Manzil tracking under experienced Huffaz.',
                    descAr:
                      'تصحيح المخارج والصفات فردياً مع متابعة يومية دقيقة للحفظ والمراجعة.',
                  },
                  {
                    titleBn: 'দ্বীনি শিক্ষার পাশাপাশি আধুনিক সাধারণ শিক্ষা',
                    titleEn: 'Balanced Islamic & National Core Subjects',
                    titleAr: 'التكامل بين العلوم الشرعية والحديثة',
                    descBn:
                      'কুরআন ও দ্বীনি শিক্ষার পাশাপাশি বাংলা, ইংরেজি, গণিত ও বিজ্ঞানে সমান দক্ষতা অর্জনের জন্য সমন্বিত রুটিন ও পাঠদান।',
                    descEn:
                      'Students master Bengali, English, Mathematics, and Science alongside their Quranic and Arabic studies without compromise.',
                    descAr:
                      'دراسة متوازنة للغات والرياضيات والعلوم جنباً إلى جنب مع القرآن والعلوم الشرعية.',
                  },
                  {
                    titleBn: 'সুন্নাহভিত্তিক আদব ও ক্যাডেট শৃঙ্খলা',
                    titleEn: 'Prophetic Adab & Cadet Discipline',
                    titleAr: 'الأدب النبوي والانضباط التربوي',
                    descBn:
                      'জামাতে নামাজ, মাসনূন দোয়া, পরিচ্ছন্নতা, সময়ানুবর্তিতা ও বড়দের সম্মান করার বাস্তব অনুশীলন।',
                    descEn:
                      'Daily congregational prayers, Prophetic manners, punctuality, and structured character formation.',
                    descAr:
                      'المواظبة على صلاة الجماعة والأذكار والنظافة واحترام الوقت.',
                  },
                  {
                    titleBn: 'নিরাপদ আবাসন ও স্বাস্থ্যসম্মত পরিবেশ',
                    titleEn: 'Safe Campus & Wholesome Care',
                    titleAr: 'بيئة آمنة ورعاية صحية متكاملة',
                    descBn:
                      'আবাসিক ও ডে-কেয়ার শিক্ষার্থীদের জন্য পরিচ্ছন্ন আবাসন, পুষ্টিকর খাদ্য তালিকা এবং সার্বক্ষণিক তত্ত্বাবধান।',
                    descEn:
                      'Clean residential facilities, nutritious meal schedules, and attentive pastoral supervision for boarding and day-care students.',
                    descAr:
                      'سكن نظيف ومنظم مع تغذية صحية وإشراف تربوي على مدار الساعة.',
                  },
                  {
                    titleBn: 'স্বচ্ছ একাডেমিক মূল্যায়ন ও অভিভাবক পোর্টাল',
                    titleEn: 'Transparent Evaluation & Digital Portal',
                    titleAr: 'تقييم أكاديمي شفاف وبوابة إلكترونية',
                    descBn:
                      'উপস্থিতি, পরীক্ষার ফলাফল, ফি রশিদ এবং প্রাতিষ্ঠানিক নোটিশ অনলাইনে অভিভাবক পোর্টালের মাধ্যমে সহজেই দেখার সুবিধা।',
                    descEn:
                      'Guardians can monitor attendance, examination results, fee receipts, and official notices through the online portal.',
                    descAr:
                      'متابعة الحضور والنتائج والإيصالات والإعلانات مباشرة عبر بوابة أولياء الأمور.',
                  },
                  {
                    titleBn: 'ক্ষুদ্র ব্যাচ ও ব্যক্তিগত একাডেমিক যত্ন',
                    titleEn: 'Focused Mentorship & Remedial Care',
                    titleAr: 'عناية فردية ومتابعة مستمرة لكل طالب',
                    descBn:
                      'পিছিয়ে পড়া বা নতুন শিক্ষার্থীদের জন্য অতিরিক্ত তত্ত্বাবধান এবং নিয়মিত অভিভাবক-শিক্ষক মতবিনিময় সভা।',
                    descEn:
                      'Dedicated remedial guidance for new learners and regular parent-teacher academic consultations.',
                    descAr:
                      'دعم إضافي للطلاب الجدد واجتماعات دورية مع أولياء الأمور.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#061326] text-[#E8D58A] font-mono-num text-xs font-bold border border-[#D9B64C]/40">
                        0{idx + 1}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-[#087A59]" />
                    </div>
                    <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                      {pickLang(item.titleBn, item.titleEn, item.titleAr)}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                      {pickLang(item.descBn, item.descEn, item.descAr)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 5: EDUCATIONAL PHILOSOPHY & MUHTAMIM'S MESSAGE (Royal Navy)
           =================================================================== */}
        {isSectionVisible('muhtamim_message') && (
          <section
            id="muhtamim-section"
            data-testid="section-educational-philosophy"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0A1B33] text-[#F7F4EC] border-b border-[#D9B64C]/30 uqcm-islamic-lattice"
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-5 space-y-5">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E8D58A]">
                    <Sparkles className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'শিক্ষাদর্শন ও তারবিয়াহ',
                        'Educational Philosophy & Tarbiyah',
                        'الفلسفة التربوية والتزكية'
                      )}
                    </span>
                  </div>

                  <h2 className="font-display-bn text-2xl sm:text-3xl font-bold text-[#F7F4EC] leading-tight">
                    {pickLang(
                      'ইলম, আমল ও আখলাকের সমন্বয়ে পূর্ণাঙ্গ মানুষ গড়ার সাধনা',
                      'Harmonizing Sacred Knowledge (Ilm), Practice (Amal) & Character (Akhlaq)',
                      'الجمع بين العلم النافع والعمل الصالح والأخلاق الفاضلة'
                    )}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#9CA9B8] leading-relaxed">
                    {pickLang(
                      'ইসলামি শিক্ষাদর্শনের মূল কথা হলো—জ্ঞান যেন কেবল স্মৃতিতে সীমাবদ্ধ না থেকে শিক্ষার্থীর চরিত্র, কথাবার্তা, নামাজ ও দৈনন্দিন আচরণে প্রতিফলিত হয়।',
                      'True Islamic education transforms the heart as well as the intellect, cultivating humility, discipline, and reverence for the Book of Allah.',
                      'التربية الإسلامية الحقيقية تجمع بين إتقان العلوم وتزكية النفس وحسن الخلق.'
                    )}
                  </p>

                  <div className="space-y-3 pt-2">
                    {[
                      {
                        bn: 'তালীম (বিশুদ্ধ জ্ঞান চর্চা): কুরআন, হাদীস, আরবি ও আধুনিক বিষয়ের গভীর পাঠ।',
                        en: 'Ta’leem (Rigorous Learning): Mastery of Quranic, Arabic, and modern academic disciplines.',
                        ar: 'التعليم المتقن: إتقان القرآن واللغة العربية والعلوم الحديثة.',
                      },
                      {
                        bn: 'তারবিয়াহ (আত্মশুদ্ধি ও আদব): সুন্নাহভিত্তিক দৈনন্দিন জীবনযাপন ও শিষ্টাচার।',
                        en: 'Tarbiyah (Character Formation): Living daily by Prophetic manners and moral integrity.',
                        ar: 'التربية والتزكية: الالتزام بالآداب النبوية في الحياة اليومية.',
                      },
                      {
                        bn: 'তানযীম (ক্যাডেট শৃঙ্খলা): সময়ানুবর্তিতা, পরিচ্ছন্নতা ও দায়িত্ববোধের অনুশীলন।',
                        en: 'Tanzeem (Structured Discipline): Punctuality, orderliness, and personal responsibility.',
                        ar: 'التنظيم والانضباط: احترام الوقت والنظام والمسؤولية.',
                      },
                    ].map((pillar, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-[#061326]/80 border border-[#D9B64C]/22"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#D9B64C] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#F7F4EC]/90 leading-relaxed">
                          {pickLang(pillar.bn, pillar.en, pillar.ar)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="rounded-2xl bg-gradient-to-br from-[#061326] via-[#0A1B33] to-[#06382C] border border-[#D9B64C]/40 p-6 sm:p-9 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between gap-4 border-b border-[#D9B64C]/20 pb-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#E8D58A]">
                          {pickLang(
                            muhtamimSection?.badgeBn || 'মুহতামিম / অধ্যক্ষের বাণী',
                            muhtamimSection?.badgeEn || 'Message from the Principal / Muhtamim',
                            muhtamimSection?.badgeAr || 'كلمة عميد المدرسة (المهتمم)'
                          )}
                        </span>
                        <h3 className="font-display-bn text-xl sm:text-2xl font-bold text-[#F7F4EC] mt-1">
                          {pickLang(
                            muhtamimSection?.titleBn ||
                              'আমাদের সন্তানদের ঈমান, আমল ও মেধার আমানত রক্ষায় আমরা প্রতিশ্রুতিবদ্ধ',
                            muhtamimSection?.titleEn ||
                              'Safeguarding the Faith, Character, and Academic Future of Every Student',
                            muhtamimSection?.titleAr ||
                              'حفظ أمانة الإيمان والعلم والأخلاق في نفوس أبنائنا الطلاب'
                          )}
                        </h3>
                      </div>
                      <Award className="w-8 h-8 text-[#D9B64C] shrink-0 hidden sm:block" />
                    </div>

                    <blockquote className="text-xs sm:text-sm lg:text-base text-[#F7F4EC]/90 leading-relaxed space-y-3">
                      <p>
                        {pickLang(
                          muhtamimSection?.descriptionBn ||
                            'আলহামদুলিল্লাহ, উম্মুল কুরআন ক্যাডেট মাদ্রাসায় আমরা প্রতিটি শিক্ষার্থীকে পিতৃস্নেহে গ্রহণ করি। আমাদের লক্ষ্য কেবল পরীক্ষা পাস করানো নয়; বরং কুরআনের বিশুদ্ধ তিলাওয়াত ও হিফজের মাধ্যমে তাদের হৃদয়ে ঈমানের নূর প্রজ্বলিত করা এবং আধুনিক শিক্ষায় দক্ষ করে গড়ে তোলা।',
                          muhtamimSection?.descriptionEn ||
                            'Alhamdulillah, at Ummul Quran Cadet Madrasa we view every student as a sacred trust (Amanah). Our goal is not merely rote instruction, but illuminating young hearts with the Holy Quran while equipping them with strong academic foundations.',
                          muhtamimSection?.descriptionAr ||
                            'الحمد لله، نعتبر كل طالب في مدرسة أم القرآن كاديت الإسلامية أمانة غالية، ونسعى لغرس نور القرآن في قلبه مع تمكينه من العلوم النافعة.'
                        )}
                      </p>
                    </blockquote>

                    <div className="pt-4 border-t border-[#D9B64C]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[#E8D58A]">
                          {pickLang(
                            'মুহতামিম ও শিক্ষা পরিচালনা পর্ষদ',
                            'Office of the Muhtamim & Academic Council',
                            'مكتب المهتمم والمجلس العلمي'
                          )}
                        </p>
                        <p className="text-xs text-[#9CA9B8]">
                          {pickLang(
                            settings.institutionNameBn || 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা',
                            settings.institutionNameEn || 'Ummul Quran Cadet Madrasa',
                            'مدرسة أم القرآن كاديت الإسلامية'
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigateTo('/administration')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8D58A] hover:text-[#D9B64C] transition-colors cursor-pointer"
                      >
                        <span>
                          {pickLang(
                            'প্রশাসনিক কাঠামো দেখুন',
                            'View Institutional Governance',
                            'عرض الهيكل الإداري'
                          )}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 6: ACADEMIC EXCELLENCE & LEARNING APPROACH (Warm Ivory)
           =================================================================== */}
        {isSectionVisible('results_achievements') && (
          <section
            id="results-section"
            data-testid="section-i-academic-results"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 uqcm-ivory-lattice border-b border-[#D9B64C]/25"
          >
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#087A59]">
                    <span className="w-6 h-[1.5px] bg-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'একাডেমিক মূল্যায়ন ও পাঠদান পদ্ধতি',
                        'Academic Excellence & Evaluation Methodology',
                        'التميز الأكاديمي ومنهجية التقييم'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#061326]">
                    {pickLang(
                      'ধারাবাহিক পাঠ মূল্যায়ন, টার্ম পরীক্ষা ও স্বচ্ছ গ্রেডিং পদ্ধতি',
                      'Structured Assessment, Term Examinations & Transparent Grading',
                      'تقييم مستمر واختبارات فصلية ونظام درجات واضح'
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('/academic')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#061326] hover:bg-[#0A1B33] text-[#E8D58A] border border-[#D9B64C]/40 transition-colors cursor-pointer self-start md:self-auto"
                >
                  <span>
                    {pickLang(
                      'একাডেমিক ক্যালেন্ডার ও নিয়মাবলী',
                      'Explore Academic Framework',
                      'استعراض النظام الأكاديمي'
                    )}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    {
                      step: '01',
                      titleBn: 'দৈনিক পাঠ ও সবক যাচাই',
                      titleEn: 'Daily Lesson & Sabaq Audit',
                      titleAr: 'متابعة الدروس اليومية',
                      descBn:
                        'প্রতিদিন ক্লাসে পঠিত সবক, তাজবীদ ও বাড়ির কাজ ডায়েরিতে লিপিবদ্ধ করে উস্তাদ কর্তৃক যাচাই করা হয়।',
                      descEn:
                        'Every student’s daily Quranic recitation and academic classwork is verified and logged in their academic diary.',
                      descAr:
                        'توثيق ومراجعة تسميع القرآن والواجبات اليومية لكل طالب بدقة.',
                    },
                    {
                      step: '02',
                      titleBn: 'মাসিক ও সাময়িকী মূল্যায়ন',
                      titleEn: 'Monthly & Term Examinations',
                      titleAr: 'الاختبارات الشهرية والفصلية',
                      descBn:
                        '১ম সাময়িক, অর্ধবার্ষিক ও বার্ষিক পরীক্ষার মাধ্যমে লিখিত ও মৌখিক (হিফজ/তিলাওয়াত) উভয় দক্ষতা মূল্যায়ন করা হয়।',
                      descEn:
                        'Structured First Term, Mid-Term, and Final examinations assessing both oral Quranic proficiency and written subjects.',
                      descAr:
                        'اختبارات تحريرية وشفوية شاملة لقياس مستوى التحصيل العلمي والحفظ.',
                    },
                    {
                      step: '03',
                      titleBn: 'দুর্বল শিক্ষার্থীদের বিশেষ কেয়ার',
                      titleEn: 'Remedial Coaching & Mentorship',
                      titleAr: 'الرعاية الخاصة للطلاب',
                      descBn:
                        'যে সকল শিক্ষার্থীর তিলাওয়াত বা সাধারণ বিষয়ে বাড়তি সহায়তা প্রয়োজন, তাদের জন্য অতিরিক্ত তত্ত্বাবধানের ব্যবস্থা থাকে।',
                      descEn:
                        'Dedicated small-group coaching sessions for students requiring extra support in Tajweed, Arabic, or Mathematics.',
                      descAr:
                        'حصص تقوية إضافية للطلاب الذين يحتاجون إلى دعم في التجويد أو المواد الأساسية.',
                    },
                    {
                      step: '04',
                      titleBn: 'ডিজিটাল মার্কশিট ও প্রগ্রেস রিপোর্ট',
                      titleEn: 'Digital Transcripts & Progress Cards',
                      titleAr: 'كشوف الدرجات والتقارير الرقمية',
                      descBn:
                        'প্রত্যেক পরীক্ষার পর জিপিএ ও গ্রেডসহ বিস্তারিত মার্কশিট অভিভাবক পোর্টালে প্রকাশ করা হয়।',
                      descEn:
                        'Detailed subject-wise transcripts and GPA reports are published directly to the Guardian Portal after each term.',
                      descAr:
                        'إصدار تقارير درجات مفصلة عبر بوابة أولياء الأمور بعد كل فصل دراسي.',
                    },
                  ].map((stage) => (
                    <div
                      key={stage.step}
                      className="uqcm-mihrab-card rounded-2xl bg-white p-5 space-y-2.5"
                    >
                      <span className="font-mono-num text-xs font-bold text-[#087A59]">
                        {stage.step}
                      </span>
                      <h3 className="font-display-bn text-base font-bold text-[#061326]">
                        {pickLang(stage.titleBn, stage.titleEn, stage.titleAr)}
                      </h3>
                      <p className="text-xs text-[#122033]/80 leading-relaxed">
                        {pickLang(stage.descBn, stage.descEn, stage.descAr)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Verified Institutional Grading Scale Table */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl bg-[#061326] text-[#F7F4EC] border border-[#D9B64C]/35 p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D9B64C]/20 pb-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#E8D58A]">
                          {pickLang(
                            'অনুমোদিত গ্রেডিং স্কেল',
                            'Official Grading System',
                            'نظام التقديرات المعتمد'
                          )}
                        </p>
                        <h3 className="font-display-bn text-lg font-bold text-[#F7F4EC] mt-0.5">
                          {pickLang(
                            'একাডেমিক ফলাফল মূল্যায়ন মানদণ্ড',
                            'Institutional Evaluation Scale',
                            'معايير تقييم الدرجات'
                          )}
                        </h3>
                      </div>
                      <BookOpen className="w-5 h-5 text-[#D9B64C]" />
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#D9B64C]/20 text-[#E8D58A]">
                            <th className="py-2 font-bold">
                              {pickLang('নম্বর পরিসর', 'Marks Range', 'الدرجات')}
                            </th>
                            <th className="py-2 font-bold">
                              {pickLang('লেটার গ্রেড', 'Grade', 'التقدير')}
                            </th>
                            <th className="py-2 font-bold text-right">
                              {pickLang('জিপিএ পয়েন্ট', 'GPA', 'النقاط')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 font-mono-num">
                          {[
                            { grade: 'A+ (মুমতাজ)', minMark: 80, maxMark: 100, point: 5.0 },
                            { grade: 'A (জায়্যিদ জিদ্দান)', minMark: 70, maxMark: 79, point: 4.0 },
                            { grade: 'A- (জায়্যিদ)', minMark: 60, maxMark: 69, point: 3.5 },
                            { grade: 'B (মাকবুল)', minMark: 50, maxMark: 59, point: 3.0 },
                            { grade: 'C', minMark: 40, maxMark: 49, point: 2.0 },
                            { grade: 'D', minMark: 33, maxMark: 39, point: 1.0 },
                          ].map((rule, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.04]">
                              <td className="py-2 text-[#F7F4EC]/90">
                                {rule.minMark}% – {rule.maxMark}%
                              </td>
                              <td className="py-2 font-bold text-[#E8D58A]">{rule.grade}</td>
                              <td className="py-2 text-right text-[#F7F4EC]">
                                {rule.point.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 7: HIFZUL QURAN PROGRAMME SPOTLIGHT (Emerald & Navy Sanctuary)
           =================================================================== */}
        {isSectionVisible('departments') && (
          <section
            data-testid="section-hifzul-quran-programme"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#061326] via-[#06382C] to-[#061326] text-[#F7F4EC] border-b border-[#D9B64C]/35 uqcm-islamic-lattice"
          >
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#D9B64C]/15 border border-[#D9B64C]/40 text-xs font-bold text-[#E8D58A]">
                    <span>﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</span>
                    <span>·</span>
                    <span>
                      {pickLang(
                        'বিশেষায়িত হিফজুল কুরআন বিভাগ',
                        'Specialized Hifzul Quran Programme',
                        'برنامج تحفيظ القرآن الكريم المتخصص'
                      )}
                    </span>
                  </div>

                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F4EC] leading-tight">
                    {pickLang(
                      'তাজবীদ, তারতীল ও নিবিড় তত্ত্বাবধানে পূর্ণ ৩০ পারা কুরআন মাজীদ হিফজ',
                      'A Sacred, Methodical Journey to Memorizing All 30 Juz of the Holy Quran',
                      'منهجية علمية متقنة لحفظ ومراجعة ثلاثين جزءاً من القرآن الكريم'
                    )}
                  </h2>

                  <p className="text-sm sm:text-base text-[#F7F4EC]/85 leading-relaxed">
                    {pickLang(
                      'আমাদের হিফজুল কুরআন বিভাগে শিক্ষার্থীদের ওপর অযৌক্তিক মানসিক চাপ প্রয়োগ না করে, প্রতিদিন নির্ধারিত রুটিনে সবক, সাতসবক ও আমুখতার মাধ্যমে আনন্দের সাথে কুরআন মুখস্থ ও সংরক্ষণ করানো হয়।',
                      'Our Hifzul Quran programme emphasizes retention quality and Tajweed accuracy over rushed memorization, ensuring every Juz remains firmly anchored in the student’s heart.',
                      'يركز برنامج التحفيظ لدينا على جودة الحفظ وإتقان أحكام التجويد وتثبيت المحفوظ عبر نظام المراجعة اليومية.'
                    )}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={onOpenOnlineAdmission}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#D9B64C] hover:bg-[#E8D58A] text-[#061326] shadow-lg transition-colors cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>
                        {pickLang(
                          'হিফজ বিভাগে ভর্তির আবেদন করুন',
                          'Apply for Hifzul Quran Stream',
                          'التقديم لقسم تحفيظ القرآن'
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      titleBn: '১. দৈনিক নতুন সবক (Sabaq)',
                      titleEn: '1. Daily New Sabaq',
                      titleAr: '١. السبق اليومي الجديد',
                      descBn:
                        'ফজরের পর মাখরাজ ও তাজবীদ যাচাইপূর্বক উস্তাদের কাছে নির্ভুলভাবে নতুন সবক প্রদান।',
                      descEn:
                        'Post-Fajr individualized recitation of new verses with strict Tajweed verification.',
                      descAr:
                        'تسميع الدرس الجديد بعد الفجر مع تصحيح المخارج وأحكام التجويد.',
                    },
                    {
                      titleBn: '২. সাতসবক শুনানি (Sabqi)',
                      titleEn: '2. Recent Sabqi Review',
                      titleAr: '٢. مراجعة السبقي القريب',
                      descBn:
                        'সদ্য মুখস্থকৃত পারার পূর্ববর্তী পৃষ্ঠাসমূহ প্রতিদিন নিয়মিত শুনানি ও দৃঢ়করণ।',
                      descEn:
                        'Systematic daily revision of recently memorized pages from the current Juz.',
                      descAr:
                        'مراجعة الصفحات المحفوظة حديثاً يومياً لضمان عدم نسيانها.',
                    },
                    {
                      titleBn: '৩. আমুখতা ও খতম (Manzil)',
                      titleEn: '3. Cumulative Manzil',
                      titleAr: '٣. المراجعة الكبرى (المنزل)',
                      descBn:
                        'পূর্বে মুখস্থকৃত সকল পারা ধারাবাহিক রুটিনে তিলাওয়াত ও মাসিক হিফজ মূল্যায়ন পরীক্ষা।',
                      descEn:
                        'Rotational recitation of all previously completed Juz and monthly Hifz audits.',
                      descAr:
                        'مراجعة الأجزاء السابقة بانتظام مع اختبارات تقييم شهرية.',
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-[#061326]/90 border border-[#D9B64C]/35 p-5 space-y-3 shadow-lg"
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#087A59] text-[#F7F4EC] font-mono-num text-xs font-bold">
                        0{index + 1}
                      </span>
                      <h3 className="font-display-bn text-base font-bold text-[#E8D58A]">
                        {pickLang(item.titleBn, item.titleEn, item.titleAr)}
                      </h3>
                      <p className="text-xs text-[#F7F4EC]/80 leading-relaxed">
                        {pickLang(item.descBn, item.descEn, item.descAr)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 8: QUALIFIED TEACHERS & ADMINISTRATION (Warm Ivory Canvas)
           =================================================================== */}
        {(isSectionVisible('teachers_admin') || isSectionVisible('muhtamim_message')) && (
          <section
            id="administration-section"
            data-testid="section-d-e-administration"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 uqcm-ivory-lattice border-b border-[#D9B64C]/25"
          >
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#087A59]">
                    <Users className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'যোগ্য শিক্ষকমণ্ডলী ও প্রশাসন',
                        'Qualified Faculty & Institutional Administration',
                        'هيئة التدريس والإدارة المؤسسية'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#061326]">
                    {pickLang(
                      'অভিজ্ঞ আলেম, হাফেজ ও বিষয়ভিত্তিক শিক্ষকদের সমন্বিত পরিচালনা',
                      'Guided by Experienced Islamic Scholars, Huffaz & Subject Educators',
                      'إشراف نخبة من العلماء والحفاظ والمعلمين المتخصصين'
                    )}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigateTo('/teachers')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#061326] hover:bg-[#0A1B33] text-[#E8D58A] border border-[#D9B64C]/40 transition-colors cursor-pointer"
                  >
                    <span>
                      {pickLang('শিক্ষকমণ্ডলী পাতা', 'Faculty Directory', 'دليل المعلمين')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('/administration')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#F7F4EC] text-[#061326] border border-[#D9B64C]/45 transition-colors cursor-pointer"
                  >
                    <span>
                      {pickLang('প্রশাসনিক কাঠামো', 'Administration', 'الإدارة')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#087A59]" />
                  </button>
                </div>
              </div>

              {publishedTeachers.length > 0 || publishedAdmins.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...publishedAdmins, ...publishedTeachers].slice(0, 8).map((profile) => (
                    <article
                      key={profile.id}
                      className="uqcm-mihrab-card rounded-2xl bg-white p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-center gap-3.5">
                        {profile.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={pickLang(profile.nameBn, profile.nameEn, profile.nameAr)}
                            className="w-14 h-14 rounded-xl object-cover border border-[#D9B64C]/40 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#061326] text-[#E8D58A] flex items-center justify-center font-bold text-lg border border-[#D9B64C]/40 shrink-0">
                            {(profile.nameEn || profile.nameBn || 'U').charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#087A59]">
                            {pickLang(
                              profile.designationBn,
                              profile.designationEn,
                              profile.designationAr
                            )}
                          </span>
                          <h3 className="font-display-bn text-base font-bold text-[#061326] truncate">
                            {pickLang(profile.nameBn, profile.nameEn, profile.nameAr)}
                          </h3>
                          {profile.department && (
                            <p className="text-xs text-[#122033]/70 uppercase truncate">
                              {profile.department}
                            </p>
                          )}
                        </div>
                      </div>

                      {(profile.biographyBn || profile.biographyEn || profile.biographyAr) && (
                        <p className="text-xs text-[#122033]/80 leading-relaxed border-t border-[#D9B64C]/20 pt-3">
                          {pickLang(
                            profile.biographyBn,
                            profile.biographyEn,
                            profile.biographyAr
                          )}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      badgeBn: 'সর্বোচ্চ নীতি-নির্ধারণী পর্ষদ',
                      badgeEn: 'Supreme Governance',
                      badgeAr: 'المجلس الأعلى',
                      titleBn: 'মজলিসে শূরা ও পরিচালনা পর্ষদ',
                      titleEn: 'Majlis-e-Shura & Governing Body',
                      titleAr: 'مجلس الشورى والإدارة',
                      descBn:
                        'মাদ্রাসার দীর্ঘমেয়াদী একাডেমিক নীতিমালা, শরীয়াহ তত্ত্বাবধান ও প্রাতিষ্ঠানিক স্বচ্ছতা নিশ্চিতকারী পরিচালনা পর্ষদ।',
                      descEn:
                        'Oversees institutional policy, curriculum integrity, and financial stewardship.',
                      descAr:
                        'يشرف على السياسات التعليمية والشرعية والشفافية المؤسسية.',
                    },
                    {
                      badgeBn: 'প্রশাসনিক ও একাডেমিক প্রধান',
                      badgeEn: 'Executive Leadership',
                      badgeAr: 'الإدارة التنفيذية',
                      titleBn: 'মুহতামিম ও শিক্ষা সচিবের কার্যালয়',
                      titleEn: 'Office of the Muhtamim & Academic Dean',
                      titleAr: 'مكتب المهتمم وأمين الشؤون التعليمية',
                      descBn:
                        'দৈনন্দিন ক্লাস রুটিন, পরীক্ষা নিয়ন্ত্রণ, শৃঙ্খলা এবং শিক্ষক-অভিভাবক সমন্বয় পরিচালনাকারী কেন্দ্রীয় দপ্তর।',
                      descEn:
                        'Directs daily instruction, examinations, student discipline, and guardian coordination.',
                      descAr:
                        'يدير الجداول الدراسية والاختبارات والانضباط والتواصل مع أولياء الأمور.',
                    },
                    {
                      badgeBn: 'কুরআন ও দ্বীনি অনুষদ',
                      badgeEn: 'Quranic & Islamic Faculty',
                      badgeAr: 'هيئة تحفيظ القرآن والعلوم الشرعية',
                      titleBn: 'হিফজ, তাজবীদ ও কিতাব বিভাগীয় উস্তাদমণ্ডলী',
                      titleEn: 'Huffaz, Qaris & Classical Islamic Scholars',
                      titleAr: 'الحفاظ والقراء وأساتذة العلوم الشرعية',
                      descBn:
                        'নূরানী, নাজেরা, হিফজুল কুরআন এবং আরবি-ফিকহ-হাদীস পাঠদানে নিয়োজিত অভিজ্ঞ আলেম ও হাফেজ শিক্ষকমণ্ডলী।',
                      descEn:
                        'Dedicated Huffaz and scholars guiding students in Tajweed, Hifz, and Arabic sciences.',
                      descAr:
                        'نخبة من الحفاظ والعلماء لتعليم التجويد والحفظ والعلوم العربية.',
                    },
                    {
                      badgeBn: 'জেনারেল ও ক্যাডেট অনুষদ',
                      badgeEn: 'General Education Faculty',
                      badgeAr: 'هيئة التعليم العام',
                      titleBn: 'বাংলা, ইংরেজি, গণিত ও বিজ্ঞান শিক্ষকমণ্ডলী',
                      titleEn: 'Language, Mathematics, Science & ICT Educators',
                      titleAr: 'معلمو اللغات والرياضيات والعلوم',
                      descBn:
                        'জাতীয় শিক্ষাক্রমের বিষয়সমূহে শিক্ষার্থীদের শক্তিশালী ভিত্তি গঠনে নিয়োজিত বিষয়ভিত্তিক প্রশিক্ষিত শিক্ষকবৃন্দ।',
                      descEn:
                        'Subject-specialist educators building proficiency in Bengali, English, Mathematics, and Science.',
                      descAr:
                        'معلمون متخصصون لتأسيس الطلاب في اللغات والرياضيات والعلوم.',
                    },
                  ].map((wing, idx) => (
                    <div
                      key={idx}
                      className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-3"
                    >
                      <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#061326] text-[#E8D58A]">
                        {pickLang(wing.badgeBn, wing.badgeEn, wing.badgeAr)}
                      </span>
                      <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                        {pickLang(wing.titleBn, wing.titleEn, wing.titleAr)}
                      </h3>
                      <p className="text-xs text-[#122033]/80 leading-relaxed">
                        {pickLang(wing.descBn, wing.descEn, wing.descAr)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 9: ADMISSION INFORMATION & ONLINE APPLICATION STEPS (Navy)
           =================================================================== */}
        {isSectionVisible('admission_highlights') && (
          <section
            id="admission-section"
            data-testid="section-f-admission-highlights"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#061326] text-[#F7F4EC] border-b border-[#D9B64C]/35 uqcm-islamic-lattice"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#087A59]/30 border border-[#D9B64C]/40 text-xs font-bold text-[#E8D58A]">
                    <GraduationCap className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        admissionSection?.badgeBn ||
                          `ভর্তি বিজ্ঞপ্তি · শিক্ষাবর্ষ ${settings.academicYear || '২০২৬-২০২৭'}`,
                        admissionSection?.badgeEn ||
                          `Admissions Open · Session ${settings.academicYear || '2026-2027'}`,
                        admissionSection?.badgeAr ||
                          `باب القبول مفتوح · العام الدراسي ${settings.academicYear || '2026-2027'}`
                      )}
                    </span>
                  </div>

                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F4EC] leading-tight">
                    {pickLang(
                      admissionSection?.titleBn ||
                        'নূরানী, নাজেরা, হিফজুল কুরআন, কিতাব ও জেনারেল বিভাগে ভর্তি চলছে',
                      admissionSection?.titleEn ||
                        'Enroll Your Child for a Balanced Quranic & Academic Future',
                      admissionSection?.titleAr ||
                        'سجل طفلك الآن في برامجنا القرآنية والأكاديمية المتكاملة'
                    )}
                  </h2>

                  <p className="text-sm sm:text-base text-[#F7F4EC]/85 leading-relaxed">
                    {pickLang(
                      admissionSection?.descriptionBn ||
                        'আবাসিক, অনাবাসিক ও ডে-কেয়ার ব্যবস্থায় নতুন শিক্ষাবর্ষে সীমিত আসনে শিক্ষার্থী ভর্তি করা হচ্ছে। ঘরে বসেই অনলাইনে ভর্তির প্রাথমিক আবেদন সম্পন্ন করা যাবে।',
                      admissionSection?.descriptionEn ||
                        'Applications are invited for Residential, Non-Residential, and Day-Care seats across all five academic departments. Submit your application online or visit the campus admission desk.',
                      admissionSection?.descriptionAr ||
                        'يستمر قبول الطلاب في النظام الداخلي والخارجي والرعاية النهارية في جميع الأقسام.'
                    )}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-3.5">
                    <button
                      type="button"
                      onClick={onOpenOnlineAdmission}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/55 shadow-lg transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#E8D58A]" />
                      <span>
                        {pickLang(
                          admissionSection?.primaryCtaBn || 'অনলাইন ভর্তি ফরম পূরণ করুন',
                          admissionSection?.primaryCtaEn || 'Complete Online Admission Form',
                          admissionSection?.primaryCtaAr || 'تعبئة استمارة القبول الإلكترونية'
                        )}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('/contact')}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-[#0A1B33] hover:bg-[#10294D] text-[#E8D58A] border border-[#D9B64C]/35 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-[#D9B64C]" />
                      <span>
                        {pickLang(
                          'ভর্তি অফিসে যোগাযোগ',
                          'Contact Admission Desk',
                          'التواصل مع مكتب القبول'
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      step: '01',
                      titleBn: 'অনলাইন বা সরাসরি আবেদন',
                      titleEn: 'Submit Application',
                      titleAr: 'تقديم الطلب',
                      descBn:
                        'ওয়েবসাইটের ভর্তি পাতা থেকে অথবা মাদ্রাসা অফিসে এসে শিক্ষার্থীর তথ্য ও কাঙ্ক্ষিত বিভাগ নির্বাচন করে আবেদন করুন।',
                      descEn:
                        'Fill out the online admission form with student details, preferred department, and residential mode.',
                      descAr:
                        'تعبئة بيانات الطالب والقسم المطلوب عبر الموقع أو في مكتب المدرسة.',
                    },
                    {
                      step: '02',
                      titleBn: 'মৌখিক ও তিলাওয়াত মূল্যায়ন',
                      titleEn: 'Placement Assessment',
                      titleAr: 'المقابلة وتحديد المستوى',
                      descBn:
                        'শিক্ষার্থীর বয়স, পূর্ববর্তী পাঠ এবং কুরআন তিলাওয়াতের মান যাচাই করে উপযুক্ত শ্রেণি ও বিভাগ নির্ধারণ করা হয়।',
                      descEn:
                        'A friendly oral and academic assessment determines the appropriate class and Quranic placement.',
                      descAr:
                        'تقييم مستوى التلاوة والتحصيل الدراسي لتحديد الصف المناسب.',
                    },
                    {
                      step: '03',
                      titleBn: 'প্রয়োজনীয় কাগজপত্র যাচাই',
                      titleEn: 'Document Verification',
                      titleAr: 'توثيق المستندات',
                      descBn:
                        'জন্ম নিবন্ধন সনদ, পাসপোর্ট সাইজ ছবি এবং অভিভাবকের জাতীয় পরিচয়পত্রের ফটোকপি জমা প্রদান।',
                      descEn:
                        'Submit birth certificate copy, passport-size photographs, and guardian identification.',
                      descAr:
                        'تقديم شهادة الميلاد والصور الشخصية وهوية ولي الأمر.',
                    },
                    {
                      step: '04',
                      titleBn: 'ভর্তি অনুমোদন ও আইডি গ্রহণ',
                      titleEn: 'Enrollment & Student ID',
                      titleAr: 'تأكيد القبول واستلام البطاقة',
                      descBn:
                        'ভর্তি চূড়ান্ত হলে ডিজিটাল স্টুডেন্ট আইডি ও অভিভাবক পোর্টাল লগইন সুবিধা প্রদান করা হয়।',
                      descEn:
                        'Upon confirmation, the student receives an official Student ID and Guardian Portal access.',
                      descAr:
                        'إصدار الرقم الطلابي وتفعيل حساب بوابة ولي الأمر.',
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="rounded-2xl bg-[#0A1B33]/95 border border-[#D9B64C]/30 p-5 space-y-2.5"
                    >
                      <span className="font-mono-num text-xs font-bold text-[#D9B64C]">
                        {pickLang(`ধাপ ${item.step}`, `Step ${item.step}`, `الخطوة ${item.step}`)}
                      </span>
                      <h3 className="font-display-bn text-base font-bold text-[#F7F4EC]">
                        {pickLang(item.titleBn, item.titleEn, item.titleAr)}
                      </h3>
                      <p className="text-xs text-[#9CA9B8] leading-relaxed">
                        {pickLang(item.descBn, item.descEn, item.descAr)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 10: LATEST PUBLISHED NOTICES (Warm Ivory Canvas)
           =================================================================== */}
        {isSectionVisible('notices_preview') && (
          <section
            id="notices-section"
            data-testid="section-g-h-notices-events"
            className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 uqcm-ivory-lattice border-b border-[#D9B64C]/25"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#087A59]">
                    <FileText className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'প্রকাশিত নোটিশ বোর্ড',
                        'Official Notice Board',
                        'لوحة الإعلانات الرسمية'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl font-bold text-[#061326]">
                    {pickLang(
                      'সর্বশেষ প্রাতিষ্ঠানিক নোটিশ ও বিজ্ঞপ্তিসমূহ',
                      'Latest Published Institutional Notices',
                      'أحدث الإعلانات والتعاميم المنشورة'
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('/notices')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#061326] hover:bg-[#0A1B33] text-[#E8D58A] border border-[#D9B64C]/40 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>
                    {pickLang('সকল নোটিশ দেখুন', 'View All Notices', 'عرض جميع الإعلانات')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {publishedNotices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedNotices.map(({ notice, cmsMeta }) => (
                    <article
                      key={notice.id}
                      className="uqcm-mihrab-card rounded-2xl bg-white p-6 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#122033]/70">
                          <span className="font-mono-num font-semibold text-[#087A59]">
                            {notice.publishDate}
                          </span>
                          {notice.priority !== 'normal' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#061326] text-[#E8D58A]">
                              {pickLang('গুরুত্বপূর্ণ', 'Important', 'هام')}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display-bn text-lg font-bold text-[#061326] leading-snug">
                          {pickLang(notice.titleBn, notice.titleEn, cmsMeta.titleAr)}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed line-clamp-3">
                          {pickLang(notice.contentBn, cmsMeta.contentEn, cmsMeta.contentAr)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#D9B64C]/20 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase text-[#087A59]">
                          {cmsMeta.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigateTo('/notices')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#061326] hover:text-[#087A59] transition-colors cursor-pointer"
                        >
                          <span>{pickLang('বিস্তারিত', 'Read Notice', 'التفاصيل')}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#D9B64C]" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-[#D9B64C]/30 p-8 text-center space-y-2">
                  <FileText className="w-7 h-7 text-[#D9B64C] mx-auto" />
                  <p className="text-sm font-bold text-[#061326]">
                    {pickLang(
                      'বর্তমানে কোনো নতুন পাবলিক নোটিশ প্রকাশিত নেই।',
                      'No public notices are currently published.',
                      'لا توجد إعلانات عامة منشورة حالياً.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 11: UPCOMING PUBLISHED EVENTS & ACADEMIC CALENDAR (Navy)
           =================================================================== */}
        {isSectionVisible('events_news') && (
          <section
            id="events-section"
            data-testid="section-upcoming-events"
            className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0A1B33] text-[#F7F4EC] border-b border-[#D9B64C]/30 uqcm-islamic-lattice"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E8D58A]">
                    <Calendar className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'ইভেন্ট ও একাডেমিক কর্মসূচি',
                        'Published Events & Institutional Calendar',
                        'الفعاليات والأنشطة المدرسية'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl font-bold text-[#F7F4EC]">
                    {pickLang(
                      'আসন্ন দ্বীনি মাহফিল, প্রতিযোগিতা ও একাডেমিক ইভেন্টসমূহ',
                      'Upcoming Academic Milestones, Competitions & Gatherings',
                      'الفعاليات والمسابقات والمناسبات الأكاديمية القادمة'
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('/events')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#061326] hover:bg-[#10294D] text-[#E8D58A] border border-[#D9B64C]/40 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>
                    {pickLang('সকল ইভেন্ট দেখুন', 'View All Events', 'عرض جميع الفعاليات')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {publishedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publishedEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-2xl bg-[#061326]/90 border border-[#D9B64C]/30 p-6 flex flex-col justify-between space-y-4 hover:border-[#D9B64C]/55 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#E8D58A]">
                          <span className="font-mono-num font-bold">{event.eventDate}</span>
                          <span>·</span>
                          <span className="text-[#9CA9B8]">
                            {pickLang(event.badgeBn, event.badgeEn, event.badgeAr)}
                          </span>
                        </div>
                        <h3 className="font-display-bn text-lg sm:text-xl font-bold text-[#F7F4EC]">
                          {pickLang(event.titleBn, event.titleEn, event.titleAr)}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#F7F4EC]/80 leading-relaxed">
                          {pickLang(event.descriptionBn, event.descriptionEn, event.descriptionAr)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#D9B64C]/20 flex items-center justify-between text-xs">
                        <span className="text-[#E8D58A]/85 uppercase">{event.category}</span>
                        <button
                          type="button"
                          onClick={() => navigateTo('/events')}
                          className="inline-flex items-center gap-1 font-bold text-[#D9B64C] hover:text-[#E8D58A] cursor-pointer"
                        >
                          <span>{pickLang('বিস্তারিত', 'Event Details', 'التفاصيل')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-[#061326]/85 border border-[#D9B64C]/25 p-8 text-center space-y-2">
                  <Calendar className="w-7 h-7 text-[#D9B64C] mx-auto" />
                  <p className="text-sm font-bold text-[#F7F4EC]">
                    {pickLang(
                      'বর্তমানে কোনো আসন্ন পাবলিক ইভেন্ট তালিকাভুক্ত নেই।',
                      'No upcoming public events are currently scheduled.',
                      'لا توجد فعاليات عامة مجدولة حالياً.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 12: INSTITUTIONAL GALLERY WITH LIGHTBOX (Warm Ivory)
           =================================================================== */}
        {isSectionVisible('gallery_preview') && (
          <section
            id="gallery-section"
            data-testid="section-j-campus-gallery"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 uqcm-ivory-lattice border-b border-[#D9B64C]/25"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#087A59]">
                    <ImageIcon className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'ক্যাম্পাস ও একাডেমিক গ্যালারি',
                        'Institutional Campus Gallery',
                        'معرض صور الحرم المدرسي'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl font-bold text-[#061326]">
                    {pickLang(
                      'মাদ্রাসা প্রাঙ্গণ ও শিক্ষা কার্যক্রমের আলোকচিত্র',
                      'Visual Glimpses of Our Campus & Academic Life',
                      'لقطات من الحرم المدرسي والأنشطة التعليمية'
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('/gallery')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#061326] hover:bg-[#0A1B33] text-[#E8D58A] border border-[#D9B64C]/40 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>
                    {pickLang('সম্পূর্ণ গ্যালারি দেখুন', 'Open Full Gallery', 'فتح المعرض الكامل')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {publishedGallery.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedGallery.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedGalleryId(item.id)}
                      className="group uqcm-mihrab-card rounded-2xl bg-white overflow-hidden text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B64C]"
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden bg-[#061326] flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={pickLang(item.titleBn, item.titleEn, item.titleAr)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="p-6 text-center space-y-2">
                            <ImageIcon className="w-8 h-8 text-[#D9B64C] mx-auto" />
                            <p className="text-xs text-[#E8D58A] font-semibold">
                              {pickLang(item.categoryBn, item.categoryEn, item.categoryAr)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#087A59]">
                          {pickLang(item.categoryBn, item.categoryEn, item.categoryAr)}
                        </span>
                        <h3 className="font-display-bn text-base font-bold text-[#061326] line-clamp-1">
                          {pickLang(item.titleBn, item.titleEn, item.titleAr)}
                        </h3>
                        <p className="text-xs text-[#122033]/75 line-clamp-2">
                          {pickLang(item.captionBn, item.captionEn, item.captionAr)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  data-testid="public-gallery-empty-state"
                  className="rounded-2xl bg-white border border-[#D9B64C]/35 p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-3 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#061326] text-[#E8D58A] flex items-center justify-center mx-auto border border-[#D9B64C]/40">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                    {pickLang(
                      'প্রাতিষ্ঠানিক ফটো গ্যালারি শীঘ্রই হালনাগাদ করা হবে',
                      'Official Campus Photography Will Be Published Soon',
                      'سيتم نشر الصور الرسمية للحرم المدرسي قريباً'
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#122033]/75 leading-relaxed">
                    {pickLang(
                      'মাদ্রাসা প্রশাসনের অনুমোদিত প্রকৃত ক্যাম্পাস ও একাডেমিক কার্যক্রমের আলোকচিত্র ওয়েবসাইট সিএমএস থেকে প্রকাশের সাথে সাথে এখানে প্রদর্শিত হবে।',
                      'Verified photographs of campus classrooms, Hifz sessions, and academic events appear here automatically once published by the administration.',
                      'تظهر هنا الصور المعتمدة للفصول الدراسية وحلقات التحفيظ فور نشرها من قِبل الإدارة.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            SECTION 13: CONTACT & CAMPUS INFORMATION (Royal Navy Sanctuary)
           =================================================================== */}
        {isSectionVisible('contact_footer') && (
          <section
            id="contact-section"
            data-testid="section-k-contact-location"
            className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0A1B33] text-[#F7F4EC] uqcm-islamic-lattice"
          >
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E8D58A]">
                    <MapPin className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {pickLang(
                        'সরাসরি যোগাযোগ ও ক্যাম্পাস ঠিকানা',
                        'Campus Location & Official Contact',
                        'عنوان الحرم المدرسي والتواصل الرسمي'
                      )}
                    </span>
                  </div>
                  <h2 className="font-display-bn text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F7F4EC]">
                    {pickLang(
                      'ভর্তি ও একাডেমিক যেকোনো তথ্যের জন্য আমাদের ক্যাম্পাসে স্বাগতম',
                      'Visit Our Campus or Reach Out to the Administrative Office',
                      'نرحب بزيارتكم للحرم المدرسي أو التواصل مع مكتب الإدارة'
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('/contact')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#D9B64C] hover:bg-[#E8D58A] text-[#061326] transition-colors cursor-pointer self-start md:self-auto"
                >
                  <span>
                    {pickLang(
                      'বিস্তারিত যোগাযোগ পাতা',
                      'Open Contact Page',
                      'صفحة التواصل الكاملة'
                    )}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl bg-[#061326]/90 border border-[#D9B64C]/30 p-6 space-y-3">
                  <MapPin className="w-5 h-5 text-[#D9B64C]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8D58A]">
                    {pickLang('ক্যাম্পাস ঠিকানা', 'Campus Address', 'عنوان المدرسة')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EC]/90 leading-relaxed">
                    {pickLang(
                      cmsContact.addressBn || settings.addressBn,
                      cmsContact.addressEn,
                      cmsContact.addressAr
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#061326]/90 border border-[#D9B64C]/30 p-6 space-y-3">
                  <Phone className="w-5 h-5 text-[#D9B64C]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8D58A]">
                    {pickLang('ভর্তি ও তথ্য হেল্পলাইন', 'Official Phone', 'هاتف التواصل')}
                  </h3>
                  <p className="font-mono-num text-sm font-bold text-[#F7F4EC]">
                    {cmsContact.phone || settings.phone || '+880 1711-984321'}
                  </p>
                  {cmsContact.whatsappNumber && (
                    <p className="font-mono-num text-xs text-[#9CA9B8]">
                      WhatsApp: {cmsContact.whatsappNumber}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-[#061326]/90 border border-[#D9B64C]/30 p-6 space-y-3">
                  <Mail className="w-5 h-5 text-[#D9B64C]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8D58A]">
                    {pickLang('অফিশিয়াল ইমেইল', 'Official Email', 'البريد الإلكتروني')}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#F7F4EC] break-all">
                    {cmsContact.email || settings.email || 'office@ummulquranmadrasa.edu.bd'}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#061326]/90 border border-[#D9B64C]/30 p-6 space-y-3">
                  <Clock className="w-5 h-5 text-[#D9B64C]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8D58A]">
                    {pickLang('অফিস সময়সূচি', 'Office Hours', 'ساعات العمل')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EC]/90 leading-relaxed">
                    {pickLang(
                      cmsContact.officeHoursBn ||
                        'শনিবার – বৃহস্পতিবার: সকাল ৮:০০ – বিকাল ৫:০০',
                      cmsContact.officeHoursEn || 'Saturday – Thursday: 8:00 AM – 5:00 PM',
                      cmsContact.officeHoursAr || 'السبت – الخميس: ٨:٠٠ صباحاً – ٥:٠٠ مساءً'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* SECTION 14: ROYAL ISLAMIC LUXURY FOOTER */}
      <PublicFooter
        language={language}
        settings={settings}
        cmsConfig={cmsConfig}
        isAuthenticated={isAuthenticated}
        onNavigatePage={navigateTo}
        onOpenLoginPortal={onOpenLoginPortal}
        onOpenOnlineAdmission={onOpenOnlineAdmission}
        onEnterManagementPortal={onEnterManagementPortal}
      />

      {/* Gallery Lightbox Modal */}
      {selectedGalleryItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedGalleryId(null)}
          className="fixed inset-0 z-50 bg-[#061326]/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-2xl bg-[#0A1B33] border border-[#D9B64C]/40 overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setSelectedGalleryId(null)}
              aria-label="Close gallery preview"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-lg bg-[#061326]/90 text-[#E8D58A] border border-[#D9B64C]/40 flex items-center justify-center hover:bg-[#061326] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {selectedGalleryItem.imageUrl && (
              <div className="max-h-[72vh] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={selectedGalleryItem.imageUrl}
                  alt={pickLang(
                    selectedGalleryItem.titleBn,
                    selectedGalleryItem.titleEn,
                    selectedGalleryItem.titleAr
                  )}
                  className="w-full h-full max-h-[72vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="p-5 text-[#F7F4EC] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8D58A]">
                {pickLang(
                  selectedGalleryItem.categoryBn,
                  selectedGalleryItem.categoryEn,
                  selectedGalleryItem.categoryAr
                )}
              </span>
              <h3 className="font-display-bn text-lg font-bold">
                {pickLang(
                  selectedGalleryItem.titleBn,
                  selectedGalleryItem.titleEn,
                  selectedGalleryItem.titleAr
                )}
              </h3>
              {(selectedGalleryItem.captionBn || selectedGalleryItem.captionEn) && (
                <p className="text-xs text-[#9CA9B8]">
                  {pickLang(
                    selectedGalleryItem.captionBn,
                    selectedGalleryItem.captionEn,
                    selectedGalleryItem.captionAr
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
