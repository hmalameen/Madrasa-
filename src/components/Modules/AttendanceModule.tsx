import React, { useState } from 'react';
import { CalendarCheck, CheckCircle2, Printer } from 'lucide-react';
import type {
  AttendanceRecord,
  AttendanceStatus,
  Department,
  Language,
  Student,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';

interface AttendanceModuleProps {
  language: Language;
  role: UserRole;
  students: Student[];
  attendance: AttendanceRecord[];
  onUpsertAttendance: (
    date: string,
    student: Student,
    status: AttendanceStatus,
    remarks: string
  ) => Promise<boolean>;
}

const STATUS_OPTIONS: {
  id: AttendanceStatus;
  labelBn: string;
  labelEn: string;
  activeClass: string;
}[] = [
  {
    id: 'present',
    labelBn: 'উপস্থিত (Present)',
    labelEn: 'Present',
    activeClass: 'bg-[#0B3B2E] text-white font-semibold',
  },
  {
    id: 'absent',
    labelBn: 'অনুপস্থিত (Absent)',
    labelEn: 'Absent',
    activeClass: 'bg-red-700 text-white font-semibold',
  },
  {
    id: 'late',
    labelBn: 'বিলম্ব (Late)',
    labelEn: 'Late',
    activeClass: 'bg-amber-600 text-white font-semibold',
  },
  {
    id: 'leave',
    labelBn: 'ছুটি (Leave)',
    labelEn: 'Leave',
    activeClass: 'bg-slate-700 text-white font-semibold',
  },
];

export function AttendanceModule({
  language,
  role,
  students,
  attendance,
  onUpsertAttendance,
}: AttendanceModuleProps) {
  const t = TRANSLATIONS[language];
  const canMark = ['super_admin', 'muhtamim', 'teacher', 'residential_supervisor'].includes(role);

  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filteredStudents = students.filter(
    (s) => selectedDept === 'all' || s.department === selectedDept
  );

  const dateRecords = attendance.filter((a) => a.date === selectedDate);

  const handleStatusClick = async (student: Student, status: AttendanceStatus) => {
    if (!canMark) return;
    setFeedbackMsg(null);
    const existingRecord = dateRecords.find((r) => r.studentId === student.id);
    const remarks =
      draftRemarks[student.id] !== undefined
        ? draftRemarks[student.id]
        : existingRecord?.remarks || '';
    const saved = await onUpsertAttendance(selectedDate, student, status, remarks);
    if (saved) {
      setFeedbackMsg(
        language === 'bn'
          ? `${student.nameBn}-এর হাজিরা (${status}) সংরক্ষিত হয়েছে (${selectedDate})`
          : `Attendance saved for ${student.nameEn} (${status})`
      );
    }
  };

  const handleMarkAllPresent = async () => {
    if (!canMark) return;
    setFeedbackMsg(null);
    let allSucceeded = true;
    for (const st of filteredStudents) {
      const existingRecord = dateRecords.find((r) => r.studentId === st.id);
      if (!existingRecord) {
        const ok = await onUpsertAttendance(selectedDate, st, 'present', 'নিয়মিত উপস্থিত');
        if (!ok) {
          allSucceeded = false;
          break;
        }
      }
    }
    if (allSucceeded) {
      setFeedbackMsg(
        language === 'bn'
          ? `${selectedDate} তারিখের সকল অবশিষ্ট শিক্ষার্থীর হাজিরা ‘উপস্থিত’ হিসেবে সংরক্ষিত হয়েছে।`
          : `All unmarked students recorded as Present for ${selectedDate}.`
      );
    }
  };

  const presentCount = dateRecords.filter((r) => r.status === 'present').length;
  const absentCount = dateRecords.filter((r) => r.status === 'absent').length;
  const lateCount = dateRecords.filter((r) => r.status === 'late').length;
  const leaveCount = dateRecords.filter((r) => r.status === 'leave').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.attendance}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'তারিখ ও জামাতভিত্তিক হাজিরা নিবন্ধন। একই তারিখে একই শিক্ষার্থীর ডুপ্লিকেট এন্ট্রি স্বয়ংক্রিয়ভাবে রোধ করা হয়।'
              : 'Date-wise attendance sheet with automatic duplicate prevention per student and date.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canMark && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {language === 'bn' ? 'সকলকে উপস্থিত চিহ্নিত করুন' : 'Mark Unmarked Present'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer no-print"
          >
            <Printer className="w-4 h-4" />
            <span>{t.common.print}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center justify-between"
        >
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline ms-4"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Date, Department Filter & Daily Summary */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="att-date-picker" className="text-xs font-semibold text-slate-700">
              তারিখ (Date):
            </label>
            <input
              id="att-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono bg-[#FAF8F5] border border-stone-300 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
            {(['all', 'hifz', 'qawmi', 'general'] as const).map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept === 'all' ? t.common.allDepartments : t.departments[dept]}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Counts */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-600">
          <span className="text-emerald-800 font-semibold">উপস্থিত: {presentCount}</span>
          <span aria-hidden="true">·</span>
          <span className="text-red-700 font-semibold">অনুপস্থিত: {absentCount}</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-800 font-semibold">বিলম্ব: {lateCount}</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-700 font-semibold">ছুটি: {leaveCount}</span>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">দাখেলা ও রোল</th>
                <th className="py-3.5 px-4 text-start">শিক্ষার্থীর নাম ও জামাত</th>
                <th className="py-3.5 px-4 text-start">হাজিরা অবস্থা (Status Selection)</th>
                <th className="py-3.5 px-4 text-start">মন্তব্য / কৈফিয়ত (Remarks)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {filteredStudents.map((st) => {
                const record = dateRecords.find((r) => r.studentId === st.id);
                const currentStatus = record?.status;
                const currentRemarks =
                  draftRemarks[st.id] !== undefined
                    ? draftRemarks[st.id]
                    : record?.remarks || '';

                return (
                  <tr key={st.id} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4 align-middle font-mono tabular-nums text-xs">
                      <div className="font-semibold text-slate-900">{st.admissionNo}</div>
                      <div className="text-slate-500">রোল #{st.rollNo}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900">{st.nameBn}</div>
                      <div className="text-xs text-slate-500">
                        {st.className} · {t.departments[st.department]}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
                        {STATUS_OPTIONS.map((opt) => {
                          const isSelected = currentStatus === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={!canMark}
                              onClick={() => handleStatusClick(st, opt.id)}
                              className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                                isSelected
                                  ? opt.activeClass
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {language === 'bn' ? opt.labelBn : opt.labelEn}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <input
                        type="text"
                        disabled={!canMark}
                        aria-label={`Remarks for ${st.nameEn}`}
                        value={currentRemarks}
                        placeholder="মন্তব্য লিখুন..."
                        onChange={(e) =>
                          setDraftRemarks({ ...draftRemarks, [st.id]: e.target.value })
                        }
                        onBlur={() => {
                          if (canMark && currentStatus && draftRemarks[st.id] !== undefined) {
                            onUpsertAttendance(
                              selectedDate,
                              st,
                              currentStatus,
                              draftRemarks[st.id]
                            );
                          }
                        }}
                        className="w-full max-w-xs px-3 py-1.5 text-xs bg-[#FAF8F5] border border-stone-300 rounded-lg"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
