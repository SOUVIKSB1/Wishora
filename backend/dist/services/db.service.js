import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'wishora.db');
export const db = new Database(dbPath);
// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');
export function initDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      user_dob TEXT DEFAULT '1998-05-20',
      google_id TEXT UNIQUE,
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
  `);
    // Migrate existing tables if columns missing
    try {
        db.exec("ALTER TABLE users ADD COLUMN user_dob TEXT DEFAULT '1998-05-20'");
    }
    catch (e) { }
    try {
        db.exec("ALTER TABLE reactions ADD COLUMN message_text TEXT");
    }
    catch (e) { }
    seedInitialData();
}
function seedInitialData() {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const defaultUserId = 'usr_default_master';
        db.prepare(`
      INSERT INTO users (id, email, display_name, avatar_url, user_dob, plan)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(defaultUserId, 'director@wishora.app', 'Souvik Sinhababu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', '1998-05-20', 'premium');
        // Seed Folders
        const folderStmt = db.prepare('INSERT INTO folders (id, user_id, name, color, sort_order) VALUES (?, ?, ?, ?, ?)');
        folderStmt.run('fld_1', defaultUserId, 'My Wishes', '#EAB308', 0);
        folderStmt.run('fld_2', defaultUserId, 'Family', '#DB2777', 1);
        folderStmt.run('fld_3', defaultUserId, 'Close Friends', '#2563EB', 2);
        folderStmt.run('fld_4', defaultUserId, 'Colleagues', '#10B981', 3);
        // Seed Music Tracks
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
        // Seed initial Contacts
        const contactStmt = db.prepare(`
      INSERT INTO contacts (id, user_id, name, nickname, dob_day, dob_month, dob_year, gender, relationship, email, phone, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        contactStmt.run('cnt_1', defaultUserId, 'Aarav Sharma', 'Rockstar', (currentDay + 3) % 28 || 1, currentMonth, 1998, 'male', 'Best Friend', 'aarav@example.com', '+91 9876543210', 'Loves rock music, coffee addict');
        contactStmt.run('cnt_2', defaultUserId, 'Ananya Sen', 'Annie', (currentDay + 7) % 28 || 2, currentMonth, 2001, 'female', 'Sister', 'ananya@example.com', '+91 9876543211', 'Loves vintage films & photography');
        contactStmt.run('cnt_3', defaultUserId, 'Leo Mukherjee', 'Little Champ', (currentDay + 14) % 28 || 3, currentMonth, 2018, 'child', 'Nephew', 'leo@example.com', '', 'Obsessed with dinosaurs');
        contactStmt.run('cnt_4', defaultUserId, 'Prof. Robert Vance', 'Doc', 15, (currentMonth % 12) + 1, 1965, 'male', 'Mentor', 'robert@example.com', '+1 555-0199', 'Enjoys classical jazz and history books');
        // Seed a featured demo wish experience
        const demoWishId = 'wsh_demo_cinematic';
        const demoSlug = 'magic-birthday-2026';
        db.prepare(`
      INSERT INTO wishes (
        id, user_id, folder_id, contact_id, slug, recipient_name, recipient_dob,
        recipient_gender, wish_text, wish_language, theme, music_id, status, open_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(demoWishId, defaultUserId, 'fld_3', 'cnt_2', demoSlug, 'Ananya', '2001-03-14', 'female', 'May your journey ahead shimmer with effortless joy, boundless wonder, and all the magic you bring into every room you step into. You deserve the world and more. Happy Birthday! ✨', 'en', 'rose', 'trk_1', 'generated', 5);
        // Photos for demo wish
        const photoStmt = db.prepare('INSERT INTO wish_photos (id, wish_id, storage_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
        photoStmt.run(nanoid(8), demoWishId, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', 'Golden memories & radiant smiles', 0, 1);
        photoStmt.run(nanoid(8), demoWishId, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80', 'Another unforgettable trip together', 1, 0);
        photoStmt.run(nanoid(8), demoWishId, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80', 'Here is to endless laughter ahead!', 2, 0);
    }
}
