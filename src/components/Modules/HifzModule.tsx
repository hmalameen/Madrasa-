import React, { useState } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import type {
  HifzProgressLog,
  Language,
  Student,
  TajweedRating,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';

interface HifzModuleProps {
  language: Language;
  role: UserRole;
  students: Student[];
  hifzLogs: HifzProgressLog[];
  onAddHifzLog: (log: Omit<HifzProgressLog, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
}

const TAJWEED_LABELS: Record<TajweedRating, string> = {
  mumtaz: 'মুমতায — অত্যন্ত বিশুদ্ধ তাজবীদ (Mumtaz)',
  jayyid_jiddan: 'জায়্যিদ জিদ্দান — উত্তম (Jayyid Jiddan)',
  jayyid: 'জায়্যিদ — সন্তোষজনক (Jayyid)',
  needs_revision: 'পুনরায় ইয়াদ ও মাশক প্রয়োজন (Needs Revision)',
};

export function HifzModule({
  language,
  role,
  students,
  hifzLogs,
  onAddHifzLog,
}: HifzModuleProps) {
  const t = TRANSLATIONS[language];
  const canRecord = ['super_admin', 'muhtamim', 'teacher'].includes(role);
  const hifzStudents = students.filter((s) => s.department === 'hifz');
  const selectableStudents = hifzStudents.length > 0 ? hifzStudents : students;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState('2026-10-22');
  const [studentId, setStudentId] = useState(selectableStudents[0]?.id || '');
  const [paraNumber, setParaNumber] = useState(29);
  const [sabaqSurahAndAyat, setSabaqSurahAndAyat] = useState('সূরা আল-ইনসান (আয়াত ১–৩১)');
  const [sabaqLines, setSabaqLines] = useState(18);
  const [sabqiPara, setSabqiPara] = useState('২৮ তম পারা পূর্ণ');
  const [manzilPara, setManzilPara] = useState('২৪ তম পারা (আসর হালকা)');
  const [tajweedRating, setTajweedRating] = useState<TajweedRating>('mumtaz');
  const [teacherComment, setTeacherComment] = useState(
    'মাখরাজ ও সিফাত সুন্দর ছিল, আগামীকাল পরবর্তী সূরা শুরু হবে।'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId);
    if (!stu || !sabaqSurahAndAyat.trim()) return;
    const saved = await onAddHifzLog({
      date,
      studentId: stu.id,
      studentNameBn: stu.nameBn,
      admissionNo: stu.admissionNo,
      paraNumber,
      sabaqSurahAndAyat: sabaqSurahAndAyat.trim(),
      sabaqLines,
      sabqiPara: sabqiPara.trim(),
      manzilPara: manzilPara.trim(),
      tajweedRating,
      teacherComment: teacherComment.trim(),
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
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.hifz}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'হিফযুল কুরআন বিভাগের ছাত্রদের দৈনিক সবক (নতুন মুখস্থ), সবকি (সাত সবক), মনযিল (আমুখতা) এবং তাজবীদ মূল্যায়ন ডায়েরি।'
              : 'Daily Hifz-ul-Quran tracking for Sabaq (new lesson), Sabqi (recent para), Manzil (revision), and Ustadh comments.'}
          </p>
        </div>

        {canRecord && (
          <button
            type="button"
            onClick={() => {
              setStudentId(selectableStudents[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {language === 'bn' ? 'দৈনিক সবক ও মনযিল এন্ট্রি করুন' : 'Record Daily Sabaq'}
            </span>
          </button>
        )}
      </div>

      {/* Hifz Logs List */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">তারিখ ও দাখেলা</th>
                <th className="py-3.5 px-4 text-start">হাফেজ শিক্ষার্থীর নাম ও পারা</th>
                <th className="py-3.5 px-4 text-start">সবক (Sabaq)</th>
                <th className="py-3.5 px-4 text-start">সবকি (Sabqi) ও মনযিল (Manzil)</th>
                <th className="py-3.5 px-4 text-start">তাজবীদ মান ও উস্তাযের মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {hifzLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/70">
                  <td className="py-3.5 px-4 align-top font-mono tabular-nums text-xs">
                    <div className="font-semibold text-slate-900">{log.date}</div>
                    <div className="text-slate-500">{log.admissionNo}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-slate-900">{log.studentNameBn}</div>
                    <div className="text-xs font-semibold text-[#0B3B2E] font-mono tabular-nums">
                      চলমান পারা: {log.paraNumber} / ৩০
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-900">{log.sabaqSurahAndAyat}</div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      পৃষ্ঠা/লাইন: {log.sabaqLines} লাইন
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-xs text-slate-700">
                    <div>
                      <strong>সবকি:</strong> {log.sabqiPara}
                    </div>
                    <div className="mt-0.5">
                      <strong>মনযিল:</strong> {log.manzilPara}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="text-xs font-semibold text-emerald-900">
                      {TAJWEED_LABELS[log.tajweedRating]}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">{log.teacherComment}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hifz Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-hifz-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-hifz-title" className="text-lg font-bold text-slate-900">
                হিফযুল কুরআন সবক, সবকি ও মনযিল এন্ট্রি
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close Hifz modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="hfz-date"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    তারিখ *
                  </label>
                  <input
                    id="hfz-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hfz-para"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    চলমান পারা নম্বর (1–30) *
                  </label>
                  <input
                    id="hfz-para"
                    type="number"
                    min={1}
                    max={30}
                    value={paraNumber}
                    onChange={(e) => setParaNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="hfz-student"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  শিক্ষার্থী নির্বাচন করুন *
                </label>
                <select
                  id="hfz-student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {selectableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameBn} ({s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label
                    htmlFor="hfz-sabaq"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    আজকের সবক (সূরা ও আয়াত) *
                  </label>
                  <input
                    id="hfz-sabaq"
                    type="text"
                    value={sabaqSurahAndAyat}
                    onChange={(e) => setSabaqSurahAndAyat(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hfz-lines"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মোট লাইন *
                  </label>
                  <input
                    id="hfz-lines"
                    type="number"
                    value={sabaqLines}
                    onChange={(e) => setSabaqLines(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="hfz-sabqi"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    সবকি (Sabqi)
                  </label>
                  <input
                    id="hfz-sabqi"
                    type="text"
                    value={sabqiPara}
                    onChange={(e) => setSabqiPara(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hfz-manzil"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মনযিল / আমুখতা (Manzil)
                  </label>
                  <input
                    id="hfz-manzil"
                    type="text"
                    value={manzilPara}
                    onChange={(e) => setManzilPara(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="hfz-rating"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  তাজবীদ ও ইয়াদ মূল্যায়ন (Rating)
                </label>
                <select
                  id="hfz-rating"
                  value={tajweedRating}
                  onChange={(e) => setTajweedRating(e.target.value as TajweedRating)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  <option value="mumtaz">মুমতায (Mumtaz)</option>
                  <option value="jayyid_jiddan">জায়্যিদ জিদ্দান (Jayyid Jiddan)</option>
                  <option value="jayyid">জায়্যিদ (Jayyid)</option>
                  <option value="needs_revision">পুনরায় মাশক প্রয়োজন (Needs Revision)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="hfz-comment"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  উস্তাযের মন্তব্য ও দিকনির্দেশনা
                </label>
                <input
                  id="hfz-comment"
                  type="text"
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
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
