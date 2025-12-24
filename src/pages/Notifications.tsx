import { ArrowLeft, Bell, Calendar, Users, Trophy, MessageSquare, Heart, Star } from 'lucide-react';
import { useState } from 'react';

interface NotificationsProps {
  onBack: () => void;
}

export default function Notifications({ onBack }: NotificationsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'events' | 'clubs' | 'achievements'>('all');

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'event',
      title: 'New Event: AI Workshop',
      message: 'ACM Club is hosting an AI Workshop next week. Don\'t miss out!',
      time: '2 hours ago',
      read: false,
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'club',
      title: 'Welcome to CodeChef!',
      message: 'You have successfully joined the CodeChef club. Welcome aboard!',
      time: '1 day ago',
      read: false,
      icon: Users,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'Congratulations! You\'ve earned the "First Event Attendee" badge.',
      time: '3 days ago',
      read: true,
      icon: Trophy,
      color: 'text-yellow-600'
    },
    {
      id: 4,
      type: 'event',
      title: 'Event Reminder',
      message: 'Hackathon 2026 starts in 2 days. Make sure to prepare your team!',
      time: '5 days ago',
      read: true,
      icon: Bell,
      color: 'text-red-600'
    },
    {
      id: 5,
      type: 'club',
      title: 'New Member Joined',
      message: 'Sarah Johnson joined the ACM Club. Say hello!',
      time: '1 week ago',
      read: true,
      icon: MessageSquare,
      color: 'text-purple-600'
    }
  ];

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-slate-600" />
          <span className="text-lg font-bold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'events', label: 'Events', count: notifications.filter(n => n.type === 'event').length },
            { id: 'clubs', label: 'Clubs', count: notifications.filter(n => n.type === 'club').length },
            { id: 'achievements', label: 'Achievements', count: notifications.filter(n => n.type === 'achievement').length }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeFilter === filter.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                activeFilter === filter.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No notifications</h3>
              <p className="text-slate-500">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-slate-50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    notification.read ? 'bg-slate-100' : 'bg-blue-100'
                  }`}>
                    <notification.icon className={`w-6 h-6 ${notification.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-semibold mb-1 ${
                          notification.read ? 'text-slate-900' : 'text-slate-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mb-2 ${
                          notification.read ? 'text-slate-600' : 'text-slate-700'
                        }`}>
                          {notification.message}
                        </p>
                        <span className="text-xs text-slate-500">{notification.time}</span>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
