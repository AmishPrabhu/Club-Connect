import { LogOut, Sparkles, Bell, User, Sun, Moon } from 'lucide-react';
import { Page } from '../App';
import { useDarkMode } from '../context/DarkModeContext';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Header({ currentPage, onNavigate, onLogout }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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

              <button
                onClick={() => onNavigate('notifications')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110 animate-bounceIn relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">3</span>
              </button>

              <button
                onClick={() => onNavigate('userProfile')}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110 animate-bounceIn"
                aria-label="User Profile"
              >
                <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
