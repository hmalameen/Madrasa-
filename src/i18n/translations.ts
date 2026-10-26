import type { Department, Language, ModuleId, UserRole } from '../types/madrasa';

export interface TranslationDictionary {
  institutionName: string;
  institutionSubtitle: string;
  countryCity: string;
  academicSessionLabel: string;
  hijriYearLabel: string;
  currencyCode: string;
  loginTitle: string;
  loginSubtitle: string;
  signInWithGoogle: string;
  sandboxPreviewTitle: string;
  sandboxPreviewDesc: string;
  enterAsRole: string;
  liveFirestoreConnected: string;
  sandboxDemoBanner: string;
  syncSeedToFirestore: string;
  syncingText: string;
  signOut: string;
  switchRolePreview: string;
  navModules: Record<ModuleId, string>;
  roles: Record<UserRole, string>;
  departments: Record<Department, string>;
  common: {
    searchPlaceholder: string;
    allDepartments: string;
    allClasses: string;
    addRecord: string;
    save: string;
    cancel: string;
    delete: string;
    confirmDelete: string;
    edit: string;
    viewDetails: string;
    print: string;
    exportCsv: string;
    status: string;
    actions: string;
    demoTag: string;
    persistedTag: string;
    noRecordsFound: string;
    loadingRecords: string;
    requiredFieldError: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  bn: {
    institutionName: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা',
    institutionSubtitle: 'কওমি, হিফযুল কুরআন ও আধুনিক জেনারেল শিক্ষার সমন্বিত দ্বীনি শিক্ষাপ্রতিষ্ঠান',
    countryCity: 'ঢাকা, বাংলাদেশ · সময়সূচি: Asia/Dhaka (BDT ৳)',
    academicSessionLabel: 'শিক্ষাবর্ষ: ২০২৬-২০২৭ ঈসায়ী',
    hijriYearLabel: '১৪৪৭-১৪৪৮ হিজরি',
    currencyCode: 'BDT (৳)',
    loginTitle: 'প্রশাসনিক ও একাডেমিক পোর্টাল',
    loginSubtitle:
      'অনুমোদিত মুহতামিম, শিক্ষক, হিসাবরক্ষক, আবাসিক তত্ত্বাবধায়ক এবং অভিভাবকদের জন্য সুরক্ষিত প্রবেশদ্বার।',
    signInWithGoogle: 'গুগল অ্যাকাউন্ট দিয়ে লগইন করুন (Firebase Auth)',
    sandboxPreviewTitle: 'ভূমিকাভিত্তিক প্রিভিউ ও ডেমো মোড (Role Sandbox)',
    sandboxPreviewDesc:
      'গুগল লগইন ছাড়াও প্রতিটি রোলের ড্যাশবোর্ড, অনুমতি ও কর্মপ্রবাহ তাৎক্ষণিক পরীক্ষা করতে নিচের যেকোনো রোল নির্বাচন করুন:',
    enterAsRole: 'হিসেবে প্রবেশ করুন',
    liveFirestoreConnected: 'লাইভ ক্লাউড ফায়ারস্টোর সংযুক্ত',
    sandboxDemoBanner:
      'ডেমো প্রিভিউ মোড সক্রিয় — স্থায়ীভাবে ক্লাউড ডাটাবেসে সংরক্ষণের জন্য গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন।',
    syncSeedToFirestore: 'প্রাথমিক ডেটা ফায়ারস্টোরে সংরক্ষণ করুন',
    syncingText: 'সংরক্ষণ হচ্ছে...',
    signOut: 'লগআউট',
    switchRolePreview: 'রোল পরিবর্তন (প্রিভিউ)',
    navModules: {
      dashboard: 'ড্যাশবোর্ড সারসংক্ষেপ',
      admissions: 'অনলাইন ভর্তি ও অনুমোদন',
      students: 'শিক্ষার্থী ব্যবস্থাপনা',
      staff: 'শিক্ষক ও স্টাফ',
      attendance: 'দৈনিক হাজিরা',
      exams: 'পরীক্ষা ও ফলাফল',
      fees: 'ফি ও হিসাবরক্ষণ',
      hifz: 'হিফয অগ্রগতি (সবক)',
      residential: 'আবাসিক ও ছুটি ব্যবস্থাপনা',
      payroll: 'বেতন ও পে-রোল',
      student_portal: 'শিক্ষার্থী পোর্টাল',
      guardian: 'অভিভাবক পোর্টাল',
      notices: 'নোটিশ ও ঘোষণা',
      reports: 'প্রতিবেদন ও CSV',
      settings: 'প্রতিষ্ঠান সেটিংস',
    },
    roles: {
      super_admin: 'সুপার অ্যাডমিন (Super Admin)',
      muhtamim: 'মুহতামিম / পরিচালক',
      teacher: 'উস্তায / শিক্ষক',
      accountant: 'হিসাবরক্ষক (Accountant)',
      residential_supervisor: 'আবাসিক তত্ত্বাবধায়ক (নেগরান)',
      guardian: 'অভিভাবক (Guardian)',
      student: 'শিক্ষার্থী (Student)',
      staff: 'দাপ্তরিক স্টাফ (Staff)',
    },
    departments: {
      hifz: 'হিফযুল কুরআন বিভাগ',
      qawmi: 'কওমি কিতাব বিভাগ',
      general: 'জেনারেল ও ক্যাডেট বিভাগ',
    },
    common: {
      searchPlaceholder: 'নাম, দাখেলা নম্বর বা মোবাইল দিয়ে খুঁজুন...',
      allDepartments: 'সকল বিভাগ',
      allClasses: 'সকল জামাত / শ্রেণি',
      addRecord: 'নতুন সংযোজন',
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল',
      delete: 'মুছে ফেলুন',
      confirmDelete: 'নিশ্চিত মুছে ফেলুন',
      edit: 'সম্পাদনা',
      viewDetails: 'বিস্তারিত',
      print: 'প্রিন্ট করুন',
      exportCsv: 'CSV ডাউনলোড',
      status: 'অবস্থা',
      actions: 'কার্যক্রম',
      demoTag: 'নমুনা ডেটা',
      persistedTag: 'ফায়ারস্টোর রেকর্ড',
      noRecordsFound: 'কোনো তথ্য পাওয়া যায়নি।',
      loadingRecords: 'তথ্য লোড হচ্ছে...',
      requiredFieldError: 'অনুগ্রহ করে সকল আবশ্যক ঘর সঠিকভাবে পূরণ করুন।',
    },
  },
  en: {
    institutionName: 'Ummul Quran Cadet Madrasa',
    institutionSubtitle: 'Integrated Boys Institution for Qawmi, Hifz-ul-Quran & General Education',
    countryCity: 'Dhaka, Bangladesh · Timezone: Asia/Dhaka (BDT ৳)',
    academicSessionLabel: 'Academic Session: 2026–2027',
    hijriYearLabel: '1447–1448 Hijri',
    currencyCode: 'BDT (৳)',
    loginTitle: 'Administrative & Academic Portal',
    loginSubtitle:
      'Authorized access for Muhtamim, Asatidhah, Accountants, Residential Supervisors, and Guardians.',
    signInWithGoogle: 'Sign in with Google (Firebase Auth)',
    sandboxPreviewTitle: 'Role-Based Interactive Preview (Sandbox)',
    sandboxPreviewDesc:
      'Select any role below to inspect role-scoped dashboards, permissions, and workflows immediately:',
    enterAsRole: 'Enter as',
    liveFirestoreConnected: 'Live Cloud Firestore Connected',
    sandboxDemoBanner:
      'Role Preview Mode Active — Sign in with Google to persist changes to Cloud Firestore.',
    syncSeedToFirestore: 'Sync Reference Records to Firestore',
    syncingText: 'Syncing...',
    signOut: 'Sign Out',
    switchRolePreview: 'Switch Role View',
    navModules: {
      dashboard: 'Dashboard Overview',
      admissions: 'Online Admission & Approval',
      students: 'Student Management',
      staff: 'Teachers & Staff',
      attendance: 'Daily Attendance',
      exams: 'Exams & Results',
      fees: 'Fees & Finance',
      hifz: 'Hifz Progress',
      residential: 'Residential & Leave',
      payroll: 'Staff Payroll',
      student_portal: 'Student Portal',
      guardian: 'Guardian Portal',
      notices: 'Notices & Circulars',
      reports: 'Reports & Export',
      settings: 'Institution Settings',
    },
    roles: {
      super_admin: 'Super Administrator',
      muhtamim: 'Madrasa Director (Muhtamim)',
      teacher: 'Teacher (Ustadh)',
      accountant: 'Accountant',
      residential_supervisor: 'Residential Supervisor',
      guardian: 'Guardian',
      student: 'Student',
      staff: 'Administrative Staff',
    },
    departments: {
      hifz: 'Hifz-ul-Quran Dept.',
      qawmi: 'Qawmi Kitab Dept.',
      general: 'General Cadet Dept.',
    },
    common: {
      searchPlaceholder: 'Search by name, admission no, or phone...',
      allDepartments: 'All Departments',
      allClasses: 'All Classes / Jamats',
      addRecord: 'Add New Record',
      save: 'Save Record',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Confirm Delete',
      edit: 'Edit',
      viewDetails: 'Details',
      print: 'Print Sheet',
      exportCsv: 'Export CSV',
      status: 'Status',
      actions: 'Actions',
      demoTag: 'Demo Data',
      persistedTag: 'Firestore Saved',
      noRecordsFound: 'No matching records found.',
      loadingRecords: 'Loading institutional records...',
      requiredFieldError: 'Please complete all required fields accurately.',
    },
  },
  ar: {
    institutionName: 'مدرسة أم القرآن كاديت الإسلامية',
    institutionSubtitle: 'مؤسسة تعليمية للبنين تجمع بين التعليم القومي وتحفيظ القرآن الكريم والتعليم العام',
    countryCity: 'دكا، بنغلاديش · التوقيت: آسيا/دكا (تاكا بنغلاديشية ৳)',
    academicSessionLabel: 'العام الدراسي: ٢٠٢٦-٢٠٢٧ م',
    hijriYearLabel: '١٤٤٧-١٤٤٨ هـ',
    currencyCode: 'BDT (৳)',
    loginTitle: 'البوابة الإدارية والأكاديمية',
    loginSubtitle:
      'دخول مصرح به لمدير المدرسة (المهتمم)، الأساتذة، المحاسبين، مشرفي السكن، وأولياء الأمور.',
    signInWithGoogle: 'تسجيل الدخول عبر جوجل (Firebase Auth)',
    sandboxPreviewTitle: 'معاينة الأدوار التفاعلية (وضع التجربة)',
    sandboxPreviewDesc:
      'اختر أي دور أدناه لمعاينة لوحة التحكم والصلاحيات المخصصة لكل دور فوراً:',
    enterAsRole: 'الدخول كـ',
    liveFirestoreConnected: 'متصل بقاعدة بيانات Firestore السحابية',
    sandboxDemoBanner:
      'وضع المعاينة التجريبي نشط — سجل الدخول بحساب جوجل لحفظ البيانات في السحابة.',
    syncSeedToFirestore: 'مزامنة البيانات الأولية مع السحابة',
    syncingText: 'جاري الحفظ...',
    signOut: 'تسجيل الخروج',
    switchRolePreview: 'تبديل الدور (معاينة)',
    navModules: {
      dashboard: 'لوحة المعلومات',
      admissions: 'القبول الإلكتروني والاعتماد',
      students: 'إدارة الطلاب',
      staff: 'الأساتذة والموظفون',
      attendance: 'الحضور اليومي',
      exams: 'الامتحانات والنتائج',
      fees: 'الرسوم والمالية',
      hifz: 'متابعة الحفظ (السبق)',
      residential: 'السكن والإجازات',
      payroll: 'رواتب الموظفين',
      student_portal: 'بوابة الطالب',
      guardian: 'بوابة ولي الأمر',
      notices: 'الإعلانات والتعاميم',
      reports: 'التقارير والتصدير',
      settings: 'إعدادات المدرسة',
    },
    roles: {
      super_admin: 'المشرف العام (Super Admin)',
      muhtamim: 'مدير المدرسة (المهتمم)',
      teacher: 'أستاذ / معلم',
      accountant: 'المحاسب المالي',
      residential_supervisor: 'مشرف السكن الداخلي',
      guardian: 'ولي الأمر',
      student: 'طالب',
      staff: 'موظف إداري',
    },
    departments: {
      hifz: 'قسم تحفيظ القرآن الكريم',
      qawmi: 'قسم الكتب القومية',
      general: 'قسم التعليم العام كاديت',
    },
    common: {
      searchPlaceholder: 'ابحث بالاسم أو رقم القيد أو الهاتف...',
      allDepartments: 'جميع الأقسام',
      allClasses: 'جميع الفصول / المراحل',
      addRecord: 'إضافة سجل جديد',
      save: 'حفظ البيانات',
      cancel: 'إلغاء',
      delete: 'حذف',
      confirmDelete: 'تأكيد الحذف',
      edit: 'تعديل',
      viewDetails: 'التفاصيل',
      print: 'طباعة',
      exportCsv: 'تصدير CSV',
      status: 'الحالة',
      actions: 'الإجراءات',
      demoTag: 'بيانات تجريبية',
      persistedTag: 'محفوظ سحابياً',
      noRecordsFound: 'لا توجد سجلات مطابقة.',
      loadingRecords: 'جاري تحميل السجلات...',
      requiredFieldError: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح.',
    },
  },
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function formatNumber(value: number | string, lang: Language = 'bn'): string {
  const str = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? '');
  if (lang === 'bn') {
    return str.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] || d);
  }
  if (lang === 'ar') {
    return str.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)] || d);
  }
  return str;
}

