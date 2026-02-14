import { useState, useEffect } from 'react';
import { Users, Calendar, Trash2, Edit, Search, TrendingUp, Bell, Plus, UserPlus, X, Send, Image as ImageIcon, Menu, Settings2, Clock, ChevronRight } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { DBClub, DBPost, DBNotification, ClubMember, User } from '../types/auth';
import ConfirmModal from '../components/ConfirmModal';
import {
  getClubs,
  createClub,
  updateClub,
  deleteClub,
  createClubSecretary,
  createClubPresident,
  createClubTreasurer,
  createClubAdvisor,
  getTeachers, // NEW
  removeClubOfficer,
  getClubMembers,
  removeClubMember,

  getPosts,
  deletePost,
  getNotifications,
  createNotification,
  deleteNotification,
  assignTeacherRole,
  removeTeacher,
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
        folder: `club_profiles / ${clubId} `,
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
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
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

const DEPARTMENTS = [
  'Computer Science(CSE)',
  'Electronics',
  'Mechanical',
  'Civil',
  'Artificial Intelligence and Machine Learning(AIML)',
  'Information Technology(IT)'
];


export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'posts' | 'notifications' | 'teachers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [clubs, setClubs] = useState<DBClub[]>([]);
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [clubMembers, setClubMembers] = useState<Record<string, ClubMember[]>>({});
  const [teachers, setTeachers] = useState<User[]>([]); // NEW
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
  const [showEditClubModal, setShowEditClubModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<DBClub | null>(null);
  const [isMobileTabOpen, setIsMobileTabOpen] = useState(false);

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

  // Form states
  const [newClub, setNewClub] = useState({
    name: '',
    description: '',
    fullForm: '',
    category: 'technical' as typeof CLUB_CATEGORIES[number],
    departments: [] as string[],
    icon: '🎯',
    image: '/club-default.jpg',
  });

  const [newSecretary, setNewSecretary] = useState({
    email: '',
    name: '',
  });

  // Generic state for President/Treasurer/Advisor creation
  const [newRoleUser, setNewRoleUser] = useState({
    email: '',
    name: '',
  });

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as const,
  });

  const [newTeacher, setNewTeacher] = useState({
    email: '',
    name: '',
  });

  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inline club name editing states
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editingClubName, setEditingClubName] = useState('');
  const [savingClubName, setSavingClubName] = useState(false);

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

        // Load members for each club
        const membersData: Record<string, ClubMember[]> = {};
        for (const club of clubsData) {
          if (club.id) {
            const members = await getClubMembers(club.id);
            membersData[club.id] = members;
          }
        }
        setClubMembers(membersData);
      }
      if (activeTab === 'posts' || activeTab === 'overview') {
        const postsData = await getPosts();
        setPosts(postsData);
      }
      if (activeTab === 'notifications' || activeTab === 'overview') {
        const notificationsData = await getNotifications();
        setNotifications(notificationsData);
      }
      if (activeTab === 'teachers') {
        const teachersData = await getTeachers();
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get officers by role
  const getOfficersByRole = (clubId: string, role: string): ClubMember[] => {
    const members = clubMembers[clubId] || [];
    return members.filter(m =>
      m.role.toLowerCase().trim() === role.toLowerCase().trim()
    );
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
      setNewClub({ name: '', description: '', fullForm: '', category: 'technical', departments: [], icon: '🎯', image: '/club-default.jpg' });
      setTimeout(() => {
        setShowCreateClubModal(false);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: 'Failed to create club' });
    }
  };

  const handleUpdateClubDetails = async () => {
    if (!selectedClub) return;

    const result = await updateClub(selectedClub.id!, {
      name: newClub.name,
      description: newClub.description,
      category: newClub.category,
      departments: newClub.departments,
      fullForm: newClub.fullForm
    });

    if (result) {
      setFormMessage({ type: 'success', text: 'Club details updated!' });
      setTimeout(() => {
        setShowEditClubModal(false);
        setSelectedClub(null);
        setFormMessage(null);
        loadData();
      }, 1500);
    } else {
      setFormMessage({ type: 'error', text: 'Failed to update club details' });
    }
  };

  const openEditClubModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewClub({
      name: club.name,
      description: club.description,
      fullForm: club.fullForm || '',
      category: club.category,
      departments: club.departments || [],
      icon: club.icon || '🎯',
      image: club.image || '/club-default.jpg',
    });
    setShowEditClubModal(true);
  };

  const handleDeleteClub = (clubId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Club',
      message: 'Are you sure you want to delete this club? This action cannot be undone.',
      type: 'danger',
      variant: 'confirm',
      onConfirm: async () => {
        const success = await deleteClub(clubId);
        if (success) {
          loadData();
        } else {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete club. Please try again.',
            type: 'info',
            variant: 'alert',
          });
        }
      },
    });
  };

  // Secretary handlers
  const handleCreateSecretary = async () => {
    setFormMessage(null);
    if (!newSecretary.email || !newSecretary.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const result = await createClubSecretary(
      newSecretary.email,
      newSecretary.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Secretary created for ${selectedClub.name}!` });
      setFormMessage({ type: 'success', text: `Secretary created for ${selectedClub.name}!` });
      setNewSecretary({ email: '', name: '' });
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
    if (!newRoleUser.email || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const result = await createClubPresident(
      newRoleUser.email,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `President created for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', name: '' });
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
    if (!newRoleUser.email || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const result = await createClubTreasurer(
      newRoleUser.email,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Treasurer created for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', name: '' });
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
  const handleDeletePost = (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This will remove it permanently.',
      type: 'danger',
      variant: 'confirm',
      onConfirm: async () => {
        const success = await deletePost(postId);
        if (success) {
          loadData();
        } else {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete post. Please try again.',
            type: 'info',
            variant: 'alert',
          });
        }
      },
    });
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
    setNewSecretary({ email: '', name: '' });
    setShowCreateSecretaryModal(true);
  };

  const openPresidentModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({ email: '', name: '' });
    setShowCreatePresidentModal(true);
  };

  const openTreasurerModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({ email: '', name: '' });
    setShowCreateTreasurerModal(true);
  };

  const openAdvisorModal = (club: DBClub) => {
    setSelectedClub(club);
    setNewRoleUser({ email: '', name: '' });
    setShowCreateAdvisorModal(true);
  };

  // Advisor handlers
  const handleCreateAdvisor = async () => {
    setFormMessage(null);
    if (!newRoleUser.email || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const result = await createClubAdvisor(
      newRoleUser.email,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Advisor created for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', name: '' });
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
      name: club.advisorName || ''
    });
    setShowEditAdvisorModal(true);
  };

  // Replace advisor (delete old account and create new one)
  const handleReplaceAdvisor = async () => {
    setFormMessage(null);
    if (!newRoleUser.email || !newRoleUser.name || !selectedClub) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    // So we just create a new advisor account and update the club reference
    const result = await createClubAdvisor(
      newRoleUser.email,
      newRoleUser.name,
      selectedClub.id!,
      selectedClub.name
    );

    if (result.success) {
      setFormMessage({ type: 'success', text: `Advisor updated for ${selectedClub.name}!` });
      setNewRoleUser({ email: '', name: '' });
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

  const handleRemoveOfficer = async (clubId: string, role: 'secretary' | 'president' | 'treasurer' | 'advisor') => {
    setConfirmModal({
      isOpen: true,
      title: `Remove ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      message: `Are you sure you want to remove the ${role} from this club? This action cannot be undone.`,
      type: 'danger',
      variant: 'confirm',
      onConfirm: async () => {
        const result = await removeClubOfficer(clubId, role);
        if (result.success) {
          setFormMessage({ type: 'success', text: `${role.charAt(0).toUpperCase() + role.slice(1)} removed successfully` });
          loadData();
        } else {
          setFormMessage({ type: 'error', text: result.error || `Failed to remove ${role}` });
        }
      },
    });
  };

  const handleRemoveMember = async (clubId: string, memberId: string, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Officer',
      message: `Are you sure you want to remove ${memberName} from their officer role? This action cannot be undone.`,
      type: 'danger',
      variant: 'confirm',
      onConfirm: async () => {
        const success = await removeClubMember(clubId, memberId);
        if (success) {
          setFormMessage({ type: 'success', text: 'Officer removed successfully' });
          loadData();
        } else {
          setFormMessage({ type: 'error', text: 'Failed to remove officer' });
        }
      },
    });
  };

  const handleAssignTeacher = async () => {
    if (!newTeacher.email || !newTeacher.name) {
      setFormMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    try {
      const result = await assignTeacherRole(newTeacher.email, newTeacher.name);
      if (result.success) {
        setFormMessage({ type: 'success', text: result.isNewUser ? 'Teacher invitation sent successfully!' : 'User role updated to teacher!' });
        setNewTeacher({ email: '', name: '' });
        setTimeout(() => {
          setShowAddTeacherModal(false);
          setFormMessage(null);
          loadData(); // Refresh list
        }, 2000);
      } else {
        setFormMessage({ type: 'error', text: result.error || 'Failed to assign teacher role' });
      }
    } catch (error) {
      setFormMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to remove this teacher? Their teacher privileges will be revoked.')) {
      try {
        const success = await removeTeacher(teacherId);
        if (success) {
          loadData(); // Refresh list
        } else {
          alert('Failed to remove teacher');
        }
      } catch (error) {
        console.error('Error removing teacher:', error);
        alert('Error removing teacher');
      }
    }
  };

  // Inline club name editing handlers
  const handleEditClubName = (club: DBClub) => {
    setEditingClubId(club.id!);
    setEditingClubName(club.name);
  };

  const handleSaveClubName = async (clubId: string) => {
    if (!editingClubName.trim()) return;

    setSavingClubName(true);
    try {
      const success = await updateClub(clubId, { name: editingClubName });
      if (success) {
        // Update local state
        setClubs(clubs.map(c => c.id === clubId ? { ...c, name: editingClubName } : c));
        setEditingClubId(null);
        setEditingClubName('');
      }
    } catch (error) {
      console.error('Error saving club name:', error);
    } finally {
      setSavingClubName(false);
    }
  };

  const handleCancelEditClubName = () => {
    setEditingClubId(null);
    setEditingClubName('');
  };

  // Teacher handlers





  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen pb-24 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="glass-card p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                Administrative Control Center
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Manage clubs, events, and system settings • <span className="text-cyan-600 dark:text-cyan-400 font-bold">Welcome, {user?.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Stats Cards - 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card 1: Total Clubs */}
            <div className="glass-card p-4 hover:border-cyan-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                  <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{clubs.length}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Clubs</p>
                </div>
              </div>
            </div>

            {/* Card 2: Upcoming Events */}
            <div className="glass-card p-4 hover:border-amber-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                  <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{posts.filter(p => p.type === 'event').length}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming</p>
                </div>
              </div>
            </div>

            {/* Card 3: Total Posts */}
            <div className="glass-card p-4 hover:border-purple-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{posts.length}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posts</p>
                </div>
              </div>
            </div>

            {/* Card 4: Alerts */}
            <div className="glass-card p-4 hover:border-red-500/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                  <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{notifications.filter(n => !n.read).length}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'clubs', label: 'Manage Clubs', icon: Users },
                    { id: 'posts', label: 'Manage Posts', icon: Edit },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'teachers', label: 'Teachers', icon: UserPlus }
                  ].map((tab) => {
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
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'clubs', label: 'Manage Clubs', icon: Users },
              { id: 'posts', label: 'Manage Posts', icon: Edit },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'teachers', label: 'Teachers', icon: UserPlus }
            ].map((tab) => {
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



        <div className="glass-card mt-6 p-4 sm:p-8 min-h-[500px] relative overflow-hidden">
          {/* Background decoration for the content area */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20"></div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></span>
                      Recent Campus Activity
                    </h3>
                    <button onClick={() => setActiveTab('posts')} className="group text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors uppercase tracking-wide flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/10 px-4 py-2 rounded-xl">
                      View All Activity <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {posts.length === 0 && clubs.length === 0 ? (
                    <div className="glass-card text-center py-16 px-8 border-dashed border-2 border-slate-300 dark:border-slate-700">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Plus className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No activity yet. Get started by creating a club!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.slice(0, 5).map((post) => (
                        <div key={post.id} className="glass-card p-4 hover:border-cyan-500/30 transition-all group flex gap-4 items-center relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${post.type === 'event' ? 'bg-cyan-500' : 'bg-purple-500'}`}></div>
                          <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${post.type === 'event' ? 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                            {post.type === 'event' ? <Calendar className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${post.type === 'event' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>
                                {post.type}
                              </span>
                              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {post.date}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{post.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              Posted by <span className="font-semibold text-slate-700 dark:text-slate-300">{post.clubName}</span>
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clubs Tab */}
              {activeTab === 'clubs' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-4 glass-card p-2 rounded-2xl">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search clubs by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 font-medium"
                      />
                    </div>
                    <button
                      onClick={() => setShowCreateClubModal(true)}
                      className="w-full md:w-auto bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5" />
                      New Club
                    </button>
                  </div>

                  {filteredClubs.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <Users className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">No clubs found</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2">Start by registering a new student organization.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredClubs.map((club) => (
                        <div key={club.id} className="group glass-card relative overflow-hidden flex flex-col h-full transition-all duration-300 hover:translate-y-[-4px]">
                          {/* Top Gradient Line */}
                          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          <div className="p-6 flex-grow flex flex-col">
                            {/* Header: Icon + Edit Name */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-white/10 bg-slate-800/50 shadow-inner backdrop-blur-sm group-hover:border-cyan-500/30 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 overflow-hidden">
                                {club.image ? (
                                  <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                                ) : (
                                  club.icon
                                )}
                              </div>

                              {/* Admin Actions Dropdown (or inline buttons for quick access) */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setSelectedClub(club); setShowImageUploadModal(true); }}
                                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                  title="Update Club Image"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditClubModal(club)}
                                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                                  title="Edit Club Details"
                                >
                                  <Settings2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClub(club.id!)}
                                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Delete Club"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Club Name with Inline Editing */}
                            {editingClubId === club.id ? (
                              <div className="mb-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                  type="text"
                                  value={editingClubName}
                                  onChange={(e) => setEditingClubName(e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  placeholder="Enter club name..."
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleCancelEditClubName}
                                    className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveClubName(club.id!)}
                                    disabled={savingClubName || !editingClubName.trim()}
                                    className="flex-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                  >
                                    {savingClubName ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group/name mb-2">
                                <h4 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                  {club.name}
                                  <button
                                    onClick={() => handleEditClubName(club)}
                                    className="opacity-0 group-hover/name:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all text-slate-400 hover:text-cyan-500"
                                    title="Edit Name"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </h4>
                              </div>
                            )}

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-100/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
                                {club.category}
                              </span>
                              {club.departments?.slice(0, 1).map(dept => (
                                <span key={dept} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
                                  {dept.match(/\(([^)]+)\)/)?.[1] || dept.slice(0, 3)}
                                </span>
                              ))}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">
                              {club.description}
                            </p>

                            {/* Management Section - Glass Container */}
                            <div className="mt-auto bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 border border-slate-100 dark:border-white/5 backdrop-blur-sm">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Club Leadership</p>

                              {/* Secretary Row */}
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/50 dark:border-white/5 last:border-0 last:mb-0 last:pb-0">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Secretary</span>
                                {getOfficersByRole(club.id!, 'secretary').length > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium truncate max-w-[100px]">
                                      {getOfficersByRole(club.id!, 'secretary')[0].email.split('@')[0]}
                                    </span>
                                    <button onClick={() => handleRemoveMember(club.id!, getOfficersByRole(club.id!, 'secretary')[0].id!, getOfficersByRole(club.id!, 'secretary')[0].name)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : club.secretaryEmail ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 truncate max-w-[100px]">{club.secretaryEmail.split('@')[0]}</span>
                                    <button onClick={() => handleRemoveOfficer(club.id!, 'secretary')} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => openSecretaryModal(club)} className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                )}
                              </div>

                              {/* President Row */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">President</span>
                                {getOfficersByRole(club.id!, 'president').length > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium truncate max-w-[100px]">
                                      {getOfficersByRole(club.id!, 'president')[0].email.split('@')[0]}
                                    </span>
                                    <button onClick={() => handleRemoveMember(club.id!, getOfficersByRole(club.id!, 'president')[0].id!, getOfficersByRole(club.id!, 'president')[0].name)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : club.presidentEmail ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 truncate max-w-[100px]">{club.presidentEmail.split('@')[0]}</span>
                                    <button onClick={() => handleRemoveOfficer(club.id!, 'president')} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => openPresidentModal(club)} className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                )}
                              </div>

                              {/* Treasurer Row */}
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/50 dark:border-white/5 last:border-0 last:mb-0 last:pb-0">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Treasurer</span>
                                {getOfficersByRole(club.id!, 'treasurer').length > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate max-w-[100px]">
                                      {getOfficersByRole(club.id!, 'treasurer')[0].email.split('@')[0]}
                                    </span>
                                    <button onClick={() => handleRemoveMember(club.id!, getOfficersByRole(club.id!, 'treasurer')[0].id!, getOfficersByRole(club.id!, 'treasurer')[0].name)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : club.treasurerEmail ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 truncate max-w-[100px]">{club.treasurerEmail.split('@')[0]}</span>
                                    <button onClick={() => handleRemoveOfficer(club.id!, 'treasurer')} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => openTreasurerModal(club)} className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                )}
                              </div>

                              {/* Advisor Row */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Advisor</span>
                                {club.advisorEmail ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate max-w-[100px]">
                                      {club.advisorEmail.split('@')[0]}
                                    </span>
                                    <div className="flex gap-1">
                                      <button onClick={() => openEditAdvisorModal(club)} className="text-slate-400 hover:text-cyan-500"><Edit className="w-3 h-3" /></button>
                                      <button onClick={() => handleRemoveOfficer(club.id!, 'advisor')} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => openAdvisorModal(club)} className="text-[#002147] dark:text-blue-400 hover:underline font-medium">+ Assign</button>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* Posts Tab */}
              {
                activeTab === 'posts' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-cyan-500/30">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Posts & Announcements</h3>
                    </div>

                    {posts.length === 0 ? (
                      <div className="glass-card text-center py-20">
                        <Edit className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No posts available.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div key={post.id} className="glass-card p-4 hover:border-cyan-500/30 transition-all group flex gap-4 items-center relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${post.type === 'event' ? 'bg-cyan-500' : 'bg-purple-500'}`}></div>
                            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${post.type === 'event' ? 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                              {post.type === 'event' ? <Calendar className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${post.type === 'event' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>
                                  {post.type}
                                </span>
                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {post.date}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{post.title}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                Posted by <span className="font-semibold text-slate-700 dark:text-slate-300">{post.clubName}</span>
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeletePost(post.id!)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              title="Delete Post"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              {/* Notifications Tab */}
              {
                activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">System Broadcasts</h3>
                      <button
                        onClick={() => setShowNotificationModal(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        NEW BROADCAST
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="glass-card text-center py-20">
                        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No previous broadcasts.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-5 rounded-xl border-l-4 ${notification.read
                              ? 'glass-card border-slate-300 dark:border-slate-700'
                              : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-500'
                              } `}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{notification.type || 'SYSTEM'}</span>
                                  <span className="text-xs text-slate-400">• {new Date(notification.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{notification.title}</h4>
                                <p className="text-slate-600 dark:text-slate-300">{notification.message}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteNotification(notification.id!)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              {
                activeTab === 'teachers' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white border-l-4 border-emerald-500 pl-3">
                        Teacher Management
                      </h3>
                      <button
                        onClick={() => setShowAddTeacherModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/20"
                      >
                        <UserPlus className="w-5 h-5" />
                        Add Teacher
                      </button>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                        <strong>Note:</strong> Teachers can monitor event reports from clubs they manage. When you add a teacher by email, they will receive an invitation to create their account.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {teachers.map(teacher => (
                        <div key={teacher.id} className="glass-card relative p-6 flex flex-col items-center text-center group hover:border-emerald-500/50 transition-colors">
                          <button
                            onClick={() => handleRemoveTeacher(teacher.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Remove Teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 overflow-hidden border-2 border-white dark:border-slate-600 shadow-md">
                            {teacher.profileImage ? (
                              <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-10 h-10 text-slate-400" />
                            )}
                          </div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{teacher.name}</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 font-medium">{teacher.email}</p>

                          <div className="mt-auto w-full pt-4 border-t border-slate-100 dark:border-slate-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              {teacher.managedClubs?.length || 0} Clubs Managed
                            </span>
                          </div>
                        </div>
                      ))}

                      {teachers.length === 0 && (
                        <div className="col-span-full glass-card p-12 text-center border-dashed border-2">
                          <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Teachers Yet</h3>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Add teachers to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            </>
          )}
        </div >


        {showCreateClubModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#002147] dark:text-white">Register Club</h3>
                  <p className="text-sm text-slate-500">Add a new student club to the system</p>
                </div>
                <button onClick={() => { setShowCreateClubModal(false); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formMessage && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
                  <div className={`mt-0.5 p-1 rounded-full ${formMessage.type === 'success' ? 'bg-green-200' : 'bg-red-200'} `}>
                    {formMessage.type === 'success' ? <UserPlus className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <p className="text-sm font-medium">{formMessage.text}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Form (Optional)</label>
                  <input
                    type="text"
                    value={newClub.fullForm}
                    onChange={(e) => setNewClub({ ...newClub, fullForm: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g., Association of Computer Science Engineering Students"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Club Name</label>
                  <input
                    type="text"
                    value={newClub.name}
                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                    placeholder="e.g., Google Developer Student Club"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                  <textarea
                    rows={3}
                    value={newClub.description}
                    onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium resize-none"
                    placeholder="Brief description of the club's purpose and activities..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Category</label>
                  <select
                    value={newClub.category}
                    onChange={(e) => setNewClub({ ...newClub, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium appearance-none"
                  >
                    {CLUB_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Departments</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEPARTMENTS.map(dept => (
                      <label key={dept} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={newClub.departments.includes(dept)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewClub({ ...newClub, departments: [...newClub.departments, dept] });
                            } else {
                              setNewClub({ ...newClub, departments: newClub.departments.filter(d => d !== dept) });
                            }
                          }}
                          className="w-4 h-4 text-[#002147] rounded border-slate-300 focus:ring-[#002147]"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{dept}</span>
                      </label>
                    ))}
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
        )
        }

        {/* Create Secretary Modal */}
        {
          showCreateSecretaryModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
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
                  <div className={`p - 4 rounded - xl mb - 6 flex items - start gap - 3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="e.g. Amish Prabhu"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                    <input
                      type="email"
                      value={newSecretary.email}
                      onChange={(e) => setNewSecretary({ ...newSecretary, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="secretary@walchandsangli.ac.in"
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
          )
        }

        {/* Create President Modal */}
        {
          showCreatePresidentModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
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
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="e.g. Amish Prabhu"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                    <input
                      type="email"
                      value={newRoleUser.email}
                      onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="president@walchandsangli.ac.in"
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
          )
        }

        {/* Create Treasurer Modal */}
        {
          showCreateTreasurerModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
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
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="e.g. Amish Prabhu"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                    <input
                      type="email"
                      value={newRoleUser.email}
                      onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="treasurer@walchandsangli.ac.in"
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
          )
        }

        {/* Create Advisor Modal */}
        {
          showCreateAdvisorModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
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
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="e.g. Amish Prabhu"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Official Email</label>
                    <input
                      type="email"
                      value={newRoleUser.email}
                      onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="advisor@walchandsangli.ac.in"
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
          )
        }

        {/* Edit Advisor Modal */}
        {
          showEditAdvisorModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
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
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="Advisor Name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">New Official Email</label>
                    <input
                      type="email"
                      value={newRoleUser.email}
                      onChange={(e) => setNewRoleUser({ ...newRoleUser, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="advisor@wce.ac.in"
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
          )
        }


        {/* Edit Club Details Modal */}
        {
          showEditClubModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-[#002147] dark:text-white">Edit Club Details</h3>
                    <p className="text-sm text-slate-500">Update information for {selectedClub.name}</p>
                  </div>
                  <button onClick={() => { setShowEditClubModal(false); setSelectedClub(null); setFormMessage(null); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formMessage && (
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
                    <p className="text-sm font-medium">{formMessage.text}</p>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Form (Optional)</label>
                    <input
                      type="text"
                      value={newClub.fullForm || ''}
                      onChange={(e) => setNewClub({ ...newClub, fullForm: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="e.g., Association of Computer Science Engineering Students"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Club Name</label>
                    <input
                      type="text"
                      value={newClub.name}
                      onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="e.g., Google Developer Student Club"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                    <textarea
                      rows={3}
                      value={newClub.description}
                      onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium resize-none"
                      placeholder="Brief description of the club's purpose and activities..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Category</label>
                    <select
                      value={newClub.category}
                      onChange={(e) => setNewClub({ ...newClub, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium appearance-none"
                    >
                      {CLUB_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Departments</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEPARTMENTS.map(dept => (
                        <label key={dept} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <input
                            type="checkbox"
                            checked={newClub.departments.includes(dept)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewClub({ ...newClub, departments: [...newClub.departments, dept] });
                              } else {
                                setNewClub({ ...newClub, departments: newClub.departments.filter(d => d !== dept) });
                              }
                            }}
                            className="w-4 h-4 text-[#002147] rounded border-slate-300 focus:ring-[#002147]"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdateClubDetails}
                      className="w-full bg-[#002147] hover:bg-[#00152e] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <Edit className="w-5 h-5 text-[#DAA520]" />
                      UPDATE DETAILS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Send Notification Modal */}
        {
          showNotificationModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
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
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} `}>
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147] transition-all font-medium"
                      placeholder="Broadcast Headline"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Message</label>
                    <textarea
                      rows={4}
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-college-blue-primary transition-all font-medium resize-none"
                      placeholder="Type your message here..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Broadcast Type</label>
                    <div className="relative">
                      <select
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-college-blue-primary transition-all font-medium appearance-none"
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
          )
        }

        {/* Image Upload Modal */}
        {
          showImageUploadModal && selectedClub && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-college-blue-primary dark:text-white">
                      Update Logo
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
          )
        }


        {/* Add Teacher Modal */}
        {
          showAddTeacherModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/40">
                <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-[#002147] dark:text-white">Add Teacher</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Assign teacher role to monitor event reports</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddTeacherModal(false);
                      setFormMessage(null);
                      setNewTeacher({ email: '', name: '' });
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${formMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {formMessage.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teacher Email</label>
                    <input
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147]"
                      placeholder="teacher@walchandsangli.ac.in"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teacher Name</label>
                    <input
                      type="text"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#002147]"
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      If the user exists, their role will be updated to teacher. If not, they'll receive an invitation to create an account.
                    </p>
                  </div>

                  <button
                    onClick={handleAssignTeacher}
                    className="w-full bg-[#002147] hover:bg-[#003366] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                  >
                    Assign Teacher Role
                  </button>
                </div>
              </div>
            </div>

          )
        }
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          variant={confirmModal.variant}
        />


      </div >
    </>
  );
}
