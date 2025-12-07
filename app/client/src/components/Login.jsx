import React, { useState } from 'react';
import { login, register } from '../api';
import { Loader2 } from 'lucide-react';

export const Login = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('INSPECTOR'); // Default role for registration
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isRegistering) {
                await register(username, password, role);
                // Auto login after register or just switch to login
                setIsRegistering(false);
                setError('Registration successful! Please login.');
            } else {
                const data = await login(username, password);
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    onLogin(data.user);
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h2>
                {!isRegistering && (
                    <p className="text-zinc-400 text-center mb-6 text-sm">
                        Administración del Inventario de Expedientes de Fiscalización
                    </p>
                )}

                {error && (
                    <div className={`p-3 rounded-lg mb-4 text-sm ${error.includes('successful') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            >
                                <option value="INSPECTOR">INSPECTOR</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="REVISOR DIV">REVISOR DIV</option>
                                <option value="JEFE DIV">JEFE DIV</option>
                                <option value="REVISOR DEPTO">REVISOR DEPTO</option>
                                <option value="REVISOR DIREC">REVISOR DIREC</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isRegistering ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-4">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>

                    <div className="pt-4 border-t border-zinc-800">
                        <a
                            href="/PROJECT_DOCUMENTATION.md"
                            download
                            className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            Descargar Documentación del Proyecto
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
