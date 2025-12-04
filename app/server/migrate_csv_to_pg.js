const fs = require('fs');
const path = require('path');
const { pool, initDB } = require('./db');

const DATA_DIR = path.join(__dirname, '../../');
const INVENTORY_FILE = path.join(DATA_DIR, 'Inventario.csv');
const COLUMNS_FILE = path.join(DATA_DIR, 'columnas.csv');

const migrate = async () => {
    try {
        await initDB();

        // Clear existing data to prevent duplicates
        console.log('Clearing existing data...');
        await pool.query('TRUNCATE TABLE columns, inventory RESTART IDENTITY CASCADE');

        // 1. Migrate Columns
        console.log('Migrating columns...');
        const columnsContent = fs.readFileSync(COLUMNS_FILE, 'latin1');
        const colLines = columnsContent.split(/\r?\n/);

        // Skip header
        for (let i = 1; i < colLines.length; i++) {
            const line = colLines[i].trim();
            if (!line) continue;

            const values = line.split(';');
            const colData = {
                id: values[0],
                label: values[1],
                type: values[2],
                length: values[3] || '',
                required: values[4] || ''
            };

            await pool.query(
                'INSERT INTO columns (column_id, label, type, length, required) VALUES ($1, $2, $3, $4, $5)',
                [colData.id, colData.label, colData.type, colData.length, colData.required]
            );
        }
        console.log('Columns migrated successfully.');

        // 2. Migrate Inventory
        console.log('Migrating inventory...');
        const inventoryContent = fs.readFileSync(INVENTORY_FILE, 'latin1');
        const invLines = inventoryContent.split(/\r?\n/);

        if (invLines.length > 1) {
            const headers = invLines[1].split(';').map(h => h.trim());

            for (let i = 2; i < invLines.length; i++) {
                const line = invLines[i];
                if (!line.trim()) continue;

                const values = line.split(';');
                const rowData = {};

                headers.forEach((header, index) => {
                    if (header) {
                        rowData[header] = values[index] || '';
                    }
                });

                // We store the whole row object as JSONB
                await pool.query(
                    'INSERT INTO inventory (data) VALUES ($1)',
                    [JSON.stringify(rowData)]
                );
            }
        }
        console.log('Inventory migrated successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
