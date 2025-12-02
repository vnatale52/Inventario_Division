const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Data storage
let inventoryData = [];
let columnsData = [];

const DATA_DIR = path.join(__dirname, '../../');
const INVENTORY_FILE = path.join(DATA_DIR, 'Inventario.csv');
const COLUMNS_FILE = path.join(DATA_DIR, 'columnas.csv');

// Helper to load data
const loadData = () => {
    return new Promise((resolve, reject) => {
        const tempColumns = [];
        // Read columns.csv using latin1 encoding to handle special characters
        const fileContent = fs.readFileSync(COLUMNS_FILE, 'latin1');
        const lines = fileContent.split(/\r?\n/);

        // First line is the header
        const headerLine = lines[0];

        // Process each subsequent line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(';');
            tempColumns.push({
                id: values[0],
                label: values[1],
                type: values[2],
                length: values[3] || '',
                required: values[4] || ''
            });
        }

        columnsData = tempColumns;

        // Read Inventario.csv
        // Use latin1 to ensure we don't mess up encoding if it's legacy Excel
        const inventoryContent = fs.readFileSync(INVENTORY_FILE, 'latin1');
        const inventoryLines = inventoryContent.split(/\r?\n/);

        if (inventoryLines.length < 2) {
            inventoryData = [];
            resolve();
            return;
        }

        // Line 1 (index 1) has headers
        const headers = inventoryLines[1].split(';');

        const dataLines = inventoryLines.slice(2);
        inventoryData = dataLines.map((line, index) => {
            if (!line.trim()) return null;
            const values = line.split(';');
            const row = { _id: index };
            headers.forEach((header, i) => {
                const key = header.trim();
                if (key) row[key] = values[i] || '';
            });
            return row;
        }).filter(r => r !== null);

        console.log(`Loaded ${columnsData.length} columns and ${inventoryData.length} rows.`);
        resolve();
    });
};

// Helper to save inventory data
const saveData = () => {
    // Reconstruct CSV content
    // We need to map columnsData to get the correct order and labels
    const headers = columnsData.map(c => c.label);
    const headerLine = headers.join(';');

    // For the first line (Seq numbers), use IDs
    const seqLine = columnsData.map(c => c.id).join(';');

    const lines = [seqLine, headerLine];

    inventoryData.forEach(row => {
        const values = headers.map(header => {
            return row[header] || '';
        });
        lines.push(values.join(';'));
    });

    const csvContent = lines.join('\n');

    // Write back to file
    fs.writeFileSync(INVENTORY_FILE, csvContent, 'latin1');
};

// Helper to save columns data
const saveColumns = () => {
    // Reconstruct columnas.csv
    // Header: Número Columna;Descripción;Tipo de dato;longitud;obligatorio
    const header = "Número Columna;Descripción;Tipo de dato;longitud;obligatorio";
    const lines = [header];

    columnsData.forEach(col => {
        lines.push(`${col.id};${col.label};${col.type};${col.length || ''};${col.required || ''}`);
    });

    fs.writeFileSync(COLUMNS_FILE, lines.join('\n'), 'latin1');
};

// Initial load
loadData().catch(console.error);

// Routes
// Root route - API information
app.get('/', (req, res) => {
    res.json({
        message: 'Inventory Management API Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            'GET /api/data': 'Get all inventory data and columns',
            'POST /api/data': 'Add, update, or delete inventory rows',
            'POST /api/columns': 'Add or delete columns',
            'POST /api/email': 'Generate email content for a row'
        },
        note: 'Frontend application should be running separately on port 5173 (npm run dev in client folder)'
    });
});

app.get('/api/data', (req, res) => {
    res.json({
        columns: columnsData,
        inventory: inventoryData
    });
});

app.post('/api/data', (req, res) => {
    const { type, row } = req.body;

    if (type === 'ADD') {
        const newRow = { ...row, _id: inventoryData.length > 0 ? Math.max(...inventoryData.map(r => r._id)) + 1 : 1 };
        inventoryData.push(newRow);
    } else if (type === 'UPDATE') {
        const index = inventoryData.findIndex(r => r._id === row._id);
        if (index !== -1) {
            inventoryData[index] = row;
        }
    } else if (type === 'DELETE') {
        inventoryData = inventoryData.filter(r => r._id !== row._id);
    }

    saveData(); // Persist changes
    res.json({ success: true, inventory: inventoryData });
});

app.post('/api/columns', (req, res) => {
    const { type, column } = req.body;

    if (type === 'ADD') {
        const newCol = { ...column, id: columnsData.length + 1 };
        columnsData.push(newCol);
        // Add empty field to all rows
        inventoryData.forEach(row => {
            row[newCol.label] = '';
        });
        saveColumns();
        saveData();
    } else if (type === 'DELETE') {
        columnsData = columnsData.filter(c => c.label !== column.label);
        saveColumns();
        saveData();
    }

    res.json({ success: true, columns: columnsData });
});

app.post('/api/email', (req, res) => {
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

// Backup endpoint
app.post('/api/backup', (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }

        // Create timestamp in local format: YYYYMMDD_HHMMSS
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

        // Create backups directory if it doesn't exist
        const backupDir = path.join(DATA_DIR, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Generate backup filenames
        const inventoryBackup = path.join(backupDir, `${username}_Inventario_${timestamp}.csv`);
        const columnsBackup = path.join(backupDir, `${username}_columnas_${timestamp}.csv`);

        // Copy files
        fs.copyFileSync(INVENTORY_FILE, inventoryBackup);
        fs.copyFileSync(COLUMNS_FILE, columnsBackup);

        console.log(`Backup created by ${username} at ${timestamp}`);

        res.json({
            success: true,
            files: [
                path.basename(inventoryBackup),
                path.basename(columnsBackup)
            ]
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
