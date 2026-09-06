import { FastifyInstance } from 'fastify';
import { db } from '../services/db.service.js';
import { nanoid } from 'nanoid';
import { extractUserId } from './auth.routes.js';

function verifyAdmin(req: any, reply: any): boolean {
  const userId = extractUserId(req);
  if (!userId) {
    reply.code(401).send({ error: 'Unauthorized: Please log in as an administrator' });
    return false;
  }

  const user = db.prepare('SELECT id, role, email FROM users WHERE id = ?').get(userId) as any;
  if (!user || user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden: Administrator privileges required' });
    return false;
  }

  return true;
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Public/user templates endpoint
  fastify.get('/templates', async () => {
    const templates = db.prepare('SELECT * FROM wish_templates ORDER BY is_premium ASC, category ASC').all();
    return { templates };
  });

  // 1. Admin System Stats
  fastify.get('/admin/stats', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const stats = {
      total_users: (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count,
      total_wishes: (db.prepare('SELECT COUNT(*) as count FROM wishes').get() as any).count,
      generated_wishes: (db.prepare("SELECT COUNT(*) as count FROM wishes WHERE status = 'generated'").get() as any).count,
      total_contacts: (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as any).count,
      total_reactions: (db.prepare('SELECT COUNT(*) as count FROM reactions').get() as any).count,
      total_tracks: (db.prepare('SELECT COUNT(*) as count FROM music_tracks').get() as any).count,
      total_templates: (db.prepare('SELECT COUNT(*) as count FROM wish_templates').get() as any).count,
      total_notifications: (db.prepare('SELECT COUNT(*) as count FROM system_notifications').get() as any).count,
      active_vip_users: (db.prepare("SELECT COUNT(*) as count FROM users WHERE plan IN ('pro', 'vip', 'executive')").get() as any).count
    };

    return { stats };
  });

  // 2. User Management
  fastify.get('/admin/users', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const users = db.prepare(`
      SELECT u.id, u.email, u.display_name, u.avatar_url, u.gender, u.user_dob, u.role, u.plan, u.auth_provider, u.created_at,
             (SELECT COUNT(*) FROM wishes WHERE user_id = u.id) as wish_count,
             (SELECT COUNT(*) FROM contacts WHERE user_id = u.id) as contact_count,
             (SELECT COUNT(*) FROM reactions r JOIN wishes w ON r.wish_id = w.id WHERE w.user_id = u.id) as reaction_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all() as any[];

    return { users, total: users.length };
  });

  // Upgrade / Downgrade User Plan
  fastify.put('/admin/users/:id/plan', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    const { plan } = req.body as { plan: string };

    const validPlans = ['free', 'pro', 'vip', 'executive'];
    if (!validPlans.includes(plan)) {
      return reply.code(400).send({ error: 'Invalid plan. Allowed: free, pro, vip, executive' });
    }

    db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, id);
    const updated = db.prepare('SELECT id, email, display_name, role, plan FROM users WHERE id = ?').get(id);

    return { success: true, user: updated };
  });

  // Change User Role
  fastify.put('/admin/users/:id/role', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };

    if (!['user', 'admin'].includes(role)) {
      return reply.code(400).send({ error: 'Invalid role. Allowed: user, admin' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    const updated = db.prepare('SELECT id, email, display_name, role, plan FROM users WHERE id = ?').get(id);

    return { success: true, user: updated };
  });

  // Permanently Delete / Terminate User & Cascade Data
  fastify.delete('/admin/users/:id', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };

    const deleteUserTx = db.transaction(() => {
      // Clean up wishes and reactions
      const userWishes = db.prepare('SELECT id FROM wishes WHERE user_id = ?').all(id) as { id: string }[];
      userWishes.forEach(w => {
        db.prepare('DELETE FROM wish_photos WHERE wish_id = ?').run(w.id);
        db.prepare('DELETE FROM wish_opens WHERE wish_id = ?').run(w.id);
        db.prepare('DELETE FROM reactions WHERE wish_id = ?').run(w.id);
        db.prepare('DELETE FROM wish_versions WHERE wish_id = ?').run(w.id);
      });

      db.prepare('DELETE FROM wishes WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM contacts WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM folders WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM system_notifications WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });

    deleteUserTx();

    return { success: true, message: `User ${id} and all associated data permanently removed` };
  });

  // 3. Music Track Controls
  fastify.get('/admin/music', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const tracks = db.prepare('SELECT * FROM music_tracks ORDER BY is_premium ASC, title ASC').all() as any[];
    const formatted = tracks.map(t => ({
      ...t,
      mood_tags: JSON.parse(t.mood_tags || '[]')
    }));

    return { tracks };
  });

  fastify.post('/admin/music', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const body = req.body as any;
    if (!body.title || !body.storage_url) {
      return reply.code(400).send({ error: 'Title and audio storage URL are required' });
    }

    const id = `trk_${nanoid(8)}`;
    const moodTags = Array.isArray(body.mood_tags) ? JSON.stringify(body.mood_tags) : '["custom"]';

    db.prepare(`
      INSERT INTO music_tracks (id, title, artist, duration, genre, mood_tags, storage_url, preview_url, is_premium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title.trim(),
      body.artist || 'Wishora Studio',
      body.duration || 60,
      body.genre || 'Soundtrack',
      moodTags,
      body.storage_url,
      body.preview_url || body.storage_url,
      body.is_premium ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(id);
    return { success: true, track: created };
  });

  fastify.delete('/admin/music/:id', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM music_tracks WHERE id = ?').run(id);
    return { success: true, id };
  });

  // 4. Text Wish Templates Controls
  fastify.get('/admin/templates', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const templates = db.prepare('SELECT * FROM wish_templates ORDER BY created_at DESC').all();
    return { templates };
  });

  fastify.post('/admin/templates', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const body = req.body as any;
    if (!body.title || !body.content) {
      return reply.code(400).send({ error: 'Title and content are required' });
    }

    const id = `tpl_${nanoid(8)}`;
    db.prepare(`
      INSERT INTO wish_templates (id, title, content, category, tone, language, is_premium)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title.trim(),
      body.content.trim(),
      body.category || 'heartfelt',
      body.tone || 'warm',
      body.language || 'en',
      body.is_premium ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM wish_templates WHERE id = ?').get(id);
    return { success: true, template: created };
  });

  fastify.put('/admin/templates/:id', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    const body = req.body as any;

    db.prepare(`
      UPDATE wish_templates SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        tone = COALESCE(?, tone),
        language = COALESCE(?, language),
        is_premium = COALESCE(?, is_premium)
      WHERE id = ?
    `).run(
      body.title !== undefined ? body.title.trim() : null,
      body.content !== undefined ? body.content.trim() : null,
      body.category,
      body.tone,
      body.language,
      body.is_premium !== undefined ? (body.is_premium ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM wish_templates WHERE id = ?').get(id);
    return { success: true, template: updated };
  });

  fastify.delete('/admin/templates/:id', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM wish_templates WHERE id = ?').run(id);
    return { success: true, id };
  });

  // 5. Bulk & User-Specific Notifications / Announcements
  fastify.get('/admin/notifications', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const notifications = db.prepare(`
      SELECT n.*, u.email as target_user_email, u.display_name as target_user_name
      FROM system_notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `).all();

    return { notifications };
  });

  fastify.post('/admin/notifications', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const body = req.body as { title: string; message: string; user_id?: string | null; type?: string };
    if (!body.title || !body.message) {
      return reply.code(400).send({ error: 'Title and message are required' });
    }

    const id = `notif_${nanoid(8)}`;
    const targetUserId = body.user_id && body.user_id.trim() !== '' ? body.user_id.trim() : null;

    db.prepare(`
      INSERT INTO system_notifications (id, user_id, title, message, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      targetUserId,
      body.title.trim(),
      body.message.trim(),
      body.type || (targetUserId ? 'direct_message' : 'broadcast')
    );

    const created = db.prepare('SELECT * FROM system_notifications WHERE id = ?').get(id);
    return {
      success: true,
      notification: created,
      recipient_type: targetUserId ? `User ${targetUserId}` : 'Broadcast to ALL users'
    };
  });

  fastify.delete('/admin/notifications/:id', async (req, reply) => {
    if (!verifyAdmin(req, reply)) return;

    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM system_notifications WHERE id = ?').run(id);
    return { success: true, id };
  });
}
