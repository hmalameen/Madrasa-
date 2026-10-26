import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileCheck2,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  GradingPolicyConfig,
  InstitutionSettings,
  Language,
} from '../types/madrasa';
import {
  DEFAULT_MADRASA_GRADING_POLICY,
  formatNum,
  type StudentTabulationRow,
} from '../utils/madrasaLogic';
import { InstitutionalCrest } from './InstitutionalCrest';
import { StudentPhotoAvatar } from './StudentPhotoUploader';

export function sanitizePdfFilenameSegment(input: string): string {
  return (
    input
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
      .slice(0, 64) || 'Document'
  );
}

export function buildIndividualMarksheetFilename(
  row: StudentTabulationRow
): string {
  const idPart = sanitizePdfFilenameSegment(row.student.admissionNo);
  const examPart = sanitizePdfFilenameSegment(row.examName);
  const yearPart = sanitizePdfFilenameSegment(row.academicYear);
  return `${idPart}_${examPart}_${yearPart}.pdf`;
}

export function buildClassTabulationFilename(
  className: string,
  examName: string,
  academicYear: string
): string {
  const clsPart = sanitizePdfFilenameSegment(className);
  const examPart = sanitizePdfFilenameSegment(examName);
  const yearPart = sanitizePdfFilenameSegment(academicYear);
  return `ClassSheet_${clsPart}_${examPart}_${yearPart}.pdf`;
}

/**
 * Packages one or more JPEG data URLs into a standards-compliant multi-page %PDF-1.4 binary Blob.
 * Using high-DPI Canvas rendering with browser HarfBuzz shaping guarantees 100% accurate Bengali Unicode conjuncts.
 */
function buildMultiPagePdfBlobFromJpegs(
  pages: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }>,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Blob {
  const pageWidthPt = orientation === 'portrait' ? 595.28 : 841.89;
  const pageHeightPt = orientation === 'portrait' ? 841.89 : 595.28;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // 1-indexed object offsets
  let currentLength = 0;

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentLength += bytes.byteLength;
  };

  const pushStr = (str: string) => {
    pushBytes(encoder.encode(str));
  };

  const startObj = (objId: number) => {
    offsets[objId] = currentLength;
    pushStr(`${objId} 0 obj\n`);
  };

  const endObj = () => {
    pushStr(`\nendobj\n`);
  };

  pushStr(`%PDF-1.4\n%\xFF\xFF\xFF\xFF\n`);

  // Object 1: Catalog
  startObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>`);
  endObj();

  // Reserve Object 2 for Pages tree; each page i uses 3 objects:
  // pageObjId = 3 + i * 3
  // contentObjId = 4 + i * 3
  // imageObjId = 5 + i * 3
  const pageObjIds = pages.map((_, i) => 3 + i * 3);

  startObj(2);
  pushStr(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  );
  endObj();

  pages.forEach((p, idx) => {
    const pageObjId = 3 + idx * 3;
    const contentObjId = 4 + idx * 3;
    const imageObjId = 5 + idx * 3;
    const imgName = `/Im${idx + 1}`;

    const contentStream = `q\n${pageWidthPt.toFixed(2)} 0 0 ${pageHeightPt.toFixed(2)} 0 0 cm\n${imgName} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);

    // Page object
    startObj(pageObjId);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(2)}] /Resources << /XObject << ${imgName} ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );
    endObj();

    // Content stream object
    startObj(contentObjId);
    pushStr(`<< /Length ${contentBytes.byteLength} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr(`\nendstream`);
    endObj();

    // Image XObject
    startObj(imageObjId);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.byteLength} >>\nstream\n`
    );
    pushBytes(p.jpegBytes);
    pushStr(`\nendstream`);
    endObj();
  });

  const totalObjects = 2 + pages.length * 3;
  const xrefOffset = currentLength;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr(`0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjects; i += 1) {
    const off = String(offsets[i] || 0).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function loadOptionalImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawInstitutionalCrestOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  // Outer gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0B4F3B';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#C99A2E';
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#E6C677';
  ctx.stroke();

  // Open Quran emblem inside crest
  ctx.fillStyle = '#F7F3EA';
  ctx.font = `bold ${Math.round(radius * 0.52)}px "Noto Serif Bengali", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('উক', cx, cy);
  ctx.restore();
}

/**
 * Renders an official A4 Marksheet onto a high-resolution Canvas (1240 x 1754 px = 150 DPI A4)
 * using the browser's native Bengali HarfBuzz text shaping engine.
 */
async function renderMarksheetPageToJpeg(
  row: StudentTabulationRow,
  settings: InstitutionSettings,
  policy: GradingPolicyConfig,
  pageIndex: number,
  totalPages: number
): Promise<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }> {
  const widthPx = 1240;
  const heightPx = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d')!;

  // Paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Outer ornamental border
  ctx.strokeStyle = '#0B4F3B';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, widthPx - 72, heightPx - 72);

  ctx.strokeStyle = '#C99A2E';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, widthPx - 96, heightPx - 96);

  // Header Banner
  drawInstitutionalCrestOnCanvas(ctx, 135, 138, 52);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0B4F3B';
  ctx.font = 'bold 34px "Noto Serif Bengali", "Hind Siliguri", sans-serif';
  ctx.fillText(settings.institutionNameBn, widthPx / 2, 104);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(settings.institutionNameEn.toUpperCase(), widthPx / 2, 136);

  ctx.fillStyle = '#475569';
  ctx.font = '16px "Noto Serif Bengali", sans-serif';
  ctx.fillText(`${settings.addressBn} | ফোন: ${settings.phone}`, widthPx / 2, 166);

  // Title Pill
  ctx.fillStyle = '#0B4F3B';
  ctx.fillRect(widthPx / 2 - 250, 186, 500, 42);
  ctx.strokeStyle = '#C99A2E';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(widthPx / 2 - 250, 186, 500, 42);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Noto Serif Bengali", sans-serif';
  ctx.fillText('একাডেমিক ট্রান্সক্রিপ্ট ও অফিশিয়াল মার্কশিট', widthPx / 2, 213);

  // Student Photo Box on right
  const photoX = widthPx - 205;
  const photoY = 82;
  const photoW = 128;
  const photoH = 148;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  const stuPhoto = await loadOptionalImage(row.student.photoUrl);
  if (stuPhoto) {
    ctx.drawImage(stuPhoto, photoX + 3, photoY + 3, photoW - 6, photoH - 6);
  } else {
    ctx.fillStyle = '#0B4F3B';
    ctx.font = 'bold 36px "Noto Serif Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(row.student.nameBn.slice(0, 1), photoX + photoW / 2, photoY + 75);
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(row.student.admissionNo, photoX + photoW / 2, photoY + 125);
  }

  // Student Info Grid
  const infoY = 250;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(70, infoY, widthPx - 140, 155);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(70, infoY, widthPx - 140, 155);

  ctx.textAlign = 'left';
  const drawField = (label: string, val: string, x: number, y: number) => {
    ctx.fillStyle = '#64748B';
    ctx.font = '15px "Noto Serif Bengali", sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 17px "Noto Serif Bengali", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(val, x + 155, y);
  };

  drawField('শিক্ষার্থীর নাম:', `${row.student.nameBn} (${row.student.nameEn})`, 92, infoY + 34);
  drawField('স্টুডেন্ট আইডি:', row.student.admissionNo, 92, infoY + 68);
  drawField('জামাত / শ্রেণি:', `${row.className} (${row.sectionName})`, 92, infoY + 102);
  drawField('অভিভাবকের নাম:', row.student.guardianName, 92, infoY + 136);

  drawField('পরীক্ষার নাম:', row.examName, 660, infoY + 34);
  drawField('শিক্ষাবর্ষ:', row.academicYear, 660, infoY + 68);
  drawField('রোল নম্বর:', String(row.student.rollNo), 660, infoY + 102);
  drawField('প্রকাশের তারিখ:', row.publicationDate || '২০২৬-১০-০৫', 660, infoY + 136);

  // Subject Table Header
  let tableY = 430;
  const colX = [70, 175, 555, 655, 755, 865, 985, 1085, 1170];
  const headers = [
    'কোড',
    'বিষয় / কিতাবের নাম',
    'পূর্ণমান',
    'পাস নম্বর',
    'প্রাপ্ত নম্বর',
    'শতাংশ (%)',
    'লেটার গ্রেড',
    'জিপিএ',
  ];

  ctx.fillStyle = '#0B4F3B';
  ctx.fillRect(70, tableY, widthPx - 140, 44);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Noto Serif Bengali", sans-serif';
  headers.forEach((h, i) => {
    ctx.fillText(h, colX[i] + 12, tableY + 28);
  });

  tableY += 44;
  row.subjectCells.forEach((cell, idx) => {
    const rowH = 44;
    ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(70, tableY, widthPx - 140, rowH);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(70, tableY, widthPx - 140, rowH);

    ctx.fillStyle = '#0F172A';
    ctx.font = '15px "Plus Jakarta Sans", "Noto Serif Bengali", sans-serif';
    ctx.fillText(cell.subjectCode || `S-${idx + 1}`, colX[0] + 12, tableY + 28);
    ctx.font = 'bold 16px "Noto Serif Bengali", sans-serif';
    ctx.fillText(cell.subjectName.slice(0, 36), colX[1] + 12, tableY + 28);

    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(String(cell.maxMarks), colX[2] + 18, tableY + 28);
    ctx.fillText(String(cell.passMarks), colX[3] + 18, tableY + 28);

    const marksStr = cell.isAbsent
      ? 'অনুপস্থিত (AB)'
      : cell.marksObtained === null
      ? 'এন্ট্রি হয়নি'
      : String(cell.marksObtained);
    ctx.fillStyle =
      cell.status === 'failed' || cell.status === 'absent' ? '#DC2626' : '#0F172A';
    ctx.font = 'bold 16px "Noto Serif Bengali", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(marksStr, colX[4] + 12, tableY + 28);

    ctx.fillStyle = '#334155';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      cell.percentage !== null ? `${cell.percentage}%` : '—',
      colX[5] + 14,
      tableY + 28
    );
    ctx.fillText(cell.gradeLabel, colX[6] + 10, tableY + 28);
    ctx.fillText(
      cell.gpaPoint !== null ? cell.gpaPoint.toFixed(2) : '—',
      colX[7] + 14,
      tableY + 28
    );

    tableY += rowH;
  });

  // Summary Box
  const sumY = Math.max(tableY + 28, 920);
  ctx.fillStyle = '#F0FDF4';
  ctx.fillRect(70, sumY, widthPx - 140, 96);
  ctx.strokeStyle = '#0B4F3B';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, sumY, widthPx - 140, 96);

  const sumItems = [
    {
      label: 'মোট প্রাপ্ত নম্বর (Total)',
      val: `${row.totalObtained} / ${row.totalMaxMarks}`,
    },
    { label: 'শতাংশ ও গড় (Percentage)', val: `${row.percentage}%` },
    {
      label: 'প্রাপ্ত জিপিএ (GPA)',
      val: row.gpa !== null ? `${row.gpa.toFixed(2)} / ${policy.gpaScale.toFixed(2)}` : 'N/A',
    },
    { label: 'চূড়ান্ত গ্রেড (Grade)', val: row.overallGradeLabel },
    {
      label: 'ফলাফল স্ট্যাটাস (Result)',
      val:
        row.overallStatus === 'PASS'
          ? 'উত্তীর্ণ (PASSED)'
          : row.overallStatus === 'FAIL'
          ? 'অকৃতকার্য (FAILED)'
          : row.overallStatus === 'ABSENT'
          ? 'অনুপস্থিত (ABSENT)'
          : 'অসম্পূর্ণ (INCOMPLETE)',
    },
    {
      label: 'মেধা স্থান (Merit Rank)',
      val: row.rank !== null ? `মেধা স্থান: #${row.rank}` : 'প্রযোজ্য নয়',
    },
  ];

  sumItems.forEach((item, i) => {
    const bx = 92 + i * 182;
    ctx.fillStyle = '#475569';
    ctx.font = '14px "Noto Serif Bengali", sans-serif';
    ctx.fillText(item.label, bx, sumY + 34);
    ctx.fillStyle = '#0B4F3B';
    ctx.font = 'bold 18px "Noto Serif Bengali", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(item.val, bx, sumY + 68);
  });

  // Grading Policy Scale Reference
  const policyY = sumY + 130;
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 14px "Noto Serif Bengali", sans-serif';
  ctx.fillText(
    'গ্রেডিং নীতিমালা (Institutional Grading Scale): ' +
      policy.gradeTiers
        .map((t) => `${t.labelEn} (${t.minPercentage}%+, GPA ${t.gpaPoint.toFixed(2)})`)
        .join('  |  '),
    70,
    policyY
  );

  // Signatures at bottom
  const sigY = heightPx - 140;
  const sigCols = [
    { x: 180, title: 'শ্রেণি শিক্ষক / নেগরান', sub: 'Class Teacher Signature' },
    { x: widthPx / 2, title: 'পরীক্ষা নিয়ন্ত্রক (নাযিমে তালীমাত)', sub: 'Controller of Examinations' },
    { x: widthPx - 220, title: 'মুহতামিম / অধ্যক্ষের স্বাক্ষর ও সিল', sub: 'Muhtamim / Principal' },
  ];

  ctx.textAlign = 'center';
  sigCols.forEach((s) => {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x - 120, sigY);
    ctx.lineTo(s.x + 120, sigY);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px "Noto Serif Bengali", sans-serif';
    ctx.fillText(s.title, s.x, sigY + 26);
    ctx.fillStyle = '#64748B';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(s.sub, s.x, sigY + 46);
  });

  // Footer with Page Number & Verification Timestamp
  ctx.fillStyle = '#64748B';
  ctx.font = '13px "Noto Serif Bengali", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    `ডিজিটাল ভেরিফিকেশন আইডি: UQCM-RES-${row.student.admissionNo}-${row.academicYear}`,
    70,
    heightPx - 58
  );
  ctx.textAlign = 'right';
  ctx.fillText(
    `পৃষ্ঠা ${pageIndex + 1} / ${totalPages} (Page ${pageIndex + 1} of ${totalPages})`,
    widthPx - 70,
    heightPx - 58
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return {
    jpegBytes: dataUrlToUint8Array(dataUrl),
    widthPx,
    heightPx,
  };
}

/**
 * Renders full class tabulation sheet pages (Landscape A4: 1754 x 1240 px) with repeating headers and page numbers.
 */
async function renderClassTabulationPagesToJpeg(
  rows: StudentTabulationRow[],
  settings: InstitutionSettings,
  meta: {
    examName: string;
    academicYear: string;
    className: string;
    sectionName: string;
    publicationDate: string;
  }
): Promise<Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }>> {
  const widthPx = 1754;
  const heightPx = 1240;
  const rowsPerPage = 12;
  const chunks: StudentTabulationRow[][] = [];
  for (let i = 0; i < Math.max(1, rows.length); i += rowsPerPage) {
    chunks.push(rows.slice(i, i + rowsPerPage));
  }

  const subjects = rows[0]?.subjectCells || [];
  const results: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }> = [];

  for (let pageIdx = 0; pageIdx < chunks.length; pageIdx += 1) {
    const pageRows = chunks[pageIdx];
    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, widthPx, heightPx);

    ctx.strokeStyle = '#0B4F3B';
    ctx.lineWidth = 5;
    ctx.strokeRect(30, 30, widthPx - 60, heightPx - 60);

    drawInstitutionalCrestOnCanvas(ctx, 110, 108, 42);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0B4F3B';
    ctx.font = 'bold 30px "Noto Serif Bengali", sans-serif';
    ctx.fillText(settings.institutionNameBn, widthPx / 2, 82);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 18px "Noto Serif Bengali", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `পূর্ণাঙ্গ জামাত ফলাফল শিট (Full Class Tabulation Sheet) — ${meta.examName} (${meta.academicYear})`,
      widthPx / 2,
      116
    );

    ctx.fillStyle = '#475569';
    ctx.font = '15px "Noto Serif Bengali", sans-serif';
    ctx.fillText(
      `জামাত / শ্রেণি: ${meta.className} (${meta.sectionName})  |  মোট শিক্ষার্থী: ${rows.length} জন  |  প্রকাশের তারিখ: ${meta.publicationDate || '২০২৬-১০-০৫'}`,
      widthPx / 2,
      146
    );

    // Table Header
    let tableY = 172;
    ctx.fillStyle = '#0B4F3B';
    ctx.fillRect(50, tableY, widthPx - 100, 42);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Noto Serif Bengali", sans-serif';
    ctx.fillText('রোল', 62, tableY + 26);
    ctx.fillText('স্টুডেন্ট আইডি', 115, tableY + 26);
    ctx.fillText('শিক্ষার্থীর নাম', 265, tableY + 26);

    const subStartX = 520;
    const subAreaWidth = 680;
    const subColW = subjects.length > 0 ? Math.floor(subAreaWidth / subjects.length) : 160;

    subjects.forEach((sub, sIdx) => {
      const sx = subStartX + sIdx * subColW;
      ctx.fillText(sub.subjectName.slice(0, 14), sx + 6, tableY + 26);
    });

    ctx.fillText('মোট নম্বর', 1215, tableY + 26);
    ctx.fillText('শতাংশ', 1320, tableY + 26);
    ctx.fillText('জিপিএ', 1405, tableY + 26);
    ctx.fillText('গ্রেড', 1480, tableY + 26);
    ctx.fillText('ফলাফল', 1565, tableY + 26);
    ctx.fillText('মেধা স্থান', 1640, tableY + 26);

    tableY += 42;
    pageRows.forEach((r, rIdx) => {
      const rowH = 58;
      ctx.fillStyle = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(50, tableY, widthPx - 100, rowH);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, tableY, widthPx - 100, rowH);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(r.student.rollNo), 65, tableY + 34);
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(r.student.admissionNo, 115, tableY + 34);
      ctx.font = 'bold 15px "Noto Serif Bengali", sans-serif';
      ctx.fillText(r.student.nameBn.slice(0, 22), 265, tableY + 34);

      r.subjectCells.forEach((c, cIdx) => {
        const sx = subStartX + cIdx * subColW;
        const val = c.isAbsent
          ? 'AB'
          : c.marksObtained === null
          ? '—'
          : `${c.marksObtained} (${c.letterGrade})`;
        ctx.fillStyle =
          c.status === 'failed' || c.status === 'absent' ? '#DC2626' : '#1E293B';
        ctx.font = '14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(val, sx + 6, tableY + 34);
      });

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${r.totalObtained}/${r.totalMaxMarks}`, 1215, tableY + 34);
      ctx.fillText(`${r.percentage}%`, 1320, tableY + 34);
      ctx.fillText(r.gpa !== null ? r.gpa.toFixed(2) : '—', 1405, tableY + 34);
      ctx.fillText(r.overallLetterGrade, 1485, tableY + 34);

      ctx.fillStyle = r.overallStatus === 'PASS' ? '#047857' : '#DC2626';
      ctx.fillText(r.overallStatus, 1565, tableY + 34);

      ctx.fillStyle = '#0B4F3B';
      ctx.fillText(r.rank !== null ? `#${r.rank}` : '—', 1650, tableY + 34);

      tableY += rowH;
    });

    // Signatures & Page Footer
    const sigY = heightPx - 95;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px "Noto Serif Bengali", sans-serif';
    ctx.fillText('শ্রেণি শিক্ষক / টেবুলেটর', 320, sigY);
    ctx.fillText('পরীক্ষা নিয়ন্ত্রক (নাযিমে তালীমাত)', widthPx / 2, sigY);
    ctx.fillText('মুহতামিম / অধ্যক্ষের অনুমোদন ও সিল', widthPx - 320, sigY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748B';
    ctx.font = '14px "Noto Serif Bengali", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `পৃষ্ঠা ${pageIdx + 1} / ${chunks.length} (Page ${pageIdx + 1} of ${chunks.length})`,
      widthPx - 55,
      heightPx - 48
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    results.push({
      jpegBytes: dataUrlToUint8Array(dataUrl),
      widthPx,
      heightPx,
    });
  }

  return results;
}

export async function downloadIndividualMarksheetPdf(
  row: StudentTabulationRow,
  settings: InstitutionSettings,
  policy: GradingPolicyConfig = DEFAULT_MADRASA_GRADING_POLICY
): Promise<string> {
  const page = await renderMarksheetPageToJpeg(row, settings, policy, 0, 1);
  const pdfBlob = buildMultiPagePdfBlobFromJpegs([page], 'portrait');
  const filename = buildIndividualMarksheetFilename(row);

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return filename;
}

export async function downloadBulkClassMarksheetsPdf(
  rows: StudentTabulationRow[],
  settings: InstitutionSettings,
  policy: GradingPolicyConfig = DEFAULT_MADRASA_GRADING_POLICY,
  filenamePrefix = 'BulkMarksheets'
): Promise<string> {
  const pages: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }> = [];
  for (let i = 0; i < rows.length; i += 1) {
    const page = await renderMarksheetPageToJpeg(
      rows[i],
      settings,
      policy,
      i,
      rows.length
    );
    pages.push(page);
  }
  const pdfBlob = buildMultiPagePdfBlobFromJpegs(pages, 'portrait');
  const first = rows[0];
  const filename = first
    ? `${filenamePrefix}_${sanitizePdfFilenameSegment(first.className)}_${sanitizePdfFilenameSegment(first.examName)}_${sanitizePdfFilenameSegment(first.academicYear)}.pdf`
    : `${filenamePrefix}.pdf`;

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return filename;
}

export async function downloadClassTabulationPdf(
  rows: StudentTabulationRow[],
  settings: InstitutionSettings,
  meta: {
    examName: string;
    academicYear: string;
    className: string;
    sectionName: string;
    publicationDate: string;
  }
): Promise<string> {
  const pages = await renderClassTabulationPagesToJpeg(rows, settings, meta);
  const pdfBlob = buildMultiPagePdfBlobFromJpegs(pages, 'landscape');
  const filename = buildClassTabulationFilename(
    meta.className,
    meta.examName,
    meta.academicYear
  );

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return filename;
}

interface OfficialIndividualMarksheetProps {
  row: StudentTabulationRow;
  settings: InstitutionSettings;
  policy?: GradingPolicyConfig;
  lang: Language;
  pageNumber?: number;
  totalPages?: number;
  showActions?: boolean;
}

export const OfficialIndividualMarksheet: React.FC<OfficialIndividualMarksheetProps> = ({
  row,
  settings,
  policy = DEFAULT_MADRASA_GRADING_POLICY,
  lang,
  pageNumber = 1,
  totalPages = 1,
  showActions = true,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadNotice('');
    try {
      const file = await downloadIndividualMarksheetPdf(row, settings, policy);
      setDownloadNotice(
        lang === 'bn'
          ? `অফিশিয়াল মার্কশিট পিডিএফ ডাউনলোড সম্পন্ন: ${file}`
          : `Official Marksheet PDF downloaded: ${file}`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSheetBody = () => (
    <div
      data-testid={`official-marksheet-${row.student.admissionNo}`}
      className="bg-white text-slate-900 border-4 border-[#0B4F3B] p-5 sm:p-8 rounded-xl shadow-sm relative print:shadow-none print:rounded-none print:border-2"
    >
      {/* Inner Gold ornamental border */}
      <div className="border border-[#C99A2E]/60 p-4 sm:p-6 rounded-lg">
        {/* Institutional Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b-2 border-[#0B4F3B]/20">
          <div className="flex items-center gap-4">
            <InstitutionalCrest className="w-14 h-14" />
            <div>
              <p className="text-xs font-arabic text-[#0B4F3B] tracking-wide">
                {settings.institutionNameAr}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold font-bengali text-[#0B4F3B]">
                {settings.institutionNameBn}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                {settings.institutionNameEn}
              </p>
              <p className="text-xs text-slate-500 font-bengali mt-0.5">
                {settings.addressBn} • ফোন: {settings.phone}
              </p>
            </div>
          </div>

          {/* Canonical Student Photograph */}
          <div className="flex flex-col items-center shrink-0">
            <StudentPhotoAvatar
              nameBn={row.student.nameBn}
              nameEn={row.student.nameEn}
              department={row.student.department}
              photoUrl={row.student.photoUrl}
              size="lg"
              className="ring-2 ring-[#C99A2E]"
            />
            <span className="mt-1.5 text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {row.student.admissionNo}
            </span>
          </div>
        </div>

        {/* Official Transcript Banner */}
        <div className="my-4 text-center">
          <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#0B4F3B] text-white text-xs sm:text-sm font-bold font-bengali tracking-wide shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#E6C677]" />
            একাডেমিক ট্রান্সক্রিপ্ট ও অফিশিয়াল মার্কশিট (Official Academic Marksheet)
          </span>
        </div>

        {/* Student & Exam Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/90 border border-slate-200 rounded-lg p-4 text-xs sm:text-sm font-bengali mb-5">
          <div>
            <span className="text-slate-500 block">শিক্ষার্থীর নাম (Student Name):</span>
            <span className="font-bold text-slate-900">
              {row.student.nameBn} ({row.student.nameEn})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">স্টুডেন্ট আইডি (Student ID):</span>
            <span className="font-mono font-bold text-[#0B4F3B]">
              {row.student.admissionNo}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">রোল ও জামাত (Roll & Class):</span>
            <span className="font-bold text-slate-900">
              রোল #{formatNum(row.student.rollNo, lang)} — {row.className}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">শাখা ও বিভাগ (Section & Dept):</span>
            <span className="font-semibold text-slate-800">
              {row.sectionName} ({row.department.toUpperCase()})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">পরীক্ষা ও শিক্ষাবর্ষ (Examination):</span>
            <span className="font-bold text-slate-900">
              {row.examName} ({row.academicYear})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">অভিভাবক ও প্রকাশের তারিখ:</span>
            <span className="font-semibold text-slate-800">
              {row.student.guardianName} • {row.publicationDate || '২০২৬-১০-০৫'}
            </span>
          </div>
        </div>

        {/* Subject-wise Marks Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-5">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-bengali">
            <thead>
              <tr className="bg-[#0B4F3B] text-white">
                <th className="py-2.5 px-3 border-r border-white/15">কোড</th>
                <th className="py-2.5 px-3 border-r border-white/15">বিষয় / কিতাবের নাম (Subject)</th>
                <th className="py-2.5 px-3 text-center border-r border-white/15">পূর্ণমান</th>
                <th className="py-2.5 px-3 text-center border-r border-white/15">পাস নম্বর</th>
                <th className="py-2.5 px-3 text-center border-r border-white/15">প্রাপ্ত নম্বর</th>
                <th className="py-2.5 px-3 text-center border-r border-white/15">শতাংশ</th>
                <th className="py-2.5 px-3 text-center border-r border-white/15">গ্রেড (Grade)</th>
                <th className="py-2.5 px-3 text-center border-r border-white/15">জিপিএ</th>
                <th className="py-2.5 px-3">মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {row.subjectCells.map((cell, idx) => (
                <tr
                  key={`${cell.subjectName}-${idx}`}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                >
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                    {cell.subjectCode || `SUB-${idx + 1}`}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {cell.subjectName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {formatNum(cell.maxMarks, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {formatNum(cell.passMarks, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {cell.isAbsent ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs">
                        অনুপস্থিত (Absent)
                      </span>
                    ) : cell.marksObtained === null ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">
                        এন্ট্রি হয়নি (Unentered)
                      </span>
                    ) : (
                      <span
                        className={
                          cell.status === 'failed'
                            ? 'text-rose-700 font-mono'
                            : 'text-slate-900 font-mono'
                        }
                      >
                        {formatNum(cell.marksObtained, lang)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                    {cell.percentage !== null ? `${formatNum(cell.percentage, lang)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        cell.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : cell.status === 'failed' || cell.status === 'absent'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cell.gradeLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                    {cell.gpaPoint !== null ? cell.gpaPoint.toFixed(2) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-600">
                    {cell.remarks || (cell.status === 'passed' ? 'উত্তীর্ণ' : '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-emerald-50/70 border border-emerald-900/20 rounded-lg p-3.5 mb-5 font-bengali">
          <div className="bg-white p-2.5 rounded border border-emerald-900/10">
            <span className="text-[11px] text-slate-500 block">মোট প্রাপ্ত নম্বর</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatNum(row.totalObtained, lang)} / {formatNum(row.totalMaxMarks, lang)}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-emerald-900/10">
            <span className="text-[11px] text-slate-500 block">শতাংশ ও গড়</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatNum(row.percentage, lang)}%
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-emerald-900/10">
            <span className="text-[11px] text-slate-500 block">চূড়ান্ত জিপিএ (GPA)</span>
            <span className="text-base font-bold text-[#0B4F3B] font-mono">
              {row.gpa !== null ? `${row.gpa.toFixed(2)} / ${policy.gpaScale.toFixed(2)}` : 'প্রযোজ্য নয়'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-emerald-900/10">
            <span className="text-[11px] text-slate-500 block">সামগ্রিক গ্রেড</span>
            <span className="text-sm font-bold text-[#0B4F3B]">
              {row.overallGradeLabel}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-emerald-900/10">
            <span className="text-[11px] text-slate-500 block">ফলাফল স্ট্যাটাস</span>
            <span
              className={`text-sm font-bold ${
                row.overallStatus === 'PASS'
                  ? 'text-emerald-700'
                  : row.overallStatus === 'INCOMPLETE'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {row.overallStatus === 'PASS'
                ? 'উত্তীর্ণ (PASS)'
                : row.overallStatus === 'FAIL'
                ? 'অকৃতকার্য (FAIL)'
                : row.overallStatus === 'ABSENT'
                ? 'অনুপস্থিত (ABSENT)'
                : 'অসম্পূর্ণ (INCOMPLETE)'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-emerald-900/10">
            <span className="text-[11px] text-slate-500 block">মেধা স্থান (Merit Rank)</span>
            <span className="text-base font-bold text-amber-800">
              {row.rank !== null ? `#${formatNum(row.rank, lang)} তম` : 'প্রযোজ্য নয়'}
            </span>
          </div>
        </div>

        {/* Grading Scale Legend */}
        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5 mb-6 font-bengali">
          <strong className="text-slate-800">গ্রেডিং স্কেল (Grading Policy): </strong>
          {policy.gradeTiers.map((t, i) => (
            <span key={t.letterGrade}>
              {i > 0 ? ' • ' : ''}
              {t.labelBn} ({t.minPercentage}%+, GPA {t.gpaPoint.toFixed(2)})
            </span>
          ))}
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-3 gap-4 pt-8 mt-4 border-t border-slate-200 text-center font-bengali text-xs">
          <div>
            <div className="w-36 mx-auto border-b border-slate-400 mb-1.5" />
            <p className="font-bold text-slate-800">শ্রেণি শিক্ষক / নেগরান</p>
            <p className="text-[11px] text-slate-500">Class Teacher</p>
          </div>
          <div>
            <div className="w-40 mx-auto border-b border-slate-400 mb-1.5" />
            <p className="font-bold text-slate-800">পরীক্ষা নিয়ন্ত্রক (নাযিমে তালীমাত)</p>
            <p className="text-[11px] text-slate-500">Controller of Examinations</p>
          </div>
          <div>
            <div className="w-40 mx-auto border-b border-[#0B4F3B] mb-1.5" />
            <p className="font-bold text-[#0B4F3B]">মুহতামিম / অধ্যক্ষের স্বাক্ষর ও সিল</p>
            <p className="text-[11px] text-slate-500">Muhtamim / Principal</p>
          </div>
        </div>

        {/* Document Footer & Page Number */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bengali">
          <span>
            ভেরিফিকেশন রেফারেন্স: <strong className="font-mono">UQCM-{row.student.admissionNo}-{row.academicYear}</strong>
          </span>
          <span>
            পৃষ্ঠা {formatNum(pageNumber, lang)} / {formatNum(totalPages, lang)} (Page {pageNumber} of {totalPages})
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/5 border border-slate-200/80 rounded-xl p-3 print:hidden">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bengali text-slate-700">
            <FileCheck2 className="w-4 h-4 text-[#0B4F3B]" />
            <span>
              অফিশিয়াল মার্কশিট: <strong>{row.student.nameBn}</strong> ({row.student.admissionNo})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-bengali bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#0B4F3B]" />
              এ৪ পিডিএফ প্রিভিউ (Preview PDF)
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              data-testid={`download-marksheet-pdf-${row.student.admissionNo}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-bengali bg-[#0B4F3B] text-white hover:bg-[#083D2D] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#E6C677]" />
              {isDownloading
                ? 'পিডিএফ তৈরি হচ্ছে...'
                : 'মার্কশিট পিডিএফ ডাউনলোড (Download PDF)'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-bengali bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              প্রিন্ট করুন (Print A4)
            </button>
          </div>
        </div>
      )}

      {downloadNotice && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bengali flex items-center justify-between print:hidden"
        >
          <span>{downloadNotice}</span>
          <button
            type="button"
            onClick={() => setDownloadNotice('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {renderSheetBody()}

      {/* Fullscreen A4 Print-Ready Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0B4F3B] text-white flex items-center justify-between">
              <div className="font-bengali">
                <h3 className="text-sm sm:text-base font-bold">
                  এ৪ অফিশিয়াল মার্কশিট প্রিভিউ — { buildIndividualMarksheetFilename(row) }
                </h3>
                <p className="text-xs text-emerald-100">
                  উম্মুল কুরআন ক্যাডেট মাদ্রাসা • মুদ্রণযোগ্য অফিশিয়াল সংস্করণ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C99A2E] text-slate-950 font-bold text-xs font-bengali hover:bg-[#dfb142] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  পিডিএফ ডাউনলোড
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white font-bold text-xs font-bengali hover:bg-white/25 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                  aria-label="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">{renderSheetBody()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
