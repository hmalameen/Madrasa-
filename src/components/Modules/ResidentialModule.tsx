import React, { useState } from 'react';
import { Home, Plus, X } from 'lucide-react';
import type { Language, ResidentialLeave, Student, UserRole } from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';

interface ResidentialModuleProps {
  language: Language;
  role: UserRole;
  students: Student[];
  leaves: ResidentialLeave[];
  onAddLeave: (leave: Omit<ResidentialLeave, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateLeaveStatus: (
    leaveId: string,
    status: ResidentialLeave['status'],
    actualReturnDate: string
  ) => Promise<boolean>;
}

export function ResidentialModule({
  language,
  role,
  students,
  leaves,
  onAddLeave,
  onUpdateLeaveStatus,
}: ResidentialModuleProps) {
  const t = TRANSLATIONS[language];
  const canApprove = ['super_admin', 'muhtamim', 'residential_supervisor'].includes(role);
  const residentialStudents = students.filter((s) => s.residentialStatus === 'residential');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentId, setStudentId] = useState(residentialStudents[0]?.id || students[0]?.id || '');
  const [reason, setReason] = useState('পারিবারিক প্রয়োজন ও চিকিৎসকের পরামর্শ গ্রহণ');
  const [departureDate, setDepartureDate] = useState('2026-10-23');
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-10-25');
  const [accompaniedBy, setAccompaniedBy] = useState('পিতা (Father)');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId);
    if (!stu || !reason.trim()) return;
    const saved = await onAddLeave({
      studentId: stu.id,
      studentNameBn: stu.nameBn,
      admissionNo: stu.admissionNo,
      dormitoryRoom: stu.dormitoryRoom,
      reason: reason.trim(),
      departureDate,
      expectedReturnDate,
      actualReturnDate: '',
      accompaniedBy: accompaniedBy.trim(),
      status: canApprove ? 'approved' : 'pending',
      guardianUid: stu.guardianUid,
    });
    if (saved) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.residential}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'ছাত্রাবাসের ভবন, কক্ষ ও সিট বণ্টন, ছুটির আবেদন অনুমোদন এবং প্রস্থান ও প্রত্যাবর্তন নিবন্ধন।'
              : 'Dormitory room and seat assignments, student gate pass approvals, and departure/return logs.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setStudentId(residentialStudents[0]?.id || students[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন গেট পাস / ছুটি এন্ট্রি' : 'New Leave / Gate Pass'}</span>
        </button>
      </div>

      {/* Dormitory Seat Overview */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-[#0B3B2E]" />
            <h2 className="text-base font-bold text-slate-900">
              আবাসিক ছাত্রদের কক্ষ ও সিট তালিকা ({residentialStudents.length} জন)
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 text-start">দাখেলা নং</th>
                <th className="py-3 px-4 text-start">শিক্ষার্থীর নাম ও জামাত</th>
                <th className="py-3 px-4 text-start">ভবন, কক্ষ ও সিট নম্বর</th>
                <th className="py-3 px-4 text-start">অভিভাবকের জরুরি যোগাযোগ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {residentialStudents.map((st) => (
                <tr key={st.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-4 font-mono tabular-nums text-xs font-semibold text-slate-900">
                    {st.admissionNo}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{st.nameBn}</div>
                    <div className="text-xs text-slate-500">{st.className}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-[#0B3B2E]">
                    {st.dormitoryRoom}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 font-mono tabular-nums">
                    {st.guardianName} · {st.guardianPhone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave & Gate Pass Records */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-bold text-slate-900">
            ছুটির আবেদন, প্রস্থান ও প্রত্যাবর্তন রেজিস্টার
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">শিক্ষার্থী ও কক্ষ</th>
                <th className="py-3.5 px-4 text-start">ছুটির কারণ ও সফরসঙ্গী</th>
                <th className="py-3.5 px-4 text-start">প্রস্থান ও সম্ভাব্য প্রত্যাবর্তন</th>
                <th className="py-3.5 px-4 text-start">অবস্থা</th>
                <th className="py-3.5 px-4 text-end">তত্ত্বাবধায়ক কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {leaves.map((lv) => (
                <tr key={lv.id} className="hover:bg-stone-50/70">
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-slate-900">{lv.studentNameBn}</div>
                    <div className="text-xs text-slate-500 font-mono">{lv.admissionNo}</div>
                    <div className="text-xs text-slate-600">{lv.dormitoryRoom}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="text-xs font-medium text-slate-900">{lv.reason}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      অভিভাবক/সঙ্গী: {lv.accompaniedBy}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top font-mono tabular-nums text-xs">
                    <div>প্রস্থান: {lv.departureDate}</div>
                    <div>ফেরার তারিখ: {lv.expectedReturnDate}</div>
                    {lv.actualReturnDate && (
                      <div className="text-emerald-800 font-semibold">
                        প্রত্যাবর্তন সম্পন্ন: {lv.actualReturnDate}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top text-xs font-semibold">
                    {lv.status === 'pending' && (
                      <span className="text-amber-800">অপেক্ষমাণ (Pending)</span>
                    )}
                    {lv.status === 'approved' && (
                      <span className="text-emerald-800">অনুমোদিত (Approved)</span>
                    )}
                    {lv.status === 'returned' && (
                      <span className="text-slate-700">মাদ্রাসায় প্রত্যাবর্তন (Returned)</span>
                    )}
                    {lv.status === 'rejected' && (
                      <span className="text-red-700">বাতিল (Rejected)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top text-end">
                    {canApprove && (
                      <div className="inline-flex items-center gap-1.5">
                        {lv.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onUpdateLeaveStatus(lv.id, 'approved', '')}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#0B3B2E] text-white rounded-md cursor-pointer"
                          >
                            অনুমোদন দিন
                          </button>
                        )}
                        {lv.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateLeaveStatus(lv.id, 'returned', '2026-10-24')
                            }
                            className="px-2.5 py-1 text-xs font-semibold bg-stone-800 text-white rounded-md cursor-pointer"
                          >
                            প্রত্যাবর্তন এন্ট্রি
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Leave Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-leave-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-leave-title" className="text-lg font-bold text-slate-900">
                আবাসিক ছুটি ও গেট পাস নিবন্ধন
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close leave modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="lv-student"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  শিক্ষার্থী নির্বাচন করুন *
                </label>
                <select
                  id="lv-student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameBn} ({s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="lv-reason"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  ছুটির কারণ *
                </label>
                <input
                  id="lv-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="lv-dep"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    প্রস্থানের তারিখ *
                  </label>
                  <input
                    id="lv-dep"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lv-ret"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    সম্ভাব্য প্রত্যাবর্তন *
                  </label>
                  <input
                    id="lv-ret"
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="lv-acc"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  যার সাথে প্রস্থান করবে (Accompanied By) *
                </label>
                <input
                  id="lv-acc"
                  type="text"
                  value={accompaniedBy}
                  onChange={(e) => setAccompaniedBy(e.target.value)}
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
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
