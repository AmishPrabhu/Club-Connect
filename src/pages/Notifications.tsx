import { ArrowLeft, Bell, Calendar, Users, Shield, Megaphone, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DBNotification } from '../types/auth';
import { getNotifications, markNotificationAsRead } from '../lib/dbService';

interface NotificationsProps {
  onBack: () => void;
  onNavigateToNotification: (notification: DBNotification) => void;
}

export default function Notifications({ onBack, onNavigateToNotification }: NotificationsProps) {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'system' | 'event' | 'announcement'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return Shield;
      case 'club': return Users;
      case 'event': return Calendar;
      case 'announcement': return Megaphone;
      default: return Bell;
    }
  };


  const getSourceLabel = (notification: DBNotification) => {
    if (notification.clubId) {
      return `From Club`;
    }
    return 'System';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative overflow-hidden">
      {/* Background Gradients */}
      {/* Background Gradients - REMOVED */}
      {/* <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div> */}

      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 md:py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-6 ml-1"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>

          <div className="gradient-card p-8 relative overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 blur-sm"></div>
                <Bell className="w-8 h-8 relative z-10" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">Notifications</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium mt-1">
                  Stay updated with the latest club activities
                </p>
              </div>
              {unreadCount > 0 && (
                <div className="hidden md:flex flex-col items-end">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md shadow-red-500/20 animate-bounce">
                    {unreadCount} New
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="glass-card p-2 rounded-2xl mb-8 flex overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
            { id: 'announcement', label: 'Announcements', count: notifications.filter(n => n.type === 'announcement').length },
            { id: 'event', label: 'Events', count: notifications.filter(n => n.type === 'event').length }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeFilter === filter.id
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <span>{filter.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === filter.id
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-slate-500 dark:text-slate-400">We'll notify you when something important happens.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) handleMarkAsRead(notification.id!);
                    onNavigateToNotification(notification);
                  }}
                  className={`glass-card p-5 md:p-6 rounded-2xl transition-all duration-300 group cursor-pointer border ${!notification.read
                    ? 'border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-900/10 shadow-lg shadow-cyan-500/5'
                    : 'border-white/20 dark:border-slate-700/50 hover:border-cyan-500/30 hover:shadow-md'
                    } hover:scale-[1.01]`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${notification.read
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      }`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className={`font-bold text-lg ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {notification.title}
                            </h4>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${notification.clubId
                              ? 'bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/30'
                              : 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/30'
                              }`}>
                              {getSourceLabel(notification)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(notification.createdAt instanceof Date ? notification.createdAt : new Date(notification.createdAt))}
                            </span>
                            {notification.link && (
                              <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1 group-hover:underline">
                                View Details
                                <ArrowLeft className="w-3 h-3 rotate-180" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
