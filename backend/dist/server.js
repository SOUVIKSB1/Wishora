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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = Fastify({
    logger: true
});
async function main() {
    // Initialize Database
    initDatabase();
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
    await server.register(contactsRoutes, { prefix: '/api/v1' });
    await server.register(wishesRoutes, { prefix: '/api/v1' });
    await server.register(aiRoutes, { prefix: '/api/v1' });
    await server.register(musicRoutes, { prefix: '/api/v1' });
    await server.register(foldersRoutes, { prefix: '/api/v1' });
    // Public Experience Routes
    await server.register(publicRoutes, { prefix: '/api/v1' });
    await server.register(publicRoutes);
    // Serve Frontend static assets if dist exists (Production / All-in-one deploy)
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
    }
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const HOST = '0.0.0.0';
    try {
        await server.listen({ port: PORT, host: HOST });
        console.log(`🎂 WISHORA running smoothly on http://localhost:${PORT}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
main();
