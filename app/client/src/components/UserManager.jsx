import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

export const UserManager = ({ onClose }) => {
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3001/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data.roles);
            setUsers(response.data.users);
            setError(null);
        } catch (err) {
            setError('Failed to load users: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (rowIndex, colIndex, value) => {
        const newUsers = [...users];
        newUsers[rowIndex][colIndex] = value;
        setUsers(newUsers);
        setHasChanges(true);
    };

    const handleAddRow = () => {
        const newRow = new Array(roles.length).fill('');
        setUsers([...users, newRow]);
        setHasChanges(true);
    };

    const handleDeleteRow = (rowIndex) => {
        if (window.confirm('Are you sure you want to delete this row?')) {
            const newUsers = users.filter((_, i) => i !== rowIndex);
            setUsers(newUsers);
            setHasChanges(true);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Validate: check for duplicate usernames
            const allUsernames = users.flat().filter(u => u.trim() !== '');
            const uniqueUsernames = new Set(allUsernames);
            if (allUsernames.length !== uniqueUsernames.size) {
                setError('Duplicate usernames detected. Each username must be unique.');
                setSaving(false);
                return;
            }

            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3001/api/users',
                { roles, users },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setHasChanges(false);
            alert('Users saved successfully! Database has been updated.');
        } catch (err) {
            setError('Failed to save users: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700">
                    <p className="text-white">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">User Management</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-2">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto p-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-700">
                                <th className="px-4 py-2 border border-slate-400 text-white text-left w-16">Row</th>
                                {roles.map((role, i) => (
                                    <th key={i} className="px-4 py-2 border border-slate-400 text-white text-left">
                                        {role}
                                    </th>
                                ))}
                                <th className="px-4 py-2 border border-slate-400 text-white text-left w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((userRow, rowIndex) => (
                                <tr key={rowIndex} className="odd:bg-slate-300 even:bg-slate-400 hover:bg-blue-400 transition-colors">
                                    <td className="px-4 py-2 border border-slate-500 text-gray-900 font-medium">
                                        {rowIndex + 1}
                                    </td>
                                    {userRow.map((username, colIndex) => (
                                        <td key={colIndex} className="px-2 py-2 border border-slate-500">
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                className="w-full px-2 py-1 bg-white border border-slate-400 rounded text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                                                placeholder={`User for ${roles[colIndex]}`}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-2 py-2 border border-slate-500 text-center">
                                        <button
                                            onClick={() => handleDeleteRow(rowIndex)}
                                            className="text-red-600 hover:text-red-400 transition-colors"
                                            title="Delete row"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-700 flex justify-between items-center">
                    <button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Add Row
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="px-4 pb-4">
                    <p className="text-xs text-zinc-400">
                        <strong>Note:</strong> Each row represents a hierarchy level. Users in the same row are related (e.g., Vincenzo → Supervisor1 → RevisorDiv1).
                        All usernames must be unique. Default password for new users is <code className="bg-zinc-800 px-1 rounded">password123</code>.
                    </p>
                </div>
            </div>
        </div>
    );
};
