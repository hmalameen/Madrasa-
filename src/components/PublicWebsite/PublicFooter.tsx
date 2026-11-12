import React from 'react';
import {
  ArrowRight,
  Clock,
  GraduationCap,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { InstitutionSettings, Language, WebsiteCmsConfig } from '../../types/madrasa';
import { InstitutionalCrest } from '../InstitutionalCrest';
import { PublicPagePath, PUBLIC_NAV_ITEMS } from './PublicNavbar';
import { getPublishedContactFooter } from '../../utils/websiteCmsLogic';

export interface PublicFooterProps {
  language: Language;
  settings: InstitutionSettings;
  cmsConfig?: WebsiteCmsConfig | null;
  isAuthenticated: boolean;
  onNavigatePage: (page: PublicPagePath) => void;
  onOpenLoginPortal: () => void;
  onOpenOnlineAdmission: () => void;
  onEnterManagementPortal: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  language,
  settings,
  cmsConfig,
  isAuthenticated,
  onNavigatePage,
  onOpenLoginPortal,
  onOpenOnlineAdmission,
  onEnterManagementPortal,
}) => {
  const isRtl = language === 'ar';
  const currentYear = new Date().getFullYear();
  const cmsContact = getPublishedContactFooter(cmsConfig, settings);

  const addressText =
    language === 'bn'
      ? cmsContact.addressBn || settings.addressBn || 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা ক্যাম্পাস, ঢাকা, বাংলাদেশ'
      : language === 'ar'
        ? cmsContact.addressAr || 'حرم مدرسة أم القرآن كاديت الإسلامية، بنغلاديش'
        : cmsContact.addressEn || 'Ummul Quran Cadet Madrasa Campus, Dhaka, Bangladesh';

  const footerNoteText =
    language === 'bn'
      ? cmsContact.footerDescriptionBn
      : language === 'ar'
        ? cmsContact.footerDescriptionAr || cmsContact.footerDescriptionEn
        : cmsContact.footerDescriptionEn;

  const officeHoursText =
    language === 'bn'
      ? cmsContact.officeHoursBn || 'শনিবার – বৃহস্পতিবার: সকাল ৮:০০ – বিকাল ৫:০০ (শুক্রবার সাপ্তাহিক ছুটি)'
      : language === 'ar'
        ? cmsContact.officeHoursAr || 'السبت – الخميس: ٨:٠٠ صباحاً – ٥:٠٠ مساءً (الجمعة عطلة أسبوعية)'
        : cmsContact.officeHoursEn || 'Saturday – Thursday: 8:00 AM – 5:00 PM (Friday Weekly Holiday)';

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="public-website-footer"
      className="relative bg-[#061326] text-[#F7F4EC] border-t border-[#D9B64C]/35 overflow-hidden uqcm-islamic-lattice"
    >
      {/* Top Champagne Gold Architectural Hairline */}
      <div className="uqcm-gold-hairline w-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-[#D9B64C]/20">
          {/* Column 1: Institutional Crest, Mission & Active Session (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-full bg-[#0A1B33]/80 p-1 shadow-[0_8px_24px_rgba(217,182,76,0.25)] ring-1 ring-[#D9B64C]/60 shrink-0 flex items-center justify-center">
                <InstitutionalCrest className="w-full h-full" />
              </div>
              <div>
                <p className="font-ar text-xs text-[#E8D58A] tracking-wide mb-0.5">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <h2 className="font-display-bn text-lg font-bold text-[#F7F4EC] tracking-tight">
                  {language === 'bn'
                    ? cmsContact.institutionNameBn || settings.institutionNameBn
                    : language === 'ar'
                      ? cmsContact.institutionNameAr || settings.institutionNameAr
                      : cmsContact.institutionNameEn || settings.institutionNameEn}
                </h2>
                <p className="text-xs text-[#E8D58A]/85">
                  {language === 'bn'
                    ? settings.institutionNameEn || 'Ummul Quran Cadet Madrasa'
                    : 'কুরআন, সুন্নাহ ও আধুনিক শিক্ষার সমন্বিত প্রতিষ্ঠান'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#9CA9B8] leading-relaxed">
              {footerNoteText ||
                (language === 'bn'
                  ? 'বিশুদ্ধ কুরআন তিলাওয়াত, হিফজুল কুরআন, কওমি-আলিয়া ও আধুনিক সাধারণ শিক্ষার সমন্বয়ে আদর্শ, চরিত্রবান ও যোগ্য প্রজন্ম গড়ে তোলার প্রত্যয়ে পরিচালিত একটি পূর্ণাঙ্গ ক্যাডেট মাদ্রাসা।'
                  : language === 'ar'
                    ? 'مؤسسة تعليمية إسلامية متكاملة تجمع بين تحفيظ القرآن الكريم والعلوم الشرعية والتعليم الأكاديمي الحديث لبناء جيل صالح ومتميز.'
                    : 'A premier integrated Islamic educational institution harmonizing Hifzul Quran, classical Islamic scholarship, and modern academic excellence within a disciplined cadet environment.')}
            </p>

            {/* Verified Academic Session & Hijri Year */}
            <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#E8D58A]/90">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#D9B64C]" />
                {language === 'bn'
                  ? `শিক্ষাবর্ষ: ${settings.academicYear || '২০২৬-২০২৭'}`
                  : language === 'ar'
                    ? `العام الدراسي: ${settings.academicYear || '2026-2027'}`
                    : `Academic Session: ${settings.academicYear || '2026-2027'}`}
              </span>
              {settings.hijriYear && (
                <>
                  <span className="text-[#D9B64C]/50">·</span>
                  <span className="text-[#9CA9B8] font-mono-num">{settings.hijriYear}</span>
                </>
              )}
            </div>
          </div>

          {/* Column 2: Quick Navigation Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8D58A] border-b border-[#D9B64C]/20 pb-2.5">
              {language === 'bn'
                ? 'প্রাতিষ্ঠানিক লিংকসমূহ'
                : language === 'ar'
                  ? 'روابط سريعة'
                  : 'Institutional Links'}
            </h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => onNavigatePage(item.path)}
                    data-testid={`footer-nav-link-${item.path === '/' ? 'home' : item.path.slice(1)}`}
                    className="group inline-flex items-center gap-1.5 text-xs text-[#F7F4EC]/80 hover:text-[#E8D58A] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#D9B64C]/60 group-hover:bg-[#E8D58A] transition-colors shrink-0" />
                    <span>
                      {language === 'bn'
                        ? item.labelBn
                        : language === 'ar'
                          ? item.labelAr
                          : item.labelEn}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Academic Streams Overview (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8D58A] border-b border-[#D9B64C]/20 pb-2.5">
              {language === 'bn'
                ? 'শিক্ষা বিভাগসমূহ'
                : language === 'ar'
                  ? 'الأقسام العلمية'
                  : 'Academic Streams'}
            </h3>
            <ul className="space-y-2.5 text-xs text-[#9CA9B8]">
              {[
                {
                  bn: 'নূরানী ও মক্তব বিভাগ',
                  en: 'Noorani & Maktab',
                  ar: 'القسم النوراني والتمهيدي',
                },
                {
                  bn: 'নাজেরা ও তাজবীদ বিভাগ',
                  en: 'Nazera & Tajweed',
                  ar: 'قسم الناظرة والتجويد',
                },
                {
                  bn: 'হিফজুল কুরআন বিভাগ',
                  en: 'Hifzul Quran Stream',
                  ar: 'قسم تحفيظ القرآن الكريم',
                },
                {
                  bn: 'কিতাব ও আলিয়া বিভাগ',
                  en: 'Kitab & Alia Studies',
                  ar: 'قسم العلوم الشرعية والعالية',
                },
                {
                  bn: 'ক্যাডেট ও জেনারেল শিক্ষা',
                  en: 'Cadet & General Stream',
                  ar: 'التعليم الأكاديمي العام',
                },
              ].map((dept, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('/departments')}
                    className="hover:text-[#E8D58A] transition-colors text-left cursor-pointer"
                  >
                    {language === 'bn' ? dept.bn : language === 'ar' ? dept.ar : dept.en}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Official Contact & Portal Access (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8D58A] border-b border-[#D9B64C]/20 pb-2.5">
              {language === 'bn'
                ? 'যোগাযোগ ও অনলাইন সেবা'
                : language === 'ar'
                  ? 'التواصل والخدمات الإلكترونية'
                  : 'Contact & Online Portal'}
            </h3>

            <div className="space-y-2.5 text-xs text-[#F7F4EC]/85">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D9B64C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="leading-relaxed block">{addressText}</span>
                  {cmsContact.mapLink &&
                    !cmsContact.mapLink.includes('Uttara+Dhaka') && (
                      <a
                        href={cmsContact.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="footer-map-link"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E8D58A] hover:underline"
                      >
                        <span>
                          {language === 'bn'
                            ? 'গুগল ম্যাপে দেখুন'
                            : language === 'ar'
                              ? 'عرض على خرائط جوجل'
                              : 'View on Google Maps'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D9B64C] shrink-0" />
                <span className="font-mono-num">
                  {cmsContact.phone || settings.phone || '+880 1711-984321'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D9B64C] shrink-0" />
                <span className="truncate">
                  {cmsContact.email || settings.email || 'office@ummulquranmadrasa.edu.bd'}
                </span>
              </div>
              {cmsContact.facebookUrl && cmsContact.facebookUrl.trim() !== '' && (
                <div className="flex items-center gap-2.5">
                  <ArrowRight className="w-4 h-4 text-[#D9B64C] shrink-0" />
                  <a
                    href={cmsContact.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="footer-facebook-link"
                    className="text-[#E8D58A] hover:underline font-semibold truncate"
                  >
                    {language === 'bn'
                      ? 'অফিশিয়াল ফেসবুক পেজ'
                      : language === 'ar'
                        ? 'صفحة فيسبوك الرسمية'
                        : 'Official Facebook Page'}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#D9B64C] shrink-0 mt-0.5" />
                <span className="text-[#9CA9B8]">{officeHoursText}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onOpenOnlineAdmission}
                data-testid="footer-admission-btn"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#087A59] hover:bg-[#064B3A] text-[#F7F4EC] border border-[#D9B64C]/40 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#E8D58A]" />
                <span>
                  {language === 'bn'
                    ? 'অনলাইন ভর্তি আবেদন'
                    : language === 'ar'
                      ? 'التقديم للقبول الإلكتروني'
                      : 'Apply for Admission'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={isAuthenticated ? onEnterManagementPortal : onOpenLoginPortal}
                data-testid="footer-portal-btn"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#0A1B33] hover:bg-[#11284A] text-[#E8D58A] border border-[#D9B64C]/35 transition-all cursor-pointer"
              >
                {isAuthenticated ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {language === 'bn'
                        ? 'ম্যানেজমেন্ট ড্যাশবোর্ড'
                        : language === 'ar'
                          ? 'لوحة التحكم الإدارية'
                          : 'Management Dashboard'}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#D9B64C]" />
                    <span>
                      {language === 'bn'
                        ? 'শিক্ষার্থী / অভিভাবক / স্টাফ পোর্টাল'
                        : language === 'ar'
                          ? 'بوابة الطلاب وأولياء الأمور والموظفين'
                          : 'Student / Guardian / Staff Portal'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Governance Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA9B8]">
          <p>
            © {currentYear}{' '}
            {language === 'bn'
              ? settings.institutionNameBn || 'উম্মুল কুরআন ক্যাডেট মাদ্রাসা'
              : settings.institutionNameEn || 'Ummul Quran Cadet Madrasa'}
            .{' '}
            {language === 'bn'
              ? 'সর্বস্বত্ব সংরক্ষিত।'
              : language === 'ar'
                ? 'جميع الحقوق محفوظة.'
                : 'All rights reserved.'}
          </p>
          <p className="text-[11px] text-[#E8D58A]/75">
            {language === 'bn'
              ? 'দ্বীনি আদব · একাডেমিক শ্রেষ্ঠত্ব · প্রাতিষ্ঠানিক স্বচ্ছতা'
              : language === 'ar'
                ? 'الأدب الإسلامي · التميز الأكاديمي · الشفافية المؤسسية'
                : 'Sacred Adab · Academic Excellence · Institutional Governance'}
          </p>
        </div>
      </div>
    </footer>
  );
};
