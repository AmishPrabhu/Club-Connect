import { Calendar, Users, Trophy, Bell, MessageSquare } from 'lucide-react';

export const notifications = [
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
    color: 'text-blue-600'
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
