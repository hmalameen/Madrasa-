import React, { useEffect, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Download,
  GraduationCap,
  Home,
  Link2,
  Lock,
  MessageSquare,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  AttendanceRecord,
  AttendanceStatus,
  ExamResult,
  FeeInvoice,
  GuardianInquiry,
  GuardianLinkRequest,
  HifzProgressLog,
  Language,
  Notice,
  ResidentialLeave,
  Student,
  StudyDiaryEntry,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import { StudentPhotoAvatar } from '../StudentPhotoUploader';
import {
  canAccountAccessPortal,
  computeAttendanceMetrics,
  computeClassTabulationSheet,
  computeExamAnalytics,
  DEFAULT_MADRASA_GRADING_POLICY,
  filterAuthorizedPublishedExamsForPortal,
  filterGuardianStudents,
  filterVisibleStudyDiaryEntries,
  formatBdt,
  formatNum,
  generateCsvContent,
} from '../../utils/madrasaLogic';
import { INITIAL_EXAM_SETUPS, INITIAL_SETTINGS } from '../../data/initialSeedData';
import { OfficialIndividualMarksheet } from '../OfficialExamDocuments';

type GuardianPortalTab =
  | 'overview'
  | 'academic_reports'
  | 'attendance_leave'
  | 'communication'
  | 'finance';

const ATTENDANCE_STATUS_LABEL_BN: Record<AttendanceStatus, string> = {
  present: 'উপস্থিত (Present)',
  absent: 'অনুপস্থিত (Absent)',
  late: 'বিলম্ব (Late)',
  leave: 'অনুমোদিত ছুটি (Leave)',
};

interface GuardianPortalModuleProps {
  language: Language;
  role: UserRole;
  isSandboxMode: boolean;
  guardianUid: string;
  linkedStudentIdsCsv: string;
  accountStatus: 'active' | 'pending' | 'suspended';
  students: Student[];
  attendance: AttendanceRecord[];
  exams: ExamResult[];
  invoices: FeeInvoice[];
  hifzLogs: HifzProgressLog[];
  leaves: ResidentialLeave[];
  notices: Notice[];
  studyDiary: StudyDiaryEntry[];
  guardianInquiries: GuardianInquiry[];
  guardianLinkRequests?: GuardianLinkRequest[];
  onRequestLeave: (
    leave: Omit<ResidentialLeave, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ) => Promise<boolean>;
  onAddGuardianInquiry: (
    inquiry: Omit<GuardianInquiry, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ) => Promise<boolean>;
  onReplyGuardianInquiry: (inquiryId: string, replyText: string) => Promise<boolean>;
  onSubmitGuardianLinkRequest?: (payload: {
    requestedAdmissionNo: string;
    requestedStudentNameBn: string;
    relationship: string;
  }) => Promise<boolean>;
}

export function GuardianPortalModule({
  language,
  role,
  isSandboxMode,
  guardianUid,
  linkedStudentIdsCsv,
  accountStatus,
  students,
  attendance,
  exams,
  invoices,
  hifzLogs,
  leaves,
  notices,
  studyDiary,
  guardianInquiries,
  guardianLinkRequests = [],
  onRequestLeave,
  onAddGuardianInquiry,
  onReplyGuardianInquiry,
  onSubmitGuardianLinkRequest,
}: GuardianPortalModuleProps) {
  const t = TRANSLATIONS[language];
  const isStaffOrAdmin = ['super_admin', 'muhtamim', 'teacher'].includes(role);

  const [activeTab, setActiveTab] = useState<GuardianPortalTab>('overview');
  const [simulatedStatus, setSimulatedStatus] = useState<'active' | 'pending' | 'suspended'>(
    accountStatus
  );

  useEffect(() => {
    setSimulatedStatus(accountStatus);
  }, [accountStatus]);

  const effectiveStatus = isSandboxMode || isStaffOrAdmin ? simulatedStatus : accountStatus;
  const accessCheck = canAccountAccessPortal(effectiveStatus);

  // Strictly isolate children authorized for this guardian account
  const authorizedChildren = filterGuardianStudents(
    students,
    guardianUid,
    linkedStudentIdsCsv,
    effectiveStatus
  );

  const [selectedChildId, setSelectedChildId] = useState(
    authorizedChildren[0]?.id || ''
  );

  // Leave Application Form State
  const [leaveReason, setLeaveReason] = useState('');
  const [departureDate, setDepartureDate] = useState('2026-10-25');
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-10-27');
  const [leaveSubmittedMsg, setLeaveSubmittedMsg] = useState<string | null>(null);

  // Guardian-to-Madrasa Inquiry Form State
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySavedMsg, setInquirySavedMsg] = useState<string | null>(null);

  // Staff Reply State
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Child Link Request State
  const [showLinkChildModal, setShowLinkChildModal] = useState(false);
  const [linkAdmissionNo, setLinkAdmissionNo] = useState('');
  const [linkStudentName, setLinkStudentName] = useState('');
  const [linkRelation, setLinkRelation] = useState('পিতা (Father)');
  const [linkRequestFeedback, setLinkRequestFeedback] = useState<string | null>(null);

  const myLinkRequests = guardianLinkRequests.filter(
    (r) => r.guardianUid === guardianUid || isStaffOrAdmin
  );

  const handleLinkChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitGuardianLinkRequest || !linkAdmissionNo.trim() || !linkStudentName.trim()) {
      return;
    }
    const ok = await onSubmitGuardianLinkRequest({
      requestedAdmissionNo: linkAdmissionNo.trim(),
      requestedStudentNameBn: linkStudentName.trim(),
      relationship: linkRelation,
    });
    if (ok) {
      setLinkAdmissionNo('');
      setLinkStudentName('');
      setLinkRequestFeedback(
        'আপনার সন্তান সংযুক্তির আবেদনটি মুহতামিম দপ্তরে যাচাইয়ের জন্য প্রেরিত হয়েছে। অনুমোদনের পর পোর্টালে প্রোফাইল যুক্ত হবে।'
      );
    }
  };

  useEffect(() => {
    if (
      authorizedChildren.length > 0 &&
      !authorizedChildren.some((c) => c.id === selectedChildId)
    ) {
      setSelectedChildId(authorizedChildren[0].id);
    }
  }, [authorizedChildren, selectedChildId]);

  if (!accessCheck.allowed) {
    return (
      <div className="space-y-4">
        {(isSandboxMode || isStaffOrAdmin) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-amber-900">
              নিরাপত্তা যাচাই মোড: অভিভাবক অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন করে পোর্টাল লক পরীক্ষা করুন
            </span>
            <select
              aria-label="Simulate guardian account status"
              value={simulatedStatus}
              onChange={(e) =>
                setSimulatedStatus(e.target.value as 'active' | 'pending' | 'suspended')
              }
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="active">Active (অনুমোদিত)</option>
              <option value="pending">Pending (অপেক্ষমাণ - ব্লকড)</option>
              <option value="suspended">Suspended (স্থগিত - ব্লকড)</option>
            </select>
          </div>
        )}
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-xl mx-auto">
          <Lock className="w-10 h-10 text-red-700 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">
            {effectiveStatus === 'pending'
              ? 'আপনার অভিভাবক পোর্টাল অ্যাকাউন্ট অনুমোদনের অপেক্ষায় রয়েছে'
              : 'আপনার অভিভাবক অ্যাকাউন্টের অ্যাক্সেস সাময়িকভাবে স্থগিত করা হয়েছে'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            {accessCheck.reasonBn}
          </p>
        </div>
      </div>
    );
  }

  const activeChild =
    authorizedChildren.find((c) => c.id === selectedChildId) || authorizedChildren[0];

  if (!activeChild) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center max-w-xl mx-auto">
        <GraduationCap className="w-8 h-8 text-[#0B3B2E] mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">
          কোনো অনুমোদিত শিক্ষার্থীর প্রোফাইল সংযুক্ত নেই
        </h2>
        <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          নিরাপত্তা নীতিমালা অনুযায়ী অভিভাবক শুধুমাত্র তাঁর অ্যাকাউন্টের সাথে সংযুক্ত সন্তানের তথ্য দেখতে পারেন। অনুগ্রহ করে মাদ্রাসা দপ্তরে যোগাযোগ করে আপনার সন্তানের দাখেলা নম্বর সংযুক্ত করুন।
        </p>
      </div>
    );
  }

  // Strictly scoped child data
  const childAttendance = attendance
    .filter((a) => a.studentId === activeChild.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const attendanceMetrics = computeAttendanceMetrics(childAttendance);

  const childExams = filterAuthorizedPublishedExamsForPortal(exams, {
    role: 'guardian',
    studentId: activeChild.id,
    linkedStudentIdsCsv: activeChild.id,
  });
  const examAnalytics = computeExamAnalytics(childExams, activeChild.id);

  const matchedChildExamSetup =
    INITIAL_EXAM_SETUPS.find(
      (cfg) => cfg.className.trim() === activeChild.className.trim()
    ) || {
      id: 'grd-portal-cfg',
      academicYear: '2026-2027',
      examName:
        childExams[0]?.examName || 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬ (2nd Term)',
      department: activeChild.department,
      className: activeChild.className,
      sectionName: 'ক-শাখা (Main)',
      examDate: '2026-09-15',
      publicationDate: '2026-10-05',
      instructions: '',
      subjects: childExams.map((e, idx) => ({
        subjectCode: e.subjectCode || `SUB-${idx + 1}`,
        subjectName: e.subjectName,
        maxMarks: e.fullMarks,
        passMarks: e.passMarks ?? 33,
      })),
      gradingPolicy: DEFAULT_MADRASA_GRADING_POLICY,
      workflowStatus: 'published' as const,
      authorId: 'system',
    };

  const publishedChildTabulationRows = computeClassTabulationSheet(
    students,
    childExams,
    matchedChildExamSetup,
    { publishedOnly: true }
  );
  const officialChildMarksheetRow =
    publishedChildTabulationRows.find((r) => r.student.id === activeChild.id) ||
    null;

  const childInvoices = invoices.filter((i) => i.studentId === activeChild.id);
  const childHifz = hifzLogs
    .filter((h) => h.studentId === activeChild.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const childLeaves = leaves
    .filter((l) => l.studentId === activeChild.id)
    .sort((a, b) => b.departureDate.localeCompare(a.departureDate));

  // Strictly filter out internal teacher notes (visibleToGuardian === false) for guardian view
  const childDiary = filterVisibleStudyDiaryEntries(
    studyDiary,
    activeChild,
    'guardian'
  );

  const childInquiries = guardianInquiries.filter(
    (inq) => inq.studentId === activeChild.id
  );

  const guardianNotices = notices.filter((n) =>
    ['all', 'guardians', 'residential'].includes(n.targetAudience)
  );

  const totalFeeDueBdt = childInvoices.reduce(
    (acc, inv) => acc + Math.max(0, inv.amountDueBdt - inv.amountPaidBdt),
    0
  );
  const totalFeePaidBdt = childInvoices.reduce(
    (acc, inv) => acc + inv.amountPaidBdt,
    0
  );

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    setLeaveSubmittedMsg(null);
    const saved = await onRequestLeave({
      studentId: activeChild.id,
      studentNameBn: activeChild.nameBn,
      admissionNo: activeChild.admissionNo,
      dormitoryRoom: activeChild.dormitoryRoom,
      reason: leaveReason.trim(),
      departureDate,
      expectedReturnDate,
      actualReturnDate: '',
      accompaniedBy: activeChild.guardianName,
      status: 'pending',
      guardianUid: activeChild.guardianUid || guardianUid,
    });
    if (saved) {
      setLeaveReason('');
      setLeaveSubmittedMsg(
        'আপনার ছুটির আবেদনটি আবাসিক তত্ত্বাবধায়কের অনুমোদনের জন্য প্রেরণ করা হয়েছে।'
      );
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirySubject.trim() || !inquiryMessage.trim()) return;
    setInquirySavedMsg(null);
    const saved = await onAddGuardianInquiry({
      studentId: activeChild.id,
      studentNameBn: activeChild.nameBn,
      admissionNo: activeChild.admissionNo,
      guardianName: activeChild.guardianName,
      guardianUid: activeChild.guardianUid || guardianUid,
      subject: inquirySubject.trim(),
      message: inquiryMessage.trim(),
      teacherReply: '',
      status: 'open',
    });
    if (saved) {
      setInquirySubject('');
      setInquiryMessage('');
      setInquirySavedMsg(
        'আপনার বার্তাটি মাদ্রাসা দপ্তর ও সংশ্লিষ্ট উস্তাযের নিকট সফলভাবে প্রেরিত হয়েছে।'
      );
    }
  };

  const handleDownloadChildMarksheetCsv = () => {
    const headers = [
      'Admission No',
      'Student Name',
      'Exam Name',
      'Subject',
      'Marks Obtained',
      'Full Marks',
      'Grade',
    ];
    const rows = examAnalytics.publishedExams.map((e) => [
      activeChild.admissionNo,
      activeChild.nameBn,
      e.examName,
      e.subjectName,
      e.marksObtained,
      e.fullMarks,
      e.grade,
    ]);
    const csv = generateCsvContent(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardian-report-${activeChild.admissionNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Guardian Security Banner & Multi-Child Switcher */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>অনুমোদিত অভিভাবক পোর্টাল (Least-Privilege Guardian Access)</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{t.navModules.guardian}</h1>
          <p className="mt-0.5 text-xs text-slate-600">
            অভিভাবক: <strong>{activeChild.guardianName}</strong> ({formatNum(activeChild.guardianPhone, language)}) ·
            অনুমোদিত সংযুক্ত সন্তান: <strong>{formatNum(authorizedChildren.length, language)} জন</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Linked Child Selector */}
          <div
            role="group"
            aria-label="Linked children selector"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200"
          >
            {authorizedChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeChild.id === child.id
                    ? 'bg-[#0B3B2E] text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {child.nameBn} ({child.admissionNo})
              </button>
            ))}
          </div>

          {onSubmitGuardianLinkRequest && (
            <button
              type="button"
              onClick={() => {
                setShowLinkChildModal((prev) => !prev);
                setLinkRequestFeedback(null);
              }}
              data-testid="guardian-open-link-child-btn"
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#0B3B2E]/30 bg-emerald-50/70 text-[#0B3B2E] hover:bg-emerald-100 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>নতুন সন্তান সংযুক্তির আবেদন</span>
            </button>
          )}

          {(isSandboxMode || isStaffOrAdmin) && (
            <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-[11px] font-semibold text-slate-600">অ্যাকাউন্ট স্ট্যাটাস:</span>
              <select
                aria-label="Guardian account status verification"
                value={simulatedStatus}
                onChange={(e) =>
                  setSimulatedStatus(e.target.value as 'active' | 'pending' | 'suspended')
                }
                className="px-2 py-0.5 text-xs bg-white border border-stone-300 rounded-md font-semibold text-emerald-900"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Guardian-Child Link Request Drawer */}
      {showLinkChildModal && onSubmitGuardianLinkRequest && (
        <div
          className="bg-[#FAF8F5] border border-stone-300 rounded-xl p-5 space-y-4"
          data-testid="guardian-link-child-drawer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#0B3B2E]" />
                <span>সন্তান সংযুক্তির আবেদন (Verified Child Linking Request)</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                নিরাপত্তা নীতিমালা অনুযায়ী শুধুমাত্র দাখেলা নম্বর লিখেই স্বয়ংক্রিয় অ্যাক্সেস পাওয়া যায় না। মুহতামিম দপ্তর আপনার মোবাইল নম্বর ও সম্পর্ক যাচাই করে অনুমোদন দিলে সন্তানের তথ্য উন্মুক্ত হবে।
              </p>
            </div>
          </div>

          <form onSubmit={handleLinkChildSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সন্তানের দাখেলা নম্বর (Student ID) *
              </label>
              <input
                type="text"
                value={linkAdmissionNo}
                onChange={(e) => setLinkAdmissionNo(e.target.value)}
                placeholder="যেমন: UQCM-2026-104"
                data-testid="guardian-link-input-admissionNo"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সন্তানের নাম (বাংলায়) *
              </label>
              <input
                type="text"
                value={linkStudentName}
                onChange={(e) => setLinkStudentName(e.target.value)}
                placeholder="যেমন: মুহাম্মাদ হুজাইফা রহমান"
                data-testid="guardian-link-input-studentName"
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সম্পর্ক (Relationship) *
              </label>
              <select
                value={linkRelation}
                onChange={(e) => setLinkRelation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
              >
                <option value="পিতা (Father)">পিতা (Father)</option>
                <option value="মাতা (Mother)">মাতা (Mother)</option>
                <option value="চাচা / স্থানীয় অভিভাবক (Local Guardian)">
                  চাচা / স্থানীয় অভিভাবক (Local Guardian)
                </option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                data-testid="guardian-link-submit-btn"
                className="w-full px-4 py-2 text-xs font-bold bg-[#0B3B2E] text-white rounded-lg hover:bg-emerald-950 cursor-pointer"
              >
                যাচাইয়ের জন্য আবেদন পাঠান
              </button>
            </div>
          </form>

          {linkRequestFeedback && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
              {linkRequestFeedback}
            </div>
          )}

          {myLinkRequests.length > 0 && (
            <div className="pt-2 border-t border-stone-200">
              <p className="text-xs font-bold text-slate-700 mb-2">
                পূর্ববর্তী সংযুক্তি আবেদনের তালিকা:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {myLinkRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-lg bg-white border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {req.requestedStudentNameBn}
                      </span>{' '}
                      <span className="font-mono text-slate-500">
                        ({req.requestedAdmissionNo})
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved'
                        ? 'অনুমোদিত'
                        : req.status === 'rejected'
                        ? 'নামঞ্জুর'
                        : 'বিবেচনাধীন'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Child Profile Summary Strip */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex items-center gap-3">
          <StudentPhotoAvatar
            photoUrl={activeChild.photoUrl}
            nameBn={activeChild.nameBn}
            nameEn={activeChild.nameEn}
            department={activeChild.department}
            size="lg"
          />
          <div>
            <div className="text-xs text-slate-500">সন্তানের নাম ও দাখেলা</div>
            <div className="mt-1 font-bold text-slate-900">{activeChild.nameBn}</div>
            <div className="text-xs font-mono text-slate-500">{activeChild.admissionNo}</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">বিভাগ ও জামাত</div>
          <div className="mt-1 font-semibold text-[#0B3B2E]">
            {t.departments[activeChild.department]}
          </div>
          <div className="text-xs text-slate-600">
            {activeChild.className} (রোল: {formatNum(activeChild.rollNo, language)})
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">আবাসিক কক্ষ / সিট</div>
          <div className="mt-1 text-xs font-semibold text-slate-900">
            {activeChild.dormitoryRoom}
          </div>
          <div className="text-[11px] text-emerald-800">আবাসিক তত্ত্বাবধানে নিরাপদ</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">উপস্থিতির হার ও গড় ফলাফল</div>
          <div className="mt-1 text-sm font-bold font-mono text-slate-900">
            হাজিরা: {formatNum(attendanceMetrics.attendancePercentage, language)}% · ফলাফল:{' '}
            {formatNum(examAnalytics.averagePercentage, language)}%
          </div>
          <div className="text-xs text-emerald-800 font-semibold">
            {examAnalytics.overallGrade}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">চলমান বকেয়া ফি ব্যালেন্স</div>
          <div
            className={`mt-1 text-base font-bold font-mono ${
              totalFeeDueBdt > 0 ? 'text-amber-800' : 'text-emerald-800'
            }`}
          >
            {formatBdt(totalFeeDueBdt, language)}
          </div>
          <div className="text-[11px] text-slate-500">
            মাসিক নির্ধারিত: {formatBdt(activeChild.monthlyFeeBdt, language)}
          </div>
        </div>
      </div>

      {/* Guardian Portal Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Guardian Portal Sections"
        className="bg-white border border-stone-200 rounded-xl p-1.5 flex flex-wrap gap-1.5 no-print"
      >
        {(
          [
            { id: 'overview', labelBn: '১. সন্তানের সারসংক্ষেপ', icon: Sparkles },
            { id: 'academic_reports', labelBn: '২. একাডেমিক রিপোর্ট ও হিফয', icon: Award },
            { id: 'attendance_leave', labelBn: '৩. হাজিরা, হোস্টেল ও ছুটি', icon: CalendarCheck },
            { id: 'communication', labelBn: '৪. যোগাযোগ, ডায়েরি ও নোটিশ', icon: MessageSquare },
            { id: 'finance', labelBn: '৫. বেতন, রসিদ ও ফিন্যান্স', icon: CreditCard },
          ] as {
            id: GuardianPortalTab;
            labelBn: string;
            icon: React.ComponentType<{ className?: string }>;
          }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#0B3B2E] text-white'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CHILD OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Homework & Daily Diary + Published Exam Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Homework & Teacher Comments for Guardian */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    সাম্প্রতিক ক্লাসের পাঠ, হোমওয়ার্ক ও উস্তাযের মন্তব্য ({childDiary.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('communication')}
                  className="text-xs font-semibold text-[#0B3B2E] hover:underline cursor-pointer"
                >
                  উস্তাযকে বার্তা পাঠান
                </button>
              </div>
              <div className="divide-y divide-stone-200">
                {childDiary.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500">
                    এই সন্তানের জন্য এখনো কোনো পাঠ ডায়েরি এন্ট্রি নেই।
                  </div>
                ) : (
                  childDiary.map((entry) => (
                    <div key={entry.id} className="p-4 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {entry.subjectName}{' '}
                          <span className="font-mono font-normal text-slate-500">
                            ({entry.date})
                          </span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            entry.completionStatus === 'pending'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {entry.completionStatus === 'pending'
                            ? 'হোমওয়ার্ক চলমান'
                            : 'হোমওয়ার্ক সম্পন্ন'}
                        </span>
                      </div>
                      <div className="text-slate-700">
                        <strong>পঠিত পাঠ:</strong> {entry.lessonCovered}
                      </div>
                      <div className="text-slate-700">
                        <strong>নির্ধারিত কাজ (জমা: {entry.dueDate}):</strong>{' '}
                        {entry.homeworkAssigned}
                      </div>
                      <div className="text-emerald-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                        <strong>অভিভাবকের প্রতি উস্তাযের নোট:</strong> “{entry.teacherFeedback}”
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Latest Published Exam Results */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    প্রকাশিত পরীক্ষার ফলাফল ({childExams.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('academic_reports')}
                  className="text-xs font-semibold text-[#0B3B2E] hover:underline cursor-pointer"
                >
                  পূর্ণ মার্কশিট ও বিশ্লেষণ
                </button>
              </div>
              <div className="divide-y divide-stone-200">
                {childExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{ex.subjectName}</div>
                      <div className="text-slate-500">{ex.examName}</div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-bold text-slate-900">
                        {formatNum(ex.marksObtained, language)} / {formatNum(ex.fullMarks, language)}
                      </div>
                      <div className="text-emerald-800 font-semibold">{ex.grade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Recent Attendance, Upcoming Exams & Alerts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Recent Attendance Status */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    সাম্প্রতিক হাজিরা ও উপস্থিতি ({childAttendance.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance_leave')}
                  className="text-xs font-semibold text-[#0B3B2E] hover:underline cursor-pointer"
                >
                  ছুটির আবেদন
                </button>
              </div>
              <div className="divide-y divide-stone-200">
                {childAttendance.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{att.date}</span>
                      <span className="ms-2 text-slate-600">
                        {att.remarks || 'যথাসময়ে উপস্থিত'}
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-800 uppercase">
                      {ATTENDANCE_STATUS_LABEL_BN[att.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Exam & Parent Meeting Alert Card */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Bell className="w-4 h-4 text-[#0B3B2E]" />
                <span>আসন্ন পরীক্ষা ও অভিভাবক মতবিনিময় বিজ্ঞপ্তি</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950">
                  দ্বিতীয় সাময়িক পরীক্ষা শুরু: ১৫ নভেম্বর ২০২৬
                </div>
                <p className="text-emerald-900">
                  পরীক্ষার পূর্বেই বকেয়া বেতন ও খোরাকি পরিশোধ করে প্রবেশপত্র সংগ্রহ করার জন্য অনুরোধ করা হচ্ছে।
                </p>
              </div>
              {guardianNotices.slice(0, 2).map((not) => (
                <div
                  key={not.id}
                  className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1"
                >
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{not.titleBn}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {not.publishDate}
                    </span>
                  </div>
                  <p className="text-slate-600">{not.contentBn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC REPORTS & HIFZ PROGRESS */}
      {activeTab === 'academic_reports' && (
        <div className="space-y-6">
          {officialChildMarksheetRow && childExams.length > 0 && (
            <OfficialIndividualMarksheet
              row={officialChildMarksheetRow}
              settings={INITIAL_SETTINGS}
              policy={matchedChildExamSetup.gradingPolicy}
              lang={language}
            />
          )}

          {/* Printable Report Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <div className="text-xs font-semibold text-emerald-800">
                  অভিভাবক কপি · প্রকাশিত একাডেমিক প্রোগ্রেস রিপোর্ট কার্ড
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {activeChild.nameBn} ({activeChild.admissionNo}) — {activeChild.className}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handleDownloadChildMarksheetCsv}
                  className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>মার্কশিট CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>মার্কশিট প্রিন্ট করুন</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-slate-600">
                    <th className="py-2.5 px-3 text-start font-semibold">পরীক্ষার নাম</th>
                    <th className="py-2.5 px-3 text-start font-semibold">বিষয় / কিতাব</th>
                    <th className="py-2.5 px-3 text-end font-semibold">প্রাপ্ত নম্বর</th>
                    <th className="py-2.5 px-3 text-end font-semibold">পূর্ণমান</th>
                    <th className="py-2.5 px-3 text-end font-semibold">শতকরা হার</th>
                    <th className="py-2.5 px-3 text-end font-semibold">গ্রেড</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {examAnalytics.publishedExams.map((ex) => {
                    const pct = Math.round(
                      (ex.marksObtained / Math.max(1, ex.fullMarks)) * 100
                    );
                    return (
                      <tr key={ex.id}>
                        <td className="py-3 px-3 text-slate-700">{ex.examName}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{ex.subjectName}</td>
                        <td className="py-3 px-3 text-end font-mono font-bold text-slate-900">
                          {ex.marksObtained}
                        </td>
                        <td className="py-3 px-3 text-end font-mono text-slate-500">
                          {ex.fullMarks}
                        </td>
                        <td className="py-3 px-3 text-end font-mono text-slate-700">{pct}%</td>
                        <td className="py-3 px-3 text-end font-mono font-semibold text-emerald-800">
                          {ex.grade}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/60 border-t-2 border-stone-300 font-bold text-slate-900">
                    <td colSpan={2} className="py-3 px-3">
                      সর্বমোট প্রাপ্ত নম্বর ও গড় গ্রেড
                    </td>
                    <td className="py-3 px-3 text-end font-mono">
                      {examAnalytics.totalObtained}
                    </td>
                    <td className="py-3 px-3 text-end font-mono">
                      {examAnalytics.totalFullMarks}
                    </td>
                    <td className="py-3 px-3 text-end font-mono">
                      {examAnalytics.averagePercentage}%
                    </td>
                    <td className="py-3 px-3 text-end font-mono text-emerald-900">
                      {examAnalytics.overallGrade}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Strengths, Areas Requiring Improvement & Teacher Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="text-xs font-bold text-emerald-950">
                  সন্তানের শক্তিশালী দিক (Strengths)
                </div>
                {examAnalytics.strengths.length > 0 ? (
                  <p className="text-xs text-emerald-900">
                    {examAnalytics.strengths.map((s) => s.subjectName).join(', ')} বিষয়ে অত্যন্ত সন্তোষজনক ফলাফল।
                  </p>
                ) : (
                  <p className="text-xs text-emerald-900">নিয়মিত পাঠ অনুশীলন চলমান।</p>
                )}
              </div>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                <div className="text-xs font-bold text-amber-950">
                  অধিক মনোযোগ প্রয়োজন (Needs Improvement)
                </div>
                {examAnalytics.needsImprovement.length > 0 ? (
                  <p className="text-xs text-amber-900">
                    {examAnalytics.needsImprovement.map((s) => s.subjectName).join(', ')} বিষয়ে অতিরিক্ত রিভিশন প্রয়োজন।
                  </p>
                ) : (
                  <p className="text-xs text-amber-900">
                    কোনো বিষয়েই ঝুঁকিপূর্ণ ঘাটতি পরিলক্ষিত হয়নি।
                  </p>
                )}
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  অভিভাবকের প্রতি উস্তাযের পরামর্শ
                </div>
                <p className="text-xs text-slate-600">
                  ছুটিতে বাড়িতে অবস্থানকালে ফজর ও মাগরিবের পর অন্তত ৪৫ মিনিট তিলাওয়াত ও নির্ধারিত কিতাব মুরাজায়াত নিশ্চিত করার অনুরোধ।
                </p>
              </div>
            </div>
          </div>

          {/* Hifz Progress Log for Hifz-enrolled Child */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0B3B2E]" />
              <h2 className="text-sm font-bold text-slate-900">
                হিফযুল কুরআন সবক, সবকি, মনযিল ও তাজবীদ রিপোর্ট ({childHifz.length})
              </h2>
            </div>
            <div className="divide-y divide-stone-200">
              {childHifz.length === 0 ? (
                <div className="p-4 text-xs text-slate-500">
                  এই শিক্ষার্থীর জন্য হিফয ডায়েরি এন্ট্রি প্রযোজ্য নয় বা এখনো যুক্ত হয়নি।
                </div>
              ) : (
                childHifz.map((h) => (
                  <div key={h.id} className="p-4 text-xs space-y-1">
                    <div className="flex justify-between font-mono text-slate-500">
                      <span>তারিখ: {h.date}</span>
                      <span className="font-semibold text-emerald-800">
                        পারা {h.paraNumber}/30 · তাজবীদ: {h.tajweedRating}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">
                      সবক: {h.sabaqSurahAndAyat} ({h.sabaqLines} লাইন)
                    </div>
                    <div className="text-slate-600">
                      সবকি: {h.sabqiPara} · মনযিল: {h.manzilPara}
                    </div>
                    <div className="text-slate-500 italic">“{h.teacherComment}”</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE, HOSTEL GATE PASS & ONLINE LEAVE REQUEST */}
      {activeTab === 'attendance_leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Monthly Attendance Summary & Recorded Absence Reasons */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    দৈনিক ও মাসিক হাজিরা এবং অনুপস্থিতি/বিলম্বের কারণ
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  উপস্থিতি: {attendanceMetrics.attendancePercentage}%
                </span>
              </div>
              <div className="divide-y divide-stone-200">
                {childAttendance.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{att.date}</div>
                      <div className="text-slate-600">
                        রেকর্ডকৃত মন্তব্য: {att.remarks || 'যথাসময়ে জামাতে উপস্থিত'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 font-semibold text-emerald-900">
                      {ATTENDANCE_STATUS_LABEL_BN[att.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hostel Attendance & Gate Pass Log */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
                <Home className="w-4 h-4 text-[#0B3B2E]" />
                <h2 className="text-sm font-bold text-slate-900">
                  দারুল ইকামা (হোস্টেল) অবস্থান ও গেট পাস স্ট্যাটাস ({activeChild.dormitoryRoom})
                </h2>
              </div>
              <div className="divide-y divide-stone-200">
                {childLeaves.length === 0 ? (
                  <div className="p-4 text-xs text-slate-600">
                    শিক্ষার্থী বর্তমানে আবাসিক কক্ষে ({activeChild.dormitoryRoom}) অবস্থান করছে। কোনো চলমান গেট পাস নেই।
                  </div>
                ) : (
                  childLeaves.map((lv) => (
                    <div key={lv.id} className="p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">কারণ: {lv.reason}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold uppercase">
                          গেট পাস: {lv.status}
                        </span>
                      </div>
                      <div className="font-mono text-slate-500">
                        প্রস্থান: {lv.departureDate} · ফেরার তারিখ: {lv.expectedReturnDate}
                      </div>
                      <div className="text-slate-600">
                        অভিভাবক এস্কর্ট: {lv.accompaniedBy} · কক্ষ: {lv.dormitoryRoom}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Online Leave Application Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-900">
                সন্তানের ছুটির জন্য অনলাইন আবেদন (Leave Request)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                আবাসিক তত্ত্বাবধায়ক (নেগরান) অনুমোদন করলে ডিজিটাল গেট পাস ইস্যু হবে।
              </p>

              {leaveSubmittedMsg && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  {leaveSubmittedMsg}
                </div>
              )}

              <form onSubmit={handleLeaveRequest} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="gd-leave-reason"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ছুটির কারণ উল্লেখ করুন *
                  </label>
                  <input
                    id="gd-leave-reason"
                    type="text"
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="যেমন: পারিবারিক অনুষ্ঠান বা চিকিৎসকের পরামর্শ"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="gd-dep-date"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      প্রস্থানের তারিখ
                    </label>
                    <input
                      id="gd-dep-date"
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="gd-ret-date"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      ফেরার তারিখ
                    </label>
                    <input
                      id="gd-ret-date"
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ছুটির আবেদন জমা দিন</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMUNICATION & GUARDIAN-TO-MADRASA INQUIRY */}
      {activeTab === 'communication' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Inquiry Thread & Teacher Replies */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0B3B2E]" />
                <h2 className="text-sm font-bold text-slate-900">
                  মাদ্রাসা দপ্তর ও উস্তাযের সাথে বার্তা বিনিময় ({childInquiries.length})
                </h2>
              </div>
              <div className="divide-y divide-stone-200">
                {childInquiries.length === 0 ? (
                  <div className="p-5 text-xs text-slate-500">
                    এখনো কোনো জিজ্ঞাসা বা বার্তা পাঠানো হয়নি। ডানপাশের ফর্ম থেকে বার্তা পাঠান।
                  </div>
                ) : (
                  childInquiries.map((inq) => (
                    <div key={inq.id} className="p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{inq.subject}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            inq.status !== 'open'
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {inq.status !== 'open' ? 'উত্তর প্রদানকৃত' : 'উত্তরের অপেক্ষায়'}
                        </span>
                      </div>
                      <p className="text-slate-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <strong>অভিভাবকের বার্তা ({inq.guardianName}):</strong> {inq.message}
                      </p>
                      {inq.teacherReply ? (
                        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                          <strong>উস্তায/দপ্তরের উত্তর:</strong> “{inq.teacherReply}”
                        </div>
                      ) : (
                        isStaffOrAdmin && (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={replyDrafts[inq.id] || ''}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [inq.id]: e.target.value,
                                }))
                              }
                              placeholder="উস্তায/প্রশাসনের উত্তর লিখুন..."
                              className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const text = replyDrafts[inq.id]?.trim();
                                if (!text) return;
                                await onReplyGuardianInquiry(inq.id, text);
                                setReplyDrafts((prev) => ({ ...prev, [inq.id]: '' }));
                              }}
                              className="px-3 py-1.5 bg-[#0B3B2E] text-white rounded-lg font-semibold cursor-pointer"
                            >
                              উত্তর দিন
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: New Guardian Inquiry Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-900">
                উস্তায বা মাদ্রাসা দপ্তরে সরাসরি জিজ্ঞাসা পাঠান
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                সন্তানের পড়াশোনা, স্বাস্থ্য, আবাসন বা বেতন সংক্রান্ত যেকোনো বিষয় জানান।
              </p>

              {inquirySavedMsg && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  {inquirySavedMsg}
                </div>
              )}

              <form onSubmit={handleInquirySubmit} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="gd-inq-subject"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    শিরোনাম / বিষয় *
                  </label>
                  <input
                    id="gd-inq-subject"
                    type="text"
                    required
                    value={inquirySubject}
                    onChange={(e) => setInquirySubject(e.target.value)}
                    placeholder="যেমন: হিফয মনযিল তিলাওয়াত প্রসঙ্গে"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gd-inq-msg"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    বিস্তারিত বার্তা *
                  </label>
                  <textarea
                    id="gd-inq-msg"
                    rows={3}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="আপনার জিজ্ঞাসা বা পরামর্শ বিস্তারিত লিখুন..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>বার্তা প্রেরণ করুন</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCE INTEGRATION & PRINTABLE RECEIPTS */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">মাসিক নির্ধারিত টিউশন ও বোর্ডিং ফি</div>
              <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                {formatBdt(activeChild.monthlyFeeBdt, language)}
              </div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-4">
              <div className="text-xs text-emerald-800 font-semibold">মোট পরিশোধিত (Verified Paid)</div>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-900">
                {formatBdt(totalFeePaidBdt, language)}
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl p-4">
              <div className="text-xs text-amber-800 font-semibold">চলমান বকেয়া ব্যালেন্স</div>
              <div className="mt-1 text-xl font-bold font-mono text-amber-900">
                {formatBdt(totalFeeDueBdt, language)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0B3B2E]" />
                <h2 className="text-sm font-bold text-slate-900">
                  যাচাইকৃত ফি পরিশোধের ইতিহাস ও ডিজিটাল রসিদ ({childInvoices.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer no-print"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>
            </div>
            <div className="divide-y divide-stone-200">
              {childInvoices.map((inv) => {
                const due = Math.max(0, inv.amountDueBdt - inv.amountPaidBdt);
                return (
                  <div
                    key={inv.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{inv.billingMonth}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-[11px]">
                          {inv.receiptNo}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono mt-0.5">
                        মাধ্যম: {inv.paymentMethod.toUpperCase()} · ট্রানজেকশন:{' '}
                        {inv.transactionRef || 'ক্যাশ কাউন্টার'} · স্ট্যাটাস: {inv.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-end font-mono">
                      <div className="font-bold text-slate-900">
                        পরিশোধিত: {formatBdt(inv.amountPaidBdt, language)} /{' '}
                        {formatBdt(inv.amountDueBdt, language)}
                      </div>
                      <div
                        className={`font-semibold ${
                          due > 0 ? 'text-amber-800' : 'text-emerald-800'
                        }`}
                      >
                        {due > 0
                          ? `বকেয়া: ${formatBdt(due, language)}`
                          : 'সম্পূর্ণ পরিশোধিত (Verified)'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
