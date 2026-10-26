import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ImagePlus,
  Move,
  RefreshCw,
  Trash2,
  Upload,
  User,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { DepartmentCode, Language } from '../types/madrasa';
import { validatePhotoUploadMetadata } from '../utils/madrasaLogic';
import { uploadStudentPhotoAsset } from '../lib/firebase';

interface StudentPhotoAvatarProps {
  photoUrl?: string;
  nameBn: string;
  nameEn?: string;
  department?: DepartmentCode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StudentPhotoAvatar: React.FC<StudentPhotoAvatarProps> = ({
  photoUrl,
  nameBn,
  nameEn,
  department = 'hifz',
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs rounded-lg',
    md: 'w-11 h-11 text-sm rounded-xl',
    lg: 'w-16 h-16 text-lg rounded-2xl',
    xl: 'w-24 h-24 text-2xl rounded-2xl',
  }[size];

  const deptTone = {
    hifz: 'bg-[#0F5132]/10 text-[#0F5132] border-[#0F5132]/25',
    qawmi: 'bg-[#B8860B]/12 text-[#8A6306] border-[#B8860B]/30',
    general: 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]/25',
  }[department];

  const initialSource = (nameEn && nameEn.trim()) || nameBn.trim() || 'S';
  const initials = initialSource
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  if (photoUrl && photoUrl.trim().length > 0 && !imgError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-[#E3DAC9] bg-[#FBF9F4] shadow-xs ${sizeClasses} ${className}`}
      >
        <img
          src={photoUrl}
          alt={nameBn || nameEn || 'Student Photograph'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center font-bold border select-none ${sizeClasses} ${deptTone} ${className}`}
      title={nameBn || nameEn}
    >
      {initials || <User className="w-4 h-4" />}
    </div>
  );
};

interface StudentPhotoCropUploaderProps {
  lang: Language;
  value: string;
  onChange: (newPhotoUrl: string) => void;
  studentName?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function generateSamplePassportPortraitDataUrl(labelName: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Warm studio passport background
  const grad = ctx.createLinearGradient(0, 0, 240, 240);
  grad.addColorStop(0, '#0F5132');
  grad.addColorStop(1, '#093023');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 240, 240);

  // Subtle gold frame border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 220, 220);

  // Head & cap (Topi) silhouette
  ctx.fillStyle = '#F4EFE6';
  ctx.beginPath();
  ctx.arc(120, 96, 36, 0, Math.PI * 2);
  ctx.fill();

  // White prayer cap (Topi)dome highlight
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(120, 82, 35, Math.PI, 0, false);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(85, 82);
  ctx.lineTo(155, 82);
  ctx.stroke();

  // Panjabi shoulders
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(120, 208, 66, Math.PI, 0, false);
  ctx.fill();

  // Initials badge
  const clean = (labelName || 'UQ').trim();
  const text = clean ? clean.slice(0, 2).toUpperCase() : 'UQ';
  ctx.fillStyle = '#0F5132';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 120, 186);

  return canvas.toDataURL('image/jpeg', 0.84);
}

export const StudentPhotoCropUploader: React.FC<StudentPhotoCropUploaderProps> = ({
  lang,
  value,
  onChange,
  studentName = '',
  disabled = false,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [safeFileName, setSafeFileName] = useState<string>('student-photo.jpg');
  const [zoom, setZoom] = useState<number>(1.15);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loadedImageEl, setLoadedImageEl] = useState<HTMLImageElement | null>(null);

  // Load image element when rawImageSrc changes
  useEffect(() => {
    if (!rawImageSrc) {
      setLoadedImageEl(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImageEl(img);
    };
    img.onerror = () => {
      setErrorMsg(
        lang === 'bn'
          ? 'ছবিটি লোড করা যায়নি। অনুগ্রহ করে অন্য একটি JPG বা PNG ছবি নির্বাচন করুন।'
          : 'Could not decode image file. Please choose another JPG or PNG file.'
      );
      setRawImageSrc(null);
    };
    img.src = rawImageSrc;
  }, [rawImageSrc, lang]);

  // Draw live 1:1 cropped preview onto canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !loadedImageEl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 240;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#FBF9F4';
    ctx.fillRect(0, 0, size, size);

    const minDim = Math.min(loadedImageEl.width, loadedImageEl.height);
    const cropDim = minDim / zoom;

    const maxPanX = Math.max(0, (loadedImageEl.width - cropDim) / 2);
    const maxPanY = Math.max(0, (loadedImageEl.height - cropDim) / 2);

    const sx = (loadedImageEl.width - cropDim) / 2 + (offsetX / 100) * maxPanX;
    const sy = (loadedImageEl.height - cropDim) / 2 + (offsetY / 100) * maxPanY;

    ctx.drawImage(loadedImageEl, sx, sy, cropDim, cropDim, 0, 0, size, size);
  }, [loadedImageEl, zoom, offsetX, offsetY]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePhotoUploadMetadata(
      file.type,
      file.size,
      file.name
    );

    if (!validation.valid) {
      setErrorMsg(
        (lang === 'en' ? validation.errorEn : validation.errorBn) ||
          'অনুমোদিত ছবির ফরম্যাট নয়।'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSafeFileName(validation.safeFileName);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setZoom(1.1);
        setOffsetX(0);
        setOffsetY(0);
        setRawImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    setIsUploading(true);
    setErrorMsg('');

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas blob failed'))),
          'image/jpeg',
          0.82
        );
      });

      const uploadedUrl = await uploadStudentPhotoAsset(blob, safeFileName, dataUrl);
      onChange(uploadedUrl);
      setRawImageSrc(null);
    } catch {
      setErrorMsg(
        lang === 'bn'
          ? 'ছবি সংরক্ষণে ত্রুটি হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to save cropped photograph.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseSamplePortrait = () => {
    setErrorMsg('');
    const sampleDataUrl = generateSamplePassportPortraitDataUrl(studentName || 'UQ');
    onChange(sampleDataUrl);
    setRawImageSrc(null);
  };

  const handleRemovePhoto = () => {
    setErrorMsg('');
    setRawImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange('');
  };

  return (
    <div className="rounded-xl border border-[#E3DAC9] bg-[#FBF9F4] p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0F5132] flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            {lang === 'bn'
              ? 'শিক্ষার্থীর পাসপোর্ট সাইজ ছবি (Student Photograph)'
              : lang === 'ar'
              ? 'صورة الطالب الشخصية'
              : 'Student Passport Photograph'}
          </p>
          <p className="text-xs text-[#6E675C] mt-0.5">
            {lang === 'bn'
              ? 'অনুমোদিত ফরম্যাট: JPG, PNG বা WEBP (সর্বোচ্চ ৫ মেগাবাইট · ১:১ ক্রপ সুবিধাসহ)'
              : 'Supported: JPG, PNG, WEBP up to 5 MB with 1:1 square crop'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
          data-testid="student-photo-file-input"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F5132] text-white hover:bg-[#0B3D26] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {value
              ? lang === 'bn'
                ? 'ছবি পরিবর্তন করুন'
                : 'Replace Photo'
              : lang === 'bn'
              ? 'ছবি নির্বাচন করুন'
              : 'Upload Photo'}
          </button>

          {!value && !rawImageSrc && (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleUseSamplePortrait}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#D4AF37]/50 bg-[#FFFDF8] text-[#1D1B18] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#B8860B]" />
              {lang === 'bn' ? 'নমুনা ছবি যুক্ত করুন' : 'Use Sample Portrait'}
            </button>
          )}

          {value && !rawImageSrc && (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleRemovePhoto}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#991B1B]/25 text-[#991B1B] bg-white hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 rounded-lg bg-[#FEF2F2] border border-[#991B1B]/25 px-3 py-2 text-xs font-medium text-[#991B1B]">
          {errorMsg}
        </div>
      )}

      {/* Interactive Crop & Zoom Editor */}
      {rawImageSrc && (
        <div className="mt-4 pt-4 border-t border-[#E3DAC9] grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-[#0F5132] shadow-sm bg-white">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] text-[#6E675C] mt-1.5">
              {lang === 'bn' ? '১:১ ক্রপ প্রিভিউ' : '1:1 Square Crop Preview'}
            </span>
          </div>

          <div className="sm:col-span-7 space-y-3">
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-[#1D1B18] mb-1">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-[#0F5132]" />
                  {lang === 'bn' ? 'জুম (Zoom)' : 'Zoom Level'}
                </span>
                <span className="font-mono text-[11px] text-[#6E675C]">
                  {Math.round(zoom * 100)}%
                </span>
              </label>
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3.5 h-3.5 text-[#6E675C]" />
                <input
                  type="range"
                  min={1}
                  max={2.4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#0F5132]"
                />
                <ZoomIn className="w-3.5 h-3.5 text-[#6E675C]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-[#6E675C] mb-1">
                  <Move className="w-3 h-3" />
                  {lang === 'bn' ? 'ডানে-বামে (Pan X)' : 'Horizontal Pan'}
                </label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  className="w-full accent-[#0F5132]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-[#6E675C] mb-1">
                  <Move className="w-3 h-3" />
                  {lang === 'bn' ? 'উপরে-নিচে (Pan Y)' : 'Vertical Pan'}
                </label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full accent-[#0F5132]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleApplyCrop}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0B3D26] transition-colors cursor-pointer"
              >
                {isUploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {lang === 'bn' ? 'ক্রপ সম্পন্ন ও সংরক্ষণ করুন' : 'Apply Crop & Save'}
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setRawImageSrc(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-[#E3DAC9] bg-white text-[#6E675C] hover:text-[#1D1B18] cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Saved Photo Preview */}
      {!rawImageSrc && value && !compact && (
        <div className="mt-3 pt-3 border-t border-[#E3DAC9]/70 flex items-center gap-3.5">
          <StudentPhotoAvatar
            photoUrl={value}
            nameBn={studentName || 'শিক্ষার্থী'}
            size="lg"
          />
          <div className="text-xs">
            <p className="font-bold text-[#166534] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {lang === 'bn'
                ? 'শিক্ষার্থীর পাসপোর্ট ছবি সংযুক্ত করা হয়েছে'
                : 'Student photograph attached & verified'}
            </p>
            <p className="text-[#6E675C] mt-0.5">
              {lang === 'bn'
                ? 'ভর্তি অনুমোদনের পর এই ছবিটি স্বয়ংক্রিয়ভাবে প্রোফাইল ও আইডি কার্ডে যুক্ত হবে।'
                : 'This photo will automatically link to the student profile upon approval.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
