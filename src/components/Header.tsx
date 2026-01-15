import { LogOut, Bell, User, Sun, Moon, Shield, Settings, PlayCircle } from 'lucide-react';
import { Page } from '../types/page';
import { useDarkMode } from '../context/DarkModeContext';
import { User as UserType } from '../types/auth';
import { useState, useEffect, useRef } from 'react';
import { getNotifications } from '../lib/dbService';
import { useTour } from '../context/TourContext';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user?: UserType | null;
}

export default function Header({ onNavigate, onLogout, user }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { startTour } = useTour();

  // Scroll direction tracking for auto-hide header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Track scroll direction to show/hide header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      // Hide header when scrolling up, show when scrolling down
      // Also always show when near top of page
      if (currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (scrollingDown) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const notifications = await getNotifications();
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotificationCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer min-w-0" onClick={() => onNavigate('home')} id="tour-logo">
              <img
                src="/wce-logo.png"
                alt="Walchand College of Engineering Logo"
                className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-md flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm md:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  WCE, Sangli
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Club & Event Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Start Tour - icon only on mobile, with text on desktop */}
              <button
                onClick={startTour}
                className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold transition-all border border-indigo-600/20"
                aria-label="Start Tour"
              >
                <PlayCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
                <span className="hidden md:inline">Start Tour</span>
              </button>

              <button
                onClick={toggleDarkMode}
                id="tour-dark-mode-toggle"
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Notifications for all users */}
              <button
                onClick={() => onNavigate('notifications')}
                id="tour-notifications"
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative border border-slate-200 dark:border-slate-700"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-600 rounded-full text-[10px] flex items-center justify-center text-white font-medium px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {user ? (
                <>


                  {/* User Menu */}
                  <div className="relative" id="tour-profile">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block">{user.name}</span>
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
                        {/* Club Management Link */}
                        {['club-secretary', 'president', 'treasurer'].includes(user.role) && (
                          <button
                            onClick={() => {
                              onNavigate('clubSecretaryDashboard');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Club Management
                          </button>
                        )}

                        {/* Admin Dashboard Link */}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => {
                              onNavigate('adminDashboard');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                          </button>
                        )}

                        {/* Advisor Dashboard Link */}
                        {user.role === 'advisor' && (
                          <button
                            onClick={() => {
                              onNavigate('advisorDashboard');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Advisor Dashboard
                          </button>
                        )}

                        {/* My Dashboard Link - Merged with Profile */}
                        <button
                          onClick={() => {
                            onNavigate('userProfile');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          My Dashboard
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
