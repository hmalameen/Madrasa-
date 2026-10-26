import React, { useEffect, useState } from 'react';
import {
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Home,
  Lock,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type {
  AssignmentCompletionStatus,
  AttendanceRecord,
  AttendanceStatus,
  ExamResult,
  HifzProgressLog,
  Language,
  Notice,
  ResidentialLeave,
  Student,
  StudyDiaryEntry,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  canAccountAccessPortal,
  computeAttendanceMetrics,
  computeClassTabulationSheet,
  computeExamAnalytics,
  DEFAULT_MADRASA_GRADING_POLICY,
  filterAuthorizedPublishedExamsForPortal,
  filterVisibleStudyDiaryEntries,
  formatNum,
  generateCsvContent,
  resolveStudentPortalRecord,
} from '../../utils/madrasaLogic';
import { INITIAL_EXAM_SETUPS, INITIAL_SETTINGS } from '../../data/initialSeedData';
import { OfficialIndividualMarksheet } from '../OfficialExamDocuments';
import { StudentPhotoAvatar } from '../StudentPhotoUploader';

type StudentPortalTab =
  | 'overview'
  | 'attendance'
  | 'progress'
  | 'diary'
  | 'madrasa_learning'
  | 'routine_resources';

const ATTENDANCE_STATUS_LABEL_BN: Record<AttendanceStatus, string> = {
  present: 'উপস্থিত (Present)',
  absent: 'অনুপস্থিত (Absent)',
  late: 'বিলম্ব (Late)',
  leave: 'অনুমোদিত ছুটি (Leave)',
};

interface StudentPortalModuleProps {
  language: Language;
  role: UserRole;
  isSandboxMode: boolean;
  studentUid: string;
  linkedStudentId: string;
  accountStatus: 'active' | 'pending' | 'suspended';
  students: Student[];
  attendance: AttendanceRecord[];
  exams: ExamResult[];
  hifzLogs: HifzProgressLog[];
  leaves: ResidentialLeave[];
  notices: Notice[];
  studyDiary: StudyDiaryEntry[];
  onToggleDiaryCompletion: (
    entryId: string,
    completionStatus: AssignmentCompletionStatus
  ) => Promise<boolean>;
  onAddStudyDiaryEntry: (
    entry: Omit<StudyDiaryEntry, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ) => Promise<boolean>;
}

const DAILY_CLASS_ROUTINE: Record<
  Student['department'],
  { time: string; periodBn: string; subjectBn: string; teacherBn: string; roomBn: string }[]
> = {
  hifz: [
    {
      time: '০৫:৩০ - ০৭:০০',
      periodBn: 'ফজর পরবর্তী হালকা',
      subjectBn: 'নতুন সবক প্রদান ও তাজবীদ মাশক',
      teacherBn: 'হাফেয কারী আব্দুল্লাহ আল-মামুন',
      roomBn: 'হিফয হল - ১',
    },
    {
      time: '০৮:৩০ - ১১:০০',
      periodBn: 'প্রভাতী অধিবেশন',
      subjectBn: 'সবকি (পশ্চাৎ পাঠ) ও সিফাতুল হুরুফ',
      teacherBn: 'হাফেয কারী আব্দুল্লাহ আল-মামুন',
      roomBn: 'হিফয হল - ১',
    },
    {
      time: '১১:১৫ - ১২:৩০',
      periodBn: 'ক্যাডেট জেনারেল পিরিয়ড',
      subjectBn: 'প্রাথমিক বাংলা, ইংরেজি ও গণিত',
      teacherBn: 'জনাব রফিকুল ইসলাম',
      roomBn: 'একাডেমিক কক্ষ - ১০৩',
    },
    {
      time: '১৪:৩০ - ১৬:১৫',
      periodBn: 'যোহর পরবর্তী অধিবেশন',
      subjectBn: 'মনযিল তিলাওয়াত (এক পারা পূর্ণ মুরাজায়াত)',
      teacherBn: 'হাফেয মাওলানা জুবায়ের আহমদ',
      roomBn: 'হিফয হল - ১',
    },
    {
      time: '১৮:১৫ - ২০:০০',
      periodBn: 'মাগরিব পরবর্তী প্রস্তুতি',
      subjectBn: 'আগামীকালের নতুন সবক মুখস্থ ও তিলাওয়াত',
      teacherBn: 'নেগরান উস্তায',
      roomBn: 'হিফয হল - ১',
    },
  ],
  qawmi: [
    {
      time: '০৮:০০ - ০৮:৫০',
      periodBn: '১ম ঘণ্টা',
      subjectBn: 'নাহমীর ও আরবি বাক্য গঠন (Nahw)',
      teacherBn: 'মুফতি সাইফুল্লাহ আল-মানসুর',
      roomBn: 'কিতাব ভবন - ২০২',
    },
    {
      time: '০৮:৫০ - ০৯:৪০',
      periodBn: '২য় ঘণ্টা',
      subjectBn: 'মীযানুস সরফ ও মুনশাইব (Sarf)',
      teacherBn: 'মাওলানা ফজলুল করীম',
      roomBn: 'কিতাব ভবন - ২০২',
    },
    {
      time: '০৯:৪০ - ১০:৩০',
      periodBn: '৩য় ঘণ্টা',
      subjectBn: 'নূরুল ঈযাহ ও মাসায়েলে নামায (Fiqh)',
      teacherBn: 'মুফতি সাইফুল্লাহ আল-মানসুর',
      roomBn: 'কিতাব ভবন - ২০২',
    },
    {
      time: '১০:৪৫ - ১১:৩৫',
      periodBn: '৪র্থ ঘণ্টা',
      subjectBn: 'যাদুত তালিবীন (Hadith Sharif)',
      teacherBn: 'শাইখুল হাদীস মাওলানা জাকারিয়া',
      roomBn: 'কিতাব ভবন - ২০২',
    },
    {
      time: '১১:৩৫ - ১২:৩০',
      periodBn: '৫ম ঘণ্টা',
      subjectBn: 'এসো আরবি শিখি ও ইনশা (Arabic Literature)',
      teacherBn: 'মাওলানা হাবিবুর রহমান',
      roomBn: 'কিতাব ভবন - ২০২',
    },
  ],
  general: [
    {
      time: '০৮:০০ - ০৮:৪৫',
      periodBn: '১ম ঘণ্টা',
      subjectBn: 'আল-কুরআন তাজবীদ ও ইসলাম শিক্ষা',
      teacherBn: 'মাওলানা আনোয়ারুল হক',
      roomBn: 'ক্যাডেট ভবন - ৩০১',
    },
    {
      time: '০৮:৪৫ - ০৯:৩০',
      periodBn: '২য় ঘণ্টা',
      subjectBn: 'সাধারণ গণিত ও জ্যামিতি (Mathematics)',
      teacherBn: 'জনাব রফিকুল ইসলাম (এম.এসসি)',
      roomBn: 'ক্যাডেট ভবন - ৩০১',
    },
    {
      time: '০৯:৩০ - ১০:১৫',
      periodBn: '৩য় ঘণ্টা',
      subjectBn: 'English Grammar & Spoken Communication',
      teacherBn: 'জনাব তানভীর আহমেদ',
      roomBn: 'ক্যাডেট ভবন - ৩০১',
    },
    {
      time: '১০:৩০ - ১১:১৫',
      periodBn: '৪র্থ ঘণ্টা',
      subjectBn: 'আল-লুগাতুল আরাবিয়্যাহ (আধুনিক আরবি)',
      teacherBn: 'মাওলানা হাবিবুর রহমান',
      roomBn: 'ক্যাডেট ভবন - ৩০১',
    },
    {
      time: '১১:১৫ - ১২:০০',
      periodBn: '৫ম ঘণ্টা',
      subjectBn: 'বাংলা সাহিত্য ও সাধারণ বিজ্ঞান',
      teacherBn: 'জনাব রফিকুল ইসলাম',
      roomBn: 'ক্যাডেট ভবন - ৩০১',
    },
  ],
};

const UPCOMING_EXAM_SCHEDULE = [
  {
    id: 'sch-1',
    date: '২০২৬-১১-১৫',
    dayBn: 'রবিবার',
    time: 'সকাল ০৯:০০ - ১২:০০',
    subjectBn: 'হিফযুল কুরআন মৌখিক / নাহমীর / আল-কুরআন ও আকাইদ',
    hallBn: 'প্রধান পরীক্ষা হল (ভবন-এ)',
  },
  {
    id: 'sch-2',
    date: '২০২৬-১১-১৭',
    dayBn: 'মঙ্গলবার',
    time: 'সকাল ০৯:০০ - ১২:০০',
    subjectBn: 'তাজবীদ ও সিফাত / মীযানুস সরফ / সাধারণ গণিত',
    hallBn: 'প্রধান পরীক্ষা হল (ভবন-এ)',
  },
  {
    id: 'sch-3',
    date: '২০২৬-১১-১৯',
    dayBn: 'বৃহস্পতিবার',
    time: 'সকাল ০৯:০০ - ১২:০০',
    subjectBn: 'ফিকহ ও মাসায়েল / হাদীস শরীফ / English First Paper',
    hallBn: 'প্রধান পরীক্ষা হল (ভবন-এ)',
  },
  {
    id: 'sch-4',
    date: '২০২৬-১১-২১',
    dayBn: 'শনিবার',
    time: 'সকাল ০৯:০০ - ১২:০০',
    subjectBn: 'আরবি সাহিত্য ও ইনশা / বাংলা ও সাধারণ বিজ্ঞান',
    hallBn: 'প্রধান পরীক্ষা হল (ভবন-এ)',
  },
];

const APPROVED_LEARNING_RESOURCES: Record<
  Student['department'],
  { titleBn: string; typeBn: string; summaryBn: string; referenceCode: string }[]
> = {
  hifz: [
    {
      titleBn: 'তাজবীদ ও মাখারিজুল হুরুফ নির্দেশিকা (নূরানী পদ্ধতি)',
      typeBn: 'পাঠ্য সহায়িকা',
      summaryBn: '১৭টি মাখরাজ, সিফাতে লাযিমা ও আরিযা এবং ওয়াকফের নিয়মাবলি সংবলিত চার্ট।',
      referenceCode: 'UQCM-RES-H01',
    },
    {
      titleBn: 'পারা ১৭–২২ মুতাশাবিহাত (সাদৃশ্যপূর্ণ আয়াত) সংকলন',
      typeBn: 'হিফয নোটবুক',
      summaryBn: 'সূরা বনী ইসরাঈল থেকে সূরা হজ্জ পর্যন্ত সাদৃশ্যপূর্ণ আয়াতের পার্থক্য মনে রাখার কৌশল।',
      referenceCode: 'UQCM-RES-H02',
    },
    {
      titleBn: 'দৈনিক মাসনূন দুআ ও আযকার সংকলন',
      typeBn: 'আদব ও আমল',
      summaryBn: 'সকাল-সন্ধ্যার মাসনূন দুআ, সালাতের পরের যিকির এবং ক্যাডেট আদব।',
      referenceCode: 'UQCM-RES-H03',
    },
  ],
  qawmi: [
    {
      titleBn: 'নাহমীর ও আমেল-মামুল বিশ্লেষণ ছক',
      typeBn: 'নাহু সহায়িকা',
      summaryBn: 'মুরাক্কাব, মুআরাব-মাবনী এবং শব্দের ইরাব নির্ণয়ের অনুশীলন মাশক।',
      referenceCode: 'UQCM-RES-Q01',
    },
    {
      titleBn: 'মীযানুস সরফ — ইসবাত ও নফী গর্দান চার্ট',
      typeBn: 'সরফ চার্ট',
      summaryBn: 'মাযী, মুযারি, আমর ও নাহীর রূপান্তর এবং ওযন চেনার সহজ ছক।',
      referenceCode: 'UQCM-RES-Q02',
    },
    {
      titleBn: 'নূরুল ঈযাহ — তাহারাত ও সালাত অধ্যায়ের মাসায়েল সারসংক্ষেপ',
      typeBn: 'ফিকহ নোট',
      summaryBn: 'অযু, গোসল, তায়াম্মুম এবং সালাতের ফরয, ওয়াজিব ও সুন্নাতসমূহের দলীলভিত্তিক সারসংক্ষেপ।',
      referenceCode: 'UQCM-RES-Q03',
    },
  ],
  general: [
    {
      titleBn: 'সপ্তম শ্রেণী — বীজগণিতীয় সূত্রাবলি ও জ্যামিতিক উপপাদ্য সংকলন',
      typeBn: 'গণিত শিট',
      summaryBn: 'অধ্যায় ৪ ও ৫ এর অনুশীলনীর সমাধান কৌশল এবং সৃজনশীল প্রশ্ন ব্যাংক।',
      referenceCode: 'UQCM-RES-G01',
    },
    {
      titleBn: 'English Grammar & Academic Paragraph Writing Workbook',
      typeBn: 'ভাষা শিক্ষা',
      summaryBn: 'Right form of verbs, Narration, এবং ক্যাডেট মানের প্রবন্ধ রচনার নিয়মাবলি।',
      referenceCode: 'UQCM-RES-G02',
    },
    {
      titleBn: 'আধুনিক আরবি কথোপকথন ও শব্দভাণ্ডার (আল-লুগাতুল আরাবিয়্যাহ)',
      typeBn: 'আরবি ভাষা',
      summaryBn: 'মাদ্রাসা ও দৈনন্দিন জীবনে ব্যবহৃত ৩০০টি আরবি বাক্য ও শব্দার্থ।',
      referenceCode: 'UQCM-RES-G03',
    },
  ],
};

export function StudentPortalModule({
  language,
  role,
  isSandboxMode,
  studentUid,
  linkedStudentId,
  accountStatus,
  students,
  attendance,
  exams,
  hifzLogs,
  leaves,
  notices,
  studyDiary,
  onToggleDiaryCompletion,
  onAddStudyDiaryEntry,
}: StudentPortalModuleProps) {
  const t = TRANSLATIONS[language];
  const isStaffOrAdmin = ['super_admin', 'muhtamim', 'teacher'].includes(role);

  const [activeTab, setActiveTab] = useState<StudentPortalTab>('overview');
  const [selectedAdminStudentId, setSelectedAdminStudentId] = useState<string>(
    students[0]?.id || 'stu-101'
  );
  const [simulatedStatus, setSimulatedStatus] = useState<'active' | 'pending' | 'suspended'>(
    accountStatus
  );

  // Teacher / Admin New Diary Entry Form State
  const [showAddDiaryForm, setShowAddDiaryForm] = useState(false);
  const [diaryDate, setDiaryDate] = useState('2026-10-23');
  const [diarySubject, setDiarySubject] = useState('');
  const [diaryLesson, setDiaryLesson] = useState('');
  const [diaryHomework, setDiaryHomework] = useState('');
  const [diaryDueDate, setDiaryDueDate] = useState('2026-10-25');
  const [diaryFeedback, setDiaryFeedback] = useState('');
  const [diaryLearningGoal, setDiaryLearningGoal] = useState(
    'নির্ধারিত সময়ের মধ্যে নির্ভুলভাবে অনুশীলন সম্পন্ন করা'
  );
  const [diaryVisibleToGuardian, setDiaryVisibleToGuardian] = useState(true);
  const [diarySaveMsg, setDiarySaveMsg] = useState<string | null>(null);

  useEffect(() => {
    setSimulatedStatus(accountStatus);
  }, [accountStatus]);

  const effectiveStatus = isSandboxMode || isStaffOrAdmin ? simulatedStatus : accountStatus;
  const accessCheck = canAccountAccessPortal(effectiveStatus);

  // Enforce strict student record isolation
  const activeStudent: Student | null = isStaffOrAdmin
    ? students.find((s) => s.id === selectedAdminStudentId) || students[0] || null
    : resolveStudentPortalRecord(
        students,
        studentUid,
        linkedStudentId,
        effectiveStatus
      );

  // Block pending or suspended accounts immediately
  if (!accessCheck.allowed) {
    return (
      <div className="space-y-4">
        {(isSandboxMode || isStaffOrAdmin) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-amber-900">
              নিরাপত্তা যাচাই মোড: অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন করে পোর্টাল লক পরীক্ষা করুন
            </span>
            <select
              aria-label="Simulate account status"
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
              ? 'আপনার শিক্ষার্থী পোর্টাল অ্যাকাউন্ট অনুমোদনের অপেক্ষায় রয়েছে'
              : 'আপনার অ্যাকাউন্টের অ্যাক্সেস সাময়িকভাবে স্থগিত করা হয়েছে'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            {accessCheck.reasonBn}
          </p>
        </div>
      </div>
    );
  }

  if (!activeStudent) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center max-w-xl mx-auto">
        <GraduationCap className="w-10 h-10 text-[#0B3B2E] mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">
          কোনো অনুমোদিত শিক্ষার্থী প্রোফাইল সংযুক্ত পাওয়া যায়নি
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          নিরাপত্তা নীতিমালা অনুযায়ী একজন শিক্ষার্থী শুধুমাত্র তাঁর নিজের দাখেলা নম্বরের সাথে সংযুক্ত প্রোফাইল দেখতে পারেন। আপনার ইউজার অ্যাকাউন্টের সাথে দাখেলা নম্বর সংযুক্ত করতে মাদ্রাসা প্রশাসনের সাথে যোগাযোগ করুন।
        </p>
      </div>
    );
  }

  // Strictly scoped student datasets
  const studentAttendance = attendance
    .filter((a) => a.studentId === activeStudent.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const attendanceMetrics = computeAttendanceMetrics(studentAttendance);

  const studentExams = filterAuthorizedPublishedExamsForPortal(exams, {
    role: 'student',
    studentId: activeStudent.id,
  });
  const examAnalytics = computeExamAnalytics(studentExams, activeStudent.id);

  const matchedExamSetup =
    INITIAL_EXAM_SETUPS.find(
      (cfg) => cfg.className.trim() === activeStudent.className.trim()
    ) || {
      id: 'stu-portal-cfg',
      academicYear: '2026-2027',
      examName:
        studentExams[0]?.examName || 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬ (2nd Term)',
      department: activeStudent.department,
      className: activeStudent.className,
      sectionName: 'ক-শাখা (Main)',
      examDate: '2026-09-15',
      publicationDate: '2026-10-05',
      instructions: '',
      subjects: studentExams.map((e, idx) => ({
        subjectCode: e.subjectCode || `SUB-${idx + 1}`,
        subjectName: e.subjectName,
        maxMarks: e.fullMarks,
        passMarks: e.passMarks ?? 33,
      })),
      gradingPolicy: DEFAULT_MADRASA_GRADING_POLICY,
      workflowStatus: 'published' as const,
      authorId: 'system',
    };

  const publishedTabulationRows = computeClassTabulationSheet(
    students,
    studentExams,
    matchedExamSetup,
    { publishedOnly: true }
  );
  const officialStudentMarksheetRow =
    publishedTabulationRows.find((r) => r.student.id === activeStudent.id) ||
    null;

  const studentHifz = hifzLogs
    .filter((h) => h.studentId === activeStudent.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const studentLeaves = leaves
    .filter((l) => l.studentId === activeStudent.id)
    .sort((a, b) => b.departureDate.localeCompare(a.departureDate));

  // Filter diary entries strictly for this student & hide internal teacher notes from students
  const visibleDiary = filterVisibleStudyDiaryEntries(
    studyDiary,
    activeStudent,
    isStaffOrAdmin ? role : 'student'
  );

  const pendingHomework = visibleDiary.filter((d) => d.completionStatus === 'pending');
  const completedHomework = visibleDiary.filter((d) => d.completionStatus !== 'pending');

  const relevantNotices = notices.filter((n) =>
    ['all', 'students', 'residential'].includes(n.targetAudience)
  );

  const todayRoutine = DAILY_CLASS_ROUTINE[activeStudent.department] || DAILY_CLASS_ROUTINE.hifz;
  const departmentResources =
    APPROVED_LEARNING_RESOURCES[activeStudent.department] || APPROVED_LEARNING_RESOURCES.hifz;

  const latestAttendance = studentAttendance[0] || null;
  const latestHifz = studentHifz[0] || null;

  const handleDownloadMarksheetCsv = () => {
    const headers = [
      'Admission No',
      'Student Name',
      'Class',
      'Exam Name',
      'Subject',
      'Marks Obtained',
      'Full Marks',
      'Percentage',
      'Grade',
    ];
    const rows = examAnalytics.publishedExams.map((e) => [
      activeStudent.admissionNo,
      activeStudent.nameBn,
      activeStudent.className,
      e.examName,
      e.subjectName,
      e.marksObtained,
      e.fullMarks,
      `${Math.round((e.marksObtained / Math.max(1, e.fullMarks)) * 100)}%`,
      e.grade,
    ]);
    const csv = generateCsvContent(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marksheet-${activeStudent.admissionNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diarySubject.trim() || !diaryLesson.trim() || !diaryHomework.trim()) return;
    setDiarySaveMsg(null);
    const ok = await onAddStudyDiaryEntry({
      date: diaryDate,
      studentId: activeStudent.id,
      studentNameBn: activeStudent.nameBn,
      admissionNo: activeStudent.admissionNo,
      department: activeStudent.department,
      className: activeStudent.className,
      subjectName: diarySubject.trim(),
      lessonCovered: diaryLesson.trim(),
      homeworkAssigned: diaryHomework.trim(),
      dueDate: diaryDueDate,
      completionStatus: 'pending',
      teacherFeedback: diaryFeedback.trim() || 'নির্ধারিত সময়ের মধ্যে অনুশীলন সম্পন্ন করবে।',
      learningGoal: diaryLearningGoal.trim(),
      visibleToGuardian: diaryVisibleToGuardian,
      guardianUid: activeStudent.guardianUid || '',
    });
    if (ok) {
      setDiarySubject('');
      setDiaryLesson('');
      setDiaryHomework('');
      setDiaryFeedback('');
      setShowAddDiaryForm(false);
      setDiarySaveMsg('নতুন পাঠ ডায়েরি ও হোমওয়ার্ক সফলভাবে সংরক্ষিত হয়েছে।');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Security & Student Identity Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <StudentPhotoAvatar
            photoUrl={activeStudent.photoUrl}
            nameBn={activeStudent.nameBn}
            nameEn={activeStudent.nameEn}
            department={activeStudent.department}
            size="lg"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>ব্যক্তিগতকৃত শিক্ষার্থী একাডেমিক পোর্টাল (Isolated Student Access)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-mono text-[11px]">
                {activeStudent.admissionNo}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeStudent.nameBn}{' '}
              <span className="text-sm font-normal text-slate-500">({activeStudent.nameEn})</span>
            </h1>
            <p className="text-xs text-slate-600">
              বিভাগ: <strong>{t.departments[activeStudent.department]}</strong> · জামাত/শ্রেণী:{' '}
              <strong>{activeStudent.className}</strong> · রোল: <strong>{formatNum(activeStudent.rollNo, language)}</strong> ·
              আবাসন: <strong>{activeStudent.dormitoryRoom}</strong>
            </p>
          </div>
        </div>

        {/* Staff/Sandbox Student Switcher & Account Status Tester */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isStaffOrAdmin && (
            <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
              <label
                htmlFor="stu-portal-selector"
                className="text-xs font-semibold text-slate-700 whitespace-nowrap"
              >
                শিক্ষার্থী নির্বাচন (স্টাফ ভিউ):
              </label>
              <select
                id="stu-portal-selector"
                value={activeStudent.id}
                onChange={(e) => setSelectedAdminStudentId(e.target.value)}
                className="px-2 py-1 text-xs bg-white border border-stone-300 rounded-md font-semibold text-slate-900"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameBn} ({st.admissionNo} — {t.departments[st.department]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(isSandboxMode || isStaffOrAdmin) && (
            <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-[11px] font-semibold text-slate-600">অ্যাকাউন্ট স্ট্যাটাস:</span>
              <select
                aria-label="Account status verification"
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

      {/* Primary Section Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Student Portal Sections"
        className="bg-white border border-stone-200 rounded-xl p-1.5 flex flex-wrap gap-1.5 no-print"
      >
        {(
          [
            { id: 'overview', labelBn: '১. সারসংক্ষেপ ড্যাশবোর্ড', icon: Sparkles },
            { id: 'attendance', labelBn: '২. হাজিরা ও ছুটি', icon: CalendarCheck },
            { id: 'progress', labelBn: '৩. একাডেমিক অগ্রগতি ও মার্কশিট', icon: Award },
            { id: 'diary', labelBn: '৪. দৈনিক পাঠ ডায়েরি ও হোমওয়ার্ক', icon: ClipboardList },
            {
              id: 'madrasa_learning',
              labelBn: `৫. ${t.departments[activeStudent.department]} বিশেষ পাঠ`,
              icon: BookOpen,
            },
            {
              id: 'routine_resources',
              labelBn: '৬. রুটিন, সিলেবাস ও প্রোফাইল',
              icon: BookMarked,
            },
          ] as {
            id: StudentPortalTab;
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

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>আজকের হাজিরা ও উপস্থিতির হার</span>
                <CalendarCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900">
                  {latestAttendance
                    ? ATTENDANCE_STATUS_LABEL_BN[latestAttendance.status]
                    : 'উপস্থিত (Present)'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {formatNum(attendanceMetrics.attendancePercentage, language)}% উপস্থিতি
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                সর্বশেষ আপডেট: {formatNum(latestAttendance?.date || '২০২৬-১০-২২', language)}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>অপেক্ষমাণ হোমওয়ার্ক ও অনুশীলন</span>
                <ClipboardList className="w-4 h-4 text-amber-700" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-slate-900">
                  {formatNum(pendingHomework.length, language)} টি বাকি
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  {formatNum(completedHomework.length, language)} টি সম্পন্ন
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                পাঠ ডায়েরি থেকে সম্পন্ন হিসেবে চিহ্নিত করুন
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>সর্বশেষ প্রকাশিত পরীক্ষার ফলাফল</span>
                <Award className="w-4 h-4 text-[#0B3B2E]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-slate-900">
                  {formatNum(examAnalytics.averagePercentage, language)}%
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  {examAnalytics.overallGrade}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                মোট প্রাপ্ত নম্বর: {formatNum(examAnalytics.totalObtained, language)} / {formatNum(examAnalytics.totalFullMarks, language)}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>আসন্ন পরীক্ষা ও মূল্যায়ন</span>
                <Calendar className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                দ্বিতীয় সাময়িক পরীক্ষা ২০২৬
              </div>
              <div className="mt-1 text-[11px] font-mono text-slate-600">
                শুরু: ১৫ নভেম্বর ২০২৬ · সকাল ০৯:০০
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Today's Classes + Pending Homework */}
            <div className="lg:col-span-7 space-y-6">
              {/* Today's Classes and Assigned Lessons */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0B3B2E]" />
                    <h2 className="text-sm font-bold text-slate-900">
                      আজকের ক্লাস রুটিন ও নির্ধারিত দরস ({activeStudent.className})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('routine_resources')}
                    className="text-xs font-semibold text-[#0B3B2E] hover:underline cursor-pointer"
                  >
                    পূর্ণ রুটিন দেখুন
                  </button>
                </div>
                <div className="divide-y divide-stone-200">
                  {todayRoutine.map((cls, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0B3B2E]">{cls.time}</span>
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-slate-700 font-medium">
                            {cls.periodBn}
                          </span>
                        </div>
                        <div className="mt-1 font-bold text-slate-900">{cls.subjectBn}</div>
                        <div className="text-slate-500">উস্তায: {cls.teacherBn}</div>
                      </div>
                      <div className="text-xs font-mono text-slate-600 bg-stone-50 px-2.5 py-1 rounded border border-stone-200 self-start sm:self-center">
                        {cls.roomBn}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Homework & Recent Study Diary */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#0B3B2E]" />
                    <h2 className="text-sm font-bold text-slate-900">
                      নির্ধারিত হোমওয়ার্ক ও সাম্প্রতিক পাঠ ডায়েরি ({visibleDiary.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('diary')}
                    className="text-xs font-semibold text-[#0B3B2E] hover:underline cursor-pointer"
                  >
                    সকল ডায়েরি ও হোমওয়ার্ক
                  </button>
                </div>
                <div className="divide-y divide-stone-200">
                  {visibleDiary.length === 0 ? (
                    <div className="p-5 text-xs text-slate-500">
                      এই শিক্ষার্থীর জন্য এখনো কোনো পাঠ ডায়েরি এন্ট্রি যোগ করা হয়নি।
                    </div>
                  ) : (
                    visibleDiary.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="p-4 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-slate-900">
                            {entry.subjectName}{' '}
                            <span className="font-mono font-normal text-slate-500">
                              ({entry.date})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onToggleDiaryCompletion(
                                entry.id,
                                entry.completionStatus === 'pending' ? 'completed' : 'pending'
                              )
                            }
                            className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                              entry.completionStatus === 'pending'
                                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {entry.completionStatus === 'pending'
                                ? 'হোমওয়ার্ক সম্পন্ন করুন'
                                : 'সম্পন্ন হয়েছে'}
                            </span>
                          </button>
                        </div>
                        <div className="text-slate-700">
                          <strong>পঠিত পাঠ:</strong> {entry.lessonCovered}
                        </div>
                        <div className="text-slate-800 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                          <strong>হোমওয়ার্ক (জমার তারিখ: {entry.dueDate}):</strong>{' '}
                          {entry.homeworkAssigned}
                        </div>
                        <div className="text-slate-600 italic">
                          উস্তাযের মূল্যায়ন: “{entry.teacherFeedback}” · লক্ষ্য: {entry.learningGoal}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Latest Published Results, Upcoming Exams & Teacher Comments/Notices */}
            <div className="lg:col-span-5 space-y-6">
              {/* Latest Published Results */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#0B3B2E]" />
                    <h2 className="text-sm font-bold text-slate-900">
                      সর্বশেষ প্রকাশিত ফলাফল ({studentExams.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('progress')}
                    className="text-xs font-semibold text-[#0B3B2E] hover:underline cursor-pointer"
                  >
                    মার্কশিট প্রিন্ট
                  </button>
                </div>
                <div className="divide-y divide-stone-200">
                  {studentExams.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{ex.subjectName}</div>
                        <div className="text-slate-500">{ex.examName}</div>
                      </div>
                      <div className="text-end font-mono">
                        <div className="font-bold text-slate-900">
                          {ex.marksObtained} / {ex.fullMarks}
                        </div>
                        <div className="text-emerald-800 font-semibold">{ex.grade}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Teacher Comments & Institutional Notices */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    উস্তাযের সাম্প্রতিক পরামর্শ ও নোটিশ বোর্ড
                  </h2>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  {latestHifz && (
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                      <div className="font-bold text-emerald-950">
                        হিফয উস্তাযের মূল্যায়ন ({latestHifz.date}):
                      </div>
                      <p className="mt-1 text-emerald-900">“{latestHifz.teacherComment}”</p>
                    </div>
                  )}
                  {relevantNotices.slice(0, 3).map((not) => (
                    <div
                      key={not.id}
                      className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{not.titleBn}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {not.publishDate}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{not.contentBn}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & LEAVE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Monthly Attendance Summary KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">মোট কার্যদিবস</div>
              <div className="mt-1 text-xl font-bold font-mono text-slate-900">
                {attendanceMetrics.totalDays} দিন
              </div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-4">
              <div className="text-xs text-emerald-800 font-semibold">উপস্থিত (Present)</div>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-900">
                {attendanceMetrics.presentCount} দিন
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl p-4">
              <div className="text-xs text-amber-800 font-semibold">বিলম্ব (Late)</div>
              <div className="mt-1 text-xl font-bold font-mono text-amber-900">
                {attendanceMetrics.lateCount} দিন
              </div>
            </div>
            <div className="bg-white border border-sky-200 rounded-xl p-4">
              <div className="text-xs text-sky-800 font-semibold">অনুমোদিত ছুটি (Leave)</div>
              <div className="mt-1 text-xl font-bold font-mono text-sky-900">
                {attendanceMetrics.leaveCount} দিন
              </div>
            </div>
            <div className="bg-white border border-red-200 rounded-xl p-4">
              <div className="text-xs text-red-800 font-semibold">অনুপস্থিত (Absent)</div>
              <div className="mt-1 text-xl font-bold font-mono text-red-900">
                {attendanceMetrics.absentCount} দিন
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Calendar Grid Visualization */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    মাসিক হাজিরা ক্যালেন্ডার (অক্টোবর ২০২৬)
                  </h2>
                  <p className="text-xs text-slate-500">
                    উপস্থিতির হার: <strong>{attendanceMetrics.attendancePercentage}%</strong>{' '}
                    (শুক্রবার সাপ্তাহিক ছুটি)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                    উপস্থিত
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                    বিলম্ব
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-semibold">
                    ছুটি
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 font-semibold">
                    অনুপস্থিত
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs">
                {['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'].map((d) => (
                  <div key={d} className="font-bold text-slate-600 py-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 31 }, (_, idx) => {
                  const day = idx + 1;
                  const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
                  const record = studentAttendance.find((a) => a.date === dateStr);
                  const isFriday = day % 7 === 2;
                  const isFuture = day > 24;

                  let badgeClass = 'bg-emerald-50 border-emerald-200 text-emerald-900';
                  let statusLabel = 'উপস্থিত';

                  if (isFriday) {
                    badgeClass = 'bg-stone-100 border-stone-200 text-slate-500';
                    statusLabel = 'জুমআ ছুটি';
                  } else if (record) {
                    if (record.status === 'present') {
                      badgeClass = 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold';
                      statusLabel = 'উপস্থিত';
                    } else if (record.status === 'late') {
                      badgeClass = 'bg-amber-100 border-amber-300 text-amber-950 font-bold';
                      statusLabel = 'বিলম্ব';
                    } else if (record.status === 'leave') {
                      badgeClass = 'bg-sky-100 border-sky-300 text-sky-950 font-bold';
                      statusLabel = 'ছুটি';
                    } else {
                      badgeClass = 'bg-red-100 border-red-300 text-red-950 font-bold';
                      statusLabel = 'অনুপস্থিত';
                    }
                  } else if (isFuture) {
                    badgeClass = 'bg-white border-stone-200 text-slate-400';
                    statusLabel = '—';
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`p-2 rounded-lg border ${badgeClass} flex flex-col items-center justify-center`}
                    >
                      <span className="font-mono text-xs">{day}</span>
                      <span className="text-[10px] truncate max-w-full">{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Attendance Log & Leave Approval History */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200">
                  <h2 className="text-sm font-bold text-slate-900">
                    দৈনিক হাজিরা লগ ও উস্তাযের নোট ({studentAttendance.length})
                  </h2>
                </div>
                <div className="divide-y divide-stone-200">
                  {studentAttendance.map((att) => (
                    <div
                      key={att.id}
                      className="p-4 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{att.date}</div>
                        <div className="text-slate-600">
                          {att.remarks || 'যথাসময়ে জামাতে উপস্থিত'}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md font-semibold ${
                          att.status === 'present'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : att.status === 'late'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : att.status === 'leave'
                                ? 'bg-sky-50 text-sky-900 border border-sky-200'
                                : 'bg-red-50 text-red-900 border border-red-200'
                        }`}
                      >
                        {ATTENDANCE_STATUS_LABEL_BN[att.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200">
                  <h2 className="text-sm font-bold text-slate-900">
                    আবাসিক ছুটির আবেদন ও অনুমোদন ইতিহাস ({studentLeaves.length})
                  </h2>
                </div>
                <div className="divide-y divide-stone-200">
                  {studentLeaves.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500">
                      কোনো আবাসিক ছুটির রেকর্ড নেই।
                    </div>
                  ) : (
                    studentLeaves.map((lv) => (
                      <div key={lv.id} className="p-4 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{lv.reason}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold uppercase">
                            {lv.status}
                          </span>
                        </div>
                        <div className="font-mono text-slate-500">
                          প্রস্থান: {lv.departureDate} · প্রত্যাবর্তন: {lv.expectedReturnDate}
                        </div>
                        <div className="text-slate-600">অভিভাবক এস্কর্ট: {lv.accompaniedBy}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC PROGRESS & PRINTABLE REPORT CARD */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {officialStudentMarksheetRow && studentExams.length > 0 && (
            <OfficialIndividualMarksheet
              row={officialStudentMarksheetRow}
              settings={INITIAL_SETTINGS}
              policy={matchedExamSetup.gradingPolicy}
              lang={language}
            />
          )}

          {/* Printable Report Card & Marksheet Container */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <div className="text-xs font-semibold text-emerald-800">
                  উম্মুল কুরআন ক্যাডেট মাদ্রাসা · একাডেমিক ট্রান্সক্রিপ্ট ও প্রোগ্রেস রিপোর্ট
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  বিষয়ভিত্তিক নম্বরপত্র ও মূল্যায়ন চার্ট ({activeStudent.nameBn})
                </h2>
                <p className="text-xs text-slate-500">
                  দাখেলা: {activeStudent.admissionNo} · জামাত: {activeStudent.className} · শিক্ষাবর্ষ: ২০২৬-২০২৭
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handleDownloadMarksheetCsv}
                  className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>মার্কশিট CSV ডাউনলোড</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>রিপোর্ট কার্ড প্রিন্ট / PDF</span>
                </button>
              </div>
            </div>

            {/* Subject-wise Marks Table & Visual Progress Bars */}
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-slate-600">
                    <th className="py-2.5 px-3 text-start font-semibold">পরীক্ষার নাম</th>
                    <th className="py-2.5 px-3 text-start font-semibold">বিষয় / কিতাব</th>
                    <th className="py-2.5 px-3 text-end font-semibold">প্রাপ্ত নম্বর</th>
                    <th className="py-2.5 px-3 text-end font-semibold">পূর্ণমান</th>
                    <th className="py-2.5 px-3 text-start font-semibold">অগ্রগতি সূচক</th>
                    <th className="py-2.5 px-3 text-end font-semibold">গ্রেড (বেফাক/ক্যাডেট)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {examAnalytics.publishedExams.map((ex) => {
                    const pct = Math.round(
                      (ex.marksObtained / Math.max(1, ex.fullMarks)) * 100
                    );
                    return (
                      <tr key={ex.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-3 text-slate-700">{ex.examName}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{ex.subjectName}</td>
                        <td className="py-3 px-3 text-end font-mono font-bold text-slate-900">
                          {ex.marksObtained}
                        </td>
                        <td className="py-3 px-3 text-end font-mono text-slate-500">
                          {ex.fullMarks}
                        </td>
                        <td className="py-3 px-3 w-44">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0B3B2E] rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-600 w-9 text-end">
                              {pct}%
                            </span>
                          </div>
                        </td>
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
                      সর্বমোট ফলাফল ও গড় গ্রেড
                    </td>
                    <td className="py-3 px-3 text-end font-mono">
                      {examAnalytics.totalObtained}
                    </td>
                    <td className="py-3 px-3 text-end font-mono">
                      {examAnalytics.totalFullMarks}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-900">
                      গড়: {examAnalytics.averagePercentage}%
                    </td>
                    <td className="py-3 px-3 text-end font-mono text-emerald-900">
                      {examAnalytics.overallGrade}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Strengths, Improvement Areas & Teacher Learning Goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="text-xs font-bold text-emerald-950">
                  শক্তিশালী দিক (Strengths · ≥80%)
                </div>
                {examAnalytics.strengths.length > 0 ? (
                  <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside">
                    {examAnalytics.strengths.map((s) => (
                      <li key={s.id}>
                        {s.subjectName} ({s.marksObtained}/{s.fullMarks})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-800">নিয়মিত অনুশীলন অব্যাহত রাখুন।</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="text-xs font-bold text-amber-950">
                  বিশেষ যত্নের ক্ষেত্র (Areas for Improvement)
                </div>
                {examAnalytics.needsImprovement.length > 0 ? (
                  <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                    {examAnalytics.needsImprovement.map((s) => (
                      <li key={s.id}>
                        {s.subjectName} ({s.marksObtained}/{s.fullMarks})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-amber-900">
                    মাশাআল্লাহ, সকল বিষয়ে সন্তোষজনক মান বজায় রয়েছে।
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900">
                  উস্তাযের সুপারিশ ও পরবর্তী লক্ষ্য (Learning Goals)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeStudent.department === 'hifz'
                    ? 'প্রতিদিন অন্তত ১ পারা মনযিল তিলাওয়াত নির্ভুল তাজবীদসহ সম্পন্ন করা এবং মুতাশাবিহাত আয়াতসমূহ চিহ্নিত করে মাশক করা।'
                    : activeStudent.department === 'qawmi'
                      ? 'নাহু ও সরফের কাওয়ায়েদ কুরআনের আয়াত ও হাদীসের ইবারতে প্রয়োগ করার অনুশীলন বাড়ানো।'
                      : 'আরবি ও ইংরেজি ব্যাকরণের পাশাপাশি গণিতের সৃজনশীল সমস্যা প্রতিদিন অন্তত ৫টি করে সমাধান করা।'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY STUDY DIARY & HOMEWORK TRACKER */}
      {activeTab === 'diary' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                দৈনিক পাঠ ডায়েরি, হোমওয়ার্ক ও উস্তাযের মূল্যায়ন
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                শ্রেণীকক্ষে পঠিত সবক, নির্ধারিত হোমওয়ার্ক, জমা দেওয়ার শেষ তারিখ এবং উস্তাযের ফিডব্যাক
              </p>
            </div>
            {isStaffOrAdmin && (
              <button
                type="button"
                onClick={() => setShowAddDiaryForm((prev) => !prev)}
                className="px-3.5 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ডায়েরি ও হোমওয়ার্ক যোগ করুন</span>
              </button>
            )}
          </div>

          {diarySaveMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
              {diarySaveMsg}
            </div>
          )}

          {/* Staff/Teacher Form to Add Study Diary Entry */}
          {isStaffOrAdmin && showAddDiaryForm && (
            <form
              onSubmit={handleCreateDiarySubmit}
              className="bg-white border border-stone-200 rounded-xl p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900">
                শিক্ষার্থীর জন্য নতুন পাঠ ডায়েরি এন্ট্রি ({activeStudent.nameBn})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={diaryDate}
                    onChange={(e) => setDiaryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিষয় / কিতাব *
                  </label>
                  <input
                    type="text"
                    required
                    value={diarySubject}
                    onChange={(e) => setDiarySubject(e.target.value)}
                    placeholder="যেমন: হিফযুল কুরআন / নাহমীর / গণিত"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    জমার শেষ তারিখ (Due Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={diaryDueDate}
                    onChange={(e) => setDiaryDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    আজকের পঠিত পাঠ (Lesson Covered) *
                  </label>
                  <input
                    type="text"
                    required
                    value={diaryLesson}
                    onChange={(e) => setDiaryLesson(e.target.value)}
                    placeholder="ক্লাসে যা পড়ানো হয়েছে"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নির্ধারিত হোমওয়ার্ক ও মুরাজায়াত *
                  </label>
                  <input
                    type="text"
                    required
                    value={diaryHomework}
                    onChange={(e) => setDiaryHomework(e.target.value)}
                    placeholder="বাড়ির কাজ বা মুখস্থ করার নির্দেশনা"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শিখন লক্ষ্যমাত্রা (Learning Goal)
                  </label>
                  <input
                    type="text"
                    value={diaryLearningGoal}
                    onChange={(e) => setDiaryLearningGoal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    উস্তাযের মন্তব্য / ফিডব্যাক
                  </label>
                  <input
                    type="text"
                    value={diaryFeedback}
                    onChange={(e) => setDiaryFeedback(e.target.value)}
                    placeholder="শিক্ষার্থীর মনোযোগ ও অগ্রগতির নোট"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diaryVisibleToGuardian}
                    onChange={(e) => setDiaryVisibleToGuardian(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  <span>অভিভাবক ও শিক্ষার্থীর জন্য দৃশ্যমান (আনচেক করলে অভ্যন্তরীণ নোট)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDiaryForm(false)}
                  className="px-3.5 py-2 text-xs font-semibold bg-stone-100 text-slate-700 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0B3B2E] text-white rounded-lg cursor-pointer"
                >
                  ডায়েরি সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* Study Diary Cards List */}
          <div className="space-y-4">
            {visibleDiary.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {entry.subjectName}
                      </span>
                      {!entry.visibleToGuardian && (
                        <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[11px] font-semibold text-red-800">
                          অভ্যন্তরীণ স্টাফ নোট (Internal Only)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      পাঠের তারিখ: {entry.date} · জমার শেষ তারিখ: {entry.dueDate} · লক্ষ্য:{' '}
                      {entry.learningGoal}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleDiaryCompletion(
                          entry.id,
                          entry.completionStatus === 'pending' ? 'completed' : 'pending'
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        entry.completionStatus === 'pending'
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {entry.completionStatus === 'pending'
                          ? 'অপেক্ষমাণ — সম্পন্ন হিসেবে চিহ্নিত করুন'
                          : 'হোমওয়ার্ক সম্পন্ন হয়েছে'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <div className="font-bold text-slate-800 mb-1">
                      শ্রেণীকক্ষে পঠিত সবক (Lesson Covered):
                    </div>
                    <p className="text-slate-700 leading-relaxed">{entry.lessonCovered}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                    <div className="font-bold text-emerald-950 mb-1">
                      নির্ধারিত রিভিশন ও হোমওয়ার্ক (Assigned Homework):
                    </div>
                    <p className="text-emerald-900 leading-relaxed">{entry.homeworkAssigned}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1">
                  <strong>উস্তাযের মূল্যায়ন ও পরামর্শ:</strong> “{entry.teacherFeedback}”
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MADRASA-SPECIFIC LEARNING (DEPARTMENT-SCOPED) */}
      {activeTab === 'madrasa_learning' && (
        <div className="space-y-6">
          {activeStudent.department === 'hifz' && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800">
                      হিফযুল কুরআন বিভাগ · বিশেষায়িত সবক ট্র্যাকার
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      সবক (Sabaq), সবকি (Sabqi), মনযিল (Manzil) ও তাজবীদ মূল্যায়ন
                    </h2>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950 font-mono">
                    বর্তমান চলমান পারা: {latestHifz?.paraNumber || 18} / ৩০
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">সর্বশেষ নতুন সবক (Sabaq)</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {latestHifz?.sabaqSurahAndAyat || 'সূরা আল-কাহফ (আয়াত ১-১৫)'}
                  </div>
                  <div className="mt-1 text-xs font-mono text-emerald-800">
                    {latestHifz?.sabaqLines || 15} লাইন মুখস্থ সম্পন্ন
                  </div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">সর্বশেষ সবকি (Sabqi - পশ্চাৎ পাঠ)</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {latestHifz?.sabqiPara || '১৮ তম পারা (প্রথম অর্ধেক)'}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">উস্তাযের নিকট তিলাওয়াতকৃত</div>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">মনযিল (Manzil) ও তাজবীদ গ্রেড</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    মনযিল: {latestHifz?.manzilPara || '১৭ তম পারা পূর্ণ'}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-emerald-800">
                    তাজবীদ মান: {latestHifz?.tajweedRating || 'mumtaz'}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    হিফয মুরাজায়াত ও তাজবীদ মূল্যায়ন ইতিহাস ({studentHifz.length})
                  </h3>
                </div>
                <div className="divide-y divide-stone-200">
                  {studentHifz.map((log) => (
                    <div key={log.id} className="p-4 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          তারিখ: {log.date} · পারা {log.paraNumber}/30
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                          তাজবীদ: {log.tajweedRating}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                        <div>
                          <strong>সবক:</strong> {log.sabaqSurahAndAyat} ({log.sabaqLines} লাইন)
                        </div>
                        <div>
                          <strong>সবকি:</strong> {log.sabqiPara}
                        </div>
                        <div>
                          <strong>মনযিল:</strong> {log.manzilPara}
                        </div>
                      </div>
                      <div className="text-slate-600 italic">
                        উস্তাযের মন্তব্য: “{log.teacherComment}”
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStudent.department === 'qawmi' && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-800">
                  কওমি কিতাব বিভাগ · দরসে নিযামী পাঠ্যক্রম ট্র্যাকার
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  নাহু, সরফ, ফিকহ, হাদীস ও আরবি সাহিত্য অগ্রগতি ({activeStudent.className})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  {
                    subject: 'নাহু (Nahw — নাহমীর ও তারকীব)',
                    book: 'নাহমীর ও শরহে মিআতে আমেল',
                    status: 'মুরাক্কাবাত ও মুআরাব-মাবনী অধ্যায় সম্পন্ন (৮৬%)',
                    focus: 'কুরআনের আয়াতের তারকীব ও ইরাব বিশ্লেষণ অনুশীলন',
                  },
                  {
                    subject: 'সরফ (Sarf — মীযানুস সরফ ও মুনশাইব)',
                    book: 'মীযানুস সরফ ও পাঞ্জেগাঞ্জ',
                    status: 'সপ্তবিধ ক্রিয়াপদ ও বাবসমূহের গর্দান সম্পন্ন (৭৮%)',
                    focus: 'ফেলে মুযারি ও আমরের সিগাহ দ্রুত নির্ণয়ের মাশক',
                  },
                  {
                    subject: 'ফিকহ (Fiqh — নূরুল ঈযাহ ও কুদূরী)',
                    book: 'নূরুল ঈযাহ',
                    status: 'কিতাবুত তাহারাত ও সালাত অধ্যায় চলমান (৯০%)',
                    focus: 'সুন্নাত ও ওয়াজিবের দলীলভিত্তিক মাসায়েল মুখস্থকরণ',
                  },
                  {
                    subject: 'হাদীস ও আরবি সাহিত্য (Hadith & Arabic)',
                    book: 'যাদুত তালিবীন ও এসো আরবি শিখি',
                    status: 'নির্বাচিত ১০০ হাদীস হিফয ও আরবি ইনশা অনুশীলন (৯২%)',
                    focus: 'প্রতিদিন ১০টি নতুন আরবি বাক্য গঠন ও কথোপকথন',
                  },
                ].map((item) => (
                  <div
                    key={item.subject}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5"
                  >
                    <div className="font-bold text-slate-900">{item.subject}</div>
                    <div className="text-emerald-800 font-semibold">নির্ধারিত কিতাব: {item.book}</div>
                    <div className="text-slate-700">অগ্রগতি: {item.status}</div>
                    <div className="text-slate-500">বিশেষ অনুশীলন: {item.focus}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStudent.department === 'general' && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-800">
                  জেনারেল ক্যাডেট বিভাগ · সমন্বিত জাতীয় ও মাদ্রাসা শিক্ষাক্রম
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  গণিত, ইংরেজি, আরবি ও ইসলাম শিক্ষা অগ্রগতি ({activeStudent.className})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  {
                    subject: 'সাধারণ গণিত (Mathematics)',
                    syllabus: 'বীজগণিতীয় রাশি, উৎপাদক বিশ্লেষণ ও জ্যামিতি উপপাদ্য ১–৪',
                    progress: '৮৪% সম্পন্ন · সাপ্তাহিক কুইজ গড় ৮৪/১০০',
                  },
                  {
                    subject: 'ইংরেজি ভাষা ও ব্যাকরণ (English)',
                    syllabus: 'Tense, Voice Change, Narration & Academic Paragraph Writing',
                    progress: '৭৯% সম্পন্ন · স্পোকেন ইংলিশ সেশন নিয়মিত',
                  },
                  {
                    subject: 'আল-লুগাতুল আরাবিয়্যাহ (Arabic)',
                    syllabus: 'আরবি শব্দভাণ্ডার, তারকীব ও প্রাত্যহিক কথোপকথন',
                    progress: '৮৮% সম্পন্ন · উচ্চারণ ও লিখন মান উত্তম',
                  },
                  {
                    subject: 'আল-কুরআন ও ইসলাম শিক্ষা (Islamic Studies)',
                    syllabus: 'নির্বাচিত সূরা তাজবীদসহ হিফয, আকাইদ ও সীরাতুন্নবী (সা.)',
                    progress: '৯২% সম্পন্ন · আমলিয়াত ও আদব মূল্যায়ন: মুমতায',
                  },
                ].map((item) => (
                  <div
                    key={item.subject}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5"
                  >
                    <div className="font-bold text-slate-900">{item.subject}</div>
                    <div className="text-slate-700">সিলেবাস: {item.syllabus}</div>
                    <div className="text-emerald-800 font-semibold">{item.progress}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ROUTINE, SYLLABUS, RESOURCES & STUDENT PROFILE */}
      {activeTab === 'routine_resources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Exam Routine & Approved Learning Resources */}
            <div className="lg:col-span-7 space-y-6">
              {/* Upcoming Exam Routine */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    দ্বিতীয় সাময়িক পরীক্ষার সময়সূচী ২০২৬ (Exam Routine)
                  </h2>
                </div>
                <div className="divide-y divide-stone-200">
                  {UPCOMING_EXAM_SCHEDULE.map((row) => (
                    <div
                      key={row.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#0B3B2E]">
                          {row.date} ({row.dayBn}) · {row.time}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">{row.subjectBn}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-stone-100 text-slate-700 font-medium self-start sm:self-center">
                        {row.hallBn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Learning Resources */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    মাদ্রাসা অনুমোদিত পাঠ সহায়িকা ও রিসোর্স ({departmentResources.length})
                  </h2>
                </div>
                <div className="divide-y divide-stone-200">
                  {departmentResources.map((res) => (
                    <div key={res.referenceCode} className="p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{res.titleBn}</span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                          {res.referenceCode}
                        </span>
                      </div>
                      <div className="text-slate-600">{res.summaryBn}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Student Profile & Hostel Info + Notifications Feed */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <Home className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    শিক্ষার্থী প্রোফাইল ও দারুল ইকামা (হোস্টেল) তথ্য
                  </h2>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-500">দাখেলা নম্বর</dt>
                    <dd className="font-mono font-bold text-slate-900 mt-0.5">
                      {activeStudent.admissionNo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">রক্তের গ্রুপ ও জন্মতারিখ</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {activeStudent.bloodGroup} ({activeStudent.dateOfBirth})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">আবাসিক ভবন ও কক্ষ</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {activeStudent.dormitoryRoom}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">অভিভাবকের নাম ও সম্পর্ক</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {activeStudent.guardianName} ({activeStudent.guardianRelation})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">জরুরি যোগাযোগ</dt>
                    <dd className="font-mono font-semibold text-slate-900 mt-0.5">
                      {activeStudent.guardianPhone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">ভর্তির তারিখ</dt>
                    <dd className="font-mono text-slate-900 mt-0.5">
                      {activeStudent.admissionDate}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Notifications Feed */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-stone-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0B3B2E]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    একাডেমিক নোটিফিকেশন ফিড ({relevantNotices.length})
                  </h2>
                </div>
                <div className="divide-y divide-stone-200">
                  {relevantNotices.map((n) => (
                    <div key={n.id} className="p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{n.titleBn}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {n.publishDate}
                        </span>
                      </div>
                      <p className="text-slate-600">{n.contentBn}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
