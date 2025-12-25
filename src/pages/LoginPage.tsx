import { User, Shield, Sparkles } from 'lucide-react';
import { Page } from '../App';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const handleUserLogin = () => {
    onNavigate('home');
  };

  const handleAdminLogin = () => {
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
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

        {/* Login Options */}
        <div className="space-y-6">
          {/* User Login */}
          <button
            onClick={handleUserLogin}
            className="w-full group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
          >
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Login as User
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Access clubs, events, and connect with students
                </p>
              </div>
            </div>
          </button>

          {/* Admin Login */}
          <button
            onClick={handleAdminLogin}
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
                  Manage clubs, events, and platform administration
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

