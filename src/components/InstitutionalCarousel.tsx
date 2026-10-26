import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Pause,
  Play,
  Settings,
} from 'lucide-react';
import type { BannerSlide, Language, ModuleId, Notice } from '../types/madrasa';
import { getNextSlideIndex, getPrevSlideIndex } from '../utils/madrasaLogic';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

interface WelcomeBannerCarouselProps {
  slides: BannerSlide[];
  language: Language;
  canConfigure?: boolean;
  onNavigate: (module: ModuleId) => void;
}

export function WelcomeBannerCarousel({
  slides,
  language,
  canConfigure = false,
  onNavigate,
}: WelcomeBannerCarouselProps) {
  const activeSlides = slides.filter((s) => s.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHoveredOrFocused, setIsHoveredOrFocused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const isRtl = language === 'ar';

  const safeIndex = activeSlides.length > 0 ? currentIndex % activeSlides.length : 0;
  const currentSlide = activeSlides[safeIndex];

  useEffect(() => {
    if (
      !isAutoPlaying ||
      isHoveredOrFocused ||
      prefersReducedMotion ||
      activeSlides.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => getNextSlideIndex(prev, activeSlides.length));
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, isHoveredOrFocused, prefersReducedMotion, activeSlides.length]);

  if (activeSlides.length === 0 || !currentSlide) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prev) => getNextSlideIndex(prev, activeSlides.length));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => getPrevSlideIndex(prev, activeSlides.length));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    if (Math.abs(deltaX) > 42) {
      if (deltaX < 0) {
        isRtl ? handlePrev() : handleNext();
      } else {
        isRtl ? handleNext() : handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const badgeText =
    language === 'ar'
      ? currentSlide.badgeAr
      : language === 'en'
        ? currentSlide.badgeEn
        : currentSlide.badgeBn;

  const titleText =
    language === 'ar'
      ? currentSlide.titleAr
      : language === 'en'
        ? currentSlide.titleEn
        : currentSlide.titleBn;

  const descriptionText =
    language === 'ar'
      ? currentSlide.descriptionAr
      : language === 'en'
        ? currentSlide.descriptionEn
        : currentSlide.descriptionBn;

  const ctaLabel =
    language === 'ar'
      ? currentSlide.ctaLabelAr
      : language === 'en'
        ? currentSlide.ctaLabelEn
        : currentSlide.ctaLabelBn;

  const isIvory = currentSlide.theme === 'ivory';
  const isNavy = currentSlide.theme === 'navy';

  const containerThemeClasses = isIvory
    ? 'bg-[#FAF8F5] text-slate-900 border-stone-300'
    : isNavy
      ? 'bg-[#111C33] text-white border-slate-800'
      : 'bg-[#0B3B2E] text-white border-emerald-900';

  return (
    <section
      aria-roledescription="carousel"
      aria-label={
        language === 'bn'
          ? 'প্রাতিষ্ঠানিক ঘোষণা ও একাডেমিক সময়সূচি স্লাইডার'
          : language === 'ar'
            ? 'عرض الإعلانات الأكاديمية والفعاليات'
            : 'Institutional Announcements & Academic Schedule Carousel'
      }
      onMouseEnter={() => setIsHoveredOrFocused(true)}
      onMouseLeave={() => setIsHoveredOrFocused(false)}
      onFocusCapture={() => setIsHoveredOrFocused(true)}
      onBlurCapture={() => setIsHoveredOrFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-hidden rounded-xl border transition-colors duration-300 ${containerThemeClasses}`}
    >
      {/* Subtle Architectural Islamic Geometric Star Watermark */}
      <svg
        aria-hidden="true"
        viewBox="0 0 240 240"
        className={`pointer-events-none absolute -end-10 -bottom-12 w-64 h-64 ${
          isIvory ? 'text-stone-300/45' : 'text-[#D4AF37]/10'
        }`}
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.25">
          <polygon points="120,12 148,92 228,120 148,148 120,228 92,148 12,120 92,92" />
          <polygon
            points="120,12 148,92 228,120 148,148 120,228 92,148 12,120 92,92"
            transform="rotate(45 120 120)"
          />
          <circle cx="120" cy="120" r="56" />
          <circle cx="120" cy="120" r="88" strokeDasharray="4 4" />
        </g>
      </svg>

      <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col justify-between min-h-[215px]">
        {/* Top Row: Category Metadata & Slide Counter + Customize Action */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`font-semibold tracking-wide ${
                isIvory ? 'text-[#0B3B2E]' : 'text-[#E5C158]'
              }`}
            >
              {badgeText}
            </span>
            <span
              aria-hidden="true"
              className={isIvory ? 'text-stone-400' : 'text-white/30'}
            >
              ·
            </span>
            <span
              className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                isIvory ? 'text-slate-600' : 'text-emerald-100/80'
              }`}
            >
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{currentSlide.metaDate}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canConfigure && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  isIvory
                    ? 'bg-stone-200/80 hover:bg-stone-300/80 text-slate-800'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Settings className="w-3 h-3" />
                <span>
                  {language === 'bn'
                    ? 'ব্যানার সম্পাদনা'
                    : language === 'ar'
                      ? 'تعديل العرض'
                      : 'Edit Slides'}
                </span>
              </button>
            )}
            <span
              aria-live="polite"
              className={`font-mono text-xs tabular-nums ${
                isIvory ? 'text-slate-500' : 'text-white/75'
              }`}
            >
              {safeIndex + 1} / {activeSlides.length}
            </span>
          </div>
        </div>

        {/* Slide Content with lightweight CSS transition */}
        <div
          key={currentSlide.id}
          className="my-4 max-w-3xl transition-opacity duration-200 ease-out"
        >
          <h2
            className={`text-lg sm:text-xl lg:text-2xl font-bold leading-snug ${
              isIvory ? 'text-slate-900' : 'text-white'
            }`}
          >
            {titleText}
          </h2>
          <p
            className={`mt-2 text-xs sm:text-sm leading-relaxed max-w-[68ch] ${
              isIvory ? 'text-slate-700' : 'text-emerald-50/90'
            }`}
          >
            {descriptionText}
          </p>
        </div>

        {/* Bottom Row: Primary CTA Link & Accessible Carousel Controls */}
        <div className="pt-3 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate(currentSlide.ctaModule)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-transform active:scale-[0.99] cursor-pointer ${
              isIvory
                ? 'bg-[#0B3B2E] hover:bg-emerald-950 text-white'
                : 'bg-[#D4AF37] hover:bg-[#c59f2d] text-slate-950 font-bold'
            }`}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>

          {/* Pagination Dots + Autoplay Toggle + Prev/Next Buttons */}
          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label={language === 'bn' ? 'স্লাইড নির্বাচন' : 'Slide pagination'}
              className="flex items-center gap-1.5 me-2"
            >
              {activeSlides.map((slide, idx) => {
                const isSelected = idx === safeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={
                      language === 'bn'
                        ? `স্লাইড ${idx + 1}: ${slide.titleBn}`
                        : `Slide ${idx + 1}: ${slide.titleEn}`
                    }
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-sm transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? isIvory
                          ? 'w-6 bg-[#0B3B2E]'
                          : 'w-6 bg-[#D4AF37]'
                        : isIvory
                          ? 'w-2 bg-stone-300 hover:bg-stone-400'
                          : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              aria-label={
                isAutoPlaying
                  ? language === 'bn'
                    ? 'স্বয়ংক্রিয় স্লাইড বিরতি দিন'
                    : 'Pause slide rotation'
                  : language === 'bn'
                    ? 'স্বয়ংক্রিয় স্লাইড চালু করুন'
                    : 'Resume slide rotation'
              }
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isIvory
                  ? 'border-stone-300 text-slate-700 hover:bg-stone-200/70'
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {isAutoPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handlePrev}
              aria-label={
                language === 'bn'
                  ? 'পূর্ববর্তী স্লাইড'
                  : language === 'ar'
                    ? 'الشريحة السابقة'
                    : 'Previous slide'
              }
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isIvory
                  ? 'border-stone-300 text-slate-700 hover:bg-stone-200/70'
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label={
                language === 'bn'
                  ? 'পরবর্তী স্লাইড'
                  : language === 'ar'
                    ? 'الشريحة التالية'
                    : 'Next slide'
              }
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isIvory
                  ? 'border-stone-300 text-slate-700 hover:bg-stone-200/70'
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface CompactNoticeTickerProps {
  notices: Notice[];
  language: Language;
  onOpenNotices: () => void;
}

export function CompactNoticeTicker({
  notices,
  language,
  onOpenNotices,
}: CompactNoticeTickerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || prefersReducedMotion || notices.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => getNextSlideIndex(prev, notices.length));
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion, notices.length]);

  if (notices.length === 0) return null;

  const safeIdx = index % notices.length;
  const activeNotice = notices[safeIdx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="bg-white border border-stone-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3B2E] shrink-0">
          <Megaphone className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>
            {language === 'bn'
              ? 'সর্বশেষ বিজ্ঞপ্তি:'
              : language === 'ar'
                ? 'آخر الإعلانات:'
                : 'Notice Bulletin:'}
          </span>
        </span>
        <button
          type="button"
          onClick={onOpenNotices}
          className="text-xs font-medium text-slate-800 hover:text-[#0B3B2E] hover:underline truncate text-start cursor-pointer"
        >
          {language === 'en' && activeNotice.titleEn
            ? activeNotice.titleEn
            : activeNotice.titleBn}
          <span className="ms-2 font-mono text-[11px] text-slate-500">
            ({activeNotice.publishDate})
          </span>
        </button>
      </div>

      {notices.length > 1 && (
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-[11px] text-slate-400 me-1 hidden sm:inline">
            {safeIdx + 1}/{notices.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((prev) => getPrevSlideIndex(prev, notices.length))}
            aria-label={language === 'bn' ? 'পূর্ববর্তী বিজ্ঞপ্তি' : 'Previous notice'}
            className="p-1 rounded hover:bg-stone-100 text-slate-600 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => getNextSlideIndex(prev, notices.length))}
            aria-label={language === 'bn' ? 'পরবর্তী বিজ্ঞপ্তি' : 'Next notice'}
            className="p-1 rounded hover:bg-stone-100 text-slate-600 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading institutional dashboard"
      className="space-y-6 animate-pulse"
    >
      <div className="h-52 bg-stone-200/80 rounded-xl border border-stone-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-28 bg-white border border-stone-200 rounded-xl p-5 space-y-3"
          >
            <div className="h-3 w-28 bg-stone-200 rounded" />
            <div className="h-7 w-20 bg-stone-200 rounded" />
            <div className="h-2.5 w-36 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
