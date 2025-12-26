import { useState } from 'react';
import { Shield, Users, Calendar, Trash2, Edit, Search, Filter, TrendingUp, Settings, Bell, Eye, Plus } from 'lucide-react';
import { Page } from '../types/page';
import { useAuth } from '../context/AuthContext';
import { clubs } from '../data/clubsData';

interface AdminDashboardProps {
  onNavigate: (page: Page) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();

  const mockPosts = [
    {
      id: '1',
      title: 'GDSC Workshop: Building with Gemini API',
      clubId: 'gdsc',
      clubName: 'GDG',
      author: 'GDSC Secretary',
      date: '2025-12-15',
      type: 'event',
      status: 'published'
    },
    {
      id: '2',
      title: 'MLSC Cloud Computing Bootcamp',
      clubId: 'mlsc',
      clubName: 'MLSC',
      author: 'MLSC Secretary',
      date: '2025-12-14',
      type: 'event',
      status: 'published'
    },
    {
      id: '3',
      title: 'Art Circle Exhibition',
      clubId: 'artcircle',
      clubName: 'Art Circle',
      author: 'Art Circle Secretary',
      date: '2025-12-13',
      type: 'announcement',
      status: 'published'
    }
  ];

  const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'posts' | 'notifications'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState(mockPosts);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    clubId: '',
    type: 'announcement' as 'event' | 'announcement',
    date: new Date().toISOString().split('T')[0]
  });

  const mockNotifications = [
    {
      id: '1',
      message: 'New club application received from "Robotics Society"',
      type: 'club_application',
      date: '2025-12-15',
      read: false
    },
    {
      id: '2',
      message: 'System maintenance scheduled for tonight at 11 PM',
      type: 'system',
      date: '2025-12-15',
      read: false
    },
    {
      id: '3',
      message: 'Monthly club activity report is ready',
      type: 'report',
      date: '2025-12-14',
      read: true
    }
  ];

  const handleDeletePost = (postId: string) => {
    // In a real app, this would make an API call
    console.log('Deleting post:', postId);
    alert('Post deleted successfully!');
  };

  const handleApproveClub = (clubId: string) => {
    console.log('Approving club:', clubId);
    alert('Club approved successfully!');
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.clubId) {
      alert('Please fill in all required fields.');
      return;
    }

    const selectedClub = clubs.find(club => club.id === newPost.clubId);
    if (!selectedClub) {
      alert('Selected club not found.');
      return;
    }

    const post = {
      id: Date.now().toString(),
      title: newPost.title,
      clubId: newPost.clubId,
      clubName: selectedClub.name,
      author: user?.name || 'Admin',
      date: newPost.date,
      type: newPost.type,
      status: 'published' as const
    };

    setPosts([post, ...posts]);
    setNewPost({
      title: '',
      content: '',
      clubId: '',
      type: 'announcement',
      date: new Date().toISOString().split('T')[0]
    });
    setIsCreatePostModalOpen(false);
    alert('Post created successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Welcome back, {user?.name}. Manage your platform from here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{clubs.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total Clubs</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Active Events</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">1,234</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total Members</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">3</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Pending Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'clubs', label: 'Manage Clubs', icon: Users },
            { id: 'posts', label: 'Manage Posts', icon: Edit },
            { id: 'notifications', label: 'Notifications', icon: Bell }
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">New club "Robotics Society" applied</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">3 new events published</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Monthly report generated</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clubs Tab */}
          {activeTab === 'clubs' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search clubs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                  <div key={club.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={club.image} alt={club.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{club.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{club.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{club.members} members</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{club.upcomingEvents} upcoming events</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                        <Settings className="w-4 h-4 inline mr-1" />
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manage Posts</h3>
                <button
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Post
                </button>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
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
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {post.clubName} • {post.author}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{post.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{post.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-all">
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

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">System Notifications</h3>
              <div className="space-y-4">
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
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {isCreatePostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Post</h3>
              <button
                onClick={() => setIsCreatePostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Club *
                </label>
                <select
                  value={newPost.clubId}
                  onChange={(e) => setNewPost(prev => ({ ...prev, clubId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a club</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value as 'event' | 'announcement' }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newPost.date}
                  onChange={(e) => setNewPost(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCreatePostModalOpen(false)}
                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                Create Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
