import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { uploadCmsMediaAsset } from '../../lib/firebase';
import type {
  BannerSlide,
  CmsActivityLogItem,
  CmsContactFooterConfig,
  CmsDraftNotice,
  CmsGalleryItem,
  CmsHomepageSectionConfig,
  CmsInstitutionalPageContent,
  CmsNoticeMetadata,
  CmsPublicEvent,
  CmsPublicPageSlug,
  CmsPublicProfile,
  CmsPublicationStatus,
  HomepageSectionId,
  InstitutionSettings,
  Language,
  Notice,
  StaffMember,
  UserRole,
  WebsiteCmsConfig,
} from '../../types/madrasa';
import {
  canManageWebsiteCms,
  computeCmsDashboardStats,
  decodeNoticeWithCmsMeta,
  encodeNoticeTargetClassWithCmsMeta,
  INITIAL_CMS_CONTACT_FOOTER,
  INITIAL_CMS_PAGES,
  INITIAL_HOMEPAGE_SECTIONS,
  validateCmsImageUrl,
} from '../../utils/websiteCmsLogic';
import type { PublicPagePath } from '../PublicWebsite/PublicNavbar';

export interface WebsiteCmsModuleProps {
  language: Language;
  role: UserRole;
  actorName: string;
  cmsConfig: WebsiteCmsConfig;
  settings: InstitutionSettings;
  notices: Notice[];
  staff: StaffMember[];
  bannerSlides: BannerSlide[];
  onSaveCmsConfig: (updatedConfig: WebsiteCmsConfig, summaryBn: string) => Promise<boolean>;
  onSaveSettings: (updatedSettings: InstitutionSettings) => Promise<boolean>;
  onAddNotice: (
    notice: Omit<Notice, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ) => Promise<boolean>;
  onUpdateNotice: (notice: Notice) => Promise<boolean>;
  onDeleteNotice: (noticeId: string) => Promise<boolean>;
  onPreviewPublicPage: (pagePath: PublicPagePath) => void;
}

type CmsTabId =
  | 'dashboard'
  | 'homepage'
  | 'pages'
  | 'teachers'
  | 'notices'
  | 'events'
  | 'gallery'
  | 'contact';

const HOMEPAGE_SECTION_ORDER: Array<{
  id: HomepageSectionId;
  labelBn: string;
  labelEn: string;
  labelAr: string;
}> = [
  {
    id: 'hero',
    labelBn: '০১. হিরো সেকশন, সিটিএ ও থ্রিডি নূর দৃশ্য',
    labelEn: '01. Hero Title, CTAs & 3D Noor Scene',
    labelAr: '٠١. القسم الرئيسي والأزرار ومشهد النور ثلاثي الأبعاد',
  },
  {
    id: 'intro',
    labelBn: '০২. প্রাতিষ্ঠানিক পরিচিতি ও লক্ষ্য',
    labelEn: '02. Institutional Introduction',
    labelAr: '٠٢. المقدمة المؤسسية والرسالة',
  },
  {
    id: 'departments',
    labelBn: '০৩. একাডেমিক বিভাগসমূহ',
    labelEn: '03. Academic Departments',
    labelAr: '٠٣. الأقسام الأكاديمية',
  },
  {
    id: 'why_choose_us',
    labelBn: '০৪. কেন আমাদের মাদ্রাসা নির্বাচন করবেন',
    labelEn: '04. Why Choose Us',
    labelAr: '٠٤. لماذا تختار مدرستنا',
  },
  {
    id: 'muhtamim_message',
    labelBn: '০৫. মুহতামিম দপ্তরের বার্তা',
    labelEn: '05. Muhtamim’s Message',
    labelAr: '٠٥. كلمة مدير المدرسة (المهتمم)',
  },
  {
    id: 'teachers_admin',
    labelBn: '০৬. শিক্ষক ও প্রশাসন কাঠামো',
    labelEn: '06. Teachers & Administration',
    labelAr: '٠٦. الأساتذة والهيكل الإداري',
  },
  {
    id: 'admission_highlights',
    labelBn: '০৭. অনলাইন ভর্তি হাইলাইটস',
    labelEn: '07. Admission Highlights',
    labelAr: '٠٧. أبرز معلومات القبول',
  },
  {
    id: 'notices_preview',
    labelBn: '০৮. পাবলিক নোটিশ প্রিভিউ',
    labelEn: '08. Notice Board Preview',
    labelAr: '٠٨. معاينة لوحة الإعلانات',
  },
  {
    id: 'events_news',
    labelBn: '০৯. সংবাদ ও প্রাতিষ্ঠানিক ইভেন্টস',
    labelEn: '09. News & Events Preview',
    labelAr: '٠٩. الأخبار والفعاليات',
  },
  {
    id: 'results_achievements',
    labelBn: '১০. পরীক্ষা ও ফলাফল পদ্ধতি',
    labelEn: '10. Results & Evaluation System',
    labelAr: '١٠. نظام الاختبارات والنتائج',
  },
  {
    id: 'gallery_preview',
    labelBn: '১১. ক্যাম্পাস গ্যালারি প্রিভিউ',
    labelEn: '11. Campus Gallery Preview',
    labelAr: '١١. معاينة معرض الحرم المدرسي',
  },
  {
    id: 'contact_footer',
    labelBn: '১২. যোগাযোগ ও ফুটার সেকশন',
    labelEn: '12. Contact & Footer Section',
    labelAr: '١٢. قسم التواصل والتذييل',
  },
];

const PUBLIC_PAGE_SLUGS: Array<{
  slug: CmsPublicPageSlug;
  labelBn: string;
  labelEn: string;
  labelAr: string;
}> = [
  { slug: '/about', labelBn: 'পরিচিতি (/about)', labelEn: 'About (/about)', labelAr: 'عن المدرسة (/about)' },
  {
    slug: '/academic',
    labelBn: 'একাডেমিক সিস্টেম (/academic)',
    labelEn: 'Academic System (/academic)',
    labelAr: 'النظام الأكاديمي (/academic)',
  },
  {
    slug: '/departments',
    labelBn: 'বিভাগসমূহ (/departments)',
    labelEn: 'Departments (/departments)',
    labelAr: 'الأقسام (/departments)',
  },
  {
    slug: '/teachers',
    labelBn: 'শিক্ষক মণ্ডলী (/teachers)',
    labelEn: 'Teachers (/teachers)',
    labelAr: 'الأساتذة (/teachers)',
  },
  {
    slug: '/administration',
    labelBn: 'প্রশাসন (/administration)',
    labelEn: 'Administration (/administration)',
    labelAr: 'الإدارة (/administration)',
  },
  {
    slug: '/admission',
    labelBn: 'ভর্তি তথ্য (/admission)',
    labelEn: 'Admission (/admission)',
    labelAr: 'القبول (/admission)',
  },
  {
    slug: '/notices',
    labelBn: 'নোটিশ বোর্ড (/notices)',
    labelEn: 'Notices (/notices)',
    labelAr: 'الإعلانات (/notices)',
  },
  {
    slug: '/events',
    labelBn: 'সংবাদ ও ইভেন্ট (/events)',
    labelEn: 'Events (/events)',
    labelAr: 'الفعاليات (/events)',
  },
  {
    slug: '/gallery',
    labelBn: 'গ্যালারি (/gallery)',
    labelEn: 'Gallery (/gallery)',
    labelAr: 'المعرض (/gallery)',
  },
  {
    slug: '/contact',
    labelBn: 'যোগাযোগ (/contact)',
    labelEn: 'Contact (/contact)',
    labelAr: 'التواصل (/contact)',
  },
];

function tr(lang: Language, bn: string, en: string, ar: string): string {
  if (lang === 'ar') return ar;
  if (lang === 'en') return en;
  return bn;
}

export function WebsiteCmsModule({
  language,
  role,
  actorName,
  cmsConfig,
  settings,
  notices,
  staff,
  onSaveCmsConfig,
  onSaveSettings,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onPreviewPublicPage,
}: WebsiteCmsModuleProps) {
  const isAuthorized = canManageWebsiteCms(role);

  const [activeTab, setActiveTab] = useState<CmsTabId>('dashboard');
  const [editLangTab, setEditLangTab] = useState<Language>('bn');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Tab 2: Homepage Editor State
  const [selectedHomepageSectionId, setSelectedHomepageSectionId] =
    useState<HomepageSectionId>('hero');
  const [homepageDraftForm, setHomepageDraftForm] = useState<CmsHomepageSectionConfig>(() => ({
    ...(cmsConfig.homepageSections?.hero || INITIAL_HOMEPAGE_SECTIONS.hero),
  }));
  const [showHomepagePreviewModal, setShowHomepagePreviewModal] = useState<boolean>(false);

  // Tab 3: Institutional Pages Editor State
  const [selectedPageSlug, setSelectedPageSlug] = useState<CmsPublicPageSlug>('/about');
  const [pageDraftForm, setPageDraftForm] = useState<CmsInstitutionalPageContent>(() => ({
    ...(cmsConfig.pages?.['/about'] || INITIAL_CMS_PAGES['/about']),
  }));
  const [showPagePreviewModal, setShowPagePreviewModal] = useState<boolean>(false);

  // Tab 4: Teacher & Administration Public Profiles State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<Omit<CmsPublicProfile, 'id' | 'updatedAt'>>({
    profileType: 'teacher',
    nameBn: '',
    nameEn: '',
    nameAr: '',
    designationBn: '',
    designationEn: '',
    designationAr: '',
    department: 'hifz',
    biographyBn: '',
    biographyEn: '',
    biographyAr: '',
    photoUrl: '',
    displayOrder: (cmsConfig.publicProfiles?.length || 0) + 1,
    status: 'unpublished',
  });
  const [confirmDeleteProfileId, setConfirmDeleteProfileId] = useState<string | null>(null);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState<boolean>(false);

  // Tab 5: Notice Management State
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState<{
    titleBn: string;
    titleEn: string;
    titleAr: string;
    contentBn: string;
    contentEn: string;
    contentAr: string;
    category: CmsNoticeMetadata['category'];
    targetClass: string;
    priority: Notice['priority'];
    publishDate: string;
    expiryDate: string;
    attachmentUrl: string;
    status: CmsPublicationStatus;
  }>({
    titleBn: '',
    titleEn: '',
    titleAr: '',
    contentBn: '',
    contentEn: '',
    contentAr: '',
    category: 'general',
    targetClass: 'সকল জামাত',
    priority: 'normal',
    publishDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    attachmentUrl: '',
    status: 'draft',
  });
  const [showNoticePreviewModal, setShowNoticePreviewModal] = useState<boolean>(false);
  const [confirmDeleteNoticeId, setConfirmDeleteNoticeId] = useState<string | null>(null);

  // Tab 6: Events & News Management State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Omit<CmsPublicEvent, 'id' | 'updatedAt'>>({
    titleBn: '',
    titleEn: '',
    titleAr: '',
    descriptionBn: '',
    descriptionEn: '',
    descriptionAr: '',
    eventDate: new Date().toISOString().slice(0, 10),
    category: 'event',
    badgeBn: 'প্রাতিষ্ঠানিক অনুষ্ঠান',
    badgeEn: 'Institutional Event',
    badgeAr: 'فعالية مؤسسية',
    coverImageUrl: '',
    galleryImageUrls: [],
    status: 'draft',
  });
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);
  const [isUploadingEventImage, setIsUploadingEventImage] = useState<boolean>(false);

  // Tab 7: Gallery Management State
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState<Omit<CmsGalleryItem, 'id' | 'updatedAt'>>({
    departmentKey: 'hifz',
    categoryBn: 'হিফযুল কুরআন বিভাগ',
    categoryEn: 'Hifzul Quran Department',
    categoryAr: 'قسم تحفيظ القرآن الكريم',
    titleBn: '',
    titleEn: '',
    titleAr: '',
    captionBn: '',
    captionEn: '',
    captionAr: '',
    detailsBn: '',
    detailsEn: '',
    detailsAr: '',
    imageUrl: '',
    accentColor: '#0A6847',
    displayOrder: (cmsConfig.galleryItems?.length || 0) + 1,
    status: 'draft',
  });
  const [confirmDeleteGalleryId, setConfirmDeleteGalleryId] = useState<string | null>(null);
  const [isUploadingGalleryImage, setIsUploadingGalleryImage] = useState<boolean>(false);

  // Tab 8: Contact & Footer Editor State
  const [contactForm, setContactForm] = useState<CmsContactFooterConfig>(() => ({
    ...(cmsConfig.contactFooter || INITIAL_CMS_CONTACT_FOOTER),
    institutionNameBn:
      settings.institutionNameBn ||
      cmsConfig.contactFooter?.institutionNameBn ||
      INITIAL_CMS_CONTACT_FOOTER.institutionNameBn,
    institutionNameEn:
      settings.institutionNameEn ||
      cmsConfig.contactFooter?.institutionNameEn ||
      INITIAL_CMS_CONTACT_FOOTER.institutionNameEn,
    institutionNameAr:
      settings.institutionNameAr ||
      cmsConfig.contactFooter?.institutionNameAr ||
      INITIAL_CMS_CONTACT_FOOTER.institutionNameAr,
    addressBn:
      settings.addressBn ||
      cmsConfig.contactFooter?.addressBn ||
      INITIAL_CMS_CONTACT_FOOTER.addressBn,
    phone:
      settings.phone || cmsConfig.contactFooter?.phone || INITIAL_CMS_CONTACT_FOOTER.phone,
    email:
      settings.email || cmsConfig.contactFooter?.email || INITIAL_CMS_CONTACT_FOOTER.email,
  }));
  const [showContactConfirmModal, setShowContactConfirmModal] = useState<boolean>(false);

  const stats = useMemo(
    () => computeCmsDashboardStats(cmsConfig, notices),
    [cmsConfig, notices]
  );

  // Strict RBAC Enforcement Screen for unauthorized roles
  if (!isAuthorized) {
    return (
      <div
        data-testid="cms-unauthorized-guard"
        className="p-8 rounded-2xl bg-white border border-red-200 shadow-xs text-center max-w-xl mx-auto my-8 space-y-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {tr(
            language,
            'ওয়েবসাইট সিএমএস অ্যাক্সেস সংরক্ষিত',
            'Website CMS Access Restricted',
            'الوصول إلى نظام إدارة محتوى الموقع مقيد'
          )}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {tr(
            language,
            'কেবলমাত্র অনুমোদিত সুপার অ্যাডমিন (Super Admin) এবং মুহতামিম (Muhtamim) পাবলিক ওয়েবসাইটের কন্টেন্ট তৈরি, সম্পাদনা বা প্রকাশ করতে পারবেন। শিক্ষক, শিক্ষার্থী, অভিভাবক বা হিসাবরক্ষক রোলের জন্য এই মডিউলটি নিষ্ক্রিয়।',
            'Only authorized Super Admin and Muhtamim roles may create, edit, publish, or delete public website content. Access is disabled for teachers, students, guardians, and accountants.',
            'يُسمح فقط للمشرف العام (Super Admin) ومدير المدرسة (المهتمم) بإدارة ونشر محتوى الموقع العام.'
          )}
        </p>
      </div>
    );
  }

  const appendActivityLog = (
    baseConfig: WebsiteCmsConfig,
    section: CmsActivityLogItem['section'],
    titleBn: string,
    titleEn: string,
    titleAr: string,
    status: CmsActivityLogItem['status']
  ): CmsActivityLogItem[] => {
    const newItem: CmsActivityLogItem = {
      id: `cms-log-${Date.now()}`,
      section,
      titleBn,
      titleEn,
      titleAr,
      status,
      timestamp: new Date().toISOString(),
      actorName: actorName || 'মুহতামিম / সুপার অ্যাডমিন',
    };
    return [newItem, ...(baseConfig.recentUpdates || [])].slice(0, 20);
  };

  // Select Homepage section
  const handleSelectHomepageSection = (secId: HomepageSectionId) => {
    setSelectedHomepageSectionId(secId);
    const existing = cmsConfig.homepageSections?.[secId] || INITIAL_HOMEPAGE_SECTIONS[secId];
    setHomepageDraftForm({ ...existing });
  };

  // Save Homepage Section as Draft or Publish
  const handleSaveHomepageSection = async (targetStatus: CmsPublicationStatus) => {
    if (!homepageDraftForm.titleBn.trim() || !homepageDraftForm.titleEn.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'হোমপেজ সেকশনের বাংলা ও ইংরেজি শিরোনাম আবশ্যক।',
          'Both Bengali and English titles are required for the homepage section.',
          'يرجى إدخال عنوان القسم باللغتين البنغالية والإنجليزية.'
        ),
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);
    const nowIso = new Date().toISOString().slice(0, 10);
    const updatedSection: CmsHomepageSectionConfig = {
      ...homepageDraftForm,
      status: targetStatus,
      updatedAt: nowIso,
      updatedBy: actorName,
    };

    const nextHomepageSections = {
      ...(cmsConfig.homepageSections || INITIAL_HOMEPAGE_SECTIONS),
      [selectedHomepageSectionId]: updatedSection,
    };

    const nextPublishedHomepageSections = {
      ...(cmsConfig.publishedHomepageSections || INITIAL_HOMEPAGE_SECTIONS),
      ...(targetStatus === 'published' ? { [selectedHomepageSectionId]: updatedSection } : {}),
    };

    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      homepageSections: nextHomepageSections,
      publishedHomepageSections: nextPublishedHomepageSections,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'homepage',
        `হোমপেজ সেকশন (${selectedHomepageSectionId}): ${updatedSection.titleBn.slice(0, 45)}`,
        `Homepage Section (${selectedHomepageSectionId}): ${updatedSection.titleEn.slice(0, 45)}`,
        `قسم الصفحة الرئيسية (${selectedHomepageSectionId})`,
        targetStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const ok = await onSaveCmsConfig(
      nextConfig,
      targetStatus === 'published'
        ? 'হোমপেজ সেকশনটি সফলভাবে পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।'
        : 'হোমপেজ সেকশনটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে (পাবলিক ওয়েবসাইটে এখনো প্রকাশিত হয়নি)।'
    );
    setIsSaving(false);
    if (ok) {
      setHomepageDraftForm(updatedSection);
      setShowHomepagePreviewModal(false);
      setFeedbackBanner({
        type: 'success',
        message:
          targetStatus === 'published'
            ? tr(
                language,
                'হোমপেজ সেকশনটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।',
                'Homepage section published to the live website.',
                'تم نشر قسم الصفحة الرئيسية بنجاح.'
              )
            : tr(
                language,
                'হোমপেজ সেকশনটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।',
                'Homepage section saved as Draft.',
                'تم حفظ قسم الصفحة الرئيسية كمسودة.'
              ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'Firestore ডাটাবেসে হোমপেজ সেকশন সংরক্ষণ বা প্রকাশ করা যায়নি। অনুগ্রহ করে অনুমোদিত অ্যাডমিন অ্যাকাউন্টে লগইন যাচাই করুন।',
          'Failed to save or publish homepage section to Firestore. Please verify your admin session.',
          'تعذر حفظ أو نشر قسم الصفحة الرئيسية في قاعدة البيانات.'
        ),
      });
    }
  };

  // Select Institutional Page
  const handleSelectPageSlug = (slug: CmsPublicPageSlug) => {
    setSelectedPageSlug(slug);
    const existing = cmsConfig.pages?.[slug] || INITIAL_CMS_PAGES[slug];
    setPageDraftForm({
      ...existing,
      highlightsBn: [...(existing.highlightsBn || ['', '', ''])],
      highlightsEn: [...(existing.highlightsEn || ['', '', ''])],
      highlightsAr: [...(existing.highlightsAr || ['', '', ''])],
    });
  };

  // Save Institutional Page as Draft or Publish
  const handleSaveInstitutionalPage = async (targetStatus: CmsPublicationStatus) => {
    if (!pageDraftForm.titleBn.trim() || !pageDraftForm.titleEn.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'পেজের বাংলা ও ইংরেজি প্রধান শিরোনাম পূরণ করা আবশ্যক।',
          'Bengali and English page headlines are required.',
          'يرجى إدخال عنوان الصفحة باللغتين البنغالية والإنجليزية.'
        ),
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);
    const nowIso = new Date().toISOString().slice(0, 10);
    const updatedPage: CmsInstitutionalPageContent = {
      ...pageDraftForm,
      slug: selectedPageSlug,
      status: targetStatus,
      highlightsBn: pageDraftForm.highlightsBn.map((s) => s.trim()).filter(Boolean),
      highlightsEn: pageDraftForm.highlightsEn.map((s) => s.trim()).filter(Boolean),
      highlightsAr: pageDraftForm.highlightsAr.map((s) => s.trim()).filter(Boolean),
      updatedAt: nowIso,
      updatedBy: actorName,
    };

    const nextPages = {
      ...(cmsConfig.pages || INITIAL_CMS_PAGES),
      [selectedPageSlug]: updatedPage,
    };

    const nextPublishedPages = {
      ...(cmsConfig.publishedPages || INITIAL_CMS_PAGES),
      ...(targetStatus === 'published' ? { [selectedPageSlug]: updatedPage } : {}),
    };

    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      pages: nextPages,
      publishedPages: nextPublishedPages,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'pages',
        `পাবলিক পেজ (${selectedPageSlug}): ${updatedPage.titleBn.slice(0, 45)}`,
        `Public Page (${selectedPageSlug}): ${updatedPage.titleEn.slice(0, 45)}`,
        `صفحة عامة (${selectedPageSlug})`,
        targetStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const ok = await onSaveCmsConfig(
      nextConfig,
      targetStatus === 'published'
        ? `${selectedPageSlug} পেজের তথ্য পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।`
        : `${selectedPageSlug} পেজের তথ্য খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।`
    );
    setIsSaving(false);
    if (ok) {
      setPageDraftForm(updatedPage);
      setShowPagePreviewModal(false);
      setFeedbackBanner({
        type: 'success',
        message:
          targetStatus === 'published'
            ? tr(
                language,
                `${selectedPageSlug} পেজটি সফলভাবে পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।`,
                `Page ${selectedPageSlug} published to the public website.`,
                `تم نشر الصفحة ${selectedPageSlug} في الموقع العام.`
              )
            : tr(
                language,
                `${selectedPageSlug} পেজটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।`,
                `Page ${selectedPageSlug} saved as Draft.`,
                `تم حفظ الصفحة ${selectedPageSlug} كمسودة.`
              ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          `Firestore ডাটাবেসে ${selectedPageSlug} পেজ সংরক্ষণ বা প্রকাশ করা যায়নি।`,
          `Failed to save or publish page ${selectedPageSlug} to Firestore.`,
          `تعذر حفظ أو نشر الصفحة ${selectedPageSlug} في قاعدة البيانات.`
        ),
      });
    }
  };

  // Save Teacher / Administration Public Profile
  const handleSavePublicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.nameBn.trim() || !profileForm.designationBn.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'শিক্ষক বা প্রশাসকের বাংলা নাম ও পদবি আবশ্যক।',
          'Bengali name and designation are required for a public profile.',
          'يرجى إدخال الاسم والمسمى الوظيفي.'
        ),
      });
      return;
    }

    const imgCheck = validateCmsImageUrl(profileForm.photoUrl);
    if (!imgCheck.valid) {
      setFeedbackBanner({
        type: 'error',
        message: imgCheck.reasonBn || 'Invalid image URL',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);
    const id = editingProfileId || `pub-prof-${Date.now()}`;
    const newProfile: CmsPublicProfile = {
      ...profileForm,
      id,
      nameEn: profileForm.nameEn.trim() || profileForm.nameBn.trim(),
      nameAr: profileForm.nameAr.trim() || profileForm.nameEn.trim() || profileForm.nameBn.trim(),
      designationEn: profileForm.designationEn.trim() || profileForm.designationBn.trim(),
      designationAr:
        profileForm.designationAr.trim() ||
        profileForm.designationEn.trim() ||
        profileForm.designationBn.trim(),
      displayOrder: Number(profileForm.displayOrder) || 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const existingList = cmsConfig.publicProfiles || [];
    const nextProfiles = editingProfileId
      ? existingList.map((p) => (p.id === editingProfileId ? newProfile : p))
      : [...existingList, newProfile];

    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      publicProfiles: nextProfiles,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'teachers',
        `পাবলিক প্রোফাইল: ${newProfile.nameBn}`,
        `Public Profile: ${newProfile.nameEn}`,
        `ملف تعريف عام: ${newProfile.nameAr}`,
        newProfile.status
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const ok = await onSaveCmsConfig(
      nextConfig,
      `পাবলিক প্রোফাইল (${newProfile.nameBn}) সংরক্ষিত হয়েছে।`
    );
    setIsSaving(false);
    if (ok) {
      setEditingProfileId(null);
      setProfileForm({
        profileType: 'teacher',
        nameBn: '',
        nameEn: '',
        nameAr: '',
        designationBn: '',
        designationEn: '',
        designationAr: '',
        department: 'hifz',
        biographyBn: '',
        biographyEn: '',
        biographyAr: '',
        photoUrl: '',
        displayOrder: nextProfiles.length + 1,
        status: 'unpublished',
      });
      setFeedbackBanner({
        type: 'success',
        message: tr(
          language,
          'পাবলিক প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে।',
          'Public profile saved successfully.',
          'تم حفظ الملف التعريفي العام بنجاح.'
        ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'Firestore ডাটাবেসে পাবলিক প্রোফাইল সংরক্ষণ করা যায়নি।',
          'Failed to save public profile to Firestore.',
          'تعذر حفظ الملف التعريفي العام في قاعدة البيانات.'
        ),
      });
    }
  };

  const handleToggleProfilePublish = async (profile: CmsPublicProfile) => {
    setIsSaving(true);
    const nextStatus: CmsPublicProfile['status'] =
      profile.status === 'published' ? 'unpublished' : 'published';
    const nextProfiles = (cmsConfig.publicProfiles || []).map((p) =>
      p.id === profile.id
        ? { ...p, status: nextStatus, updatedAt: new Date().toISOString().slice(0, 10) }
        : p
    );
    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      publicProfiles: nextProfiles,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'teachers',
        `প্রোফাইল স্ট্যাটাস (${profile.nameBn}): ${nextStatus}`,
        `Profile Status (${profile.nameEn}): ${nextStatus}`,
        `تحديث حالة الملف: ${profile.nameAr}`,
        nextStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    await onSaveCmsConfig(nextConfig, `প্রোফাইল স্ট্যাটাস (${nextStatus}) হালনাগাদ হয়েছে।`);
    setIsSaving(false);
  };

  const handleConfirmDeleteProfile = async (profileId: string) => {
    setIsSaving(true);
    const target = (cmsConfig.publicProfiles || []).find((p) => p.id === profileId);
    const nextProfiles = (cmsConfig.publicProfiles || []).filter((p) => p.id !== profileId);
    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      publicProfiles: nextProfiles,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'teachers',
        `পাবলিক প্রোফাইল মুছে ফেলা হয়েছে: ${target?.nameBn || profileId}`,
        `Deleted Public Profile: ${target?.nameEn || profileId}`,
        `حذف ملف تعريف عام`,
        'unpublished'
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    await onSaveCmsConfig(nextConfig, 'পাবলিক প্রোফাইল মুছে ফেলা হয়েছে।');
    setConfirmDeleteProfileId(null);
    setIsSaving(false);
  };

  // Save Notice as Draft or Publish for Public
  const handleSaveCmsNotice = async (targetStatus: CmsPublicationStatus) => {
    if (!noticeForm.titleBn.trim() || !noticeForm.contentBn.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'নোটিশের বাংলা শিরোনাম ও বিস্তারিত বিবরণ আবশ্যক।',
          'Bengali notice title and content are required.',
          'يرجى إدخال عنوان الإعلان وتفاصيله.'
        ),
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);

    let ok = false;

    if (targetStatus === 'draft') {
      // TASK 4: Never write draft notices to the shared notices collection with targetAudience: 'teachers'
      // Store draft notices privately in WebsiteCmsConfig.draftNotices inside settings/website-cms-config
      const draftId = editingNoticeId || `draft-notice-${Date.now()}`;
      const draftItem: CmsDraftNotice = {
        id: draftId,
        titleBn: noticeForm.titleBn.trim(),
        titleEn: noticeForm.titleEn.trim() || noticeForm.titleBn.trim(),
        titleAr: noticeForm.titleAr.trim() || noticeForm.titleEn.trim() || noticeForm.titleBn.trim(),
        contentBn: noticeForm.contentBn.trim(),
        contentEn: noticeForm.contentEn.trim() || noticeForm.contentBn.trim(),
        contentAr: noticeForm.contentAr.trim() || noticeForm.contentEn.trim() || noticeForm.contentBn.trim(),
        category: noticeForm.category,
        targetAudience: 'all',
        targetClass: (noticeForm.targetClass || 'সকল জামাত').trim(),
        priority: noticeForm.priority,
        publishDate: noticeForm.publishDate || new Date().toISOString().slice(0, 10),
        expiryDate: noticeForm.expiryDate?.trim() || '',
        attachmentUrl: noticeForm.attachmentUrl?.trim() || '',
        authorName: actorName,
        authorId: 'cms-editor',
        updatedAt: new Date().toISOString(),
      };

      const existingDrafts = cmsConfig.draftNotices || [];
      const isExistingDraft = existingDrafts.some((d) => d.id === editingNoticeId);
      const nextDrafts = isExistingDraft
        ? existingDrafts.map((d) => (d.id === editingNoticeId ? draftItem : d))
        : [draftItem, ...existingDrafts];

      // If this notice was previously in the shared notices collection, remove it so it doesn't remain public
      if (editingNoticeId && notices.some((n) => n.id === editingNoticeId)) {
        await onDeleteNotice(editingNoticeId);
      }

      const nextConfig: WebsiteCmsConfig = {
        ...cmsConfig,
        draftNotices: nextDrafts,
        recentUpdates: appendActivityLog(
          cmsConfig,
          'notices',
          `খসড়া নোটিশ: ${draftItem.titleBn.slice(0, 40)}`,
          `Draft Notice: ${draftItem.titleEn.slice(0, 40)}`,
          `مسودة إعلان: ${draftItem.titleAr.slice(0, 40)}`,
          'draft'
        ),
        updatedAt: new Date().toISOString(),
        updatedBy: actorName,
      };

      ok = await onSaveCmsConfig(
        nextConfig,
        'নোটিশটি খসড়া (Draft) হিসেবে CMS কনফিগারেশনে সংরক্ষিত হয়েছে।'
      );
    } else {
      // targetStatus === 'published'
      // TASK 4: Write to shared notices collection with targetAudience: 'all'
      const encodedTargetClass = encodeNoticeTargetClassWithCmsMeta(noticeForm.targetClass, {
        status: 'published',
        category: noticeForm.category,
        expiryDate: noticeForm.expiryDate,
        attachmentUrl: noticeForm.attachmentUrl,
        titleAr: noticeForm.titleAr,
        contentEn: noticeForm.contentEn,
        contentAr: noticeForm.contentAr,
      });

      const noticePayload: Omit<Notice, 'id' | 'authorId' | 'createdAt' | 'updatedAt'> = {
        titleBn: noticeForm.titleBn.trim(),
        titleEn: noticeForm.titleEn.trim() || noticeForm.titleBn.trim(),
        contentBn: noticeForm.contentBn.trim(),
        targetAudience: 'all',
        targetClass: encodedTargetClass,
        priority: noticeForm.priority,
        publishDate: noticeForm.publishDate || new Date().toISOString().slice(0, 10),
      };

      // If it was stored in cmsConfig.draftNotices, remove it from draftNotices upon publication
      const existingDrafts = cmsConfig.draftNotices || [];
      const wasDraft = existingDrafts.some((d) => d.id === editingNoticeId);
      if (wasDraft) {
        const nextDrafts = existingDrafts.filter((d) => d.id !== editingNoticeId);
        await onSaveCmsConfig(
          {
            ...cmsConfig,
            draftNotices: nextDrafts,
            recentUpdates: appendActivityLog(
              cmsConfig,
              'notices',
              `নোটিশ প্রকাশ: ${noticePayload.titleBn.slice(0, 40)}`,
              `Notice Published: ${noticePayload.titleEn.slice(0, 40)}`,
              `نشر إعلان: ${noticePayload.titleBn.slice(0, 40)}`,
              'published'
            ),
            updatedAt: new Date().toISOString(),
            updatedBy: actorName,
          },
          'খসড়া নোটিশটি সফলভাবে প্রকাশ করা হয়েছে।'
        );
      }

      if (editingNoticeId && !wasDraft) {
        const existing = notices.find((n) => n.id === editingNoticeId);
        if (existing) {
          ok = await onUpdateNotice({
            ...existing,
            ...noticePayload,
          });
        } else {
          ok = await onAddNotice(noticePayload);
        }
      } else {
        ok = await onAddNotice(noticePayload);
      }
    }

    setIsSaving(false);
    if (ok) {
      setEditingNoticeId(null);
      setShowNoticePreviewModal(false);
      setNoticeForm({
        titleBn: '',
        titleEn: '',
        titleAr: '',
        contentBn: '',
        contentEn: '',
        contentAr: '',
        category: 'general',
        targetClass: 'সকল জামাত',
        priority: 'normal',
        publishDate: new Date().toISOString().slice(0, 10),
        expiryDate: '',
        attachmentUrl: '',
        status: 'draft',
      });
      setFeedbackBanner({
        type: 'success',
        message:
          targetStatus === 'published'
            ? tr(
                language,
                'নোটিশটি পাবলিক নোটিশ বোর্ডে প্রকাশিত হয়েছে।',
                'Notice published to the Public Notice Board.',
                'تم نشر الإعلان في لوحة الإعلانات العامة.'
              )
            : tr(
                language,
                'নোটিশটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে (পাবলিক ওয়েবসাইটে প্রদর্শিত হবে না)।',
                'Notice saved as Draft in CMS config (hidden from public website).',
                'تم حفظ الإعلان كمسودة في إعدادات النظام.'
              ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'Firestore ডাটাবেসে নোটিশ সংরক্ষণ বা প্রকাশ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
          'Failed to save or publish notice to Firestore. Please try again.',
          'تعذر حفظ أو نشر الإعلان في قاعدة البيانات.'
        ),
      });
    }
  };

  // Save Event / News item
  const handleSaveCmsEvent = async (targetStatus: CmsPublicationStatus) => {
    if (!eventForm.titleBn.trim() || !eventForm.descriptionBn.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'ইভেন্টের বাংলা শিরোনাম ও বিবরণ আবশ্যক।',
          'Bengali event title and description are required.',
          'يرجى إدخال عنوان الفعالية وتفاصيلها.'
        ),
      });
      return;
    }

    const imgCheck = validateCmsImageUrl(eventForm.coverImageUrl);
    if (!imgCheck.valid) {
      setFeedbackBanner({
        type: 'error',
        message: imgCheck.reasonBn || 'Invalid cover image URL',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);
    const id = editingEventId || `evt-${Date.now()}`;
    const nextEvent: CmsPublicEvent = {
      ...eventForm,
      id,
      titleEn: eventForm.titleEn.trim() || eventForm.titleBn.trim(),
      titleAr: eventForm.titleAr.trim() || eventForm.titleEn.trim() || eventForm.titleBn.trim(),
      descriptionEn: eventForm.descriptionEn.trim() || eventForm.descriptionBn.trim(),
      descriptionAr:
        eventForm.descriptionAr.trim() ||
        eventForm.descriptionEn.trim() ||
        eventForm.descriptionBn.trim(),
      status: targetStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const existingEvents = cmsConfig.events || [];
    const nextEvents = editingEventId
      ? existingEvents.map((ev) => (ev.id === editingEventId ? nextEvent : ev))
      : [nextEvent, ...existingEvents];

    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      events: nextEvents,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'events',
        `ইভেন্ট (${nextEvent.titleBn.slice(0, 40)})`,
        `Event (${nextEvent.titleEn.slice(0, 40)})`,
        `فعالية (${nextEvent.titleAr.slice(0, 40)})`,
        targetStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const ok = await onSaveCmsConfig(
      nextConfig,
      targetStatus === 'published'
        ? 'ইভেন্টটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।'
        : 'ইভেন্টটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।'
    );
    setIsSaving(false);
    if (ok) {
      setEditingEventId(null);
      setEventForm({
        titleBn: '',
        titleEn: '',
        titleAr: '',
        descriptionBn: '',
        descriptionEn: '',
        descriptionAr: '',
        eventDate: new Date().toISOString().slice(0, 10),
        category: 'event',
        badgeBn: 'প্রাতিষ্ঠানিক অনুষ্ঠান',
        badgeEn: 'Institutional Event',
        badgeAr: 'فعالية مؤسسية',
        coverImageUrl: '',
        galleryImageUrls: [],
        status: 'draft',
      });
      setFeedbackBanner({
        type: 'success',
        message:
          targetStatus === 'published'
            ? tr(
                language,
                'ইভেন্টটি সফলভাবে পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।',
                'Event published to the public website.',
                'تم نشر الفعالية في الموقع العام.'
              )
            : tr(
                language,
                'ইভেন্টটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।',
                'Event saved as Draft.',
                'تم حفظ الفعالية كمسودة.'
              ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'Firestore ডাটাবেসে ইভেন্ট সংরক্ষণ বা প্রকাশ করা যায়নি।',
          'Failed to save or publish event to Firestore.',
          'تعذر حفظ أو نشر الفعالية في قاعدة البيانات.'
        ),
      });
    }
  };

  const handleToggleEventPublish = async (ev: CmsPublicEvent) => {
    setIsSaving(true);
    setFeedbackBanner(null);
    const nextStatus: CmsPublicationStatus = ev.status === 'published' ? 'draft' : 'published';
    const nextEvents = (cmsConfig.events || []).map((item) =>
      item.id === ev.id
        ? { ...item, status: nextStatus, updatedAt: new Date().toISOString().slice(0, 10) }
        : item
    );
    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      events: nextEvents,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'events',
        `ইভেন্ট স্ট্যাটাস (${ev.titleBn.slice(0, 35)}): ${nextStatus}`,
        `Event Status (${ev.titleEn.slice(0, 35)}): ${nextStatus}`,
        `تحديث حالة الفعالية: ${nextStatus}`,
        nextStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    const ok = await onSaveCmsConfig(
      nextConfig,
      nextStatus === 'published'
        ? 'ইভেন্টটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।'
        : 'ইভেন্টটি আনপাবলিশ (খসড়া) করা হয়েছে।'
    );
    setIsSaving(false);
    setFeedbackBanner({
      type: ok ? 'success' : 'error',
      message: ok
        ? nextStatus === 'published'
          ? tr(language, 'ইভেন্টটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।', 'Event published.', 'تم نشر الفعالية.')
          : tr(language, 'ইভেন্টটি আনপাবলিশ (Draft) করা হয়েছে।', 'Event unpublished to Draft.', 'تم إلغاء نشر الفعالية.')
        : tr(language, 'ইভেন্ট স্ট্যাটাস পরিবর্তন করা যায়নি।', 'Failed to update event status.', 'تعذر تحديث حالة الفعالية.'),
    });
  };

  // Save Gallery Item
  const handleSaveGalleryItem = async (targetStatus: CmsPublicationStatus) => {
    if (!galleryForm.titleBn.trim() || !galleryForm.captionBn.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'গ্যালারি আইটেমের বাংলা শিরোনাম ও সংক্ষিপ্ত ক্যাপশন আবশ্যক।',
          'Bengali title and caption are required for a gallery item.',
          'يرجى إدخال عنوان عنصر المعرض والوصف المختصر.'
        ),
      });
      return;
    }

    const imgCheck = validateCmsImageUrl(galleryForm.imageUrl);
    if (!imgCheck.valid) {
      setFeedbackBanner({
        type: 'error',
        message: imgCheck.reasonBn || 'Invalid image URL',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);
    const id = editingGalleryId || `gal-${Date.now()}`;
    const deptLabels: Record<
      CmsGalleryItem['departmentKey'],
      { bn: string; en: string; ar: string }
    > = {
      hifz: {
        bn: 'হিফযুল কুরআন বিভাগ',
        en: 'Hifzul Quran Department',
        ar: 'قسم تحفيظ القرآن الكريم',
      },
      qawmi: {
        bn: 'কওমি ও কিতাব বিভাগ',
        en: 'Qawmi & Kitab Department',
        ar: 'قسم العلوم الشرعية والكتب',
      },
      general: {
        bn: 'জেনারেল ও ক্যাডেট বিভাগ',
        en: 'General & Cadet Department',
        ar: 'قسم التعليم العام والكاديت',
      },
      residential: {
        bn: 'দারুল ইকামাহ (আবাসিক ছাত্রাবাস)',
        en: 'Darul Iqamah (Residential Dormitory)',
        ar: 'دار الإقامة (السكن الداخلي)',
      },
    };
    const catInfo = deptLabels[galleryForm.departmentKey];

    const nextItem: CmsGalleryItem = {
      ...galleryForm,
      id,
      categoryBn: catInfo.bn,
      categoryEn: catInfo.en,
      categoryAr: catInfo.ar,
      titleEn: galleryForm.titleEn.trim() || galleryForm.titleBn.trim(),
      titleAr: galleryForm.titleAr.trim() || galleryForm.titleEn.trim() || galleryForm.titleBn.trim(),
      captionEn: galleryForm.captionEn.trim() || galleryForm.captionBn.trim(),
      captionAr:
        galleryForm.captionAr.trim() || galleryForm.captionEn.trim() || galleryForm.captionBn.trim(),
      detailsBn: galleryForm.detailsBn.trim() || galleryForm.captionBn.trim(),
      detailsEn:
        galleryForm.detailsEn.trim() ||
        galleryForm.captionEn.trim() ||
        galleryForm.captionBn.trim(),
      detailsAr:
        galleryForm.detailsAr.trim() ||
        galleryForm.captionAr.trim() ||
        galleryForm.captionBn.trim(),
      displayOrder: Number(galleryForm.displayOrder) || 1,
      status: targetStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const existingGallery = cmsConfig.galleryItems || [];
    const nextGallery = editingGalleryId
      ? existingGallery.map((g) => (g.id === editingGalleryId ? nextItem : g))
      : [...existingGallery, nextItem];

    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      galleryItems: nextGallery,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'gallery',
        `গ্যালারি আইটেম: ${nextItem.titleBn.slice(0, 40)}`,
        `Gallery Item: ${nextItem.titleEn.slice(0, 40)}`,
        `عنصر معرض: ${nextItem.titleAr.slice(0, 40)}`,
        targetStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const ok = await onSaveCmsConfig(
      nextConfig,
      targetStatus === 'published'
        ? 'গ্যালারি আইটেমটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।'
        : 'গ্যালারি আইটেমটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।'
    );
    setIsSaving(false);
    if (ok) {
      setEditingGalleryId(null);
      setGalleryForm({
        departmentKey: 'hifz',
        categoryBn: 'হিফযুল কুরআন বিভাগ',
        categoryEn: 'Hifzul Quran Department',
        categoryAr: 'قسم تحفيظ القرآن الكريم',
        titleBn: '',
        titleEn: '',
        titleAr: '',
        captionBn: '',
        captionEn: '',
        captionAr: '',
        detailsBn: '',
        detailsEn: '',
        detailsAr: '',
        imageUrl: '',
        accentColor: '#0A6847',
        displayOrder: nextGallery.length + 1,
        status: 'draft',
      });
      setFeedbackBanner({
        type: 'success',
        message:
          targetStatus === 'published'
            ? tr(
                language,
                'গ্যালারি আইটেমটি পাবলিক গ্যালারিতে প্রকাশিত হয়েছে।',
                'Gallery item published to the public gallery.',
                'تم نشر عنصر المعرض بنجاح.'
              )
            : tr(
                language,
                'গ্যালারি আইটেমটি খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।',
                'Gallery item saved as Draft.',
                'تم حفظ عنصر المعرض كمسودة.'
              ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'Firestore ডাটাবেসে গ্যালারি আইটেম সংরক্ষণ বা প্রকাশ করা যায়নি।',
          'Failed to save or publish gallery item to Firestore.',
          'تعذر حفظ أو نشر عنصر المعرض في قاعدة البيانات.'
        ),
      });
    }
  };

  const handleToggleGalleryPublish = async (item: CmsGalleryItem) => {
    setIsSaving(true);
    setFeedbackBanner(null);
    const nextStatus: CmsPublicationStatus = item.status === 'published' ? 'draft' : 'published';
    const nextGallery = (cmsConfig.galleryItems || []).map((g) =>
      g.id === item.id
        ? { ...g, status: nextStatus, updatedAt: new Date().toISOString().slice(0, 10) }
        : g
    );
    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      galleryItems: nextGallery,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'gallery',
        `গ্যালারি স্ট্যাটাস (${item.titleBn.slice(0, 35)}): ${nextStatus}`,
        `Gallery Status (${item.titleEn.slice(0, 35)}): ${nextStatus}`,
        `تحديث حالة عنصر المعرض: ${nextStatus}`,
        nextStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    const ok = await onSaveCmsConfig(
      nextConfig,
      nextStatus === 'published'
        ? 'গ্যালারি আইটেমটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।'
        : 'গ্যালারি আইটেমটি আনপাবলিশ (খসড়া) করা হয়েছে।'
    );
    setIsSaving(false);
    setFeedbackBanner({
      type: ok ? 'success' : 'error',
      message: ok
        ? nextStatus === 'published'
          ? tr(language, 'গ্যালারি আইটেমটি প্রকাশিত হয়েছে।', 'Gallery item published.', 'تم نشر عنصر المعرض.')
          : tr(language, 'গ্যালারি আইটেমটি আনপাবলিশ (Draft) করা হয়েছে।', 'Gallery item unpublished to Draft.', 'تم إلغاء نشر عنصر المعرض.')
        : tr(language, 'গ্যালারি স্ট্যাটাস পরিবর্তন করা যায়নি।', 'Failed to update gallery status.', 'تعذر تحديث حالة المعرض.'),
    });
  };

  // Save Contact & Footer Config
  const handleSaveContactFooter = async (targetStatus: CmsPublicationStatus) => {
    if (!contactForm.institutionNameBn.trim() || !contactForm.phone.trim()) {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'প্রতিষ্ঠানের বাংলা নাম, ঠিকানা ও ফোন নম্বর আবশ্যক।',
          'Institution Bengali name, address, and phone are required.',
          'اسم المؤسسة والعنوان ورقم الهاتف مطلوبة.'
        ),
      });
      return;
    }

    setIsSaving(true);
    setFeedbackBanner(null);
    const updatedContact: CmsContactFooterConfig = {
      ...contactForm,
      status: targetStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const nextConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      contactFooter: updatedContact,
      publishedContactFooter:
        targetStatus === 'published'
          ? updatedContact
          : cmsConfig.publishedContactFooter || INITIAL_CMS_CONTACT_FOOTER,
      recentUpdates: appendActivityLog(
        cmsConfig,
        'contact',
        'যোগাযোগ ও ফুটার তথ্য হালনাগাদ',
        'Contact & Footer Information Updated',
        'تحديث بيانات التواصل والتذييل',
        targetStatus
      ),
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const cmsOk = await onSaveCmsConfig(
      nextConfig,
      targetStatus === 'published'
        ? 'যোগাযোগ ও ফুটার তথ্য পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।'
        : 'যোগাযোগ ও ফুটার তথ্য খসড়া হিসেবে সংরক্ষিত হয়েছে।'
    );

    if (cmsOk && targetStatus === 'published') {
      await onSaveSettings({
        ...settings,
        institutionNameBn: updatedContact.institutionNameBn.trim(),
        institutionNameEn: updatedContact.institutionNameEn.trim(),
        institutionNameAr: updatedContact.institutionNameAr.trim(),
        addressBn: updatedContact.addressBn.trim(),
        phone: updatedContact.phone.trim(),
        email: updatedContact.email.trim(),
      });
    }

    setIsSaving(false);
    setShowContactConfirmModal(false);
    if (cmsOk) {
      setFeedbackBanner({
        type: 'success',
        message:
          targetStatus === 'published'
            ? tr(
                language,
                'যোগাযোগ ও ফুটার তথ্য সফলভাবে পাবলিক ওয়েবসাইটে প্রকাশিত হয়েছে।',
                'Contact & Footer information published to the live website.',
                'تم نشر معلومات التواصل والتذييل في الموقع العام.'
              )
            : tr(
                language,
                'যোগাযোগ ও ফুটার তথ্য খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।',
                'Contact & Footer information saved as Draft.',
                'تم حفظ معلومات التواصل كمسودة.'
              ),
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: tr(
          language,
          'Firestore ডাটাবেসে যোগাযোগ ও ফুটার তথ্য সংরক্ষণ করা যায়নি।',
          'Failed to save Contact & Footer information to Firestore.',
          'تعذر حفظ معلومات التواصل في قاعدة البيانات.'
        ),
      });
    }
  };

  const navTabs: Array<{
    id: CmsTabId;
    labelBn: string;
    labelEn: string;
    labelAr: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'dashboard',
      labelBn: 'সিএমএস ড্যাশবোর্ড',
      labelEn: 'CMS Dashboard',
      labelAr: 'لوحة التحكم',
      icon: LayoutDashboard,
    },
    {
      id: 'homepage',
      labelBn: 'হোমপেজ এডিটর',
      labelEn: 'Homepage Editor',
      labelAr: 'محرر الرئيسية',
      icon: Sparkles,
    },
    {
      id: 'pages',
      labelBn: 'প্রাতিষ্ঠানিক পেজসমূহ',
      labelEn: 'Institutional Pages',
      labelAr: 'الصفحات العامة',
      icon: FileText,
    },
    {
      id: 'teachers',
      labelBn: 'শিক্ষক ও প্রশাসন প্রোফাইল',
      labelEn: 'Teachers & Admin',
      labelAr: 'الأساتذة والإدارة',
      icon: Users,
    },
    {
      id: 'notices',
      labelBn: 'পাবলিক নোটিশ',
      labelEn: 'Public Notices',
      labelAr: 'الإعلانات العامة',
      icon: Megaphone,
    },
    {
      id: 'events',
      labelBn: 'সংবাদ ও ইভেন্টস',
      labelEn: 'Events & News',
      labelAr: 'الأخبار والفعاليات',
      icon: Calendar,
    },
    {
      id: 'gallery',
      labelBn: 'ক্যাম্পাস গ্যালারি',
      labelEn: 'Gallery',
      labelAr: 'معرض الصور',
      icon: ImageIcon,
    },
    {
      id: 'contact',
      labelBn: 'যোগাযোগ ও ফুটার',
      labelEn: 'Contact & Footer',
      labelAr: 'التواصل والتذييل',
      icon: MapPin,
    },
  ];

  return (
    <div data-testid="website-cms-module" className="space-y-6">
      {/* Top Institutional CMS Header Bar */}
      <div className="bg-[#050E1D] text-white rounded-2xl p-5 sm:p-6 border border-[#D4AF37]/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F3D87D]">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>
              {tr(
                language,
                'প্রাতিষ্ঠানিক ওয়েবসাইট কন্টেন্ট ম্যানেজমেন্ট সিস্টেম (Phase 4 CMS)',
                'Institutional Website Content Management System (CMS)',
                'نظام إدارة محتوى الموقع المؤسسي (CMS)'
              )}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {tr(
              language,
              'উম্মুল কুরআন ক্যাডেট মাদ্রাসা — পাবলিক ওয়েবসাইট নিয়ন্ত্রণ কেন্দ্র',
              'Ummul Quran Cadet Madrasa — Public Website Control Center',
              'مدرسة أم القرآن كاديت — مركز إدارة الموقع العام'
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            {tr(
              language,
              'কোড পরিবর্তন ছাড়াই বাংলা, ইংরেজি ও আরবি (RTL) ভাষায় হোমপেজ, ১০টি প্রাতিষ্ঠানিক পেজ, শিক্ষক প্রোফাইল, নোটিশ, ইভেন্ট ও গ্যালারি খসড়া (Draft) সংরক্ষণ ও পাবলিক ওয়েবসাইটে প্রকাশ করুন।',
              'Manage and publish Bengali, English, and Arabic (RTL) content across the homepage, 10 institutional pages, faculty profiles, notices, events, and gallery without touching code.',
              'إدارة ونشر محتوى الموقع باللغات البنغالية والإنجليزية والعربية دون تعديل البرمجيات.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="cms-header-preview-website"
            onClick={() => onPreviewPublicPage('/')}
            className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59f2d] text-[#050E1D] text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>
              {tr(
                language,
                'লাইভ ওয়েবসাইট প্রিভিউ দেখুন',
                'Preview Live Website',
                'معاينة الموقع العام'
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Horizontal CMS Sub-Navigation Bar (Mobile-friendly scrollable tabs) */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`cms-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                setFeedbackBanner(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#063B27] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tr(language, tab.labelBn, tab.labelEn, tab.labelAr)}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          role="status"
          data-testid="cms-feedback-banner"
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="p-1 rounded-md hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          TAB 1: CMS DASHBOARD
         ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div data-testid="cms-panel-dashboard" className="space-y-6">
          {/* 6 Required Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                {tr(language, 'প্রকাশিত পেজ', 'Published Pages', 'صفحات منشورة')}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#063B27]">
                {stats.publishedPagesCount}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                {tr(language, 'লাইভ ওয়েবসাইটে সক্রিয়', 'Active on website', 'نشط في الموقع')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                {tr(language, 'খসড়া পেজ (Draft)', 'Draft Pages', 'مسودات الصفحات')}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
                {stats.draftPagesCount}
              </div>
              <div className="text-[11px] text-slate-500">
                {tr(language, 'প্রকাশের অপেক্ষায়', 'Unpublished drafts', 'بانتظار النشر')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                {tr(language, 'প্রকাশিত নোটিশ', 'Published Notices', 'إعلانات منشورة')}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#063B27]">
                {stats.publishedNoticesCount}
              </div>
              <div className="text-[11px] text-slate-500">
                {tr(
                  language,
                  `${stats.draftNoticesCount}টি খসড়া নোটিশ`,
                  `${stats.draftNoticesCount} drafts`,
                  `${stats.draftNoticesCount} مسودات`
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                {tr(language, 'আসন্ন ইভেন্টস', 'Upcoming Events', 'فعاليات قادمة')}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {stats.upcomingEventsCount}
              </div>
              <div className="text-[11px] text-slate-500">
                {tr(
                  language,
                  `${stats.draftEventsCount}টি খসড়া ইভেন্ট`,
                  `${stats.draftEventsCount} draft events`,
                  `${stats.draftEventsCount} مسودة`
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                {tr(language, 'গ্যালারি আইটেম', 'Gallery Items', 'عناصر المعرض')}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {stats.publishedGalleryCount}
              </div>
              <div className="text-[11px] text-slate-500">
                {tr(
                  language,
                  `${stats.draftGalleryCount}টি খসড়া আইটেম`,
                  `${stats.draftGalleryCount} drafts`,
                  `${stats.draftGalleryCount} مسودات`
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                {tr(language, 'অপেক্ষমাণ প্রকাশনা', 'Pending Tasks', 'مهام النشر المعلقة')}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
                {stats.pendingPublicationTasksCount}
              </div>
              <div className="text-[11px] text-amber-800 font-medium">
                {tr(language, 'রিভিউ ও পাবলিশ প্রয়োজন', 'Awaiting review', 'بانتظار الاعتماد')}
              </div>
            </div>
          </div>

          {/* 8 Required Quick Action Buttons */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {tr(
                  language,
                  'দ্রুত ওয়েবসাইট ব্যবস্থাপনা কার্যক্রম (Quick Actions)',
                  'Quick Website Management Actions',
                  'إجراءات إدارة الموقع السريعة'
                )}
              </h2>
              <span className="text-xs text-slate-500">
                {tr(
                  language,
                  'অনুমোদিত রোল: সুপার অ্যাডমিন ও মুহতামিম',
                  'Authorized: Super Admin & Muhtamim',
                  'مصرح: المشرف العام والمهتمم'
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                data-testid="cms-quick-edit-homepage"
                onClick={() => setActiveTab('homepage')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(language, 'হোমপেজ সম্পাদনা', 'Edit Homepage', 'تحرير الصفحة الرئيسية')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(language, '১২টি সেকশন ও নূর দৃশ্য', '12 sections & visibility', '١٢ قسماً والظهور')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-manage-pages"
                onClick={() => setActiveTab('pages')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(language, 'পেজসমূহ পরিচালনা', 'Manage Pages', 'إدارة الصفحات')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(language, '১০টি প্রাতিষ্ঠানিক পেজ', '10 public routes', '١٠ صفحات عامة')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-manage-teachers"
                onClick={() => setActiveTab('teachers')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(language, 'শিক্ষক প্রোফাইল ব্যবস্থাপনা', 'Manage Teachers', 'إدارة ملفات الأساتذة')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(
                      language,
                      `${stats.publishedProfilesCount}টি প্রকাশিত প্রোফাইল`,
                      `${stats.publishedProfilesCount} published profiles`,
                      `${stats.publishedProfilesCount} ملفات منشورة`
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-manage-notices"
                onClick={() => setActiveTab('notices')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(language, 'পাবলিক নোটিশ ব্যবস্থাপনা', 'Manage Notices', 'إدارة الإعلانات')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(language, 'খসড়া ও পাবলিক প্রকাশনা', 'Draft & public circulars', 'مسودات ونشر عام')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-manage-events"
                onClick={() => setActiveTab('events')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(language, 'সংবাদ ও ইভেন্ট ব্যবস্থাপনা', 'Manage Events', 'إدارة الفعاليات والأخبار')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(language, 'দস্তারবন্দী ও অনুষ্ঠানসূচি', 'Campus events & news', 'المناسبات والأخبار')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-manage-gallery"
                onClick={() => setActiveTab('gallery')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(language, 'গ্যালারি ব্যবস্থাপনা', 'Manage Gallery', 'إدارة المعرض')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(language, 'ক্যাম্পাস ও বিভাগীয় ছবি', 'Campus & activity media', 'صور الحرم المدرسي')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-manage-contact"
                onClick={() => setActiveTab('contact')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#063B27] text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {tr(
                      language,
                      'যোগাযোগ ও ফুটার তথ্য',
                      'Manage Contact Information',
                      'إدارة معلومات التواصل'
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tr(language, 'ঠিকানা, ফোন, ইমেইল ও সময়সূচি', 'Address, phone & hours', 'العنوان والهاتف والدوام')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-testid="cms-quick-preview-website"
                onClick={() => onPreviewPublicPage('/')}
                className="p-3.5 rounded-xl bg-[#050E1D] hover:bg-slate-900 border border-[#D4AF37]/40 text-start flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37] text-[#050E1D] flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F3D87D]">
                    {tr(language, 'পাবলিক ওয়েবসাইট প্রিভিউ', 'Preview Website', 'معاينة الموقع العام')}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {tr(language, 'সরাসরি লাইভ ভিউ খুলুন', 'Open live public view', 'فتح الموقع العام')}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recently Updated Content List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {tr(
                  language,
                  'সাম্প্রতিক হালনাগাদকৃত ওয়েবসাইট কন্টেন্ট (Recently Updated Content)',
                  'Recently Updated Website Content',
                  'أحدث التعديلات على محتوى الموقع'
                )}
              </h2>
              <span className="text-xs font-mono text-slate-500">
                {cmsConfig.updatedAt?.slice(0, 10)}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(cmsConfig.recentUpdates || []).slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        item.status === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.status === 'published'
                        ? tr(language, 'প্রকাশিত', 'Published', 'منشور')
                        : tr(language, 'খসড়া', 'Draft', 'مسودة')}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {tr(language, item.titleBn, item.titleEn, item.titleAr)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                    <span>{item.actorName}</span>
                    <span>·</span>
                    <span>{item.timestamp.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: HOMEPAGE EDITOR (12 SECTIONS)
         ===================================================================== */}
      {activeTab === 'homepage' && (
        <div data-testid="cms-panel-homepage" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 12 Section Selector */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
              {tr(
                language,
                'হোমপেজের ১২টি সেকশন নির্বাচন করুন',
                'Select Homepage Section (12 Sections)',
                'اختر قسم الصفحة الرئيسية (١٢ قسماً)'
              )}
            </div>
            <div className="space-y-1">
              {HOMEPAGE_SECTION_ORDER.map((item) => {
                const secState =
                  cmsConfig.homepageSections?.[item.id] || INITIAL_HOMEPAGE_SECTIONS[item.id];
                const isSelected = selectedHomepageSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`cms-homepage-sec-${item.id}`}
                    onClick={() => handleSelectHomepageSection(item.id)}
                    className={`w-full p-2.5 rounded-xl text-start flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#063B27] text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="truncate">
                      {tr(language, item.labelBn, item.labelEn, item.labelAr)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!secState.visible && (
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          secState.status === 'published'
                            ? isSelected
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {secState.status === 'published'
                          ? tr(language, 'প্রকাশিত', 'Live', 'منشور')
                          : tr(language, 'খসড়া', 'Draft', 'مسودة')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Section Editor Form */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-mono uppercase text-[#0A6847] font-bold">
                  SECTION: {selectedHomepageSectionId}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {tr(
                    language,
                    'হোমপেজ সেকশন কন্টেন্ট ও দৃশ্যমানতা এডিটর',
                    'Homepage Section Content & Visibility Editor',
                    'محرر محتوى وظهور قسم الصفحة الرئيسية'
                  )}
                </h2>
              </div>

              {/* Section Visibility Toggle */}
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="cms-homepage-visible-toggle"
                  checked={homepageDraftForm.visible}
                  onChange={(e) =>
                    setHomepageDraftForm((prev) => ({
                      ...prev,
                      visible: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-[#063B27]"
                />
                <span>
                  {homepageDraftForm.visible
                    ? tr(language, 'হোমপেজে দৃশ্যমান (Visible)', 'Visible on Homepage', 'مرئي في الرئيسية')
                    : tr(language, 'হোমপেজে লুকানো (Hidden)', 'Hidden on Homepage', 'مخفي في الرئيسية')}
                </span>
              </label>
            </div>

            {/* Trilingual Input Selector (BN / EN / AR) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
              {(['bn', 'en', 'ar'] as Language[]).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  data-testid={`cms-homepage-lang-${lng}`}
                  onClick={() => setEditLangTab(lng)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    editLangTab === lng
                      ? 'bg-white text-[#063B27] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lng === 'bn'
                    ? 'বাংলা (Default)'
                    : lng === 'en'
                      ? 'English'
                      : 'العربية (RTL)'}
                </button>
              ))}
            </div>

            {/* Language-specific fields */}
            <div dir={editLangTab === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editLangTab === 'bn'
                    ? 'সেকশন ব্যাজ / উপশিরোনাম (বাংলা)'
                    : editLangTab === 'ar'
                      ? 'شارة القسم (بالعربية)'
                      : 'Section Badge / Eyebrow (English)'}
                </label>
                <input
                  type="text"
                  value={
                    editLangTab === 'bn'
                      ? homepageDraftForm.badgeBn
                      : editLangTab === 'ar'
                        ? homepageDraftForm.badgeAr
                        : homepageDraftForm.badgeEn
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setHomepageDraftForm((prev) => ({
                      ...prev,
                      ...(editLangTab === 'bn'
                        ? { badgeBn: val }
                        : editLangTab === 'ar'
                          ? { badgeAr: val }
                          : { badgeEn: val }),
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editLangTab === 'bn'
                    ? 'প্রধান শিরোনাম (বাংলা) *'
                    : editLangTab === 'ar'
                      ? 'العنوان الرئيسي (بالعربية)'
                      : 'Main Headline (English) *'}
                </label>
                <input
                  type="text"
                  data-testid={`cms-homepage-title-${editLangTab}`}
                  value={
                    editLangTab === 'bn'
                      ? homepageDraftForm.titleBn
                      : editLangTab === 'ar'
                        ? homepageDraftForm.titleAr
                        : homepageDraftForm.titleEn
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setHomepageDraftForm((prev) => ({
                      ...prev,
                      ...(editLangTab === 'bn'
                        ? { titleBn: val }
                        : editLangTab === 'ar'
                          ? { titleAr: val }
                          : { titleEn: val }),
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editLangTab === 'bn'
                    ? 'বিস্তারিত বিবরণ (বাংলা)'
                    : editLangTab === 'ar'
                      ? 'الوصف التفصيلي (بالعربية)'
                      : 'Detailed Description (English)'}
                </label>
                <textarea
                  rows={3}
                  data-testid={`cms-homepage-desc-${editLangTab}`}
                  value={
                    editLangTab === 'bn'
                      ? homepageDraftForm.descriptionBn
                      : editLangTab === 'ar'
                        ? homepageDraftForm.descriptionAr
                        : homepageDraftForm.descriptionEn
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setHomepageDraftForm((prev) => ({
                      ...prev,
                      ...(editLangTab === 'bn'
                        ? { descriptionBn: val }
                        : editLangTab === 'ar'
                          ? { descriptionAr: val }
                          : { descriptionEn: val }),
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              {selectedHomepageSectionId === 'hero' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {editLangTab === 'bn'
                        ? 'প্রাথমিক CTA বাটন টেক্সট (বাংলা)'
                        : editLangTab === 'ar'
                          ? 'نص الزر الرئيسي (بالعربية)'
                          : 'Primary CTA Button Label (English)'}
                    </label>
                    <input
                      type="text"
                      value={
                        editLangTab === 'bn'
                          ? homepageDraftForm.primaryCtaBn || ''
                          : editLangTab === 'ar'
                            ? homepageDraftForm.primaryCtaAr || ''
                            : homepageDraftForm.primaryCtaEn || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraftForm((prev) => ({
                          ...prev,
                          ...(editLangTab === 'bn'
                            ? { primaryCtaBn: val }
                            : editLangTab === 'ar'
                              ? { primaryCtaAr: val }
                              : { primaryCtaEn: val }),
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {editLangTab === 'bn'
                        ? 'দ্বিতীয় CTA বাটন টেক্সট (বাংলা)'
                        : editLangTab === 'ar'
                          ? 'نص الزر الثانوي (بالعربية)'
                          : 'Secondary CTA Button Label (English)'}
                    </label>
                    <input
                      type="text"
                      value={
                        editLangTab === 'bn'
                          ? homepageDraftForm.secondaryCtaBn || ''
                          : editLangTab === 'ar'
                            ? homepageDraftForm.secondaryCtaAr || ''
                            : homepageDraftForm.secondaryCtaEn || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraftForm((prev) => ({
                          ...prev,
                          ...(editLangTab === 'bn'
                            ? { secondaryCtaBn: val }
                            : editLangTab === 'ar'
                              ? { secondaryCtaAr: val }
                              : { secondaryCtaEn: val }),
                        }));
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar: Save as Draft, Preview, Publish */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                {tr(
                  language,
                  `সর্বশেষ হালনাগাদ: ${homepageDraftForm.updatedAt || 'N/A'} · স্ট্যাটাস: ${homepageDraftForm.status}`,
                  `Last updated: ${homepageDraftForm.updatedAt || 'N/A'} · Status: ${homepageDraftForm.status}`,
                  `آخر تحديث: ${homepageDraftForm.updatedAt || 'N/A'}`
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  data-testid="cms-homepage-preview-btn"
                  onClick={() => setShowHomepagePreviewModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{tr(language, 'প্রিভিউ দেখুন', 'Preview', 'معاينة')}</span>
                </button>

                <button
                  type="button"
                  data-testid="cms-homepage-save-draft-btn"
                  disabled={isSaving}
                  onClick={() => handleSaveHomepageSection('draft')}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{tr(language, 'খসড়া সংরক্ষণ (Draft)', 'Save as Draft', 'حفظ كمسودة')}</span>
                </button>

                <button
                  type="button"
                  data-testid="cms-homepage-publish-btn"
                  disabled={isSaving}
                  onClick={() => handleSaveHomepageSection('published')}
                  className="px-4 py-2 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {tr(language, 'ওয়েবসাইটে প্রকাশ করুন (Publish)', 'Publish Section', 'نشر القسم')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: INSTITUTIONAL PAGES EDITOR (10 PUBLIC ROUTES)
         ===================================================================== */}
      {activeTab === 'pages' && (
        <div data-testid="cms-panel-pages" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 10 Pages List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
              {tr(
                language,
                '১০টি পাবলিক প্রাতিষ্ঠানিক পেজ',
                '10 Public Institutional Pages',
                'الصفحات المؤسسية العشر'
              )}
            </div>
            <div className="space-y-1">
              {PUBLIC_PAGE_SLUGS.map((item) => {
                const pg = cmsConfig.pages?.[item.slug] || INITIAL_CMS_PAGES[item.slug];
                const isSelected = selectedPageSlug === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    data-testid={`cms-page-select-${item.slug.slice(1)}`}
                    onClick={() => handleSelectPageSlug(item.slug)}
                    className={`w-full p-2.5 rounded-xl text-start flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#063B27] text-white font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="truncate">
                      {tr(language, item.labelBn, item.labelEn, item.labelAr)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        pg.status === 'published'
                          ? isSelected
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {pg.status === 'published'
                        ? tr(language, 'প্রকাশিত', 'Published', 'منشور')
                        : tr(language, 'খসড়া', 'Draft', 'مسودة')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Page Content Editor */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-mono font-bold text-[#0A6847]">
                  ROUTE: {selectedPageSlug}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {tr(
                    language,
                    'প্রাতিষ্ঠানিক পেজ কন্টেন্ট এডিটর (BN / EN / AR)',
                    'Institutional Page Content Editor (BN / EN / AR)',
                    'محرر محتوى الصفحة المؤسسية'
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onPreviewPublicPage(selectedPageSlug)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#063B27] border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {tr(language, 'লাইভ পেজ খুলুন', 'Open Live Route', 'فتح الصفحة المباشرة')}
                </span>
              </button>
            </div>

            {selectedPageSlug === '/admission' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  {tr(
                    language,
                    'নিরাপত্তা নোট: এখানে কেবল /admission পেজের উপরের প্রাতিষ্ঠানিক নির্দেশিকা ও সারসংক্ষেপ সম্পাদনা করা যাবে। মূল ৪-ধাপের ভর্তি ফরম, মুহতামিম অনুমোদন এবং স্টুডেন্ট আইডি তৈরির কর্মপ্রবাহ সম্পূর্ণ অক্ষুণ্ণ ও সুরক্ষিত থাকবে।',
                    'Safety Note: Editing this page updates the introductory guidance on /admission without altering the 4-step admission application workflow or private applicant data.',
                    'ملاحظة أمان: يقتصر التعديل هنا على المقدمة الإرشادية لصفحة القبول دون المساس بنظام التقديم والاعتماد.'
                  )}
                </span>
              </div>
            )}

            {/* Trilingual Input Selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
              {(['bn', 'en', 'ar'] as Language[]).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => setEditLangTab(lng)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    editLangTab === lng
                      ? 'bg-white text-[#063B27] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lng === 'bn'
                    ? 'বাংলা (Default)'
                    : lng === 'en'
                      ? 'English'
                      : 'العربية (RTL)'}
                </button>
              ))}
            </div>

            <div dir={editLangTab === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editLangTab === 'bn'
                    ? 'পেজের প্রধান শিরোনাম (বাংলা) *'
                    : editLangTab === 'ar'
                      ? 'عنوان الصفحة الرئيسي (بالعربية)'
                      : 'Page Headline (English) *'}
                </label>
                <input
                  type="text"
                  data-testid={`cms-page-title-${editLangTab}`}
                  value={
                    editLangTab === 'bn'
                      ? pageDraftForm.titleBn
                      : editLangTab === 'ar'
                        ? pageDraftForm.titleAr
                        : pageDraftForm.titleEn
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageDraftForm((prev) => ({
                      ...prev,
                      ...(editLangTab === 'bn'
                        ? { titleBn: val }
                        : editLangTab === 'ar'
                          ? { titleAr: val }
                          : { titleEn: val }),
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editLangTab === 'bn'
                    ? 'উপশিরোনাম / সাবটাইটেল (বাংলা)'
                    : editLangTab === 'ar'
                      ? 'العنوان الفرعي (بالعربية)'
                      : 'Page Subtitle (English)'}
                </label>
                <input
                  type="text"
                  value={
                    editLangTab === 'bn'
                      ? pageDraftForm.subtitleBn
                      : editLangTab === 'ar'
                        ? pageDraftForm.subtitleAr
                        : pageDraftForm.subtitleEn
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageDraftForm((prev) => ({
                      ...prev,
                      ...(editLangTab === 'bn'
                        ? { subtitleBn: val }
                        : editLangTab === 'ar'
                          ? { subtitleAr: val }
                          : { subtitleEn: val }),
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editLangTab === 'bn'
                    ? 'প্রাতিষ্ঠানিক সারসংক্ষেপ / ভূমিকা অনুচ্ছেদ (বাংলা)'
                    : editLangTab === 'ar'
                      ? 'الملخص المؤسسي للصفحة (بالعربية)'
                      : 'Institutional Summary Paragraph (English)'}
                </label>
                <textarea
                  rows={3}
                  data-testid={`cms-page-summary-${editLangTab}`}
                  value={
                    editLangTab === 'bn'
                      ? pageDraftForm.summaryBn
                      : editLangTab === 'ar'
                        ? pageDraftForm.summaryAr
                        : pageDraftForm.summaryEn
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageDraftForm((prev) => ({
                      ...prev,
                      ...(editLangTab === 'bn'
                        ? { summaryBn: val }
                        : editLangTab === 'ar'
                          ? { summaryAr: val }
                          : { summaryEn: val }),
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-mono">
                {tr(
                  language,
                  `সর্বশেষ আপডেট: ${pageDraftForm.updatedAt} (${pageDraftForm.updatedBy})`,
                  `Last updated: ${pageDraftForm.updatedAt} by ${pageDraftForm.updatedBy}`,
                  `آخر تحديث: ${pageDraftForm.updatedAt}`
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  data-testid="cms-page-preview-btn"
                  onClick={() => setShowPagePreviewModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{tr(language, 'প্রিভিউ', 'Preview', 'معاينة')}</span>
                </button>

                <button
                  type="button"
                  data-testid="cms-page-save-draft-btn"
                  disabled={isSaving}
                  onClick={() => handleSaveInstitutionalPage('draft')}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{tr(language, 'খসড়া সংরক্ষণ (Draft)', 'Save Draft', 'حفظ كمسودة')}</span>
                </button>

                <button
                  type="button"
                  data-testid="cms-page-publish-btn"
                  disabled={isSaving}
                  onClick={() => handleSaveInstitutionalPage('published')}
                  className="px-4 py-2 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{tr(language, 'পেজ প্রকাশ করুন (Publish)', 'Publish Page', 'نشر الصفحة')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: TEACHER & ADMINISTRATION PUBLIC PROFILES
         ===================================================================== */}
      {activeTab === 'teachers' && (
        <div data-testid="cms-panel-teachers" className="space-y-6">
          {/* Privacy Protection Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-[#063B27] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">
                {tr(
                  language,
                  'প্রাতিষ্ঠানিক গোপনীয়তা সুরক্ষা (Zero Auto-Publish Policy)',
                  'Strict Staff Privacy Guard (Zero Auto-Publish Policy)',
                  'سياسة حماية خصوصية الأساتذة والموظفين'
                )}
              </div>
              <p className="mt-0.5 text-emerald-900">
                {tr(
                  language,
                  'অভ্যন্তরীণ স্টাফ রেকর্ডের ব্যক্তিগত ফোন নম্বর, বেতন-ভাতা বা ব্যাংক তথ্য কখনোই পাবলিক ওয়েবসাইটে প্রকাশ করা হয় না। কেবলমাত্র নিচে অনুমোদিত ও "প্রকাশিত (Published)" চিহ্নিত পাবলিক প্রোফাইলসমূহ /teachers এবং /administration পেজে প্রদর্শিত হবে।',
                  'Internal staff records (phone numbers, salaries, payroll details) are never automatically published. Only profiles explicitly approved and marked "Published" below appear on /teachers and /administration.',
                  'لا يتم نشر أرقام الهواتف الشخصية أو الرواتب أبداً؛ وتظهر فقط الملفات المعتمدة والمنشورة أدناه.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Form */}
            <form
              onSubmit={handleSavePublicProfile}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  {editingProfileId
                    ? tr(language, 'পাবলিক প্রোফাইল সম্পাদনা', 'Edit Public Profile', 'تعديل الملف التعريفي')
                    : tr(
                        language,
                        'নতুন অনুমোদিত পাবলিক প্রোফাইল সংযোজন',
                        'Add Approved Public Profile',
                        'إضافة ملف تعريف عام جديد'
                      )}
                </h2>
                {editingProfileId && (
                  <button
                    type="button"
                    onClick={() => setEditingProfileId(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {tr(language, 'বাতিল', 'Cancel', 'إلغاء')}
                  </button>
                )}
              </div>

              {/* Safe Staff Import Helper (Copies only Name, Designation, Department & Qualification — never phone or salary) */}
              {staff.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {tr(
                      language,
                      'বিদ্যমান স্টাফ তালিকা থেকে নিরাপদ তথ্য পূরণ (ঐচ্ছিক — ফোন/বেতন ব্যতীত):',
                      'Prefill safe public fields from existing staff (excludes phone & salary):',
                      'استيراد الاسم والمسمى الوظيفي فقط من قائمة الموظفين:'
                    )}
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const found = staff.find((s) => s.id === e.target.value);
                      if (found) {
                        setProfileForm((prev) => ({
                          ...prev,
                          profileType:
                            found.role === 'muhtamim' ||
                            found.department === 'administration' ||
                            found.department === 'boarding'
                              ? 'administration'
                              : 'teacher',
                          nameBn: found.nameBn,
                          nameEn: found.nameEn,
                          designationBn: found.designation,
                          designationEn: found.designation,
                          department: found.department,
                          biographyBn: `${found.qualification}। দায়িত্বপ্রাপ্ত জামাত: ${found.assignedClasses}।`,
                        }));
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="">
                      {tr(
                        language,
                        '-- স্টাফ নির্বাচন করে নাম ও পদবি পূরণ করুন --',
                        '-- Select staff member to prefill name & title --',
                        '-- اختر موظفاً لتعبئة الاسم والمسمى --'
                      )}
                    </option>
                    {staff.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nameBn} — {st.designation}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'প্রোফাইল ধরন', 'Profile Type', 'نوع الملف')}
                  </label>
                  <select
                    value={profileForm.profileType}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        profileType: e.target.value as 'teacher' | 'administration',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="teacher">
                      {tr(language, 'উস্তায / শিক্ষক (/teachers)', 'Teacher (/teachers)', 'أستاذ (/teachers)')}
                    </option>
                    <option value="administration">
                      {tr(
                        language,
                        'প্রশাসন (/administration)',
                        'Administration (/administration)',
                        'إدارة (/administration)'
                      )}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'বিভাগ', 'Department', 'القسم')}
                  </label>
                  <select
                    value={profileForm.department}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        department: e.target.value as CmsPublicProfile['department'],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="hifz">হিফযুল কুরআন বিভাগ (Hifz)</option>
                    <option value="qawmi">কওমি কিতাব বিভাগ (Qawmi)</option>
                    <option value="general">জেনারেল ক্যাডেট বিভাগ (General)</option>
                    <option value="administration">প্রশাসন দপ্তর (Administration)</option>
                    <option value="boarding">দারুল ইকামাহ (Residential)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'নাম (বাংলা) *', 'Full Name (Bengali) *', 'الاسم (بالبنغالية) *')}
                </label>
                <input
                  type="text"
                  data-testid="cms-profile-name-bn"
                  value={profileForm.nameBn}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, nameBn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'নাম (English)', 'Full Name (English)', 'الاسم (بالإنجليزية)')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.nameEn}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'নাম (العربية)', 'Full Name (Arabic)', 'الاسم (بالعربية)')}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={profileForm.nameAr}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'পদবি (বাংলা) *', 'Designation (Bengali) *', 'المسمى الوظيفي (بالبنغالية) *')}
                </label>
                <input
                  type="text"
                  data-testid="cms-profile-designation-bn"
                  value={profileForm.designationBn}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, designationBn: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'পদবি (English)', 'Designation (English)', 'المسمى الوظيفي (بالإنجليزية)')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.designationEn}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, designationEn: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'পদবি (العربية)', 'Designation (Arabic)', 'المسمى الوظيفي (بالعربية)')}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={profileForm.designationAr}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, designationAr: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(
                    language,
                    'অনুমোদিত পাবলিক পরিচিতি / যোগ্যতা (বাংলা)',
                    'Approved Public Biography (Bengali)',
                    'السيرة الذاتية المعتمدة للنشر (بالبنغالية)'
                  )}
                </label>
                <textarea
                  rows={2}
                  data-testid="cms-profile-bio-bn"
                  value={profileForm.biographyBn}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, biographyBn: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tr(language, 'পাবলিক ছবি (HTTPS URL / Storage)', 'Public Photo URL', 'رابط الصورة العامة')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={profileForm.photoUrl}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, photoUrl: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <label className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingProfilePhoto}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingProfilePhoto(true);
                          const res = await uploadCmsMediaAsset(file, file.name);
                          setIsUploadingProfilePhoto(false);
                          if (res.ok && res.url) {
                            setProfileForm((prev) => ({ ...prev, photoUrl: res.url || '' }));
                          } else {
                            setFeedbackBanner({
                              type: 'error',
                              message: res.errorBn || 'Upload failed',
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {tr(language, 'ক্রম (Order)', 'Order', 'الترتيب')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={profileForm.displayOrder}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          displayOrder: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {tr(language, 'প্রকাশনা স্ট্যাটাস', 'Status', 'الحالة')}
                    </label>
                    <select
                      data-testid="cms-profile-status-select"
                      value={profileForm.status}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          status: e.target.value as 'published' | 'unpublished',
                        }))
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    >
                      <option value="unpublished">
                        {tr(language, 'অপ্রকাশিত (Unpublished)', 'Unpublished', 'غير منشور')}
                      </option>
                      <option value="published">
                        {tr(language, 'প্রকাশিত (Published)', 'Published', 'منشور')}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                data-testid="cms-profile-submit-btn"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingProfileId
                    ? tr(language, 'প্রোফাইল হালনাগাদ করুন', 'Update Profile', 'تحديث الملف')
                    : tr(language, 'পাবলিক প্রোফাইল সংরক্ষণ করুন', 'Save Public Profile', 'حفظ الملف العام')}
                </span>
              </button>
            </form>

            {/* Profiles List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                {tr(
                  language,
                  `তালিকাভুক্ত পাবলিক প্রোফাইলসমূহ (${(cmsConfig.publicProfiles || []).length})`,
                  `Configured Public Profiles (${(cmsConfig.publicProfiles || []).length})`,
                  `الملفات التعريفية المسجلة (${(cmsConfig.publicProfiles || []).length})`
                )}
              </h2>

              <div className="space-y-3">
                {(cmsConfig.publicProfiles || [])
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((prof) => (
                    <div
                      key={prof.id}
                      className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            #{prof.displayOrder}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {tr(language, prof.nameBn, prof.nameEn, prof.nameAr)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              prof.status === 'published'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {prof.status === 'published'
                              ? tr(language, 'প্রকাশিত', 'Published', 'منشور')
                              : tr(language, 'অপ্রকাশিত', 'Unpublished', 'غير منشور')}
                          </span>
                        </div>
                        <div className="text-xs text-[#0A6847] font-semibold">
                          {tr(language, prof.designationBn, prof.designationEn, prof.designationAr)}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {tr(
                            language,
                            prof.biographyBn,
                            prof.biographyEn || prof.biographyBn,
                            prof.biographyAr || prof.biographyBn
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleProfilePublish(prof)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          {prof.status === 'published'
                            ? tr(language, 'আনপাবলিশ', 'Unpublish', 'إلغاء النشر')
                            : tr(language, 'পাবলিশ করুন', 'Publish', 'نشر')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileId(prof.id);
                            setProfileForm({
                              profileType: prof.profileType,
                              nameBn: prof.nameBn,
                              nameEn: prof.nameEn,
                              nameAr: prof.nameAr,
                              designationBn: prof.designationBn,
                              designationEn: prof.designationEn,
                              designationAr: prof.designationAr,
                              department: prof.department,
                              biographyBn: prof.biographyBn,
                              biographyEn: prof.biographyEn,
                              biographyAr: prof.biographyAr,
                              photoUrl: prof.photoUrl,
                              displayOrder: prof.displayOrder,
                              status: prof.status,
                            });
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProfileId(prof.id)}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: NOTICE MANAGEMENT (INTEGRATED WITH EXISTING NOTICES COLLECTION)
         ===================================================================== */}
      {activeTab === 'notices' && (
        <div data-testid="cms-panel-notices" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notice Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingNoticeId
                  ? tr(language, 'পাবলিক নোটিশ সম্পাদনা', 'Edit Notice', 'تعديل الإعلان')
                  : tr(language, 'নতুন পাবলিক বা খসড়া নোটিশ তৈরি', 'Create Public or Draft Notice', 'إنشاء إعلان جديد')}
              </h2>
              {editingNoticeId && (
                <button
                  type="button"
                  onClick={() => setEditingNoticeId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {tr(language, 'বাতিল', 'Cancel', 'إلغاء')}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'নোটিশের শিরোনাম (বাংলা) *', 'Notice Title (Bengali) *', 'عنوان الإعلان (بالبنغالية) *')}
              </label>
              <input
                type="text"
                data-testid="cms-notice-title-bn"
                value={noticeForm.titleBn}
                onChange={(e) => setNoticeForm((prev) => ({ ...prev, titleBn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'শিরোনাম (English)', 'Notice Title (English)', 'العنوان (بالإنجليزية)')}
                </label>
                <input
                  type="text"
                  data-testid="cms-notice-title-en"
                  value={noticeForm.titleEn}
                  onChange={(e) => setNoticeForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'শিরোনাম (العربية)', 'Notice Title (Arabic)', 'العنوان (بالعربية)')}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={noticeForm.titleAr}
                  onChange={(e) => setNoticeForm((prev) => ({ ...prev, titleAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'ক্যাটাগরি', 'Category', 'التصنيف')}
                </label>
                <select
                  value={noticeForm.category}
                  onChange={(e) =>
                    setNoticeForm((prev) => ({
                      ...prev,
                      category: e.target.value as CmsNoticeMetadata['category'],
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="general">সাধারণ (General)</option>
                  <option value="academic">একাডেমিক (Academic)</option>
                  <option value="exam">পরীক্ষা (Exam)</option>
                  <option value="admission">ভর্তি (Admission)</option>
                  <option value="holiday">ছুটি (Holiday)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'অগ্রাধিকার', 'Priority', 'الأولوية')}
                </label>
                <select
                  value={noticeForm.priority}
                  onChange={(e) =>
                    setNoticeForm((prev) => ({
                      ...prev,
                      priority: e.target.value as Notice['priority'],
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="normal">সাধারণ (Normal)</option>
                  <option value="important">গুরুত্বপূর্ণ (Important)</option>
                  <option value="urgent">জরুরি (Urgent)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'প্রযোজ্য জামাত', 'Target Class', 'الفصل المستهدف')}
                </label>
                <input
                  type="text"
                  value={noticeForm.targetClass}
                  onChange={(e) =>
                    setNoticeForm((prev) => ({ ...prev, targetClass: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'প্রকাশের তারিখ', 'Publish Date', 'تاريخ النشر')}
                </label>
                <input
                  type="date"
                  value={noticeForm.publishDate}
                  onChange={(e) =>
                    setNoticeForm((prev) => ({ ...prev, publishDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'মেয়াদ উত্তীর্ণ তারিখ (ঐচ্ছিক)', 'Expiry Date (Optional)', 'تاريخ الانتهاء')}
                </label>
                <input
                  type="date"
                  value={noticeForm.expiryDate}
                  onChange={(e) =>
                    setNoticeForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'নোটিশের বিস্তারিত বিবরণ (বাংলা) *', 'Notice Content (Bengali) *', 'محتوى الإعلان (بالبنغالية) *')}
              </label>
              <textarea
                rows={3}
                data-testid="cms-notice-content-bn"
                value={noticeForm.contentBn}
                onChange={(e) => setNoticeForm((prev) => ({ ...prev, contentBn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'অনুমোদিত সংযুক্তি / পিডিএফ লিংক (ঐচ্ছিক)', 'Approved Attachment URL (Optional)', 'رابط المرفق المعتمد (اختياري)')}
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={noticeForm.attachmentUrl}
                onChange={(e) =>
                  setNoticeForm((prev) => ({ ...prev, attachmentUrl: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="cms-notice-preview-btn"
                onClick={() => setShowNoticePreviewModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{tr(language, 'প্রিভিউ', 'Preview', 'معاينة')}</span>
              </button>

              <button
                type="button"
                data-testid="cms-notice-save-draft-btn"
                disabled={isSaving}
                onClick={() => handleSaveCmsNotice('draft')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{tr(language, 'খসড়া সংরক্ষণ (Draft)', 'Save as Draft', 'حفظ كمسودة')}</span>
              </button>

              <button
                type="button"
                data-testid="cms-notice-publish-btn"
                disabled={isSaving}
                onClick={() => handleSaveCmsNotice('published')}
                className="flex-1 py-2 px-4 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {tr(language, 'পাবলিক প্রকাশ করুন', 'Publish for Public', 'نشر للجمهور')}
                </span>
              </button>
            </div>
          </div>

          {/* Existing Notices List */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {tr(
                  language,
                  `সকল নোটিশ ও প্রকাশনা অবস্থা (${(cmsConfig.draftNotices || []).length + notices.length})`,
                  `All Notices & Publication Status (${(cmsConfig.draftNotices || []).length + notices.length})`,
                  `جميع الإعلانات وحالة النشر (${(cmsConfig.draftNotices || []).length + notices.length})`
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px] font-bold">
                  {(cmsConfig.draftNotices || []).length} {tr(language, 'খসড়া', 'Drafts', 'مسودات')}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                  {notices.filter((n) => n.targetAudience === 'all').length} {tr(language, 'পাবলিক', 'Public', 'عام')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. Private Draft Notices Stored in CMS Config */}
              {(cmsConfig.draftNotices || []).map((draft) => (
                <div
                  key={draft.id}
                  data-testid={`cms-draft-notice-${draft.id}`}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {tr(language, 'খসড়া (CMS Draft)', 'CMS Draft (Private)', 'مسودة خاصة')}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {draft.publishDate}
                      </span>
                      {draft.expiryDate && (
                        <span className="text-[11px] font-mono text-amber-700">
                          Exp: {draft.expiryDate}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({draft.targetClass})
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{draft.titleBn}</div>
                    <p className="text-xs text-slate-600 line-clamp-2">{draft.contentBn}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid={`cms-edit-draft-${draft.id}`}
                      onClick={() => {
                        setEditingNoticeId(draft.id);
                        setNoticeForm({
                          titleBn: draft.titleBn,
                          titleEn: draft.titleEn,
                          titleAr: draft.titleAr,
                          contentBn: draft.contentBn,
                          contentEn: draft.contentEn,
                          contentAr: draft.contentAr,
                          category: draft.category,
                          targetClass: draft.targetClass,
                          priority: draft.priority,
                          publishDate: draft.publishDate,
                          expiryDate: draft.expiryDate || '',
                          attachmentUrl: draft.attachmentUrl || '',
                          status: 'draft',
                        });
                      }}
                      className="p-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      data-testid={`cms-delete-draft-${draft.id}`}
                      onClick={() => setConfirmDeleteNoticeId(draft.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 2. Collection Notices */}
              {notices.map((n) => {
                const { cleanNotice, cmsMeta } = decodeNoticeWithCmsMeta(n);
                const isPublicPublished =
                  n.targetAudience === 'all' && cmsMeta.status === 'published';
                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPublicPublished
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : cmsMeta.status === 'draft'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isPublicPublished
                            ? tr(language, 'পাবলিক প্রকাশিত', 'Public Live', 'منشور للعامة')
                            : cmsMeta.status === 'draft'
                              ? tr(language, 'খসড়া (Draft)', 'Draft', 'مسودة')
                              : tr(language, `অভ্যন্তরীণ (${n.targetAudience})`, `Internal (${n.targetAudience})`, 'داخلي')}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {cleanNotice.publishDate}
                        </span>
                        {cmsMeta.expiryDate && (
                          <span className="text-[11px] font-mono text-amber-700">
                            Exp: {cmsMeta.expiryDate}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          ({cleanNotice.targetClass})
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{cleanNotice.titleBn}</div>
                      <p className="text-xs text-slate-600 line-clamp-2">{cleanNotice.contentBn}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoticeId(n.id);
                          setNoticeForm({
                            titleBn: cleanNotice.titleBn,
                            titleEn: cleanNotice.titleEn,
                            titleAr: cmsMeta.titleAr,
                            contentBn: cleanNotice.contentBn,
                            contentEn: cmsMeta.contentEn,
                            contentAr: cmsMeta.contentAr,
                            category: cmsMeta.category,
                            targetClass: cleanNotice.targetClass,
                            priority: cleanNotice.priority,
                            publishDate: cleanNotice.publishDate,
                            expiryDate: cmsMeta.expiryDate,
                            attachmentUrl: cmsMeta.attachmentUrl,
                            status: cmsMeta.status,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteNoticeId(n.id)}
                        className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: EVENTS & NEWS MANAGEMENT
         ===================================================================== */}
      {activeTab === 'events' && (
        <div data-testid="cms-panel-events" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingEventId
                  ? tr(language, 'ইভেন্ট বা সংবাদ সম্পাদনা', 'Edit Event', 'تعديل الفعالية')
                  : tr(language, 'নতুন পাবলিক ইভেন্ট বা সংবাদ সংযোজন', 'Add Event or News', 'إضافة فعالية أو خبر')}
              </h2>
              {editingEventId && (
                <button
                  type="button"
                  onClick={() => setEditingEventId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {tr(language, 'বাতিল', 'Cancel', 'إلغاء')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'ইভেন্ট ক্যাটাগরি', 'Category', 'التصنيف')}
                </label>
                <select
                  value={eventForm.category}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      category: e.target.value as CmsPublicEvent['category'],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="event">দস্তারবন্দী ও মাহফিল (Ceremony/Event)</option>
                  <option value="academic">একাডেমিক সেশন (Academic)</option>
                  <option value="exam">পরীক্ষা সংক্রান্ত (Exam)</option>
                  <option value="admission">ভর্তি কার্যক্রম (Admission)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'ইভেন্টের তারিখ', 'Event Date', 'تاريخ الفعالية')}
                </label>
                <input
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, eventDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'ইভেন্ট শিরোনাম (বাংলা) *', 'Event Title (Bengali) *', 'عنوان الفعالية (بالبنغالية) *')}
              </label>
              <input
                type="text"
                data-testid="cms-event-title-bn"
                value={eventForm.titleBn}
                onChange={(e) => setEventForm((prev) => ({ ...prev, titleBn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'শিরোনাম (English)', 'Title (English)', 'العنوان (بالإنجليزية)')}
                </label>
                <input
                  type="text"
                  value={eventForm.titleEn}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'শিরোনাম (العربية)', 'Title (Arabic)', 'العنوان (بالعربية)')}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={eventForm.titleAr}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, titleAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'বিস্তারিত বিবরণ (বাংলা) *', 'Description (Bengali) *', 'التفاصيل (بالبنغالية) *')}
              </label>
              <textarea
                rows={3}
                data-testid="cms-event-desc-bn"
                value={eventForm.descriptionBn}
                onChange={(e) =>
                  setEventForm((prev) => ({ ...prev, descriptionBn: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'কভার ছবি (HTTPS URL / Storage)', 'Cover Image URL', 'رابط صورة الغلاف')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={eventForm.coverImageUrl}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <label className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingEventImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingEventImage(true);
                      const res = await uploadCmsMediaAsset(file, file.name);
                      setIsUploadingEventImage(false);
                      if (res.ok && res.url) {
                        setEventForm((prev) => ({ ...prev, coverImageUrl: res.url || '' }));
                      } else {
                        setFeedbackBanner({
                          type: 'error',
                          message: res.errorBn || 'Upload failed',
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="cms-event-save-draft-btn"
                disabled={isSaving}
                onClick={() => handleSaveCmsEvent('draft')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{tr(language, 'খসড়া সংরক্ষণ (Draft)', 'Save as Draft', 'حفظ كمسودة')}</span>
              </button>

              <button
                type="button"
                data-testid="cms-event-publish-btn"
                disabled={isSaving}
                onClick={() => handleSaveCmsEvent('published')}
                className="flex-1 py-2 px-4 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{tr(language, 'ইভেন্ট প্রকাশ করুন', 'Publish Event', 'نشر الفعالية')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              {tr(
                language,
                `ইভেন্ট ও সংবাদ তালিকা (${(cmsConfig.events || []).length})`,
                `Configured Events & News (${(cmsConfig.events || []).length})`,
                `قائمة الفعاليات والأخبار (${(cmsConfig.events || []).length})`
              )}
            </h2>

            <div className="space-y-3">
              {(cmsConfig.events || []).map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ev.status === 'published'
                          ? tr(language, 'প্রকাশিত', 'Published', 'منشور')
                          : tr(language, 'খসড়া', 'Draft', 'مسودة')}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{ev.eventDate}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {tr(language, ev.titleBn, ev.titleEn, ev.titleAr)}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {tr(language, ev.descriptionBn, ev.descriptionEn, ev.descriptionAr)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid={`cms-toggle-event-publish-${ev.id}`}
                      disabled={isSaving}
                      onClick={() => handleToggleEventPublish(ev)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                        ev.status === 'published'
                          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900'
                          : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {ev.status === 'published' ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{tr(language, 'আনপাবলিশ', 'Unpublish', 'إلغاء النشر')}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tr(language, 'প্রকাশ', 'Publish', 'نشر')}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(ev.id);
                        setEventForm({
                          titleBn: ev.titleBn,
                          titleEn: ev.titleEn,
                          titleAr: ev.titleAr,
                          descriptionBn: ev.descriptionBn,
                          descriptionEn: ev.descriptionEn,
                          descriptionAr: ev.descriptionAr,
                          eventDate: ev.eventDate,
                          category: ev.category,
                          badgeBn: ev.badgeBn,
                          badgeEn: ev.badgeEn,
                          badgeAr: ev.badgeAr,
                          coverImageUrl: ev.coverImageUrl,
                          galleryImageUrls: ev.galleryImageUrls,
                          status: ev.status,
                        });
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteEventId(ev.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: GALLERY MANAGEMENT
         ===================================================================== */}
      {activeTab === 'gallery' && (
        <div data-testid="cms-panel-gallery" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingGalleryId
                  ? tr(language, 'গ্যালারি আইটেম সম্পাদনা', 'Edit Gallery Item', 'تعديل عنصر المعرض')
                  : tr(language, 'নতুন গ্যালারি আইটেম সংযোজন', 'Add Gallery Item', 'إضافة عنصر للمعرض')}
              </h2>
              {editingGalleryId && (
                <button
                  type="button"
                  onClick={() => setEditingGalleryId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {tr(language, 'বাতিল', 'Cancel', 'إلغاء')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'বিভাগ / ক্যাটাগরি', 'Category', 'القسم')}
                </label>
                <select
                  value={galleryForm.departmentKey}
                  onChange={(e) =>
                    setGalleryForm((prev) => ({
                      ...prev,
                      departmentKey: e.target.value as CmsGalleryItem['departmentKey'],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="hifz">হিফযুল কুরআন (Hifz)</option>
                  <option value="qawmi">কওমি কিতাব (Qawmi)</option>
                  <option value="general">জেনারেল ক্যাডেট (General)</option>
                  <option value="residential">আবাসিক ছাত্রাবাস (Residential)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'প্রদর্শন ক্রম (Order)', 'Display Order', 'ترتيب العرض')}
                </label>
                <input
                  type="number"
                  min={1}
                  value={galleryForm.displayOrder}
                  onChange={(e) =>
                    setGalleryForm((prev) => ({
                      ...prev,
                      displayOrder: Number(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'শিরোনাম (বাংলা) *', 'Title (Bengali) *', 'العنوان (بالبنغالية) *')}
              </label>
              <input
                type="text"
                data-testid="cms-gallery-title-bn"
                value={galleryForm.titleBn}
                onChange={(e) => setGalleryForm((prev) => ({ ...prev, titleBn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'শিরোনাম (English)', 'Title (English)', 'العنوان (بالإنجليزية)')}
                </label>
                <input
                  type="text"
                  value={galleryForm.titleEn}
                  onChange={(e) => setGalleryForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {tr(language, 'শিরোনাম (العربية)', 'Title (Arabic)', 'العنوان (بالعربية)')}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={galleryForm.titleAr}
                  onChange={(e) => setGalleryForm((prev) => ({ ...prev, titleAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'সংক্ষিপ্ত ক্যাপশন / বিবরণ (বাংলা) *', 'Caption (Bengali) *', 'الوصف المختصر (بالبنغالية) *')}
              </label>
              <textarea
                rows={2}
                data-testid="cms-gallery-caption-bn"
                value={galleryForm.captionBn}
                onChange={(e) => setGalleryForm((prev) => ({ ...prev, captionBn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr(language, 'ছবি আপলোড (Storage) বা HTTPS ইমেজ URL', 'Image Upload or HTTPS URL', 'رفع صورة أو رابط مباشر')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={galleryForm.imageUrl}
                  onChange={(e) =>
                    setGalleryForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <label className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingGalleryImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingGalleryImage(true);
                      const res = await uploadCmsMediaAsset(file, file.name);
                      setIsUploadingGalleryImage(false);
                      if (res.ok && res.url) {
                        setGalleryForm((prev) => ({ ...prev, imageUrl: res.url || '' }));
                      } else {
                        setFeedbackBanner({
                          type: 'error',
                          message: res.errorBn || 'Upload failed',
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="cms-gallery-save-draft-btn"
                disabled={isSaving}
                onClick={() => handleSaveGalleryItem('draft')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{tr(language, 'খসড়া সংরক্ষণ (Draft)', 'Save as Draft', 'حفظ كمسودة')}</span>
              </button>

              <button
                type="button"
                data-testid="cms-gallery-publish-btn"
                disabled={isSaving}
                onClick={() => handleSaveGalleryItem('published')}
                className="flex-1 py-2 px-4 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{tr(language, 'গ্যালারিতে প্রকাশ করুন', 'Publish Item', 'نشر في المعرض')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              {tr(
                language,
                `ক্যাম্পাস গ্যালারি আইটেমসমূহ (${(cmsConfig.galleryItems || []).length})`,
                `Gallery Items (${(cmsConfig.galleryItems || []).length})`,
                `عناصر المعرض (${(cmsConfig.galleryItems || []).length})`
              )}
            </h2>

            <div className="space-y-3">
              {(cmsConfig.galleryItems || [])
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          #{item.displayOrder}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.status === 'published'
                            ? tr(language, 'প্রকাশিত', 'Published', 'منشور')
                            : tr(language, 'খসড়া', 'Draft', 'مسودة')}
                        </span>
                        <span className="text-xs font-semibold text-[#0A6847]">
                          {tr(language, item.categoryBn, item.categoryEn, item.categoryAr)}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {tr(language, item.titleBn, item.titleEn, item.titleAr)}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {tr(language, item.captionBn, item.captionEn, item.captionAr)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid={`cms-toggle-gallery-publish-${item.id}`}
                        disabled={isSaving}
                        onClick={() => handleToggleGalleryPublish(item)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                          item.status === 'published'
                            ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900'
                            : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {item.status === 'published' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{tr(language, 'আনপাবলিশ', 'Unpublish', 'إلغاء النشر')}</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tr(language, 'প্রকাশ', 'Publish', 'نشر')}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGalleryId(item.id);
                          setGalleryForm({
                            departmentKey: item.departmentKey,
                            categoryBn: item.categoryBn,
                            categoryEn: item.categoryEn,
                            categoryAr: item.categoryAr,
                            titleBn: item.titleBn,
                            titleEn: item.titleEn,
                            titleAr: item.titleAr,
                            captionBn: item.captionBn,
                            captionEn: item.captionEn,
                            captionAr: item.captionAr,
                            detailsBn: item.detailsBn,
                            detailsEn: item.detailsEn,
                            detailsAr: item.detailsAr,
                            imageUrl: item.imageUrl,
                            accentColor: item.accentColor,
                            displayOrder: item.displayOrder,
                            status: item.status,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGalleryId(item.id)}
                        className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: CONTACT & FOOTER EDITOR
         ===================================================================== */}
      {activeTab === 'contact' && (
        <div data-testid="cms-panel-contact" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {tr(
                  language,
                  'দাপ্তরিক যোগাযোগ, ঠিকানা ও ওয়েবসাইট ফুটার এডিটর',
                  'Verified Contact Information & Website Footer Editor',
                  'محرر معلومات التواصل الرسمية وتذييل الموقع'
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {tr(
                  language,
                  'এখানে প্রকাশিত তথ্য হোমপেজ, /contact পেজ এবং ওয়েবসাইটের ফুটারে তিন ভাষায় প্রদর্শিত হবে।',
                  'Published updates sync across the Homepage, /contact page, and shared PublicFooter.',
                  'تظهر التعديلات المنشورة في الصفحة الرئيسية وصفحة التواصل والتذييل المشترك.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রতিষ্ঠানের নাম (বাংলা) *
              </label>
              <input
                type="text"
                data-testid="cms-contact-name-bn"
                value={contactForm.institutionNameBn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, institutionNameBn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institution Name (English) *
              </label>
              <input
                type="text"
                value={contactForm.institutionNameEn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, institutionNameEn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المدرسة (العربية) *
              </label>
              <input
                type="text"
                dir="rtl"
                value={contactForm.institutionNameAr}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, institutionNameAr: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ক্যাম্পাস ঠিকানা (বাংলা) *
              </label>
              <input
                type="text"
                data-testid="cms-contact-address-bn"
                value={contactForm.addressBn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, addressBn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campus Address (English)
              </label>
              <input
                type="text"
                value={contactForm.addressEn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, addressEn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان المدرسة (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={contactForm.addressAr}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, addressAr: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                দাপ্তরিক ফোন (Phone) *
              </label>
              <input
                type="text"
                data-testid="cms-contact-phone"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                দাপ্তরিক ইমেইল (Email) *
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                গুগল ম্যাপ লিংক (Map URL)
              </label>
              <input
                type="text"
                value={contactForm.mapLink}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, mapLink: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                হোয়াটসঅ্যাপ নম্বর (WhatsApp Number)
              </label>
              <input
                type="text"
                data-testid="cms-contact-whatsapp"
                value={contactForm.whatsappNumber || ''}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                }
                placeholder="+880 19..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিশিয়াল ফেসবুক পেজ লিংক (Official Facebook URL)
              </label>
              <input
                type="url"
                data-testid="cms-contact-facebook"
                value={contactForm.facebookUrl || ''}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, facebookUrl: e.target.value }))
                }
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিস সময়সূচি (বাংলা)
              </label>
              <input
                type="text"
                value={contactForm.officeHoursBn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, officeHoursBn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Office Hours (English)
              </label>
              <input
                type="text"
                value={contactForm.officeHoursEn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, officeHoursEn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ساعات الدوام (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={contactForm.officeHoursAr}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, officeHoursAr: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ফুটার বর্ণনা (বাংলা)
              </label>
              <textarea
                rows={2}
                value={contactForm.footerDescriptionBn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, footerDescriptionBn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Footer Description (English)
              </label>
              <textarea
                rows={2}
                value={contactForm.footerDescriptionEn}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, footerDescriptionEn: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                وصف التذييل (العربية)
              </label>
              <textarea
                rows={2}
                dir="rtl"
                value={contactForm.footerDescriptionAr}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, footerDescriptionAr: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveContactFooter('draft')}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{tr(language, 'খসড়া সংরক্ষণ', 'Save as Draft', 'حفظ كمسودة')}</span>
            </button>

            <button
              type="button"
              data-testid="cms-contact-publish-trigger"
              onClick={() => setShowContactConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-[#063B27] hover:bg-emerald-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {tr(
                  language,
                  'প্রিভিউ ও পাবলিক প্রকাশ করুন',
                  'Preview & Publish Contact Info',
                  'معاينة ونشر بيانات التواصل'
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS: PREVIEW & DELETE CONFIRMATIONS
         ===================================================================== */}
      {showHomepagePreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="cms-homepage-preview-modal"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full bg-[#050E1D] text-white border border-[#D4AF37]/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-xs font-bold text-[#F3D87D]">
                {tr(
                  language,
                  'হোমপেজ সেকশন প্রিভিউ (প্রকাশের পূর্বে যাচাই)',
                  'Homepage Section Preview (Before Publication)',
                  'معاينة قسم الصفحة الرئيسية قبل النشر'
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowHomepagePreviewModal(false)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#08162B] border border-white/10 space-y-1">
                <div className="text-[#D4AF37] font-semibold">{homepageDraftForm.badgeBn}</div>
                <div className="text-base font-bold text-white">{homepageDraftForm.titleBn}</div>
                <p className="text-slate-300">{homepageDraftForm.descriptionBn}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#08162B] border border-white/10 space-y-1">
                <div className="text-[#D4AF37] font-semibold">{homepageDraftForm.badgeEn}</div>
                <div className="text-base font-bold text-white">{homepageDraftForm.titleEn}</div>
                <p className="text-slate-300">{homepageDraftForm.descriptionEn}</p>
              </div>
              <div
                dir="rtl"
                className="p-3.5 rounded-xl bg-[#08162B] border border-white/10 space-y-1"
              >
                <div className="text-[#D4AF37] font-semibold">{homepageDraftForm.badgeAr}</div>
                <div className="text-base font-bold text-white">{homepageDraftForm.titleAr}</div>
                <p className="text-slate-300">{homepageDraftForm.descriptionAr}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowHomepagePreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                {tr(language, 'বন্ধ করুন', 'Close', 'إغلاق')}
              </button>
              <button
                type="button"
                onClick={() => handleSaveHomepageSection('published')}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050E1D] text-xs font-bold cursor-pointer"
              >
                {tr(language, 'নিশ্চিত প্রকাশ করুন', 'Confirm & Publish', 'تأكيد النشر')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPagePreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="cms-page-preview-modal"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full bg-[#050E1D] text-white border border-[#D4AF37]/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-xs font-bold text-[#F3D87D]">
                {selectedPageSlug} — {tr(language, 'পেজ প্রিভিউ', 'Page Preview', 'معاينة الصفحة')}
              </div>
              <button
                type="button"
                onClick={() => setShowPagePreviewModal(false)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#08162B] border border-white/10 space-y-1">
                <div className="text-base font-bold text-white">{pageDraftForm.titleBn}</div>
                <p className="text-slate-300">{pageDraftForm.summaryBn}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#08162B] border border-white/10 space-y-1">
                <div className="text-base font-bold text-white">{pageDraftForm.titleEn}</div>
                <p className="text-slate-300">{pageDraftForm.summaryEn}</p>
              </div>
              <div
                dir="rtl"
                className="p-3.5 rounded-xl bg-[#08162B] border border-white/10 space-y-1"
              >
                <div className="text-base font-bold text-white">{pageDraftForm.titleAr}</div>
                <p className="text-slate-300">{pageDraftForm.summaryAr}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPagePreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                {tr(language, 'বন্ধ করুন', 'Close', 'إغلاق')}
              </button>
              <button
                type="button"
                onClick={() => handleSaveInstitutionalPage('published')}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050E1D] text-xs font-bold cursor-pointer"
              >
                {tr(language, 'নিশ্চিত প্রকাশ করুন', 'Confirm & Publish', 'تأكيد النشر')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoticePreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="cms-notice-preview-modal"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="max-w-xl w-full bg-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-sm font-bold text-slate-900">
                {tr(language, 'পাবলিক নোটিশ প্রিভিউ', 'Public Notice Preview', 'معاينة الإعلان العام')}
              </div>
              <button
                type="button"
                onClick={() => setShowNoticePreviewModal(false)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="font-mono text-slate-500">
                {noticeForm.publishDate} · {noticeForm.targetClass}
              </div>
              <h3 className="text-base font-bold text-slate-900">{noticeForm.titleBn}</h3>
              <p className="text-slate-700 leading-relaxed">{noticeForm.contentBn}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNoticePreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
              >
                {tr(language, 'বন্ধ করুন', 'Close', 'إغلاق')}
              </button>
              <button
                type="button"
                onClick={() => handleSaveCmsNotice('published')}
                className="px-4 py-2 rounded-xl bg-[#063B27] text-white text-xs font-bold cursor-pointer"
              >
                {tr(language, 'প্রকাশ করুন', 'Publish Now', 'نشر الآن')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="cms-contact-confirm-modal"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="max-w-lg w-full bg-white rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {tr(
                language,
                'যোগাযোগ ও ফুটার তথ্য প্রকাশনা নিশ্চিতকরণ',
                'Confirm Contact & Footer Publication',
                'تأكيد نشر معلومات التواصل والتذييل'
              )}
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{contactForm.institutionNameBn}</div>
              <div>{contactForm.addressBn}</div>
              <div className="font-mono">
                {contactForm.phone} · {contactForm.email}
              </div>
              <div className="text-slate-600">{contactForm.officeHoursBn}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowContactConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                {tr(language, 'বাতিল', 'Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                data-testid="cms-contact-confirm-publish-btn"
                onClick={() => handleSaveContactFooter('published')}
                className="px-4 py-2 rounded-xl bg-[#063B27] text-white text-xs font-bold cursor-pointer"
              >
                {tr(language, 'নিশ্চিত প্রকাশ করুন', 'Confirm & Publish', 'تأكيد النشر')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {(confirmDeleteProfileId ||
        confirmDeleteNoticeId ||
        confirmDeleteEventId ||
        confirmDeleteGalleryId) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                {tr(language, 'মুছে ফেলার নিশ্চিতকরণ', 'Confirm Deletion', 'تأكيد الحذف')}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {tr(
                language,
                'আপনি কি নিশ্চিত যে এই আইটেমটি মুছে ফেলতে চান? মুছে ফেলার পর এটি আর পাবলিক ওয়েবসাইটে প্রদর্শিত হবে না।',
                'Are you sure you want to delete this item? Once deleted, it will be removed from the public website.',
                'هل أنت متأكد من حذف هذا العنصر نهائياً؟'
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteProfileId(null);
                  setConfirmDeleteNoticeId(null);
                  setConfirmDeleteEventId(null);
                  setConfirmDeleteGalleryId(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
              >
                {tr(language, 'বাতিল', 'Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmDeleteProfileId) {
                    await handleConfirmDeleteProfile(confirmDeleteProfileId);
                  } else if (confirmDeleteNoticeId) {
                    const isDraftNotice = (cmsConfig.draftNotices || []).some(
                      (d) => d.id === confirmDeleteNoticeId
                    );
                    if (isDraftNotice) {
                      const nextDrafts = (cmsConfig.draftNotices || []).filter(
                        (d) => d.id !== confirmDeleteNoticeId
                      );
                      await onSaveCmsConfig(
                        { ...cmsConfig, draftNotices: nextDrafts },
                        'খসড়া নোটিশটি মুছে ফেলা হয়েছে।'
                      );
                    } else {
                      await onDeleteNotice(confirmDeleteNoticeId);
                    }
                    setConfirmDeleteNoticeId(null);
                  } else if (confirmDeleteEventId) {
                    const nextEvents = (cmsConfig.events || []).filter(
                      (ev) => ev.id !== confirmDeleteEventId
                    );
                    await onSaveCmsConfig(
                      { ...cmsConfig, events: nextEvents },
                      'ইভেন্টটি মুছে ফেলা হয়েছে।'
                    );
                    setConfirmDeleteEventId(null);
                  } else if (confirmDeleteGalleryId) {
                    const nextGallery = (cmsConfig.galleryItems || []).filter(
                      (g) => g.id !== confirmDeleteGalleryId
                    );
                    await onSaveCmsConfig(
                      { ...cmsConfig, galleryItems: nextGallery },
                      'গ্যালারি আইটেমটি মুছে ফেলা হয়েছে।'
                    );
                    setConfirmDeleteGalleryId(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                {tr(language, 'নিশ্চিত মুছে ফেলুন', 'Confirm Delete', 'تأكيد الحذف')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
