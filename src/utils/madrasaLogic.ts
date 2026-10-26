import type {
  AccountInvitation,
  AdminAuditLog,
  AdmissionApplication,
  AttendanceRecord,
  Department,
  ExamAuditAction,
  ExamAuditLog,
  ExaminationSetup,
  ExamResult,
  ExamSubjectConfig,
  ExamWorkflowStatus,
  FeeInvoice,
  GradingPolicyConfig,
  InvitationTargetRole,
  Language,
  ModuleId,
  PaymentMethod,
  StaffMember,
  Student,
  StudyDiaryEntry,
  SuperAdminBootstrapLock,
  UserProfile,
  UserRole,
} from '../types/madrasa';

export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

const ROLE_MODULE_ACCESS: Record<UserRole, ModuleId[]> = {
  super_admin: [
    'dashboard',
    'admissions',
    'students',
    'staff',
    'attendance',
    'exams',
    'fees',
    'hifz',
    'residential',
    'payroll',
    'student_portal',
    'guardian',
    'notices',
    'reports',
    'settings',
  ],
  muhtamim: [
    'dashboard',
    'admissions',
    'students',
    'staff',
    'attendance',
    'exams',
    'fees',
    'hifz',
    'residential',
    'payroll',
    'student_portal',
    'guardian',
    'notices',
    'reports',
    'settings',
  ],
  teacher: [
    'dashboard',
    'admissions',
    'students',
    'attendance',
    'exams',
    'hifz',
    'student_portal',
    'notices',
    'reports',
  ],
  accountant: ['dashboard', 'admissions', 'students', 'fees', 'payroll', 'notices', 'reports'],
  residential_supervisor: ['dashboard', 'admissions', 'students', 'attendance', 'residential', 'notices'],
  guardian: ['guardian', 'admissions', 'notices'],
  student: ['student_portal', 'admissions', 'notices'],
  staff: ['dashboard', 'admissions', 'students', 'attendance', 'notices'],
};

export function canAccessModule(role: UserRole, moduleId: ModuleId): boolean {
  const allowed = ROLE_MODULE_ACCESS[role];
  return Array.isArray(allowed) && allowed.includes(moduleId);
}

export function getAllowedModules(role: UserRole): ModuleId[] {
  return ROLE_MODULE_ACCESS[role] || ['dashboard'];
}

export function calculateMadrasaGrade(marksObtained: number, fullMarks: number): string {
  if (fullMarks <= 0 || marksObtained < 0) return 'N/A';
  const percentage = (marksObtained / fullMarks) * 100;
  if (percentage >= 80) return 'Mumtaz (A+)';
  if (percentage >= 70) return 'Jayyid Jiddan (A)';
  if (percentage >= 60) return 'Jayyid (A-)';
  if (percentage >= 50) return 'Maqbul (B)';
  if (percentage >= 33) return 'Pass (C)';
  return 'Rasib (F)';
}

export function calculateInvoiceStatus(
  amountDueBdt: number,
  amountPaidBdt: number,
  paymentMethod: PaymentMethod
): { status: 'paid' | 'partial' | 'unpaid'; balanceBdt: number } {
  const due = Math.max(0, Math.round(amountDueBdt));
  const paid = paymentMethod === 'unpaid' ? 0 : Math.max(0, Math.round(amountPaidBdt));
  const balanceBdt = Math.max(0, due - paid);

  if (paid <= 0 || paymentMethod === 'unpaid') {
    return { status: 'unpaid', balanceBdt: due };
  }
  if (paid >= due && due > 0) {
    return { status: 'paid', balanceBdt: 0 };
  }
  return { status: 'partial', balanceBdt };
}

export function calculateNetSalary(
  basicSalaryBdt: number,
  allowancesBdt: number,
  deductionsBdt: number
): number {
  const net = Math.round(basicSalaryBdt + allowancesBdt - deductionsBdt);
  return Math.max(0, net);
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateStudentInput(input: Partial<Student>): ValidationResult {
  const errors: Record<string, string> = {};

  const admissionNo = (input.admissionNo || '').trim();
  if (!admissionNo) {
    errors.admissionNo = 'Admission number is required';
  } else if (admissionNo.length > 40 || !ID_REGEX.test(admissionNo)) {
    errors.admissionNo = 'Use letters, numbers, hyphens or underscores (max 40 chars)';
  }

  const nameBn = (input.nameBn || '').trim();
  if (!nameBn) {
    errors.nameBn = 'Bengali name is required';
  } else if (nameBn.length > 120) {
    errors.nameBn = 'Name cannot exceed 120 characters';
  }

  const nameEn = (input.nameEn || '').trim();
  if (!nameEn) {
    errors.nameEn = 'English name is required';
  } else if (nameEn.length > 120) {
    errors.nameEn = 'English name cannot exceed 120 characters';
  }

  const className = (input.className || '').trim();
  if (!className) {
    errors.className = 'Class/Jamia level is required';
  }

  const guardianName = (input.guardianName || '').trim();
  if (!guardianName) {
    errors.guardianName = 'Guardian name is required';
  }

  const guardianPhone = (input.guardianPhone || '').trim();
  if (!guardianPhone || guardianPhone.length < 7 || guardianPhone.length > 30) {
    errors.guardianPhone = 'Valid guardian phone number is required';
  }

  const rollNo = Number(input.rollNo);
  if (!Number.isFinite(rollNo) || rollNo < 1 || rollNo > 99999) {
    errors.rollNo = 'Roll number must be between 1 and 99999';
  }

  const monthlyFeeBdt = Number(input.monthlyFeeBdt);
  if (!Number.isFinite(monthlyFeeBdt) || monthlyFeeBdt < 0 || monthlyFeeBdt > 500000) {
    errors.monthlyFeeBdt = 'Monthly fee must be between 0 and 500,000 BDT';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateInvoiceInput(input: Partial<FeeInvoice>): ValidationResult {
  const errors: Record<string, string> = {};

  const receiptNo = (input.receiptNo || '').trim();
  if (!receiptNo || !ID_REGEX.test(receiptNo) || receiptNo.length > 40) {
    errors.receiptNo = 'Valid receipt number is required';
  }

  if (!input.studentId) {
    errors.studentId = 'Student selection is required';
  }

  const due = Number(input.amountDueBdt);
  if (!Number.isFinite(due) || due <= 0 || due > 1000000) {
    errors.amountDueBdt = 'Amount due must be greater than 0 BDT';
  }

  const paid = Number(input.amountPaidBdt ?? 0);
  if (!Number.isFinite(paid) || paid < 0 || paid > due) {
    errors.amountPaidBdt = 'Paid amount cannot be negative or exceed amount due';
  }

  if (paid > 0 && (!input.paymentMethod || input.paymentMethod === 'unpaid')) {
    errors.paymentMethod = 'Verified payment method is required when recording payment';
  }

  if (
    paid > 0 &&
    input.paymentMethod &&
    ['bkash', 'nagad', 'bank_transfer'].includes(input.paymentMethod) &&
    !(input.transactionRef || '').trim()
  ) {
    errors.transactionRef = 'Transaction reference ID is required for digital/bank payments';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isDuplicateAttendance(
  existingRecords: AttendanceRecord[],
  date: string,
  studentId: string
): boolean {
  return existingRecords.some((r) => r.date === date && r.studentId === studentId);
}

export function canAccountAccessPortal(
  status: UserProfile['status'] | undefined
): { allowed: boolean; reasonBn: string; reasonEn: string } {
  if (status === 'active') {
    return { allowed: true, reasonBn: '', reasonEn: '' };
  }
  if (status === 'pending') {
    return {
      allowed: false,
      reasonBn:
        'আপনার অ্যাকাউন্টটি বর্তমানে প্রশাসনিক অনুমোদনের অপেক্ষায় (Pending Approval) রয়েছে। অনুমোদন সম্পন্ন হলে আপনি পোর্টালে তথ্য দেখতে পারবেন।',
      reasonEn:
        'Your account is currently pending administrative approval. Protected academic records will unlock once verified.',
    };
  }
  return {
    allowed: false,
    reasonBn:
      'নিরাপত্তা নীতিমালার কারণে আপনার অ্যাকাউন্টের অ্যাক্সেস স্থগিত (Suspended/Unauthorized) করা হয়েছে। অনুগ্রহ করে মাদ্রাসা দপ্তরে যোগাযোগ করুন।',
    reasonEn:
      'Access to protected portal records is suspended or unauthorized. Please contact the Madrasa administration office.',
  };
}

export function resolveStudentPortalRecord(
  students: Student[],
  studentUid: string,
  linkedStudentId: string,
  accountStatus: UserProfile['status'] = 'active'
): Student | null {
  if (accountStatus !== 'active') {
    return null;
  }
  const cleanUid = (studentUid || '').trim();
  // A student account can only be linked to a single student identity (no multi-student switching)
  const singleLinkedId = (linkedStudentId || '')
    .split(',')[0]
    ?.trim();

  if (!cleanUid && !singleLinkedId) {
    return null;
  }

  return (
    students.find(
      (st) =>
        (cleanUid && st.studentUid === cleanUid) ||
        (singleLinkedId && (st.id === singleLinkedId || st.admissionNo === singleLinkedId))
    ) || null
  );
}

export function filterGuardianStudents(
  students: Student[],
  guardianUid: string,
  linkedStudentIdsCsv: string,
  accountStatus: UserProfile['status'] = 'active'
): Student[] {
  if (accountStatus !== 'active') {
    return [];
  }
  const cleanUid = (guardianUid || '').trim();
  const linkedIds = (linkedStudentIdsCsv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!cleanUid && linkedIds.length === 0) {
    return [];
  }

  return students.filter(
    (st) =>
      (cleanUid && st.guardianUid === cleanUid) ||
      linkedIds.includes(st.id) ||
      linkedIds.includes(st.admissionNo)
  );
}

export function filterVisibleStudyDiaryEntries(
  entries: StudyDiaryEntry[],
  student: Student,
  viewerRole: UserRole
): StudyDiaryEntry[] {
  const isPrivilegedStaff = ['super_admin', 'muhtamim', 'teacher'].includes(viewerRole);
  return entries.filter((entry) => {
    const matchesStudent =
      entry.studentId === student.id ||
      (entry.studentId === 'all' &&
        entry.department === student.department &&
        entry.className === student.className);
    if (!matchesStudent) return false;
    if (!isPrivilegedStaff && !entry.visibleToGuardian) {
      return false;
    }
    return true;
  });
}

export interface AttendanceSummaryMetrics {
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  attendancePercentage: number;
}

export function computeAttendanceMetrics(
  records: AttendanceRecord[]
): AttendanceSummaryMetrics {
  const totalDays = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const leaveCount = records.filter((r) => r.status === 'leave').length;
  const effectivePresent = presentCount + lateCount;
  const attendancePercentage =
    totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 0;

  return {
    totalDays,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    attendancePercentage,
  };
}

export interface ExamAnalyticsSummary {
  publishedExams: ExamResult[];
  totalObtained: number;
  totalFullMarks: number;
  averagePercentage: number;
  overallGrade: string;
  strengths: ExamResult[];
  needsImprovement: ExamResult[];
}

export function computeExamAnalytics(
  exams: ExamResult[],
  studentId: string
): ExamAnalyticsSummary {
  const publishedExams = exams.filter(
    (e) => e.studentId === studentId && e.isPublished
  );
  const totalObtained = publishedExams.reduce((sum, e) => sum + e.marksObtained, 0);
  const totalFullMarks = publishedExams.reduce((sum, e) => sum + e.fullMarks, 0);
  const averagePercentage =
    totalFullMarks > 0 ? Math.round((totalObtained / totalFullMarks) * 100) : 0;
  const overallGrade =
    totalFullMarks > 0
      ? calculateMadrasaGrade(totalObtained, totalFullMarks)
      : 'N/A';

  const strengths = publishedExams.filter(
    (e) => e.fullMarks > 0 && (e.marksObtained / e.fullMarks) * 100 >= 80
  );
  const needsImprovement = publishedExams.filter(
    (e) => e.fullMarks > 0 && (e.marksObtained / e.fullMarks) * 100 < 80
  );

  return {
    publishedExams,
    totalObtained,
    totalFullMarks,
    averagePercentage,
    overallGrade,
    strengths,
    needsImprovement,
  };
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

export function toBengaliDigits(value: number | string): string {
  return String(value ?? '').replace(/[0-9]/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

export function formatNum(value: number | string, lang: Language = 'bn'): string {
  if (lang === 'bn') {
    return toBengaliDigits(value);
  }
  return String(value ?? '');
}

export function formatBdt(amount: number, lang: Language = 'bn'): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = safeAmount.toLocaleString('en-IN');
  return lang === 'bn' ? `৳ ${toBengaliDigits(formatted)}` : `৳ ${formatted}`;
}

export function generateCsvContent(headers: string[], rows: (string | number | boolean)[][]): string {
  const escapeCell = (val: string | number | boolean) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  return '\uFEFF' + lines.join('\n');
}

export function getNextSlideIndex(currentIndex: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  return (currentIndex + 1) % totalSlides;
}

export function getPrevSlideIndex(currentIndex: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  return (currentIndex - 1 + totalSlides) % totalSlides;
}

export interface DepartmentChartMetric {
  department: 'hifz' | 'qawmi' | 'general';
  count: number;
  percentage: number;
}

export function computeDepartmentChartMetrics(students: Student[]): DepartmentChartMetric[] {
  const total = students.length;
  const depts: ('hifz' | 'qawmi' | 'general')[] = ['hifz', 'qawmi', 'general'];
  return depts.map((dept) => {
    const count = students.filter((s) => s.department === dept).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { department: dept, count, percentage };
  });
}

export type IdentifierKind = 'email' | 'student_id' | 'username' | 'invalid';

export function classifyLoginIdentifier(rawIdentifier: string): {
  kind: IdentifierKind;
  normalized: string;
} {
  const trimmed = (rawIdentifier || '').trim();
  if (!trimmed || trimmed.length > 120) {
    return { kind: 'invalid', normalized: '' };
  }

  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return { kind: 'email', normalized: trimmed.toLowerCase() };
    }
    return { kind: 'invalid', normalized: trimmed };
  }

  const upper = trimmed.toUpperCase();
  if (
    /^UQCM[-_][A-Z0-9\-_]+$/i.test(trimmed) ||
    /^STU[-_][A-Z0-9\-_]+$/i.test(trimmed) ||
    /^[0-9]{4,12}$/.test(trimmed)
  ) {
    return { kind: 'student_id', normalized: upper };
  }

  if (trimmed.length >= 3 && ID_REGEX.test(trimmed)) {
    return { kind: 'username', normalized: trimmed };
  }

  return { kind: 'invalid', normalized: trimmed };
}

export function validateLoginInput(identifier: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  const classified = classifyLoginIdentifier(identifier);

  if (!identifier || !identifier.trim()) {
    errors.identifier = 'ইউজারনেম, স্টুডেন্ট আইডি অথবা ইমেইল আবশ্যক';
  } else if (classified.kind === 'invalid') {
    errors.identifier = 'সঠিক ইউজারনেম, স্টুডেন্ট আইডি (যেমন UQCM-2026-101) অথবা ইমেইল দিন';
  }

  if (!password) {
    errors.password = 'পাসওয়ার্ড প্রদান করা আবশ্যক';
  } else if (password.length < 6) {
    errors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface RegistrationFormInput {
  role: 'student' | 'guardian';
  fullName: string;
  phone: string;
  identifier: string;
  password: string;
}

export function validateRegistrationInput(input: RegistrationFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (input.role !== 'student' && input.role !== 'guardian') {
    errors.role = 'শুধুমাত্র শিক্ষার্থী অথবা অভিভাবক অ্যাকাউন্টের জন্য আবেদন করা যাবে';
  }

  const fullName = (input.fullName || '').trim();
  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = 'পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে';
  }

  const phone = (input.phone || '').trim();
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    errors.phone = 'সঠিক মোবাইল নম্বর প্রদান করুন (যেমন 01711-223344)';
  }

  const classified = classifyLoginIdentifier(input.identifier);
  if (classified.kind === 'invalid') {
    errors.identifier = 'সঠিক স্টুডেন্ট আইডি, ইউজারনেম অথবা ইমেইল দিন';
  }

  if (!input.password || input.password.length < 6) {
    errors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export type AuthScreenState =
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'loading'
  | 'error'
  | 'pending'
  | 'suspended';

export function resolvePostLoginRedirect(
  profile: Pick<UserProfile, 'role' | 'status'> | null
): {
  screen: 'portal' | 'pending' | 'suspended';
  targetModule: ModuleId;
} {
  if (!profile || profile.status === 'pending') {
    return { screen: 'pending', targetModule: 'guardian' };
  }
  if (profile.status === 'suspended') {
    return { screen: 'suspended', targetModule: 'guardian' };
  }
  if (profile.role === 'student') {
    return { screen: 'portal', targetModule: 'student_portal' };
  }
  if (profile.role === 'guardian') {
    return { screen: 'portal', targetModule: 'guardian' };
  }
  return { screen: 'portal', targetModule: 'dashboard' };
}

export function mapFirebaseAuthErrorToMessage(
  errorCodeOrMsg: string,
  lang: Language = 'bn'
): {
  title: string;
  message: string;
  technicalNote?: string;
} {
  const raw = (errorCodeOrMsg || '').toLowerCase();

  if (raw.includes('username_requires_backend_lookup')) {
    if (lang === 'en') {
      return {
        title: 'Username Lookup Required',
        message:
          'Student ID / Username sign-in requires a backend custom-token lookup or email mapping. Please sign in with your registered Email or Google account.',
        technicalNote:
          'Firebase Auth verifies email/password or OAuth tokens directly. Mapping raw Student IDs without email requires a Firebase Admin Cloud Function.',
      };
    }
    if (lang === 'ar') {
      return {
        title: 'يتطلب التحقق عبر البريد الإلكتروني',
        message:
          'تسجيل الدخول برقم الطالب يتطلب ربط الحساب بالبريد الإلكتروني أو استخدام حساب Google المعتمد.',
      };
    }
    return {
      title: 'ভুল তথ্য বা ইমেইল ম্যাপিং প্রয়োজন',
      message:
        'আপনার ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে। স্টুডেন্ট আইডি দিয়ে সরাসরি লগইনের জন্য ব্যাকএন্ড টোকেন ম্যাপিং প্রয়োজন—অনুগ্রহ করে নিবন্ধিত ইমেইল অথবা Google অ্যাকাউন্ট ব্যবহার করুন।',
      technicalNote:
        'নিরাপত্তা নীতি: ক্লায়েন্ট সাইডে পাসওয়ার্ড যাচাই করা হয় না। স্টুডেন্ট আইডি লগইনের জন্য Firebase Admin Cloud Function অথবা নিবন্ধিত ইমেইল আবশ্যক।',
    };
  }

  if (raw.includes('operation-not-allowed')) {
    if (lang === 'en') {
      return {
        title: 'Provider Not Enabled',
        message:
          'Email/Password sign-in is not enabled in the Firebase Console yet. Please use Google Sign-In or enable Email/Password provider in Firebase Authentication.',
      };
    }
    if (lang === 'ar') {
      return {
        title: 'طريقة الدخول غير مفعلة',
        message: 'يرجى تفعيل الدخول بالبريد الإلكتروني في إعدادات Firebase أو استخدام حساب Google.',
      };
    }
    return {
      title: 'ভুল তথ্য / প্রোভাইডার কনফিগারেশন',
      message:
        'Firebase Console-এ এখনো Email/Password প্রোভাইডার সক্রিয় করা হয়নি। অনুগ্রহ করে "Google দিয়ে প্রবেশ করুন" ব্যবহার করুন অথবা Firebase Console থেকে Email/Password চালু করুন।',
    };
  }

  if (raw.includes('email-already-in-use')) {
    return {
      title: lang === 'en' ? 'Account Already Exists' : lang === 'ar' ? 'الحساب موجود مسبقاً' : 'অ্যাকাউন্ট ইতিমধ্যে বিদ্যমান',
      message:
        lang === 'en'
          ? 'This email is already registered. Please sign in or reset your password.'
          : lang === 'ar'
            ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.'
            : 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।',
    };
  }

  if (raw.includes('too-many-requests')) {
    return {
      title: lang === 'en' ? 'Too Many Attempts' : lang === 'ar' ? 'محاولات كثيرة جداً' : 'অতিরিক্ত চেষ্টা করা হয়েছে',
      message:
        lang === 'en'
          ? 'Access temporarily blocked due to many failed attempts. Please try again shortly.'
          : lang === 'ar'
            ? 'تم حظر المحاولات مؤقتاً لأسباب أمنية. حاول مرة أخرى لاحقاً.'
            : 'একাধিকবার ভুল চেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত রয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    };
  }

  return {
    title: lang === 'en' ? 'Invalid Credentials' : lang === 'ar' ? 'بيانات غير صحيحة' : 'ভুল তথ্য',
    message:
      lang === 'en'
        ? 'Your username or password is incorrect. Please try again.'
        : lang === 'ar'
          ? 'اسم المستخدم أو كلمة المرور غير صحيحة. حاول مرة أخرى.'
          : 'আপনার ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
  };
}

// ============================================================================
// Phase 7 — Online Admission, Student Photo, Approval & Guardian Linking Logic
// ============================================================================

export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function canApproveAdmissions(role: UserRole): boolean {
  return role === 'super_admin' || role === 'muhtamim';
}

export function canReplaceApprovedStudentPhoto(role: UserRole): boolean {
  return role === 'super_admin' || role === 'muhtamim' || role === 'staff';
}

export function canViewAdmissionApplication(
  app: Pick<AdmissionApplication, 'applicantUid' | 'authorId' | 'guardianUid'>,
  viewerUid: string,
  viewerRole: UserRole
): boolean {
  if (['super_admin', 'muhtamim', 'staff'].includes(viewerRole)) {
    return true;
  }
  const cleanViewer = (viewerUid || '').trim();
  if (!cleanViewer) return false;
  return (
    app.applicantUid === cleanViewer ||
    app.authorId === cleanViewer ||
    (Boolean(app.guardianUid) && app.guardianUid === cleanViewer)
  );
}

export function validatePhotoUploadMetadata(
  mimeType: string,
  sizeBytes: number,
  rawFileName: string
): {
  valid: boolean;
  errorBn?: string;
  errorEn?: string;
  safeFileName: string;
} {
  const normalizedMime = (mimeType || '').trim().toLowerCase();
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(normalizedMime as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
    return {
      valid: false,
      errorBn: 'শুধুমাত্র JPG, PNG অথবা WEBP ফরম্যাটের ছবি আপলোড করা যাবে।',
      errorEn: 'Only JPG, PNG, or WEBP image formats are allowed.',
      safeFileName: '',
    };
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return {
      valid: false,
      errorBn: 'ছবির ফাইলটি খালি বা অকার্যকর।',
      errorEn: 'The selected image file is empty or invalid.',
      safeFileName: '',
    };
  }

  if (sizeBytes > MAX_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      errorBn: 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5 MB) হতে পারবে।',
      errorEn: 'Image file size must not exceed 5 MB.',
      safeFileName: '',
    };
  }

  const baseName = (rawFileName || 'student_photo')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40) || 'student_photo';

  const safeFileName = `stu_photo_${baseName}_${Date.now()}.webp`;

  return {
    valid: true,
    safeFileName,
  };
}

export function validateAdmissionStep(
  step: 1 | 2 | 3 | 4,
  input: Partial<AdmissionApplication>
): ValidationResult {
  const errors: Record<string, string> = {};

  if (step === 1 || step === 4) {
    const nameBn = (input.nameBn || '').trim();
    if (nameBn.length < 2 || nameBn.length > 120) {
      errors.nameBn = 'শিক্ষার্থীর পূর্ণ বাংলা নাম আবশ্যক (২–১২০ অক্ষর)';
    }

    const nameEn = (input.nameEn || '').trim();
    if (nameEn.length < 2 || nameEn.length > 120) {
      errors.nameEn = 'Student full name in English is required (2–120 chars)';
    }

    const dob = (input.dateOfBirth || '').trim();
    if (!dob || dob.length < 4 || dob.length > 25) {
      errors.dateOfBirth = 'জন্ম তারিখ প্রদান করা আবশ্যক';
    }

    const presentAddress = (input.presentAddress || '').trim();
    if (presentAddress.length < 3 || presentAddress.length > 350) {
      errors.presentAddress = 'বর্তমান ঠিকানা প্রদান করা আবশ্যক';
    }

    const birthRegNo = (input.birthRegNo || '').trim();
    if (birthRegNo && (birthRegNo.length < 6 || birthRegNo.length > 50 || !/^[0-9\-A-Za-z]+$/.test(birthRegNo))) {
      errors.birthRegNo = 'জন্ম নিবন্ধন নম্বর সঠিক সংখ্যায় লিখুন';
    }
  }

  if (step === 2 || step === 4) {
    const fatherName = (input.fatherName || '').trim();
    if (fatherName.length < 2 || fatherName.length > 120) {
      errors.fatherName = 'পিতার নাম আবশ্যক';
    }

    const motherName = (input.motherName || '').trim();
    if (motherName.length < 2 || motherName.length > 120) {
      errors.motherName = 'মাতার নাম আবশ্যক';
    }

    const guardianName = (input.guardianName || '').trim();
    if (guardianName.length < 2 || guardianName.length > 120) {
      errors.guardianName = 'প্রধান অভিভাবকের নাম আবশ্যক';
    }

    const guardianRelation = (input.guardianRelation || '').trim();
    if (!guardianRelation || guardianRelation.length > 80) {
      errors.guardianRelation = 'অভিভাবকের সাথে সম্পর্ক উল্লেখ করুন';
    }

    const guardianPhone = (input.guardianPhone || '').trim();
    if (!/^[0-9+\-\s()]{7,25}$/.test(guardianPhone)) {
      errors.guardianPhone = 'অভিভাবকের সঠিক মোবাইল নম্বর আবশ্যক (যেমন 01711-223344)';
    }
  }

  if (step === 3 || step === 4) {
    if (!input.department || !['hifz', 'qawmi', 'general'].includes(input.department)) {
      errors.department = 'ভর্তির বিভাগ নির্বাচন আবশ্যক';
    }

    const requestedClass = (input.requestedClass || '').trim();
    if (!requestedClass || requestedClass.length > 120) {
      errors.requestedClass = 'ভর্তিচ্ছু জামাত বা শ্রেণি নির্বাচন আবশ্যক';
    }

    const academicSession = (input.academicSession || '').trim();
    if (!academicSession || academicSession.length > 40) {
      errors.academicSession = 'শিক্ষাবর্ষ উল্লেখ করা আবশ্যক';
    }

    if (
      !input.residentialStatus ||
      !['residential', 'day_scholar'].includes(input.residentialStatus)
    ) {
      errors.residentialStatus = 'আবাসিক অথবা অনাবাসিক ধরন নির্বাচন করুন';
    }
  }

  if (step === 4) {
    if (input.consentAccepted !== true) {
      errors.consentAccepted =
        'আবেদন জমা দেওয়ার পূর্বে অঙ্গীকারনামা ও তথ্যের সত্যতা নিশ্চিতকরণ টিক দিন';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isDuplicateAdmissionSubmission(
  existingApps: AdmissionApplication[],
  candidate: Pick<
    AdmissionApplication,
    'nameEn' | 'dateOfBirth' | 'guardianPhone' | 'academicSession'
  >
): boolean {
  const normName = (candidate.nameEn || '').trim().toLowerCase();
  const normDob = (candidate.dateOfBirth || '').trim();
  const normPhone = (candidate.guardianPhone || '').replace(/[\s\-()]/g, '');
  const normSession = (candidate.academicSession || '').trim().toLowerCase();

  if (!normName || !normDob || !normPhone) return false;

  return existingApps.some((app) => {
    if (app.status === 'rejected') return false;
    return (
      app.nameEn.trim().toLowerCase() === normName &&
      app.dateOfBirth.trim() === normDob &&
      app.guardianPhone.replace(/[\s\-()]/g, '') === normPhone &&
      app.academicSession.trim().toLowerCase() === normSession
    );
  });
}

export function generateAdmissionReferenceNo(
  existingApps: Pick<AdmissionApplication, 'referenceNo'>[],
  year = '2026'
): string {
  const used = new Set(existingApps.map((a) => a.referenceNo.toUpperCase()));
  let seq = 801 + existingApps.length;
  let candidate = `UQCM-ADM-${year}-${seq}`;
  while (used.has(candidate.toUpperCase())) {
    seq += 1;
    candidate = `UQCM-ADM-${year}-${seq}`;
  }
  return candidate;
}

export function mergeLinkedStudentIds(existingCsv: string, newStudentId: string): string {
  const cleanNew = (newStudentId || '').trim();
  const parts = (existingCsv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (cleanNew && !parts.includes(cleanNew)) {
    parts.push(cleanNew);
  }
  return parts.join(',');
}

export interface ProvisionStudentOptions {
  admissionNo?: string;
  rollNo?: number;
  className?: string;
  department?: Department;
  dormitoryRoom?: string;
  monthlyFeeBdt?: number;
  guardianUid?: string;
  studentUid?: string;
  authorId: string;
}

export function buildProvisionedStudentFromApplication(
  app: AdmissionApplication,
  existingStudents: Student[],
  options: ProvisionStudentOptions
): {
  studentRecord: Student;
  isExistingRecord: boolean;
} {
  // Check idempotency: look up by applicationId, assignedStudentId, or admissionNo
  const cleanAdmissionNo = (
    options.admissionNo ||
    app.assignedAdmissionNo ||
    `UQCM-2026-${101 + existingStudents.length}`
  ).trim();

  const existingMatch = existingStudents.find(
    (st) =>
      (st.applicationId && st.applicationId === app.id) ||
      (app.assignedStudentId && st.id === app.assignedStudentId) ||
      st.admissionNo.toUpperCase() === cleanAdmissionNo.toUpperCase()
  );

  const canonicalId = existingMatch?.id || app.assignedStudentId || `stu-${app.id}`;
  const finalDepartment = options.department || app.department;
  const finalClass = (options.className || app.requestedClass).trim();
  const finalRoll =
    options.rollNo && options.rollNo > 0
      ? options.rollNo
      : app.assignedRollNo && app.assignedRollNo > 0
        ? app.assignedRollNo
        : existingMatch?.rollNo || existingStudents.length + 1;

  const finalDormitory = (
    options.dormitoryRoom ||
    app.assignedDormitoryRoom ||
    (app.residentialStatus === 'residential'
      ? 'দারুল আরকাম ভবন - কক্ষ ২০২'
      : 'অনাবাসিক (Day Scholar)')
  ).trim();

  const defaultFee =
    app.residentialStatus === 'residential'
      ? finalDepartment === 'hifz'
        ? 5500
        : 5000
      : 3500;
  const finalFee =
    options.monthlyFeeBdt !== undefined && options.monthlyFeeBdt >= 0
      ? options.monthlyFeeBdt
      : app.assignedMonthlyFeeBdt > 0
        ? app.assignedMonthlyFeeBdt
        : existingMatch?.monthlyFeeBdt ?? defaultFee;

  const resolvedGuardianUid = (
    options.guardianUid ??
    app.guardianUid ??
    existingMatch?.guardianUid ??
    ''
  ).trim();

  const resolvedStudentUid = (
    options.studentUid ??
    existingMatch?.studentUid ??
    (app.applicantUid && app.applicantUid !== resolvedGuardianUid && app.applicantUid !== 'sandbox-applicant'
      ? app.applicantUid
      : '')
  ).trim();

  const todayIso = new Date().toISOString().slice(0, 10);

  const studentRecord: Student = {
    id: canonicalId,
    admissionNo: existingMatch ? existingMatch.admissionNo : cleanAdmissionNo,
    nameBn: app.nameBn.trim(),
    nameEn: app.nameEn.trim(),
    nameAr: (app.nameAr || '').trim(),
    department: finalDepartment,
    className: finalClass,
    rollNo: finalRoll,
    dateOfBirth: app.dateOfBirth.trim(),
    bloodGroup: (app.bloodGroup || 'O+').trim(),
    admissionDate: existingMatch?.admissionDate || todayIso,
    guardianName: app.guardianName.trim(),
    guardianPhone: app.guardianPhone.trim(),
    guardianRelation: app.guardianRelation.trim(),
    guardianUid: resolvedGuardianUid,
    ...(resolvedStudentUid ? { studentUid: resolvedStudentUid } : {}),
    ...(app.photoUrl ? { photoUrl: app.photoUrl } : existingMatch?.photoUrl ? { photoUrl: existingMatch.photoUrl } : {}),
    applicationId: app.id,
    residentialStatus: app.residentialStatus,
    dormitoryRoom: finalDormitory,
    monthlyFeeBdt: finalFee,
    status: existingMatch?.status || 'active',
    authorId: existingMatch?.authorId || options.authorId,
    isDemoRecord: Boolean(app.isDemoRecord),
  };

  return {
    studentRecord,
    isExistingRecord: Boolean(existingMatch),
  };
}

// ============================================================================
// Phase 8 — Public Application Status Verification & Single-Use Account Provisioning
// ============================================================================

export function verifyPublicApplicationLookup(
  applications: AdmissionApplication[],
  referenceNoInput: string,
  verificationInput: string
): AdmissionApplication | null {
  const cleanRef = (referenceNoInput || '').trim().toUpperCase();
  const cleanVerify = (verificationInput || '').trim();

  // Never expose application data if either reference number or verification secret is missing
  if (cleanRef.length < 6 || cleanVerify.length < 6) {
    return null;
  }

  const verifyDigits = cleanVerify.replace(/\D/g, '');

  const match = applications.find(
    (app) => app.referenceNo.trim().toUpperCase() === cleanRef
  );
  if (!match) return null;

  const appPhoneDigits = (match.guardianPhone || '').replace(/\D/g, '');
  const fatherPhoneDigits = (match.fatherPhone || '').replace(/\D/g, '');
  const dobTrimmed = (match.dateOfBirth || '').trim();

  const phoneMatches =
    verifyDigits.length >= 6 &&
    ((appPhoneDigits.length >= 6 && appPhoneDigits.endsWith(verifyDigits.slice(-6))) ||
      (fatherPhoneDigits.length >= 6 && fatherPhoneDigits.endsWith(verifyDigits.slice(-6))));

  const dobMatches = dobTrimmed.length >= 8 && dobTrimmed === cleanVerify;

  if (!phoneMatches && !dobMatches) {
    return null;
  }

  return match;
}

function computeDeterministicTokenSuffix(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0')
    .slice(0, 4);
}

export function buildAccountProvisioningPackage(
  app: AdmissionApplication,
  student: Student,
  existingInvitations: AccountInvitation[],
  issuedByUid: string,
  baseUrl = 'https://uqcm.edu.bd'
): {
  studentInvitation: AccountInvitation;
  guardianInvitation: AccountInvitation | null;
  reusedExisting: boolean;
} {
  const todayIso = new Date().toISOString().slice(0, 10);
  const stuInvId = `inv-stu-${student.id}`;
  const grdInvId = `inv-grd-${student.id}`;

  const existingStuInv = existingInvitations.find(
    (inv) =>
      inv.id === stuInvId ||
      (inv.targetRole === 'student' &&
        (inv.studentId === student.id || inv.applicationId === app.id))
  );

  const existingGrdInv = existingInvitations.find(
    (inv) =>
      inv.id === grdInvId ||
      (inv.targetRole === 'guardian' &&
        (inv.studentId === student.id || inv.applicationId === app.id))
  );

  const stuSuffix = computeDeterministicTokenSuffix(`STU:${student.id}:${student.admissionNo}`);
  const stuCode =
    existingStuInv?.invitationCode ||
    `ACT-STU-${student.admissionNo.toUpperCase()}-${stuSuffix}`;

  const studentInvitation: AccountInvitation = {
    id: existingStuInv?.id || stuInvId,
    invitationCode: stuCode,
    targetRole: 'student',
    applicationId: app.id,
    studentId: student.id,
    admissionNo: student.admissionNo,
    studentNameBn: student.nameBn,
    recipientName: student.nameBn,
    recipientPhone: student.guardianPhone,
    recipientEmail: (app.applicantEmail || '').trim(),
    activationUrl: `${baseUrl}/?activate=${encodeURIComponent(stuCode)}`,
    // Preserve 'activated' status if already redeemed on retry
    status: existingStuInv?.status === 'activated' ? 'activated' : 'pending_activation',
    provisioningMode: 'single_use_activation_link',
    requiresPasswordChangeOnFirstLogin: false,
    issuedByUid: existingStuInv?.issuedByUid || issuedByUid,
    issuedAt: existingStuInv?.issuedAt || todayIso,
    redeemedByUid: existingStuInv?.redeemedByUid || '',
    redeemedAt: existingStuInv?.redeemedAt || '',
    authorId: existingStuInv?.authorId || issuedByUid,
    isDemoRecord: Boolean(student.isDemoRecord),
  };

  let guardianInvitation: AccountInvitation | null = null;
  if (app.requestGuardianAccount !== false) {
    const grdSuffix = computeDeterministicTokenSuffix(`GRD:${student.id}:${student.guardianPhone}`);
    const grdCode =
      existingGrdInv?.invitationCode ||
      `ACT-GRD-${student.admissionNo.toUpperCase()}-${grdSuffix}`;

    guardianInvitation = {
      id: existingGrdInv?.id || grdInvId,
      invitationCode: grdCode,
      targetRole: 'guardian',
      applicationId: app.id,
      studentId: student.id,
      admissionNo: student.admissionNo,
      studentNameBn: student.nameBn,
      recipientName: student.guardianName,
      recipientPhone: student.guardianPhone,
      recipientEmail: (app.guardianEmail || '').trim(),
      activationUrl: `${baseUrl}/?activate=${encodeURIComponent(grdCode)}`,
      status: existingGrdInv?.status === 'activated' ? 'activated' : 'pending_activation',
      provisioningMode: 'single_use_activation_link',
      requiresPasswordChangeOnFirstLogin: false,
      issuedByUid: existingGrdInv?.issuedByUid || issuedByUid,
      issuedAt: existingGrdInv?.issuedAt || todayIso,
      redeemedByUid: existingGrdInv?.redeemedByUid || '',
      redeemedAt: existingGrdInv?.redeemedAt || '',
      authorId: existingGrdInv?.authorId || issuedByUid,
      isDemoRecord: Boolean(student.isDemoRecord),
    };
  }

  return {
    studentInvitation,
    guardianInvitation,
    reusedExisting: Boolean(existingStuInv),
  };
}

export function validateAndRedeemActivationInvitation(
  invitations: AccountInvitation[],
  input: {
    invitationCode: string;
    verificationPhoneOrAdmissionNo: string;
    chosenPassword: string;
    redeemerUid: string;
    referenceDateIso?: string;
  }
): {
  ok: boolean;
  errorBn?: string;
  errorEn?: string;
  updatedInvitation?: AccountInvitation;
} {
  const cleanCode = (input.invitationCode || '').trim().toUpperCase();
  const cleanVerify = (input.verificationPhoneOrAdmissionNo || '').trim();
  const password = input.chosenPassword || '';

  if (!cleanCode) {
    return {
      ok: false,
      errorBn: 'অনুগ্রহ করে একক-ব্যবহারযোগ্য অ্যাক্টিভেশন কোড (Activation Code) লিখুন।',
      errorEn: 'Please enter your single-use activation code.',
    };
  }

  const target = invitations.find(
    (inv) => inv.invitationCode.trim().toUpperCase() === cleanCode
  );

  if (!target) {
    return {
      ok: false,
      errorBn: 'অ্যাক্টিভেশন কোডটি সঠিক নয়। কর্তৃপক্ষ থেকে প্রাপ্ত কোডটি যাচাই করুন।',
      errorEn: 'Invalid activation code. Please check the code issued by the administration.',
    };
  }

  if (target.status === 'activated') {
    return {
      ok: false,
      errorBn:
        'এই একক-ব্যবহারযোগ্য (Single-Use) অ্যাক্টিভেশন কোডটি ইতিমধ্যে ব্যবহৃত হয়েছে। আপনার অ্যাকাউন্টে সরাসরি লগইন করুন।',
      errorEn:
        'This single-use activation link has already been redeemed. Please sign in to your account.',
    };
  }

  if (target.status === 'revoked') {
    return {
      ok: false,
      errorBn: 'এই অ্যাক্টিভেশন কোডটি বাতিল করা হয়েছে। মাদ্রাসা দপ্তরে যোগাযোগ করুন।',
      errorEn: 'This activation invitation has been revoked.',
    };
  }

  const todayIso = (input.referenceDateIso || new Date().toISOString().slice(0, 10)).trim();
  if (
    target.status === 'expired' ||
    (target.expiresAt && target.expiresAt.trim() !== '' && target.expiresAt.trim() < todayIso)
  ) {
    return {
      ok: false,
      errorBn: 'এই অ্যাক্টিভেশন কোডটির মেয়াদ উত্তীর্ণ হয়েছে (Expired)। নতুন আমন্ত্রণ কোডের জন্য কর্তৃপক্ষের সাথে যোগাযোগ করুন।',
      errorEn: 'This activation invitation has expired. Please request a new invitation.',
    };
  }

  const verifyDigits = cleanVerify.replace(/\D/g, '');
  const targetPhoneDigits = (target.recipientPhone || '').replace(/\D/g, '');
  const phoneMatches =
    verifyDigits.length >= 6 &&
    targetPhoneDigits.length >= 6 &&
    targetPhoneDigits.endsWith(verifyDigits.slice(-6));
  const admissionMatches =
    Boolean(target.admissionNo) &&
    cleanVerify.toUpperCase() === target.admissionNo.trim().toUpperCase();
  const employeeCodeMatches =
    Boolean(target.employeeCode) &&
    cleanVerify.toUpperCase() === (target.employeeCode || '').trim().toUpperCase();

  if (!phoneMatches && !admissionMatches && !employeeCodeMatches) {
    return {
      ok: false,
      errorBn:
        'যাচাইকরণ সফল হয়নি। নিবন্ধিত মোবাইল নম্বর (কমপক্ষে শেষ ৬ ডিজিট) অথবা অফিশিয়াল স্টুডেন্ট / স্টাফ আইডি সঠিকভাবে দিন।',
      errorEn:
        'Verification failed. Please provide the registered mobile number or official Student / Staff ID.',
    };
  }

  if (password.length < 6) {
    return {
      ok: false,
      errorBn: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      errorEn: 'New password must be at least 6 characters long.',
    };
  }

  const fallbackId = target.staffId || target.studentId || 'account';
  const updatedInvitation: AccountInvitation = {
    ...target,
    status: 'activated',
    redeemedByUid:
      (input.redeemerUid || '').trim() || `usr-${target.targetRole}-${fallbackId}`,
    redeemedAt: todayIso,
  };

  return {
    ok: true,
    updatedInvitation,
  };
}

// ============================================================================
// Phase 9 — Examination Setup, Bulk Marks Validation, Tabulation & Workflow Logic
// ============================================================================

export const DEFAULT_MADRASA_GRADING_POLICY: GradingPolicyConfig = {
  id: 'policy-befaq-cadet-2026',
  nameBn: 'বেফাক ও ক্যাডেট মাদ্রাসা সমন্বিত গ্রেডিং নীতিমালা',
  nameEn: 'Befaq & Cadet Madrasa Integrated Grading Policy',
  enableGpa: true,
  gpaScale: 5.0,
  enableRank: true,
  failIfAnySubjectFailed: true,
  passPercentageDefault: 33,
  gradeTiers: [
    {
      minPercentage: 80,
      maxPercentage: 100,
      labelBn: 'মুমতায (A+)',
      labelEn: 'Mumtaz (A+)',
      letterGrade: 'A+',
      gpaPoint: 5.0,
      isPassing: true,
    },
    {
      minPercentage: 70,
      maxPercentage: 79.99,
      labelBn: 'জায়্যিদ জিদ্দান (A)',
      labelEn: 'Jayyid Jiddan (A)',
      letterGrade: 'A',
      gpaPoint: 4.0,
      isPassing: true,
    },
    {
      minPercentage: 60,
      maxPercentage: 69.99,
      labelBn: 'জায়্যিদ (A-)',
      labelEn: 'Jayyid (A-)',
      letterGrade: 'A-',
      gpaPoint: 3.5,
      isPassing: true,
    },
    {
      minPercentage: 50,
      maxPercentage: 59.99,
      labelBn: 'মাকবুল (B)',
      labelEn: 'Maqbul (B)',
      letterGrade: 'B',
      gpaPoint: 3.0,
      isPassing: true,
    },
    {
      minPercentage: 33,
      maxPercentage: 49.99,
      labelBn: 'উত্তীর্ণ (C)',
      labelEn: 'Pass (C)',
      letterGrade: 'C',
      gpaPoint: 2.0,
      isPassing: true,
    },
    {
      minPercentage: 0,
      maxPercentage: 32.99,
      labelBn: 'রাসিব (F)',
      labelEn: 'Rasib (F)',
      letterGrade: 'F',
      gpaPoint: 0.0,
      isPassing: false,
    },
  ],
};

export function resolveExamWorkflowStatus(exam: Pick<ExamResult, 'isPublished' | 'workflowStatus'>): ExamWorkflowStatus {
  if (exam.workflowStatus) {
    return exam.workflowStatus;
  }
  return exam.isPublished ? 'published' : 'draft';
}

export function isExamRecordPublished(exam: Pick<ExamResult, 'isPublished' | 'workflowStatus'>): boolean {
  return exam.isPublished === true && resolveExamWorkflowStatus(exam) === 'published';
}

export function validateExaminationSetup(
  setup: Partial<ExaminationSetup>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!setup.examName || !setup.examName.trim()) {
    errors.push('পরীক্ষার নাম উল্লেখ করা আবশ্যক (Exam name is required)');
  }
  if (!setup.academicYear || !setup.academicYear.trim()) {
    errors.push('শিক্ষাবর্ষ উল্লেখ করা আবশ্যক (Academic session is required)');
  }
  if (!setup.className || !setup.className.trim()) {
    errors.push('জামাত / শ্রেণি নির্বাচন করা আবশ্যক (Class is required)');
  }
  if (!setup.department || !['hifz', 'qawmi', 'general'].includes(setup.department)) {
    errors.push('বিভাগ নির্বাচন করা আবশ্যক (Valid department is required)');
  }
  if (!setup.subjects || setup.subjects.length === 0) {
    errors.push('কমপক্ষে ১টি বিষয় বা কিতাব সংযুক্ত করা আবশ্যক (At least one subject is required)');
  } else {
    const seenNames = new Set<string>();
    for (const sub of setup.subjects) {
      const cleanName = (sub.subjectName || '').trim();
      if (!cleanName) {
        errors.push('বিষয়ের নাম খালি রাখা যাবে না (Subject name cannot be empty)');
        continue;
      }
      const norm = cleanName.toLowerCase();
      if (seenNames.has(norm)) {
        errors.push(`একই পরীক্ষায় "${cleanName}" বিষয়টি একাধিকবার যুক্ত করা হয়েছে`);
      }
      seenNames.add(norm);

      if (
        typeof sub.maxMarks !== 'number' ||
        Number.isNaN(sub.maxMarks) ||
        sub.maxMarks < 1 ||
        sub.maxMarks > 1000
      ) {
        errors.push(`"${cleanName}" বিষয়ের পূর্ণমান ১ থেকে ১০০০-এর মধ্যে হতে হবে`);
      }
      if (
        typeof sub.passMarks !== 'number' ||
        Number.isNaN(sub.passMarks) ||
        sub.passMarks < 0 ||
        sub.passMarks > sub.maxMarks
      ) {
        errors.push(`"${cleanName}" বিষয়ের পাস নম্বর ০ থেকে পূর্ণমান (${sub.maxMarks})-এর মধ্যে হতে হবে`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export type SubjectEvaluationStatus =
  | 'passed'
  | 'failed'
  | 'absent'
  | 'exempt'
  | 'unentered'
  | 'invalid';

export interface EvaluatedSubjectCell {
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  passMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  isExempt: boolean;
  status: SubjectEvaluationStatus;
  percentage: number | null;
  gradeLabel: string;
  letterGrade: string;
  gpaPoint: number | null;
  remarks: string;
  workflowStatus: ExamWorkflowStatus | 'unentered';
  examResultId?: string;
  validationError?: string;
}

export function evaluateSubjectMarks(params: {
  subjectName: string;
  subjectCode?: string;
  maxMarks: number;
  passMarks: number;
  marksObtained?: number | null;
  isAbsent?: boolean;
  isExempt?: boolean;
  remarks?: string;
  workflowStatus?: ExamWorkflowStatus;
  examResultId?: string;
  policy?: GradingPolicyConfig;
}): EvaluatedSubjectCell {
  const policy = params.policy || DEFAULT_MADRASA_GRADING_POLICY;
  const maxMarks = params.maxMarks > 0 ? params.maxMarks : 100;
  const passMarks =
    params.passMarks >= 0 && params.passMarks <= maxMarks
      ? params.passMarks
      : Math.ceil((maxMarks * policy.passPercentageDefault) / 100);

  if (params.isExempt) {
    return {
      subjectName: params.subjectName,
      subjectCode: params.subjectCode || '',
      maxMarks,
      passMarks,
      marksObtained: null,
      isAbsent: false,
      isExempt: true,
      status: 'exempt',
      percentage: null,
      gradeLabel: 'Exempt (অব্যাহতি)',
      letterGrade: 'EX',
      gpaPoint: null,
      remarks: params.remarks || '',
      workflowStatus: params.workflowStatus || 'draft',
      examResultId: params.examResultId,
    };
  }

  if (params.isAbsent) {
    return {
      subjectName: params.subjectName,
      subjectCode: params.subjectCode || '',
      maxMarks,
      passMarks,
      marksObtained: null,
      isAbsent: true,
      isExempt: false,
      status: 'absent',
      percentage: 0,
      gradeLabel: 'Absent (অনুপস্থিত)',
      letterGrade: 'AB',
      gpaPoint: 0,
      remarks: params.remarks || 'অনুপস্থিত (Absent)',
      workflowStatus: params.workflowStatus || 'draft',
      examResultId: params.examResultId,
    };
  }

  if (params.marksObtained === null || params.marksObtained === undefined) {
    return {
      subjectName: params.subjectName,
      subjectCode: params.subjectCode || '',
      maxMarks,
      passMarks,
      marksObtained: null,
      isAbsent: false,
      isExempt: false,
      status: 'unentered',
      percentage: null,
      gradeLabel: 'Unentered (এন্ট্রি হয়নি)',
      letterGrade: '—',
      gpaPoint: null,
      remarks: params.remarks || '',
      workflowStatus: 'unentered',
      examResultId: params.examResultId,
    };
  }

  if (
    typeof params.marksObtained !== 'number' ||
    Number.isNaN(params.marksObtained) ||
    params.marksObtained < 0 ||
    params.marksObtained > maxMarks
  ) {
    return {
      subjectName: params.subjectName,
      subjectCode: params.subjectCode || '',
      maxMarks,
      passMarks,
      marksObtained: params.marksObtained,
      isAbsent: false,
      isExempt: false,
      status: 'invalid',
      percentage: null,
      gradeLabel: 'Invalid (অবৈধ নম্বর)',
      letterGrade: 'ERR',
      gpaPoint: null,
      remarks: params.remarks || '',
      workflowStatus: params.workflowStatus || 'draft',
      examResultId: params.examResultId,
      validationError: `নম্বর ০ থেকে পূর্ণমান (${maxMarks})-এর মধ্যে হতে হবে`,
    };
  }

  const pct = Math.round((params.marksObtained / maxMarks) * 10000) / 100;
  const passedSubject = params.marksObtained >= passMarks;

  if (!passedSubject) {
    const failTier =
      policy.gradeTiers.find((t) => !t.isPassing) || {
        labelBn: 'রাসিব (F)',
        labelEn: 'Rasib (F)',
        letterGrade: 'F',
        gpaPoint: 0,
      };
    return {
      subjectName: params.subjectName,
      subjectCode: params.subjectCode || '',
      maxMarks,
      passMarks,
      marksObtained: params.marksObtained,
      isAbsent: false,
      isExempt: false,
      status: 'failed',
      percentage: pct,
      gradeLabel: failTier.labelEn,
      letterGrade: failTier.letterGrade,
      gpaPoint: 0,
      remarks: params.remarks || '',
      workflowStatus: params.workflowStatus || 'draft',
      examResultId: params.examResultId,
    };
  }

  const sortedTiers = [...policy.gradeTiers].sort(
    (a, b) => b.minPercentage - a.minPercentage
  );
  const matchedTier =
    sortedTiers.find((t) => pct >= t.minPercentage && t.isPassing) ||
    sortedTiers.find((t) => t.isPassing) || {
      labelBn: 'উত্তীর্ণ (C)',
      labelEn: 'Pass (C)',
      letterGrade: 'C',
      gpaPoint: 2.0,
      isPassing: true,
    };

  return {
    subjectName: params.subjectName,
    subjectCode: params.subjectCode || '',
    maxMarks,
    passMarks,
    marksObtained: params.marksObtained,
    isAbsent: false,
    isExempt: false,
    status: 'passed',
    percentage: pct,
    gradeLabel: matchedTier.labelEn,
    letterGrade: matchedTier.letterGrade,
    gpaPoint: policy.enableGpa ? matchedTier.gpaPoint : null,
    remarks: params.remarks || '',
    workflowStatus: params.workflowStatus || 'draft',
    examResultId: params.examResultId,
  };
}

export type OverallStudentResultStatus =
  | 'PASS'
  | 'FAIL'
  | 'ABSENT'
  | 'INCOMPLETE';

export interface StudentTabulationRow {
  student: Student;
  examName: string;
  academicYear: string;
  className: string;
  sectionName: string;
  department: Department;
  publicationDate: string;
  subjectCells: EvaluatedSubjectCell[];
  totalObtained: number;
  totalMaxMarks: number;
  percentage: number;
  averageMarks: number;
  gpa: number | null;
  overallGradeLabel: string;
  overallLetterGrade: string;
  overallStatus: OverallStudentResultStatus;
  rank: number | null;
  enteredCount: number;
  unenteredCount: number;
  absentCount: number;
  failedCount: number;
  isFullyPublished: boolean;
  workflowSummary: ExamWorkflowStatus | 'mixed' | 'unentered';
}

export function computeClassTabulationSheet(
  students: Student[],
  exams: ExamResult[],
  setup: ExaminationSetup,
  options?: { publishedOnly?: boolean }
): StudentTabulationRow[] {
  const policy = setup.gradingPolicy || DEFAULT_MADRASA_GRADING_POLICY;
  const classStudents = students
    .filter(
      (s) =>
        s.className.trim() === setup.className.trim() &&
        s.status === 'active'
    )
    .sort((a, b) => a.rollNo - b.rollNo || a.admissionNo.localeCompare(b.admissionNo));

  const relevantExams = exams.filter(
    (e) =>
      e.examName.trim() === setup.examName.trim() &&
      e.academicYear.trim() === setup.academicYear.trim() &&
      e.className.trim() === setup.className.trim() &&
      (!options?.publishedOnly || isExamRecordPublished(e))
  );

  // Merge configured subjects with any extra subjects present in exam records
  const subjectMap = new Map<string, ExamSubjectConfig>();
  for (const sub of setup.subjects) {
    subjectMap.set(sub.subjectName.trim(), sub);
  }
  for (const ex of relevantExams) {
    const key = ex.subjectName.trim();
    if (!subjectMap.has(key)) {
      subjectMap.set(key, {
        subjectCode: ex.subjectCode || `SUB-${subjectMap.size + 1}`,
        subjectName: key,
        maxMarks: ex.fullMarks || 100,
        passMarks:
          ex.passMarks ??
          Math.ceil(((ex.fullMarks || 100) * policy.passPercentageDefault) / 100),
      });
    }
  }
  const subjects = Array.from(subjectMap.values());

  const rows: StudentTabulationRow[] = classStudents.map((stu) => {
    const stuExams = relevantExams.filter((e) => e.studentId === stu.id);
    const subjectCells: EvaluatedSubjectCell[] = subjects.map((sub) => {
      const rec = stuExams.find(
        (e) => e.subjectName.trim().toLowerCase() === sub.subjectName.trim().toLowerCase()
      );
      if (!rec) {
        return evaluateSubjectMarks({
          subjectName: sub.subjectName,
          subjectCode: sub.subjectCode,
          maxMarks: sub.maxMarks,
          passMarks: sub.passMarks,
          marksObtained: null,
          policy,
        });
      }
      return evaluateSubjectMarks({
        subjectName: sub.subjectName,
        subjectCode: rec.subjectCode || sub.subjectCode,
        maxMarks: rec.fullMarks || sub.maxMarks,
        passMarks: rec.passMarks ?? sub.passMarks,
        marksObtained: rec.isAbsent ? null : rec.marksObtained,
        isAbsent: Boolean(rec.isAbsent),
        isExempt: Boolean(rec.isExempt),
        remarks: rec.remarks || '',
        workflowStatus: resolveExamWorkflowStatus(rec),
        examResultId: rec.id,
        policy,
      });
    });

    const activeCells = subjectCells.filter((c) => !c.isExempt);
    const enteredCells = activeCells.filter(
      (c) => c.status === 'passed' || c.status === 'failed' || c.status === 'absent'
    );
    const unenteredCount = activeCells.filter((c) => c.status === 'unentered').length;
    const absentCount = activeCells.filter((c) => c.status === 'absent').length;
    const failedCount = activeCells.filter((c) => c.status === 'failed').length;

    const totalObtained = activeCells.reduce(
      (sum, c) => sum + (typeof c.marksObtained === 'number' && !c.isAbsent ? c.marksObtained : 0),
      0
    );
    const totalMaxMarks = activeCells.reduce((sum, c) => sum + c.maxMarks, 0);
    const percentage =
      totalMaxMarks > 0
        ? Math.round((totalObtained / totalMaxMarks) * 10000) / 100
        : 0;
    const averageMarks =
      enteredCells.length > 0
        ? Math.round((totalObtained / enteredCells.length) * 100) / 100
        : 0;

    let overallStatus: OverallStudentResultStatus = 'PASS';
    if (enteredCells.length === 0 || unenteredCount > 0) {
      overallStatus = 'INCOMPLETE';
    } else if (absentCount === activeCells.length && activeCells.length > 0) {
      overallStatus = 'ABSENT';
    } else if (
      policy.failIfAnySubjectFailed &&
      (failedCount > 0 || absentCount > 0)
    ) {
      overallStatus = 'FAIL';
    } else if (percentage < policy.passPercentageDefault) {
      overallStatus = 'FAIL';
    }

    let gpa: number | null = null;
    let overallGradeLabel = 'Incomplete (অসম্পূর্ণ)';
    let overallLetterGrade = 'INC';

    if (overallStatus === 'ABSENT') {
      gpa = policy.enableGpa ? 0 : null;
      overallGradeLabel = 'Absent (অনুপস্থিত)';
      overallLetterGrade = 'AB';
    } else if (overallStatus === 'FAIL') {
      gpa = policy.enableGpa ? 0 : null;
      overallGradeLabel = 'Rasib (F)';
      overallLetterGrade = 'F';
    } else if (overallStatus === 'PASS') {
      if (policy.enableGpa && activeCells.length > 0) {
        const sumGpa = activeCells.reduce((s, c) => s + (c.gpaPoint ?? 0), 0);
        gpa = Math.round((sumGpa / activeCells.length) * 100) / 100;
      }
      const sortedTiers = [...policy.gradeTiers].sort(
        (a, b) => b.minPercentage - a.minPercentage
      );
      const tier =
        sortedTiers.find((t) => percentage >= t.minPercentage && t.isPassing) ||
        sortedTiers.find((t) => t.isPassing);
      overallGradeLabel = tier?.labelEn || 'Pass (C)';
      overallLetterGrade = tier?.letterGrade || 'C';
    }

    const statuses = new Set(
      subjectCells
        .filter((c) => c.workflowStatus !== 'unentered')
        .map((c) => c.workflowStatus)
    );
    let workflowSummary: ExamWorkflowStatus | 'mixed' | 'unentered' = 'unentered';
    if (statuses.size === 1) {
      workflowSummary = Array.from(statuses)[0] as ExamWorkflowStatus;
    } else if (statuses.size > 1) {
      workflowSummary = 'mixed';
    }

    const isFullyPublished =
      activeCells.length > 0 &&
      unenteredCount === 0 &&
      subjectCells
        .filter((c) => !c.isExempt)
        .every((c) => c.workflowStatus === 'published');

    return {
      student: stu,
      examName: setup.examName,
      academicYear: setup.academicYear,
      className: setup.className,
      sectionName: setup.sectionName || 'প্রধান শাখা (Section A)',
      department: setup.department,
      publicationDate: setup.publicationDate,
      subjectCells,
      totalObtained,
      totalMaxMarks,
      percentage,
      averageMarks,
      gpa,
      overallGradeLabel,
      overallLetterGrade,
      overallStatus,
      rank: null,
      enteredCount: enteredCells.length,
      unenteredCount,
      absentCount,
      failedCount,
      isFullyPublished,
      workflowSummary,
    };
  });

  // Assign deterministic merit rank (with tie handling) if enabled in policy
  if (policy.enableRank) {
    const eligibleForRank = rows
      .filter((r) => r.overallStatus === 'PASS' && r.unenteredCount === 0)
      .sort((a, b) => {
        if (b.totalObtained !== a.totalObtained) {
          return b.totalObtained - a.totalObtained;
        }
        return (b.gpa ?? 0) - (a.gpa ?? 0);
      });

    let currentRank = 1;
    for (let i = 0; i < eligibleForRank.length; i += 1) {
      if (i > 0) {
        const prev = eligibleForRank[i - 1];
        const curr = eligibleForRank[i];
        const isTie =
          curr.totalObtained === prev.totalObtained &&
          (curr.gpa ?? 0) === (prev.gpa ?? 0);
        if (!isTie) {
          currentRank = i + 1;
        }
      }
      eligibleForRank[i].rank = currentRank;
    }
  }

  return rows;
}

export interface RawImportMarkRow {
  rowNumber: number;
  admissionNo: string;
  studentName?: string;
  marksOrStatus: string | number;
  remarks?: string;
}

export type ImportRowValidationStatus =
  | 'valid_new'
  | 'valid_draft_update'
  | 'duplicate_in_file'
  | 'existing_conflict'
  | 'unknown_student'
  | 'invalid_value';

export interface ValidatedImportMarkRow {
  rowNumber: number;
  admissionNo: string;
  matchedStudent?: Student;
  marksObtained: number;
  isAbsent: boolean;
  computedGrade: string;
   computedGpa: number | null;
  remarks: string;
  status: ImportRowValidationStatus;
  errorBn?: string;
  existingExamId?: string;
}

export interface MarksImportPreviewResult {
  rows: ValidatedImportMarkRow[];
  summary: {
    totalRows: number;
    validNewCount: number;
    validDraftUpdateCount: number;
    duplicateInFileCount: number;
    existingConflictCount: number;
    unknownStudentCount: number;
    invalidValueCount: number;
  };
}

export function validateAndPreviewMarksImport(
  rawRows: RawImportMarkRow[],
  students: Student[],
  existingExams: ExamResult[],
  context: {
    examName: string;
    academicYear: string;
    className: string;
    subjectName: string;
    maxMarks: number;
    passMarks: number;
    allowUpdateDrafts?: boolean;
    policy?: GradingPolicyConfig;
  }
): MarksImportPreviewResult {
  const seenAdmissionNos = new Set<string>();
  const policy = context.policy || DEFAULT_MADRASA_GRADING_POLICY;
  const rows: ValidatedImportMarkRow[] = [];

  for (const raw of rawRows) {
    const cleanAdm = String(raw.admissionNo || '').trim();
    const normAdm = cleanAdm.toUpperCase();
    const rawVal = String(raw.marksOrStatus ?? '').trim();

    if (!cleanAdm) {
      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: '',
        marksObtained: 0,
        isAbsent: false,
        computedGrade: '—',
        computedGpa: null,
        remarks: raw.remarks || '',
        status: 'unknown_student',
        errorBn: 'স্টুডেন্ট আইডি (Admission No) খালি রাখা হয়েছে। শুধুমাত্র নাম দিয়ে শিক্ষার্থী শনাক্ত করা হয় না।',
      });
      continue;
    }

    if (seenAdmissionNos.has(normAdm)) {
      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: cleanAdm,
        marksObtained: 0,
        isAbsent: false,
        computedGrade: '—',
        computedGpa: null,
        remarks: raw.remarks || '',
        status: 'duplicate_in_file',
        errorBn: `ফাইলের ভেতর একই স্টুডেন্ট আইডি (${cleanAdm}) একাধিকবার রয়েছে (Duplicate Row)।`,
      });
      continue;
    }
    seenAdmissionNos.add(normAdm);

    // Match strictly by verified Student ID (admissionNo) or canonical id
    const matchedStudent = students.find(
      (s) =>
        s.admissionNo.trim().toUpperCase() === normAdm ||
        s.id.trim().toUpperCase() === normAdm
    );

    if (!matchedStudent) {
      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: cleanAdm,
        marksObtained: 0,
        isAbsent: false,
        computedGrade: '—',
        computedGpa: null,
        remarks: raw.remarks || '',
        status: 'unknown_student',
        errorBn: `স্টুডেন্ট আইডি "${cleanAdm}" ডাটাবেসে পাওয়া যায়নি (Unknown Student ID)।`,
      });
      continue;
    }

    if (matchedStudent.className.trim() !== context.className.trim()) {
      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: cleanAdm,
        matchedStudent,
        marksObtained: 0,
        isAbsent: false,
        computedGrade: '—',
        computedGpa: null,
        remarks: raw.remarks || '',
        status: 'invalid_value',
        errorBn: `শিক্ষার্থী "${matchedStudent.nameBn}" নির্বাচিত জামাতের (${context.className}) নয়; তাঁর জামাত: ${matchedStudent.className}।`,
      });
      continue;
    }

    // Reject spreadsheet formulas or macros
    if (rawVal.startsWith('=')) {
      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: cleanAdm,
        matchedStudent,
        marksObtained: 0,
        isAbsent: false,
        computedGrade: '—',
        computedGpa: null,
        remarks: raw.remarks || '',
        status: 'invalid_value',
        errorBn: 'নিরাপত্তা নীতিমালা অনুযায়ী এক্সেল ফর্মুলা (=) অনুমোদিত নয়। সরাসরি সংখ্যা বা ABS লিখুন।',
      });
      continue;
    }

    if (!rawVal) {
      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: cleanAdm,
        matchedStudent,
        marksObtained: 0,
        isAbsent: false,
        computedGrade: '—',
        computedGpa: null,
        remarks: raw.remarks || '',
        status: 'invalid_value',
        errorBn: 'প্রাপ্ত নম্বর বা অনুপস্থিত (ABS) স্ট্যাটাস উল্লেখ করা হয়নি।',
      });
      continue;
    }

    const upperVal = rawVal.toUpperCase();
    const isAbsent =
      upperVal === 'ABS' ||
      upperVal === 'ABSENT' ||
      rawVal === 'অনুপস্থিত';

    let numericMarks = 0;
    if (!isAbsent) {
      const parsed = Number(rawVal);
      if (
        Number.isNaN(parsed) ||
        parsed < 0 ||
        parsed > context.maxMarks
      ) {
        rows.push({
          rowNumber: raw.rowNumber,
          admissionNo: cleanAdm,
          matchedStudent,
          marksObtained: 0,
          isAbsent: false,
          computedGrade: '—',
          computedGpa: null,
          remarks: raw.remarks || '',
          status: 'invalid_value',
          errorBn: `অবৈধ নম্বর "${rawVal}" — নম্বর ০ থেকে পূর্ণমান (${context.maxMarks})-এর মধ্যে হতে হবে।`,
        });
        continue;
      }
      numericMarks = Math.round(parsed * 100) / 100;
    }

    const evalCell = evaluateSubjectMarks({
      subjectName: context.subjectName,
      maxMarks: context.maxMarks,
      passMarks: context.passMarks,
      marksObtained: isAbsent ? null : numericMarks,
      isAbsent,
      policy,
    });

    const existingRec = existingExams.find(
      (e) =>
        e.studentId === matchedStudent.id &&
        e.examName.trim().toLowerCase() === context.examName.trim().toLowerCase() &&
        e.academicYear.trim().toLowerCase() === context.academicYear.trim().toLowerCase() &&
        e.subjectName.trim().toLowerCase() === context.subjectName.trim().toLowerCase()
    );

    if (existingRec) {
      const wf = resolveExamWorkflowStatus(existingRec);
      if (wf === 'approved' || wf === 'published') {
        rows.push({
          rowNumber: raw.rowNumber,
          admissionNo: cleanAdm,
          matchedStudent,
          marksObtained: numericMarks,
          isAbsent,
          computedGrade: evalCell.gradeLabel,
          computedGpa: evalCell.gpaPoint,
          remarks: raw.remarks || '',
          status: 'existing_conflict',
          existingExamId: existingRec.id,
          errorBn: `এই শিক্ষার্থীর ফলাফল ইতিমধ্যে "${wf === 'published' ? 'প্রকাশিত (Published)' : 'অনুমোদিত (Approved)'}" অবস্থায় রয়েছে; সরাসরি ইমপোর্টে ওভাররাইট নিষিদ্ধ।`,
        });
        continue;
      }

      if (!context.allowUpdateDrafts) {
        rows.push({
          rowNumber: raw.rowNumber,
          admissionNo: cleanAdm,
          matchedStudent,
          marksObtained: numericMarks,
          isAbsent,
          computedGrade: evalCell.gradeLabel,
          computedGpa: evalCell.gpaPoint,
          remarks: raw.remarks || '',
          status: 'existing_conflict',
          existingExamId: existingRec.id,
          errorBn: `এই বিষয়ে খসড়া নম্বর (${existingRec.marksObtained}) আগে থেকেই সংরক্ষিত আছে (Duplicate Record)। ওভাররাইট করতে চাইলে "বিদ্যমান খসড়া আপডেট করুন" অপশন সক্রিয় করুন।`,
        });
        continue;
      }

      rows.push({
        rowNumber: raw.rowNumber,
        admissionNo: cleanAdm,
        matchedStudent,
        marksObtained: numericMarks,
        isAbsent,
        computedGrade: evalCell.gradeLabel,
        computedGpa: evalCell.gpaPoint,
        remarks: raw.remarks || '',
        status: 'valid_draft_update',
        existingExamId: existingRec.id,
      });
      continue;
    }

    rows.push({
      rowNumber: raw.rowNumber,
      admissionNo: cleanAdm,
      matchedStudent,
      marksObtained: numericMarks,
      isAbsent,
      computedGrade: evalCell.gradeLabel,
      computedGpa: evalCell.gpaPoint,
      remarks: raw.remarks || '',
      status: 'valid_new',
    });
  }

  return {
    rows,
    summary: {
      totalRows: rows.length,
      validNewCount: rows.filter((r) => r.status === 'valid_new').length,
      validDraftUpdateCount: rows.filter((r) => r.status === 'valid_draft_update').length,
      duplicateInFileCount: rows.filter((r) => r.status === 'duplicate_in_file').length,
      existingConflictCount: rows.filter((r) => r.status === 'existing_conflict').length,
      unknownStudentCount: rows.filter((r) => r.status === 'unknown_student').length,
      invalidValueCount: rows.filter((r) => r.status === 'invalid_value').length,
    },
  };
}

export type ExamWorkflowActionType =
  | 'save_draft'
  | 'submit_for_review'
  | 'approve'
  | 'return_for_correction'
  | 'publish'
  | 'correct_published';

export function canPerformExamWorkflowAction(
  role: UserRole,
  action: ExamWorkflowActionType,
  currentWorkflowStatus: ExamWorkflowStatus = 'draft'
): { allowed: boolean; reasonBn?: string } {
  const isMuhtamimOrSuperAdmin = role === 'super_admin' || role === 'muhtamim';
  const isTeacher = role === 'teacher';

  if (!isMuhtamimOrSuperAdmin && !isTeacher) {
    return {
      allowed: false,
      reasonBn: 'শুধুমাত্র অনুমোদিত শিক্ষক বা মুহতামিম পরীক্ষার নম্বর ও ফলাফল পরিচালনা করতে পারবেন।',
    };
  }

  if (action === 'save_draft' || action === 'submit_for_review') {
    if (currentWorkflowStatus === 'published' || currentWorkflowStatus === 'approved') {
      if (!isMuhtamimOrSuperAdmin) {
        return {
          allowed: false,
          reasonBn: 'অনুমোদিত বা প্রকাশিত ফলাফল সাধারণ শিক্ষক সরাসরি পরিবর্তন করতে পারবেন না।',
        };
      }
    }
    return { allowed: true };
  }

  if (
    action === 'approve' ||
    action === 'return_for_correction' ||
    action === 'publish' ||
    action === 'correct_published'
  ) {
    if (!isMuhtamimOrSuperAdmin) {
      return {
        allowed: false,
        reasonBn: 'ফলাফল চূড়ান্ত অনুমোদন, প্রকাশ বা প্রকাশিত ফলাফল সংশোধনের এখতিয়ার শুধুমাত্র মুহতামিম / সুপার অ্যাডমিনের রয়েছে।',
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reasonBn: 'অননুমোদিত কার্যক্রম।' };
}

export function filterAuthorizedPublishedExamsForPortal(
  exams: ExamResult[],
  viewer: {
    role: UserRole;
    studentId?: string;
    linkedStudentIdsCsv?: string;
  }
): ExamResult[] {
  const publishedOnly = exams.filter((e) => isExamRecordPublished(e));

  if (viewer.role === 'student') {
    const cleanStuId = (viewer.studentId || '').trim();
    if (!cleanStuId) return [];
    return publishedOnly.filter((e) => e.studentId === cleanStuId);
  }

  if (viewer.role === 'guardian') {
    const allowedIds = new Set(
      (viewer.linkedStudentIdsCsv || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    );
    if (viewer.studentId) {
      allowedIds.add(viewer.studentId.trim());
    }
    return publishedOnly.filter((e) => allowedIds.has(e.studentId));
  }

  if (['super_admin', 'muhtamim', 'teacher'].includes(viewer.role)) {
    if (viewer.studentId) {
      return publishedOnly.filter((e) => e.studentId === viewer.studentId);
    }
    return publishedOnly;
  }

  return [];
}

// ============================================================================
// Phase 10 — Production Launch: Super Admin Bootstrap & Staff Hierarchy Logic
// ============================================================================

export function isSuperAdminAlreadyProvisioned(
  bootstrapLock: SuperAdminBootstrapLock | null | undefined,
  users: Pick<UserProfile, 'role' | 'status' | 'isDemoRecord'>[]
): boolean {
  if (bootstrapLock && bootstrapLock.isProvisioned) {
    return true;
  }
  return users.some(
    (u) => u.role === 'super_admin' && u.status === 'active' && !u.isDemoRecord
  );
}

export function validateSuperAdminBootstrapAttempt(params: {
  existingLock: SuperAdminBootstrapLock | null | undefined;
  existingUsers: Pick<UserProfile, 'role' | 'status' | 'email' | 'isDemoRecord'>[];
  candidateUid: string;
  candidateEmail: string;
  candidateDisplayName: string;
  candidatePhone?: string;
  allowedBootstrapEmail: string;
  setupTokenInput?: string;
  expectedSetupToken?: string;
}): {
  ok: boolean;
  errorBn?: string;
  errorEn?: string;
  lockRecord?: SuperAdminBootstrapLock;
  superAdminProfile?: UserProfile;
  auditLog?: AdminAuditLog;
} {
  if (isSuperAdminAlreadyProvisioned(params.existingLock, params.existingUsers)) {
    return {
      ok: false,
      errorBn:
        'সুপার অ্যাডমিন ইতিমধ্যে প্রভিশন করা হয়েছে (Locked)। দ্বিতীয়বার সুপার অ্যাডমিন বুটস্ট্র্যাপ করা সম্পূর্ণ নিষিদ্ধ।',
      errorEn:
        'Super Admin has already been provisioned and locked. Repeated bootstrap is forbidden.',
    };
  }

  const cleanUid = (params.candidateUid || '').trim();
  const cleanEmail = (params.candidateEmail || '').trim().toLowerCase();
  const cleanName = (params.candidateDisplayName || '').trim();
  const cleanAllowedEmail = (params.allowedBootstrapEmail || '').trim().toLowerCase();

  if (!cleanUid || !ID_REGEX.test(cleanUid)) {
    return {
      ok: false,
      errorBn: 'বুটস্ট্র্যাপের জন্য বৈধ Firebase Auth সেশন আবশ্যক।',
      errorEn: 'A verified Firebase Authentication session is required for bootstrap.',
    };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      ok: false,
      errorBn: 'বৈধ প্রাতিষ্ঠানিক ইমেইল ঠিকানা আবশ্যক।',
      errorEn: 'Valid email address is required.',
    };
  }

  if (cleanName.length < 2) {
    return {
      ok: false,
      errorBn: 'সুপার অ্যাডমিনের পূর্ণ নাম (কমপক্ষে ২ অক্ষর) প্রদান করুন।',
      errorEn: 'Super Admin full name is required.',
    };
  }

  const emailMatchesOwner =
    Boolean(cleanAllowedEmail) && cleanEmail === cleanAllowedEmail;
  const tokenMatches =
    Boolean(params.expectedSetupToken) &&
    Boolean(params.setupTokenInput) &&
    params.setupTokenInput?.trim() === params.expectedSetupToken?.trim();

  if (!emailMatchesOwner && !tokenMatches) {
    return {
      ok: false,
      errorBn:
        'অননুমোদিত বুটস্ট্র্যাপ প্রচেষ্টা। শুধুমাত্র যাচাইকৃত প্রাতিষ্ঠানিক মালিকের ইমেইল অথবা এককালীন সেটআপ টোকেন দিয়ে সুপার অ্যাডমিন প্রভিশন করা যাবে।',
      errorEn:
        'Unauthorized bootstrap attempt. Only the verified owner identity or one-time setup token may provision the Super Admin.',
    };
  }

  const nowIso = new Date().toISOString().slice(0, 10);

  const lockRecord: SuperAdminBootstrapLock = {
    id: 'super_admin_lock',
    lockId: 'super_admin_lock',
    isProvisioned: true,
    superAdminUid: cleanUid,
    superAdminEmail: cleanEmail,
    superAdminName: cleanName,
    provisionedAt: nowIso,
    bootstrapMethod: tokenMatches ? 'one_time_setup_token' : 'verified_owner_session',
    authorId: cleanUid,
  };

  const superAdminProfile: UserProfile = {
    id: cleanUid,
    uid: cleanUid,
    email: cleanEmail,
    displayName: cleanName,
    role: 'super_admin',
    status: 'active',
    linkedStudentIds: '',
    assignedClasses: 'সকল জামাত',
    phone: (params.candidatePhone || '01711-000000').trim(),
    isDemoRecord: false,
  };

  const auditLog: AdminAuditLog = {
    id: `aud-boot-${cleanUid}`,
    action: 'super_admin_bootstrapped',
    actorUid: cleanUid,
    actorEmail: cleanEmail,
    actorRole: 'super_admin',
    targetUid: cleanUid,
    targetEmail: cleanEmail,
    targetRole: 'super_admin',
    summaryBn: `প্রথমবার সুপার অ্যাডমিন অ্যাকাউন্ট (${cleanName} • ${cleanEmail}) যাচাইকৃতভাবে প্রভিশন ও লক করা হয়েছে।`,
    timestamp: nowIso,
    authorId: cleanUid,
  };

  return {
    ok: true,
    lockRecord,
    superAdminProfile,
    auditLog,
  };
}

export function canProvisionStaffAccount(
  actorRole: UserRole,
  targetRole: UserRole | InvitationTargetRole
): {
  allowed: boolean;
  reasonBn?: string;
  reasonEn?: string;
} {
  if (targetRole === 'super_admin') {
    return {
      allowed: false,
      reasonBn: 'সাধারণ আমন্ত্রণ ফরমের মাধ্যমে সুপার অ্যাডমিন তৈরি করা সম্পূর্ণ নিষিদ্ধ।',
      reasonEn: 'Creating a Super Admin via staff invitation is strictly forbidden.',
    };
  }

  if (actorRole === 'super_admin') {
    const allowedTargets: InvitationTargetRole[] = [
      'muhtamim',
      'teacher',
      'accountant',
      'residential_supervisor',
      'staff',
      'student',
      'guardian',
    ];
    if (allowedTargets.includes(targetRole as InvitationTargetRole)) {
      return { allowed: true };
    }
  }

  if (actorRole === 'muhtamim') {
    if (targetRole === 'muhtamim') {
      return {
        allowed: false,
        reasonBn: 'শুধুমাত্র সুপার অ্যাডমিন নতুন মুহতামিম অ্যাকাউন্ট তৈরি বা আমন্ত্রণ জানাতে পারবেন।',
        reasonEn: 'Only the Super Admin can create or invite a Muhtamim account.',
      };
    }
    const allowedForMuhtamim: InvitationTargetRole[] = [
      'teacher',
      'accountant',
      'residential_supervisor',
      'staff',
      'student',
      'guardian',
    ];
    if (allowedForMuhtamim.includes(targetRole as InvitationTargetRole)) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reasonBn:
      'নিরাপত্তা নীতিমালা: শিক্ষক বা সাধারণ ব্যবহারকারী কোনো অ্যাডমিন, মুহতামিম বা স্টাফ অ্যাকাউন্ট তৈরি করতে পারবেন না।',
    reasonEn:
      'Security Policy: Teachers and non-administrative users cannot create staff or admin accounts.',
  };
}

export function canModifyUserAccountRoleOrStatus(params: {
  actorUid: string;
  actorRole: UserRole;
  targetUser: Pick<UserProfile, 'uid' | 'role' | 'status'>;
  nextRole: UserRole;
  nextStatus: UserProfile['status'];
}): {
  allowed: boolean;
  reasonBn?: string;
  reasonEn?: string;
} {
  const { actorUid, actorRole, targetUser, nextRole, nextStatus } = params;

  // Nobody can self-elevate to a higher administrative role
  if (actorUid && actorUid === targetUser.uid && nextRole !== targetUser.role) {
    return {
      allowed: false,
      reasonBn: 'নিরাপত্তা নীতিমালা: কোনো ব্যবহারকারী নিজের রোল নিজে পরিবর্তন বা উন্নীত করতে পারবেন না।',
      reasonEn: 'Users cannot modify or elevate their own role.',
    };
  }

  // Nobody can promote a regular user to super_admin via the RBAC table
  if (nextRole === 'super_admin' && targetUser.role !== 'super_admin') {
    return {
      allowed: false,
      reasonBn: 'সুপার অ্যাডমিন রোল শুধুমাত্র ওয়ান-টাইম বুটস্ট্র্যাপ লকের মাধ্যমে নির্ধারিত হয়; ম্যানুয়ালি উন্নীত করা নিষিদ্ধ।',
      reasonEn: 'Cannot manually elevate an account to Super Admin.',
    };
  }

  if (actorRole === 'super_admin') {
    if (targetUser.role === 'super_admin' && nextStatus !== 'active') {
      return {
        allowed: false,
        reasonBn: 'প্রাতিষ্ঠানিক নিরাপত্তার স্বার্থে সক্রিয় সুপার অ্যাডমিন অ্যাকাউন্ট স্থগিত করা যাবে না।',
        reasonEn: 'The active Super Admin account cannot be suspended.',
      };
    }
    return { allowed: true };
  }

  if (actorRole === 'muhtamim') {
    if (targetUser.role === 'super_admin' || targetUser.role === 'muhtamim') {
      return {
        allowed: false,
        reasonBn: 'মুহতামিম সুপার অ্যাডমিন বা অন্য মুহতামিমের রোল কিংবা স্ট্যাটাস পরিবর্তন করতে পারবেন না।',
        reasonEn: 'Muhtamim cannot modify Super Admin or Muhtamim accounts.',
      };
    }
    if (nextRole === 'muhtamim') {
      return {
        allowed: false,
        reasonBn: 'শুধুমাত্র সুপার অ্যাডমিন মুহতামিম রোল অনুমোদন করতে পারবেন।',
        reasonEn: 'Only Super Admin can assign the Muhtamim role.',
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reasonBn: 'শুধুমাত্র সুপার অ্যাডমিন বা মুহতামিম ইউজার অ্যাক্সেস নিয়ন্ত্রণ করতে পারবেন।',
    reasonEn: 'Only Super Admin or Muhtamim may modify user access.',
  };
}

export interface StaffInvitationInput {
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  targetRole: 'muhtamim' | 'teacher' | 'accountant' | 'residential_supervisor' | 'staff';
  employeeCode: string;
  nameBn: string;
  nameEn: string;
  email: string;
  phone: string;
  designation: string;
  department: StaffMember['department'];
  assignedClasses: string;
  assignedSubjects?: string;
  qualification: string;
  joiningDate: string;
  basicSalaryBdt: number;
  houseAllowanceBdt: number;
  medicalAllowanceBdt: number;
  expirationDays?: number;
  baseUrl?: string;
}

export function buildStaffAccountInvitation(
  input: StaffInvitationInput,
  existingInvitations: AccountInvitation[],
  existingStaff: StaffMember[]
): {
  ok: boolean;
  errorBn?: string;
  errorEn?: string;
  staffRecord?: StaffMember;
  invitation?: AccountInvitation;
  auditLog?: AdminAuditLog;
} {
  const perm = canProvisionStaffAccount(input.actorRole, input.targetRole);
  if (!perm.allowed) {
    return {
      ok: false,
      errorBn: perm.reasonBn,
      errorEn: perm.reasonEn,
    };
  }

  const cleanCode = (input.employeeCode || '').trim().toUpperCase();
  const cleanNameBn = (input.nameBn || '').trim();
  const cleanNameEn = (input.nameEn || '').trim();
  const cleanEmail = (input.email || '').trim().toLowerCase();
  const cleanPhone = (input.phone || '').trim();
  const cleanDesignation = (input.designation || '').trim();

  if (!cleanCode || !ID_REGEX.test(cleanCode)) {
    return {
      ok: false,
      errorBn: 'বৈধ শিক্ষক/স্টাফ আইডি (যেমন UQCM-MUH-01 বা UQCM-TCH-10) আবশ্যক।',
      errorEn: 'Valid Employee/Teacher Code is required.',
    };
  }

  if (cleanNameBn.length < 2 || cleanNameEn.length < 2) {
    return {
      ok: false,
      errorBn: 'পূর্ণ নাম (বাংলা ও ইংরেজি উভয়ই) প্রদান করা আবশ্যক।',
      errorEn: 'Full name in both Bengali and English is required.',
    };
  }

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      ok: false,
      errorBn: 'বৈধ অফিশিয়াল ইমেইল ঠিকানা প্রদান করুন।',
      errorEn: 'Valid official email address is required.',
    };
  }

  if (!/^[0-9+\-\s()]{7,25}$/.test(cleanPhone)) {
    return {
      ok: false,
      errorBn: 'সঠিক মোবাইল নম্বর প্রদান করুন (যেমন 01711-223344)।',
      errorEn: 'Valid mobile number is required.',
    };
  }

  // Prevent duplicate active pending/activated invitation for the same email
  const duplicateInvite = existingInvitations.find(
    (inv) =>
      inv.status !== 'revoked' &&
      inv.status !== 'expired' &&
      inv.recipientEmail.trim().toLowerCase() === cleanEmail &&
      inv.targetRole === input.targetRole
  );
  if (duplicateInvite) {
    return {
      ok: false,
      errorBn: `এই ইমেইলে (${cleanEmail}) ইতিমধ্যে একটি সক্রিয় আমন্ত্রণ কোড (${duplicateInvite.invitationCode}) বিদ্যমান রয়েছে।`,
      errorEn: `An active invitation (${duplicateInvite.invitationCode}) already exists for ${cleanEmail}.`,
    };
  }

  const existingStaffMatch = existingStaff.find(
    (s) => s.employeeCode.trim().toUpperCase() === cleanCode
  );
  const staffId = existingStaffMatch?.id || `stf-${cleanCode.toLowerCase()}`;
  const todayIso = new Date().toISOString().slice(0, 10);
  const expDays =
    typeof input.expirationDays === 'number' && input.expirationDays > 0
      ? input.expirationDays
      : 7;
  const expDate = new Date(Date.now() + expDays * 86400 * 1000)
    .toISOString()
    .slice(0, 10);

  const rolePrefix =
    input.targetRole === 'muhtamim'
      ? 'MUH'
      : input.targetRole === 'teacher'
        ? 'TCH'
        : input.targetRole === 'accountant'
          ? 'ACC'
          : input.targetRole === 'residential_supervisor'
            ? 'SUP'
            : 'STF';

  const suffix = computeDeterministicTokenSuffix(
    `${rolePrefix}:${cleanCode}:${cleanEmail}:${cleanPhone}`
  );
  const invitationCode = `ACT-${rolePrefix}-${cleanCode}-${suffix}`;
  const baseUrl = (input.baseUrl || 'https://uqcm.edu.bd').replace(/\/+$/, '');

  const staffRecord: StaffMember = {
    id: staffId,
    employeeCode: cleanCode,
    nameBn: cleanNameBn,
    nameEn: cleanNameEn,
    designation:
      cleanDesignation ||
      (input.targetRole === 'muhtamim'
        ? 'মুহতামিম (প্রিন্সিপাল)'
        : 'উস্তাযুল হাদিস / সহকারী শিক্ষক'),
    role: input.targetRole,
    department: input.department || 'hifz',
    assignedClasses: (input.assignedClasses || 'নির্ধারিত জামাত').trim(),
    phone: cleanPhone,
    qualification: (input.qualification || 'দাওরায়ে হাদিস / কামিল').trim(),
    joiningDate: (input.joiningDate || todayIso).trim(),
    basicSalaryBdt: Math.max(0, Number(input.basicSalaryBdt) || 18000),
    houseAllowanceBdt: Math.max(0, Number(input.houseAllowanceBdt) || 4000),
    medicalAllowanceBdt: Math.max(0, Number(input.medicalAllowanceBdt) || 1500),
    status: 'active',
    authorId: input.actorUid,
  };

  const invitation: AccountInvitation = {
    id: `inv-${rolePrefix.toLowerCase()}-${cleanCode.toLowerCase()}`,
    invitationCode,
    targetRole: input.targetRole,
    applicationId: `staff-onboard-${cleanCode.toLowerCase()}`,
    studentId: staffId,
    admissionNo: cleanCode,
    studentNameBn: cleanNameBn,
    recipientName: cleanNameBn,
    recipientPhone: cleanPhone,
    recipientEmail: cleanEmail,
    activationUrl: `${baseUrl}/?activate=${encodeURIComponent(invitationCode)}`,
    status: 'pending_activation',
    provisioningMode: 'single_use_activation_link',
    requiresPasswordChangeOnFirstLogin: false,
    issuedByUid: input.actorUid,
    issuedByRole: input.actorRole,
    issuedAt: todayIso,
    expiresAt: expDate,
    redeemedByUid: '',
    redeemedAt: '',
    staffId,
    employeeCode: cleanCode,
    designation: staffRecord.designation,
    assignedDepartment: staffRecord.department,
    assignedClasses: staffRecord.assignedClasses,
    assignedSubjects: (input.assignedSubjects || '').trim(),
    authorId: input.actorUid,
  };

  const auditLog: AdminAuditLog = {
    id: `aud-inv-${Date.now()}-${suffix}`,
    action: input.targetRole === 'muhtamim' ? 'muhtamim_invited' : 'staff_invited',
    actorUid: input.actorUid,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    targetUid: staffId,
    targetEmail: cleanEmail,
    targetRole: input.targetRole,
    summaryBn: `${
      input.targetRole === 'muhtamim' ? 'মুহতামিম' : 'উস্তায/স্টাফ'
    } অ্যাকাউন্ট আমন্ত্রণ (${cleanNameBn} • ${cleanCode} • কোড: ${invitationCode}) ইস্যু করা হয়েছে।`,
    timestamp: todayIso,
    authorId: input.actorUid,
  };

  return {
    ok: true,
    staffRecord,
    invitation,
    auditLog,
  };
}


