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
            // Prioritize width from CSV (col.width), then heuristic
            initialWidths[col.label] = col.width || getInitialWidth(col.label);
        });

        if (savedWidths) {
            try {
                const parsed = JSON.parse(savedWidths);
                // Merge saved widths with defaults for new columns
                setColumnWidths({ ...initialWidths, ...parsed });
            } catch (e) {
                setColumnWidths(initialWidths);
            }
        } else {
            setColumnWidths(initialWidths);
        }

        // Load header height from localStorage
        // ... (omitted) ...
    }, [columns, username]); // Updated dependency to columns (array)

    // ...

    <div ref={tableContainerRef} className="overflow-x-auto max-h-[calc(100vh-200px)] border-t border-zinc-700" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="text-xs text-white uppercase bg-slate-700 sticky top-0 z-10">
                {/* 1) NEW ROW FOR COLUMN NUMBERS */}
                <tr className="bg-slate-800 text-zinc-400 text-[10px] text-center">
                    <th className="border-r border-slate-600 bg-slate-800">
                        {/* Actions column has no number */}
                    </th>
                    {safeColumns.map((col, index) => (
                        <th
                            key={`idx-${col.id}-${index}`}
                            className="border-r border-slate-600 font-normal py-0.5"
                            style={{ width: columnWidths[col.label] || (col.width || getInitialWidth(col.label)) }}
                        >
                            {col.column_id}
                        </th>
                    ))}
                </tr>

                <tr className="relative">
                    <th className="px-2 font-medium border-2 border-slate-400 bg-slate-700 w-[80px] min-w-[80px] max-w-[80px] relative group" style={{ height: `${headerHeight}px` }}>
                        Actions
                    // ...
                    </th>
                    {safeColumns.map((col, index) => (
                        <th
                            key={`col-${col.id}-${index}`}
                            className="px-4 font-medium border-2 border-slate-400 relative group bg-slate-700"
                            // Use defaults logic here too for inline style to prevent flickering
                            style={{ width: columnWidths[col.label] || (col.width || getInitialWidth(col.label)), minWidth: '20px', height: `${headerHeight}px` }}
                            title={col.label}
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-zinc-200 text-[11px] break-words">
                                    {/* 3) REPLACE 'al¡cuota' with 'alicuota' */}
                                    {col.label.replace('al¡cuota', 'alicuota')}
                                </span>
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
        </div >
    );
};
