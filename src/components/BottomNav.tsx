import { useState, useRef, useEffect } from 'react';
import { Home, Users, Calendar, Menu, LogOut, Settings, Shield, User } from 'lucide-react';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

interface BottomNavProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
    const { user, logout, memberships } = useAuth();
    const { handleLogout } = useNavigation();
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
        // Alerts removed as per user request (redundant with top bell)
    ];

    return (
        <>
            {/* Profile Dropdown Menu */}
            {showMenu && user && (
                <div
                    ref={menuRef}
                    className="fixed bottom-20 right-4 w-72 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 origin-bottom-right"
                >
                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
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

                        {/* Club Management Link - Show if global role OR if has specific club officer role OR assigned as officer by admin */}
                        {(['club-secretary', 'president', 'treasurer'].includes(user.role) || memberships.some(m => ['secretary', 'president', 'treasurer'].includes(m.role.toLowerCase()) || m.officerRole)) && (
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

                        {/* Teacher Dashboard - Show if user has teacher role in roles array OR primary role */}
                        {(user.role === 'teacher' || user.roles?.includes('teacher')) && (
                            <button
                                onClick={() => { onNavigate('teacherDashboard'); setShowMenu(false); }}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#002147] dark:hover:text-blue-400 rounded-xl flex items-center gap-3 font-medium transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"><Shield className="w-4 h-4" /></div>
                                <span>Teacher Dashboard</span>
                            </button>
                        )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 p-2 mt-1">
                        <button
                            onClick={() => { handleLogout(logout); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 font-medium transition-colors"
                        >
                            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500"><LogOut className="w-4 h-4" /></div>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Nav - Floating Island Style */}
            <div className="xl:hidden fixed bottom-2 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-cyan-900/20"></div>

                {/* Glow behind active item */}
                {/* (Optional: could add a moving slider here if we had index, but simple active state works too) */}

                <div className="relative flex items-center justify-between px-6 py-4">
                    {navItems.map((item) => {
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id as Page)}
                                className={`relative flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                <div className={`relative p-2 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-500/10 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : ''}`}>
                                    <item.icon className={`w-6 h-6 ${isActive ? 'fill-blue-500/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {isActive && <div className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
                            </button>
                        );
                    })}

                    {/* Profile / Menu Tab */}
                    <button
                        onClick={handleMeClick}
                        className={`relative flex flex-col items-center justify-center transition-all duration-300 ${['userProfile', 'login', 'adminDashboard', 'clubSecretaryDashboard'].includes(currentPage) || showMenu
                            ? 'text-blue-600 dark:text-blue-400 scale-110'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        <div className={`relative p-2 rounded-full transition-all duration-500 ${['userProfile', 'login'].includes(currentPage) || showMenu ? 'bg-blue-500/10 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : ''}`}>
                            {user && user.name ? (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-slate-900">
                                    {user.name.charAt(0)}
                                </div>
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </div>
                        {(['userProfile', 'login'].includes(currentPage) || showMenu) && <div className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
                    </button>
                </div>
            </div>
        </>
    );
}
