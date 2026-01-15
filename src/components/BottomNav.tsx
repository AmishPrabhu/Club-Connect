import { Home, Users, Calendar, Bell, Menu } from 'lucide-react';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
    const { user } = useAuth();

    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'dashboard', label: 'Clubs', icon: Users },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'notifications', label: 'Alerts', icon: Bell },
    ];

    // If user has a dashboard role, add a dashboard link or menu
    // For simplicity, let's keep it clean as requested. 
    // Maybe a "Menu" or "Profile" tab could be 5th if needed, but user said "navigation buttons".

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-50 safe-area-bottom">
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
                    onClick={() => onNavigate(user ? 'userProfile' : 'login')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${['userProfile', 'login', 'adminDashboard', 'clubSecretaryDashboard'].includes(currentPage)
                            ? 'text-[#002147] dark:text-[#DAA520]'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                >
                    <div className={`p-1.5 rounded-xl ${['userProfile', 'login'].includes(currentPage) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
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
    );
}
