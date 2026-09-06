import { FastifyInstance } from 'fastify';
import { db } from '../services/db.service.js';
import { nanoid } from 'nanoid';
import { extractUserId } from './auth.routes.js';

export async function foldersRoutes(fastify: FastifyInstance) {
  // List folders with wish counts
  fastify.get('/folders', async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized: Please log in' });
    }
    const folders = db.prepare(`
      SELECT f.*, (SELECT COUNT(*) FROM wishes WHERE folder_id = f.id AND user_id = f.user_id) as wish_count
      FROM folders f
      WHERE f.user_id = ?
      ORDER BY f.sort_order ASC, f.created_at ASC
    `).all(userId);

    return { folders };
  });

  // Create folder
  fastify.post('/folders', async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized: Please log in' });
    }
    const body = req.body as { name: string; color?: string };
    if (!body.name) {
      return reply.code(400).send({ error: 'Folder name is required' });
    }

    const id = `fld_${nanoid(8)}`;
    db.prepare('INSERT INTO folders (id, user_id, name, color) VALUES (?, ?, ?, ?)').run(
      id,
      userId,
      body.name.trim(),
      body.color || '#C8A96E'
    );

    const created = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(id, userId);
    return { folder: created };
  });

  // Update folder
  fastify.put('/folders/:id', async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized: Please log in' });
    }
    const { id } = req.params as { id: string };
    const body = req.body as { name?: string; color?: string; sort_order?: number };

    db.prepare(`
      UPDATE folders SET
        name = COALESCE(?, name),
        color = COALESCE(?, color),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ? AND user_id = ?
    `).run(body.name?.trim(), body.color, body.sort_order, id, userId);

    const updated = db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?').get(id, userId);
    return { folder: updated };
  });

  // Delete folder
  fastify.delete('/folders/:id', async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized: Please log in' });
    }
    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(id, userId);
    return { success: true, id };
  });
}
