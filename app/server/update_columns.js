const fs = require('fs');
const path = require('path');
const { pool, initDB } = require('./db');

const DATA_DIR = path.join(__dirname, '../../');
const COLUMNS_FILE = path.join(DATA_DIR, 'columnas.csv');

const updateColumns = async () => {
    try {
        console.log('Updating columns table...');
        await pool.query('DROP TABLE IF EXISTS columns');
        await initDB();

        // Truncate columns table
        await pool.query('TRUNCATE TABLE columns RESTART IDENTITY');

        const columnsContent = fs.readFileSync(COLUMNS_FILE, 'latin1');
        const colLines = columnsContent.split(/\r?\n/);

        // Skip header
        for (let i = 1; i < colLines.length; i++) {
            const line = colLines[i].trim();
            if (!line) continue;

            const values = line.split(';');
            // Headers: Numero Columna;Descripcion;Ancho
            const colData = {
                id: values[0],
                label: values[1],
                width: parseInt(values[2]) || 100
            };

            await pool.query(
                'INSERT INTO columns (column_id, label, width) VALUES ($1, $2, $3)',
                [colData.id, colData.label, colData.width]
            );
        }
        console.log('Columns table updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Column update failed:', error);
        process.exit(1);
    }
};

updateColumns();
