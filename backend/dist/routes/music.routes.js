import { db } from '../services/db.service.js';
import { nanoid } from 'nanoid';
export async function musicRoutes(fastify) {
    // List all tracks
    fastify.get('/music', async () => {
        const tracks = await db.prepare('SELECT * FROM music_tracks ORDER BY is_premium ASC, title ASC').all();
        const formatted = tracks.map(t => ({
            ...t,
            mood_tags: JSON.parse(t.mood_tags || '[]')
        }));
        return { tracks: formatted };
    });
    // Custom user upload
    fastify.post('/music/upload', async (req, reply) => {
        const body = req.body;
        if (!body.title || !body.storage_url) {
            return reply.code(400).send({ error: 'Title and storage URL are required' });
        }
        const id = `trk_cust_${nanoid(8)}`;
        await db.prepare(`
      INSERT INTO music_tracks (id, title, artist, duration, genre, mood_tags, storage_url, is_premium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, body.title, 'Custom Upload', body.duration || 60, body.genre || 'Custom', '["custom"]', body.storage_url, 0);
        const created = await db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(id);
        return { track: created };
    });
}
