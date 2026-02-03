import { useState, useRef, useEffect } from 'react';
import { Home, Users, Calendar, Bell, Menu, LogOut, Settings, Shield, User } from 'lucide-react';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
    const { user, logout, memberships } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) && showMenu) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleMeClick = () => {
        if (!user) {
            onNavigate('login');
        } else {
            setShowMenu(!showMenu);
        }
    };

    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'dashboard', label: 'Clubs', icon: Users },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'notifications', label: 'Alerts', icon: Bell },
    ];

    return (
        <>
            {/* Profile Dropdown Menu */}
            {showMenu && user && (
                <div
                    ref={menuRef}
                    className="fixed bottom-20 right-4 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 origin-bottom-right"
                >
                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DAA520] to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{user.role?.replace('-', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 space-y-1">
                        {user.role === 'admin' && (
                            <button
                                onClick={() => { onNavigate('adminDashboard'); setShowMenu(false); }}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#002147] dark:hover:text-blue-400 rounded-xl flex items-center gap-3 font-medium transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"><Shield className="w-4 h-4" /></div>
                                <span>Admin Dashboard</span>
                            </button>
                        )}

                        {/* Club Management Link */}
                        {(['club-secretary', 'president', 'treasurer'].includes(user.role) || memberships.some(m => ['secretary', 'president', 'treasurer'].includes(m.role.toLowerCase()))) && (
                            <button
                                onClick={() => { onNavigate('clubSecretaryDashboard'); setShowMenu(false); }}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#002147] dark:hover:text-blue-400 rounded-xl flex items-center gap-3 font-medium transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"><Settings className="w-4 h-4" /></div>
                                <span>Club Management</span>
                            </button>
                        )}

                        {(user.role === 'advisor' || memberships.some(m => m.role.toLowerCase() === 'advisor')) && (
                            <button
                                onClick={() => { onNavigate('advisorDashboard'); setShowMenu(false); }}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#002147] dark:hover:text-blue-400 rounded-xl flex items-center gap-3 font-medium transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"><Shield className="w-4 h-4" /></div>
                                <span>Advisor Dashboard</span>
                            </button>
                        )}

                        <button
                            onClick={() => { onNavigate('userProfile'); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#002147] dark:hover:text-blue-400 rounded-xl flex items-center gap-3 font-medium transition-colors"
                        >
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><User className="w-4 h-4" /></div>
                            <span>My Profile</span>
                        </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 p-2 mt-1">
                        <button
                            onClick={() => { logout(); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 font-medium transition-colors"
                        >
                            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500"><LogOut className="w-4 h-4" /></div>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-40 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id as Page)}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${isActive
                                    ? 'text-[#002147] dark:text-[#DAA520]'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Profile / Menu Tab */}
                    <button
                        onClick={handleMeClick}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${['userProfile', 'login', 'adminDashboard', 'clubSecretaryDashboard'].includes(currentPage) || showMenu
                            ? 'text-[#002147] dark:text-[#DAA520]'
                            : 'text-slate-400 dark:text-slate-500'
                            }`}
                    >
                        <div className={`p-1.5 rounded-xl ${['userProfile', 'login'].includes(currentPage) || showMenu ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            {user && user.name ? (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#DAA520] to-orange-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                                    {user.name.charAt(0)}
                                </div>
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-wide">{user ? 'Me' : 'Login'}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
