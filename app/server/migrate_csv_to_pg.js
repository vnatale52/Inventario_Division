const fs = require('fs');
const path = require('path');
const { pool, initDB } = require('./db');

const DATA_DIR = path.join(__dirname, '../../');
const INVENTORY_FILE = path.join(DATA_DIR, 'Inventario.csv');
const COLUMNS_FILE = path.join(DATA_DIR, 'columnas.csv');

const migrate = async () => {
    try {
        await initDB();

        // Check if database is already populated
        const res = await pool.query('SELECT COUNT(*) FROM inventory');
        const count = parseInt(res.rows[0].count);

        if (count > 0) {
            console.log('Database already has data (rows: ' + count + '). Skipping migration to prevent overwrite.');
            process.exit(0);
        }

        // Only clear if we are proceeding with migration (though if count is 0, truncate is redundant but safe)
        console.log('Database is empty. Starting migration...');
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
                width: parseInt(values[2]) || 100, // Default width if missing
                type: values[3] || '', // Shifted due to new column structure? No, user said 3 headers: Num, Desc, Ancho. Wait.
                // Re-reading user request: "Este archivo tiene los siguientes 3 headers: "Numero Columna"; "Descripcion" y "Ancho""
                // This means the old "type", "length", "required" columns MIGHT BE GONE or shifted.
                // Let's assume the file ONLY has these 3 based on description, OR they are appended.
                // Checking the content of columns.csv viewed earlier:
                // Line 1: Numero Columna;Descripcion;Ancho
                // Line 2: 1;Orden;4
                // It seems the other columns (type, length, required) ARE GONE.
            };

            await pool.query(
                'INSERT INTO columns (column_id, label, width) VALUES ($1, $2, $3)',
                [colData.id, colData.label, colData.width]
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
