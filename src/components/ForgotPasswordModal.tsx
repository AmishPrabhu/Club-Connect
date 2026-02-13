import React, { useState, useEffect } from 'react';
import { X, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Page } from '../types/page';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialEmail?: string;
    onNavigate?: (page: Page) => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onNavigate }: ForgotPasswordModalProps) {
    const [email, setEmail] = useState(initialEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'userNotFound'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { resetPassword } = useAuth();

    // Update email when initialEmail changes (e.g., when modal opens)
    useEffect(() => {
        if (isOpen) {
            setEmail(initialEmail);
            setStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen, initialEmail]);

    if (!isOpen) return null;

    const hasPrefilledEmail = initialEmail.trim() !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {


            await resetPassword(email);
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setEmail('');
            }, 3000);
        } catch (error: any) {
            console.error('Reset password error:', error);
            if (error.code === 'auth/invalid-email') {
                setStatus('error');
                setErrorMessage('Please enter a valid email address.');
            } else {
                setStatus('error');
                setErrorMessage('Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'success' ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Check your email</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                We've sent a password reset link to <br />
                                <span className="font-medium text-slate-900 dark:text-white">{email}</span>
                            </p>
                        </div>
                    ) : status === 'userNotFound' ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Account Found</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                We couldn't find an account with <br />
                                <span className="font-medium text-slate-900 dark:text-white">{email}</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStatus('idle');
                                        setErrorMessage('');
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        if (onNavigate) {
                                            onNavigate('signUp');
                                        }
                                    }}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    Create Account
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : hasPrefilledEmail ? (
                        // Confirmation UI when email is pre-filled
                        <div className="space-y-6">
                            <p className="text-slate-600 dark:text-slate-400">
                                Send a password reset link to:
                            </p>

                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <span className="font-medium text-slate-900 dark:text-white">{email}</span>
                            </div>

                            {status === 'error' && (
                                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{errorMessage}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Confirm
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Form UI when no email is pre-filled
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <p className="text-slate-600 dark:text-slate-400">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            {status === 'error' && (
                                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{errorMessage}</p>
                                </div>
                            )}

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
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="your.email@walchandsangli.ac.in"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Link
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

