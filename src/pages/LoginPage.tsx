import { useState } from 'react';
import { User, Shield, Sparkles, GraduationCap, Settings, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

type RoleSelection = 'club-secretary' | 'admin' | null;

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<RoleSelection>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleRoleSelect = (role: RoleSelection) => {
    setSelectedRole(role);
    setError('');
    
    if (role === 'admin') {
      onNavigate('adminLogin');
    }
    // For club-secretary, stay on this page for credentials
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedRole || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password, selectedRole);
    if (!success) {
      setError('Invalid email or password');
    } else {
      // Navigate based on role - only club-secretary uses this page
      if (selectedRole === 'club-secretary') {
        onNavigate('clubSecretaryDashboard');
      }
    }
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  // If no role selected, show role selection
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Back to Home Button */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Welcome to Club-Connect</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              Choose Your <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Login Type</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Select how you'd like to access the platform
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-6">
            {/* Club Secretary Login */}
            <button
              onClick={() => handleRoleSelect('club-secretary')}
              className="w-full group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Login as Club Secretary
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Manage your club, posts, members, and notifications
                  </p>
                </div>
              </div>
            </button>

            {/* Admin Login */}
            <button
              onClick={() => handleRoleSelect('admin')}
              className="w-full group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600"
            >
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Login as Admin
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Manage all clubs, events, and platform administration
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              By continuing, you agree to our terms of service and privacy policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If role selected (club-secretary or admin), show credentials form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={handleBackToRoleSelection}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Selection
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 px-4 py-2 rounded-full mb-6">
            {selectedRole === 'club-secretary' && <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            {selectedRole === 'admin' && <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {selectedRole === 'club-secretary' ? 'Club Secretary Access' : 'Admin Access'}
            </span>
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            Login as <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent capitalize">
              {selectedRole?.replace('-', ' ')}
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Enter your credentials to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                  placeholder="student@wce.ac.in"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  {selectedRole === 'club-secretary' && <Settings className="w-5 h-5" />}
                  {selectedRole === 'admin' && <Shield className="w-5 h-5" />}
                  Login as {selectedRole?.replace('-', ' ')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Demo Credentials:</h3>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Club Sec (GDSC):</strong> secretary@gdsc.wce.ac.in / secretary123</p>
            <p><strong>Club Sec (MLSC):</strong> secretary@mlsc.wce.ac.in / secretary123</p>
            <p><strong>Admin:</strong> admin@wce.ac.in / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

