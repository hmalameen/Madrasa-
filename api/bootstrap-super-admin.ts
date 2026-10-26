import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  executeServerSuperAdminBootstrap,
  inspectFirebaseAdminEnv,
  type ServerBootstrapRequestPayload,
} from '../src/server/superAdminBootstrapServer';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
  method?: string;
  headers: IncomingMessage['headers'];
}

interface VercelResponse extends ServerResponse {
  status?: (code: number) => VercelResponse;
  json?: (data: unknown) => void;
}

function sendJson(res: VercelResponse, statusCode: number, payload: unknown) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    const statusRes = res.status(statusCode);
    if (statusRes && typeof statusRes.json === 'function') {
      statusRes.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
      if (raw.length > 64 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Safe readiness diagnostic that NEVER exposes private keys or secret values
    const inspection = inspectFirebaseAdminEnv(process.env);
    sendJson(res, 200, {
      endpoint: '/api/bootstrap-super-admin',
      readyForAdminSdk: inspection.readyForAdminSdk,
      readyForBootstrapEndpoint: inspection.readyForBootstrapEndpoint,
      missingVariables: inspection.missingVariables,
      invalidFormatVariables: inspection.invalidFormatVariables,
      securityViolations: inspection.securityViolations,
    });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, {
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      messageEn: 'Only GET (readiness) and POST (one-time bootstrap) are allowed.',
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const headerSecret =
      typeof req.headers['x-bootstrap-secret'] === 'string'
        ? req.headers['x-bootstrap-secret']
        : undefined;
    const authHeader =
      typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : undefined;

    const payload: ServerBootstrapRequestPayload = {
      ownerEmail: typeof body.ownerEmail === 'string' ? body.ownerEmail : '',
      displayName: typeof body.displayName === 'string' ? body.displayName : '',
      phone: typeof body.phone === 'string' ? body.phone : '',
      setupPassword: typeof body.setupPassword === 'string' ? body.setupPassword : undefined,
      setupToken: typeof body.setupToken === 'string' ? body.setupToken : undefined,
      idToken: typeof body.idToken === 'string' ? body.idToken : undefined,
    };

    const result = await executeServerSuperAdminBootstrap(
      payload,
      headerSecret,
      bearerToken,
      process.env
    );
    sendJson(res, result.statusCode, result.body);
  } catch {
    sendJson(res, 400, {
      ok: false,
      code: 'INVALID_PAYLOAD',
      messageBn: 'বুটস্ট্র্যাপ রিকোয়েস্ট ফরম্যাট সঠিক নয়।',
      messageEn: 'Invalid JSON request body.',
    });
  }
}
