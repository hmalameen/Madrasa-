import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type {
  AccountInvitation,
  AdmissionApplication,
  BannerSlide,
  CmsGalleryItem,
  CmsPublicPageSlug,
  DepartmentCode,
  ExaminationSetup,
  GuardianLinkRequest,
  InstitutionSettings,
  Language,
  Notice,
  StaffMember,
  Student,
  WebsiteCmsConfig,
} from '../../types/madrasa';
import { InstitutionalCrest } from '../InstitutionalCrest';
import { PublicNavbar, PublicPagePath } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { AdmissionsModule } from '../Modules/AdmissionsModule';
import {
  getPublishedContactFooter,
  getPublishedGalleryItems,
  getPublishedPageContent,
  getPublishedPublicEvents,
  getPublishedPublicNotices,
  getPublishedPublicProfiles,
} from '../../utils/websiteCmsLogic';

export interface PublicPagesProps {
  activePath: PublicPagePath;
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
  staff: StaffMember[];
  isAuthenticated: boolean;
  onNavigatePage: (page: PublicPagePath) => void;
  onOpenLoginPortal: (invitationCode?: string) => void;
  onEnterManagementPortal: () => void;
  applications: AdmissionApplication[];
  students: Student[];
  guardianLinkRequests: GuardianLinkRequest[];
  accountInvitations: AccountInvitation[];
  onSubmitApplication: (
    payload: Omit<AdmissionApplication, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>
  ) => Promise<AdmissionApplication>;
  onUpdateApplication: (
    applicationId: string,
    updates: Partial<AdmissionApplication>
  ) => Promise<void>;
  onApproveApplication: (
    application: AdmissionApplication,
    assignment: {
      assignedAdmissionNo: string;
      requestedClass: string;
      department: DepartmentCode;
      assignedRollNo: number;
      assignedDormitoryRoom: string;
      assignedMonthlyFeeBdt: number;
      adminRemarks: string;
    }
  ) => Promise<{
    studentId: string;
    admissionNo: string;
    studentInvitationCode?: string;
    guardianInvitationCode?: string;
  }>;
  onReviewGuardianLinkRequest: (
    request: GuardianLinkRequest,
    decision: 'approved' | 'rejected',
    matchedStudentId: string,
    adminNotes: string
  ) => Promise<void>;
  onResendOrRecoverInvitation?: (
    application: AdmissionApplication,
    targetRole: 'student' | 'guardian'
  ) => Promise<void>;
}

interface PageHeaderBannerProps {
  badgeBn: string;
  badgeEn: string;
  badgeAr: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  subtitleBn: string;
  subtitleEn: string;
  subtitleAr: string;
  language: Language;
  onBackHome: () => void;
  onApplyOnline?: () => void;
  testId: string;
}

const PageHeaderBanner: React.FC<PageHeaderBannerProps> = ({
  badgeBn,
  badgeEn,
  badgeAr,
  titleBn,
  titleEn,
  titleAr,
  subtitleBn,
  subtitleEn,
  subtitleAr,
  language,
  onBackHome,
  onApplyOnline,
  testId,
}) => {
  const isRtl = language === 'ar';
  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid={testId}
      className="relative overflow-hidden bg-gradient-to-b from-[#061326] via-[#0A1B33] to-[#062922] text-[#F7F4EC] pt-10 pb-14 sm:pt-14 sm:pb-18 px-4 sm:px-6 lg:px-8 border-b border-[#D9B64C]/35 uqcm-islamic-lattice"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(217,182,76,0.14) 0%, transparent 52%), radial-gradient(circle at 80% 75%, rgba(8,122,89,0.20) 0%, transparent 55%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={onBackHome}
            data-testid="subpage-back-home-btn"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0A1B33]/90 hover:bg-[#10294D] border border-[#D9B64C]/30 text-xs font-semibold text-[#E8D58A] transition-colors cursor-pointer"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span>
              {language === 'bn'
                ? 'হোমপেজে ফিরে যান'
                : language === 'ar'
                  ? 'العودة إلى الرئيسية'
                  : 'Back to Home'}
            </span>
          </button>

          {onApplyOnline && (
            <button
              type="button"
              onClick={onApplyOnline}
              data-testid="subpage-header-admission-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/45 text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8D58A]" />
              <span>
                {language === 'bn'
                  ? 'অনলাইন ভর্তি আবেদন'
                  : language === 'ar'
                    ? 'التسجيل الإلكتروني'
                    : 'Online Admission'}
              </span>
            </button>
          )}
        </div>

        <div className="max-w-3xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#D9B64C]/15 border border-[#D9B64C]/35 text-[#E8D58A] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#D9B64C]" />
            <span>{language === 'bn' ? badgeBn : language === 'ar' ? badgeAr : badgeEn}</span>
          </div>

          <h1 className="font-display-bn text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#F7F4EC] leading-[1.22]">
            {language === 'bn' ? titleBn : language === 'ar' ? titleAr : titleEn}
          </h1>

          <p className="text-sm sm:text-base text-[#F7F4EC]/85 leading-relaxed">
            {language === 'bn' ? subtitleBn : language === 'ar' ? subtitleAr : subtitleEn}
          </p>
        </div>
      </div>
    </section>
  );
};

export const PublicPages: React.FC<PublicPagesProps> = ({
  activePath,
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
  onNavigatePage,
  onOpenLoginPortal,
  onEnterManagementPortal,
  applications,
  students,
  guardianLinkRequests,
  accountInvitations,
  onSubmitApplication,
  onUpdateApplication,
  onApproveApplication,
  onReviewGuardianLinkRequest,
  onResendOrRecoverInvitation,
}) => {
  const isRtl = language === 'ar';
  const route: CmsPublicPageSlug = activePath === '/' ? '/about' : activePath;
  const slugKey = route.slice(1);

  const [noticeSearch, setNoticeSearch] = useState('');
  const [selectedNoticeCategory, setSelectedNoticeCategory] = useState<string>('ALL');
  const [selectedEventCategory, setSelectedEventCategory] = useState<string>('ALL');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('ALL');
  const [lightboxItem, setLightboxItem] = useState<CmsGalleryItem | null>(null);

  // Contact inquiry form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactDepartment, setContactDepartment] = useState('HIFZ');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const pickLang = (bn?: string, en?: string, ar?: string, fallback = '') => {
    if (language === 'bn') return bn || en || fallback;
    if (language === 'ar') return ar || en || bn || fallback;
    return en || bn || fallback;
  };

  // Published CMS Data
  const customPage = getPublishedPageContent(cmsConfig, route);
  const publishedTeachers = getPublishedPublicProfiles(cmsConfig, 'teacher');
  const publishedAdmins = getPublishedPublicProfiles(cmsConfig, 'administration');
  const allPublishedNotices = getPublishedPublicNotices(notices);
  const allPublishedEvents = getPublishedPublicEvents(cmsConfig, bannerSlides);
  const allPublishedGallery = getPublishedGalleryItems(cmsConfig);
  const cmsContact = getPublishedContactFooter(cmsConfig, settings);

  // Filtered Notices
  const filteredNotices = allPublishedNotices.filter(({ notice, cmsMeta }) => {
    const matchesCat =
      selectedNoticeCategory === 'ALL' ||
      cmsMeta.category.toUpperCase() === selectedNoticeCategory;
    const q = noticeSearch.trim().toLowerCase();
    if (!q) return matchesCat;
    const hay =
      `${notice.titleBn} ${notice.titleEn} ${notice.contentBn} ${cmsMeta.contentEn}`.toLowerCase();
    return matchesCat && hay.includes(q);
  });

  // Filtered Events
  const filteredEvents = allPublishedEvents.filter(
    (ev) =>
      selectedEventCategory === 'ALL' ||
      ev.category.toUpperCase() === selectedEventCategory
  );

  // Filtered Gallery
  const galleryCategories = Array.from(
    new Set(allPublishedGallery.map((g) => g.categoryEn || 'Campus'))
  );
  const filteredGallery = allPublishedGallery.filter(
    (g) =>
      selectedGalleryCategory === 'ALL' ||
      (g.categoryEn || 'Campus') === selectedGalleryCategory
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    setContactSubmitted(true);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid={`public-subpage-${slugKey}`}
      className="min-h-screen bg-[#F7F4EC] text-[#122033] flex flex-col uqcm-ivory-lattice"
    >
      {/* Sticky Royal Islamic Luxury Navigation Bar */}
      <PublicNavbar
        activePath={activePath}
        language={language}
        onLanguageChange={onLanguageChange}
        settings={settings}
        isAuthenticated={isAuthenticated}
        onNavigatePage={onNavigatePage}
        onOpenLoginPortal={() => onOpenLoginPortal()}
        onOpenOnlineAdmission={() => onNavigatePage('/admission')}
        onEnterManagementPortal={onEnterManagementPortal}
      />

      {/* Non-blocking CMS Sync Status Banner */}
      {(cmsLoadStatus === 'loading' || cmsLoadStatus === 'error') && (
        <div
          data-testid={
            cmsLoadStatus === 'loading' ? 'public-cms-loading-state' : 'public-cms-error-state'
          }
          className={`w-full px-4 py-2 text-xs font-medium border-b ${
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
                    'সর্বশেষ প্রকাশিত তথ্য লোড করতে সমস্যা হয়েছে।',
                    'Could not refresh latest published updates.',
                    'تعذر تحديث أحدث البيانات المنشورة.'
                  )}
            </span>
            {cmsLoadStatus === 'error' && onRetryLoadCms && (
              <button
                type="button"
                onClick={onRetryLoadCms}
                data-testid="public-cms-retry-btn"
                className="px-3 py-1 rounded-md bg-[#D9B64C] text-[#061326] font-bold hover:bg-[#E8D58A] cursor-pointer"
              >
                {pickLang('পুনরায় চেষ্টা করুন', 'Retry', 'إعادة المحاولة')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          1. ABOUT PAGE (/about)
         ===================================================================== */}
      {route === '/about' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-about"
            badgeBn={customPage?.badgeBn || 'প্রাতিষ্ঠানিক পরিচিতি ও আদর্শ'}
            badgeEn={customPage?.badgeEn || 'Institutional Heritage & Identity'}
            badgeAr={customPage?.badgeAr || 'نبذة عن المدرسة ورسالتها'}
            titleBn={
              customPage?.titleBn ||
              settings.institutionNameBn ||
              'উম্মুল কুরআন ক্যাডেট মাদ্রাসা পরিচিতি'
            }
            titleEn={
              customPage?.titleEn ||
              `About ${settings.institutionNameEn || 'Ummul Quran Cadet Madrasa'}`
            }
            titleAr={customPage?.titleAr || 'عن مدرسة أم القرآن كاديت الإسلامية'}
            subtitleBn={
              customPage?.subtitleBn ||
              'পবিত্র কুরআন, সুন্নাহভিত্তিক আদব এবং আধুনিক সাধারণ শিক্ষার সমন্বয়ে এক আদর্শ দ্বীনি শিক্ষাপ্রতিষ্ঠান।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'An integrated Islamic educational institution harmonizing Hifzul Quran, classical Islamic sciences, and modern academics.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'مؤسسة تعليمية إسلامية متكاملة تجمع بين تحفيظ القرآن الكريم والعلوم الشرعية والتعليم الحديث.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
            onApplyOnline={() => onNavigatePage('/admission')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="uqcm-mihrab-card rounded-2xl bg-white p-6 sm:p-8 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#087A59]">
                    {pickLang('আমাদের প্রতিষ্ঠার লক্ষ্য', 'Founding Vision & Purpose', 'رؤية التأسيس')}
                  </span>
                  <h2 className="font-display-bn text-2xl font-bold text-[#061326]">
                    {pickLang(
                      'দ্বীনি ইলম ও আধুনিক শিক্ষার সমন্বয়ে যোগ্য প্রজন্ম গঠন',
                      'Preparing Upright Scholars, Huffaz, and Capable Leaders',
                      'إعداد جيل متمسك بالقرآن والسنة ومتفوق في العلوم الحديثة'
                    )}
                  </h2>
                  <p className="text-sm text-[#122033]/85 leading-relaxed">
                    {pickLang(
                      customPage?.summaryBn ||
                        'উম্মুল কুরআন ক্যাডেট মাদ্রাসা প্রতিষ্ঠিত হয়েছে এমন এক সময়ে যখন অভিভাবকগণ সন্তানের বিশুদ্ধ ঈমান-আমল রক্ষার পাশাপাশি আধুনিক শিক্ষায় দক্ষতা অর্জনের জন্য একটি নির্ভরযোগ্য পরিবেশ খুঁজছেন। এখানে কুরআন মাজীদের বিশুদ্ধ তাজবীদ ও হিফজের সাথে বাংলা, ইংরেজি, গণিত ও বিজ্ঞানের সমন্বিত পাঠদান নিশ্চিত করা হয়।',
                      customPage?.summaryEn ||
                        'Ummul Quran Cadet Madrasa was established to offer families a trusted sanctuary where children receive authentic Quranic memorization and classical Islamic upbringing alongside strong instruction in Bengali, English, Mathematics, and Science.',
                      customPage?.summaryAr ||
                        'تأسست مدرسة أم القرآن كاديت الإسلامية لتكون بيئة تربوية موثوقة تجمع بين تحفيظ القرآن الكريم والتربية الإيمانية والعلوم المعاصرة.'
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-2.5">
                    <Compass className="w-5 h-5 text-[#087A59]" />
                    <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                      {pickLang('আমাদের মিশন (Mission)', 'Our Mission', 'رسالتنا')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                      {pickLang(
                        'বিশুদ্ধ আকীদা, সুন্নাহভিত্তিক আমল, উন্নত নৈতিক চরিত্র ও যুগোপযোগী একাডেমিক শিক্ষার মাধ্যমে আদর্শ নাগরিক গড়ে তোলা।',
                        'To nurture students in authentic Islamic creed, Prophetic manners, and rigorous academic competence.',
                        'تربية الطلاب على العقيدة الصحيحة والأخلاق النبوية والتفوق العلمي.'
                      )}
                    </p>
                  </div>

                  <div className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-2.5">
                    <Sparkles className="w-5 h-5 text-[#D9B64C]" />
                    <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                      {pickLang('আমাদের ভিশন (Vision)', 'Our Vision', 'رؤيتنا')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                      {pickLang(
                        'জাতীয় ও আন্তর্জাতিক পর্যায়ে কুরআন ও আধুনিক শিক্ষার সমন্বিত মডেল প্রতিষ্ঠান হিসেবে নেতৃত্ব প্রদান।',
                        'To stand as a model institution uniting sacred Quranic scholarship with contemporary academic excellence.',
                        'أن نكون مؤسسة نموذجية رائدة في الجمع بين القرآن الكريم والعلوم الحديثة.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="uqcm-royal-panel rounded-2xl p-6 sm:p-8 text-[#F7F4EC] space-y-6">
                  <div className="flex items-center gap-4 border-b border-[#D9B64C]/25 pb-5">
                    <div className="w-14 h-14 rounded-xl bg-white p-1 shrink-0 ring-2 ring-[#D9B64C]/50 flex items-center justify-center">
                      <InstitutionalCrest className="w-12 h-12" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#E8D58A]">
                        {pickLang('প্রাতিষ্ঠানিক তথ্যাদি', 'Official Fact Sheet', 'البيانات الرسمية')}
                      </p>
                      <h3 className="font-display-bn text-lg font-bold text-[#F7F4EC]">
                        {pickLang(
                          settings.institutionNameBn,
                          settings.institutionNameEn,
                          settings.institutionNameAr || 'مدرسة أم القرآن كاديت الإسلامية'
                        )}
                      </h3>
                    </div>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm">
                    <li className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-[#9CA9B8]">
                        {pickLang('চলমান শিক্ষাবর্ষ', 'Active Academic Year', 'العام الدراسي')}
                      </span>
                      <span className="font-bold text-[#E8D58A]">
                        {settings.academicYear || '2026-2027'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-[#9CA9B8]">
                        {pickLang('হিজরি শিক্ষাবর্ষ', 'Hijri Session', 'السنة الهجرية')}
                      </span>
                      <span className="font-mono-num font-bold text-[#F7F4EC]">
                        {settings.hijriYear || '1447-1448 AH'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-[#9CA9B8]">
                        {pickLang('সক্রিয় বিভাগসমূহ', 'Active Streams', 'الأقسام المفعلة')}
                      </span>
                      <span className="font-semibold text-[#F7F4EC]">
                        {pickLang('৫টি সমন্বিত বিভাগ', '5 Integrated Streams', '٥ أقسام متكاملة')}
                      </span>
                    </li>
                    <li className="flex items-start justify-between gap-4">
                      <span className="text-[#9CA9B8]">
                        {pickLang('ক্যাম্পাস ঠিকানা', 'Campus Address', 'العنوان')}
                      </span>
                      <span className="font-semibold text-[#F7F4EC] text-right max-w-[210px]">
                        {pickLang(
                          cmsContact.addressBn || settings.addressBn,
                          cmsContact.addressEn,
                          cmsContact.addressAr
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </>
      )}

      {/* =====================================================================
          2. ACADEMIC PAGE (/academic)
         ===================================================================== */}
      {route === '/academic' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-academic"
            badgeBn={customPage?.badgeBn || 'একাডেমিক কারিকুলাম ও মূল্যায়ন'}
            badgeEn={customPage?.badgeEn || 'Curriculum, Daily Schedule & Grading'}
            badgeAr={customPage?.badgeAr || 'المنهج الأكاديمي ونظام التقييم'}
            titleBn={customPage?.titleBn || 'একাডেমিক পরিচালনা ও পাঠদান পদ্ধতি'}
            titleEn={customPage?.titleEn || 'Academic Curriculum & Assessment System'}
            titleAr={customPage?.titleAr || 'النظام الأكاديمي ومنهجية التدريس'}
            subtitleBn={
              customPage?.subtitleBn ||
              'কুরআন মাজীদ হিফজ, তাজবীদ, কিতাব ও জাতীয় শিক্ষাক্রমের সমন্বয়ে প্রণীত সুশৃঙ্খল একাডেমিক কাঠামো।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'A structured daily learning rhythm combining sacred Quranic mastery with national core subjects.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'جدول دراسي منظم يجمع بين إتقان القرآن الكريم والمواد الدراسية الأساسية.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
            onApplyOnline={() => onNavigatePage('/admission')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  titleBn: '১ম সাময়িক পরীক্ষা',
                  titleEn: 'First Term Assessment',
                  titleAr: 'اختبار الفصل الأول',
                  descBn:
                    'শিক্ষাবর্ষের প্রথম প্রান্তিকে পঠিত কুরআন তিলাওয়াত/হিফজ এবং লিখিত বিষয়সমূহের মূল্যায়ন।',
                  descEn:
                    'Evaluates foundational progress in Quranic recitation/memorization and written core subjects.',
                  descAr:
                    'تقييم التقدم في التلاوة والحفظ والمواد التحريرية خلال الثلث الأول من العام.',
                },
                {
                  titleBn: 'অর্ধবার্ষিক পরীক্ষা',
                  titleEn: 'Mid-Term Examination',
                  titleAr: 'اختبار منتصف العام',
                  descBn:
                    'ষাণ্মাসিক সিলেবাসের ওপর পূর্ণাঙ্গ মৌখিক ও লিখিত পরীক্ষা এবং অভিভাবক মতবিনিময় সভা।',
                  descEn:
                    'Comprehensive mid-year oral and written examination followed by guardian consultation.',
                  descAr:
                    'اختبار شفوي وتحريري شامل في منتصف العام الدراسي مع اجتماع أولياء الأمور.',
                },
                {
                  titleBn: 'বার্ষিক চূড়ান্ত পরীক্ষা',
                  titleEn: 'Annual Final Examination',
                  titleAr: 'الاختبار النهائي السنوي',
                  descBn:
                    'বার্ষিক সিলেবাস সমাপ্তির পর চূড়ান্ত মূল্যায়ন, মেধা তালিকা ও পরবর্তী শ্রেণিতে উত্তীর্ণকরণ।',
                  descEn:
                    'Year-end comprehensive assessment determining final GPA, merit standing, and promotion.',
                  descAr:
                    'التقييم الختامي لتحديد المعدل التراكمي والانتقال إلى المرحلة التالية.',
                },
              ].map((term, idx) => (
                <div
                  key={idx}
                  className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-3"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#061326] text-[#E8D58A] font-mono-num text-xs font-bold">
                    0{idx + 1}
                  </span>
                  <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                    {pickLang(term.titleBn, term.titleEn, term.titleAr)}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                    {pickLang(term.descBn, term.descEn, term.descAr)}
                  </p>
                </div>
              ))}
            </div>
          </main>
        </>
      )}

      {/* =====================================================================
          3. DEPARTMENTS PAGE (/departments)
         ===================================================================== */}
      {route === '/departments' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-departments"
            badgeBn={customPage?.badgeBn || 'পাঁচটি সমন্বিত শিক্ষা বিভাগ'}
            badgeEn={customPage?.badgeEn || 'Five Specialized Academic Streams'}
            badgeAr={customPage?.badgeAr || 'الأقسام التعليمية الخمسة'}
            titleBn={customPage?.titleBn || 'মাদ্রাসার শিক্ষা বিভাগসমূহ ও পাঠ্যক্রম'}
            titleEn={customPage?.titleEn || 'Academic Departments & Curriculum Streams'}
            titleAr={customPage?.titleAr || 'الأقسام العلمية والمناهج الدراسية'}
            subtitleBn={
              customPage?.subtitleBn ||
              'নূরানী থেকে শুরু করে হিফজুল কুরআন, কিতাব ও ক্যাডেট জেনারেল শিক্ষা—প্রত্যেক স্তরের জন্য সুনির্দিষ্ট পাঠ্যক্রম।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Structured progression from foundational Noorani phonetics to Hifzul Quran, Kitab studies, and general academics.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'تدرج منهجي من المرحلة النورانية إلى تحفيظ القرآن الكريم والعلوم الشرعية والتعليم العام.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
            onApplyOnline={() => onNavigatePage('/admission')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-6">
            {[
              {
                code: 'NOORANI',
                titleBn: '১. নূরানী ও মক্তব বিভাগ',
                titleEn: '1. Noorani & Foundational Maktab Stream',
                titleAr: '١. القسم النوراني والتمهيدي',
                descBn:
                  'অল্পবয়সী শিক্ষার্থীদের জন্য আরবি হরফের সঠিক মাখরাজ, নূরানী কায়দা, আমপারা, মাসনূন দোয়া ও নামাজের বাস্তব প্রশিক্ষণ এবং বাংলা, ইংরেজি ও গণিতের প্রাথমিক পাঠ।',
                descEn:
                  'Foundational Arabic phonetics (Makhraj), Noorani Qaida, Ampara, daily Prophetic Duas, practical Salah instruction, and early Bengali, English, and Mathematics.',
                descAr:
                  'تعليم مخارج الحروف والقاعدة النورانية وجزء عم والأدعية اليومية ومبادئ اللغات والرياضيات.',
              },
              {
                code: 'NAZERA',
                titleBn: '২. নাজেরা ও তাজবীদ বিভাগ',
                titleEn: '2. Nazera & Applied Tajweed Stream',
                titleAr: '٢. قسم الناظرة والتجويد',
                descBn:
                  'হিফজ শুরুর পূর্বে তাজবীদ ও তারতীলের সাথে সম্পূর্ণ কুরআন মাজীদ দেখে দেখে নির্ভুল ও সাবলীলভাবে তিলাওয়াত সম্পন্ন করার বিশেষায়িত বিভাগ।',
                descEn:
                  'Complete sight-recitation of the Holy Quran with applied Tajweed rules and Tartil, preparing students for rapid and accurate Hifz.',
                descAr:
                  'إتقان تلاوة المصحف الشريف كاملاً بأحكام التجويد تمهيداً لمرحلة الحفظ.',
              },
              {
                code: 'HIFZ',
                titleBn: '৩. হিফজুল কুরআন বিভাগ',
                titleEn: '3. International Standard Hifzul Quran Stream',
                titleAr: '٣. قسم تحفيظ القرآن الكريم',
                descBn:
                  'অভিজ্ঞ হাফেজ ও কারী উস্তাদদের তত্ত্বাবধানে দৈনিক সবক, সাতসবক ও আমুখতার নিয়মতান্ত্রিক পদ্ধতিতে পূর্ণ ৩০ পারা কুরআন মাজীদ হিফজ।',
                descEn:
                  'Methodical memorization of all 30 Juz through daily Sabaq, Sabqi, and Manzil cycles under experienced Huffaz and Qaris.',
                descAr:
                  'حفظ القرآن الكريم كاملاً عبر نظام السبق والسبقي والمراجعة اليومية المتقنة.',
              },
              {
                code: 'KITAB',
                titleBn: '৪. কিতাব ও আলিয়া সমন্বিত বিভাগ',
                titleEn: '4. Kitab, Arabic & Alia Integrated Stream',
                titleAr: '٤. قسم العلوم الشرعية والعالية',
                descBn:
                  'আরবি ব্যাকরণ (নাহু-সরফ), ফিকহ, উসূলুল ফিকহ, হাদীস ও তাফসীরের মৌলিক কিতাবসমূহ অধ্যয়নের পাশাপাশি বোর্ড কারিকুলামের সমন্বিত একাডেমিক পাঠদান।',
                descEn:
                  'Classical Arabic grammar, Fiqh, Hadith, and Tafsir integrated with recognized board academic subjects.',
                descAr:
                  'دراسة النحو والصرف والفقه والحديث والتفسير مع المواد الأكاديمية المعتمدة.',
              },
              {
                code: 'GENERAL',
                titleBn: '৫. ক্যাডেট ও জেনারেল শিক্ষা বিভাগ',
                titleEn: '5. Cadet Discipline & General Education Stream',
                titleAr: '٥. قسم التعليم العام والانضباط الطلابي',
                descBn:
                  'জাতীয় শিক্ষাক্রমের বাংলা, ইংরেজি, গণিত, বিজ্ঞান ও আইসিটি বিষয়ে নিবিড় পাঠদান এবং ইসলামি আদব ও ক্যাডেট শৃঙ্খলার সমন্বয়।',
                descEn:
                  'Strong academic instruction in Bengali, English, Mathematics, Science, and ICT within an Islamic cadet environment.',
                descAr:
                  'تدريس اللغات والرياضيات والعلوم وتقنية المعلومات في بيئة إسلامية منضبطة.',
              },
            ].map((dept) => (
              <div
                key={dept.code}
                className="uqcm-mihrab-card rounded-2xl bg-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-3xl">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#061326] text-[#E8D58A]">
                    {dept.code}
                  </span>
                  <h2 className="font-display-bn text-xl sm:text-2xl font-bold text-[#061326]">
                    {pickLang(dept.titleBn, dept.titleEn, dept.titleAr)}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                    {pickLang(dept.descBn, dept.descEn, dept.descAr)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigatePage('/admission')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] shrink-0 self-start md:self-center cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-[#E8D58A]" />
                  <span>
                    {pickLang('ভর্তির আবেদন করুন', 'Apply for Stream', 'التسجيل في القسم')}
                  </span>
                </button>
              </div>
            ))}
          </main>
        </>
      )}

      {/* =====================================================================
          4. TEACHERS PAGE (/teachers)
         ===================================================================== */}
      {route === '/teachers' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-teachers"
            badgeBn={customPage?.badgeBn || 'উস্তাদ ও শিক্ষকমণ্ডলী'}
            badgeEn={customPage?.badgeEn || 'Qualified Faculty & Mentors'}
            badgeAr={customPage?.badgeAr || 'هيئة التدريس والأساتذة'}
            titleBn={customPage?.titleBn || 'আমাদের অভিজ্ঞ উস্তাদ ও শিক্ষকমণ্ডলী'}
            titleEn={customPage?.titleEn || 'Our Qualified Scholars, Huffaz & Educators'}
            titleAr={customPage?.titleAr || 'نخبة من العلماء والحفاظ والمعلمين'}
            subtitleBn={
              customPage?.subtitleBn ||
              'বিশুদ্ধ কুরআন তিলাওয়াত, হিফজ, দ্বীনি ইলম ও আধুনিক বিষয়ে পাঠদানকারী নিবেদিতপ্রাণ শিক্ষকমণ্ডলী।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Dedicated Huffaz, Islamic scholars, and subject specialists committed to nurturing every student.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'أساتذة متخصصون في تحفيظ القرآن الكريم والعلوم الشرعية والمواد الأكاديمية.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
            {publishedTeachers.length > 0 ? (
              <div
                data-testid="cms-published-teachers-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {publishedTeachers.map((teacher) => (
                  <article
                    key={teacher.id}
                    className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      {teacher.photoUrl ? (
                        <img
                          src={teacher.photoUrl}
                          alt={pickLang(teacher.nameBn, teacher.nameEn, teacher.nameAr)}
                          className="w-16 h-16 rounded-xl object-cover border border-[#D9B64C]/40 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#061326] text-[#E8D58A] flex items-center justify-center font-bold text-xl border border-[#D9B64C]/40 shrink-0">
                          {(teacher.nameEn || teacher.nameBn || 'T').charAt(0)}
                        </div>
                      )}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#087A59]">
                          {pickLang(
                            teacher.designationBn,
                            teacher.designationEn,
                            teacher.designationAr
                          )}
                        </span>
                        <h2 className="font-display-bn text-lg font-bold text-[#061326]">
                          {pickLang(teacher.nameBn, teacher.nameEn, teacher.nameAr)}
                        </h2>
                        <p className="text-xs text-[#122033]/70 uppercase">
                          {teacher.department}
                        </p>
                      </div>
                    </div>

                    {(teacher.biographyBn || teacher.biographyEn || teacher.biographyAr) && (
                      <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed border-t border-[#D9B64C]/20 pt-3">
                        {pickLang(
                          teacher.biographyBn,
                          teacher.biographyEn,
                          teacher.biographyAr
                        )}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div
                data-testid="public-teachers-empty-state"
                className="rounded-2xl bg-white border border-[#D9B64C]/35 p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-3"
              >
                <Users className="w-8 h-8 text-[#087A59] mx-auto" />
                <h2 className="font-display-bn text-xl font-bold text-[#061326]">
                  {pickLang(
                    'অনুমোদিত শিক্ষক ডিরেক্টরি হালনাগাদাধীন',
                    'Verified Faculty Directory',
                    'دليل المعلمين المعتمد'
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                  {pickLang(
                    'মাদ্রাসার নূরানী, নাজেরা, হিফজুল কুরআন, কিতাব ও জেনারেল বিভাগের অনুমোদিত উস্তাদ ও শিক্ষকদের প্রোফাইল ওয়েবসাইট সিএমএস থেকে প্রকাশের সাথে সাথে এখানে প্রদর্শিত হয়।',
                    'Individual faculty profiles published by the administration via the Website CMS appear here automatically.',
                    'تظهر هنا ملفات المعلمين المعتمدة فور نشرها من قِبل إدارة المدرسة.'
                  )}
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* =====================================================================
          5. ADMINISTRATION PAGE (/administration)
         ===================================================================== */}
      {route === '/administration' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-administration"
            badgeBn={customPage?.badgeBn || 'প্রশাসনিক কাঠামো ও পরিচালনা পর্ষদ'}
            badgeEn={customPage?.badgeEn || 'Institutional Governance & Administration'}
            badgeAr={customPage?.badgeAr || 'الهيكل الإداري ومجلس الإدارة'}
            titleBn={customPage?.titleBn || 'মাদ্রাসা প্রশাসন ও পরিচালনা কাঠামো'}
            titleEn={customPage?.titleEn || 'Administration & Institutional Governance'}
            titleAr={customPage?.titleAr || 'الإدارة والحوكمة المؤسسية'}
            subtitleBn={
              customPage?.subtitleBn ||
              'শূরা কমিটি, মুহতামিমের দপ্তর, শিক্ষা সচিব এবং হিসাব ও আবাসন প্রশাসনের সমন্বিত দায়িত্ব বণ্টন।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Transparent institutional leadership overseeing academic standards, student welfare, and financial integrity.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'إدارة مؤسسية منظمة تشرف على الشؤون التعليمية والطلابية والمالية.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
            {publishedAdmins.length > 0 && (
              <div
                data-testid="cms-published-admin-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {publishedAdmins.map((admin) => (
                  <article
                    key={admin.id}
                    className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-3"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#087A59]">
                      {pickLang(admin.designationBn, admin.designationEn, admin.designationAr)}
                    </span>
                    <h2 className="font-display-bn text-lg font-bold text-[#061326]">
                      {pickLang(admin.nameBn, admin.nameEn, admin.nameAr)}
                    </h2>
                    {(admin.biographyBn || admin.biographyEn || admin.biographyAr) && (
                      <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                        {pickLang(admin.biographyBn, admin.biographyEn, admin.biographyAr)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  titleBn: 'মজলিসে শূরা ও নীতি-নির্ধারণী পর্ষদ',
                  titleEn: 'Majlis-e-Shura & Policy Council',
                  titleAr: 'مجلس الشورى والسياسات العامة',
                  descBn:
                    'মাদ্রাসার সার্বিক শিক্ষানীতি, শরীয়াহ পরিপালন এবং দীর্ঘমেয়াদী উন্নয়ন পরিকল্পনা অনুমোদনকারী সর্বোচ্চ পর্ষদ।',
                  descEn:
                    'Approves institutional policies, academic curricula, and long-term strategic development.',
                  descAr:
                    'يعتمد السياسات التعليمية والمناهج وخطط التطوير المؤسسي.',
                },
                {
                  titleBn: 'মুহতামিম (অধ্যক্ষ) এর কার্যালয়',
                  titleEn: 'Office of the Muhtamim (Principal)',
                  titleAr: 'مكتب المهتمم (عميد المدرسة)',
                  descBn:
                    'সার্বিক প্রশাসন, শিক্ষক নিয়োগ ও তত্ত্বাবধান, শৃঙ্খলা এবং প্রাতিষ্ঠানিক মান নিয়ন্ত্রণের কেন্দ্রীয় দায়িত্ব পালন করে।',
                  descEn:
                    'Directs executive administration, faculty supervision, and institutional quality assurance.',
                  descAr:
                    'يشرف على الإدارة التنفيذية وهيئة التدريس وضمان الجودة.',
                },
                {
                  titleBn: 'নাযেমে তালীমাত (শিক্ষা সচিব দপ্তর)',
                  titleEn: 'Office of Academic Affairs (Nazim-e-Ta’leemat)',
                  titleAr: 'إدارة الشؤون التعليمية والامتحانات',
                  descBn:
                    'দৈনিক ক্লাস রুটিন, পাঠ পরিকল্পনা, সাময়িক ও বার্ষিক পরীক্ষা গ্রহণ এবং ফলাফল প্রকাশ কার্যক্রম পরিচালনা করে।',
                  descEn:
                    'Manages academic schedules, lesson audits, term examinations, and transcript publication.',
                  descAr:
                    'تنظيم الجداول الدراسية والاختبارات الفصلية وإصدار النتائج.',
                },
                {
                  titleBn: 'হিসাব, ভর্তি ও আবাসন তত্ত্বাবধান দপ্তর',
                  titleEn: 'Admissions, Accounts & Residential Welfare',
                  titleAr: 'مكتب القبول والحسابات والرعاية الداخلية',
                  descBn:
                    'নতুন শিক্ষার্থী ভর্তি, বৃত্তি ও ফি ব্যবস্থাপনা, আবাসিক হোস্টেল তত্ত্বাবধান এবং অভিভাবক সেবা নিশ্চিত করে।',
                  descEn:
                    'Handles student admissions, transparent fee records, boarding supervision, and guardian support.',
                  descAr:
                    'إدارة القبول والسجلات المالية والإشراف على السكن الداخلي.',
                },
              ].map((office, idx) => (
                <div
                  key={idx}
                  className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-2.5"
                >
                  <span className="font-mono-num text-xs font-bold text-[#087A59]">
                    0{idx + 1}
                  </span>
                  <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                    {pickLang(office.titleBn, office.titleEn, office.titleAr)}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#122033]/80 leading-relaxed">
                    {pickLang(office.descBn, office.descEn, office.descAr)}
                  </p>
                </div>
              ))}
            </div>
          </main>
        </>
      )}

      {/* =====================================================================
          6. ADMISSION PAGE (/admission) — Preserves Embedded AdmissionsModule
         ===================================================================== */}
      {route === '/admission' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-admission"
            badgeBn={
              customPage?.badgeBn ||
              `ভর্তি তথ্য ও অনলাইন আবেদন · শিক্ষাবর্ষ ${settings.academicYear || '২০২৬-২০২৭'}`
            }
            badgeEn={
              customPage?.badgeEn ||
              `Admission Information & Online Application · ${settings.academicYear || '2026-2027'}`
            }
            badgeAr={
              customPage?.badgeAr ||
              `معلومات القبول والتسجيل الإلكتروني · ${settings.academicYear || '2026-2027'}`
            }
            titleBn={customPage?.titleBn || 'অনলাইন ভর্তি আবেদন ও ভর্তি নির্দেশিকা'}
            titleEn={customPage?.titleEn || 'Online Admission Application & Enrollment Guide'}
            titleAr={customPage?.titleAr || 'استمارة القبول الإلكتروني ودليل التسجيل'}
            subtitleBn={
              customPage?.subtitleBn ||
              'নূরানী, নাজেরা, হিফজুল কুরআন, কিতাব ও জেনারেল বিভাগে আবাসিক, অনাবাসিক ও ডে-কেয়ার ব্যবস্থায় ভর্তির আবেদন করুন।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Submit your online admission application directly below for Noorani, Nazera, Hifzul Quran, Kitab, or General streams.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'قدم طلب القبول الإلكتروني مباشرة أدناه للأقسام النورانية والناظرة والتحفيظ والكتاب والعام.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
            <div
              data-testid="public-admission-form-container"
              className="rounded-2xl bg-white border border-[#D9B64C]/35 p-4 sm:p-8 shadow-lg"
            >
              <AdmissionsModule
                lang={language}
                userRole="student"
                currentUid="public-applicant"
                currentUserEmail=""
                currentUserName=""
                currentUserPhone=""
                academicYear={settings.academicYear}
                applications={applications}
                students={students}
                guardianLinkRequests={guardianLinkRequests}
                accountInvitations={accountInvitations}
                isPublicApplicantMode={true}
                onReturnToLogin={(invitationCode) => onOpenLoginPortal(invitationCode)}
                onSubmitApplication={onSubmitApplication}
                onUpdateApplication={onUpdateApplication}
                onApproveApplication={onApproveApplication}
                onReviewGuardianLinkRequest={onReviewGuardianLinkRequest}
                onResendOrRecoverInvitation={onResendOrRecoverInvitation}
              />
            </div>
          </main>
        </>
      )}

      {/* =====================================================================
          7. NOTICES PAGE (/notices)
         ===================================================================== */}
      {route === '/notices' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-notices"
            badgeBn={customPage?.badgeBn || 'প্রাতিষ্ঠানিক নোটিশ বোর্ড'}
            badgeEn={customPage?.badgeEn || 'Official Public Notice Board'}
            badgeAr={customPage?.badgeAr || 'لوحة الإعلانات الرسمية'}
            titleBn={customPage?.titleBn || 'প্রকাশিত নোটিশ ও বিজ্ঞপ্তিসমূহ'}
            titleEn={customPage?.titleEn || 'Official Institutional Notices & Circulars'}
            titleAr={customPage?.titleAr || 'الإعلانات والتعاميم المدرسية المنشورة'}
            subtitleBn={
              customPage?.subtitleBn ||
              'পরীক্ষার সময়সূচি, ছুটির বিজ্ঞপ্তি, ভর্তি নির্দেশনা ও প্রাতিষ্ঠানিক ঘোষণাসমূহ।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Stay informed with verified examination schedules, holiday circulars, and admission announcements.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'تابع أحدث جداول الاختبارات والإجازات وإعلانات القبول الرسمية.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#D9B64C]/30 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#087A59] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  data-testid="public-notices-search-input"
                  placeholder={pickLang(
                    'নোটিশের শিরোনাম বা বিষয় লিখুন...',
                    'Search notices by title or keyword...',
                    'ابحث في الإعلانات...'
                  )}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F4EC] border border-[#D9B64C]/30 text-xs sm:text-sm text-[#061326] focus:outline-none focus:ring-2 focus:ring-[#087A59]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['ALL', 'ACADEMIC', 'ADMISSION', 'EXAM', 'GENERAL'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedNoticeCategory(cat)}
                    data-testid={`public-notices-cat-${cat.toLowerCase()}`}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedNoticeCategory === cat
                        ? 'bg-[#061326] text-[#E8D58A]'
                        : 'bg-[#F7F4EC] text-[#122033]/80 hover:bg-[#EFEAD8]'
                    }`}
                  >
                    {cat === 'ALL'
                      ? pickLang('সকল নোটিশ', 'All Notices', 'الكل')
                      : cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredNotices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotices.map(({ notice, cmsMeta }) => (
                  <article
                    key={notice.id}
                    data-testid={`public-notice-card-${notice.id}`}
                    className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono-num font-bold text-[#087A59]">
                        {notice.publishDate}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#061326] text-[#E8D58A] text-[10px] font-bold uppercase">
                        {cmsMeta.category}
                      </span>
                    </div>
                    <h2 className="font-display-bn text-lg sm:text-xl font-bold text-[#061326]">
                      {pickLang(notice.titleBn, notice.titleEn, cmsMeta.titleAr)}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#122033]/85 leading-relaxed">
                      {pickLang(notice.contentBn, cmsMeta.contentEn, cmsMeta.contentAr)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-[#D9B64C]/30 p-10 text-center space-y-2">
                <FileText className="w-8 h-8 text-[#D9B64C] mx-auto" />
                <p className="text-sm font-bold text-[#061326]">
                  {pickLang(
                    'এই ক্যাটাগরিতে কোনো প্রকাশিত নোটিশ পাওয়া যায়নি।',
                    'No published notices match your filter.',
                    'لا توجد إعلانات مطابقة للبحث.'
                  )}
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* =====================================================================
          8. EVENTS PAGE (/events)
         ===================================================================== */}
      {route === '/events' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-events"
            badgeBn={customPage?.badgeBn || 'ইভেন্ট, মাহফিল ও একাডেমিক কর্মসূচি'}
            badgeEn={customPage?.badgeEn || 'Events, Gatherings & Competitions'}
            badgeAr={customPage?.badgeAr || 'الفعاليات والأنشطة المدرسية'}
            titleBn={customPage?.titleBn || 'মাদ্রাসার ইভেন্ট ও একাডেমিক কর্মসূচি'}
            titleEn={customPage?.titleEn || 'Institutional Events & Academic Calendar'}
            titleAr={customPage?.titleAr || 'الفعاليات والأنشطة الأكاديمية'}
            subtitleBn={
              customPage?.subtitleBn ||
              'বার্ষিক কিরাত ও হিফজ প্রতিযোগিতা, দোয়া মাহফিল, অভিভাবক সমাবেশ ও একাডেমিক ইভেন্টসমূহ।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Explore upcoming Quranic recitation competitions, parent assemblies, and institutional milestones.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'تعرف على مسابقات القرآن الكريم واللقاءات التربوية والمناسبات القادمة.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'ACADEMIC', 'EXAM', 'ADMISSION', 'EVENT'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedEventCategory(cat)}
                  data-testid={`public-events-cat-${cat.toLowerCase()}`}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedEventCategory === cat
                      ? 'bg-[#061326] text-[#E8D58A]'
                      : 'bg-white text-[#122033]/80 border border-[#D9B64C]/30 hover:bg-[#EFEAD8]'
                  }`}
                >
                  {cat === 'ALL'
                    ? pickLang('সকল ইভেন্ট', 'All Events', 'جميع الفعاليات')
                    : cat}
                </button>
              ))}
            </div>

            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                  <article
                    key={event.id}
                    data-testid={`public-event-card-${event.id}`}
                    className="uqcm-mihrab-card rounded-2xl bg-white p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono-num font-bold text-[#087A59]">
                        {event.eventDate}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#061326] text-[#E8D58A] text-[10px] font-bold uppercase">
                        {event.category}
                      </span>
                    </div>
                    <h2 className="font-display-bn text-lg sm:text-xl font-bold text-[#061326]">
                      {pickLang(event.titleBn, event.titleEn, event.titleAr)}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#122033]/85 leading-relaxed">
                      {pickLang(event.descriptionBn, event.descriptionEn, event.descriptionAr)}
                    </p>
                    <div className="pt-2 border-t border-[#D9B64C]/20 flex items-center gap-2 text-xs text-[#122033]/70">
                      <MapPin className="w-3.5 h-3.5 text-[#087A59]" />
                      <span>{pickLang(event.badgeBn, event.badgeEn, event.badgeAr)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-[#D9B64C]/30 p-10 text-center space-y-2">
                <Calendar className="w-8 h-8 text-[#D9B64C] mx-auto" />
                <p className="text-sm font-bold text-[#061326]">
                  {pickLang(
                    'বর্তমানে এই ক্যাটাগরিতে কোনো প্রকাশিত ইভেন্ট নেই।',
                    'No published events found in this category.',
                    'لا توجد فعاليات منشورة في هذا التصنيف.'
                  )}
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* =====================================================================
          9. GALLERY PAGE (/gallery)
         ===================================================================== */}
      {route === '/gallery' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-gallery"
            badgeBn={customPage?.badgeBn || 'প্রাতিষ্ঠানিক ফটো গ্যালারি'}
            badgeEn={customPage?.badgeEn || 'Official Campus Photo Gallery'}
            badgeAr={customPage?.badgeAr || 'معرض صور المدرسة'}
            titleBn={customPage?.titleBn || 'ক্যাম্পাস ও একাডেমিক কার্যক্রমের গ্যালারি'}
            titleEn={customPage?.titleEn || 'Campus Architecture & Academic Life Gallery'}
            titleAr={customPage?.titleAr || 'معرض صور الحرم المدرسي والأنشطة'}
            subtitleBn={
              customPage?.subtitleBn ||
              'মাদ্রাসা প্রাঙ্গণ, হিফজ ও তিলাওয়াত মাহফিল এবং একাডেমিক কার্যক্রমের অনুমোদিত আলোকচিত্র।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Approved photography showcasing our campus environment, Quranic sessions, and academic events.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'صور معتمدة توثق البيئة التعليمية وحلقات القرآن والفعاليات المدرسية.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
            {galleryCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGalleryCategory('ALL')}
                  data-testid="public-gallery-cat-all"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedGalleryCategory === 'ALL'
                      ? 'bg-[#061326] text-[#E8D58A]'
                      : 'bg-white text-[#122033]/80 border border-[#D9B64C]/30'
                  }`}
                >
                  {pickLang('সকল ছবি', 'All Photos', 'جميع الصور')}
                </button>
                {galleryCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedGalleryCategory(cat)}
                    data-testid={`public-gallery-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedGalleryCategory === cat
                        ? 'bg-[#061326] text-[#E8D58A]'
                        : 'bg-white text-[#122033]/80 border border-[#D9B64C]/30'
                  }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredGallery.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGallery.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    data-testid={`public-gallery-card-${item.id}`}
                    className="group uqcm-mihrab-card rounded-2xl bg-white overflow-hidden text-left cursor-pointer"
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
                    <div className="p-5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#087A59]">
                        {pickLang(item.categoryBn, item.categoryEn, item.categoryAr)}
                      </span>
                      <h2 className="font-display-bn text-base font-bold text-[#061326]">
                        {pickLang(item.titleBn, item.titleEn, item.titleAr)}
                      </h2>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div
                data-testid="public-gallery-empty-state"
                className="rounded-2xl bg-white border border-[#D9B64C]/35 p-10 text-center max-w-2xl mx-auto space-y-3"
              >
                <ImageIcon className="w-8 h-8 text-[#087A59] mx-auto" />
                <h2 className="font-display-bn text-xl font-bold text-[#061326]">
                  {pickLang(
                    'প্রাতিষ্ঠানিক ফটো গ্যালারি শীঘ্রই হালনাগাদ করা হবে',
                    'Official Campus Gallery Will Be Updated Soon',
                    'سيتم تحديث معرض الصور الرسمي قريباً'
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#122033]/75 leading-relaxed">
                  {pickLang(
                    'মাদ্রাসা প্রশাসনের অনুমোদিত প্রকৃত ক্যাম্পাস ও একাডেমিক কার্যক্রমের ছবি সিএমএস থেকে প্রকাশের সাথে সাথে এখানে প্রদর্শিত হবে।',
                    'Approved campus photographs published via the Website CMS appear here automatically.',
                    'تظهر الصور المعتمدة هنا فور نشرها من قِبل الإدارة.'
                  )}
                </p>
              </div>
            )}
          </main>
        </>
      )}

      {/* =====================================================================
          10. CONTACT PAGE (/contact)
         ===================================================================== */}
      {route === '/contact' && (
        <>
          <PageHeaderBanner
            testId="public-page-header-contact"
            badgeBn={customPage?.badgeBn || 'যোগাযোগ ও ক্যাম্পাস তথ্য'}
            badgeEn={customPage?.badgeEn || 'Official Contact & Campus Desk'}
            badgeAr={customPage?.badgeAr || 'التواصل وعنوان المدرسة'}
            titleBn={customPage?.titleBn || 'সরাসরি যোগাযোগ ও ভর্তি তথ্য কেন্দ্র'}
            titleEn={customPage?.titleEn || 'Contact Our Campus & Admission Office'}
            titleAr={customPage?.titleAr || 'تواصل مع إدارة المدرسة ومكتب القبول'}
            subtitleBn={
              customPage?.subtitleBn ||
              'ভর্তি, আবাসন, একাডেমিক তথ্য অথবা যেকোনো জিজ্ঞাসার জন্য আমাদের সাথে যোগাযোগ করুন।'
            }
            subtitleEn={
              customPage?.subtitleEn ||
              'Reach out to our administrative desk for admission inquiries, residential visits, or academic information.'
            }
            subtitleAr={
              customPage?.subtitleAr ||
              'يسعدنا تواصلكم للاستفسار عن القبول أو السكن الداخلي أو الشؤون الأكاديمية.'
            }
            language={language}
            onBackHome={() => onNavigatePage('/')}
            onApplyOnline={() => onNavigatePage('/admission')}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-5">
                <div className="uqcm-royal-panel rounded-2xl p-6 sm:p-8 text-[#F7F4EC] space-y-6">
                  <h2 className="font-display-bn text-xl font-bold text-[#E8D58A] border-b border-[#D9B64C]/25 pb-3">
                    {pickLang(
                      'অফিশিয়াল যোগাযোগের ঠিকানা',
                      'Official Contact Information',
                      'معلومات التواصل الرسمية'
                    )}
                  </h2>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#E8D58A]">
                          {pickLang('ক্যাম্পাস ঠিকানা', 'Campus Address', 'عنوان الحرم المدرسي')}
                        </p>
                        <p className="text-[#F7F4EC]/90 mt-0.5 leading-relaxed">
                          {pickLang(
                            cmsContact.addressBn || settings.addressBn,
                            cmsContact.addressEn,
                            cmsContact.addressAr
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#E8D58A]">
                          {pickLang('ফোন / হেল্পলাইন', 'Phone / Helpline', 'الهاتف')}
                        </p>
                        <p className="font-mono-num text-[#F7F4EC] font-semibold mt-0.5">
                          {cmsContact.phone || settings.phone || '+880 1711-984321'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#E8D58A]">
                          {pickLang('ইমেইল', 'Official Email', 'البريد الإلكتروني')}
                        </p>
                        <p className="text-[#F7F4EC] mt-0.5 break-all">
                          {cmsContact.email || settings.email || 'office@ummulquranmadrasa.edu.bd'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#D9B64C] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#E8D58A]">
                          {pickLang('অফিস সময়সূচি', 'Office Hours', 'ساعات العمل')}
                        </p>
                        <p className="text-[#F7F4EC]/85 mt-0.5">
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
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="uqcm-mihrab-card rounded-2xl bg-white p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#087A59]">
                      {pickLang('সরাসরি বার্তা পাঠান', 'Guardian Inquiry Form', 'نموذج الاستفسار')}
                    </span>
                    <h2 className="font-display-bn text-xl sm:text-2xl font-bold text-[#061326] mt-1">
                      {pickLang(
                        'ভর্তি বা একাডেমিক বিষয়ে আপনার জিজ্ঞাসা জানান',
                        'Send an Admission or Academic Inquiry',
                        'أرسل استفسارك حول القبول أو الدراسة'
                      )}
                    </h2>
                  </div>

                  {contactSubmitted ? (
                    <div
                      data-testid="contact-inquiry-success"
                      className="rounded-xl bg-[#087A59]/10 border border-[#087A59]/40 p-6 text-center space-y-3"
                    >
                      <CheckCircle2 className="w-8 h-8 text-[#087A59] mx-auto" />
                      <h3 className="font-display-bn text-lg font-bold text-[#061326]">
                        {pickLang(
                          'আপনার বার্তা সফলভাবে গ্রহণ করা হয়েছে',
                          'Your Inquiry Has Been Received',
                          'تم استلام استفسارك بنجاح'
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#122033]/80">
                        {pickLang(
                          'ইনশাআল্লাহ আমাদের ভর্তি ও তথ্য অফিস শীঘ্রই আপনার প্রদত্ত নম্বরে যোগাযোগ করবে।',
                          'Our admission desk will contact you shortly on the phone number provided.',
                          'سيتواصل معكم مكتب القبول قريباً عبر رقم الهاتف المسجل.'
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setContactSubmitted(false);
                          setContactName('');
                          setContactPhone('');
                          setContactMessage('');
                        }}
                        className="px-4 py-2 rounded-lg bg-[#061326] text-[#E8D58A] text-xs font-bold cursor-pointer"
                      >
                        {pickLang('নতুন বার্তা পাঠান', 'Send Another Inquiry', 'إرسال استفسار آخر')}
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleContactSubmit}
                      data-testid="public-contact-inquiry-form"
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#061326] mb-1.5">
                            {pickLang('অভিভাবক / আবেদনকারীর নাম *', 'Your Full Name *', 'الاسم الكامل *')}
                          </label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            data-testid="contact-input-name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EC] border border-[#D9B64C]/35 text-xs sm:text-sm text-[#061326] focus:outline-none focus:ring-2 focus:ring-[#087A59]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#061326] mb-1.5">
                            {pickLang('মোবাইল নম্বর *', 'Mobile Number *', 'رقم الهاتف *')}
                          </label>
                          <input
                            type="tel"
                            required
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            data-testid="contact-input-phone"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EC] border border-[#D9B64C]/35 text-xs sm:text-sm text-[#061326] focus:outline-none focus:ring-2 focus:ring-[#087A59]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#061326] mb-1.5">
                          {pickLang('আগ্রহী বিভাগ', 'Interested Department', 'القسم المطلوب')}
                        </label>
                        <select
                          value={contactDepartment}
                          onChange={(e) => setContactDepartment(e.target.value)}
                          data-testid="contact-select-dept"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EC] border border-[#D9B64C]/35 text-xs sm:text-sm text-[#061326] focus:outline-none focus:ring-2 focus:ring-[#087A59]"
                        >
                          <option value="NOORANI">
                            {pickLang('নূরানী ও মক্তব বিভাগ', 'Noorani & Maktab', 'القسم النوراني')}
                          </option>
                          <option value="NAZERA">
                            {pickLang('নাজেরা ও তাজবীদ বিভাগ', 'Nazera & Tajweed', 'قسم الناظرة')}
                          </option>
                          <option value="HIFZ">
                            {pickLang('হিফজুল কুরআন বিভাগ', 'Hifzul Quran', 'قسم تحفيظ القرآن')}
                          </option>
                          <option value="KITAB">
                            {pickLang('কিতাব ও আলিয়া বিভাগ', 'Kitab & Alia Stream', 'قسم الكتاب')}
                          </option>
                          <option value="GENERAL">
                            {pickLang('ক্যাডেট ও জেনারেল শিক্ষা', 'Cadet & General Stream', 'القسم العام')}
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#061326] mb-1.5">
                          {pickLang('আপনার জিজ্ঞাসা বা বার্তা', 'Message / Inquiry', 'رسالتك أو استفسارك')}
                        </label>
                        <textarea
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          data-testid="contact-input-message"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EC] border border-[#D9B64C]/35 text-xs sm:text-sm text-[#061326] focus:outline-none focus:ring-2 focus:ring-[#087A59]"
                        />
                      </div>

                      <button
                        type="submit"
                        data-testid="contact-submit-btn"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/45 shadow-md transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#E8D58A]" />
                        <span>
                          {pickLang('বার্তা প্রেরণ করুন', 'Submit Inquiry', 'إرسال الاستفسار')}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </main>
        </>
      )}

      {/* Royal Islamic Luxury Footer */}
      <PublicFooter
        language={language}
        settings={settings}
        cmsConfig={cmsConfig}
        isAuthenticated={isAuthenticated}
        onNavigatePage={onNavigatePage}
        onOpenLoginPortal={() => onOpenLoginPortal()}
        onOpenOnlineAdmission={() => onNavigatePage('/admission')}
        onEnterManagementPortal={onEnterManagementPortal}
      />

      {/* Gallery Lightbox Modal */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="public-gallery-lightbox"
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-[#061326]/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-2xl bg-[#0A1B33] border border-[#D9B64C]/40 overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              data-testid="public-gallery-lightbox-close"
              aria-label="Close gallery lightbox"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-lg bg-[#061326]/90 text-[#E8D58A] border border-[#D9B64C]/40 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {lightboxItem.imageUrl && (
              <div className="max-h-[72vh] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={lightboxItem.imageUrl}
                  alt={pickLang(lightboxItem.titleBn, lightboxItem.titleEn, lightboxItem.titleAr)}
                  className="w-full h-full max-h-[72vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="p-5 text-[#F7F4EC] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8D58A]">
                {pickLang(
                  lightboxItem.categoryBn,
                  lightboxItem.categoryEn,
                  lightboxItem.categoryAr
                )}
              </span>
              <h3 className="font-display-bn text-lg font-bold">
                {pickLang(lightboxItem.titleBn, lightboxItem.titleEn, lightboxItem.titleAr)}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
