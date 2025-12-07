const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

// Initialize DB on start
initDB();

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role || 'USER']
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result.rows[0];
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret');
            res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
        } else {
            res.status(403).json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        // Get user from database
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(403).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// --- Data Routes ---

app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const columnsRes = await pool.query('SELECT * FROM columns ORDER BY column_id');
        const inventoryRes = await pool.query('SELECT * FROM inventory ORDER BY id');

        // Transform inventory data to match frontend expectation (flatten JSONB)
        let inventory = inventoryRes.rows.map(row => {
            return {
                _id: row.id,
                ...row.data
            };
        });

        // Filter data based on user role
        if (req.user.role !== 'ADMIN') {
            const userRole = req.user.role;
            const username = req.user.username;

            inventory = inventory.filter(row => {
                // Check if the row has a column matching the user's role
                // and if the value in that column matches the username
                const val = row[userRole];
                return val && val.trim() === username;
            });
        }

        res.json({
            columns: columnsRes.rows,
            inventory: inventory
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/data', authenticateToken, async (req, res) => {
    const { type, row } = req.body;

    try {
        if (type === 'ADD') {
            // Remove _id if present, as we want DB to generate it
            const { _id, ...data } = row;
            const result = await pool.query(
                'INSERT INTO inventory (data) VALUES ($1) RETURNING id, data',
                [JSON.stringify(data)]
            );
            const newRow = { _id: result.rows[0].id, ...result.rows[0].data };
            res.json({ success: true, row: newRow });

        } else if (type === 'UPDATE') {
            const { _id, ...data } = row;
            await pool.query(
                'UPDATE inventory SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [JSON.stringify(data), _id]
            );
            res.json({ success: true });

        } else if (type === 'DELETE') {
            await pool.query('DELETE FROM inventory WHERE id = $1', [row._id]);
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error modifying data:', error);
        res.status(500).json({ error: 'Database operation failed' });
    }
});

app.post('/api/columns', authenticateToken, async (req, res) => {
    const { type, column } = req.body;

    try {
        if (type === 'ADD') {
            const result = await pool.query(
                'INSERT INTO columns (column_id, label, type, length, required) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [column.id, column.label, column.type, column.length, column.required]
            );
            res.json({ success: true, column: result.rows[0] });

        } else if (type === 'DELETE') {
            await pool.query('DELETE FROM columns WHERE label = $1', [column.label]);
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error modifying columns:', error);
        res.status(500).json({ error: 'Database operation failed' });
    }
});

app.post('/api/email', authenticateToken, (req, res) => {
    const { row } = req.body;
    const subject = `Update regarding File ${row['Orden'] || 'Unknown'}`;
    const body = `
Hello,

Here are the details for the file:

Inspector: ${row['INSPECTOR'] || 'N/A'}
Supervisor: ${row['SUPERVISOR'] || 'N/A'}
Division: ${row['DIV'] || 'N/A'}
Section: ${row['SECT'] || 'N/A'}

Status: ${row['Estado'] || 'Please review'}

Regards,
Inventory System
    `;

    res.json({ subject, body });
});

// Backup endpoint (Updated for Postgres)
app.post('/api/backup', authenticateToken, async (req, res) => {
    try {
        // Use authenticated username from token for security
        const authenticatedUsername = req.user.username;

        // Fetch data
        const columnsRes = await pool.query('SELECT * FROM columns ORDER BY column_id');
        const inventoryRes = await pool.query('SELECT * FROM inventory ORDER BY id');

        const columnsData = columnsRes.rows;
        let inventoryData = inventoryRes.rows.map(r => r.data);

        // Filter data based on user role
        if (req.user.role !== 'ADMIN') {
            const userRole = req.user.role;

            inventoryData = inventoryData.filter(row => {
                const val = row[userRole];
                return val && val.trim() === authenticatedUsername;
            });
        }

        // Generate CSV content
        const headers = columnsData.map(c => c.label);
        const seqLine = columnsData.map(c => c.column_id).join(';');
        const headerLine = headers.join(';');

        const lines = [seqLine, headerLine];
        inventoryData.forEach(row => {
            const values = headers.map(header => row[header] || '');
            lines.push(values.join(';'));
        });

        const csvContent = lines.join('\n');

        // Generate timestamp in Argentina timezone (UTC-3) manually
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const argentinaTime = new Date(utc - (3600000 * 3)); // UTC-3

        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${pad(argentinaTime.getDate())}-${pad(argentinaTime.getMonth() + 1)}-${argentinaTime.getFullYear()}`;
        const timeStr = `${pad(argentinaTime.getHours())}-${pad(argentinaTime.getMinutes())}-${pad(argentinaTime.getSeconds())}`;

        const filename = `${authenticatedUsername}_backup_${dateStr}_${timeStr}.csv`;

        // Send as download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
        res.send(csvContent);

    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Backup failed' });
    }
});

// --- User Management Routes (ADMIN only) ---

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Allow all authenticated users to read users for validation purposes
        // if (req.user.role !== 'ADMIN') {
        //     return res.status(403).json({ error: 'Access denied. Admin only.' });
        // }

        const fs = require('fs');
        const path = require('path');
        const usuariosPath = path.join(__dirname, '../../usuarios.csv');

        const csvContent = fs.readFileSync(usuariosPath, 'utf-8');
        const lines = csvContent.trim().split('\n');

        if (lines.length < 1) {
            return res.json({ roles: [], users: [] });
        }

        // Parse header (roles)
        const roles = lines[0].split(';').map(r => r.trim());

        // Parse data rows
        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';').map(v => v.trim());
            users.push(values);
        }

        res.json({ roles, users });
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ error: 'Failed to read users' });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');
        const usuariosPath = path.join(__dirname, '../../usuarios.csv');

        const { roles, users } = req.body;

        // Construct CSV content
        const headerLine = roles.join(';');
        const dataLines = users.map(row => row.join(';'));
        const csvContent = [headerLine, ...dataLines].join('\n');

        // Write to file
        fs.writeFileSync(usuariosPath, csvContent, 'utf-8');

        // Re-seed users in database
        try {
            const seedPath = path.join(__dirname, 'seed_users.js');
            const result = execSync(`node "${seedPath}"`, {
                cwd: __dirname,
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            console.log('Users re-seeded successfully');
            console.log('Seed output:', result);
        } catch (seedError) {
            console.error('Error re-seeding users:', seedError);
            console.error('Seed error output:', seedError.stderr);
            console.error('Seed error stdout:', seedError.stdout);
            return res.status(500).json({
                error: 'Users saved but failed to update database',
                details: seedError.message,
                stderr: seedError.stderr,
                stdout: seedError.stdout
            });
        }

        res.json({ success: true, message: 'Users updated successfully' });
    } catch (error) {
        console.error('Error updating users:', error);
        res.status(500).json({ error: 'Failed to update users' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


