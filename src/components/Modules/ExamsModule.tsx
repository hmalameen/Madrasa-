import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import type {
  Department,
  ExamAuditLog,
  ExaminationSetup,
  ExamResult,
  ExamSubjectConfig,
  ExamWorkflowStatus,
  InstitutionSettings,
  Language,
  Student,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  INITIAL_EXAM_AUDIT_LOGS,
  INITIAL_EXAM_SETUPS,
  INITIAL_SETTINGS,
} from '../../data/initialSeedData';
import {
  calculateMadrasaGrade,
  canPerformExamWorkflowAction,
  computeClassTabulationSheet,
  DEFAULT_MADRASA_GRADING_POLICY,
  evaluateSubjectMarks,
  formatNum,
  generateCsvContent,
  resolveExamWorkflowStatus,
  validateAndPreviewMarksImport,
  validateExaminationSetup,
  type MarksImportPreviewResult,
  type RawImportMarkRow,
} from '../../utils/madrasaLogic';
import { StudentPhotoAvatar } from '../StudentPhotoUploader';
import {
  downloadBulkClassMarksheetsPdf,
  downloadClassTabulationPdf,
  OfficialIndividualMarksheet,
} from '../OfficialExamDocuments';

interface ExamsModuleProps {
  language: Language;
  role: UserRole;
  students: Student[];
  exams: ExamResult[];
  settings?: InstitutionSettings;
  examSetups?: ExaminationSetup[];
  examAuditLogs?: ExamAuditLog[];
  actorUid?: string;
  actorName?: string;
  onAddExamResult: (
    result: Omit<ExamResult, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ) => Promise<boolean>;
  onTogglePublishExam: (examId: string, isPublished: boolean) => Promise<boolean>;
  onBulkUpsertExamResults?: (
    results: Array<
      Omit<ExamResult, 'id' | 'authorId' | 'createdAt' | 'updatedAt'> & {
        id?: string;
      }
    >
  ) => Promise<boolean>;
  onSaveExamSetup?: (setup: ExaminationSetup) => Promise<boolean>;
  onRecordExamAuditLog?: (
    log: Omit<ExamAuditLog, 'id' | 'timestamp'>
  ) => Promise<void>;
}

type ExamWorkspaceTab =
  | 'bulk_entry'
  | 'workflow_publish'
  | 'class_sheet'
  | 'official_marksheet'
  | 'setup_audit';

interface DraftCellInput {
  marksStr: string;
  isAbsent: boolean;
  remarks: string;
  dirty: boolean;
}

export function ExamsModule({
  language,
  role,
  students,
  exams,
  settings = INITIAL_SETTINGS,
  examSetups: propSetups,
  examAuditLogs: propAuditLogs,
  actorUid = 'usr-current',
  actorName = 'অনুমোদিত ব্যবহারকারী',
  onAddExamResult,
  onTogglePublishExam,
  onBulkUpsertExamResults,
  onSaveExamSetup,
  onRecordExamAuditLog,
}: ExamsModuleProps) {
  const t = TRANSLATIONS[language];
  const canEditMarks = ['super_admin', 'muhtamim', 'teacher'].includes(role);
  const canPublishOrApprove = ['super_admin', 'muhtamim'].includes(role);

  const [localSetups, setLocalSetups] = useState<ExaminationSetup[]>(
    propSetups && propSetups.length > 0 ? propSetups : INITIAL_EXAM_SETUPS
  );
  const [localAuditLogs, setLocalAuditLogs] = useState<ExamAuditLog[]>(
    propAuditLogs ?? []
  );

  const activeSetups = propSetups && propSetups.length > 0 ? propSetups : localSetups;
  const activeAuditLogs = propAuditLogs ?? localAuditLogs;

  const [activeTab, setActiveTab] = useState<ExamWorkspaceTab>('bulk_entry');

  // Shared context selectors
  const [selectedSetupId, setSelectedSetupId] = useState<string>(
    activeSetups[0]?.id || 'exm-cfg-2026-hifz'
  );
  const currentSetup = useMemo(
    () =>
      activeSetups.find((s) => s.id === selectedSetupId) ||
      activeSetups[0] ||
      INITIAL_EXAM_SETUPS[0],
    [activeSetups, selectedSetupId]
  );

  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(
    currentSetup.subjects[0]?.subjectName || ''
  );

  // Keep selectedSubjectName synced when setup changes
  const activeSubjectConfig: ExamSubjectConfig = useMemo(() => {
    const found = currentSetup.subjects.find(
      (sub) => sub.subjectName === selectedSubjectName
    );
    return (
      found ||
      currentSetup.subjects[0] || {
        subjectCode: 'SUB-101',
        subjectName: 'হিফযুল কুরআন (পূর্ণ ৩০ পারা তিলাওয়াত ও তাজবীদ)',
        maxMarks: 100,
        passMarks: 40,
      }
    );
  }, [currentSetup, selectedSubjectName]);

  // Bulk Entry local state
  const [draftCells, setDraftCells] = useState<Record<string, DraftCellInput>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'roll' | 'name' | 'marks'>('roll');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // Quick single-add modal (preserved from Phase 7/8 for backward compatibility)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [quickExamName, setQuickExamName] = useState(
    'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬ (2nd Term)'
  );
  const [quickSubjectName, setQuickSubjectName] = useState(
    'হিফযুল কুরআন (পূর্ণ ৩০ পারা তিলাওয়াত ও তাজবীদ)'
  );
  const [quickMarksObtained, setQuickMarksObtained] = useState(88);
  const [quickFullMarks, setQuickFullMarks] = useState(100);
  const [quickIsPublished, setQuickIsPublished] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Excel / CSV Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawRows, setImportRawRows] = useState<RawImportMarkRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [allowUpdateDrafts, setAllowUpdateDrafts] = useState(true);
  const [importReport, setImportReport] = useState<{
    importedCount: number;
    skippedCount: number;
    failedCount: number;
  } | null>(null);

  // Workflow & Correction state
  const [workflowFilter, setWorkflowFilter] = useState<
    'all' | ExamWorkflowStatus
  >('all');
  const [returnReasonModal, setReturnReasonModal] = useState<{
    examId: string;
    studentName: string;
    subjectName: string;
  } | null>(null);
  const [returnReasonText, setReturnReasonText] = useState('');

  const [correctionModal, setCorrectionModal] = useState<ExamResult | null>(null);
  const [correctedMarksValue, setCorrectedMarksValue] = useState<number>(0);
  const [correctedIsAbsent, setCorrectedIsAbsent] = useState<boolean>(false);
  const [correctionReasonText, setCorrectionReasonText] = useState('');

  // Official Marksheet selected student state
  const [marksheetStudentId, setMarksheetStudentId] = useState<string>('');
  const [isGeneratingBulkPdf, setIsGeneratingBulkPdf] = useState(false);

  // Exam Setup form state
  const [newSetupExamName, setNewSetupExamName] = useState(
    'বার্ষিক চূড়ান্ত পরীক্ষা ২০২৬ (Annual Final Exam)'
  );
  const [newSetupYear, setNewSetupYear] = useState('2026-2027');
  const [newSetupDept, setNewSetupDept] = useState<Department>('hifz');
  const [newSetupClass, setNewSetupClass] = useState('হিফয তাকমীল (খতম বর্ষ)');
  const [newSetupSection, setNewSetupSection] = useState('ক-শাখা (Main)');
  const [newSetupDate, setNewSetupDate] = useState('2026-11-20');
  const [newSetupPubDate, setNewSetupPubDate] = useState('2026-12-05');
  const [newSetupInstructions, setNewSetupInstructions] = useState(
    'সকল বিষয়ে পাস নম্বর অর্জন আবশ্যক। অনুপস্থিত শিক্ষার্থীদের নম্বর শূন্য হিসেবে গণ্য না করে অনুপস্থিত (AB) হিসেবে প্রদর্শিত হবে।'
  );
  const [newSetupSubjects, setNewSetupSubjects] = useState<ExamSubjectConfig[]>([
    {
      subjectCode: 'HFZ-101',
      subjectName: 'হিফযুল কুরআন (পূর্ণ ৩০ পারা তিলাওয়াত ও তাজবীদ)',
      maxMarks: 100,
      passMarks: 40,
      isOptional: false,
    },
    {
      subjectCode: 'HFZ-102',
      subjectName: 'তাজবীদ ও মাখরাজ (Tajweed & Makharij)',
      maxMarks: 100,
      passMarks: 40,
      isOptional: false,
    },
  ]);
  const [enableGpaPolicy, setEnableGpaPolicy] = useState(true);
  const [enableRankPolicy, setEnableRankPolicy] = useState(true);
  const [failIfAnyFailedPolicy, setFailIfAnyFailedPolicy] = useState(true);

  const appendAuditLog = async (
    entry: Omit<ExamAuditLog, 'id' | 'timestamp'>
  ) => {
    const newLog: ExamAuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('en-GB'),
    };
    setLocalAuditLogs((prev) => [newLog, ...prev]);
    if (onRecordExamAuditLog) {
      await onRecordExamAuditLog(entry);
    }
  };

  // Students belonging to the currently selected setup's class
  const classStudents = useMemo(() => {
    const matched = students.filter(
      (s) =>
        s.className.trim() === currentSetup.className.trim() &&
        s.status === 'active'
    );
    return matched.length > 0 ? matched : students.filter((s) => s.status === 'active');
  }, [students, currentSetup]);

  // Existing exam records for the selected exam + academicYear + class + subject
  const subjectExamMap = useMemo(() => {
    const map = new Map<string, ExamResult>();
    for (const ex of exams) {
      if (
        ex.examName.trim() === currentSetup.examName.trim() &&
        ex.academicYear.trim() === currentSetup.academicYear.trim() &&
        ex.subjectName.trim().toLowerCase() ===
          activeSubjectConfig.subjectName.trim().toLowerCase()
      ) {
        map.set(ex.studentId, ex);
      }
    }
    return map;
  }, [exams, currentSetup, activeSubjectConfig]);

  // Combined rows for the Bulk Marks Entry Table
  const bulkEntryRows = useMemo(() => {
    const rows = classStudents.map((stu) => {
      const existing = subjectExamMap.get(stu.id);
      const cellKey = `${currentSetup.id}::${activeSubjectConfig.subjectName}::${stu.id}`;
      const draft = draftCells[cellKey];

      const isAbsent = draft
        ? draft.isAbsent
        : Boolean(existing?.isAbsent);
      const marksStr = draft
        ? draft.marksStr
        : existing
        ? existing.isAbsent
          ? ''
          : String(existing.marksObtained)
        : '';
      const remarks = draft
        ? draft.remarks
        : existing?.remarks || '';

      const parsedMarks =
        isAbsent || marksStr.trim() === '' ? null : Number(marksStr);

      const evaluation = evaluateSubjectMarks({
        subjectName: activeSubjectConfig.subjectName,
        subjectCode: activeSubjectConfig.subjectCode,
        maxMarks: activeSubjectConfig.maxMarks,
        passMarks: activeSubjectConfig.passMarks,
        marksObtained: parsedMarks,
        isAbsent,
        remarks,
        workflowStatus: existing ? resolveExamWorkflowStatus(existing) : 'draft',
        examResultId: existing?.id,
        policy: currentSetup.gradingPolicy,
      });

      return {
        student: stu,
        existing,
        cellKey,
        marksStr,
        isAbsent,
        remarks,
        dirty: Boolean(draft?.dirty),
        evaluation,
        workflowStatus: existing
          ? resolveExamWorkflowStatus(existing)
          : ('unentered' as const),
      };
    });

    const filtered = rows.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        r.student.nameBn.toLowerCase().includes(q) ||
        r.student.nameEn.toLowerCase().includes(q) ||
        r.student.admissionNo.toLowerCase().includes(q) ||
        String(r.student.rollNo).includes(q)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.student.nameBn.localeCompare(b.student.nameBn);
      }
      if (sortBy === 'marks') {
        const mA = a.evaluation.marksObtained ?? -1;
        const mB = b.evaluation.marksObtained ?? -1;
        return mB - mA;
      }
      return a.student.rollNo - b.student.rollNo;
    });
  }, [
    classStudents,
    subjectExamMap,
    currentSetup,
    activeSubjectConfig,
    draftCells,
    searchQuery,
    sortBy,
  ]);

  // Summary counts for Bulk Entry
  const bulkMetrics = useMemo(() => {
    const total = bulkEntryRows.length;
    const entered = bulkEntryRows.filter(
      (r) =>
        r.evaluation.status === 'passed' ||
        r.evaluation.status === 'failed' ||
        r.evaluation.status === 'absent'
    ).length;
    const unentered = bulkEntryRows.filter(
      (r) => r.evaluation.status === 'unentered'
    ).length;
    const absent = bulkEntryRows.filter((r) => r.isAbsent).length;
    const invalid = bulkEntryRows.filter(
      (r) => r.evaluation.status === 'invalid'
    ).length;
    const dirtyCount = bulkEntryRows.filter((r) => r.dirty).length;
    return { total, entered, unentered, absent, invalid, dirtyCount };
  }, [bulkEntryRows]);

  // Full Class Tabulation rows for the currently selected setup
  const tabulationRows = useMemo(
    () => computeClassTabulationSheet(students, exams, currentSetup),
    [students, exams, currentSetup]
  );

  // Import preview calculation
  const importPreview: MarksImportPreviewResult | null = useMemo(() => {
    if (importRawRows.length === 0) return null;
    return validateAndPreviewMarksImport(
      importRawRows,
      classStudents,
      exams,
      {
        examName: currentSetup.examName,
        academicYear: currentSetup.academicYear,
        className: currentSetup.className,
        subjectName: activeSubjectConfig.subjectName,
        maxMarks: activeSubjectConfig.maxMarks,
        passMarks: activeSubjectConfig.passMarks,
        allowUpdateDrafts,
        policy: currentSetup.gradingPolicy,
      }
    );
  }, [
    importRawRows,
    classStudents,
    exams,
    currentSetup,
    activeSubjectConfig,
    allowUpdateDrafts,
  ]);

  const handleCellChange = (
    cellKey: string,
    patch: Partial<DraftCellInput>,
    defaults: { marksStr: string; isAbsent: boolean; remarks: string }
  ) => {
    setDraftCells((prev) => {
      const current = prev[cellKey] || { ...defaults, dirty: false };
      const next: DraftCellInput = {
        ...current,
        ...patch,
        dirty: true,
      };
      if (patch.isAbsent === true) {
        next.marksStr = '';
      }
      return { ...prev, [cellKey]: next };
    });
  };

  const upsertBatchRecords = async (
    records: Array<
      Omit<ExamResult, 'id' | 'authorId' | 'createdAt' | 'updatedAt'> & {
        id?: string;
      }
    >
  ): Promise<boolean> => {
    if (onBulkUpsertExamResults) {
      return onBulkUpsertExamResults(records);
    }
    let allOk = true;
    for (const rec of records) {
      const { id: _unusedId, ...rest } = rec;
      const ok = await onAddExamResult(rest);
      if (!ok) allOk = false;
    }
    return allOk;
  };

  const handleSaveBulkMarks = async (targetWorkflowStatus: ExamWorkflowStatus) => {
    const actionType =
      targetWorkflowStatus === 'published'
        ? 'publish'
        : targetWorkflowStatus === 'submitted_for_review'
        ? 'submit_for_review'
        : 'save_draft';

    const perm = canPerformExamWorkflowAction(role, actionType, 'draft');
    if (!perm.allowed) {
      setStatusBanner({
        type: 'error',
        message: perm.reasonBn || 'আপনার এই কার্যক্রম সম্পাদনের অনুমতি নেই।',
      });
      return;
    }

    if (bulkMetrics.invalid > 0) {
      setStatusBanner({
        type: 'error',
        message: `টেবিলে ${bulkMetrics.invalid} টি সারিতে অবৈধ নম্বর রয়েছে। সংরক্ষণ করার পূর্বে ০ থেকে ${activeSubjectConfig.maxMarks}-এর মধ্যে সঠিক নম্বর প্রদান করুন।`,
      });
      return;
    }

    const rowsToSave = bulkEntryRows.filter(
      (r) =>
        r.evaluation.status === 'passed' ||
        r.evaluation.status === 'failed' ||
        r.evaluation.status === 'absent'
    );

    if (rowsToSave.length === 0) {
      setStatusBanner({
        type: 'error',
        message: 'সংরক্ষণ করার মতো কোনো এন্ট্রিকৃত নম্বর বা অনুপস্থিত স্ট্যাটাস পাওয়া যায়নি।',
      });
      return;
    }

    setIsSavingBulk(true);
    setStatusBanner(null);
    try {
      const payload = rowsToSave.map((r) => {
        const isPublished = targetWorkflowStatus === 'published';
        return {
          id: r.existing?.id,
          examName: currentSetup.examName,
          academicYear: currentSetup.academicYear,
          studentId: r.student.id,
          studentNameBn: r.student.nameBn,
          admissionNo: r.student.admissionNo,
          className: currentSetup.className,
          sectionName: currentSetup.sectionName,
          department: r.student.department,
          subjectCode: activeSubjectConfig.subjectCode,
          subjectName: activeSubjectConfig.subjectName,
          marksObtained: r.isAbsent ? 0 : (r.evaluation.marksObtained ?? 0),
          fullMarks: activeSubjectConfig.maxMarks,
          passMarks: activeSubjectConfig.passMarks,
          isAbsent: r.isAbsent,
          remarks: r.remarks.trim(),
          gpaPoint: r.evaluation.gpaPoint ?? 0,
          grade: r.evaluation.gradeLabel,
          isPublished,
          workflowStatus: targetWorkflowStatus,
          submittedByUid:
            targetWorkflowStatus === 'submitted_for_review'
              ? actorUid
              : r.existing?.submittedByUid,
          submittedAt:
            targetWorkflowStatus === 'submitted_for_review'
              ? new Date().toISOString().slice(0, 10)
              : r.existing?.submittedAt,
          publishedByUid: isPublished ? actorUid : r.existing?.publishedByUid,
          publishedAt: isPublished
            ? new Date().toISOString().slice(0, 10)
            : r.existing?.publishedAt,
          guardianUid: r.student.guardianUid,
        };
      });

      const ok = await upsertBatchRecords(payload);
      if (ok) {
        // Clear dirty flags for saved cells
        setDraftCells((prev) => {
          const next = { ...prev };
          rowsToSave.forEach((r) => {
            delete next[r.cellKey];
          });
          return next;
        });

        await appendAuditLog({
          action:
            targetWorkflowStatus === 'published'
              ? 'result_published'
              : targetWorkflowStatus === 'submitted_for_review'
              ? 'submitted_for_review'
              : 'bulk_marks_saved',
          examName: currentSetup.examName,
          academicYear: currentSetup.academicYear,
          className: currentSetup.className,
          subjectName: activeSubjectConfig.subjectName,
          actorUid,
          actorName,
          actorRole: role,
          summaryBn: `${activeSubjectConfig.subjectName} বিষয়ে ${rowsToSave.length} জন শিক্ষার্থীর নম্বর "${
            targetWorkflowStatus === 'published'
              ? 'প্রকাশিত (Published)'
              : targetWorkflowStatus === 'submitted_for_review'
              ? 'পর্যালোচনার জন্য প্রেরিত'
              : 'খসড়া (Draft)'
          }" হিসেবে সংরক্ষিত হয়েছে।`,
          affectedCount: rowsToSave.length,
        });

        setStatusBanner({
          type: 'success',
          message: `সফলভাবে ${rowsToSave.length} জন শিক্ষার্থীর ফলাফল "${
            targetWorkflowStatus === 'published'
              ? 'প্রকাশিত (Published)'
              : targetWorkflowStatus === 'submitted_for_review'
              ? 'পর্যালোচনার জন্য প্রেরিত'
              : 'খসড়া (Draft)'
          }" হিসেবে সংরক্ষণ করা হয়েছে।`,
        });
      }
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Download Excel (.xlsx) or CSV sample template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'Student ID',
      'Student Name',
      'Roll No',
      'Marks Obtained (or ABS)',
      'Remarks',
    ];
    const sampleData = classStudents.map((stu, idx) => [
      stu.admissionNo,
      stu.nameBn,
      String(stu.rollNo),
      idx === 0 ? '92' : idx === 1 ? '85' : 'ABS',
      idx === 0 ? 'মাশাআল্লাহ উত্তম' : idx === 1 ? 'ভালো' : 'অসুস্থতার কারণে অনুপস্থিত',
    ]);

    if (format === 'csv') {
      const csv = generateCsvContent(headers, sampleData);
      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Marks_Template_${currentSetup.academicYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks_Template');
    XLSX.writeFile(wb, `Marks_Template_${currentSetup.academicYear}.xlsx`);
  };

  // Parse uploaded Excel (.xlsx) or CSV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportReport(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      setStatusBanner({
        type: 'error',
        message: 'শুধুমাত্র .xlsx অথবা .csv ফাইল আপলোড করা যাবে।',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusBanner({
        type: 'error',
        message: 'ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারে।',
      });
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellFormula: true,
      raw: false,
    });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const aoa = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, {
      header: 1,
      defval: '',
    });

    if (aoa.length < 2) {
      setStatusBanner({
        type: 'error',
        message: 'আপলোডকৃত ফাইলে কোনো শিক্ষার্থীর সারি পাওয়া যায়নি।',
      });
      return;
    }

    const parsedRows: RawImportMarkRow[] = [];
    for (let i = 1; i < aoa.length; i += 1) {
      const row = aoa[i];
      if (!row || row.every((c) => String(c).trim() === '')) continue;
      const cellRefMarks = XLSX.utils.encode_cell({ r: i, c: 3 });
      const rawSheetCell = sheet[cellRefMarks];
      const hasFormula = Boolean(rawSheetCell && rawSheetCell.f);

      parsedRows.push({
        rowNumber: i + 1,
        admissionNo: String(row[0] ?? '').trim(),
        studentName: String(row[1] ?? '').trim(),
        marksOrStatus: hasFormula
          ? `=${rawSheetCell.f}`
          : String(row[3] ?? row[2] ?? '').trim(),
        remarks: String(row[4] ?? '').trim(),
      });
    }

    setImportFileName(file.name);
    setImportRawRows(parsedRows);
  };

  // Load realistic sample import rows in preview (including valid, duplicate, unknown ID, and invalid marks to test preview & correction)
  const handleLoadDemoImportPreview = () => {
    setImportReport(null);
    setImportFileName('Sample_Batch_Marks_2026.xlsx');
    const firstStu = classStudents[0] || students[0];
    const secondStu = classStudents[1] || students[1] || firstStu;
    setImportRawRows([
      {
        rowNumber: 2,
        admissionNo: firstStu.admissionNo,
        studentName: firstStu.nameBn,
        marksOrStatus: '95',
        remarks: 'এক্সেল শিট হতে ইমপোর্টকৃত (মুমতায)',
      },
      {
        rowNumber: 3,
        admissionNo: firstStu.admissionNo,
        studentName: firstStu.nameBn,
        marksOrStatus: '88',
        remarks: 'ডুপ্লিকেট সারি পরীক্ষা',
      },
      {
        rowNumber: 4,
        admissionNo: 'UQCM-UNKNOWN-999',
        studentName: 'অজ্ঞাত নাম',
        marksOrStatus: '76',
        remarks: 'অজ্ঞাত স্টুডেন্ট আইডি',
      },
      {
        rowNumber: 5,
        admissionNo: secondStu.admissionNo,
        studentName: secondStu.nameBn,
        marksOrStatus: '145',
        remarks: 'পূর্ণমানের বেশি নম্বর (সংশোধনযোগ্য)',
      },
    ]);
  };

  const handleConfirmValidatedImport = async () => {
    if (!importPreview) return;
    const validRows = importPreview.rows.filter(
      (r) =>
        (r.status === 'valid_new' || r.status === 'valid_draft_update') &&
        r.matchedStudent
    );
    const skippedRows = importPreview.rows.length - validRows.length;

    if (validRows.length === 0) {
      setStatusBanner({
        type: 'error',
        message: 'ইমপোর্ট করার মতো কোনো বৈধ সারি (Valid Row) পাওয়া যায়নি।',
      });
      return;
    }

    const payload = validRows.map((r) => {
      const stu = r.matchedStudent!;
      return {
        id: r.existingExamId,
        examName: currentSetup.examName,
        academicYear: currentSetup.academicYear,
        studentId: stu.id,
        studentNameBn: stu.nameBn,
        admissionNo: stu.admissionNo,
        className: currentSetup.className,
        sectionName: currentSetup.sectionName,
        department: stu.department,
        subjectCode: activeSubjectConfig.subjectCode,
        subjectName: activeSubjectConfig.subjectName,
        marksObtained: r.isAbsent ? 0 : r.marksObtained,
        fullMarks: activeSubjectConfig.maxMarks,
        passMarks: activeSubjectConfig.passMarks,
        isAbsent: r.isAbsent,
        remarks: r.remarks,
        gpaPoint: r.computedGpa ?? 0,
        grade: r.computedGrade,
        isPublished: false,
        workflowStatus: 'draft' as ExamWorkflowStatus,
        guardianUid: stu.guardianUid,
      };
    });

    const ok = await upsertBatchRecords(payload);
    setImportReport({
      importedCount: ok ? validRows.length : 0,
      skippedCount: skippedRows,
      failedCount: ok ? 0 : validRows.length,
    });

    if (ok) {
      await appendAuditLog({
        action: 'excel_csv_imported',
        examName: currentSetup.examName,
        academicYear: currentSetup.academicYear,
        className: currentSetup.className,
        subjectName: activeSubjectConfig.subjectName,
        actorUid,
        actorName,
        actorRole: role,
        summaryBn: `এক্সেল/সিএসভি ফাইল (${importFileName}) হতে ${validRows.length} টি বৈধ রেকর্ড খসড়া হিসেবে ইমপোর্ট করা হয়েছে (${skippedRows} টি ত্রুটিপূর্ণ সারি স্কিপ করা হয়েছে)।`,
        affectedCount: validRows.length,
      });
    }
  };

  // Workflow transitions for individual or batch exam records
  const handleWorkflowTransition = async (
    targetRecords: ExamResult[],
    nextStatus: ExamWorkflowStatus,
    returnReason?: string
  ) => {
    const actionMap = {
      draft: 'return_for_correction',
      submitted_for_review: 'submit_for_review',
      approved: 'approve',
      published: 'publish',
    } as const;
    const perm = canPerformExamWorkflowAction(
      role,
      actionMap[nextStatus],
      'submitted_for_review'
    );
    if (!perm.allowed) {
      setStatusBanner({
        type: 'error',
        message: perm.reasonBn || 'এই ওয়ার্কফ্লো পরিবর্তনের অনুমতি নেই।',
      });
      return;
    }

    const payload = targetRecords.map((rec) => {
      const isPub = nextStatus === 'published';
      return {
        ...rec,
        isPublished: isPub,
        workflowStatus: nextStatus,
        reviewedByUid:
          nextStatus === 'approved' || nextStatus === 'draft'
            ? actorUid
            : rec.reviewedByUid,
        reviewedByName:
          nextStatus === 'approved' || nextStatus === 'draft'
            ? actorName
            : rec.reviewedByName,
        reviewedAt:
          nextStatus === 'approved' || nextStatus === 'draft'
            ? new Date().toISOString().slice(0, 10)
            : rec.reviewedAt,
        reviewReturnReason:
          nextStatus === 'draft' ? returnReason || '' : rec.reviewReturnReason,
        publishedByUid: isPub ? actorUid : rec.publishedByUid,
        publishedAt: isPub
          ? new Date().toISOString().slice(0, 10)
          : rec.publishedAt,
      };
    });

    const ok = await upsertBatchRecords(payload);
    if (ok) {
      await appendAuditLog({
        action:
          nextStatus === 'published'
            ? 'result_published'
            : nextStatus === 'approved'
            ? 'result_approved'
            : nextStatus === 'draft'
            ? 'returned_for_correction'
            : 'submitted_for_review',
        examName: targetRecords[0]?.examName || currentSetup.examName,
        academicYear: targetRecords[0]?.academicYear || currentSetup.academicYear,
        className: targetRecords[0]?.className || currentSetup.className,
        subjectName: targetRecords[0]?.subjectName || 'একাধিক বিষয়',
        actorUid,
        actorName,
        actorRole: role,
        summaryBn: `${targetRecords.length} টি ফলাফল রেকর্ড "${nextStatus}" স্ট্যাটাসে উন্নীত করা হয়েছে${
          returnReason ? ` (কারণ: ${returnReason})` : ''
        }।`,
        affectedCount: targetRecords.length,
      });

      setStatusBanner({
        type: 'success',
        message: `${targetRecords.length} টি রেকর্ডের স্ট্যাটাস সফলভাবে "${nextStatus}" এ আপডেট করা হয়েছে।`,
      });
    }
  };

  // Authorized correction of an already-published result
  const handleSavePublishedCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModal) return;
    if (!correctionReasonText.trim()) {
      setStatusBanner({
        type: 'error',
        message: 'প্রকাশিত ফলাফল সংশোধনের জন্য সুনির্দিষ্ট কারণ (Correction Reason) উল্লেখ করা বাধ্যতামূলক।',
      });
      return;
    }

    const evalCell = evaluateSubjectMarks({
      subjectName: correctionModal.subjectName,
      maxMarks: correctionModal.fullMarks,
      passMarks: correctionModal.passMarks ?? 33,
      marksObtained: correctedIsAbsent ? null : correctedMarksValue,
      isAbsent: correctedIsAbsent,
      policy: currentSetup.gradingPolicy,
    });

    if (evalCell.status === 'invalid') {
      setStatusBanner({
        type: 'error',
        message: evalCell.validationError || 'অবৈধ নম্বর।',
      });
      return;
    }

    const updatedRecord = {
      ...correctionModal,
      previousPublishedMarks: correctionModal.marksObtained,
      previousPublishedGrade: correctionModal.grade,
      marksObtained: correctedIsAbsent ? 0 : correctedMarksValue,
      isAbsent: correctedIsAbsent,
      grade: evalCell.gradeLabel,
      gpaPoint: evalCell.gpaPoint ?? 0,
      correctionReason: correctionReasonText.trim(),
      correctedAt: new Date().toISOString().slice(0, 10),
      correctedByUid: actorUid,
      isPublished: true,
      workflowStatus: 'published' as ExamWorkflowStatus,
    };

    const ok = await upsertBatchRecords([updatedRecord]);
    if (ok) {
      await appendAuditLog({
        action: 'published_result_corrected',
        examName: correctionModal.examName,
        academicYear: correctionModal.academicYear,
        className: correctionModal.className,
        subjectName: correctionModal.subjectName,
        actorUid,
        actorName,
        actorRole: role,
        summaryBn: `মুহতামিমের অনুমোদনে ${correctionModal.studentNameBn} (${correctionModal.admissionNo})-এর প্রকাশিত নম্বর ${correctionModal.marksObtained} (${correctionModal.grade}) হতে সংশোধন করে ${
          correctedIsAbsent ? 'AB' : correctedMarksValue
        } (${evalCell.gradeLabel}) করা হয়েছে। কারণ: ${correctionReasonText.trim()}`,
        affectedCount: 1,
      });
      setCorrectionModal(null);
      setCorrectionReasonText('');
      setStatusBanner({
        type: 'success',
        message: 'প্রকাশিত ফলাফল সফলভাবে সংশোধন করা হয়েছে এবং অডিট লগে পূর্ববর্তী নম্বর সংরক্ষিত হয়েছে।',
      });
    }
  };

  // Save new or updated Examination Setup
  const handleSaveNewExamSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: ExaminationSetup = {
      id: `exm-cfg-${Date.now()}`,
      academicYear: newSetupYear.trim(),
      examName: newSetupExamName.trim(),
      department: newSetupDept,
      className: newSetupClass.trim(),
      sectionName: newSetupSection.trim(),
      examDate: newSetupDate,
      publicationDate: newSetupPubDate,
      instructions: newSetupInstructions.trim(),
      subjects: newSetupSubjects,
      gradingPolicy: {
        ...DEFAULT_MADRASA_GRADING_POLICY,
        enableGpa: enableGpaPolicy,
        enableRank: enableRankPolicy,
        failIfAnySubjectFailed: failIfAnyFailedPolicy,
      },
      workflowStatus: 'draft',
      authorId: actorUid,
    };

    const validation = validateExaminationSetup(candidate);
    if (!validation.valid) {
      setStatusBanner({
        type: 'error',
        message: validation.errors.join(' | '),
      });
      return;
    }

    if (onSaveExamSetup) {
      const ok = await onSaveExamSetup(candidate);
      if (!ok) {
        setStatusBanner({
          type: 'error',
          message: `পরীক্ষা কনফিগারেশন "${candidate.examName}" ডাটাবেসে সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`,
        });
        return;
      }
    }
    setLocalSetups((prev) => [candidate, ...prev.filter((s) => s.id !== candidate.id)]);
    setSelectedSetupId(candidate.id);
    await appendAuditLog({
      action: 'setup_saved',
      examName: candidate.examName,
      academicYear: candidate.academicYear,
      className: candidate.className,
      actorUid,
      actorName,
      actorRole: role,
      summaryBn: `নতুন পরীক্ষা কনফিগারেশন "${candidate.examName}" (${candidate.className}, ${candidate.subjects.length} টি বিষয়) সংরক্ষিত হয়েছে।`,
      affectedCount: candidate.subjects.length,
    });
    setStatusBanner({
      type: 'success',
      message: `পরীক্ষা কনফিগারেশন "${candidate.examName}" সফলভাবে ডাটাবেসে সংরক্ষিত ও সক্রিয় করা হয়েছে।`,
    });
  };

  // Quick single-add submit handler
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === selectedStudentId);
    if (
      !stu ||
      !quickExamName.trim() ||
      !quickSubjectName.trim() ||
      quickMarksObtained < 0 ||
      quickMarksObtained > quickFullMarks
    ) {
      setFormError(t.common.requiredFieldError);
      return;
    }
    const grade = calculateMadrasaGrade(quickMarksObtained, quickFullMarks);
    const saved = await onAddExamResult({
      examName: quickExamName.trim(),
      academicYear: currentSetup.academicYear,
      studentId: stu.id,
      studentNameBn: stu.nameBn,
      admissionNo: stu.admissionNo,
      className: stu.className,
      department: stu.department,
      subjectName: quickSubjectName.trim(),
      marksObtained: quickMarksObtained,
      fullMarks: quickFullMarks,
      grade,
      isPublished: quickIsPublished,
      workflowStatus: quickIsPublished ? 'published' : 'draft',
      guardianUid: stu.guardianUid,
    });
    if (saved) {
      setIsAddOpen(false);
      setFormError(null);
    }
  };

  const selectedMarksheetRow = useMemo(() => {
    if (tabulationRows.length === 0) return null;
    if (marksheetStudentId) {
      const found = tabulationRows.find(
        (r) => r.student.id === marksheetStudentId
      );
      if (found) return found;
    }
    return tabulationRows[0];
  }, [tabulationRows, marksheetStudentId]);

  return (
    <div className="space-y-6">
      {/* Top Institutional Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B4F3B]/10 text-[#0B4F3B] font-bengali">
              Phase 9 • Examination & Official Marksheet Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-bengali mt-1">
            {t.navModules.exams} — বাল্ক রেজাল্ট, অফিশিয়াল মার্কশিট ও পিডিএফ প্রকাশনা
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-bengali">
            জামাতভিত্তিক বাল্ক নম্বর এন্ট্রি, এক্সেল (.xlsx) ও CSV ইমপোর্ট প্রিভিউ, অনুমোদন ওয়ার্কফ্লো, পূর্ণাঙ্গ ফলাফল শিট এবং মুদ্রণযোগ্য A4 অফিশিয়াল মার্কশিট।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEditMarks && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                data-testid="open-excel-import-btn"
                className="px-3.5 py-2 text-xs font-bold font-bengali bg-emerald-50 hover:bg-emerald-100 text-[#0B4F3B] border border-emerald-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>এক্সেল / CSV ইমপোর্ট</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudentId(students[0]?.id || '');
                  setIsAddOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-bold font-bengali bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>একক নম্বর এন্ট্রি</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {statusBanner && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bengali ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : statusBanner.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-500 hover:text-slate-900 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Examination & Class Selector Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-bengali">
        <div>
          <label
            htmlFor="exam-setup-select"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            ১. পরীক্ষা ও জামাত কনফিগারেশন নির্বাচন করুন
          </label>
          <select
            id="exam-setup-select"
            data-testid="exam-setup-select"
            value={currentSetup.id}
            onChange={(e) => {
              const nextSetup = activeSetups.find((s) => s.id === e.target.value);
              setSelectedSetupId(e.target.value);
              if (nextSetup && nextSetup.subjects[0]) {
                setSelectedSubjectName(nextSetup.subjects[0].subjectName);
              }
            }}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg bg-white font-semibold text-slate-900"
          >
            {activeSetups.map((cfg) => (
              <option key={cfg.id} value={cfg.id}>
                {cfg.examName} — {cfg.className} ({cfg.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="exam-subject-select"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            ২. কিতাব / বিষয় নির্বাচন করুন (Subject)
          </label>
          <select
            id="exam-subject-select"
            data-testid="exam-subject-select"
            value={activeSubjectConfig.subjectName}
            onChange={(e) => setSelectedSubjectName(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg bg-white font-semibold text-slate-900"
          >
            {currentSetup.subjects.map((sub) => (
              <option key={sub.subjectCode} value={sub.subjectName}>
                [{sub.subjectCode}] {sub.subjectName} (পূর্ণমান: {sub.maxMarks}, পাস: {sub.passMarks})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 flex flex-col justify-center">
          <span className="text-[11px] text-slate-500">নির্বাচিত জামাত ও শাখা</span>
          <span className="text-xs sm:text-sm font-bold text-slate-900">
            {currentSetup.className} • {currentSetup.sectionName}
          </span>
          <span className="text-[11px] text-[#0B4F3B] font-semibold">
            শিক্ষাবর্ষ: {currentSetup.academicYear} | মোট শিক্ষার্থী: {formatNum(classStudents.length, language)} জন
          </span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg px-3.5 py-2 flex flex-col justify-center">
          <span className="text-[11px] text-emerald-800">বিষয়ের মানদণ্ড ও গ্রেডিং নীতি</span>
          <span className="text-xs sm:text-sm font-bold text-[#0B4F3B]">
            পূর্ণমান: {formatNum(activeSubjectConfig.maxMarks, language)} | পাস নম্বর: {formatNum(activeSubjectConfig.passMarks, language)}
          </span>
          <span className="text-[11px] text-slate-600">
            জিপিএ স্কেল: {currentSetup.gradingPolicy.gpaScale.toFixed(2)} • মেধা স্থান: সক্রিয়
          </span>
        </div>
      </div>

      {/* 5 Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2 font-bengali">
        {[
          {
            id: 'bulk_entry' as const,
            label: '১. বাল্ক নম্বর এন্ট্রি ও ইমপোর্ট (Bulk Entry)',
            icon: Layers,
          },
          {
            id: 'workflow_publish' as const,
            label: '২. অনুমোদন ও প্রকাশনা ওয়ার্কফ্লো (Approval & Publish)',
            icon: ShieldCheck,
          },
          {
            id: 'class_sheet' as const,
            label: '৩. পূর্ণাঙ্গ জামাত ফলাফল শিট (Class Result Sheet)',
            icon: FileSpreadsheet,
          },
          {
            id: 'official_marksheet' as const,
            label: '৪. একক অফিশিয়াল মার্কশিট ও পিডিএফ (Official Marksheet)',
            icon: FileText,
          },
          {
            id: 'setup_audit' as const,
            label: '৫. পরীক্ষা সেটআপ ও অডিট ট্রেইল (Setup & Audit)',
            icon: Settings2,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`exam-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#0B4F3B] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: BULK MARKS ENTRY TABLE
      ===================================================================== */}
      {activeTab === 'bulk_entry' && (
        <div className="space-y-4">
          {/* Bulk Entry Summary Strip & Toolbar */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 font-bengali">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-bold">
                মোট শিক্ষার্থী: {formatNum(bulkMetrics.total, language)}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                এন্ট্রিকৃত (Entered): {formatNum(bulkMetrics.entered, language)}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                অপ্রবেশকৃত (Unentered): {formatNum(bulkMetrics.unentered, language)}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-bold">
                অনুপস্থিত (Absent): {formatNum(bulkMetrics.absent, language)}
              </span>
              {bulkMetrics.invalid > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold">
                  ত্রুটিপূর্ণ নম্বর: {formatNum(bulkMetrics.invalid, language)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম, আইডি বা রোল খুঁজুন..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'roll' | 'name' | 'marks')
                }
                aria-label="Sort bulk marks table"
                className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white font-semibold"
              >
                <option value="roll">রোল অনুযায়ী সাজান</option>
                <option value="name">নাম অনুযায়ী সাজান</option>
                <option value="marks">প্রাপ্ত নম্বর অনুযায়ী</option>
              </select>
            </div>
          </div>

          {/* Editable Bulk Marks Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm font-bengali">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">রোল</th>
                    <th className="py-3 px-4">শিক্ষার্থী ও স্টুডেন্ট আইডি</th>
                    <th className="py-3 px-4 text-center">পূর্ণমান / পাস</th>
                    <th className="py-3 px-4 text-center">অনুপস্থিত (Absent)</th>
                    <th className="py-3 px-4">প্রাপ্ত নম্বর (Marks)</th>
                    <th className="py-3 px-4">স্বয়ংক্রিয় গ্রেড ও জিপিএ</th>
                    <th className="py-3 px-4">মন্তব্য (Remarks)</th>
                    <th className="py-3 px-4 text-end">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {bulkEntryRows.map((row) => {
                    const isLockedForTeacher =
                      !canPublishOrApprove &&
                      (row.workflowStatus === 'published' ||
                        row.workflowStatus === 'approved');
                    return (
                      <tr
                        key={row.student.id}
                        className={
                          row.evaluation.status === 'invalid'
                            ? 'bg-red-50/60'
                            : row.dirty
                            ? 'bg-amber-50/40'
                            : 'hover:bg-stone-50/70'
                        }
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          #{formatNum(row.student.rollNo, language)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <StudentPhotoAvatar
                              nameBn={row.student.nameBn}
                              nameEn={row.student.nameEn}
                              department={row.student.department}
                              photoUrl={row.student.photoUrl}
                              size="sm"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {row.student.nameBn}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {row.student.admissionNo} • {row.student.nameEn}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                          {activeSubjectConfig.maxMarks} / {activeSubjectConfig.passMarks}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.isAbsent}
                              disabled={!canEditMarks || isLockedForTeacher}
                              onChange={(e) =>
                                handleCellChange(
                                  row.cellKey,
                                  { isAbsent: e.target.checked },
                                  {
                                    marksStr: row.marksStr,
                                    isAbsent: row.isAbsent,
                                    remarks: row.remarks,
                                  }
                                )
                              }
                              className="w-4 h-4 accent-rose-600 rounded"
                            />
                            <span className="text-xs text-slate-700">AB</span>
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min={0}
                            max={activeSubjectConfig.maxMarks}
                            step="0.5"
                            disabled={
                              !canEditMarks || row.isAbsent || isLockedForTeacher
                            }
                            data-testid={`bulk-marks-input-${row.student.admissionNo}`}
                            value={row.isAbsent ? '' : row.marksStr}
                            placeholder={
                              row.isAbsent ? 'অনুপস্থিত (AB)' : 'নম্বর দিন...'
                            }
                            onChange={(e) =>
                              handleCellChange(
                                row.cellKey,
                                { marksStr: e.target.value, isAbsent: false },
                                {
                                  marksStr: row.marksStr,
                                  isAbsent: row.isAbsent,
                                  remarks: row.remarks,
                                }
                              )
                            }
                            className={`w-28 px-3 py-1.5 text-sm font-mono font-bold rounded-lg border ${
                              row.evaluation.status === 'invalid'
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : row.isAbsent
                                ? 'border-stone-200 bg-stone-100 text-stone-400'
                                : 'border-stone-300 bg-white text-slate-900'
                            }`}
                          />
                          {row.evaluation.validationError && (
                            <p className="text-[11px] text-red-600 mt-1">
                              {row.evaluation.validationError}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                row.evaluation.status === 'passed'
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                  : row.evaluation.status === 'failed' ||
                                    row.evaluation.status === 'absent'
                                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                                  : 'bg-stone-100 text-slate-600'
                              }`}
                            >
                              {row.evaluation.gradeLabel}
                            </span>
                            {row.evaluation.gpaPoint !== null && (
                              <span className="text-xs font-mono text-slate-600">
                                GPA {row.evaluation.gpaPoint.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            disabled={!canEditMarks || isLockedForTeacher}
                            value={row.remarks}
                            placeholder="ঐচ্ছিক মন্তব্য..."
                            onChange={(e) =>
                              handleCellChange(
                                row.cellKey,
                                { remarks: e.target.value },
                                {
                                  marksStr: row.marksStr,
                                  isAbsent: row.isAbsent,
                                  remarks: row.remarks,
                                }
                              )
                            }
                            className="w-40 px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                          />
                        </td>
                        <td className="py-3 px-4 text-end">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              row.workflowStatus === 'published'
                                ? 'bg-emerald-100 text-emerald-900'
                                : row.workflowStatus === 'approved'
                                ? 'bg-blue-100 text-blue-900'
                                : row.workflowStatus === 'submitted_for_review'
                                ? 'bg-amber-100 text-amber-900'
                                : row.workflowStatus === 'draft'
                                ? 'bg-stone-200 text-slate-800'
                                : 'bg-stone-100 text-slate-500'
                            }`}
                          >
                            {row.workflowStatus === 'published'
                              ? 'প্রকাশিত (Published)'
                              : row.workflowStatus === 'approved'
                              ? 'অনুমোদিত (Approved)'
                              : row.workflowStatus === 'submitted_for_review'
                              ? 'পর্যালোচনাধীন (In Review)'
                              : row.workflowStatus === 'draft'
                              ? 'খসড়া (Draft)'
                              : 'অপ্রবেশকৃত'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bulk Action Footer */}
            {canEditMarks && (
              <div className="bg-stone-50 border-t border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3 font-bengali">
                <div className="text-xs text-slate-600">
                  <strong>নির্দেশনা:</strong> খালি রাখা ঘরগুলো কখনোই শূন্য (০) হিসেবে গণ্য হবে না। অনুপস্থিত শিক্ষার্থীর ক্ষেত্রে <strong>AB</strong> টিক দিন।
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {bulkMetrics.dirtyCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftCells({})}
                      className="px-3 py-2 rounded-lg text-xs font-bold border border-stone-300 bg-white text-slate-700 hover:bg-stone-100 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      অসংরক্ষিত পরিবর্তন বাতিল ({bulkMetrics.dirtyCount})
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSavingBulk}
                    data-testid="save-bulk-draft-btn"
                    onClick={() => handleSaveBulkMarks('draft')}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-stone-800 text-white hover:bg-stone-950 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    খসড়া সংরক্ষণ করুন (Save Draft)
                  </button>
                  <button
                    type="button"
                    disabled={isSavingBulk}
                    data-testid="submit-bulk-review-btn"
                    onClick={() => handleSaveBulkMarks('submitted_for_review')}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    অনুমোদনের জন্য পাঠান (Submit for Review)
                  </button>
                  {canPublishOrApprove && (
                    <button
                      type="button"
                      disabled={isSavingBulk}
                      data-testid="publish-bulk-results-btn"
                      onClick={() => handleSaveBulkMarks('published')}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white hover:bg-[#083D2D] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#E6C677]" />
                      চূড়ান্ত অনুমোদন ও প্রকাশ (Approve & Publish)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: APPROVAL, PUBLISHING & PUBLISHED RESULT CORRECTION WORKFLOW
      ===================================================================== */}
      {activeTab === 'workflow_publish' && (
        <div className="space-y-4 font-bengali">
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-[#0B4F3B]" />
              <span className="text-xs font-bold text-slate-700">ওয়ার্কফ্লো ফিল্টার:</span>
              {(
                [
                  { id: 'all', label: 'সকল রেকর্ড' },
                  { id: 'draft', label: 'খসড়া (Draft)' },
                  { id: 'submitted_for_review', label: 'পর্যালোচনাধীন (In Review)' },
                  { id: 'approved', label: 'অনুমোদিত (Approved)' },
                  { id: 'published', label: 'প্রকাশিত (Published)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWorkflowFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    workflowFilter === f.id
                      ? 'bg-[#0B4F3B] text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {canPublishOrApprove && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pending = exams.filter(
                      (e) => resolveExamWorkflowStatus(e) !== 'published'
                    );
                    if (pending.length > 0) {
                      handleWorkflowTransition(pending, 'published');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white hover:bg-[#083D2D] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E6C677]" />
                  সকল অপ্রকাশিত ফলাফল একযোগে প্রকাশ করুন
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 font-bold text-slate-700">
                    <th className="py-3 px-4">শিক্ষার্থী ও আইডি</th>
                    <th className="py-3 px-4">পরীক্ষা ও বিষয়</th>
                    <th className="py-3 px-4 text-center">প্রাপ্ত নম্বর</th>
                    <th className="py-3 px-4">গ্রেড ও সংশোধনী নোট</th>
                    <th className="py-3 px-4">বর্তমান ধাপ (Workflow)</th>
                    <th className="py-3 px-4 text-end">কার্যক্রম (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {exams
                    .filter((ex) => {
                      const wf = resolveExamWorkflowStatus(ex);
                      return workflowFilter === 'all' || wf === workflowFilter;
                    })
                    .map((ex) => {
                      const wf = resolveExamWorkflowStatus(ex);
                      return (
                        <tr key={ex.id} className="hover:bg-stone-50/80">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {ex.studentNameBn}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {ex.admissionNo} • {ex.className}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {ex.subjectName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {ex.examName} ({ex.academicYear})
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {ex.isAbsent ? (
                              <span className="text-rose-700">AB (অনুপস্থিত)</span>
                            ) : (
                              <span>
                                {ex.marksObtained} / {ex.fullMarks}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0B4F3B]">{ex.grade}</div>
                            {ex.correctionReason && (
                              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1">
                                সংশোধিত (পূর্বে: {ex.previousPublishedMarks}) — কারণ: {ex.correctionReason}
                              </div>
                            )}
                            {ex.reviewReturnReason && wf === 'draft' && (
                              <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded px-2 py-0.5 mt-1">
                                ফেরত পাঠানোর কারণ: {ex.reviewReturnReason}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                wf === 'published'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : wf === 'approved'
                                  ? 'bg-blue-100 text-blue-900'
                                  : wf === 'submitted_for_review'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-200 text-slate-800'
                              }`}
                            >
                              {wf === 'published'
                                ? 'প্রকাশিত (Published)'
                                : wf === 'approved'
                                ? 'অনুমোদিত (Approved)'
                                : wf === 'submitted_for_review'
                                ? 'পর্যালোচনাধীন (Submitted)'
                                : 'খসড়া (Draft)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-end">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {wf === 'draft' && canEditMarks && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleWorkflowTransition(
                                      [ex],
                                      'submitted_for_review'
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer"
                                >
                                  রিভিউতে পাঠান
                                </button>
                              )}
                              {wf === 'submitted_for_review' &&
                                canPublishOrApprove && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleWorkflowTransition([ex], 'approved')
                                      }
                                      className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                                    >
                                      অনুমোদন (Approve)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReturnReasonModal({
                                          examId: ex.id,
                                          studentName: ex.studentNameBn,
                                          subjectName: ex.subjectName,
                                        });
                                        setReturnReasonText('');
                                      }}
                                      className="px-2.5 py-1 rounded bg-rose-100 text-rose-900 text-xs font-bold hover:bg-rose-200 cursor-pointer"
                                    >
                                      সংশোধনে ফেরত
                                    </button>
                                  </>
                                )}
                              {(wf === 'approved' || wf === 'submitted_for_review') &&
                                canPublishOrApprove && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleWorkflowTransition([ex], 'published')
                                    }
                                    className="px-2.5 py-1 rounded bg-[#0B4F3B] text-white text-xs font-bold hover:bg-[#083D2D] cursor-pointer"
                                  >
                                    প্রকাশ করুন (Publish)
                                  </button>
                                )}
                              {wf === 'published' && canPublishOrApprove && (
                                <button
                                  type="button"
                                  data-testid={`correct-published-btn-${ex.id}`}
                                  onClick={() => {
                                    setCorrectionModal(ex);
                                    setCorrectedMarksValue(ex.marksObtained);
                                    setCorrectedIsAbsent(Boolean(ex.isAbsent));
                                    setCorrectionReasonText('');
                                  }}
                                  className="px-2.5 py-1 rounded border border-amber-400 bg-amber-50 text-amber-950 text-xs font-bold hover:bg-amber-100 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  অনুমোদিত সংশোধন
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FULL CLASS RESULT / TABULATION SHEET
      ===================================================================== */}
      {activeTab === 'class_sheet' && (
        <div className="space-y-4 font-bengali">
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                পূর্ণাঙ্গ জামাত ফলাফল ও টেবুলেশন শিট — {currentSetup.className}
              </h2>
              <p className="text-xs text-slate-600">
                {currentSetup.examName} ({currentSetup.academicYear}) • শাখা: {currentSetup.sectionName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="download-class-sheet-pdf-btn"
                onClick={() =>
                  downloadClassTabulationPdf(tabulationRows, settings, {
                    examName: currentSetup.examName,
                    academicYear: currentSetup.academicYear,
                    className: currentSetup.className,
                    sectionName: currentSetup.sectionName,
                    publicationDate: currentSetup.publicationDate,
                  })
                }
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white hover:bg-[#083D2D] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#E6C677]" />
                ফলাফল শিট পিডিএফ ডাউনলোড (A4 Landscape PDF)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-stone-100 text-slate-800 border border-stone-300 hover:bg-stone-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট করুন
              </button>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0B4F3B] text-white">
                    <th className="py-3 px-3">রোল</th>
                    <th className="py-3 px-3">শিক্ষার্থী ও আইডি</th>
                    {(tabulationRows[0]?.subjectCells || []).map((sub) => (
                      <th key={sub.subjectName} className="py-3 px-3 text-center">
                        <div className="font-bold">{sub.subjectName}</div>
                        <div className="text-[10px] text-emerald-200 font-mono">
                          পূর্ণমান: {sub.maxMarks}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center">মোট প্রাপ্ত</th>
                    <th className="py-3 px-3 text-center">শতাংশ</th>
                    <th className="py-3 px-3 text-center">জিপিএ</th>
                    <th className="py-3 px-3 text-center">চূড়ান্ত গ্রেড</th>
                    <th className="py-3 px-3 text-center">ফলাফল</th>
                    <th className="py-3 px-3 text-center">মেধা স্থান</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {tabulationRows.map((row) => (
                    <tr key={row.student.id} className="hover:bg-stone-50">
                      <td className="py-3 px-3 font-mono font-bold">
                        #{formatNum(row.student.rollNo, language)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {row.student.nameBn}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {row.student.admissionNo}
                        </div>
                      </td>
                      {row.subjectCells.map((cell) => (
                        <td
                          key={cell.subjectName}
                          className="py-3 px-3 text-center font-mono"
                        >
                          {cell.isAbsent ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold">
                              AB
                            </span>
                          ) : cell.marksObtained === null ? (
                            <span className="text-slate-400">এন্ট্রি হয়নি</span>
                          ) : (
                            <div>
                              <span
                                className={`font-bold ${
                                  cell.status === 'failed'
                                    ? 'text-rose-700'
                                    : 'text-slate-900'
                                }`}
                              >
                                {formatNum(cell.marksObtained, language)}
                              </span>
                              <span className="block text-[10px] text-slate-500">
                                {cell.letterGrade}
                              </span>
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {formatNum(row.totalObtained, language)} /{' '}
                        {formatNum(row.totalMaxMarks, language)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {formatNum(row.percentage, language)}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#0B4F3B]">
                        {row.gpa !== null ? row.gpa.toFixed(2) : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {row.overallGradeLabel}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            row.overallStatus === 'PASS'
                              ? 'bg-emerald-100 text-emerald-900'
                              : row.overallStatus === 'INCOMPLETE'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {row.overallStatus === 'PASS'
                            ? 'উত্তীর্ণ (PASS)'
                            : row.overallStatus === 'FAIL'
                            ? 'অকৃতকার্য (FAIL)'
                            : row.overallStatus === 'ABSENT'
                            ? 'অনুপস্থিত'
                            : 'অসম্পূর্ণ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-900">
                        {row.rank !== null ? `#${formatNum(row.rank, language)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: INDIVIDUAL OFFICIAL MARKSHEET & BULK CLASS MARKSHEET PDF
      ===================================================================== */}
      {activeTab === 'official_marksheet' && (
        <div className="space-y-4 font-bengali">
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="marksheet-stu-select"
                className="text-xs font-bold text-slate-700"
              >
                শিক্ষার্থী নির্বাচন করুন (Select Student):
              </label>
              <select
                id="marksheet-stu-select"
                data-testid="marksheet-student-select"
                value={selectedMarksheetRow?.student.id || ''}
                onChange={(e) => setMarksheetStudentId(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg bg-white font-bold text-slate-900"
              >
                {tabulationRows.map((r) => (
                  <option key={r.student.id} value={r.student.id}>
                    রোল #{r.student.rollNo} — {r.student.nameBn} ({r.student.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={isGeneratingBulkPdf || tabulationRows.length === 0}
              data-testid="download-bulk-marksheets-pdf-btn"
              onClick={async () => {
                setIsGeneratingBulkPdf(true);
                try {
                  const file = await downloadBulkClassMarksheetsPdf(
                    tabulationRows,
                    settings,
                    currentSetup.gradingPolicy
                  );
                  setStatusBanner({
                    type: 'success',
                    message: `জামাতের সকল শিক্ষার্থীর (${tabulationRows.length} জন) বাল্ক অফিশিয়াল মার্কশিট পিডিএফ ডাউনলোড সম্পন্ন: ${file}`,
                  });
                } finally {
                  setIsGeneratingBulkPdf(false);
                }
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white hover:bg-[#083D2D] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#E6C677]" />
              {isGeneratingBulkPdf
                ? 'বাল্ক পিডিএফ তৈরি হচ্ছে...'
                : `জামাতের সকল মার্কশিট একত্রে পিডিএফ ডাউনলোড (${tabulationRows.length} পাতা)`}
            </button>
          </div>

          {selectedMarksheetRow ? (
            <OfficialIndividualMarksheet
              row={selectedMarksheetRow}
              settings={settings}
              policy={currentSetup.gradingPolicy}
              lang={language}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-slate-500">
              এই জামাতে কোনো শিক্ষার্থী পাওয়া যায়নি।
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: EXAMINATION SETUP, GRADING POLICY & IMMUTABLE AUDIT TRAIL
      ===================================================================== */}
      {activeTab === 'setup_audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-bengali">
          {/* Left: Examination Setup & Grading Policy Configurator */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                পরীক্ষা কনফিগারেশন ও গ্রেডিং পলিসি সেটআপ (Examination Setup)
              </h2>
              <p className="text-xs text-slate-600">
                নতুন পরীক্ষা, জামাত, কিতাব/বিষয়, পূর্ণমান, পাস নম্বর এবং কাস্টমাইজযোগ্য গ্রেডিং নিয়ম নির্ধারণ করুন।
              </p>
            </div>

            <form onSubmit={handleSaveNewExamSetup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পরীক্ষার নাম (Exam Name) *
                  </label>
                  <input
                    type="text"
                    value={newSetupExamName}
                    onChange={(e) => setNewSetupExamName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষাবর্ষ (Academic Session) *
                  </label>
                  <input
                    type="text"
                    value={newSetupYear}
                    onChange={(e) => setNewSetupYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিভাগ (Department) *
                  </label>
                  <select
                    value={newSetupDept}
                    onChange={(e) => setNewSetupDept(e.target.value as Department)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="hifz">হিফযুল কুরআন বিভাগ (Hifz)</option>
                    <option value="qawmi">কওমি কিতাব বিভাগ (Qawmi)</option>
                    <option value="general">জেনারেল ক্যাডেট বিভাগ (General)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    জামাত / শ্রেণি (Class) *
                  </label>
                  <input
                    type="text"
                    value={newSetupClass}
                    onChange={(e) => setNewSetupClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শাখা (Section)
                  </label>
                  <input
                    type="text"
                    value={newSetupSection}
                    onChange={(e) => setNewSetupSection(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পরীক্ষার তারিখ
                    </label>
                    <input
                      type="date"
                      value={newSetupDate}
                      onChange={(e) => setNewSetupDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ফলাফল প্রকাশের তারিখ
                    </label>
                    <input
                      type="date"
                      value={newSetupPubDate}
                      onChange={(e) => setNewSetupPubDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Configurable Grading Policy Toggles */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  গ্রেডিং ও মেধাক্রম পলিসি (Configurable Institutional Policy):
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableGpaPolicy}
                      onChange={(e) => setEnableGpaPolicy(e.target.checked)}
                      className="accent-[#0B4F3B]"
                    />
                    <span>জিপিএ (5.00 GPA) গণনা সক্রিয়</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableRankPolicy}
                      onChange={(e) => setEnableRankPolicy(e.target.checked)}
                      className="accent-[#0B4F3B]"
                    />
                    <span>মেধা স্থান (Class Rank) নির্ণয় সক্রিয়</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={failIfAnyFailedPolicy}
                      onChange={(e) =>
                        setFailIfAnyFailedPolicy(e.target.checked)
                      }
                      className="accent-[#0B4F3B]"
                    />
                    <span>এক বিষয়ে ফেল/অনুপস্থিত হলে সামগ্রিক অকৃতকার্য</span>
                  </label>
                </div>
              </div>

              {/* Subjects List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    বিষয় ও পূর্ণমান তালিকা (Subjects & Marks):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewSetupSubjects((prev) => [
                        ...prev,
                        {
                          subjectCode: `SUB-${101 + prev.length}`,
                          subjectName: '',
                          maxMarks: 100,
                          passMarks: 33,
                          isOptional: false,
                        },
                      ])
                    }
                    className="text-xs font-bold text-[#0B4F3B] hover:underline cursor-pointer"
                  >
                    + নতুন বিষয় যুক্ত করুন
                  </button>
                </div>
                {newSetupSubjects.map((sub, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded-lg border border-stone-200"
                  >
                    <input
                      type="text"
                      value={sub.subjectCode}
                      placeholder="কোড"
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSetupSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, subjectCode: val } : item
                          )
                        );
                      }}
                      className="col-span-2 px-2 py-1.5 text-xs border border-stone-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={sub.subjectName}
                      placeholder="বিষয় / কিতাবের নাম"
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSetupSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, subjectName: val } : item
                          )
                        );
                      }}
                      className="col-span-5 px-2 py-1.5 text-xs border border-stone-300 rounded bg-white"
                    />
                    <input
                      type="number"
                      value={sub.maxMarks}
                      placeholder="পূর্ণমান"
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewSetupSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, maxMarks: val } : item
                          )
                        );
                      }}
                      className="col-span-2 px-2 py-1.5 text-xs border border-stone-300 rounded bg-white font-mono"
                    />
                    <input
                      type="number"
                      value={sub.passMarks}
                      placeholder="পাস"
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewSetupSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, passMarks: val } : item
                          )
                        );
                      }}
                      className="col-span-2 px-2 py-1.5 text-xs border border-stone-300 rounded bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewSetupSubjects((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="col-span-1 text-rose-600 hover:text-rose-800 text-center font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#0B4F3B] text-white text-xs font-bold hover:bg-[#083D2D] cursor-pointer"
              >
                পরীক্ষা কনফিগারেশন সংরক্ষণ করুন (Save Exam Setup)
              </button>
            </form>
          </div>

          {/* Right: Immutable Audit Trail */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  পরীক্ষা ও ফলাফল অডিট ট্রেইল (Audit Log)
                </h2>
                <p className="text-xs text-slate-600">
                  নম্বর এন্ট্রি, এক্সেল ইমপোর্ট, অনুমোদন, প্রকাশনা ও সংশোধনের অপরিবর্তনীয় রেকর্ড।
                </p>
              </div>
              <ShieldAlert className="w-5 h-5 text-[#0B4F3B]" />
            </div>

            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {activeAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/70 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B4F3B]">
                      {log.actorName} ({log.actorRole})
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{log.summaryBn}</p>
                  <div className="text-[11px] text-slate-500">
                    {log.examName} • {log.className} ({log.affectedCount} টি রেকর্ড)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EXCEL (.XLSX) & CSV IMPORT WITH PREVIEW & VALIDATION
      ===================================================================== */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-stone-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 font-bengali max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  এক্সেল (.xlsx) ও সিএসভি (.csv) বাল্ক নম্বর ইমপোর্ট ও প্রিভিউ
                </h2>
                <p className="text-xs text-slate-600">
                  পরীক্ষা: <strong>{currentSetup.examName}</strong> • জামাত: <strong>{currentSetup.className}</strong> • বিষয়: <strong>{activeSubjectConfig.subjectName}</strong> (পূর্ণমান: {activeSubjectConfig.maxMarks})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Sample Template & Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 border border-stone-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  ধাপ ১: অফিশিয়াল নমুনা টেমপ্লেট ডাউনলোড করুন
                </div>
                <p className="text-xs text-slate-600">
                  এই জামাতের শিক্ষার্থীদের ভেরিফাইড স্টুডেন্ট আইডিসহ প্রস্তুতকৃত এক্সেল বা সিএসভি টেমপ্লেট ডাউনলোড করুন।
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="download-xlsx-template-btn"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white hover:bg-[#083D2D] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#E6C677]" />
                    এক্সেল টেমপ্লেট (.xlsx)
                  </button>
                  <button
                    type="button"
                    data-testid="download-csv-template-btn"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-stone-300 text-slate-800 hover:bg-stone-100 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    সিএসভি টেমপ্লেট (.csv)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  ধাপ ২: পূরণকৃত .xlsx বা .csv ফাইল আপলোড করুন
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-300 text-[#0B4F3B] hover:bg-emerald-100 inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>ফাইল নির্বাচন করুন (.xlsx / .csv)</span>
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    data-testid="load-sample-import-preview-btn"
                    onClick={handleLoadDemoImportPreview}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-50 border border-amber-300 text-amber-950 hover:bg-amber-100 cursor-pointer"
                  >
                    নমুনা ইমপোর্ট ডাটা প্রিভিউ লোড করুন
                  </button>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allowUpdateDrafts}
                    onChange={(e) => setAllowUpdateDrafts(e.target.checked)}
                    className="accent-[#0B4F3B]"
                  />
                  <span>বিদ্যমান খসড়া (Draft) নম্বর আপডেট করার অনুমতি দিন (প্রকাশিত ফলাফল ওভাররাইট হবে না)</span>
                </label>
              </div>
            </div>

            {/* Step 2: Validation Summary & Interactive Preview Table */}
            {importPreview && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 font-bold">
                    মোট সারি: {importPreview.summary.totalRows}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                    বৈধ নতুন: {importPreview.summary.validNewCount}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold">
                    খসড়া আপডেট: {importPreview.summary.validDraftUpdateCount}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold">
                    ফাইলে ডুপ্লিকেট: {importPreview.summary.duplicateInFileCount}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold">
                    অজ্ঞাত আইডি: {importPreview.summary.unknownStudentCount}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-red-100 text-red-900 font-bold">
                    অবৈধ মান / কনফ্লিক্ট:{' '}
                    {importPreview.summary.invalidValueCount +
                      importPreview.summary.existingConflictCount}
                  </span>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 font-bold text-slate-700">
                        <th className="py-2.5 px-3">সারি</th>
                        <th className="py-2.5 px-3">স্টুডেন্ট আইডি</th>
                        <th className="py-2.5 px-3">শনাক্তকৃত শিক্ষার্থী</th>
                        <th className="py-2.5 px-3">নম্বর / সংশোধন</th>
                        <th className="py-2.5 px-3">গ্রেড</th>
                        <th className="py-2.5 px-3">যাচাইকরণ স্ট্যাটাস ও ত্রুটির কারণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {importPreview.rows.map((r, idx) => (
                        <tr
                          key={`${r.rowNumber}-${idx}`}
                          className={
                            r.status === 'valid_new' ||
                            r.status === 'valid_draft_update'
                              ? 'bg-emerald-50/30'
                              : 'bg-rose-50/40'
                          }
                        >
                          <td className="py-2 px-3 font-mono">#{r.rowNumber}</td>
                          <td className="py-2 px-3 font-mono font-bold">
                            {r.admissionNo || '—'}
                          </td>
                          <td className="py-2 px-3 font-bold">
                            {r.matchedStudent ? r.matchedStudent.nameBn : 'শনাক্ত হয়নি'}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={String(importRawRows[idx]?.marksOrStatus ?? '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setImportRawRows((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, marksOrStatus: val } : item
                                  )
                                );
                              }}
                              className="w-20 px-2 py-1 border border-stone-300 rounded font-mono bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-[#0B4F3B]">
                            {r.computedGrade}
                          </td>
                          <td className="py-2 px-3">
                            {r.status === 'valid_new' ? (
                              <span className="text-emerald-800 font-bold">
                                ✓ বৈধ নতুন রেকর্ড (প্রস্তুত)
                              </span>
                            ) : r.status === 'valid_draft_update' ? (
                              <span className="text-blue-800 font-bold">
                                ✓ বিদ্যমান খসড়া আপডেট (প্রস্তুত)
                              </span>
                            ) : (
                              <span className="text-rose-700 font-semibold">
                                ✕ {r.errorBn}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importReport && (
                  <div
                    data-testid="import-result-report"
                    className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between"
                  >
                    <span>
                      ইমপোর্ট প্রতিবেদন: সফলভাবে সংরক্ষিত হয়েছে {importReport.importedCount} টি রেকর্ড • ত্রুটিপূর্ণ হওয়ায় স্কিপ করা হয়েছে {importReport.skippedCount} টি সারি • ব্যর্থ: {importReport.failedCount} টি।
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportRawRows([]);
                      setImportReport(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold border border-stone-300 text-slate-700 hover:bg-stone-100 cursor-pointer"
                  >
                    প্রিভিউ পরিষ্কার করুন
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-import-btn"
                    onClick={handleConfirmValidatedImport}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white hover:bg-[#083D2D] cursor-pointer"
                  >
                    যাচাইকৃত বৈধ রেকর্ড ইমপোর্ট নিশ্চিত করুন (Confirm Import)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RETURN FOR CORRECTION REASON
      ===================================================================== */}
      {returnReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 font-bengali">
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              সংশোধনের জন্য খসড়ায় ফেরত পাঠান
            </h3>
            <p className="text-xs text-slate-600">
              শিক্ষার্থী: <strong>{returnReasonModal.studentName}</strong> ({returnReasonModal.subjectName})
            </p>
            <textarea
              rows={3}
              value={returnReasonText}
              onChange={(e) => setReturnReasonText(e.target.value)}
              placeholder="সংশোধনের সুনির্দিষ্ট নির্দেশনা লিখুন..."
              className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnReasonModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs border border-stone-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = exams.find(
                    (e) => e.id === returnReasonModal.examId
                  );
                  if (target) {
                    handleWorkflowTransition(
                      [target],
                      'draft',
                      returnReasonText.trim() || 'পুনঃযাচাইয়ের জন্য প্রেরিত'
                    );
                  }
                  setReturnReasonModal(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-700 text-white"
              >
                ফেরত পাঠান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: AUTHORIZED PUBLISHED RESULT CORRECTION
      ===================================================================== */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 font-bengali">
          <form
            onSubmit={handleSavePublishedCorrection}
            className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                প্রকাশিত ফলাফল সংশোধন (মুহতামিম অনুমোদিত)
              </h3>
              <button
                type="button"
                onClick={() => setCorrectionModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-950">
              শিক্ষার্থী: <strong>{correctionModal.studentNameBn}</strong> ({correctionModal.admissionNo})<br />
              বিষয়: <strong>{correctionModal.subjectName}</strong> • পূর্ববর্তী প্রকাশিত নম্বর: <strong>{correctionModal.marksObtained} ({correctionModal.grade})</strong>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সংশোধিত নতুন নম্বর (পূর্ণমান {correctionModal.fullMarks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={correctionModal.fullMarks}
                  disabled={correctedIsAbsent}
                  value={correctedMarksValue}
                  onChange={(e) =>
                    setCorrectedMarksValue(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-stone-300 rounded-lg"
                />
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs font-bold pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={correctedIsAbsent}
                  onChange={(e) => setCorrectedIsAbsent(e.target.checked)}
                  className="accent-rose-600"
                />
                <span>অনুপস্থিত (AB)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সংশোধনের সুনির্দিষ্ট কারণ (অডিট লগে সংরক্ষিত থাকবে) *
              </label>
              <textarea
                rows={2}
                required
                value={correctionReasonText}
                onChange={(e) => setCorrectionReasonText(e.target.value)}
                placeholder="উদা: উত্তরপত্র পুনঃনিরীক্ষণে যোগফলে ভুল পরিলক্ষিত হওয়ায় সংশোধিত..."
                className="w-full p-2.5 text-xs border border-stone-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectionModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs border border-stone-300"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0B4F3B] text-white cursor-pointer"
              >
                সংশোধন সংরক্ষণ ও প্রকাশ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL: QUICK SINGLE ADD EXAM RESULT
      ===================================================================== */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 font-bengali"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-exam-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-exam-title" className="text-lg font-bold text-slate-900">
                পরীক্ষার নম্বর ও ফলাফল সংযোজন
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close exam modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="ex-student"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  শিক্ষার্থী নির্বাচন করুন (Student) *
                </label>
                <select
                  id="ex-student"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameBn} ({s.admissionNo}) — {s.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="ex-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  পরীক্ষার নাম (Exam Name) *
                </label>
                <input
                  id="ex-name"
                  type="text"
                  value={quickExamName}
                  onChange={(e) => setQuickExamName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="ex-subject"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  কিতাব / বিষয়ের নাম (Subject) *
                </label>
                <input
                  id="ex-subject"
                  type="text"
                  value={quickSubjectName}
                  onChange={(e) => setQuickSubjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ex-marks"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    প্রাপ্ত নম্বর (Marks Obtained) *
                  </label>
                  <input
                    id="ex-marks"
                    type="number"
                    min={0}
                    max={quickFullMarks}
                    value={quickMarksObtained}
                    onChange={(e) =>
                      setQuickMarksObtained(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ex-full"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    পূর্ণমান (Full Marks) *
                  </label>
                  <input
                    id="ex-full"
                    type="number"
                    min={10}
                    max={500}
                    value={quickFullMarks}
                    onChange={(e) => setQuickFullMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickIsPublished}
                    onChange={(e) => setQuickIsPublished(e.target.checked)}
                    className="accent-[#0B3B2E]"
                  />
                  <span>অভিভাবক ও স্টুডেন্ট পোর্টালে ফলাফল প্রকাশ করুন</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0B3B2E] text-white rounded-lg cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
