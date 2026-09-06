import { FastifyInstance } from 'fastify';
import { db } from '../services/db.service.js';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

export async function publicRoutes(fastify: FastifyInstance) {
  // Public Wish Experience Data (NO AUTH)
  fastify.get('/w/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };

    const wish = db.prepare(`
      SELECT w.*, 
             COALESCE(c.avatar_url, (SELECT c2.avatar_url FROM contacts c2 WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM(w.recipient_name)) LIMIT 1)) as recipient_avatar_url,
             COALESCE(w.recipient_gender, c.gender, (SELECT c3.gender FROM contacts c3 WHERE LOWER(TRIM(c3.name)) = LOWER(TRIM(w.recipient_name)) LIMIT 1), 'unspecified') as recipient_gender,
             COALESCE(u.display_name, 'Souvik Sinhababu') as sender_name,
             u.avatar_url as sender_avatar,
             u.plan as sender_plan,
             m.title as music_title,
             m.artist as music_artist,
             m.genre as music_genre,
             m.storage_url as music_storage_url
      FROM wishes w
      LEFT JOIN contacts c ON w.contact_id = c.id
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN music_tracks m ON w.music_id = m.id
      WHERE w.slug = ?
    `).get(slug) as any;

    if (!wish) {
      return reply.code(404).send({ error: 'Wish experience not found' });
    }

    const photos = db.prepare('SELECT * FROM wish_photos WHERE wish_id = ? ORDER BY sort_order ASC').all(wish.id);
    const reactions = db.prepare('SELECT * FROM reactions WHERE wish_id = ? ORDER BY created_at DESC').all(wish.id);

    // Calculate age & birthday timing
    const dob = new Date(wish.recipient_dob);
    const today = new Date();
    
    let age = today.getFullYear() - dob.getFullYear();
    const isBirthdayPassed = (today.getMonth() > dob.getMonth()) || 
                             (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    
    // Determine resolved theme
    let resolvedTheme = wish.theme;
    if (resolvedTheme === 'auto') {
      if (age < 15) resolvedTheme = 'candy';
      else if (wish.recipient_gender === 'female' && age <= 45) resolvedTheme = 'rose';
      else if (wish.recipient_gender === 'male' && age <= 45) resolvedTheme = 'electric';
      else if (age > 45) resolvedTheme = 'gold';
      else resolvedTheme = 'cosmic';
    }

    // Milestones for journey screen with rich nostalgic trivia & hooks
    const birthYear = dob.getFullYear();
    const currentYear = today.getFullYear();
    const milestones = [
      { 
        year: birthYear, 
        age: 0, 
        title: 'The World Welcomed You', 
        description: 'A brand new star began to illuminate the universe with warmth and wonder.',
        tag: 'Birth Year',
        trivia: 'A timeless chapter began.'
      },
      { 
        year: birthYear + 5, 
        age: 5, 
        title: 'Days of Boundless Curiosity', 
        description: 'First steps, scraped knees, endless playground laughter, and unbridled imagination.',
        tag: 'Childhood Magic',
        trivia: 'Discovering cartoons, playground castles and pure joy.'
      },
      { 
        year: birthYear + 12, 
        age: 12, 
        title: 'Growing Passions & Dreams', 
        description: 'School hallways, secret mixtapes, true friendships, and unlocking who you are.',
        tag: 'Golden Wonder',
        trivia: 'The era of late-night chats and discovering favorite music.'
      },
      { 
        year: birthYear + 18, 
        age: 18, 
        title: 'Stepping into the World', 
        description: 'Unlocking wings, taking bold leaps, embracing freedom, and forging your own legacy.',
        tag: 'New Horizons',
        trivia: 'The beginning of independent adventures.'
      },
      { 
        year: currentYear, 
        age: age, 
        title: `Celebrating ${age} Magnificent Years`, 
        description: 'Here is to all your brilliance, resilience, and every beautiful memory yet to be created ✨',
        tag: 'Milestone Today',
        trivia: 'Standing tall, loved by many, and ready for what lies ahead.'
      }
    ].filter(m => m.year <= currentYear);

    return {
      wish: {
        ...wish,
        resolved_theme: resolvedTheme,
        age_turning: age,
        birth_year: birthYear
      },
      photos,
      reactions,
      milestones
    };
  });

  // Log open event
  fastify.post('/w/:slug/open', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const wish = db.prepare('SELECT id FROM wishes WHERE slug = ?').get(slug) as { id: string } | undefined;

    if (!wish) {
      return reply.code(404).send({ error: 'Wish not found' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(String(ip)).digest('hex').substring(0, 16);
    const userAgent = String(req.headers['user-agent'] || '');
    const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
    const deviceType = isMobile ? 'Mobile' : 'Desktop';

    // Insert open record
    db.prepare(`
      INSERT INTO wish_opens (id, wish_id, ip_hash, country, device_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(`opn_${nanoid(8)}`, wish.id, ipHash, 'US', deviceType);

    // Update wish open count
    db.prepare(`
      UPDATE wishes SET open_count = open_count + 1, last_opened_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(wish.id);

    return { success: true };
  });

  // Submit multi-modal reaction
  fastify.post('/w/:slug/react', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const body = req.body as { media_url?: string; type?: string; message_text?: string; duration?: number };

    const wish = db.prepare('SELECT id FROM wishes WHERE slug = ?').get(slug) as { id: string } | undefined;
    if (!wish) {
      return reply.code(404).send({ error: 'Wish not found' });
    }

    const reactionId = `rct_${nanoid(10)}`;
    const mediaUrl = body.media_url || (body.type === 'video' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' : '');
    const messageText = body.message_text || '';

    db.prepare(`
      INSERT INTO reactions (id, wish_id, type, message_text, media_url, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reactionId, wish.id, body.type || 'text', messageText, mediaUrl, body.duration || 0);

    // Update wish reaction_url & touch timestamp
    const displayUrl = mediaUrl || (body.type === 'text' ? 'text_reaction' : 'voice_reaction');
    db.prepare('UPDATE wishes SET reaction_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(displayUrl, wish.id);

    return { success: true, reactionId };
  });
}
