import { useState } from 'react';

import { Shield, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Page } from '../types/page';

interface SetupAdminProps {
    onNavigate: (page: Page) => void;
}

export default function SetupAdmin({ onNavigate }: SetupAdminProps) {
    const [email, setEmail] = useState('admin@wce.ac.in');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('Super Admin');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // Create admin via API
            const { default: api } = await import('../lib/api');
            const response = await api.post('/auth/signup', {
                email,
                password,
                name,
                role: 'admin'
            });

            const uid = response.data.user.id;

            setMessage({
                type: 'success',
                text: `Super Admin created successfully! ID: ${uid}. You can now login with these credentials.`,
            });
        } catch (error: any) {
            console.error('Error creating admin:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || error.message || 'Failed to create admin user',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Back Button */}
                <button
                    onClick={() => onNavigate('home')}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white mb-8 transition-colors font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6 border border-blue-100 dark:border-blue-800">
                        <Shield className="w-4 h-4 text-[#002147] dark:text-blue-400" />
                        <span className="text-sm font-bold text-[#002147] dark:text-blue-300">Initial Setup</span>
                    </div>

                    <h1 className="text-3xl font-serif font-bold text-[#002147] dark:text-white mb-4">
                        Create <span className="text-[#DAA520]">Super Admin</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                        Set up the initial administrator account
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border-l-4 border-[#DAA520]">
                    <form onSubmit={handleCreateAdmin} className="space-y-6">
                        {message && (
                            <div className={`p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}>
                                <p className={`text-sm ${message.type === 'success'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {message.text}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Admin Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Super Admin"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="admin@wce.ac.in"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Enter a strong password"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Minimum 6 characters
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#002147] hover:bg-[#00152e] disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-md uppercase tracking-wide flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating Admin...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5 text-[#DAA520]" />
                                    Create Super Admin
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Warning */}
                <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong>⚠️ Important:</strong> Remove or disable this page after creating the initial admin account for security.
                    </p>
                </div>
            </div>
        </div>
    );
}
