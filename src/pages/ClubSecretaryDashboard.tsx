import { useState, useEffect } from 'react';
import { Settings, Users, Calendar, Bell, Edit, Plus, Trash2, Send, Image } from 'lucide-react';
import { Page } from '../types/page';
import { User, FirestoreClub, FirestorePost, Attachment } from '../types/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getPosts, createPost, deletePost, createNotification, updatePost } from '../lib/firestoreService';
import CloudinaryUpload from '../components/CloudinaryUpload';
import AttachmentGallery from '../components/AttachmentGallery';

// Notification Sender Component
function NotificationSender({ club }: { club: FirestoreClub }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const notificationId = await createNotification({
        title: `${club.name}: ${title}`,
        message,
        type: 'club',
        clubId: club.id,
        read: false
      });

      if (notificationId) {
        setResult({ type: 'success', text: 'Notification sent successfully!' });
        setTitle('');
        setMessage('');
      } else {
        setResult({ type: 'error', text: 'Failed to send notification' });
      }
    } catch (error) {
      setResult({ type: 'error', text: 'Failed to send notification' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Send Notifications</h3>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Send New Notification</h4>

        {result && (
          <div className={`p-3 rounded-lg mb-4 ${result.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            {result.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your notification message..."
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Image URL Input Component
function ImageUploader({ clubId, currentImage, onImageUpdated }: { clubId: string; currentImage?: string; onImageUpdated: (url: string) => void }) {
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }



    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const { updateClubImage } = await import('../lib/firestoreService');
      const result = await updateClubImage(clubId, imageUrl);

      if (result.success) {
        onImageUpdated(imageUrl);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
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
    <div className="space-y-4">
      <div className="relative w-32 h-32 mx-auto">
        <img
          src={imageUrl || currentImage || '/club-default.jpg'}
          alt="Club profile"
          className="w-full h-full object-cover rounded-lg border-2 border-slate-300 dark:border-slate-600"
          onError={(e) => { (e.target as HTMLImageElement).src = '/club-default.jpg'; }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center">Image updated!</p>
      )}

      <div className="space-y-2">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Paste image URL here..."
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        >
          {isSaving ? 'Saving...' : 'Save Image URL'}
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        Tip: Upload image to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Imgur</a> and paste the link
      </p>
    </div>
  );
}

interface ClubSecretaryDashboardProps {
  onNavigate: (page: Page) => void;
  user?: User | null;
}

export default function ClubSecretaryDashboard({ onNavigate, user }: ClubSecretaryDashboardProps) {
  const [club, setClub] = useState<FirestoreClub | null>(null);
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'notifications'>('overview');
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'event' | 'announcement',
    date: new Date().toISOString().split('T')[0],
    attachments: [] as Attachment[]
  });

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);

  // Fetch club data from Firestore
  useEffect(() => {
    const fetchClubData = async () => {
      if (!user?.clubId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch club document
        const clubRef = doc(db, 'clubs', user.clubId);
        const clubDoc = await getDoc(clubRef);

        if (clubDoc.exists()) {
          setClub({
            id: clubDoc.id,
            ...clubDoc.data(),
            createdAt: clubDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: clubDoc.data().updatedAt?.toDate() || new Date(),
          } as FirestoreClub);
        }

        // Fetch posts for this club
        const allPosts = await getPosts();
        const clubPosts = allPosts.filter(p => p.clubId === user.clubId);
        setPosts(clubPosts);
      } catch (error) {
        console.error('Error fetching club data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubData();
  }, [user?.clubId]);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (!club || !user) return;

    const postId = await createPost({
      title: newPost.title,
      content: newPost.content,
      type: newPost.type,
      date: newPost.date,
      clubId: club.id!,
      clubName: club.name,
      authorId: user.id,
      authorName: user.name,
      status: 'published',
      rsvps: 0,
      ...(newPost.attachments.length > 0 ? { attachments: newPost.attachments } : {})
    });

    if (postId) {
      setFormMessage({ type: 'success', text: 'Post created successfully!' });
      setNewPost({
        title: '',
        content: '',
        type: 'announcement',
        date: new Date().toISOString().split('T')[0],
        attachments: []
      });

      // Refresh posts
      const allPosts = await getPosts();
      setPosts(allPosts.filter(p => p.clubId === user.clubId));

      setTimeout(() => {
        setIsCreatePostModalOpen(false);
        setFormMessage(null);
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: 'Failed to create post' });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const success = await deletePost(postId);
    if (success && user?.clubId) {
      const allPosts = await getPosts();
      setPosts(allPosts.filter(p => p.clubId === user.clubId));
    }
  };

  const handleEditPhotos = (post: FirestorePost) => {
    setEditingPostId(post.id!);
    setEditAttachments(post.eventPhotos || []);  // Use eventPhotos for post-event uploads
  };

  const handleSavePhotos = async () => {
    if (!editingPostId) return;

    const success = await updatePost(editingPostId, { eventPhotos: editAttachments });  // Save to eventPhotos
    if (success && user?.clubId) {
      const allPosts = await getPosts();
      setPosts(allPosts.filter(p => p.clubId === user.clubId));
      setEditingPostId(null);
      setEditAttachments([]);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Club not found</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Your account is not linked to any club. Please contact the administrator.
        </p>
        <button onClick={() => onNavigate('home')} className="text-blue-600 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.color} flex items-center justify-center text-2xl overflow-hidden`}>
            {club.image && club.image.startsWith('http') ? (
              <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
            ) : (
              club.icon
            )}
          </div>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{club.members}</p>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{posts.length}</p>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'posts', label: 'Manage Posts', icon: Edit },
            { id: 'notifications', label: 'Send Notifications', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
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
                      <span className="font-semibold text-slate-900 dark:text-white">{club.members}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Total Posts:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{posts.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Club Profile Picture</h4>
                  <ImageUploader clubId={club.id!} currentImage={club.image} onImageUpdated={(url) => setClub({ ...club, image: url })} />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mt-6">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Recent Posts</h4>
                {posts.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400">No posts yet. Create your first post!</p>
                ) : (
                  <div className="space-y-3">
                    {posts.slice(0, 3).map((post) => (
                      <div key={post.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${post.type === 'event' ? 'bg-blue-500' : 'bg-purple-500'} rounded-full`}></div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{post.title}</p>
                      </div>
                    ))}
                  </div>
                )}
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
                  Create New Post
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <Edit className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No posts yet. Create your first post!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${post.type === 'event'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              }`}>
                              {post.type}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{post.date}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-2">{post.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{post.content}</p>
                          {post.rsvps && post.rsvps > 0 && (
                            <p className="text-sm text-green-600 dark:text-green-400">{post.rsvps} RSVPs</p>
                          )}
                          {post.attachments && post.attachments.length > 0 && (
                            <div className="mt-3">
                              <AttachmentGallery attachments={post.attachments} />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-col">
                          {post.type === 'event' && new Date(post.date) < new Date() && (
                            <button
                              onClick={() => handleEditPhotos(post)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                              title="Add Event Photos"
                            >
                              <Image className="w-4 h-4" />
                              Add Photos ({post.eventPhotos?.length || 0})
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post.id!)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
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

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationSender club={club} />
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {isCreatePostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Post</h3>
              <button
                onClick={() => { setIsCreatePostModalOpen(false); setFormMessage(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {formMessage && (
              <div className={`p-3 rounded-lg mb-4 ${formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {formMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Content
                </label>
                <textarea
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Post content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost({ ...newPost, type: e.target.value as 'event' | 'announcement' })}
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
                  onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description Images (Optional)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Add promotional images for your post. Event photos can be added later.
                </p>
                <CloudinaryUpload
                  clubName={club.name}
                  existingAttachments={newPost.attachments}
                  onUploadComplete={(attachments) => setNewPost({ ...newPost, attachments })}
                  maxFiles={10}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setIsCreatePostModalOpen(false); setFormMessage(null); }}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
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

      {/* Edit Photos Modal */}
      {editingPostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Event Photos</h3>
              <button
                onClick={() => { setEditingPostId(null); setEditAttachments([]); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <CloudinaryUpload
              clubName={club.name}
              existingAttachments={editAttachments}
              onUploadComplete={(attachments) => setEditAttachments(attachments)}
              maxFiles={20}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditingPostId(null); setEditAttachments([]); }}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhotos}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                Save Photos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
