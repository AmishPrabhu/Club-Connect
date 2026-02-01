import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [error, setError] = useState('');
  const { login, signInWithGoogle, isLoading, user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        onNavigate('adminDashboard');
      } else if (user.role === 'advisor') {
        onNavigate('advisorDashboard');
      } else if (['club-secretary', 'president', 'treasurer'].includes(user.role)) {
        onNavigate('clubSecretaryDashboard');
      } else {
        onNavigate('userProfile');
      }
    }
  }, [isAuthenticated, user, onNavigate]);

  // Lockout state
  // Lockout state
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Update lockout state when email changes
  useEffect(() => {
    if (!email) {
      setLockoutUntil(null);
      return;
    }
    const saved = localStorage.getItem(`loginLockout_${email.toLowerCase()}`);
    if (saved) {
      const timestamp = parseInt(saved, 10);
      setLockoutUntil(timestamp > Date.now() ? timestamp : null);
    } else {
      setLockoutUntil(null);
    }
  }, [email]);

  const [timeLeft, setTimeLeft] = useState<string>('');

  // Timer to update countdown and clear lockout
  useEffect(() => {
    if (!lockoutUntil) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = lockoutUntil - now;

      if (diff <= 0) {
        setLockoutUntil(null);
        if (email) {
          localStorage.removeItem(`loginLockout_${email.toLowerCase()}`);
        }
        setError('');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return; // Prevent submission if locked out

    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      let msg = result.error || 'Invalid credentials';

      // Handle Lockout
      // Handle Lockout
      if (result.lockoutDuration) {
        const until = Date.now() + result.lockoutDuration;
        setLockoutUntil(until);
        localStorage.setItem(`loginLockout_${email.toLowerCase()}`, until.toString());
        msg = `Too many attempts for this account. Try again in 15 minutes.`;
      }
      // Handle Attempts Remaining
      else if (result.remainingAttempts !== undefined) {
        if (result.remainingAttempts === 1) {
          msg = "Invalid credentials. Next attempt will lock your account.";
        } else {
          msg = `Invalid credentials. ${result.remainingAttempts} attempts remaining.`;
        }
      }

      setError(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    const result = await signInWithGoogle(credentialResponse.credential);
    if (!result.success) {
      if (result.needsSignup && result.googleData) {
        // Store Google data for signup and redirect
        localStorage.setItem('googleSignupData', JSON.stringify(result.googleData));
        onNavigate('signUp');
      } else {
        setError(result.error || 'Google sign-in failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left Split - Visual Side for Campus Vibe */}
      <div className="hidden lg:flex w-1/2 bg-college-blue-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Overlay Image */}
        {/* Background Overlay Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/wce-campus.png"
            alt="Walchand College Campus"
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-[#002147]/90 mix-blend-multiply" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3">
            <img src="/wce-logo.png" alt="WCE Logo" className="w-12 h-12 bg-white rounded-full p-1 shadow-lg" />
            <div>
              <h2 className="text-xl font-serif font-bold tracking-wide">Walchand College of Engineering</h2>
              <p className="text-xs text-college-gold uppercase tracking-widest font-semibold">Established 1947</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mb-8">
          <h1 className="text-6xl font-serif font-bold mb-6 text-shadow-lg leading-tight">
            Welcome to <br />
            <span className="text-college-gold">Club Connect</span>
          </h1>
          <p className="text-xl font-light text-blue-100 max-w-lg leading-relaxed">
            The central hub for all student activities, club management, and event organization at WCE Sangli.
          </p>
        </div>

        <div className="relative z-10 text-xs text-blue-300 font-medium">
          &copy; {new Date().getFullYear()} WCE Technical Team. All Rights Reserved.
        </div>
      </div>

      {/* Right Split - Functional Side */}
      <div className="w-full lg:w-1/2 flex flex-col h-full">
        <div className="p-6 lg:p-8 w-full flex-none z-10">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-slate-500 hover:text-college-blue-primary dark:hover:text-blue-400 transition-all font-medium text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Campus Home
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full px-6 lg:px-16 pb-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <ShieldCheck className="w-8 h-8 text-college-blue-primary dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Student & Faculty Login</h2>
              <p className="text-slate-500 dark:text-slate-400">Please sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-md animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                    <span className="text-xl">⚠️</span> {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs ml-1">
                  Official Email ID
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-college-blue-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-college-blue-primary/50 focus:border-college-blue-primary transition-all shadow-sm"
                    placeholder="name@walchandsangli.ac.in"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-college-blue-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-college-blue-primary/50 focus:border-college-blue-primary transition-all shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-sm font-semibold text-college-blue-primary dark:text-blue-400 hover:text-college-blue-700 dark:hover:text-blue-300 hover:underline transition-all"
                >
                  Forgot Credentials?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!lockoutUntil}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all transform flex items-center justify-center gap-3 shadow-lg ${lockoutUntil
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-[#DAA520] hover:bg-[#B8860B] text-[#002147] hover:scale-[1.02] active:scale-[0.98] hover:shadow-yellow-500/30'
                  }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-[#002147]/30 border-t-[#002147] rounded-full animate-spin" />
                ) : lockoutUntil ? (
                  <span className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Locked ({timeLeft})
                  </span>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-3">
              Only @walchandsangli.ac.in emails are allowed
            </p>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-500 dark:text-slate-400 mb-4">New to the platform?</p>
              <button
                onClick={() => onNavigate('signUp')}
                className="px-8 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:border-college-gold hover:text-college-blue-primary transition-colors"
              >
                Create Student Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
        onNavigate={onNavigate}
      />
    </div>
  );
}
