import { db } from '../services/db.service.js';
import { nanoid } from 'nanoid';
import { parseContactsCsv, importContacts } from '../services/csv.service.js';
import { extractUserId } from './auth.routes.js';
export async function contactsRoutes(fastify) {
    // List all contacts with upcoming birthday calculation
    fastify.get('/contacts', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please sign in to view your contacts' });
        }
        const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ?').all(userId);
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const enriched = contacts.map(c => {
            let bdayThisYear = new Date(currentYear, c.dob_month - 1, c.dob_day || 1);
            if (bdayThisYear < new Date(currentYear, currentMonth - 1, currentDay)) {
                bdayThisYear = new Date(currentYear + 1, c.dob_month - 1, c.dob_day || 1);
            }
            const diffTime = bdayThisYear.getTime() - new Date(currentYear, currentMonth - 1, currentDay).getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const ageTurning = c.dob_year ? (bdayThisYear.getFullYear() - c.dob_year) : undefined;
            let extra = {};
            try {
                extra = JSON.parse(c.extra_fields || '{}');
            }
            catch (e) { }
            let notifyDays = [1, 3];
            try {
                notifyDays = JSON.parse(c.notify_days || '[1, 3]');
            }
            catch (e) { }
            return {
                ...c,
                days_remaining: daysRemaining,
                age_turning: ageTurning,
                extra_fields: extra,
                notify_days: notifyDays,
                is_today: daysRemaining === 0
            };
        });
        // Sort by upcoming (daysRemaining ascending)
        enriched.sort((a, b) => a.days_remaining - b.days_remaining);
        return { contacts: enriched, total: enriched.length };
    });
    // Create single contact
    fastify.post('/contacts', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please sign in' });
        }
        const body = req.body;
        if (!body.name || !body.dob_month) {
            return reply.code(400).send({ error: 'Name and Birth Month are required' });
        }
        const id = `cnt_${nanoid(10)}`;
        const stmt = db.prepare(`
      INSERT INTO contacts (id, user_id, name, nickname, dob_day, dob_month, dob_year, gender, relationship, email, phone, avatar_url, note, extra_fields, notify_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, userId, body.name.trim(), body.nickname?.trim() || null, body.dob_day || null, body.dob_month, body.dob_year || null, body.gender || 'unspecified', body.relationship || 'Friend', body.email?.trim() || null, body.phone?.trim() || null, body.avatar_url || null, body.note?.trim() || null, JSON.stringify(body.extra_fields || {}), JSON.stringify(body.notify_days || [1, 3]));
        const created = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(id, userId);
        return { contact: created };
    });
    // Update contact
    fastify.put('/contacts/:id', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please sign in' });
        }
        const { id } = req.params;
        const body = req.body;
        const stmt = db.prepare(`
      UPDATE contacts SET
        name = COALESCE(?, name),
        nickname = ?,
        dob_day = ?,
        dob_month = COALESCE(?, dob_month),
        dob_year = ?,
        gender = COALESCE(?, gender),
        relationship = COALESCE(?, relationship),
        email = ?,
        phone = ?,
        avatar_url = ?,
        note = ?,
        extra_fields = ?,
        notify_days = ?
      WHERE id = ? AND user_id = ?
    `);
        stmt.run(body.name?.trim(), body.nickname?.trim() || null, body.dob_day || null, body.dob_month, body.dob_year || null, body.gender, body.relationship, body.email?.trim() || null, body.phone?.trim() || null, body.avatar_url || null, body.note?.trim() || null, JSON.stringify(body.extra_fields || {}), JSON.stringify(body.notify_days || [1, 3]), id, userId);
        const updated = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(id, userId);
        return { contact: updated };
    });
    // Delete contact
    fastify.delete('/contacts/:id', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please sign in' });
        }
        const { id } = req.params;
        db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(id, userId);
        return { success: true, id };
    });
    // Preview / Parse CSV
    fastify.post('/contacts/csv-preview', async (req) => {
        const body = req.body;
        if (!body.csvContent) {
            return { error: 'No CSV content provided', rows: [] };
        }
        return parseContactsCsv(body.csvContent);
    });
    // Import CSV
    fastify.post('/contacts/import', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please sign in' });
        }
        const body = req.body;
        let rowsToImport = body.rows;
        if (!rowsToImport && body.csvContent) {
            const parsed = parseContactsCsv(body.csvContent);
            rowsToImport = parsed.rows;
        }
        if (!rowsToImport || rowsToImport.length === 0) {
            return { success: false, error: 'No valid rows to import' };
        }
        const result = importContacts(userId, rowsToImport, body.conflictStrategy || 'update');
        return { success: true, ...result };
    });
}
