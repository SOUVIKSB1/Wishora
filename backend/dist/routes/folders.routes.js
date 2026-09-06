import { db } from '../services/db.service.js';
import { nanoid } from 'nanoid';
export async function foldersRoutes(fastify) {
    const defaultUserId = 'usr_default_master';
    // List folders with wish counts
    fastify.get('/folders', async () => {
        const folders = db.prepare(`
      SELECT f.*, (SELECT COUNT(*) FROM wishes WHERE folder_id = f.id) as wish_count
      FROM folders f
      WHERE f.user_id = ?
      ORDER BY f.sort_order ASC, f.created_at ASC
    `).all(defaultUserId);
        return { folders };
    });
    // Create folder
    fastify.post('/folders', async (req, reply) => {
        const body = req.body;
        if (!body.name) {
            return reply.code(400).send({ error: 'Folder name is required' });
        }
        const id = `fld_${nanoid(8)}`;
        db.prepare('INSERT INTO folders (id, user_id, name, color) VALUES (?, ?, ?, ?)').run(id, defaultUserId, body.name.trim(), body.color || '#C8A96E');
        const created = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
        return { folder: created };
    });
    // Update folder
    fastify.put('/folders/:id', async (req, reply) => {
        const { id } = req.params;
        const body = req.body;
        db.prepare(`
      UPDATE folders SET
        name = COALESCE(?, name),
        color = COALESCE(?, color),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `).run(body.name?.trim(), body.color, body.sort_order, id);
        const updated = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
        return { folder: updated };
    });
    // Delete folder
    fastify.delete('/folders/:id', async (req) => {
        const { id } = req.params;
        db.prepare('DELETE FROM folders WHERE id = ?').run(id);
        return { success: true, id };
    });
}
