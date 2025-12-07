import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Save, X, Mail, Pencil } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import { getUsers } from '../api';

// Helper to determine initial width based on column name
const getInitialWidth = (label) => {
    // Small columns: short labels (less than 15 characters)
    if (label.length <= 15) return 50;

    // Medium columns: contains financial keywords
    if (label.includes('Impuesto') || label.includes('Accesorios') ||
        label.includes('cantidad') || label.includes('Recaudacion') ||
        label.includes('Total') || label.includes('BD') ||
        label.includes('Sellos') || label.includes('Empadron')) {
        return 120;
    }

    return 150; // Default width for other columns
};

// Helper to determine if column should be right-aligned (financial columns)
const isFinancialColumn = (label) => {
    // Financial columns typically contain these keywords
    return label.includes('Impuesto') || label.includes('Accesorios') ||
        label.includes('cantidad') || label.includes('Recaudacion') ||
        label.includes('Total') || label.includes('Dif.') ||
        label.includes('Pago') || label.includes('Plan') ||
        label.includes('Multa') || label.includes('BD');
};

export const InventoryGrid = ({ data, columns, onUpdate, role, username }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [showColManager, setShowColManager] = useState(false);

    // Column resizing state
    const [columnWidths, setColumnWidths] = useState({});
    const [headerHeight, setHeaderHeight] = useState(17); // Default height reduced by 30% from 24px
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const resizingRef = useRef(null);
    const headerResizingRef = useRef(null);
    const headerHeightRef = useRef(headerHeight); // Keep ref in sync with state

    // Validation state - only keep validUsers for validation
    const [validUsers, setValidUsers] = useState(null); // Map for validation
    const tableContainerRef = useRef(null);

    // Load valid users for validation only
    useEffect(() => {
        const loadValidUsers = async () => {
            try {
                const data = await getUsers();
                // Transform to map: Role -> Set of usernames for validation
                const map = {};
                if (data.roles && data.users) {
                    data.roles.forEach((role, index) => {
                        // Store usernames in lowercase for case-insensitive comparison
                        map[role] = new Set(
                            data.users
                                .map(row => row[index])
                                .filter(u => u && u.trim() !== '')
                                .map(u => u.trim().toLowerCase())
                        );
                    });
                }
                setValidUsers(map);
            } catch (e) {
                console.error('Failed to load users for validation', e);
            }
        };
        loadValidUsers();
    }, []);

    // Safety checks - force new array instances
    const safeData = Array.isArray(data) ? [...data].filter(Boolean) : [];
    const safeColumns = Array.isArray(columns) ? [...columns].filter(Boolean) : [];

    // Initialize column widths from localStorage or defaults
    useEffect(() => {
        if (!columns || columns.length === 0) return;

        const storageKey = `inventory-column-widths-${username}`;
        const savedWidths = localStorage.getItem(storageKey);

        const initialWidths = {};
        columns.forEach(col => {
            initialWidths[col.label] = getInitialWidth(col.label);
        });

        if (savedWidths) {
            try {
                const parsed = JSON.parse(savedWidths);
                setColumnWidths({ ...initialWidths, ...parsed });
            } catch (e) {
                setColumnWidths(initialWidths);
            }
        } else {
            setColumnWidths(initialWidths);
        }

        // Load header height from localStorage
        const headerHeightKey = `inventory-header-height-${username}`;
        const savedHeaderHeight = localStorage.getItem(headerHeightKey);
        if (savedHeaderHeight) {
            try {
                setHeaderHeight(parseInt(savedHeaderHeight, 10));
            } catch (e) {
                setHeaderHeight(17);
            }
        }
    }, [columns.length, username]); // Only depend on columns.length, not the array itself

    // Keep ref in sync with state
    useEffect(() => {
        headerHeightRef.current = headerHeight;
    }, [headerHeight]);

    const startResizing = useCallback((e, colLabel) => {
        e.preventDefault();
        resizingRef.current = {
            label: colLabel,
            startX: e.clientX,
            startWidth: columnWidths[colLabel] || getInitialWidth(colLabel)
        };

        const onMouseMove = (moveEvent) => {
            if (resizingRef.current) {
                const diff = moveEvent.clientX - resizingRef.current.startX;
                const newWidth = Math.max(40, resizingRef.current.startWidth + diff); // Min width 40px
                setColumnWidths(prev => ({
                    ...prev,
                    [resizingRef.current.label]: newWidth
                }));
                setHasUnsavedChanges(true);
            }
        };

        const onMouseUp = () => {
            resizingRef.current = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    }, [columnWidths, username]);

    const startHeaderResizing = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentHeight = headerHeightRef.current;

        headerResizingRef.current = {
            startY: e.clientY,
            startHeight: currentHeight
        };

        const onMouseMove = (moveEvent) => {
            if (headerResizingRef.current) {
                const diff = moveEvent.clientY - headerResizingRef.current.startY;
                const newHeight = Math.max(10, headerResizingRef.current.startHeight + diff);
                setHeaderHeight(newHeight);
                setHasUnsavedChanges(true);
            }
        };

        const onMouseUp = () => {
            headerResizingRef.current = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'row-resize';
    }, []);

    const handleSave = () => {
        // Validation
        if (validUsers) {
            for (const [key, value] of Object.entries(editForm)) {
                // If the column name matches a known Role and a value is entered
                if (validUsers[key] && value && value.trim() !== '') {
                    // Check case-insensitive
                    const valLower = value.trim().toLowerCase();
                    if (!validUsers[key].has(valLower)) {
                        alert(`Error: El usuario "${value}" no es válido para el rol ${key}.\n\nUsuarios válidos:\n${Array.from(validUsers[key]).join(', ')}`);
                        return; // Stop save
                    }
                }
            }
        }

        if (isAdding) {
            onUpdate('ADD', editForm);
            alert('✅ Registro agregado exitosamente');
        } else {
            onUpdate('UPDATE', editForm);
            alert('✅ Registro actualizado exitosamente');
        }
        setEditingId(null);
        setEditForm({});
        setIsAdding(false);
    };

    const handleDelete = (row) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            onUpdate('DELETE', row);
        }
    };

    // Check if current user is valid (exists in usuarios.csv) or is ADMIN
    const isUserValid = () => {
        // Admins are always allowed (case-insensitive)
        if (role && role.toUpperCase() === 'ADMIN') return true;

        if (!validUsers || !username) {
            console.warn('Validation skipped: missing data', { validUsers: !!validUsers, username });
            return false;
        }

        const lowerUsername = username.toLowerCase();

        // Check if username exists in any role (case-insensitive)
        for (const r in validUsers) {
            if (validUsers[r] && validUsers[r].has(lowerUsername)) {
                return true;
            }
        }

        console.warn('Validation failed for user:', { username, lowerUsername, validUsersKeys: Object.keys(validUsers) });
        return false;
    };

    const startAdd = () => {
        // Check if user is valid before allowing add
        if (!isUserValid()) {
            alert('⚠️ Usuario no autorizado para agregar registros.\n\nSólo los usuarios dados de alta en usuarios.csv pueden agregar registros.');
            return;
        }

        // Scroll to top to ensure new row is visible
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
        }

        // Calculate next Orden value
        let maxOrden = 0;
        if (safeData && safeData.length > 0) {
            maxOrden = safeData.reduce((max, row) => {
                if (!row) return max;
                const val = parseInt(row['Orden']);
                const num = isNaN(val) ? 0 : val;
                return num > max ? num : max;
            }, 0);
        }

        setEditForm({ 'Orden': (maxOrden + 1).toString() });
        setEditingId('new');
        setIsAdding(true);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
        setIsAdding(false);
    };

    const handleEdit = (row) => {
        setEditingId(row._id);
        setEditForm({ ...row });
        setIsAdding(false);
    };

    const handleChange = (colLabel, value) => {
        setEditForm(prev => ({ ...prev, [colLabel]: value }));
    };

    const handleEmail = async (row) => {
        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

            // First, trigger the backup download
            const backupResponse = await axios.post(`${API_BASE_URL}/api/backup`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Get filename from Content-Disposition header
            const contentDisposition = backupResponse.headers['content-disposition'];
            let filename = 'backup.csv';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([backupResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // Now open email client with message
            const subject = `Backup de Inventario - ${new Date().toLocaleDateString('es-AR')}`;
            const body = `Estimado/a,

Adjunto encontrará el backup de inventario solicitado.

El archivo "${filename}" ha sido descargado automáticamente en su carpeta de descargas.
Por favor, adjúntelo a este email antes de enviarlo.

Detalles del registro seleccionado:
- Orden: ${row['Orden'] || 'N/A'}
- Inspector: ${row['INSPECTOR'] || 'N/A'}
- Supervisor: ${row['SUPERVISOR'] || 'N/A'}
- Estado: ${row['Estado'] || 'N/A'}

Links:
- Inventario:      https://inventory-frontend-4e4b.onrender.com/
- Carga Balances:  https://carga-balances.onrender.com/           (a través del link Bonus 6)

Saludos cordiales,
Sistema de Inventario`;

            const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;

        } catch (e) {
            console.error('Email error:', e);
            const errorMsg = e.response?.data?.error || e.message || 'Error desconocido';
            alert(`Error al generar email: ${errorMsg}\n\nPor favor, verifica que el servidor esté funcionando correctamente.`);
        }
    };

    const handleColumnUpdate = async (type, col) => {
        onUpdate('COLUMN_ADD', col);
    };

    const handleSaveLayout = () => {
        const storageKey = `inventory-column-widths-${username}`;
        localStorage.setItem(storageKey, JSON.stringify(columnWidths));

        const headerHeightKey = `inventory-header-height-${username}`;
        localStorage.setItem(headerHeightKey, headerHeight.toString());

        setHasUnsavedChanges(false);
        alert('Layout saved successfully!');
    };

    // Helper to get value handling mismatches
    const getValue = (row, label) => {
        if (row[label] !== undefined) return row[label];

        // Handle known mismatches/encoding issues
        if (label === 'Mes_Año') return row['Mes'];
        if (label === 'AÑO CARGO') return row['A¥O CARGO'] || row['AÑO CARGO'];
        if (label === 'AÑO EXPTE') return row['A¥O EXPTE'] || row['AÑO EXPTE'];

        return null;
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl relative">


            <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h3 className="font-semibold text-lg">
                    Records ({safeData.length})
                    <span className="text-amber-400 text-sm ml-4 font-normal">Sólo se muestran los registros correspondientes al usuario que está logueado; los registros de otros usuarios no se muestran.</span>
                    <span className="text-zinc-400 text-sm ml-4 font-normal">Puedes modificar el ancho de las columnas a tu propia conveniencia</span>
                </h3>
                <div className="flex gap-2">
                    {hasUnsavedChanges && (
                        <button
                            onClick={handleSaveLayout}
                            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors animate-pulse"
                            title="Save column widths and header height"
                        >
                            <Save size={18} />
                            Save Layout
                        </button>
                    )}
                    <button
                        onClick={startAdd}
                        disabled={isAdding || editingId || !isUserValid()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isUserValid() ? "Usuario no autorizado para agregar registros" : "Agregar nuevo registro"}
                    >
                        <Plus size={18} />
                        Add Record
                    </button>
                </div>
            </div>



            <div ref={tableContainerRef} className="overflow-x-auto max-h-[calc(100vh-200px)] border-t border-zinc-700" style={{ scrollbarWidth: 'thin' }}>
                <table className="w-full text-sm text-left border-collapse table-fixed">
                    <thead className="text-xs text-white uppercase bg-slate-700 sticky top-0 z-10">
                        <tr className="relative">
                            <th className="px-2 font-medium border-2 border-slate-400 bg-slate-700 w-[80px] min-w-[80px] max-w-[80px] relative group" style={{ height: `${headerHeight}px` }}>
                                Actions
                                {/* Column width resize handle */}
                                <div
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Actions column is fixed width, but we can add resize if needed
                                        alert('Actions column width is fixed at 100px');
                                    }}
                                />
                                {/* Header height resize handle */}
                                <div
                                    className="absolute left-0 right-0 cursor-row-resize hover:bg-green-500 z-40 bg-green-500/40"
                                    style={{ bottom: '-2px', height: '6px' }}
                                    onMouseDown={startHeaderResizing}
                                    title="Drag to resize header height"
                                />
                            </th>
                            {safeColumns.map((col, index) => (
                                <th
                                    key={`col-${col.id}-${index}`}
                                    className="px-4 font-medium border-2 border-slate-400 relative group bg-slate-700"
                                    style={{ width: columnWidths[col.label] || getInitialWidth(col.label), minWidth: '20px', height: `${headerHeight}px` }}
                                    title={col.label}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-zinc-200 text-[11px] break-words">{col.label}</span>
                                        {col.type && <span className="text-[10px] text-zinc-500 font-normal break-words">{col.type}</span>}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => startResizing(e, col.label)}
                                    />
                                    <div
                                        className="absolute left-0 right-0 cursor-row-resize hover:bg-green-500 z-40 bg-green-500/40"
                                        style={{ bottom: '-2px', height: '6px' }}
                                        onMouseDown={startHeaderResizing}
                                        title="Drag to resize header height"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-slate-400">
                        {isAdding && (
                            <tr className="bg-yellow-100 border-2 border-yellow-500 shadow-inner">
                                <td className="px-4 py-3 border border-yellow-500 bg-yellow-50">
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className="text-green-600 hover:text-green-700" title="Save New Record"><Save size={20} /></button>
                                        <button onClick={handleCancel} className="text-red-600 hover:text-red-700" title="Cancel"><X size={20} /></button>
                                    </div>
                                </td>
                                {safeColumns.map((col, index) => (
                                    <td key={`add-${col.id}-${index}`} className="px-4 py-3 border border-yellow-500 overflow-hidden bg-white">
                                        <input
                                            className="bg-white border text-gray-900 border-yellow-300 rounded px-2 py-1 w-full text-xs focus:outline-none focus:border-yellow-600 font-medium"
                                            value={(editForm && editForm[col.label]) || ''}
                                            onChange={(e) => handleChange(col.label, e.target.value)}
                                            placeholder={col.label}
                                        />
                                    </td>
                                ))}
                            </tr>
                        )}

                        {safeData.map((row, rowIndex) => {
                            const isEditing = editingId === row._id;
                            return (
                                <tr key={`row-${row._id}-${rowIndex}`} className={clsx("hover:bg-blue-400 transition-colors odd:bg-slate-300 even:bg-slate-400", isEditing && "!bg-blue-300")}>
                                    <td className="px-4 py-3 border border-slate-500 bg-transparent">
                                        <div className="flex gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSave} className="text-green-400 hover:text-green-300" title="Save"><Save size={16} /></button>
                                                    <button onClick={handleCancel} className="text-red-400 hover:text-red-300" title="Cancel"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(row)} className="text-primary-400 hover:text-primary-300" title="Edit"><Pencil size={14} /></button>
                                                    <button onClick={() => handleEmail(row)} className="text-blue-400 hover:text-blue-300" title="Email"><Mail size={14} /></button>
                                                    <button onClick={() => handleDelete(row)} className="text-zinc-500 hover:text-red-400" title="Delete"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    {safeColumns.map((col, colIndex) => {
                                        // Use stored value for Orden
                                        let val = getValue(row, col.label);

                                        return (
                                            <td key={`cell-${row._id}-${col.id}-${colIndex}`} className={clsx("px-4 py-3 whitespace-nowrap border border-slate-500 overflow-hidden max-w-0", isFinancialColumn(col.label) && "text-right")}>
                                                {isEditing ? (
                                                    col.label === 'Orden' ? (
                                                        // Display read-only order number in edit mode
                                                        <span className="text-gray-700 text-xs truncate block" title={val}>
                                                            {val}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            className={clsx("bg-white border border-slate-600 rounded px-2 py-1 w-full text-gray-900 text-xs focus:outline-none focus:border-blue-700", isFinancialColumn(col.label) && "text-right")}
                                                            value={editForm[col.label] || ''}
                                                            onChange={(e) => handleChange(col.label, e.target.value)}
                                                        />
                                                    )
                                                ) : (
                                                    <span className={clsx("text-gray-900 text-xs truncate block w-full", isFinancialColumn(col.label) && "text-right")} title={val}>
                                                        {val || '-'}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
