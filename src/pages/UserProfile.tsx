import { ArrowLeft, User, Mail, Calendar, Heart, Share2, Save, Edit, X, CalendarCheck, History, Clock, MapPin, ExternalLink, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, getUserMemberships, getUserRSVPsByEmail, getPosts, getClubs, getNotifications, getClubMessages } from '../lib/dbService';
import { Page } from '../types/page';
import { DBPost, ClubMessage, DBClub, DBNotification } from '../types/auth';

interface UserProfileProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  onNavigateToPost: (postId: string) => void;
  onNavigateToClub?: (clubId: string, slug?: string) => void;
}

interface UserEvent {
  event: DBPost;
  rsvpDate: Date;
  certificateUrl?: string;
}

export default function UserProfile({ onBack, onNavigate, onNavigateToPost, onNavigateToClub }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'following' | 'tasks'>('overview');
  const [likedClubsList, setLikedClubsList] = useState<DBClub[]>([]);
  const [likedClubNotifications, setLikedClubNotifications] = useState<DBNotification[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    email: '',
    joinDate: '',
  });
  const [memberships, setMemberships] = useState<any[]>([]); // Add state for memberships
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    email: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Messages State
  const [clubMessages, setClubMessages] = useState<Record<string, ClubMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [unreadState, setUnreadState] = useState<Record<string, boolean>>({});

  // Event State
  const [eventTab, setEventTab] = useState<'upcoming' | 'past'>('upcoming');
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Tasks State
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Tasks Tab Visibility - Show for anyone in a club
  const showTasksTab = memberships.length > 0;
  const [lastViewedTaskTime, setLastViewedTaskTime] = useState<string | null>(localStorage.getItem('last_viewed_tasks'));

  // Load Tasks when tab is active or memberships loaded
  useEffect(() => {
    const fetchTasks = async () => {
      if (showTasksTab && user?.email) {
        setTasksLoading(true);
        try {
          // Dynamic import to avoid circular dependencies if any, though likely safe to import directly if available
          const { getUserTasks } = await import('../lib/dbService');
          const tasks = await getUserTasks();
          setUserTasks(tasks);
        } catch (error) {
          console.error("Error loading tasks", error);
        } finally {
          setTasksLoading(false);
        }
      }
    };

    if (activeTab === 'tasks' || (showTasksTab && userTasks.length === 0)) {
      fetchTasks();
    }

    // Mark as seen when opening tasks tab
    if (activeTab === 'tasks') {
      const now = new Date().toISOString();
      localStorage.setItem('last_viewed_tasks', now);
      setLastViewedTaskTime(now);
    }
  }, [activeTab, showTasksTab, user?.email]);

  // Determine unseen tasks count
  const unseenTasksCount = userTasks.filter(t => {
    if (t.status !== 'pending') return false;
    if (!lastViewedTaskTime) return true;
    return new Date(t.createdAt) > new Date(lastViewedTaskTime);
  }).length;

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setProfileData({
            name: profile.name || user.name || '',
            bio: (profile as any).bio || '',
            email: profile.email || user.email || '',
            joinDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown',
          });
          setEditForm({
            name: profile.name || user.name || '',
            bio: (profile as any).bio || '',
            email: profile.email || '',
          });
        } else {
          // Fallback to user context data
          setProfileData({
            name: user.name || '',
            bio: '',
            email: user.email || '',
            joinDate: 'Recently',
          });
          setEditForm({
            name: user.name || '',
            bio: '',
            email: user.email || '',
          });
        }

        // Fetch memberships
        if (user.email) {
          const userMemberships = await getUserMemberships(user.email);
          setMemberships(userMemberships);
        }
      }
    };
    loadProfile();
  }, [user]);

  // Check for unread messages when memberships load
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (memberships.length === 0) return;

      const newUnreadState: Record<string, boolean> = {};

      await Promise.all(memberships.map(async (m) => {
        try {
          // We fetch messages to check the latest one
          const msgs = await getClubMessages(m.clubId);
          if (msgs && msgs.length > 0) {
            const latestMsg = msgs[0]; // Assumes sorted by createdAt desc
            const lastRead = localStorage.getItem(`read_msgs_${m.clubId}`);

            if (!lastRead || new Date(latestMsg.createdAt) > new Date(lastRead)) {
              newUnreadState[m.clubId] = true;
            }
          }
        } catch (error) {
          console.error(`Error checking messages for club ${m.clubId}`, error);
        }
      }));

      setUnreadState(prev => ({ ...prev, ...newUnreadState }));
    };

    checkUnreadMessages();
  }, [memberships]);

  // Fetch Events
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!user?.email) {
        setEventsLoading(false);
        return;
      }

      try {
        // Get user's RSVPs
        const userRSVPs = await getUserRSVPsByEmail(user.email);

        // Get all posts to match event details
        const allPosts = await getPosts();

        // Map RSVPs to events
        const events: UserEvent[] = [];
        for (const rsvp of userRSVPs) {
          const event = allPosts.find(p => p.id === rsvp.eventId);
          if (event) {
            events.push({
              event,
              rsvpDate: new Date(rsvp.rsvpedAt),
              certificateUrl: rsvp.certificateUrl
            });
          }
        }

        // Sort by event date
        events.sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());
        setUserEvents(events);
      } catch (error) {
        console.error('Error fetching user events:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUserEvents();
  }, [user?.email]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setMessage(null);

    const result = await updateUserProfile(user.id, editForm);

    if (result.success) {
      setProfileData(prev => ({
        ...prev,
        name: editForm.name,
        bio: editForm.bio,
      }));
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
    setIsSaving(false);
  };

  const loadClubMessages = async (clubId: string) => {
    if (clubMessages[clubId]) return; // Already loaded

    setLoadingMessages(prev => ({ ...prev, [clubId]: true }));
    try {
      const msgs = await getClubMessages(clubId); // Static import
      setClubMessages(prev => ({ ...prev, [clubId]: msgs }));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(prev => ({ ...prev, [clubId]: false }));
    }
  };

  // Effect to load messages when tab changes to a club message tab
  useEffect(() => {
    if (activeTab.startsWith('messages-')) {
      const clubId = activeTab.replace('messages-', '');
      loadClubMessages(clubId);

      // Mark as read when opening the tab
      localStorage.setItem(`read_msgs_${clubId}`, new Date().toISOString());
      setUnreadState(prev => ({ ...prev, [clubId]: false }));
    }
  }, [activeTab]);

  // Load Liked Clubs and their notifications
  useEffect(() => {
    const fetchLikedClubsAndNotifications = async () => {
      if (user?.likedClubs && user.likedClubs.length > 0) {
        try {
          const allClubs = await getClubs();
          const liked = allClubs.filter(c => user.likedClubs?.includes(c.id!));
          setLikedClubsList(liked);

          // Fetch all notifications and filter for liked clubs
          const allNotifications = await getNotifications();
          const likedClubNotifs = allNotifications.filter(n =>
            n.clubId && user.likedClubs?.includes(n.clubId)
          );
          setLikedClubNotifications(likedClubNotifs);
        } catch (err) {
          console.error("Error loading liked clubs", err);
        }
      } else {
        setLikedClubsList([]);
        setLikedClubNotifications([]);
      }
    };
    fetchLikedClubsAndNotifications();
  }, [user?.likedClubs]);

  const now = new Date();
  const upcomingEvents = userEvents.filter(e => new Date(e.event.date) >= now);
  const pastEvents = userEvents.filter(e => new Date(e.event.date) < now);
  const displayedEvents = eventTab === 'upcoming' ? upcomingEvents : pastEvents;

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Timer state for resend OTP
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    // Dynamically import to ensure availability
    const { requestDeleteOtp } = await import('../lib/dbService');
    const result = await requestDeleteOtp();
    setIsDeleting(false);

    if (result.success) {
      setDeleteStep('otp');
      setResendTimer(30); // 30 seconds cooldown
      setCanResend(false);
    } else {
      setDeleteError(result.message || 'Failed to send verification code');
    }
  };

  const handleResendDeleteOtp = async () => {
    setDeleteError('');
    setIsDeleting(true);
    const { requestDeleteOtp } = await import('../lib/dbService');
    const result = await requestDeleteOtp();
    setIsDeleting(false);

    if (result.success) {
      setResendTimer(30);
      setCanResend(false);
    } else {
      setDeleteError(result.message || 'Failed to resend verification code');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOtp) return;
    setIsDeleting(true);
    setDeleteError('');

    const { deleteAccount } = await import('../lib/dbService');
    const result = await deleteAccount(deleteOtp);
    setIsDeleting(false);

    if (result.success) {
      // Force logout and redirect
      // Force logout and redirect
      await logout();
      window.location.href = '/';
    } else {
      setDeleteError(result.message || 'Failed to delete account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-[#002147] mb-8 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Back to Home</span>
      </button>



      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border-l-4 border-[#DAA520] mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-24 h-24 bg-[#002147] rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 border-[#DAA520] flex-shrink-0">
            👨‍🎓
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#002147] hover:bg-[#00152e] disabled:bg-slate-400 text-white rounded-lg font-bold transition-colors uppercase tracking-wide text-sm"
                  >
                    <Save className="w-4 h-4 text-[#DAA520]" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        name: profileData.name,
                        bio: profileData.bio,
                        email: profileData.email
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-serif font-bold text-[#002147] dark:text-white mb-2">{profileData.name || 'User'}</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {profileData.bio || 'No bio yet. Click edit to add one!'}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profileData.email}</span>
                  </div>
                  <div className="hidden sm:block">•</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#DAA520]" />
                    <span>Joined {profileData.joinDate}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Edit className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* Role Badge */}
        {user?.role && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.role === 'admin'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200'
                : user.role === 'club-secretary'
                  ? 'bg-blue-100 text-[#002147] dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                {user.role === 'club-secretary' ? 'Club Secretary' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.clubName && (
                <span className="text-sm text-slate-600 dark:text-slate-400">• {user.clubName}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs - Hide for advisors */}
      {user?.role !== 'advisor' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'events', label: 'My Events', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                  : 'text-slate-500 dark:text-slate-300 hover:text-[#002147] dark:hover:text-white'
                  }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#DAA520]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            ))}

            {showTasksTab && (
              <button
                onClick={() => setActiveTab('tasks' as any)}
                className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activeTab === 'tasks'
                  ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                  : 'text-slate-500 dark:text-slate-300 hover:text-[#002147] dark:hover:text-white'
                  }`}
              >
                <History className={`w-5 h-5 ${activeTab === 'tasks' ? 'text-[#DAA520]' : ''}`} />
                <span>Tasks</span>
                {unseenTasksCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unseenTasksCount}
                  </span>
                )}
              </button>
            )}

            <button
              key="following"
              onClick={() => setActiveTab('following' as any)}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap ${activeTab === 'following'
                ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                : 'text-slate-500 dark:text-slate-300 hover:text-[#002147] dark:hover:text-white'
                }`}
            >
              <Heart className={`w-5 h-5 ${activeTab === 'following' ? 'text-[#DAA520]' : ''}`} />
              <span>Following</span>
            </button>

            {memberships.map((membership) => (
              <button
                key={`messages-${membership.clubId}`}
                onClick={() => setActiveTab(`messages-${membership.clubId}` as any)}
                className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap relative ${activeTab === `messages-${membership.clubId}`
                  ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                  : 'text-slate-500 dark:text-slate-300 hover:text-[#002147] dark:hover:text-white'
                  }`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs overflow-hidden">
                  {membership.clubImage ? <img src={membership.clubImage} className="w-full h-full object-cover" /> : '💬'}
                </div>
                <span>{membership.clubName} Msgs</span>

                {/* Unread Indicator */}
                {unreadState[membership.clubId] && (
                  <span className="absolute top-3 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white mb-4">Club Memberships</h3>
                  {memberships.length > 0 ? (
                    <div className="grid gap-4">
                      {memberships.map((membership, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${membership.clubColor ? `bg-gradient-to-br ${membership.clubColor}` : 'bg-slate-200 dark:bg-slate-600'}`}>
                            {membership.clubImage ? (
                              <img src={membership.clubImage} alt={membership.clubName} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              membership.clubIcon || '🏛️'
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{membership.clubName}</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                              ${membership.role === 'president' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                  membership.role === 'vice-president' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                    membership.role === 'treasurer' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                      membership.role === 'secretary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                                }`}>
                                {membership.role.charAt(0).toUpperCase() + membership.role.slice(1).replace('-', ' ')}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">• Since {new Date(membership.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 italic">Not a member of any club yet.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Profile Updated</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Your profile is now synced • Recently</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Welcome to Club-Connect!</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Start exploring clubs and events</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'following' && (
              <div className="space-y-8">
                {/* Liked Clubs Section */}
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white mb-4">Clubs You Follow</h3>
                  {likedClubsList.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {likedClubsList.map((club) => (
                        <div
                          key={club.id}
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                          onClick={() => onNavigateToClub ? onNavigateToClub(club.id!, club.slug) : onNavigate('dashboard')}
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-500 overflow-hidden">
                            {club.image ? <img src={club.image} alt={club.name} className="w-full h-full object-cover" /> : <Heart className="w-6 h-6 text-red-500" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{club.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{club.description}</p>
                          </div>
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't liked any clubs yet.</p>
                      <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 bg-[#002147] text-white rounded-lg font-bold text-sm">Explore Clubs</button>
                    </div>
                  )}
                </div>

                {/* Liked Club Notifications Section */}
                {likedClubsList.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white mb-4">Updates from Followed Clubs</h3>
                    {likedClubNotifications.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {likedClubNotifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif.id}
                            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex-shrink-0">
                                <Heart className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{notif.title}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No updates from your followed clubs yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* Event Tabs */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setEventTab('upcoming')}
                    className={`pb-3 px-2 font-bold transition-colors relative ${eventTab === 'upcoming'
                      ? 'text-[#002147] dark:text-blue-400'
                      : 'text-slate-500 hover:text-[#002147] dark:hover:text-slate-300'
                      }`}
                  >
                    Upcoming ({upcomingEvents.length})
                    {eventTab === 'upcoming' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#002147]" />
                    )}
                  </button>
                  <button
                    onClick={() => setEventTab('past')}
                    className={`pb-3 px-2 font-bold transition-colors relative ${eventTab === 'past'
                      ? 'text-[#002147] dark:text-blue-400'
                      : 'text-slate-500 hover:text-[#002147] dark:hover:text-slate-300'
                      }`}
                  >
                    Past ({pastEvents.length})
                    {eventTab === 'past' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#002147]" />
                    )}
                  </button>
                </div>

                {/* Event List */}
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : displayedEvents.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    {eventTab === 'upcoming' ? (
                      <>
                        <CalendarCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 mb-4">No upcoming events found.</p>
                        <button
                          onClick={() => onNavigate('events')}
                          className="px-4 py-2 bg-[#002147] hover:bg-[#00152e] text-white rounded-lg font-bold transition-colors text-sm uppercase tracking-wide"
                        >
                          Browse Events
                        </button>
                      </>
                    ) : (
                      <>
                        <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">No past events found.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {displayedEvents.map(({ event, rsvpDate, certificateUrl }) => (
                      <div
                        key={event.id}
                        className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${eventTab === 'upcoming'
                                ? 'bg-blue-100 text-[#002147] dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {eventTab === 'upcoming' ? 'Upcoming' : 'Completed'}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">by {event.clubName}</span>
                            </div>

                            <h4 className="font-serif font-bold text-[#002147] dark:text-white mb-2">
                              {event.title}
                            </h4>

                            <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              {event.time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {event.time}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {event.location}
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-2">
                              RSVP'd on {rsvpDate.toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2 items-center">
                            {/* Certificate Button - Only show if certificate exists */}
                            {certificateUrl && (
                              <a
                                href={certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg border border-yellow-200 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors flex items-center gap-2 text-xs font-bold"
                                title="Download Certificate"
                              >
                                <Award className="w-4 h-4" />
                                <span className="hidden sm:inline">Certificate</span>
                              </a>
                            )}

                            <button
                              onClick={() => event.id && onNavigateToPost(event.id)}
                              className="p-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {tasksLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : userTasks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No tasks assigned to you yet.</p>
                    <button onClick={() => onNavigate('dashboard')} className="mt-4 px-4 py-2 bg-[#002147] text-white rounded-lg font-bold text-sm">
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {userTasks.map((task) => (
                      <div key={task.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : task.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                }`}>
                                {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">for {task.eventTitle}</span>
                              <span className="text-xs text-slate-400">• {task.clubName}</span>
                            </div>

                            <h4 className="font-serif font-bold text-[#002147] dark:text-white mb-2">{task.title}</h4>

                            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                              {task.deadline && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                                  <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-bold' : ''}>
                                    Due {new Date(task.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>


                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>Assigned by {task.createdBy}</span>
                            </div>

                          </div>

                          <div>
                            <button
                              onClick={() => onNavigateToPost(task.eventId)}
                              className="p-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                              title="View Event"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Club Message Tabs */}
            {
              activeTab.startsWith('messages-') && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">
                      Messages from {memberships.find(m => `messages-${m.clubId}` === activeTab)?.clubName}
                    </h3>
                  </div>

                  {loadingMessages[activeTab.replace('messages-', '')] ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clubMessages[activeTab.replace('messages-', '')]?.length > 0 ? (
                        clubMessages[activeTab.replace('messages-', '')].map(msg => (
                          <div key={msg.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white">{msg.title}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                  From {msg.senderName} ({msg.senderRole}) • {new Date(msg.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {msg.body}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic text-center py-8">No messages from this club yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            }

          </div>
        </div>
      )
      }

      {/* Dynamic Club Message Tabs */}
      {
        activeTab.startsWith('messages-') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white">
                Messages from {memberships.find(m => `messages-${m.clubId}` === activeTab)?.clubName}
              </h3>
            </div>

            {loadingMessages[activeTab.replace('messages-', '')] ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {clubMessages[activeTab.replace('messages-', '')]?.length > 0 ? (
                  clubMessages[activeTab.replace('messages-', '')].map(msg => (
                    <div key={msg.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">{msg.title}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            From {msg.senderName} ({msg.senderRole}) • {new Date(msg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic text-center py-8">No messages from this club yet.</p>
                )}
              </div>
            )}
          </div>
        )
      }

      {/* Danger Zone */}
      <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/50 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <div className="w-6 h-6 text-red-600 dark:text-red-400">⚠️</div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteStep('confirm');
                    setDeleteOtp('');
                    setDeleteError('');
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-[#002147] dark:text-white mb-2">
                {deleteStep === 'confirm' ? 'Delete Account?' : 'Verify Identity'}
              </h3>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {deleteStep === 'confirm'
                  ? 'This action triggers a permanent deletion of your profile, history, and data. To proceed, we need to verify your email.'
                  : 'Please enter the verification code sent to your email to confirm deletion.'}
              </p>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 text-sm rounded-lg font-medium">
                  {deleteError}
                </div>
              )}

              {deleteStep === 'confirm' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isDeleting ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-red-500 outline-none"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting || deleteOtp.length < 6}
                    className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isDeleting ? (
                      <>Loading...</>
                    ) : (
                      <>
                        Confirm Deletion
                      </>
                    )}
                  </button>

                  <div className="text-center mt-2">
                    <p className="text-sm text-slate-500">
                      Didn't receive code?{' '}
                      <button
                        type="button"
                        onClick={handleResendDeleteOtp}
                        disabled={!canResend || isDeleting}
                        className={`font-semibold ${!canResend ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                      >
                        Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div>
  );
}
