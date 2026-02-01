import { useState, useEffect } from 'react';
import { UserPlus, ArrowLeft, GraduationCap, Eye, EyeOff, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';

interface SignUpPageProps {
    onNavigate: (page: Page) => void;
}

interface GoogleSignupData {
    email: string;
    name: string;
    credential: string;
}

export default function SignUpPage({ onNavigate }: SignUpPageProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleData, setGoogleData] = useState<GoogleSignupData | null>(null);
    const [step, setStep] = useState<'DETAILS' | 'OTP' | 'EMAIL'>('EMAIL');

    // Timer state
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const [error, setError] = useState('');
    const { signUp, signInWithGoogle, signUpWithGoogle, sendOtp, verifyOtp, isLoading, user, isAuthenticated } = useAuth();

    // Check for Google signup data on mount
    useEffect(() => {
        const storedGoogleData = localStorage.getItem('googleSignupData');
        if (storedGoogleData) {
            try {
                const parsed = JSON.parse(storedGoogleData);
                setGoogleData(parsed);
                setName(parsed.name);
                setEmail(parsed.email);
                localStorage.removeItem('googleSignupData'); // Clear after reading
                setStep('DETAILS'); // Google signup doesn't need OTP step here as verified by Google
            } catch (e) {
                console.error('Failed to parse Google signup data');
            }
        }
    }, []);

    // Countdown timer effect
    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Navigate when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                onNavigate('adminDashboard');
            } else if (['club-secretary', 'president', 'treasurer'].includes(user.role)) {
                onNavigate('clubSecretaryDashboard');
            } else {
                onNavigate('userProfile');
            }
        }
    }, [isAuthenticated, user, onNavigate]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email');
            return;
        }

        if (!email.endsWith('@walchandsangli.ac.in')) {
            setError('Only @walchandsangli.ac.in email addresses are allowed');
            return;
        }

        const result = await sendOtp(email);
        if (result.success) {
            setStep('OTP');
            setTimer(60); // 60 seconds cooldown
            setCanResend(false);
        } else {
            setError(result.error || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!otp) {
            setError('Please enter the OTP');
            return;
        }

        const result = await verifyOtp(email, otp);
        if (result.success) {
            setStep('DETAILS');
        } else {
            setError(result.error || 'Invalid OTP');
        }
    };

    const handleResendOtp = async () => {
        setError('');
        const result = await sendOtp(email);
        if (result.success) {
            setTimer(60);
            setCanResend(false);
            setError(''); // Clear any previous errors
            // Optional: Show success message
        } else {
            setError(result.error || 'Failed to resend OTP');
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // If we have Google data, use Google signup
        if (googleData) {
            const result = await signUpWithGoogle(googleData.credential, password);
            if (!result.success) {
                setError(result.error || 'Failed to create account');
            }
        } else {
            // Regular signup with OTP
            if (!name || !email || !password || !confirmPassword || !otp) {
                setError('Please fill in all fields');
                return;
            }

            const result = await signUp(email, password, name, otp);
            if (!result.success) {
                setError(result.error || 'Failed to create account');
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setError('');
        const result = await signInWithGoogle(credentialResponse.credential);
        if (!result.success) {
            if (result.needsSignup && result.googleData) {
                // Set Google data for signup form
                setGoogleData(result.googleData);
                setName(result.googleData.name);
                setEmail(result.googleData.email);
                setStep('DETAILS');
            } else {
                setError(result.error || 'Failed to sign in with Google');
            }
        }
    };

    const handleCancelGoogleSignup = () => {
        setGoogleData(null);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setStep('EMAIL');
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
            {/* Left Split - Inspiration Side */}
            <div className="hidden lg:flex w-1/2 bg-college-blue-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute inset-0 z-0 bg-[#002147]">
                    <img
                        src="/wce-campus.png"
                        alt="Walchand College Campus"
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#002147]/90 to-[#002147]/70" />
                </div>

                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-3">
                        <img src="/wce-logo.png" alt="WCE Logo" className="w-10 h-10 bg-white rounded-full p-1" />
                        <span className="font-serif font-bold tracking-widest text-sm uppercase">Walchand College</span>
                    </div>
                </div>

                <div className="relative z-10 mb-8">
                    <h1 className="text-5xl font-serif font-bold mb-4 leading-tight">
                        Start Your Journey<br />
                        <span className="text-college-gold">Create an Account</span>
                    </h1>
                    <p className="text-lg font-light text-blue-100 max-w-sm">
                        Join thousands of students involved in over 30+ technical and cultural clubs.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4">
                    <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-college-blue-900"></div>
                        <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-college-blue-900"></div>
                        <div className="w-10 h-10 rounded-full bg-slate-400 border-2 border-college-blue-900"></div>
                    </div>
                    <div className="text-sm font-medium pt-2">
                        Join 2,500+ Peers
                    </div>
                </div>
            </div>


            {/* Right Split - Functionality */}
            <div className="w-full lg:w-1/2 flex flex-col h-full overflow-y-auto">
                <div className="p-6 lg:p-8 w-full flex-none z-10 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <button
                        onClick={() => {
                            if (step === 'OTP') setStep('EMAIL');
                            else if (step === 'DETAILS' && !googleData) setStep('OTP');
                            else onNavigate('home');
                        }}
                        className="flex items-center gap-2 text-slate-500 hover:text-college-blue-primary dark:hover:text-blue-400 transition-all font-medium text-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center w-full px-6 lg:px-16 pb-12">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3">
                                <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {googleData ? 'Complete Your Registration' : 'Student Registration'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {googleData
                                    ? 'Set a password for your account'
                                    : 'Please verify your college email to get started'}
                            </p>
                        </div>

                        {/* Show Google info banner when signing up with Google */}
                        {googleData && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{googleData.name}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{googleData.email}</p>
                                    </div>
                                    <button
                                        onClick={handleCancelGoogleSignup}
                                        className="text-slate-400 hover:text-slate-600 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Google Sign Up - only show if not already in Google signup mode and in EMAIL step */}
                        {!googleData && step === 'EMAIL' && (
                            <>
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google sign-in failed. Please try again.')}
                                        theme="outline"
                                        size="large"
                                        text="signup_with"
                                        shape="rectangular"
                                        logo_alignment="left"
                                    />
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                        Only @walchandsangli.ac.in emails allowed
                                    </p>
                                </div>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                                        <span className="px-4 bg-slate-50 dark:bg-slate-900 text-slate-400">Or Register Manually</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-md mb-6 animate-pulse">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">⚠️ {error}</p>
                            </div>
                        )}

                        {/* Step 1: Email Input */}
                        {!googleData && step === 'EMAIL' && (
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div className="grid grid-cols-1 gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-college-blue-primary/20 focus:border-college-blue-primary transition-all outline-none"
                                            placeholder="your.name@walchandsangli.ac.in"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 ml-1">Only @walchandsangli.ac.in emails allowed</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#DAA520] hover:bg-[#B8860B] text-[#002147] font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-yellow-500/30 flex items-center justify-center gap-3 mt-6"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#002147]/30 border-t-[#002147] rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Send verification code</span>
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {!googleData && step === 'OTP' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div className="text-center mb-4">
                                    <p className="text-sm text-slate-500">
                                        We sent a verification code to <br />
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setStep('EMAIL')}
                                        className="text-xs text-college-blue-primary hover:underline mt-1"
                                    >
                                        Change email
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Verification Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-college-blue-primary/20 focus:border-college-blue-primary transition-all outline-none text-center text-2xl tracking-[0.5em] font-mono"
                                        placeholder="······"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#DAA520] hover:bg-[#B8860B] text-[#002147] font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-yellow-500/30 flex items-center justify-center gap-3 mt-6"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#002147]/30 border-t-[#002147] rounded-full animate-spin" />
                                    ) : (
                                        <span>Verify Code</span>
                                    )}
                                </button>

                                <div className="text-center mt-4">
                                    <p className="text-sm text-slate-500">
                                        Didn't receive code?{' '}
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={!canResend || isLoading}
                                            className={`font-semibold ${!canResend ? 'text-slate-400 cursor-not-allowed' : 'text-college-blue-primary hover:underline'}`}
                                        >
                                            Resend {timer > 0 ? `(${timer}s)` : ''}
                                        </button>
                                    </p>
                                </div>
                            </form>
                        )}


                        {/* Step 3: User Details */}
                        {(googleData || step === 'DETAILS') && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-4">
                                    {/* Only show name field for manual signup as email is fixed */}
                                    {!googleData && (
                                        <>
                                            <div className="grid grid-cols-1 gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-college-blue-primary/20 focus:border-college-blue-primary transition-all outline-none"
                                                    placeholder="e.g. Amish Prabhu"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-college-blue-primary/20 focus:border-college-blue-primary transition-all outline-none"
                                                    placeholder="••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-college-blue-primary/20 focus:border-college-blue-primary transition-all outline-none"
                                                    placeholder="••••••"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#DAA520] hover:bg-[#B8860B] text-[#002147] font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-yellow-500/30 flex items-center justify-center gap-3 mt-6"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#002147]/30 border-t-[#002147] rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            <span>{googleData ? 'Complete Registration' : 'Create Account'}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        <p className="mt-8 text-center text-slate-500 text-sm">
                            Already have an account?{' '}
                            <button
                                onClick={() => onNavigate('login')}
                                className="text-college-blue-primary dark:text-blue-400 font-bold hover:underline"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
