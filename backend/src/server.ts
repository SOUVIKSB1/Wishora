import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './services/db.service.js';
import { contactsRoutes } from './routes/contacts.routes.js';
import { wishesRoutes } from './routes/wishes.routes.js';
import { publicRoutes } from './routes/public.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { musicRoutes } from './routes/music.routes.js';
import { foldersRoutes } from './routes/folders.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { adminRoutes } from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024 // 50MB JSON payload limit for snappy photo uploads
});

async function main() {
  // Initialize Database
  await initDatabase();

  // Register Plugins
  await server.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  await server.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024 // 20MB
    }
  });

  // Health Check
  server.get('/health', async () => {
    return { status: 'ok', name: 'WISHORA API', timestamp: new Date().toISOString() };
  });

  // Register API Routes
  await server.register(authRoutes, { prefix: '/api/v1' });
  await server.register(adminRoutes, { prefix: '/api/v1' });
  await server.register(contactsRoutes, { prefix: '/api/v1' });
  await server.register(wishesRoutes, { prefix: '/api/v1' });
  await server.register(aiRoutes, { prefix: '/api/v1' });
  await server.register(musicRoutes, { prefix: '/api/v1' });
  await server.register(foldersRoutes, { prefix: '/api/v1' });

  // Public Experience Routes
  await server.register(publicRoutes, { prefix: '/api/v1' });
  await server.register(publicRoutes);

  // Serve Frontend static assets if dist exists (when built together)
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    await server.register(fastifyStatic, {
      root: frontendDistPath,
      prefix: '/',
      wildcard: false
    });

    // SPA fallback: send index.html for all non-API routes
    server.setNotFoundHandler((req, reply) => {
      if (req.raw.url?.startsWith('/api/')) {
        return reply.code(404).send({ error: 'API route not found' });
      }
      return reply.sendFile('index.html');
    });
  } else {
    // When backend is hosted independently (e.g. Render with Vercel frontend), show a rich status page at root /
    server.get('/', async (req, reply) => {
      reply.type('text/html').send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>WISHORA API • Live & Operational</title>
          <style>
            body { background: #06060A; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #12121E; border: 1px solid rgba(212,175,55,0.3); border-radius: 24px; padding: 40px; text-align: center; max-width: 440px; box-shadow: 0 0 50px rgba(212,175,55,0.15); }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #4ade80; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
            h1 { font-size: 26px; margin: 0 0 10px; background: linear-gradient(135deg, #D4AF37, #FFF1D0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            p { color: #A0A0B0; font-size: 13px; line-height: 1.6; margin: 0 0 24px; }
            .links { display: flex; gap: 10px; justify-content: center; }
            .btn { display: inline-block; padding: 10px 18px; border-radius: 12px; background: rgba(255,255,255,0.08); color: #fff; text-decoration: none; font-size: 12px; font-weight: bold; border: 1px solid rgba(255,255,255,0.15); transition: all 0.2s; }
            .btn:hover { background: rgba(212,175,55,0.2); border-color: #D4AF37; color: #D4AF37; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● Server Online</span>
            <h1>WISHORA Engine API</h1>
            <p>The cinematic backend server is operational and serving endpoints for the WISHORA platform.</p>
            <div class="links">
              <a href="/health" class="btn">Check /health</a>
              <a href="/api/v1/contacts" class="btn">Test /api/v1</a>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const HOST = '0.0.0.0';

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🎂 WISHORA running smoothly on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
