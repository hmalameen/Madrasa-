import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAccountProvisioningPackage,
  buildProvisionedStudentFromApplication,
  calculateInvoiceStatus,
  calculateMadrasaGrade,
  calculateNetSalary,
  canAccessModule,
  canAccountAccessPortal,
  canApproveAdmissions,
  canReplaceApprovedStudentPhoto,
  canViewAdmissionApplication,
  classifyLoginIdentifier,
  computeAttendanceMetrics,
  computeDepartmentChartMetrics,
  computeExamAnalytics,
  filterGuardianStudents,
  filterVisibleStudyDiaryEntries,
  formatBdt,
  formatNum,
  generateAdmissionReferenceNo,
  generateCsvContent,
  getNextSlideIndex,
  getPrevSlideIndex,
  isDuplicateAdmissionSubmission,
  isDuplicateAttendance,
  mapFirebaseAuthErrorToMessage,
  mergeLinkedStudentIds,
  resolvePostLoginRedirect,
  resolveStudentPortalRecord,
  toBengaliDigits,
  validateAdmissionStep,
  validateAndRedeemActivationInvitation,
  validateInvoiceInput,
  validateLoginInput,
  validatePhotoUploadMetadata,
  validateRegistrationInput,
  validateStudentInput,
  verifyPublicApplicationLookup,
  DEFAULT_MADRASA_GRADING_POLICY,
  resolveExamWorkflowStatus,
  isExamRecordPublished,
  validateExaminationSetup,
  evaluateSubjectMarks,
  computeClassTabulationSheet,
  validateAndPreviewMarksImport,
  canPerformExamWorkflowAction,
  filterAuthorizedPublishedExamsForPortal,
  isSuperAdminAlreadyProvisioned,
  validateSuperAdminBootstrapAttempt,
  canProvisionStaffAccount,
  canModifyUserAccountRoleOrStatus,
  buildStaffAccountInvitation,
} from './madrasaLogic';
import {
  inspectFirebaseAdminEnv,
  normalizePemPrivateKey,
  verifyBootstrapSecretTimingSafe,
} from '../server/superAdminBootstrapServer';
import type {
  AccountInvitation,
  AdmissionApplication,
  AttendanceRecord,
  ExamResult,
  ExaminationSetup,
  Student,
  StudyDiaryEntry,
  SuperAdminBootstrapLock,
  UserProfile,
} from '../types/madrasa';
import {
  tr,
  localizeActiveDepartments,
  localizeAddress,
  localizeGradingSystem,
  localizeGradeTierLabel,
  localizeExamSetupField,
  localizeNoticeRecord,
} from './publicTranslations';

test('calculateMadrasaGrade computes Befaq and Madrasa grades accurately', () => {
  assert.equal(calculateMadrasaGrade(85, 100), 'Mumtaz (A+)');
  assert.equal(calculateMadrasaGrade(74, 100), 'Jayyid Jiddan (A)');
  assert.equal(calculateMadrasaGrade(62, 100), 'Jayyid (A-)');
  assert.equal(calculateMadrasaGrade(55, 100), 'Maqbul (B)');
  assert.equal(calculateMadrasaGrade(40, 100), 'Pass (C)');
  assert.equal(calculateMadrasaGrade(25, 100), 'Rasib (F)');
});

test('calculateInvoiceStatus prevents claiming payment succeeded when unpaid', () => {
  const unpaid = calculateInvoiceStatus(4500, 0, 'unpaid');
  assert.equal(unpaid.status, 'unpaid');
  assert.equal(unpaid.balanceBdt, 4500);

  const partial = calculateInvoiceStatus(4500, 2500, 'bkash');
  assert.equal(partial.status, 'partial');
  assert.equal(partial.balanceBdt, 2000);

  const paid = calculateInvoiceStatus(4500, 4500, 'cash');
  assert.equal(paid.status, 'paid');
  assert.equal(paid.balanceBdt, 0);
});

test('calculateNetSalary computes basic plus allowances minus deductions', () => {
  assert.equal(calculateNetSalary(18000, 4500, 500), 22000);
  assert.equal(calculateNetSalary(10000, 0, 15000), 0);
});

test('canAccessModule enforces least-privilege role permissions including student_portal', () => {
  assert.equal(canAccessModule('super_admin', 'payroll'), true);
  assert.equal(canAccessModule('accountant', 'payroll'), true);
  assert.equal(canAccessModule('teacher', 'payroll'), false);
  assert.equal(canAccessModule('guardian', 'payroll'), false);
  assert.equal(canAccessModule('guardian', 'guardian'), true);
  assert.equal(canAccessModule('guardian', 'student_portal'), false);
  assert.equal(canAccessModule('student', 'student_portal'), true);
  assert.equal(canAccessModule('student', 'guardian'), false);
  assert.equal(canAccessModule('student', 'settings'), false);
  assert.equal(canAccessModule('residential_supervisor', 'residential'), true);
});

test('validateStudentInput blocks empty fields and invalid admission numbers', () => {
  const invalid = validateStudentInput({
    admissionNo: 'BAD ID WITH SPACES!',
    nameBn: '',
    nameEn: '',
    className: '',
    guardianName: '',
    guardianPhone: '123',
    rollNo: 0,
    monthlyFeeBdt: -10,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.admissionNo);
  assert.ok(invalid.errors.nameBn);
  assert.ok(invalid.errors.guardianPhone);

  const valid = validateStudentInput({
    admissionNo: 'UQCM-2026-101',
    nameBn: 'আব্দুল্লাহ আল মামুন',
    nameEn: 'Abdullah Al Mamun',
    className: 'হিফয তাকমীল',
    guardianName: 'মাওলানা মাহমুদুল হাসান',
    guardianPhone: '01711223344',
    rollNo: 1,
    monthlyFeeBdt: 4500,
  });
  assert.equal(valid.valid, true);
});

test('validateInvoiceInput requires transaction reference for digital payments', () => {
  const missingRef = validateInvoiceInput({
    receiptNo: 'INV-2026-01',
    studentId: 'stu-1',
    amountDueBdt: 4500,
    amountPaidBdt: 4500,
    paymentMethod: 'bkash',
    transactionRef: '',
  });
  assert.equal(missingRef.valid, false);
  assert.ok(missingRef.errors.transactionRef);

  const validCash = validateInvoiceInput({
    receiptNo: 'INV-2026-01',
    studentId: 'stu-1',
    amountDueBdt: 4500,
    amountPaidBdt: 4500,
    paymentMethod: 'cash',
    transactionRef: '',
  });
  assert.equal(validCash.valid, true);
});

test('isDuplicateAttendance prevents duplicate attendance for same date and student', () => {
  const records: AttendanceRecord[] = [
    {
      id: 'att-1',
      date: '2026-10-22',
      studentId: 'stu-101',
      studentNameBn: 'আব্দুল্লাহ',
      admissionNo: 'UQCM-101',
      className: 'Hifz',
      department: 'hifz',
      status: 'present',
      guardianUid: 'g-1',
      remarks: '',
      authorId: 'u-1',
    },
  ];
  assert.equal(isDuplicateAttendance(records, '2026-10-22', 'stu-101'), true);
  assert.equal(isDuplicateAttendance(records, '2026-10-22', 'stu-102'), false);
});

const SAMPLE_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    admissionNo: 'UQCM-101',
    nameBn: 'আব্দুল্লাহ',
    nameEn: 'Abdullah',
    nameAr: 'عبد الله',
    department: 'hifz',
    className: 'Hifz',
    rollNo: 1,
    dateOfBirth: '2014-01-01',
    bloodGroup: 'O+',
    admissionDate: '2025-01-10',
    guardianName: 'Guardian 1',
    guardianPhone: '01700000001',
    guardianRelation: 'Father',
    guardianUid: 'guardian-uid-1',
    studentUid: 'student-uid-1',
    residentialStatus: 'residential',
    dormitoryRoom: 'Darul Arqam - 201',
    monthlyFeeBdt: 4500,
    status: 'active',
    authorId: 'admin',
  },
  {
    id: 'stu-2',
    admissionNo: 'UQCM-102',
    nameBn: 'ওমর ফারুক',
    nameEn: 'Omar Faruq',
    nameAr: 'عمر فاروق',
    department: 'qawmi',
    className: 'Nahwul Mir',
    rollNo: 2,
    dateOfBirth: '2013-05-12',
    bloodGroup: 'B+',
    admissionDate: '2025-01-12',
    guardianName: 'Guardian 2',
    guardianPhone: '01700000002',
    guardianRelation: 'Father',
    guardianUid: 'guardian-uid-2',
    studentUid: 'student-uid-2',
    residentialStatus: 'residential',
    dormitoryRoom: 'Darul Arqam - 202',
    monthlyFeeBdt: 4200,
    status: 'active',
    authorId: 'admin',
  },
];

test('filterGuardianStudents isolates only authorized guardian children and blocks pending/suspended accounts', () => {
  const filtered = filterGuardianStudents(SAMPLE_STUDENTS, 'guardian-uid-1', '', 'active');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'stu-1');

  // Pending or suspended guardian account must receive zero student records
  assert.equal(
    filterGuardianStudents(SAMPLE_STUDENTS, 'guardian-uid-1', 'stu-1', 'pending').length,
    0
  );
  assert.equal(
    filterGuardianStudents(SAMPLE_STUDENTS, 'guardian-uid-1', 'stu-1', 'suspended').length,
    0
  );

  // Unlinked guardian must receive zero records
  assert.equal(
    filterGuardianStudents(SAMPLE_STUDENTS, 'unlinked-guardian', '', 'active').length,
    0
  );
});

test('resolveStudentPortalRecord isolates only the single authenticated student and blocks pending/suspended accounts', () => {
  assert.equal(canAccountAccessPortal('active').allowed, true);
  assert.equal(canAccountAccessPortal('pending').allowed, false);
  assert.equal(canAccountAccessPortal('suspended').allowed, false);

  const ownRecord = resolveStudentPortalRecord(
    SAMPLE_STUDENTS,
    'student-uid-1',
    '',
    'active'
  );
  assert.equal(ownRecord?.id, 'stu-1');

  // Even if CSV has multiple IDs, student portal resolves only the first authorized one
  const linkedRecord = resolveStudentPortalRecord(
    SAMPLE_STUDENTS,
    'other-uid',
    'stu-2,stu-1',
    'active'
  );
  assert.equal(linkedRecord?.id, 'stu-2');

  // Pending or suspended student cannot access record
  assert.equal(
    resolveStudentPortalRecord(SAMPLE_STUDENTS, 'student-uid-1', 'stu-1', 'pending'),
    null
  );
  assert.equal(
    resolveStudentPortalRecord(SAMPLE_STUDENTS, 'student-uid-1', 'stu-1', 'suspended'),
    null
  );
  // Unlinked student gets null
  assert.equal(
    resolveStudentPortalRecord(SAMPLE_STUDENTS, 'unknown-uid', '', 'active'),
    null
  );
});

test('filterVisibleStudyDiaryEntries hides internal teacher notes from guardians and students', () => {
  const entries: StudyDiaryEntry[] = [
    {
      id: 'd-1',
      date: '2026-10-22',
      studentId: 'stu-1',
      studentNameBn: 'আব্দুল্লাহ',
      admissionNo: 'UQCM-101',
      department: 'hifz',
      className: 'Hifz',
      subjectName: 'Hifz',
      lessonCovered: 'Surah Kahf 1-15',
      homeworkAssigned: 'Revise Para 17',
      dueDate: '2026-10-23',
      completionStatus: 'pending',
      teacherFeedback: 'Good Tajweed',
      learningGoal: 'Complete 15 lines daily',
      visibleToGuardian: true,
      guardianUid: 'guardian-uid-1',
      authorId: 'teacher-1',
    },
    {
      id: 'd-internal',
      date: '2026-10-21',
      studentId: 'stu-1',
      studentNameBn: 'আব্দুল্লাহ',
      admissionNo: 'UQCM-101',
      department: 'hifz',
      className: 'Hifz',
      subjectName: 'Internal Staff Observation',
      lessonCovered: 'Internal evaluation',
      homeworkAssigned: 'None',
      dueDate: '2026-10-24',
      completionStatus: 'needs_revision',
      teacherFeedback: 'Confidential internal teacher note',
      learningGoal: 'Internal staff counseling',
      visibleToGuardian: false,
      guardianUid: 'guardian-uid-1',
      authorId: 'admin',
    },
  ];

  const guardianView = filterVisibleStudyDiaryEntries(entries, SAMPLE_STUDENTS[0], 'guardian');
  assert.equal(guardianView.length, 1);
  assert.equal(guardianView[0].id, 'd-1');

  const studentView = filterVisibleStudyDiaryEntries(entries, SAMPLE_STUDENTS[0], 'student');
  assert.equal(studentView.length, 1);
  assert.equal(studentView[0].id, 'd-1');

  const teacherView = filterVisibleStudyDiaryEntries(entries, SAMPLE_STUDENTS[0], 'teacher');
  assert.equal(teacherView.length, 2);
});

test('computeAttendanceMetrics and computeExamAnalytics calculate accurate summaries', () => {
  const att: AttendanceRecord[] = [
    {
      id: 'a1',
      date: '2026-10-22',
      studentId: 'stu-1',
      studentNameBn: 'A',
      admissionNo: '1',
      className: 'C',
      department: 'hifz',
      status: 'present',
      guardianUid: 'g-1',
      remarks: '',
      authorId: 'u',
    },
    {
      id: 'a2',
      date: '2026-10-21',
      studentId: 'stu-1',
      studentNameBn: 'A',
      admissionNo: '1',
      className: 'C',
      department: 'hifz',
      status: 'absent',
      guardianUid: 'g-1',
      remarks: 'Sick',
      authorId: 'u',
    },
  ];
  const attStats = computeAttendanceMetrics(att);
  assert.equal(attStats.totalDays, 2);
  assert.equal(attStats.presentCount, 1);
  assert.equal(attStats.absentCount, 1);
  assert.equal(attStats.attendancePercentage, 50);

  const exams: ExamResult[] = [
    {
      id: 'e1',
      examName: 'Midterm',
      academicYear: '2026-2027',
      studentId: 'stu-1',
      studentNameBn: 'A',
      admissionNo: '1',
      department: 'hifz',
      className: 'C',
      subjectName: 'Quran',
      marksObtained: 90,
      fullMarks: 100,
      grade: 'Mumtaz (A+)',
      isPublished: true,
      guardianUid: 'g-1',
      authorId: 'u',
    },
    {
      id: 'e2',
      examName: 'Midterm',
      academicYear: '2026-2027',
      studentId: 'stu-1',
      studentNameBn: 'A',
      admissionNo: '1',
      department: 'hifz',
      className: 'C',
      subjectName: 'English',
      marksObtained: 60,
      fullMarks: 100,
      grade: 'Jayyid (A-)',
      isPublished: true,
      guardianUid: 'g-1',
      authorId: 'u',
    },
  ];
  const examStats = computeExamAnalytics(exams, 'stu-1');
  assert.equal(examStats.totalObtained, 150);
  assert.equal(examStats.totalFullMarks, 200);
  assert.equal(examStats.averagePercentage, 75);
  assert.equal(examStats.strengths.length, 1);
  assert.equal(examStats.strengths[0].subjectName, 'Quran');
  assert.equal(examStats.needsImprovement.length, 1);
  assert.equal(examStats.needsImprovement[0].subjectName, 'English');
});

test('generateCsvContent properly escapes commas and quotes', () => {
  const csv = generateCsvContent(['Admission No', 'Name'], [['UQCM-101', 'Abdullah, "Hafiz"']]);
  assert.ok(csv.includes('"Abdullah, ""Hafiz"""'));
});

test('getNextSlideIndex and getPrevSlideIndex wrap around safely', () => {
  assert.equal(getNextSlideIndex(0, 4), 1);
  assert.equal(getNextSlideIndex(3, 4), 0);
  assert.equal(getPrevSlideIndex(0, 4), 3);
  assert.equal(getPrevSlideIndex(2, 4), 1);
  assert.equal(getNextSlideIndex(0, 0), 0);
});

test('computeDepartmentChartMetrics computes accurate department counts and percentages', () => {
  const metrics = computeDepartmentChartMetrics([
    { department: 'hifz' } as Student,
    { department: 'hifz' } as Student,
    { department: 'qawmi' } as Student,
    { department: 'general' } as Student,
  ]);
  const hifz = metrics.find((m) => m.department === 'hifz');
  const qawmi = metrics.find((m) => m.department === 'qawmi');
  assert.equal(hifz?.count, 2);
  assert.equal(hifz?.percentage, 50);
  assert.equal(qawmi?.count, 1);
  assert.equal(qawmi?.percentage, 25);
});

test('toBengaliDigits, formatNum, and formatBdt render Bengali numerals for bn language', () => {
  assert.equal(toBengaliDigits(2026), '২০২৬');
  assert.equal(toBengaliDigits('92.5%'), '৯২.৫%');
  assert.equal(formatNum(1248, 'bn'), '১২৪৮');
  assert.equal(formatNum(1248, 'en'), '1248');
  assert.equal(formatBdt(4500, 'bn'), '৳ ৪,৫০০');
  assert.equal(formatBdt(4500, 'en'), '৳ 4,500');
});

test('classifyLoginIdentifier distinguishes emails, student IDs, usernames, and invalid strings', () => {
  assert.deepEqual(classifyLoginIdentifier('Student@Madrasa.edu.bd'), {
    kind: 'email',
    normalized: 'student@madrasa.edu.bd',
  });
  assert.deepEqual(classifyLoginIdentifier('uqcm-2026-101'), {
    kind: 'student_id',
    normalized: 'UQCM-2026-101',
  });
  assert.deepEqual(classifyLoginIdentifier('abdullah_101'), {
    kind: 'username',
    normalized: 'abdullah_101',
  });
  assert.equal(classifyLoginIdentifier('bad email@').kind, 'invalid');
  assert.equal(classifyLoginIdentifier('   ').kind, 'invalid');
});

test('validateLoginInput and validateRegistrationInput enforce security and field rules', () => {
  assert.equal(validateLoginInput('', '123456').valid, false);
  assert.equal(validateLoginInput('UQCM-2026-101', '123').valid, false);
  assert.equal(validateLoginInput('UQCM-2026-101', 'secret123').valid, true);

  const validReg = validateRegistrationInput({
    role: 'student',
    fullName: 'আব্দুল্লাহ আল মামুন',
    phone: '01711-223344',
    identifier: 'student101@ummulquran.edu.bd',
    password: 'password123',
  });
  assert.equal(validReg.valid, true);

  const invalidReg = validateRegistrationInput({
    role: 'guardian',
    fullName: 'A',
    phone: 'abc',
    identifier: '',
    password: '123',
  });
  assert.equal(invalidReg.valid, false);
  assert.ok(invalidReg.errors.fullName);
  assert.ok(invalidReg.errors.phone);
  assert.ok(invalidReg.errors.identifier);
  assert.ok(invalidReg.errors.password);
});

test('resolvePostLoginRedirect routes active roles and blocks pending or suspended accounts', () => {
  assert.deepEqual(resolvePostLoginRedirect(null), {
    screen: 'pending',
    targetModule: 'guardian',
  });
  assert.deepEqual(resolvePostLoginRedirect({ role: 'student', status: 'pending' }), {
    screen: 'pending',
    targetModule: 'guardian',
  });
  assert.deepEqual(resolvePostLoginRedirect({ role: 'guardian', status: 'suspended' }), {
    screen: 'suspended',
    targetModule: 'guardian',
  });
  assert.deepEqual(resolvePostLoginRedirect({ role: 'student', status: 'active' }), {
    screen: 'portal',
    targetModule: 'student_portal',
  });
  assert.deepEqual(resolvePostLoginRedirect({ role: 'guardian', status: 'active' }), {
    screen: 'portal',
    targetModule: 'guardian',
  });
  assert.deepEqual(resolvePostLoginRedirect({ role: 'super_admin', status: 'active' }), {
    screen: 'portal',
    targetModule: 'dashboard',
  });
});

test('mapFirebaseAuthErrorToMessage provides localized error messages without leaking internals', () => {
  const wrongCredBn = mapFirebaseAuthErrorToMessage('auth/invalid-credential', 'bn');
  assert.equal(wrongCredBn.title, 'ভুল তথ্য');
  assert.ok(wrongCredBn.message.includes('ভুল হয়েছে'));

  const usernameLookup = mapFirebaseAuthErrorToMessage('USERNAME_REQUIRES_BACKEND_LOOKUP', 'bn');
  assert.ok(usernameLookup.technicalNote);
});

const SAMPLE_APPLICATION: AdmissionApplication = {
  id: 'app-801',
  referenceNo: 'UQCM-ADM-2026-801',
  applicantUid: 'applicant-uid-1',
  applicantEmail: 'applicant@example.com',
  nameBn: 'মুহাম্মাদ ইব্রাহিম খলিল',
  nameEn: 'Mohammad Ibrahim Khalil',
  nameAr: 'محمد إبراهيم خليل',
  dateOfBirth: '2014-04-12',
  gender: 'male',
  bloodGroup: 'A+',
  birthRegNo: '20142698765432101',
  presentAddress: 'বাড়ি ১২, রোড ৫, উত্তরা, ঢাকা',
  permanentAddress: 'কুমিল্লা সদর, কুমিল্লা',
  photoUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSBIAAAABBxAR/Q8ABWUDggGAAAADABAJ0BKgAAEAACQDglpAADcAD+/gbQAA==',
  photoFileName: 'stu_photo_ibrahim_174208.webp',
  fatherName: 'মাওলানা খলিলুর রহমান',
  fatherPhone: '01711-889977',
  motherName: 'মোসা. আমেনা বেগম',
  motherPhone: '01711-889978',
  guardianName: 'মাওলানা খলিলুর রহমান',
  guardianRelation: 'পিতা (Father)',
  guardianPhone: '01711-889977',
  guardianEmail: 'khalil@example.com',
  requestGuardianAccount: true,
  guardianUid: 'guardian-uid-10',
  department: 'hifz',
  requestedClass: 'হিফয নাযেরা ও প্রাথমিক জামাত',
  academicSession: '2026-2027',
  previousInstitution: 'দারুস সুন্নাহ মাদ্রাসা',
  previousClass: 'নূরানী তৃতীয় শ্রেণি',
  residentialStatus: 'residential',
  medicalOrSpecialNotes: '',
  birthCertDocName: 'birth_certificate_ibrahim.jpg',
  birthCertDocDataUrl: '',
  prevCertDocName: 'testimonial.pdf',
  consentAccepted: true,
  status: 'pending',
  adminRemarks: '',
  assignedStudentId: '',
  assignedAdmissionNo: '',
  assignedRollNo: 0,
  assignedDormitoryRoom: '',
  assignedMonthlyFeeBdt: 0,
  reviewedByUid: '',
  reviewedByName: '',
  decisionAt: '',
  authorId: 'applicant-uid-1',
};

test('validateAdmissionStep validates steps 1-4 and requires consent on step 4', () => {
  const step1Fail = validateAdmissionStep(1, { nameBn: '', nameEn: '', dateOfBirth: '', presentAddress: '' });
  assert.equal(step1Fail.valid, false);
  assert.ok(step1Fail.errors.nameBn);
  assert.ok(step1Fail.errors.nameEn);
  assert.ok(step1Fail.errors.dateOfBirth);
  assert.ok(step1Fail.errors.presentAddress);

  const step1Pass = validateAdmissionStep(1, SAMPLE_APPLICATION);
  assert.equal(step1Pass.valid, true);

  const step2Pass = validateAdmissionStep(2, SAMPLE_APPLICATION);
  assert.equal(step2Pass.valid, true);

  const step3Pass = validateAdmissionStep(3, SAMPLE_APPLICATION);
  assert.equal(step3Pass.valid, true);

  const step4NoConsent = validateAdmissionStep(4, { ...SAMPLE_APPLICATION, consentAccepted: false });
  assert.equal(step4NoConsent.valid, false);
  assert.ok(step4NoConsent.errors.consentAccepted);

  const step4FullPass = validateAdmissionStep(4, SAMPLE_APPLICATION);
  assert.equal(step4FullPass.valid, true);
});

test('isDuplicateAdmissionSubmission detects duplicate pending/approved applications and ignores rejected ones', () => {
  const existing: AdmissionApplication[] = [SAMPLE_APPLICATION];
  assert.equal(
    isDuplicateAdmissionSubmission(existing, {
      nameEn: 'mohammad ibrahim khalil',
      dateOfBirth: '2014-04-12',
      guardianPhone: '01711889977',
      academicSession: '2026-2027',
    }),
    true
  );

  const rejectedList: AdmissionApplication[] = [{ ...SAMPLE_APPLICATION, status: 'rejected' }];
  assert.equal(
    isDuplicateAdmissionSubmission(rejectedList, {
      nameEn: 'mohammad ibrahim khalil',
      dateOfBirth: '2014-04-12',
      guardianPhone: '01711889977',
      academicSession: '2026-2027',
    }),
    false
  );
});

test('canApproveAdmissions and canViewAdmissionApplication enforce strict RBAC and privacy', () => {
  assert.equal(canApproveAdmissions('super_admin'), true);
  assert.equal(canApproveAdmissions('muhtamim'), true);
  assert.equal(canApproveAdmissions('teacher'), false);
  assert.equal(canApproveAdmissions('staff'), false);
  assert.equal(canApproveAdmissions('guardian'), false);
  assert.equal(canApproveAdmissions('student'), false);

  assert.equal(canReplaceApprovedStudentPhoto('super_admin'), true);
  assert.equal(canReplaceApprovedStudentPhoto('muhtamim'), true);
  assert.equal(canReplaceApprovedStudentPhoto('staff'), true);
  assert.equal(canReplaceApprovedStudentPhoto('student'), false);
  assert.equal(canReplaceApprovedStudentPhoto('guardian'), false);

  // Applicant or linked guardian can view their own application
  assert.equal(canViewAdmissionApplication(SAMPLE_APPLICATION, 'applicant-uid-1', 'student'), true);
  assert.equal(canViewAdmissionApplication(SAMPLE_APPLICATION, 'guardian-uid-10', 'guardian'), true);
  // Unrelated student or guardian cannot view private application/documents
  assert.equal(canViewAdmissionApplication(SAMPLE_APPLICATION, 'unrelated-uid', 'guardian'), false);
  assert.equal(canViewAdmissionApplication(SAMPLE_APPLICATION, 'unrelated-uid', 'student'), false);
  // Muhtamim can view
  assert.equal(canViewAdmissionApplication(SAMPLE_APPLICATION, 'muhtamim-uid', 'muhtamim'), true);
});

test('validatePhotoUploadMetadata validates MIME types, file size, and sanitizes filenames', () => {
  const badMime = validatePhotoUploadMetadata('application/pdf', 102400, 'doc.pdf');
  assert.equal(badMime.valid, false);

  const oversized = validatePhotoUploadMetadata('image/jpeg', 8 * 1024 * 1024, 'huge.jpg');
  assert.equal(oversized.valid, false);

  const validPhoto = validatePhotoUploadMetadata('image/png', 250 * 1024, '../My Student Photo!@#.png');
  assert.equal(validPhoto.valid, true);
  assert.ok(validPhoto.safeFileName.startsWith('stu_photo_'));
  assert.ok(!validPhoto.safeFileName.includes('..'));
  assert.ok(validPhoto.safeFileName.endsWith('.webp'));
});

test('buildProvisionedStudentFromApplication creates canonical student and prevents duplicate creation on retry', () => {
  const firstProvision = buildProvisionedStudentFromApplication(
    SAMPLE_APPLICATION,
    SAMPLE_STUDENTS,
    {
      admissionNo: 'UQCM-2026-109',
      rollNo: 5,
      className: 'হিফয নাযেরা ও প্রাথমিক জামাত',
      department: 'hifz',
      dormitoryRoom: 'দারুল আরকাম ভবন - কক্ষ ২০৫',
      monthlyFeeBdt: 5500,
      authorId: 'muhtamim-1',
    }
  );
  assert.equal(firstProvision.isExistingRecord, false);
  assert.equal(firstProvision.studentRecord.admissionNo, 'UQCM-2026-109');
  assert.equal(firstProvision.studentRecord.photoUrl, SAMPLE_APPLICATION.photoUrl);
  assert.equal(firstProvision.studentRecord.applicationId, SAMPLE_APPLICATION.id);
  assert.equal(firstProvision.studentRecord.guardianUid, 'guardian-uid-10');

  // Repeated approval attempt with existing canonical student in list must be idempotent
  const updatedStudents = [...SAMPLE_STUDENTS, firstProvision.studentRecord];
  const retryProvision = buildProvisionedStudentFromApplication(
    { ...SAMPLE_APPLICATION, assignedStudentId: firstProvision.studentRecord.id, assignedAdmissionNo: 'UQCM-2026-109' },
    updatedStudents,
    {
      admissionNo: 'UQCM-2026-109',
      rollNo: 5,
      authorId: 'muhtamim-1',
    }
  );
  assert.equal(retryProvision.isExistingRecord, true);
  assert.equal(retryProvision.studentRecord.id, firstProvision.studentRecord.id);
});

test('mergeLinkedStudentIds and generateAdmissionReferenceNo work without duplicates', () => {
  assert.equal(mergeLinkedStudentIds('stu-101,stu-103', 'stu-109'), 'stu-101,stu-103,stu-109');
  assert.equal(mergeLinkedStudentIds('stu-101,stu-103', 'stu-101'), 'stu-101,stu-103');
  assert.equal(mergeLinkedStudentIds('', 'stu-101'), 'stu-101');

  const refNo = generateAdmissionReferenceNo([{ referenceNo: 'UQCM-ADM-2026-801' }], '2026');
  assert.equal(refNo, 'UQCM-ADM-2026-802');
});

test('verifyPublicApplicationLookup requires both referenceNo and matching guardian phone or DOB', () => {
  const apps: AdmissionApplication[] = [SAMPLE_APPLICATION];

  // Missing verification input or wrong phone must return null (no data leak)
  assert.equal(verifyPublicApplicationLookup(apps, 'UQCM-ADM-2026-801', ''), null);
  assert.equal(verifyPublicApplicationLookup(apps, 'UQCM-ADM-2026-801', '01999999999'), null);
  assert.equal(verifyPublicApplicationLookup(apps, 'UQCM-ADM-2026-999', '01711-889977'), null);

  // Matching reference number + guardian phone succeeds
  const matchedByPhone = verifyPublicApplicationLookup(apps, 'uqcm-adm-2026-801', '01711-889977');
  assert.equal(matchedByPhone?.id, SAMPLE_APPLICATION.id);

  // Matching reference number + last 6 digits of phone succeeds
  const matchedByLast6 = verifyPublicApplicationLookup(apps, 'UQCM-ADM-2026-801', '889977');
  assert.equal(matchedByLast6?.id, SAMPLE_APPLICATION.id);

  // Matching reference number + exact DOB succeeds
  const matchedByDob = verifyPublicApplicationLookup(apps, 'UQCM-ADM-2026-801', '2014-04-12');
  assert.equal(matchedByDob?.id, SAMPLE_APPLICATION.id);
});

test('buildAccountProvisioningPackage creates separate student and guardian invitations and prevents duplicates on retry', () => {
  const provisioned = buildProvisionedStudentFromApplication(
    SAMPLE_APPLICATION,
    SAMPLE_STUDENTS,
    {
      admissionNo: 'UQCM-2026-109',
      rollNo: 5,
      authorId: 'muhtamim-1',
    }
  );

  const firstPkg = buildAccountProvisioningPackage(
    SAMPLE_APPLICATION,
    provisioned.studentRecord,
    [],
    'muhtamim-1'
  );

  assert.equal(firstPkg.reusedExisting, false);
  assert.equal(firstPkg.studentInvitation.targetRole, 'student');
  assert.equal(firstPkg.studentInvitation.status, 'pending_activation');
  assert.ok(firstPkg.studentInvitation.invitationCode.startsWith('ACT-STU-UQCM-2026-109-'));
  assert.ok(firstPkg.guardianInvitation !== null);
  assert.equal(firstPkg.guardianInvitation?.targetRole, 'guardian');
  assert.ok(firstPkg.guardianInvitation?.invitationCode.startsWith('ACT-GRD-UQCM-2026-109-'));
  // Never share the same code between student and guardian
  assert.notEqual(
    firstPkg.studentInvitation.invitationCode,
    firstPkg.guardianInvitation?.invitationCode
  );

  // Retry approval when student invitation is already activated -> must preserve 'activated' and reuse IDs
  const existingInvs: AccountInvitation[] = [
    { ...firstPkg.studentInvitation, status: 'activated', redeemedByUid: 'stu-uid-99', redeemedAt: '2026-10-25' },
    firstPkg.guardianInvitation!,
  ];

  const retryPkg = buildAccountProvisioningPackage(
    SAMPLE_APPLICATION,
    provisioned.studentRecord,
    existingInvs,
    'muhtamim-1'
  );

  assert.equal(retryPkg.reusedExisting, true);
  assert.equal(retryPkg.studentInvitation.id, firstPkg.studentInvitation.id);
  assert.equal(retryPkg.studentInvitation.status, 'activated');
  assert.equal(retryPkg.studentInvitation.redeemedByUid, 'stu-uid-99');
});

test('validateAndRedeemActivationInvitation enforces single-use redemption and phone/admission verification', () => {
  const provisioned = buildProvisionedStudentFromApplication(
    SAMPLE_APPLICATION,
    SAMPLE_STUDENTS,
    {
      admissionNo: 'UQCM-2026-109',
      rollNo: 5,
      authorId: 'muhtamim-1',
    }
  );
  const pkg = buildAccountProvisioningPackage(
    SAMPLE_APPLICATION,
    provisioned.studentRecord,
    [],
    'muhtamim-1'
  );
  const invitations: AccountInvitation[] = [pkg.studentInvitation, pkg.guardianInvitation!];

  // Wrong verification phone fails
  const wrongPhone = validateAndRedeemActivationInvitation(invitations, {
    invitationCode: pkg.studentInvitation.invitationCode,
    verificationPhoneOrAdmissionNo: '01900-000000',
    chosenPassword: 'securePassword123',
    redeemerUid: 'stu-user-109',
  });
  assert.equal(wrongPhone.ok, false);

  // Weak password fails
  const shortPass = validateAndRedeemActivationInvitation(invitations, {
    invitationCode: pkg.studentInvitation.invitationCode,
    verificationPhoneOrAdmissionNo: '01711-889977',
    chosenPassword: '123',
    redeemerUid: 'stu-user-109',
  });
  assert.equal(shortPass.ok, false);

  // Valid single-use redemption succeeds
  const validRedeem = validateAndRedeemActivationInvitation(invitations, {
    invitationCode: pkg.studentInvitation.invitationCode,
    verificationPhoneOrAdmissionNo: '01711-889977',
    chosenPassword: 'securePassword123',
    redeemerUid: 'stu-user-109',
  });
  assert.equal(validRedeem.ok, true);
  assert.equal(validRedeem.updatedInvitation?.status, 'activated');
  assert.equal(validRedeem.updatedInvitation?.redeemedByUid, 'stu-user-109');
  // Ensure no plaintext password property exists on the invitation record
  assert.equal('chosenPassword' in (validRedeem.updatedInvitation as unknown as Record<string, unknown>), false);
  assert.equal('password' in (validRedeem.updatedInvitation as unknown as Record<string, unknown>), false);

  // Second attempt to redeem the same single-use code must fail
  const afterRedeemList: AccountInvitation[] = [
    validRedeem.updatedInvitation!,
    pkg.guardianInvitation!,
  ];
  const replayAttempt = validateAndRedeemActivationInvitation(afterRedeemList, {
    invitationCode: pkg.studentInvitation.invitationCode,
    verificationPhoneOrAdmissionNo: '01711-889977',
    chosenPassword: 'anotherPassword123',
    redeemerUid: 'attacker-uid',
  });
  assert.equal(replayAttempt.ok, false);
});

test('validateExaminationSetup validates subject max/pass marks and grading policies', () => {
  const invalidSetup = validateExaminationSetup({
    examName: '',
    academicYear: '',
    className: '',
    examDate: '',
    subjects: [{ subjectCode: 'S1', subjectName: 'Math', maxMarks: 50, passMarks: 60, isOptional: false }],
  });
  assert.equal(invalidSetup.valid, false);
  assert.ok(invalidSetup.errors.length >= 2);

  const validSetup = validateExaminationSetup({
    examName: 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬ (2nd Term)',
    academicYear: '2026-2027',
    department: 'hifz',
    className: 'হিফয তাকমীল (খতম বর্ষ)',
    examDate: '2026-10-15',
    subjects: [
      { subjectCode: 'HFZ-101', subjectName: 'হিফযুল কুরআন', maxMarks: 100, passMarks: 40, isOptional: false },
    ],
  });
  assert.equal(validSetup.valid, true);
  assert.equal(validSetup.errors.length, 0);
});

test('evaluateSubjectMarks distinguishes unentered, absent, exempt, passed, and failed without treating missing marks as zero', () => {
  const unentered = evaluateSubjectMarks({
    subjectName: 'Quran',
    maxMarks: 100,
    passMarks: 33,
    marksObtained: null,
    isAbsent: false,
    isExempt: false,
    policy: DEFAULT_MADRASA_GRADING_POLICY,
  });
  assert.equal(unentered.status, 'unentered');
  assert.equal(unentered.letterGrade, '—');

  const absent = evaluateSubjectMarks({
    subjectName: 'Quran',
    maxMarks: 100,
    passMarks: 33,
    marksObtained: null,
    isAbsent: true,
    isExempt: false,
    policy: DEFAULT_MADRASA_GRADING_POLICY,
  });
  assert.equal(absent.status, 'absent');
  assert.equal(absent.letterGrade, 'AB');
  assert.equal(absent.gpaPoint, 0);

  const passed = evaluateSubjectMarks({
    subjectName: 'Quran',
    maxMarks: 100,
    passMarks: 33,
    marksObtained: 85,
    isAbsent: false,
    isExempt: false,
    policy: DEFAULT_MADRASA_GRADING_POLICY,
  });
  assert.equal(passed.status, 'passed');
  assert.equal(passed.gradeLabel, 'Mumtaz (A+)');
  assert.equal(passed.gpaPoint, 5.0);

  const failedSubject = evaluateSubjectMarks({
    subjectName: 'Quran',
    maxMarks: 100,
    passMarks: 33,
    marksObtained: 28,
    isAbsent: false,
    isExempt: false,
    policy: DEFAULT_MADRASA_GRADING_POLICY,
  });
  assert.equal(failedSubject.status, 'failed');
  assert.equal(failedSubject.gradeLabel, 'Rasib (F)');
  assert.equal(failedSubject.gpaPoint, 0);
});

test('computeClassTabulationSheet calculates accurate totals, GPA, pass/fail, incomplete status, and tie-aware merit ranks', () => {
  const students: Student[] = [
    { ...SAMPLE_STUDENTS[0], id: 'stu-a', admissionNo: 'UQCM-101', nameBn: 'আব্দুল্লাহ', className: 'Hifz', rollNo: 1 },
    { ...SAMPLE_STUDENTS[1], id: 'stu-b', admissionNo: 'UQCM-102', nameBn: 'ওমর', className: 'Hifz', rollNo: 2 },
    { ...SAMPLE_STUDENTS[0], id: 'stu-c', admissionNo: 'UQCM-103', nameBn: 'তালহা', className: 'Hifz', rollNo: 3 },
  ];
  const results: ExamResult[] = [
    {
      id: 'r1',
      examName: 'Final',
      academicYear: '2026-2027',
      studentId: 'stu-a',
      studentNameBn: 'আব্দুল্লাহ',
      admissionNo: 'UQCM-101',
      department: 'hifz',
      className: 'Hifz',
      subjectName: 'Quran',
      marksObtained: 90,
      fullMarks: 100,
      passMarks: 40,
      grade: 'Mumtaz (A+)',
      isPublished: true,
      workflowStatus: 'published',
      guardianUid: 'g1',
      authorId: 'u1',
    },
    {
      id: 'r2',
      examName: 'Final',
      academicYear: '2026-2027',
      studentId: 'stu-b',
      studentNameBn: 'ওমর',
      admissionNo: 'UQCM-102',
      department: 'hifz',
      className: 'Hifz',
      subjectName: 'Quran',
      marksObtained: 90,
      fullMarks: 100,
      passMarks: 40,
      grade: 'Mumtaz (A+)',
      isPublished: true,
      workflowStatus: 'published',
      guardianUid: 'g2',
      authorId: 'u1',
    },
    // stu-c has no marks entered -> should be 'INCOMPLETE', not treated as 0/FAIL
  ];

  const setup: ExaminationSetup = {
    id: 'cfg-1',
    academicYear: '2026-2027',
    examName: 'Final',
    department: 'hifz',
    className: 'Hifz',
    sectionName: 'A',
    examDate: '2026-10-15',
    publicationDate: '2026-10-25',
    instructions: '',
    subjects: [{ subjectCode: 'Q1', subjectName: 'Quran', maxMarks: 100, passMarks: 40, isOptional: false }],
    gradingPolicy: DEFAULT_MADRASA_GRADING_POLICY,
    workflowStatus: 'published',
    authorId: 'admin',
  };

  const rows = computeClassTabulationSheet(students, results, setup);

  assert.equal(rows.length, 3);
  const rowA = rows.find((r) => r.student.id === 'stu-a')!;
  const rowB = rows.find((r) => r.student.id === 'stu-b')!;
  const rowC = rows.find((r) => r.student.id === 'stu-c')!;

  assert.equal(rowA.overallStatus, 'PASS');
  assert.equal(rowB.overallStatus, 'PASS');
  // Tied marks (90) should share rank 1
  assert.equal(rowA.rank, 1);
  assert.equal(rowB.rank, 1);
  // Missing marks must be 'INCOMPLETE', not FAIL/zero
  assert.equal(rowC.overallStatus, 'INCOMPLETE');
  assert.equal(rowC.rank, null);
});

test('validateAndPreviewMarksImport blocks formulas, unknown student IDs, duplicates, and published conflicts', () => {
  const preview = validateAndPreviewMarksImport(
    [
      { rowNumber: 1, admissionNo: 'UQCM-101', studentName: 'আব্দুল্লাহ', marksOrStatus: '88', remarks: 'Good' },
      { rowNumber: 2, admissionNo: 'UQCM-101', studentName: 'আব্দুল্লাহ', marksOrStatus: '85', remarks: 'Duplicate' },
      { rowNumber: 3, admissionNo: 'UNKNOWN-999', studentName: 'অজ্ঞাত', marksOrStatus: '70', remarks: '' },
      { rowNumber: 4, admissionNo: 'UQCM-102', studentName: 'ওমর', marksOrStatus: '=SUM(10,20)', remarks: '' },
    ],
    [
      { ...SAMPLE_STUDENTS[0], className: 'Hifz' },
      { ...SAMPLE_STUDENTS[1], className: 'Hifz' },
    ],
    [],
    {
      academicYear: '2026-2027',
      examName: 'Midterm',
      className: 'Hifz',
      subjectName: 'Quran',
      maxMarks: 100,
      passMarks: 33,
    }
  );

  assert.equal(preview.summary.totalRows, 4);
  assert.equal(preview.summary.validNewCount, 1);
  assert.equal(preview.summary.duplicateInFileCount, 1);
  assert.equal(preview.summary.unknownStudentCount, 1);
  assert.equal(preview.summary.invalidValueCount, 1);
});

test('canPerformExamWorkflowAction and filterAuthorizedPublishedExamsForPortal enforce strict RBAC and hide unpublished results', () => {
  assert.equal(canPerformExamWorkflowAction('teacher', 'save_draft', 'draft').allowed, true);
  assert.equal(canPerformExamWorkflowAction('teacher', 'save_draft', 'published').allowed, false);
  assert.equal(canPerformExamWorkflowAction('teacher', 'publish', 'approved').allowed, false);
  assert.equal(canPerformExamWorkflowAction('muhtamim', 'publish', 'approved').allowed, true);
  assert.equal(canPerformExamWorkflowAction('muhtamim', 'correct_published', 'published').allowed, true);

  const mixedResults: ExamResult[] = [
    {
      id: 'pub-1',
      examName: 'Final',
      academicYear: '2026-2027',
      studentId: 'stu-1',
      studentNameBn: 'আব্দুল্লাহ',
      admissionNo: 'UQCM-101',
      department: 'hifz',
      className: 'Hifz',
      subjectName: 'Quran',
      marksObtained: 95,
      fullMarks: 100,
      grade: 'Mumtaz (A+)',
      isPublished: true,
      workflowStatus: 'published',
      guardianUid: 'guardian-uid-1',
      authorId: 'u1',
    },
    {
      id: 'draft-1',
      examName: 'Final',
      academicYear: '2026-2027',
      studentId: 'stu-1',
      studentNameBn: 'আব্দুল্লাহ',
      admissionNo: 'UQCM-101',
      department: 'hifz',
      className: 'Hifz',
      subjectName: 'Tajweed',
      marksObtained: 88,
      fullMarks: 100,
      grade: 'Mumtaz (A+)',
      isPublished: false,
      workflowStatus: 'draft',
      guardianUid: 'guardian-uid-1',
      authorId: 'u1',
    },
  ];

  const studentVisible = filterAuthorizedPublishedExamsForPortal(mixedResults, {
    role: 'student',
    studentId: 'stu-1',
  });
  assert.equal(studentVisible.length, 1);
  assert.equal(studentVisible[0].id, 'pub-1');
  assert.equal(resolveExamWorkflowStatus(mixedResults[0]), 'published');
  assert.equal(isExamRecordPublished(mixedResults[1]), false);
});

test('validateSuperAdminBootstrapAttempt enforces one-time provisioning and permanently blocks repeat or unauthorized attempts', () => {
  const demoUsers: UserProfile[] = [
    {
      id: 'demo-admin',
      uid: 'demo-admin',
      email: 'hmalameenemob@gmail.com',
      displayName: 'Demo Admin',
      role: 'super_admin',
      status: 'active',
      linkedStudentIds: '',
      assignedClasses: 'সকল জামাত',
      phone: '01711-000000',
      isDemoRecord: true,
    },
  ];

  assert.equal(isSuperAdminAlreadyProvisioned(null, demoUsers), false);

  // Unauthorized email without setup token fails
  const unauthAttempt = validateSuperAdminBootstrapAttempt({
    existingLock: null,
    existingUsers: demoUsers,
    candidateUid: 'attacker-uid',
    candidateEmail: 'attacker@example.com',
    candidateDisplayName: 'Attacker',
    candidatePhone: '01711-223344',
    allowedBootstrapEmail: 'hmalameenemob@gmail.com',
  });
  assert.equal(unauthAttempt.ok, false);

  // Authorized owner first-time bootstrap succeeds
  const validBootstrap = validateSuperAdminBootstrapAttempt({
    existingLock: null,
    existingUsers: demoUsers,
    candidateUid: 'real-super-admin-uid',
    candidateEmail: 'hmalameenemob@gmail.com',
    candidateDisplayName: 'প্রধান তত্ত্বাবধায়ক (Super Admin)',
    candidatePhone: '01711-984321',
    allowedBootstrapEmail: 'hmalameenemob@gmail.com',
  });
  assert.equal(validBootstrap.ok, true);
  assert.equal(validBootstrap.lockRecord?.isProvisioned, true);
  assert.equal(validBootstrap.superAdminProfile?.role, 'super_admin');
  assert.equal(validBootstrap.superAdminProfile?.isDemoRecord, false);

  // Once provisioned, isSuperAdminAlreadyProvisioned is true and any second bootstrap attempt is permanently rejected
  const provisionedLock: SuperAdminBootstrapLock = validBootstrap.lockRecord!;
  assert.equal(
    isSuperAdminAlreadyProvisioned(provisionedLock, [validBootstrap.superAdminProfile!]),
    true
  );

  const repeatAttempt = validateSuperAdminBootstrapAttempt({
    existingLock: provisionedLock,
    existingUsers: [validBootstrap.superAdminProfile!],
    candidateUid: 'second-uid',
    candidateEmail: 'hmalameenemob@gmail.com',
    candidateDisplayName: 'Second Attempt',
    candidatePhone: '01711-984321',
    allowedBootstrapEmail: 'hmalameenemob@gmail.com',
  });
  assert.equal(repeatAttempt.ok, false);
});

test('canProvisionStaffAccount and canModifyUserAccountRoleOrStatus enforce strict Super Admin -> Muhtamim -> Teacher hierarchy', () => {
  // Super Admin can provision Muhtamim, Teacher, and permitted staff
  assert.equal(canProvisionStaffAccount('super_admin', 'muhtamim').allowed, true);
  assert.equal(canProvisionStaffAccount('super_admin', 'teacher').allowed, true);
  assert.equal(canProvisionStaffAccount('super_admin', 'accountant').allowed, true);
  assert.equal(canProvisionStaffAccount('super_admin', 'super_admin').allowed, false);

  // Muhtamim can provision Teacher and permitted staff, but NEVER Super Admin or another Muhtamim
  assert.equal(canProvisionStaffAccount('muhtamim', 'teacher').allowed, true);
  assert.equal(canProvisionStaffAccount('muhtamim', 'accountant').allowed, true);
  assert.equal(canProvisionStaffAccount('muhtamim', 'residential_supervisor').allowed, true);
  assert.equal(canProvisionStaffAccount('muhtamim', 'staff').allowed, true);
  assert.equal(canProvisionStaffAccount('muhtamim', 'muhtamim').allowed, false);
  assert.equal(canProvisionStaffAccount('muhtamim', 'super_admin').allowed, false);

  // Teacher cannot provision any staff or admin account
  assert.equal(canProvisionStaffAccount('teacher', 'teacher').allowed, false);
  assert.equal(canProvisionStaffAccount('teacher', 'muhtamim').allowed, false);
  assert.equal(canProvisionStaffAccount('teacher', 'super_admin').allowed, false);
  assert.equal(canProvisionStaffAccount('student', 'teacher').allowed, false);

  // Self-modification or promoting anyone to super_admin via directory is blocked
  assert.equal(
    canModifyUserAccountRoleOrStatus({
      actorRole: 'super_admin',
      actorUid: 'sa-1',
      targetUser: { uid: 'sa-1', role: 'super_admin', status: 'active' },
      nextRole: 'super_admin',
      nextStatus: 'suspended',
    }).allowed,
    false
  );
  assert.equal(
    canModifyUserAccountRoleOrStatus({
      actorRole: 'super_admin',
      actorUid: 'sa-1',
      targetUser: { uid: 'muh-1', role: 'muhtamim', status: 'active' },
      nextRole: 'super_admin',
      nextStatus: 'active',
    }).allowed,
    false
  );
  // Super Admin can suspend/reactivate Muhtamim
  assert.equal(
    canModifyUserAccountRoleOrStatus({
      actorRole: 'super_admin',
      actorUid: 'sa-1',
      targetUser: { uid: 'muh-1', role: 'muhtamim', status: 'active' },
      nextRole: 'muhtamim',
      nextStatus: 'suspended',
    }).allowed,
    true
  );
  // Muhtamim cannot modify Super Admin or another Muhtamim, but can manage Teachers
  assert.equal(
    canModifyUserAccountRoleOrStatus({
      actorRole: 'muhtamim',
      actorUid: 'muh-1',
      targetUser: { uid: 'sa-1', role: 'super_admin', status: 'active' },
      nextRole: 'super_admin',
      nextStatus: 'suspended',
    }).allowed,
    false
  );
  assert.equal(
    canModifyUserAccountRoleOrStatus({
      actorRole: 'muhtamim',
      actorUid: 'muh-1',
      targetUser: { uid: 'tch-1', role: 'teacher', status: 'pending' },
      nextRole: 'teacher',
      nextStatus: 'active',
    }).allowed,
    true
  );
});

test('buildStaffAccountInvitation creates single-use expiring Muhtamim and Teacher invitations and enforces expiration on redeem', () => {
  const muhtamimPkg = buildStaffAccountInvitation(
    {
      actorRole: 'super_admin',
      actorUid: 'sa-uid-1',
      actorEmail: 'hmalameenemob@gmail.com',
      targetRole: 'muhtamim',
      employeeCode: 'UQCM-EMP-01',
      nameBn: 'মাওলানা মুফতি আব্দুল মতিন কাসেমী',
      nameEn: 'Maulana Mufti Abdul Matin Qasemi',
      phone: '01711-001122',
      email: 'muhtamim@ummulquranmadrasa.edu.bd',
      designation: 'মুহতামিম ও শাইখুল হাদিস',
      department: 'administration',
      assignedClasses: 'সকল জামাত',
      assignedSubjects: 'বুখারী শরীফ ও ফিকহ',
      qualification: 'দাওরায়ে হাদিস ও ইফতা',
      joiningDate: '2026-01-01',
      basicSalaryBdt: 28000,
      houseAllowanceBdt: 6000,
      medicalAllowanceBdt: 2000,
      expirationDays: 7,
    },
    [],
    []
  );

  assert.equal(muhtamimPkg.ok, true);
  assert.ok(muhtamimPkg.invitation?.invitationCode.startsWith('ACT-MUH-UQCM-EMP-01-'));

  // Unauthorized attempt by Muhtamim to invite another Muhtamim fails
  const blockedMuhPkg = buildStaffAccountInvitation(
    {
      actorRole: 'muhtamim',
      actorUid: 'muh-uid-1',
      actorEmail: 'muhtamim@ummulquranmadrasa.edu.bd',
      targetRole: 'muhtamim',
      employeeCode: 'UQCM-EMP-99',
      nameBn: 'অপর মুহতামিম',
      nameEn: 'Another Muhtamim',
      phone: '01711-998877',
      email: 'other@ummulquranmadrasa.edu.bd',
      designation: 'Muhtamim',
      department: 'administration',
      assignedClasses: 'All',
      qualification: 'Kamil',
      joiningDate: '2026-01-01',
      basicSalaryBdt: 25000,
      houseAllowanceBdt: 5000,
      medicalAllowanceBdt: 1500,
    },
    [],
    []
  );
  assert.equal(blockedMuhPkg.ok, false);

  // Expired invitation is rejected when redeemed after expiresAt
  const expiredRedeem = validateAndRedeemActivationInvitation([muhtamimPkg.invitation!], {
    invitationCode: muhtamimPkg.invitation!.invitationCode,
    verificationPhoneOrAdmissionNo: '01711-001122',
    chosenPassword: 'securePassword123',
    redeemerUid: 'muh-auth-uid-1',
    referenceDateIso: '2099-12-31',
  });
  assert.equal(expiredRedeem.ok, false);

  // Valid redemption before expiry using employeeCode or phone succeeds
  const validMuhRedeem = validateAndRedeemActivationInvitation([muhtamimPkg.invitation!], {
    invitationCode: muhtamimPkg.invitation!.invitationCode,
    verificationPhoneOrAdmissionNo: 'UQCM-EMP-01',
    chosenPassword: 'securePassword123',
    redeemerUid: 'muh-auth-uid-1',
    referenceDateIso: muhtamimPkg.invitation!.issuedAt,
  });
  assert.equal(validMuhRedeem.ok, true);
  assert.equal(validMuhRedeem.updatedInvitation?.status, 'activated');
  assert.equal(validMuhRedeem.updatedInvitation?.targetRole, 'muhtamim');
});

test('inspectFirebaseAdminEnv proves 3 variables alone are insufficient without FIREBASE_ADMIN_PRIVATE_KEY and blocks VITE_ secret exposure', () => {
  // 1. Only SUPER_ADMIN_BOOTSTRAP_SECRET, FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL -> NOT sufficient
  const threeVarsOnly = inspectFirebaseAdminEnv({
    SUPER_ADMIN_BOOTSTRAP_SECRET: 'UQCM-PROD-SECRET-2026-HIGH-ENTROPY',
    FIREBASE_ADMIN_PROJECT_ID: 'amazing-haven-348x0',
    FIREBASE_ADMIN_CLIENT_EMAIL:
      'firebase-adminsdk-abc@amazing-haven-348x0.iam.gserviceaccount.com',
  });

  assert.equal(threeVarsOnly.readyForAdminSdk, false);
  assert.deepEqual(threeVarsOnly.missingVariables, ['FIREBASE_ADMIN_PRIVATE_KEY']);
  assert.equal(threeVarsOnly.securityViolations.length, 0);

  // 2. Accidental VITE_ exposure is flagged and blocks readiness
  const exposedEnv = inspectFirebaseAdminEnv({
    SUPER_ADMIN_BOOTSTRAP_SECRET: 'UQCM-PROD-SECRET-2026-HIGH-ENTROPY',
    FIREBASE_ADMIN_PROJECT_ID: 'amazing-haven-348x0',
    FIREBASE_ADMIN_CLIENT_EMAIL:
      'firebase-adminsdk-abc@amazing-haven-348x0.iam.gserviceaccount.com',
    FIREBASE_ADMIN_PRIVATE_KEY:
      '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7' +
      'A'.repeat(220) +
      '\\n-----END PRIVATE KEY-----\\n',
    VITE_SUPER_ADMIN_BOOTSTRAP_SECRET: 'LEAKED',
  });
  assert.ok(exposedEnv.securityViolations.length > 0);
  assert.equal(exposedEnv.readyForAdminSdk, false);

  // 3. Complete valid server-side configuration (with escaped \n PEM key) is ready
  const validEnv = inspectFirebaseAdminEnv({
    SUPER_ADMIN_BOOTSTRAP_SECRET: 'UQCM-PROD-SECRET-2026-HIGH-ENTROPY',
    FIREBASE_ADMIN_PROJECT_ID: 'amazing-haven-348x0',
    FIREBASE_ADMIN_CLIENT_EMAIL:
      'firebase-adminsdk-abc@amazing-haven-348x0.iam.gserviceaccount.com',
    FIREBASE_ADMIN_PRIVATE_KEY:
      '"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7' +
      'A'.repeat(220) +
      '\\n-----END PRIVATE KEY-----\\n"',
  });
  assert.equal(validEnv.readyForAdminSdk, true);
  assert.deepEqual(validEnv.missingVariables, []);
  assert.deepEqual(validEnv.invalidFormatVariables, []);

  // 4. normalizePemPrivateKey strips quotes and converts literal \n to actual newlines
  const normalizedPem = normalizePemPrivateKey(
    '"-----BEGIN PRIVATE KEY-----\\nBODY_LINE\\n-----END PRIVATE KEY-----\\n"'
  );
  assert.ok(normalizedPem.startsWith('-----BEGIN PRIVATE KEY-----\nBODY_LINE\n'));

  // 5. verifyBootstrapSecretTimingSafe performs constant-time verification
  assert.equal(
    verifyBootstrapSecretTimingSafe(
      'UQCM-PROD-SECRET-2026-HIGH-ENTROPY',
      'UQCM-PROD-SECRET-2026-HIGH-ENTROPY'
    ),
    true
  );
  assert.equal(
    verifyBootstrapSecretTimingSafe(
      'WRONG-SECRET-2026-HIGH-ENTROPY',
      'UQCM-PROD-SECRET-2026-HIGH-ENTROPY'
    ),
    false
  );
});



// ============================================================================
// PHASE 11: PERSISTENCE, SETTINGS VALIDATION, AND SNAPSHOT RECONCILIATION TESTS
// ============================================================================
import {
  buildCompleteInstitutionSettingsPayload,
  decodeExamResultFromFirestore,
  decodeExamSetupFromSettingsEnvelope,
  encodeExamSetupAsSettingsEnvelope,
  encodeGradeWithWorkflowMeta,
  reconcileFirestoreSnapshot,
  validateInstitutionSettings,
} from './madrasaLogic';

test('Phase 11 — validates complete institution settings and builds Firestore-compliant payload with defaultLanguage and activeDepartments', () => {
  const partialSettings = {
    id: 'default-settings',
    institutionNameBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা',
    institutionNameEn: 'Ummul Quran Cadet Madrasa',
    institutionNameAr: 'مدرسة أم القرآن كاديت',
    academicYear: '2026-2027',
    hijriYear: '1447-1448 AH',
    addressBn: 'মিরপুর, ঢাকা',
    phone: '01711-000000',
    email: 'info@ummulquranmadrasa.edu.bd',
    defaultLanguage: 'bn' as const,
    gradingSystem: 'মুমতাজ (৮০+), জায়্যিদ জিদ্দান (৬৫+)',
    activeDepartments: 'নূরানী, হিফয, কিতাব বিভাগ',
    authorId: 'usr-admin-1',
  };

  const validation = validateInstitutionSettings(partialSettings);
  assert.equal(validation.valid, true);

  const payload = buildCompleteInstitutionSettingsPayload({
    updated: {
      ...partialSettings,
      defaultLanguage: undefined as unknown as 'bn',
      activeDepartments: '',
    },
    existing: partialSettings,
    authorId: 'usr-admin-1',
  });

  assert.equal(payload.defaultLanguage, 'bn');
  assert.equal(payload.activeDepartments, 'নূরানী, হিফয, কিতাব বিভাগ');
  assert.equal(payload.authorId, 'usr-admin-1');
});

test('Phase 11 — rejects invalid institution settings missing required fields or invalid email', () => {
  const badSettings = {
    institutionNameBn: '',
    institutionNameEn: 'Ummul Quran Cadet Madrasa',
    institutionNameAr: 'مدرسة أم القرآن كاديت',
    academicYear: '2026-2027',
    hijriYear: '1447-1448 AH',
    addressBn: 'ঢাকা',
    phone: '017',
    email: 'invalid-email',
    defaultLanguage: 'bn' as const,
    gradingSystem: 'A+',
    activeDepartments: 'হিফয',
  };
  const res = validateInstitutionSettings(badSettings);
  assert.equal(res.valid, false);
  assert.ok(res.errorBn);
});

test('Phase 11 — reconciles Firestore snapshots by stripping demo records and preserving real state on listener error', () => {
  const prevWithDemo = [
    { id: 'stu-demo-1', isDemoRecord: true, name: 'Demo Student' },
    { id: 'stu-real-1', isDemoRecord: false, name: 'Real Student' },
  ];

  // When listener errors or is not ready, keep real records only, strip demo
  const onErrorResult = reconcileFirestoreSnapshot({
    previousState: prevWithDemo,
    incomingDocs: [],
    isListenerReady: true,
    hasListenerError: true,
  });
  assert.equal(onErrorResult.length, 1);
  assert.equal(onErrorResult[0]?.id, 'stu-real-1');

  // When listener succeeds with empty collection, return empty array (do not restore demo records)
  const onEmptyConfirmedResult = reconcileFirestoreSnapshot({
    previousState: prevWithDemo,
    incomingDocs: [],
    isListenerReady: true,
    hasListenerError: false,
  });
  assert.equal(onEmptyConfirmedResult.length, 0);
});

test('Phase 11 — encodes and decodes exam workflow metadata in grade field for backward compatibility with 16-key Firestore rules', () => {
  const encoded = encodeGradeWithWorkflowMeta({
    grade: 'মুমতাজ (A+)',
    workflowStatus: 'under_review',
    isAbsent: false,
    remarks: 'চমৎকার তিলাওয়াত',
    gpaPoint: 5,
    passMarks: 40,
    sectionName: 'ক শাখা',
  });

  assert.ok(encoded.length <= 80);

  const decoded = decodeExamResultFromFirestore(
    {
      id: 'exm-101',
      examName: 'প্রথম সাময়িক পরীক্ষা ২০২৬',
      academicYear: '2026-2027',
      studentId: 'stu-101',
      studentNameBn: 'মুহাম্মদ আব্দুল্লাহ',
      admissionNo: 'UQM-2026-101',
      className: 'হিফযুল কুরআন',
      department: 'hifz',
      subjectName: 'হিফয তিলাওয়াত',
      marksObtained: 92,
      fullMarks: 100,
      grade: encoded,
      isPublished: false,
      guardianUid: 'grd-1',
      authorId: 'usr-admin-1',
    },
    'exm-101'
  );

  assert.equal(decoded.grade, 'মুমতাজ (A+)');
  assert.equal(decoded.workflowStatus, 'under_review');
  assert.equal(decoded.remarks, 'চমৎকার তিলাওয়াত');
  assert.equal(decoded.gpaPoint, 5);
  assert.equal(decoded.passMarks, 40);
  assert.equal(decoded.sectionName, 'ক শাখা');
});

test('Phase 11 — encodes and decodes ExaminationSetup as a valid settings envelope', () => {
  const setup = {
    id: 'exm-cfg-2026-custom',
    academicYear: '2026-2027',
    examName: 'বার্ষিক পরীক্ষা ২০২৬',
    department: 'hifz' as const,
    className: 'হিফযুল কুরআন (উচ্চতর)',
    sectionName: 'ক শাখা',
    examDate: '2026-11-15',
    publicationDate: '2026-11-30',
    instructions: 'সকল বিষয় বাধ্যতামূলক',
    subjects: [
      {
        subjectCode: 'HFZ-101',
        subjectName: 'হিফযুল কুরআন (তিলাওয়াত)',
        fullMarks: 100,
        passMarks: 40,
        isCompulsory: true,
      },
    ],
    gradingPolicy: {
      nameBn: 'কওমি ও ক্যাডেট সমন্বিত গ্রেডিং',
      enableGpa: true,
      enableRank: true,
      failIfAnySubjectFailed: true,
      intervals: [],
    },
    workflowStatus: 'draft' as const,
    authorId: 'usr-admin-1',
  };

  const envelope = encodeExamSetupAsSettingsEnvelope(setup, 'usr-admin-1');
  const validation = validateInstitutionSettings({
    ...envelope,
    id: setup.id,
  });
  assert.equal(validation.valid, true);

  const decoded = decodeExamSetupFromSettingsEnvelope(envelope, setup.id);
  assert.ok(decoded);
  assert.equal(decoded?.id, setup.id);
  assert.equal(decoded?.examName, 'বার্ষিক পরীক্ষা ২০২৬');
  assert.equal(decoded?.subjects.length, 1);
});

// ============================================================================
// PHASE 12: GUARDIAN VERIFICATION + STUDENT ID LOGIN + MULTI-CHILD DEDUPLICATION
// ============================================================================
import {
  normalizeBangladeshPhone,
  isValidBangladeshPhone,
  isValidEmailAddress,
  resolveCanonicalStudentAuthEmail,
  resolveCanonicalGuardianPhoneAuthEmail,
  resolveGuardianVerificationMethod,
  findExistingGuardianUser,
  canActivateStudentAccount,
} from './madrasaLogic';
import {
  checkLoginRateLimit,
  resetLoginRateLimitForTest,
  executeResolveLoginIdentifier,
} from '../server/studentAuthResolverServer';

test('Phase 12 — normalizes and validates Bangladesh phone numbers in +8801XXXXXXXXX format', () => {
  assert.equal(normalizeBangladeshPhone('01711-223344'), '+8801711223344');
  assert.equal(normalizeBangladeshPhone('8801812345678'), '+8801812345678');
  assert.equal(normalizeBangladeshPhone('+880 1911 998877'), '+8801911998877');
  assert.equal(normalizeBangladeshPhone('০১৭১১২২৩৩৪৪'), '+8801711223344');

  assert.equal(isValidBangladeshPhone('01711223344'), true);
  assert.equal(isValidBangladeshPhone('+8801711223344'), true);
  assert.equal(isValidBangladeshPhone('01111223344'), false); // invalid operator 011
  assert.equal(isValidBangladeshPhone('12345'), false);
});

test('Phase 12 — resolves guardian verification method (SMS OTP vs Email Link) without forcing both', () => {
  // Only mobile provided -> sms_otp
  assert.equal(
    resolveGuardianVerificationMethod({
      guardianPhone: '01711223344',
      guardianEmail: '',
    }),
    'sms_otp'
  );

  // Only email provided -> email_link
  assert.equal(
    resolveGuardianVerificationMethod({
      guardianPhone: '',
      guardianEmail: 'guardian@example.com',
    }),
    'email_link'
  );

  // Both provided -> respects explicit choice
  assert.equal(
    resolveGuardianVerificationMethod({
      guardianPhone: '01711223344',
      guardianEmail: 'guardian@example.com',
      guardianVerificationMethod: 'email_link',
    }),
    'email_link'
  );

  assert.equal(
    resolveGuardianVerificationMethod({
      guardianPhone: '01711223344',
      guardianEmail: 'guardian@example.com',
      guardianVerificationMethod: 'sms_otp',
    }),
    'sms_otp'
  );

  // Step 2 validation enforces at least one valid contact (Phone or Email)
  const stepNeither = validateAdmissionStep(2, {
    fatherName: 'মাওলানা মাহমুদুল হাসান',
    motherName: 'ফাতেমা বেগম',
    guardianName: 'মাওলানা মাহমুদুল হাসান',
    guardianRelation: 'পিতা',
    guardianPhone: '',
    guardianEmail: '',
  });
  assert.equal(stepNeither.valid, false);

  const stepEmailOnly = validateAdmissionStep(2, {
    fatherName: 'মাওলানা মাহমুদুল হাসান',
    motherName: 'ফাতেমা বেগম',
    guardianName: 'মাওলানা মাহমুদুল হাসান',
    guardianRelation: 'পিতা',
    guardianPhone: '',
    guardianEmail: 'guardian@example.com',
    guardianVerificationMethod: 'email_link',
  });
  assert.equal(stepEmailOnly.valid, true);
});

test('Phase 12 — deduplicates existing guardian across multiple children by phone or email', () => {
  const existingUsers: UserProfile[] = [
    {
      id: 'grd-existing-1',
      uid: 'grd-existing-1',
      email: 'mahmud@gmail.com',
      displayName: 'আলহাজ্ব মাহমুদুল হাসান',
      role: 'guardian',
      status: 'active',
      linkedStudentIds: 'stu-101',
      assignedClasses: '',
      phone: '+8801711223344',
    },
  ];

  // Match by local phone format against +880 stored phone
  const matchedByPhone = findExistingGuardianUser(
    existingUsers,
    '01711-223344',
    ''
  );
  assert.equal(matchedByPhone?.uid, 'grd-existing-1');

  // Match by email
  const matchedByEmail = findExistingGuardianUser(
    existingUsers,
    '',
    'Mahmud@gmail.com'
  );
  assert.equal(matchedByEmail?.uid, 'grd-existing-1');

  // Merge second child into existing guardian linkedStudentIds without duplicates
  const mergedChildren = mergeLinkedStudentIds(
    matchedByPhone!.linkedStudentIds,
    'stu-102'
  );
  assert.equal(mergedChildren, 'stu-101,stu-102');
});

test('Phase 12 — enforces guardian verification prerequisite before student account activation', () => {
  const stuInv: AccountInvitation = {
    id: 'inv-stu-101',
    invitationCode: 'UQCM-STU-2026-101',
    targetRole: 'student',
    studentId: 'stu-101',
    admissionNo: 'UQCM-2026-101',
    applicationId: 'app-101',
    recipientName: 'আব্দুল্লাহ',
    recipientPhone: '+8801711223344',
    recipientEmail: '',
    status: 'pending',
    issuedByUid: 'usr-muhtamim-1',
    issuedAt: '2026-10-01',
    expiresAt: '2026-11-01',
    redeemedByUid: '',
    redeemedAt: '',
    authorId: 'usr-muhtamim-1',
  };

  const pendingGuardianInv: AccountInvitation = {
    ...stuInv,
    id: 'inv-grd-101',
    invitationCode: 'UQCM-GRD-2026-101',
    targetRole: 'guardian',
    status: 'pending',
    verificationStatus: 'pending_verification',
  };

  const unverifiedGuardianGate = canActivateStudentAccount(
    stuInv,
    [stuInv, pendingGuardianInv],
    [
      {
        id: 'app-101',
        status: 'approved',
        requestGuardianAccount: true,
        guardianVerificationStatus: 'pending_verification',
        guardianUid: '',
      },
    ]
  );
  assert.equal(unverifiedGuardianGate.allowed, false);

  const verifiedGuardianInv: AccountInvitation = {
    ...pendingGuardianInv,
    status: 'activated',
    verificationStatus: 'verified',
  };

  const verifiedGuardianGate = canActivateStudentAccount(
    stuInv,
    [stuInv, verifiedGuardianInv],
    [
      {
        id: 'app-101',
        status: 'approved',
        requestGuardianAccount: true,
        guardianVerificationStatus: 'verified',
        guardianUid: 'grd-uid-1',
      },
    ]
  );
  assert.equal(verifiedGuardianGate.allowed, true);
});

test('Phase 12 — generates deterministic internal Firebase Auth email for Student ID login and Guardian Phone login', () => {
  assert.equal(
    resolveCanonicalStudentAuthEmail('UQCM-2026-101'),
    'student.uqcm-2026-101@auth.ummulquranmadrasa.edu.bd'
  );
  assert.equal(
    resolveCanonicalGuardianPhoneAuthEmail('01711-223344'),
    'guardian.8801711223344@auth.ummulquranmadrasa.edu.bd'
  );
  assert.equal(isValidEmailAddress('admin@ummulquran.edu.bd'), true);
});

test('Phase 12 — rate limits login identifier resolution per IP and prevents student enumeration', () => {
  resetLoginRateLimitForTest();
  for (let i = 0; i < 12; i++) {
    const check = checkLoginRateLimit('203.0.113.55', 1000 + i);
    assert.equal(check.allowed, true);
  }
  const blocked = checkLoginRateLimit('203.0.113.55', 1020);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);

  resetLoginRateLimitForTest();
  const studentResolved = executeResolveLoginIdentifier(
    { identifier: 'UQCM-2026-101', loginMode: 'student' },
    '198.51.100.1',
    2000
  );
  assert.equal(studentResolved.statusCode, 200);
  assert.equal(
    studentResolved.body.resolvedAuthEmail,
    'student.uqcm-2026-101@auth.ummulquranmadrasa.edu.bd'
  );

  const invalidStudent = executeResolveLoginIdentifier(
    { identifier: '01711-223344', loginMode: 'student' },
    '198.51.100.1',
    2001
  );
  assert.equal(invalidStudent.statusCode, 400);
  assert.equal(invalidStudent.body.code, 'INVALID_CREDENTIALS');
  resetLoginRateLimitForTest();
});

test('Phase 3 Trilingual Website — tr() and institutional dynamic content localization helpers handle bn, en, and ar with safe fallbacks', () => {
  assert.equal(tr('bn', 'বাংলা', 'English', 'العربية'), 'বাংলা');
  assert.equal(tr('en', 'বাংলা', 'English', 'العربية'), 'English');
  assert.equal(tr('ar', 'বাংলা', 'English', 'العربية'), 'العربية');

  // Active departments localization
  assert.equal(
    localizeActiveDepartments('হিফযুল কুরআন, কওমি কিতাব বিভাগ, জেনারেল ক্যাডেট বিভাগ', 'en'),
    'Hifzul Quran, Qawmi Kitab Department, General Cadet Department'
  );
  assert.equal(
    localizeActiveDepartments('হিফযুল কুরআন, কওমি কিতাব বিভাগ, জেনারেল ক্যাডেট বিভাগ', 'ar'),
    'تحفيظ القرآن الكريم، قسم الكتب الشرعية (القومي)، القسم الأكاديمي العام (الكاديت)'
  );
  // Custom Firestore department string is preserved safely without fabrication
  assert.equal(
    localizeActiveDepartments('Custom Dept Name', 'en'),
    'Custom Dept Name'
  );

  // Address localization
  assert.equal(
    localizeAddress('বাড়ি ১৪, রোড ৭, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ', 'en'),
    'House 14, Road 7, Sector 3, Uttara, Dhaka-1230, Bangladesh'
  );
  assert.equal(
    localizeAddress('বাড়ি ১৪, রোড ৭, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ', 'ar'),
    'منزل ١٤، طريق ٧، قطاع ٣، أوتارا، دكا-١٢٣٠، بنغلاديش'
  );

  // Grading system & grade tier labels
  assert.ok(
    localizeGradingSystem('GPA 5.00 ও মুমতাজ-ভিত্তিক সমন্বিত মূল্যায়ন', 'en').includes('Mumtaz')
  );
  assert.equal(localizeGradeTierLabel('A+', 'মুমতাজ (Mumtaz)', 'Mumtaz (A+)', 'en'), 'Mumtaz (A+)');
  assert.equal(
    localizeGradeTierLabel('A+', 'মুমতাজ (Mumtaz)', 'Mumtaz (A+)', 'ar'),
    'ممتاز (Mumtaz)'
  );

  // Exam setup field localization
  assert.equal(
    localizeExamSetupField('১ম সাময়িক পরীক্ষা ২০২৬', 'en'),
    'First Term Examination 2026'
  );
  assert.equal(
    localizeExamSetupField('১ম সাময়িক পরীক্ষা ২০২৬', 'ar'),
    'اختبار الفصل الدراسي الأول ٢٠٢٦'
  );
  assert.equal(localizeExamSetupField('হিফযুল কুরআন', 'en'), 'Hifzul Quran');

  // Notice record localization & safe fallback for custom Firestore notices
  const verifiedNotice = localizeNoticeRecord(
    {
      id: 'ntc-1',
      titleBn: '১ম সাময়িক পরীক্ষা ২০২৬-এর সময়সূচি প্রকাশ',
      titleEn: '',
      contentBn: 'উম্মুল কুরআন ক্যাডেট মাদ্রাসার ১ম সাময়িক পরীক্ষা ইনশাআল্লাহ আগামী ১০ মে ২০২৬ তারিখ হতে শুরু হবে।',
      targetAudience: 'all',
      targetClass: 'সকল শ্রেণি ও বিভাগ',
      priority: 'important',
      publishDate: '2026-04-20',
      authorId: 'sys',
    },
    'ar'
  );
  assert.ok(verifiedNotice.title.includes('إعلان جدول اختبارات'));
  assert.ok(verifiedNotice.content.includes('تبدأ اختبارات الفصل الدراسي الأول'));
  assert.equal(verifiedNotice.targetClass, 'جميع الصفوف والأقسام');

  const customFirestoreNotice = localizeNoticeRecord(
    {
      id: 'ntc-custom',
      titleBn: 'বিশেষ জরুরি বিজ্ঞপ্তি - কাস্টম',
      titleEn: '',
      contentBn: 'আগামীকাল সকাল ৯টায় অভিভাবক সভা অনুষ্ঠিত হবে।',
      targetAudience: 'all',
      targetClass: 'সকল বিভাগ',
      priority: 'normal',
      publishDate: '2026-04-21',
      authorId: 'sys',
    },
    'en'
  );
  assert.equal(customFirestoreNotice.title, 'বিশেষ জরুরি বিজ্ঞপ্তি - কাস্টম');
  assert.equal(customFirestoreNotice.content, 'আগামীকাল সকাল ৯টায় অভিভাবক সভা অনুষ্ঠিত হবে।');
  assert.equal(customFirestoreNotice.targetClass, 'All Departments');
});

// ============================================================================
// PHASE 4: WEBSITE CMS PERMISSIONS, ENVELOPE PERSISTENCE, AND DRAFT/PUBLISHED FILTERING
// ============================================================================
import {
  buildSanitizedPublicCmsSnapshot,
  canManageWebsiteCms,
  computeCmsDashboardStats,
  decodeNoticeWithCmsMeta,
  decodePublicCmsFromSettingsEnvelope,
  decodeWebsiteCmsFromSettingsEnvelope,
  encodeNoticeTargetClassWithCmsMeta,
  encodePublicCmsAsSettingsEnvelope,
  encodeWebsiteCmsAsSettingsEnvelope,
  getPublishedContactFooter,
  getPublishedGalleryItems,
  getPublishedHomepageSections,
  getPublishedPageContent,
  getPublishedPublicEvents,
  getPublishedPublicNotices,
  getPublishedPublicProfiles,
  INITIAL_WEBSITE_CMS_CONFIG,
  mergeWebsiteCmsWithDefaults,
  PUBLIC_WEBSITE_CMS_SETTINGS_DOC_ID,
  publicSnapshotToWebsiteCmsConfig,
  validateCmsImageUrl,
} from './madrasaLogic';
import {
  ALLOWED_CMS_MEDIA_MIME_TYPES,
  MAX_CMS_MEDIA_FILE_SIZE_BYTES,
} from '../lib/firebase';

test('Phase 4 CMS — enforces strict RBAC so only super_admin and muhtamim can access or manage Website CMS', () => {
  assert.equal(canManageWebsiteCms('super_admin'), true);
  assert.equal(canManageWebsiteCms('muhtamim'), true);
  assert.equal(canAccessModule('super_admin', 'website_cms'), true);
  assert.equal(canAccessModule('muhtamim', 'website_cms'), true);

  const unauthorizedRoles = [
    'teacher',
    'accountant',
    'residential_supervisor',
    'guardian',
    'student',
    'staff',
  ] as const;

  for (const role of unauthorizedRoles) {
    assert.equal(canManageWebsiteCms(role), false);
    assert.equal(canAccessModule(role, 'website_cms'), false);
  }
});

test('Phase 4 CMS — encodes and decodes WebsiteCmsConfig inside a Firestore-rules-compliant InstitutionSettings envelope', () => {
  const customConfig = {
    ...INITIAL_WEBSITE_CMS_CONFIG,
    homepageSections: {
      ...INITIAL_WEBSITE_CMS_CONFIG.homepageSections,
      hero: {
        ...INITIAL_WEBSITE_CMS_CONFIG.homepageSections.hero,
        titleBn: 'কাস্টম হিরো শিরোনাম',
        status: 'published' as const,
      },
      intro: {
        ...INITIAL_WEBSITE_CMS_CONFIG.homepageSections.intro,
        titleBn: 'অপ্রকাশিত ড্রাফট শিরোনাম',
        status: 'draft' as const,
      },
    },
  };

  const envelope = encodeWebsiteCmsAsSettingsEnvelope(customConfig, 'usr-super-admin');

  // Must satisfy deployed isValidInstitutionSettings constraints:
  assert.equal(envelope.institutionNameEn, 'WEBSITE_CMS_CONFIG');
  assert.equal(envelope.defaultLanguage, 'bn');
  assert.ok(envelope.gradingSystem.length > 0 && envelope.gradingSystem.length <= 800);
  assert.ok(envelope.addressBn.startsWith('{'));

  const decoded = decodeWebsiteCmsFromSettingsEnvelope(
    envelope as unknown as Record<string, unknown>
  );
  assert.ok(decoded);
  assert.equal(decoded?.homepageSections.hero.titleBn, 'কাস্টম হিরো শিরোনাম');
  assert.equal(decoded?.homepageSections.intro.status, 'draft');

  // Draft intro section must fall back to verified published baseline on public homepage
  const publicSections = getPublishedHomepageSections(decoded!);
  assert.equal(publicSections.hero.titleBn, 'কাস্টম হিরো শিরোনাম');
  assert.equal(
    publicSections.intro.titleBn,
    INITIAL_WEBSITE_CMS_CONFIG.homepageSections.intro.titleBn
  );
});

test('Phase 4 CMS — filters out draft/unpublished pages, profiles, notices, events, and gallery items from public website', () => {
  // 1. Draft page falls back to initial published page content
  const cfgWithDraftAbout = {
    ...INITIAL_WEBSITE_CMS_CONFIG,
    pages: {
      ...INITIAL_WEBSITE_CMS_CONFIG.pages,
      '/about': {
        ...INITIAL_WEBSITE_CMS_CONFIG.pages['/about'],
        titleBn: 'ড্রাফট অ্যাবাউট পেজ (অপ্রকাশিত)',
        status: 'draft' as const,
      },
    },
    publicProfiles: [
      ...INITIAL_WEBSITE_CMS_CONFIG.publicProfiles,
      {
        id: 'prof-unpublished-test',
        profileType: 'teacher' as const,
        nameBn: 'অপ্রকাশিত উস্তায প্রোফাইল',
        nameEn: 'Unpublished Ustadh',
        nameAr: 'أستاذ غير منشور',
        designationBn: 'উস্তায',
        designationEn: 'Ustadh',
        designationAr: 'أستاذ',
        department: 'hifz' as const,
        biographyBn: 'ড্রাফট প্রোফাইল',
        biographyEn: 'Draft profile',
        biographyAr: 'ملف غير منشور',
        photoUrl: '',
        displayOrder: 99,
        status: 'unpublished' as const,
        updatedAt: '2026-04-20',
      },
    ],
    events: [
      ...INITIAL_WEBSITE_CMS_CONFIG.events,
      {
        id: 'ev-draft-test',
        titleBn: 'খসড়া ইভেন্ট',
        titleEn: 'Draft Event',
        titleAr: 'فعالية مسودة',
        descriptionBn: 'এটি পাবলিক পেজে দেখা যাবে না',
        descriptionEn: 'Should not appear on public page',
        descriptionAr: 'لا يظهر للجمهور',
        eventDate: '2026-12-01',
        category: 'event' as const,
        badgeBn: 'ক্যাম্পাস',
        badgeEn: 'Campus',
        badgeAr: 'الحرم',
        coverImageUrl: '',
        galleryImageUrls: [],
        status: 'draft' as const,
        updatedAt: '2026-04-20',
      },
    ],
    galleryItems: [
      ...INITIAL_WEBSITE_CMS_CONFIG.galleryItems,
      {
        id: 'gal-draft-test',
        departmentKey: 'hifz' as const,
        categoryBn: 'হিফয',
        categoryEn: 'Hifz',
        categoryAr: 'تحفيظ',
        titleBn: 'খসড়া গ্যালারি আইটেম',
        titleEn: 'Draft Gallery Item',
        titleAr: 'عنصر معرض مسودة',
        captionBn: 'খসড়া',
        captionEn: 'Draft',
        captionAr: 'مسودة',
        detailsBn: 'খসড়া বিবরণ',
        detailsEn: 'Draft details',
        detailsAr: 'تفاصيل المسودة',
        imageUrl: '',
        accentColor: '#0A6847',
        displayOrder: 99,
        status: 'draft' as const,
        updatedAt: '2026-04-20',
      },
    ],
  };

  assert.equal(
    getPublishedPageContent(cfgWithDraftAbout, '/about').titleBn,
    INITIAL_WEBSITE_CMS_CONFIG.pages['/about'].titleBn
  );

  const pubTeachers = getPublishedPublicProfiles(cfgWithDraftAbout, 'teacher');
  assert.equal(
    pubTeachers.some((p) => p.id === 'prof-unpublished-test'),
    false
  );

  const pubEvents = getPublishedPublicEvents(cfgWithDraftAbout, []);
  assert.equal(
    pubEvents.some((e) => e.id === 'ev-draft-test'),
    false
  );

  const pubGallery = getPublishedGalleryItems(cfgWithDraftAbout);
  assert.equal(
    pubGallery.some((g) => g.id === 'gal-draft-test'),
    false
  );

  // 2. Notice draft and expiry filtering
  const draftTargetClass = encodeNoticeTargetClassWithCmsMeta('সকল বিভাগ', {
    status: 'draft',
    category: 'general',
    expiryDate: '',
    attachmentUrl: '',
    titleAr: 'إعلان مسودة',
    contentEn: 'Draft notice content',
    contentAr: 'محتوى مسودة',
  });
  const publishedTargetClass = encodeNoticeTargetClassWithCmsMeta('হিফয বিভাগ', {
    status: 'published',
    category: 'exam',
    expiryDate: '2099-12-31',
    attachmentUrl: 'https://ummulquranmadrasa.edu.bd/schedule.pdf',
    titleAr: 'جدول الاختبارات',
    contentEn: 'Official exam schedule published.',
    contentAr: 'تم نشر جدول الاختبارات الرسمي.',
  });

  const sampleNotices = [
    {
      id: 'n-draft',
      titleBn: 'খসড়া নোটিশ',
      titleEn: 'Draft Notice',
      contentBn: 'অপ্রকাশিত',
      targetAudience: 'teachers' as const,
      targetClass: draftTargetClass,
      priority: 'normal' as const,
      publishDate: '2026-04-20',
      authorId: 'u1',
    },
    {
      id: 'n-pub',
      titleBn: 'প্রকাশিত নোটিশ',
      titleEn: 'Published Notice',
      contentBn: 'প্রকাশিত বিষয়বস্তু',
      targetAudience: 'all' as const,
      targetClass: publishedTargetClass,
      priority: 'important' as const,
      publishDate: '2026-04-20',
      authorId: 'u1',
    },
  ];

  const publicVisibleNotices = getPublishedPublicNotices(sampleNotices, '2026-05-01');
  assert.equal(publicVisibleNotices.length, 1);
  assert.equal(publicVisibleNotices[0].notice.id, 'n-pub');

  const decodedPub = decodeNoticeWithCmsMeta(sampleNotices[1]);
  assert.equal(decodedPub.cleanNotice.targetClass, 'হিফয বিভাগ');
  assert.equal(decodedPub.cmsMeta.status, 'published');
  assert.equal(decodedPub.cmsMeta.attachmentUrl, 'https://ummulquranmadrasa.edu.bd/schedule.pdf');

  const stats = computeCmsDashboardStats(cfgWithDraftAbout, sampleNotices);
  assert.equal(stats.draftPagesCount, 1);
  assert.equal(stats.publishedPagesCount, 9);
  assert.equal(stats.publishedNoticesCount, 1);
  assert.equal(stats.draftNoticesCount, 1);

  // 3. Large raw Base64 image URLs (>45KB) are blocked from Firestore document storage
  const oversizedBase64 = 'data:image/png;base64,' + 'A'.repeat(46000);
  assert.equal(validateCmsImageUrl(oversizedBase64).valid, false);
  assert.equal(
    validateCmsImageUrl(
      'https://firebasestorage.googleapis.com/v0/b/amazing-haven-348x0.appspot.com/o/banner.jpg'
    ).valid,
    true
  );
});

// ============================================================================
// PHASE 4.3: SAFE CMS DATA INTEGRITY TESTS (TASKS 4, 5, 6)
// ============================================================================

test('Phase 4.3 Task 4 — private draft notice storage in WebsiteCmsConfig.draftNotices prevents internal staff leakage', () => {
  const privateDraft = {
    id: 'draft-notice-101',
    titleBn: 'আসন্ন মাহফিল ও ছুটি সংক্রান্ত খসড়া নোটিশ',
    titleEn: 'Upcoming Mahfil & Vacation Draft Notice',
    titleAr: 'إعلان مسودة حول الحفل القادم والإجازة',
    contentBn: 'এটি কেবল অ্যাডমিনদের খসড়া, সাধারণ নোটিশ তালিকায় যাবে না।',
    contentEn: 'Admin draft only, not visible in internal staff portal.',
    contentAr: 'مسودة خاصة للإدارة فقط.',
    category: 'holiday' as const,
    targetAudience: 'all' as const,
    targetClass: 'সকল জামাত',
    priority: 'important' as const,
    publishDate: '2026-11-01',
    expiryDate: '2026-11-15',
    attachmentUrl: '',
    authorName: 'মুহতামিম দপ্তর',
    authorId: 'usr-admin-1',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };

  const initialCfgWithDraft = {
    ...INITIAL_WEBSITE_CMS_CONFIG,
    draftNotices: [privateDraft],
  };

  // 1. mergeWebsiteCmsWithDefaults preserves draftNotices
  const merged = mergeWebsiteCmsWithDefaults(initialCfgWithDraft);
  assert.equal(merged.draftNotices?.length, 1);
  assert.equal(merged.draftNotices?.[0].id, 'draft-notice-101');

  // 2. Settings envelope encoding and decoding preserves draftNotices safely in addressBn envelope
  const envelope = encodeWebsiteCmsAsSettingsEnvelope(initialCfgWithDraft, 'usr-admin-1');
  const decoded = decodeWebsiteCmsFromSettingsEnvelope(envelope);
  assert.ok(decoded);
  assert.equal(decoded.draftNotices?.length, 1);
  assert.equal(decoded.draftNotices?.[0].titleBn, 'আসন্ন মাহফিল ও ছুটি সংক্রান্ত খসড়া নোটিশ');

  // 3. decodeNoticeWithCmsMeta cleanly separates targetClass from metadata and never leaks raw ' ||CMS:'
  const encodedNotice = {
    id: 'not-1',
    titleBn: 'পরীক্ষার রুটিন',
    titleEn: 'Exam Routine',
    contentBn: 'রুটিন সংযুক্ত করা হয়েছে।',
    targetAudience: 'all' as const,
    targetClass: encodeNoticeTargetClassWithCmsMeta('হিফয তাকমীল', {
      status: 'published',
      category: 'exam',
      expiryDate: '2026-12-31',
    }),
    priority: 'normal' as const,
    publishDate: '2026-11-01',
    authorId: 'usr-1',
  };

  const { cleanNotice, cmsMeta } = decodeNoticeWithCmsMeta(encodedNotice);
  assert.equal(cleanNotice.targetClass, 'হিফয তাকমীল');
  assert.equal(cleanNotice.targetClass.includes('||CMS:'), false);
  assert.equal(cmsMeta.status, 'published');
  assert.equal(cmsMeta.category, 'exam');

  // 4. computeCmsDashboardStats counts private drafts from cmsConfig.draftNotices
  const stats = computeCmsDashboardStats(initialCfgWithDraft, [encodedNotice]);
  assert.equal(stats.draftNoticesCount, 1);
  assert.equal(stats.publishedNoticesCount, 1);
});

test('Phase 4.3 Task 5 — getPublishedContactFooter prioritizes published non-empty CMS contact values over settings fallbacks', () => {
  const publishedCmsContact = {
    ...INITIAL_WEBSITE_CMS_CONFIG.contactFooter,
    status: 'published' as const,
    phone: '+880 1711-000000', // Customized CMS phone
    email: 'custom-cms@ummulquranmadrasa.edu.bd', // Customized CMS email
    addressBn: 'কাস্টম সিএমএস ঠিকানা, সেক্টর ৪, উত্তরা, ঢাকা',
  };

  const fallbackSettings = {
    id: 'default-settings',
    institutionNameBn: 'মাদ্রাসার ডিফল্ট নাম (সেটিংস)',
    institutionNameEn: 'Default Settings Madrasa',
    institutionNameAr: 'مدرسة الإعدادات الافتراضية',
    addressBn: 'পুরোনো সেটিংস ঠিকানা (Settings Fallback)',
    phone: '+880 1800-111111',
    email: 'settings-fallback@example.com',
    academicYear: '2026-2027',
    hijriYear: '1447-1448 AH',
    defaultLanguage: 'bn' as const,
    activeDepartments: 'hifz,qawmi',
    gradingSystem: 'Befaq',
    authorId: 'usr-admin',
  };

  // 1. Published CMS values take precedence over settings
  const resultWithCustomCms = getPublishedContactFooter(
    {
      ...INITIAL_WEBSITE_CMS_CONFIG,
      contactFooter: publishedCmsContact,
      publishedContactFooter: publishedCmsContact,
    },
    fallbackSettings
  );

  assert.equal(resultWithCustomCms.phone, '+880 1711-000000');
  assert.equal(resultWithCustomCms.email, 'custom-cms@ummulquranmadrasa.edu.bd');
  assert.equal(resultWithCustomCms.addressBn, 'কাস্টম সিএমএস ঠিকানা, সেক্টর ৪, উত্তরা, ঢাকা');

  // 2. Empty/blank CMS values fall back to settings
  const emptyCmsContact = {
    ...INITIAL_WEBSITE_CMS_CONFIG.contactFooter,
    status: 'published' as const,
    phone: '   ', // Blank phone
    email: '', // Blank email
    addressBn: '', // Blank address
  };

  const resultWithEmptyCms = getPublishedContactFooter(
    {
      ...INITIAL_WEBSITE_CMS_CONFIG,
      contactFooter: emptyCmsContact,
      publishedContactFooter: emptyCmsContact,
    },
    fallbackSettings
  );

  assert.equal(resultWithEmptyCms.phone, '+880 1800-111111');
  assert.equal(resultWithEmptyCms.email, 'settings-fallback@example.com');
  assert.equal(resultWithEmptyCms.addressBn, 'পুরোনো সেটিংস ঠিকানা (Settings Fallback)');
});

test('Phase 4.3 Task 6 — CMS upload defense-in-depth constants and authorization guardrails', () => {
  // 1. Allowed MIME types include images and PDF
  assert.ok(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('image/jpeg'));
  assert.ok(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('image/png'));
  assert.ok(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('image/webp'));
  assert.ok(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('image/svg+xml'));
  assert.ok(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('image/gif'));
  assert.ok(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('application/pdf'));

  // Disallowed MIME types
  assert.equal(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('text/html'), false);
  assert.equal(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('application/javascript'), false);
  assert.equal(ALLOWED_CMS_MEDIA_MIME_TYPES.includes('application/x-executable'), false);

  // 2. 5 MB size limit
  assert.equal(MAX_CMS_MEDIA_FILE_SIZE_BYTES, 5 * 1024 * 1024);

  // 3. Trusted role guard: canManageWebsiteCms
  assert.equal(canManageWebsiteCms('super_admin'), true);
  assert.equal(canManageWebsiteCms('muhtamim'), true);
  assert.equal(canManageWebsiteCms('teacher'), false);
  assert.equal(canManageWebsiteCms('accountant'), false);
  assert.equal(canManageWebsiteCms('residential_supervisor'), false);
  assert.equal(canManageWebsiteCms('staff'), false);
  assert.equal(canManageWebsiteCms('guardian'), false);
  assert.equal(canManageWebsiteCms('student'), false);
});

test('Public CMS Snapshot (`settings/website-cms-public`) strips all private drafts/logs and supports unpublish visibility removal', () => {
  const adminConfigWithPrivateData = {
    ...INITIAL_WEBSITE_CMS_CONFIG,
    homepageSections: {
      ...INITIAL_WEBSITE_CMS_CONFIG.homepageSections,
      hero: {
        ...INITIAL_WEBSITE_CMS_CONFIG.homepageSections.hero,
        titleBn: 'লাইভ প্রকাশিত হিরো শিরোনাম ২০২৬',
        status: 'published' as const,
      },
      intro: {
        ...INITIAL_WEBSITE_CMS_CONFIG.homepageSections.intro,
        titleBn: 'গোপন খসড়া পরিচিতি শিরোনাম (অপ্রকাশিত)',
        status: 'draft' as const,
      },
    },
    draftNotices: [
      {
        id: 'secret-draft-999',
        titleBn: 'গোপন প্রশাসনিক খসড়া নোটিশ',
        titleEn: 'Secret Admin Draft Notice',
        titleAr: 'مسودة سرية',
        contentBn: 'এই খসড়াটি কখনোই পাবলিক ডকুমেন্টে যাবে না।',
        contentEn: 'Must never appear in public document.',
        contentAr: 'لا يجب أن يظهر أبدا',
        category: 'general' as const,
        targetAudience: 'all' as const,
        targetClass: 'সকল জামাত',
        priority: 'urgent' as const,
        publishDate: '2026-11-10',
        expiryDate: '2026-12-31',
        attachmentUrl: '',
        authorName: 'সুপার অ্যাডমিন',
        authorId: 'usr-admin-1',
        updatedAt: '2026-11-10T10:00:00.000Z',
      },
    ],
    recentUpdates: [
      {
        ...INITIAL_WEBSITE_CMS_CONFIG.recentUpdates[0],
        id: 'internal-log-1',
        titleBn: 'অভ্যন্তরীণ প্রশাসনিক অডিট লগ',
      },
    ],
    events: INITIAL_WEBSITE_CMS_CONFIG.events.map((ev, idx) =>
      idx === 0
        ? { ...ev, status: 'draft' as const, titleBn: 'অপ্রকাশিত ইভেন্ট ১' }
        : { ...ev, status: 'published' as const }
    ),
    galleryItems: INITIAL_WEBSITE_CMS_CONFIG.galleryItems.map((g, idx) =>
      idx === 0
        ? { ...g, status: 'draft' as const, titleBn: 'অপ্রকাশিত গ্যালারি ছবি ১' }
        : { ...g, status: 'published' as const }
    ),
    publicProfiles: INITIAL_WEBSITE_CMS_CONFIG.publicProfiles.map((p, idx) =>
      idx === 0
        ? { ...p, status: 'unpublished' as const, nameBn: 'অপ্রকাশিত প্রোফাইল ১' }
        : { ...p, status: 'published' as const }
    ),
  };

  const noticesList = [
    {
      id: 'pub-notice-1',
      titleBn: 'বার্ষিক পরীক্ষার চূড়ান্ত বিজ্ঞপ্তি',
      titleEn: 'Annual Exam Final Notice',
      contentBn: 'সকল বিভাগের বার্ষিক পরীক্ষা আগামী মাসে শুরু হবে।',
      targetAudience: 'all' as const,
      targetClass: encodeNoticeTargetClassWithCmsMeta('সকল জামাত', {
        status: 'published',
        category: 'exam',
        expiryDate: '2099-12-31',
      }),
      priority: 'important' as const,
      publishDate: '2026-11-10',
      authorId: 'usr-admin-1',
    },
    {
      id: 'internal-teachers-notice-2',
      titleBn: 'শুধুমাত্র শিক্ষকদের অভ্যন্তরীণ মিটিং',
      titleEn: 'Internal Teachers Meeting Only',
      contentBn: 'আগামীকাল বাদ আসর উস্তাযদের বৈঠক।',
      targetAudience: 'teachers' as const,
      targetClass: 'সকল উস্তায',
      priority: 'normal' as const,
      publishDate: '2026-11-10',
      authorId: 'usr-admin-1',
    },
  ];

  const snapshot = buildSanitizedPublicCmsSnapshot(
    adminConfigWithPrivateData,
    noticesList
  );

  // 1. Envelope round-trip for settings/website-cms-public
  assert.equal(PUBLIC_WEBSITE_CMS_SETTINGS_DOC_ID, 'website-cms-public');
  const envelope = encodePublicCmsAsSettingsEnvelope(snapshot, 'usr-admin-1');
  assert.equal(envelope.institutionNameEn, 'PUBLIC_WEBSITE_CMS_SNAPSHOT');
  assert.equal(envelope.addressBn.includes('secret-draft-999'), false);
  assert.equal(envelope.addressBn.includes('internal-log-1'), false);
  assert.equal(envelope.addressBn.includes('গোপন খসড়া পরিচিতি শিরোনাম'), false);
  assert.equal(envelope.addressBn.includes('অপ্রকাশিত ইভেন্ট ১'), false);
  assert.equal(envelope.addressBn.includes('অপ্রকাশিত গ্যালারি ছবি ১'), false);
  assert.equal(envelope.addressBn.includes('অপ্রকাশিত প্রোফাইল ১'), false);
  assert.equal(envelope.addressBn.includes('internal-teachers-notice-2'), false);

  const decodedSnap = decodePublicCmsFromSettingsEnvelope(
    envelope as unknown as Record<string, unknown>,
    PUBLIC_WEBSITE_CMS_SETTINGS_DOC_ID
  );
  assert.ok(decodedSnap);
  assert.equal(decodedSnap.homepageSections.hero.titleBn, 'লাইভ প্রকাশিত হিরো শিরোনাম ২০২৬');
  assert.equal(
    decodedSnap.homepageSections.intro.titleBn,
    INITIAL_WEBSITE_CMS_CONFIG.homepageSections.intro.titleBn
  );
  assert.equal(decodedSnap.publishedNotices.length, 1);
  assert.equal(decodedSnap.publishedNotices[0].id, 'pub-notice-1');

  // 2. Converting public snapshot to WebsiteCmsConfig never re-injects unpublished items
  const publicCfg = publicSnapshotToWebsiteCmsConfig(decodedSnap);
  assert.equal(publicCfg.draftNotices?.length, 0);
  assert.equal(publicCfg.recentUpdates.length, 0);
  assert.equal(
    getPublishedPublicEvents(publicCfg, []).length,
    INITIAL_WEBSITE_CMS_CONFIG.events.length - 1
  );
  assert.equal(
    getPublishedGalleryItems(publicCfg).length,
    INITIAL_WEBSITE_CMS_CONFIG.galleryItems.length - 1
  );

  // 3. Unpublishing ALL events and gallery items results in empty public lists (never falls back to INITIAL_BANNER_SLIDES)
  const allUnpublishedCfg = {
    ...INITIAL_WEBSITE_CMS_CONFIG,
    events: INITIAL_WEBSITE_CMS_CONFIG.events.map((ev) => ({
      ...ev,
      status: 'draft' as const,
    })),
    galleryItems: INITIAL_WEBSITE_CMS_CONFIG.galleryItems.map((g) => ({
      ...g,
      status: 'draft' as const,
    })),
  };
  const emptySnap = buildSanitizedPublicCmsSnapshot(allUnpublishedCfg, []);
  const emptyPublicCfg = publicSnapshotToWebsiteCmsConfig(emptySnap);
  assert.equal(getPublishedPublicEvents(emptyPublicCfg, []).length, 0);
  assert.equal(getPublishedGalleryItems(emptyPublicCfg).length, 0);
});






