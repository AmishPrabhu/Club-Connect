import { LogOut, Sparkles, Bell, User, Sun, Moon, Shield, Settings } from 'lucide-react';
import { Page } from '../types/page';
import { useDarkMode } from '../context/DarkModeContext';
import { User as UserType } from '../types/auth';
import { useState } from 'react';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user?: UserType | null;
}

export default function Header({ currentPage, onNavigate, onLogout, user }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl transform group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Club-Connect
              </span>
            </div>

            <nav className="flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className={`text-sm font-semibold transition-all ${
                  currentPage === 'home'
                    ? 'text-blue-600 scale-105'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`text-sm font-semibold transition-all ${
                  currentPage === 'dashboard'
                    ? 'text-blue-600 scale-105'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Dashboard
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110 animate-bounceIn"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />}
              </button>

              {/* Notifications for all users */}
              <button
                onClick={() => onNavigate('notifications')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110 animate-bounceIn relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">3</span>
              </button>

              {user ? (
                <>
                  {/* Admin-specific controls */}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => onNavigate('adminDashboard')}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110 animate-bounceIn relative"
                      aria-label="Admin Dashboard"
                    >
                      <Shield className="w-5 h-5 text-amber-600" />
                    </button>
                  )}

                  {/* Club Secretary-specific controls */}
                  {user.role === 'club-secretary' && (
                    <button
                      onClick={() => onNavigate('clubSecretaryDashboard')}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110 animate-bounceIn relative"
                      aria-label="Club Management"
                    >
                      <Settings className="w-5 h-5 text-blue-600" />
                    </button>
                  )}

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.name}</span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2">
                        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role.replace('-', ' ')}</p>
                          {user.clubName && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.clubName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            // Navigate to appropriate dashboard based on role
                            if (user.role === 'club-secretary') {
                              onNavigate('clubSecretaryDashboard');
                            } else if (user.role === 'admin') {
                              onNavigate('adminDashboard');
                            }
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          {user.role === 'club-secretary' && <Settings className="w-4 h-4" />}
                          {user.role === 'admin' && <Shield className="w-4 h-4" />}
                          My Account
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('userProfile');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            onLogout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Login Button for Club Secretaries and Admins */
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <User className="w-4 h-4" />
                  <span>Staff Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
