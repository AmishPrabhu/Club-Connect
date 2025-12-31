import { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { FirestorePost } from '../types/auth';

interface WeeklyEventsProps {
    events: FirestorePost[];
    onNavigateToPost: (postId: string) => void;
}

export default function WeeklyEvents({ events, onNavigateToPost }: WeeklyEventsProps) {
    const weeklyEvents = useMemo(() => {
        const now = new Date();
        // Start from TODAY (beginning of day)
        const startOfRange = new Date(now);
        startOfRange.setHours(0, 0, 0, 0);

        // Start of week (Sunday) just for calculating end of week
        const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)

        // End of week (Saturday)
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - currentDay));
        endOfWeek.setHours(23, 59, 59, 999);

        return events.filter(event => {
            const eventDate = new Date(event.date);
            // Ensure date is treated as local day start for comparison
            const eventDateStart = new Date(eventDate);
            eventDateStart.setHours(0, 0, 0, 0);

            return eventDateStart >= startOfRange && eventDate <= endOfWeek;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events]);

    if (weeklyEvents.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Events This Week</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Check the full calendar for upcoming activities.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                This Week's Events
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {weeklyEvents.map(event => (
                    <div
                        key={event.id}
                        onClick={() => event.id && onNavigateToPost(event.id)}
                        className="group p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                    >
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-md shrink-0 border border-blue-100 dark:border-blue-800">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    {new Date(event.date).getDate()}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {event.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {event.time || 'All Day'}
                                    </div>
                                    <div className="flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3" />
                                        {event.location || 'Campus'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
