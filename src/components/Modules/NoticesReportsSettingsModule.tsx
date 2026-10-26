import React, { useEffect, useState } from 'react';
import { Download, Megaphone, Plus, Printer, Settings as SettingsIcon, Shield, X } from 'lucide-react';
import type {
  AdminAuditLog,
  AttendanceRecord,
  BannerSlide,
  FeeInvoice,
  HifzProgressLog,
  InstitutionSettings,
  Language,
  Notice,
  PayrollRecord,
  Student,
  UserProfile,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  canModifyUserAccountRoleOrStatus,
  formatBdt,
  generateCsvContent,
} from '../../utils/madrasaLogic';

// --- MODULE 11: NOTICES & COMMUNICATION ---
export function NoticesModule({
  language,
  role,
  notices,
  onAddNotice,
}: {
  language: Language;
  role: UserRole;
  notices: Notice[];
  onAddNotice: (notice: Omit<Notice, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
}) {
  const t = TRANSLATIONS[language];
  const canPost = ['super_admin', 'muhtamim', 'teacher', 'residential_supervisor'].includes(role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentBn, setContentBn] = useState('');
  const [targetAudience, setTargetAudience] = useState<Notice['targetAudience']>('all');
  const [targetClass, setTargetClass] = useState('সকল জামাত');
  const [priority, setPriority] = useState<Notice['priority']>('normal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !contentBn.trim()) return;
    const saved = await onAddNotice({
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim(),
      contentBn: contentBn.trim(),
      targetAudience,
      targetClass: targetClass.trim(),
      priority,
      publishDate: '2026-10-22',
    });
    if (saved) {
      setTitleBn('');
      setTitleEn('');
      setContentBn('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.notices}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            শিক্ষক, অভিভাবক, আবাসিক ছাত্রাবাস ও সকল জামাতের জন্য দাপ্তরিক নোটিশ ও বিজ্ঞপ্তি।
          </p>
        </div>
        {canPost && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন নোটিশ প্রকাশ করুন</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notices.map((n) => (
          <article key={n.id} className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#0B3B2E]" />
                <span className="font-mono tabular-nums">{n.publishDate}</span>
                <span aria-hidden="true">·</span>
                <span>প্রাপক: {n.targetAudience.toUpperCase()}</span>
                <span aria-hidden="true">·</span>
                <span>{n.targetClass}</span>
              </div>
              <span
                className={`font-semibold ${
                  n.priority === 'urgent'
                    ? 'text-red-700'
                    : n.priority === 'important'
                      ? 'text-amber-800'
                      : 'text-slate-600'
                }`}
              >
                {n.priority === 'urgent'
                  ? 'জরুরি বিজ্ঞপ্তি (Urgent)'
                  : n.priority === 'important'
                    ? 'গুরুত্বপূর্ণ (Important)'
                    : 'সাধারণ বিজ্ঞপ্তি'}
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold text-slate-900">{n.titleBn}</h2>
            {n.titleEn && <p className="text-xs text-slate-500">{n.titleEn}</p>}
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">{n.contentBn}</p>
          </article>
        ))}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-notice-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-notice-title" className="text-lg font-bold text-slate-900">
                নতুন দাপ্তরিক নোটিশ প্রকাশ
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close notice modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="not-titleBn"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  নোটিশের শিরোনাম (বাংলা) *
                </label>
                <input
                  id="not-titleBn"
                  type="text"
                  required
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="not-titleEn"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Notice Title (English)
                </label>
                <input
                  id="not-titleEn"
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="not-aud"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    প্রাপক (Audience)
                  </label>
                  <select
                    id="not-aud"
                    value={targetAudience}
                    onChange={(e) =>
                      setTargetAudience(e.target.value as Notice['targetAudience'])
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="all">সকলের জন্য (All)</option>
                    <option value="guardians">অভিভাবক (Guardians)</option>
                    <option value="teachers">শিক্ষকবৃন্দ (Teachers)</option>
                    <option value="residential">আবাসিক (Residential)</option>
                    <option value="students">শিক্ষার্থী (Students)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="not-class"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    নির্ধারিত জামাত
                  </label>
                  <input
                    id="not-class"
                    type="text"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="not-prio"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    গুরুত্ব (Priority)
                  </label>
                  <select
                    id="not-prio"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Notice['priority'])}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="normal">সাধারণ (Normal)</option>
                    <option value="important">গুরুত্বপূর্ণ (Important)</option>
                    <option value="urgent">জরুরি (Urgent)</option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="not-content"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  বিস্তারিত বিবরণ *
                </label>
                <textarea
                  id="not-content"
                  rows={4}
                  required
                  value={contentBn}
                  onChange={(e) => setContentBn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium bg-stone-100 rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#0B3B2E] text-white rounded-lg"
                >
                  প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MODULE 12: REPORTS & CSV EXPORT ---
export function ReportsModule({
  language,
  students,
  attendance,
  invoices,
  hifzLogs,
  payroll,
}: {
  language: Language;
  students: Student[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  hifzLogs: HifzProgressLog[];
  payroll: PayrollRecord[];
}) {
  const t = TRANSLATIONS[language];
  const [reportType, setReportType] = useState<'students' | 'finance' | 'attendance' | 'hifz'>(
    'students'
  );
  const [filterText, setFilterText] = useState('');

  const handleExportCsv = () => {
    let csv = '';
    let filename = `ummul-quran-${reportType}-report.csv`;

    if (reportType === 'students') {
      csv = generateCsvContent(
        ['Admission No', 'Name (BN)', 'Name (EN)', 'Department', 'Class', 'Guardian Phone', 'Monthly Fee BDT', 'Status'],
        students.map((s) => [
          s.admissionNo,
          s.nameBn,
          s.nameEn,
          s.department,
          s.className,
          s.guardianPhone,
          s.monthlyFeeBdt,
          s.status,
        ])
      );
    } else if (reportType === 'finance') {
      csv = generateCsvContent(
        ['Receipt No', 'Student Name', 'Admission No', 'Fee Type', 'Billing Month', 'Due BDT', 'Paid BDT', 'Method', 'Status'],
        invoices.map((i) => [
          i.receiptNo,
          i.studentNameBn,
          i.admissionNo,
          i.feeType,
          i.billingMonth,
          i.amountDueBdt,
          i.amountPaidBdt,
          i.paymentMethod,
          i.status,
        ])
      );
    } else if (reportType === 'attendance') {
      csv = generateCsvContent(
        ['Date', 'Admission No', 'Student Name', 'Class', 'Status', 'Remarks'],
        attendance.map((a) => [
          a.date,
          a.admissionNo,
          a.studentNameBn,
          a.className,
          a.status,
          a.remarks,
        ])
      );
    } else {
      csv = generateCsvContent(
        ['Date', 'Admission No', 'Student Name', 'Para', 'Sabaq', 'Lines', 'Rating', 'Comment'],
        hifzLogs.map((h) => [
          h.date,
          h.admissionNo,
          h.studentNameBn,
          h.paraNumber,
          h.sabaqSurahAndAyat,
          h.sabaqLines,
          h.tajweedRating,
          h.teacherComment,
        ])
      );
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.reports}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            সার্চ, ফিল্টার ও প্রিন্টযোগ্য প্রাতিষ্ঠানিক প্রতিবেদন এবং ইউনিকোড CSV এক্সপোর্ট।
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.common.exportCsv}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.common.print}</span>
          </button>
        </div>
      </div>

      {/* Report Selector & Filter */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
          {(
            [
              { id: 'students', label: 'শিক্ষার্থী প্রতিবেদন' },
              { id: 'finance', label: 'আর্থিক আদায় ও বকেয়া' },
              { id: 'attendance', label: 'হাজিরা শিট' },
              { id: 'hifz', label: 'হিফযুল কুরআন অগ্রগতি' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                reportType === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="প্রতিবেদনে খুঁজুন..."
          aria-label="Filter report rows"
          className="px-3 py-1.5 text-xs bg-[#FAF8F5] border border-stone-300 rounded-lg w-full sm:w-64"
        />
      </div>

      {/* Report Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'students' && (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 text-start">দাখেলা নং</th>
                  <th className="py-3 px-4 text-start">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4 text-start">বিভাগ ও জামাত</th>
                  <th className="py-3 px-4 text-start">অভিভাবক ও মোবাইল</th>
                  <th className="py-3 px-4 text-end font-mono">মাসিক ফি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {students
                  .filter(
                    (s) =>
                      !filterText ||
                      s.nameBn.includes(filterText) ||
                      s.admissionNo.toLowerCase().includes(filterText.toLowerCase())
                  )
                  .map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 font-mono">{s.admissionNo}</td>
                      <td className="py-3 px-4 font-bold">{s.nameBn}</td>
                      <td className="py-3 px-4">{s.className}</td>
                      <td className="py-3 px-4 font-mono">
                        {s.guardianName} ({s.guardianPhone})
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-semibold">
                        {formatBdt(s.monthlyFeeBdt, language)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'finance' && (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 text-start">রসিদ নং</th>
                  <th className="py-3 px-4 text-start">শিক্ষার্থী</th>
                  <th className="py-3 px-4 text-start">মাস ও মাধ্যম</th>
                  <th className="py-3 px-4 text-end font-mono">ধার্যকৃত</th>
                  <th className="py-3 px-4 text-end font-mono">পরিশোধিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3 px-4 font-mono">{i.receiptNo}</td>
                    <td className="py-3 px-4 font-bold">{i.studentNameBn}</td>
                    <td className="py-3 px-4">
                      {i.billingMonth} · {i.paymentMethod.toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-end font-mono">
                      {formatBdt(i.amountDueBdt, language)}
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-semibold text-emerald-800">
                      {formatBdt(i.amountPaidBdt, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'attendance' && (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 text-start">তারিখ</th>
                  <th className="py-3 px-4 text-start">দাখেলা ও নাম</th>
                  <th className="py-3 px-4 text-start">জামাত</th>
                  <th className="py-3 px-4 text-start">অবস্থা</th>
                  <th className="py-3 px-4 text-start">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-4 font-mono">{a.date}</td>
                    <td className="py-3 px-4 font-bold">
                      {a.studentNameBn} ({a.admissionNo})
                    </td>
                    <td className="py-3 px-4">{a.className}</td>
                    <td className="py-3 px-4 font-semibold uppercase">{a.status}</td>
                    <td className="py-3 px-4">{a.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'hifz' && (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 text-start">তারিখ</th>
                  <th className="py-3 px-4 text-start">শিক্ষার্থী</th>
                  <th className="py-3 px-4 text-start">পারা ও সবক</th>
                  <th className="py-3 px-4 text-start">মূল্যায়ন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {hifzLogs.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 px-4 font-mono">{h.date}</td>
                    <td className="py-3 px-4 font-bold">{h.studentNameBn}</td>
                    <td className="py-3 px-4">
                      পারা {h.paraNumber}: {h.sabaqSurahAndAyat} ({h.sabaqLines} লাইন)
                    </td>
                    <td className="py-3 px-4">{h.tajweedRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MODULE 13: INSTITUTION SETTINGS & USER ACCESS CONTROL ---
export function SettingsModule({
  language,
  role,
  currentUserUid = 'usr-admin-1',
  isSuperAdminProvisioned = false,
  settings,
  users,
  bannerSlides,
  adminAuditLogs = [],
  onSaveSettings,
  onUpdateUserRole,
  onUpdateBannerSlide,
}: {
  language: Language;
  role: UserRole;
  currentUserUid?: string;
  isSuperAdminProvisioned?: boolean;
  settings: InstitutionSettings;
  users: UserProfile[];
  bannerSlides: BannerSlide[];
  adminAuditLogs?: AdminAuditLog[];
  onSaveSettings: (updated: InstitutionSettings) => Promise<boolean>;
  onUpdateUserRole: (
    userId: string,
    newRole: UserRole,
    status: UserProfile['status'],
    linkedStudentIds?: string
  ) => Promise<boolean>;
  onUpdateBannerSlide: (updatedSlide: BannerSlide) => Promise<boolean>;
}) {
  const t = TRANSLATIONS[language];
  const isAdmin = ['super_admin', 'muhtamim'].includes(role);
  const [formState, setFormState] = useState<InstitutionSettings>(settings);
  const [savedBanner, setSavedBanner] = useState(false);

  // Sync local form state whenever cloud settings update
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const saved = await onSaveSettings(formState);
    if (saved) {
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#0B3B2E]" />
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.settings}</h1>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          মাদ্রাসার প্রাতিষ্ঠানিক প্রোফাইল, শিক্ষাবর্ষ, হিজরি সন, গ্রেডিং নীতিমালা এবং রোল-ভিত্তিক ইউজার অ্যাক্সেস ম্যানেজমেন্ট।
        </p>
      </div>

      {savedBanner && (
        <div
          role="status"
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900"
        >
          প্রতিষ্ঠানের সেটিংস সফলভাবে সংরক্ষিত হয়েছে।
        </div>
      )}

      {/* Institution Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-stone-200 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-stone-200">
          ১. প্রাতিষ্ঠানিক প্রোফাইল ও শিক্ষাবর্ষ কনফিগারেশন
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="set-nameBn"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              মাদ্রাসার নাম (বাংলা)
            </label>
            <input
              id="set-nameBn"
              type="text"
              disabled={!isAdmin}
              value={formState.institutionNameBn}
              onChange={(e) =>
                setFormState({ ...formState, institutionNameBn: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="set-nameEn"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Institution Name (English)
            </label>
            <input
              id="set-nameEn"
              type="text"
              disabled={!isAdmin}
              value={formState.institutionNameEn}
              onChange={(e) =>
                setFormState({ ...formState, institutionNameEn: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="set-nameAr"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              اسم المدرسة (Arabic)
            </label>
            <input
              id="set-nameAr"
              type="text"
              dir="rtl"
              disabled={!isAdmin}
              value={formState.institutionNameAr}
              onChange={(e) =>
                setFormState({ ...formState, institutionNameAr: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="set-year"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              শিক্ষাবর্ষ (Academic Session)
            </label>
            <input
              id="set-year"
              type="text"
              disabled={!isAdmin}
              value={formState.academicYear}
              onChange={(e) => setFormState({ ...formState, academicYear: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="set-hijri"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              হিজরি সন (Hijri Year)
            </label>
            <input
              id="set-hijri"
              type="text"
              disabled={!isAdmin}
              value={formState.hijriYear}
              onChange={(e) => setFormState({ ...formState, hijriYear: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="set-phone"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              দাপ্তরিক টেলিফোন / মোবাইল
            </label>
            <input
              id="set-phone"
              type="text"
              disabled={!isAdmin}
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="set-address"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              ঠিকানা (Campus Address)
            </label>
            <input
              id="set-address"
              type="text"
              disabled={!isAdmin}
              value={formState.addressBn}
              onChange={(e) => setFormState({ ...formState, addressBn: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="set-grading"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              গ্রেডিং নীতিমালা (Grading Scale)
            </label>
            <input
              id="set-grading"
              type="text"
              disabled={!isAdmin}
              value={formState.gradingSystem}
              onChange={(e) =>
                setFormState({ ...formState, gradingSystem: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg cursor-pointer"
            >
              {t.common.save}
            </button>
          </div>
        )}
      </form>

      {/* Role & Access Management Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0B3B2E]" />
            <h2 className="text-base font-bold text-slate-900">
              ২. ইউজার অ্যাক্সেস ও রোল অনুমোদন তালিকা (RBAC Directory)
            </h2>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            {isSuperAdminProvisioned
              ? 'সুপার অ্যাডমিন বুটস্ট্র্যাপ লক: সক্রিয় (অপরিবর্তনীয়)'
              : 'সুপার অ্যাডমিন বুটস্ট্র্যাপ: প্রাথমিক কনফিগারেশন অপেক্ষমাণ'}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">নাম ও ইমেইল</th>
                <th className="py-3.5 px-4 text-start">সংযুক্ত শিক্ষার্থী আইডি (Guardian Linked IDs) / জামাত</th>
                <th className="py-3.5 px-4 text-start">নির্ধারিত রোল (Role)</th>
                <th className="py-3.5 px-4 text-start">অ্যাকাউন্ট অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {users.map((u) => {
                const targetUid = u.uid || u.id;
                const modifyCheck = canModifyUserAccountRoleOrStatus({
                  actorRole: role,
                  actorUid: currentUserUid,
                  targetUser: {
                    uid: targetUid,
                    role: u.role,
                    status: u.status,
                  },
                  nextRole: u.role,
                  nextStatus: u.status,
                });
                const canActorEditThisRow = modifyCheck.allowed;

                return (
                  <tr key={u.id} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.displayName}</div>
                      <div className="text-xs font-mono text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {canActorEditThisRow && isAdmin ? (
                        <input
                          type="text"
                          aria-label={`Linked student IDs for ${u.email}`}
                          defaultValue={u.linkedStudentIds}
                          placeholder={u.assignedClasses || 'e.g. stu-101,stu-103'}
                          onBlur={(e) => {
                            const nextVal = e.target.value.trim();
                            if (nextVal !== u.linkedStudentIds) {
                              onUpdateUserRole(u.id, u.role, u.status, nextVal);
                            }
                          }}
                          className="w-44 px-2 py-1 text-xs font-mono bg-stone-50 border border-stone-300 rounded-md"
                        />
                      ) : u.linkedStudentIds ? (
                        `Students: ${u.linkedStudentIds}`
                      ) : (
                        u.assignedClasses || '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {canActorEditThisRow ? (
                        <select
                          aria-label={`Role for ${u.email}`}
                          value={u.role}
                          onChange={(e) =>
                            onUpdateUserRole(
                              u.id,
                              e.target.value as UserRole,
                              u.status,
                              u.linkedStudentIds
                            )
                          }
                          className="text-xs bg-stone-100 border border-stone-300 rounded-md px-2 py-1 font-medium"
                        >
                          {u.role === 'super_admin' && (
                            <option value="super_admin">Super Admin</option>
                          )}
                          {role === 'super_admin' && (
                            <option value="muhtamim">Muhtamim</option>
                          )}
                          <option value="teacher">Teacher</option>
                          <option value="accountant">Accountant</option>
                          <option value="residential_supervisor">Residential Supervisor</option>
                          <option value="guardian">Guardian</option>
                          <option value="student">Student</option>
                          <option value="staff">Staff</option>
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-slate-800">
                          {t.roles[u.role]}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {canActorEditThisRow ? (
                        <select
                          aria-label={`Status for ${u.email}`}
                          value={u.status}
                          onChange={(e) =>
                            onUpdateUserRole(
                              u.id,
                              u.role,
                              e.target.value as UserProfile['status'],
                              u.linkedStudentIds
                            )
                          }
                          className="text-xs bg-stone-100 border border-stone-300 rounded-md px-2 py-1 font-medium"
                        >
                          <option value="active">Active (অনুমোদিত)</option>
                          <option value="pending">Pending (অপেক্ষমাণ)</option>
                          <option value="suspended">Suspended (স্থগিত)</option>
                        </select>
                      ) : (
                        <span className="text-xs font-mono text-slate-600">{u.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configurable Dashboard Welcome Banner Carousel Slides */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ৩. ড্যাশবোর্ড ব্যানার স্লাইডার কনফিগারেশন (Dashboard Banner Carousel)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              ড্যাশবোর্ডের স্বাগতম ক্যারোসেলে প্রদর্শিত একাডেমিক ঘোষণা, পরীক্ষার সময়সূচি ও ভর্তি বিজ্ঞপ্তির স্লাইডসমূহ সম্পাদনা করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bannerSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className="p-4 rounded-xl border border-stone-200 bg-[#FAF8F5] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0B3B2E] font-mono">
                  স্লাইড #{idx + 1} · {slide.category.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Theme for slide ${idx + 1}`}
                    disabled={!isAdmin}
                    value={slide.theme}
                    onChange={(e) =>
                      onUpdateBannerSlide({
                        ...slide,
                        theme: e.target.value as BannerSlide['theme'],
                      })
                    }
                    className="px-2 py-1 text-xs bg-white border border-stone-300 rounded-md font-medium"
                  >
                    <option value="emerald">Deep Emerald</option>
                    <option value="navy">Dark Navy</option>
                    <option value="ivory">Warm Ivory</option>
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={slide.isActive}
                      onChange={(e) =>
                        onUpdateBannerSlide({
                          ...slide,
                          isActive: e.target.checked,
                        })
                      }
                      className="rounded border-stone-300 text-[#0B3B2E]"
                    />
                    <span>সক্রিয়</span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor={`slide-title-${slide.id}`}
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  শিরোনাম (বাংলা)
                </label>
                <input
                  id={`slide-title-${slide.id}`}
                  type="text"
                  disabled={!isAdmin}
                  value={slide.titleBn}
                  onChange={(e) =>
                    onUpdateBannerSlide({ ...slide, titleBn: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor={`slide-desc-${slide.id}`}
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  সংক্ষিপ্ত বিবরণ (বাংলা)
                </label>
                <textarea
                  id={`slide-desc-${slide.id}`}
                  rows={2}
                  disabled={!isAdmin}
                  value={slide.descriptionBn}
                  onChange={(e) =>
                    onUpdateBannerSlide({
                      ...slide,
                      descriptionBn: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`slide-badge-${slide.id}`}
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    বিভাগ ব্যাজ
                  </label>
                  <input
                    id={`slide-badge-${slide.id}`}
                    type="text"
                    disabled={!isAdmin}
                    value={slide.badgeBn}
                    onChange={(e) =>
                      onUpdateBannerSlide({ ...slide, badgeBn: e.target.value })
                    }
                    className="w-full px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`slide-date-${slide.id}`}
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    তারিখ / সময়সূচি মেটা
                  </label>
                  <input
                    id={`slide-date-${slide.id}`}
                    type="text"
                    disabled={!isAdmin}
                    value={slide.metaDate}
                    onChange={(e) =>
                      onUpdateBannerSlide({ ...slide, metaDate: e.target.value })
                    }
                    className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Administrative Audit Log Section */}
      <div
        data-testid="admin-audit-log-table"
        className="bg-white border border-stone-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ৪. প্রশাসনিক অডিট লগ ও অ্যাকাউন্ট গভর্ন্যান্স (Administrative Audit Trail)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              সুপার অ্যাডমিন বুটস্ট্র্যাপ, মুহতামিম ও শিক্ষক অ্যাকাউন্ট আমন্ত্রণ, অ্যাক্টিভেশন এবং রোল পরিবর্তনের অপরিবর্তনীয় রেকর্ড।
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            মোট রেকর্ড: {adminAuditLogs.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 text-start">সময়কাল (Timestamp)</th>
                <th className="py-3 px-4 text-start">কার্যক্রম (Action)</th>
                <th className="py-3 px-4 text-start">সম্পাদনকারী (Actor)</th>
                <th className="py-3 px-4 text-start">লক্ষ্য অ্যাকাউন্ট ও রোল</th>
                <th className="py-3 px-4 text-start">বিবরণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs">
              {adminAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-slate-500">
                    এখনো কোনো প্রশাসনিক অডিট লগ রেকর্ড করা হয়নি।
                  </td>
                </tr>
              ) : (
                adminAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                      {log.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#0B3B2E]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.actorEmail}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {log.actorRole} · {log.actorUid}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.targetEmail}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {log.targetRole} · {log.targetUid}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.summaryBn}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
