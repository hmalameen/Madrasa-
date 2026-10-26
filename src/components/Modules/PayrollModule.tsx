import React, { useState } from 'react';
import { CheckCircle2, Lock, Plus, X } from 'lucide-react';
import type { Language, PayrollRecord, StaffMember, UserRole } from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import { calculateNetSalary, formatBdt } from '../../utils/madrasaLogic';

interface PayrollModuleProps {
  language: Language;
  role: UserRole;
  staff: StaffMember[];
  payroll: PayrollRecord[];
  onAddPayroll: (record: Omit<PayrollRecord, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onMarkPayrollPaid: (payrollId: string, paymentDate: string) => Promise<boolean>;
}

export function PayrollModule({
  language,
  role,
  staff,
  payroll,
  onAddPayroll,
  onMarkPayrollPaid,
}: PayrollModuleProps) {
  const t = TRANSLATIONS[language];
  const isAuthorized = ['super_admin', 'muhtamim', 'accountant'].includes(role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || '');
  const [salaryMonth, setSalaryMonth] = useState('অক্টোবর ২০২৬ (Oct 2026)');
  const [deductionsBdt, setDeductionsBdt] = useState(0);

  if (!isAuthorized) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
        <Lock className="w-8 h-8 text-red-700 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">সংরক্ষিত বেতন ও পে-রোল বিভাগ</h2>
        <p className="mt-1 text-xs text-slate-600">
          শুধুমাত্র সুপার অ্যাডমিন, মুহতামিম এবং প্রধান হিসাবরক্ষক এই বিভাগের তথ্য দেখার অনুমতিপ্রাপ্ত।
        </p>
      </div>
    );
  }

  const totalDisbursed = payroll
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.netPayableBdt, 0);
  const totalPending = payroll
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.netPayableBdt, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = staff.find((s) => s.id === selectedStaffId);
    if (!member) return;
    const allowances = member.houseAllowanceBdt + member.medicalAllowanceBdt;
    const netPayable = calculateNetSalary(member.basicSalaryBdt, allowances, deductionsBdt);
    const saved = await onAddPayroll({
      staffId: member.id,
      staffNameBn: member.nameBn,
      employeeCode: member.employeeCode,
      designation: member.designation,
      salaryMonth,
      basicSalaryBdt: member.basicSalaryBdt,
      allowancesBdt: allowances,
      deductionsBdt,
      netPayableBdt: netPayable,
      status: 'paid',
      paymentDate: '2026-10-22',
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
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.payroll}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'উস্তায ও স্টাফদের মূল বেতন, আবাসন ও চিকিৎসা ভাতা, কর্তন এবং মাসিক বেতন পরিশোধ রেজিস্টার।'
              : 'Restricted payroll ledger: basic salary, house & medical allowances, deductions, and disbursement status.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedStaffId(staff[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন বেতন শিট তৈরি করুন' : 'Generate Salary Slip'}</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">পরিশোধিত বেতন (Paid Salaries)</div>
          <div className="mt-1 text-xl font-bold text-emerald-900 font-mono tabular-nums">
            {formatBdt(totalDisbursed, language)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">অপেক্ষমাণ বেতন (Pending Disbursement)</div>
          <div className="mt-1 text-xl font-bold text-amber-800 font-mono tabular-nums">
            {formatBdt(totalPending, language)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">মোট বেতন রসিদ সংখ্যা</div>
          <div className="mt-1 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {payroll.length}
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 text-start">আইডি ও মাস</th>
                <th className="py-3.5 px-4 text-start">উস্তায / স্টাফের নাম ও পদবি</th>
                <th className="py-3.5 px-4 text-end font-mono">মূল বেতন</th>
                <th className="py-3.5 px-4 text-end font-mono">ভাতা (+)</th>
                <th className="py-3.5 px-4 text-end font-mono">কর্তন (-)</th>
                <th className="py-3.5 px-4 text-end font-mono">নিট প্রদেয়</th>
                <th className="py-3.5 px-4 text-end">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {payroll.map((pr) => (
                <tr key={pr.id} className="hover:bg-stone-50/70">
                  <td className="py-3.5 px-4 align-top font-mono tabular-nums text-xs">
                    <div className="font-semibold text-slate-900">{pr.employeeCode}</div>
                    <div className="text-slate-500">{pr.salaryMonth}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-slate-900">{pr.staffNameBn}</div>
                    <div className="text-xs text-slate-500">{pr.designation}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums text-slate-700">
                    {formatBdt(pr.basicSalaryBdt, language)}
                  </td>
                  <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums text-emerald-800">
                    {formatBdt(pr.allowancesBdt, language)}
                  </td>
                  <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums text-red-700">
                    {formatBdt(pr.deductionsBdt, language)}
                  </td>
                  <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums font-bold text-slate-900">
                    {formatBdt(pr.netPayableBdt, language)}
                  </td>
                  <td className="py-3.5 px-4 align-top text-end">
                    {pr.status === 'paid' ? (
                      <div className="text-xs font-semibold text-emerald-800 font-mono">
                        পরিশোধিত ({pr.paymentDate})
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkPayrollPaid(pr.id, '2026-10-22')}
                        className="px-3 py-1 text-xs font-semibold bg-[#0B3B2E] text-white rounded-md inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>পরিশোধ নিশ্চিত করুন</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payroll Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-payroll-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="add-payroll-title" className="text-lg font-bold text-slate-900">
                মাসিক বেতন পরিশোধ এন্ট্রি
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close payroll modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="pay-staff"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  উস্তায / স্টাফ নির্বাচন করুন *
                </label>
                <select
                  id="pay-staff"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameBn} ({s.employeeCode}) — মূল বেতন ৳{s.basicSalaryBdt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="pay-month"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  বেতনের মাস (Salary Month) *
                </label>
                <input
                  id="pay-month"
                  type="text"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="pay-deduct"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  অগ্রিম / কর্তন (Deductions BDT)
                </label>
                <input
                  id="pay-deduct"
                  type="number"
                  value={deductionsBdt}
                  onChange={(e) => setDeductionsBdt(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
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
