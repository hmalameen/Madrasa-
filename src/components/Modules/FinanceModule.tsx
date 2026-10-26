import React, { useState } from 'react';
import { CreditCard, FileText, Plus, Printer, Receipt, X } from 'lucide-react';
import type {
  ExpenseRecord,
  FeeInvoice,
  FeeType,
  Language,
  PaymentMethod,
  Student,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  calculateInvoiceStatus,
  formatBdt,
  validateInvoiceInput,
} from '../../utils/madrasaLogic';

interface FinanceModuleProps {
  language: Language;
  role: UserRole;
  students: Student[];
  invoices: FeeInvoice[];
  expenses: ExpenseRecord[];
  onAddInvoice: (invoice: Omit<FeeInvoice, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
}

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  monthly_tuition: 'মাসিক শিক্ষা বেতন (Tuition Fee)',
  boarding_mess: 'আবাসিক খোরাকি ও ছাত্রাবাস (Boarding & Mess)',
  admission_fee: 'ভর্তি ও সেশন ফি (Admission Fee)',
  exam_fee: 'পরীক্ষা ফি (Examination Fee)',
  generator_utility: 'বিদ্যুৎ ও জেনারেটর চার্জ (Utility)',
};

export function FinanceModule({
  language,
  role,
  students,
  invoices,
  expenses,
  onAddInvoice,
  onAddExpense,
}: FinanceModuleProps) {
  const t = TRANSLATIONS[language];
  const canManageFinance = ['super_admin', 'muhtamim', 'accountant'].includes(role);

  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState<FeeInvoice | null>(null);

  // Invoice form state
  const [receiptNo, setReceiptNo] = useState(`MR-2026-${1001 + invoices.length}`);
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [feeType, setFeeType] = useState<FeeType>('boarding_mess');
  const [billingMonth, setBillingMonth] = useState('অক্টোবর ২০২৬ (Oct 2026)');
  const [amountDueBdt, setAmountDueBdt] = useState(5500);
  const [amountPaidBdt, setAmountPaidBdt] = useState(5500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transactionRef, setTransactionRef] = useState('CASH-COUNTER-01');
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});

  // Expense form state
  const [voucherNo, setVoucherNo] = useState(`EXP-2026-${801 + expenses.length}`);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] =
    useState<ExpenseRecord['category']>('boarding_food');
  const [expenseAmount, setExpenseAmount] = useState(12000);
  const [expenseDate, setExpenseDate] = useState('2026-10-22');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const totalDue = invoices.reduce((sum, i) => sum + i.amountDueBdt, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amountPaidBdt, 0);
  const totalOutstanding = Math.max(0, totalDue - totalPaid);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountBdt, 0);

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId);
    const validation = validateInvoiceInput({
      receiptNo,
      studentId,
      amountDueBdt,
      amountPaidBdt,
      paymentMethod,
      transactionRef,
    });
    if (!validation.valid || !stu) {
      setInvoiceErrors(validation.errors);
      return;
    }

    const { status } = calculateInvoiceStatus(amountDueBdt, amountPaidBdt, paymentMethod);
    const saved = await onAddInvoice({
      receiptNo: receiptNo.trim(),
      studentId: stu.id,
      studentNameBn: stu.nameBn,
      admissionNo: stu.admissionNo,
      className: stu.className,
      feeType,
      billingMonth,
      amountDueBdt,
      amountPaidBdt: paymentMethod === 'unpaid' ? 0 : amountPaidBdt,
      paymentMethod,
      transactionRef: transactionRef.trim(),
      status,
      guardianUid: stu.guardianUid,
    });
    if (saved) {
      setIsInvoiceModalOpen(false);
      setInvoiceErrors({});
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) {
      setExpenseError(t.common.requiredFieldError);
      return;
    }
    const saved = await onAddExpense({
      voucherNo: voucherNo.trim(),
      title: expenseTitle.trim(),
      category: expenseCategory,
      amountBdt: expenseAmount,
      expenseDate,
      approvedBy: 'মুহতামিম / হিসাব শাখা',
      notes: expenseNotes.trim(),
    });
    if (saved) {
      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseNotes('');
      setExpenseError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.navModules.fees}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {language === 'bn'
              ? 'শিক্ষার্থীদের মাসিক বেতন, খোরাকি ইনভয়েস, যাচাইকৃত মানি রসিদ (bKash/Nagad/Cash) এবং মাদ্রাসার ব্যয় ভাউচার।'
              : 'Verified student fee invoices, official payment receipts, outstanding balances, and madrasa expense ledger.'}
          </p>
        </div>

        {canManageFinance && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setReceiptNo(`MR-2026-${1001 + invoices.length}`);
                setStudentId(students[0]?.id || '');
                setInvoiceErrors({});
                setIsInvoiceModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-[#0B3B2E] hover:bg-emerald-950 text-white rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন ফি রসিদ / ইনভয়েস' : 'Create Fee Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVoucherNo(`EXP-2026-${801 + expenses.length}`);
                setIsExpenseModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'ব্যয় ভাউচার এন্ট্রি' : 'Log Expense Voucher'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Finance Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">মোট ধার্যকৃত ফি (Total Billed)</div>
          <div className="mt-1 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatBdt(totalDue, language)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">যাচাইকৃত আদায় (Verified Paid)</div>
          <div className="mt-1 text-xl font-bold text-emerald-800 font-mono tabular-nums">
            {formatBdt(totalPaid, language)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">মোট বকেয়া (Outstanding Due)</div>
          <div className="mt-1 text-xl font-bold text-amber-800 font-mono tabular-nums">
            {formatBdt(totalOutstanding, language)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">মোট মাদ্রাসা ব্যয় (Total Expenses)</div>
          <div className="mt-1 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatBdt(totalExpenses, language)}
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          শিক্ষার্থী ফি ও রসিদ ({invoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          মাদ্রাসা ব্যয় খতিয়ান ({expenses.length})
        </button>
      </div>

      {activeTab === 'invoices' ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4 text-start">রসিদ নম্বর ও মাস</th>
                  <th className="py-3.5 px-4 text-start">শিক্ষার্থীর নাম ও দাখেলা</th>
                  <th className="py-3.5 px-4 text-start">ফি-এর ধরন ও মাধ্যম</th>
                  <th className="py-3.5 px-4 text-end font-mono">ধার্যকৃত</th>
                  <th className="py-3.5 px-4 text-end font-mono">পরিশোধিত</th>
                  <th className="py-3.5 px-4 text-end font-mono">বকেয়া</th>
                  <th className="py-3.5 px-4 text-end">রসিদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-sm">
                {invoices.map((inv) => {
                  const balance = Math.max(0, inv.amountDueBdt - inv.amountPaidBdt);
                  return (
                    <tr key={inv.id} className="hover:bg-stone-50/70">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                          {inv.receiptNo}
                        </div>
                        <div className="text-xs text-slate-500">{inv.billingMonth}</div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900">{inv.studentNameBn}</div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {inv.admissionNo} · {inv.className}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-xs font-medium text-slate-900">
                          {FEE_TYPE_LABELS[inv.feeType]}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          মাধ্যম: {inv.paymentMethod.toUpperCase()}{' '}
                          {inv.transactionRef ? `· Ref: ${inv.transactionRef}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums text-slate-700">
                        {formatBdt(inv.amountDueBdt, language)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums font-semibold text-emerald-800">
                        {formatBdt(inv.amountPaidBdt, language)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums font-semibold text-amber-800">
                        {formatBdt(balance, language)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-end">
                        <button
                          type="button"
                          onClick={() => setPrintingReceipt(inv)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0B3B2E] hover:bg-emerald-50 border border-stone-300 rounded-md inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>রসিদ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4 text-start">ভাউচার ও তারিখ</th>
                  <th className="py-3.5 px-4 text-start">ব্যয়ের বিবরণ ও খাত</th>
                  <th className="py-3.5 px-4 text-start">অনুমোদনকারী ও নোট</th>
                  <th className="py-3.5 px-4 text-end font-mono">পরিমাণ (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-sm">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4 align-top font-mono tabular-nums text-xs">
                      <div className="font-semibold text-slate-900">{exp.voucherNo}</div>
                      <div className="text-slate-500">{exp.expenseDate}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      <div className="text-xs text-slate-500">{exp.category}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top text-xs text-slate-600">
                      <div>অনুমোদন: {exp.approvedBy}</div>
                      <div className="text-slate-500">{exp.notes}</div>
                    </td>
                    <td className="py-3.5 px-4 align-top text-end font-mono tabular-nums font-bold text-slate-900">
                      {formatBdt(exp.amountBdt, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Verified Fee Invoice / Receipt Modal */}
      {isInvoiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-invoice-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="create-invoice-title" className="text-lg font-bold text-slate-900">
                শিক্ষার্থী ফি রসিদ ও যাচাইকৃত আদায় এন্ট্রি
              </h2>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                aria-label="Close invoice modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="inv-receipt"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মানি রসিদ নম্বর (Receipt No) *
                  </label>
                  <input
                    id="inv-receipt"
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                  {invoiceErrors.receiptNo && (
                    <p className="mt-1 text-xs text-red-600">{invoiceErrors.receiptNo}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="inv-month"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    মাসের নাম (Billing Month) *
                  </label>
                  <input
                    id="inv-month"
                    type="text"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inv-student"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  শিক্ষার্থী নির্বাচন করুন *
                </label>
                <select
                  id="inv-student"
                  value={studentId}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    setStudentId(e.target.value);
                    if (st) {
                      setAmountDueBdt(st.monthlyFeeBdt);
                      setAmountPaidBdt(st.monthlyFeeBdt);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameBn} ({s.admissionNo}) — মাসিক ফি ৳{s.monthlyFeeBdt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="inv-feetype"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ফি-এর খাত (Fee Type) *
                  </label>
                  <select
                    id="inv-feetype"
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value as FeeType)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="boarding_mess">আবাসিক খোরাকি ও ছাত্রাবাস</option>
                    <option value="monthly_tuition">মাসিক শিক্ষা বেতন</option>
                    <option value="admission_fee">ভর্তি ও সেশন ফি</option>
                    <option value="exam_fee">পরীক্ষা ফি</option>
                    <option value="generator_utility">বিদ্যুৎ ও জেনারেটর ফি</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="inv-method"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    পরিশোধের মাধ্যম (Method) *
                  </label>
                  <select
                    id="inv-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="cash">নগদ ক্যাশ (Cash Counter)</option>
                    <option value="bkash">বিকাশ মার্চেন্ট (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="bank_transfer">ইসলামী ব্যাংক ট্রান্সফার</option>
                    <option value="unpaid">অপরিশোধিত (Unpaid Invoice)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="inv-due"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ধার্যকৃত টাকা (Due) *
                  </label>
                  <input
                    id="inv-due"
                    type="number"
                    value={amountDueBdt}
                    onChange={(e) => setAmountDueBdt(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-paid"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    জমা টাকা (Paid) *
                  </label>
                  <input
                    id="inv-paid"
                    type="number"
                    disabled={paymentMethod === 'unpaid'}
                    value={paymentMethod === 'unpaid' ? 0 : amountPaidBdt}
                    onChange={(e) => setAmountPaidBdt(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                  {invoiceErrors.amountPaidBdt && (
                    <p className="mt-1 text-xs text-red-600">{invoiceErrors.amountPaidBdt}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="inv-ref"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ট্রানজেকশন / ভাউচার আইডি
                  </label>
                  <input
                    id="inv-ref"
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="TxID / Counter Ref"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                  {invoiceErrors.transactionRef && (
                    <p className="mt-1 text-xs text-red-600">{invoiceErrors.transactionRef}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0B3B2E] rounded-lg"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Official Receipt Modal */}
      {printingReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-stone-300 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center border-b border-stone-200 pb-4">
              <h3 className="text-base font-bold text-[#0B3B2E]">
                উম্মুল কুরআন ক্যাডেট মাদ্রাসা
              </h3>
              <p className="text-xs text-slate-500">আর্থিক আদায় রসিদ (Official Money Receipt)</p>
              <p className="mt-1 text-xs font-mono font-semibold text-slate-800">
                রসিদ নং: {printingReceipt.receiptNo}
              </p>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">শিক্ষার্থীর নাম:</dt>
                <dd className="font-bold text-slate-900">{printingReceipt.studentNameBn}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">দাখেলা ও জামাত:</dt>
                <dd className="font-mono text-slate-800">
                  {printingReceipt.admissionNo} ({printingReceipt.className})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">ফি-এর খাত ও মাস:</dt>
                <dd className="text-slate-800">
                  {FEE_TYPE_LABELS[printingReceipt.feeType]} — {printingReceipt.billingMonth}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">পরিশোধের মাধ্যম ও TxID:</dt>
                <dd className="font-mono text-slate-800">
                  {printingReceipt.paymentMethod.toUpperCase()} ({printingReceipt.transactionRef || 'N/A'})
                </dd>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold">
                <dt className="text-slate-900">পরিশোধিত টাকা:</dt>
                <dd className="font-mono text-emerald-900">
                  {formatBdt(printingReceipt.amountPaidBdt, language)}
                </dd>
              </div>
              <div className="flex justify-between text-xs">
                <dt className="text-slate-500">অবশিষ্ট বকেয়া:</dt>
                <dd className="font-mono text-amber-800">
                  {formatBdt(
                    Math.max(0, printingReceipt.amountDueBdt - printingReceipt.amountPaidBdt),
                    language
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-[#0B3B2E] text-white rounded-lg"
              >
                প্রিন্ট করুন (Print)
              </button>
              <button
                type="button"
                onClick={() => setPrintingReceipt(null)}
                className="px-4 py-2 text-xs font-medium bg-stone-100 text-slate-700 rounded-lg"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-expense-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 id="create-expense-title" className="text-lg font-bold text-slate-900">
                মাদ্রাসা ব্যয় ভাউচার এন্ট্রি
              </h2>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                aria-label="Close expense modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-4">
              {expenseError && (
                <div className="p-3 rounded-lg bg-red-50 text-xs text-red-800">{expenseError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="exp-voucher"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    ভাউচার নং *
                  </label>
                  <input
                    id="exp-voucher"
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="exp-date"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    তারিখ *
                  </label>
                  <input
                    id="exp-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="exp-title"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  ব্যয়ের বিবরণ (Expense Title) *
                </label>
                <input
                  id="exp-title"
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="যেমন: বোর্ডিং বাজার ও সবজি ক্রয়"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="exp-cat"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    খাত (Category)
                  </label>
                  <select
                    id="exp-cat"
                    value={expenseCategory}
                    onChange={(e) =>
                      setExpenseCategory(e.target.value as ExpenseRecord['category'])
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="boarding_food">ছাত্রাবাস খোরাকি (Boarding Food)</option>
                    <option value="utilities">বিদ্যুৎ ও গ্যাস (Utilities)</option>
                    <option value="maintenance">সংস্কার ও রক্ষণাবেক্ষণ</option>
                    <option value="stationery">দাপ্তরিক ও শিক্ষা উপকরণ</option>
                    <option value="events">মাহফিল ও অনুষ্ঠান</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="exp-amount"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    টাকার পরিমাণ (BDT) *
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="exp-notes"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  নোট / মন্তব্য
                </label>
                <input
                  id="exp-notes"
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
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
