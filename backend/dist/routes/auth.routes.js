import { db } from '../services/db.service.js';
export async function authRoutes(fastify) {
    const defaultUserId = 'usr_default_master';
    fastify.get('/auth/me', async () => {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(defaultUserId);
        const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM wishes WHERE user_id = ?) as total_wishes,
        (SELECT COALESCE(SUM(open_count), 0) FROM wishes WHERE user_id = ?) as total_opens,
        (SELECT COUNT(*) FROM contacts WHERE user_id = ?) as total_contacts,
        (SELECT COUNT(*) FROM reactions r JOIN wishes w ON r.wish_id = w.id WHERE w.user_id = ?) as total_reactions
    `).get(defaultUserId, defaultUserId, defaultUserId, defaultUserId);
        // Calculate user's personal birthday countdown
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
    fastify.put('/auth/me', async (req) => {
        const body = req.body;
        db.prepare(`
      UPDATE users SET
        display_name = COALESCE(?, display_name),
        avatar_url = COALESCE(?, avatar_url),
        user_dob = COALESCE(?, user_dob),
        plan = COALESCE(?, plan)
      WHERE id = ?
    `).run(body.display_name !== undefined ? body.display_name : null, body.avatar_url !== undefined ? body.avatar_url : null, body.user_dob !== undefined ? body.user_dob : null, body.plan !== undefined ? body.plan : null, defaultUserId);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(defaultUserId);
        const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM wishes WHERE user_id = ?) as total_wishes,
        (SELECT COALESCE(SUM(open_count), 0) FROM wishes WHERE user_id = ?) as total_opens,
        (SELECT COUNT(*) FROM contacts WHERE user_id = ?) as total_contacts,
        (SELECT COUNT(*) FROM reactions r JOIN wishes w ON r.wish_id = w.id WHERE w.user_id = ?) as total_reactions
    `).get(defaultUserId, defaultUserId, defaultUserId, defaultUserId);
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
}
