import {
  classifyLoginIdentifier,
  normalizeBangladeshPhone,
  resolveCanonicalGuardianPhoneAuthEmail,
  resolveCanonicalStudentAuthEmail,
} from '../utils/madrasaLogic';

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 12;

export function checkLoginRateLimit(
  clientKey: string,
  nowMs = Date.now()
): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const key = (clientKey || 'anonymous').trim().slice(0, 120);
  const existing = rateLimitStore.get(key);

  if (!existing || nowMs >= existing.resetAtMs) {
    rateLimitStore.set(key, {
      count: 1,
      resetAtMs: nowMs + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAtMs - nowMs) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetLoginRateLimitForTest(): void {
  rateLimitStore.clear();
}

export interface ResolveLoginRequestPayload {
  identifier: string;
  loginMode?: 'student' | 'guardian' | 'staff';
}

export interface ResolveLoginResponse {
  statusCode: number;
  body: {
    ok: boolean;
    code:
      | 'RESOLVED'
      | 'INVALID_CREDENTIALS'
      | 'RATE_LIMITED';
    resolvedAuthEmail?: string;
    identifierKind?: 'email' | 'student_id' | 'phone';
    normalizedIdentifier?: string;
    messageBn: string;
    messageEn: string;
  };
}

/**
 * Resolves a Student ID (e.g., UQCM-2026-101), Verified Guardian Phone (+8801XXXXXXXXX),
 * or Email into its Firebase Authentication principal with rate limiting and
 * anti-enumeration guarantees.
 *
 * Security Guarantees:
 * - Never exposes a database dump or Student ID-to-personal-email directory.
 * - Enforces per-IP rate limiting against automated enumeration.
 * - Uses generic error messages ("Invalid Student ID or password") on malformed input.
 */
export function executeResolveLoginIdentifier(
  payload: ResolveLoginRequestPayload,
  clientIp = 'unknown',
  nowMs = Date.now()
): ResolveLoginResponse {
  const rateCheck = checkLoginRateLimit(clientIp, nowMs);
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      body: {
        ok: false,
        code: 'RATE_LIMITED',
        messageBn: `অতিরিক্ত লগইন প্রচেষ্টার কারণে সাময়িকভাবে বিরতি দেওয়া হয়েছে। ${rateCheck.retryAfterSeconds} সেকেন্ড পর আবার চেষ্টা করুন।`,
        messageEn: `Too many sign-in attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
      },
    };
  }

  const rawIdentifier = (payload?.identifier || '').trim();
  const classified = classifyLoginIdentifier(rawIdentifier);

  if (classified.kind === 'invalid' || classified.kind === 'username') {
    return {
      statusCode: 400,
      body: {
        ok: false,
        code: 'INVALID_CREDENTIALS',
        messageBn: 'স্টুডেন্ট আইডি, মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।',
        messageEn: 'Invalid Student ID or password.',
      },
    };
  }

  if (classified.kind === 'student_id') {
    if (payload.loginMode === 'staff') {
      return {
        statusCode: 400,
        body: {
          ok: false,
          code: 'INVALID_CREDENTIALS',
          messageBn: 'স্টাফ বা অ্যাডমিন লগইনের জন্য প্রাতিষ্ঠানিক ইমেইল ব্যবহার করুন।',
          messageEn: 'Please use your institutional email for Staff/Admin login.',
        },
      };
    }
    const resolvedAuthEmail = resolveCanonicalStudentAuthEmail(classified.normalized);
    return {
      statusCode: 200,
      body: {
        ok: true,
        code: 'RESOLVED',
        resolvedAuthEmail,
        identifierKind: 'student_id',
        normalizedIdentifier: classified.normalized,
        messageBn: 'লগইন পরিচয় যাচাইের জন্য প্রস্তুত।',
        messageEn: 'Ready for authentication.',
      },
    };
  }

  if (classified.kind === 'phone') {
    if (payload.loginMode === 'student') {
      return {
        statusCode: 400,
        body: {
          ok: false,
          code: 'INVALID_CREDENTIALS',
          messageBn: 'শিক্ষার্থী লগইনের জন্য অফিশিয়াল স্টুডেন্ট আইডি (যেমন UQCM-2026-101) ব্যবহার করুন।',
          messageEn: 'Please use your official Student ID (e.g. UQCM-2026-101) for Student login.',
        },
      };
    }
    const normalizedPhone = normalizeBangladeshPhone(classified.normalized);
    const resolvedAuthEmail = resolveCanonicalGuardianPhoneAuthEmail(normalizedPhone);
    return {
      statusCode: 200,
      body: {
        ok: true,
        code: 'RESOLVED',
        resolvedAuthEmail,
        identifierKind: 'phone',
        normalizedIdentifier: normalizedPhone,
        messageBn: 'অভিভাবক লগইন পরিচয় যাচাইয়ের জন্য প্রস্তুত।',
        messageEn: 'Guardian phone identity ready for authentication.',
      },
    };
  }

  // Email
  return {
    statusCode: 200,
    body: {
      ok: true,
      code: 'RESOLVED',
      resolvedAuthEmail: classified.normalized,
      identifierKind: 'email',
      normalizedIdentifier: classified.normalized,
      messageBn: 'ইমেইল পরিচয় যাচাইয়ের জন্য প্রস্তুত।',
      messageEn: 'Email identity ready for authentication.',
    },
  };
}
