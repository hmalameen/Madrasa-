import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  inspectFirebaseAdminEnv,
  executeServerSuperAdminBootstrap,
} from './src/server/superAdminBootstrapServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Trusted Server-Side Super Admin Bootstrap Endpoint
  // - GET /api/bootstrap-super-admin: Safe readiness diagnostic (never exposes private keys or secret values)
  // - POST /api/bootstrap-super-admin: One-time Super Admin provisioning with atomic Firestore lock
  app.get('/api/bootstrap-super-admin', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const inspection = inspectFirebaseAdminEnv(process.env);
    res.status(200).json({
      ok: true,
      endpoint: '/api/bootstrap-super-admin',
      readyForAdminSdk: inspection.readyForAdminSdk,
      readyForBootstrapEndpoint: inspection.readyForBootstrapEndpoint,
      missingVariables: inspection.missingVariables,
      invalidFormatVariables: inspection.invalidFormatVariables,
      securityViolations: inspection.securityViolations,
      normalizedConfig: inspection.normalizedConfig,
    });
  });

  app.post('/api/bootstrap-super-admin', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const headerSecret =
      typeof req.headers['x-bootstrap-secret'] === 'string'
        ? req.headers['x-bootstrap-secret']
        : undefined;
    const authHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : undefined;

    const result = await executeServerSuperAdminBootstrap(
      req.body || {},
      headerSecret,
      bearerToken,
      process.env
    );

    res.status(result.statusCode).json(result.body);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
