import { ArrowLeft, User, Mail, Calendar, Heart, Share2, Save, Edit, X, CalendarCheck, History, Clock, MapPin, ExternalLink, Award, Menu, Settings2, Camera, Lock, Eye, EyeOff } from 'lucide-react';
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
  const [isMobileTabOpen, setIsMobileTabOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    email: '',
    joinDate: '',
    profileImage: '',
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
            profileImage: (profile as any).profileImage || '',
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
            profileImage: '',
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
      } else {
        // Clear state if no user
        setProfileData({
          name: '',
          bio: '',
          email: '',
          joinDate: '',
          profileImage: '',
        });
        setMemberships([]);
        setUserEvents([]);
        setUserTasks([]);
        setLikedClubsList([]);
        setLikedClubNotifications([]);
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
        events.sort((a, b) => new Date(b.event.date || 0).getTime() - new Date(a.event.date || 0).getTime());
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
  const upcomingEvents = userEvents.filter(e => e.event.date && new Date(e.event.date) >= now);
  const pastEvents = userEvents.filter(e => e.event.date && new Date(e.event.date) < now);
  const displayedEvents = eventTab === 'upcoming' ? upcomingEvents : pastEvents;

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer state for resend OTP
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Countdown timer effect with persistence
  useEffect(() => {
    const checkTimer = () => {
      const blockExpiry = localStorage.getItem('deleteOtpBlockExpiry');
      const cooldownExpiry = localStorage.getItem('deleteOtpExpiry');
      const now = Date.now();

      if (blockExpiry) {
        const secondsLeft = Math.ceil((parseInt(blockExpiry) - now) / 1000);
        if (secondsLeft > 0) {
          setResendTimer(secondsLeft);
          setCanResend(false);
          return;
        } else {
          localStorage.removeItem('deleteOtpBlockExpiry');
          localStorage.removeItem('deleteOtpCount');
        }
      }

      if (cooldownExpiry) {
        const secondsLeft = Math.ceil((parseInt(cooldownExpiry) - now) / 1000);
        if (secondsLeft > 0) {
          setResendTimer(secondsLeft);
          setCanResend(false);
        } else {
          setResendTimer(0);
          setCanResend(true);
          localStorage.removeItem('deleteOtpExpiry');
        }
      } else {
        setResendTimer(0);
        setCanResend(true);
      }
    };

    checkTimer(); // Initial check
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestDelete = async () => {
    // Check if blocked
    if (localStorage.getItem('deleteOtpBlockExpiry')) {
      const expiry = parseInt(localStorage.getItem('deleteOtpBlockExpiry') || '0');
      if (Date.now() < expiry) {
        setDeleteError('Too many attempts. Please try again later.');
        return;
      }
    }

    setIsDeleting(true);
    setDeleteError('');
    // Dynamically import to ensure availability
    const { requestDeleteOtp } = await import('../lib/dbService');
    const result = await requestDeleteOtp();
    setIsDeleting(false);

    if (result.success) {
      setDeleteStep('otp');

      // Increment count
      let count = parseInt(localStorage.getItem('deleteOtpCount') || '0');
      count++;
      localStorage.setItem('deleteOtpCount', count.toString());

      if (count > 3) {
        const expiry = Date.now() + 3600000; // 1 hour
        localStorage.setItem('deleteOtpBlockExpiry', expiry.toString());
        setResendTimer(3600);
        setCanResend(false);
      } else {
        const expiry = Date.now() + 30000;
        localStorage.setItem('deleteOtpExpiry', expiry.toString());
        setResendTimer(30);
        setCanResend(false);
      }
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
      let count = parseInt(localStorage.getItem('deleteOtpCount') || '0');
      count++;
      localStorage.setItem('deleteOtpCount', count.toString());

      if (count > 3) {
        const expiry = Date.now() + 3600000; // 1 hour
        localStorage.setItem('deleteOtpBlockExpiry', expiry.toString());
        setResendTimer(3600);
        setCanResend(false);
      } else {
        const expiry = Date.now() + 30000;
        localStorage.setItem('deleteOtpExpiry', expiry.toString());
        setResendTimer(30);
        setCanResend(false);
      }
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

  const handleChangePassword = async () => {
    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New password and confirm password do not match');
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordError('');

    const { changePassword } = await import('../lib/dbService');
    const result = await changePassword(currentPassword, newPassword);

    setIsChangingPassword(false);

    if (result.success) {
      setChangePasswordSuccess(true);
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePasswordSuccess(false);
      }, 2000);
    } else {
      setChangePasswordError(result.message || 'Failed to change password');
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

      {/* Profile Header - Horizontal layout on mobile */}
      <div className="glass-card p-3 md:p-6 mb-4 md:mb-8 relative overflow-hidden group">
        {/* Background Glows */}
        {/* Background Glows - REMOVED */}
        {/* <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div> */}

        <div className="relative z-10 flex items-start gap-3 sm:gap-5">
          {/* Avatar - Left side */}
          <div className="relative group flex-shrink-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl sm:text-3xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden group-hover:border-cyan-500/50 transition-colors duration-300">
              {profileData.profileImage ? (
                <img
                  src={profileData.profileImage}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 dark:text-slate-500 font-bold group-hover:text-cyan-500 transition-colors">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            {/* Persistent camera badge indicator */}
            <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-lg p-1 shadow-lg border-2 border-white dark:border-slate-900 pointer-events-none">
              <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
            </div>

            {/* Upload button overlay */}
            <button
              onClick={() => {
                const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                if (!window.cloudinary || !cloudName || !uploadPreset) {
                  setMessage({ type: 'error', text: 'Upload not available. Please try again later.' });
                  return;
                }

                setIsUploadingPhoto(true);
                const widget = window.cloudinary.createUploadWidget(
                  {
                    cloudName,
                    uploadPreset,
                    folder: 'club-connect/profile-pictures',
                    sources: ['local', 'camera'],
                    multiple: false,
                    maxFiles: 1,
                    resourceType: 'image',
                    cropping: true,
                    croppingAspectRatio: 1,
                    croppingShowDimensions: true,
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                    maxFileSize: 5000000, // 5MB
                    styles: {
                      palette: {
                        window: '#1e293b',
                        windowBorder: '#475569',
                        tabIcon: '#3b82f6',
                        menuIcons: '#94a3b8',
                        textDark: '#f1f5f9',
                        textLight: '#94a3b8',
                        link: '#3b82f6',
                        action: '#3b82f6',
                        inactiveTabIcon: '#64748b',
                        error: '#ef4444',
                        inProgress: '#3b82f6',
                        complete: '#22c55e',
                        sourceBg: '#0f172a'
                      }
                    }
                  },
                  async (error: any, result: any) => {
                    if (error) {
                      console.error('Upload error:', error);
                      setIsUploadingPhoto(false);
                      return;
                    }

                    if (result.event === 'success') {
                      const imageUrl = result.info.secure_url;
                      setProfileData(prev => ({ ...prev, profileImage: imageUrl }));

                      // Save to backend
                      if (user?.id) {
                        const saveResult = await updateUserProfile(user.id, { profileImage: imageUrl } as any);
                        if (saveResult.success) {
                          setMessage({ type: 'success', text: 'Profile picture updated!' });
                        } else {
                          setMessage({ type: 'error', text: 'Failed to save profile picture' });
                        }
                      }
                      setIsUploadingPhoto(false);
                    }

                    if (result.event === 'close') {
                      setIsUploadingPhoto(false);
                    }
                  }
                );
                widget.open();
              }}
              disabled={isUploadingPhoto}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer backdrop-blur-sm"
            >
              {isUploadingPhoto ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Info - Right side */}
          <div className="flex-1 min-w-0 pt-0.5">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="glass-input w-full px-3 py-1.5 text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Bio</label>
                    <textarea
                      rows={1}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="glass-input w-full px-3 py-1.5 text-sm resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md transition-all disabled:opacity-50 text-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving...' : 'Save'}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-colors text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate tracking-tight mb-0.5">
                      {profileData.name || 'User'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 md:line-clamp-none max-w-2xl leading-relaxed">
                      {profileData.bio || 'No bio yet. Click edit to add one!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 ring-1 ring-slate-200 dark:ring-white/10"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5 break-all">
                    <Mail className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                    <span>{profileData.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span>Joined {profileData.joinDate}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Role Badges for Memberships */}
        <div className="relative z-10 mt-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1. Global/System Roles */}
            {(() => {
              const allRoles = user?.roles && user.roles.length > 0 ? user.roles : [user?.role].filter(Boolean) as string[];
              const uniqueRoles = Array.from(new Set(allRoles));
              const systemRoles = uniqueRoles.filter(r => r === 'admin' || r === 'teacher');

              return systemRoles.map(role => (
                <span key={role} className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${role === 'admin'
                  ? 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                  : 'bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  }`}>
                  {role}
                </span>
              ));
            })()}

            {/* 2. Club Memberships */}
            {memberships.map((m, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${m.role === 'president' ? 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' :
                  m.role === 'secretary' ? 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' :
                    m.role === 'treasurer' ? 'bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30' :
                      m.role === 'advisor' ? 'bg-purple-100/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30' :
                        'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                  {m.role === 'club-secretary' ? 'Club Secretary' : m.role.replace('-', ' ')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium hidden sm:inline-block">of {m.clubName}</span>
              </div>
            ))}

            {/* 3. Fallback User Badge */}
            {memberships.length === 0 &&
              !user?.roles?.includes('admin') && !user?.roles?.includes('teacher') &&
              user?.role !== 'admin' && user?.role !== 'teacher' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Member
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Tabs - Hide for advisors */}
      {user?.role !== 'advisor' && (
        <div className="glass-card mb-8 overflow-hidden relative z-30">
          {/* Mobile Header for Tabs */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" />
              Menu
            </span>
            <button
              onClick={() => setIsMobileTabOpen(!isMobileTabOpen)}
              className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {isMobileTabOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className={`${isMobileTabOpen ? 'block' : 'hidden'} md:block transition-all`}>
            <div className="flex flex-col md:flex-row border-b border-slate-200 dark:border-slate-700 md:overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'events', label: 'My Events', icon: Calendar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileTabOpen(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap border-l-4 md:border-l-0 md:border-b-4 text-left md:text-center ${activeTab === tab.id
                    ? 'text-[#002147] dark:text-white border-[#002147] bg-blue-50/50 dark:bg-blue-900/10 md:bg-transparent'
                    : 'text-slate-500 dark:text-slate-300 border-transparent hover:text-[#002147] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 md:hover:bg-transparent'
                    }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              ))}

              {showTasksTab && (
                <button
                  onClick={() => {
                    setActiveTab('tasks' as any);
                    setIsMobileTabOpen(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap border-l-4 md:border-l-0 md:border-b-4 text-left md:text-center ${activeTab === 'tasks'
                    ? 'text-[#002147] dark:text-white border-[#002147] bg-blue-50/50 dark:bg-blue-900/10 md:bg-transparent'
                    : 'text-slate-500 dark:text-slate-300 border-transparent hover:text-[#002147] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 md:hover:bg-transparent'
                    }`}
                >
                  <History className={`w-5 h-5 ${activeTab === 'tasks' ? 'text-blue-600' : ''}`} />
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
                onClick={() => {
                  setActiveTab('following' as any);
                  setIsMobileTabOpen(false);
                }}
                className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap border-l-4 md:border-l-0 md:border-b-4 text-left md:text-center ${activeTab === 'following'
                  ? 'text-[#002147] dark:text-white border-[#002147] bg-blue-50/50 dark:bg-blue-900/10 md:bg-transparent'
                  : 'text-slate-500 dark:text-slate-300 border-transparent hover:text-[#002147] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 md:hover:bg-transparent'
                  }`}
              >
                <Heart className={`w-5 h-5 ${activeTab === 'following' ? 'text-blue-600' : ''}`} />
                <span>Following</span>
              </button>

              {memberships.map((membership) => (
                <button
                  key={`messages-${membership.clubId}`}
                  onClick={() => {
                    setActiveTab(`messages-${membership.clubId}` as any);
                    setIsMobileTabOpen(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-bold transition-all whitespace-nowrap relative border-l-4 md:border-l-0 md:border-b-4 text-left md:text-center ${activeTab === `messages-${membership.clubId}`
                    ? 'text-[#002147] dark:text-white border-[#002147] bg-blue-50/50 dark:bg-blue-900/10 md:bg-transparent'
                    : 'text-slate-500 dark:text-slate-300 border-transparent hover:text-[#002147] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 md:hover:bg-transparent'
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
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${membership.clubColor ? 'bg-blue-700' : 'bg-slate-200 dark:bg-slate-600'}`}>
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
                              ${membership.role === 'president' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
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
                        className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
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
                                {new Date(event.date || Date.now()).toLocaleDateString('en-US', {
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
                                className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 text-xs font-bold"
                                title="Download Certificate"
                              >
                                <Award className="w-4 h-4" />
                                <span className="hidden sm:inline">Certificate</span>
                              </a>
                            )}

                            <button
                              onClick={() => event.id && onNavigateToPost(event.id)}
                              className="p-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-blue-600 dark:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
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
                      <div key={task.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : task.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
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
                                    Due {new Date(task.deadline || Date.now()).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>


                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>Assigned by {task.createdBy}</span>
                            </div>

                          </div>

                          {task.eventId && (
                            <div>
                              <button
                                onClick={() => onNavigateToPost(task.eventId)}
                                className="p-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-blue-600 dark:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                title="View Event"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
                          <div key={msg.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/40">
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



      {/* Account Settings */}
      <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
        {/* Change Password Section */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Update your password to keep your account secure.
          </p>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-blue-600 border border-blue-200 dark:border-blue-900/50 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Change Password
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-red-600 border border-red-200 dark:border-red-900/50 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
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
                        {resendTimer > 60
                          ? `Try again in ${Math.ceil(resendTimer / 60)}m`
                          : `Resend ${resendTimer > 0 ? `(${resendTimer}s)` : ''}`
                        }
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setChangePasswordError('');
                  setChangePasswordSuccess(false);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-[#002147] dark:text-white mb-2">
              Change Password
            </h3>

            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Enter your current password and choose a new one.
            </p>

            {changePasswordError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 text-sm rounded-lg font-medium">
                {changePasswordError}
              </div>
            )}

            {changePasswordSuccess ? (
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 text-green-600 text-sm rounded-lg font-medium text-center">
                ✓ Password changed successfully!
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setChangePasswordError('');
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
