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
