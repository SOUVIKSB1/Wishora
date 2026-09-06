import Papa from 'papaparse';
import { db } from './db.service.js';
import { nanoid } from 'nanoid';
export function parseContactsCsv(csvContent) {
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase()
    });
    const recognizedHeaders = ['name', 'fullname', 'full_name', 'dob', 'birthday', 'date_of_birth', 'gender', 'sex', 'nickname', 'email', 'phone', 'relationship', 'note', 'notes'];
    const rows = parsed.data.map((raw) => {
        // Find name
        const name = raw['name'] || raw['fullname'] || raw['full_name'] || raw['contact_name'] || '';
        const nickname = raw['nickname'] || '';
        const dobRaw = raw['dob'] || raw['birthday'] || raw['date_of_birth'] || '';
        const genderRaw = (raw['gender'] || raw['sex'] || 'unspecified').toLowerCase();
        const email = raw['email'] || '';
        const phone = raw['phone'] || raw['mobile'] || '';
        const relationship = raw['relationship'] || raw['relation'] || 'Friend';
        const note = raw['note'] || raw['notes'] || '';
        // Collect extra headers
        const extra_fields = {};
        for (const [key, val] of Object.entries(raw)) {
            if (!recognizedHeaders.includes(key) && val) {
                extra_fields[key] = val;
            }
        }
        if (!name.trim()) {
            return {
                name: '',
                dob: dobRaw,
                dob_month: 1,
                isValid: false,
                validationError: 'Missing contact name'
            };
        }
        // Parse Date of Birth
        const parsedDate = parseDateString(dobRaw);
        if (!parsedDate) {
            return {
                name: name.trim(),
                nickname,
                dob: dobRaw,
                dob_month: 1,
                gender: normalizeGender(genderRaw),
                relationship,
                email,
                phone,
                note,
                extra_fields,
                isValid: false,
                validationError: 'Invalid or missing Date of Birth'
            };
        }
        return {
            name: name.trim(),
            nickname,
            dob: `${parsedDate.year || 2000}-${String(parsedDate.month).padStart(2, '0')}-${String(parsedDate.day || 1).padStart(2, '0')}`,
            dob_day: parsedDate.day,
            dob_month: parsedDate.month,
            dob_year: parsedDate.year,
            gender: normalizeGender(genderRaw),
            relationship,
            email,
            phone,
            note,
            extra_fields,
            isValid: true
        };
    });
    const validCount = rows.filter(r => r.isValid).length;
    return { rows, total: rows.length, validCount };
}
export function importContacts(userId, rows, conflictStrategy = 'update') {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const checkExisting = db.prepare('SELECT id FROM contacts WHERE user_id = ? AND lower(name) = ? AND dob_month = ? AND dob_day = ?');
    const insertStmt = db.prepare(`
    INSERT INTO contacts (id, user_id, name, nickname, dob_day, dob_month, dob_year, gender, relationship, email, phone, note, extra_fields)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const updateStmt = db.prepare(`
    UPDATE contacts SET nickname = ?, dob_year = ?, gender = ?, relationship = ?, email = ?, phone = ?, note = ?, extra_fields = ?
    WHERE id = ?
  `);
    const transaction = db.transaction(() => {
        for (const row of rows) {
            if (!row.isValid) {
                skipped++;
                continue;
            }
            const existing = checkExisting.get(userId, row.name.toLowerCase(), row.dob_month, row.dob_day || null);
            if (existing) {
                if (conflictStrategy === 'skip') {
                    skipped++;
                    continue;
                }
                else if (conflictStrategy === 'update') {
                    updateStmt.run(row.nickname || null, row.dob_year || null, row.gender || 'unspecified', row.relationship || 'Friend', row.email || null, row.phone || null, row.note || null, JSON.stringify(row.extra_fields || {}), existing.id);
                    updated++;
                    continue;
                }
            }
            // Insert new
            insertStmt.run(`cnt_${nanoid(10)}`, userId, row.name, row.nickname || null, row.dob_day || null, row.dob_month, row.dob_year || null, row.gender || 'unspecified', row.relationship || 'Friend', row.email || null, row.phone || null, row.note || null, JSON.stringify(row.extra_fields || {}));
            imported++;
        }
    });
    transaction();
    return { imported, updated, skipped };
}
function parseDateString(str) {
    if (!str)
        return null;
    const clean = str.trim();
    // Try ISO YYYY-MM-DD
    const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { day, month, year };
        }
    }
    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10);
        const year = parseInt(dmyMatch[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { day, month, year };
        }
    }
    // Try DD/MM without year
    const dmMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    if (dmMatch) {
        const day = parseInt(dmMatch[1], 10);
        const month = parseInt(dmMatch[2], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { day, month };
        }
    }
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
        return {
            day: d.getDate(),
            month: d.getMonth() + 1,
            year: d.getFullYear()
        };
    }
    return null;
}
function normalizeGender(g) {
    if (g.includes('fem') || g === 'f' || g === 'girl' || g === 'woman')
        return 'female';
    if (g.includes('mal') || g === 'm' || g === 'boy' || g === 'man')
        return 'male';
    if (g.includes('child') || g.includes('kid'))
        return 'child';
    if (g.includes('non') || g.includes('nb'))
        return 'nonbinary';
    return 'unspecified';
}
