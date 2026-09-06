import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
export const isPostgres = !!process.env.DATABASE_URL;
let pgPool = null;
let sqliteDb = null;
if (isPostgres) {
    console.log('⚡ Initializing Neon PostgreSQL connection pool...');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });
}
else {
    console.log('📦 Using local SQLite database...');
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'wishora.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
}
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
/**
 * Converts SQLite "?" placeholders and syntax to Postgres "$1, $2, $3..." format
 */
export function convertSql(sql) {
    if (!isPostgres)
        return sql;
    let modified = sql;
    if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(modified)) {
        modified = modified.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
        if (!/ON\s+CONFLICT/i.test(modified)) {
            modified = modified.trim() + ' ON CONFLICT DO NOTHING';
        }
    }
    let paramIndex = 1;
    return modified.replace(/\?/g, () => `$${paramIndex++}`);
}
/**
 * Unified Database Interface with async promise support and SQLite fallback
 */
export const db = {
    isPostgres,
    async query(sql, params = []) {
        if (isPostgres && pgPool) {
            const converted = convertSql(sql);
            const res = await pgPool.query(converted, params);
            return res.rows;
        }
        else if (sqliteDb) {
            const stmt = sqliteDb.prepare(sql);
            return stmt.all(...params);
        }
        return [];
    },
    async get(sql, params = []) {
        if (isPostgres && pgPool) {
            const converted = convertSql(sql);
            const res = await pgPool.query(converted, params);
            return res.rows[0];
        }
        else if (sqliteDb) {
            const stmt = sqliteDb.prepare(sql);
            return stmt.get(...params);
        }
        return undefined;
    },
    async all(sql, params = []) {
        return this.query(sql, params);
    },
    async run(sql, params = []) {
        if (isPostgres && pgPool) {
            const converted = convertSql(sql);
            const res = await pgPool.query(converted, params);
            return { rowCount: res.rowCount || 0 };
        }
        else if (sqliteDb) {
            const stmt = sqliteDb.prepare(sql);
            const res = stmt.run(...params);
            return { rowCount: res.changes };
        }
        return { rowCount: 0 };
    },
    async exec(sql) {
        if (isPostgres && pgPool) {
            await pgPool.query(sql);
        }
        else if (sqliteDb) {
            sqliteDb.exec(sql);
        }
    },
    async transaction(fn) {
        if (isPostgres && pgPool) {
            const client = await pgPool.connect();
            try {
                await client.query('BEGIN');
                const res = await fn();
                await client.query('COMMIT');
                return res;
            }
            catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
            finally {
                client.release();
            }
        }
        else if (sqliteDb) {
            return (sqliteDb.transaction(fn))();
        }
        return fn();
    },
    prepare(sql) {
        return {
            get: async (...params) => db.get(sql, params),
            all: async (...params) => db.all(sql, params),
            run: async (...params) => db.run(sql, params)
        };
    }
};
export async function initDatabase() {
    if (isPostgres && pgPool) {
        console.log('⚡ Running Neon PostgreSQL migrations and schema setup...');
        await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        display_name TEXT,
        avatar_url TEXT,
        gender VARCHAR(32) DEFAULT 'unspecified',
        user_dob VARCHAR(32) DEFAULT '2000-01-01',
        google_id VARCHAR(255) UNIQUE,
        auth_provider VARCHAR(32) DEFAULT 'local',
        role VARCHAR(32) DEFAULT 'user',
        plan VARCHAR(32) DEFAULT 'free',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        nickname TEXT,
        dob_day INTEGER,
        dob_month INTEGER NOT NULL,
        dob_year INTEGER,
        gender VARCHAR(32),
        relationship VARCHAR(64),
        email VARCHAR(255),
        phone VARCHAR(64),
        avatar_url TEXT,
        note TEXT,
        extra_fields TEXT DEFAULT '{}',
        notify_days TEXT DEFAULT '[1, 3]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS folders (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color VARCHAR(32) DEFAULT '#C8A96E',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS music_tracks (
        id VARCHAR(64) PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        duration INTEGER DEFAULT 60,
        genre VARCHAR(64),
        mood_tags TEXT DEFAULT '[]',
        storage_url TEXT NOT NULL,
        preview_url TEXT,
        is_premium INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS wishes (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        folder_id VARCHAR(64) REFERENCES folders(id) ON DELETE SET NULL,
        contact_id VARCHAR(64) REFERENCES contacts(id) ON DELETE SET NULL,
        slug VARCHAR(128) UNIQUE NOT NULL,
        recipient_name TEXT NOT NULL,
        recipient_dob VARCHAR(32) NOT NULL,
        recipient_gender VARCHAR(32) DEFAULT 'unspecified',
        wish_text TEXT,
        wish_language VARCHAR(32) DEFAULT 'en',
        theme VARCHAR(64) DEFAULT 'auto',
        music_id VARCHAR(64) REFERENCES music_tracks(id) ON DELETE SET NULL,
        custom_music_url TEXT,
        music_trim_start NUMERIC DEFAULT 0,
        music_trim_end NUMERIC DEFAULT 30,
        music_volume NUMERIC DEFAULT 0.8,
        version INTEGER DEFAULT 1,
        status VARCHAR(32) DEFAULT 'draft',
        scheduled_for TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        open_count INTEGER DEFAULT 0,
        last_opened_at TIMESTAMP WITH TIME ZONE,
        reaction_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_photos (
        id VARCHAR(64) PRIMARY KEY,
        wish_id VARCHAR(64) REFERENCES wishes(id) ON DELETE CASCADE,
        storage_url TEXT NOT NULL,
        caption TEXT,
        sort_order INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_opens (
        id VARCHAR(64) PRIMARY KEY,
        wish_id VARCHAR(64) REFERENCES wishes(id) ON DELETE CASCADE,
        ip_hash VARCHAR(128),
        country VARCHAR(32) DEFAULT 'US',
        device_type VARCHAR(64) DEFAULT 'Mobile',
        opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id VARCHAR(64) PRIMARY KEY,
        wish_id VARCHAR(64) REFERENCES wishes(id) ON DELETE CASCADE,
        type VARCHAR(32) DEFAULT 'video',
        message_text TEXT,
        media_url TEXT,
        duration NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_versions (
        id VARCHAR(64) PRIMARY KEY,
        wish_id VARCHAR(64) REFERENCES wishes(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        snapshot_data TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_templates (
        id VARCHAR(64) PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(64) DEFAULT 'heartfelt',
        tone VARCHAR(64) DEFAULT 'warm',
        language VARCHAR(32) DEFAULT 'en',
        is_premium INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(32) DEFAULT 'announcement',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    }
    else if (sqliteDb) {
        sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        display_name TEXT,
        avatar_url TEXT,
        gender TEXT DEFAULT 'unspecified',
        user_dob TEXT DEFAULT '2000-01-01',
        google_id TEXT UNIQUE,
        auth_provider TEXT DEFAULT 'local',
        role TEXT DEFAULT 'user',
        plan TEXT DEFAULT 'free',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        nickname TEXT,
        dob_day INTEGER,
        dob_month INTEGER NOT NULL,
        dob_year INTEGER,
        gender TEXT,
        relationship TEXT,
        email TEXT,
        phone TEXT,
        avatar_url TEXT,
        note TEXT,
        extra_fields TEXT DEFAULT '{}',
        notify_days TEXT DEFAULT '[1, 3]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#C8A96E',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS music_tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        duration INTEGER DEFAULT 60,
        genre TEXT,
        mood_tags TEXT DEFAULT '[]',
        storage_url TEXT NOT NULL,
        preview_url TEXT,
        is_premium INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
        contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
        slug TEXT UNIQUE NOT NULL,
        recipient_name TEXT NOT NULL,
        recipient_dob TEXT NOT NULL,
        recipient_gender TEXT,
        wish_text TEXT,
        wish_language TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'auto',
        music_id TEXT REFERENCES music_tracks(id),
        custom_music_url TEXT,
        music_trim_start REAL DEFAULT 0,
        music_trim_end REAL DEFAULT 30,
        music_volume REAL DEFAULT 0.8,
        version INTEGER DEFAULT 1,
        status TEXT DEFAULT 'draft',
        scheduled_for DATETIME,
        expires_at DATETIME,
        open_count INTEGER DEFAULT 0,
        last_opened_at DATETIME,
        reaction_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_photos (
        id TEXT PRIMARY KEY,
        wish_id TEXT REFERENCES wishes(id) ON DELETE CASCADE,
        storage_url TEXT NOT NULL,
        caption TEXT,
        sort_order INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_opens (
        id TEXT PRIMARY KEY,
        wish_id TEXT REFERENCES wishes(id) ON DELETE CASCADE,
        ip_hash TEXT,
        country TEXT DEFAULT 'US',
        device_type TEXT DEFAULT 'Mobile',
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY,
        wish_id TEXT REFERENCES wishes(id) ON DELETE CASCADE,
        type TEXT DEFAULT 'video',
        message_text TEXT,
        media_url TEXT,
        duration REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_versions (
        id TEXT PRIMARY KEY,
        wish_id TEXT REFERENCES wishes(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        snapshot_data TEXT NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wish_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'heartfelt',
        tone TEXT DEFAULT 'warm',
        language TEXT DEFAULT 'en',
        is_premium INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'announcement',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    }
    await seedMusicTracksOnly();
    await seedWishTemplates();
    await ensureAdminUser();
    console.log('✅ Database initialized successfully!');
}
async function seedMusicTracksOnly() {
    const countRes = await db.get('SELECT COUNT(*) as count FROM music_tracks');
    const count = Number(countRes?.count || 0);
    if (count === 0) {
        const tracks = [
            { id: 'trk_1', title: 'Cinematic Golden Hour', artist: 'Wishora Orchestra', duration: 90, genre: 'Orchestral', tags: JSON.stringify(['uplifting', 'emotional', 'grand']), url: 'synth://golden_hour', premium: 0 },
            { id: 'trk_2', title: 'Midnight Lofi Nostalgia', artist: 'Aesthetic Beats', duration: 75, genre: 'Lo-fi Chill', tags: JSON.stringify(['chill', 'cozy', 'warm']), url: 'synth://lofi_midnight', premium: 0 },
            { id: 'trk_3', title: 'Joyful Electric Pop', artist: 'Neon Spark', duration: 80, genre: 'Birthday Classics', tags: JSON.stringify(['energetic', 'fun', 'upbeat']), url: 'synth://electric_pop', premium: 0 },
            { id: 'trk_4', title: 'Romantic Velvet Acoustic', artist: 'Luna Strings', duration: 85, genre: 'Acoustic', tags: JSON.stringify(['romantic', 'sweet', 'intimate']), url: 'synth://velvet_acoustic', premium: 0 },
            { id: 'trk_5', title: 'Bollywood Celebration Dhol', artist: 'Desi Vibes', duration: 95, genre: 'Bollywood', tags: JSON.stringify(['festive', 'dance', 'high-energy']), url: 'synth://bollywood_dhol', premium: 0 },
            { id: 'trk_6', title: 'Celestial Ambient Dreams', artist: 'Cosmic Echo', duration: 100, genre: 'Ambient', tags: JSON.stringify(['dreamy', 'ethereal', 'deep']), url: 'synth://celestial_ambient', premium: 1 },
        ];
        for (const t of tracks) {
            await db.run('INSERT INTO music_tracks (id, title, artist, duration, genre, mood_tags, storage_url, is_premium) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [t.id, t.title, t.artist, t.duration, t.genre, t.tags, t.url, t.premium]);
        }
    }
}
async function seedWishTemplates() {
    const countRes = await db.get('SELECT COUNT(*) as count FROM wish_templates');
    const count = Number(countRes?.count || 0);
    if (count === 0) {
        const templates = [
            { id: 'tpl_1', title: 'Heartfelt Journey & Magic', content: 'Happy Birthday! May this year bring you boundless joy, golden opportunities, and unforgettable adventures. You illuminate every room you enter, and I am so grateful to celebrate you today.', category: 'heartfelt', tone: 'warm', language: 'en', is_premium: 0 },
            { id: 'tpl_2', title: 'Playful & Joyful Banter', content: 'Happy Birthday to someone who is aging like fine wine—and getting funnier by the minute! May your cake be huge, your candles many, and your year utterly extraordinary.', category: 'playful', tone: 'humorous', language: 'en', is_premium: 0 },
            { id: 'tpl_3', title: 'Deep Poetic Nostalgia', content: 'Like constellations tracing through the night, every memory we share shines with timeless beauty. Wishing you a birthday as magnificent and radiant as your soul.', category: 'poetic', tone: 'nostalgic', language: 'en', is_premium: 0 },
            { id: 'tpl_4', title: 'Milestone Grandeur', content: 'Celebrating an incredible milestone today! Here is to the wisdom of the past, the joy of today, and all the grand chapters waiting to unfold. Cheers to your brilliance!', category: 'milestone', tone: 'inspirational', language: 'en', is_premium: 0 },
            { id: 'tpl_5', title: 'Romantic Starlight Melody', content: 'To the one who makes my world spin with starlight and wonder: Happy Birthday, my love. Every moment by your side is a gift, and today I celebrate everything that makes you you.', category: 'romantic', tone: 'intimate', language: 'en', is_premium: 1 },
            { id: 'tpl_6', title: 'Best Friend Forever', content: 'Happy Birthday to my partner-in-crime, confidant, and favorite human! Thanks for always being one call away and making life so much brighter. Let us make this year iconic!', category: 'friendship', tone: 'upbeat', language: 'en', is_premium: 0 }
        ];
        for (const tpl of templates) {
            await db.run('INSERT INTO wish_templates (id, title, content, category, tone, language, is_premium) VALUES (?, ?, ?, ?, ?, ?, ?)', [tpl.id, tpl.title, tpl.content, tpl.category, tpl.tone, tpl.language, tpl.is_premium]);
        }
    }
}
async function ensureAdminUser() {
    const adminEmail = 'souvik@admin.com';
    const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [adminEmail]);
    const passHash = hashPassword('123456@St');
    if (!existing) {
        const adminId = 'usr_admin_master';
        await db.run(`INSERT INTO users (id, email, password_hash, display_name, role, plan, gender, user_dob, auth_provider)
       VALUES (?, ?, ?, 'Souvik Admin', 'admin', 'vip', 'male', '1998-01-01', 'local')`, [adminId, adminEmail, passHash]);
        await createDefaultUserFolders(adminId);
        console.log('👑 Admin user souvik@admin.com created successfully');
    }
    else {
        await db.run(`UPDATE users SET
         password_hash = ?,
         role = 'admin',
         plan = 'vip'
       WHERE LOWER(email) = LOWER(?)`, [passHash, adminEmail]);
        console.log('👑 Admin user souvik@admin.com credentials verified');
    }
}
export async function createDefaultUserFolders(userId) {
    const existingRes = await db.get('SELECT COUNT(*) as count FROM folders WHERE user_id = ?', [userId]);
    const count = Number(existingRes?.count || 0);
    if (count === 0) {
        await db.run('INSERT INTO folders (id, user_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)', [`fld_${nanoid(8)}`, userId, 'My Wishes', '#EAB308', 0]);
        await db.run('INSERT INTO folders (id, user_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)', [`fld_${nanoid(8)}`, userId, 'Family', '#DB2777', 1]);
        await db.run('INSERT INTO folders (id, user_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)', [`fld_${nanoid(8)}`, userId, 'Close Friends', '#2563EB', 2]);
        await db.run('INSERT INTO folders (id, user_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)', [`fld_${nanoid(8)}`, userId, 'Colleagues', '#10B981', 3]);
    }
}
