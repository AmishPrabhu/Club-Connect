import { useState, useEffect } from 'react';
import { Users, Calendar, Trash2, Edit, Search, TrendingUp, Bell, Plus, UserPlus, X, Send, Image as ImageIcon } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { DBClub, DBPost, DBNotification } from '../types/auth';
import {
  getClubs,
  createClub,
  deleteClub,
  createClubSecretary,
  createClubPresident,
  createClubTreasurer,
  createClubAdvisor,

  getPosts,
  deletePost,
  getNotifications,
  createNotification,
  deleteNotification,
} from '../lib/dbService';



// Admin Image Upload Component with Cloudinary
function AdminImageUploader({ clubId, currentImage, onSuccess }: { clubId: string; currentImage?: string; onSuccess: (url: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openUploadWidget = () => {
    if (typeof window === 'undefined' || !(window as any).cloudinary) {
      setError('Upload widget not available. Please refresh the page.');
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary configuration missing. Please check environment variables.');
      return;
    }

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        folder: `club_profiles/${clubId}`,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFiles: 1,
        cropping: true,
        croppingAspectRatio: 1,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxFileSize: 5000000, // 5MB
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#003366",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#003366",
            action: "#FFCC00",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1"
          }
        }
      },
      (error: any, result: any) => {
        if (error) {
          setError('Upload failed. Please try again.');
          setIsUploading(false);
          return;
        }
        if (result.event === 'success') {
          const uploadedUrl = result.info.secure_url;
          setPreviewUrl(uploadedUrl);
          setIsUploading(false);
          // Auto-save the image
          handleSave(uploadedUrl);
        }
      }
    );

    setIsUploading(true);
    setError(null);
    widget.open();
  };

  const handleSave = async (urlToSave?: string) => {
    const url = urlToSave || previewUrl;
    if (!url.trim()) {
      setError('Please upload an image');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const { updateClubImage } = await import('../lib/dbService');
      const result = await updateClubImage(clubId, url);

      if (result.success) {
        onSuccess(url);
      } else {
        setError(result.error || 'Failed to update image');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update image');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-48 h-48 mx-auto group">
        <img
          src={previewUrl || currentImage || '/club-default.jpg'}
          alt="Club profile"
          className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg group-hover:shadow-xl transition-all"
          onError={(e) => { (e.target as HTMLImageElement).src = '/club-default.jpg'; }}
        />
        {(isUploading || isSaving) && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-white border-t-[#DAA520] rounded-full animate-spin"></div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-200">
          {error}
        </div>
      )}

      <button
        onClick={openUploadWidget}
        disabled={isUploading || isSaving}
        className="w-full bg-[#002147] hover:bg-[#00152e] disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {isUploading ? 'UPLOADING...' : isSaving ? 'SAVING...' : 'CHANGE CLUB BADGE'}
      </button>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider font-semibold">
        Max Size: 5MB • JPG/PNG
      </p>
    </div>
  );
}


const CLUB_CATEGORIES = ['technical', 'academic', 'cultural', 'sports'] as const;
const GRADIENT_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-red-500 to-rose-500',
  'from-indigo-500 to-blue-500',
];


export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'posts' | 'notifications'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [clubs, setClubs] = useState<DBClub[]>([]);
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [showCreateSecretaryModal, setShowCreateSecretaryModal] = useState(false);
  const [showCreatePresidentModal, setShowCreatePresidentModal] = useState(false);
  const [showCreateTreasurerModal, setShowCreateTreasurerModal] = useState(false);
  const [showCreateAdvisorModal, setShowCreateAdvisorModal] = useState(false);
  const [showEditAdvisorModal, setShowEditAdvisorModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<DBClub | null>(null);

  // Form states
  const [newClub, setNewClub] = useState({
    name: '',
    description: '',
    category: 'technical' as const,
    icon: '🎯',
    image: '/club-default.jpg',
  });

  const [newSecretary, setNewSecretary] = useState({
    email: '',
    password: 'Hello@123',
    name: '',
  });

  // Generic state for President/Treasurer/Advisor creation
  const [newRoleUser, setNewRoleUser] = useState({
    email: '',
    password: 'Hello@123',
    name: '',
  });

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as const,
  });

  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data on mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'clubs' || activeTab === 'overview') {
        const clubsData = await getClubs();
        setClubs(clubsData);
      }
      if (activeTab === 'posts' || activeTab === 'overview') {
        const postsData = await getPosts();
        setPosts(postsData);
      }
      if (activeTab === 'notifications' || activeTab === 'overview') {
        const notificationsData = await getNotifications();
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Club handlers
  const handleCreateClub = async () => {
    setFormMessage(null);
    if (!newClub.name || !newClub.description) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    const randomColor = GRADIENT_COLORS[Math.floor(Math.random() * GRADIENT_COLORS.length)];
    const clubId = await createClub({
      ...newClub,
      color: randomColor,
      members: 0,
      upcomingEvents: 0,
    });

    if (clubId) {
      setFormMessage({ type: 'success', text: 'Club created successfully!' });
      setNewClub({ name: '', description: '', category: 'technical', icon: '🎯', image: '/club-default.jpg' });
      setTimeout(() => {
        setShowCreateClubModal(false);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: 'Failed to create club' });
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) return;

    const success = await deleteClub(clubId);
    if (success) {
      loadData();
    } else {
      alert('Failed to delete club');
    }
  };

  // Secretary handlers
  const handleCreateSecretary = async () => {
    setFormMessage(null);
    if (!newSecretary.email || !newSecretary.password || !newSecretary.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newSecretary.password.length < 6) {
      setFormMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    const result = await createClubSecretary(
      newSecretary.email,
      newSecretary.password,
      newSecretary.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Secretary created for ${selectedClub.name}!` });
      setNewSecretary({ email: '', password: 'Hello@123', name: '' });
      setTimeout(() => {
        setShowCreateSecretaryModal(false);
        setSelectedClub(null);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to create secretary' });
    }
  };

  // President handlers
  const handleCreatePresident = async () => {
    setFormMessage(null);
    if (!newRoleUser.email || !newRoleUser.password || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newRoleUser.password.length < 6) {
      setFormMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    const result = await createClubPresident(
      newRoleUser.email,
      newRoleUser.password,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `President created for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
      setTimeout(() => {
        setShowCreatePresidentModal(false);
        setSelectedClub(null);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to create president' });
    }
  };

  // Treasurer handlers
  const handleCreateTreasurer = async () => {
    setFormMessage(null);
    if (!newRoleUser.email || !newRoleUser.password || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newRoleUser.password.length < 6) {
      setFormMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    const result = await createClubTreasurer(
      newRoleUser.email,
      newRoleUser.password,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Treasurer created for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
      setTimeout(() => {
        setShowCreateTreasurerModal(false);
        setSelectedClub(null);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to create treasurer' });
    }
  };

  // Post handlers
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const success = await deletePost(postId);
    if (success) {
      loadData();
    } else {
      alert('Failed to delete post');
    }
  };

  // Notification handlers
  const handleCreateNotification = async () => {
    setFormMessage(null);
    if (!newNotification.title || !newNotification.message) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const notificationId = await createNotification({
      ...newNotification,
      read: false,
    });

    if (notificationId) {
      setFormMessage({ type: 'success', text: 'Notification sent!' });
      setNewNotification({ title: '', message: '', type: 'system' });
      setTimeout(() => {
        setShowNotificationModal(false);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: 'Failed to send notification' });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      loadData();
    }
  };

  const openSecretaryModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewSecretary({ email: '', password: 'Hello@123', name: '' });
    setShowCreateSecretaryModal(true);
  };

  const openPresidentModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
    setShowCreatePresidentModal(true);
  };

  const openTreasurerModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
    setShowCreateTreasurerModal(true);
  };

  const openAdvisorModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
    setShowCreateAdvisorModal(true);
  };

  // Advisor handlers
  const handleCreateAdvisor = async () => {
    setFormMessage(null);
    if (!newRoleUser.email || !newRoleUser.password || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newRoleUser.password.length < 6) {
      setFormMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    const result = await createClubAdvisor(
      newRoleUser.email,
      newRoleUser.password,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Advisor created for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
      setTimeout(() => {
        setShowCreateAdvisorModal(false);
        setSelectedClub(null);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to create advisor' });
    }
  };

  const openEditAdvisorModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({
      email: club.advisorEmail || '',
      password: 'Hello@123',
      name: club.advisorName || ''
    });
    setShowEditAdvisorModal(true);
  };

  // Replace advisor (delete old account and create new one)
  const handleReplaceAdvisor = async () => {
    setFormMessage(null);
    if (!newRoleUser.email || !newRoleUser.password || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newRoleUser.password.length < 6) {
      setFormMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    // So we just create a new advisor account and update the club reference
    const result = await createClubAdvisor(
      newRoleUser.email,
      newRoleUser.password,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Advisor updated for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', password: 'Hello@123', name: '' });
      setTimeout(() => {
        setShowEditAdvisorModal(false);
        setSelectedClub(null);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to update advisor' });
    }
  };



  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-college-blue-900 pb-12">
      {/* Page Title Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border-l-4 border-[#002147]">
          <h1 className="text-3xl font-serif font-bold text-[#002147] dark:text-white">
            Administrative Control Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage clubs, events, and system settings • <span className="text-[#DAA520]">Welcome, {user?.name}</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 shadow-sm border-l-4 border-[#002147] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#002147]">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Clubs</span>
            </div>
            <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{clubs.length}</p>
            <div className="mt-2 text-xs text-slate-500">Registered Organizations</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 shadow-sm border-l-4 border-[#DAA520] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[#DAA520]">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Events</span>
            </div>
            <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{posts.filter(p => p.type === 'event').length}</p>
            <div className="mt-2 text-xs text-slate-500">Upcoming Campus Activities</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Posts</span>
            </div>
            <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{posts.length}</p>
            <div className="mt-2 text-xs text-slate-500">Announcements & Updates</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                <Bell className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alerts</span>
            </div>
            <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{notifications.filter(n => !n.read).length}</p>
            <div className="mt-2 text-xs text-slate-500">Unread System Messages</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-t-xl border-b border-slate-200 dark:border-slate-700 mt-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'clubs', label: 'Manage Clubs', icon: Users },
              { id: 'posts', label: 'Manage Posts', icon: Edit },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-8 py-4 sm:py-5 font-semibold transition-all whitespace-nowrap border-b-2 ${isActive
                    ? 'text-[#002147] dark:text-[#DAA520] border-[#002147] dark:border-[#DAA520] bg-blue-50/50 dark:bg-blue-900/10'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#DAA520]' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>

        <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm border border-t-0 border-slate-200 dark:border-slate-700 p-4 sm:p-8 min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#002147] border-t-[#DAA520] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white border-l-4 border-[#DAA520] pl-3">Recent Campus Activity</h3>
                    <button onClick={() => setActiveTab('posts')} className="text-sm font-semibold text-[#002147] dark:text-[#DAA520] hover:underline whitespace-nowrap">View All Activity &rarr;</button>
                  </div>

                  {posts.length === 0 && clubs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300">
                      <p className="text-slate-500">No activity yet. Get started by creating a club!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {posts.slice(0, 5).map((post) => (
                        <div key={post.id} className="flex items-center p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:border-college-blue-200 transition-colors shadow-sm">
                          <div className={`p-3 rounded-full mr-4 ${post.type === 'event' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {post.type === 'event' ? <Calendar className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-white text-lg">{post.title}</h4>
                            <p className="text-sm text-slate-500">Posted by <span className="font-semibold text-[#002147]">{post.clubName}</span> • {post.date}</p>
                          </div>
                          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold uppercase text-slate-500">
                            {post.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clubs Tab */}
              {activeTab === 'clubs' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 flex-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search clubs by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002147]"
                      />
                    </div>
                    <button
                      onClick={() => setShowCreateClubModal(true)}
                      className="bg-[#002147] hover:bg-[#00152e] text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wide text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Register New Club
                    </button>
                  </div>

                  {filteredClubs.length === 0 ? (
                    <div className="text-center py-20">
                      <Users className="w-20 h-20 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                      <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">No clubs found</h3>
                      <p className="text-slate-400 dark:text-slate-500 mt-2">Start by registering a new student organization.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredClubs.map((club) => (
                        <div key={club.id} className="relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 group">
                          {/* Decorative Top Border */}
                          <div className={`h-2 w-full bg-gradient-to-r ${club.color || 'from-blue-500 to-blue-600'}`}></div>

                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-3xl shadow-inner border border-slate-100 dark:border-slate-600 overflow-hidden">
                                {club.image ? (
                                  <img src={club.image} alt={club.name} className="w-full h-full object-contain" />
                                ) : (
                                  club.icon
                                )}
                              </div>
                              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold uppercase tracking-wider text-slate-500">
                                {club.category}
                              </div>
                            </div>

                            <h4 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2 group-hover:text-[#002147] transition-colors">{club.name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 h-10">{club.description}</p>

                            {/* Officers Grid */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-6 space-y-2 border border-slate-100 dark:border-slate-700">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase">Secretary</span>
                                {club.secretaryEmail ? (
                                  <span className="text-green-600 font-semibold truncate max-w-[120px]" title={club.secretaryEmail}>{club.secretaryEmail}</span>
                                ) : (
                                  <button onClick={() => openSecretaryModal(club)} className="text-[#002147] hover:underline font-medium">+ Assign</button>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase">President</span>
                                {club.presidentEmail ? (
                                  <span className="text-purple-600 font-semibold truncate max-w-[120px]" title={club.presidentEmail}>{club.presidentEmail}</span>
                                ) : (
                                  <button onClick={() => openPresidentModal(club)} className="text-[#002147] hover:underline font-medium">+ Assign</button>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase">Treasurer</span>
                                {club.treasurerEmail ? (
                                  <span className="text-amber-600 font-semibold truncate max-w-[120px]" title={club.treasurerEmail}>{club.treasurerEmail}</span>
                                ) : (
                                  <button onClick={() => openTreasurerModal(club)} className="text-[#002147] hover:underline font-medium">+ Assign</button>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                <span className="font-bold text-slate-400 uppercase">Faculty Advisor</span>
                                {club.advisorEmail ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-cyan-600 font-semibold truncate max-w-[100px]" title={club.advisorName}>{club.advisorName}</span>
                                    <button onClick={() => openEditAdvisorModal(club)} className="text-slate-400 hover:text-blue-500"><Edit className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => openAdvisorModal(club)} className="text-[#002147] hover:underline font-medium">+ Assign</button>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => { setSelectedClub(club); setShowImageUploadModal(true); }}
                                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                              >
                                EDIT IMAGE
                              </button>
                              <button
                                onClick={() => handleDeleteClub(club.id!)}
                                className="p-2 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">All Posts & Announcements</h3>
                  </div>

                  {posts.length === 0 ? (
                    <div className="text-center py-20">
                      <Edit className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-400">No posts available.</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title / Club</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {posts.map((post) => (
                            <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.type === 'event'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                                  }`}>
                                  {post.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 dark:text-white">{post.title}</p>
                                <p className="text-xs text-slate-500">{post.clubName}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                {post.date}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeletePost(post.id!)}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">System Broadcasts</h3>
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="bg-[#002147] hover:bg-[#00152e] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      NEW BROADCAST
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200">
                      <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No previous broadcasts.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-5 rounded-xl border-l-4 ${notification.read
                            ? 'bg-white dark:bg-slate-800 border-slate-300'
                            : 'bg-blue-50 dark:bg-blue-900/10 border-[#002147] shadow-sm'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[#DAA520] uppercase tracking-widest">{notification.type || 'SYSTEM'}</span>
                                <span className="text-xs text-slate-400">• {new Date(notification.createdAt).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{notification.title}</h4>
                              <p className="text-slate-600 dark:text-slate-300">{notification.message}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteNotification(notification.id!)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Club Modal */}
        {showCreateClubModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#002147] dark:text-white">Register Organization</h3>
                  <p className="text-sm text-slate-500">Add a new student club to the system</p>
                </div>
                <button onClick={() => { setShowCreateClubModal(false); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <div className={`mt-0.5 p-1 rounded-full ${formMessage.type === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
                    {formMessage.type === 'success' ? <UserPlus className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Club Name</label>
                  <input
                    type="text"
                    value={newClub.name}
                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g., Google Developer Student Club"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                  <textarea
                    rows={3}
                    value={newClub.description}
                    onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium resize-none"
                    placeholder="Brief description of the club's purpose and activities..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Category</label>
                    <select
                      value={newClub.category}
                      onChange={(e) => setNewClub({ ...newClub, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium appearance-none"
                    >
                      {CLUB_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Icon (Emoji)</label>
                    <input
                      type="text"
                      value={newClub.icon}
                      onChange={(e) => setNewClub({ ...newClub, icon: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium text-center"
                      placeholder="🎯"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateClub}
                    className="w-full bg-[#002147] hover:bg-[#00152e] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5 text-[#DAA520]" />
                    REGISTER CLUB
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Secretary Modal */}
        {showCreateSecretaryModal && selectedClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">Assign Secretary</h3>
                  <p className="text-xs text-slate-500">For <span className="font-semibold text-[#DAA520]">{selectedClub.name}</span></p>
                </div>
                <button onClick={() => { setShowCreateSecretaryModal(false); setSelectedClub(null); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={newSecretary.name}
                    onChange={(e) => setNewSecretary({ ...newSecretary, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g. Amish Prabhu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                  <input
                    type="email"
                    value={newSecretary.email}
                    onChange={(e) => setNewSecretary({ ...newSecretary, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="secretary@walchandsangli.ac.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Set Password</label>
                  <input
                    type="password"
                    value={newSecretary.password}
                    onChange={(e) => setNewSecretary({ ...newSecretary, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handleCreateSecretary}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2 mt-4"
                >
                  <UserPlus className="w-5 h-5" />
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create President Modal */}
        {showCreatePresidentModal && selectedClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">Assign President</h3>
                  <p className="text-xs text-slate-500">For <span className="font-semibold text-[#DAA520]">{selectedClub.name}</span></p>
                </div>
                <button onClick={() => { setShowCreatePresidentModal(false); setSelectedClub(null); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={newRoleUser.name}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g. Amish Prabhu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                  <input
                    type="email"
                    value={newRoleUser.email}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="president@walchandsangli.ac.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Set Password</label>
                  <input
                    type="password"
                    value={newRoleUser.password}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handleCreatePresident}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2 mt-4"
                >
                  <UserPlus className="w-5 h-5" />
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Treasurer Modal */}
        {showCreateTreasurerModal && selectedClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">Assign Treasurer</h3>
                  <p className="text-xs text-slate-500">For <span className="font-semibold text-[#DAA520]">{selectedClub.name}</span></p>
                </div>
                <button onClick={() => { setShowCreateTreasurerModal(false); setSelectedClub(null); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={newRoleUser.name}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g. Amish Prabhu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                  <input
                    type="email"
                    value={newRoleUser.email}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="treasurer@walchandsangli.ac.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Set Password</label>
                  <input
                    type="password"
                    value={newRoleUser.password}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handleCreateTreasurer}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-2 mt-4"
                >
                  <UserPlus className="w-5 h-5" />
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Advisor Modal */}
        {showCreateAdvisorModal && selectedClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">Assign Faculty Advisor</h3>
                  <p className="text-xs text-slate-500">For <span className="font-semibold text-[#DAA520]">{selectedClub.name}</span></p>
                </div>
                <button onClick={() => { setShowCreateAdvisorModal(false); setSelectedClub(null); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Faculty Name</label>
                  <input
                    type="text"
                    value={newRoleUser.name}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g. Amish Prabhu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                  <input
                    type="email"
                    value={newRoleUser.email}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="advisor@walchandsangli.ac.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Set Password</label>
                  <input
                    type="password"
                    value={newRoleUser.password}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={handleCreateAdvisor}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 flex items-center justify-center gap-2 mt-4"
                >
                  <UserPlus className="w-5 h-5" />
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Advisor Modal */}
        {showEditAdvisorModal && selectedClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">Edit Advisor</h3>
                  <p className="text-xs text-slate-500">For <span className="font-semibold text-[#DAA520]">{selectedClub.name}</span></p>
                </div>
                <button onClick={() => { setShowEditAdvisorModal(false); setSelectedClub(null); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs bg-amber-50 text-amber-800 border-l-4 border-amber-500 p-3 rounded mb-6 font-medium">
                ⚠️ This will create a new advisor account. The old account will remain inactive until removed.
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">New Advisor Name</label>
                  <input
                    type="text"
                    value={newRoleUser.name}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="Advisor Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">New Official Email</label>
                  <input
                    type="email"
                    value={newRoleUser.email}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="advisor@wce.ac.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Set Password</label>
                  <input
                    type="password"
                    value={newRoleUser.password}
                    onChange={(e) => setNewRoleUser({ ...newRoleUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleReplaceAdvisor}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5 text-[#DAA520]" />
                    UPDATE ADVISOR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">New Broadcast</h3>
                  <p className="text-xs text-slate-500">Send a system-wide notification</p>
                </div>
                <button onClick={() => { setShowNotificationModal(false); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="Broadcast Headline"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Message</label>
                  <textarea
                    rows={4}
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-college-blue-primary transition-all font-medium resize-none"
                    placeholder="Type your message here..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Broadcast Type</label>
                  <div className="relative">
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-college-blue-primary transition-all font-medium appearance-none"
                    >
                      <option value="system">System Update</option>
                      <option value="announcement">General Announcement</option>
                      <option value="event">Event Alert</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateNotification}
                    className="w-full bg-college-blue-primary hover:bg-college-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5 text-college-gold" />
                    SEND BROADCAST
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageUploadModal && selectedClub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-college-blue-primary dark:text-white">
                    Update Branding
                  </h3>
                  <p className="text-xs text-slate-500">For <span className="font-semibold text-college-gold">{selectedClub.name}</span></p>
                </div>
                <button
                  onClick={() => { setShowImageUploadModal(false); setSelectedClub(null); }}
                  className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6 flex gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg h-fit">
                  <ImageIcon className="w-5 h-5 text-college-blue-primary dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-college-blue-primary dark:text-blue-300">Club Logo / Banner</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Upload a high-quality image (PNG/JPG) to be displayed on the club card and details page.</p>
                </div>
              </div>

              <AdminImageUploader
                clubId={selectedClub.id!}
                currentImage={selectedClub.image}
                onSuccess={(url) => {
                  setClubs(prev => prev.map(c => c.id === selectedClub.id ? { ...c, image: url } : c));
                  setShowImageUploadModal(false);
                  setSelectedClub(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
