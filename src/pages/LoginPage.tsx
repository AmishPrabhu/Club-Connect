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
  const { login, signInWithGoogle, user, isAuthenticated } = useAuth();

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return; // Prevent submission if locked out

    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      let msg = result.error || 'Invalid credentials';

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
          msg = "Email or Password is incorrect. Next attempt will lock your account.";
        } else {
          msg = `Email or Password is incorrect. ${result.remainingAttempts} attempts remaining.`;
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
    <div className="min-h-screen flex">
      {/* Left Split - Visual Side for Campus Vibe */}
      <div className="hidden lg:flex w-1/2 bg-college-blue-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Overlay Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/wce-campus.png"
            alt="Walchand College Campus"
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-college-blue-900/70" />
        </div>

        <div className="relative z-10 w-full">
          <div className="flex items-center gap-4">
            <img src="/wce-logo.png" alt="WCE Logo" className="w-12 h-12 bg-white rounded-full p-1 shadow-lg" />
            <div>
              <h2 className="text-xl font-serif font-bold tracking-wide">Walchand College of Engineering</h2>
              <p className="text-xs text-amber-400 uppercase tracking-widest font-semibold">Established 1947</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mb-12">
          <h1 className="text-6xl font-serif font-bold mb-6 text-shadow-lg leading-tight">
            Welcome to <br />
            <span className="text-amber-400">Club Connect</span>
          </h1>
          <p className="text-xl font-light text-slate-200 max-w-lg leading-relaxed">
            The central hub for all student activities, club management, and event organization at WCE Sangli.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-300 font-medium">
          &copy; {new Date().getFullYear()} WCE Technical Team. All Rights Reserved.
        </div>
      </div>

      {/* Right Split - Functional Side */}
      <div className="w-full lg:w-1/2 relative bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col h-full overflow-y-auto">
        {/* Background Gradients for Right Side - REMOVED for Solid Background */}
        {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div> */}

        <div className="p-6 lg:p-12 w-full flex-none z-10">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-medium text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Campus Home
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full px-6 lg:px-16 pb-12 z-10">
          <div className="w-full max-w-md">
            {/* Hero / Welcome Card */}
            <div className="gradient-card p-8 mb-6 text-left relative overflow-hidden group">
              {/* Background Glows - REMOVED */}
              {/* <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div> */}

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 mb-4 transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                  Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">Back</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sign in to access your dashboard</p>
              </div>
            </div>

            <div className="glass-card p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 relative overflow-hidden">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                      <span className="text-xl">⚠️</span> {error}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                    Official Email ID
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium"
                      placeholder="name@walchandsangli.ac.in"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline transition-all"
                  >
                    Forgot Credentials?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !!lockoutUntil}
                  className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all transform flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 ${lockoutUntil
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  <span className="px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-500 dark:text-slate-400 rounded-full">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <div className="flex justify-center">
                <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
                Only @walchandsangli.ac.in emails are allowed
              </p>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">New to Club Connect?</p>
                <button
                  onClick={() => onNavigate('signUp')}
                  className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors bg-white/50 dark:bg-slate-800/50"
                >
                  Create Student Account
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                &copy; {new Date().getFullYear()} WCE Technical Team. All Rights Reserved.
              </p>
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
