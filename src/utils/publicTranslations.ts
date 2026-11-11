import type { Language, Notice } from '../types/madrasa';

/**
 * Trilingual selector helper for Bengali ('bn'), English ('en'), and Arabic ('ar').
 * Defaults to Bengali ('bn') if an unexpected value is encountered.
 */
export function tr(language: Language, bn: string, en: string, ar: string): string {
  if (language === 'ar') return ar;
  if (language === 'en') return en;
  return bn;
}

const DEPARTMENT_TOKEN_MAP: Record<string, { bn: string; en: string; ar: string }> = {
  'হিফযুল কুরআন': {
    bn: 'হিফযুল কুরআন',
    en: 'Hifzul Quran',
    ar: 'تحفيظ القرآن الكريم',
  },
  'হিফযুল কুরআন বিভাগ': {
    bn: 'হিফযুল কুরআন বিভাগ',
    en: 'Hifzul Quran Department',
    ar: 'قسم تحفيظ القرآن الكريم',
  },
  'কওমি কিতাব বিভাগ': {
    bn: 'কওমি কিতাব বিভাগ',
    en: 'Qawmi Kitab Department',
    ar: 'قسم الكتب الشرعية (القومي)',
  },
  'কিতাব বিভাগ': {
    bn: 'কিতাব বিভাগ',
    en: 'Qawmi Kitab Department',
    ar: 'قسم الكتب الشرعية',
  },
  'জেনারেল ক্যাডেট বিভাগ': {
    bn: 'জেনারেল ক্যাডেট বিভাগ',
    en: 'General Cadet Department',
    ar: 'القسم الأكاديمي العام (الكاديت)',
  },
  'জেনারেল ক্যাডেট': {
    bn: 'জেনারেল ক্যাডেট',
    en: 'General Cadet',
    ar: 'الأكاديمي العام (الكاديت)',
  },
};

/**
 * Safely localizes the comma-separated activeDepartments string from Settings.
 * Known institutional department names are translated into the active language;
 * any custom user-added department names are preserved intact.
 */
export function localizeActiveDepartments(raw: string | undefined, language: Language): string {
  const source = (raw || 'হিফযুল কুরআন, কওমি কিতাব বিভাগ, জেনারেল ক্যাডেট বিভাগ').trim();
  if (language === 'bn') return source;

  const separator = language === 'ar' ? '، ' : ', ';
  return source
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      const mapped = DEPARTMENT_TOKEN_MAP[trimmed];
      if (!mapped) return trimmed;
      return language === 'ar' ? mapped.ar : mapped.en;
    })
    .filter(Boolean)
    .join(separator);
}

const KNOWN_ADDRESS_MAP: Record<string, { bn: string; en: string; ar: string }> = {
  'বাড়ি ১৪, রোড ৭, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ': {
    bn: 'বাড়ি ১৪, রোড ৭, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ',
    en: 'House 14, Road 7, Sector 3, Uttara, Dhaka-1230, Bangladesh',
    ar: 'منزل ١٤، طريق ٧، قطاع ٣، أوتارا، دكا-١٢٣٠، بنغلاديش',
  },
  'উত্তরা, ঢাকা, বাংলাদেশ': {
    bn: 'উত্তরা, ঢাকা, বাংলাদেশ',
    en: 'Uttara, Dhaka, Bangladesh',
    ar: 'أوتارا، دكا، بنغلاديش',
  },
};

/**
 * Safely localizes the institutional campus address if it matches the known verified
 * institutional default address; otherwise preserves the custom Firestore address string.
 */
export function localizeAddress(raw: string | undefined, language: Language): string {
  const trimmed = (raw || 'বাড়ি ১৪, রোড ৭, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ').trim();
  const mapped = KNOWN_ADDRESS_MAP[trimmed];
  if (!mapped) return trimmed;
  return tr(language, mapped.bn, mapped.en, mapped.ar);
}

const KNOWN_GRADING_SYSTEM_MAP: Record<string, { bn: string; en: string; ar: string }> = {
  'GPA 5.00 ও মুমতাজ-ভিত্তিক সমন্বিত মূল্যায়ন': {
    bn: 'GPA 5.00 ও মুমতাজ-ভিত্তিক সমন্বিত মূল্যায়ন',
    en: 'Integrated GPA 5.00 & Mumtaz Evaluation Framework',
    ar: 'نظام التقييم المتكامل (تقدير ممتاز ومعدل 5.00)',
  },
  'Mumtaz (80%+), Jayyid Jiddan (70-79%), Jayyid (60-69%), Maqbul (50-59%), Pass (33-49%)': {
    bn: 'মুমতাজ (৮০%+), জায়্যিদ জিদ্দান (৭০-৭৯%), জায়্যিদ (৬০-৬৯%), মাকবুল (৫০-৫৯%), পাস (৩৩-৪৯%)',
    en: 'Mumtaz (80%+), Jayyid Jiddan (70-79%), Jayyid (60-69%), Maqbul (50-59%), Pass (33-49%)',
    ar: 'ممتاز (80% فأعلى)، جيد جداً (70-79%)، جيد (60-69%)، مقبول (50-59%)، ناجح (33-49%)',
  },
};

/**
 * Safely localizes the institutional grading system description when it matches the default policy.
 */
export function localizeGradingSystem(raw: string | undefined, language: Language): string {
  const trimmed = (raw || 'GPA 5.00 ও মুমতাজ-ভিত্তিক সমন্বিত মূল্যায়ন').trim();
  const mapped = KNOWN_GRADING_SYSTEM_MAP[trimmed];
  if (!mapped) return trimmed;
  return tr(language, mapped.bn, mapped.en, mapped.ar);
}

const GRADE_TIER_AR_MAP: Record<string, string> = {
  'A+': 'ممتاز (Mumtaz)',
  'A': 'جيد جداً (Jayyid Jiddan)',
  'A-': 'جيد (Jayyid)',
  'B': 'مقبول (Maqbul)',
  'C': 'ناجح (Pass)',
  'F': 'راسب (Rasib)',
};

/**
 * Returns the localized grade tier label in Bengali, English, or Arabic.
 */
export function localizeGradeTierLabel(
  letterGrade: string,
  labelBn: string,
  labelEn: string,
  language: Language
): string {
  if (language === 'bn') return labelBn;
  if (language === 'en') return labelEn;
  return GRADE_TIER_AR_MAP[letterGrade] || labelEn;
}

const EXAM_FIELD_MAP: Record<string, { bn: string; en: string; ar: string }> = {
  '১ম সাময়িক পরীক্ষা ২০২৬': {
    bn: '১ম সাময়িক পরীক্ষা ২০২৬',
    en: 'First Term Examination 2026',
    ar: 'اختبار الفصل الدراسي الأول ٢٠٢٦',
  },
  'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬ (2nd Term)': {
    bn: 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬ (2nd Term)',
    en: 'Second Term Examination 2026 (2nd Term)',
    ar: 'اختبار الفصل الدراسي الثاني ٢٠٢٦',
  },
  'অর্ধ-বার্ষিক পরীক্ষা ২০২৬': {
    bn: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
    en: 'Half-Yearly Examination 2026',
    ar: 'اختبار نصف السنة ٢٠٢٦',
  },
  'বার্ষিক পরীক্ষা ২০২৬': {
    bn: 'বার্ষিক পরীক্ষা ২০২৬',
    en: 'Annual Examination 2026',
    ar: 'الاختبار السنوي النهائي ٢٠٢٦',
  },
  'হিফযুল কুরআন': {
    bn: 'হিফযুল কুরআন',
    en: 'Hifzul Quran',
    ar: 'تحفيظ القرآن الكريم',
  },
  'হিফয তাকমীল (খতম বর্ষ)': {
    bn: 'হিফয তাকমীল (খতম বর্ষ)',
    en: 'Hifz Takmil (Completion Year)',
    ar: 'تكميل الحفظ (سنة الختم)',
  },
  'মিযান ও মুনশাইব (প্রথম বর্ষ)': {
    bn: 'মিযান ও মুনশাইব (প্রথম বর্ষ)',
    en: 'Mizan & Munshaib (First Year)',
    ar: 'الميزان والمنشعب (السنة الأولى)',
  },
  'ক্যাডেট সপ্তম শ্রেণি (Class 7)': {
    bn: 'ক্যাডেট সপ্তম শ্রেণি (Class 7)',
    en: 'General Cadet — Class 7',
    ar: 'القسم العام (الكاديت) — الصف السابع',
  },
  'কিতাব বিভাগ - মিজান': {
    bn: 'কিতাব বিভাগ - মিজান',
    en: 'Kitab Department — Mizan',
    ar: 'قسم الكتب الشرعية — ميزان',
  },
  'ক্যাডেট - ষষ্ঠ শ্রেণি': {
    bn: 'ক্যাডেট - ষষ্ঠ শ্রেণি',
    en: 'General Cadet — Class 6',
    ar: 'القسم العام (الكاديت) — الصف السادس',
  },
  'ক শাখা': {
    bn: 'ক শাখা',
    en: 'Section A',
    ar: 'الشعبة أ',
  },
  'ক-শাখা (Main)': {
    bn: 'ক-শাখা (Main)',
    en: 'Section A (Main)',
    ar: 'الشعبة أ (الرئيسية)',
  },
  'ক্যাডেট-এ (Cadet-A)': {
    bn: 'ক্যাডেট-এ (Cadet-A)',
    en: 'Cadet Section A',
    ar: 'شعبة الكاديت أ',
  },
  'খ শাখা': {
    bn: 'খ শাখা',
    en: 'Section B',
    ar: 'الشعبة ب',
  },
  'হিফয (তিলাওয়াত ও ইয়াদ)': {
    bn: 'হিফয (তিলাওয়াত ও ইয়াদ)',
    en: 'Hifz (Recitation & Memorization)',
    ar: 'الحفظ (التلاوة والاستظهار)',
  },
  'হিফযুল কুরআন (পূর্ণ ৩০ পারা তিলাওয়াত ও তাজবীদ)': {
    bn: 'হিফযুল কুরআন (পূর্ণ ৩০ পারা তিলাওয়াত ও তাজবীদ)',
    en: 'Hifzul Quran (Complete 30 Juz Recitation & Tajweed)',
    ar: 'حفظ القرآن الكريم (تلاوة وتجويد ٣٠ جزءاً كاملاً)',
  },
  'তাজবীদ ও মাখরাজ': {
    bn: 'তাজবীদ ও মাখরাজ',
    en: 'Tajweed & Makharij',
    ar: 'التجويد ومخارج الحروف',
  },
  'তাজবীদ ও মাখরাজ (Tajweed & Makharij)': {
    bn: 'তাজবীদ ও মাখরাজ (Tajweed & Makharij)',
    en: 'Tajweed & Makharij (Phonetics)',
    ar: 'التجويد ومخارج الحروف',
  },
  'আকাইদ ও মাসনূন দোয়া (Aqeedah & Masnoon Dua)': {
    bn: 'আকাইদ ও মাসনূন দোয়া (Aqeedah & Masnoon Dua)',
    en: 'Aqeedah & Masnoon Supplications',
    ar: 'العقيدة والأدعية المسنونة',
  },
  'আদব ও আখলাক': {
    bn: 'আদব ও আখলাক',
    en: 'Islamic Etiquette & Akhlaq',
    ar: 'الآداب والأخلاق الإسلامية',
  },
  'মিজানুস সরফ': {
    bn: 'মিজানুস সরফ',
    en: 'Mizanus Sarf (Arabic Morphology)',
    ar: 'ميزان الصرف',
  },
  'মিযানুস সরফ ও তারকীব': {
    bn: 'মিযানুস সরফ ও তারকীব',
    en: 'Mizanus Sarf & Tarkib (Morphology & Analysis)',
    ar: 'ميزان الصرف والتركيب',
  },
  'নাহবেমীর': {
    bn: 'নাহবেমীর',
    en: 'Nahw Meer (Arabic Syntax)',
    ar: 'نحو مير',
  },
  'নাহবেমীর ও আরবি ব্যাকরণ (Nahw)': {
    bn: 'নাহবেমীর ও আরবি ব্যাকরণ (Nahw)',
    en: 'Nahw Meer & Arabic Grammar',
    ar: 'نحو مير والقواعد العربية',
  },
  'তারীখুল ইসলাম ও সীরাত (Seerah & History)': {
    bn: 'তারীখুল ইসলাম ও সীরাত (Seerah & History)',
    en: 'Islamic History & Prophetic Seerah',
    ar: 'تاريخ الإسلام والسيرة النبوية',
  },
  'এসো আরবি শিখি': {
    bn: 'এসো আরবি শিখি',
    en: 'Applied Arabic Language',
    ar: 'اللغة العربية التطبيقية',
  },
  'ফিকহ (নূরুল ঈযাহ)': {
    bn: 'ফিকহ (নূরুল ঈযাহ)',
    en: 'Fiqh (Nurul Idah)',
    ar: 'الفقه (نور الإيضاح)',
  },
  'কুরআন ও তাজবীদ': {
    bn: 'কুরআন ও তাজবীদ',
    en: 'Quran & Tajweed',
    ar: 'القرآن الكريم والتجويد',
  },
  'কুরআন ও আকাইদ-ফিকহ (Quran & Aqeedah)': {
    bn: 'কুরআন ও আকাইদ-ফিকহ (Quran & Aqeedah)',
    en: 'Quran, Aqeedah & Fiqh',
    ar: 'القرآن الكريم والعقيدة والفقه',
  },
  'বাংলা': {
    bn: 'বাংলা',
    en: 'Bengali Language & Literature',
    ar: 'اللغة البنغالية وآدابها',
  },
  'ইংরেজি': {
    bn: 'ইংরেজি',
    en: 'English Language',
    ar: 'اللغة الإنجليزية',
  },
  'ইংরেজি ও আরবি সাহিত্য (English & Arabic)': {
    bn: 'ইংরেজি ও আরবি সাহিত্য (English & Arabic)',
    en: 'English & Arabic Literature',
    ar: 'اللغة الإنجليزية والأدب العربي',
  },
  'গণিত': {
    bn: 'গণিত',
    en: 'Mathematics',
    ar: 'الرياضيات',
  },
  'গণিত (Mathematics)': {
    bn: 'গণিত (Mathematics)',
    en: 'Mathematics',
    ar: 'الرياضيات',
  },
  'সাধারণ বিজ্ঞান ও আইসিটি': {
    bn: 'সাধারণ বিজ্ঞান ও আইসিটি',
    en: 'General Science & ICT',
    ar: 'العلوم العامة وتقنية المعلومات',
  },
};

/**
 * Safely localizes known exam setup names, class names, sections, and subject names
 * while preserving custom user-created exam setups unchanged.
 */
export function localizeExamSetupField(raw: string | undefined, language: Language): string {
  const trimmed = (raw || '').trim();
  if (!trimmed || language === 'bn') return trimmed;
  const mapped = EXAM_FIELD_MAP[trimmed];
  if (!mapped) return trimmed;
  return language === 'ar' ? mapped.ar : mapped.en;
}

const KNOWN_NOTICE_MAP: Record<
  string,
  {
    titleEn: string;
    titleAr: string;
    contentEn: string;
    contentAr: string;
  }
> = {
  '১ম সাময়িক পরীক্ষা ২০২৬-এর সময়সূচি প্রকাশ': {
    titleEn: 'First Term Examination 2026 Schedule Published',
    titleAr: 'إعلان جدول اختبارات الفصل الدراسي الأول ٢٠٢٦',
    contentEn:
      'The First Term Examination of Ummul Quran Cadet Madrasa will commence on 10 May 2026, InshaAllah. Guardians are requested to clear all outstanding dues and collect the admit card by 5 May.',
    contentAr:
      'تبدأ اختبارات الفصل الدراسي الأول في مدرسة أم القرآن كاديت يوم ١٠ مايو ٢٠٢٦ إن شاء الله. يرجى من أولياء الأمور تسديد الرسوم المستحقة واستلام بطاقة الدخول قبل ٥ مايو.',
  },
  'আসন্ন পবিত্র ঈদ-উল-ফিতর উপলক্ষে মাদ্রাসা ছুটি প্রসঙ্গে': {
    titleEn: 'Madrasa Holiday Notice for Upcoming Eid-ul-Fitr',
    titleAr: 'إشعار عطلة المدرسة بمناسبة عيد الفطر المبارك',
    contentEn:
      'All academic and residential activities of the madrasa will remain closed for Eid-ul-Fitr. Residential cadets must return to the hostel by Maghrib on the designated reopening day.',
    contentAr:
      'تُعلّق جميع الأنشطة التعليمية والسكنية بالمدرسة بمناسبة عيد الفطر المبارك، ويلتزم الطلاب المقيمون بالعودة إلى السكن الداخلي قبل صلاة المغرب في اليوم المحدد لاستئناف الدراسة.',
  },
  'শুক্রবার সাপ্তাহিক তারবিয়াতী জলসা ও অভিভাবক সাক্ষাৎ': {
    titleEn: 'Weekly Friday Tarbiyah Session & Guardian Visiting Hours',
    titleAr: 'الجلسة التربوية الأسبوعية يوم الجمعة ومواعيد زيارة أولياء الأمور',
    contentEn:
      'After Asr prayers every Friday, a special Husnul Khuluq and Sunnah Masnunah session is held. Guardians may meet residential students between 4:00 PM and 5:30 PM on Fridays.',
    contentAr:
      'تُعقد جلسة تربوية خاصة في الآداب الإسلامية والسنن المسنونة كل يوم جمعة بعد صلاة العصر. ويُسمح لأولياء الأمور بزيارة الطلاب المقيمين يوم الجمعة من الساعة ٤:٠٠ عصراً حتى ٥:٣٠ مساءً.',
  },
  'আসন্ন বার্ষিক হিফযুল কুরআন প্রতিযোগিতা ও দস্তারবন্দী সম্মেলন ২০২৬': {
    titleEn: 'Annual Hifz-ul-Quran Competition & Dastarbandi Convocation 2026',
    titleAr: 'مسابقة حفظ القرآن الكريم السنوية وحفل تكريم الحفاظ ٢٠٢٦',
    contentEn:
      'The Annual Hifz-ul-Quran Competition and Dastarbandi Convocation for graduating Huffaz will be held on Sunday, 15 November 2026 on the madrasa campus. All guardians and well-wishers are cordially invited.',
    contentAr:
      'تُقام مسابقة حفظ القرآن الكريم السنوية وحفل تتويج الحفاظ الخاتمين (الدستاربندي) يوم الأحد ١٥ نوفمبر ٢٠٢٦ في رحاب المدرسة. نرحب بحضور جميع أولياء الأمور والمحبين.',
  },
  'শীতকালীন রুটিন পরিবর্তন ও আবাসিক ছাত্রদের কম্বল/শীতবস্ত্র প্রসঙ্গে': {
    titleEn: 'Winter Schedule Adjustment & Residential Bedding Notice',
    titleAr: 'تعديل الجدول الشتوي وإشعار المستلزمات الشتوية للطلاب المقيمين',
    contentEn:
      'Starting 1 November, Fajr congregation and morning Sabaq Halaqah timings will follow the winter schedule. Guardians of residential students are requested to deliver designated winter clothing to the hostel within the coming week.',
    contentAr:
      'ابتداءً من ١ نوفمبر، سيتم العمل بالجدول الشتوي لصلاة الفجر وحلقات التسميع الصباحية. يرجى من أولياء أمور الطلاب المقيمين تسليم الملابس والأغطية الشتوية المحددة إلى السكن الداخلي خلال الأسبوع القادم.',
  },
  'অক্টোবর ২০২৬ মাসের আবাসিক খোরাকি ও মাসিক বেতন পরিশোধের শেষ তারিখ': {
    titleEn: 'October 2026 Boarding Mess & Tuition Fee Payment Deadline',
    titleAr: 'الموعد النهائي لسداد رسوم الدراسة والإعاشة لشهر أكتوبر ٢٠٢٦',
    contentEn:
      'All guardians are informed to clear the October 2026 monthly tuition and residential boarding fees by 25 October at the accounts office or via approved bKash/bank channels and collect the official receipt.',
    contentAr:
      'نحيط جميع أولياء الأمور علماً بضرورة سداد الرسوم الدراسية الشهرية ورسوم الإعاشة الداخلية لشهر أكتوبر ٢٠٢٦ في موعد أقصاه ٢٥ أكتوبر لدى قسم الحسابات أو عبر القنوات المعتمدة واستلام الإيصال الرسمي.',
  },
};

const TARGET_CLASS_MAP: Record<string, { bn: string; en: string; ar: string }> = {
  'সকল শ্রেণি ও বিভাগ': {
    bn: 'সকল শ্রেণি ও বিভাগ',
    en: 'All Classes & Departments',
    ar: 'جميع الصفوف والأقسام',
  },
  'সকল বিভাগ': {
    bn: 'সকল বিভাগ',
    en: 'All Departments',
    ar: 'جميع الأقسام',
  },
  'সকল জামাত': {
    bn: 'সকল জামাত',
    en: 'All Classes',
    ar: 'جميع الصفوف والمراحل',
  },
  'আবাসিক সকল জামাত': {
    bn: 'আবাসিক সকল জামাত',
    en: 'All Residential Classes',
    ar: 'جميع صفوف القسم الداخلي',
  },
  'হিফয ও কিতাব বিভাগ': {
    bn: 'হিফয ও কিতাব বিভাগ',
    en: 'Hifz & Kitab Departments',
    ar: 'قسما التحفيظ والكتب الشرعية',
  },
};

/**
 * Safely localizes a Notice record for display on the public website.
 * Uses `notice.titleEn` when available, translates known verified seed notices,
 * and falls back cleanly to the stored Bengali notice content for custom notices.
 */
export function localizeNoticeRecord(
  notice: Notice,
  language: Language
): { title: string; content: string; targetClass: string; attachmentUrl?: string } {
  const rawTarget = (notice.targetClass || '').trim();
  const [cleanClassPart, encodedCmsPart] = rawTarget.split(' ||CMS:');
  const cleanTarget = (cleanClassPart || '').trim();

  let customTitleAr = '';
  let customContentEn = '';
  let customContentAr = '';
  let attachmentUrl = '';

  if (encodedCmsPart) {
    try {
      const parsed = JSON.parse(encodedCmsPart) as {
        titleAr?: string;
        contentEn?: string;
        contentAr?: string;
        attachmentUrl?: string;
      };
      customTitleAr = (parsed.titleAr || '').trim();
      customContentEn = (parsed.contentEn || '').trim();
      customContentAr = (parsed.contentAr || '').trim();
      attachmentUrl = (parsed.attachmentUrl || '').trim();
    } catch {
      // ignore invalid JSON suffix
    }
  }

  const mappedTarget = TARGET_CLASS_MAP[cleanTarget];
  const targetClass = mappedTarget
    ? tr(language, mappedTarget.bn, mappedTarget.en, mappedTarget.ar)
    : cleanTarget || tr(language, 'সকল বিভাগ', 'All Departments', 'جميع الأقسام');

  if (language === 'bn') {
    return {
      title: notice.titleBn,
      content: notice.contentBn,
      targetClass,
      ...(attachmentUrl ? { attachmentUrl } : {}),
    };
  }

  const mappedNotice = KNOWN_NOTICE_MAP[notice.titleBn.trim()];
  if (language === 'en') {
    return {
      title: notice.titleEn || mappedNotice?.titleEn || notice.titleBn,
      content: customContentEn || mappedNotice?.contentEn || notice.contentBn,
      targetClass,
      ...(attachmentUrl ? { attachmentUrl } : {}),
    };
  }

  return {
    title: customTitleAr || mappedNotice?.titleAr || notice.titleEn || notice.titleBn,
    content: customContentAr || mappedNotice?.contentAr || customContentEn || notice.contentBn,
    targetClass,
    ...(attachmentUrl ? { attachmentUrl } : {}),
  };
}


