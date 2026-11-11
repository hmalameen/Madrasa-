import { executeResolveLoginIdentifier } from '../src/server/studentAuthResolverServer';

interface ServerlessRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}

interface ServerlessResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ServerlessResponse;
  json(payload: unknown): void;
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.status(405).json({
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      messageBn: 'শুধুমাত্র POST মেথড অনুমোদিত।',
      messageEn: 'Only POST method is allowed.',
    });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
    'vercel-client';

  const result = executeResolveLoginIdentifier(
    {
      identifier: String(req.body?.identifier || ''),
      loginMode: req.body?.loginMode as 'student' | 'guardian' | 'staff' | undefined,
    },
    clientIp
  );

  res.status(result.statusCode).json(result.body);
}
