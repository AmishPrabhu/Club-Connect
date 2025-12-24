import { ArrowLeft, User, Mail, Calendar, Trophy, Settings, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

interface UserProfileProps {
  onBack: () => void;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'achievements'>('overview');

  // Mock user data
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    joinDate: 'September 2023',
    avatar: '👨‍🎓',
    bio: 'Passionate about technology and community building. Love organizing events and connecting with like-minded people!',
    stats: {
      eventsAttended: 12,
      clubsJoined: 3,
      achievements: 8,
      points: 245
    }
  };

  const upcomingEvents = [
    { id: 1, title: 'AI Workshop', club: 'ACM', date: 'Jan 20, 2026', status: 'registered' },
    { id: 2, title: 'Hackathon 2026', club: 'CodeChef', date: 'Feb 15, 2026', status: 'interested' }
  ];

  const achievements = [
    { id: 1, title: 'First Event Attendee', description: 'Attended your first club event', icon: '🎯', unlocked: true },
    { id: 2, title: 'Club Member', description: 'Joined your first club', icon: '🤝', unlocked: true },
    { id: 3, title: 'Event Organizer', description: 'Helped organize an event', icon: '📅', unlocked: false },
    { id: 4, title: 'Community Builder', description: 'Invited 5 friends to join clubs', icon: '🌟', unlocked: false }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
            {user.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{user.name}</h1>
            <p className="text-slate-600 mb-4">{user.bio}</p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {user.joinDate}</span>
              </div>
            </div>
          </div>
          <button className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{user.stats.eventsAttended}</div>
            <div className="text-sm text-slate-600">Events Attended</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{user.stats.clubsJoined}</div>
            <div className="text-sm text-slate-600">Clubs Joined</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">{user.stats.achievements}</div>
            <div className="text-sm text-slate-600">Achievements</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">{user.stats.points}</div>
            <div className="text-sm text-slate-600">Points</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'events', label: 'My Events', icon: Calendar },
            { id: 'achievements', label: 'Achievements', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">RSVP'd to AI Workshop</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">ACM Club • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Shared CodeChef event</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">With 3 friends • 1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Events</h3>
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{event.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{event.club} • {event.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    event.status === 'registered'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  }`}>
                    {event.status === 'registered' ? 'Registered' : 'Interested'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{achievement.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{achievement.description}</p>
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Unlocked</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
