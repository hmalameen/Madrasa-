import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck2,
  FileText,
  Filter,
  Link2,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type {
  AccountInvitation,
  AdmissionApplication,
  AdmissionEntrySource,
  AdmissionStatus,
  DepartmentCode,
  GuardianLinkRequest,
  Language,
  Role,
  Student,
} from '../../types/madrasa';
import { formatNumber } from '../../i18n/translations';
import {
  canApproveAdmissions,
  canViewAdmissionApplication,
  generateAdmissionReferenceNo,
  isDuplicateAdmissionSubmission,
  validateAdmissionStep,
  verifyPublicApplicationLookup,
} from '../../utils/madrasaLogic';
import {
  StudentPhotoAvatar,
  StudentPhotoCropUploader,
} from '../StudentPhotoUploader';

interface AdmissionsModuleProps {
  lang: Language;
  userRole: Role;
  currentUid: string;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserPhone?: string;
  academicYear: string;
  applications: AdmissionApplication[];
  students: Student[];
  guardianLinkRequests: GuardianLinkRequest[];
  accountInvitations?: AccountInvitation[];
  isPublicApplicantMode?: boolean;
  onReturnToLogin?: (initialInvitationCode?: string) => void;
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
}

const DRAFT_STORAGE_KEY = 'uqcm_admission_form_draft_v1';

const CLASS_PRESETS_BY_DEPT: Record<DepartmentCode, string[]> = {
  hifz: [
    'হিফয প্রাথমিক (নাজেরা ও মাখরাজ)',
    'হিফয শুনানি জামাত',
    'হিফয তাকমীল (খতম বর্ষ)',
  ],
  qawmi: [
    'তাইসীরুল মুবতাদী (প্রস্তুতিমূলক)',
    'মিযান ও মুনশাইব (প্রথম বর্ষ)',
    'নাহবেমীর ও হেদায়াতুন্নাহু',
    'কাফিয়া ও শরহে জামী',
  ],
  general: [
    'ক্যাডেট পঞ্চম শ্রেণি (Class 5)',
    'ক্যাডেট ষষ্ঠ শ্রেণি (Class 6)',
    'ক্যাডেট সপ্তম শ্রেণি (Class 7)',
    'ক্যাডেট অষ্টম শ্রেণি (Class 8)',
  ],
};

export const AdmissionsModule: React.FC<AdmissionsModuleProps> = ({
  lang,
  userRole,
  currentUid,
  currentUserEmail = '',
  currentUserName = '',
  currentUserPhone = '',
  academicYear,
  applications,
  students,
  guardianLinkRequests,
  isPublicApplicantMode = false,
  onReturnToLogin,
  onSubmitApplication,
  onUpdateApplication,
  onApproveApplication,
  onReviewGuardianLinkRequest,
}) => {
  const isApprover = !isPublicApplicantMode && canApproveAdmissions(userRole);
  const isStaffViewer =
    !isPublicApplicantMode && (isApprover || userRole === 'staff');

  const [activeTab, setActiveTab] = useState<'apply' | 'track' | 'admin'>(
    isApprover ? 'admin' : 'apply'
  );

  // 4-step wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedNotice, setDraftSavedNotice] = useState('');
  const [submittedConfirmation, setSubmittedConfirmation] =
    useState<AdmissionApplication | null>(null);
  const [editingCorrectionApp, setEditingCorrectionApp] =
    useState<AdmissionApplication | null>(null);

  // Muhtamim Direct Entry & Immediate Approval mode
  const [isMuhtamimDirectEntry, setIsMuhtamimDirectEntry] =
    useState<boolean>(false);
  const [directAdmissionNo, setDirectAdmissionNo] = useState<string>(
    `UQCM-2026-${students.length + 101}`
  );
  const [directRollNo, setDirectRollNo] = useState<number>(1);
  const [directDormRoom, setDirectDormRoom] = useState<string>(
    'দারুল আরকাম ভবন - কক্ষ ২০২'
  );
  const [directMonthlyFee, setDirectMonthlyFee] = useState<number>(5500);

  // Form fields
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2014-01-15');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [birthRegNo, setBirthRegNo] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [guardianName, setGuardianName] = useState(
    !isPublicApplicantMode && userRole === 'guardian' ? currentUserName : ''
  );
  const [guardianRelation, setGuardianRelation] = useState('পিতা (Father)');
  const [guardianPhone, setGuardianPhone] = useState(
    !isPublicApplicantMode && userRole === 'guardian' ? currentUserPhone : ''
  );
  const [guardianEmail, setGuardianEmail] = useState(
    !isPublicApplicantMode && userRole === 'guardian' ? currentUserEmail : ''
  );
  const [requestGuardianAccount, setRequestGuardianAccount] = useState(true);

  const [department, setDepartment] = useState<DepartmentCode>('hifz');
  const [requestedClass, setRequestedClass] = useState(
    CLASS_PRESETS_BY_DEPT.hifz[0]
  );
  const [academicSession, setAcademicSession] = useState(
    academicYear || '2026-2027'
  );
  const [previousInstitution, setPreviousInstitution] = useState('');
  const [previousClass, setPreviousClass] = useState('');
  const [residentialStatus, setResidentialStatus] = useState<
    'residential' | 'day_scholar'
  >('residential');
  const [medicalOrSpecialNotes, setMedicalOrSpecialNotes] = useState('');

  const [documentName, setDocumentName] = useState('');
  const [documentSummaryUrl, setDocumentSummaryUrl] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Tracking tab state (Secure lookup requiring Ref No + Guardian Phone/DOB for public users)
  const [trackQuery, setTrackQuery] = useState('');
  const [trackVerifySecret, setTrackVerifySecret] = useState('');

  // Admin review state
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<DepartmentCode | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<AdmissionEntrySource | 'all'>('all');
  const [selectedAppId, setSelectedAppId] = useState<string>(
    applications[0]?.id || ''
  );
  const [assignAdmissionNo, setAssignAdmissionNo] = useState('');
  const [assignClass, setAssignClass] = useState('');
  const [assignDept, setAssignDept] = useState<DepartmentCode>('hifz');
  const [assignRollNo, setAssignRollNo] = useState<number>(1);
  const [assignDormRoom, setAssignDormRoom] = useState('');
  const [assignMonthlyFee, setAssignMonthlyFee] = useState<number>(5500);
  const [adminRemarksInput, setAdminRemarksInput] = useState('');
  const [adminActionFeedback, setAdminActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.nameBn) setNameBn(parsed.nameBn);
        if (parsed.nameEn) setNameEn(parsed.nameEn);
        if (parsed.nameAr) setNameAr(parsed.nameAr);
        if (parsed.dateOfBirth) setDateOfBirth(parsed.dateOfBirth);
        if (parsed.bloodGroup) setBloodGroup(parsed.bloodGroup);
        if (parsed.birthRegNo) setBirthRegNo(parsed.birthRegNo);
        if (parsed.presentAddress) setPresentAddress(parsed.presentAddress);
        if (parsed.permanentAddress) setPermanentAddress(parsed.permanentAddress);
        if (parsed.fatherName) setFatherName(parsed.fatherName);
        if (parsed.fatherPhone) setFatherPhone(parsed.fatherPhone);
        if (parsed.motherName) setMotherName(parsed.motherName);
        if (parsed.motherPhone) setMotherPhone(parsed.motherPhone);
        if (parsed.guardianName) setGuardianName(parsed.guardianName);
        if (parsed.guardianRelation) setGuardianRelation(parsed.guardianRelation);
        if (parsed.guardianPhone) setGuardianPhone(parsed.guardianPhone);
        if (parsed.guardianEmail) setGuardianEmail(parsed.guardianEmail);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.requestedClass) setRequestedClass(parsed.requestedClass);
        if (parsed.previousInstitution)
          setPreviousInstitution(parsed.previousInstitution);
        if (parsed.previousClass) setPreviousClass(parsed.previousClass);
        if (parsed.residentialStatus)
          setResidentialStatus(parsed.residentialStatus);
        if (parsed.medicalOrSpecialNotes)
          setMedicalOrSpecialNotes(parsed.medicalOrSpecialNotes);
      }
    } catch {
      // Ignore draft parse errors
    }
  }, []);

  // Synchronize selected application in Admin tab
  const selectedApplication = useMemo(
    () =>
      applications.find((a) => a.id === selectedAppId) || applications[0] || null,
    [applications, selectedAppId]
  );

  useEffect(() => {
    if (!selectedApplication) return;
    const nextSeq = students.length + 101;
    setAssignAdmissionNo(
      selectedApplication.assignedAdmissionNo || `UQCM-2026-${nextSeq}`
    );
    setAssignClass(selectedApplication.requestedClass);
    setAssignDept(selectedApplication.department);
    setAssignRollNo(
      selectedApplication.assignedRollNo > 0
        ? selectedApplication.assignedRollNo
        : students.filter((s) => s.department === selectedApplication.department)
            .length + 1
    );
    setAssignDormRoom(
      selectedApplication.assignedDormitoryRoom ||
        (selectedApplication.residentialStatus === 'residential'
          ? 'দারুল আরকাম ভবন - কক্ষ ২০২'
          : 'অনাবাসিক (Day Scholar)')
    );
    setAssignMonthlyFee(
      selectedApplication.assignedMonthlyFeeBdt > 0
        ? selectedApplication.assignedMonthlyFeeBdt
        : selectedApplication.residentialStatus === 'residential'
        ? 5500
        : 3500
    );
    setAdminRemarksInput(selectedApplication.adminRemarks || '');
  }, [selectedApplication, students]);

  const currentFormPayload = useMemo(
    () => ({
      nameBn,
      nameEn,
      nameAr,
      dateOfBirth,
      gender,
      bloodGroup,
      birthRegNo,
      photoUrl,
      presentAddress,
      permanentAddress: permanentAddress || presentAddress,
      fatherName,
      fatherPhone,
      motherName,
      motherPhone,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianEmail,
      requestGuardianAccount,
      department,
      requestedClass,
      academicSession,
      previousInstitution,
      previousClass,
      residentialStatus,
      medicalOrSpecialNotes,
      documentName,
      documentSummaryUrl,
      consentAccepted,
    }),
    [
      nameBn,
      nameEn,
      nameAr,
      dateOfBirth,
      gender,
      bloodGroup,
      birthRegNo,
      photoUrl,
      presentAddress,
      permanentAddress,
      fatherName,
      fatherPhone,
      motherName,
      motherPhone,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianEmail,
      requestGuardianAccount,
      department,
      requestedClass,
      academicSession,
      previousInstitution,
      previousClass,
      residentialStatus,
      medicalOrSpecialNotes,
      documentName,
      documentSummaryUrl,
      consentAccepted,
    ]
  );

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(currentFormPayload));
      setDraftSavedNotice(
        lang === 'bn'
          ? 'খসড়া আবেদন নিরাপদে সংরক্ষিত হয়েছে'
          : 'Application draft saved locally'
      );
      setTimeout(() => setDraftSavedNotice(''), 3500);
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleNextStep = () => {
    const check = validateAdmissionStep(step, currentFormPayload);
    if (!check.valid) {
      setStepErrors(Object.values(check.errors));
      return;
    }
    setStepErrors([]);
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevStep = () => {
    setStepErrors([]);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
    setDocumentName(safeName);
    setDocumentSummaryUrl(
      `${safeName} (${Math.max(1, Math.round(file.size / 1024))} KB - যাচাইয়ের জন্য সংযুক্ত)`
    );
  };

  const resetForm = () => {
    setNameBn('');
    setNameEn('');
    setNameAr('');
    setBirthRegNo('');
    setPhotoUrl('');
    setPresentAddress('');
    setPermanentAddress('');
    setFatherName('');
    setFatherPhone('');
    setMotherName('');
    setMotherPhone('');
    setPreviousInstitution('');
    setPreviousClass('');
    setMedicalOrSpecialNotes('');
    setDocumentName('');
    setDocumentSummaryUrl('');
    setConsentAccepted(false);
    setEditingCorrectionApp(null);
    setStep(1);
    setStepErrors([]);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const s of [1, 2, 3, 4] as const) {
      const v = validateAdmissionStep(s, currentFormPayload);
      if (!v.valid) {
        setStep(s);
        setStepErrors(Object.values(v.errors));
        return;
      }
    }

    if (
      !editingCorrectionApp &&
      isDuplicateAdmissionSubmission(applications, {
        nameEn: currentFormPayload.nameEn,
        dateOfBirth: currentFormPayload.dateOfBirth,
        guardianPhone: currentFormPayload.guardianPhone,
        academicSession: currentFormPayload.academicSession,
      })
    ) {
      setStepErrors([
        lang === 'bn'
          ? 'এই শিক্ষার্থীর নাম, জন্ম তারিখ ও অভিভাবকের মোবাইল নম্বর দিয়ে বর্তমান শিক্ষাবর্ষে ইতোমধ্যে একটি আবেদন জমা রয়েছে। ট্র্যাকিং ট্যাব থেকে অবস্থা দেখুন।'
          : 'An active admission application for this student already exists for this academic session.',
      ]);
      return;
    }

    setIsSubmitting(true);
    setStepErrors([]);

    try {
      const todayIso = new Date().toISOString().slice(0, 10);

      if (editingCorrectionApp) {
        await onUpdateApplication(editingCorrectionApp.id, {
          ...currentFormPayload,
          status: 'pending',
          submittedDate: todayIso,
        });
        setEditingCorrectionApp(null);
        setTrackQuery(editingCorrectionApp.referenceNo);
        setTrackVerifySecret(editingCorrectionApp.guardianPhone);
        setActiveTab('track');
        resetForm();
        return;
      }

      const refNo = generateAdmissionReferenceNo(
        applications,
        academicSession.slice(0, 4) || '2026'
      );

      const entrySource: AdmissionEntrySource =
        isApprover && isMuhtamimDirectEntry ? 'muhtamim_direct' : 'online_public';

      const created = await onSubmitApplication({
        referenceNo: refNo,
        ...currentFormPayload,
        status: 'pending',
        adminRemarks: '',
        assignedStudentId: '',
        assignedAdmissionNo: '',
        assignedRollNo: 0,
        assignedDormitoryRoom: '',
        assignedMonthlyFeeBdt:
          residentialStatus === 'residential' ? 5500 : 3500,
        submittedDate: todayIso,
        reviewedDate: '',
        reviewedByUid: '',
        applicantUid:
          !isPublicApplicantMode && userRole === 'student' ? currentUid : '',
        guardianUid:
          !isPublicApplicantMode && userRole === 'guardian' ? currentUid : '',
        entrySource,
      });

      // If Muhtamim Direct Entry & Immediate Approval is enabled, approve & provision immediately
      if (isApprover && isMuhtamimDirectEntry) {
        const assignedNo =
          directAdmissionNo.trim() || `UQCM-2026-${students.length + 101}`;
        const approvedRes = await onApproveApplication(created, {
          assignedAdmissionNo: assignedNo,
          requestedClass: currentFormPayload.requestedClass,
          department: currentFormPayload.department,
          assignedRollNo: Number(directRollNo) || 1,
          assignedDormitoryRoom:
            directDormRoom.trim() ||
            (currentFormPayload.residentialStatus === 'residential'
              ? 'দারুল আরকাম ভবন - কক্ষ ২০২'
              : 'অনাবাসিক (Day Scholar)'),
          assignedMonthlyFeeBdt:
            Number(directMonthlyFee) ||
            (currentFormPayload.residentialStatus === 'residential' ? 5500 : 3500),
          adminRemarks:
            'মুহতামিম মহোদয় কর্তৃক সরাসরি ভর্তি এন্ট্রি, যাচাই ও তাৎক্ষণিক অনুমোদিত।',
        });

        setSubmittedConfirmation({
          ...created,
          status: 'approved',
          entrySource: 'muhtamim_direct',
          assignedStudentId: approvedRes.studentId,
          assignedAdmissionNo: approvedRes.admissionNo,
          studentInvitationCode: approvedRes.studentInvitationCode,
          guardianInvitationCode: approvedRes.guardianInvitationCode,
        });
        setSelectedAppId(created.id);
        resetForm();
        return;
      }

      setSubmittedConfirmation(created);
      resetForm();
    } catch {
      setStepErrors([
        lang === 'bn'
          ? 'আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ যাচাই করে পুনরায় চেষ্টা করুন।'
          : 'Failed to submit admission application. Please try again.',
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadForCorrection = (app: AdmissionApplication) => {
    setEditingCorrectionApp(app);
    setSubmittedConfirmation(null);
    setNameBn(app.nameBn);
    setNameEn(app.nameEn);
    setNameAr(app.nameAr);
    setDateOfBirth(app.dateOfBirth);
    setGender(app.gender);
    setBloodGroup(app.bloodGroup);
    setBirthRegNo(app.birthRegNo);
    setPhotoUrl(app.photoUrl);
    setPresentAddress(app.presentAddress);
    setPermanentAddress(app.permanentAddress);
    setFatherName(app.fatherName);
    setFatherPhone(app.fatherPhone);
    setMotherName(app.motherName);
    setMotherPhone(app.motherPhone);
    setGuardianName(app.guardianName);
    setGuardianRelation(app.guardianRelation);
    setGuardianPhone(app.guardianPhone);
    setGuardianEmail(app.guardianEmail);
    setRequestGuardianAccount(app.requestGuardianAccount);
    setDepartment(app.department);
    setRequestedClass(app.requestedClass);
    setAcademicSession(app.academicSession);
    setPreviousInstitution(app.previousInstitution);
    setPreviousClass(app.previousClass);
    setResidentialStatus(app.residentialStatus);
    setMedicalOrSpecialNotes(app.medicalOrSpecialNotes);
    setDocumentName(app.documentName || app.birthCertDocName || '');
    setDocumentSummaryUrl(app.documentSummaryUrl || '');
    setConsentAccepted(true);
    setStep(1);
    setActiveTab('apply');
  };

  // Tracked applications list:
  // In public mode (or when both Ref No and Verification Secret are entered), enforce verifyPublicApplicationLookup
  // so unrelated users cannot view any application or photograph without both Reference No and Guardian Mobile/DOB.
  const trackedLookupResult = useMemo(() => {
    if (isPublicApplicantMode || trackVerifySecret.trim()) {
      if (!trackQuery.trim() && !trackVerifySecret.trim()) {
        return { apps: [] as AdmissionApplication[], errorBn: '' };
      }
      const res = verifyPublicApplicationLookup(
        applications,
        trackQuery,
        trackVerifySecret
      );
      return {
        apps: res ? [res] : [],
        errorBn: res
          ? ''
          : 'সঠিক আবেদন রেফারেন্স নম্বর এবং যাচাইকরণ তথ্য (অভিভাবকের মোবাইল নম্বর অথবা শিক্ষার্থীর জন্ম তারিখ YYYY-MM-DD) একসাথে প্রদান করুন।',
      };
    }

    const q = trackQuery.trim().toLowerCase();
    const matched = applications.filter((app) => {
      if (!canViewAdmissionApplication(app, currentUid, userRole)) {
        return false;
      }
      if (q) {
        const matchesRef = app.referenceNo.toLowerCase().includes(q);
        const matchesPhone =
          app.guardianPhone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) &&
          q.replace(/\D/g, '').length >= 6;
        const matchesName =
          app.nameBn.toLowerCase().includes(q) ||
          app.nameEn.toLowerCase().includes(q);
        return matchesRef || matchesPhone || matchesName;
      }
      return true;
    });
    return { apps: matched, errorBn: '' };
  }, [
    applications,
    trackQuery,
    trackVerifySecret,
    isPublicApplicantMode,
    currentUid,
    userRole,
  ]);

  const trackedApplications = trackedLookupResult.apps;

  // Filtered applications for Admin tab (including source filter: online_public vs muhtamim_direct)
  const filteredAdminApplications = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (deptFilter !== 'all' && app.department !== deptFilter) return false;
      const appSource: AdmissionEntrySource = app.entrySource || 'online_public';
      if (sourceFilter !== 'all' && appSource !== sourceFilter) return false;
      return true;
    });
  }, [applications, statusFilter, deptFilter, sourceFilter]);

  const handleAdminStatusDecision = async (
    nextStatus: 'under_review' | 'needs_correction' | 'rejected'
  ) => {
    if (!selectedApplication || !isApprover) return;
    if (
      (nextStatus === 'needs_correction' || nextStatus === 'rejected') &&
      !adminRemarksInput.trim()
    ) {
      setAdminActionFeedback({
        type: 'error',
        text:
          lang === 'bn'
            ? 'সংশোধন বা বাতিলের ক্ষেত্রে সুনির্দিষ্ট কারণ/মন্তব্য উল্লেখ করা আবশ্যক।'
            : 'Please provide specific remarks when requesting corrections or rejecting.',
      });
      return;
    }

    setIsProcessingDecision(true);
    setAdminActionFeedback(null);
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      await onUpdateApplication(selectedApplication.id, {
        status: nextStatus,
        adminRemarks: adminRemarksInput.trim(),
        reviewedDate: todayIso,
        reviewedByUid: currentUid,
      });
      setAdminActionFeedback({
        type: 'success',
        text:
          nextStatus === 'needs_correction'
            ? lang === 'bn'
              ? 'আবেদনকারীকে সংশোধনের নির্দেশনা পাঠানো হয়েছে।'
              : 'Correction request sent to applicant.'
            : nextStatus === 'rejected'
            ? lang === 'bn'
              ? 'আবেদনটি বাতিল হিসেবে নথিভুক্ত করা হয়েছে।'
              : 'Application marked as rejected.'
            : lang === 'bn'
            ? 'আবেদনটি যাচাইাধীন (Under Review) তালিকায় রাখা হয়েছে।'
            : 'Application marked under review.',
      });
    } catch {
      setAdminActionFeedback({
        type: 'error',
        text:
          lang === 'bn'
            ? 'সিদ্ধান্ত সংরক্ষণে ত্রুটি হয়েছে।'
            : 'Failed to update application status.',
      });
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleAdminApproveAndProvision = async () => {
    if (!selectedApplication || !isApprover) return;
    if (!assignAdmissionNo.trim() || !assignClass.trim()) {
      setAdminActionFeedback({
        type: 'error',
        text:
          lang === 'bn'
            ? 'চূড়ান্ত ভর্তি আইডি (Admission No) এবং শ্রেণি/জামাত নির্ধারণ করা আবশ্যক।'
            : 'Final Admission ID and Class are required for approval.',
      });
      return;
    }

    setIsProcessingDecision(true);
    setAdminActionFeedback(null);
    try {
      const result = await onApproveApplication(selectedApplication, {
        assignedAdmissionNo: assignAdmissionNo.trim(),
        requestedClass: assignClass.trim(),
        department: assignDept,
        assignedRollNo: Number(assignRollNo) || 1,
        assignedDormitoryRoom: assignDormRoom.trim(),
        assignedMonthlyFeeBdt: Number(assignMonthlyFee) || 0,
        adminRemarks:
          adminRemarksInput.trim() ||
          'মুহতামিম কর্তৃক ভর্তি অনুমোদিত এবং অফিশিয়াল স্টুডেন্ট প্রোফাইল সক্রিয় করা হয়েছে।',
      });

      setAdminActionFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `ভর্তি অনুমোদিত! অফিশিয়াল শিক্ষার্থী আইডি ${result.admissionNo} তৈরি ও প্রোফাইল ছবি সংযুক্ত করা হয়েছে।`
            : `Approved! Canonical student ${result.admissionNo} provisioned successfully.`,
      });
    } catch {
      setAdminActionFeedback({
        type: 'error',
        text:
          lang === 'bn'
            ? 'ভর্তি অনুমোদন ও প্রোফাইল তৈরিতে সমস্যা হয়েছে।'
            : 'Failed to approve and provision student profile.',
      });
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const statusBadge = (status: AdmissionStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#166534]/12 text-[#166534] border border-[#166534]/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'অনুমোদিত (Approved)' : 'Approved'}
          </span>
        );
      case 'needs_correction':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#B45309]/15 text-[#B45309] border border-[#B45309]/30">
            <Edit3 className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'সংশোধন প্রয়োজন' : 'Needs Correction'}
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#1E3A8A]/12 text-[#1E3A8A] border border-[#1E3A8A]/25">
            <Clock className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'যাচাই চলছে' : 'Under Review'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#991B1B]/12 text-[#991B1B] border border-[#991B1B]/25">
            <XCircle className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'বাতিল (Rejected)' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#B8860B]/15 text-[#8A6306] border border-[#B8860B]/30">
            <Clock className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'বিবেচনাধীন (Pending)' : 'Pending'}
          </span>
        );
    }
  };

  const sourceBadge = (entrySource?: AdmissionEntrySource) => {
    if (entrySource === 'muhtamim_direct') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#0F5132]/12 text-[#0F5132] border border-[#0F5132]/25">
          <Building2 className="w-3 h-3" />
          {lang === 'bn' ? 'মুহতামিম সরাসরি এন্ট্রি' : 'Muhtamim Direct'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FBF9F4] text-[#6E675C] border border-[#E3DAC9]">
        {lang === 'bn' ? 'অনলাইন আবেদন' : 'Online Application'}
      </span>
    );
  };

  const pendingCount = applications.filter(
    (a) => a.status === 'pending' || a.status === 'under_review'
  ).length;
  const pendingLinkCount = guardianLinkRequests.filter(
    (r) => r.status === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Workspace Switcher */}
      <div className="institutional-card rounded-2xl p-5 sm:p-6 bg-white border border-[#E3DAC9]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F5132]">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>
                {isPublicApplicantMode
                  ? lang === 'bn'
                    ? `পাবলিক অনলাইন ভর্তি গেটওয়ে (লগইন নিষ্প্রয়োজন) · শিক্ষাবর্ষ ${formatNumber(academicYear, lang)}`
                    : `Public Online Admission Gateway (No Login Required) · Session ${academicYear}`
                  : lang === 'bn'
                  ? `অনলাইন ভর্তি ও অনুমোদন গেটওয়ে · শিক্ষাবর্ষ ${formatNumber(academicYear, lang)}`
                  : `Online Admission & Approval Gateway · Session ${academicYear}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1D1B18] mt-1">
              {lang === 'bn'
                ? 'নতুন শিক্ষার্থী ভর্তি আবেদন, ট্র্যাকিং ও মুহতামিম অনুমোদন'
                : lang === 'ar'
                ? 'بوابة القبول الإلكتروني واعتماد الطلاب وربط أولياء الأمور'
                : 'Online Admission Application, Tracking & Muhtamim Approval'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6E675C] mt-1">
              {lang === 'bn'
                ? '৪-ধাপের ভর্তি ফরম পূরণ, পাসপোর্ট ছবি ক্রপ ও সংযুক্তি, আবেদন ট্র্যাকিং এবং মুহতামিম অনুমোদনের মাধ্যমে স্বয়ংক্রিয় স্টুডেন্ট প্রোফাইল ও অভিভাবক সংযুক্তি।'
                : 'Complete the 4-step admission wizard with 1:1 photo cropping, track application status, and provision verified student & guardian accounts.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPublicApplicantMode && onReturnToLogin && (
              <button
                type="button"
                onClick={() => onReturnToLogin()}
                data-testid="public-adm-return-login-btn"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#FFFBEB] text-[#8A6306] border border-[#B8860B]/40 hover:bg-[#FEF3C7] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === 'bn'
                  ? '২. বিদ্যমান ইউজার লগইন / অ্যাক্টিভেশন'
                  : '2. Existing User Login'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSubmittedConfirmation(null);
                setActiveTab('apply');
              }}
              data-testid="admissions-tab-apply"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'apply'
                  ? 'bg-[#0F5132] text-white shadow-sm'
                  : 'bg-[#FBF9F4] text-[#1D1B18] border border-[#E3DAC9] hover:bg-[#F3EFE6]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {lang === 'bn' ? 'নতুন ভর্তি ফরম' : 'Admission Form'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('track')}
              data-testid="admissions-tab-track"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-[#0F5132] text-white shadow-sm'
                  : 'bg-[#FBF9F4] text-[#1D1B18] border border-[#E3DAC9] hover:bg-[#F3EFE6]'
              }`}
            >
              <Search className="w-4 h-4" />
              {lang === 'bn' ? 'আবেদন ট্র্যাকিং' : 'Track Status'}
            </button>

            {isStaffViewer && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                data-testid="admissions-tab-admin"
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#0F5132] text-white shadow-sm'
                    : 'bg-[#FBF9F4] text-[#1D1B18] border border-[#E3DAC9] hover:bg-[#F3EFE6]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {lang === 'bn' ? 'মুহতামিম অনুমোদন প্যানেল' : 'Approval Desk'}
                </span>
                {pendingCount + pendingLinkCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md text-[11px] bg-[#D4AF37] text-[#093023] font-extrabold">
                    {formatNumber(pendingCount + pendingLinkCount, lang)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: 4-STEP ONLINE ADMISSION WIZARD */}
      {activeTab === 'apply' && (
        <div className="institutional-card rounded-2xl p-5 sm:p-7 bg-white border border-[#E3DAC9]">
          {submittedConfirmation ? (
            <div
              className="max-w-2xl mx-auto py-6 text-center space-y-5"
              data-testid="admission-confirmation-card"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#166534]/12 border border-[#166534]/25 text-[#166534] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#B8860B]/15 text-[#8A6306]">
                  {submittedConfirmation.status === 'approved'
                    ? lang === 'bn'
                      ? 'মুহতামিম কর্তৃক সরাসরি ভর্তি অনুমোদিত ও প্রোফাইল তৈরি সম্পন্ন!'
                      : 'Direct Entry Approved & Student Provisioned!'
                    : lang === 'bn'
                    ? 'ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে'
                    : 'Admission Application Received'}
                </span>
                <h3 className="text-2xl font-bold text-[#1D1B18] mt-2">
                  {submittedConfirmation.nameBn} ({submittedConfirmation.nameEn})
                </h3>
                <p className="text-sm text-[#6E675C] mt-1">
                  {submittedConfirmation.status === 'approved'
                    ? lang === 'bn'
                      ? `অফিশিয়াল শিক্ষার্থী আইডি ${submittedConfirmation.assignedAdmissionNo} বরাদ্দ করা হয়েছে এবং এককালীন অ্যাক্টিভেশন কোড প্রস্তুত হয়েছে।`
                      : `Official Student ID ${submittedConfirmation.assignedAdmissionNo} assigned and single-use activation codes generated.`
                    : lang === 'bn'
                    ? 'আপনার আবেদনটি বর্তমানে বিবেচনাধীন (Pending) অবস্থায় রয়েছে। মুহতামিম মহোদয়ের যাচাই ও অনুমোদনের পরই কেবল শিক্ষার্থী অ্যাকাউন্ট সক্রিয় হবে।'
                    : 'Your application is currently Pending review. The student account will be activated only after official verification and approval.'}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FBF9F4] border border-[#E3DAC9] p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#6E675C]">
                    {lang === 'bn'
                      ? 'আবেদন রেফারেন্স নম্বর (Reference No)'
                      : 'Application Reference No'}
                  </p>
                  <p
                    className="text-lg font-mono font-extrabold text-[#0F5132] mt-0.5"
                    data-testid="confirmed-reference-no"
                  >
                    {submittedConfirmation.referenceNo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6E675C]">
                    {lang === 'bn' ? 'বর্তমান অবস্থা' : 'Current Status'}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {statusBadge(submittedConfirmation.status)}
                    {sourceBadge(submittedConfirmation.entrySource)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#6E675C]">
                    {lang === 'bn' ? 'বিভাগ ও কাঙ্ক্ষিত জামাত' : 'Department & Class'}
                  </p>
                  <p className="text-sm font-bold text-[#1D1B18] mt-0.5">
                    {submittedConfirmation.requestedClass}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6E675C]">
                    {lang === 'bn' ? 'অভিভাবকের মোবাইল' : 'Guardian Mobile'}
                  </p>
                  <p className="text-sm font-bold text-[#1D1B18] mt-0.5">
                    {submittedConfirmation.guardianPhone}
                  </p>
                </div>
                {submittedConfirmation.assignedAdmissionNo && (
                  <div>
                    <p className="text-xs text-[#6E675C]">
                      {lang === 'bn' ? 'বরাদ্দকৃত স্টুডেন্ট আইডি' : 'Assigned Student ID'}
                    </p>
                    <p
                      className="text-sm font-mono font-extrabold text-[#166534] mt-0.5"
                      data-testid="confirmed-assigned-student-id"
                    >
                      {submittedConfirmation.assignedAdmissionNo}
                    </p>
                  </div>
                )}
                {submittedConfirmation.studentInvitationCode && (
                  <div>
                    <p className="text-xs text-[#6E675C]">
                      {lang === 'bn'
                        ? 'শিক্ষার্থী ও অভিভাবক এককালীন কোড'
                        : 'Single-Use Activation Codes'}
                    </p>
                    <p className="text-xs font-mono font-bold text-[#0F5132] mt-0.5">
                      STU: {submittedConfirmation.studentInvitationCode}
                      {submittedConfirmation.guardianInvitationCode
                        ? ` | GRD: ${submittedConfirmation.guardianInvitationCode}`
                        : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrackQuery(submittedConfirmation.referenceNo);
                    setTrackVerifySecret(submittedConfirmation.guardianPhone);
                    setActiveTab('track');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  {lang === 'bn'
                    ? 'আবেদনের সর্বশেষ অবস্থা ট্র্যাক করুন'
                    : 'Track Application Status'}
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedConfirmation(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E3DAC9] bg-white text-[#1D1B18] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  {lang === 'bn' ? 'নতুন আরেকটি আবেদন করুন' : 'Submit Another'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              {/* Muhtamim Direct Entry & Immediate Approval Banner */}
              {isApprover && !editingCorrectionApp && (
                <div className="rounded-xl bg-[#0F5132]/6 border border-[#0F5132]/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      {lang === 'bn'
                        ? 'মুহতামিম সরাসরি নতুন ছাত্র এন্ট্রি ও তাৎক্ষণিক অনুমোদন মোড'
                        : 'Muhtamim Direct Student Entry & Immediate Approval'}
                    </p>
                    <p className="text-xs text-[#6E675C] mt-0.5">
                      {lang === 'bn'
                        ? 'সক্রিয় করলে মুহতামিম সরাসরি ছাত্রের তথ্য ও ছবি এন্ট্রি করে এক ধাপেই স্টুডেন্ট আইডি বরাদ্দ ও অনুমোদন সম্পন্ন করতে পারবেন।'
                        : 'Enable to enter a new student directly, assign Student ID, and approve in one authorized step.'}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-[#0F5132]/30 text-xs font-bold text-[#0F5132] cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isMuhtamimDirectEntry}
                      onChange={(e) => {
                        setIsMuhtamimDirectEntry(e.target.checked);
                        setDirectAdmissionNo(`UQCM-2026-${students.length + 101}`);
                      }}
                      data-testid="muhtamim-direct-entry-toggle"
                      className="w-4 h-4 accent-[#0F5132]"
                    />
                    <span>
                      {lang === 'bn'
                        ? 'সরাসরি এন্ট্রি ও তাৎক্ষণিক অনুমোদন'
                        : 'Direct Entry & Approve'}
                    </span>
                  </label>
                </div>
              )}

              {editingCorrectionApp && (
                <div className="rounded-xl bg-[#FFFBEB] border border-[#B45309]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
                      {lang === 'bn'
                        ? `সংশোধন মোড সক্রিয় · রেফারেন্স: ${editingCorrectionApp.referenceNo}`
                        : `Correction Resubmission Mode · Ref: ${editingCorrectionApp.referenceNo}`}
                    </p>
                    <p className="text-xs text-[#1D1B18] mt-1 font-medium">
                      {lang === 'bn' ? 'মুহতামিমের নির্দেশনা: ' : 'Admin Note: '}
                      {editingCorrectionApp.adminRemarks}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#B45309]/30 bg-white text-[#B45309] shrink-0 cursor-pointer"
                  >
                    {lang === 'bn' ? 'সংশোধন বাতিল' : 'Cancel Edit'}
                  </button>
                </div>
              )}

              {/* Step Progress Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    s: 1,
                    titleBn: '১. শিক্ষার্থীর তথ্য ও ছবি',
                    titleEn: '1. Student & Photo',
                  },
                  {
                    s: 2,
                    titleBn: '২. মাতা-পিতা ও অভিভাবক',
                    titleEn: '2. Parent & Guardian',
                  },
                  {
                    s: 3,
                    titleBn: '৩. বিভাগ ও আবাসিক তথ্য',
                    titleEn: '3. Academic & Hostel',
                  },
                  {
                    s: 4,
                    titleBn: '৪. কাগজপত্র ও চূড়ান্ত যাচাই',
                    titleEn: '4. Documents & Review',
                  },
                ].map((item) => {
                  const isActive = step === item.s;
                  const isDone = step > item.s;
                  return (
                    <button
                      key={item.s}
                      type="button"
                      onClick={() => {
                        if (item.s < step) {
                          setStepErrors([]);
                          setStep(item.s as 1 | 2 | 3 | 4);
                        }
                      }}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0F5132]/8 border-[#0F5132] text-[#0F5132]'
                          : isDone
                          ? 'bg-[#166534]/6 border-[#166534]/30 text-[#166534]'
                          : 'bg-[#FBF9F4] border-[#E3DAC9] text-[#6E675C]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">
                          {lang === 'bn' ? item.titleBn : item.titleEn}
                        </span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {stepErrors.length > 0 && (
                <div
                  className="rounded-xl bg-[#FEF2F2] border border-[#991B1B]/30 p-4 space-y-1"
                  data-testid="admission-step-errors"
                >
                  <p className="text-xs font-bold text-[#991B1B] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {lang === 'bn'
                      ? 'অনুগ্রহ করে নিচের তথ্যগুলো সংশোধন করুন:'
                      : 'Please resolve the following fields:'}
                  </p>
                  <ul className="list-disc list-inside text-xs text-[#991B1B] space-y-0.5">
                    {stepErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* STEP 1: STUDENT INFORMATION & PHOTO */}
              {step === 1 && (
                <div className="space-y-5" data-testid="admission-step-1">
                  <StudentPhotoCropUploader
                    lang={lang}
                    value={photoUrl}
                    onChange={setPhotoUrl}
                    studentName={nameEn || nameBn}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *'
                          : 'Student Full Name (Bengali) *'}
                      </label>
                      <input
                        type="text"
                        value={nameBn}
                        onChange={(e) => setNameBn(e.target.value)}
                        placeholder="যেমন: মুহাম্মাদ রায়হান মাহমুদ"
                        data-testid="adm-input-nameBn"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18] focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'শিক্ষার্থীর পূর্ণ নাম (ইংরেজিতে) *'
                          : 'Student Full Name (English) *'}
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Mohammad Rayhan Mahmud"
                        data-testid="adm-input-nameEn"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18] focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'আরবি নাম (ঐচ্ছিক / Optional)'
                          : 'Arabic Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        placeholder="محمد ريحان محمود"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18] focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn' ? 'জন্ম তারিখ *' : 'Date of Birth *'}
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn' ? 'লিঙ্গ (Gender)' : 'Gender'}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value as 'male' | 'female')
                        }
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      >
                        <option value="male">
                          {lang === 'bn' ? 'ছাত্র (Male)' : 'Male'}
                        </option>
                        <option value="female">
                          {lang === 'bn' ? 'ছাত্রী (Female)' : 'Female'}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'রক্তের গ্রুপ (ঐচ্ছিক)'
                          : 'Blood Group (Optional)'}
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      >
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'জানা নেই'].map(
                          (bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'জন্ম নিবন্ধন নম্বর (ঐচ্ছিক)'
                          : 'Birth Reg. No (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={birthRegNo}
                        onChange={(e) => setBirthRegNo(e.target.value)}
                        placeholder="১৭ ডিজিটের জন্ম নিবন্ধন নম্বর"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn' ? 'বর্তমান ঠিকানা *' : 'Present Address *'}
                      </label>
                      <input
                        type="text"
                        value={presentAddress}
                        onChange={(e) => setPresentAddress(e.target.value)}
                        placeholder="বাসা/রোড, সেক্টর/ইউনিয়ন, থানা ও জেলা"
                        data-testid="adm-input-presentAddress"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[#1D1B18]">
                          {lang === 'bn'
                            ? 'স্থায়ী ঠিকানা (ঐচ্ছিক)'
                            : 'Permanent Address (Optional)'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setPermanentAddress(presentAddress)}
                          className="text-[11px] font-semibold text-[#0F5132] hover:underline cursor-pointer"
                        >
                          {lang === 'bn'
                            ? 'বর্তমান ঠিকানার অনুরূপ'
                            : 'Same as present'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        placeholder="গ্রাম, ডাকঘর, উপজেলা ও জেলা"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PARENT & GUARDIAN INFORMATION */}
              {step === 2 && (
                <div className="space-y-5" data-testid="admission-step-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn' ? 'পিতার নাম *' : "Father's Name *"}
                      </label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="পিতার পূর্ণ নাম"
                        data-testid="adm-input-fatherName"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'পিতার মোবাইল নম্বর (ঐচ্ছিক)'
                          : "Father's Mobile (Optional)"}
                      </label>
                      <input
                        type="tel"
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        placeholder="017XX-XXXXXX"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'মাতার নাম (ঐচ্ছিক)'
                          : "Mother's Name (Optional)"}
                      </label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="মাতার পূর্ণ নাম"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'মাতার মোবাইল নম্বর (ঐচ্ছিক)'
                          : "Mother's Mobile (Optional)"}
                      </label>
                      <input
                        type="tel"
                        value={motherPhone}
                        onChange={(e) => setMotherPhone(e.target.value)}
                        placeholder="018XX-XXXXXX"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E3DAC9]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#0F5132]">
                        {lang === 'bn'
                          ? 'প্রধান অভিভাবকের যোগাযোগ ও পোর্টাল সংযুক্তি'
                          : 'Primary Guardian Contact & Portal Link'}
                      </p>
                      {fatherName && (
                        <button
                          type="button"
                          onClick={() => {
                            setGuardianName(fatherName);
                            if (fatherPhone) setGuardianPhone(fatherPhone);
                            setGuardianRelation('পিতা (Father)');
                          }}
                          className="text-xs font-semibold text-[#0F5132] hover:underline cursor-pointer"
                        >
                          {lang === 'bn'
                            ? 'পিতাকেই প্রধান অভিভাবক হিসেবে নির্বাচন করুন'
                            : 'Copy Father as Primary Guardian'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                          {lang === 'bn'
                            ? 'প্রধান অভিভাবকের নাম *'
                            : 'Primary Guardian Name *'}
                        </label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="অভিভাবকের নাম"
                          data-testid="adm-input-guardianName"
                          className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                          {lang === 'bn' ? 'সম্পর্ক *' : 'Relationship *'}
                        </label>
                        <select
                          value={guardianRelation}
                          onChange={(e) => setGuardianRelation(e.target.value)}
                          className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                        >
                          <option value="পিতা (Father)">পিতা (Father)</option>
                          <option value="মাতা (Mother)">মাতা (Mother)</option>
                          <option value="বড় ভাই (Elder Brother)">
                            বড় ভাই (Elder Brother)
                          </option>
                          <option value="চাচা / মামা (Uncle)">
                            চাচা / মামা (Uncle)
                          </option>
                          <option value="স্থানীয় অভিভাবক (Local Guardian)">
                            স্থানীয় অভিভাবক (Local Guardian)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                          {lang === 'bn'
                            ? 'অভিভাবকের সচল মোবাইল নম্বর *'
                            : 'Guardian Mobile Number *'}
                        </label>
                        <input
                          type="tel"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder="01711-XXXXXX"
                          data-testid="adm-input-guardianPhone"
                          className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                          {lang === 'bn'
                            ? 'অভিভাবকের ইমেইল (ঐচ্ছিক)'
                            : 'Guardian Email (Optional)'}
                        </label>
                        <input
                          type="email"
                          value={guardianEmail}
                          onChange={(e) => setGuardianEmail(e.target.value)}
                          placeholder="guardian@example.com"
                          className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                        />
                      </div>
                    </div>

                    <label className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E3DAC9] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requestGuardianAccount}
                        onChange={(e) =>
                          setRequestGuardianAccount(e.target.checked)
                        }
                        className="mt-0.5 w-4 h-4 accent-[#0F5132]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#1D1B18]">
                          {lang === 'bn'
                            ? 'অভিভাবক পোর্টাল অ্যাকাউন্টে এই শিক্ষার্থীর প্রোফাইল সংযুক্ত করার আবেদন করুন'
                            : 'Request Guardian Portal Account Linking for this Student'}
                        </span>
                        <p className="text-[#6E675C] mt-0.5">
                          {lang === 'bn'
                            ? 'মুহতামিম কর্তৃক ভর্তি অনুমোদনের পর অভিভাবক তার নিজস্ব অ্যাকাউন্ট থেকে সন্তানের হাজিরা, পরীক্ষার ফলাফল, ফি এবং হিফয ডায়েরি নিরাপদে পর্যবেক্ষণ করতে পারবেন।'
                            : 'Upon approval, the guardian will have read-only access to this child’s attendance, exam results, fees, and Hifz diary.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: ACADEMIC & ADMISSION DETAILS */}
              {step === 3 && (
                <div className="space-y-5" data-testid="admission-step-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn' ? 'ভর্তি বিভাগ *' : 'Department *'}
                      </label>
                      <select
                        value={department}
                        onChange={(e) => {
                          const nextDept = e.target.value as DepartmentCode;
                          setDepartment(nextDept);
                          setRequestedClass(CLASS_PRESETS_BY_DEPT[nextDept][0]);
                        }}
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      >
                        <option value="hifz">
                          {lang === 'bn'
                            ? 'হিফযুল কুরআন বিভাগ (Hifz)'
                            : 'Hifz-ul-Quran Department'}
                        </option>
                        <option value="qawmi">
                          {lang === 'bn'
                            ? 'কওমি কিতাব বিভাগ (Qawmi Kitab)'
                            : 'Qawmi Kitab Department'}
                        </option>
                        <option value="general">
                          {lang === 'bn'
                            ? 'জেনারেল ক্যাডেট বিভাগ (General Cadet)'
                            : 'General Cadet Department'}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'কাঙ্ক্ষিত শ্রেণি / জামাত *'
                          : 'Requested Class / Jamat *'}
                      </label>
                      <select
                        value={requestedClass}
                        onChange={(e) => setRequestedClass(e.target.value)}
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      >
                        {CLASS_PRESETS_BY_DEPT[department].map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn' ? 'শিক্ষাবর্ষ *' : 'Academic Session *'}
                      </label>
                      <input
                        type="text"
                        value={academicSession}
                        onChange={(e) => setAcademicSession(e.target.value)}
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'আবাসিক অবস্থা *'
                          : 'Residential Status *'}
                      </label>
                      <select
                        value={residentialStatus}
                        onChange={(e) =>
                          setResidentialStatus(
                            e.target.value as 'residential' | 'day_scholar'
                          )
                        }
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      >
                        <option value="residential">
                          {lang === 'bn'
                            ? 'আবাসিক ছাত্রাবাস (Residential)'
                            : 'Residential (Dormitory)'}
                        </option>
                        <option value="day_scholar">
                          {lang === 'bn'
                            ? 'অনাবাসিক (Day Scholar)'
                            : 'Non-Residential (Day Scholar)'}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'পূর্ববর্তী শিক্ষা প্রতিষ্ঠান (প্রযোজ্য ক্ষেত্রে)'
                          : 'Previous Institution (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={previousInstitution}
                        onChange={(e) => setPreviousInstitution(e.target.value)}
                        placeholder="যেমন: দারুস সুন্নাহ নূরানী মাদ্রাসা"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                        {lang === 'bn'
                          ? 'পূর্ববর্তী শ্রেণি / পারা (ঐচ্ছিক)'
                          : 'Previous Class / Para Completed'}
                      </label>
                      <input
                        type="text"
                        value={previousClass}
                        onChange={(e) => setPreviousClass(e.target.value)}
                        placeholder="যেমন: নাজেরা উত্তীর্ণ / ৫ পারা মুখস্থ"
                        className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2.5 text-sm text-[#1D1B18]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D1B18] mb-1">
                      {lang === 'bn'
                        ? 'স্বাস্থ্যগত তথ্য বা বিশেষ মন্তব্য (ঐচ্ছিক)'
                        : 'Medical or Special Notes (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={medicalOrSpecialNotes}
                      onChange={(e) => setMedicalOrSpecialNotes(e.target.value)}
                      placeholder="খাদ্য এলার্জি, চশমা ব্যবহার বা তিলাওয়াত সংক্রান্ত বিশেষ তথ্য থাকলে লিখুন..."
                      className="w-full rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-3.5 py-2 text-sm text-[#1D1B18]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: DOCUMENTS & FINAL REVIEW */}
              {step === 4 && (
                <div className="space-y-5" data-testid="admission-step-4">
                  <div className="rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {lang === 'bn'
                            ? 'সহায়ক কাগজপত্র সংযুক্তি (জন্ম নিবন্ধন / পূর্ববর্তী সনদ - ঐচ্ছিক)'
                            : 'Supporting Documents (Birth Certificate / Transfer Certificate - Optional)'}
                        </p>
                        <p className="text-xs text-[#6E675C] mt-0.5">
                          {documentSummaryUrl ||
                            (lang === 'bn'
                              ? 'ভর্তি সাক্ষাৎকারের সময় মূল কপি প্রদর্শন করা যাবে অথবা এখানে ফাইল সংযুক্ত করুন।'
                              : 'Attach a copy now or bring originals during the admission interview.')}
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-[#E3DAC9] text-[#1D1B18] hover:bg-[#F3EFE6] cursor-pointer shrink-0">
                        <FileCheck2 className="w-3.5 h-3.5 text-[#0F5132]" />
                        <span>
                          {documentName
                            ? lang === 'bn'
                              ? 'ডকুমেন্ট পরিবর্তন করুন'
                              : 'Replace File'
                            : lang === 'bn'
                            ? 'কাগজপত্র নির্বাচন করুন'
                            : 'Attach File'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleDocumentFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Full Review Summary Card */}
                  <div className="rounded-2xl border border-[#E3DAC9] bg-[#FFFDF8] p-5 space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-[#E3DAC9]">
                      <StudentPhotoAvatar
                        photoUrl={photoUrl}
                        nameBn={nameBn || 'নতুন শিক্ষার্থী'}
                        nameEn={nameEn}
                        department={department}
                        size="lg"
                      />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F5132]">
                          {lang === 'bn'
                            ? 'চূড়ান্ত আবেদন প্রিভিউ (Application Summary)'
                            : 'Application Review Summary'}
                        </span>
                        <h4 className="text-lg font-bold text-[#1D1B18]">
                          {nameBn || '—'} ({nameEn || '—'})
                        </h4>
                        <p className="text-xs text-[#6E675C]">
                          {requestedClass} ·{' '}
                          {residentialStatus === 'residential'
                            ? 'আবাসিক (Residential)'
                            : 'অনাবাসিক (Day Scholar)'}{' '}
                          · শিক্ষাবর্ষ {academicSession}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E3DAC9]/70">
                        <p className="text-[#6E675C]">
                          {lang === 'bn'
                            ? 'জন্ম তারিখ ও রক্তের গ্রুপ'
                            : 'DOB & Blood Group'}
                        </p>
                        <p className="font-bold text-[#1D1B18] mt-0.5">
                          {dateOfBirth} · {bloodGroup || 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E3DAC9]/70">
                        <p className="text-[#6E675C]">
                          {lang === 'bn'
                            ? 'পিতা ও প্রধান অভিভাবক'
                            : 'Father & Primary Guardian'}
                        </p>
                        <p className="font-bold text-[#1D1B18] mt-0.5">
                          {fatherName} / {guardianName} ({guardianRelation})
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E3DAC9]/70">
                        <p className="text-[#6E675C]">
                          {lang === 'bn'
                            ? 'অভিভাবকের মোবাইল ও ঠিকানা'
                            : 'Guardian Mobile & Address'}
                        </p>
                        <p className="font-bold text-[#1D1B18] mt-0.5">
                          {guardianPhone} · {presentAddress}
                        </p>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0F5132]/5 border border-[#0F5132]/25 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentAccepted}
                        onChange={(e) => setConsentAccepted(e.target.checked)}
                        data-testid="adm-checkbox-consent"
                        className="mt-0.5 w-4 h-4 accent-[#0F5132]"
                      />
                      <span className="text-xs font-medium text-[#1D1B18]">
                        {lang === 'bn'
                          ? 'আমি অঙ্গীকার করছি যে, উপরে প্রদত্ত সকল তথ্য সঠিক এবং ভর্তি অনুমোদনের পর শিক্ষার্থী উম্মুল কুরআন ক্যাডেট মাদ্রাসার শৃঙ্খলা, তারবিয়াহ ও আবাসিক নিয়মাবলী মেনে চলতে বাধ্য থাকবে।'
                          : 'I confirm that all information provided above is accurate and agree to abide by the academic and disciplinary regulations of Ummul Quran Cadet Madrasa.'}
                      </span>
                    </label>

                    {/* Muhtamim Direct Assignment Fields inside Step 4 when Direct Entry is active */}
                    {isApprover && isMuhtamimDirectEntry && (
                      <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#166534]/30 space-y-3">
                        <p className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
                          {lang === 'bn'
                            ? 'মুহতামিম কর্তৃক তাৎক্ষণিক স্টুডেন্ট আইডি ও রোল বরাদ্দ'
                            : 'Immediate Student ID & Roll Assignment by Muhtamim'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                              {lang === 'bn' ? 'অফিশিয়াল স্টুডেন্ট আইডি *' : 'Student ID *'}
                            </label>
                            <input
                              type="text"
                              value={directAdmissionNo}
                              onChange={(e) => setDirectAdmissionNo(e.target.value)}
                              data-testid="direct-input-admissionNo"
                              className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#1D1B18]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                              {lang === 'bn' ? 'রোল নম্বর' : 'Roll No'}
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={directRollNo}
                              onChange={(e) => setDirectRollNo(Number(e.target.value))}
                              className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-1.5 text-xs text-[#1D1B18]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                              {lang === 'bn' ? 'ছাত্রাবাস কক্ষ' : 'Dorm Room'}
                            </label>
                            <input
                              type="text"
                              value={directDormRoom}
                              onChange={(e) => setDirectDormRoom(e.target.value)}
                              className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-1.5 text-xs text-[#1D1B18]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                              {lang === 'bn' ? 'মাসিক ফি (৳)' : 'Monthly Fee'}
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={directMonthlyFee}
                              onChange={(e) => setDirectMonthlyFee(Number(e.target.value))}
                              className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-1.5 text-xs text-[#1D1B18]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wizard Footer Actions */}
              <div className="pt-4 border-t border-[#E3DAC9] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-[#E3DAC9] bg-white text-[#1D1B18] hover:bg-[#F3EFE6] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {lang === 'bn' ? 'পূর্ববর্তী ধাপ' : 'Previous Step'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-[#E3DAC9] bg-[#FBF9F4] text-[#6E675C] hover:text-[#1D1B18] cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {lang === 'bn' ? 'খসড়া সংরক্ষণ' : 'Save Draft'}
                  </button>

                  {draftSavedNotice && (
                    <span className="text-xs font-semibold text-[#166534]">
                      {draftSavedNotice}
                    </span>
                  )}
                </div>

                <div>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      data-testid="adm-btn-next"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'পরবর্তী ধাপ' : 'Next Step'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="adm-btn-submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? lang === 'bn'
                            ? 'জমা হচ্ছে...'
                            : 'Submitting...'
                          : editingCorrectionApp
                          ? lang === 'bn'
                            ? 'সংশোধিত আবেদন পুনরায় জমা দিন'
                            : 'Resubmit Corrected Application'
                          : isApprover && isMuhtamimDirectEntry
                          ? lang === 'bn'
                            ? 'সরাসরি ভর্তি অনুমোদন ও স্টুডেন্ট প্রোফাইল তৈরি করুন'
                            : 'Direct Submit & Immediately Approve'
                          : lang === 'bn'
                          ? 'ভর্তি আবেদন চূড়ান্ত জমা দিন'
                          : 'Submit Admission Application'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: APPLICATION STATUS TRACKER & CORRECTION RESUBMISSION */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          <div className="institutional-card rounded-2xl p-5 bg-white border border-[#E3DAC9]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1D1B18]">
                  {lang === 'bn'
                    ? 'নিরাপদ ভর্তি আবেদন ট্র্যাকিং ও সংশোধন (Secure Application Status Tracker)'
                    : 'Secure Admission Application Status Tracker'}
                </h3>
                <p className="text-xs text-[#6E675C]">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত তথ্যের নিরাপত্তার জন্য আবেদন রেফারেন্স নম্বর এবং অভিভাবকের নিবন্ধিত মোবাইল নম্বর (অথবা জন্ম তারিখ) উভয়টি প্রদান করুন।'
                    : 'To protect student privacy, enter both your Application Reference No and Guardian Mobile Number (or Date of Birth).'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-[32rem]">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6E675C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'রেফারেন্স নম্বর (UQCM-ADM-...)'
                        : 'Reference No (UQCM-ADM-...)'
                    }
                    data-testid="adm-track-search-input"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] text-xs sm:text-sm font-mono text-[#1D1B18]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={trackVerifySecret}
                    onChange={(e) => setTrackVerifySecret(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'অভিভাবকের মোবাইল বা জন্ম তারিখ *'
                        : 'Guardian Mobile or DOB *'
                    }
                    data-testid="adm-track-secret-input"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] text-xs sm:text-sm text-[#1D1B18]"
                  />
                </div>
              </div>
            </div>
            {trackedLookupResult.errorBn && (
              <div
                className="mt-3 rounded-xl bg-[#FEF2F2] border border-[#991B1B]/30 px-3.5 py-2.5 text-xs font-bold text-[#991B1B]"
                data-testid="adm-track-lookup-error"
              >
                {trackedLookupResult.errorBn}
              </div>
            )}
          </div>

          {trackedApplications.length === 0 ? (
            <div className="institutional-card rounded-2xl p-8 bg-white border border-[#E3DAC9] text-center">
              <p className="text-sm font-bold text-[#1D1B18]">
                {lang === 'bn'
                  ? 'কোনো ভর্তি আবেদন প্রদর্শিত হচ্ছে না'
                  : 'No matching admission applications found'}
              </p>
              <p className="text-xs text-[#6E675C] mt-1">
                {lang === 'bn'
                  ? 'নিরাপদ ট্র্যাকিংয়ের জন্য সঠিক রেফারেন্স নম্বর এবং অভিভাবকের মোবাইল নম্বর উভয়ই প্রদান করুন।'
                  : 'Please provide both your Reference No and Guardian Mobile Number to view your application.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trackedApplications.map((app) => (
                <div
                  key={app.id}
                  className="institutional-card rounded-2xl p-5 bg-white border border-[#E3DAC9] space-y-4"
                  data-testid={`tracked-app-${app.referenceNo}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3DAC9]">
                    <div className="flex items-center gap-3.5">
                      <StudentPhotoAvatar
                        photoUrl={app.photoUrl}
                        nameBn={app.nameBn}
                        nameEn={app.nameEn}
                        department={app.department}
                        size="lg"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#0F5132] bg-[#0F5132]/8 px-2.5 py-0.5 rounded-md">
                            {app.referenceNo}
                          </span>
                          {statusBadge(app.status)}
                          {sourceBadge(app.entrySource)}
                        </div>
                        <h4 className="text-base font-bold text-[#1D1B18] mt-1">
                          {app.nameBn} ({app.nameEn})
                        </h4>
                        <p className="text-xs text-[#6E675C]">
                          {app.requestedClass} · অভিভাবক: {app.guardianName} (
                          {app.guardianPhone})
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs text-[#6E675C]">
                      <p>
                        {lang === 'bn' ? 'জমার তারিখ: ' : 'Submitted: '}
                        <span className="font-semibold text-[#1D1B18]">
                          {app.submittedDate}
                        </span>
                      </p>
                      {app.assignedAdmissionNo && (
                        <p className="text-[#166534] font-bold mt-0.5">
                          {lang === 'bn'
                            ? `বরাদ্দকৃত শিক্ষার্থী আইডি: ${app.assignedAdmissionNo}`
                            : `Assigned Student ID: ${app.assignedAdmissionNo}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {app.adminRemarks && (
                    <div
                      className={`rounded-xl p-3.5 text-xs border ${
                        app.status === 'needs_correction'
                          ? 'bg-[#FFFBEB] border-[#B45309]/40 text-[#92400E]'
                          : app.status === 'approved'
                          ? 'bg-[#F0FDF4] border-[#166534]/30 text-[#166534]'
                          : 'bg-[#FBF9F4] border-[#E3DAC9] text-[#1D1B18]'
                      }`}
                    >
                      <span className="font-bold">
                        {lang === 'bn'
                          ? 'মুহতামিম / ভর্তি দপ্তরের মন্তব্য: '
                          : 'Admission Office Remarks: '}
                      </span>
                      {app.adminRemarks}
                    </div>
                  )}

                  {/* Single-Use Account Activation Links for Approved Student & Guardian */}
                  {app.status === 'approved' &&
                    (app.studentInvitationCode || app.guardianInvitationCode) && (
                      <div className="rounded-xl bg-[#FBF9F4] border border-[#0F5132]/30 p-4 space-y-2.5">
                        <p className="text-xs font-bold text-[#0F5132]">
                          {lang === 'bn'
                            ? 'পৃথক এককালীন অ্যাকাউন্ট অ্যাক্টিভেশন ও পাসওয়ার্ড সেটআপ কোড (Single-Use Activation)'
                            : 'Separate Single-Use Account Activation Codes'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {app.studentInvitationCode && (
                            <div className="p-3 rounded-lg bg-white border border-[#E3DAC9] flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] text-[#6E675C]">
                                  {lang === 'bn'
                                    ? 'শিক্ষার্থী পোর্টাল অ্যাক্টিভেশন কোড'
                                    : 'Student Activation Code'}
                                </p>
                                <p
                                  className="font-mono font-extrabold text-[#0F5132]"
                                  data-testid={`tracked-stu-invite-${app.referenceNo}`}
                                >
                                  {app.studentInvitationCode}
                                </p>
                              </div>
                              {onReturnToLogin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReturnToLogin(app.studentInvitationCode)
                                  }
                                  data-testid={`activate-stu-btn-${app.referenceNo}`}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] cursor-pointer"
                                >
                                  {lang === 'bn' ? 'সক্রিয় করুন' : 'Activate'}
                                </button>
                              )}
                            </div>
                          )}
                          {app.guardianInvitationCode && (
                            <div className="p-3 rounded-lg bg-white border border-[#E3DAC9] flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] text-[#6E675C]">
                                  {lang === 'bn'
                                    ? 'অভিভাবক পোর্টাল পৃথক অ্যাক্টিভেশন কোড'
                                    : 'Guardian Separate Activation Code'}
                                </p>
                                <p
                                  className="font-mono font-extrabold text-[#8A6306]"
                                  data-testid={`tracked-grd-invite-${app.referenceNo}`}
                                >
                                  {app.guardianInvitationCode}
                                </p>
                              </div>
                              {onReturnToLogin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReturnToLogin(app.guardianInvitationCode)
                                  }
                                  data-testid={`activate-grd-btn-${app.referenceNo}`}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#B8860B] text-white hover:bg-[#8A6306] cursor-pointer"
                                >
                                  {lang === 'bn' ? 'সক্রিয় করুন' : 'Activate'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {app.status === 'needs_correction' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleLoadForCorrection(app)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#B45309] text-white hover:bg-[#92400E] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {lang === 'bn'
                          ? 'তথ্য ও ছবি সংশোধন করে পুনরায় জমা দিন'
                          : 'Edit & Resubmit Application'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MUHTAMIM / ADMIN APPROVAL & GUARDIAN LINKING DASHBOARD */}
      {activeTab === 'admin' && isStaffViewer && (
        <div className="space-y-6" data-testid="admissions-admin-dashboard">
          {/* Applications Master-Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left List */}
            <div className="lg:col-span-5 institutional-card rounded-2xl p-4 sm:p-5 bg-white border border-[#E3DAC9] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#1D1B18] flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#0F5132]" />
                  <span>
                    {lang === 'bn'
                      ? `ভর্তি আবেদনসমূহ (${formatNumber(filteredAdminApplications.length, lang)})`
                      : `Admission Applications (${filteredAdminApplications.length})`}
                  </span>
                </h3>
                {isApprover && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsMuhtamimDirectEntry(true);
                      setDirectAdmissionNo(`UQCM-2026-${students.length + 101}`);
                      setSubmittedConfirmation(null);
                      setActiveTab('apply');
                    }}
                    data-testid="admin-btn-direct-entry"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {lang === 'bn'
                      ? '+ মুহতামিম সরাসরি এন্ট্রি'
                      : '+ Muhtamim Direct Entry'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as AdmissionStatus | 'all')
                  }
                  className="rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-2.5 py-2 text-xs font-semibold text-[#1D1B18]"
                >
                  <option value="all">
                    {lang === 'bn' ? 'সকল অবস্থা (All)' : 'All Statuses'}
                  </option>
                  <option value="pending">
                    {lang === 'bn' ? 'বিবেচনাধীন (Pending)' : 'Pending'}
                  </option>
                  <option value="under_review">
                    {lang === 'bn' ? 'যাচাই চলছে' : 'Under Review'}
                  </option>
                  <option value="needs_correction">
                    {lang === 'bn' ? 'সংশোধন প্রয়োজন' : 'Needs Correction'}
                  </option>
                  <option value="approved">
                    {lang === 'bn' ? 'অনুমোদিত (Approved)' : 'Approved'}
                  </option>
                  <option value="rejected">
                    {lang === 'bn' ? 'বাতিল (Rejected)' : 'Rejected'}
                  </option>
                </select>

                <select
                  value={deptFilter}
                  onChange={(e) =>
                    setDeptFilter(e.target.value as DepartmentCode | 'all')
                  }
                  className="rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-2.5 py-2 text-xs font-semibold text-[#1D1B18]"
                >
                  <option value="all">
                    {lang === 'bn' ? 'সকল বিভাগ' : 'All Departments'}
                  </option>
                  <option value="hifz">হিফযুল কুরআন</option>
                  <option value="qawmi">কওমি কিতাব</option>
                  <option value="general">জেনারেল ক্যাডেট</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) =>
                    setSourceFilter(e.target.value as AdmissionEntrySource | 'all')
                  }
                  data-testid="admin-filter-source"
                  className="rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] px-2.5 py-2 text-xs font-semibold text-[#1D1B18]"
                >
                  <option value="all">
                    {lang === 'bn' ? 'সকল মাধ্যম (All Sources)' : 'All Sources'}
                  </option>
                  <option value="online_public">
                    {lang === 'bn' ? 'অনলাইন আবেদন' : 'Online Public'}
                  </option>
                  <option value="muhtamim_direct">
                    {lang === 'bn' ? 'মুহতামিম সরাসরি এন্ট্রি' : 'Muhtamim Direct'}
                  </option>
                </select>
              </div>

              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {filteredAdminApplications.map((app) => {
                  const isSelected = selectedApplication?.id === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        setSelectedAppId(app.id);
                        setAdminActionFeedback(null);
                      }}
                      data-testid={`admin-app-row-${app.referenceNo}`}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F5132]/6 border-[#0F5132] shadow-xs'
                          : 'bg-[#FBF9F4] border-[#E3DAC9] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <StudentPhotoAvatar
                        photoUrl={app.photoUrl}
                        nameBn={app.nameBn}
                        nameEn={app.nameEn}
                        department={app.department}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#0F5132]">
                            {app.referenceNo}
                          </span>
                          {statusBadge(app.status)}
                        </div>
                        <p className="text-sm font-bold text-[#1D1B18] truncate mt-1">
                          {app.nameBn}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-1 mt-0.5">
                          <p className="text-xs text-[#6E675C] truncate">
                            {app.requestedClass} · {app.guardianPhone}
                          </p>
                          {sourceBadge(app.entrySource)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Detail & Approval Drawer */}
            <div className="lg:col-span-7 institutional-card rounded-2xl p-5 sm:p-6 bg-white border border-[#E3DAC9]">
              {!selectedApplication ? (
                <div className="py-12 text-center text-sm text-[#6E675C]">
                  {lang === 'bn'
                    ? 'বাম পাশের তালিকা থেকে একটি আবেদন নির্বাচন করুন'
                    : 'Select an application from the list to inspect and review'}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DAC9]">
                    <div className="flex items-center gap-4">
                      <StudentPhotoAvatar
                        photoUrl={selectedApplication.photoUrl}
                        nameBn={selectedApplication.nameBn}
                        nameEn={selectedApplication.nameEn}
                        department={selectedApplication.department}
                        size="xl"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#0F5132]">
                            {selectedApplication.referenceNo}
                          </span>
                          {statusBadge(selectedApplication.status)}
                          {sourceBadge(selectedApplication.entrySource)}
                        </div>
                        <h3 className="text-lg font-bold text-[#1D1B18] mt-1">
                          {selectedApplication.nameBn} (
                          {selectedApplication.nameEn})
                        </h3>
                        <p className="text-xs text-[#6E675C]">
                          জন্ম তারিখ: {selectedApplication.dateOfBirth} · রক্তের
                          গ্রুপ: {selectedApplication.bloodGroup || 'N/A'} · জন্ম
                          নিবন্ধন: {selectedApplication.birthRegNo || 'প্রদান করা হয়নি'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Applicant Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E3DAC9]">
                      <p className="font-bold text-[#0F5132] mb-1">
                        {lang === 'bn'
                          ? 'মাতা-পিতা ও অভিভাবকের বিবরণ'
                          : 'Parent & Guardian Info'}
                      </p>
                      <p className="text-[#1D1B18]">
                        পিতা: <strong>{selectedApplication.fatherName}</strong> (
                        {selectedApplication.fatherPhone || 'N/A'})
                      </p>
                      <p className="text-[#1D1B18] mt-0.5">
                        মাতা: {selectedApplication.motherName || 'N/A'}
                      </p>
                      <p className="text-[#1D1B18] mt-0.5">
                        প্রধান অভিভাবক:{' '}
                        <strong>{selectedApplication.guardianName}</strong> (
                        {selectedApplication.guardianRelation}) ·{' '}
                        {selectedApplication.guardianPhone}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E3DAC9]">
                      <p className="font-bold text-[#0F5132] mb-1">
                        {lang === 'bn'
                          ? 'একাডেমিক ও কাগজপত্র যাচাই'
                          : 'Academic & Documents'}
                      </p>
                      <p className="text-[#1D1B18]">
                        কাঙ্ক্ষিত জামাত:{' '}
                        <strong>{selectedApplication.requestedClass}</strong>
                      </p>
                      <p className="text-[#1D1B18] mt-0.5">
                        পূর্ববর্তী প্রতিষ্ঠান:{' '}
                        {selectedApplication.previousInstitution || 'প্রযোজ্য নয়'}
                      </p>
                      <p className="text-[#1D1B18] mt-0.5">
                        সংযুক্ত সনদ:{' '}
                        <span className="font-semibold text-[#0F5132]">
                          {selectedApplication.documentSummaryUrl ||
                            selectedApplication.documentName ||
                            'সাক্ষাৎকারে প্রদর্শনযোগ্য'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Provisioned Student & Guardian Single-Use Activation Codes Card */}
                  {selectedApplication.status === 'approved' &&
                    (selectedApplication.studentInvitationCode ||
                      selectedApplication.guardianInvitationCode) && (
                      <div
                        className="rounded-xl bg-[#F0FDF4] border border-[#166534]/35 p-4 space-y-2.5"
                        data-testid="admin-provisioned-invitations-card"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#166534]">
                            {lang === 'bn'
                              ? 'অ্যাকাউন্ট প্রোভিশনিং ও পৃথক এককালীন অ্যাক্টিভেশন কোড (পাসওয়ার্ড ছাড়াই নিরাপদ সেটআপ)'
                              : 'Provisioned Single-Use Account Activation Codes'}
                          </p>
                          <span className="text-[11px] font-mono font-bold text-[#0F5132]">
                            ID: {selectedApplication.assignedAdmissionNo}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {selectedApplication.studentInvitationCode && (
                            <div className="p-2.5 rounded-lg bg-white border border-[#166534]/25 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] text-[#6E675C]">
                                  {lang === 'bn'
                                    ? 'শিক্ষার্থীর এককালীন কোড (Student)'
                                    : 'Student Activation Code'}
                                </p>
                                <p
                                  className="font-mono font-extrabold text-[#0F5132]"
                                  data-testid="admin-provisioned-stu-code"
                                >
                                  {selectedApplication.studentInvitationCode}
                                </p>
                              </div>
                              {onReturnToLogin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReturnToLogin(
                                      selectedApplication.studentInvitationCode
                                    )
                                  }
                                  data-testid="admin-open-stu-activation-btn"
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] cursor-pointer"
                                >
                                  {lang === 'bn'
                                    ? 'শিক্ষার্থী অ্যাক্টিভেশন'
                                    : 'Activate Student'}
                                </button>
                              )}
                            </div>
                          )}
                          {selectedApplication.guardianInvitationCode && (
                            <div className="p-2.5 rounded-lg bg-white border border-[#B8860B]/35 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] text-[#6E675C]">
                                  {lang === 'bn'
                                    ? 'অভিভাবকের পৃথক কোড (Guardian)'
                                    : 'Guardian Activation Code'}
                                </p>
                                <p
                                  className="font-mono font-extrabold text-[#8A6306]"
                                  data-testid="admin-provisioned-grd-code"
                                >
                                  {selectedApplication.guardianInvitationCode}
                                </p>
                              </div>
                              {onReturnToLogin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReturnToLogin(
                                      selectedApplication.guardianInvitationCode
                                    )
                                  }
                                  data-testid="admin-open-grd-activation-btn"
                                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#B8860B] text-white hover:bg-[#8A6306] cursor-pointer"
                                >
                                  {lang === 'bn'
                                    ? 'অভিভাবক অ্যাক্টিভেশন'
                                    : 'Activate Guardian'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Muhtamim Assignment & Decision Controls */}
                  {isApprover ? (
                    <div className="rounded-2xl bg-[#FBF9F4] border border-[#E3DAC9] p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#0F5132] flex items-center gap-1.5">
                          <BadgeCheck className="w-4 h-4" />
                          {lang === 'bn'
                            ? 'চূড়ান্ত ভর্তি বরাদ্দ ও মুহতামিম সিদ্ধান্ত (Canonical Student Provisioning)'
                            : 'Final Assignment & Muhtamim Approval'}
                        </p>
                        {selectedApplication.assignedStudentId && (
                          <span className="text-[11px] font-bold text-[#166534]">
                            সংযুক্ত স্টুডেন্ট রেকর্ড:{' '}
                            {selectedApplication.assignedAdmissionNo}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                            {lang === 'bn'
                              ? 'অফিশিয়াল ভর্তি আইডি (Student ID) *'
                              : 'Assigned Student ID *'}
                          </label>
                          <input
                            type="text"
                            value={assignAdmissionNo}
                            onChange={(e) => setAssignAdmissionNo(e.target.value)}
                            data-testid="admin-input-admissionNo"
                            className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-2 text-xs font-mono font-bold text-[#1D1B18]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                            {lang === 'bn'
                              ? 'চূড়ান্ত শ্রেণি / জামাত *'
                              : 'Assigned Class *'}
                          </label>
                          <input
                            type="text"
                            value={assignClass}
                            onChange={(e) => setAssignClass(e.target.value)}
                            className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-2 text-xs text-[#1D1B18]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                            {lang === 'bn' ? 'রোল নম্বর' : 'Roll No'}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={assignRollNo}
                            onChange={(e) =>
                              setAssignRollNo(Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-2 text-xs text-[#1D1B18]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                            {lang === 'bn'
                              ? 'ছাত্রাবাস ভবন ও কক্ষ বরাদ্দ'
                              : 'Dormitory Room Assignment'}
                          </label>
                          <input
                            type="text"
                            value={assignDormRoom}
                            onChange={(e) => setAssignDormRoom(e.target.value)}
                            className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-2 text-xs text-[#1D1B18]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                            {lang === 'bn'
                              ? 'মাসিক নির্ধারিত ফি (৳)'
                              : 'Monthly Fee (BDT)'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={assignMonthlyFee}
                            onChange={(e) =>
                              setAssignMonthlyFee(Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-2 text-xs text-[#1D1B18]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#1D1B18] mb-1">
                          {lang === 'bn'
                            ? 'মুহতামিমের মন্তব্য / সংশোধনের নির্দেশনা'
                            : 'Muhtamim Remarks / Correction Instructions'}
                        </label>
                        <textarea
                          rows={2}
                          value={adminRemarksInput}
                          onChange={(e) => setAdminRemarksInput(e.target.value)}
                          placeholder="অনুমোদন নোট অথবা সংশোধনের সুনির্দিষ্ট নির্দেশনা লিখুন..."
                          data-testid="admin-input-remarks"
                          className="w-full rounded-lg border border-[#E3DAC9] bg-white px-3 py-2 text-xs text-[#1D1B18]"
                        />
                      </div>

                      {adminActionFeedback && (
                        <div
                          className={`rounded-xl px-3.5 py-2.5 text-xs font-bold ${
                            adminActionFeedback.type === 'success'
                              ? 'bg-[#F0FDF4] text-[#166534] border border-[#166534]/30'
                              : 'bg-[#FEF2F2] text-[#991B1B] border border-[#991B1B]/30'
                          }`}
                          data-testid="admin-action-feedback"
                        >
                          {adminActionFeedback.text}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={isProcessingDecision}
                          onClick={handleAdminApproveAndProvision}
                          data-testid="admin-btn-approve"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="w-4 h-4" />
                          {lang === 'bn'
                            ? 'ভর্তি অনুমোদন ও স্টুডেন্ট প্রোফাইল সক্রিয় করুন'
                            : 'Approve & Provision Student'}
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingDecision}
                          onClick={() =>
                            handleAdminStatusDecision('needs_correction')
                          }
                          data-testid="admin-btn-request-correction"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#B45309]/15 text-[#B45309] border border-[#B45309]/30 hover:bg-[#B45309]/25 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {lang === 'bn'
                            ? 'সংশোধন চেয়ে পাঠান'
                            : 'Request Correction'}
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingDecision}
                          onClick={() => handleAdminStatusDecision('under_review')}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-[#E3DAC9] bg-white text-[#1D1B18] hover:bg-[#F3EFE6] cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {lang === 'bn' ? 'যাচাই চলছে' : 'Mark Under Review'}
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingDecision}
                          onClick={() => handleAdminStatusDecision('rejected')}
                          data-testid="admin-btn-reject"
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#991B1B]/10 text-[#991B1B] border border-[#991B1B]/25 hover:bg-[#991B1B]/20 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {lang === 'bn' ? 'বাতিল করুন' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#FBF9F4] border border-[#E3DAC9] p-3.5 text-xs text-[#6E675C]">
                      {lang === 'bn'
                        ? 'শুধুমাত্র মুহতামিম ও সুপার অ্যাডমিন ভর্তি আবেদন চূড়ান্ত অনুমোদন বা বাতিল করতে পারেন।'
                        : 'Only Muhtamim and Super Admin can approve or reject admission applications.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guardian Link Verification Queue */}
          <div className="institutional-card rounded-2xl p-5 sm:p-6 bg-white border border-[#E3DAC9] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#1D1B18] flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#0F5132]" />
                  <span>
                    {lang === 'bn'
                      ? 'অভিভাবক-সন্তান অ্যাকাউন্ট সংযুক্তি যাচাই (Guardian Relationship Verification)'
                      : 'Guardian-Child Relationship Verification Queue'}
                  </span>
                </h3>
                <p className="text-xs text-[#6E675C]">
                  {lang === 'bn'
                    ? 'অভিভাবক কর্তৃক দাখিলকৃত স্টুডেন্ট আইডি ও সম্পর্ক যাচাই করে অনুমোদন দিলে অভিভাবক পোর্টালে সংশ্লিষ্ট শিক্ষার্থীর তথ্য উন্মুক্ত হবে।'
                    : 'Verify guardian link requests before granting guardian portal access to a student profile.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guardianLinkRequests.map((req) => {
                const matchedStu =
                  students.find((s) => s.id === req.matchedStudentId) ||
                  students.find(
                    (s) =>
                      s.admissionNo.toLowerCase() ===
                      req.requestedAdmissionNo.trim().toLowerCase()
                  );

                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] p-4 space-y-3"
                    data-testid={`guardian-link-req-${req.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#0F5132]">
                          অভিভাবক: {req.guardianName} ({req.guardianPhone})
                        </span>
                        <p className="text-sm font-bold text-[#1D1B18] mt-0.5">
                          কাঙ্ক্ষিত শিক্ষার্থী: {req.requestedStudentNameBn} (
                          <span className="font-mono">
                            {req.requestedAdmissionNo}
                          </span>
                          )
                        </p>
                        <p className="text-xs text-[#6E675C]">
                          সম্পর্ক: {req.relationship} · তারিখ: {req.requestedDate}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-[#166534]/12 text-[#166534]'
                            : req.status === 'rejected'
                            ? 'bg-[#991B1B]/12 text-[#991B1B]'
                            : 'bg-[#B8860B]/15 text-[#8A6306]'
                        }`}
                      >
                        {req.status === 'approved'
                          ? lang === 'bn'
                            ? 'অনুমোদিত'
                            : 'Approved'
                          : req.status === 'rejected'
                          ? lang === 'bn'
                            ? 'প্রত্যাখ্যাত'
                            : 'Rejected'
                          : lang === 'bn'
                          ? 'যাচাইয়ের অপেক্ষায়'
                          : 'Pending'}
                      </span>
                    </div>

                    {matchedStu ? (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E3DAC9] text-xs">
                        <StudentPhotoAvatar
                          photoUrl={matchedStu.photoUrl}
                          nameBn={matchedStu.nameBn}
                          nameEn={matchedStu.nameEn}
                          department={matchedStu.department}
                          size="sm"
                        />
                        <div>
                          <p className="font-bold text-[#166534]">
                            রেকর্ড মিল পাওয়া গেছে: {matchedStu.nameBn} (
                            {matchedStu.admissionNo})
                          </p>
                          <p className="text-[#6E675C]">
                            জামাত: {matchedStu.className} · নিবন্ধিত মোবাইল:{' '}
                            {matchedStu.guardianPhone}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#991B1B]/25 text-xs text-[#991B1B]">
                        এই ভর্তি নম্বরের সাথে কোনো সক্রিয় শিক্ষার্থী রেকর্ড পাওয়া যায়নি।
                      </div>
                    )}

                    {isApprover && req.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={!matchedStu}
                          onClick={() =>
                            matchedStu &&
                            onReviewGuardianLinkRequest(
                              req,
                              'approved',
                              matchedStu.id,
                              'মুহতামিম কর্তৃক অভিভাবক সম্পর্ক যাচাই ও অনুমোদিত।'
                            )
                          }
                          data-testid={`approve-guardian-link-${req.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] disabled:opacity-40 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lang === 'bn'
                            ? 'অনুমোদন ও সংযুক্ত করুন'
                            : 'Approve & Link Child'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onReviewGuardianLinkRequest(
                              req,
                              'rejected',
                              '',
                              'তথ্য গরমিল থাকায় সংযুক্তি আবেদন নামঞ্জুর করা হলো।'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#991B1B]/30 text-[#991B1B] bg-white hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {lang === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
