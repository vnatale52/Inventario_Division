import React from 'react';
import { motion } from 'framer-motion';

const ROLES = [
    'INSPECTOR',
    'SUPERVISOR',
    'REVISOR DIV',
    'JEFE DIV',
    'REVISOR DEPTO',
    'REVISOR DIREC'
];

export const RoleSelector = ({ onSelect }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl"
            >
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Your Role</h2>
                <div className="grid grid-cols-1 gap-3">
                    {ROLES.map((role) => (
                        <button
                            key={role}
                            onClick={() => onSelect(role)}
                            className="p-4 rounded-xl bg-zinc-800 hover:bg-primary-600 hover:text-white text-zinc-300 transition-all duration-200 font-medium text-left flex items-center justify-between group"
                        >
                            {role}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
