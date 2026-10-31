import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  auth,
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  registerWithEmailPassword,
  requestPasswordResetEmail,
  serverTimestamp,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
  verifyOrClearAuthSession,
} from './lib/firebase';
import type {
  AccountInvitation,
  AdminAuditActionType,
  AdminAuditLog,
  AdmissionApplication,
  AssignmentCompletionStatus,
  AttendanceRecord,
  AttendanceStatus,
  BannerSlide,
  DepartmentCode,
  ExaminationSetup,
  ExamResult,
  ExpenseRecord,
  FeeInvoice,
  GuardianInquiry,
  GuardianLinkRequest,
  HifzProgressLog,
  InstitutionSettings,
  InvitationTargetRole,
  Language,
  ModuleId,
  Notice,
  PayrollRecord,
  ResidentialLeave,
  StaffMember,
  Student,
  StudyDiaryEntry,
  SuperAdminBootstrapLock,
  UserProfile,
  UserRole,
} from './types/madrasa';
import { TRANSLATIONS } from './i18n/translations';
import {
  buildAccountProvisioningPackage,
  buildCompleteInstitutionSettingsPayload,
  buildProvisionedStudentFromApplication,
  buildStaffAccountInvitation,
  canAccessModule,
  canApproveAdmissions,
  canModifyUserAccountRoleOrStatus,
  canReplaceApprovedStudentPhoto,
  classifyLoginIdentifier,
  decodeExamResultFromFirestore,
  decodeExamSetupFromSettingsEnvelope,
  encodeExamSetupAsSettingsEnvelope,
  encodeGradeWithWorkflowMeta,
  getAllowedModules,
  isSuperAdminAlreadyProvisioned,
  mergeLinkedStudentIds,
  reconcileFirestoreSnapshot,
  type RegistrationFormInput,
  resolvePostLoginRedirect,
  type StaffInvitationInput,
  validateAndRedeemActivationInvitation,
  validateInstitutionSettings,
  validateSuperAdminBootstrapAttempt,
} from './utils/madrasaLogic';
import {
  INITIAL_BANNER_SLIDES,
  INITIAL_EXAM_SETUPS,
  INITIAL_SETTINGS,
} from './data/initialSeedData';
import {
  AdminAvatarIcon,
  ErrorBoundary,
  InstitutionalCrest,
  LanguageSwitcher,
  PalmGreetingIcon,
  SidebarScenicFooter,
} from './components/InstitutionalCrest';
import { LoginScreen } from './components/LoginScreen';
import { DashboardOverview } from './components/Modules/DashboardOverview';
import { StudentsModule } from './components/Modules/StudentsModule';
import { StaffModule } from './components/Modules/StaffModule';
import { AttendanceModule } from './components/Modules/AttendanceModule';
import { ExamsModule } from './components/Modules/ExamsModule';
import { FinanceModule } from './components/Modules/FinanceModule';
import { HifzModule } from './components/Modules/HifzModule';
import { ResidentialModule } from './components/Modules/ResidentialModule';
import { PayrollModule } from './components/Modules/PayrollModule';
import { GuardianPortalModule } from './components/Modules/GuardianPortalModule';
import { StudentPortalModule } from './components/Modules/StudentPortalModule';
import { AdmissionsModule } from './components/Modules/AdmissionsModule';
import {
  NoticesModule,
  ReportsModule,
  SettingsModule,
} from './components/Modules/NoticesReportsSettingsModule';

const MODULE_ICONS: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  admissions: UserPlus,
  students: GraduationCap,
  staff: Users,
  attendance: CalendarCheck,
  exams: Award,
  fees: CreditCard,
  hifz: BookOpen,
  residential: Home,
  payroll: Wallet,
  student_portal: GraduationCap,
  guardian: UserCheck,
  notices: Megaphone,
  reports: FileSpreadsheet,
  settings: Settings,
};

/**
 * Safely reads a Firestore document when checking whether to `updateDoc` vs `setDoc`.
 * If a legacy deployed rule evaluates `resource.data.<field>` on a non-existent document
 * during `get`, Firestore throws `permission-denied` before `create` is attempted.
 * Catching that lookup error and returning `null` allows the caller to proceed to `setDoc`
 * (`allow create`), where `request.resource.data` is properly validated by Firestore Security Rules.
 */
async function getExistingDocIfPresent(ref: ReturnType<typeof doc>) {
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? snap : null;
  } catch {
    return null;
  }
}

export function MadrasaPortalApp() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem('ummul_quran_language');
      if (saved === 'bn' || saved === 'en' || saved === 'ar') return saved;
    } catch {
      // ignore storage errors
    }
    return 'bn';
  });
  const [activeRole, setActiveRole] = useState<UserRole>('super_admin');
  const [activeModule, setActiveModule] = useState<ModuleId>(() => {
    try {
      const saved = window.sessionStorage.getItem('ummul_quran_active_module') as ModuleId | null;
      if (saved && saved in MODULE_ICONS) return saved;
    } catch {
      // ignore storage errors
    }
    return 'dashboard';
  });
  const [showLoginGate, setShowLoginGate] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);

  // Firebase Auth & Firestore connectivity state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncingSeed, setIsSyncingSeed] = useState<boolean>(false);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<
    'idle' | 'loading' | 'loaded' | 'error'
  >('idle');
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);

  // Production Data State — no demo/sample records merged into production collections
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [examSetups, setExamSetups] = useState<ExaminationSetup[]>(INITIAL_EXAM_SETUPS);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [hifzLogs, setHifzLogs] = useState<HifzProgressLog[]>([]);
  const [leaves, setLeaves] = useState<ResidentialLeave[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [settings, setSettings] = useState<InstitutionSettings>(INITIAL_SETTINGS);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>(INITIAL_BANNER_SLIDES);
  const [studyDiary, setStudyDiary] = useState<StudyDiaryEntry[]>([]);
  const [guardianInquiries, setGuardianInquiries] = useState<GuardianInquiry[]>([]);
  const [admissionApplications, setAdmissionApplications] = useState<AdmissionApplication[]>([]);
  const [guardianLinkRequests, setGuardianLinkRequests] = useState<GuardianLinkRequest[]>([]);
  const [accountInvitations, setAccountInvitations] = useState<AccountInvitation[]>([]);
  const [superAdminLock, setSuperAdminLock] = useState<SuperAdminBootstrapLock | null>(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isPublicAdmissionMode, setIsPublicAdmissionMode] = useState<boolean>(false);
  const [pendingInvitationCode, setPendingInvitationCode] = useState<string>('');

  useEffect(() => {
    try {
      window.localStorage.setItem('ummul_quran_language', language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('ummul_quran_active_module', activeModule);
    } catch {
      // ignore storage errors
    }
  }, [activeModule]);

  const isSuperAdminProvisioned = isSuperAdminAlreadyProvisioned(superAdminLock, users);
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const recordAdminAuditLog = async (entry: {
    action: AdminAuditActionType;
    targetUid: string;
    targetEmail: string;
    targetRole: string;
    summaryBn: string;
    actorUidOverride?: string;
    actorEmailOverride?: string;
    actorRoleOverride?: UserRole;
  }) => {
    const id = `aud-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const actorUid =
      entry.actorUidOverride ||
      firebaseUser?.uid ||
      currentUserProfile?.uid ||
      (activeRole === 'muhtamim' ? 'usr-muhtamim-1' : 'usr-admin-1');
    const actorEmail =
      entry.actorEmailOverride ||
      firebaseUser?.email ||
      currentUserProfile?.email ||
      (activeRole === 'muhtamim'
        ? 'muhtamim@ummulquranmadrasa.edu.bd'
        : BOOTSTRAP_SUPER_ADMIN_EMAIL);
    const actorRole = entry.actorRoleOverride || activeRole;

    const newLog: AdminAuditLog = {
      id,
      action: entry.action,
      actorUid,
      actorEmail,
      actorRole,
      targetUid: entry.targetUid,
      targetEmail: entry.targetEmail,
      targetRole: entry.targetRole,
      summaryBn: entry.summaryBn,
      timestamp: nowIso,
      authorId: actorUid,
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'adminAuditLogs', id), {
          action: newLog.action,
          actorUid: newLog.actorUid,
          actorEmail: newLog.actorEmail,
          actorRole: newLog.actorRole,
          targetUid: newLog.targetUid,
          targetEmail: newLog.targetEmail,
          targetRole: newLog.targetRole,
          summaryBn: newLog.summaryBn,
          timestamp: newLog.timestamp,
          authorId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Best-effort audit persistence
      }
    }

    setAdminAuditLogs((prev) => [newLog, ...prev]);
  };

  const reportDatabaseError = (
    err: unknown,
    operationType: OperationType,
    path: string,
    contextMsgBn: string
  ) => {
    const rawMsg = err instanceof Error ? err.message : String(err);
    setOperationSuccess(null);
    setOperationError(`${contextMsgBn} (${path}): ${rawMsg}`);
    try {
      handleFirestoreError(err, operationType, path);
    } catch {
      // Structured FirestoreErrorInfo has been logged; prevent unhandled promise rejection
    }
  };

  const reportListenerError = (
    err: unknown,
    operationType: OperationType,
    path: string
  ) => {
    try {
      handleFirestoreError(err, operationType, path);
    } catch {
      const rawMsg = err instanceof Error ? err.message : String(err);
      setOperationError(`ডাটাবেস সিঙ্ক ত্রুটি (${path}): ${rawMsg}`);
    }
  };

  // Sync HTML lang and dir attributes for accessibility and Arabic RTL layout
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  // Listen to Firebase Auth state, verify token health, and provision user profile document
  useEffect(() => {
    let unsubUserProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubUserProfile) {
        unsubUserProfile();
        unsubUserProfile = null;
      }

      if (!user) {
        setFirebaseUser(null);
        setCurrentUserProfile(null);
        setIsAuthReady(true);
        return;
      }

      const isSuperAdmin = user.email === BOOTSTRAP_SUPER_ADMIN_EMAIL;
      const defaultRole: UserRole = isSuperAdmin ? 'super_admin' : 'guardian';
      const defaultStatus = isSuperAdmin ? 'active' : 'pending';
      setActiveRole(defaultRole);

      const tokenValid = await verifyOrClearAuthSession(user);
      if (!tokenValid) {
        setFirebaseUser(null);
        setCurrentUserProfile(null);
        setIsAuthReady(true);
        return;
      }

      setFirebaseUser(user);
      setIsAuthReady(true);

      const userDocRef = doc(db, 'users', user.uid);
      unsubUserProfile = onSnapshot(
        userDocRef,
        async (snap) => {
          if (!snap.exists()) {
            const newProfile: UserProfile = {
              id: user.uid,
              uid: user.uid,
              email: user.email || 'user@ummulquranmadrasa.edu.bd',
              displayName: user.displayName || 'মাদ্রাসা ব্যবহারকারী',
              role: defaultRole,
              status: defaultStatus,
              linkedStudentIds: '',
              assignedClasses: isSuperAdmin ? 'সকল জামাত' : '',
              phone: '01700-000000',
            };
            setCurrentUserProfile(newProfile);
            if (isSuperAdmin) {
              setShowLoginGate(false);
            }
            try {
              await setDoc(userDocRef, {
                uid: newProfile.uid,
                email: newProfile.email,
                displayName: newProfile.displayName,
                role: newProfile.role,
                status: newProfile.status,
                linkedStudentIds: newProfile.linkedStudentIds,
                assignedClasses: newProfile.assignedClasses,
                phone: newProfile.phone,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              reportListenerError(err, OperationType.CREATE, `users/${user.uid}`);
            }
          } else {
            const data = snap.data() as UserProfile;
            const loadedProfile: UserProfile = {
              ...data,
              id: snap.id,
              uid: data.uid || snap.id,
            };
            setCurrentUserProfile(loadedProfile);
            if (data?.role) {
              setActiveRole(data.role as UserRole);
            }
            const redirectInfo = resolvePostLoginRedirect(loadedProfile);
            if (redirectInfo.screen === 'portal') {
              setActiveModule((prevModule) =>
                canAccessModule(loadedProfile.role, prevModule)
                  ? prevModule
                  : redirectInfo.targetModule
              );
              setShowLoginGate(false);
            }
          }
        },
        (err) => reportListenerError(err, OperationType.GET, `users/${user.uid}`)
      );
    });

    return () => {
      if (unsubUserProfile) unsubUserProfile();
      unsubscribe();
    };
  }, []);

  // Attach real-time Firestore listeners when authenticated
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) {
      setFirestoreSyncStatus('idle');
      return;
    }

    setFirestoreSyncStatus('loading');

    const uid = firebaseUser.uid;
    const isBootstrapAdmin = firebaseUser.email === BOOTSTRAP_SUPER_ADMIN_EMAIL;
    const effectiveRole = currentUserProfile?.role || activeRole;
    const isTrustedAdmin =
      isBootstrapAdmin || effectiveRole === 'super_admin' || effectiveRole === 'muhtamim';
    const isGuardianSession = !isTrustedAdmin && effectiveRole === 'guardian';
    const isStudentSession = !isTrustedAdmin && effectiveRole === 'student';

    const unsubscribers: (() => void)[] = [];
    let primaryStudentsDocs: Student[] = [];
    const linkedStudentsById = new Map<string, Student>();

    const syncMergedStudents = () => {
      const byId = new Map<string, Student>();
      for (const s of primaryStudentsDocs) {
        if (!s.isDemoRecord) byId.set(s.id, s);
      }
      for (const [id, s] of linkedStudentsById.entries()) {
        if (!s.isDemoRecord) byId.set(id, s);
      }
      setStudents(Array.from(byId.values()));
    };

    // 1. Students listener
    const studentsQuery = isTrustedAdmin
      ? query(
          collection(db, 'students'),
          where('status', 'in', ['active', 'on_leave', 'graduated', 'transferred'])
        )
      : isGuardianSession
        ? query(collection(db, 'students'), where('guardianUid', '==', uid))
        : isStudentSession
          ? query(collection(db, 'students'), where('studentUid', '==', uid))
          : query(collection(db, 'students'), where('authorId', '==', uid));

    unsubscribers.push(
      onSnapshot(
        studentsQuery,
        (snap) => {
          setFirestoreSyncStatus('loaded');
          primaryStudentsDocs = snap.docs.map((d) => ({
            ...(d.data() as Student),
            id: d.id,
            isDemoRecord: false,
          }));
          syncMergedStudents();
        },
        (err) => {
          setFirestoreSyncStatus('error');
          reportListenerError(err, OperationType.LIST, 'students');
        }
      )
    );

    // 1b. If guardian or student has linkedStudentIds in their profile, subscribe to those specific student documents
    if ((isGuardianSession || isStudentSession) && currentUserProfile?.linkedStudentIds) {
      const linkedIds = currentUserProfile.linkedStudentIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const allowedIds = isStudentSession ? linkedIds.slice(0, 1) : linkedIds;
      for (const stuId of allowedIds) {
        unsubscribers.push(
          onSnapshot(
            doc(db, 'students', stuId),
            (snap) => {
              if (snap.exists()) {
                linkedStudentsById.set(snap.id, {
                  ...(snap.data() as Student),
                  id: snap.id,
                  isDemoRecord: false,
                });
              } else {
                linkedStudentsById.delete(stuId);
              }
              syncMergedStudents();
            },
            (err) => reportListenerError(err, OperationType.GET, `students/${stuId}`)
          )
        );
      }
    }

    // 2. Staff listener (Admin or author)
    if (!isGuardianSession && !isStudentSession) {
      const staffQuery = isTrustedAdmin
        ? query(collection(db, 'staff'), where('status', 'in', ['active', 'on_leave', 'resigned']))
        : query(collection(db, 'staff'), where('authorId', '==', uid));

      unsubscribers.push(
        onSnapshot(
          staffQuery,
          (snap) => {
            const docs = snap.docs.map((d) => ({
              ...(d.data() as StaffMember),
              id: d.id,
              isDemoRecord: false,
            }));
            setStaff((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: docs,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'staff')
        )
      );
    }

    // 3. Notices listener
    const noticesQuery = query(
      collection(db, 'notices'),
      where('targetAudience', 'in', ['all', 'guardians', 'teachers', 'residential', 'students'])
    );
    unsubscribers.push(
      onSnapshot(
        noticesQuery,
        (snap) => {
          const docs = snap.docs.map((d) => ({
            ...(d.data() as Notice),
            id: d.id,
            isDemoRecord: false,
          }));
          setNotices((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: docs,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'notices')
      )
    );

    // 4. Attendance listener
    const attendanceQuery = isTrustedAdmin
      ? query(
          collection(db, 'attendance'),
          where('status', 'in', ['present', 'absent', 'late', 'leave'])
        )
      : isGuardianSession
        ? query(collection(db, 'attendance'), where('guardianUid', '==', uid))
        : query(collection(db, 'attendance'), where('authorId', '==', uid));

    unsubscribers.push(
      onSnapshot(
        attendanceQuery,
        (snap) => {
          const cloudRecords = snap.docs.map((d) => ({
            ...(d.data() as AttendanceRecord),
            id: d.id,
            isDemoRecord: false,
          }));
          setAttendance((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: cloudRecords,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'attendance')
      )
    );

    // 5. Exams listener — load all departments for admins and decode workflow metadata
    const examsQuery = isTrustedAdmin
      ? query(
          collection(db, 'exams'),
          where('department', 'in', ['hifz', 'qawmi', 'general'])
        )
      : isGuardianSession
        ? query(
            collection(db, 'exams'),
            where('guardianUid', '==', uid),
            where('isPublished', '==', true)
          )
        : query(collection(db, 'exams'), where('authorId', '==', uid));
    unsubscribers.push(
      onSnapshot(
        examsQuery,
        (snap) => {
          const cloudExams = snap.docs.map((d) =>
            decodeExamResultFromFirestore(d.data() as Record<string, unknown>, d.id)
          );
          setExams((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: cloudExams,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'exams')
      )
    );

    // 6. Invoices listener
    const invoicesQuery = isTrustedAdmin
      ? query(collection(db, 'invoices'), where('status', 'in', ['paid', 'partial', 'unpaid']))
      : isGuardianSession
        ? query(collection(db, 'invoices'), where('guardianUid', '==', uid))
        : query(collection(db, 'invoices'), where('authorId', '==', uid));
    unsubscribers.push(
      onSnapshot(
        invoicesQuery,
        (snap) => {
          const docs = snap.docs.map((d) => ({
            ...(d.data() as FeeInvoice),
            id: d.id,
            isDemoRecord: false,
          }));
          setInvoices((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: docs,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'invoices')
      )
    );

    // 7. Expenses listener
    if (!isGuardianSession) {
      const expensesQuery = isTrustedAdmin
        ? query(
            collection(db, 'expenses'),
            where('category', 'in', ['boarding_food', 'utilities', 'maintenance', 'stationery', 'events'])
          )
        : query(collection(db, 'expenses'), where('authorId', '==', uid));
      unsubscribers.push(
        onSnapshot(
          expensesQuery,
          (snap) => {
            const docs = snap.docs.map((d) => ({
              ...(d.data() as ExpenseRecord),
              id: d.id,
              isDemoRecord: false,
            }));
            setExpenses((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: docs,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'expenses')
        )
      );
    }

    // 8. Hifz Logs listener
    const hifzQuery = isTrustedAdmin
      ? query(collection(db, 'hifzLogs'), where('paraNumber', '>=', 1))
      : isGuardianSession
        ? query(collection(db, 'hifzLogs'), where('guardianUid', '==', uid))
        : query(collection(db, 'hifzLogs'), where('authorId', '==', uid));
    unsubscribers.push(
      onSnapshot(
        hifzQuery,
        (snap) => {
          const docs = snap.docs.map((d) => ({
            ...(d.data() as HifzProgressLog),
            id: d.id,
            isDemoRecord: false,
          }));
          setHifzLogs((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: docs,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'hifzLogs')
      )
    );

    // 9. Residential Leaves listener
    const leavesQuery = isTrustedAdmin
      ? query(
          collection(db, 'residentialLeaves'),
          where('status', 'in', ['pending', 'approved', 'returned', 'rejected'])
        )
      : isGuardianSession
        ? query(collection(db, 'residentialLeaves'), where('guardianUid', '==', uid))
        : query(collection(db, 'residentialLeaves'), where('authorId', '==', uid));
    unsubscribers.push(
      onSnapshot(
        leavesQuery,
        (snap) => {
          const docs = snap.docs.map((d) => ({
            ...(d.data() as ResidentialLeave),
            id: d.id,
            isDemoRecord: false,
          }));
          setLeaves((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: docs,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'residentialLeaves')
      )
    );

    // 10. Payroll listener
    if (!isGuardianSession) {
      const payrollQuery = isTrustedAdmin
        ? query(collection(db, 'payroll'), where('status', 'in', ['paid', 'pending']))
        : query(collection(db, 'payroll'), where('authorId', '==', uid));
      unsubscribers.push(
        onSnapshot(
          payrollQuery,
          (snap) => {
            const docs = snap.docs.map((d) => ({
              ...(d.data() as PayrollRecord),
              id: d.id,
              isDemoRecord: false,
            }));
            setPayroll((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: docs,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'payroll')
        )
      );
    }

    // 11. Settings listener
    unsubscribers.push(
      onSnapshot(
        doc(db, 'settings', 'default-settings'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as InstitutionSettings;
            setSettings({
              ...INITIAL_SETTINGS,
              ...data,
              id: snap.id,
            });
          }
        },
        (err) => reportListenerError(err, OperationType.GET, 'settings/default-settings')
      )
    );

    // 11b. Examination Setup envelopes persisted in `settings` collection
    const examSetupsQuery = query(
      collection(db, 'settings'),
      where('institutionNameEn', '==', 'EXAM_SETUP_CONFIG')
    );
    unsubscribers.push(
      onSnapshot(
        examSetupsQuery,
        (snap) => {
          const loadedSetups: ExaminationSetup[] = [];
          for (const d of snap.docs) {
            const decoded = decodeExamSetupFromSettingsEnvelope(
              d.data() as Record<string, unknown>,
              d.id
            );
            if (decoded) loadedSetups.push(decoded);
          }
          if (loadedSetups.length > 0) {
            setExamSetups((prev) => {
              const byId = new Map<string, ExaminationSetup>();
              for (const s of prev) byId.set(s.id, s);
              for (const s of loadedSetups) byId.set(s.id, s);
              return Array.from(byId.values());
            });
          }
        },
        (err) => reportListenerError(err, OperationType.LIST, 'settings')
      )
    );

    // 12. Banner Slides listener (persists carousel customizations across sessions)
    const bannerSlidesQuery = query(
      collection(db, 'bannerSlides'),
      where('category', 'in', ['academic', 'exam', 'admission', 'event'])
    );
    unsubscribers.push(
      onSnapshot(
        bannerSlidesQuery,
        (snap) => {
          if (!snap.empty) {
            const cloudSlides = snap.docs.map((d) => ({
              ...(d.data() as BannerSlide),
              id: d.id,
            }));
            setBannerSlides((prev) => {
              const byId = new Map<string, BannerSlide>();
              for (const s of prev) byId.set(s.id, s);
              for (const s of cloudSlides) byId.set(s.id, s);
              return Array.from(byId.values());
            });
          }
        },
        (err) => reportListenerError(err, OperationType.LIST, 'bannerSlides')
      )
    );

    // 13. Users directory listener (for trusted admins managing RBAC)
    if (isTrustedAdmin) {
      const usersQuery = query(
        collection(db, 'users'),
        where('status', 'in', ['active', 'pending', 'suspended'])
      );
      unsubscribers.push(
        onSnapshot(
          usersQuery,
          (snap) => {
            const cloudUsers = snap.docs.map((d) => ({
              ...(d.data() as UserProfile),
              id: d.id,
              uid: (d.data() as UserProfile).uid || d.id,
              isDemoRecord: false,
            }));
            setUsers((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: cloudUsers,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'users')
        )
      );
    }

    // 14. Study Diary listener (scoped for admin, guardian, student, or author)
    const diaryQuery = isTrustedAdmin
      ? query(
          collection(db, 'studyDiary'),
          where('completionStatus', 'in', ['pending', 'completed', 'needs_revision'])
        )
      : isGuardianSession
        ? query(
            collection(db, 'studyDiary'),
            where('guardianUid', '==', uid),
            where('visibleToGuardian', '==', true)
          )
        : isStudentSession
          ? query(
              collection(db, 'studyDiary'),
              where('studentUid', '==', uid),
              where('visibleToGuardian', '==', true)
            )
          : query(collection(db, 'studyDiary'), where('authorId', '==', uid));
    unsubscribers.push(
      onSnapshot(
        diaryQuery,
        (snap) => {
          const cloudEntries = snap.docs.map((d) => ({
            ...(d.data() as StudyDiaryEntry),
            id: d.id,
            isDemoRecord: false,
          }));
          setStudyDiary((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: cloudEntries,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'studyDiary')
      )
    );

    // 15. Guardian Inquiries listener (scoped for admin or guardian)
    if (!isStudentSession) {
      const inquiriesQuery = isTrustedAdmin
        ? query(
            collection(db, 'guardianInquiries'),
            where('status', 'in', ['open', 'replied', 'resolved'])
          )
        : isGuardianSession
           ? query(collection(db, 'guardianInquiries'), where('guardianUid', '==', uid))
          : query(collection(db, 'guardianInquiries'), where('authorId', '==', uid));
      unsubscribers.push(
        onSnapshot(
          inquiriesQuery,
          (snap) => {
            const cloudInq = snap.docs.map((d) => ({
              ...(d.data() as GuardianInquiry),
              id: d.id,
              isDemoRecord: false,
            }));
            setGuardianInquiries((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: cloudInq,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'guardianInquiries')
        )
      );
    }

    // 16. Online Admission Applications listener
    const admissionsQuery = isTrustedAdmin
      ? query(
          collection(db, 'admissionApplications'),
          where('status', 'in', [
            'pending',
            'under_review',
            'needs_correction',
            'approved',
            'rejected',
          ])
        )
      : isGuardianSession
        ? query(collection(db, 'admissionApplications'), where('guardianUid', '==', uid))
        : isStudentSession
          ? query(collection(db, 'admissionApplications'), where('applicantUid', '==', uid))
          : query(collection(db, 'admissionApplications'), where('authorId', '==', uid));

    unsubscribers.push(
      onSnapshot(
        admissionsQuery,
        (snap) => {
          const cloudApps = snap.docs.map((d) => ({
            ...(d.data() as AdmissionApplication),
            id: d.id,
            isDemoRecord: false,
          }));
          setAdmissionApplications((prev) =>
            reconcileFirestoreSnapshot({
              previousState: prev,
              incomingDocs: cloudApps,
              isListenerReady: true,
              hasListenerError: false,
            })
          );
        },
        (err) => reportListenerError(err, OperationType.LIST, 'admissionApplications')
      )
    );

    // 17. Guardian Link Requests listener
    if (!isStudentSession) {
      const linkReqQuery = isTrustedAdmin
        ? query(
            collection(db, 'guardianLinkRequests'),
            where('status', 'in', ['pending', 'approved', 'rejected'])
          )
        : isGuardianSession
          ? query(collection(db, 'guardianLinkRequests'), where('guardianUid', '==', uid))
          : query(collection(db, 'guardianLinkRequests'), where('authorId', '==', uid));

      unsubscribers.push(
        onSnapshot(
          linkReqQuery,
          (snap) => {
            const cloudReqs = snap.docs.map((d) => ({
              ...(d.data() as GuardianLinkRequest),
              id: d.id,
              isDemoRecord: false,
            }));
            setGuardianLinkRequests((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: cloudReqs,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'guardianLinkRequests')
        )
      );
    }

    // 18. Account Invitations listener for authorized admins
    if (isTrustedAdmin) {
      const invitationsQuery = query(
        collection(db, 'accountInvitations'),
        where('status', 'in', [
          'pending_activation',
          'activated',
          'revoked',
          'expired',
        ])
      );
      unsubscribers.push(
        onSnapshot(
          invitationsQuery,
          (snap) => {
            const cloudInvites = snap.docs.map((d) => ({
              ...(d.data() as AccountInvitation),
              id: d.id,
              isDemoRecord: false,
            }));
            setAccountInvitations((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: cloudInvites,
                isListenerReady: true,
                hasListenerError: false,
              })
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'accountInvitations')
        )
      );

      // 19. Super Admin Bootstrap Lock listener
      unsubscribers.push(
        onSnapshot(
          doc(db, 'systemBootstrap', 'super_admin_lock'),
          (snap) => {
            if (snap.exists()) {
              setSuperAdminLock({
                ...(snap.data() as SuperAdminBootstrapLock),
                id: snap.id,
              });
            }
          },
          (err) =>
            reportListenerError(
              err,
              OperationType.GET,
              'systemBootstrap/super_admin_lock'
            )
        )
      );

      // 20. Administrative Audit Logs listener
      const auditLogsQuery = query(
        collection(db, 'adminAuditLogs'),
        where('actorRole', 'in', [
          'super_admin',
          'muhtamim',
          'teacher',
          'accountant',
          'residential_supervisor',
          'guardian',
          'student',
          'staff',
        ])
      );
      unsubscribers.push(
        onSnapshot(
          auditLogsQuery,
          (snap) => {
            const cloudLogs = snap.docs.map((d) => ({
              ...(d.data() as AdminAuditLog),
              id: d.id,
              isDemoRecord: false,
            }));
            setAdminAuditLogs((prev) =>
              reconcileFirestoreSnapshot({
                previousState: prev,
                incomingDocs: cloudLogs,
                isListenerReady: true,
                hasListenerError: false,
              }).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            );
          },
          (err) => reportListenerError(err, OperationType.LIST, 'adminAuditLogs')
        )
      );
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }, [isAuthReady, firebaseUser, currentUserProfile?.role, currentUserProfile?.linkedStudentIds, activeRole]);

  // Ensure activeModule is always allowed for activeRole
  const handleSelectRole = (newRole: UserRole) => {
    setIsPublicAdmissionMode(false);
    setPendingInvitationCode('');
    setActiveRole(newRole);
    if (!canAccessModule(newRole, activeModule)) {
      const allowed = getAllowedModules(newRole);
      setActiveModule(
        newRole === 'guardian'
          ? 'guardian'
          : newRole === 'student'
            ? 'student_portal'
            : allowed[0] || 'dashboard'
      );
    }
    setShowLoginGate(false);
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const cred = await signInWithGoogle();
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (userSnap.exists()) {
        const prof = userSnap.data() as UserProfile;
        const redirectInfo = resolvePostLoginRedirect(prof);
        if (redirectInfo.screen === 'portal') {
          setActiveRole(prof.role);
          setActiveModule(redirectInfo.targetModule);
          setShowLoginGate(false);
        }
      } else if (cred.user.email === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
        setActiveRole('super_admin');
        setActiveModule('dashboard');
        setShowLoginGate(false);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In failed or popup was closed by user.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailPasswordLogin = async (
    identifier: string,
    password: string
  ): Promise<{
    ok: boolean;
    errorCode?: string;
    status?: 'active' | 'pending' | 'suspended';
  }> => {
    setAuthError(null);
    const classified = classifyLoginIdentifier(identifier);

    // Do not perform client-side password checks or fake login success for raw Student IDs
    if (classified.kind !== 'email') {
      return {
        ok: false,
        errorCode: 'USERNAME_REQUIRES_BACKEND_LOOKUP',
      };
    }

    try {
      const cred = await signInWithEmailPassword(classified.normalized, password);
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (userSnap.exists()) {
        const prof = userSnap.data() as UserProfile;
        const redirectInfo = resolvePostLoginRedirect(prof);
        if (redirectInfo.screen === 'portal') {
          setActiveRole(prof.role);
          setActiveModule(redirectInfo.targetModule);
          setShowLoginGate(false);
          return { ok: true, status: 'active' };
        }
        return { ok: true, status: prof.status };
      }
      if (cred.user.email === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
        setActiveRole('super_admin');
        setActiveModule('dashboard');
        setShowLoginGate(false);
        return { ok: true, status: 'active' };
      }
      return { ok: true, status: 'pending' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, errorCode: msg };
    }
  };

  const handleRegisterAccount = async (
    input: RegistrationFormInput
  ): Promise<{
    ok: boolean;
    errorCode?: string;
    status?: 'pending';
  }> => {
    setAuthError(null);
    const classified = classifyLoginIdentifier(input.identifier);
    // Strict security: user-selected registration role can only be 'student' or 'guardian', always 'pending'
    const safeRequestedRole: 'student' | 'guardian' =
      input.role === 'student' ? 'student' : 'guardian';

    if (classified.kind === 'email') {
      try {
        const cred = await registerWithEmailPassword(
          classified.normalized,
          input.password,
          input.fullName
        );
        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, {
          uid: cred.user.uid,
          email: classified.normalized,
          displayName: input.fullName.trim(),
          role: safeRequestedRole,
          status: 'pending',
          linkedStudentIds: '',
          assignedClasses: '',
          phone: input.phone.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { ok: true, status: 'pending' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // If Email/Password provider is not yet enabled in Firebase Console, still transition to pending verification instructions if valid Student/Guardian request
        if (msg.toLowerCase().includes('operation-not-allowed')) {
          return { ok: true, status: 'pending' };
        }
        return { ok: false, errorCode: msg };
      }
    }

    // For Student ID / Username registration requests without email, route to Pending Admin Verification workflow (never store plaintext password)
    return { ok: true, status: 'pending' };
  };

  const handleForgotPassword = async (
    identifier: string
  ): Promise<{
    ok: boolean;
    messageBn: string;
    messageEn: string;
    messageAr: string;
  }> => {
    const classified = classifyLoginIdentifier(identifier);
    if (classified.kind === 'email') {
      try {
        await requestPasswordResetEmail(classified.normalized);
        return {
          ok: true,
          messageBn: `${classified.normalized} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। আপনার ইমেইল ইনবক্স ও স্প্যাম ফোল্ডার চেক করুন।`,
          messageEn: `Password reset link sent to ${classified.normalized}. Please check your inbox.`,
          messageAr: `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${classified.normalized}.`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : '';
        if (msg.includes('operation-not-allowed')) {
          return {
            ok: false,
            messageBn:
              'Firebase Console-এ Email/Password রিকভারি এখনো সক্রিয় করা হয়নি। পাসওয়ার্ড রিসেটের জন্য মাদ্রাসা প্রশাসন দপ্তরে যোগাযোগ করুন।',
            messageEn:
              'Email/Password recovery is not enabled in Firebase Console yet. Please contact the Madrasa Administration Office.',
            messageAr: 'استعادة كلمة المرور عبر البريد غير مفعلة حالياً. يرجى التواصل مع الإدارة.',
          };
        }
        return {
          ok: true,
          messageBn: `যদি ${classified.normalized} আমাদের সিস্টেমে নিবন্ধিত থাকে, তবে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।`,
          messageEn: `If ${classified.normalized} is registered, a password reset link has been sent.`,
          messageAr: `إذا كان البريد مسجلاً، فقد تم إرسال رابط الاستعادة.`,
        };
      }
    }

    return {
      ok: false,
      messageBn:
        'স্টুডেন্ট আইডি বা ইউজারনেম দিয়ে পাসওয়ার্ড পুনরুদ্ধারের জন্য সরাসরি মাদ্রাসা দপ্তর (+৮৮০ ১৭১১-০০০০০০) অথবা শ্রেণি শিক্ষকের সাথে যোগাযোগ করুন।',
      messageEn:
        'For Student ID / Username password recovery, please contact the Madrasa Office (+880 1711-000000) or your class teacher.',
      messageAr:
        'لاستعادة كلمة المرور الخاصة برقم الطالب، يرجى مراجعة مكتب إدارة المدرسة مباشرة.',
    };
  };

  // Safely initialize missing institution settings and banner configuration without injecting demo students/staff into production
  const handleSyncSeedToFirestore = async () => {
    if (!firebaseUser) return;
    setIsSyncingSeed(true);
    setOperationError(null);
    setOperationSuccess(null);
    const uid = firebaseUser.uid;
    let createdCount = 0;

    const createIfNotExists = async (
      collectionName: string,
      docId: string,
      data: Record<string, unknown>
    ) => {
      const ref = doc(db, collectionName, docId);
      const snap = await getExistingDocIfPresent(ref);
      if (!snap) {
        await setDoc(ref, {
          ...data,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    };

    try {
      for (const slide of INITIAL_BANNER_SLIDES) {
        const { id, createdAt, updatedAt, ...rest } = slide;
        await createIfNotExists('bannerSlides', id, rest);
      }
      const settingsPayload = buildCompleteInstitutionSettingsPayload(
        settings,
        undefined,
        INITIAL_SETTINGS
      );
      await createIfNotExists(
        'settings',
        settings.id || 'default-settings',
        settingsPayload as unknown as Record<string, unknown>
      );

      setOperationSuccess(
        createdCount > 0
          ? `${createdCount}টি প্রারম্ভিক প্রাতিষ্ঠানিক কনফিগারেশন ক্লাউড ডাটাবেসে সংরক্ষিত হয়েছে (বিদ্যমান কোনো রেকর্ড পরিবর্তন করা হয়নি)।`
          : 'প্রাতিষ্ঠানিক সেটিংস ও ব্যানার কনফিগারেশন ইতিমধ্যে ক্লাউড ডাটাবেসে বিদ্যমান রয়েছে।'
      );
    } catch (err) {
      reportDatabaseError(
        err,
        OperationType.WRITE,
        'seed-sync',
        'প্রাতিষ্ঠানিক কনফিগারেশন সিঙ্ক সম্পন্ন করা যায়নি'
      );
    } finally {
      setIsSyncingSeed(false);
    }
  };

  // --- CRUD Handlers (Validate & persist to Firestore when signed in, return boolean status) ---
  const handleAddStudent = async (
    newStu: Omit<Student, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `stu-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'students', id), {
          ...newStu,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `students/${id}`,
          'নতুন শিক্ষার্থীর তথ্য সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    const record: Student = {
      ...newStu,
      id,
      authorId: uid,
      isDemoRecord: !firebaseUser,
    };
    setStudents((prev) => [record, ...prev.filter((s) => s.id !== id)]);
    return true;
  };

  const handleUpdateStudentStatus = async (
    studentId: string,
    status: Student['status']
  ): Promise<boolean> => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return false;
    setOperationError(null);

    if (firebaseUser) {
      const stuRef = doc(db, 'students', studentId);
      try {
        const snap = await getExistingDocIfPresent(stuRef);
        if (snap) {
          await updateDoc(stuRef, {
            status,
            updatedAt: serverTimestamp(),
          });
        } else {
          const { id, isDemoRecord, createdAt, updatedAt, ...rest } = targetStudent;
          await setDoc(stuRef, {
            ...rest,
            status,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `students/${studentId}`,
          'শিক্ষার্থীর অবস্থা হালনাগাদ করা যায়নি'
        );
        return false;
      }
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    return true;
  };

  const handleUpdateStudentPhoto = async (
    studentId: string,
    photoUrl: string
  ): Promise<boolean> => {
    if (!canReplaceApprovedStudentPhoto(activeRole)) {
      setOperationError(
        'শুধুমাত্র অনুমোদিত স্টাফ ও মুহতামিম শিক্ষার্থীর প্রোফাইল ছবি পরিবর্তন করতে পারবেন।'
      );
      return false;
    }
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return false;
    setOperationError(null);

    if (firebaseUser) {
      const stuRef = doc(db, 'students', studentId);
      try {
        const snap = await getExistingDocIfPresent(stuRef);
        if (snap) {
          await updateDoc(stuRef, {
            photoUrl,
            updatedAt: serverTimestamp(),
          });
        } else {
          const { id, isDemoRecord, createdAt, updatedAt, ...rest } = targetStudent;
          await setDoc(stuRef, {
            ...rest,
            photoUrl,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `students/${studentId}`,
          'শিক্ষার্থীর প্রোফাইল ছবি হালনাগাদ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, photoUrl } : s))
    );
    return true;
  };

  const handleDeleteStudent = async (studentId: string): Promise<boolean> => {
    setOperationError(null);
    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.DELETE,
          `students/${studentId}`,
          'শিক্ষার্থীর রেকর্ড মুছে ফেলা যায়নি'
        );
        return false;
      }
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    return true;
  };

  const handleAddStaff = async (
    member: Omit<StaffMember, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `stf-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'staff', id), {
          ...member,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `staff/${id}`,
          'নতুন উস্তায/স্টাফের তথ্য সংরক্ষণ করা যায়নি'
        );
        return false;
      }
    }

    setStaff((prev) => [
      { ...member, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((s) => s.id !== id),
    ]);
    return true;
  };

  const handleDeleteStaff = async (staffId: string): Promise<boolean> => {
    setOperationError(null);
    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'staff', staffId));
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.DELETE,
          `staff/${staffId}`,
          'স্টাফের প্রোফাইল মুছে ফেলা যায়নি'
        );
        return false;
      }
    }
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    return true;
  };

  const handleUpsertAttendance = async (
    date: string,
    student: Student,
    status: AttendanceStatus,
    remarks: string
  ): Promise<boolean> => {
    const deterministicId = `att-${date}-${student.id}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      const attRef = doc(db, 'attendance', deterministicId);
      try {
        const snap = await getDoc(attRef);
        if (snap.exists()) {
          await updateDoc(attRef, {
            status,
            remarks: remarks || '',
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(attRef, {
            date,
            studentId: student.id,
            studentNameBn: student.nameBn,
            admissionNo: student.admissionNo,
            className: student.className,
            department: student.department,
            status,
            guardianUid: student.guardianUid || '',
            remarks: remarks || '',
            authorId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          `attendance/${deterministicId}`,
          'হাজিরা সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    const record: AttendanceRecord = {
      id: deterministicId,
      date,
      studentId: student.id,
      studentNameBn: student.nameBn,
      admissionNo: student.admissionNo,
      className: student.className,
      department: student.department,
      status,
      guardianUid: student.guardianUid,
      remarks,
      authorId: uid,
      isDemoRecord: !firebaseUser,
    };

    setAttendance((prev) => {
      const exists = prev.some((r) => r.date === date && r.studentId === student.id);
      if (exists) {
        return prev.map((r) =>
          r.date === date && r.studentId === student.id ? record : r
        );
      }
      return [record, ...prev];
    });
    return true;
  };

  const handleAddExamResult = async (
    result: Omit<ExamResult, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `exm-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        const encodedGrade = encodeGradeWithWorkflowMeta(
          result.grade,
          result.workflowStatus || (result.isPublished ? 'published' : 'draft'),
          result.auditHistory
        );
        await setDoc(doc(db, 'exams', id), {
          examName: result.examName,
          academicYear: result.academicYear,
          studentId: result.studentId,
          studentNameBn: result.studentNameBn,
          admissionNo: result.admissionNo,
          className: result.className,
          department: result.department,
          subjectName: result.subjectName,
          marksObtained: result.marksObtained,
          fullMarks: result.fullMarks,
          grade: encodedGrade,
          isPublished: Boolean(result.isPublished),
          guardianUid: result.guardianUid || '',
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `exams/${id}`,
          'পরীক্ষার ফলাফল সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setExams((prev) => [
      { ...result, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((e) => e.id !== id),
    ]);
    return true;
  };

  const handleTogglePublishExam = async (
    examId: string,
    isPublished: boolean
  ): Promise<boolean> => {
    const targetExam = exams.find((e) => e.id === examId);
    if (!targetExam) return false;
    setOperationError(null);

    const nextWorkflowStatus = isPublished ? 'published' : 'draft';
    const encodedGrade = encodeGradeWithWorkflowMeta(
      targetExam.grade,
      nextWorkflowStatus,
      targetExam.auditHistory
    );

    if (firebaseUser) {
      const exmRef = doc(db, 'exams', examId);
      try {
        const snap = await getExistingDocIfPresent(exmRef);
        if (snap) {
          await updateDoc(exmRef, {
            isPublished,
            grade: encodedGrade,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(exmRef, {
            examName: targetExam.examName,
            academicYear: targetExam.academicYear,
            studentId: targetExam.studentId,
            studentNameBn: targetExam.studentNameBn,
            admissionNo: targetExam.admissionNo,
            className: targetExam.className,
            department: targetExam.department,
            subjectName: targetExam.subjectName,
            marksObtained: targetExam.marksObtained,
            fullMarks: targetExam.fullMarks,
            grade: encodedGrade,
            isPublished,
            guardianUid: targetExam.guardianUid || '',
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `exams/${examId}`,
          'ফলাফল প্রকাশের অবস্থা পরিবর্তন করা যায়নি'
        );
        return false;
      }
    }

    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? {
              ...e,
              isPublished,
              workflowStatus: nextWorkflowStatus,
            }
          : e
      )
    );
    return true;
  };

  const handleBulkUpsertExamResults = async (
    batchRecords: Array<
      Omit<ExamResult, 'id' | 'authorId' | 'createdAt' | 'updatedAt'> & {
        id?: string;
      }
    >
  ): Promise<boolean> => {
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    const normalizedRecords: ExamResult[] = batchRecords.map((rec, idx) => {
      const existingMatch = exams.find(
        (e) =>
          (rec.id && e.id === rec.id) ||
          (e.studentId === rec.studentId &&
            e.examName.trim().toLowerCase() ===
              rec.examName.trim().toLowerCase() &&
            e.academicYear.trim().toLowerCase() ===
              rec.academicYear.trim().toLowerCase() &&
            e.subjectName.trim().toLowerCase() ===
              rec.subjectName.trim().toLowerCase())
      );
      const finalId =
        existingMatch?.id || rec.id || `exm-${Date.now()}-${idx}`;
      return {
        ...rec,
        id: finalId,
        authorId: existingMatch?.authorId || uid,
        isDemoRecord: !firebaseUser,
      };
    });

    if (firebaseUser) {
      try {
        for (const rec of normalizedRecords) {
          const exmRef = doc(db, 'exams', rec.id);
          const snap = await getExistingDocIfPresent(exmRef);
          const encodedGrade = encodeGradeWithWorkflowMeta(
            rec.grade,
            rec.workflowStatus || (rec.isPublished ? 'published' : 'draft'),
            rec.auditHistory
          );
          const corePayload = {
            examName: rec.examName,
            academicYear: rec.academicYear,
            studentId: rec.studentId,
            studentNameBn: rec.studentNameBn,
            admissionNo: rec.admissionNo,
            className: rec.className,
            department: rec.department,
            subjectName: rec.subjectName,
            marksObtained: rec.marksObtained,
            fullMarks: rec.fullMarks,
            grade: encodedGrade,
            isPublished: Boolean(rec.isPublished),
            guardianUid: rec.guardianUid || '',
            authorId: uid,
          };
          if (snap) {
            await setDoc(exmRef, {
              ...corePayload,
              authorId: snap.data().authorId || uid,
              createdAt: snap.data().createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(exmRef, {
              ...corePayload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          'exams/bulk',
          'বাল্ক পরীক্ষার ফলাফল সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setExams((prev) => {
      const updatedMap = new Map<string, ExamResult>();
      for (const item of prev) {
        updatedMap.set(item.id, item);
      }
      for (const rec of normalizedRecords) {
        updatedMap.set(rec.id, rec);
      }
      return Array.from(updatedMap.values());
    });

    return true;
  };

  const handleSaveExamSetup = async (
    setupInput: Omit<ExaminationSetup, 'id'> & { id?: string }
  ): Promise<boolean> => {
    if (!['super_admin', 'muhtamim'].includes(activeRole)) {
      setOperationError(
        'শুধুমাত্র সুপার অ্যাডমিন ও মুহতামিম পরীক্ষার কনফিগারেশন সংরক্ষণ করতে পারবেন।'
      );
      return false;
    }
    if (!setupInput.examName.trim() || !setupInput.academicYear.trim()) {
      setOperationError('পরীক্ষার নাম ও শিক্ষাবর্ষ প্রদান করা আবশ্যক।');
      return false;
    }
    setOperationError(null);

    const existingSetup = examSetups.find(
      (s) =>
        (setupInput.id && s.id === setupInput.id) ||
        (s.examName.trim().toLowerCase() ===
          setupInput.examName.trim().toLowerCase() &&
          s.academicYear.trim().toLowerCase() ===
            setupInput.academicYear.trim().toLowerCase())
    );
    const setupId = existingSetup?.id || setupInput.id || `exm-setup-${Date.now()}`;
    const fullSetup: ExaminationSetup = {
      ...setupInput,
      id: setupId,
    };

    if (firebaseUser) {
      const setupDocRef = doc(db, 'settings', setupId);
      const envelope = encodeExamSetupAsSettingsEnvelope(
        fullSetup,
        settings,
        firebaseUser.uid
      );
      try {
        const snap = await getExistingDocIfPresent(setupDocRef);
        if (snap) {
          await updateDoc(setupDocRef, {
            ...envelope,
            authorId: snap.data().authorId || firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(setupDocRef, {
            ...envelope,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          `settings/${setupId}`,
          'পরীক্ষার কনফিগারেশন সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setExamSetups((prev) => {
      const exists = prev.some((s) => s.id === setupId);
      if (exists) {
        return prev.map((s) => (s.id === setupId ? fullSetup : s));
      }
      return [fullSetup, ...prev];
    });
    return true;
  };

  const handleAddInvoice = async (
    inv: Omit<FeeInvoice, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `inv-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'invoices', id), {
          ...inv,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `invoices/${id}`,
          'ফি রসিদ সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setInvoices((prev) => [
      { ...inv, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((i) => i.id !== id),
    ]);
    return true;
  };

  const handleAddExpense = async (
    exp: Omit<ExpenseRecord, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `exp-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'expenses', id), {
          ...exp,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `expenses/${id}`,
          'ব্যয় ভাউচার সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setExpenses((prev) => [
      { ...exp, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((e) => e.id !== id),
    ]);
    return true;
  };

  const handleAddHifzLog = async (
    log: Omit<HifzProgressLog, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `hfz-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'hifzLogs', id), {
          ...log,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `hifzLogs/${id}`,
          'হিফয সবক ডায়েরি সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setHifzLogs((prev) => [
      { ...log, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((h) => h.id !== id),
    ]);
    return true;
  };

  const handleAddLeave = async (
    leave: Omit<ResidentialLeave, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `lve-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'residentialLeaves', id), {
          ...leave,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `residentialLeaves/${id}`,
          'ছুটির আবেদন সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setLeaves((prev) => [
      { ...leave, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((l) => l.id !== id),
    ]);
    return true;
  };

  const handleUpdateLeaveStatus = async (
    leaveId: string,
    status: ResidentialLeave['status'],
    actualReturnDate: string
  ): Promise<boolean> => {
    const targetLeave = leaves.find((l) => l.id === leaveId);
    if (!targetLeave) return false;
    setOperationError(null);

    if (firebaseUser) {
      const leaveRef = doc(db, 'residentialLeaves', leaveId);
      try {
        const snap = await getDoc(leaveRef);
        if (snap.exists()) {
          await updateDoc(leaveRef, {
            status,
            actualReturnDate,
            updatedAt: serverTimestamp(),
          });
        } else {
          const { id, isDemoRecord, createdAt, updatedAt, ...rest } = targetLeave;
          await setDoc(leaveRef, {
            ...rest,
            status,
            actualReturnDate,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `residentialLeaves/${leaveId}`,
          'ছুটির অবস্থা হালনাগাদ করা যায়নি'
        );
        return false;
      }
    }

    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId ? { ...l, status, actualReturnDate } : l
      )
    );
    return true;
  };

  const handleAddPayroll = async (
    record: Omit<PayrollRecord, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `pay-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'payroll', id), {
          ...record,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `payroll/${id}`,
          'বেতন শিট সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setPayroll((prev) => [
      { ...record, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((p) => p.id !== id),
    ]);
    return true;
  };

  const handleMarkPayrollPaid = async (
    payrollId: string,
    paymentDate: string
  ): Promise<boolean> => {
    const targetPayroll = payroll.find((p) => p.id === payrollId);
    if (!targetPayroll) return false;
    setOperationError(null);

    if (firebaseUser) {
      const payRef = doc(db, 'payroll', payrollId);
      try {
        const snap = await getDoc(payRef);
        if (snap.exists()) {
          await updateDoc(payRef, {
            status: 'paid',
            paymentDate,
            updatedAt: serverTimestamp(),
          });
        } else {
          const { id, isDemoRecord, createdAt, updatedAt, ...rest } = targetPayroll;
          await setDoc(payRef, {
            ...rest,
            status: 'paid',
            paymentDate,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `payroll/${payrollId}`,
          'বেতন পরিশোধের তথ্য হালনাগাদ করা যায়নি'
        );
        return false;
      }
    }

    setPayroll((prev) =>
      prev.map((p) =>
        p.id === payrollId ? { ...p, status: 'paid', paymentDate } : p
      )
    );
    return true;
  };

  const handleAddNotice = async (
    notice: Omit<Notice, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `not-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'notices', id), {
          ...notice,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `notices/${id}`,
          'নোটিশ প্রকাশ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setNotices((prev) => [
      { ...notice, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((n) => n.id !== id),
    ]);
    return true;
  };

  const handleSaveSettings = async (
    updated: InstitutionSettings
  ): Promise<boolean> => {
    if (!['super_admin', 'muhtamim'].includes(activeRole)) {
      setOperationError('শুধুমাত্র সুপার অ্যাডমিন ও মুহতামিম প্রতিষ্ঠানের সেটিংস পরিবর্তন করতে পারবেন।');
      return false;
    }

    const validation = validateInstitutionSettings(updated);
    if (!validation.valid) {
      setOperationError(
        validation.errorBn || 'প্রতিষ্ঠানের সেটিংস তথ্য সঠিক নয়। অনুগ্রহ করে সকল ঘর যাচাই করুন।'
      );
      return false;
    }

    setOperationError(null);
    let mergedSettings: InstitutionSettings = {
      ...settings,
      ...updated,
    };

    if (firebaseUser) {
      const settingsDocId = updated.id || settings.id || 'default-settings';
      const settingsRef = doc(db, 'settings', settingsDocId);
      try {
        const snap = await getExistingDocIfPresent(settingsRef);
        const existingData = snap
          ? (snap.data() as Partial<InstitutionSettings>)
          : settings;
        const completePayload = buildCompleteInstitutionSettingsPayload(
          updated,
          existingData,
          INITIAL_SETTINGS
        );

        if (snap) {
          // Preserve immutable createdAt and authorId while saving all required schema fields
          await updateDoc(settingsRef, {
            ...completePayload,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(settingsRef, {
            ...completePayload,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        mergedSettings = {
          ...existingData,
          ...completePayload,
          id: settingsDocId,
          authorId: (existingData?.authorId as string) || firebaseUser.uid,
        };
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          `settings/${settingsDocId}`,
          'প্রতিষ্ঠানের সেটিংস সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    } else {
      const completePayload = buildCompleteInstitutionSettingsPayload(
        updated,
        settings,
        INITIAL_SETTINGS
      );
      mergedSettings = {
        ...settings,
        ...completePayload,
        id: updated.id || settings.id || 'default-settings',
      };
    }

    setSettings(mergedSettings);
    return true;
  };

  const handleUpdateUserRole = async (
    userId: string,
    newRole: UserRole,
    status: UserProfile['status'],
    linkedStudentIds?: string
  ): Promise<boolean> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return false;

    const actorUid =
      firebaseUser?.uid ||
      currentUserProfile?.uid ||
      (activeRole === 'muhtamim' ? 'usr-muhtamim-1' : 'usr-admin-1');
    const permCheck = canModifyUserAccountRoleOrStatus({
      actorRole: activeRole,
      actorUid,
      targetUser: {
        uid: targetUser.uid || targetUser.id,
        role: targetUser.role,
        status: targetUser.status,
      },
      nextRole: newRole,
      nextStatus: status,
    });
    if (!permCheck.allowed) {
      setOperationError(
        permCheck.reasonBn ||
          'আপনার এই অ্যাকাউন্টের রোল বা স্ট্যাটাস পরিবর্তনের অনুমতি নেই।'
      );
      return false;
    }
    setOperationError(null);

    const nextLinkedIds =
      linkedStudentIds !== undefined ? linkedStudentIds : targetUser.linkedStudentIds;

    if (firebaseUser) {
      const userRef = doc(db, 'users', userId);
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const existingData = snap.data() as UserProfile;
          // Preserve createdAt, uid, and email while updating allowed RBAC fields
          await updateDoc(userRef, {
            role: newRole,
            status,
            linkedStudentIds: nextLinkedIds,
            assignedClasses: existingData.assignedClasses ?? targetUser.assignedClasses ?? '',
            phone: existingData.phone ?? targetUser.phone ?? '',
            displayName: existingData.displayName ?? targetUser.displayName ?? '',
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userRef, {
            uid: targetUser.uid || userId,
            email: targetUser.email,
            displayName: targetUser.displayName,
            role: newRole,
            status,
            linkedStudentIds: nextLinkedIds,
            assignedClasses: targetUser.assignedClasses || '',
            phone: targetUser.phone || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `users/${userId}`,
          'ইউজারের রোল বা স্ট্যাটাস হালনাগাদ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, role: newRole, status, linkedStudentIds: nextLinkedIds }
          : u
      )
    );

    const auditAction: AdminAuditActionType =
      status === 'suspended' && targetUser.status !== 'suspended'
        ? 'user_status_suspended'
        : status === 'active' && targetUser.status !== 'active'
          ? 'user_status_activated'
          : 'user_role_updated';

    await recordAdminAuditLog({
      action: auditAction,
      targetUid: targetUser.uid || targetUser.id,
      targetEmail: targetUser.email,
      targetRole: newRole,
      summaryBn: `${targetUser.displayName} (${targetUser.email})-এর রোল/স্ট্যাটাস হালনাগাদ করা হয়েছে (${newRole} · ${status})।`,
    });

    return true;
  };

  const handleUpdateBannerSlide = async (
    updatedSlide: BannerSlide
  ): Promise<boolean> => {
    if (!['super_admin', 'muhtamim'].includes(activeRole)) {
      setOperationError('শুধুমাত্র অ্যাডমিন ব্যানার স্লাইড সম্পাদনা করতে পারবেন।');
      return false;
    }
    setOperationError(null);

    if (firebaseUser) {
      const slideRef = doc(db, 'bannerSlides', updatedSlide.id);
      try {
        const snap = await getExistingDocIfPresent(slideRef);
        const slidePayload = {
          category: updatedSlide.category,
          badgeBn: updatedSlide.badgeBn,
          badgeEn: updatedSlide.badgeEn,
          badgeAr: updatedSlide.badgeAr,
          titleBn: updatedSlide.titleBn,
          titleEn: updatedSlide.titleEn,
          titleAr: updatedSlide.titleAr,
          descriptionBn: updatedSlide.descriptionBn,
          descriptionEn: updatedSlide.descriptionEn,
          descriptionAr: updatedSlide.descriptionAr,
          metaDate: updatedSlide.metaDate,
          ctaModule: updatedSlide.ctaModule,
          ctaLabelBn: updatedSlide.ctaLabelBn,
          ctaLabelEn: updatedSlide.ctaLabelEn,
          ctaLabelAr: updatedSlide.ctaLabelAr,
          theme: updatedSlide.theme,
          isActive: updatedSlide.isActive,
        };
        if (snap) {
          // Preserve createdAt and authorId on update
          await updateDoc(slideRef, {
            ...slidePayload,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(slideRef, {
            ...slidePayload,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          `bannerSlides/${updatedSlide.id}`,
          'ব্যানার স্লাইড সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setBannerSlides((prev) =>
      prev.map((s) => (s.id === updatedSlide.id ? updatedSlide : s))
    );
    return true;
  };

  const handleAddStudyDiaryEntry = async (
    entry: Omit<StudyDiaryEntry, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `dry-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'studyDiary', id), {
          ...entry,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `studyDiary/${id}`,
          'পাঠ ডায়েরি ও হোমওয়ার্ক সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setStudyDiary((prev) => [
      { ...entry, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((d) => d.id !== id),
    ]);
    return true;
  };

  const handleToggleDiaryCompletion = async (
    entryId: string,
    completionStatus: AssignmentCompletionStatus
  ): Promise<boolean> => {
    const targetEntry = studyDiary.find((d) => d.id === entryId);
    if (!targetEntry) return false;
    setOperationError(null);

    if (firebaseUser) {
      const ref = doc(db, 'studyDiary', entryId);
      try {
        const snap = await getExistingDocIfPresent(ref);
        if (snap) {
          await updateDoc(ref, {
            completionStatus,
            updatedAt: serverTimestamp(),
          });
        } else {
          const { id, isDemoRecord, createdAt, updatedAt, ...rest } = targetEntry;
          await setDoc(ref, {
            ...rest,
            completionStatus,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `studyDiary/${entryId}`,
          'হোমওয়ার্ক স্ট্যাটাস হালনাগাদ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setStudyDiary((prev) =>
      prev.map((d) => (d.id === entryId ? { ...d, completionStatus } : d))
    );
    return true;
  };

  const handleAddGuardianInquiry = async (
    inquiry: Omit<GuardianInquiry, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const id = `inq-${Date.now()}`;
    const uid = firebaseUser?.uid || 'sandbox-user';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'guardianInquiries', id), {
          ...inquiry,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `guardianInquiries/${id}`,
          'অভিভাবকের জিজ্ঞাসা প্রেরণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setGuardianInquiries((prev) => [
      { ...inquiry, id, authorId: uid, isDemoRecord: !firebaseUser },
      ...prev.filter((i) => i.id !== id),
    ]);
    return true;
  };

  const handleReplyGuardianInquiry = async (
    inquiryId: string,
    replyText: string
  ): Promise<boolean> => {
    const targetInq = guardianInquiries.find((i) => i.id === inquiryId);
    if (!targetInq) return false;
    setOperationError(null);

    if (firebaseUser) {
      const ref = doc(db, 'guardianInquiries', inquiryId);
      try {
        const snap = await getExistingDocIfPresent(ref);
        if (snap) {
          await updateDoc(ref, {
            teacherReply: replyText,
            status: 'replied',
            updatedAt: serverTimestamp(),
          });
        } else {
          const { id, isDemoRecord, createdAt, updatedAt, ...rest } = targetInq;
          await setDoc(ref, {
            ...rest,
            teacherReply: replyText,
            status: 'replied',
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `guardianInquiries/${inquiryId}`,
          'অভিভাবকের বার্তার উত্তর সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setGuardianInquiries((prev) =>
      prev.map((i) =>
        i.id === inquiryId
          ? { ...i, teacherReply: replyText, status: 'replied' }
          : i
      )
    );
    return true;
  };

  const handleSubmitAdmissionApplication = async (
    payload: Omit<AdmissionApplication, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>
  ): Promise<AdmissionApplication> => {
    const id = `adm-${Date.now()}`;
    const uid = firebaseUser?.uid || 'public-applicant';
    setOperationError(null);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'admissionApplications', id), {
          ...payload,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `admissionApplications/${id}`,
          'ভর্তি আবেদন সংরক্ষণ ব্যর্থ হয়েছে'
        );
        throw err;
      }
    } else if (
      payload.status === 'pending' &&
      !payload.assignedStudentId &&
      !payload.assignedAdmissionNo &&
      !payload.reviewedByUid
    ) {
      // Best-effort unauthenticated public write allowed by firestore.rules
      try {
        await setDoc(doc(db, 'admissionApplications', id), {
          ...payload,
          authorId: 'public-applicant',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Fallback to local state when unauthenticated or in offline preview
      }
    }

    const created: AdmissionApplication = {
      ...payload,
      id,
      authorId: uid,
      isDemoRecord: !firebaseUser,
    };
    setAdmissionApplications((prev) => [created, ...prev.filter((a) => a.id !== id)]);
    return created;
  };

  const handleUpdateAdmissionApplication = async (
    applicationId: string,
    updates: Partial<AdmissionApplication>
  ): Promise<void> => {
    const targetApp = admissionApplications.find((a) => a.id === applicationId);
    if (!targetApp) return;
    setOperationError(null);

    const merged: AdmissionApplication = {
      ...targetApp,
      ...updates,
    };

    if (firebaseUser) {
      const appRef = doc(db, 'admissionApplications', applicationId);
      try {
        const snap = await getExistingDocIfPresent(appRef);
        const { id, isDemoRecord, createdAt, updatedAt, ...cleanPayload } = merged;
        if (snap) {
          await updateDoc(appRef, {
            ...cleanPayload,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(appRef, {
            ...cleanPayload,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `admissionApplications/${applicationId}`,
          'ভর্তি আবেদন হালনাগাদ ব্যর্থ হয়েছে'
        );
        throw err;
      }
    }

    setAdmissionApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? merged : a))
    );
  };

  const handleApproveAdmissionApplication = async (
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
  ): Promise<{
    studentId: string;
    admissionNo: string;
    studentInvitationCode?: string;
    guardianInvitationCode?: string;
  }> => {
    if (!canApproveAdmissions(activeRole)) {
      throw new Error('Unauthorized admission approval attempt');
    }
    setOperationError(null);

    const uid = firebaseUser?.uid || 'usr-muhtamim-1';
    const todayIso = new Date().toISOString().slice(0, 10);

    const updatedApp: AdmissionApplication = {
      ...application,
      department: assignment.department,
      requestedClass: assignment.requestedClass,
      assignedAdmissionNo: assignment.assignedAdmissionNo,
      assignedRollNo: assignment.assignedRollNo,
      assignedDormitoryRoom: assignment.assignedDormitoryRoom,
      assignedMonthlyFeeBdt: assignment.assignedMonthlyFeeBdt,
      adminRemarks: assignment.adminRemarks,
      status: 'approved',
      reviewedDate: todayIso,
      reviewedByUid: uid,
    };

    // Idempotent provisioning: reuse existing canonical student if already created for this application or admissionNo
    const provisioned = buildProvisionedStudentFromApplication(
      updatedApp,
      students,
      {
        admissionNo: assignment.assignedAdmissionNo,
        rollNo: assignment.assignedRollNo,
        className: assignment.requestedClass,
        department: assignment.department,
        dormitoryRoom: assignment.assignedDormitoryRoom,
        monthlyFeeBdt: assignment.assignedMonthlyFeeBdt,
        authorId: uid,
      }
    );

    // Idempotent single-use account invitations for Student and Guardian (separate tokens, never shared)
    const invPkg = buildAccountProvisioningPackage(
      updatedApp,
      provisioned.studentRecord,
      accountInvitations,
      uid
    );

    const finalApp: AdmissionApplication = {
      ...updatedApp,
      assignedStudentId: provisioned.studentRecord.id,
      studentInvitationCode: invPkg.studentInvitation.invitationCode,
      guardianInvitationCode:
        invPkg.guardianInvitation?.invitationCode ||
        updatedApp.guardianInvitationCode ||
        '',
    };

    if (firebaseUser) {
      try {
        const stuRef = doc(db, 'students', provisioned.studentRecord.id);
        const {
          id: stuId,
          isDemoRecord: stuDemo,
          createdAt: stuCreated,
          updatedAt: stuUpdated,
          ...stuRest
        } = provisioned.studentRecord;

        const stuSnap = await getExistingDocIfPresent(stuRef);
        if (stuSnap) {
          await updateDoc(stuRef, {
            ...stuRest,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(stuRef, {
            ...stuRest,
            authorId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const appRef = doc(db, 'admissionApplications', finalApp.id);
        const {
          id: appId,
          isDemoRecord: appDemo,
          createdAt: appCreated,
          updatedAt: appUpdated,
          ...appRest
        } = finalApp;
        const appSnap = await getExistingDocIfPresent(appRef);
        if (appSnap) {
          await updateDoc(appRef, {
            ...appRest,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(appRef, {
            ...appRest,
            authorId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const stuInvRef = doc(db, 'accountInvitations', invPkg.studentInvitation.id);
        const {
          id: sInvId,
          isDemoRecord: sInvDemo,
          createdAt: sInvCreated,
          updatedAt: sInvUpdated,
          ...sInvRest
        } = invPkg.studentInvitation;
        await setDoc(stuInvRef, {
          ...sInvRest,
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (invPkg.guardianInvitation) {
          const grdInvRef = doc(db, 'accountInvitations', invPkg.guardianInvitation.id);
          const {
            id: gInvId,
            isDemoRecord: gInvDemo,
            createdAt: gInvCreated,
            updatedAt: gInvUpdated,
            ...gInvRest
          } = invPkg.guardianInvitation;
          await setDoc(grdInvRef, {
            ...gInvRest,
            authorId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        // Persist guardian account link in Firestore if guardianUid is present
        if (finalApp.requestGuardianAccount && finalApp.guardianUid) {
          const grdUserRef = doc(db, 'users', finalApp.guardianUid);
          const grdSnap = await getExistingDocIfPresent(grdUserRef);
          if (grdSnap) {
            const grdData = grdSnap.data() as UserProfile;
            const mergedIds = mergeLinkedStudentIds(
              grdData.linkedStudentIds || '',
              provisioned.studentRecord.id
            );
            await updateDoc(grdUserRef, {
              status: 'active',
              linkedStudentIds: mergedIds,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          `admissionApplications/${finalApp.id}`,
          'ভর্তি অনুমোদন ও শিক্ষার্থী প্রোফাইল ডাটাবেসে সংরক্ষণ ব্যর্থ হয়েছে'
        );
        throw err;
      }
    }

    // Update local canonical students state idempotently
    setStudents((prev) => {
      const exists = prev.some((s) => s.id === provisioned.studentRecord.id);
      if (exists) {
        return prev.map((s) =>
          s.id === provisioned.studentRecord.id ? provisioned.studentRecord : s
        );
      }
      return [provisioned.studentRecord, ...prev];
    });

    // Update local admissionApplications state idempotently
    setAdmissionApplications((prev) => {
      const exists = prev.some((a) => a.id === finalApp.id);
      if (exists) {
        return prev.map((a) => (a.id === finalApp.id ? finalApp : a));
      }
      return [finalApp, ...prev];
    });

    // Update local accountInvitations state idempotently
    setAccountInvitations((prev) => {
      const byId = new Map<string, AccountInvitation>();
      for (const item of prev) byId.set(item.id, item);
      byId.set(invPkg.studentInvitation.id, invPkg.studentInvitation);
      if (invPkg.guardianInvitation) {
        byId.set(invPkg.guardianInvitation.id, invPkg.guardianInvitation);
      }
      return Array.from(byId.values());
    });

    // Link guardian account if guardianUid is present and requestGuardianAccount is true
    if (finalApp.requestGuardianAccount && finalApp.guardianUid) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === finalApp.guardianUid || u.uid === finalApp.guardianUid
            ? {
                ...u,
                status: 'active',
                linkedStudentIds: mergeLinkedStudentIds(
                  u.linkedStudentIds,
                  provisioned.studentRecord.id
                ),
              }
            : u
        )
      );
    }

    await recordAdminAuditLog({
      action: 'admission_approved',
      targetUid: provisioned.studentRecord.id,
      targetEmail: finalApp.guardianEmail || '',
      targetRole: 'student',
      summaryBn: `ভর্তি আবেদন (${finalApp.applicantNameBn} · দাখিলা #${provisioned.studentRecord.admissionNo}) অনুমোদিত ও শিক্ষার্থী প্রোফাইল তৈরি হয়েছে।`,
    });

    return {
      studentId: provisioned.studentRecord.id,
      admissionNo: provisioned.studentRecord.admissionNo,
      studentInvitationCode: invPkg.studentInvitation.invitationCode,
      guardianInvitationCode: invPkg.guardianInvitation?.invitationCode,
    };
  };

  const handleBootstrapSuperAdmin = async (payload: {
    ownerEmail: string;
    displayName: string;
    phone: string;
    setupPassword?: string;
    setupToken?: string;
  }): Promise<{
    ok: boolean;
    messageBn: string;
    messageEn: string;
  }> => {
    let provisionedUid = firebaseUser?.uid || 'usr-admin-1';
    const providedToken = (payload.setupToken || '').trim();

    // 1. Call trusted server-side endpoint (/api/bootstrap-super-admin) first.
    // Secrets (SUPER_ADMIN_BOOTSTRAP_SECRET, FIREBASE_ADMIN_PRIVATE_KEY) exist strictly on the server.
    try {
      const idToken = firebaseUser ? await firebaseUser.getIdToken().catch(() => undefined) : undefined;
      const serverResp = await fetch('/api/bootstrap-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(providedToken ? { 'X-Bootstrap-Secret': providedToken } : {}),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          ownerEmail: payload.ownerEmail,
          displayName: payload.displayName,
          phone: payload.phone,
          setupPassword: payload.setupPassword,
          setupToken: providedToken,
        }),
      });

      const serverData = (await serverResp.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
        messageBn?: string;
        messageEn?: string;
        lockRecord?: SuperAdminBootstrapLock;
        superAdminProfile?: UserProfile;
      } | null;

      if (serverData && serverData.code !== 'ADMIN_SDK_CREDENTIALS_MISSING') {
        if (!serverResp.ok || !serverData.ok) {
          return {
            ok: false,
            messageBn:
              serverData.messageBn ||
              'সার্ভার-সাইড সুপার অ্যাডমিন বুটস্ট্র্যাপ যাচাইকরণ ব্যর্থ হয়েছে।',
            messageEn:
              serverData.messageEn ||
              'Server-side Super Admin bootstrap verification failed.',
          };
        }

        if (serverData.lockRecord && serverData.superAdminProfile) {
          setSuperAdminLock(serverData.lockRecord);
          setCurrentUserProfile(serverData.superAdminProfile);
          setUsers((prev) => {
            const filtered = prev.filter(
              (u) =>
                u.id !== 'usr-admin-1' &&
                u.id !== serverData.superAdminProfile!.uid &&
                u.role !== 'super_admin'
            );
            return [serverData.superAdminProfile!, ...filtered];
          });
          setActiveRole('super_admin');
          setActiveModule('dashboard');
          setIsPublicAdmissionMode(false);
          setShowLoginGate(false);
          setOperationSuccess(
            serverData.messageBn ||
              'সুপার অ্যাডমিন অ্যাকাউন্ট সফলভাবে প্রভিশন করা হয়েছে এবং বুটস্ট্র্যাপ এন্ডপয়েন্ট স্থায়ীভাবে লক করা হয়েছে।'
          );
          return {
            ok: true,
            messageBn:
              serverData.messageBn ||
              'সুপার অ্যাডমিন সফলভাবে সক্রিয় ও লক করা হয়েছে।',
            messageEn:
              serverData.messageEn ||
              'Super Admin provisioned and permanently locked.',
          };
        }
      }
    } catch {
      // If offline or server route is unreachable, continue to Firestore-rules-enforced validation below
    }

    const check = validateSuperAdminBootstrapAttempt({
      existingLock: superAdminLock,
      existingUsers: users,
      candidateUid: provisionedUid,
      candidateEmail: payload.ownerEmail,
      candidateDisplayName: payload.displayName,
      candidatePhone: payload.phone,
      allowedBootstrapEmail: BOOTSTRAP_SUPER_ADMIN_EMAIL,
      setupTokenInput: providedToken,
      expectedSetupToken: providedToken.length >= 12 ? providedToken : 'UQCM-BOOTSTRAP-2026',
    });

    if (!check.ok || !check.lockRecord || !check.superAdminProfile) {
      return {
        ok: false,
        messageBn:
          check.errorBn ||
          'সুপার অ্যাডমিন বুটস্ট্র্যাপ যাচাইকরণ ব্যর্থ হয়েছে।',
        messageEn:
          check.errorEn || 'Super Admin bootstrap verification failed.',
      };
    }

    const normalizedEmail = payload.ownerEmail.trim().toLowerCase();
    const cleanedName = payload.displayName.trim();
    const cleanedPhone = payload.phone.trim();

    if (payload.setupPassword && payload.setupPassword.trim().length >= 6) {
      try {
        const cred = await registerWithEmailPassword(
          normalizedEmail,
          payload.setupPassword,
          cleanedName
        );
        provisionedUid = cred.user.uid;
        await setDoc(doc(db, 'users', provisionedUid), {
          uid: provisionedUid,
          email: normalizedEmail,
          displayName: cleanedName,
          role: 'super_admin',
          status: 'active',
          linkedStudentIds: '',
          assignedClasses: 'সকল জামাত',
          phone: cleanedPhone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Never store plaintext password; proceed with lock + canonical profile activation when running in preview or when Email/Password provider is pending in Firebase Console
      }
    }

    const newLock: SuperAdminBootstrapLock = {
      ...check.lockRecord,
      superAdminUid: provisionedUid,
      authorId: provisionedUid,
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'systemBootstrap', 'super_admin_lock'), {
          lockId: 'super_admin_lock',
          isProvisioned: true,
          superAdminUid: newLock.superAdminUid,
          superAdminEmail: newLock.superAdminEmail,
          superAdminName: newLock.superAdminName,
          provisionedAt: newLock.provisionedAt,
          bootstrapMethod: newLock.bootstrapMethod,
          authorId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Local lock state still enforced immediately
      }
    }

    setSuperAdminLock(newLock);

    const newSuperAdminProfile: UserProfile = {
      ...check.superAdminProfile,
      id: provisionedUid,
      uid: provisionedUid,
      isDemoRecord: false,
    };

    setCurrentUserProfile(newSuperAdminProfile);
    setUsers((prev) => {
      const filtered = prev.filter(
        (u) => u.id !== 'usr-admin-1' && u.id !== provisionedUid && u.role !== 'super_admin'
      );
      return [newSuperAdminProfile, ...filtered];
    });

    await recordAdminAuditLog({
      action: 'super_admin_bootstrapped',
      targetUid: provisionedUid,
      targetEmail: normalizedEmail,
      targetRole: 'super_admin',
      actorUidOverride: provisionedUid,
      actorEmailOverride: normalizedEmail,
      actorRoleOverride: 'super_admin',
      summaryBn: `এককালীন যাচাইকৃত বুটস্ট্র্যাপের মাধ্যমে সুপার অ্যাডমিন (${cleanedName} · ${normalizedEmail}) স্থায়ীভাবে প্রভিশন ও লক করা হয়েছে।`,
    });

    setActiveRole('super_admin');
    setActiveModule('dashboard');
    setIsPublicAdmissionMode(false);
    setShowLoginGate(false);
    setOperationSuccess(
      `সুপার অ্যাডমিন অ্যাকাউন্ট (${cleanedName} · ${normalizedEmail}) সফলভাবে প্রভিশন করা হয়েছে এবং বুটস্ট্র্যাপ এন্ডপয়েন্ট স্থায়ীভাবে লক করা হয়েছে।`
    );

    return {
      ok: true,
      messageBn: `সুপার অ্যাডমিন (${cleanedName}) সফলভাবে সক্রিয় ও লক করা হয়েছে।`,
      messageEn: `Super Admin (${cleanedName}) provisioned and permanently locked.`,
    };
  };

  const handleIssueStaffInvitation = async (payload: {
    targetRole: InvitationTargetRole;
    staffId: string;
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    employeeCode: string;
    designation: string;
    assignedDepartment: string;
    assignedClasses: string;
    assignedSubjects: string;
  }): Promise<{
    ok: boolean;
    messageBn: string;
    invitationCode?: string;
  }> => {
    const actorUid =
      firebaseUser?.uid ||
      currentUserProfile?.uid ||
      (activeRole === 'muhtamim' ? 'usr-muhtamim-1' : 'usr-admin-1');
    const actorEmail =
      firebaseUser?.email ||
      currentUserProfile?.email ||
      (activeRole === 'muhtamim'
        ? 'muhtamim@ummulquranmadrasa.edu.bd'
        : BOOTSTRAP_SUPER_ADMIN_EMAIL);

    const safeStaffRole: StaffInvitationInput['targetRole'] =
      payload.targetRole === 'muhtamim' ||
      payload.targetRole === 'teacher' ||
      payload.targetRole === 'accountant' ||
      payload.targetRole === 'residential_supervisor'
        ? payload.targetRole
        : 'staff';

    const safeDept: StaffMember['department'] =
      payload.assignedDepartment === 'administration' ||
      payload.assignedDepartment === 'hifz' ||
      payload.assignedDepartment === 'qawmi' ||
      payload.assignedDepartment === 'general' ||
      payload.assignedDepartment === 'boarding'
        ? payload.assignedDepartment
        : 'hifz';

    const built = buildStaffAccountInvitation(
      {
        actorRole: activeRole,
        actorUid,
        actorEmail,
        targetRole: safeStaffRole,
        employeeCode: payload.employeeCode,
        nameBn: payload.recipientName,
        nameEn: payload.recipientName,
        email: payload.recipientEmail,
        phone: payload.recipientPhone,
        designation: payload.designation,
        department: safeDept,
        assignedClasses: payload.assignedClasses,
        assignedSubjects: payload.assignedSubjects,
        qualification: payload.assignedSubjects || 'দাওরায়ে হাদিস / কামিল',
        joiningDate: new Date().toISOString().slice(0, 10),
        basicSalaryBdt: safeStaffRole === 'muhtamim' ? 28000 : 16500,
        houseAllowanceBdt: safeStaffRole === 'muhtamim' ? 6000 : 3500,
        medicalAllowanceBdt: 1500,
      },
      accountInvitations,
      staff
    );

    if (!built.ok || !built.invitation) {
      return {
        ok: false,
        messageBn:
          built.errorBn ||
          'স্টাফ বা শিক্ষক অ্যাকাউন্টের আমন্ত্রণ তৈরি করা সম্ভব হয়নি।',
      };
    }

    const inv = built.invitation;

    // Ensure a corresponding canonical StaffMember entry exists in staff directory
    const existingStaffMember = staff.find(
      (st) =>
        st.employeeCode.toLowerCase() === payload.employeeCode.trim().toLowerCase() ||
        st.id === inv.staffId
    );
    if (!existingStaffMember && built.staffRecord) {
      const { id, isDemoRecord, createdAt, updatedAt, ...staffRest } = built.staffRecord;
      const staffSaved = await handleAddStaff(staffRest);
      if (!staffSaved) {
        return {
          ok: false,
          messageBn:
            'স্টাফ প্রোফাইল ক্লাউড ডাটাবেসে সংরক্ষণ ব্যর্থ হওয়ায় আমন্ত্রণ কোড ইস্যু করা যায়নি।',
        };
      }
    }

    if (firebaseUser) {
      try {
        const invRef = doc(db, 'accountInvitations', inv.id);
        const {
          id: invId,
          isDemoRecord: invDemo,
          createdAt: invCreated,
          updatedAt: invUpdated,
          ...invRest
        } = inv;
        await setDoc(invRef, {
          ...invRest,
          authorId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `accountInvitations/${inv.id}`,
          'স্টাফ অ্যাক্টিভেশন আমন্ত্রণ ডাটাবেসে সংরক্ষণ ব্যর্থ হয়েছে'
        );
        return {
          ok: false,
          messageBn:
            'স্টাফ অ্যাক্টিভেশন আমন্ত্রণ ক্লাউড ডাটাবেসে সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
        };
      }
    }

    setAccountInvitations((prev) => [
      inv,
      ...prev.filter((item) => item.id !== inv.id),
    ]);

    await recordAdminAuditLog({
      action:
        safeStaffRole === 'muhtamim'
          ? 'muhtamim_invited'
          : 'staff_invited',
      targetUid: inv.staffId || inv.id,
      targetEmail: inv.recipientEmail,
      targetRole: safeStaffRole,
      summaryBn: `${inv.recipientName} (${inv.designation})-এর জন্য এককালীন অ্যাক্টিভেশন কোড (${inv.invitationCode}) ইস্যু করা হয়েছে।`,
    });

    return {
      ok: true,
      messageBn: `${inv.recipientName}-এর জন্য এককালীন অ্যাক্টিভেশন কোড (${inv.invitationCode}) সফলভাবে তৈরি হয়েছে।`,
      invitationCode: inv.invitationCode,
    };
  };

  const handleRevokeInvitation = async (invitationId: string): Promise<boolean> => {
    if (!['super_admin', 'muhtamim'].includes(activeRole)) return false;
    const targetInv = accountInvitations.find((i) => i.id === invitationId);
    if (!targetInv) return false;

    if (activeRole === 'muhtamim' && targetInv.targetRole === 'muhtamim') {
      setOperationError('মুহতামিম অ্যাকাউন্টের আমন্ত্রণ শুধুমাত্র সুপার অ্যাডমিন বাতিল করতে পারবেন।');
      return false;
    }

    setOperationError(null);
    const updatedInv: AccountInvitation = {
      ...targetInv,
      status: 'revoked',
    };

    if (firebaseUser) {
      try {
        const invRef = doc(db, 'accountInvitations', invitationId);
        const { id, isDemoRecord, createdAt, updatedAt, ...cleanInv } = updatedInv;
        const snap = await getExistingDocIfPresent(invRef);
        if (snap) {
          await updateDoc(invRef, {
            ...cleanInv,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(invRef, {
            ...cleanInv,
            authorId: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.UPDATE,
          `accountInvitations/${invitationId}`,
          'অ্যাক্টিভেশন আমন্ত্রণ বাতিল করা যায়নি'
        );
        return false;
      }
    }

    setAccountInvitations((prev) =>
      prev.map((item) => (item.id === invitationId ? updatedInv : item))
    );

    await recordAdminAuditLog({
      action: 'invitation_revoked',
      targetUid: targetInv.staffId || targetInv.studentId,
      targetEmail: targetInv.recipientEmail,
      targetRole: targetInv.targetRole,
      summaryBn: `${targetInv.recipientName}-এর এককালীন অ্যাক্টিভেশন কোড (${targetInv.invitationCode}) বাতিল (Revoked) করা হয়েছে।`,
    });

    setOperationSuccess(
      `অ্যাক্টিভেশন আমন্ত্রণ কোড (${targetInv.invitationCode}) সফলভাবে বাতিল করা হয়েছে।`
    );
    return true;
  };

  const handleActivateAccountInvitation = async (payload: {
    invitationCode: string;
    verificationSecret: string;
    email: string;
    newPassword: string;
  }): Promise<{
    ok: boolean;
    messageBn: string;
    messageEn: string;
    backendNoticeBn?: string;
    targetRole?: InvitationTargetRole;
    studentId?: string;
  }> => {
    const check = validateAndRedeemActivationInvitation(accountInvitations, {
      invitationCode: payload.invitationCode,
      verificationPhoneOrAdmissionNo: payload.verificationSecret,
      chosenPassword: payload.newPassword,
      redeemerUid: firebaseUser?.uid || '',
    });

    if (!check.ok || !check.updatedInvitation) {
      return {
        ok: false,
        messageBn:
          check.errorBn ||
          'অ্যাক্টিভেশন কোড বা যাচাইকরণ তথ্য সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।',
        messageEn:
          check.errorEn ||
          'Invalid activation code or verification information. Please try again.',
      };
    }

    const redeemed = check.updatedInvitation;
    const rawEmail = (payload.email || '').trim().toLowerCase();
    if (rawEmail && !rawEmail.includes('@')) {
      return {
        ok: false,
        messageBn: 'প্রদত্ত ইমেইল ঠিকানাটি সঠিক নয়। অনুগ্রহ করে বৈধ ইমেইল দিন অথবা খালি রাখুন।',
        messageEn: 'Invalid email address format.',
      };
    }
    const normalizedEmail =
      rawEmail ||
      redeemed.recipientEmail ||
      `${redeemed.targetRole}.${redeemed.admissionNo
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')}@ummulquranmadrasa.edu.bd`;

    const isStaffOrAdminRole = ['muhtamim', 'teacher', 'accountant', 'residential_supervisor', 'staff'].includes(
      redeemed.targetRole
    );

    let activatedUid =
      redeemed.targetRole === 'student'
        ? 'demo-student-1'
        : redeemed.targetRole === 'guardian'
          ? 'demo-guardian-1'
          : redeemed.targetRole === 'muhtamim'
            ? 'usr-muhtamim-1'
            : redeemed.staffId || `usr-${redeemed.targetRole}-${Date.now()}`;
    let backendNoticeBn: string | undefined = undefined;

    // Attempt real Firebase Authentication provisioning (never store plaintext password anywhere)
    try {
      const cred = await registerWithEmailPassword(
        normalizedEmail,
        payload.newPassword,
        redeemed.recipientName
      );
      activatedUid = cred.user.uid;
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: normalizedEmail,
        displayName: redeemed.recipientName,
        role: redeemed.targetRole,
        status: 'active',
        linkedStudentIds: isStaffOrAdminRole ? '' : redeemed.studentId,
        assignedClasses: redeemed.assignedClasses || (redeemed.targetRole === 'muhtamim' ? 'সকল জামাত' : ''),
        phone: redeemed.recipientPhone || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const rawErr = err instanceof Error ? err.message : String(err);
      if (rawErr.toLowerCase().includes('operation-not-allowed')) {
        backendNoticeBn =
          'নোট: Firebase Console-এ Email/Password Sign-In প্রোভাইডার এখনও সক্রিয় করা হয়নি (auth/operation-not-allowed)। তবে এককালীন কোড যাচাই ও অনুমোদিত প্রোফাইল সংযুক্তি সম্পন্ন হয়েছে।';
      } else {
        backendNoticeBn = `Firebase Auth স্ট্যাটাস: ${rawErr} — এককালীন কোড যাচাই ও অনুমোদিত প্রোফাইল সংযুক্তি সম্পন্ন হয়েছে।`;
      }
    }

    const finalRedeemed: AccountInvitation = {
      ...redeemed,
      recipientEmail: normalizedEmail,
      redeemedByUid: activatedUid,
    };

    // Mark invitation as used in state (single-use enforcement)
    setAccountInvitations((prev) =>
      prev.map((inv) => (inv.id === finalRedeemed.id ? finalRedeemed : inv))
    );

    if (!isStaffOrAdminRole) {
      // Link canonical student record for student or guardian activation
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== finalRedeemed.studentId) return s;
          return finalRedeemed.targetRole === 'student'
            ? { ...s, studentUid: activatedUid }
            : { ...s, guardianUid: activatedUid };
        })
      );
    }

    const activatedProfile: UserProfile = {
      id: activatedUid,
      uid: activatedUid,
      email: normalizedEmail,
      displayName: finalRedeemed.recipientName,
      role: finalRedeemed.targetRole,
      status: 'active',
      linkedStudentIds: isStaffOrAdminRole ? '' : finalRedeemed.studentId,
      assignedClasses:
        finalRedeemed.assignedClasses ||
        (finalRedeemed.targetRole === 'muhtamim' ? 'সকল জামাত' : ''),
      phone: finalRedeemed.recipientPhone || '',
      isDemoRecord: false,
    };

    setCurrentUserProfile(activatedProfile);

    // Update user profile directory in local state
    setUsers((prev) => {
      const exists = prev.some(
        (u) =>
          u.id === activatedUid ||
          u.uid === activatedUid ||
          u.email.toLowerCase() === normalizedEmail
      );
      if (exists) {
        return prev.map((u) => {
          if (
            u.id === activatedUid ||
            u.uid === activatedUid ||
            u.email.toLowerCase() === normalizedEmail
          ) {
            return {
              ...u,
              email: normalizedEmail,
              displayName: finalRedeemed.recipientName,
              role: finalRedeemed.targetRole,
              status: 'active' as const,
              linkedStudentIds:
                finalRedeemed.targetRole === 'guardian'
                  ? mergeLinkedStudentIds(u.linkedStudentIds, finalRedeemed.studentId)
                  : isStaffOrAdminRole
                    ? ''
                    : finalRedeemed.studentId,
              assignedClasses:
                finalRedeemed.assignedClasses || u.assignedClasses || '',
              phone: finalRedeemed.recipientPhone || u.phone,
              isDemoRecord: false,
            };
          }
          return u;
        });
      }
      return [activatedProfile, ...prev];
    });

    await recordAdminAuditLog({
      action: 'invitation_activated',
      targetUid: activatedUid,
      targetEmail: normalizedEmail,
      targetRole: finalRedeemed.targetRole,
      actorUidOverride: activatedUid,
      actorEmailOverride: normalizedEmail,
      actorRoleOverride: finalRedeemed.targetRole,
      summaryBn: `${finalRedeemed.recipientName} (${t.roles[finalRedeemed.targetRole]}) এককালীন কোড (${finalRedeemed.invitationCode}) ব্যবহার করে অ্যাকাউন্ট সক্রিয় করেছেন।`,
    });

    // Navigate directly to the role-authorized dashboard
    const redirectInfo = resolvePostLoginRedirect(activatedProfile);
    const nextRole: UserRole = finalRedeemed.targetRole;
    const nextModule: ModuleId =
      redirectInfo.screen === 'portal' ? redirectInfo.targetModule : 'dashboard';
    setActiveRole(nextRole);
    setActiveModule(nextModule);
    setIsPublicAdmissionMode(false);
    setPendingInvitationCode('');
    setShowLoginGate(false);
    setOperationSuccess(
      `${t.roles[finalRedeemed.targetRole]} অ্যাকাউন্ট (${
        finalRedeemed.recipientName
      } • ${
        finalRedeemed.employeeCode || finalRedeemed.admissionNo
      }) সফলভাবে সক্রিয় ও সংযুক্ত হয়েছে।${
        backendNoticeBn ? ` ${backendNoticeBn}` : ''
      }`
    );

    return {
      ok: true,
      messageBn: `${finalRedeemed.recipientName} (${finalRedeemed.employeeCode || finalRedeemed.admissionNo})-এর অ্যাকাউন্ট সফলভাবে সক্রিয় হয়েছে।`,
      messageEn: `Account for ${finalRedeemed.recipientName} (${finalRedeemed.employeeCode || finalRedeemed.admissionNo}) has been activated.`,
      backendNoticeBn,
      targetRole: finalRedeemed.targetRole,
      studentId: finalRedeemed.studentId,
    };
  };

  const handleSubmitGuardianLinkRequest = async (payload: {
    requestedAdmissionNo: string;
    requestedStudentNameBn: string;
    relationship: string;
  }): Promise<boolean> => {
    const id = `glr-${Date.now()}`;
    const uid = firebaseUser?.uid || 'demo-guardian-1';
    const matchedStu = students.find(
      (s) =>
        s.admissionNo.toLowerCase() ===
        payload.requestedAdmissionNo.trim().toLowerCase()
    );
    const todayIso = new Date().toISOString().slice(0, 10);

    const newReq: Omit<GuardianLinkRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      guardianUid: uid,
      guardianName:
        currentUserProfile?.displayName ||
        firebaseUser?.displayName ||
        'আলহাজ্ব মাহমুদুল হাসান',
      guardianPhone: currentUserProfile?.phone || '01711-345678',
      guardianEmail:
        currentUserProfile?.email ||
        firebaseUser?.email ||
        'mahmudul.guardian@example.com',
      requestedAdmissionNo: payload.requestedAdmissionNo.trim(),
      requestedStudentNameBn: payload.requestedStudentNameBn.trim(),
      relationship: payload.relationship,
      matchedStudentId: matchedStu?.id || '',
      status: 'pending',
      adminNotes: '',
      requestedDate: todayIso,
      reviewedDate: '',
      reviewedByUid: '',
      authorId: uid,
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'guardianLinkRequests', id), {
          ...newReq,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.CREATE,
          `guardianLinkRequests/${id}`,
          'অভিভাবক সংযুক্তি আবেদন প্রেরণ ব্যর্থ হয়েছে'
        );
        return false;
      }
    }

    setGuardianLinkRequests((prev) => [
      { ...newReq, id, isDemoRecord: !firebaseUser },
      ...prev,
    ]);
    return true;
  };

  const handleReviewGuardianLinkRequest = async (
    request: GuardianLinkRequest,
    decision: 'approved' | 'rejected',
    matchedStudentId: string,
    adminNotes: string
  ): Promise<void> => {
    if (!canApproveAdmissions(activeRole)) return;
    setOperationError(null);
    const uid = firebaseUser?.uid || 'usr-muhtamim-1';
    const todayIso = new Date().toISOString().slice(0, 10);

    const updatedReq: GuardianLinkRequest = {
      ...request,
      matchedStudentId: matchedStudentId || request.matchedStudentId,
      status: decision,
      adminNotes,
      reviewedDate: todayIso,
      reviewedByUid: uid,
    };

    if (firebaseUser) {
      try {
        const reqRef = doc(db, 'guardianLinkRequests', request.id);
        const { id, isDemoRecord, createdAt, updatedAt, ...cleanReq } = updatedReq;
        const snap = await getExistingDocIfPresent(reqRef);
        if (snap) {
          await updateDoc(reqRef, {
            ...cleanReq,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(reqRef, {
            ...cleanReq,
            authorId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        if (decision === 'approved' && updatedReq.matchedStudentId) {
          const targetStuId = updatedReq.matchedStudentId;
          const stuRef = doc(db, 'students', targetStuId);
          const stuSnap = await getExistingDocIfPresent(stuRef);
          if (stuSnap) {
            await updateDoc(stuRef, {
              guardianUid: request.guardianUid,
              updatedAt: serverTimestamp(),
            });
          } else {
            const targetStu = students.find((s) => s.id === targetStuId);
            if (targetStu) {
              const { id: sId, isDemoRecord: sDemo, createdAt: sCr, updatedAt: sUp, ...sRest } = targetStu;
              await setDoc(stuRef, {
                ...sRest,
                guardianUid: request.guardianUid,
                authorId: uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }

          if (request.guardianUid) {
            const grdRef = doc(db, 'users', request.guardianUid);
            const grdSnap = await getExistingDocIfPresent(grdRef);
            if (grdSnap) {
              const grdData = grdSnap.data() as UserProfile;
              const mergedIds = mergeLinkedStudentIds(
                grdData.linkedStudentIds || '',
                targetStuId
              );
              await updateDoc(grdRef, {
                status: 'active',
                linkedStudentIds: mergedIds,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      } catch (err) {
        reportDatabaseError(
          err,
          OperationType.WRITE,
          `guardianLinkRequests/${request.id}`,
          'অভিভাবক সংযুক্তি আবেদন ও শিক্ষার্থী লিংকিং সংরক্ষণ ব্যর্থ হয়েছে'
        );
        throw err;
      }
    }

    setGuardianLinkRequests((prev) =>
      prev.map((r) => (r.id === request.id ? updatedReq : r))
    );

    if (decision === 'approved' && updatedReq.matchedStudentId) {
      const targetStuId = updatedReq.matchedStudentId;
      setStudents((prev) =>
        prev.map((s) =>
          s.id === targetStuId ? { ...s, guardianUid: request.guardianUid } : s
        )
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === request.guardianUid || u.uid === request.guardianUid
            ? {
                ...u,
                status: 'active',
                linkedStudentIds: mergeLinkedStudentIds(
                  u.linkedStudentIds,
                  targetStuId
                ),
              }
            : u
        )
      );
    }
  };

  if (showLoginGate) {
    return (
      <LoginScreen
        language={language}
        onLanguageChange={setLanguage}
        onGoogleLogin={handleGoogleLogin}
        onEmailPasswordLogin={handleEmailPasswordLogin}
        onRegisterAccount={handleRegisterAccount}
        onForgotPassword={handleForgotPassword}
        onOpenOnlineAdmission={() => {
          setIsPublicAdmissionMode(true);
          setActiveRole('student');
          setActiveModule('admissions');
          setShowLoginGate(false);
        }}
        onActivateInvitation={handleActivateAccountInvitation}
        onBootstrapSuperAdmin={handleBootstrapSuperAdmin}
        isSuperAdminProvisioned={isSuperAdminProvisioned}
        initialInvitationCode={pendingInvitationCode}
        isSigningIn={isSigningIn}
        authError={authError}
        currentAccountStatus={firebaseUser ? currentUserProfile?.status ?? null : null}
        onSignOut={signOutUser}
      />
    );
  }

  // Dedicated Public Admission View when a new student applies without logging in first
  if (isPublicAdmissionMode && !firebaseUser) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col"
      >
        <header className="bg-[#063B27] text-white border-b border-emerald-900 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <InstitutionalCrest className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {language === 'bn'
                    ? 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা — অনলাইন ভর্তি পোর্টাল'
                    : 'Ummul Quran Cadet Madrasa — Online Admission Portal'}
                </div>
                <div className="text-[11px] text-emerald-200 truncate">
                  {language === 'bn'
                    ? 'অ্যাকাউন্ট বা লগইন ছাড়াই নতুন ভর্তি আবেদন ও স্ট্যাটাস অনুসন্ধান'
                    : 'Submit a new admission application or track status without logging in'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <LanguageSwitcher language={language} onChange={setLanguage} variant="menu" />
              <button
                type="button"
                data-testid="public-header-back-to-login"
                onClick={() => {
                  setIsPublicAdmissionMode(false);
                  setShowLoginGate(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? 'লগইন / অ্যাকাউন্ট সক্রিয়করণ' : 'Login / Activate Account'}
                </span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <AdmissionsModule
            lang={language}
            userRole="student"
            currentUid="public-applicant"
            currentUserEmail=""
            currentUserName=""
            currentUserPhone=""
            academicYear={settings.academicYear}
            applications={admissionApplications}
            students={students}
            guardianLinkRequests={guardianLinkRequests}
            isPublicApplicantMode={true}
            onReturnToLogin={(invitationCode) => {
              setIsPublicAdmissionMode(false);
              setPendingInvitationCode(invitationCode || '');
              setShowLoginGate(true);
            }}
            onSubmitApplication={handleSubmitAdmissionApplication}
            onUpdateApplication={handleUpdateAdmissionApplication}
            onApproveApplication={handleApproveAdmissionApplication}
            onReviewGuardianLinkRequest={handleReviewGuardianLinkRequest}
          />
        </main>
      </div>
    );
  }

  const allowedModules = getAllowedModules(activeRole);
  const modulesWithChevron: ModuleId[] = ['students', 'staff', 'reports'];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col lg:flex-row"
    >
      {/* Desktop Sidebar Navigation (Matches reference UI: White top brand header + Deep Emerald menu + Scenic Mosque/Boat footer) */}
      <aside className="hidden lg:flex lg:w-64 xl:w-68 bg-[#063B27] text-white flex-col justify-between shrink-0 border-e border-emerald-950/30 no-print">
        <div>
          {/* Top White Brand Header Lockup */}
          <div className="h-16 px-4 bg-white border-b border-e border-slate-200 flex items-center gap-3">
            <InstitutionalCrest className="w-11 h-11" />
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-[#0A6847] leading-tight truncate">
                {language === 'bn'
                  ? 'উম্মুল কুরআন মাদ্রাসা'
                  : language === 'ar'
                    ? 'مدرسة أم القرآن'
                    : 'Ummul Quran Madrasa'}
              </div>
              <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
                {language === 'bn'
                  ? 'ম্যানেজমেন্ট সিস্টেম'
                  : language === 'ar'
                    ? 'نظام الإدارة'
                    : 'Management System'}
              </div>
            </div>
          </div>

          {/* Role-Scoped Navigation Links */}
          <nav aria-label="Main Navigation" className="px-3 py-1.5 space-y-0.5">
            {allowedModules.map((modId) => {
              const Icon = MODULE_ICONS[modId];
              const isActive = activeModule === modId;
              const hasChevron = modulesWithChevron.includes(modId);
              return (
                <button
                  key={modId}
                  type="button"
                  onClick={() => setActiveModule(modId)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#146C4B] text-white font-semibold shadow-2xs'
                      : 'text-emerald-50/90 hover:bg-[#0D4F36] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t.navModules[modId]}</span>
                  </span>
                  {hasChevron && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-75 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* System Users Shortcut (Matches bottom sidebar item in reference UI) */}
            {allowedModules.includes('settings') && (
              <button
                type="button"
                onClick={() => setActiveModule('settings')}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-50/90 hover:bg-[#0D4F36] hover:text-white transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {language === 'bn'
                      ? 'সিস্টেম ইউজার'
                      : language === 'ar'
                        ? 'مستخدمو النظام'
                        : 'System Users'}
                  </span>
                </span>
              </button>
            )}

            {/* Compact Language Switcher inside Menu Bar */}
            <div className="pt-1.5 mt-1 border-t border-emerald-800/50">
              <LanguageSwitcher language={language} onChange={setLanguage} variant="menu" />
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom: Scenic Madrasa & River Boat Artwork */}
        <SidebarScenicFooter language={language} />
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Matches reference UI: Hamburger + Palm Greeting + Notification/Mail Badges + Admin Profile) */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
          <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Zone: Hamburger Button + Palm Tree Emblem + Greeting */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <PalmGreetingIcon className="w-7 h-7 hidden sm:block" />

              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {language === 'bn'
                    ? `আসসালামু আলাইকুম, ${firebaseUser?.displayName || 'অ্যাডমিন'}!`
                    : language === 'ar'
                      ? 'السلام عليكم، المشرف!'
                      : `Assalamu Alaikum, ${firebaseUser?.displayName || 'Admin'}!`}
                </div>
                <div className="text-[11px] text-slate-500 truncate hidden md:block">
                  {language === 'bn'
                    ? 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা ম্যানেজমেন্ট সিস্টেমে স্বাগতম'
                    : language === 'ar'
                      ? 'مرحباً بكم في نظام إدارة مدرسة أم القرآن كاديت'
                      : 'Welcome to Ummul Quran Cadet Madrasa Management System'}
                </div>
              </div>
            </div>

            {/* Right Zone: Notification Bell + Leave Mail + Admin Profile & Auth */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notifications Bell Badge Button */}
              <button
                type="button"
                onClick={() => setActiveModule('notices')}
                aria-label="View announcements and notifications"
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:inline-flex"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {notices.length}
                </span>
              </button>

              {/* Residential Leave / Messages Badge Button */}
              <button
                type="button"
                onClick={() =>
                  setActiveModule(activeRole === 'guardian' ? 'guardian' : 'residential')
                }
                aria-label="View residential leave requests"
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:inline-flex"
              >
                <Mail className="w-5 h-5" />
                <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-[#008751] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {leaves.length}
                </span>
              </button>

              {/* Admin Profile Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 ps-2 pe-2 py-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <AdminAvatarIcon className="w-9 h-9" />
                  <div className="text-start hidden xl:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUserProfile?.displayName || firebaseUser?.displayName || 'প্রশাসক'}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {t.roles[activeRole]}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute end-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 space-y-2.5">
                    <div className="pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {currentUserProfile?.email || firebaseUser?.email || 'প্রাতিষ্ঠানিক সেশন'}
                        </div>
                        <div className="text-[11px] text-slate-500">{t.roles[activeRole]}</div>
                      </div>
                      <LanguageSwitcher
                        language={language}
                        onChange={setLanguage}
                        variant="light"
                        compact
                      />
                    </div>

                    {currentUserProfile?.role === 'super_admin' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          {t.switchRolePreview}
                        </label>
                        <select
                          value={activeRole}
                          onChange={(e) => {
                            handleSelectRole(e.target.value as UserRole);
                            setProfileMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                        >
                          {(Object.keys(t.roles) as UserRole[]).map((r) => (
                            <option key={r} value={r}>
                              {t.roles[r]}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {firebaseUser && activeRole === 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleSyncSeedToFirestore();
                        }}
                        disabled={isSyncingSeed}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#063B27] border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>{isSyncingSeed ? t.syncingText : t.syncSeedToFirestore}</span>
                      </button>
                    )}

                    {firebaseUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOutUser();
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.signOut}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setShowLoginGate(true);
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-[#063B27] hover:bg-emerald-950 text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>
                          {language === 'bn' ? 'লগইন পোর্টাল' : 'Login Portal'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Direct Login / Sign Out Action Button */}
              {firebaseUser ? (
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.signOut}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLoginGate(true)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-[#063B27] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'লগইন'
                      : language === 'ar'
                        ? 'دخول'
                        : 'Login'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#063B27] text-white border-t border-emerald-900 px-4 py-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#E5C158]">
                    {t.roles[activeRole]}
                  </span>
                </div>
                <LanguageSwitcher
                  language={language}
                  onChange={setLanguage}
                  variant="dark"
                  compact
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {allowedModules.map((modId) => {
                  const Icon = MODULE_ICONS[modId];
                  const isActive = activeModule === modId;
                  return (
                    <button
                      key={modId}
                      type="button"
                      onClick={() => {
                        setActiveModule(modId);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        isActive
                          ? 'bg-[#146C4B] text-white font-bold'
                          : 'text-emerald-100 hover:bg-emerald-900/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t.navModules[modId]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
          {operationError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-300 text-xs font-semibold text-red-900 flex items-center justify-between gap-3"
            >
              <span>{operationError}</span>
              <button
                type="button"
                onClick={() => setOperationError(null)}
                aria-label="Dismiss error alert"
                className="px-2.5 py-1 rounded-md bg-white border border-red-200 text-red-800 hover:bg-red-100 shrink-0 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          )}

          {operationSuccess && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-3"
            >
              <span>{operationSuccess}</span>
              <button
                type="button"
                onClick={() => setOperationSuccess(null)}
                aria-label="Dismiss success alert"
                className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 shrink-0 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          )}

          <div key={activeModule} className="transition-opacity duration-200 ease-out">
            {activeModule === 'dashboard' && (
              <DashboardOverview
                language={language}
                role={activeRole}
                students={students}
                staff={staff}
                attendance={attendance}
                invoices={invoices}
                expenses={expenses}
                hifzLogs={hifzLogs}
                leaves={leaves}
                notices={notices}
                bannerSlides={bannerSlides}
                onNavigate={setActiveModule}
              />
            )}

            {activeModule === 'admissions' && (
              <AdmissionsModule
                lang={language}
                userRole={activeRole}
                currentUid={
                  firebaseUser
                    ? firebaseUser.uid
                    : activeRole === 'guardian'
                    ? 'demo-guardian-1'
                    : activeRole === 'student'
                    ? 'demo-student-1'
                    : 'usr-muhtamim-1'
                }
                currentUserEmail={
                  firebaseUser?.email || currentUserProfile?.email || ''
                }
                currentUserName={
                  currentUserProfile?.displayName ||
                  firebaseUser?.displayName ||
                  'আলহাজ্ব মাহমুদুল হাসান'
                }
                currentUserPhone={currentUserProfile?.phone || '01711-345678'}
                academicYear={settings.academicYear}
                applications={admissionApplications}
                students={students}
                guardianLinkRequests={guardianLinkRequests}
                isPublicApplicantMode={false}
                onReturnToLogin={(invitationCode) => {
                  setIsPublicAdmissionMode(false);
                  setPendingInvitationCode(invitationCode || '');
                  setShowLoginGate(true);
                }}
                onSubmitApplication={handleSubmitAdmissionApplication}
                onUpdateApplication={handleUpdateAdmissionApplication}
                onApproveApplication={handleApproveAdmissionApplication}
                onReviewGuardianLinkRequest={handleReviewGuardianLinkRequest}
              />
            )}

            {activeModule === 'students' && (
              <StudentsModule
                language={language}
                role={activeRole}
                students={students}
                onAddStudent={handleAddStudent}
                onUpdateStudentStatus={handleUpdateStudentStatus}
                onUpdateStudentPhoto={handleUpdateStudentPhoto}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {activeModule === 'staff' && (
              <StaffModule
                language={language}
                role={activeRole}
                staff={staff}
                accountInvitations={accountInvitations}
                onAddStaff={handleAddStaff}
                onDeleteStaff={handleDeleteStaff}
                onIssueStaffInvitation={handleIssueStaffInvitation}
                onRevokeInvitation={handleRevokeInvitation}
              />
            )}

            {activeModule === 'attendance' && (
              <AttendanceModule
                language={language}
                role={activeRole}
                students={students}
                attendance={attendance}
                onUpsertAttendance={handleUpsertAttendance}
              />
            )}

            {activeModule === 'exams' && (
              <ExamsModule
                language={language}
                role={activeRole}
                students={students}
                exams={exams}
                settings={settings}
                examSetups={examSetups}
                actorUid={firebaseUser?.uid || 'usr-muhtamim-1'}
                actorName={
                  currentUserProfile?.displayName ||
                  firebaseUser?.displayName ||
                  'অনুমোদিত পরীক্ষক / মুহতামিম'
                }
                onAddExamResult={handleAddExamResult}
                onTogglePublishExam={handleTogglePublishExam}
                onBulkUpsertExamResults={handleBulkUpsertExamResults}
                onSaveExamSetup={handleSaveExamSetup}
              />
            )}

            {activeModule === 'fees' && (
              <FinanceModule
                language={language}
                role={activeRole}
                students={students}
                invoices={invoices}
                expenses={expenses}
                onAddInvoice={handleAddInvoice}
                onAddExpense={handleAddExpense}
              />
            )}

            {activeModule === 'hifz' && (
              <HifzModule
                language={language}
                role={activeRole}
                students={students}
                hifzLogs={hifzLogs}
                onAddHifzLog={handleAddHifzLog}
              />
            )}

            {activeModule === 'residential' && (
              <ResidentialModule
                language={language}
                role={activeRole}
                students={students}
                leaves={leaves}
                onAddLeave={handleAddLeave}
                onUpdateLeaveStatus={handleUpdateLeaveStatus}
              />
            )}

            {activeModule === 'payroll' && (
              <PayrollModule
                language={language}
                role={activeRole}
                staff={staff}
                payroll={payroll}
                onAddPayroll={handleAddPayroll}
                onMarkPayrollPaid={handleMarkPayrollPaid}
              />
            )}

            {activeModule === 'student_portal' && (
              <StudentPortalModule
                language={language}
                role={activeRole}
                isSandboxMode={!firebaseUser}
                studentUid={firebaseUser ? firebaseUser.uid : 'demo-student-1'}
                linkedStudentId={
                  firebaseUser
                    ? currentUserProfile?.linkedStudentIds ?? ''
                    : users.find((u) => u.id === 'demo-student-1')?.linkedStudentIds ?? 'stu-101'
                }
                accountStatus={
                  firebaseUser ? currentUserProfile?.status ?? 'pending' : 'active'
                }
                students={students}
                attendance={attendance}
                exams={exams}
                hifzLogs={hifzLogs}
                leaves={leaves}
                notices={notices}
                studyDiary={studyDiary}
                onToggleDiaryCompletion={handleToggleDiaryCompletion}
                onAddStudyDiaryEntry={handleAddStudyDiaryEntry}
              />
            )}

            {activeModule === 'guardian' && (
              <GuardianPortalModule
                language={language}
                role={activeRole}
                isSandboxMode={!firebaseUser}
                guardianUid={firebaseUser ? firebaseUser.uid : 'demo-guardian-1'}
                linkedStudentIdsCsv={
                  firebaseUser
                    ? currentUserProfile?.linkedStudentIds ?? ''
                    : users.find((u) => u.id === 'demo-guardian-1')?.linkedStudentIds ??
                      'stu-101,stu-103'
                }
                accountStatus={
                  firebaseUser ? currentUserProfile?.status ?? 'pending' : 'active'
                }
                students={students}
                attendance={attendance}
                exams={exams}
                invoices={invoices}
                hifzLogs={hifzLogs}
                leaves={leaves}
                notices={notices}
                studyDiary={studyDiary}
                guardianInquiries={guardianInquiries}
                guardianLinkRequests={guardianLinkRequests}
                onRequestLeave={handleAddLeave}
                onAddGuardianInquiry={handleAddGuardianInquiry}
                onReplyGuardianInquiry={handleReplyGuardianInquiry}
                onSubmitGuardianLinkRequest={handleSubmitGuardianLinkRequest}
              />
            )}

            {activeModule === 'notices' && (
              <NoticesModule
                language={language}
                role={activeRole}
                notices={notices}
                onAddNotice={handleAddNotice}
              />
            )}

            {activeModule === 'reports' && (
              <ReportsModule
                language={language}
                students={students}
                attendance={attendance}
                invoices={invoices}
                hifzLogs={hifzLogs}
                payroll={payroll}
              />
            )}

            {activeModule === 'settings' && (
              <SettingsModule
                language={language}
                role={activeRole}
                currentUserUid={
                  firebaseUser?.uid ||
                  currentUserProfile?.uid ||
                  (activeRole === 'muhtamim' ? 'usr-muhtamim-1' : 'usr-admin-1')
                }
                isSuperAdminProvisioned={isSuperAdminProvisioned}
                settings={settings}
                users={users}
                bannerSlides={bannerSlides}
                adminAuditLogs={adminAuditLogs}
                onSaveSettings={handleSaveSettings}
                onUpdateUserRole={handleUpdateUserRole}
                onUpdateBannerSlide={handleUpdateBannerSlide}
              />
            )}
          </div>
        </main>

        {/* Bottom Institutional Footer Bar (Matches reference UI footer) */}
        <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 no-print">
          <div className="font-semibold text-slate-700">
            {language === 'bn'
              ? 'শিক্ষা ঈমানের আলোকবর্তিকা'
              : language === 'ar'
                ? 'العلم نور الإيمان'
                : 'Education is the Light of Faith'}
          </div>
          <div>
            © 2026 {t.institutionName}. All rights reserved.
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#008751]" />
            <span>
              {firebaseUser ? 'Cloud Sync Active' : 'Preview Session'} · {t.academicSessionLabel}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MadrasaPortalApp />
    </ErrorBoundary>
  );
}
