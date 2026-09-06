import { db, createDefaultUserFolders } from '../services/db.service.js';
import { nanoid } from 'nanoid';
import { extractUserId } from './auth.routes.js';
export async function wishesRoutes(fastify) {
    // List all wishes
    // List all wishes
    fastify.get('/wishes', async (req) => {
        const userId = extractUserId(req) || 'usr_default_master';
        const query = req.query;
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
             (SELECT created_at FROM reactions WHERE wish_id = w.id ORDER BY created_at DESC LIMIT 1) as last_reaction_at,
             (SELECT COUNT(*) FROM wish_versions WHERE wish_id = w.id) as version_count
      FROM wishes w
      LEFT JOIN contacts c ON w.contact_id = c.id
      LEFT JOIN folders f ON w.folder_id = f.id
      LEFT JOIN music_tracks m ON w.music_id = m.id
      WHERE w.user_id = ?
    `;
        const params = [userId];
        if (query.folder_id) {
            sql += ' AND w.folder_id = ?';
            params.push(query.folder_id);
        }
        if (query.status) {
            sql += ' AND w.status = ?';
            params.push(query.status);
        }
        sql += ' ORDER BY w.updated_at DESC';
        const wishes = db.prepare(sql).all(...params);
        return { wishes, total: wishes.length };
    });
    // Get single wish detail with version history
    fastify.get('/wishes/:id', async (req, reply) => {
        const { id } = req.params;
        const wish = db.prepare(`
      SELECT w.*, f.name as folder_name, m.title as music_title, m.genre as music_genre
      FROM wishes w
      LEFT JOIN folders f ON w.folder_id = f.id
      LEFT JOIN music_tracks m ON w.music_id = m.id
      WHERE w.id = ?
    `).get(id);
        if (!wish) {
            return reply.code(404).send({ error: 'Wish not found' });
        }
        const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ? ORDER BY sort_order ASC').all(id);
        const opens = db.prepare('SELECT * FROM wish_opens WHERE wish_id = ? ORDER BY opened_at DESC LIMIT 20').all(id);
        const reactions = db.prepare('SELECT * FROM reactions WHERE wish_id = ? ORDER BY created_at DESC').all(id);
        const rawVersions = db.prepare('SELECT * FROM wish_versions WHERE wish_id = ? ORDER BY version_number DESC').all(id);
        const versions = rawVersions.map(v => ({
            ...v,
            snapshot: JSON.parse(v.snapshot_data || '{}')
        }));
        return { wish, photos, opens, reactions, versions };
    });
    // Get versions of a wish
    fastify.get('/wishes/:id/versions', async (req, reply) => {
        const { id } = req.params;
        const rawVersions = db.prepare('SELECT * FROM wish_versions WHERE wish_id = ? ORDER BY version_number DESC').all(id);
        const versions = rawVersions.map(v => ({
            ...v,
            snapshot: JSON.parse(v.snapshot_data || '{}')
        }));
        return { versions };
    });
    // Revert wish to previous version
    fastify.post('/wishes/:id/revert/:versionId', async (req, reply) => {
        const { id, versionId } = req.params;
        const versionRecord = db.prepare('SELECT * FROM wish_versions WHERE id = ? AND wish_id = ?').get(versionId, id);
        if (!versionRecord) {
            return reply.code(404).send({ error: 'Version record not found' });
        }
        const snapshot = JSON.parse(versionRecord.snapshot_data || '{}');
        const oldWish = snapshot.wish;
        const oldPhotos = snapshot.photos || [];
        if (!oldWish) {
            return reply.code(400).send({ error: 'Snapshot data is corrupt or missing' });
        }
        const revertTx = db.transaction(() => {
            // Archive current before reverting
            const currentWish = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
            const currentPhotos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ? ORDER BY sort_order ASC').all(id);
            if (currentWish) {
                db.prepare(`
          INSERT INTO wish_versions (id, wish_id, version_number, snapshot_data, note)
          VALUES (?, ?, ?, ?, ?)
        `).run(`ver_${nanoid(10)}`, id, currentWish.version || 1, JSON.stringify({ wish: currentWish, photos: currentPhotos }), `Reverting back to v${versionRecord.version_number}`);
            }
            const stmt = db.prepare(`
        UPDATE wishes SET
          folder_id = ?,
          recipient_name = ?,
          recipient_dob = ?,
          recipient_gender = ?,
          wish_text = ?,
          wish_language = ?,
          theme = ?,
          music_id = ?,
          custom_music_url = ?,
          music_trim_start = ?,
          music_trim_end = ?,
          music_volume = ?,
          status = ?,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            stmt.run(oldWish.folder_id, oldWish.recipient_name, oldWish.recipient_dob, oldWish.recipient_gender, oldWish.wish_text, oldWish.wish_language, oldWish.theme, oldWish.music_id, oldWish.custom_music_url || null, oldWish.music_trim_start || 0, oldWish.music_trim_end || 30, oldWish.music_volume ?? 0.8, oldWish.status, id);
            // Restore photos
            db.prepare('DELETE FROM wish_photos WHERE wish_id = ?').run(id);
            const photoStmt = db.prepare('INSERT INTO wish_photos (id, wish_id, storage_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
            oldPhotos.forEach((p, idx) => {
                photoStmt.run(`pht_${nanoid(8)}`, id, p.storage_url || p.url, p.caption || null, idx, idx === 0 ? 1 : 0);
            });
        });
        revertTx();
        const updated = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
        const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ?').all(id);
        return { success: true, wish: updated, photos };
    });
    // Create wish
    fastify.post('/wishes', async (req, reply) => {
        const userId = extractUserId(req) || 'usr_default_master';
        const body = req.body;
        const id = `wsh_${nanoid(10)}`;
        const slug = body.slug || nanoid(10).toLowerCase();
        // Ensure user exists in users table to satisfy foreign key
        const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!userExists) {
            db.prepare(`
        INSERT OR IGNORE INTO users (id, email, display_name, plan)
        VALUES (?, ?, ?, 'free')
      `).run(userId, `${userId}@wishora.internal`, 'Director');
            createDefaultUserFolders(userId);
        }
        let contactId = body.contact_id || null;
        const recipientName = (body.recipient_name || 'Friend').trim();
        // Auto-save into contacts table if direct build without existing contact
        if (!contactId && recipientName && recipientName !== 'Friend') {
            try {
                const existing = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(userId, recipientName);
                if (existing) {
                    contactId = existing.id;
                }
                else {
                    const newContactId = `cnt_${nanoid(8)}`;
                    const dobParts = (body.recipient_dob || '2000-01-01').split('-');
                    const dobMonth = parseInt(dobParts[1], 10) || 1;
                    const dobDay = parseInt(dobParts[2], 10) || 1;
                    const dobYear = parseInt(dobParts[0], 10) || 2000;
                    db.prepare(`
            INSERT INTO contacts (id, user_id, name, dob_day, dob_month, dob_year, relationship, gender, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(newContactId, userId, recipientName, dobDay, dobMonth, dobYear, body.relationship || 'Friend', body.recipient_gender || 'unspecified', 'Auto-saved from direct wish creation');
                    contactId = newContactId;
                }
            }
            catch (err) {
                console.warn('Auto-save contact skipped or failed:', err);
            }
        }
        else if (contactId) {
            const contactExists = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contactId);
            if (!contactExists)
                contactId = null;
        }
        // Ensure valid folder ID
        let folderId = body.folder_id || null;
        if (folderId) {
            const folderExists = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
            if (!folderExists)
                folderId = null;
        }
        if (!folderId) {
            const defaultFolder = db.prepare('SELECT id FROM folders WHERE user_id = ? LIMIT 1').get(userId);
            folderId = defaultFolder ? defaultFolder.id : null;
        }
        // Ensure valid music ID
        let musicId = body.music_id || 'trk_1';
        const trackExists = db.prepare('SELECT id FROM music_tracks WHERE id = ?').get(musicId);
        if (!trackExists) {
            musicId = 'trk_1';
        }
        const musicVolume = body.music_volume !== undefined ? parseFloat(body.music_volume) : 0.8;
        const insertWishTx = db.transaction(() => {
            const stmt = db.prepare(`
        INSERT INTO wishes (
          id, user_id, folder_id, contact_id, slug, recipient_name, recipient_dob,
          recipient_gender, wish_text, wish_language, theme, music_id, custom_music_url,
          music_trim_start, music_trim_end, music_volume, version, status, scheduled_for
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(id, userId, folderId, contactId, slug, recipientName, body.recipient_dob || '2000-01-01', body.recipient_gender || 'unspecified', body.wish_text || '', body.wish_language || 'en', body.theme || 'auto', musicId, body.custom_music_url || null, body.music_trim_start || 0, body.music_trim_end || 30, musicVolume, 1, body.status || 'draft', body.scheduled_for || null);
            // If photos are provided
            if (Array.isArray(body.photos) && body.photos.length > 0) {
                const photoStmt = db.prepare('INSERT INTO wish_photos (id, wish_id, storage_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
                body.photos.forEach((p, idx) => {
                    photoStmt.run(`pht_${nanoid(8)}`, id, typeof p === 'string' ? p : p.storage_url || p.url, typeof p === 'object' ? p.caption || null : null, idx, idx === 0 ? 1 : 0);
                });
            }
        });
        insertWishTx();
        const created = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
        const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ?').all(id);
        return { wish: created, photos };
    });
    // Update wish with automatic version history archiving
    fastify.put('/wishes/:id', async (req, reply) => {
        const { id } = req.params;
        const body = req.body;
        const currentWish = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
        if (!currentWish) {
            return reply.code(404).send({ error: 'Wish not found' });
        }
        const currentPhotos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ? ORDER BY sort_order ASC').all(id);
        let folderId = body.folder_id;
        if (folderId) {
            const folderExists = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
            if (!folderExists)
                folderId = null;
        }
        let musicId = body.music_id;
        if (musicId) {
            const trackExists = db.prepare('SELECT id FROM music_tracks WHERE id = ?').get(musicId);
            if (!trackExists)
                musicId = 'trk_1';
        }
        const musicVolume = body.music_volume !== undefined ? parseFloat(body.music_volume) : (currentWish.music_volume ?? 0.8);
        const nextVer = (currentWish.version || 1) + 1;
        const updateWishTx = db.transaction(() => {
            // 1. Archive prior snapshot into wish_versions
            db.prepare(`
        INSERT INTO wish_versions (id, wish_id, version_number, snapshot_data, note)
        VALUES (?, ?, ?, ?, ?)
      `).run(`ver_${nanoid(10)}`, id, currentWish.version || 1, JSON.stringify({ wish: currentWish, photos: currentPhotos }), body.status === 'generated' ? 'Published revision' : 'Draft edit');
            // 2. Update wishes table
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
          music_volume = ?,
          version = ?,
          status = COALESCE(?, status),
          scheduled_for = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            stmt.run(folderId, body.recipient_name, body.recipient_dob, body.recipient_gender, body.wish_text, body.wish_language, body.theme, musicId, body.custom_music_url || null, body.music_trim_start, body.music_trim_end, musicVolume, nextVer, body.status, body.scheduled_for || null, id);
            // Update photos if passed
            if (Array.isArray(body.photos)) {
                db.prepare('DELETE FROM wish_photos WHERE wish_id = ?').run(id);
                const photoStmt = db.prepare('INSERT INTO wish_photos (id, wish_id, storage_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
                body.photos.forEach((p, idx) => {
                    photoStmt.run(`pht_${nanoid(8)}`, id, typeof p === 'string' ? p : p.storage_url || p.url, typeof p === 'object' ? p.caption || null : null, idx, idx === 0 ? 1 : 0);
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
        const { id } = req.params;
        const wish = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
        if (!wish) {
            return reply.code(404).send({ error: 'Wish not found' });
        }
        db.prepare("UPDATE wishes SET status = 'generated', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
        const updated = db.prepare('SELECT * FROM wishes WHERE id = ?').get(id);
        return {
            success: true,
            wish: updated,
            slug: updated.slug,
            share_url: `/w/${updated.slug}`
        };
    });
    // Delete wish
    fastify.delete('/wishes/:id', async (req) => {
        const { id } = req.params;
        db.prepare('DELETE FROM wishes WHERE id = ?').run(id);
        return { success: true, id };
    });
}
