import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const ColumnManager = ({ columns, onClose, onUpdate }) => {
    const [newCol, setNewCol] = useState({ label: '', type: 'Albabetico', length: '50', required: 'No' });

    const handleAdd = () => {
        if (!newCol.label) return;
        onUpdate('ADD', newCol);
        setNewCol({ label: '', type: 'Albabetico', length: '50', required: 'No' });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-2xl w-full shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Manage Columns</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white"><X /></button>
                </div>

                <div className="flex gap-2 mb-6 p-4 bg-zinc-800/50 rounded-lg">
                    <input
                        placeholder="Column Name"
                        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white flex-1"
                        value={newCol.label}
                        onChange={e => setNewCol({ ...newCol, label: e.target.value })}
                    />
                    <select
                        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
                        value={newCol.type}
                        onChange={e => setNewCol({ ...newCol, type: e.target.value })}
                    >
                        <option value="Albabetico">Text</option>
                        <option value="Entero">Number</option>
                        <option value="Fecha">Date</option>
                    </select>
                    <button
                        onClick={handleAdd}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {columns.map(col => (
                        <div key={col.id} className="flex justify-between items-center p-3 bg-zinc-800 rounded border border-zinc-700">
                            <div>
                                <span className="font-medium text-white">{col.label}</span>
                                <span className="ml-2 text-xs text-zinc-500">({col.type})</span>
                            </div>
                            {/* Delete could be added here */}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
