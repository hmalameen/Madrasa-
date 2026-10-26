import React, { useState } from 'react';
import { Eye, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';
import type { Department, Language, Student, UserRole } from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  canReplaceApprovedStudentPhoto,
  formatBdt,
  validateStudentInput,
} from '../../utils/madrasaLogic';
import { ConfirmModal } from '../InstitutionalCrest';
import {
  StudentPhotoAvatar,
  StudentPhotoCropUploader,
} from '../StudentPhotoUploader';

interface StudentsModuleProps {
  language: Language;
  role: UserRole;
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateStudentStatus: (studentId: string, status: Student['status']) => Promise<boolean>;
  onUpdateStudentPhoto?: (studentId: string, photoUrl: string) => Promise<boolean>;
  onDeleteStudent: (studentId: string) => Promise<boolean>;
}

const INITIAL_FORM = {
  admissionNo: 'UQCM-2026-106',
  nameBn: '',
  nameEn: '',
  nameAr: '',
  department: 'hifz' as Department,
  className: 'হিফয শুনানি জামাত',
  rollNo: 4,
  dateOfBirth: '2014-05-10',
  bloodGroup: 'O+',
  admissionDate: '2026-10-22',
  guardianName: '',
  guardianPhone: '',
  guardianRelation: 'পিতা (Father)',
  guardianUid: 'demo-guardian-1',
  photoUrl: '',
  residentialStatus: 'residential' as 'residential' | 'day_scholar',
  dormitoryRoom: 'দারুল আরকাম ভবন - কক্ষ ২০২',
  monthlyFeeBdt: 5500,
  status: 'active' as Student['status'],
};

export function StudentsModule({
  language,
  role,
  students,
  onAddStudent,
  onUpdateStudentStatus,
  onUpdateStudentPhoto,
  onDeleteStudent,
}: StudentsModuleProps) {
  const t = TRANSLATIONS[language];
  const canMutate = ['super_admin', 'muhtamim', 'staff'].includes(role);
  const canReplacePhoto = canReplaceApprovedStudentPhoto(role);
  const canDelete = ['super_admin', 'muhtamim'].includes(role);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inspectingStudent, setInspectingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = students.filter((st) => {
    const matchesDept = selectedDept === 'all' || st.department === selectedDept;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      st.nameBn.toLowerCase().includes(q) ||
      st.nameEn.toLowerCase().includes(q) ||
      st.admissionNo.toLowerCase().includes(q) ||
      st.guardianPhone.toLowerCase().includes(q) ||
      st.className.toLowerCase().includes(q);
    return matchesDept && matchesQuery;
  });

  const handleOpenAddModal = () => {
    const nextNum = 101 + students.length;
    setFormState({
      ...INITIAL_FORM,
      admissionNo: `UQCM-2026-${nextNum}`,
      rollNo: students.length + 1,
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStudentInput(formState);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = await onAddStudent(formState);
      if (saved) {
        setIsAddModalOpen(false);
        setFormErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.students}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'দাখেলা নম্বর, বাংলা/ইংরেজি/আরবি নাম, বিভাগ, অভিভাবকের যোগাযোগ এবং ছাত্রাবাসের তথ্য ব্যবস্থাপনা।'
              : 'Manage student admissions, trilingual names, departments, guardian contacts, and boarding assignments.'}
          </p>
        </div>

        {canMutate && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {language === 'bn'
                ? 'নতুন শিক্ষার্থী ভর্তি করুন'
                : language === 'ar'
                  ? 'إضافة طالب جديد'
                  : 'Admit New Student'}
            </span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Interactive Department Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
          {(['all', 'hifz', 'qawmi', 'general'] as const).map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedDept === dept
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dept === 'all' ? t.common.allDepartments : t.departments[dept]}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            aria-label={t.common.searchPlaceholder}
            className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-stone-300 rounded-lg focus:outline-none focus:border-[#0B3B2E]"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">
                  {language === 'bn' ? 'দাখেলা ও রোল' : 'Admission & Roll'}
                </th>
                <th className="py-3.5 px-4 text-start">
                  {language === 'bn' ? 'শিক্ষার্থীর নাম (বাংলা / EN / AR)' : 'Student Name'}
                </th>
                <th className="py-3.5 px-4 text-start">
                  {language === 'bn' ? 'বিভাগ ও জামাত' : 'Department & Class'}
                </th>
                <th className="py-3.5 px-4 text-start">
                  {language === 'bn' ? 'অভিভাবক ও মোবাইল' : 'Guardian & Contact'}
                </th>
                <th className="py-3.5 px-4 text-end font-mono">
                  {language === 'bn' ? 'মাসিক ফি' : 'Monthly Fee'}
                </th>
                <th className="py-3.5 px-4 text-start">{t.common.status}</th>
                <th className="py-3.5 px-4 text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    {t.common.noRecordsFound}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {st.admissionNo}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                        রোল: #{st.rollNo} · {st.isDemoRecord ? t.common.demoTag : t.common.persistedTag}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <StudentPhotoAvatar
                          photoUrl={st.photoUrl}
                          nameBn={st.nameBn}
                          nameEn={st.nameEn}
                          department={st.department}
                          size="md"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{st.nameBn}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            <span>{st.nameEn}</span>
                            {st.nameAr && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span dir="rtl">{st.nameAr}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-xs font-semibold text-[#0B3B2E]">
                        {t.departments[st.department]}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">{st.className}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{st.dormitoryRoom}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-xs font-medium text-slate-900">{st.guardianName}</div>
                      <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-600">
                        {st.guardianPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums font-semibold text-slate-900">
                      {formatBdt(st.monthlyFeeBdt, language)}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      {canMutate ? (
                        <select
                          aria-label={`Status for ${st.nameEn}`}
                          value={st.status}
                          onChange={(e) =>
                            onUpdateStudentStatus(st.id, e.target.value as Student['status'])
                          }
                          className="text-xs bg-stone-100 border border-stone-300 rounded-md px-2 py-1 text-slate-800 font-medium"
                        >
                          <option value="active">সক্রিয় (Active)</option>
                          <option value="on_leave">ছুটিতে (On Leave)</option>
                          <option value="graduated">ফারেগ (Graduated)</option>
                          <option value="transferred">স্থানান্তরিত (Transferred)</option>
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-slate-700">{st.status}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingStudent(st)}
                          aria-label={`View profile of ${st.nameEn}`}
                          className="p-1.5 text-slate-600 hover:text-[#0B3B2E] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingStudentId(st.id)}
                            aria-label={`Delete ${st.nameEn}`}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-modal-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-2xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-student-modal-title" className="text-lg font-bold text-slate-900">
                {language === 'bn'
                  ? 'নতুন শিক্ষার্থী ভর্তি ফরম (Admission Form)'
                  : 'New Student Admission Form'}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              {Object.keys(formErrors).length > 0 && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
                >
                  {t.common.requiredFieldError}
                </div>
              )}

              <StudentPhotoCropUploader
                lang={language}
                value={formState.photoUrl}
                onChange={(newUrl) => setFormState({ ...formState, photoUrl: newUrl })}
                studentName={formState.nameEn || formState.nameBn}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="stu-admissionNo"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    দাখেলা নম্বর (Admission No) *
                  </label>
                  <input
                    id="stu-admissionNo"
                    type="text"
                    value={formState.admissionNo}
                    onChange={(e) =>
                      setFormState({ ...formState, admissionNo: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                  {formErrors.admissionNo && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.admissionNo}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-rollNo"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    রোল নম্বর (Roll No) *
                  </label>
                  <input
                    id="stu-rollNo"
                    type="number"
                    value={formState.rollNo}
                    onChange={(e) =>
                      setFormState({ ...formState, rollNo: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                  {formErrors.rollNo && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.rollNo}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-admissionDate"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ভর্তির তারিখ (Admission Date) *
                  </label>
                  <input
                    id="stu-admissionDate"
                    type="date"
                    value={formState.admissionDate}
                    onChange={(e) =>
                      setFormState({ ...formState, admissionDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="stu-nameBn"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    শিক্ষার্থীর নাম (বাংলা) *
                  </label>
                  <input
                    id="stu-nameBn"
                    type="text"
                    placeholder="যেমন: মুহাম্মাদ রাশেদুল ইসলাম"
                    value={formState.nameBn}
                    onChange={(e) => setFormState({ ...formState, nameBn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                  {formErrors.nameBn && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.nameBn}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-nameEn"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Student Name (English) *
                  </label>
                  <input
                    id="stu-nameEn"
                    type="text"
                    placeholder="e.g. Mohammad Rashedul Islam"
                    value={formState.nameEn}
                    onChange={(e) => setFormState({ ...formState, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                  {formErrors.nameEn && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.nameEn}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-nameAr"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    الاسم بالعربية (Arabic Name)
                  </label>
                  <input
                    id="stu-nameAr"
                    type="text"
                    dir="rtl"
                    placeholder="محمد راشد الإسلام"
                    value={formState.nameAr}
                    onChange={(e) => setFormState({ ...formState, nameAr: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="stu-department"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    বিভাগ (Department) *
                  </label>
                  <select
                    id="stu-department"
                    value={formState.department}
                    onChange={(e) =>
                      setFormState({ ...formState, department: e.target.value as Department })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="hifz">হিফযুল কুরআন বিভাগ</option>
                    <option value="qawmi">কওমি কিতাব বিভাগ</option>
                    <option value="general">জেনারেল ও ক্যাডেট বিভাগ</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stu-className"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    জামাত / শ্রেণি (Class) *
                  </label>
                  <input
                    id="stu-className"
                    type="text"
                    value={formState.className}
                    onChange={(e) => setFormState({ ...formState, className: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                  {formErrors.className && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.className}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-monthlyFee"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মাসিক নির্ধারিত ফি (BDT ৳) *
                  </label>
                  <input
                    id="stu-monthlyFee"
                    type="number"
                    value={formState.monthlyFeeBdt}
                    onChange={(e) =>
                      setFormState({ ...formState, monthlyFeeBdt: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="stu-guardianName"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    অভিভাবকের নাম (Guardian Name) *
                  </label>
                  <input
                    id="stu-guardianName"
                    type="text"
                    placeholder="পিতা / অভিভাবকের নাম"
                    value={formState.guardianName}
                    onChange={(e) =>
                      setFormState({ ...formState, guardianName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                  {formErrors.guardianName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.guardianName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-guardianPhone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    অভিভাবকের মোবাইল (Guardian Phone) *
                  </label>
                  <input
                    id="stu-guardianPhone"
                    type="tel"
                    placeholder="017XX-XXXXXX"
                    value={formState.guardianPhone}
                    onChange={(e) =>
                      setFormState({ ...formState, guardianPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                  {formErrors.guardianPhone && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.guardianPhone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="stu-dormitory"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ছাত্রাবাস কক্ষ / সিট (Dormitory)
                  </label>
                  <input
                    id="stu-dormitory"
                    type="text"
                    value={formState.dormitoryRoom}
                    onChange={(e) =>
                      setFormState({ ...formState, dormitoryRoom: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B3B2E] hover:bg-emerald-950 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? t.syncingText : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Details Modal */}
      {inspectingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-profile-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3.5">
                <StudentPhotoAvatar
                  photoUrl={inspectingStudent.photoUrl}
                  nameBn={inspectingStudent.nameBn}
                  nameEn={inspectingStudent.nameEn}
                  department={inspectingStudent.department}
                  size="lg"
                />
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    {inspectingStudent.admissionNo} · রোল #{inspectingStudent.rollNo}
                  </div>
                  <h3 id="student-profile-title" className="mt-1 text-lg font-bold text-slate-900">
                    {inspectingStudent.nameBn}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {inspectingStudent.nameEn}{' '}
                    {inspectingStudent.nameAr ? `· ${inspectingStudent.nameAr}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                aria-label="Close profile dialog"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {canReplacePhoto && onUpdateStudentPhoto && (
              <div className="mt-4">
                <StudentPhotoCropUploader
                  lang={language}
                  value={inspectingStudent.photoUrl || ''}
                  studentName={inspectingStudent.nameEn || inspectingStudent.nameBn}
                  compact
                  onChange={async (newUrl) => {
                    const updated = await onUpdateStudentPhoto(inspectingStudent.id, newUrl);
                    if (updated) {
                      setInspectingStudent({
                        ...inspectingStudent,
                        photoUrl: newUrl,
                      });
                    }
                  }}
                />
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500">বিভাগ (Department)</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {t.departments[inspectingStudent.department]}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">জামাত / শ্রেণি (Class)</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {inspectingStudent.className}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">জন্ম তারিখ ও রক্তের গ্রুপ</dt>
                <dd className="mt-0.5 font-mono text-slate-900">
                  {inspectingStudent.dateOfBirth} · {inspectingStudent.bloodGroup}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">ভর্তির তারিখ</dt>
                <dd className="mt-0.5 font-mono text-slate-900">
                  {inspectingStudent.admissionDate}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">অভিভাবকের নাম ও সম্পর্ক</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {inspectingStudent.guardianName} ({inspectingStudent.guardianRelation})
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">অভিভাবকের মোবাইল</dt>
                <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                  {inspectingStudent.guardianPhone}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">আবাসিক তথ্য (Dormitory & Seat)</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {inspectingStudent.dormitoryRoom}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">মাসিক নির্ধারিত ফি</dt>
                <dd className="mt-0.5 font-mono font-bold text-[#0B3B2E]">
                  {formatBdt(inspectingStudent.monthlyFeeBdt, language)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">বর্তমান অবস্থা</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{inspectingStudent.status}</dd>
              </div>
            </dl>

            <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#0B3B2E] text-white rounded-lg"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingStudentId)}
        title="শিক্ষার্থীর রেকর্ড মুছে ফেলবেন?"
        message="আপনি কি নিশ্চিত যে এই শিক্ষার্থীর ভর্তি রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।"
        confirmLabel={t.common.confirmDelete}
        cancelLabel={t.common.cancel}
        onCancel={() => setDeletingStudentId(null)}
        onConfirm={async () => {
          if (deletingStudentId) {
            await onDeleteStudent(deletingStudentId);
            setDeletingStudentId(null);
          }
        }}
      />
    </div>
  );
}
