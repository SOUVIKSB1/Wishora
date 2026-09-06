import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'wishora.db');
export const db = new Database(dbPath);
// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
export function initDatabase() {
    db.exec(`
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
    // Migrate existing tables if columns missing
    try {
        db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'unspecified'");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE users ADD COLUMN user_dob TEXT DEFAULT '2000-01-01'");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN custom_music_url TEXT");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN recipient_gender TEXT DEFAULT 'unspecified'");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN music_trim_start REAL DEFAULT 0");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN music_trim_end REAL DEFAULT 30");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN music_volume REAL DEFAULT 0.8");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN version INTEGER DEFAULT 1");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE wishes ADD COLUMN scheduled_for DATETIME");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE reactions ADD COLUMN message_text TEXT");
    }
    catch (e) { }
    seedMusicTracksOnly();
    seedWishTemplates();
    ensureAdminUser();
}
function seedMusicTracksOnly() {
    const musicCount = db.prepare('SELECT COUNT(*) as count FROM music_tracks').get();
    if (musicCount.count === 0) {
        const musicStmt = db.prepare(`
      INSERT INTO music_tracks (id, title, artist, duration, genre, mood_tags, storage_url, is_premium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        musicStmt.run('trk_1', 'Cinematic Golden Hour', 'Wishora Orchestra', 90, 'Orchestral', JSON.stringify(['uplifting', 'emotional', 'grand']), 'synth://golden_hour', 0);
        musicStmt.run('trk_2', 'Midnight Lofi Nostalgia', 'Aesthetic Beats', 75, 'Lo-fi Chill', JSON.stringify(['chill', 'cozy', 'warm']), 'synth://lofi_midnight', 0);
        musicStmt.run('trk_3', 'Joyful Electric Pop', 'Neon Spark', 80, 'Birthday Classics', JSON.stringify(['energetic', 'fun', 'upbeat']), 'synth://electric_pop', 0);
        musicStmt.run('trk_4', 'Romantic Velvet Acoustic', 'Luna Strings', 85, 'Acoustic', JSON.stringify(['romantic', 'sweet', 'intimate']), 'synth://velvet_acoustic', 0);
        musicStmt.run('trk_5', 'Bollywood Celebration Dhol', 'Desi Vibes', 95, 'Bollywood', JSON.stringify(['festive', 'dance', 'high-energy']), 'synth://bollywood_dhol', 0);
        musicStmt.run('trk_6', 'Celestial Ambient Dreams', 'Cosmic Echo', 100, 'Ambient', JSON.stringify(['dreamy', 'ethereal', 'deep']), 'synth://celestial_ambient', 1);
    }
}
function seedWishTemplates() {
    const count = db.prepare('SELECT COUNT(*) as count FROM wish_templates').get();
    if (count.count === 0) {
        const stmt = db.prepare(`
      INSERT INTO wish_templates (id, title, content, category, tone, language, is_premium)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run('tpl_1', 'Heartfelt Journey & Magic', 'Happy Birthday! May this year bring you boundless joy, golden opportunities, and unforgettable adventures. You illuminate every room you enter, and I am so grateful to celebrate you today.', 'heartfelt', 'warm', 'en', 0);
        stmt.run('tpl_2', 'Playful & Joyful Banter', 'Happy Birthday to someone who is aging like fine wine—and getting funnier by the minute! May your cake be huge, your candles many, and your year utterly extraordinary.', 'playful', 'humorous', 'en', 0);
        stmt.run('tpl_3', 'Deep Poetic Nostalgia', 'Like constellations tracing through the night, every memory we share shines with timeless beauty. Wishing you a birthday as magnificent and radiant as your soul.', 'poetic', 'nostalgic', 'en', 0);
        stmt.run('tpl_4', 'Milestone Grandeur', 'Celebrating an incredible milestone today! Here is to the wisdom of the past, the joy of today, and all the grand chapters waiting to unfold. Cheers to your brilliance!', 'milestone', 'inspirational', 'en', 0);
        stmt.run('tpl_5', 'Romantic Starlight Melody', 'To the one who makes my world spin with starlight and wonder: Happy Birthday, my love. Every moment by your side is a gift, and today I celebrate everything that makes you you.', 'romantic', 'intimate', 'en', 1);
        stmt.run('tpl_6', 'Best Friend Forever', 'Happy Birthday to my partner-in-crime, confidant, and favorite human! Thanks for always being one call away and making life so much brighter. Let us make this year iconic!', 'friendship', 'upbeat', 'en', 0);
    }
}
function ensureAdminUser() {
    const adminEmail = 'souvik@admin.com';
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(adminEmail);
    const passHash = hashPassword('123456@St');
    if (!existing) {
        const adminId = 'usr_admin_master';
        db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role, plan, gender, user_dob, auth_provider)
      VALUES (?, ?, ?, 'Souvik Admin', 'admin', 'vip', 'male', '1998-01-01', 'local')
    `).run(adminId, adminEmail, passHash);
        createDefaultUserFolders(adminId);
    }
    else {
        // Ensure admin credentials and role are guaranteed
        db.prepare(`
      UPDATE users SET
        password_hash = ?,
        role = 'admin',
        plan = 'vip'
      WHERE LOWER(email) = ?
    `).run(passHash, adminEmail);
    }
}
export function createDefaultUserFolders(userId) {
    const existing = db.prepare('SELECT COUNT(*) as count FROM folders WHERE user_id = ?').get(userId);
    if (existing.count === 0) {
        const folderStmt = db.prepare('INSERT INTO folders (id, user_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)');
        folderStmt.run(`fld_${nanoid(8)}`, userId, 'My Wishes', '#EAB308', 0);
        folderStmt.run(`fld_${nanoid(8)}`, userId, 'Family', '#DB2777', 1);
        folderStmt.run(`fld_${nanoid(8)}`, userId, 'Close Friends', '#2563EB', 2);
        folderStmt.run(`fld_${nanoid(8)}`, userId, 'Colleagues', '#10B981', 3);
    }
}
