import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Module dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// Initialize SQLite Database
const dbPath = join(__dirname, 'medimind.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database at medimind.db');

        // Create tables if they don't exist
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    fullName TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL,
                    caringFor TEXT,
                    avatar TEXT,
                    phone_number TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Medications table
            db.run(`
                CREATE TABLE IF NOT EXISTS medications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    dosage TEXT,
                    frequency TEXT,
                    instructions TEXT,
                    color TEXT,
                    times TEXT,
                    specific_dates TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);

            // Invite Codes table
            db.run(`
                CREATE TABLE IF NOT EXISTS invite_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    caregiver_id INTEGER NOT NULL,
                    code TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (caregiver_id) REFERENCES users(id)
                )
            `);

            // Seed initial generic data if tables are empty
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (row && row.count === 0) {
                    const hash = bcrypt.hashSync('password123', 10);
                    db.run(`INSERT INTO users (name, fullName, email, password, role, caringFor, avatar) VALUES 
                        ('Margaret', 'Margaret Chen', 'margaret@email.com', ?, 'patient', NULL, 'M'),
                        ('David', 'David Chen', 'david@email.com', ?, 'caretaker', 'Margaret Chen', 'D')
                    `, [hash, hash]);
                    console.log('Seeded initial users');
                }
            });

            db.get('SELECT COUNT(*) as count FROM medications', (err, row) => {
                if (row && row.count === 0) {
                    // Seed meds only for the demo patient (user_id = 1)
                    db.run(`INSERT INTO medications (user_id, name, dosage, frequency, instructions, color, times) VALUES 
                        (1, 'Metformin', '500mg', 'Twice daily', 'Take with food', 'blue', '["7:00 AM", "7:00 PM"]'),
                        (1, 'Lisinopril', '10mg', 'Once daily', '', 'green', '["7:00 AM"]')
                    `);
                    console.log('Seeded initial medications for demo patient');
                }
            });

            // Migration: add push_token column if it doesn't exist
            db.all("PRAGMA table_info(users)", (err, cols) => {
                if (cols && !cols.find(c => c.name === 'push_token')) {
                    db.run('ALTER TABLE users ADD COLUMN push_token TEXT', (err) => {
                        if (!err) console.log('Added push_token column to users table');
                    });
                }
                if (cols && !cols.find(c => c.name === 'phone_number')) {
                    db.run('ALTER TABLE users ADD COLUMN phone_number TEXT', (err) => {
                        if (!err) console.log('Added phone_number column to users table');
                    });
                }
            });
        });
    }
});

// --- SSE Real-Time Connections ---
const activeClients = new Map(); // Map<userId, res[]>

app.get('/api/events', (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id is required' });

    // Setup SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush headers to establish SSE

    // Store Connection
    if (!activeClients.has(userId)) {
        activeClients.set(userId, []);
    }
    activeClients.get(userId).push(res);

    // Keep connection alive with heartbeat
    const interval = setInterval(() => {
        res.write(':\n\n'); // SSE comment heartbeat
    }, 15000);

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(interval);
        const clients = activeClients.get(userId);
        if (clients) {
            const index = clients.indexOf(res);
            if (index !== -1) clients.splice(index, 1);
            if (clients.length === 0) activeClients.delete(userId);
        }
    });
});

// Broadcast helper
function broadcastEvent(userId, eventType, data) {
    const clients = activeClients.get(String(userId));
    if (clients) {
        clients.forEach((client) => {
            client.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
        });
    }
}

// ── Expo Push Notification Helper ──
async function sendPushNotification(userId, title, body, data = {}) {
    return new Promise((resolve) => {
        db.get('SELECT push_token FROM users WHERE id = ?', [userId], async (err, row) => {
            if (err || !row || !row.push_token) {
                console.log(`[Push] No push token for user ${userId}, skipping`);
                return resolve();
            }

            try {
                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: row.push_token,
                        sound: 'default',
                        title,
                        body,
                        data,
                    }),
                });
                const result = await response.json();
                console.log(`[Push] Sent to user ${userId}:`, result.data?.status || result);
            } catch (pushErr) {
                console.error(`[Push] Failed to send to user ${userId}:`, pushErr.message);
            }
            resolve();
        });
    });
}

// ── Register/Update Push Token ──
app.put('/api/users/:id/push-token', (req, res) => {
    const { id } = req.params;
    const { push_token } = req.body;

    if (!push_token) return res.status(400).json({ error: 'push_token is required' });

    db.run('UPDATE users SET push_token = ? WHERE id = ?', [push_token, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        console.log(`[Push] Token registered for user ${id}: ${push_token.substring(0, 30)}...`);
        res.json({ success: true });
    });
});

// Helper to handle backward compatible caringFor lists
const getCaringForArray = (dbVal) => {
    if (!dbVal) return [];
    try {
        const parsed = JSON.parse(dbVal);
        return Array.isArray(parsed) ? parsed : [dbVal];
    } catch {
        return [dbVal];
    }
};

// Custom manual notification endpoint
app.post('/api/notify', (req, res) => {
    const { targetRole, patientName, type, title, body, payload } = req.body;

    // Find users who should receive this
    let query = '';
    let params = [];

    if (targetRole === 'caretaker' && patientName) {
        db.all('SELECT id, caringFor FROM users WHERE role = ?', ['caretaker'], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            rows.forEach(row => {
                const arr = getCaringForArray(row.caringFor);
                if (arr.includes(patientName)) {
                    broadcastEvent(row.id, type, { title, body, payload });
                }
            });
            res.sendStatus(200);
        });
    } else {
        return res.status(400).json({ error: 'Invalid notification target' });
    }
});

// --- API ROUTES ---

// --- Users / Auth ---

// Register a new account
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password and role are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar = name.charAt(0).toUpperCase();
        const query = `INSERT INTO users (name, fullName, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`;

        db.run(query, [name, name, email, hashedPassword, role, avatar], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'An account with this email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID, name, fullName: name, email, role, avatar
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to hash password' });
    }
});

// Login with email + password
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid email or password' });

        // Backward compatibility: If the password isn't hashed
        let isValid = false;
        if (!row.password.startsWith('$2a$') && !row.password.startsWith('$2b$')) {
            isValid = (password === row.password);
            
            // Auto migrate password if valid
            if (isValid) {
                const newHash = await bcrypt.hash(password, 10);
                db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, row.id]);
            }
        } else {
            isValid = await bcrypt.compare(password, row.password);
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Don't send the password back to the client
        const { password: _, ...user } = row;
        res.json(user);
    });
});

// Delete a user account and all their medications
app.delete('/api/auth/delete/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT name, role FROM users WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'User not found' });

        db.serialize(() => {
            // If it's a patient or independent, clear any caretakers that are tracking them
            if (row.role === 'patient' || row.role === 'independent') {
                db.run('UPDATE users SET caringFor = NULL WHERE role = ? AND caringFor = ?', ['caretaker', row.name]);
            }

            // Delete the user's medications first
            db.run('DELETE FROM medications WHERE user_id = ?', [id]);
            // Then delete the user
            db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Account deleted successfully' });
            });
        });
    });
});

// Update User Profile (e.g., Phone Number)
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { phone_number } = req.body;

    db.run('UPDATE users SET phone_number = ? WHERE id = ?', [phone_number, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

        db.get('SELECT id, name, fullName, email, role, avatar, phone_number, caringFor FROM users WHERE id = ?', [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row);
        });
    });
});

// Fetch Partner Phone Number (For direct calling)
app.get('/api/users/:id/partner-phone', (req, res) => {
    const { id } = req.params;

    db.get('SELECT role, caringFor, name FROM users WHERE id = ?', [id], (err, userRow) => {
        if (err || !userRow) return res.status(404).json({ error: 'User not found' });

        let targetQuery = '';
        let targetParams = [];

        if (userRow.role === 'caretaker' && userRow.caringFor) {
            // Caretaker looking up patient
            const arr = getCaringForArray(userRow.caringFor);
            const target = req.query.target_patient || arr[0];
            targetQuery = 'SELECT phone_number FROM users WHERE (fullName = ? OR name = ?) LIMIT 1';
            targetParams = [target, target];
        } else if (userRow.role === 'patient' || userRow.role === 'independent') {
            // Patient/Independent looking up caretaker
            // Since caretakers have JSON arrays, we fetch all and check locally
            db.all('SELECT phone_number, caringFor FROM users WHERE role = ?', ['caretaker'], (err, ctRows) => {
                if (err) return res.json({ phone_number: null });
                const matchedCT = ctRows.find(ct => getCaringForArray(ct.caringFor).includes(userRow.name));
                return res.json({ phone_number: matchedCT ? matchedCT.phone_number : null });
            });
            return;
        } else {
            return res.json({ phone_number: null });
        }

        db.get(targetQuery, targetParams, (err, targetRow) => {
            if (err || !targetRow) return res.json({ phone_number: null });
            res.json({ phone_number: targetRow.phone_number });
        });
    });
});

// Get all registered users (for viewing in SQLite extension)
app.get('/api/users', (req, res) => {
    db.all('SELECT id, name, fullName, email, role, avatar, created_at FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Invites ---

// Generate a new 6-digit invite code for a Caregiver
app.post('/api/invites', (req, res) => {
    const { caregiver_id } = req.body;
    if (!caregiver_id) return res.status(400).json({ error: 'caregiver_id is required' });

    // Generate a random 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    db.run('INSERT INTO invite_codes (caregiver_id, code) VALUES (?, ?)', [caregiver_id, code], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ code });
    });
});

// Patient joins a Caregiver using an invite code
app.post('/api/invites/join', (req, res) => {
    const { code, patient_id, patient_name } = req.body;

    if (!code || !patient_id || !patient_name) {
        return res.status(400).json({ error: 'code, patient_id, and patient_name are required' });
    }

    // 1. Find the invite code
    db.get('SELECT caregiver_id FROM invite_codes WHERE code = ?', [code.toUpperCase()], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Invalid or expired invite code' });

        const caregiverId = row.caregiver_id;

        db.get('SELECT caringFor FROM users WHERE id = ?', [caregiverId], (err, cgRow) => {
            if (err) return res.status(500).json({ error: err.message });

            let caringArr = getCaringForArray(cgRow?.caringFor);
            if (!caringArr.includes(patient_name)) caringArr.push(patient_name);

            db.serialize(() => {
                // 2. Update the Caregiver's account to point to this Patient
                db.run('UPDATE users SET caringFor = ? WHERE id = ?', [JSON.stringify(caringArr), caregiverId], (err) => {
                    if (err) {
                        console.error('Failed to link patient to caregiver', err);
                    } else {
                        // Notify Caregiver in real-time
                        broadcastEvent(caregiverId, 'patient_linked', {
                            title: 'New Patient Linked!',
                            body: `${patient_name} linked to your account.`,
                            patient_name: patient_name
                        });
                    }
                });

                // 3. Delete the used code
                db.run('DELETE FROM invite_codes WHERE code = ?', [code.toUpperCase()]);

                // Return success
                res.json({ success: true, caregiver_id: caregiverId, message: 'Successfully linked to Caregiver' });
            });
        });
    });
});

// Patient drops their Caretaker
app.post('/api/patients/drop-caretaker', (req, res) => {
    const { patient_name } = req.body;
    if (!patient_name) return res.status(400).json({ error: 'patient_name is required' });

    db.all('SELECT id, caringFor FROM users WHERE role = ?', ['caretaker'], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let processed = 0;
        let matched = 0;
        
        if (rows.length === 0) return res.json({ success: true, message: 'No caretakers to drop' });

        rows.forEach(row => {
            const arr = getCaringForArray(row.caringFor);
            if (arr.includes(patient_name)) {
                matched++;
                const newArr = arr.filter(n => n !== patient_name);
                db.run('UPDATE users SET caringFor = ? WHERE id = ?', [JSON.stringify(newArr), row.id], (err) => {
                    broadcastEvent(row.id, 'patient_dropped', {
                        title: 'Patient Disconnected',
                        body: `${patient_name} has removed you as their caretaker.`,
                        patient_name: patient_name
                    });
                    
                    processed++;
                    if (processed === matched) res.json({ success: true, message: 'Dropped caretaker successfully' });
                });
            } else {
                processed++;
                if (processed === matched || matched === 0) {
                    if (processed === rows.length) res.json({ success: true, message: 'No caretakers matched' });
                }
            }
        });
    });
});

// --- Medications ---
// Get medications for a specific user (if caretaker, get their patient's meds)
app.get('/api/medications', (req, res) => {
    const userId = req.query.user_id;
    const targetPatient = req.query.target_patient;
    if (!userId) return res.status(400).json({ error: 'user_id query parameter is required' });

    db.get('SELECT role, caringFor FROM users WHERE id = ?', [userId], (err, userRow) => {
        if (err || !userRow) return res.status(500).json({ error: 'User not found' });

        let targetQuery = 'SELECT id FROM users WHERE id = ?';
        let targetParams = [userId];

        if (userRow.role === 'caretaker' && userRow.caringFor) {
            const arr = getCaringForArray(userRow.caringFor);
            const pat = targetPatient || arr[0];
            if (!pat || !arr.includes(pat)) return res.json([]);
            targetQuery = 'SELECT id FROM users WHERE fullName = ? OR name = ? LIMIT 1';
            targetParams = [pat, pat];
        }

        db.get(targetQuery, targetParams, (err, targetRow) => {
            if (err || !targetRow) return res.json([]); // No patient linked

            const targetPatientId = targetRow.id;
            db.all('SELECT * FROM medications WHERE user_id = ?', [targetPatientId], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                const parsedRows = rows.map(row => ({
                    ...row,
                    times: row.times ? JSON.parse(row.times) : [],
                    specific_dates: row.specific_dates ? JSON.parse(row.specific_dates) : []
                }));
                res.json(parsedRows);
            });
        });
    });
});

// Add a medication for a user
app.post('/api/medications', (req, res) => {
    const { user_id, name, dosage, frequency, instructions, color, times, specific_dates } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const timesJson = JSON.stringify(times || []);
    const datesJson = JSON.stringify(specific_dates || []);
    const defaultColor = color || ['blue', 'green', 'purple', 'orange'][Math.floor(Math.random() * 4)];

    db.get('SELECT role, caringFor FROM users WHERE id = ?', [user_id], (err, userRow) => {
        if (err || !userRow) return res.status(500).json({ error: 'User not found' });

        const insertMedication = (targetId, isCaretaker) => {
            const query = `INSERT INTO medications (user_id, name, dosage, frequency, instructions, color, times, specific_dates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(query, [targetId, name, dosage, frequency, instructions, defaultColor, timesJson, datesJson], function (insertErr) {
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                const newMed = {
                    id: this.lastID, user_id: targetId,
                    name, dosage, frequency, instructions, color: defaultColor, times: times || [], specific_dates: specific_dates || []
                };

                res.status(201).json(newMed);

                // If caretaker added it, notify the patient!
                if (isCaretaker) {
                    broadcastEvent(targetId, 'med_added', {
                        title: 'New Medication Added',
                        body: `Your caretaker added ${name} ${dosage}`,
                        medication: newMed
                    });
                    // Send push notification to patient's device (works even when app is closed)
                    sendPushNotification(targetId, '💊 New Medication Added', `Your caretaker added ${name} ${dosage || ''}`.trim());
                }
            });
        };

        if (userRow.role === 'caretaker' && userRow.caringFor) {
            const targetPatient = req.body.target_patient;
            const arr = getCaringForArray(userRow.caringFor);
            const pat = targetPatient || arr[0];
            db.get('SELECT id FROM users WHERE fullName = ? OR name = ? LIMIT 1', [pat, pat], (lookupErr, targetRow) => {
                if (lookupErr || !targetRow) return res.status(404).json({ error: 'Patient not found to save medication' });
                insertMedication(targetRow.id, true);
            });
        } else {
            insertMedication(user_id, false);
        }
    });
});

// Update a medication
app.put('/api/medications/:id', (req, res) => {
    const { id } = req.params;
    const { name, dosage, frequency, instructions, times, specific_dates, user_id: requestingUserId } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (dosage !== undefined) { fields.push('dosage = ?'); values.push(dosage); }
    if (frequency !== undefined) { fields.push('frequency = ?'); values.push(frequency); }
    if (instructions !== undefined) { fields.push('instructions = ?'); values.push(instructions); }
    if (times !== undefined) { fields.push('times = ?'); values.push(JSON.stringify(times)); }
    if (specific_dates !== undefined) { fields.push('specific_dates = ?'); values.push(JSON.stringify(specific_dates)); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const query = `UPDATE medications SET ${fields.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Medication not found' });

        db.get('SELECT * FROM medications WHERE id = ?', [id], (err, row) => {
            if (!row) return res.status(404).json({ error: 'Medication not found' });
            row.times = row.times ? JSON.parse(row.times) : [];
            row.specific_dates = row.specific_dates ? JSON.parse(row.specific_dates) : [];
            res.json(row);

            // Fetch the role of the user requesting the change
            db.get('SELECT role FROM users WHERE id = ?', [requestingUserId], (roleErr, userRow) => {
                // If it's a caretaker updating it, notify the patient
                if (!roleErr && userRow && userRow.role === 'caretaker') {
                    const msg = `Your caretaker updated your ${row.name || 'medication'}`;
                    broadcastEvent(row.user_id, 'med_updated', {
                        title: 'Medication Updated',
                        body: msg,
                        medication: row
                    });
                    sendPushNotification(row.user_id, '💊 Medication Updated', msg);
                }
            });
        });
    });
});

// Delete a medication
app.delete('/api/medications/:id', (req, res) => {
    const { id } = req.params;
    const requestingUserId = req.query.user_id;

    db.get('SELECT user_id, name FROM medications WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Medication not found' });
        
        db.run('DELETE FROM medications WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deleted successfully', changes: this.changes });

            db.get('SELECT role FROM users WHERE id = ?', [requestingUserId], (roleErr, userRow) => {
                // If a caretaker deleted it, send a notification to the patient
                if (!roleErr && userRow && userRow.role === 'caretaker') {
                    const msg = `Your caretaker removed ${row.name || 'a medication'}`;
                    broadcastEvent(row.user_id, 'med_deleted', {
                        title: 'Medication Removed',
                        body: msg,
                        medicationId: parseInt(id)
                    });
                    sendPushNotification(row.user_id, '💊 Medication Removed', msg);
                }
            });
        });
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API Server running at http://0.0.0.0:${PORT}`);
});

// Error Logging Endpoint for Frontend
app.post('/api/log-error', (req, res) => {
    console.error('\n[FRONTEND ERROR]:', req.body);
    res.sendStatus(200);
});
