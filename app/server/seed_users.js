const { pool } = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const seedUsers = async () => {
    try {
        console.log('Seeding users...');

        // Read usuarios.csv file
        const usuariosPath = path.join(__dirname, '../../usuarios.csv');
        const csvContent = fs.readFileSync(usuariosPath, 'utf-8');
        const lines = csvContent.trim().split('\n');

        if (lines.length < 2) {
            throw new Error('usuarios.csv must have at least a header row and one data row');
        }

        // Parse header to get role names
        const header = lines[0].split(';').map(h => h.trim());
        console.log('Roles found:', header);

        // Parse each data row
        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';').map(v => v.trim());

            // For each column (role), add a user
            for (let j = 0; j < header.length; j++) {
                if (values[j]) {
                    users.push({
                        username: values[j],
                        role: header[j]
                    });
                }
            }
        }

        // Add admin user
        users.push({ username: 'admin', role: 'ADMIN' });

        console.log(`Found ${users.length} users to seed`);

        const password = 'password123'; // Default password
        const hashedPassword = await bcrypt.hash(password, 10);

        for (const user of users) {
            // Check if user exists
            const res = await pool.query('SELECT * FROM users WHERE username = $1', [user.username]);
            if (res.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
                    [user.username, hashedPassword, user.role]
                );
                console.log(`Created user: ${user.username} (${user.role})`);
            } else {
                // Update role if changed
                await pool.query(
                    'UPDATE users SET role = $2 WHERE username = $1',
                    [user.username, user.role]
                );
                console.log(`Updated user: ${user.username} (${user.role})`);
            }
        }
        console.log('User seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
