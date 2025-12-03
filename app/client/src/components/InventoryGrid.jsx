import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Save, X, Mail, Settings } from 'lucide-react';
import clsx from 'clsx';
import { ColumnManager } from './ColumnManager';
import axios from 'axios';

// Helper to determine initial width based on column name
const getInitialWidth = (label) => {
    // Small columns: ~5 characters width (50px - reduced)
    const smallColumns = [
        'Mes', 'Año', 'Orden', 'DIR', 'DPTO', 'DIV', 'SECT', 'CARGO',
        'AÑO CARGO', 'AÑO EXPTE', 'CATEG CONTR', 'DV', 'TR',
        'Cargo nuevo del mes actual', 'Ingresa como DV/TR del mes actual',
        'Queda stock mes actual', 'Descargo del mes actual'
    ];

    // Medium columns: ~14 characters width (120px - reduced)
    const mediumColumns = [
        'Dif. canceladas en un pago - Impuesto', 'Dif. canceladas en un pago - Accesorios',
        'Pago en Curso Rectif. - Impuesto', 'Pago en Curso Rectif. - Accesorios',
        'Plan de facilidades - Impuesto', 'Plan de facilidades - Accesorios', 'Plan de facilidades - cantidad',
        'Multa reducida - Impuesto', 'Multa reducida - Accesorios', 'Multa reducida - cantidad',
        'BD - Dif. de al¡cuota - Impuesto', 'BD - Dif. de al¡cuota - Accesorios',
        'BD - Desc. improc. - Impuesto', 'BD - Desc. improc. - Accesorios',
        'BD - Dif. acept. no abonada - Impuesto', 'BD - Dif. acept. no abonada - Accesorios',
        'BD - Deuda concursal falencial - Impuesto', 'BD - Deuda concursal falencial - Accesorios',
        'ISIB Dif. no conformadas - Impuesto', 'ISIB Dif. no conformadas - Accesorios',
        'Sellos Pago en curso - Impuesto', 'Sellos pago en curso - Accesorios',
        'Sellos BD - Impuesto', 'Sellos BD - Accesorios',
        'Sellos Plan de facilid. - Impuesto', 'Sellos Plan de facilid. - Accesorios', 'Sellos Plan de facilid. - cantidad',
        'Sellos Dif. no conformadas - Impuesto', 'Sellos Dif. no conformadas - Accesorios',
        'Empadron. Pago en curso - Impuesto', 'Empadron. Pago en curso - Accesorios',
        'Empadronados BD - Impuesto', 'Empadronados BD - Accesorios',
        'Total Dif. conformadas - Impuesto', 'Total Dif. conformadas - Accesorios',
        'Total Dif. NO conformadas - Impuesto', 'Total Dif. NO conformadas - Accesorios',
        'Recaudación Total', 'Recaudación Nominal'
    ];

    // Use exact matching instead of includes() to prevent false matches
    if (smallColumns.includes(label)) return 50;
    if (mediumColumns.includes(label)) return 120;
    return 150; // Default width for other columns
};

// Helper to determine if column should be left-aligned (financial columns)
const isFinancialColumn = (label) => {
    const financialColumns = [
        'Dif. canceladas en un pago - Impuesto', 'Dif. canceladas en un pago - Accesorios',
        'Pago en Curso Rectif. - Impuesto', 'Pago en Curso Rectif. - Accesorios',
        'Plan de facilidades - Impuesto', 'Plan de facilidades - Accesorios', 'Plan de facilidades - cantidad',
        'Multa reducida - Impuesto', 'Multa reducida - Accesorios', 'Multa reducida - cantidad',
        'BD - Dif. de al¡cuota - Impuesto', 'BD - Dif. de al¡cuota - Accesorios',
        'BD - Desc. improc. - Impuesto', 'BD - Desc. improc. - Accesorios',
        'BD - Dif. acept. no abonada - Impuesto', 'BD - Dif. acept. no abonada - Accesorios',
        'BD - Deuda concursal falencial - Impuesto', 'BD - Deuda concursal falencial - Accesorios',
        'ISIB Dif. no conformadas - Impuesto', 'ISIB Dif. no conformadas - Accesorios',
        'Sellos Pago en curso - Impuesto', 'Sellos pago en curso - Accesorios',
        'Sellos BD - Impuesto', 'Sellos BD - Accesorios',
        'Sellos Plan de facilid. - Impuesto', 'Sellos Plan de facilid. - Accesorios', 'Sellos Plan de facilid. - cantidad',
        'Sellos Dif. no conformadas - Impuesto', 'Sellos Dif. no conformadas - Accesorios',
        'Empadron. Pago en curso - Impuesto', 'Empadron. Pago en curso - Accesorios',
        'Empadronados BD - Impuesto', 'Empadronados BD - Accesorios',
        'Total Dif. conformadas - Impuesto', 'Total Dif. conformadas - Accesorios',
        'Total Dif. NO conformadas - Impuesto', 'Total Dif. NO conformadas - Accesorios',
        'Recaudación Total', 'Recaudación Nominal'
    ];
    return financialColumns.includes(label);
};

export const InventoryGrid = ({ data, columns, onUpdate, role }) => {
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

    // Safety checks - force new array instances
    const safeData = Array.isArray(data) ? [...data].filter(Boolean) : [];
    const safeColumns = Array.isArray(columns) ? [...columns].filter(Boolean) : [];

    // Initialize column widths from localStorage or defaults
    useEffect(() => {
        if (!columns || columns.length === 0) return;

        const storageKey = `inventory-column-widths-${role}`;
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
        const headerHeightKey = `inventory-header-height-${role}`;
        const savedHeaderHeight = localStorage.getItem(headerHeightKey);
        if (savedHeaderHeight) {
            try {
                setHeaderHeight(parseInt(savedHeaderHeight, 10));
            } catch (e) {
                setHeaderHeight(17);
            }
        }
    }, [columns.length, role]); // Only depend on columns.length, not the array itself

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
    }, [columnWidths, role]);

    const startHeaderResizing = useCallback((e) => {
        console.log('startHeaderResizing called', e);
        e.preventDefault();
        e.stopPropagation();

        const currentHeight = headerHeightRef.current;
        console.log('Current header height:', currentHeight);

        headerResizingRef.current = {
            startY: e.clientY,
            startHeight: currentHeight
        };
        console.log('Header resize started:', headerResizingRef.current);

        const onMouseMove = (moveEvent) => {
            if (headerResizingRef.current) {
                const diff = moveEvent.clientY - headerResizingRef.current.startY;
                const newHeight = Math.max(10, headerResizingRef.current.startHeight + diff); // Min height reduced to 10px
                console.log('Moving:', { diff, newHeight });
                setHeaderHeight(newHeight);
                setHasUnsavedChanges(true);
            }
        };

        const onMouseUp = () => {
            console.log('Mouse up - resize ended');
            headerResizingRef.current = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'row-resize';
    }, []);

    const handleEdit = (row) => {
        setEditingId(row._id);
        setEditForm(row);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
        setIsAdding(false);
    };

    const handleSave = () => {
        if (isAdding) {
            onUpdate('ADD', editForm);
        } else {
            onUpdate('UPDATE', editForm);
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

    const startAdd = () => {
        setIsAdding(true);
        setEditingId('new');
        setEditForm({});
    };

    const handleChange = (colLabel, value) => {
        setEditForm(prev => ({ ...prev, [colLabel]: value }));
    };

    const handleEmail = async (row) => {
        try {
            const res = await axios.post('http://localhost:3001/api/email', { row });
            const { subject, body } = res.data;
            const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
        } catch (e) {
            alert('Error generating email');
        }
    };

    const handleColumnUpdate = async (type, col) => {
        onUpdate('COLUMN_ADD', col);
    };

    const handleSaveLayout = () => {
        const storageKey = `inventory-column-widths-${role}`;
        localStorage.setItem(storageKey, JSON.stringify(columnWidths));

        const headerHeightKey = `inventory-header-height-${role}`;
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            {showColManager && (
                <ColumnManager
                    columns={safeColumns}
                    onClose={() => setShowColManager(false)}
                    onUpdate={handleColumnUpdate}
                />
            )}

            <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h3 className="font-semibold text-lg">Records ({safeData.length})</h3>
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
                        onClick={() => setShowColManager(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                        <Settings size={18} />
                        Columns
                    </button>
                    <button
                        onClick={startAdd}
                        disabled={isAdding || editingId}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                        Add Record
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-200px)] border-t border-zinc-700" style={{ scrollbarWidth: 'thin' }}>
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
                                    style={{ width: columnWidths[col.label] || getInitialWidth(col.label), minWidth: '40px', height: `${headerHeight}px` }}
                                    title={col.label}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-zinc-200 text-[11px] break-words">{col.label}</span>
                                        {col.type && <span className="text-[10px] text-zinc-500 font-normal break-words">{col.type}</span>}
                                    </div>
                                    {/* Resize handle */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => startResizing(e, col.label)}
                                    />
                                    {/* Header height resize handle - visible on all columns */}
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
                    <tbody className="bg-slate-50">
                        {isAdding && (
                            <tr className="bg-primary-900/10">
                                <td className="px-4 py-3 border border-slate-300 bg-white">
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className="text-green-400 hover:text-green-300"><Save size={18} /></button>
                                        <button onClick={handleCancel} className="text-red-400 hover:text-red-300"><X size={18} /></button>
                                    </div>
                                </td>
                                {safeColumns.map((col, index) => (
                                    <td key={`add-${col.id}-${index}`} className="px-4 py-3 border border-slate-300 overflow-hidden">
                                        <input
                                            className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-gray-900 text-xs focus:outline-none focus:border-blue-500"
                                            value={editForm[col.label] || ''}
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
                                <tr key={`row-${row._id}-${rowIndex}`} className={clsx("hover:bg-blue-100 transition-colors odd:bg-white even:bg-slate-50", isEditing && "!bg-blue-50")}>
                                    <td className="px-4 py-3 border border-slate-300 bg-slate-50">
                                        <div className="flex gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSave} className="text-green-400 hover:text-green-300" title="Save"><Save size={16} /></button>
                                                    <button onClick={handleCancel} className="text-red-400 hover:text-red-300" title="Cancel"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(row)} className="text-primary-400 hover:text-primary-300" title="Edit"><Settings size={14} /></button>
                                                    <button onClick={() => handleEmail(row)} className="text-blue-400 hover:text-blue-300" title="Email"><Mail size={14} /></button>
                                                    <button onClick={() => handleDelete(row)} className="text-zinc-500 hover:text-red-400" title="Delete"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    {safeColumns.map((col, colIndex) => {
                                        // Auto-generate order number for "Orden" column
                                        let val = getValue(row, col.label);
                                        if (col.label === 'Orden') {
                                            val = rowIndex + 1; // Auto-generate sequential order starting from 1
                                        }

                                        return (
                                            <td key={`cell-${row._id}-${col.id}-${colIndex}`} className={clsx("px-4 py-3 whitespace-nowrap border border-slate-300 overflow-hidden", isFinancialColumn(col.label) && "text-right")}>
                                                {isEditing ? (
                                                    col.label === 'Orden' ? (
                                                        // Display read-only order number in edit mode
                                                        <span className="text-gray-700 text-xs truncate block" title={val}>
                                                            {val}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            className={clsx("bg-white border border-slate-300 rounded px-2 py-1 w-full text-gray-900 text-xs focus:outline-none focus:border-blue-500", isFinancialColumn(col.label) && "text-right")}
                                                            value={editForm[col.label] || ''}
                                                            onChange={(e) => handleChange(col.label, e.target.value)}
                                                        />
                                                    )
                                                ) : (
                                                    <span className={clsx("text-gray-900 text-xs truncate block", isFinancialColumn(col.label) && "text-right")} title={val}>
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
