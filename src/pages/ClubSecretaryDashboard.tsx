import { useState } from 'react';
import { Settings, Users, Calendar, Bell, Edit, Plus, Trash2, Search, Mail, UserPlus, UserMinus, Send } from 'lucide-react';
import { Page } from '../types/page';
import { User } from '../types/auth';
import { clubs } from '../data/clubsData';

interface ClubSecretaryDashboardProps {
  onNavigate: (page: Page) => void;
  user?: User | null;
}

export default function ClubSecretaryDashboard({ onNavigate, user }: ClubSecretaryDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'members' | 'notifications'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Get the club data for this secretary
  const club = clubs.find(c => c.id === user?.clubId);

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">Club not found</h1>
        <button onClick={() => onNavigate('home')} className="mt-4 text-blue-600 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  const mockPosts = [
    {
      id: '1',
      title: `${club.name} Workshop: Building with Gemini API`,
      content: 'Join us for an exciting workshop on building applications with Google Gemini API. Learn about AI integration and practical implementation.',
      date: '2025-12-15',
      type: 'event',
      status: 'published',
      rsvps: 45
    },
    {
      id: '2',
      title: `${club.name} General Body Meeting`,
      content: 'Monthly general body meeting for all club members. Agenda: New projects, upcoming events, and member feedback.',
      date: '2025-12-10',
      type: 'announcement',
      status: 'published',
      rsvps: 0
    }
  ];

  const mockMembers = [
    { id: '1', name: 'John Doe', email: 'john@wce.ac.in', role: 'Member', joined: '2024-01-15', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@wce.ac.in', role: 'Core Member', joined: '2024-01-10', status: 'active' },
    { id: '3', name: 'Mike Johnson', email: 'mike@wce.ac.in', role: 'Member', joined: '2024-02-01', status: 'active' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@wce.ac.in', role: 'Member', joined: '2024-02-15', status: 'inactive' },
  ];

  const mockNotifications = [
    {
      id: '1',
      message: 'New member application from Alice Brown',
      type: 'member_application',
      date: '2025-12-15',
      read: false
    },
    {
      id: '2',
      message: 'Event registration closing in 2 days',
      type: 'event_reminder',
      date: '2025-12-14',
      read: true
    }
  ];

  const handleDeletePost = (postId: string) => {
    console.log('Deleting post:', postId);
    alert('Post deleted successfully!');
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      console.log('Removing member:', memberId);
      alert('Member removed successfully!');
    }
  };

  const handleSendNotification = () => {
    alert('Notification sent successfully to all club members!');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <img src={club.image} alt={club.name} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">
              {club.name} Management
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Welcome back, {user?.name}. Manage your club from here.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockMembers.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Members</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{club.upcomingEvents}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Upcoming Events</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Edit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockPosts.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Published Posts</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">2</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'posts', label: 'Manage Posts', icon: Edit },
            { id: 'members', label: 'Manage Members', icon: Users },
            { id: 'notifications', label: 'Send Notifications', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Club Overview</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Club Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Name:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{club.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Category:</span>
                      <span className="font-semibold text-slate-900 dark:text-white capitalize">{club.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Total Members:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{mockMembers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Upcoming Events:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{club.upcomingEvents}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">New member Alice Brown applied</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Workshop announcement published</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Meeting scheduled for next week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manage Posts</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Post
                </button>
              </div>

              <div className="space-y-4">
                {mockPosts.map((post) => (
                  <div key={post.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            post.type === 'event' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                          }`}>
                            {post.type}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{post.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{post.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{post.content}</p>
                        {post.rsvps > 0 && (
                          <p className="text-sm text-green-600 dark:text-green-400">{post.rsvps} RSVPs</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manage Members</h3>
                <div className="flex gap-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4">
                {mockMembers.map((member) => (
                  <div key={member.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-800 dark:text-blue-400">
                            {member.role}
                          </span>
                          <span>Joined: {member.joined}</span>
                          <span className={`px-2 py-1 rounded ${
                            member.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Send Notifications</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Recent Notifications</h4>
                  <div className="space-y-3">
                    {mockNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 rounded-xl border ${
                          notification.read 
                            ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-1">
                              {notification.message}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{notification.date}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Send New Notification</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Notification title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Message
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your notification message..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Recipient
                      </label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Club Members</option>
                        <option value="active">Active Members Only</option>
                        <option value="core">Core Members Only</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleSendNotification}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
