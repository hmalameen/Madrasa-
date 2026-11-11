export type Language = 'bn' | 'en' | 'ar';

export type UserRole =
  | 'super_admin'
  | 'muhtamim'
  | 'teacher'
  | 'accountant'
  | 'residential_supervisor'
  | 'guardian'
  | 'student'
  | 'staff';

export type Role = UserRole;

export type Department = 'hifz' | 'qawmi' | 'general';
export type DepartmentCode = Department;

export type ModuleId =
  | 'dashboard'
  | 'website_cms'
  | 'admissions'
  | 'students'
  | 'staff'
  | 'attendance'
  | 'exams'
  | 'fees'
  | 'hifz'
  | 'residential'
  | 'payroll'
  | 'student_portal'
  | 'guardian'
  | 'notices'
  | 'reports'
  | 'settings';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  linkedStudentIds: string; // comma-separated student IDs for guardians, or single student ID for students
  assignedClasses: string; // comma-separated class names for teachers
  phone: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface Student {
  id: string;
  admissionNo: string;
  nameBn: string;
  nameEn: string;
  nameAr: string;
  department: Department;
  className: string;
  rollNo: number;
  dateOfBirth: string;
  bloodGroup: string;
  admissionDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  guardianUid: string;
  studentUid?: string;
  photoUrl?: string;
  applicationId?: string;
  residentialStatus: 'residential' | 'day_scholar';
  dormitoryRoom: string;
  monthlyFeeBdt: number;
  status: 'active' | 'on_leave' | 'graduated' | 'transferred';
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface StaffMember {
  id: string;
  employeeCode: string;
  nameBn: string;
  nameEn: string;
  designation: string;
  role: 'muhtamim' | 'teacher' | 'accountant' | 'residential_supervisor' | 'staff';
  department: 'hifz' | 'qawmi' | 'general' | 'administration' | 'boarding';
  assignedClasses: string;
  phone: string;
  qualification: string;
  joiningDate: string;
  basicSalaryBdt: number;
  houseAllowanceBdt: number;
  medicalAllowanceBdt: number;
  status: 'active' | 'on_leave' | 'resigned';
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  className: string;
  department: Department;
  status: AttendanceStatus;
  guardianUid: string;
  remarks: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type ExamWorkflowStatus =
  | 'draft'
  | 'submitted_for_review'
  | 'under_review'
  | 'approved'
  | 'published';

export interface ExamResultAuditEntry {
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: ExamAuditAction;
  summaryBn: string;
  previousMarks?: number;
  newMarks?: number;
  reason?: string;
}

export interface ExamResult {
  id: string;
  examName: string;
  academicYear: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  className: string;
  sectionName?: string;
  department: Department;
  subjectName: string;
  subjectCode?: string;
  marksObtained: number;
  fullMarks: number;
  passMarks?: number;
  isAbsent?: boolean;
  isExempt?: boolean;
  remarks?: string;
  grade: string;
  gpaPoint?: number;
  isPublished: boolean;
  workflowStatus?: ExamWorkflowStatus;
  submittedByUid?: string;
  submittedAt?: string;
  reviewedByUid?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewReturnReason?: string;
  publishedByUid?: string;
  publishedAt?: string;
  previousPublishedMarks?: number;
  previousPublishedGrade?: string;
  correctionReason?: string;
  correctedAt?: string;
  correctedByUid?: string;
  auditHistory?: ExamResultAuditEntry[];
  guardianUid: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type FeeType =
  | 'monthly_tuition'
  | 'boarding_mess'
  | 'admission_fee'
  | 'exam_fee'
  | 'generator_utility';

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank_transfer' | 'unpaid';

export interface FeeInvoice {
  id: string;
  receiptNo: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  className: string;
  feeType: FeeType;
  billingMonth: string;
  amountDueBdt: number;
  amountPaidBdt: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  status: 'paid' | 'partial' | 'unpaid';
  guardianUid: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface ExpenseRecord {
  id: string;
  voucherNo: string;
  title: string;
  category: 'boarding_food' | 'utilities' | 'maintenance' | 'stationery' | 'events';
  amountBdt: number;
  expenseDate: string;
  approvedBy: string;
  notes: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type TajweedRating = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'needs_revision';

export interface HifzProgressLog {
  id: string;
  date: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  paraNumber: number;
  sabaqSurahAndAyat: string;
  sabaqLines: number;
  sabqiPara: string;
  manzilPara: string;
  tajweedRating: TajweedRating;
  teacherComment: string;
  guardianUid: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface ResidentialLeave {
  id: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  dormitoryRoom: string;
  reason: string;
  departureDate: string;
  expectedReturnDate: string;
  actualReturnDate: string;
  accompaniedBy: string;
  status: 'pending' | 'approved' | 'returned' | 'rejected';
  guardianUid: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffNameBn: string;
  employeeCode: string;
  designation: string;
  salaryMonth: string;
  basicSalaryBdt: number;
  allowancesBdt: number;
  deductionsBdt: number;
  netPayableBdt: number;
  status: 'paid' | 'pending';
  paymentDate: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface Notice {
  id: string;
  titleBn: string;
  titleEn: string;
  contentBn: string;
  targetAudience: 'all' | 'guardians' | 'teachers' | 'residential' | 'students';
  targetClass: string;
  priority: 'normal' | 'important' | 'urgent';
  publishDate: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface InstitutionSettings {
  id: string;
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
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BannerSlide {
  id: string;
  category: 'academic' | 'exam' | 'admission' | 'event';
  badgeBn: string;
  badgeEn: string;
  badgeAr: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  descriptionBn: string;
  descriptionEn: string;
  descriptionAr: string;
  metaDate: string;
  ctaModule: ModuleId;
  ctaLabelBn: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  theme: 'emerald' | 'navy' | 'ivory';
  isActive: boolean;
  authorId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AssignmentCompletionStatus = 'pending' | 'completed' | 'needs_revision';

export interface StudyDiaryEntry {
  id: string;
  date: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  className: string;
  department: Department;
  subjectName: string;
  lessonCovered: string;
  homeworkAssigned: string;
  dueDate: string;
  completionStatus: AssignmentCompletionStatus;
  teacherFeedback: string;
  learningGoal: string;
  visibleToGuardian: boolean;
  guardianUid: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface GuardianInquiry {
  id: string;
  studentId: string;
  studentNameBn: string;
  admissionNo: string;
  guardianUid: string;
  guardianName: string;
  subject: string;
  message: string;
  teacherReply: string;
  status: 'open' | 'replied' | 'resolved';
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type AdmissionStatus =
  | 'pending'
  | 'under_review'
  | 'needs_correction'
  | 'approved'
  | 'rejected';

export type AdmissionEntrySource = 'online_public' | 'muhtamim_direct';

export type GuardianVerificationMethod = 'sms_otp' | 'email_link';

export type GuardianVerificationStatus =
  | 'unverified'
  | 'pending_verification'
  | 'verified';

export type AccountActivationLifecycleStatus =
  | 'not_started'
  | 'pending_guardian_verification'
  | 'pending_activation'
  | 'activated'
  | 'suspended';

export interface AdmissionApplication {
  id: string;
  referenceNo: string;
  entrySource?: AdmissionEntrySource;
  applicantUid: string;
  applicantEmail?: string;
  // Step 1: Student Info
  nameBn: string;
  nameEn: string;
  nameAr: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  bloodGroup: string;
  birthRegNo: string;
  presentAddress: string;
  permanentAddress: string;
  photoUrl: string;
  photoFileName?: string;
  // Step 2: Parent & Guardian Info
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  requestGuardianAccount: boolean;
  guardianVerificationMethod?: GuardianVerificationMethod;
  guardianVerificationStatus?: GuardianVerificationStatus;
  guardianVerifiedAt?: string;
  guardianUid: string;
  // Step 3: Academic & Admission Details
  department: Department;
  requestedClass: string;
  academicSession: string;
  previousInstitution: string;
  previousClass: string;
  residentialStatus: 'residential' | 'day_scholar';
  medicalOrSpecialNotes: string;
  // Step 4: Documents & Consent
  documentName?: string;
  documentSummaryUrl?: string;
  birthCertDocName?: string;
  birthCertDocDataUrl?: string;
  prevCertDocName?: string;
  consentAccepted: boolean;
  // Decision & Provisioning
  status: AdmissionStatus;
  adminRemarks: string;
  assignedStudentId: string;
  assignedAdmissionNo: string;
  assignedRollNo: number;
  assignedDormitoryRoom: string;
  assignedMonthlyFeeBdt: number;
  studentInvitationCode?: string;
  guardianInvitationCode?: string;
  accountActivationStatus?: AccountActivationLifecycleStatus;
  applicantNameBn?: string;
  guardianAccountStatus?:
    | 'not_requested'
    | 'pending'
    | 'pending_verification'
    | 'pending_activation'
    | 'activated'
    | 'active';
  studentAccountStatus?:
    | 'not_requested'
    | 'pending'
    | 'pending_activation'
    | 'activated'
    | 'active';
  submittedDate?: string;
  reviewedDate?: string;
  reviewedByUid: string;
  reviewedByName?: string;
  decisionAt?: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface GuardianLinkRequest {
  id: string;
  guardianUid: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  relationship: string;
  requestedStudentId?: string;
  requestedAdmissionNo: string;
  requestedStudentNameBn?: string;
  studentNameBn?: string;
  matchedStudentId?: string;
  verificationNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  adminRemarks?: string;
  requestedDate?: string;
  reviewedDate?: string;
  reviewedByUid: string;
  reviewedAt?: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type InvitationTargetRole =
  | 'muhtamim'
  | 'teacher'
  | 'accountant'
  | 'residential_supervisor'
  | 'staff'
  | 'student'
  | 'guardian';

export interface AccountInvitation {
  id: string;
  invitationCode: string;
  targetRole: InvitationTargetRole;
  applicationId: string;
  studentId: string;
  admissionNo: string;
  studentNameBn?: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  activationUrl?: string;
  status: 'pending' | 'pending_activation' | 'activated' | 'revoked' | 'expired';
  provisioningMode?: 'single_use_activation_link';
  requiresPasswordChangeOnFirstLogin?: boolean;
  verificationMethod?: GuardianVerificationMethod;
  verificationStatus?: GuardianVerificationStatus;
  verifiedAt?: string;
  issuedByUid: string;
  issuedByRole?: UserRole;
  issuedAt: string;
  expiresAt?: string;
  redeemedByUid: string;
  redeemedAt: string;
  staffId?: string;
  employeeCode?: string;
  designation?: string;
  assignedDepartment?: string;
  assignedClasses?: string;
  assignedSubjects?: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export interface SuperAdminBootstrapLock {
  id: string;
  lockId: 'super_admin_lock';
  isProvisioned: boolean;
  superAdminUid: string;
  superAdminEmail: string;
  superAdminName: string;
  provisionedAt: string;
  bootstrapMethod: 'verified_owner_session' | 'one_time_setup_token';
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AdminAuditActionType =
  | 'super_admin_bootstrapped'
  | 'muhtamim_invited'
  | 'staff_invited'
  | 'invitation_activated'
  | 'invitation_revoked'
  | 'user_role_updated'
  | 'user_status_suspended'
  | 'user_status_activated'
  | 'admission_approved';

export interface AdminAuditLog {
  id: string;
  action: AdminAuditActionType;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  targetUid: string;
  targetEmail: string;
  targetRole: string;
  summaryBn: string;
  timestamp: string;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ============================================================================
// Phase 9 — Examination Setup, Configurable Grading Policy & Audit Trail Types
// ============================================================================

export interface ExamSubjectConfig {
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  fullMarks?: number;
  passMarks: number;
  isOptional?: boolean;
  isCompulsory?: boolean;
}

export interface GradingTierConfig {
  minPercentage: number;
  maxPercentage: number;
  labelBn: string;
  labelEn: string;
  letterGrade: string;
  gpaPoint: number;
  isPassing: boolean;
}

export interface GradingPolicyConfig {
  id: string;
  nameBn: string;
  nameEn: string;
  enableGpa: boolean;
  gpaScale: number;
  enableRank: boolean;
  failIfAnySubjectFailed: boolean;
  passPercentageDefault: number;
  gradeTiers: GradingTierConfig[];
}

export interface ExaminationSetup {
  id: string;
  examName: string;
  academicYear: string;
  department: Department;
  className: string;
  sectionName: string;
  examDate: string;
  publicationDate: string;
  instructions: string;
  gradingPolicy: GradingPolicyConfig;
  subjects: ExamSubjectConfig[];
  workflowStatus?: ExamWorkflowStatus;
  authorId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoRecord?: boolean;
}

export type ExamAuditAction =
  | 'setup_saved'
  | 'marks_saved'
  | 'bulk_marks_saved'
  | 'excel_csv_imported'
  | 'submitted_for_review'
  | 'approved'
  | 'result_approved'
  | 'returned_for_correction'
  | 'published'
  | 'result_published'
  | 'published_result_corrected'
  | 'pdf_exported';

export interface ExamAuditLog {
  id: string;
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: ExamAuditAction;
  examName: string;
  academicYear: string;
  className: string;
  subjectName?: string;
  affectedCount: number;
  summaryBn: string;
  detailsBn?: string;
  previousValueSummary?: string;
}

// ============================================================================
// Phase 4 — Institutional Website CMS Types
// ============================================================================

export type CmsPublicationStatus = 'draft' | 'published';

export type HomepageSectionId =
  | 'hero'
  | 'intro'
  | 'departments'
  | 'why_choose_us'
  | 'muhtamim_message'
  | 'teachers_admin'
  | 'admission_highlights'
  | 'notices_preview'
  | 'events_news'
  | 'results_achievements'
  | 'gallery_preview'
  | 'contact_footer';

export interface CmsHomepageSectionConfig {
  id: HomepageSectionId;
  visible: boolean;
  status: CmsPublicationStatus;
  badgeBn: string;
  badgeEn: string;
  badgeAr: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  subtitleBn: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionBn: string;
  descriptionEn: string;
  descriptionAr: string;
  primaryCtaBn?: string;
  primaryCtaEn?: string;
  primaryCtaAr?: string;
  secondaryCtaBn?: string;
  secondaryCtaEn?: string;
  secondaryCtaAr?: string;
  mediaNoteBn?: string;
  mediaNoteEn?: string;
  mediaNoteAr?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type CmsPublicPageSlug =
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

export interface CmsInstitutionalPageContent {
  slug: CmsPublicPageSlug;
  status: CmsPublicationStatus;
  badgeBn: string;
  badgeEn: string;
  badgeAr: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  subtitleBn: string;
  subtitleEn: string;
  subtitleAr: string;
  summaryBn: string;
  summaryEn: string;
  summaryAr: string;
  highlightsBn: string[];
  highlightsEn: string[];
  highlightsAr: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface CmsPublicProfile {
  id: string;
  profileType: 'teacher' | 'administration';
  nameBn: string;
  nameEn: string;
  nameAr: string;
  designationBn: string;
  designationEn: string;
  designationAr: string;
  department: 'hifz' | 'qawmi' | 'general' | 'administration' | 'boarding';
  biographyBn: string;
  biographyEn: string;
  biographyAr: string;
  photoUrl: string;
  displayOrder: number;
  status: 'published' | 'unpublished';
  updatedAt: string;
}

export interface CmsPublicEvent {
  id: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  descriptionBn: string;
  descriptionEn: string;
  descriptionAr: string;
  eventDate: string;
  category: 'academic' | 'exam' | 'admission' | 'event';
  badgeBn: string;
  badgeEn: string;
  badgeAr: string;
  coverImageUrl: string;
  galleryImageUrls: string[];
  status: CmsPublicationStatus;
  updatedAt: string;
}

export interface CmsGalleryItem {
  id: string;
  departmentKey: 'hifz' | 'qawmi' | 'general' | 'residential';
  categoryBn: string;
  categoryEn: string;
  categoryAr: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  captionBn: string;
  captionEn: string;
  captionAr: string;
  detailsBn: string;
  detailsEn: string;
  detailsAr: string;
  imageUrl: string;
  accentColor: string;
  displayOrder: number;
  status: CmsPublicationStatus;
  updatedAt: string;
}

export interface CmsContactFooterConfig {
  status: CmsPublicationStatus;
  institutionNameBn: string;
  institutionNameEn: string;
  institutionNameAr: string;
  addressBn: string;
  addressEn: string;
  addressAr: string;
  phone: string;
  email: string;
  mapLink: string;
  facebookUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  footerDescriptionBn: string;
  footerDescriptionEn: string;
  footerDescriptionAr: string;
  officeHoursBn: string;
  officeHoursEn: string;
  officeHoursAr: string;
  updatedAt: string;
}

export interface CmsActivityLogItem {
  id: string;
  section: 'homepage' | 'pages' | 'teachers' | 'notices' | 'events' | 'gallery' | 'contact';
  titleBn: string;
  titleEn: string;
  titleAr: string;
  status: 'draft' | 'published' | 'unpublished';
  timestamp: string;
  actorName: string;
}

export interface CmsNoticeMetadata {
  status: CmsPublicationStatus;
  category: 'general' | 'academic' | 'exam' | 'admission' | 'holiday';
  expiryDate: string;
  attachmentUrl: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
}

export interface CmsDraftNotice {
  id: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  contentBn: string;
  contentEn: string;
  contentAr: string;
  category: 'general' | 'academic' | 'exam' | 'admission' | 'holiday';
  targetAudience: 'all' | 'guardians' | 'teachers' | 'residential' | 'students';
  targetClass: string;
  priority: 'normal' | 'important' | 'urgent';
  publishDate: string;
  expiryDate?: string;
  attachmentUrl?: string;
  authorName?: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebsiteCmsConfig {
  id: string;
  homepageSections: Record<HomepageSectionId, CmsHomepageSectionConfig>;
  publishedHomepageSections?: Record<HomepageSectionId, CmsHomepageSectionConfig>;
  pages: Record<CmsPublicPageSlug, CmsInstitutionalPageContent>;
  publishedPages?: Record<CmsPublicPageSlug, CmsInstitutionalPageContent>;
  publicProfiles: CmsPublicProfile[];
  events: CmsPublicEvent[];
  galleryItems: CmsGalleryItem[];
  contactFooter: CmsContactFooterConfig;
  publishedContactFooter?: CmsContactFooterConfig;
  draftNotices?: CmsDraftNotice[];
  recentUpdates: CmsActivityLogItem[];
  updatedAt: string;
  updatedBy: string;
}



