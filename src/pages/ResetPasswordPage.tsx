import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { Page } from '../types/page';
import api from '../lib/api';

interface ResetPasswordPageProps {
    onNavigate: (page: Page) => void;
}

export default function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');

    // Get token and email from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');
        const emailParam = params.get('email');

        if (tokenParam) setToken(tokenParam);
        if (emailParam) setEmail(decodeURIComponent(emailParam));

        if (!tokenParam || !emailParam) {
            setStatus('error');
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, email, password });
            setStatus('success');

            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                onNavigate('login');
            }, 3000);
        } catch (err: any) {
            setStatus('error');
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#002147] p-6 text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                        <p className="text-blue-200 text-sm mt-1">Create a new password for your account</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {status === 'success' ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Password Reset Successful!</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Your password has been updated. Redirecting to login...
                                </p>
                            </div>
                        ) : status === 'error' && !token ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Invalid Reset Link</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                                <button
                                    onClick={() => onNavigate('login')}
                                    className="px-6 py-3 bg-[#002147] text-white font-semibold rounded-xl hover:bg-[#003366] transition-colors"
                                >
                                    Back to Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {email && (
                                    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Resetting password for:</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">{email}</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-md">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all outline-none"
                                            placeholder="Enter new password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all outline-none"
                                            placeholder="Confirm new password"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <KeyRound className="w-5 h-5" />
                                            Reset Password
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onNavigate('login')}
                                    className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-[#002147] transition-colors py-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
