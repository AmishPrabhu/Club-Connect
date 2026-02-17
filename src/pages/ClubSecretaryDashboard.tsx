import { useState, useEffect } from 'react';
import {
  Users, Edit, Calendar, MessageSquare, Settings,
  ChevronRight, Plus, Menu, X, Send, Trash2, Link,
  Image as ImageIcon, TrendingUp, CheckCircle, Clock,
  Instagram, Settings2
} from 'lucide-react';
import { Page } from '../types/page';
import { User, DBClub, DBPost, Attachment, ClubMessage } from '../types/auth';

import { getPosts, createPost, deletePost, createNotification, updatePost, checkEventTimeCollision, EventCollision, getEventRSVPs, createClubMessage, getClubMessages, updateEventBudget } from '../lib/dbService';
import { sendEventUpdateEmails, isEmailConfigured } from '../lib/emailService';
import CloudinaryUpload from '../components/CloudinaryUpload';
import AttachmentGallery from '../components/AttachmentGallery';
import MemberManager from '../components/MemberManager';
import LocationPickerModal from '../components/LocationPickerModal';
import ImageModal from '../components/ImageModal';
import ConfirmModal from '../components/ConfirmModal';
import ClubTaskManager from '../components/ClubTaskManager';
import { useNavigation } from '../context/NavigationContext';


// Notification Sender Component
function NotificationSender({ club }: { club: DBClub }) {
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
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
          <Send className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        Send Notifications
      </h3>

      <div className="glass-card p-6 md:p-8">
        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Send className="w-5 h-5 text-cyan-500" />
          Send New Notification
        </h4>

        {result && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${result.type === 'success'
            ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
            {result.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {result.text}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">
              Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-400 resize-none"
              placeholder="Your notification message..."
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
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
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const openUploadWidget = () => {
    if (typeof window === 'undefined' || !window.cloudinary) {
      setError('Upload widget not available. Please refresh the page.');
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary configuration missing. Please check environment variables.');
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
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
      setError('Please upload or enter an image URL');
      return;
    }

    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const { updateClubImage } = await import('../lib/dbService');
      const result = await updateClubImage(clubId, url);

      if (result.success) {
        onImageUpdated(url);
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
          src={previewUrl || currentImage || '/club-default.jpg'}
          alt="Club profile"
          className="w-full h-full object-cover rounded-lg border-2 border-slate-300 dark:border-slate-600"
          onError={(e) => { (e.target as HTMLImageElement).src = '/club-default.jpg'; }}
        />
        {(isUploading || isSaving) && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center">Image updated!</p>
      )}

      <button
        onClick={openUploadWidget}
        disabled={isUploading || isSaving}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Upload from Device'}
      </button>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        Supports JPG, PNG, GIF, WebP (max 5MB)
      </p>
    </div>
  );
}

// Message Sender Component
function MessageSender({ club, user }: { club: DBClub; user: User }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recipientGroup, setRecipientGroup] = useState<'members' | 'presidents'>('members');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pastMessages, setPastMessages] = useState<ClubMessage[]>([]);

  useEffect(() => {
    loadMessages();
  }, [club.id, recipientGroup]);

  const loadMessages = async () => {
    if (club.id) {
      const targetId = recipientGroup === 'members' ? club.id : 'GLOBAL_PRESIDENTS';
      const msgs = await getClubMessages(targetId);
      setPastMessages(msgs);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (!club.id) return;

    setIsSending(true);
    setResult(null);

    try {
      const targetId = recipientGroup === 'members' ? club.id : 'GLOBAL_PRESIDENTS';
      const targetClubName = recipientGroup === 'members' ? club.name : 'Global Presidents';

      const success = await createClubMessage(targetId, {
        clubId: targetId,
        clubName: targetClubName,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        title,
        body,
      });

      if (success) {
        setResult({ type: 'success', text: 'Message sent successfully!' });
        setTitle('');
        setBody('');
        loadMessages(); // Refresh list
      } else {
        setResult({ type: 'error', text: 'Failed to send message' });
      }
    } catch (error) {
      setResult({ type: 'error', text: 'Failed to send message' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Club Messages
          </h3>

          <div className="flex bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setRecipientGroup('members')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${recipientGroup === 'members'
                ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              Members
            </button>
            <button
              onClick={() => setRecipientGroup('presidents')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${recipientGroup === 'presidents'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              Presidents
            </button>
          </div>
        </div>

        <div className="glass-card p-6 md:p-8 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${recipientGroup === 'members' ? 'from-cyan-500 to-blue-500' : 'from-purple-500 to-pink-500'}`}></div>
          <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <MessageSquare className={`w-5 h-5 ${recipientGroup === 'members' ? 'text-cyan-500' : 'text-purple-500'}`} />
            Send New Message to {recipientGroup === 'members' ? 'Members' : 'All Presidents'}
          </h4>

          {result && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${result.type === 'success'
              ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
              {result.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {result.text}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Subject</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                placeholder="Message Subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Message Body</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-400 resize-none"
                placeholder="Write your message here..."
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isSending}
              className={`w-full text-white px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${recipientGroup === 'members'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20 hover:shadow-cyan-500/40'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20 hover:shadow-purple-500/40'
                }`}
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Broadcast Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
          {recipientGroup === 'members' ? 'Sent Messages History' : 'Global Presidents Chat History'}
        </h4>
        {pastMessages.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 italic">No messages sent yet.</p>
        ) : (
          <div className="space-y-4">
            {pastMessages.map((msg) => (
              <div key={msg.id} className="glass-card p-5 hover:border-cyan-500/30 transition-all hover:scale-[1.01] duration-300">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-slate-900 dark:text-white text-lg">{msg.title}</h5>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed mb-3">{msg.body}</p>
                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[10px]">
                    {msg.senderName.charAt(0)}
                  </div>
                  Sent by <span className="font-semibold text-slate-600 dark:text-slate-300">{msg.senderName}</span> ({msg.senderRole}) {recipientGroup === 'presidents' && msg.clubName !== 'Global Presidents' ? `from ${msg.clubName}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ClubSecretaryDashboardProps {
  onNavigate: (page: Page) => void;
  onNavigateToPost: (postId: string, returnTo?: { page: Page; params?: Record<string, string> }) => void;
  user?: User | null;
}

export default function ClubSecretaryDashboard({ onNavigate, onNavigateToPost, user }: ClubSecretaryDashboardProps) {
  const [club, setClub] = useState<DBClub | null>(null);
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Image Modal State
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openImageModal = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    setModalImage(imageUrl);
    setIsModalOpen(true);
    setIsModalOpen(true);
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'posts' | 'notifications' | 'events' | 'messages' | 'budget' | 'tasks'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('tab') as any) || 'overview';
  });

  const { navigateToManagement, selectedMembership } = useNavigation();

  // Sync tab to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'overview') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  // Use selectedMembership.clubId for multi-club support, fallback to user.clubId
  const activeClubId = selectedMembership?.clubId || user?.clubId;
  const activeRole = selectedMembership?.role?.toLowerCase() || user?.role;
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMobileTabOpen, setIsMobileTabOpen] = useState(false);

  const isReadOnly = activeRole === 'treasurer';

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'event' as 'event' | 'announcement',
    date: new Date().toISOString().split('T')[0],
    startHour: '',
    startMinute: '',
    startPeriod: 'AM' as 'AM' | 'PM',
    endHour: '',
    endMinute: '',
    endPeriod: 'PM' as 'AM' | 'PM',
    location: '',
    locationType: 'campus' as 'campus' | 'external',
    locationUrl: '',
    registrationStart: '',
    registrationStartTime: '',
    registrationEnd: '',
    registrationEndTime: '',
    coverImage: '',
    registrationLink: '',
    responseSpreadsheetUrl: '',
    eventWhatsappLink: '',
    relatedEventId: '',
    attachments: [] as Attachment[]
  });

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);

  // Collision warning state
  const [showCollisionWarning, setShowCollisionWarning] = useState(false);
  const [collisionEvents, setCollisionEvents] = useState<EventCollision[]>([]);

  // Location Picker Modal state
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Edit Registration Link state
  const [editingRegistrationLink, setEditingRegistrationLink] = useState<{ postId: string; currentLink: string } | null>(null);
  const [newRegistrationLink, setNewRegistrationLink] = useState('');

  // WhatsApp Link state
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);

  // Edit Event WhatsApp Link state
  const [editingEventWhatsapp, setEditingEventWhatsapp] = useState<{ postId: string; currentLink: string } | null>(null);
  const [newEventWhatsappLink, setNewEventWhatsappLink] = useState('');

  // Instagram Link state
  const [instagramLink, setInstagramLink] = useState('');
  const [isEditingInstagram, setIsEditingInstagram] = useState(false);
  const [instagramSaving, setInstagramSaving] = useState(false);

  // Description state
  const [description, setDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  // Full Form state
  const [fullForm, setFullForm] = useState('');
  const [isEditingFullForm, setIsEditingFullForm] = useState(false);
  const [fullFormSaving, setFullFormSaving] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    variant: 'confirm' | 'alert';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    variant: 'confirm',
  });



  // Ref to prevent duplicate member additions in React Strict Mode


  // Fetch club data from Firestore
  useEffect(() => {
    const fetchClubData = async () => {
      if (!activeClubId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch club document via API
        const { default: api } = await import('../lib/api');
        const response = await api.get(`/clubs/${activeClubId}`);
        const clubData = response.data;

        // Map _id to id if needed (our API client in dbService handles posts, but we are manually fetching here)
        // Also ensure date processing handles strings or Date objects as returned by API JSON
        const processedClubData = {
          ...clubData,
          id: clubData._id || clubData.id,
          createdAt: new Date(clubData.createdAt),
          updatedAt: new Date(clubData.updatedAt),
        } as DBClub;

        setClub(processedClubData);
        setWhatsappLink(processedClubData.whatsappLink || '');
        setInstagramLink(processedClubData.instagramLink || '');
        setDescription(processedClubData.description || '');
        setFullForm(processedClubData.fullForm || '');

        // Check if secretary is already a member, if not add them (only once)
        // Note: syncing members from backend route if available
        const { syncClubMemberCount } = await import('../lib/dbService');

        // ... member sync logic ...

        // Since we already fetched the club with member count, we might rely on that.
        // But to be safe and match original flow:
        await syncClubMemberCount(activeClubId); // This basically refetches clubs list but okay


        // Fetch posts for this club
        const allPosts = await getPosts();
        const clubPosts = allPosts.filter(p => p.clubId === activeClubId);
        setPosts(clubPosts);
      } catch (error) {
        console.error('Error fetching club data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubData();
  }, [activeClubId]);

  const handleCreatePost = async (forceCreate: boolean = false) => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (!club || !user) return;

    if (newPost.type === 'event' && !newPost.date) {
      setFormMessage({ type: 'error', text: 'Please specify a date for the event.' });
      return;
    }

    // Build time string from 12-hour format
    let timeString: string | undefined;
    if (newPost.startHour && newPost.startMinute) {
      timeString = `${newPost.startHour}:${newPost.startMinute} ${newPost.startPeriod}`;
      if (newPost.endHour && newPost.endMinute) {
        timeString += ` - ${newPost.endHour}:${newPost.endMinute} ${newPost.endPeriod}`;
      }
    }

    // Check for time collision if it's an event with a start time (unless forceCreate is true)
    if (!forceCreate && newPost.type === 'event' && newPost.date && newPost.startHour) {
      // Convert to 24h for collision check
      let startHour24 = parseInt(newPost.startHour);
      if (newPost.startPeriod === 'PM' && startHour24 !== 12) startHour24 += 12;
      if (newPost.startPeriod === 'AM' && startHour24 === 12) startHour24 = 0;
      const startTime24 = `${startHour24.toString().padStart(2, '0')}:${newPost.startMinute}`;

      const collisions = await checkEventTimeCollision(newPost.date, startTime24);
      if (collisions.length > 0) {
        setCollisionEvents(collisions);
        setShowCollisionWarning(true);
        return; // Stop here, wait for user to confirm or cancel
      }
    }

    const result = await createPost({
      title: newPost.title,
      content: newPost.content,
      type: newPost.type,
      ...(newPost.date ? { date: newPost.date } : {}),
      ...(timeString ? { time: timeString } : {}),
      ...(newPost.location ? { location: newPost.location } : {}),
      locationType: newPost.locationType,
      ...(newPost.locationUrl ? { locationUrl: newPost.locationUrl } : {}),
      ...(newPost.coverImage ? { coverImage: newPost.coverImage } : {}),
      ...(newPost.registrationStart ? { registrationStart: newPost.registrationStart } : {}),
      ...(newPost.registrationStartTime ? { registrationStartTime: newPost.registrationStartTime } : {}),
      ...(newPost.registrationEnd ? { registrationEnd: newPost.registrationEnd } : {}),
      ...(newPost.registrationEndTime ? { registrationEndTime: newPost.registrationEndTime } : {}),
      clubId: club.id!,
      clubName: club.name,
      authorId: user.id,
      authorName: user.name,
      status: 'published',
      registrationLink: newPost.registrationLink,
      responseSpreadsheetUrl: newPost.responseSpreadsheetUrl,
      eventWhatsappLink: newPost.eventWhatsappLink,
      ...(newPost.relatedEventId ? {
        relatedEventId: newPost.relatedEventId,
        relatedEventTitle: posts.find(p => p.id === newPost.relatedEventId)?.title || ''
      } : {}),
      ...(newPost.attachments.length > 0 ? { attachments: newPost.attachments } : {})
    });

    if (result.success) {
      const postId = result.postId;
      setFormMessage({ type: 'success', text: 'Post created successfully!' });
      setNewPost({
        title: '',
        content: '',
        type: 'announcement',
        date: new Date().toISOString().split('T')[0],
        startHour: '',
        startMinute: '',
        startPeriod: 'AM',
        endHour: '',
        endMinute: '',
        endPeriod: 'PM',
        location: '',
        locationType: 'campus',
        locationUrl: '',
        registrationStart: '',
        registrationStartTime: '',
        registrationEnd: '',
        registrationEndTime: '',
        coverImage: '',
        registrationLink: '',
        responseSpreadsheetUrl: '',
        eventWhatsappLink: '',
        relatedEventId: '',
        attachments: []
      });

      // Refresh posts
      const allPosts = await getPosts();
      setPosts(allPosts.filter(p => p.clubId === activeClubId));

      // Create a notification for the new post
      await createNotification({
        title: newPost.type === 'event' ? `New Event from ${club.name}` : `New Announcement from ${club.name}`,
        message: `${newPost.title} - ${newPost.content.substring(0, 100)}${newPost.content.length > 100 ? '...' : ''}`,
        type: newPost.type, // 'event' or 'announcement'
        read: false,
        clubId: club.id!,
        relatedId: postId!, // Non-null assertion safe as prompt success check passed
      });

      // Send email notifications to RSVPed attendees if this is an announcement linked to an event
      if (newPost.type === 'announcement' && newPost.relatedEventId && isEmailConfigured()) {
        try {
          const rsvps = await getEventRSVPs(newPost.relatedEventId);
          if (rsvps.length > 0) {
            const relatedEvent = posts.find(p => p.id === newPost.relatedEventId);
            const attendees = rsvps.map(rsvp => ({ name: rsvp.name, email: rsvp.email }));
            await sendEventUpdateEmails(
              attendees,
              relatedEvent?.title || 'Event',
              `New announcement: ${newPost.title}`,
              club.name,
              club.id!
            );
            console.log(`Sent ${rsvps.length} email notifications for event announcement`);
          }
        } catch (emailError) {
          console.error('Failed to send event announcement emails:', emailError);
          // Don't fail the post creation if emails fail
        }
      }

      setTimeout(() => {
        setIsCreatePostModalOpen(false);
        setFormMessage(null);
        setShowCollisionWarning(false);
        setCollisionEvents([]);
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to create post' });
    }
  };

  // Handle collision warning confirmation
  const handleConfirmCollision = () => {
    setShowCollisionWarning(false);
    handleCreatePost(true); // Force create, bypassing collision check
  };

  const handleCancelCollision = () => {
    setShowCollisionWarning(false);
    setCollisionEvents([]);
  };

  const handleDeletePost = (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      type: 'danger',
      variant: 'confirm',
      onConfirm: async () => {
        const success = await deletePost(postId);
        if (success && user?.clubId) {
          const allPosts = await getPosts();
          setPosts(allPosts.filter(p => p.clubId === activeClubId));
        }
      },
    });
  };

  const handleEditPhotos = (post: DBPost) => {
    setEditingPostId(post.id!);
    setEditAttachments(post.eventPhotos || []);  // Use eventPhotos for post-event uploads
  };

  const handleSavePhotos = async () => {
    if (!editingPostId) return;

    const success = await updatePost(editingPostId, { eventPhotos: editAttachments });  // Save to eventPhotos
    if (success && user?.clubId) {
      const allPosts = await getPosts();
      setPosts(allPosts.filter(p => p.clubId === activeClubId));
      setEditingPostId(null);
      setEditAttachments([]);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Define navigation tabs based on role
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'posts', label: 'Drafts & Posts', icon: Edit },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'budget', label: isReadOnly ? 'Budgets' : 'Budget', icon: Settings }
  ].filter(tab => {
    if (activeRole === 'treasurer') {
      return ['overview', 'members', 'budget', 'messages'].includes(tab.id);
    }
    return true;
  });

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
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
    <>
      <div className="min-h-screen pb-24 relative overflow-hidden">
        {/* Background Gradients */}
        {/* Background Gradients - REMOVED */}
        {/* <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div> */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="glass-card p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                {selectedMembership?.role || (user?.role === 'club-secretary' ? 'Secretary' : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Lead'))} Portal
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Manage members, posts, and budget for <span className="text-cyan-600 dark:text-cyan-400 font-bold">{club.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Navigation Tabs - Glass Pills Design */}
          <div className="mt-8 mb-6">
            {/* Mobile View - Dropdown/Menu Style or Stacked */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsMobileTabOpen(!isMobileTabOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Menu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isMobileTabOpen ? 'rotate-90' : ''}`} />
              </button>

              {isMobileTabOpen && (
                <div className="mt-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl absolute z-40 w-[calc(100%-2rem)] left-4 right-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col gap-1">
                    {navTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setIsMobileTabOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${isActive
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                          <Icon className="w-5 h-5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop View - Floating Glass Pills */}
            <div className="hidden md:flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl w-fit mx-auto">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 ${isActive
                      ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-card mt-6 p-4 sm:p-8 min-h-[500px] relative overflow-hidden mx-auto max-w-7xl">
          {/* Background decoration for the content area */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20"></div>

          <div className="p-4 sm:p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  Club Overview
                </h3>

                {/* Club Information Card */}
                <div className="glass-card p-4 md:p-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Club Name</span>
                      <span className="font-bold text-base text-slate-900 dark:text-white">{club.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</span>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                          {club.members}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Posts</span>
                      <span className="font-bold text-base text-slate-900 dark:text-white">{posts.length}</span>
                    </div>
                  </div>
                </div>

                {/* Club Profile Picture Card */}
                <div className="glass-card p-4 md:p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm md:text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    Club Profile Picture
                  </h4>
                  {isReadOnly ? (
                    <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
                      <img
                        src={club.image || '/club-default.jpg'}
                        alt="Club profile"
                        className="w-full h-full object-cover rounded-2xl border-2 border-white/20 shadow-lg"
                      />
                    </div>
                  ) : (
                    <ImageUploader clubId={club.id!} currentImage={club.image} onImageUpdated={(url) => setClub({ ...club, image: url })} />
                  )}
                </div>

                {/* WhatsApp Community Link Section */}
                {!isReadOnly && (
                  <div className="glass-card p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </div>
                        WhatsApp Community
                      </h4>
                      {!isEditingWhatsapp && club.whatsappLink && (
                        <a
                          href={club.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs md:text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                        >
                          Open
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {isEditingWhatsapp ? (
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={whatsappLink}
                          onChange={(e) => setWhatsappLink(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-white text-sm"
                          placeholder="https://chat.whatsapp.com/..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paste your WhatsApp group or community invite link.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditingWhatsapp(false);
                              setWhatsappLink(club.whatsappLink || '');
                            }}
                            className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-all text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!club.id) return;
                              setWhatsappSaving(true);
                              try {
                                const { updateClub } = await import('../lib/dbService');
                                await updateClub(club.id, { whatsappLink });
                                setClub({ ...club, whatsappLink });
                                setIsEditingWhatsapp(false);
                              } catch (error) {
                                console.error('Error saving WhatsApp link:', error);
                              } finally {
                                setWhatsappSaving(false);
                              }
                            }}
                            disabled={whatsappSaving}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                          >
                            {whatsappSaving ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {club.whatsappLink ? (
                          <div className="flex items-center justify-between p-2 md:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 truncate min-w-0">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-xs md:text-sm truncate">{club.whatsappLink}</span>
                            </div>
                            {!isReadOnly && (
                              <button
                                onClick={() => setIsEditingWhatsapp(true)}
                                className="text-xs md:text-sm text-green-600 dark:text-green-400 hover:underline flex-shrink-0 ml-2"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          !isReadOnly && (
                            <button
                              onClick={() => setIsEditingWhatsapp(true)}
                              className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-green-500 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add WhatsApp Link
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Instagram Link Section */}
                {!isReadOnly && (
                  <div className="glass-card p-4 md:p-6 mt-4 md:mt-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
                        <Instagram className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
                        Instagram Page
                      </h4>
                      {!isEditingInstagram && club.instagramLink && (
                        <a
                          href={club.instagramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs md:text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                        >
                          Open Link
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {isEditingInstagram ? (
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={instagramLink}
                          onChange={(e) => setInstagramLink(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 dark:text-white text-sm"
                          placeholder="https://instagram.com/..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditingInstagram(false);
                              setInstagramLink(club.instagramLink || '');
                            }}
                            className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-all text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!club.id) return;
                              setInstagramSaving(true);
                              try {
                                const { updateClub } = await import('../lib/dbService');
                                await updateClub(club.id, { instagramLink });
                                setClub({ ...club, instagramLink });
                                setIsEditingInstagram(false);
                              } catch (error) {
                                console.error('Error saving Instagram link:', error);
                              } finally {
                                setInstagramSaving(false);
                              }
                            }}
                            disabled={instagramSaving}
                            className="flex-1 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                          >
                            {instagramSaving ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              'Save Link'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {club.instagramLink ? (
                          <div className="flex items-center justify-between p-2 md:p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                            <div className="flex items-center gap-2 text-pink-700 dark:text-pink-400 truncate min-w-0">
                              <Instagram className="w-4 h-4 flex-shrink-0" />
                              <span className="text-xs md:text-sm truncate">{club.instagramLink}</span>
                            </div>
                            {!isReadOnly && (
                              <button
                                onClick={() => setIsEditingInstagram(true)}
                                className="text-xs md:text-sm text-pink-600 dark:text-pink-400 hover:underline flex-shrink-0 ml-2"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          !isReadOnly && (
                            <button
                              onClick={() => setIsEditingInstagram(true)}
                              className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-pink-500 hover:text-pink-600 dark:hover:border-pink-500 dark:hover:text-pink-400 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add Instagram Page
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}


                {/* Club Full Form Section */}
                <div className="glass-card p-4 md:p-6 mt-4 md:mt-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
                      <Edit className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                      Full Form
                    </h4>
                    {!isReadOnly && !isEditingDescription && ( // Reusing isEditingDescription logic for now, or should add new state? Better to add new state but let's see if I can do it inline with a new state variable or just reuse. Actually I should check if I missed defining a state variable. I'll need to inject state too.
                      <button
                        onClick={() => setIsEditingFullForm(true)}
                        className="text-xs md:text-sm text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0"
                      >
                        Edit Full Form
                      </button>
                    )}
                  </div>

                  {isEditingFullForm ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={fullForm}
                        onChange={(e) => setFullForm(e.target.value)}
                        className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white text-sm"
                        placeholder="e.g., Association of Computer Science Engineering Students"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditingFullForm(false);
                            setFullForm(club.fullForm || '');
                          }}
                          className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-all text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!club.id) return;
                            setFullFormSaving(true);
                            try {
                              const { updateClub } = await import('../lib/dbService');
                              const success = await updateClub(club.id, { fullForm });
                              if (success) {
                                setClub({ ...club, fullForm });
                                setIsEditingFullForm(false);
                              }
                            } catch (error) {
                              console.error('Error saving full form:', error);
                            } finally {
                              setFullFormSaving(false);
                            }
                          }}
                          disabled={fullFormSaving}
                          className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                          {fullFormSaving ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {club.fullForm || 'No full form added.'}
                    </p>
                  )}
                </div>

                {/* Club Description Section */}
                <div className="glass-card p-4 md:p-6 mt-4 md:mt-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
                      <Edit className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                      About Club
                    </h4>
                    {!isReadOnly && !isEditingDescription && (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                      >
                        Edit Description
                      </button>
                    )}
                  </div>

                  {isEditingDescription ? (
                    <div className="space-y-3">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                        placeholder="Write a brief description of your club..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditingDescription(false);
                            setDescription(club.description || '');
                          }}
                          className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-all text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!club.id) return;
                            setDescriptionSaving(true);
                            try {
                              const { updateClub } = await import('../lib/dbService');
                              const success = await updateClub(club.id, { description });
                              if (success) {
                                setClub({ ...club, description });
                                setIsEditingDescription(false);
                              }
                            } catch (error) {
                              console.error('Error saving description:', error);
                            } finally {
                              setDescriptionSaving(false);
                            }
                          }}
                          disabled={descriptionSaving}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                          {descriptionSaving ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {club.description || 'No description available.'}
                      </p>
                    </div>
                  )}
                </div>


                <div className="glass-card p-6 mt-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Upcoming Events</h4>
                  {posts.filter(p => p.type === 'event' && p.date && new Date(p.date!).getTime() >= new Date().getTime()).length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400">No upcoming events. Create your first event!</p>
                  ) : (
                    <div className="space-y-3">
                      {posts
                        .filter(p => p.type === 'event' && p.date && new Date(p.date!).getTime() >= new Date().getTime())
                        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
                        .slice(0, 3)
                        .map((post) => (
                          <div key={post.id} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">{post.title}</p>
                            <span className="text-xs text-slate-400">{new Date(post.date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {
              activeTab === 'members' && club && (
                <MemberManager
                  clubId={club.id!}
                  clubName={club.name}
                  isReadOnly={isReadOnly}
                  userRole={activeRole as any}
                  boardType={selectedMembership?.boardType}
                />
              )
            }

            {/* Events Tab - For Treasurer */}
            {
              activeTab === 'events' && !isReadOnly && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                        <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      Manage Events
                    </h3>
                    <button
                      onClick={() => setIsCreatePostModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Event
                    </button>
                  </div>

                  {posts.filter(p => p.type === 'event').length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">No events yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts
                        .filter(p => p.type === 'event')
                        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
                        .map((post) => {
                          const isPast = new Date(post.date!) < new Date();
                          return (
                            <div
                              key={post.id}
                              className="glass-card p-6 hover:border-cyan-500/30 transition-all group relative overflow-hidden"
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPast ? 'bg-slate-400' : 'bg-cyan-500'}`}></div>
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isPast
                                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                      : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
                                      }`}>
                                      {isPast ? 'Past Event' : 'Upcoming'}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {post.date ? new Date(post.date!).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      }) : 'No date'}
                                    </span>
                                    {post.time && (
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        • {post.time}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                    {post.title}
                                  </h4>
                                  {post.location && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-2">
                                      📍 {post.location}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                    {post.rsvps !== undefined && post.rsvps > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {post.rsvps} RSVPs
                                      </span>
                                    )}

                                  </div>
                                </div>
                                <button
                                  onClick={() => post.id && navigateToManagement(post.id, { page: 'clubSecretaryDashboard', params: { tab: 'events' } })}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 font-medium"
                                >
                                  <Settings2 className="w-4 h-4" />
                                  Manage
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )
            }



            {/* Budget Tab */}
            {
              activeTab === 'budget' && (
                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Settings className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    Event Budgets
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isReadOnly
                      ? 'Upload budget documents for each event. Your advisor can verify them.'
                      : 'View submitted budgets for club events (read-only access).'}
                  </p>

                  {posts.filter(p => p.type === 'event').length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">No events yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts
                        .filter(p => p.type === 'event')
                        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
                        .map((post) => {
                          const isPast = new Date(post.date!).getTime() < new Date().getTime();
                          return (
                            <div
                              key={post.id}
                              className="glass-card p-6 hover:border-cyan-500/30 transition-all group shadow-sm"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isPast
                                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                      : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
                                      }`}>
                                      {isPast ? 'Past Event' : 'Upcoming'}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {post.date ? new Date(post.date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{post.title}</h4>

                                  {/* Budget Status */}
                                  <div className="flex items-center gap-2 mt-3">
                                    {post.budgetImage ? (
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${post.budgetVerified
                                        ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {post.budgetVerified ? (
                                          <><CheckCircle className="w-3 h-3" /> Verified</>
                                        ) : (
                                          <><Clock className="w-3 h-3" /> Pending Verification</>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                        No Budget Uploaded
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Budget Actions */}
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                  {/* View Budget Button */}
                                  {post.budgetImage && (
                                    <a
                                      href={post.budgetImage}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                      View Budget
                                    </a>
                                  )}

                                  {/* Upload Button (Treasurer Only) */}
                                  {isReadOnly && (
                                    <button
                                      onClick={() => {
                                        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                                        if (!cloudName || !uploadPreset || !window.cloudinary) {
                                          setConfirmModal({
                                            isOpen: true,
                                            title: 'Upload Unavailable',
                                            message: 'The upload widget is not available. Please refresh the page and try again.',
                                            type: 'info',
                                            variant: 'alert',
                                          });
                                          return;
                                        }

                                        const widget = window.cloudinary.createUploadWidget({
                                          cloudName,
                                          uploadPreset,
                                          folder: `budgets/${post.clubId}/${post.id}`,
                                          sources: ['local', 'camera', 'url'],
                                          multiple: false,
                                          maxFiles: 1,
                                          resourceType: 'auto',
                                          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'pdf', 'webp'],
                                          maxFileSize: 10000000,
                                        }, async (_error: any, result: any) => {
                                          if (result.event === 'success') {
                                            const budgetUrl = result.info.secure_url;
                                            const success = await updateEventBudget(post.id!, budgetUrl);
                                            if (success) {
                                              // Refresh posts
                                              const allPosts = await getPosts();
                                              setPosts(allPosts.filter(p => p.clubId === user?.clubId));
                                            }
                                          }
                                        });
                                        widget.open();
                                      }}
                                      className="px-4 py-2 bg-[#002147] hover:bg-[#00152e] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      {post.budgetImage ? 'Update Budget' : 'Upload Budget'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )
            }

            {/* Messages Tab */}
            {
              activeTab === 'messages' && user && (
                <MessageSender club={club} user={user} />
              )
            }

            {/* Notifications Tab */}
            {
              activeTab === 'notifications' && (
                <NotificationSender club={club} />
              )
            }


            {/* Tasks Tab */}
            {
              activeTab === 'tasks' && club && (
                <ClubTaskManager
                  club={club}

                  posts={posts}
                />
              )
            }

            {/* Posts Tab */}
            {
              activeTab === 'posts' && !isReadOnly && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                        <Edit className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      Manage Posts
                    </h3>
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
                        <div key={post.id} className="glass-card p-6 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${post.type === 'event' ? 'bg-cyan-500' : 'bg-purple-500'}`}></div>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => post.id && onNavigateToPost(post.id, { page: 'clubSecretaryDashboard', params: { tab: 'posts' } })}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${post.type === 'event'
                                  ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  }`}>
                                  {post.type}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {post.date}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{post.title}</h4>

                              {post.rsvps !== undefined && post.rsvps > 0 && (
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 mb-2">
                                  <Users className="w-3 h-3" /> {post.rsvps} RSVPs
                                </p>
                              )}

                              {post.attachments && post.attachments.length > 0 && (
                                <div className="mt-3">
                                  <AttachmentGallery attachments={post.attachments} />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 flex-col">
                              {post.type === 'event' && post.date && new Date(post.date!).getTime() < new Date().getTime() && (
                                <button
                                  onClick={() => handleEditPhotos(post)}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                                  title="Add Event Photos"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  Add Photos ({post.eventPhotos?.length || 0})
                                </button>
                              )}
                              {post.type === 'event' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRegistrationLink({ postId: post.id!, currentLink: post.registrationLink || '' });
                                    setNewRegistrationLink(post.registrationLink || '');
                                  }}
                                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${post.registrationLink
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                                    }`}
                                  title={post.registrationLink ? 'Edit Registration Link' : 'Add Registration Link'}
                                >
                                  <Link className="w-4 h-4" />
                                  {post.registrationLink ? 'Edit Link' : 'Add Link'}
                                </button>
                              )}
                              {post.type === 'event' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEventWhatsapp({ postId: post.id!, currentLink: post.eventWhatsappLink || '' });
                                    setNewEventWhatsappLink(post.eventWhatsappLink || '');
                                  }}
                                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${post.eventWhatsappLink
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                                    }`}
                                  title={post.eventWhatsappLink ? 'Edit WhatsApp Group' : 'Add WhatsApp Group'}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  {post.eventWhatsappLink ? 'Edit Group' : 'Add Group'}
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
              )
            }


          </div>
        </div>

        {/* Create Post Modal */}
        {
          isCreatePostModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-end">
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

                <div className="grid grid-cols-1 gap-6">
                  <div className="w-full space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Title<span className='text-red-500'>*</span>
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
                        Description<span className='text-red-500'>*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Type<span className='text-red-500'>*</span>
                      </label>
                      <select
                        value={newPost.type}
                        onChange={(e) => setNewPost({ ...newPost, type: e.target.value as 'event' | 'announcement' })}
                        defaultValue="Event"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="event">Event</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {newPost.type === 'event' ? 'Event Date' : 'Date '}<span className='text-red-500'>*</span>
                      </label>
                      <input
                        type="date"
                        value={newPost.date}
                        onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Related Event - Only for Announcements */}
                    {newPost.type === 'announcement' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Related to Event (Optional)
                        </label>
                        <select
                          value={newPost.relatedEventId}
                          onChange={(e) => {
                            setNewPost({
                              ...newPost,
                              relatedEventId: e.target.value
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No related event</option>
                          {posts
                            .filter(p => p.type === 'event' && p.date && new Date(p.date!).getTime() >= new Date().getTime())
                            .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
                            .map(event => (
                              <option key={event.id} value={event.id}>
                                {event.title} ({new Date(event.date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                              </option>
                            ))
                          }
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Link this announcement to an upcoming event
                        </p>
                      </div>
                    )}

                    {/* Registration Period - Only for Events */}
                    {newPost.type === 'event' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                          📅 Registration Period
                        </label>

                        {/* Registration Opens */}
                        <div className="mb-4">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">Registration Opens</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={newPost.registrationStart}
                              onChange={(e) => setNewPost({ ...newPost, registrationStart: e.target.value })}
                              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="time"
                              value={newPost.registrationStartTime}
                              onChange={(e) => setNewPost({ ...newPost, registrationStartTime: e.target.value })}
                              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Registration Closes */}
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">Registration Closes</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={newPost.registrationEnd}
                              onChange={(e) => setNewPost({ ...newPost, registrationEnd: e.target.value })}
                              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="time"
                              value={newPost.registrationEndTime}
                              onChange={(e) => setNewPost({ ...newPost, registrationEndTime: e.target.value })}
                              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                          Set when registration opens and closes for this event
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Time
                      </label>

                      {/* Start Time Row */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-12">From:</span>
                        <select
                          value={newPost.startHour}
                          onChange={(e) => setNewPost({ ...newPost, startHour: e.target.value })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">--</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="text-slate-500">:</span>
                        <select
                          value={newPost.startMinute}
                          onChange={(e) => setNewPost({ ...newPost, startMinute: e.target.value })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">--</option>
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                        <select
                          value={newPost.startPeriod}
                          onChange={(e) => setNewPost({ ...newPost, startPeriod: e.target.value as 'AM' | 'PM' })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>

                      {/* End Time Row */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-12">To:</span>
                        <select
                          value={newPost.endHour}
                          onChange={(e) => setNewPost({ ...newPost, endHour: e.target.value })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">--</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="text-slate-500">:</span>
                        <select
                          value={newPost.endMinute}
                          onChange={(e) => setNewPost({ ...newPost, endMinute: e.target.value })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">--</option>
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                        <select
                          value={newPost.endPeriod}
                          onChange={(e) => setNewPost({ ...newPost, endPeriod: e.target.value as 'AM' | 'PM' })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Leave empty if no specific time
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Location
                      </label>

                      {/* Location Type Toggle */}
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="locationType"
                            checked={newPost.locationType === 'campus'}
                            onChange={() => setNewPost({ ...newPost, locationType: 'campus', locationUrl: '' })}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">In Campus</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="locationType"
                            checked={newPost.locationType === 'external'}
                            onChange={() => setNewPost({ ...newPost, locationType: 'external' })}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Outside Campus</span>
                        </label>
                      </div>

                      {/* In-Campus: Simple text input */}
                      {newPost.locationType === 'campus' && (
                        <input
                          type="text"
                          value={newPost.location}
                          onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Main Auditorium, Room 101, Campus Ground"
                        />
                      )}

                      {/* Outside Campus: Interactive Map Picker */}
                      {newPost.locationType === 'external' && (
                        <div className="space-y-3">
                          {/* Location Search Input */}
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              type="text"
                              value={newPost.location}
                              onChange={(e) => {
                                const location = e.target.value;
                                setNewPost({
                                  ...newPost,
                                  location,
                                  // Auto-generate Google Maps URL from location name
                                  locationUrl: location ? `https://www.google.com/maps/search/${encodeURIComponent(location)}` : ''
                                });
                              }}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Search location (e.g., Central Park, NYC)"
                            />
                          </div>

                          {/* Interactive Map */}
                          <div className="rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600">
                            {/* Map Header */}
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {newPost.location ? `Selected: ${newPost.location}` : 'Click on map to select location'}
                                </span>
                              </div>
                              {newPost.location && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(newPost.location)}`;
                                    window.open(searchUrl, '_blank');
                                  }}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  Open in Google Maps
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Embedded Map - Clickable */}
                            <div
                              className="relative cursor-pointer group"
                              onClick={() => setShowLocationPicker(true)}
                            >
                              <iframe
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(newPost.location || 'India')}&z=12&output=embed`}
                                className="w-full h-64 pointer-events-none"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                              {/* Overlay with click prompt */}
                              <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/40">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                  </svg>
                                  <span className="font-medium">Click to search & select location</span>
                                </div>
                              </div>
                            </div>

                            {/* Map Footer with instructions */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                💡 <strong>Tip:</strong> Click on the map to open the location search window. You can search for places and confirm the exact location to add to your event.
                              </p>
                            </div>
                          </div>

                          {/* Optional: Paste custom Google Maps URL */}
                          <details className="group">
                            <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                              ⚙️ Advanced: Paste a custom Google Maps link
                            </summary>
                            <div className="mt-2">
                              <input
                                type="url"
                                value={newPost.locationUrl}
                                onChange={(e) => setNewPost({ ...newPost, locationUrl: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Paste custom Google Maps URL (optional)"
                              />
                            </div>
                          </details>

                          {/* Selected Location Confirmation */}
                          {newPost.location && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                Location selected: {newPost.location}
                              </span>
                            </div>
                          )}
                        </div>


                      )}


                    </div>

                    {/* Registration Link - For all Events */}
                    {newPost.type === 'event' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Registration Link
                        </label>
                        <input
                          type="url"
                          value={newPost.registrationLink}
                          onChange={(e) => setNewPost({ ...newPost, registrationLink: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          placeholder="https://forms.gle/..."
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Direct link to registration form or external event page.
                          </p>
                          <a
                            href="https://docs.google.com/forms/d/19TusTlc1nhbdLPidDZ0goDn4tRqDZOs2ZaDozTlz9Wc/copy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Google Form
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Response Spreadsheet URL - For all Events */}
                    {newPost.type === 'event' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Response Spreadsheet URL
                        </label>
                        <input
                          type="url"
                          value={newPost.responseSpreadsheetUrl}
                          onChange={(e) => setNewPost({ ...newPost, responseSpreadsheetUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Paste the Google Sheets URL that collects your form responses for quick access.
                        </p>
                      </div>
                    )}

                    {/* Event WhatsApp Group Link - For all Events */}
                    {newPost.type === 'event' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Event WhatsApp Group
                        </label>
                        <input
                          type="url"
                          value={newPost.eventWhatsappLink}
                          onChange={(e) => setNewPost({ ...newPost, eventWhatsappLink: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-white"
                          placeholder="https://chat.whatsapp.com/..."
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          WhatsApp group link for event participants. You can add this later too.
                        </p>
                      </div>
                    )}

                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Cover Image (Required for new design)
                      </label>
                      <div className="mb-4">
                        {newPost.coverImage && (
                          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3 border border-slate-200/60 dark:border-slate-700/40 group cursor-zoom-in"
                            onClick={(e) => openImageModal(e, newPost.coverImage)}>
                            <img
                              src={newPost.coverImage}
                              alt="Cover Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300 pointer-events-none">
                              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded shadow-sm">Click to expand</span>
                            </div>

                            <button
                              onClick={() => setNewPost({ ...newPost, coverImage: '' })}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                              title="Remove cover image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <CloudinaryUpload
                          clubName={club.name}
                          existingAttachments={[]}
                          onUploadComplete={(attachments) => {
                            // We only take the first image if multiple selected or just the one
                            if (attachments.length > 0) {
                              setNewPost({ ...newPost, coverImage: attachments[0].url });
                            }
                          }}
                          maxFiles={1}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Upload a high-quality cover image for the home page card. Landscape orientation works best.
                        </p>
                      </div>
                    </div>

                    {/* File Upload (Description Images) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Description Images
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


                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setIsCreatePostModalOpen(false); setFormMessage(null); }}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreatePost()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Create Post
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Collision Warning Modal */}
        {
          showCollisionWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Time Collision Warning</h3>
                </div>

                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  There {collisionEvents.length === 1 ? 'is' : 'are'} already {collisionEvents.length} event{collisionEvents.length === 1 ? '' : 's'} scheduled around the same time:
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                  {collisionEvents.map((event, index) => (
                    <div key={index} className="flex flex-col mb-2 last:mb-0">
                      <span className="font-semibold text-blue-800 dark:text-blue-300">{event.title}</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">{event.time} - {event.clubName}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Do you still want to create this event?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCollision}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleConfirmCollision}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                  >
                    Create Anyway
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Edit Photos Modal */}
        {
          editingPostId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 w-full max-w-lg">
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
          )
        }

        {/* Edit Registration Link Modal */}
        {
          editingRegistrationLink && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingRegistrationLink.currentLink ? 'Edit Registration Link' : 'Add Registration Link'}
                  </h3>
                  <button
                    onClick={() => { setEditingRegistrationLink(null); setNewRegistrationLink(''); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Registration Link
                    </label>
                    <input
                      type="url"
                      value={newRegistrationLink}
                      onChange={(e) => setNewRegistrationLink(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      placeholder="https://forms.gle/..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Paste a link to your registration form.
                    </p>
                    <a
                      href="https://docs.google.com/forms/create"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Create Google Form
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setEditingRegistrationLink(null); setNewRegistrationLink(''); }}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (editingRegistrationLink) {
                        const success = await updatePost(editingRegistrationLink.postId, { registrationLink: newRegistrationLink });
                        if (success) {
                          // Update local state
                          setPosts(posts.map(p =>
                            p.id === editingRegistrationLink.postId
                              ? { ...p, registrationLink: newRegistrationLink }
                              : p
                          ));
                          setEditingRegistrationLink(null);
                          setNewRegistrationLink('');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Save Link
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Edit Event WhatsApp Link Modal */}
        {
          editingEventWhatsapp && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {editingEventWhatsapp.currentLink ? 'Edit WhatsApp Group' : 'Add WhatsApp Group'}
                  </h3>
                  <button
                    onClick={() => { setEditingEventWhatsapp(null); setNewEventWhatsappLink(''); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      WhatsApp Group Link
                    </label>
                    <input
                      type="url"
                      value={newEventWhatsappLink}
                      onChange={(e) => setNewEventWhatsappLink(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-white"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste your WhatsApp group invite link for event participants.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setEditingEventWhatsapp(null); setNewEventWhatsappLink(''); }}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (editingEventWhatsapp) {
                        const success = await updatePost(editingEventWhatsapp.postId, { eventWhatsappLink: newEventWhatsappLink });
                        if (success) {
                          // Update local state
                          setPosts(posts.map(p =>
                            p.id === editingEventWhatsapp.postId
                              ? { ...p, eventWhatsappLink: newEventWhatsappLink }
                              : p
                          ));
                          setEditingEventWhatsapp(null);
                          setNewEventWhatsappLink('');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Save Link
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Location Picker Modal */}
        <LocationPickerModal
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          initialLocation={newPost.location}
          onLocationSelect={(location, locationUrl) => {
            setNewPost({ ...newPost, location, locationUrl });
            setShowLocationPicker(false);
          }}
        />
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageUrl={modalImage || ''}
        />
        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          variant={confirmModal.variant}
        />
      </div>
    </>
  );
}
