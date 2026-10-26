import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarPlus,
  FileCheck2,
  Megaphone,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  AttendanceRecord,
  BannerSlide,
  ExpenseRecord,
  FeeInvoice,
  HifzProgressLog,
  Language,
  ModuleId,
  Notice,
  ResidentialLeave,
  StaffMember,
  Student,
  UserRole,
} from '../../types/madrasa';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  canAccessModule,
  computeDepartmentChartMetrics,
  formatBdt,
  formatNum,
} from '../../utils/madrasaLogic';
import { WelcomeBannerCarousel } from '../InstitutionalCarousel';

interface DashboardOverviewProps {
  language: Language;
  role: UserRole;
  students: Student[];
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  expenses: ExpenseRecord[];
  hifzLogs: HifzProgressLog[];
  leaves: ResidentialLeave[];
  notices: Notice[];
  bannerSlides: BannerSlide[];
  onNavigate: (module: ModuleId) => void;
}

export function DashboardOverview({
  language,
  role,
  students,
  staff,
  attendance,
  invoices,
  hifzLogs,
  notices,
  bannerSlides,
  onNavigate,
}: DashboardOverviewProps) {
  const t = TRANSLATIONS[language];
  const [overviewPeriod, setOverviewPeriod] = useState<'year' | 'half' | 'quarter'>('year');
  const [showBannerCarousel, setShowBannerCarousel] = useState<boolean>(false);

  const activeStudents = students.filter((s) => s.status === 'active').length;
  const activeStaff = staff.filter((s) => s.status === 'active').length;
  const residentialCount = students.filter((s) => s.residentialStatus === 'residential').length;
  const dayScholarCount = Math.max(0, students.length - residentialCount);

  const residentialPct =
    students.length > 0 ? ((residentialCount / students.length) * 100).toFixed(1) : '0.0';
  const dayScholarPct =
    students.length > 0 ? ((dayScholarCount / students.length) * 100).toFixed(1) : '0.0';

  const departmentMetrics = computeDepartmentChartMetrics(students);
  const uniqueClassesCount = new Set(students.map((s) => s.className).filter(Boolean)).size;

  const latestDate =
    attendance.length > 0
      ? attendance.reduce((max, r) => (r.date > max ? r.date : max), attendance[0].date)
      : new Date().toISOString().slice(0, 10);
  const todaysAttendance = attendance.filter((a) => a.date === latestDate);
  const presentCount = todaysAttendance.filter((a) => a.status === 'present').length;
  const absentCount = todaysAttendance.filter((a) => a.status === 'absent').length;
  const lateOrLeaveCount = todaysAttendance.filter(
    (a) => a.status === 'late' || a.status === 'leave'
  ).length;
  const attendanceRate =
    todaysAttendance.length > 0
      ? Math.round(((presentCount + lateOrLeaveCount * 0.5) / todaysAttendance.length) * 100)
      : 0;

  const totalBilledBdt = invoices.reduce((sum, inv) => sum + inv.amountDueBdt, 0);
  const totalCollectedBdt = invoices.reduce((sum, inv) => sum + inv.amountPaidBdt, 0);
  const collectionPercent =
    totalBilledBdt > 0 ? Math.min(100, Math.round((totalCollectedBdt / totalBilledBdt) * 100)) : 0;

  const canConfigureSettings = ['super_admin', 'muhtamim'].includes(role);

  // Compute dynamic chart series from actual students & departments (no fabricated numbers)
  const hifzCount = students.filter((s) => s.department === 'hifz').length;
  const qawmiCount = students.filter((s) => s.department === 'qawmi').length;
  const generalCount = students.filter((s) => s.department === 'general').length;
  const totalCount = students.length;

  const computeChartY = (val: number, maxVal: number) => {
    const safeMax = Math.max(1, maxVal);
    return Math.round(165 - (Math.min(val, safeMax) / safeMax) * 130);
  };

  const maxChartVal = Math.max(10, totalCount);
  const chartSeries =
    overviewPeriod === 'year'
      ? [
          { month: language === 'bn' ? 'হিফয' : 'Hifz', value: hifzCount, y: computeChartY(hifzCount, maxChartVal) },
          { month: language === 'bn' ? 'কওমি' : 'Qawmi', value: qawmiCount, y: computeChartY(qawmiCount, maxChartVal) },
          { month: language === 'bn' ? 'জেনারেল' : 'General', value: generalCount, y: computeChartY(generalCount, maxChartVal) },
          { month: language === 'bn' ? 'আবাসিক' : 'Residential', value: residentialCount, y: computeChartY(residentialCount, maxChartVal) },
          { month: language === 'bn' ? 'সক্রিয়' : 'Active', value: activeStudents, y: computeChartY(activeStudents, maxChartVal) },
          { month: language === 'bn' ? 'মোট' : 'Total', value: totalCount, y: computeChartY(totalCount, maxChartVal) },
        ]
      : overviewPeriod === 'half'
        ? [
            { month: language === 'bn' ? 'উপস্থিত' : 'Present', value: presentCount, y: computeChartY(presentCount, maxChartVal) },
            { month: language === 'bn' ? 'বিলম্ব/ছুটি' : 'Leave', value: lateOrLeaveCount, y: computeChartY(lateOrLeaveCount, maxChartVal) },
            { month: language === 'bn' ? 'অনুপস্থিত' : 'Absent', value: absentCount, y: computeChartY(absentCount, maxChartVal) },
            { month: language === 'bn' ? 'অনাবাসিক' : 'Day', value: dayScholarCount, y: computeChartY(dayScholarCount, maxChartVal) },
            { month: language === 'bn' ? 'আবাসিক' : 'Hostel', value: residentialCount, y: computeChartY(residentialCount, maxChartVal) },
            { month: language === 'bn' ? 'মোট' : 'Total', value: totalCount, y: computeChartY(totalCount, maxChartVal) },
          ]
        : [
            { month: language === 'bn' ? 'হিফয' : 'Hifz', value: hifzCount, y: computeChartY(hifzCount, maxChartVal) },
            { month: language === 'bn' ? 'কওমি' : 'Qawmi', value: qawmiCount, y: computeChartY(qawmiCount, maxChartVal) },
            { month: language === 'bn' ? 'ক্যাডেট' : 'Cadet', value: generalCount, y: computeChartY(generalCount, maxChartVal) },
            { month: language === 'bn' ? 'আবাসিক' : 'Residential', value: residentialCount, y: computeChartY(residentialCount, maxChartVal) },
            { month: language === 'bn' ? 'সক্রিয়' : 'Active', value: activeStudents, y: computeChartY(activeStudents, maxChartVal) },
            { month: language === 'bn' ? 'মোট' : 'Total', value: totalCount, y: computeChartY(totalCount, maxChartVal) },
          ];

  const xPositions = [48, 118, 188, 258, 328, 398];
  const polylinePoints = chartSeries
    .map((pt, idx) => `${xPositions[idx]},${pt.y}`)
    .join(' ');
  const areaPoints = `${xPositions[0]},185 ${polylinePoints} ${xPositions[xPositions.length - 1]},185`;

  // Donut Chart geometry (circumference = 2 * pi * 54 ≈ 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const blueFraction = students.length > 0 ? residentialCount / students.length : 0;
  const blueDash = blueFraction * circumference;
  const pinkDash = Math.max(0, circumference - blueDash);

  // Attendance Ring geometry (circumference = 2 * pi * 46 ≈ 289.02)
  const attRadius = 46;
  const attCircumference = 2 * Math.PI * attRadius;
  const attDash = (Math.min(100, Math.max(0, attendanceRate)) / 100) * attCircumference;

  return (
    <div className="space-y-5">
      {/* Page Title & Breadcrumb Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {language === 'bn'
              ? 'ড্যাশবোর্ড'
              : language === 'ar'
                ? 'لوحة القيادة'
                : 'Dashboard'}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span>{language === 'bn' ? 'হোম' : language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-700 font-medium">
              {language === 'bn'
                ? 'ড্যাশবোর্ড'
                : language === 'ar'
                  ? 'لوحة القيادة'
                  : 'Dashboard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBannerCarousel((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-semibold text-[#008751] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {showBannerCarousel
                ? language === 'bn'
                  ? 'ব্যানার স্লাইডার লুকান'
                  : 'Hide Academic Banner'
                : language === 'bn'
                  ? 'প্রাতিষ্ঠানিক ঘোষণা স্লাইডার'
                  : 'Academic Banner Carousel'}
            </span>
          </button>
        </div>
      </div>

      {/* Production Empty State Banner when no student records exist */}
      {students.length === 0 && (
        <div
          data-testid="dashboard-production-empty-state"
          className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-emerald-950">
              {language === 'bn'
                ? 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা — প্রোডাকশন ডাটাবেসে এখনো কোনো শিক্ষার্থী নিবন্ধিত নেই'
                : 'Production Database Ready — No Student Records Enrolled Yet'}
            </h2>
            <p className="text-xs text-emerald-800">
              {language === 'bn'
                ? 'ভর্তি ও আবেদন (Admissions) অথবা শিক্ষার্থী ডিরেক্টরি থেকে নতুন শিক্ষার্থী যুক্ত করলে ড্যাশবোর্ডের সকল পরিসংখ্যান স্বয়ংক্রিয়ভাবে আপডেট হবে।'
                : 'Enroll students via Admissions or Student Directory to populate live institutional analytics.'}
            </p>
          </div>
          {canAccessModule(role, 'admissions') && (
            <button
              type="button"
              onClick={() => onNavigate('admissions')}
              className="px-4 py-2 rounded-xl bg-[#008751] hover:bg-emerald-800 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              {language === 'bn' ? 'নতুন ভর্তি ও আবেদন খুলুন' : 'Open Admissions'}
            </button>
          )}
        </div>
      )}

      {/* Optional Expandable Institutional Banner Carousel */}
      {showBannerCarousel && (
        <WelcomeBannerCarousel
          slides={bannerSlides}
          language={language}
          canConfigure={canConfigureSettings}
          onNavigate={onNavigate}
        />
      )}

      {/* Row 1: 4 Iconic KPI Cards (Exact match to reference layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Students */}
        <div
          onClick={() => canAccessModule(role, 'students') && onNavigate('students')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl bg-[#008751] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Users className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">
              {language === 'bn'
                ? 'মোট শিক্ষার্থী'
                : language === 'ar'
                  ? 'إجمالي الطلاب'
                  : 'Total Students'}
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums leading-tight mt-0.5">
              {formatNum(students.length, language)}
            </div>
            <div className="text-[11px] font-semibold text-[#008751] mt-0.5 flex items-center gap-1">
              <span>↑ {formatNum(activeStudents, language)}</span>
              <span>
                {language === 'bn'
                  ? 'জন সক্রিয় শিক্ষার্থী'
                  : language === 'ar'
                    ? 'طالب نشط هذا الشهر'
                    : 'active this month'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Teachers */}
        <div
          onClick={() => canAccessModule(role, 'staff') && onNavigate('staff')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl bg-[#0066CC] flex items-center justify-center text-white shrink-0 shadow-xs">
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
              <circle cx="11" cy="10" r="3.5" stroke="currentColor" strokeWidth="2.2" />
              <path
                d="M5 24C5 19.8 7.6 17.5 11 17.5C14.4 17.5 17 19.8 17 24"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <rect
                x="16"
                y="7"
                width="11"
                height="9"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M14 19L20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">
              {language === 'bn'
                ? 'মোট উস্তায ও স্টাফ'
                : language === 'ar'
                  ? 'إجمالي المعلمين'
                  : 'Total Teachers'}
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums leading-tight mt-0.5">
              {formatNum(staff.length, language)}
            </div>
            <div className="text-[11px] font-semibold text-[#008751] mt-0.5 flex items-center gap-1">
              <span>↑ {formatNum(activeStaff, language)}</span>
              <span>
                {language === 'bn'
                  ? 'জন কর্মরত উস্তায'
                  : language === 'ar'
                    ? 'معلم نشط هذا الشهر'
                    : 'active this month'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Classes & Hifz */}
        <div
          onClick={() => canAccessModule(role, 'hifz') && onNavigate('hifz')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-purple-300 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl bg-[#6B3FA0] flex items-center justify-center text-white shrink-0 shadow-xs">
            <BookOpen className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">
              {language === 'bn'
                ? 'মোট জামাত ও হিফয'
                : language === 'ar'
                  ? 'إجمالي الفصول والحلقات'
                  : 'Total Classes'}
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums leading-tight mt-0.5">
              {formatNum(uniqueClassesCount, language)}
            </div>
            <div className="text-[11px] font-semibold text-[#008751] mt-0.5 flex items-center gap-1">
              <span>↑ {formatNum(hifzLogs.length, language)}</span>
              <span>
                {language === 'bn'
                  ? 'টি হিফয সবক রেকর্ড'
                  : language === 'ar'
                    ? 'سجل حفظ هذا الشهر'
                    : 'Hifz logs this month'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Fees Collection */}
        <div
          onClick={() => canAccessModule(role, 'fees') && onNavigate('fees')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-amber-300 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl bg-[#F59E0B] flex items-center justify-center text-white shrink-0 shadow-xs">
            <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-base font-bold font-mono">
              ৳
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">
              {language === 'bn'
                ? 'মোট ফি আদায়'
                : language === 'ar'
                  ? 'إجمالي تحصيل الرسوم'
                  : 'Total Fees Collection'}
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums leading-tight mt-0.5 truncate">
              {formatBdt(totalCollectedBdt, language)}
            </div>
            <div className="text-[11px] font-semibold text-[#008751] mt-0.5 flex items-center gap-1">
              <span>↑ {formatNum(collectionPercent, language)}%</span>
              <span>
                {language === 'bn'
                  ? 'চলতি মাসে আদায়কৃত'
                  : language === 'ar'
                    ? 'تم تحصيله هذا الشهر'
                    : 'this month'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 3-Column Middle Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Col 1 (5 cols): Student Overview Line & Area Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {language === 'bn'
                  ? 'শিক্ষার্থী প্রবৃদ্ধি চিত্র'
                  : language === 'ar'
                    ? 'نظرة عامة على الطلاب'
                    : 'Student Overview'}
              </h2>
              <span className="text-xs text-slate-500">
                ({language === 'bn' ? 'চলতি শিক্ষাবর্ষ' : 'This Year'})
              </span>
            </div>

            <select
              aria-label="Select overview period"
              value={overviewPeriod}
              onChange={(e) =>
                setOverviewPeriod(e.target.value as 'year' | 'half' | 'quarter')
              }
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
            >
              <option value="year">
                {language === 'bn' ? 'এই বছর (This Year)' : 'This Year'}
              </option>
              <option value="half">
                {language === 'bn' ? 'গত ৬ মাস (6 Months)' : 'Last 6 Months'}
              </option>
              <option value="quarter">
                {language === 'bn' ? 'বিভাগভিত্তিক (By Dept)' : 'By Department'}
              </option>
            </select>
          </div>

          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 430 210" className="w-full h-auto select-none">
              <defs>
                <linearGradient id="studentAreaGrad" x1="0" y1="30" x2="0" y2="185" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#008751" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#008751" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Y-Axis Gridlines & Labels */}
              {[
                { label: '1500', y: 15 },
                { label: '1250', y: 43 },
                { label: '1000', y: 71 },
                { label: '750', y: 100 },
                { label: '500', y: 128 },
                { label: '250', y: 156 },
                { label: '0', y: 185 },
              ].map((row) => (
                <g key={row.label}>
                  <text
                    x="32"
                    y={row.y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-500 font-mono"
                  >
                    {formatNum(row.label, language)}
                  </text>
                  <line
                    x1="40"
                    y1={row.y}
                    x2="412"
                    y2={row.y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                </g>
              ))}

              {/* Vertical Subtle Gridlines */}
              {xPositions.map((xPos, idx) => (
                <line
                  key={idx}
                  x1={xPos}
                  y1="15"
                  x2={xPos}
                  y2="185"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
              ))}

              {/* Area Under Curve */}
              <polygon points={areaPoints} fill="url(#studentAreaGrad)" />

              {/* Smooth Line Path */}
              <polyline
                fill="none"
                stroke="#008751"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Data Points & X-Axis Labels */}
              {chartSeries.map((pt, idx) => (
                <g key={pt.month}>
                  <circle
                    cx={xPositions[idx]}
                    cy={pt.y}
                    r="3.8"
                    fill="#008751"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={xPositions[idx]}
                    y="202"
                    textAnchor="middle"
                    className="text-[10px] fill-slate-600 font-medium"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Col 2 (3.5 -> 3 cols on lg, 3 on xl): Student Ratio Donut Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              {language === 'bn'
                ? 'আবাসিক ও অনাবাসিক অনুপাত'
                : language === 'ar'
                  ? 'نسبة طلاب السكن الداخلي'
                  : 'Student Boarding Ratio'}
            </h2>
          </div>

          <div className="my-auto py-3 flex flex-col xl:flex-row items-center justify-center gap-4">
            {/* Multi-Segment SVG Donut Chart */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="18"
                />
                {/* Coral Pink Segment (Day Scholars / General) */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="18"
                  strokeDasharray={`${pinkDash} ${circumference}`}
                  strokeDashoffset={-blueDash}
                />
                {/* Vibrant Blue Segment (Residential / Cadet & Hifz) */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="18"
                  strokeDasharray={`${blueDash} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums leading-none">
                  {formatNum(students.length, language)}
                </span>
                <span className="text-[11px] font-medium text-slate-500 mt-1">
                  {language === 'bn' ? 'মোট ছাত্র' : 'Total'}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'আবাসিক (Residential)'
                      : language === 'ar'
                        ? 'سكن داخلي'
                        : 'Residential'}
                  </span>
                </div>
                <div className="ps-4.5 text-[11px] text-slate-600 font-mono tabular-nums mt-0.5">
                  {formatNum(residentialCount, language)} ({formatNum(residentialPct, language)}%)
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] inline-block shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'অনাবাসিক (Day)'
                      : language === 'ar'
                        ? 'خارجي'
                        : 'Day Care'}
                  </span>
                </div>
                <div className="ps-4.5 text-[11px] text-slate-600 font-mono tabular-nums mt-0.5">
                  {formatNum(dayScholarCount, language)} ({formatNum(dayScholarPct, language)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Department Sub-Summary Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            {departmentMetrics.map((m) => (
              <span key={m.department}>
                {m.department === 'hifz'
                  ? 'হিফয'
                  : m.department === 'qawmi'
                    ? 'কওমি'
                    : 'জেনারেল'}
                : {formatNum(m.count, language)}
              </span>
            ))}
          </div>
        </div>

        {/* Col 3 (4 cols): Recent Announcements */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#008751]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {language === 'bn'
                  ? 'সাম্প্রতিক নোটিশ ও ঘোষণা'
                  : language === 'ar'
                    ? 'الإعلانات الأخيرة'
                    : 'Recent Announcements'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-[#008751] hover:underline cursor-pointer whitespace-nowrap"
            >
              {language === 'bn' ? 'সব দেখুন' : language === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>

          {notices.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              {t.common.noRecordsFound}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 my-auto">
              {notices.slice(0, 4).map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => onNavigate('notices')}
                  className="py-2.5 flex items-start gap-3 hover:bg-slate-50/80 rounded-lg px-1.5 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#008751] shrink-0 mt-0.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-800 truncate">
                      {language === 'en' && notice.titleEn ? notice.titleEn : notice.titleBn}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                      {notice.publishDate} · {notice.targetClass}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: 3-Column Bottom Section (Recent Students, Today's Attendance, Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Col 1 (5 cols): Recent Students Table */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 pb-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              {language === 'bn'
                ? 'সাম্প্রতিক শিক্ষার্থী তালিকা'
                : language === 'ar'
                  ? 'الطلاب المسجلون حديثاً'
                  : 'Recent Students'}
            </h2>
            {canAccessModule(role, 'students') && (
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-[#008751] hover:underline cursor-pointer whitespace-nowrap"
              >
                {language === 'bn' ? 'সব দেখুন' : language === 'ar' ? 'عرض الكل' : 'View All'}
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              {t.common.noRecordsFound}
            </p>
          ) : (
            <div className="overflow-hidden my-auto">
              <table className="w-full text-start border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100 text-[11px] font-bold text-slate-700">
                    <th className="py-1.5 px-1.5 text-start w-6">#</th>
                    <th className="py-1.5 px-1.5 text-start w-[34%]">
                      {language === 'bn' ? 'নাম' : 'Name'}
                    </th>
                    <th className="py-1.5 px-1.5 text-start w-[24%]">
                      {language === 'bn' ? 'জামাত' : 'Class'}
                    </th>
                    <th className="py-1.5 px-1.5 text-start font-mono w-[24%]">
                      {language === 'bn' ? 'দাখেলা নং' : 'Admission No'}
                    </th>
                    <th className="py-1.5 px-1.5 text-end w-[14%]">
                      {language === 'bn' ? 'অবস্থা' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students.slice(0, 5).map((stu, idx) => (
                    <tr
                      key={stu.id}
                      onClick={() => canAccessModule(role, 'students') && onNavigate('students')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-1.5 px-1.5 font-mono text-slate-500">
                        {formatNum(idx + 1, language)}
                      </td>
                      <td className="py-1.5 px-1.5 font-semibold text-slate-800 truncate">
                        {language === 'en' && stu.nameEn ? stu.nameEn : stu.nameBn}
                      </td>
                      <td className="py-1.5 px-1.5 text-slate-600 truncate">
                        {stu.className}
                      </td>
                      <td className="py-1.5 px-1.5 font-mono tabular-nums text-[11px] text-slate-700 truncate">
                        {stu.admissionNo}
                      </td>
                      <td className="py-1.5 px-1.5 text-end font-semibold whitespace-nowrap">
                        <span
                          className={
                            stu.status === 'active'
                              ? 'text-[#008751]'
                              : 'text-amber-700'
                          }
                        >
                          {stu.status === 'active'
                            ? 'Active'
                            : stu.status === 'on_leave'
                              ? 'Leave'
                              : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Col 2 (3 cols): Today's Attendance Circular Gauge & Summary */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              {language === 'bn'
                ? 'আজকের হাজিরা'
                : language === 'ar'
                  ? 'حضور اليوم'
                  : "Today's Attendance"}
            </h2>
          </div>

          <div className="my-2 flex items-center justify-between gap-3">
            {/* Circular Green Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={attRadius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="10"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={attRadius}
                  fill="none"
                  stroke="#008751"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${attDash} ${attCircumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-none">
                  {formatNum(attendanceRate, language)}%
                </span>
                <span className="text-[10px] font-medium text-slate-600 mt-1">
                  {language === 'bn' ? 'উপস্থিত' : 'Present'}
                </span>
              </div>
            </div>

            {/* 4-Row Attendance Table */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">
                  {language === 'bn' ? 'মোট ছাত্র' : 'Total Students'}
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatNum(students.length, language)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">
                  {language === 'bn' ? 'উপস্থিত' : 'Present'}
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatNum(presentCount, language)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">
                  {language === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatNum(absentCount, language)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  {language === 'bn' ? 'ছুটি/বিলম্ব' : 'Leave'}
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatNum(lateOrLeaveCount, language)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="w-full py-1.5 px-4 text-xs font-semibold text-[#008751] bg-white hover:bg-emerald-50 border border-[#008751]/60 rounded-lg transition-colors cursor-pointer text-center"
          >
            {language === 'bn'
              ? 'হাজিরা প্রতিবেদন দেখুন'
              : language === 'ar'
                ? 'عرض تقرير الحضور'
                : 'View Attendance Report'}
          </button>
        </div>

        {/* Col 3 (4 cols): Quick Actions 2x4 Grid */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="pb-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              {language === 'bn'
                ? 'দ্রুত কার্যক্রম (Quick Actions)'
                : language === 'ar'
                  ? 'إجراءات سريعة'
                  : 'Quick Actions'}
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-2.5 my-auto">
            {/* Tile 1: Add Student */}
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer group"
            >
              <UserPlus className="w-6 h-6 text-[#008751] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#008751] text-center leading-tight">
                {language === 'bn' ? 'নতুন ছাত্র' : 'Add Student'}
              </span>
            </button>

            {/* Tile 2: Add Teacher */}
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 shadow-2xs transition-all cursor-pointer group"
            >
              <UserPlus className="w-6 h-6 text-[#0066CC] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#0066CC] text-center leading-tight">
                {language === 'bn' ? 'নতুন উস্তায' : 'Add Teacher'}
              </span>
            </button>

            {/* Tile 3: Take Attendance */}
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 shadow-2xs transition-all cursor-pointer group"
            >
              <CalendarCheck className="w-6 h-6 text-[#F59E0B] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#D97706] text-center leading-tight">
                {language === 'bn' ? 'হাজিরা নিন' : 'Take Attendance'}
              </span>
            </button>

            {/* Tile 4: Collect Fees */}
            <button
              type="button"
              onClick={() => onNavigate('fees')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full border-2 border-[#6B3FA0] flex items-center justify-center text-xs font-bold text-[#6B3FA0] group-hover:scale-105 transition-transform">
                ৳
              </div>
              <span className="text-[11px] font-semibold text-[#6B3FA0] text-center leading-tight">
                {language === 'bn' ? 'ফি আদায়' : 'Collect Fees'}
              </span>
            </button>

            {/* Tile 5: Hifz / Add Class */}
            <button
              type="button"
              onClick={() => onNavigate('hifz')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 shadow-2xs transition-all cursor-pointer group"
            >
              <BookOpen className="w-6 h-6 text-[#0066CC] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#0066CC] text-center leading-tight">
                {language === 'bn' ? 'হিফয সবক' : 'Hifz Class'}
              </span>
            </button>

            {/* Tile 6: Exam Results / Add Subject */}
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer group"
            >
              <FileCheck2 className="w-6 h-6 text-[#008751] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#008751] text-center leading-tight">
                {language === 'bn' ? 'পরীক্ষার ফল' : 'Exam Results'}
              </span>
            </button>

            {/* Tile 7: Add Event / Notice */}
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-300 shadow-2xs transition-all cursor-pointer group"
            >
              <CalendarPlus className="w-6 h-6 text-[#E11D48] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#E11D48] text-center leading-tight">
                {language === 'bn' ? 'নতুন ইভেন্ট' : 'Add Event'}
              </span>
            </button>

            {/* Tile 8: View Reports */}
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 shadow-2xs transition-all cursor-pointer group"
            >
              <BarChart3 className="w-6 h-6 text-[#6B3FA0] group-hover:scale-105 transition-transform" />
              <span className="text-[11px] font-semibold text-[#6B3FA0] text-center leading-tight">
                {language === 'bn' ? 'প্রতিবেদন' : 'View Reports'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
