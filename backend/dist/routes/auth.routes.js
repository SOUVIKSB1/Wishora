import { db, createDefaultUserFolders } from '../services/db.service.js';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
export function extractUserId(req) {
    const authHeader = req.headers.authorization || req.headers['x-user-id'];
    if (!authHeader)
        return null;
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }
    return authHeader.trim();
}
export async function authRoutes(fastify) {
    // Register with email, password, name, dob, gender
    fastify.post('/auth/register', async (req, reply) => {
        const body = req.body;
        if (!body.email || !body.password || !body.display_name) {
            return reply.code(400).send({ error: 'Email, password, and name are required' });
        }
        const email = body.email.trim().toLowerCase();
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
        if (existing) {
            return reply.code(409).send({ error: 'An account with this email already exists' });
        }
        const userId = `usr_${nanoid(10)}`;
        const passHash = hashPassword(body.password);
        const dob = body.user_dob || '2000-01-01';
        const gender = body.gender || 'unspecified';
        const displayName = body.display_name.trim();
        const avatarUrl = body.avatar_url || null;
        db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, avatar_url, gender, user_dob, auth_provider, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'local', 'free')
    `).run(userId, email, passHash, displayName, avatarUrl, gender, dob);
        createDefaultUserFolders(userId);
        const created = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE id = ?').get(userId);
        return { user: created, token: userId };
    });
    // Login with email & password
    fastify.post('/auth/login', async (req, reply) => {
        const body = req.body;
        if (!body.email || !body.password) {
            return reply.code(400).send({ error: 'Email and password are required' });
        }
        const email = body.email.trim().toLowerCase();
        const passHash = hashPassword(body.password);
        const user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, password_hash FROM users WHERE LOWER(email) = ?').get(email);
        if (!user || user.password_hash !== passHash) {
            return reply.code(401).send({ error: 'Invalid email or password' });
        }
        delete user.password_hash;
        return { user, token: user.id };
    });
    // Google Firebase Auth Sync (Direct Login if user exists, else prompt onboarding)
    fastify.post('/auth/google', async (req, reply) => {
        const body = req.body;
        if (!body.email) {
            return reply.code(400).send({ error: 'Google email is required' });
        }
        const email = body.email.trim().toLowerCase();
        const googleId = body.google_id || body.uid || null;
        let user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE LOWER(email) = ? OR (google_id IS NOT NULL AND google_id = ?)').get(email, googleId);
        if (user) {
            // Returning user -> Direct immediate login with zero DOB/gender friction
            if (googleId || body.avatar_url) {
                db.prepare(`
          UPDATE users SET
            google_id = COALESCE(?, google_id),
            avatar_url = COALESCE(avatar_url, ?)
          WHERE id = ?
        `).run(googleId, body.avatar_url || null, user.id);
            }
            user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE id = ?').get(user.id);
            return { user, token: user.id, is_new_user: false };
        }
        // New Google user -> Return flag so client prompts DOB & gender once
        return {
            is_new_user: true,
            google_data: {
                email,
                google_id: googleId,
                display_name: body.display_name || email.split('@')[0],
                avatar_url: body.avatar_url || null
            }
        };
    });
    // Google First-Time Onboarding Completion
    fastify.post('/auth/google-complete', async (req, reply) => {
        const body = req.body;
        if (!body.email) {
            return reply.code(400).send({ error: 'Email is required' });
        }
        const email = body.email.trim().toLowerCase();
        const googleId = body.google_id || null;
        let user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE LOWER(email) = ?').get(email);
        if (user) {
            db.prepare(`
        UPDATE users SET
          display_name = COALESCE(?, display_name),
          avatar_url = COALESCE(?, avatar_url),
          gender = COALESCE(?, gender),
          user_dob = COALESCE(?, user_dob),
          google_id = COALESCE(?, google_id)
        WHERE id = ?
      `).run(body.display_name || user.display_name, body.avatar_url || user.avatar_url, body.gender || user.gender, body.user_dob || user.user_dob, googleId || user.google_id, user.id);
            user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE id = ?').get(user.id);
            return { user, token: user.id };
        }
        const userId = `usr_${nanoid(10)}`;
        const dob = body.user_dob || '2000-01-01';
        const gender = body.gender || 'unspecified';
        const displayName = body.display_name || email.split('@')[0];
        const avatarUrl = body.avatar_url || null;
        db.prepare(`
      INSERT INTO users (id, email, display_name, avatar_url, gender, user_dob, google_id, auth_provider, role, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'google', 'user', 'free')
    `).run(userId, email, displayName, avatarUrl, gender, dob, googleId);
        createDefaultUserFolders(userId);
        const created = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE id = ?').get(userId);
        return { user: created, token: created.id };
    });
    // Get current user profile & isolated dashboard stats
    fastify.get('/auth/me', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please log in' });
        }
        const user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE id = ?').get(userId);
        if (!user) {
            return reply.code(401).send({ error: 'User session expired or not found' });
        }
        const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM wishes WHERE user_id = ?) as total_wishes,
        (SELECT COALESCE(SUM(open_count), 0) FROM wishes WHERE user_id = ?) as total_opens,
        (SELECT COUNT(*) FROM contacts WHERE user_id = ?) as total_contacts,
        (SELECT COUNT(*) FROM reactions r JOIN wishes w ON r.wish_id = w.id WHERE w.user_id = ?) as total_reactions
    `).get(userId, userId, userId, userId);
        let userBirthdayData = null;
        if (user.user_dob) {
            const dobParts = user.user_dob.split('-');
            const birthYear = parseInt(dobParts[0], 10);
            const birthMonth = parseInt(dobParts[1], 10);
            const birthDay = parseInt(dobParts[2], 10);
            const now = new Date();
            const currentYear = now.getFullYear();
            let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
            if (nextBirthday < new Date(currentYear, now.getMonth(), now.getDate())) {
                nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
            }
            const diffTime = nextBirthday.getTime() - new Date(currentYear, now.getMonth(), now.getDate()).getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const ageTurning = nextBirthday.getFullYear() - birthYear;
            userBirthdayData = {
                dob: user.user_dob,
                birth_month: birthMonth,
                birth_day: birthDay,
                next_birthday_iso: nextBirthday.toISOString(),
                days_remaining: daysRemaining,
                age_turning: ageTurning,
                is_today: daysRemaining === 0
            };
        }
        return { user: { ...user, birthday_info: userBirthdayData }, stats };
    });
    // Update current user profile
    fastify.put('/auth/me', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized: Please log in' });
        }
        const body = req.body;
        db.prepare(`
      UPDATE users SET
        display_name = COALESCE(?, display_name),
        avatar_url = COALESCE(?, avatar_url),
        gender = COALESCE(?, gender),
        user_dob = COALESCE(?, user_dob),
        plan = COALESCE(?, plan)
      WHERE id = ?
    `).run(body.display_name !== undefined ? body.display_name : null, body.avatar_url !== undefined ? body.avatar_url : null, body.gender !== undefined ? body.gender : null, body.user_dob !== undefined ? body.user_dob : null, body.plan !== undefined ? body.plan : null, userId);
        const user = db.prepare('SELECT id, email, display_name, avatar_url, gender, user_dob, role, plan, created_at FROM users WHERE id = ?').get(userId);
        const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM wishes WHERE user_id = ?) as total_wishes,
        (SELECT COALESCE(SUM(open_count), 0) FROM wishes WHERE user_id = ?) as total_opens,
        (SELECT COUNT(*) FROM contacts WHERE user_id = ?) as total_contacts,
        (SELECT COUNT(*) FROM reactions r JOIN wishes w ON r.wish_id = w.id WHERE w.user_id = ?) as total_reactions
    `).get(userId, userId, userId, userId);
        let userBirthdayData = null;
        if (user?.user_dob) {
            const dobParts = user.user_dob.split('-');
            const birthYear = parseInt(dobParts[0], 10);
            const birthMonth = parseInt(dobParts[1], 10);
            const birthDay = parseInt(dobParts[2], 10);
            const now = new Date();
            const currentYear = now.getFullYear();
            let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
            if (nextBirthday < new Date(currentYear, now.getMonth(), now.getDate())) {
                nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
            }
            const diffTime = nextBirthday.getTime() - new Date(currentYear, now.getMonth(), now.getDate()).getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const ageTurning = nextBirthday.getFullYear() - birthYear;
            userBirthdayData = {
                dob: user.user_dob,
                birth_month: birthMonth,
                birth_day: birthDay,
                next_birthday_iso: nextBirthday.toISOString(),
                days_remaining: daysRemaining,
                age_turning: ageTurning,
                is_today: daysRemaining === 0
            };
        }
        return { user: { ...user, birthday_info: userBirthdayData }, stats };
    });
    // User notifications (broadcast + user-specific)
    fastify.get('/auth/notifications', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const notifications = db.prepare(`
      SELECT * FROM system_notifications
      WHERE user_id IS NULL OR user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(userId);
        return { notifications };
    });
    // Mark notification as read
    fastify.post('/auth/notifications/:id/read', async (req, reply) => {
        const userId = extractUserId(req);
        if (!userId)
            return reply.code(401).send({ error: 'Unauthorized' });
        const { id } = req.params;
        db.prepare('UPDATE system_notifications SET is_read = 1 WHERE id = ?').run(id);
        return { success: true };
    });
}
