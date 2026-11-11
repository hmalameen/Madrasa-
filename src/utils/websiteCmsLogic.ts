import type {
  BannerSlide,
  CmsContactFooterConfig,
  CmsDraftNotice,
  CmsGalleryItem,
  CmsHomepageSectionConfig,
  CmsInstitutionalPageContent,
  CmsNoticeMetadata,
  CmsPublicEvent,
  CmsPublicPageSlug,
  CmsPublicProfile,
  HomepageSectionId,
  InstitutionSettings,
  Language,
  Notice,
  UserRole,
  WebsiteCmsConfig,
} from '../types/madrasa';

export const CMS_SETTINGS_DOC_ID = 'website-cms-config';
export const WEBSITE_CMS_SETTINGS_DOC_ID = CMS_SETTINGS_DOC_ID;
export const PUBLIC_CMS_SETTINGS_DOC_ID = 'website-cms-public';
export const PUBLIC_WEBSITE_CMS_SETTINGS_DOC_ID = PUBLIC_CMS_SETTINGS_DOC_ID;
export const CMS_LOCAL_CACHE_KEY = 'uqcm_published_cms_cache_v1';

export interface PublicPublishedCmsSnapshot {
  version: 1;
  id: string;
  homepageSections: Record<HomepageSectionId, CmsHomepageSectionConfig>;
  pages: Record<CmsPublicPageSlug, CmsInstitutionalPageContent>;
  publicProfiles: CmsPublicProfile[];
  events: CmsPublicEvent[];
  galleryItems: CmsGalleryItem[];
  contactFooter: CmsContactFooterConfig;
  publishedNotices: Notice[];
  publishedAt: string;
}

export function canManageWebsiteCms(role: UserRole): boolean {
  return role === 'super_admin' || role === 'muhtamim';
}

export const INITIAL_HOMEPAGE_SECTIONS: Record<HomepageSectionId, CmsHomepageSectionConfig> = {
  hero: {
    id: 'hero',
    visible: true,
    status: 'published',
    badgeBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা · ঢাকা, বাংলাদেশ',
    badgeEn: 'Ummul Quran Cadet Madrasa · Dhaka, Bangladesh',
    badgeAr: 'مدرسة أم القرآن كاديت الإسلامية · دكا، بنغلاديش',
    titleBn: 'কুরআনের নূর, সুন্নাহর আদব ও আধুনিক ক্যাডেট শিক্ষার সমন্বিত দ্বীনি শিক্ষাপ্রতিষ্ঠান',
    titleEn: 'Illuminated by the Noble Quran, Grounded in Sunnah & Integrated Cadet Excellence',
    titleAr: 'منارة قرآنية تجمع بين علوم الشريعة والتربية النبوية والتعليم الأكاديمي المتكامل',
    subtitleBn: 'হিফযুল কুরআন, কওমি কিতাব ও জেনারেল ক্যাডেট বিভাগ',
    subtitleEn: 'Hifz-ul-Quran, Qawmi Kitab & General Cadet Divisions',
    subtitleAr: 'أقسام تحفيظ القرآن الكريم، الكتب الشرعية، والتعليم العام الكاديت',
    descriptionBn:
      'তাজবীদভিত্তিক হিফযুল কুরআন, বেফাকুল মাদারিসিল আরাবিয়া কওমি নেসাব এবং জাতীয় শিক্ষাক্রমের বাংলা, ইংরেজি, গণিত ও বিজ্ঞানের সুশৃঙ্খল আবাসিক ও অনাবাসিক শিক্ষা ব্যবস্থাপনা।',
    descriptionEn:
      'A disciplined residential and day-scholar institution uniting Tajweed-compliant Hifz-ul-Quran, classical Qawmi scholarship, and essential modern academic subjects.',
    descriptionAr:
      'مؤسسة تعليمية وتربوية متكاملة للبنين تعنى بتحفيظ القرآن الكريم بالتجويد وتدريس المتون الشرعية والعلوم الحديثة.',
    primaryCtaBn: 'অনলাইন ভর্তি আবেদন',
    primaryCtaEn: 'Apply for Admission',
    primaryCtaAr: 'التقديم للقبول الإلكتروني',
    secondaryCtaBn: 'পোর্টাল লগইন',
    secondaryCtaEn: 'Portal Login',
    secondaryCtaAr: 'تسجيل الدخول للبوابة',
    mediaNoteBn: 'রেহালের ওপর উন্মুক্ত কুরআন ও উর্ধ্বমুখী সোনালি নূর থ্রিডি দৃশ্য সক্রিয়',
    mediaNoteEn: '3D Open Quran on carved wooden Rehal with rising golden Noor active',
    mediaNoteAr: 'مشهد ثلاثي الأبعاد للمصحف المفتوح على الرحل الخشبي مع النور الذهبي الصاعد',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  intro: {
    id: 'intro',
    visible: true,
    status: 'published',
    badgeBn: '০১ · প্রাতিষ্ঠানিক পরিচিতি ও লক্ষ্য',
    badgeEn: '01 · Institutional Identity & Mission',
    badgeAr: '٠١ · الهوية المؤسسية والرسالة التعليمية',
    titleBn: 'ইলমে ওহীর আলোকে আমলদার আলেম, হাফেজে কুরআন ও যোগ্য নাগরিক গড়ার প্রত্যয়',
    titleEn: 'Nurturing Huffaz, Classical Scholars, and Principled Citizens under Verified Supervision',
    titleAr: 'إعداد حفاظ متقنين وعلماء عاملين وطلاب متميزين خلقاً وعلماً',
    subtitleBn: 'সমন্বিত দ্বীনি ও আধুনিক শিক্ষা কাঠামো',
    subtitleEn: 'Integrated Islamic & Academic Architecture',
    subtitleAr: 'منظومة تعليمية تجمع بين الأصالة والمعاصرة',
    descriptionBn:
      'উম্মুল কুরআন ক্যাডেট মাদ্রাসায় প্রতিটি শিক্ষার্থীর দৈনিক তিলাওয়াত, সবক-সবকি-আমুখতা, কিতাব অধ্যয়ন, জামাতে নামাজ এবং জেনারেল শিক্ষার অগ্রগতি নিবিড়ভাবে তত্ত্বাবধান করা হয়।',
    descriptionEn:
      'Every student’s daily Quran recitation, classical Kitab studies, congregational prayers, and general academic progress are mentored under structured supervision.',
    descriptionAr:
      'تتم متابعة التلاوة اليومية ودراسة الكتب الشرعية والصلوات الجماعية والتحصيل الدراسي لكل طالب بعناية فائقة.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  departments: {
    id: 'departments',
    visible: true,
    status: 'published',
    badgeBn: '০২ · একাডেমিক বিভাগসমূহ',
    badgeEn: '02 · Academic Departments',
    badgeAr: '٠٢ · الأقسام الأكاديمية المعتمدة',
    titleBn: 'তিনটি সমন্বিত একাডেমিক বিভাগ ও সুনির্দিষ্ট পাঠ্যক্রম',
    titleEn: 'Three Integrated Academic Divisions & Structured Curricula',
    titleAr: 'ثلاثة أقسام أكاديمية متكاملة بمناهج دراسية معتمدة',
    subtitleBn: 'হিফযুল কুরআন · কওমি কিতাব · জেনারেল ক্যাডেট',
    subtitleEn: 'Hifzul Quran · Qawmi Kitab · General Cadet',
    subtitleAr: 'تحفيظ القرآن · الكتب القومية · التعليم العام الكاديت',
    descriptionBn:
      'শিক্ষার্থীর বয়স, মেধা ও তিলাওয়াত যাচাইয়ের মাধ্যমে উপযুক্ত বিভাগে ভর্তি এবং ধারাবাহিক মূল্যায়ন।',
    descriptionEn:
      'Placement by recitation assessment and academic readiness across Hifz, Qawmi, and General Cadet tracks.',
    descriptionAr:
      'قبول الطلاب وتوزيعهم حسب التقييم الأكاديمي ومستوى التلاوة في الأقسام الثلاثة.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  why_choose_us: {
    id: 'why_choose_us',
    visible: true,
    status: 'published',
    badgeBn: '০৩ · কেন উম্মুল কুরআন ক্যাডেট মাদ্রাসা?',
    badgeEn: '03 · Why Choose Ummul Quran Cadet Madrasa',
    badgeAr: '٠٣ · لماذا مدرسة أم القرآن كاديت؟',
    titleBn: 'সুন্নাহভিত্তিক তারবিয়াত, স্বচ্ছ মূল্যায়ন ও নিরাপদ আবাসিক ব্যবস্থাপনা',
    titleEn: 'Prophetic Tarbiyah, Transparent Evaluation & Supervised Residential Care',
    titleAr: 'تربية إيمانية على منهج السلف وإشراف أكاديمي وسكني متكامل',
    subtitleBn: 'প্রাতিষ্ঠানিক বৈশিষ্ট্য ও অভিভাবক সংযোগ',
    subtitleEn: 'Institutional Pillars & Guardian Connectivity',
    subtitleAr: 'الركائز المؤسسية والتواصل المستمر مع أولياء الأمور',
    descriptionBn:
      'দৈনিক হাজিরা, হিফয সবক লগ, স্টাডি ডায়েরি, পরীক্ষার ফলাফল এবং আবাসিক ছুটির তথ্য যাচাইকৃত অভিভাবক পোর্টালে সরাসরি দেখার সুবিধা।',
    descriptionEn:
      'Direct access to daily attendance, Hifz Sabaq logs, Study Diaries, exam mark sheets, and residential leave records via the verified Guardian Portal.',
    descriptionAr:
      'متابعة الحضور اليومي وسجل الحفظ والمذكرة الدراسية ونتائج الاختبارات وإجازات السكن عبر بوابة ولي الأمر المعتمدة.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  muhtamim_message: {
    id: 'muhtamim_message',
    visible: true,
    status: 'published',
    badgeBn: '০৪ · মুহতামিম দপ্তরের বার্তা',
    badgeEn: '04 · Message from the Office of the Muhtamim',
    badgeAr: '٠٤ · كلمة مكتب المهتمم (مدير المدرسة)',
    titleBn: 'ইলম, আমল ও আখলাকের সমন্বয়ে আদর্শ প্রজন্ম গঠনের অঙ্গীকার',
    titleEn: 'Our Commitment to Sacred Knowledge, Righteous Action & Disciplined Character',
    titleAr: 'التزامنا بالجمع بين العلم الشرعي والعمل الصالح والأخلاق الفاضلة',
    subtitleBn: 'সার্বিক একাডেমিক ও প্রশাসনিক তত্ত্বাবধান',
    subtitleEn: 'Central Academic & Administrative Stewardship',
    subtitleAr: 'الإشراف الأكاديمي والإداري العام',
    descriptionBn:
      'প্রতিটি ভর্তি আবেদন যাচাই, অফিশিয়াল স্টুডেন্ট আইডি প্রদান, পরীক্ষার ফলাফল চূড়ান্ত অনুমোদন এবং প্রাতিষ্ঠানিক শৃঙ্খলা মুহতামিম দপ্তরের প্রত্যক্ষ তত্ত্বাবধানে পরিচালিত হয়।',
    descriptionEn:
      'Every admission approval, official Student ID issuance, and final examination result publication is directly supervised by the Office of the Muhtamim.',
    descriptionAr:
      'تخضع جميع إجراءات اعتماد القبول وإصدار أرقام الطلاب الرسمية ونشر النتائج للإشراف المباشر من مكتب المهتمم.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  teachers_admin: {
    id: 'teachers_admin',
    visible: true,
    status: 'published',
    badgeBn: '০৫ · প্রশাসন ও বিভাগীয় উস্তায কাঠামো',
    badgeEn: '05 · Administration & Departmental Faculty Structure',
    badgeAr: '٠٥ · الهيكل الإداري وهيئة التدريس',
    titleBn: 'অভিজ্ঞ মুদাররিস, হাফেজ-ক্বারী ও জেনারেল শিক্ষকদের সমন্বিত তত্ত্বাবধান',
    titleEn: 'Supervised by Qualified Mudarrisin, Huffaz & Subject Educators',
    titleAr: 'إشراف نخبة من المدرسين والحفاظ ومعلمي المواد العامة',
    subtitleBn: 'যাচাইকৃত বিভাগীয় দায়িত্ব বণ্টন',
    subtitleEn: 'Verified Departmental Stewardship',
    subtitleAr: 'توزيع المسؤوليات التعليمية والإدارية',
    descriptionBn:
      'মাদ্রাসার অভ্যন্তরীণ শিক্ষক ও স্টাফদের ব্যক্তিগত ফোন ও বেতন তথ্য গোপন রেখে কেবলমাত্র অনুমোদিত পাবলিক প্রোফাইল ও বিভাগীয় কাঠামো প্রদর্শিত হয়।',
    descriptionEn:
      'Only explicitly approved public faculty profiles and departmental structures are displayed, keeping private staff phones and payroll data protected.',
    descriptionAr:
      'تُعرض فقط الملفات التعريفية المعتمدة للنشر العام مع الحفاظ التام على خصوصية بيانات الموظفين.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  admission_highlights: {
    id: 'admission_highlights',
    visible: true,
    status: 'published',
    badgeBn: '০৬ · অনলাইন ভর্তি তথ্য ও আবেদন প্রক্রিয়া',
    badgeEn: '06 · Online Admission & Application Process',
    badgeAr: '٠٦ · معلومات القبول والتسجيل الإلكتروني',
    titleBn: '৪-ধাপের অনলাইন ভর্তি আবেদন ও মুহতামিম অনুমোদন কর্মপ্রবাহ',
    titleEn: '4-Step Online Admission Application & Muhtamim Approval Workflow',
    titleAr: 'نظام التقديم الإلكتروني من ٤ خطوات واعتماد القبول الرسمي',
    subtitleBn: 'লগইন ছাড়াই নতুন আবেদন ও রেফারেন্স ট্র্যাকিং',
    subtitleEn: 'Public Application Submission & Reference Tracking',
    subtitleAr: 'تقديم الطلبات ومتابعة حالتها بالرقم المرجعي دون تسجيل دخول',
    descriptionBn:
      'অনলাইনে আবেদন জমার পর মুহতামিম অনুমোদন সম্পন্ন হলে স্বয়ংক্রিয়ভাবে স্টুডেন্ট আইডি এবং অভিভাবক যাচাইকরণ লিংক/OTP প্রদান করা হয়।',
    descriptionEn:
      'Upon Muhtamim approval of an online application, an official Student ID and Guardian verification link/OTP are securely provisioned.',
    descriptionAr:
      'بعد اعتماد طلب القبول من المهتمم، يتم إصدار رقم الطالب الرسمي وتفعيل حساب ولي الأمر بأمان.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  notices_preview: {
    id: 'notices_preview',
    visible: true,
    status: 'published',
    badgeBn: '০৭ · পাবলিক নোটিশ বোর্ড',
    badgeEn: '07 · Official Public Notice Board',
    badgeAr: '٠٧ · لوحة الإعلانات الرسمية',
    titleBn: 'প্রাতিষ্ঠানিক বিজ্ঞপ্তি, পরীক্ষা ও ছুটির দাপ্তরিক ঘোষণা',
    titleEn: 'Official Circulars, Examination Schedules & Institutional Announcements',
    titleAr: 'التعاميم الرسمية ومواعيد الاختبارات والإعلانات الإدارية',
    subtitleBn: 'কেবলমাত্র সর্বসাধারণের জন্য প্রকাশিত নোটিশ',
    subtitleEn: 'Verified Public Circulars Only',
    subtitleAr: 'الإعلانات المعتمدة للنشر العام فقط',
    descriptionBn:
      'মাদ্রাসা দপ্তর থেকে প্রকাশিত সর্বজনীন নোটিশসমূহ এখানে প্রদর্শিত হয়। খসড়া বা অভ্যন্তরীণ নোটিশ পাবলিক ওয়েবসাইটে প্রদর্শিত হয় না।',
    descriptionEn:
      'Only published public notices approved for general viewing appear here. Draft and internal notices remain private.',
    descriptionAr:
      'تُعرض هنا الإعلانات العامة المنشورة فقط، بينما تظل المسودات والتعاميم الداخلية خاصة بالبوابة.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  events_news: {
    id: 'events_news',
    visible: true,
    status: 'published',
    badgeBn: '০৮ · সংবাদ ও প্রাতিষ্ঠানিক অনুষ্ঠানসূচি',
    badgeEn: '08 · News & Institutional Events',
    badgeAr: '٠٨ · الأخبار والفعاليات المؤسسية',
    titleBn: 'দস্তারবন্দী সম্মেলন, হিফয প্রতিযোগিতা ও একাডেমিক কার্যক্রম',
    titleEn: 'Dastarbandi Convocation, Hifz Competitions & Campus Milestones',
    titleAr: 'حفل تكريم الحفاظ والمسابقات القرآنية والأنشطة الأكاديمية',
    subtitleBn: 'প্রকাশিত প্রাতিষ্ঠানিক ইভেন্ট ও সংবাদ',
    subtitleEn: 'Published Institutional Events & Updates',
    subtitleAr: 'الفعاليات والأخبار المعتمدة للنشر',
    descriptionBn:
      'মাদ্রাসার বার্ষিক দস্তারবন্দী মাহফিল, কিরাআত প্রতিযোগিতা এবং একাডেমিক সেমিনারের যাচাইকৃত তথ্য।',
    descriptionEn:
      'Verified updates on annual Dastarbandi convocations, Qira’at competitions, and academic seminars.',
    descriptionAr:
      'تحديثات معتمدة حول حفلات تكريم الحفاظ والمسابقات القرآنية والندوات العلمية.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  results_achievements: {
    id: 'results_achievements',
    visible: true,
    status: 'published',
    badgeBn: '০৯ · পরীক্ষা, মূল্যায়ন ও ফলাফল পদ্ধতি',
    badgeEn: '09 · Academic Evaluation & Results',
    badgeAr: '٠٩ · نظام الامتحانات والنتائج',
    titleBn: 'বেফাক ও মাদ্রাসা বোর্ড মানদণ্ডে স্বচ্ছ ফলাফল ও মেধা মূল্যায়ন',
    titleEn: 'Structured Examination Grading & Verified Result Publication',
    titleAr: 'تقييم أكاديمي دقيق ونتائج معتمدة للطلاب',
    subtitleBn: 'অনুমোদিত গ্রেডিং ও মার্কশিট প্রকাশনা',
    subtitleEn: 'Approved Grading Policy & Mark Sheet Publication',
    subtitleAr: 'سياسة التقديرات المعتمدة ونشر كشوف الدرجات',
    descriptionBn:
      'মুহতামিম কর্তৃক ফলাফল চূড়ান্ত অনুমোদনের পর শিক্ষার্থী ও অভিভাবক পোর্টালে মার্কশিট উন্মুক্ত হয়।',
    descriptionEn:
      'Published mark sheets become securely accessible in the Student and Guardian Portals after final Muhtamim approval.',
    descriptionAr:
      'تُتاح كشوف الدرجات في بوابة الطالب وولي الأمر فور اعتمادها النهائي من المهتمم.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  gallery_preview: {
    id: 'gallery_preview',
    visible: true,
    status: 'published',
    badgeBn: '১০ · ক্যাম্পাস ও একাডেমিক পরিবেশ গ্যালারি',
    badgeEn: '10 · Campus & Academic Environment Gallery',
    badgeAr: '١٠ · معرض الحرم المدرسي والبيئة التعليمية',
    titleBn: 'দরসগাহ, হিফয হালকা ও দারুল ইকামাহর সুশৃঙ্খল পরিবেশ',
    titleEn: 'Glimpses of Our Study Halls, Hifz Circles & Residential Darul Iqamah',
    titleAr: 'لمحات من قاعات الدراسة وحلقات التحفيظ والسكن الداخلي',
    subtitleBn: 'প্রকাশিত ক্যাম্পাস গ্যালারি',
    subtitleEn: 'Published Campus Gallery',
    subtitleAr: 'صور ومشاهد الحرم المدرسي المعتمدة',
    descriptionBn:
      'হিফযুল কুরআন, কওমি কিতাব, জেনারেল ক্যাডেট শ্রেণিকক্ষ ও আবাসিক ছাত্রাবাসের অনুমোদিত গ্যালারি।',
    descriptionEn:
      'Approved visual cards and photographs showcasing our Hifz, Qawmi, General Cadet, and residential facilities.',
    descriptionAr:
      'بطاقات وصور معتمدة توضح بيئة الدراسة والتحفيظ والسكن الداخلي بالمدرسة.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  contact_footer: {
    id: 'contact_footer',
    visible: true,
    status: 'published',
    badgeBn: '১১ · যোগাযোগ ও অবস্থান',
    badgeEn: '11 · Contact & Campus Location',
    badgeAr: '١١ · التواصل وموقع المدرسة',
    titleBn: 'সরাসরি মাদ্রাসা দপ্তরে যোগাযোগ ও অনলাইন পোর্টাল গেটওয়ে',
    titleEn: 'Direct Office Contact & Online Portal Gateway',
    titleAr: 'التواصل المباشر مع مكتب المدرسة وبوابات الدخول',
    subtitleBn: 'উত্তরা, ঢাকা ক্যাম্পাস',
    subtitleEn: 'Uttara, Dhaka Campus',
    subtitleAr: 'حرم أوتارا، دكا',
    descriptionBn:
      'ভর্তি পরামর্শ, আবাসিক আসন তথ্য কিংবা দাপ্তরিক যোগাযোগের জন্য নির্ধারিত অফিস সময়ে যোগাযোগ করুন।',
    descriptionEn:
      'Reach our administrative office during official hours for admission counseling and residential inquiries.',
    descriptionAr:
      'تواصل مع مكتب الإدارة خلال أوقات الدوام الرسمي للاستفسار عن القبول والسكن الداخلي.',
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
};

export const INITIAL_CMS_PAGES: Record<CmsPublicPageSlug, CmsInstitutionalPageContent> = {
  '/about': {
    slug: '/about',
    status: 'published',
    badgeBn: 'প্রতিষ্ঠান পরিচিতি · About the Madrasa',
    badgeEn: 'Institutional Profile · About the Madrasa',
    badgeAr: 'نبذة عن المدرسة · الهوية والرسالة',
    titleBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা: কুরআন ও সুন্নাহর আলোকে সমন্বিত দ্বীনি শিক্ষাপ্রতিষ্ঠান',
    titleEn: 'Ummul Quran Cadet Madrasa: Integrated Quranic, Classical & General Education',
    titleAr: 'مدرسة أم القرآن كاديت الإسلامية: تعليم متكامل يجمع بين القرآن والسنة والعلوم الحديثة',
    subtitleBn: 'উত্তরা, ঢাকায় অবস্থিত সুশৃঙ্খল আবাসিক ও অনাবাসিক বালক মাদ্রাসা',
    subtitleEn: 'A disciplined residential and day-scholar boys institution in Uttara, Dhaka',
    subtitleAr: 'مؤسسة تعليمية وتربوية للبنين (داخلي ونهاري) في أوتارا، دكا',
    summaryBn:
      'উম্মুল কুরআন ক্যাডেট মাদ্রাসা বিশুদ্ধ তাজবীদসহ হিফযুল কুরআন, বেফাকুল মাদারিসিল আরাবিয়া কওমি নেসাব এবং জাতীয় শিক্ষাক্রমের বাংলা, ইংরেজি, গণিত ও বিজ্ঞানের সমন্বয়ে একটি আদর্শ শিক্ষা পরিবেশ পরিচালনা করে।',
    summaryEn:
      'Ummul Quran Cadet Madrasa provides an integrated curriculum combining Tajweed-based Hifz-ul-Quran, Befaq Qawmi Dars-e-Nizami studies, and essential NCTB general subjects.',
    summaryAr:
      'تقدم مدرسة أم القرآن كاديت الإسلامية منهجاً متكاملاً يجمع بين تحفيظ القرآن الكريم بالتجويد ودراسة العلوم الشرعية والمواد الأكاديمية الأساسية.',
    highlightsBn: [
      'তাজবীদ ও মাখরাজ অনুসরণে দৈনিক সবক, সবকি ও আমুখতা শ্রবণ',
      'কওমি কিতাব ও আধুনিক জেনারেল শিক্ষার সুষম সমন্বয়',
      'নিরাপদ দারুল ইকামাহ (আবাসিক ছাত্রাবাস) ও যাচাইকৃত অভিভাবক পোর্টাল',
    ],
    highlightsEn: [
      'Daily Sabaq, Sabqi, and Manzil recitation with strict Tajweed supervision',
      'Balanced integration of Qawmi Kitab scholarship and modern general subjects',
      'Supervised Darul Iqamah dormitory and verified Guardian Portal access',
    ],
    highlightsAr: [
      'تسميع يومي للسبق والسبقي والمنزل مع تصحيح التجويد ومخارج الحروف',
      'تكامل متوازن بين دراسة المتون الشرعية والمواد التعليمية العامة',
      'إشراف تربوي في السكن الداخلي وتواصل مستمر عبر بوابة ولي الأمر',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/academic': {
    slug: '/academic',
    status: 'published',
    badgeBn: 'একাডেমিক সিস্টেম · Academic System',
    badgeEn: 'Academic Architecture · Evaluation & Routine',
    badgeAr: 'النظام الأكاديمي · المناهج والتقييم',
    titleBn: 'দৈনিক তারবিয়াত রুটিন, পাঠদান পদ্ধতি ও বেফাক মানদণ্ডে পরীক্ষা মূল্যায়ন',
    titleEn: 'Daily Tarbiyah Schedule, Pedagogy & Befaq-Standard Examination System',
    titleAr: 'البرنامج اليومي المتكامل ونظام الدراسة والاختبارات الفصلية والسنوية',
    subtitleBn: 'ফজর থেকে এশা পর্যন্ত সুশৃঙ্খল আবাসিক ও একাডেমিক সময়সূচি',
    subtitleEn: 'Structured daily schedule from Fajr to Isha with continuous academic tracking',
    subtitleAr: 'جدول يومي منظم من الفجر حتى العشاء مع متابعة أكاديمية دقيقة',
    summaryBn:
      'প্রতিটি জামাতের পাঠপরিকল্পনা, দৈনিক স্টাডি ডায়েরি এবং সাময়িক ও বার্ষিক পরীক্ষার ফলাফল মুহতামিম দপ্তরের অনুমোদনক্রমে পরিচালিত হয়।',
    summaryEn:
      'Class syllabi, daily study diaries, and term examination results are managed under formal Muhtamim review and approval.',
    summaryAr:
      'تُدار الخطط الدراسية والمذكرات اليومية ونتائج الاختبارات تحت إشراف واعتماد مكتب المهتمم.',
    highlightsBn: [
      'মুমতায (80%+), জায়্যিদ জিদ্দান (70-79%), জায়্যিদ (60-69%) গ্রেডিং নীতিমালা',
      'দৈনিক ক্লাসওয়ার্ক ও হোমওয়ার্ক স্টাডি ডায়েরিতে সংরক্ষণ',
      'মুহতামিম অনুমোদিত অফিশিয়াল মার্কশিট ও ট্যাবুলেশন শিট',
    ],
    highlightsEn: [
      'Mumtaz (80%+), Jayyid Jiddan (70-79%), Jayyid (60-69%) grading scale',
      'Daily classwork and homework logged in the digital Study Diary',
      'Muhtamim-approved official mark sheets and tabulation records',
    ],
    highlightsAr: [
      'نظام تقديرات معتمد: ممتاز (٨٠٪ فأكثر)، جيد جداً، جيد، مقبول',
      'توثيق الواجبات والدروس اليومية في المذكرة الدراسية الإلكترونية',
      'كشوف درجات رسمية معتمدة من مدير المدرسة (المهتمم)',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/departments': {
    slug: '/departments',
    status: 'published',
    badgeBn: 'একাডেমিক বিভাগসমূহ · Academic Departments',
    badgeEn: 'Academic Divisions · Hifz, Qawmi & Cadet',
    badgeAr: 'الأقسام الأكاديمية · التحفيظ والشرعي والعام',
    titleBn: 'হিফযুল কুরআন, কওমি কিতাব ও জেনারেল ক্যাডেট বিভাগসমূহের পাঠ্যক্রম',
    titleEn: 'Curricula of the Hifz-ul-Quran, Qawmi Kitab & General Cadet Divisions',
    titleAr: 'تفاصيل المناهج الدراسية لأقسام تحفيظ القرآن والعلوم الشرعية والكاديت العام',
    subtitleBn: 'সক্রিয় বিভাগ: হিফযুল কুরআন, কওমি কিতাব বিভাগ, জেনারেল ক্যাডেট বিভাগ',
    subtitleEn: 'Active Divisions: Hifz-ul-Quran, Qawmi Kitab Division, General Cadet Division',
    subtitleAr: 'الأقسام النشطة: قسم تحفيظ القرآن، قسم الكتب القومية، قسم التعليم العام الكاديت',
    summaryBn:
      'তিনটি বিভাগেই তাজবীদ, সুন্নাহভিত্তিক আখলাক এবং প্রয়োজনীয় ভাষা ও গণিত শিক্ষার সমন্বয় রাখা হয়েছে।',
    summaryEn:
      'All three divisions integrate Tajweed, Prophetic character education, and essential language and analytical skills.',
    summaryAr:
      'تجمع الأقسام الثلاثة بين إتقان التلاوة والآداب الإسلامية والمهارات اللغوية والعلمية الأساسية.',
    highlightsBn: [
      'হিফযুল কুরআন বিভাগ: নাজেরা, শুনানি ও হিফয তাকমীল (খতম বর্ষ)',
      'কওমি কিতাব বিভাগ: মিযান, নাহবেমীর ও বেফাক নেসাব',
      'জেনারেল ক্যাডেট বিভাগ: বাংলা, ইংরেজি, গণিত, বিজ্ঞান ও দ্বীনিয়াত',
    ],
    highlightsEn: [
      'Hifz-ul-Quran: Nazera, Shunani & Hifz Takmil (Completion Year)',
      'Qawmi Kitab: Mizan, Nahwmir & Befaq Dars-e-Nizami curriculum',
      'General Cadet: Bengali, English, Mathematics, Science & Islamic Studies',
    ],
    highlightsAr: [
      'قسم تحفيظ القرآن: الناظرة، التسميع، وتكميل الحفظ المتقن',
      'قسم الكتب القومية: الميزان، النحو والصرف، والفقه والحديث',
      'قسم الكاديت العام: البنغالية، الإنجليزية، الرياضيات، العلوم والتربية الإسلامية',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/teachers': {
    slug: '/teachers',
    status: 'published',
    badgeBn: 'উস্তায ও শিক্ষক মণ্ডলী · Teachers & Ustadh',
    badgeEn: 'Teaching Faculty · Asatidhah & Educators',
    badgeAr: 'هيئة التدريس · الأساتذة والحفاظ',
    titleBn: 'বিভাগীয় উস্তায, মুদাররিস ও জেনারেল শিক্ষকদের অনুমোদিত পাবলিক প্রোফাইল',
    titleEn: 'Approved Public Profiles of Departmental Asatidhah & Subject Teachers',
    titleAr: 'الملفات التعريفية المعتمدة لأساتذة الأقسام وحفاظ القرآن الكريم',
    subtitleBn: 'ব্যক্তিগত ফোন ও বেতন তথ্য সুরক্ষিত রেখে কেবল অনুমোদিত প্রোফাইল প্রদর্শিত',
    subtitleEn: 'Only explicitly approved public faculty profiles are published',
    subtitleAr: 'يتم نشر الملفات التعريفية المعتمدة فقط مع حماية البيانات الشخصية للموظفين',
    summaryBn:
      'উম্মুল কুরআন ক্যাডেট মাদ্রাসার হিফয, কওমি কিতাব ও জেনারেল ক্যাডেট বিভাগের অনুমোদিত শিক্ষক মণ্ডলীর পরিচিতি।',
    summaryEn:
      'Verified faculty profiles and departmental teaching structure of Ummul Quran Cadet Madrasa.',
    summaryAr:
      'تعريف بالهيئة التعليمية المعتمدة لأقسام التحفيظ والعلوم الشرعية والتعليم العام.',
    highlightsBn: [
      'হিফযুল কুরআন বিভাগীয় অভিজ্ঞ হাফেজ ও ক্বারীগণ',
      'কওমি কিতাব বিভাগের ফاضিল ও মুদাররিসবৃন্দ',
      'জেনারেল ক্যাডেট বিভাগের বিষয়ভিত্তিক শিক্ষকবৃন্দ',
    ],
    highlightsEn: [
      'Certified Huffaz and Qaris leading the Hifz-ul-Quran Halqas',
      'Classical Islamic scholars instructing Qawmi Kitab classes',
      'Dedicated subject educators for Bengali, English, and Mathematics',
    ],
    highlightsAr: [
      'حفاظ وقراء مجازون للإشراف على حلقات تحفيظ القرآن الكريم',
      'علماء ومدرسون متخصصون لتدريس المتون الشرعية واللغة العربية',
      'معلمون مؤهلون لتدريس المواد العامة واللغات والرياضيات',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/administration': {
    slug: '/administration',
    status: 'published',
    badgeBn: 'প্রশাসন ও পরিচালনা · Administration',
    badgeEn: 'Institutional Governance · Administration',
    badgeAr: 'الإدارة والتوجيه · الهيكل الإداري',
    titleBn: 'মুহতামিম দপ্তর, শিক্ষা পরিচালনা ও দারুল ইকামাহ তত্ত্বাবধান কাঠামো',
    titleEn: 'Office of the Muhtamim, Academic Control & Darul Iqamah Governance',
    titleAr: 'مكتب المهتمم وإدارة الشؤون التعليمية والسكن الداخلي والشؤون المالية',
    subtitleBn: 'স্বচ্ছ প্রশাসনিক অনুমোদন, হিসাবরক্ষণ ও আবাসিক শৃঙ্খলা',
    subtitleEn: 'Transparent administrative approvals, financial stewardship & residential care',
    subtitleAr: 'إدارة مؤسسية منظمة لاعتماد القبول والنتائج والإشراف السكني والمالي',
    summaryBn:
      'মাদ্রাসার সার্বিক একাডেমিক, আর্থিক ও আবাসিক কার্যক্রম মুহতামিম দপ্তরের প্রত্যক্ষ তত্ত্বাবধানে পরিচালিত হয়।',
    summaryEn:
      'All academic, financial, and residential operations are governed under the direct oversight of the Office of the Muhtamim.',
    summaryAr:
      'تُدار جميع الشؤون الأكاديمية والمالية والسكنية تحت الإشراف المباشر لمكتب المهتمم.',
    highlightsBn: [
      'মুহতামিম দপ্তর: ভর্তি, স্টুডেন্ট আইডি ও ফলাফল চূড়ান্ত অনুমোদন',
      'একাডেমিক ও পরীক্ষা নিয়ন্ত্রণ দপ্তর: সিলেবাস ও মূল্যায়ন',
      'দারুল ইকামাহ ও হিসাবরক্ষণ দপ্তর: আবাসিক ছুটি ও ফি ব্যবস্থাপনা',
    ],
    highlightsEn: [
      'Office of the Muhtamim: Final admission, Student ID & result approval',
      'Academic & Exam Control: Syllabus coordination and grading verification',
      'Darul Iqamah & Accounts Office: Residential leave and fee management',
    ],
    highlightsAr: [
      'مكتب المهتمم: الاعتماد النهائي للقبول وأرقام الطلاب والنتائج',
      'مكتب الامتحانات: تنسيق المناهج ومراجعة كشوف الدرجات',
      'إدارة السكن والمحاسبة: متابعة الإجازات والرسوم الدراسية',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/admission': {
    slug: '/admission',
    status: 'published',
    badgeBn: 'অনলাইন ভর্তি পোর্টাল · Online Admission',
    badgeEn: 'Online Admission & Application Tracking',
    badgeAr: 'بوابة القبول والتسجيل الإلكتروني',
    titleBn: 'নতুন শিক্ষাবর্ষে ভর্তি তথ্য, আসন যাচাই ও ৪-ধাপের অনলাইন আবেদন',
    titleEn: 'Admission Guidelines, Eligibility & 4-Step Online Application Portal',
    titleAr: 'شروط القبول والتسجيل ونموذج التقديم الإلكتروني من ٤ خطوات',
    subtitleBn: 'লগইন ছাড়াই অনলাইনে আবেদন জমা দিন এবং রেফারেন্স নম্বর দিয়ে স্ট্যাটাস ট্র্যাক করুন',
    subtitleEn: 'Submit applications online without login and track approval status by reference number',
    subtitleAr: 'قدّم طلب القبول مباشرة عبر الإنترنت وتابع حالة الاعتماد بالرقم المرجعي',
    summaryBn:
      'অনলাইন ভর্তি ফরমটি সরাসরি মাদ্রাসার মূল ভর্তি ব্যবস্থাপনার সাথে যুক্ত। মুহতামিম অনুমোদনের পর স্টুডেন্ট আইডি ও অভিভাবক অ্যাকাউন্ট সক্রিয় হয়।',
    summaryEn:
      'Connected directly to the institutional Admission Management System with Muhtamim review and automated Student ID provisioning.',
    summaryAr:
      'يرتبط نموذج القبول مباشرة بنظام الإدارة؛ وبعد اعتماد المهتمم يتم إصدار رقم الطالب وتفعيل حساب ولي الأمر.',
    highlightsBn: [
      'ধাপ ০১: শিক্ষার্থী, অভিভাবক ও বিভাগ নির্বাচন করে অনলাইন আবেদন',
      'ধাপ ০২: মুহতামিম দপ্তর কর্তৃক যাচাই ও দাখেলা/স্টুডেন্ট আইডি বরাদ্দ',
      'ধাপ ০৩: অভিভাবক ভেরিফিকেশন ও স্টুডেন্ট আইডি দিয়ে পোর্টালে লগইন',
    ],
    highlightsEn: [
      'Step 01: Submit student, guardian, and department details online',
      'Step 02: Muhtamim review and official Student ID assignment',
      'Step 03: Guardian verification and Student ID portal login',
    ],
    highlightsAr: [
      'الخطوة ٠١: إدخال بيانات الطالب وولي الأمر والقسم المطلوب',
      'الخطوة ٠٢: مراجعة المهتمم وتخصيص رقم القيد الرسمي للطالب',
      'الخطوة ٠٣: توثيق حساب ولي الأمر والدخول إلى البوابة الإلكترونية',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/notices': {
    slug: '/notices',
    status: 'published',
    badgeBn: 'পাবলিক নোটিশ বোর্ড · Public Notice Board',
    badgeEn: 'Official Circulars · Public Notice Board',
    badgeAr: 'لوحة الإعلانات والتعاميم الرسمية',
    titleBn: 'প্রাতিষ্ঠানিক নোটিশ, পরীক্ষার রুটিন ও দাপ্তরিক বিজ্ঞপ্তিসমূহ',
    titleEn: 'Official Institutional Notices, Exam Schedules & Public Announcements',
    titleAr: 'الإعلانات الرسمية وجداول الاختبارات والتعاميم العامة للمدرسة',
    subtitleBn: 'কেবলমাত্র সর্বসাধারণের জন্য প্রকাশিত (Published) নোটিশসমূহ',
    subtitleEn: 'Showing verified public notices approved for general publication',
    subtitleAr: 'تُعرض هنا الإعلانات المعتمدة للنشر العام فقط',
    summaryBn:
      'মাদ্রাসা প্রশাসন কর্তৃক প্রকাশিত সর্বজনীন বিজ্ঞপ্তিসমূহ এখানে অগ্রাধিকার ও তারিখ অনুযায়ী ফিল্টার করে পড়া যাবে।',
    summaryEn:
      'Browse and filter official public circulars by priority and publication date.',
    summaryAr:
      'تصفح الإعلانات الرسمية المعتمدة حسب الأولوية وتاريخ النشر.',
    highlightsBn: [
      'জরুরি, গুরুত্বপূর্ণ ও সাধারণ নোটিশ ক্যাটাগরি ফিল্টার',
      'খসড়া (Draft) ও অভ্যন্তরীণ নোটিশ স্বয়ংক্রিয়ভাবে গোপন থাকে',
      'বাংলা, ইংরেজি ও আরবি তিন ভাষায় পাঠযোগ্য',
    ],
    highlightsEn: [
      'Filter notices by Urgent, Important, and Normal priority',
      'Draft and internal staff notices remain strictly private',
      'Readable across Bengali, English, and Arabic RTL',
    ],
    highlightsAr: [
      'تصفية الإعلانات حسب الأهمية (عاجل، هام، عادي)',
      'المسودات والإعلانات الداخلية لا تظهر في الموقع العام',
      'متاح باللغات البنغالية والإنجليزية والعربية',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/events': {
    slug: '/events',
    status: 'published',
    badgeBn: 'সংবাদ ও কার্যক্রম · News & Events',
    badgeEn: 'Campus Chronicles · News & Events',
    badgeAr: 'الأخبار والفعاليات المؤسسية',
    titleBn: 'বার্ষিক দস্তারবন্দী সম্মেলন, হিফয প্রতিযোগিতা ও প্রাতিষ্ঠানিক সংবাদ',
    titleEn: 'Annual Dastarbandi Convocation, Hifz Competitions & Institutional Events',
    titleAr: 'حفل تكريم الحفاظ السنوي والمسابقات القرآنية والفعاليات الأكاديمية',
    subtitleBn: 'কেবলমাত্র অনুমোদিত ও প্রকাশিত পাবলিক ইভেন্টসমূহ প্রদর্শিত',
    subtitleEn: 'Displaying only verified, published institutional events',
    subtitleAr: 'تُعرض الفعاليات والمناسبات المعتمدة والمنشورة فقط',
    summaryBn:
      'উম্মুল কুরআন ক্যাডেট মাদ্রাসার খতমুল কুরআন দস্তারবন্দী অনুষ্ঠান, কিরাআত প্রতিযোগিতা এবং একাডেমিক কার্যক্রমের সময়সূচি ও বিবরণ।',
    summaryEn:
      'Schedules and highlights of Khatmul Quran Dastarbandi ceremonies, Qira’at competitions, and academic events.',
    summaryAr:
      'مواعيد وتفاصيل حفلات ختم القرآن الكريم وتكريم الحفاظ والأنشطة العلمية.',
    highlightsBn: [
      'বার্ষিক হিফযুল কুরআন প্রতিযোগিতা ও পাগড়ি প্রদান (দস্তারবন্দী)',
      'অভিভাবক সমাবেশ ও তারবিয়াতী আলোচনা সভা',
      'নতুন শিক্ষাবর্ষের সবক উদ্বোধন ও দোয়া মাহফিল',
    ],
    highlightsEn: [
      'Annual Hifz-ul-Quran Competition & Dastarbandi Convocation',
      'Guardian Tarbiyah Seminars & Academic Briefings',
      'New Academic Session Sabaq Inauguration & Dua Mahfil',
    ],
    highlightsAr: [
      'المسابقة السنوية لتحفيظ القرآن الكريم وحفل تكريم الحفاظ',
      'لقاءات أولياء الأمور والندوات التربوية',
      'افتتاح الدروس للعام الدراسي الجديد ومجلس الدعاء',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/gallery': {
    slug: '/gallery',
    status: 'published',
    badgeBn: 'ক্যাম্পাস গ্যালারি · Campus Gallery',
    badgeEn: 'Visual Archive · Campus & Activities Gallery',
    badgeAr: 'معرض الصور · الحرم المدرسي والأنشطة',
    titleBn: 'হিফয হালকা, কওমি দরসগাহ, ক্যাডেট শ্রেণিকক্ষ ও দারুল ইকামাহ গ্যালারি',
    titleEn: 'Hifz Halqas, Qawmi Study Halls, Cadet Classrooms & Residential Gallery',
    titleAr: 'معرض حلقات التحفيظ وقاعات الدراسة والفصول والسكن الداخلي',
    subtitleBn: 'বিভাগভিত্তিক ফিল্টার ও লাইটবক্স প্রিভিউ সুবিধা',
    subtitleEn: 'Departmental filtering with interactive Lightbox preview',
    subtitleAr: 'تصفية حسب القسم مع معاينة تفصيلية لكل عنصر',
    summaryBn:
      'মাদ্রাসার একাডেমিক ও আবাসিক পরিবেশের অনুমোদিত চিত্র ও বিবরণী। অপ্রকাশিত বা খসড়া গ্যালারি আইটেম পাবলিক ওয়েবসাইটে প্রদর্শিত হয় না।',
    summaryEn:
      'Approved visual items and descriptions of our academic and residential environment. Draft gallery items are never shown publicly.',
    summaryAr:
      'عناصر وصور معتمدة للبيئة التعليمية والسكنية بالمدرسة.',
    highlightsBn: [
      'হিফযুল কুরআন সবক ও শুনানি হালকা',
      'কওমি কিতাব ও আরবি সাহিত্য দরসগাহ',
      'জেনারেল ক্যাডেট শ্রেণিকক্ষ ও আবাসিক দারুল ইকামাহ',
    ],
    highlightsEn: [
      'Hifz-ul-Quran Sabaq & Shunani Recitation Halqas',
      'Qawmi Kitab & Classical Arabic Study Halls',
      'General Cadet Classrooms & Supervised Darul Iqamah',
    ],
    highlightsAr: [
      'حلقات تسميع السبق والسبقي والمنزل لقسم التحفيظ',
      'قاعات دراسة الكتب الشرعية واللغة العربية',
      'فصول التعليم العام الكاديت والسكن الداخلي المنظم',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
  '/contact': {
    slug: '/contact',
    status: 'published',
    badgeBn: 'যোগাযোগ ও অবস্থান · Contact & Location',
    badgeEn: 'Official Contact · Campus Address & Hours',
    badgeAr: 'التواصل والموقع · العنوان وأوقات الدوام',
    titleBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসার দাপ্তরিক ঠিকানা, ফোন, ইমেইল ও অফিস সময়সূচি',
    titleEn: 'Verified Campus Address, Official Phone, Email & Office Hours',
    titleAr: 'العنوان الرسمي للمدرسة وأرقام التواصل والبريد الإلكتروني وساعات العمل',
    subtitleBn: 'উত্তরা, ঢাকা ক্যাম্পাস — সরাসরি সাক্ষাৎ ও অনলাইন সেবা',
    subtitleEn: 'Uttara, Dhaka Campus — Direct In-Person Counseling & Online Services',
    subtitleAr: 'حرم أوتارا، دكا — الاستقبال المباشر والخدمات الإلكترونية',
    summaryBn:
      'ভর্তি পরামর্শ, আবাসিক আসন তথ্য কিংবা একাডেমিক দপ্তরের সাথে যোগাযোগের জন্য নিচের যাচাইকৃত ঠিকানা, ফোন ও ইমেইল ব্যবহার করুন।',
    summaryEn:
      'For admission inquiries, residential seat availability, or official communication, please reach us via the verified contact channels below.',
    summaryAr:
      'للاستفسار عن القبول أو السكن الداخلي أو التواصل الرسمي، يرجى استخدام بيانات الاتصال المعتمدة أدناه.',
    highlightsBn: [
      'দাপ্তরিক সময়সূচি: শনিবার – বৃহস্পতিবার (সকাল ৮:৩০ – বিকাল ৫:০০)',
      'ভর্তি ও আবাসিক পরামর্শ ডেস্ক: প্রতিদিন সকাল ৯:০০ – আসর পর্যন্ত',
      'অনলাইন ভর্তি ও পোর্টাল সাপোর্ট সার্বক্ষণিক সক্রিয়',
    ],
    highlightsEn: [
      'Official Office Hours: Saturday – Thursday (8:30 AM – 5:00 PM)',
      'Admission & Residential Desk: Daily 9:00 AM – Asr Prayer',
      '24/7 Online Admission Application & Portal Access',
    ],
    highlightsAr: [
      'ساعات الدوام الرسمي: السبت – الخميس (٨:٣٠ صباحاً – ٥:٠٠ مساءً)',
      'مكتب القبول والسكن الداخلي: يومياً من ٩:٠٠ صباحاً حتى العصر',
      'بوابة القبول الإلكتروني وتسجيل الدخول متاحة على مدار الساعة',
    ],
    updatedAt: '2026-10-25',
    updatedBy: 'মুহতামিম দপ্তর',
  },
};

export const INITIAL_CMS_PUBLIC_PROFILES: CmsPublicProfile[] = [
  {
    id: 'pub-prof-muhtamim',
    profileType: 'administration',
    nameBn: 'মাওলানা মুফতি আব্দুল মতিন কাসেমী',
    nameEn: 'Mawlana Mufti Abdul Matin Qasemi',
    nameAr: 'المفتي عبد المتين القاسمي',
    designationBn: 'মুহতামিম ও শাইখুল হাদিস (অধ্যক্ষ)',
    designationEn: 'Muhtamim (Principal) & Shaykhul Hadith',
    designationAr: 'مدير المدرسة (المهتمم) وشيخ الحديث',
    department: 'administration',
    biographyBn:
      'দাওরায়ে হাদিস ও উচ্চতর ইফতা (ইসলামী আইন) ডিগ্রিধারী। উম্মুল কুরআন ক্যাডেট মাদ্রাসার সার্বিক একাডেমিক নীতিমালা, ভর্তি অনুমোদন, পরীক্ষা নিয়ন্ত্রণ ও কিতাব বিভাগের তত্ত্বাবধান পরিচালনা করেন।',
    biographyEn:
      'Graduate of Dawra-e-Hadith and Higher Islamic Jurisprudence (Ifta). Oversees institutional governance, admission approvals, examination standards, and advanced Kitab instruction.',
    biographyAr:
      'متخصص في الحديث الشريف والفقه الإسلامي، يشرف على الإدارة العامة للمدرسة واعتماد القبول والاختبارات وتدريس الكتب العليا.',
    photoUrl: '',
    displayOrder: 1,
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'pub-prof-hifz-head',
    profileType: 'teacher',
    nameBn: 'হাফেজ কারী সাইফুল্লাহ আল আজহারী',
    nameEn: 'Hafiz Qari Saifullah Al Azhari',
    nameAr: 'الحافظ القارئ سيف الله الأزهري',
    designationBn: 'প্রধান তত্ত্বাবধায়ক, হিফযুল কুরআন বিভাগ',
    designationEn: 'Head of Hifz-ul-Quran & Tajweed Division',
    designationAr: 'المشرف العام على قسم تحفيظ القرآن الكريم والتجويد',
    department: 'hifz',
    biographyBn:
      'হিফযুল কুরআন, কিরাআত ও তাজবীদে সনদপ্রাপ্ত। হিফয তাকমীল ও শুনানি জামাতের শিক্ষার্থীদের দৈনিক সবক, সবকি, মানযিল এবং মাখরাজ-সিফাত তদারকি করেন।',
    biographyEn:
      'Certified in Hifz-ul-Quran, Qira’at, and Tajweed. Leads daily Sabaq, Sabqi, and Manzil supervision for Hifz Takmil and Shunani circles.',
    biographyAr:
      'مجاز في حفظ القرآن الكريم والقراءات والتجويد، يشرف على حلقات التسميع اليومي وتكميل الحفظ.',
    photoUrl: '',
    displayOrder: 2,
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'pub-prof-general-senior',
    profileType: 'teacher',
    nameBn: 'মো. নাজমুল হুদা চৌধুরী',
    nameEn: 'Md. Nazmul Huda Chowdhury',
    nameAr: 'الأستاذ نجم الهدى شودري',
    designationBn: 'সিনিয়র শিক্ষক (গণিত ও ইংরেজি), জেনারেল ক্যাডেট বিভাগ',
    designationEn: 'Senior Educator (Mathematics & English), General Cadet Division',
    designationAr: 'معلم أول (الرياضيات واللغة الإنجليزية) — قسم الكاديت العام',
    department: 'general',
    biographyBn:
      'গণিতে স্নাতকোত্তর (এম.এস.সি)। ক্যাডেট শ্রেণিসমূহের গণিত, বিজ্ঞান ও ইংরেজি পাঠদান এবং দৈনিক স্টাডি ডায়েরি ও একাডেমিক মূল্যায়ন পরিচালনা করেন।',
    biographyEn:
      'M.Sc. in Mathematics. Leads General Cadet instruction in Mathematics, Science, and English alongside daily Study Diary coordination.',
    biographyAr:
      'حاصل على الماجستير في الرياضيات، يتولى تدريس الرياضيات والعلوم واللغة الإنجليزية ومتابعة المذكرة الدراسية.',
    photoUrl: '',
    displayOrder: 3,
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'pub-prof-darul-iqamah',
    profileType: 'administration',
    nameBn: 'মাওলানা জাকারিয়া মাহমুদ',
    nameEn: 'Mawlana Zakaria Mahmud',
    nameAr: 'مولانا زكريا محمود',
    designationBn: 'আবাসিক নেগরান ও দারুল ইকামাহ তত্ত্বাবধায়ক',
    designationEn: 'Residential Supervisor (Darul Iqamah)',
    designationAr: 'مشرف السكن الداخلي (دار الإقامة) والتربية',
    department: 'boarding',
    biographyBn:
      'দাওরায়ে হাদিস (বেফাকুল মাদারিসিল আরাবিয়া)। কওমি কিতাব পাঠদানের পাশাপাশি আবাসিক ছাত্রদের দৈনিক নামাজ, তারবিয়াত ও অনুমোদিত ছুটি ব্যবস্থাপনা তদারকি করেন।',
    biographyEn:
      'Dawra-e-Hadith graduate (Befaq). Instructs Qawmi Kitab classes and supervises residential dormitory routines, prayers, and guardian-verified leave.',
    biographyAr:
      'خريج دورة الحديث الشريف، يدرس الكتب الشرعية ويشرف على النظام اليومي والصلوات وإجازات الطلاب المقيمين.',
    photoUrl: '',
    displayOrder: 4,
    status: 'published',
    updatedAt: '2026-10-25',
  },
];

export const INITIAL_CMS_PUBLIC_EVENTS: CmsPublicEvent[] = [
  {
    id: 'evt-dastarbandi-2026',
    titleBn: 'খতমকারী হাফেজ ছাত্রদের পাগড়ি প্রদান (দস্তারবন্দী) ও বার্ষিক হিফযুল কুরআন সম্মেলন ২০২৬',
    titleEn: 'Annual Hifz-ul-Quran Competition & Graduating Huffaz Dastarbandi Convocation 2026',
    titleAr: 'مسابقة القرآن الكريم السنوية وحفل تكريم الحفاظ الخاتمين لعام ٢٠٢٦م',
    descriptionBn:
      'আগামী ১৫ নভেম্বর ২০২৬ রোজ রবিবার মাদ্রাসা প্রাঙ্গণে খতমকারী হাফেজ ছাত্রদের পাগড়ি প্রদান (দস্তারবন্দী) ও বার্ষিক পুরস্কার বিতরণী অনুষ্ঠান অনুষ্ঠিত হবে। সকল অভিভাবক ও শুভানুধ্যায়ীদের উপস্থিত থাকার জন্য আমন্ত্রণ জানানো যাচ্ছে।',
    descriptionEn:
      'Scheduled for Sunday, 15 November 2026 on campus to honor graduating Huffaz with Dastarbandi turbans and academic merit awards.',
    descriptionAr:
      'يُقام الحفل يوم الأحد ١٥ نوفمبر ٢٠٢٦م في حرم المدرسة لتكريم الطلاب الخاتمين لكتاب الله وتوزيع الجوائز التقديرية.',
    eventDate: '2026-11-15',
    category: 'event',
    badgeBn: 'বার্ষিক দস্তারবন্দী ও হিফয সম্মেলন',
    badgeEn: 'Annual Dastarbandi & Hifz Convocation',
    badgeAr: 'الحفل السنوي لتكريم حفاظ القرآن',
    coverImageUrl: '',
    galleryImageUrls: [],
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'evt-second-term-exam-2026',
    titleBn: 'দ্বিতীয় সাময়িক ও হিফযুল কুরআন পারা যাচাই পরীক্ষা ২০২৬',
    titleEn: '2nd Term Academic & Hifz Para Assessment Examinations 2026',
    titleAr: 'اختبارات الفصل الدراسي الثاني وتقييم الأجزاء لقسم التحفيظ ٢٠٢٦م',
    descriptionBn:
      'হিফয তাকমীল, শুনানি জামাত, কওমি কিতাব বিভাগ এবং জেনারেল ক্যাডেট শ্রেণির মৌখিক ও লিখিত পরীক্ষা আগামী ২০ নভেম্বর ২০২৬ থেকে শুরু হবে।',
    descriptionEn:
      'Oral and written evaluations for Hifz Takmil, Qawmi Kitab classes, and General Cadet grades commence on 20 November 2026.',
    descriptionAr:
      'تبدأ الاختبارات الشفهية والتحريرية لجميع الأقسام اعتباراً من ٢٠ نوفمبر ٢٠٢٦م وفق الجدول المعتمد.',
    eventDate: '2026-11-20',
    category: 'exam',
    badgeBn: 'পরীক্ষা নিয়ন্ত্রক দপ্তর · সময়সূচি',
    badgeEn: 'Examination Schedule · Nov 2026',
    badgeAr: 'جدول الاختبارات الفصلية',
    coverImageUrl: '',
    galleryImageUrls: [],
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'evt-admission-session-2026',
    titleBn: 'নতুন শিক্ষাবর্ষ ২০২৬–২০২৭ (১৪৪৭–১৪৪৮ হিজরি) ভর্তি ও তিলাওয়াত যাচাই সপ্তাহ',
    titleEn: 'New Academic Session 2026–2027 Admission & Recitation Assessment Week',
    titleAr: 'أسبوع القبول والتسجيل وتقييم التلاوة للعام الدراسي الجديد ٢٠٢٦–٢٠٢٧م',
    descriptionBn:
      'নাজেরা, হিফযুল কুরআন, কওমি কিতাব ও জেনারেল ক্যাডেট বিভাগে আবাসিক ও অনাবাসিক আসনে নতুন শিক্ষার্থী ভর্তির সাক্ষাৎকার প্রতিদিন সকাল ৯:০০ হতে আসর পর্যন্ত চলমান।',
    descriptionEn:
      'Daily recitation assessment and guardian placement interviews from 9:00 AM to Asr for residential and day-scholar admission applicants.',
    descriptionAr:
      'تُجرى مقابلات القبول وتقييم التلاوة للطلاب الجدد يومياً من الساعة ٩:٠٠ صباحاً حتى صلاة العصر.',
    eventDate: '2026-12-01',
    category: 'admission',
    badgeBn: 'ভর্তি কার্যক্রম · শিক্ষাবর্ষ ২০২৬–২০২৭',
    badgeEn: 'Admission Open · Session 2026–2027',
    badgeAr: 'فتح باب القبول والتسجيل',
    coverImageUrl: '',
    galleryImageUrls: [],
    status: 'published',
    updatedAt: '2026-10-25',
  },
];

export const INITIAL_CMS_GALLERY_ITEMS: CmsGalleryItem[] = [
  {
    id: 'gal-hifz-1',
    departmentKey: 'hifz',
    categoryBn: 'হিফযুল কুরআন বিভাগ',
    categoryEn: 'Hifzul Quran Department',
    categoryAr: 'قسم تحفيظ القرآن الكريم',
    titleBn: 'সবক, সবকি ও আমুখতা তিলাওয়াত হালকা',
    titleEn: 'Daily Sabaq, Sabqi & Manzil Recitation Circle',
    titleAr: 'حلقة تسميع السبق والسبقي والمنزل اليومية',
    captionBn: 'তাজবীদ ও মাখরাজ অনুসরণে পবিত্র কুরআন হিফয অনুশীলন পরিবেশ',
    captionEn: 'Focused Quran memorization environment following strict Tajweed rules',
    captionAr: 'بيئة مخصصة لحفظ القرآن الكريم مع مراعاة أحكام التجويد ومخارج الحروف',
    detailsBn:
      'হিফয বিভাগের প্রতিটি শিক্ষার্থীর দৈনিক সবক (নতুন পাঠ), সবকি (সপ্তাহিক পুনরাবৃত্তি) এবং আমুখতা/মানযিল নিবন্ধিত উস্তাযের তত্ত্বাবধানে মূল্যায়ন করা হয় এবং অভিভাবক পোর্টালে সংরক্ষিত থাকে।',
    detailsEn:
      'Every Hifz student’s daily Sabaq, Sabqi, and Manzil recitation is evaluated under qualified Huffaz supervision and recorded in the Guardian Portal.',
    detailsAr:
      'يتم تقييم التسميع اليومي لكل طالب تحت إشراف حفاظ متقنين وتوثيقه في بوابة أولياء الأمور.',
    imageUrl: '',
    accentColor: '#0A6847',
    displayOrder: 1,
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'gal-qawmi-1',
    departmentKey: 'qawmi',
    categoryBn: 'কওমি ও কিতাব বিভাগ',
    categoryEn: 'Qawmi & Kitab Department',
    categoryAr: 'قسم العلوم الشرعية والكتب',
    titleBn: 'আরবি সাহিত্য, নাহু-সরফ ও ফিকহ দরসগাহ',
    titleEn: 'Arabic Grammar, Literature & Islamic Jurisprudence Study Hall',
    titleAr: 'قاعة دراسة النحو والصرف والفقه الإسلامي',
    captionBn: 'মৌলিক ইসলামি জ্ঞান ও সুন্নাহভিত্তিক আদব-আখলাক চর্চার একাডেমিক পরিবেশ',
    captionEn: 'Classical Islamic scholarship combined with Prophetic character formation',
    captionAr: 'بيئة علمية تجمع بين دراسة المتون الشرعية والتربية الإسلامية الأصيلة',
    detailsBn:
      'কওমি কিতাব বিভাগে আরবি ব্যাকরণ (মিযান, নাহবেমীর), তরজমা, ফিকহ ও হাদীসের পাঠদান অভিজ্ঞ মুদাররিসগণের তত্ত্বাবধানে পরিচালিত হয়।',
    detailsEn:
      'Classical texts in Arabic grammar, translation, Fiqh, and Hadith are taught in dedicated study halls under experienced Mudarrisin.',
    detailsAr:
      'تُدرّس متون النحو والصرف والفقه والحديث الشريف تحت إشراف مدرسين متخصصين.',
    imageUrl: '',
    accentColor: '#D4AF37',
    displayOrder: 2,
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'gal-general-1',
    departmentKey: 'general',
    categoryBn: 'জেনারেল ও ক্যাডেট বিভাগ',
    categoryEn: 'General & Cadet Department',
    categoryAr: 'قسم التعليم العام والكاديت',
    titleBn: 'বাংলা, ইংরেজি, গণিত ও বিজ্ঞান সমন্বিত শ্রেণিকক্ষ',
    titleEn: 'Integrated Bengali, English, Mathematics & Science Classroom',
    titleAr: 'الفصول الدراسية المتكاملة للغات والرياضيات والعلوم',
    captionBn: 'দ্বীনি শিক্ষার পাশাপাশি জাতীয় শিক্ষাক্রমের মৌলিক বিষয়ে দক্ষতা অর্জন',
    captionEn: 'Mastering essential general subjects alongside foundational Islamic studies',
    captionAr: 'إتقان المواد الأكاديمية الأساسية إلى جانب التربية الإسلامية',
    detailsBn:
      'জেনারেল ক্যাডেট বিভাগের শিক্ষার্থীদের প্রতিদিন বাংলা, ইংরেজি, গণিত ও বিজ্ঞানের ক্লাসওয়ার্ক এবং হোমওয়ার্ক স্টাডি ডায়েরির মাধ্যমে তদারকি করা হয়।',
    detailsEn:
      'General Cadet students receive structured instruction in Bengali, English, Mathematics, and Science with daily Study Diary tracking.',
    detailsAr:
      'يتلقى طلاب قسم الكاديت دروساً منتظمة في اللغات والرياضيات والعلوم مع متابعة يومية.',
    imageUrl: '',
    accentColor: '#1E3A8A',
    displayOrder: 3,
    status: 'published',
    updatedAt: '2026-10-25',
  },
  {
    id: 'gal-residential-1',
    departmentKey: 'residential',
    categoryBn: 'দারুল ইকামাহ (আবাসিক ছাত্রাবাস)',
    categoryEn: 'Darul Iqamah (Residential Dormitory)',
    categoryAr: 'دار الإقامة (السكن الداخلي)',
    titleBn: 'সুশৃঙ্খল আবাসিক ছাত্রাবাস, জামাতে নামাজ ও নেগরানি পরিবেশ',
    titleEn: 'Supervised Residential Dormitory, Congregational Prayers & Routine',
    titleAr: 'إشراف تربوي متكامل ونظام يومي منظم للطلاب المقيمين',
    captionBn: 'আবাসিক নেগরানদের তত্ত্বাবধানে নিরাপদ আবাসন ও যাচাইকৃত ছুটি ব্যবস্থাপনা',
    captionEn: 'Safe boarding care under residential supervisors with verified guardian leave tracking',
    captionAr: 'رعاية سكنية آمنة تحت إشراف متخصصين مع توثيق إجازات الطلاب',
    detailsBn:
      'আবাসিক ছাত্রদের কক্ষ বরাদ্দ, পাঁচ ওয়াক্ত জামাতে নামাজ, সকাল-সন্ধ্যা তিলাওয়াত এবং অভিভাবকের উপস্থিতিতে ছুটি ও প্রত্যাবর্তন পোর্টালে নিবন্ধিত হয়।',
    detailsEn:
      'Dormitory room assignments, five daily congregational prayers, study hours, and guardian-accompanied leave records are digitally managed.',
    detailsAr:
      'يتم تنظيم غرف السكن والصلوات الخمس جماعة وساعات المذاكرة وتصاريح الخروج والعودة إلكترونياً.',
    imageUrl: '',
    accentColor: '#065F46',
    displayOrder: 4,
    status: 'published',
    updatedAt: '2026-10-25',
  },
];

export const INITIAL_CMS_CONTACT_FOOTER: CmsContactFooterConfig = {
  status: 'published',
  institutionNameBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা',
  institutionNameEn: 'Ummul Quran Cadet Madrasa',
  institutionNameAr: 'مدرسة أم القرآن كاديت الإسلامية',
  addressBn: 'বাড়ি ১৪, রোড ৭, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ',
  addressEn: 'House 14, Road 7, Sector 3, Uttara, Dhaka-1230, Bangladesh',
  addressAr: 'منزل ١٤، طريق ٧، قطاع ٣، أوتارا، دكا-١٢٣٠، بنغلاديش',
  phone: '+880 1711-984321',
  email: 'office@ummulquranmadrasa.edu.bd',
  mapLink: 'https://maps.google.com/?q=Sector+3+Uttara+Dhaka+1230',
  facebookUrl: '',
  youtubeUrl: '',
  whatsappNumber: '+8801711984321',
  footerDescriptionBn:
    'উম্মুল কুরআন ক্যাডেট মাদ্রাসা — কওমি নেসাব, বিশুদ্ধ হিফযুল কুরআন ও আধুনিক জেনারেল ক্যাডেট শিক্ষার সমন্বিত দ্বীনি শিক্ষাপ্রতিষ্ঠান।',
  footerDescriptionEn:
    'Ummul Quran Cadet Madrasa — An integrated boys institution uniting Tajweed-compliant Hifz-ul-Quran, Qawmi Kitab studies, and General Cadet education.',
  footerDescriptionAr:
    'مدرسة أم القرآن كاديت الإسلامية — مؤسسة تعليمية للبنين تجمع بين تحفيظ القرآن الكريم بالتجويد والعلوم الشرعية والتعليم العام.',
  officeHoursBn: 'শনিবার – বৃহস্পতিবার: সকাল ৮:৩০ – বিকাল ৫:০০ (শুক্রবার সাপ্তাহিক ছুটি)',
  officeHoursEn: 'Saturday – Thursday: 8:30 AM – 5:00 PM (Closed on Friday)',
  officeHoursAr: 'السبت – الخميس: ٨:٣٠ صباحاً – ٥:٠٠ مساءً (الجمعة عطلة أسبوعية)',
  updatedAt: '2026-10-25',
};

export const INITIAL_WEBSITE_CMS_CONFIG: WebsiteCmsConfig = {
  id: CMS_SETTINGS_DOC_ID,
  homepageSections: INITIAL_HOMEPAGE_SECTIONS,
  publishedHomepageSections: INITIAL_HOMEPAGE_SECTIONS,
  pages: INITIAL_CMS_PAGES,
  publishedPages: INITIAL_CMS_PAGES,
  publicProfiles: INITIAL_CMS_PUBLIC_PROFILES,
  events: INITIAL_CMS_PUBLIC_EVENTS,
  galleryItems: INITIAL_CMS_GALLERY_ITEMS,
  contactFooter: INITIAL_CMS_CONTACT_FOOTER,
  publishedContactFooter: INITIAL_CMS_CONTACT_FOOTER,
  draftNotices: [],
  recentUpdates: [
    {
      id: 'cms-log-init-1',
      section: 'homepage',
      titleBn: 'হোমপেজ ও ১২টি সেকশন প্রাথমিক প্রকাশনা সম্পন্ন',
      titleEn: 'Homepage & 12 Institutional Sections Published',
      titleAr: 'نشر الصفحة الرئيسية والأقسام المؤسسية الاثني عشر',
      status: 'published',
      timestamp: '2026-10-25T09:00:00.000Z',
      actorName: 'মুহতামিম দপ্তর',
    },
    {
      id: 'cms-log-init-2',
      section: 'pages',
      titleBn: '১০টি পাবলিক প্রাতিষ্ঠানিক পেজ (bn/en/ar) প্রকাশিত',
      titleEn: '10 Public Institutional Pages (BN/EN/AR) Published',
      titleAr: 'اعتماد ونشر الصفحات العامة العشر باللغات الثلاث',
      status: 'published',
      timestamp: '2026-10-25T09:05:00.000Z',
      actorName: 'মুহতামিম দপ্তর',
    },
  ],
  updatedAt: '2026-10-25T09:05:00.000Z',
  updatedBy: 'মুহতামিম দপ্তর',
};

/**
 * Encodes WebsiteCmsConfig into a Firestore `settings/website-cms-config` document envelope
 * that strictly satisfies `isValidInstitutionSettings` in deployed `firestore.rules`.
 */
export function encodeWebsiteCmsAsSettingsEnvelope(
  cmsConfig: WebsiteCmsConfig,
  authorId: string
): {
  institutionNameBn: string;
  institutionNameEn: string;
  institutionNameAr: string;
  academicYear: string;
  hijriYear: string;
  addressBn: string;
  phone: string;
  email: string;
  defaultLanguage: Language;
  activeDepartments: string;
  gradingSystem: string;
  authorId: string;
} {
  const safeAuthorId = (authorId || 'usr-admin-1').trim().slice(0, 120);
  const compactSummary = JSON.stringify({
    v: 1,
    t: cmsConfig.updatedAt || new Date().toISOString(),
    u: (cmsConfig.updatedBy || 'Admin').slice(0, 80),
  }).slice(0, 780);

  return {
    institutionNameBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা — ওয়েবসাইট সিএমএস',
    institutionNameEn: 'WEBSITE_CMS_CONFIG',
    institutionNameAr: 'نظام إدارة محتوى الموقع — مدرسة أم القرآن كاديت',
    academicYear: '2026-2027',
    hijriYear: '1447-1448 AH',
    addressBn: JSON.stringify(cmsConfig),
    phone: (cmsConfig.contactFooter?.phone || '+880 1711-984321').slice(0, 90),
    email: (cmsConfig.contactFooter?.email || 'office@ummulquranmadrasa.edu.bd').slice(0, 190),
    defaultLanguage: 'bn',
    activeDepartments: 'হিফযুল কুরআন, কওমি কিতাব বিভাগ, জেনারেল ক্যাডেট বিভাগ',
    gradingSystem: compactSummary,
    authorId: safeAuthorId,
  };
}

/**
 * Decodes a `settings/website-cms-config` document back into a full WebsiteCmsConfig object,
 * merging any missing fields with INITIAL_WEBSITE_CMS_CONFIG so schema additions never fail.
 */
export function decodeWebsiteCmsFromSettingsEnvelope(
  rawData: Record<string, unknown> | null | undefined,
  docId = CMS_SETTINGS_DOC_ID
): WebsiteCmsConfig | null {
  if (!rawData || rawData.institutionNameEn !== 'WEBSITE_CMS_CONFIG') {
    return null;
  }
  try {
    const rawJson = String(rawData.addressBn || '');
    if (!rawJson.startsWith('{')) return null;
    const parsed = JSON.parse(rawJson) as Partial<WebsiteCmsConfig>;
    return mergeWebsiteCmsWithDefaults(parsed, docId);
  } catch {
    return null;
  }
}

export function mergeWebsiteCmsWithDefaults(
  partial: Partial<WebsiteCmsConfig> | null | undefined,
  docId = CMS_SETTINGS_DOC_ID
): WebsiteCmsConfig {
  if (!partial) return { ...INITIAL_WEBSITE_CMS_CONFIG, id: docId };

  const homepageSections: Record<HomepageSectionId, CmsHomepageSectionConfig> = {
    ...INITIAL_HOMEPAGE_SECTIONS,
    ...(partial.homepageSections || {}),
  };

  const publishedHomepageSections: Record<HomepageSectionId, CmsHomepageSectionConfig> = {
    ...INITIAL_HOMEPAGE_SECTIONS,
    ...(partial.publishedHomepageSections || partial.homepageSections || {}),
  };

  const pages: Record<CmsPublicPageSlug, CmsInstitutionalPageContent> = {
    ...INITIAL_CMS_PAGES,
    ...(partial.pages || {}),
  };

  const publishedPages: Record<CmsPublicPageSlug, CmsInstitutionalPageContent> = {
    ...INITIAL_CMS_PAGES,
    ...(partial.publishedPages || partial.pages || {}),
  };

  const contactFooter: CmsContactFooterConfig = {
    ...INITIAL_CMS_CONTACT_FOOTER,
    ...(partial.contactFooter || {}),
  };

  const publishedContactFooter: CmsContactFooterConfig = {
    ...INITIAL_CMS_CONTACT_FOOTER,
    ...(partial.publishedContactFooter || partial.contactFooter || {}),
  };

  return {
    id: docId,
    homepageSections,
    publishedHomepageSections,
    pages,
    publishedPages,
    publicProfiles: Array.isArray(partial.publicProfiles)
      ? partial.publicProfiles
      : INITIAL_CMS_PUBLIC_PROFILES,
    events: Array.isArray(partial.events) ? partial.events : INITIAL_CMS_PUBLIC_EVENTS,
    galleryItems: Array.isArray(partial.galleryItems)
      ? partial.galleryItems
      : INITIAL_CMS_GALLERY_ITEMS,
    contactFooter,
    publishedContactFooter,
    draftNotices: Array.isArray(partial.draftNotices) ? partial.draftNotices : [],
    recentUpdates: Array.isArray(partial.recentUpdates)
      ? partial.recentUpdates.slice(0, 25)
      : INITIAL_WEBSITE_CMS_CONFIG.recentUpdates,
    updatedAt: partial.updatedAt || INITIAL_WEBSITE_CMS_CONFIG.updatedAt,
    updatedBy: partial.updatedBy || INITIAL_WEBSITE_CMS_CONFIG.updatedBy,
  };
}

/**
 * Encodes extended CMS notice metadata into `targetClass` using a clean ` ||CMS:` delimiter
 * so the notice document remains 100% compliant with the 10-key `isValidNotice` rule in `firestore.rules`.
 */
export function encodeNoticeTargetClassWithCmsMeta(
  cleanTargetClass: string,
  meta?: Partial<CmsNoticeMetadata>
): string {
  const baseClass = (cleanTargetClass || 'সকল জামাত').split(' ||CMS:')[0].trim() || 'সকল জামাত';
  if (!meta) return baseClass;

  const payload: CmsNoticeMetadata = {
    status: meta.status === 'draft' ? 'draft' : 'published',
    category: meta.category || 'general',
    expiryDate: (meta.expiryDate || '').trim(),
    attachmentUrl: (meta.attachmentUrl || '').trim(),
    titleAr: (meta.titleAr || '').trim(),
    contentEn: (meta.contentEn || '').trim(),
    contentAr: (meta.contentAr || '').trim(),
  };

  return `${baseClass} ||CMS:${JSON.stringify(payload)}`;
}

export function decodeNoticeWithCmsMeta(notice: Notice): {
  cleanNotice: Notice;
  cmsMeta: CmsNoticeMetadata;
} {
  const rawTargetClass = String(notice.targetClass || 'সকল জামাত');
  const [cleanClassPart, encodedMetaPart] = rawTargetClass.split(' ||CMS:');
  const cleanTargetClass = (cleanClassPart || 'সকল জামাত').trim();

  const defaultMeta: CmsNoticeMetadata = {
    status: 'published',
    category: 'general',
    expiryDate: '',
    attachmentUrl: '',
    titleAr: '',
    contentEn: '',
    contentAr: '',
  };

  if (!encodedMetaPart) {
    return {
      cleanNotice: { ...notice, targetClass: cleanTargetClass },
      cmsMeta: defaultMeta,
    };
  }

  try {
    const parsed = JSON.parse(encodedMetaPart) as Partial<CmsNoticeMetadata>;
    return {
      cleanNotice: { ...notice, targetClass: cleanTargetClass },
      cmsMeta: {
        status: parsed.status === 'draft' ? 'draft' : 'published',
        category: parsed.category || 'general',
        expiryDate: parsed.expiryDate || '',
        attachmentUrl: parsed.attachmentUrl || '',
        titleAr: parsed.titleAr || '',
        contentEn: parsed.contentEn || '',
        contentAr: parsed.contentAr || '',
      },
    };
  } catch {
    return {
      cleanNotice: { ...notice, targetClass: cleanTargetClass },
      cmsMeta: defaultMeta,
    };
  }
}

/**
 * Returns ONLY published public notices (`targetAudience === 'all'`, `status === 'published'`, and not expired).
 * Draft notices, expired notices, or internal notices never appear on the public website.
 */
export function getPublishedPublicNotices(
  notices: Notice[],
  todayIso = new Date().toISOString().slice(0, 10)
): Array<{ notice: Notice; cmsMeta: CmsNoticeMetadata }> {
  const result: Array<{ notice: Notice; cmsMeta: CmsNoticeMetadata }> = [];
  for (const rawNotice of notices || []) {
    if (!rawNotice || rawNotice.targetAudience !== 'all') continue;
    const { cleanNotice, cmsMeta } = decodeNoticeWithCmsMeta(rawNotice);
    if (cmsMeta.status !== 'published') continue;
    if (cmsMeta.expiryDate && cmsMeta.expiryDate < todayIso) continue;
    result.push({ notice: cleanNotice, cmsMeta });
  }
  return result.sort((a, b) => b.notice.publishDate.localeCompare(a.notice.publishDate));
}

/**
 * Returns ONLY published homepage section configurations.
 * If a section is currently in 'draft' in `homepageSections`, falls back to `publishedHomepageSections`
 * or `INITIAL_HOMEPAGE_SECTIONS` so draft edits never leak to the public homepage before publication.
 */
export function getPublishedHomepageSections(
  cmsConfig?: WebsiteCmsConfig | null
): Record<HomepageSectionId, CmsHomepageSectionConfig> {
  if (!cmsConfig) return INITIAL_HOMEPAGE_SECTIONS;
  const result = { ...INITIAL_HOMEPAGE_SECTIONS };
  const sectionIds = Object.keys(INITIAL_HOMEPAGE_SECTIONS) as HomepageSectionId[];

  for (const id of sectionIds) {
    const currentSec = cmsConfig.homepageSections?.[id];
    const publishedSnapSec = cmsConfig.publishedHomepageSections?.[id];
    if (currentSec && currentSec.status === 'published') {
      result[id] = currentSec;
    } else if (publishedSnapSec) {
      result[id] = {
        ...publishedSnapSec,
        visible: publishedSnapSec.visible !== false,
        status: 'published',
      };
    }
  }
  return result;
}

/**
 * Returns ONLY published institutional page content for a given slug.
 * If a page is saved as 'draft', returns its last published snapshot so draft edits never appear publicly.
 */
export function getPublishedPageContent(
  cmsConfig: WebsiteCmsConfig | null | undefined,
  slug: CmsPublicPageSlug
): CmsInstitutionalPageContent {
  const fallback = INITIAL_CMS_PAGES[slug];
  if (!cmsConfig) return fallback;
  const current = cmsConfig.pages?.[slug];
  const publishedSnap = cmsConfig.publishedPages?.[slug];

  if (current && current.status === 'published') {
    return current;
  }
  if (publishedSnap) {
    return { ...publishedSnap };
  }
  return fallback;
}

/**
 * Returns ONLY explicitly approved & published public profiles for `/teachers` and `/administration`.
 * Never exposes private staff phone numbers, salaries, or unpublished records.
 */
export function getPublishedPublicProfiles(
  cmsConfig?: WebsiteCmsConfig | null,
  profileType?: 'teacher' | 'administration'
): CmsPublicProfile[] {
  const source =
    cmsConfig && Array.isArray(cmsConfig.publicProfiles)
      ? cmsConfig.publicProfiles
      : INITIAL_CMS_PUBLIC_PROFILES;
  return source
    .filter(
      (p) =>
        p &&
        p.status === 'published' &&
        (profileType === undefined || p.profileType === profileType)
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Returns ONLY published public events for `/events` and homepage events preview.
 * Strictly follows Phase 4 rule:
 * - Only `status === 'published'` events appear.
 * - When `cmsConfig.events` is configured, never injects stale demo banner slides so unpublishing an event removes it immediately.
 */
export function getPublishedPublicEvents(
  cmsConfig?: WebsiteCmsConfig | null,
  bannerSlides: BannerSlide[] = []
): CmsPublicEvent[] {
  const hasConfiguredEvents = Boolean(cmsConfig && Array.isArray(cmsConfig.events));
  const baseEvents = (hasConfiguredEvents ? cmsConfig!.events : INITIAL_CMS_PUBLIC_EVENTS).filter(
    (evt) => evt && evt.status === 'published'
  );

  const byId = new Map<string, CmsPublicEvent>();
  for (const evt of baseEvents) {
    byId.set(evt.id, evt);
  }

  if (!hasConfiguredEvents) {
    for (const slide of bannerSlides) {
      if (!slide || !slide.isActive || slide.category !== 'event') continue;
      const mappedId = `slide-evt-${slide.id}`;
      if (!byId.has(mappedId) && !byId.has(slide.id)) {
        const alreadyHasSameTitle = Array.from(byId.values()).some(
          (e) => e.titleBn.trim() === slide.titleBn.trim()
        );
        if (!alreadyHasSameTitle) {
          byId.set(mappedId, {
            id: mappedId,
            titleBn: slide.titleBn,
            titleEn: slide.titleEn,
            titleAr: slide.titleAr,
            descriptionBn: slide.descriptionBn,
            descriptionEn: slide.descriptionEn,
            descriptionAr: slide.descriptionAr,
            eventDate: slide.metaDate || '2026-11-15',
            category: 'event',
            badgeBn: slide.badgeBn,
            badgeEn: slide.badgeEn,
            badgeAr: slide.badgeAr,
            coverImageUrl: '',
            galleryImageUrls: [],
            status: 'published',
            updatedAt: '2026-10-25',
          });
        }
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

/**
 * Returns ONLY published gallery items sorted by displayOrder.
 */
export function getPublishedGalleryItems(
  cmsConfig?: WebsiteCmsConfig | null
): CmsGalleryItem[] {
  const source = cmsConfig?.galleryItems || INITIAL_CMS_GALLERY_ITEMS;
  return source
    .filter((item) => item && item.status === 'published')
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Returns published contact & footer configuration, falling back to published snapshot or verified settings.
 */
export function getPublishedContactFooter(
  cmsConfig?: WebsiteCmsConfig | null,
  settings?: InstitutionSettings
): CmsContactFooterConfig {
  const base =
    cmsConfig?.contactFooter?.status === 'published'
      ? cmsConfig.contactFooter
      : cmsConfig?.publishedContactFooter || INITIAL_CMS_CONTACT_FOOTER;

  const isNonEmpty = (val: string | undefined): val is string =>
    typeof val === 'string' && val.trim().length > 0;

  return {
    ...base,
    institutionNameBn: isNonEmpty(base.institutionNameBn)
      ? base.institutionNameBn
      : settings?.institutionNameBn || INITIAL_CMS_CONTACT_FOOTER.institutionNameBn,
    institutionNameEn: isNonEmpty(base.institutionNameEn)
      ? base.institutionNameEn
      : settings?.institutionNameEn || INITIAL_CMS_CONTACT_FOOTER.institutionNameEn,
    institutionNameAr: isNonEmpty(base.institutionNameAr)
      ? base.institutionNameAr
      : settings?.institutionNameAr || INITIAL_CMS_CONTACT_FOOTER.institutionNameAr,
    addressBn: isNonEmpty(base.addressBn)
      ? base.addressBn
      : settings?.addressBn || INITIAL_CMS_CONTACT_FOOTER.addressBn,
    phone: isNonEmpty(base.phone)
      ? base.phone
      : settings?.phone || INITIAL_CMS_CONTACT_FOOTER.phone,
    email: isNonEmpty(base.email)
      ? base.email
      : settings?.email || INITIAL_CMS_CONTACT_FOOTER.email,
  };
}

/**
 * Validates that an image URL or compressed thumbnail does not store a large raw base64 payload in Firestore.
 * Allows HTTPS URLs, relative asset paths, or small compressed thumbnails (<= 45KB), blocking oversized raw base64 strings.
 */
export function validateCmsImageUrl(url: string): {
  valid: boolean;
  reasonBn?: string;
  reasonEn?: string;
} {
  const trimmed = (url || '').trim();
  if (!trimmed) return { valid: true };

  if (trimmed.startsWith('data:image/')) {
    if (trimmed.length > 45000) {
      return {
        valid: false,
        reasonBn:
          'বড় আকারের কাঁচা Base64 ছবি সরাসরি Firestore ডকুমেন্টে সংরক্ষণ করা নিষিদ্ধ। অনুগ্রহ করে অনুমোদিত HTTPS ইমেজ লিংক ব্যবহার করুন অথবা কমপ্রেসড ছবি আপলোড করুন।',
        reasonEn:
          'Large raw Base64 images cannot be stored inside Firestore documents. Please use an approved HTTPS image URL or upload via Firebase Storage.',
      };
    }
    return { valid: true };
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
    return { valid: true };
  }

  return {
    valid: false,
    reasonBn: 'অনুগ্রহ করে একটি বৈধ ইমেজ URL (https://...) প্রদান করুন।',
    reasonEn: 'Please provide a valid image URL starting with https://.',
  };
}

export function computeCmsDashboardStats(
  cmsConfig: WebsiteCmsConfig,
  notices: Notice[]
): {
  publishedPagesCount: number;
  draftPagesCount: number;
  publishedNoticesCount: number;
  draftNoticesCount: number;
  upcomingEventsCount: number;
  draftEventsCount: number;
  publishedGalleryCount: number;
  draftGalleryCount: number;
  publishedProfilesCount: number;
  unpublishedProfilesCount: number;
  pendingPublicationTasksCount: number;
} {
  const allPages = Object.values(cmsConfig.pages || INITIAL_CMS_PAGES);
  const publishedPagesCount = allPages.filter((p) => p.status === 'published').length;
  const draftPagesCount = allPages.filter((p) => p.status === 'draft').length;

  const allHomepageSections = Object.values(
    cmsConfig.homepageSections || INITIAL_HOMEPAGE_SECTIONS
  );
  const draftHomepageCount = allHomepageSections.filter((s) => s.status === 'draft').length;

  let publishedNoticesCount = 0;
  // Private drafts stored in CMS config
  const cmsDraftNotices = Array.isArray(cmsConfig.draftNotices) ? cmsConfig.draftNotices : [];
  let draftNoticesCount = cmsDraftNotices.length;

  // Also include any legacy draft notice in the notices collection
  for (const n of notices || []) {
    const { cmsMeta } = decodeNoticeWithCmsMeta(n);
    if (cmsMeta.status === 'draft') {
      draftNoticesCount += 1;
    } else if (n.targetAudience === 'all') {
      publishedNoticesCount += 1;
    }
  }

  const events = cmsConfig.events || INITIAL_CMS_PUBLIC_EVENTS;
  const upcomingEventsCount = events.filter((e) => e.status === 'published').length;
  const draftEventsCount = events.filter((e) => e.status === 'draft').length;

  const gallery = cmsConfig.galleryItems || INITIAL_CMS_GALLERY_ITEMS;
  const publishedGalleryCount = gallery.filter((g) => g.status === 'published').length;
  const draftGalleryCount = gallery.filter((g) => g.status === 'draft').length;

  const profiles = cmsConfig.publicProfiles || INITIAL_CMS_PUBLIC_PROFILES;
  const publishedProfilesCount = profiles.filter((p) => p.status === 'published').length;
  const unpublishedProfilesCount = profiles.filter((p) => p.status === 'unpublished').length;

  const draftContactCount = cmsConfig.contactFooter?.status === 'draft' ? 1 : 0;

  const pendingPublicationTasksCount =
    draftPagesCount +
    draftHomepageCount +
    draftNoticesCount +
    draftEventsCount +
    draftGalleryCount +
    unpublishedProfilesCount +
    draftContactCount;

  return {
    publishedPagesCount,
    draftPagesCount,
    publishedNoticesCount,
    draftNoticesCount,
    upcomingEventsCount,
    draftEventsCount,
    publishedGalleryCount,
    draftGalleryCount,
    publishedProfilesCount,
    unpublishedProfilesCount,
    pendingPublicationTasksCount,
  };
}

/**
 * Builds a strictly sanitized public CMS snapshot (`PublicPublishedCmsSnapshot`) containing ONLY
 * approved, published fields for `settings/website-cms-public`.
 *
 * Security Guarantees:
 * - Zero `draftNotices`
 * - Zero `recentUpdates` (internal admin audit logs)
 * - Zero `draft` homepage sections, pages, events, gallery items, or contact/footer configs
 * - Zero `unpublished` teacher/administration profiles
 * - Only public (`targetAudience === 'all'`), `status === 'published'`, non-expired notices
 */
export function buildSanitizedPublicCmsSnapshot(
  cmsConfig: WebsiteCmsConfig,
  notices: Notice[] = [],
  settings?: InstitutionSettings
): PublicPublishedCmsSnapshot {
  const publishedHomepageSections = getPublishedHomepageSections(cmsConfig);

  const pageSlugs = Object.keys(INITIAL_CMS_PAGES) as CmsPublicPageSlug[];
  const publishedPages = { ...INITIAL_CMS_PAGES };
  for (const slug of pageSlugs) {
    publishedPages[slug] = getPublishedPageContent(cmsConfig, slug);
  }

  const publishedProfiles = getPublishedPublicProfiles(cmsConfig);
  const publishedEvents = getPublishedPublicEvents(cmsConfig);
  const publishedGallery = getPublishedGalleryItems(cmsConfig);
  const publishedContact: CmsContactFooterConfig = {
    ...getPublishedContactFooter(cmsConfig, settings),
    status: 'published',
  };

  const publishedNotices: Notice[] = getPublishedPublicNotices(notices).map(
    ({ notice, cmsMeta }) => ({
      id: notice.id,
      titleBn: notice.titleBn,
      titleEn: notice.titleEn || notice.titleBn,
      contentBn: notice.contentBn,
      targetAudience: 'all',
      targetClass: encodeNoticeTargetClassWithCmsMeta(notice.targetClass, {
        ...cmsMeta,
        status: 'published',
      }),
      priority: notice.priority,
      publishDate: notice.publishDate,
      authorId: 'public-cms',
    })
  );

  return {
    version: 1,
    id: PUBLIC_CMS_SETTINGS_DOC_ID,
    homepageSections: publishedHomepageSections,
    pages: publishedPages,
    publicProfiles: publishedProfiles,
    events: publishedEvents,
    galleryItems: publishedGallery,
    contactFooter: publishedContact,
    publishedNotices,
    publishedAt: cmsConfig.updatedAt || new Date().toISOString(),
  };
}

/**
 * Encodes a sanitized `PublicPublishedCmsSnapshot` into a Firestore `settings/website-cms-public`
 * document envelope that strictly satisfies `isValidInstitutionSettings` in `firestore.rules`.
 */
export function encodePublicCmsAsSettingsEnvelope(
  snapshot: PublicPublishedCmsSnapshot,
  authorId: string
): {
  institutionNameBn: string;
  institutionNameEn: string;
  institutionNameAr: string;
  academicYear: string;
  hijriYear: string;
  addressBn: string;
  phone: string;
  email: string;
  defaultLanguage: Language;
  activeDepartments: string;
  gradingSystem: string;
  authorId: string;
} {
  const safeAuthorId = (authorId || 'usr-admin-1').trim().slice(0, 120);
  const compactMeta = JSON.stringify({
    v: 1,
    t: snapshot.publishedAt || new Date().toISOString(),
  }).slice(0, 780);

  return {
    institutionNameBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা — পাবলিক ওয়েবসাইট স্ন্যাপশট',
    institutionNameEn: 'PUBLIC_WEBSITE_CMS_SNAPSHOT',
    institutionNameAr: 'المحتوى العام المنشور — مدرسة أم القرآن كاديت',
    academicYear: '2026-2027',
    hijriYear: '1447-1448 AH',
    addressBn: JSON.stringify(snapshot),
    phone: (snapshot.contactFooter?.phone || '+880 1711-984321').slice(0, 80),
    email: (snapshot.contactFooter?.email || 'office@ummulquranmadrasa.edu.bd').slice(0, 190),
    defaultLanguage: 'bn',
    activeDepartments: 'হিফযুল কুরআন, কওমি কিতাব বিভাগ, জেনারেল ক্যাডেট বিভাগ',
    gradingSystem: compactMeta,
    authorId: safeAuthorId,
  };
}

/**
 * Decodes `settings/website-cms-public` back into a strictly sanitized `PublicPublishedCmsSnapshot`.
 */
export function decodePublicCmsFromSettingsEnvelope(
  rawData: Record<string, unknown> | null | undefined,
  docId = PUBLIC_CMS_SETTINGS_DOC_ID
): PublicPublishedCmsSnapshot | null {
  if (!rawData || rawData.institutionNameEn !== 'PUBLIC_WEBSITE_CMS_SNAPSHOT') {
    return null;
  }
  try {
    const rawJson = String(rawData.addressBn || '');
    if (!rawJson.startsWith('{')) return null;
    const parsed = JSON.parse(rawJson) as Partial<PublicPublishedCmsSnapshot>;

    const homepageSections: Record<HomepageSectionId, CmsHomepageSectionConfig> = {
      ...INITIAL_HOMEPAGE_SECTIONS,
      ...(parsed.homepageSections || {}),
    };

    const pages: Record<CmsPublicPageSlug, CmsInstitutionalPageContent> = {
      ...INITIAL_CMS_PAGES,
      ...(parsed.pages || {}),
    };

    const publicProfiles = Array.isArray(parsed.publicProfiles)
      ? parsed.publicProfiles.filter((p) => p && p.status === 'published')
      : [];

    const events = Array.isArray(parsed.events)
      ? parsed.events.filter((e) => e && e.status === 'published')
      : [];

    const galleryItems = Array.isArray(parsed.galleryItems)
      ? parsed.galleryItems.filter((g) => g && g.status === 'published')
      : [];

    const contactFooter: CmsContactFooterConfig = {
      ...INITIAL_CMS_CONTACT_FOOTER,
      ...(parsed.contactFooter || {}),
      status: 'published',
    };

    const publishedNotices: Notice[] = Array.isArray(parsed.publishedNotices)
      ? parsed.publishedNotices.filter((n) => n && n.targetAudience === 'all')
      : [];

    return {
      version: 1,
      id: docId,
      homepageSections,
      pages,
      publicProfiles,
      events,
      galleryItems,
      contactFooter,
      publishedNotices,
      publishedAt: parsed.publishedAt || INITIAL_WEBSITE_CMS_CONFIG.updatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Converts a `PublicPublishedCmsSnapshot` into a read-only `WebsiteCmsConfig` object
 * suitable for rendering `PublicHomePage` and `PublicPages` without any private or draft fields.
 */
export function publicSnapshotToWebsiteCmsConfig(
  snapshot: PublicPublishedCmsSnapshot
): WebsiteCmsConfig {
  return {
    id: snapshot.id || PUBLIC_CMS_SETTINGS_DOC_ID,
    homepageSections: snapshot.homepageSections,
    publishedHomepageSections: snapshot.homepageSections,
    pages: snapshot.pages,
    publishedPages: snapshot.pages,
    publicProfiles: snapshot.publicProfiles.filter((p) => p && p.status === 'published'),
    events: snapshot.events.filter((e) => e && e.status === 'published'),
    galleryItems: snapshot.galleryItems.filter((g) => g && g.status === 'published'),
    contactFooter: { ...snapshot.contactFooter, status: 'published' },
    publishedContactFooter: { ...snapshot.contactFooter, status: 'published' },
    draftNotices: [],
    recentUpdates: [],
    updatedAt: snapshot.publishedAt,
    updatedBy: 'Public Snapshot',
  };
}

