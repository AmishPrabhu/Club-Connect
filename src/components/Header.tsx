import { LogOut, Bell, User, Sun, Moon, Shield, Settings, PlayCircle, ExternalLink } from 'lucide-react';
import { Page } from '../types/page';
import { useDarkMode } from '../context/DarkModeContext';
import { User as UserType } from '../types/auth';
import { useState, useEffect, useRef } from 'react';
import { getNotifications } from '../lib/dbService';
import { useTour } from '../context/TourContext';
import { useNavigation } from '../context/NavigationContext';
import ClubSwitcher from './ClubSwitcher';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user?: UserType | null;
}

export default function Header({ currentPage, onNavigate, onLogout, user }: HeaderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { memberships } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { startTour } = useTour();
  const { selectedMembership } = useNavigation();

  // Use selectedMembership role if available, otherwise fallback to user role
  const displayRole = selectedMembership?.role || user?.role?.replace('-', ' ') || '';
  const displayClubName = selectedMembership?.clubName || user?.clubName || '';

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Clubs' },
    { id: 'events', label: 'Events' },
    { id: 'announcements', label: 'Announcements' },
  ];

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return; // Don't fetch if no user

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
  }, [user]);

  // Click outside handler for user menu
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#002147] text-white shadow-lg border-b border-[#00152e]">
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 h-14 md:h-[4.5rem] flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button - Hidden as we switched to Bottom Nav */}
          <div className="lg:hidden w-2"></div>

          {/* Logo Section */}
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => onNavigate('home')}
            id="tour-logo"
          >
            <div className="bg-white p-1 md:p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300">
              <img
                src="/wce-logo.png"
                alt="Walchand College of Engineering Logo"
                className="w-7 h-7 md:w-9 md:h-9 object-contain"
              />
            </div>
            <div className="md:hidden">
              <span className="text-base font-serif font-bold tracking-tight text-white">
                WCE, Sangli
              </span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-lg font-serif font-bold tracking-tight leading-none text-white group-hover:text-[#DAA520] transition-colors">
                Walchand College of Engineering
              </span>
              <span className="text-[11px] font-medium text-blue-200 tracking-widest uppercase mt-0.5 ml-0.5">
                Club & Event Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id as Page)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${currentPage === item.id
                ? 'bg-white/10 text-[#DAA520] shadow-sm backdrop-blur-sm'
                : 'text-blue-100 hover:text-white hover:bg-white/5'
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Tour Button - Subtle (Desktop Only) */}
          <button
            onClick={startTour}
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-200 hover:text-white hover:bg-blue-500/20 text-xs font-semibold transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Tour</span>
          </button>

          <div className="h-6 w-px bg-blue-700/50 hidden md:block"></div>


          {/* Club Switcher - For officers with multiple clubs */}
          {user && (['club-secretary', 'president', 'treasurer', 'advisor'].includes(user.role) || memberships.some(m => ['secretary', 'president', 'treasurer', 'advisor'].includes(m.role.toLowerCase()))) && (
            <ClubSwitcher className="flex" />
          )}

          <button
            onClick={toggleDarkMode}
            className="p-1.5 md:p-2 rounded-full text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Toggle theme"
            id="tour-dark-mode-toggle"
          >
            {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => onNavigate('notifications')}
            className="p-1.5 md:p-2 rounded-full text-blue-200 hover:bg-white/10 hover:text-white transition-colors relative"
            id="tour-notifications"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full border-2 border-[#002147]"></span>
            )}
          </button>

          {/* User Profile */}
          {user ? (
            <div className="relative ml-1 md:ml-2 hidden md:block" id="tour-profile" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1 pl-2 pr-1 rounded-full bg-blue-800/50 hover:bg-blue-800 transition-colors border border-blue-700 hover:border-blue-600 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white leading-tight group-hover:text-[#DAA520] transition-colors">{user.name.split(' ')[0]}</p>
                  <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">{displayRole}</p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#DAA520] to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-[#002147] group-hover:ring-[#DAA520]/50 transition-all">
                  {user.name.charAt(0)}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1 z-50 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{displayRole}</p>
                    {displayClubName && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {displayClubName}
                      </span>
                    )}
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    {user.role === 'admin' && (
                      <button onClick={() => { onNavigate('adminDashboard'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-college-blue-primary dark:hover:text-blue-400 rounded-lg flex items-center gap-3 font-medium transition-colors">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"><Shield className="w-4 h-4" /></div>
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    {/* Club Management Link - Show if global role OR if has specific club officer role */}
                    {(['club-secretary', 'president', 'treasurer'].includes(user.role) || memberships.some(m => ['secretary', 'president', 'treasurer'].includes(m.role.toLowerCase()))) && (
                      <button
                        onClick={() => { onNavigate('clubSecretaryDashboard'); setShowUserMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-college-blue-primary dark:hover:text-blue-400 rounded-lg flex items-center gap-3 font-medium transition-colors"
                      >
                        <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"><Settings className="w-4 h-4" /></div>
                        <span>Club Management</span>
                      </button>
                    )}

                    {(user.role === 'advisor' || memberships.some(m => m.role.toLowerCase() === 'advisor')) && (
                      <button
                        onClick={() => { onNavigate('advisorDashboard'); setShowUserMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-college-blue-primary dark:hover:text-blue-400 rounded-lg flex items-center gap-3 font-medium transition-colors"
                      >
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"><Shield className="w-4 h-4" /></div>
                        <span>Advisor Dashboard</span>
                      </button>
                    )}

                    <button onClick={() => { onNavigate('userProfile'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-college-blue-primary dark:hover:text-blue-400 rounded-lg flex items-center gap-3 font-medium transition-colors">
                      <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><User className="w-4 h-4" /></div>
                      <span>My Profile</span>
                    </button>

                    <a
                      href="https://wic.walchandsangli.ac.in/login.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-college-blue-primary dark:hover:text-blue-400 rounded-lg flex items-center gap-3 font-medium transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"><ExternalLink className="w-4 h-4" /></div>
                      <span>ERP Portal</span>
                    </a>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 p-1.5 mt-1">
                    <button onClick={() => { onLogout(); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 font-medium transition-colors">
                      <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/20 text-red-500"><LogOut className="w-4 h-4" /></div>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="ml-2 px-3 py-2 md:px-5 md:py-2.5 bg-[#DAA520] hover:bg-yellow-500 text-[#002147] font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
              id="tour-profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[4.5rem] left-0 right-0 bg-[#002147] border-t border-blue-900/50 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-base font-bold transition-all ${currentPage === item.id
                  ? 'bg-white/10 text-[#DAA520]'
                  : 'text-blue-100 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            ))}
            {/* Mobile Tour Button */}
            <button
              onClick={() => {
                startTour();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-base font-bold text-blue-200 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Start Tour
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
