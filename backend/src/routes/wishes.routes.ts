import { FastifyInstance } from 'fastify';
import { db } from '../services/db.service.js';
import { nanoid } from 'nanoid';
import { extractUserId } from './auth.routes.js';

export async function wishesRoutes(fastify: FastifyInstance) {
  // List all wishes
  fastify.get('/wishes', async (req) => {
    const userId = extractUserId(req) || 'usr_default_master';
    const query = req.query as { folder_id?: string; status?: string };
    let sql = `
      SELECT w.*, 
             COALESCE(c.avatar_url, (SELECT c2.avatar_url FROM contacts c2 WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM(w.recipient_name)) LIMIT 1)) as contact_avatar_url,
             COALESCE(w.recipient_gender, c.gender, (SELECT c3.gender FROM contacts c3 WHERE LOWER(TRIM(c3.name)) = LOWER(TRIM(w.recipient_name)) LIMIT 1), 'unspecified') as recipient_gender,
             f.name as folder_name,
             f.color as folder_color,
             m.title as music_title,
             (SELECT COUNT(*) FROM wish_photos WHERE wish_id = w.id) as photo_count,
             (SELECT storage_url FROM wish_photos WHERE wish_id = w.id ORDER BY is_featured DESC, sort_order ASC LIMIT 1) as cover_photo,
             (SELECT COUNT(*) FROM reactions WHERE wish_id = w.id) as reaction_count,
             (SELECT type FROM reactions WHERE wish_id = w.id ORDER BY created_at DESC LIMIT 1) as last_reaction_type,
             (SELECT message_text FROM reactions WHERE wish_id = w.id ORDER BY created_at DESC LIMIT 1) as last_reaction_text,
             (SELECT media_url FROM reactions WHERE wish_id = w.id ORDER BY created_at DESC LIMIT 1) as last_reaction_media,
             (SELECT duration FROM reactions WHERE wish_id = w.id ORDER BY created_at DESC LIMIT 1) as last_reaction_duration,
             (SELECT created_at FROM reactions WHERE wish_id = w.id ORDER BY created_at DESC LIMIT 1) as last_reaction_at
      FROM wishes w
      LEFT JOIN contacts c ON w.contact_id = c.id
      LEFT JOIN folders f ON w.folder_id = f.id
      LEFT JOIN music_tracks m ON w.music_id = m.id
      WHERE w.user_id = ?
    `;
    const params: any[] = [userId];

    if (query.folder_id) {
      sql += ' AND w.folder_id = ?';
      params.push(query.folder_id);
    }
    if (query.status) {
      sql += ' AND w.status = ?';
      params.push(query.status);
    }

    sql += ' ORDER BY w.updated_at DESC';

    const wishes = db.prepare(sql).all(...params) as any[];
    return { wishes, total: wishes.length };
  });

  // Get single wish detail
  fastify.get('/wishes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const wish = db.prepare(`
      SELECT w.*, f.name as folder_name, m.title as music_title, m.genre as music_genre
      FROM wishes w
      LEFT JOIN folders f ON w.folder_id = f.id
      LEFT JOIN music_tracks m ON w.music_id = m.id
      WHERE w.id = ?
    `).get(id) as any;

    if (!wish) {
      return reply.code(404).send({ error: 'Wish not found' });
    }

    const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ? ORDER BY sort_order ASC').all(id);
    const opens = db.prepare('SELECT * FROM wish_opens WHERE wish_id = ? ORDER BY opened_at DESC LIMIT 20').all(id);
    const reactions = db.prepare('SELECT * FROM reactions WHERE wish_id = ? ORDER BY created_at DESC').all(id);

    return { wish, photos, opens, reactions };
  });

  // Create wish
  fastify.post('/wishes', async (req, reply) => {
    const userId = extractUserId(req) || 'usr_default_master';
    const body = req.body as any;
    const id = `wsh_${nanoid(10)}`;
    const slug = body.slug || nanoid(10).toLowerCase();

    let contactId = body.contact_id || null;
    const recipientName = (body.recipient_name || 'Friend').trim();

    // Auto-save into contacts table if direct build without existing contact
    if (!contactId && recipientName && recipientName !== 'Friend') {
      try {
        const existing = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(userId, recipientName) as any;
        if (existing) {
          contactId = existing.id;
        } else {
          const newContactId = `cnt_${nanoid(8)}`;
          const dobParts = (body.recipient_dob || '2000-01-01').split('-');
          const dobMonth = parseInt(dobParts[1], 10) || 1;
          const dobDay = parseInt(dobParts[2], 10) || 1;
          const dobYear = parseInt(dobParts[0], 10) || 2000;

          db.prepare(`
            INSERT INTO contacts (id, user_id, name, dob_day, dob_month, dob_year, relationship, gender, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            newContactId,
            userId,
            recipientName,
            dobDay,
            dobMonth,
            dobYear,
            body.relationship || 'Friend',
            body.recipient_gender || 'unspecified',
            'Auto-saved from direct wish creation'
          );
          contactId = newContactId;
        }
      } catch (err) {
        console.warn('Auto-save contact skipped or failed:', err);
      }
    }

    // Ensure default folder exists for user if folder_id is not provided
    let folderId = body.folder_id;
    if (!folderId) {
      const defaultFolder = db.prepare('SELECT id FROM folders WHERE user_id = ? LIMIT 1').get(userId) as any;
      folderId = defaultFolder ? defaultFolder.id : null;
    }

    const insertWishTx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO wishes (
          id, user_id, folder_id, contact_id, slug, recipient_name, recipient_dob,
          recipient_gender, wish_text, wish_language, theme, music_id, custom_music_url,
          music_trim_start, music_trim_end, status, scheduled_for
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        userId,
        folderId,
        contactId,
        slug,
        recipientName,
        body.recipient_dob || '2000-01-01',
        body.recipient_gender || 'unspecified',
        body.wish_text || '',
        body.wish_language || 'en',
        body.theme || 'auto',
        body.music_id || 'trk_1',
        body.custom_music_url || null,
        body.music_trim_start || 0,
        body.music_trim_end || 30,
        body.status || 'draft',
        body.scheduled_for || null
      );

      // If photos are provided
      if (Array.isArray(body.photos) && body.photos.length > 0) {
        const photoStmt = db.prepare('INSERT INTO wish_photos (id, wish_id, storage_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
        body.photos.forEach((p: any, idx: number) => {
          photoStmt.run(
            `pht_${nanoid(8)}`,
            id,
            typeof p === 'string' ? p : p.storage_url || p.url,
            typeof p === 'object' ? p.caption || null : null,
            idx,
            idx === 0 ? 1 : 0
          );
        });
      }
    });

    insertWishTx();

    const created = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
    const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ?').all(id);

    return { wish: created, photos };
  });

  // Update wish
  fastify.put('/wishes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const updateWishTx = db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE wishes SET
          folder_id = COALESCE(?, folder_id),
          recipient_name = COALESCE(?, recipient_name),
          recipient_dob = COALESCE(?, recipient_dob),
          recipient_gender = COALESCE(?, recipient_gender),
          wish_text = COALESCE(?, wish_text),
          wish_language = COALESCE(?, wish_language),
          theme = COALESCE(?, theme),
          music_id = COALESCE(?, music_id),
          custom_music_url = ?,
          music_trim_start = COALESCE(?, music_trim_start),
          music_trim_end = COALESCE(?, music_trim_end),
          status = COALESCE(?, status),
          scheduled_for = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        body.folder_id,
        body.recipient_name,
        body.recipient_dob,
        body.recipient_gender,
        body.wish_text,
        body.wish_language,
        body.theme,
        body.music_id,
        body.custom_music_url || null,
        body.music_trim_start,
        body.music_trim_end,
        body.status,
        body.scheduled_for || null,
        id
      );

      // Update photos if passed
      if (Array.isArray(body.photos)) {
        db.prepare('DELETE FROM wish_photos WHERE wish_id = ?').run(id);
        const photoStmt = db.prepare('INSERT INTO wish_photos (id, wish_id, storage_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
        body.photos.forEach((p: any, idx: number) => {
          photoStmt.run(
            `pht_${nanoid(8)}`,
            id,
            typeof p === 'string' ? p : p.storage_url || p.url,
            typeof p === 'object' ? p.caption || null : null,
            idx,
            idx === 0 ? 1 : 0
          );
        });
      }
    });

    updateWishTx();

    const updated = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
    const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ?').all(id);

    return { wish: updated, photos };
  });

  // Generate / Publish Wish
  fastify.post('/wishes/:id/generate', async (req, reply) => {
    const { id } = req.params as { id: string };
    const wish = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id) as any;
    if (!wish) {
      return reply.code(404).send({ error: 'Wish not found' });
    }

    db.prepare("UPDATE wishes SET status = 'generated', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    const updated = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id) as any;

    return {
      success: true,
      wish: updated,
      slug: updated.slug,
      share_url: `/w/${updated.slug}`
    };
  });

  // Delete wish
  fastify.delete('/wishes/:id', async (req) => {
    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM wishes WHERE id = ?').run(id);
    return { success: true, id };
  });
}
