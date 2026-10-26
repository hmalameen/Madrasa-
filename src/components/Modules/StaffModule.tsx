import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AccountInvitation,
  InvitationTargetRole,
  Language,
  StaffMember,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  calculateNetSalary,
  canProvisionStaffAccount,
  formatBdt,
  ID_REGEX,
} from '../../utils/madrasaLogic';
import { ConfirmModal } from '../InstitutionalCrest';

interface StaffModuleProps {
  language: Language;
  role: UserRole;
  staff: StaffMember[];
  accountInvitations?: AccountInvitation[];
  onAddStaff: (
    member: Omit<StaffMember, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>
  ) => Promise<boolean>;
  onDeleteStaff: (staffId: string) => Promise<boolean>;
  onIssueStaffInvitation?: (payload: {
    targetRole: InvitationTargetRole;
    staffId: string;
    employeeCode: string;
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    designation: string;
    assignedDepartment: string;
    assignedClasses: string;
    assignedSubjects: string;
  }) => Promise<{
    ok: boolean;
    messageBn: string;
    invitationCode?: string;
  }>;
  onRevokeInvitation?: (invitationId: string) => Promise<boolean>;
}

const INITIAL_STAFF_FORM = {
  employeeCode: 'UQCM-EMP-06',
  nameBn: '',
  nameEn: '',
  designation: 'সহকারী শিক্ষক (হিফয বিভাগ)',
  role: 'teacher' as StaffMember['role'],
  department: 'hifz' as StaffMember['department'],
  assignedClasses: 'হিফয শুনানি জামাত',
  assignedSubjects: 'হিফযুল কুরআন ও তাজবীদ',
  email: '',
  phone: '',
  qualification: 'হাফেজে কুরআন ও কিরাআত সনদপ্রাপ্ত',
  joiningDate: '2026-10-25',
  basicSalaryBdt: 16000,
  houseAllowanceBdt: 3500,
  medicalAllowanceBdt: 1000,
  status: 'active' as StaffMember['status'],
  issuePortalInviteOnCreate: true,
};

export function StaffModule({
  language,
  role,
  staff,
  accountInvitations = [],
  onAddStaff,
  onDeleteStaff,
  onIssueStaffInvitation,
  onRevokeInvitation,
}: StaffModuleProps) {
  const t = TRANSLATIONS[language];
  const isAdmin = ['super_admin', 'muhtamim'].includes(role);
  const isSuperAdmin = role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [formState, setFormState] = useState(INITIAL_STAFF_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Direct Invitation Modal State for existing/new Staff or Muhtamim
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTargetRole, setInviteTargetRole] = useState<InvitationTargetRole>(
    isSuperAdmin ? 'muhtamim' : 'teacher'
  );
  const [inviteStaffId, setInviteStaffId] = useState('');
  const [inviteEmpCode, setInviteEmpCode] = useState('UQCM-EMP-01');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [inviteDept, setInviteDept] = useState('hifz');
  const [inviteClasses, setInviteClasses] = useState('');
  const [inviteSubjects, setInviteSubjects] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<{
    ok: boolean;
    messageBn: string;
    code?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const staffInvitations = accountInvitations.filter((inv) =>
    ['muhtamim', 'teacher', 'accountant', 'residential_supervisor', 'staff'].includes(
      inv.targetRole
    )
  );

  const filteredStaff = staff.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.nameBn.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.employeeCode.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setFormState({
      ...INITIAL_STAFF_FORM,
      role: 'teacher',
      employeeCode: `UQCM-EMP-0${staff.length + 1}`,
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenInviteForStaff = (member?: StaffMember, defaultRole?: InvitationTargetRole) => {
    setInviteFeedback(null);
    if (member) {
      const targetR: InvitationTargetRole =
        member.role === 'muhtamim' && isSuperAdmin
          ? 'muhtamim'
          : member.role === 'muhtamim'
            ? 'teacher'
            : member.role;
      setInviteTargetRole(targetR);
      setInviteStaffId(member.id);
      setInviteEmpCode(member.employeeCode);
      setInviteName(member.nameBn);
      setInvitePhone(member.phone);
      setInviteEmail(
        `${member.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@ummulquranmadrasa.edu.bd`
      );
      setInviteDesignation(member.designation);
      setInviteDept(member.department);
      setInviteClasses(member.assignedClasses);
      setInviteSubjects('কুরআন, তাজবীদ ও নির্ধারিত কিতাব');
    } else {
      const chosenRole = defaultRole || (isSuperAdmin ? 'muhtamim' : 'teacher');
      setInviteTargetRole(chosenRole);
      setInviteStaffId(`stf-${Date.now()}`);
      setInviteEmpCode(chosenRole === 'muhtamim' ? 'UQCM-EMP-01' : `UQCM-EMP-0${staff.length + 1}`);
      setInviteName(chosenRole === 'muhtamim' ? 'মাওলানা মুফতি আব্দুল মতিন কাসেমী' : '');
      setInvitePhone(chosenRole === 'muhtamim' ? '01711-001122' : '');
      setInviteEmail(chosenRole === 'muhtamim' ? 'muhtamim@ummulquranmadrasa.edu.bd' : '');
      setInviteDesignation(
        chosenRole === 'muhtamim'
          ? 'মুহতামিম ও শাইখুল হাদিস (Principal)'
          : 'সহকারী উস্তায (হিফয ও কিতাব বিভাগ)'
      );
      setInviteDept(chosenRole === 'muhtamim' ? 'administration' : 'hifz');
      setInviteClasses(chosenRole === 'muhtamim' ? 'সকল জামাত' : 'হিফয শুনানি জামাত');
      setInviteSubjects(chosenRole === 'muhtamim' ? 'সহীহ বুখারী ও ফিকহ' : 'হিফযুল কুরআন ও তাজবীদ');
    }
    setInviteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const permCheck = canProvisionStaffAccount(role, formState.role);
    if (!permCheck.allowed) {
      setFormError(permCheck.reasonBn || 'অনুমতি নেই।');
      return;
    }

    if (
      !formState.nameBn.trim() ||
      !formState.nameEn.trim() ||
      !formState.phone.trim() ||
      !ID_REGEX.test(formState.employeeCode.trim())
    ) {
      setFormError(t.common.requiredFieldError);
      return;
    }
    setIsSaving(true);
    try {
      const {
        assignedSubjects,
        email,
        issuePortalInviteOnCreate,
        ...staffRecordPayload
      } = formState;
      const saved = await onAddStaff(staffRecordPayload);
      if (saved) {
        if (issuePortalInviteOnCreate && onIssueStaffInvitation) {
          await onIssueStaffInvitation({
            targetRole: formState.role,
            staffId: `stf-${formState.employeeCode.toLowerCase()}`,
            employeeCode: formState.employeeCode.trim(),
            recipientName: formState.nameBn.trim(),
            recipientPhone: formState.phone.trim(),
            recipientEmail:
              email.trim() ||
              `${formState.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@ummulquranmadrasa.edu.bd`,
            designation: formState.designation.trim(),
            assignedDepartment: formState.department,
            assignedClasses: formState.assignedClasses.trim(),
            assignedSubjects: assignedSubjects.trim(),
          });
        }
        setIsAddOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssueInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteFeedback(null);
    if (!onIssueStaffInvitation) return;

    const permCheck = canProvisionStaffAccount(role, inviteTargetRole);
    if (!permCheck.allowed) {
      setInviteFeedback({ ok: false, messageBn: permCheck.reasonBn || 'অনুমতি নেই।' });
      return;
    }

    const res = await onIssueStaffInvitation({
      targetRole: inviteTargetRole,
      staffId: inviteStaffId || `stf-${Date.now()}`,
      employeeCode: inviteEmpCode,
      recipientName: inviteName,
      recipientPhone: invitePhone,
      recipientEmail: inviteEmail,
      designation: inviteDesignation,
      assignedDepartment: inviteDept,
      assignedClasses: inviteClasses,
      assignedSubjects: inviteSubjects,
    });
    setInviteFeedback({
      ok: res.ok,
      messageBn: res.messageBn,
      code: res.invitationCode,
    });
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Role Hierarchy Provisioning Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-[#0B3B2E] mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {isSuperAdmin
                ? 'সুপার অ্যাডমিন গভর্ন্যান্স: মুহতামিম ও উস্তায নিয়োগ ও অ্যাকাউন্ট প্রভিশনিং'
                : role === 'muhtamim'
                  ? 'মুহতামিম প্যানেল: উস্তায ও স্টাফ নিয়োগ ও অ্যাকাউন্ট প্রভিশনিং'
                  : 'উস্তায ও স্টাফ ডিরেক্টরি (শুধুমাত্র পাঠযোগ্য)'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.staff}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'উস্তায, মুহতামিম, হিসাবরক্ষক ও আবাসিক তত্ত্বাবধায়কদের প্রোফাইল, নির্ধারিত জামাত, বিষয় ও এককালীন পোর্টাল অ্যাক্টিভেশন ব্যবস্থাপনা।'
              : 'Manage madrasa Muhtamim, teachers (Asatidhah), assigned classes, subjects, and single-use account activation links.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isSuperAdmin && onIssueStaffInvitation && (
              <button
                type="button"
                onClick={() => handleOpenInviteForStaff(undefined, 'muhtamim')}
                data-testid="staff-invite-muhtamim-btn"
                className="px-3.5 py-2.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>
                  {language === 'bn'
                    ? 'মুহতামিম অ্যাকাউন্ট আমন্ত্রণ (Super Admin Only)'
                    : 'Invite Muhtamim Account'}
                </span>
              </button>
            )}

            {onIssueStaffInvitation && (
              <button
                type="button"
                onClick={() => handleOpenInviteForStaff(undefined, 'teacher')}
                data-testid="staff-invite-teacher-btn"
                className="px-3.5 py-2.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#0B3B2E] border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>
                  {language === 'bn'
                    ? 'উস্তায / স্টাফ অ্যাক্টিভেশন কোড ইস্যু করুন'
                    : 'Issue Teacher Activation Code'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              data-testid="staff-add-member-btn"
              className="px-4 py-2.5 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {language === 'bn' ? 'নতুন শিক্ষক / স্টাফ যুক্ত করুন' : 'Add Teacher / Staff'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Hierarchical Single-Use Account Invitations Panel (Visible to Super Admin & Muhtamim) */}
      {isAdmin && (
        <div
          data-testid="staff-invitations-panel"
          className="bg-white border border-stone-200 rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0B3B2E]" />
                <span>
                  {language === 'bn'
                    ? 'মুহতামিম ও উস্তায এককালীন পোর্টাল অ্যাক্টিভেশন আমন্ত্রণ তালিকা'
                    : 'Muhtamim & Teacher Single-Use Activation Invitations'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn'
                  ? 'অনুমোদিত ক্রম: সুপার অ্যাডমিন → মুহতামিম (ACT-MUH-...) → উস্তায/স্টাফ (ACT-TCH-... / ACT-STF-...)। প্রতিটি কোড এককালীন ও মেয়াদযুক্ত।'
                  : 'Hierarchy: Super Admin -> Muhtamim (ACT-MUH-...) -> Teacher/Staff (ACT-TCH-...). Single-use expiring codes.'}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600">
              মোট আমন্ত্রণ: {staffInvitations.length} টি
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-4 text-start">অ্যাক্টিভেশন কোড ও মেয়াদ</th>
                  <th className="py-2.5 px-4 text-start">রোল ও পদবি</th>
                  <th className="py-2.5 px-4 text-start">প্রাপক, মোবাইল ও ইমেইল</th>
                  <th className="py-2.5 px-4 text-start">নির্ধারিত জামাত ও বিষয়</th>
                  <th className="py-2.5 px-4 text-start">স্ট্যাটাস</th>
                  <th className="py-2.5 px-4 text-end">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {staffInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0B3B2E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {inv.invitationCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(inv.invitationCode)}
                          title="Copy activation code"
                          className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {copiedCode === inv.invitationCode && (
                        <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                          কোড কপি হয়েছে!
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        ইস্যু: {inv.issuedAt} · মেয়াদ: {inv.expiresAt || '৭ দিন'}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          inv.targetRole === 'muhtamim'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {inv.targetRole === 'muhtamim'
                          ? 'মুহতামিম (Muhtamim)'
                          : inv.targetRole === 'teacher'
                            ? 'উস্তায (Teacher)'
                            : inv.targetRole}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-1">
                        {inv.designation || 'নির্ধারিত দায়িত্ব'}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="font-bold text-slate-900">{inv.recipientName}</div>
                      <div className="font-mono text-[11px] text-slate-600">
                        {inv.recipientPhone} · আইডি: {inv.employeeCode || inv.admissionNo}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {inv.recipientEmail}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-slate-800 font-medium">
                        {inv.assignedClasses || 'নির্ধারিত জামাত'}
                      </div>
                      {inv.assignedSubjects && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          বিষয়: {inv.assignedSubjects}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {inv.status === 'activated' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>সক্রিয়কৃত (Activated)</span>
                        </span>
                      ) : inv.status === 'revoked' || inv.status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px]">
                          <Ban className="w-3 h-3" />
                          <span>বাতিল / মেয়াদোত্তীর্ণ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-semibold text-[11px]">
                          <span>সক্রিয়করণের অপেক্ষায়</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top text-end">
                      {inv.status === 'pending_activation' && onRevokeInvitation && (
                        <button
                          type="button"
                          onClick={() => onRevokeInvitation(inv.id)}
                          disabled={inv.targetRole === 'muhtamim' && !isSuperAdmin}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-semibold cursor-pointer disabled:opacity-40"
                        >
                          বাতিল করুন
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, পদবি বা আইডি দিয়ে খুঁজুন..."
            aria-label="Search staff"
            className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B3B2E]"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          মোট কর্মরত: {filteredStaff.length} জন
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">আইডি ও যোগদান</th>
                <th className="py-3.5 px-4 text-start">নাম ও শিক্ষাগত যোগ্যতা</th>
                <th className="py-3.5 px-4 text-start">পদবি ও নির্ধারিত জামাত</th>
                <th className="py-3.5 px-4 text-start">মোবাইল</th>
                <th className="py-3.5 px-4 text-end font-mono">মোট মাসিক বেতন</th>
                <th className="py-3.5 px-4 text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {filteredStaff.map((member) => {
                const totalSalary = calculateNetSalary(
                  member.basicSalaryBdt,
                  member.houseAllowanceBdt + member.medicalAllowanceBdt,
                  0
                );
                const canInviteThisMember = canProvisionStaffAccount(role, member.role).allowed;
                return (
                  <tr key={member.id} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {member.employeeCode}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                        {member.joiningDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900">{member.nameBn}</div>
                      <div className="text-xs text-slate-500">{member.nameEn}</div>
                      <div className="mt-0.5 text-xs text-slate-600">{member.qualification}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-xs font-semibold text-[#0B3B2E]">
                        {member.designation}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        জামাত: {member.assignedClasses}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top font-mono tabular-nums text-xs text-slate-700">
                      {member.phone}
                    </td>
                    <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums">
                      <div className="font-semibold text-slate-900">
                        {formatBdt(totalSalary, language)}
                      </div>
                      <div className="text-xs text-slate-500">
                        মূল: {formatBdt(member.basicSalaryBdt, language)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top text-end">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {isAdmin && onIssueStaffInvitation && canInviteThisMember && (
                          <button
                            type="button"
                            onClick={() => handleOpenInviteForStaff(member)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0B3B2E] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            অ্যাক্টিভেশন কোড
                          </button>
                        )}
                        {isAdmin && canInviteThisMember && (
                          <button
                            type="button"
                            onClick={() => setDeletingStaffId(member.id)}
                            aria-label={`Delete ${member.nameEn}`}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Issue Single-Use Staff / Muhtamim Invitation Modal */}
      {inviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-staff-modal-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 id="invite-staff-modal-title" className="text-base font-bold text-slate-900">
                  এককালীন পোর্টাল অ্যাক্টিভেশন আমন্ত্রণ (Single-Use Invitation)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  কোনো প্লেইনটেক্সট পাসওয়ার্ড সংরক্ষণ না করে নিরাপদ এককালীন অ্যাক্টিভেশন কোড তৈরি করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                aria-label="Close invitation modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueInviteSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অ্যাকাউন্ট রোল (Role Hierarchy) *
                  </label>
                  <select
                    value={inviteTargetRole}
                    onChange={(e) => setInviteTargetRole(e.target.value as InvitationTargetRole)}
                    data-testid="invite-staff-role-select"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    {isSuperAdmin && (
                      <option value="muhtamim">মুহতামিম (Muhtamim - Super Admin Only)</option>
                    )}
                    <option value="teacher">উস্তায / শিক্ষক (Teacher)</option>
                    <option value="accountant">হিসাবরক্ষক (Accountant)</option>
                    <option value="residential_supervisor">
                      আবাসিক নেগরান (Residential Supervisor)
                    </option>
                    <option value="staff">সাধারণ স্টাফ (Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কর্মচারী আইডি (Employee ID) *
                  </label>
                  <input
                    type="text"
                    value={inviteEmpCode}
                    onChange={(e) => setInviteEmpCode(e.target.value)}
                    data-testid="invite-staff-empcode-input"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পূর্ণ নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    data-testid="invite-staff-name-input"
                    placeholder="মাওলানা / হাফেজ ..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ভেরিফিকেশন মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    data-testid="invite-staff-phone-input"
                    placeholder="017XX-XXXXXX"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    লগইন ইমেইল ঠিকানা *
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="invite-staff-email-input"
                    placeholder="teacher@ummulquranmadrasa.edu.bd"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পদবি (Designation) *
                  </label>
                  <input
                    type="text"
                    value={inviteDesignation}
                    onChange={(e) => setInviteDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নির্ধারিত জামাত / শ্রেণি *
                  </label>
                  <input
                    type="text"
                    value={inviteClasses}
                    onChange={(e) => setInviteClasses(e.target.value)}
                    data-testid="invite-staff-classes-input"
                    placeholder="হিফয তাকমীল, ক্যাডেট ৭ম শ্রেণি"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নির্ধারিত বিষয় / কিতাব
                  </label>
                  <input
                    type="text"
                    value={inviteSubjects}
                    onChange={(e) => setInviteSubjects(e.target.value)}
                    data-testid="invite-staff-subjects-input"
                    placeholder="হিফযুল কুরআন, তাজবীদ, গণিত"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              {inviteFeedback && (
                <div
                  role="alert"
                  data-testid="invite-staff-feedback-box"
                  className={`p-3 rounded-lg border text-xs ${
                    inviteFeedback.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="font-bold">{inviteFeedback.messageBn}</div>
                  {inviteFeedback.code && (
                    <div className="mt-1.5 flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded border border-emerald-300 font-mono font-bold text-[#0B3B2E]">
                      <span>কোড: {inviteFeedback.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(inviteFeedback.code!)}
                        className="text-xs underline cursor-pointer"
                      >
                        কপি করুন
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 rounded-lg cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  data-testid="invite-staff-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B3B2E] hover:bg-emerald-950 rounded-lg cursor-pointer"
                >
                  এককালীন অ্যাক্টিভেশন কোড তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-staff-title" className="text-lg font-bold text-slate-900">
                নতুন উস্তায / স্টাফ নিয়োগ ও অ্যাকাউন্ট প্রভিশনিং ফরম
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close staff modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="stf-role"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    পোর্টাল রোল (Role) *
                  </label>
                  <select
                    id="stf-role"
                    value={formState.role}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        role: e.target.value as StaffMember['role'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    {isSuperAdmin && (
                      <option value="muhtamim">মুহতামিম (Muhtamim)</option>
                    )}
                    <option value="teacher">উস্তায / শিক্ষক (Teacher)</option>
                    <option value="accountant">হিসাবরক্ষক (Accountant)</option>
                    <option value="residential_supervisor">আবাসিক নেগরান</option>
                    <option value="staff">সাধারণ স্টাফ</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="stf-code"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    কর্মচারী কোড (Employee Code) *
                  </label>
                  <input
                    id="stf-code"
                    type="text"
                    value={formState.employeeCode}
                    onChange={(e) =>
                      setFormState({ ...formState, employeeCode: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stf-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মোবাইল নম্বর (Phone) *
                  </label>
                  <input
                    id="stf-phone"
                    type="tel"
                    placeholder="017XX-XXXXXX"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="stf-nameBn"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    নাম (বাংলা) *
                  </label>
                  <input
                    id="stf-nameBn"
                    type="text"
                    value={formState.nameBn}
                    onChange={(e) => setFormState({ ...formState, nameBn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stf-nameEn"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Name (English) *
                  </label>
                  <input
                    id="stf-nameEn"
                    type="text"
                    value={formState.nameEn}
                    onChange={(e) => setFormState({ ...formState, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="stf-designation"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    পদবি (Designation) *
                  </label>
                  <input
                    id="stf-designation"
                    type="text"
                    value={formState.designation}
                    onChange={(e) =>
                      setFormState({ ...formState, designation: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stf-classes"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    নির্ধারিত জামাত / দায়িত্ব
                  </label>
                  <input
                    id="stf-classes"
                    type="text"
                    value={formState.assignedClasses}
                    onChange={(e) =>
                      setFormState({ ...formState, assignedClasses: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="stf-email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    লগইন ইমেইল (Account Email)
                  </label>
                  <input
                    id="stf-email"
                    type="email"
                    placeholder="teacher@ummulquranmadrasa.edu.bd"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stf-subjects"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    পাঠদানের বিষয় / কিতাব
                  </label>
                  <input
                    id="stf-subjects"
                    type="text"
                    value={formState.assignedSubjects}
                    onChange={(e) =>
                      setFormState({ ...formState, assignedSubjects: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="stf-basic"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মূল বেতন (Basic BDT)
                  </label>
                  <input
                    id="stf-basic"
                    type="number"
                    value={formState.basicSalaryBdt}
                    onChange={(e) =>
                      setFormState({ ...formState, basicSalaryBdt: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stf-house"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    আবাসন ভাতা (BDT)
                  </label>
                  <input
                    id="stf-house"
                    type="number"
                    value={formState.houseAllowanceBdt}
                    onChange={(e) =>
                      setFormState({ ...formState, houseAllowanceBdt: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stf-med"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    চিকিৎসা ভাতা (BDT)
                  </label>
                  <input
                    id="stf-med"
                    type="number"
                    value={formState.medicalAllowanceBdt}
                    onChange={(e) =>
                      setFormState({ ...formState, medicalAllowanceBdt: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.issuePortalInviteOnCreate}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      issuePortalInviteOnCreate: e.target.checked,
                    })
                  }
                  className="rounded border-stone-300 text-[#0B3B2E]"
                />
                <span>
                  একইসাথে এককালীন পোর্টাল অ্যাক্টিভেশন কোড (Single-Use Activation Code) তৈরি করুন
                </span>
              </label>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B3B2E] rounded-lg"
                >
                  {isSaving ? t.syncingText : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deletingStaffId)}
        title="স্টাফ প্রোফাইল মুছে ফেলবেন?"
        message="আপনি কি নিশ্চিত যে এই উস্তায বা স্টাফের রেকর্ডটি মুছে ফেলতে চান?"
        confirmLabel={t.common.confirmDelete}
        cancelLabel={t.common.cancel}
        onCancel={() => setDeletingStaffId(null)}
        onConfirm={async () => {
          if (deletingStaffId) {
            await onDeleteStaff(deletingStaffId);
            setDeletingStaffId(null);
          }
        }}
      />
    </div>
  );
}

