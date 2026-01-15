import { Home, Users, Calendar, Megaphone } from 'lucide-react';
import { Page } from '../types/page';

interface BottomNavProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
    const navItems = [
        { id: 'home' as Page, label: 'Home', icon: Home },
        { id: 'dashboard' as Page, label: 'Clubs', icon: Users },
        { id: 'events' as Page, label: 'Events', icon: Calendar },
        { id: 'announcements' as Page, label: 'News', icon: Megaphone },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-pb">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id ||
                            (item.id === 'dashboard' && currentPage === 'club');

                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 ${isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                    )}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
