import { useState, useEffect } from 'react';
import { Shield, Calendar, Clock, Users, Eye, UserPlus, Edit, X, Trash2, Plus, FileText, Download, ChevronRight, Menu, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Page } from '../types/page';
import { DBPost, DBClub, ClubMember } from '../types/auth';
import { getPosts, getClubs, createClubSecretary, createClubPresident, createClubTreasurer, removeClubOfficer, verifyEventBudget, getClubMembers, removeClubMember, TeacherReport, getTeacherReports } from '../lib/dbService';
import ConfirmModal from '../components/ConfirmModal';

interface AdvisorDashboardProps {
    onNavigate: (page: Page) => void;
    onNavigateToPost: (postId: string) => void;
}

export default function AdvisorDashboard({ onNavigate, onNavigateToPost }: AdvisorDashboardProps) {
    const { user } = useAuth();
    const { selectedMembership } = useNavigation();
    const activeClubId = selectedMembership?.clubId || user?.clubId;

    const [activeTab, setActiveTab] = useState<'events' | 'team' | 'budgets' | 'reports'>('events');
    const [events, setEvents] = useState<DBPost[]>([]);
    const [reports, setReports] = useState<TeacherReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clubName, setClubName] = useState('');
    const [club, setClub] = useState<DBClub | null>(null);
    const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isMobileTabOpen, setIsMobileTabOpen] = useState(false);

    // Role edit states
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<'secretary' | 'president' | 'treasurer' | null>(null);
    const [roleForm, setRoleForm] = useState({ name: '', email: '' });
    const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    useEffect(() => {
        const loadData = async () => {
            if (!activeClubId) {
                setIsLoading(false);
                return;
            }

            if (selectedMembership && selectedMembership.clubId === activeClubId) {
                if (selectedMembership.role.toLowerCase() !== 'advisor') {
                    console.warn(`User ${user?.email} attempted to access Advisor Dashboard for ${activeClubId} but is ${selectedMembership.role}`);
                    onNavigate('home');
                    return;
                }
            } else if (user?.role !== 'advisor' && user?.role !== 'admin') {
                onNavigate('home');
                return;
            }

            try {
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === activeClubId);
                if (foundClub) {
                    setClubName(foundClub.name);
                    setClub(foundClub);

                    if (user?.role !== 'admin' && foundClub.advisorEmail !== user?.email) {
                        console.warn(`User ${user?.email} is not the assigned advisor for ${foundClub.name}`);
                        onNavigate('home');
                        return;
                    }
                }

                const allPosts = await getPosts();
                const clubEvents = allPosts.filter(
                    p => p.clubId === activeClubId && p.type === 'event'
                );
                setEvents(clubEvents);

                const members = await getClubMembers(activeClubId);
                setClubMembers(members);

                const fetchedReports = await getTeacherReports();
                const clubReports = fetchedReports.filter(r => r.clubId === activeClubId);
                setReports(clubReports);

            } catch (error) {
                console.error('Error loading advisor data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeClubId, selectedMembership, user, onNavigate]);

    const downloadFile = async (url: string, filename: string) => {
        try {
            // Force Cloudinary to serve as attachment to avoid PDF rendering errors
            const downloadUrl = url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('fl_attachment')
                ? url.replace('/upload/', '/upload/fl_attachment/')
                : url;

            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            const fallbackUrl = url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('fl_attachment')
                ? url.replace('/upload/', '/upload/fl_attachment/')
                : url;
            window.open(fallbackUrl, '_blank');
        }
    };

    const handleDownloadReport = (report: TeacherReport) => {
        const filename = `Report-${report.eventTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        downloadFile(report.reportUrl, filename);
    };

    const getOfficersByRole = (role: string): ClubMember[] => {
        return clubMembers.filter(m =>
            m.role.toLowerCase().trim() === role.toLowerCase().trim()
        );
    };

    const handleRemoveMember = (memberId: string, memberName: string) => {
        if (!club?.id) return;
        setConfirmModal({
            isOpen: true,
            title: 'Remove Officer',
            message: `Are you sure you want to remove ${memberName} from their officer role? This action cannot be undone.`,
            type: 'danger',
            variant: 'confirm',
            onConfirm: async () => {
                const success = await removeClubMember(club.id!, memberId);
                if (success) {
                    setFormMessage({ type: 'success', text: 'Officer removed successfully' });
                    const members = await getClubMembers(club.id!);
                    setClubMembers(members);
                } else {
                    setFormMessage({ type: 'error', text: 'Failed to remove officer' });
                }
            },
        });
    };

    const openEditRoleModal = (role: 'secretary' | 'president' | 'treasurer', mode: 'add' | 'edit' = 'edit') => {
        setEditingRole(role);
        if (mode === 'add') {
            setRoleForm({ name: '', email: '' });
        } else {
            setRoleForm({
                name: '',
                email: role === 'secretary' ? (club?.secretaryEmail || '') :
                    role === 'president' ? (club?.presidentEmail || '') :
                        (club?.treasurerEmail || '')
            });
        }
        setShowEditRoleModal(true);
        setFormMessage(null);
    };

    const handleUpdateRole = async () => {
        if (!roleForm.email || !roleForm.name || !club?.id || !editingRole) {
            setFormMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }

        setIsSaving(true);
        try {
            const clubId = club.id!;
            let result;
            if (editingRole === 'secretary') {
                result = await createClubSecretary(roleForm.email, roleForm.name, clubId, club.name);
            } else if (editingRole === 'president') {
                result = await createClubPresident(roleForm.email, roleForm.name, clubId, club.name);
            } else {
                result = await createClubTreasurer(roleForm.email, roleForm.name, clubId, club.name);
            }

            if (result.success) {
                setFormMessage({ type: 'success', text: `${editingRole.charAt(0).toUpperCase() + editingRole.slice(1)} updated successfully!` });
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === activeClubId);
                if (foundClub) setClub(foundClub);

                const members = await getClubMembers(clubId);
                setClubMembers(members);

                setTimeout(() => {
                    setShowEditRoleModal(false);
                    setEditingRole(null);
                    setFormMessage(null);
                }, 1500);
            } else {
                setFormMessage({ type: 'error', text: result.error || 'Failed to update role' });
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveRole = (role: 'secretary' | 'president' | 'treasurer') => {
        if (!club?.id) return;

        setConfirmModal({
            isOpen: true,
            title: `Remove ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            message: `Are you sure you want to remove the ${role}? This will unlink their account from the club.`,
            type: 'warning',
            variant: 'confirm',
            onConfirm: async () => {
                setIsSaving(true);
                try {
                    const result = await removeClubOfficer(club!.id as string, role);
                    if (result.success) {
                        const clubs = await getClubs();
                        const foundClub = clubs.find(c => c.id === activeClubId);
                        if (foundClub) setClub(foundClub);
                    } else {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to remove officer. Please try again.',
                            type: 'info',
                            variant: 'alert',
                        });
                    }
                } catch (error) {
                    console.error('Error removing role:', error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'An error occurred. Please try again.',
                        type: 'info',
                        variant: 'alert',
                    });
                } finally {
                    setIsSaving(false);
                }
            },
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#002147] border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!activeClubId) {
        return (
            <div className="min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="glass-card p-12 text-center max-w-2xl mx-auto">
                    <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Club Assigned</h2>
                    <p className="text-slate-600 dark:text-slate-400">You are not assigned as an advisor to any club.</p>
                    <button
                        onClick={() => onNavigate('home')}
                        className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    const upcomingEvents = events.filter(e => e.date && new Date(e.date) >= new Date()).length;
    const pastEvents = events.filter(e => e.date && new Date(e.date) < new Date()).length;

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Background Gradients */}
            {/* Background Gradients - REMOVED */}
            {/* <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div> */}

            {/* Header Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
                <div className="glass-card p-6 md:p-8 relative overflow-hidden group">

                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Advisor Dashboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            Manage event posts, budgets, and team members for <span className="text-cyan-600 dark:text-cyan-400 font-bold">{clubName}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4">
                {/* Mobile Tabs */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setIsMobileTabOpen(!isMobileTabOpen)}
                        className="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Menu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </span>
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isMobileTabOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isMobileTabOpen && (
                        <div className="mt-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl absolute z-40 w-[calc(100%-2rem)] left-4 right-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col gap-1">
                                {[
                                    { id: 'events', label: 'Events', icon: Calendar },
                                    { id: 'reports', label: 'Reports', icon: FileText },
                                    { id: 'budgets', label: 'Budgets', icon: Edit },
                                    { id: 'team', label: 'Team', icon: Users },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveTab(tab.id as any); setIsMobileTabOpen(false); }}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === tab.id
                                                ? 'bg-blue-700 text-white shadow-lg'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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

                {/* Desktop Tabs */}
                <div className="hidden md:flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl w-fit mb-6">
                    {[
                        { id: 'events', label: 'Events', icon: Calendar },
                        { id: 'reports', label: 'Reports', icon: FileText },
                        { id: 'budgets', label: 'Budgets', icon: Edit },
                        { id: 'team', label: 'Team', icon: Users },
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

                {/* Inner Content Card */}
                <div className="glass-card mt-6 p-4 sm:p-8 min-h-[500px] relative overflow-hidden mx-auto max-w-7xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/20"></div>
                    <div className="p-2 sm:p-4">

                        {/* Events Tab */}
                        {activeTab === 'events' && (
                            <div className="space-y-6">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                                        <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    Club Events
                                </h2>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="glass-card p-4 md:p-6 relative overflow-hidden group/card bg-white/50 dark:bg-slate-800/50">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                            <Calendar className="w-16 h-16 md:w-24 md:h-24 text-blue-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 text-sm md:text-base">Total Events</p>
                                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{events.length}</h3>
                                        </div>
                                    </div>

                                    <div className="glass-card p-4 md:p-6 relative overflow-hidden group/card bg-white/50 dark:bg-slate-800/50">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                            <Clock className="w-16 h-16 md:w-24 md:h-24 text-cyan-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 text-sm md:text-base">Upcoming Events</p>
                                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{upcomingEvents}</h3>
                                        </div>
                                    </div>

                                    <div className="glass-card p-4 md:p-6 relative overflow-hidden group/card bg-white/50 dark:bg-slate-800/50">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                            <Calendar className="w-16 h-16 md:w-24 md:h-24 text-slate-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 text-sm md:text-base">Past Events</p>
                                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{pastEvents}</h3>
                                        </div>
                                    </div>
                                </div>

                                {events.length === 0 ? (
                                    <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                        <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-600 dark:text-slate-400">No events found for your club.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {events.map((event) => (
                                            <div key={event.id} className="glass-card p-6 hover:border-blue-500/30 transition-all hover:scale-[1.01] group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{event.title}</h4>
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                                {new Date(event.date || Date.now()).toLocaleDateString()}
                                                            </span>
                                                            {event.rsvps !== undefined && (
                                                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                                    <Users className="w-4 h-4 text-slate-500" />
                                                                    {event.rsvps} RSVPs
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => event.id && onNavigateToPost(event.id)}
                                                            className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all shadow-sm"
                                                            title="View Event"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reports Tab */}
                        {activeTab === 'reports' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                            <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        Event Reports
                                    </h2>
                                </div>

                                {reports.length === 0 ? (
                                    <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No reports available.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {reports.map((report) => (
                                            <div
                                                key={report.id}
                                                className="glass-card p-6 group hover:border-green-500/30 transition-all hover:scale-[1.01]"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                                                    {report.eventTitle}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                    ID: {report.id.slice(0, 8)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <span>Event Date: <span className="font-semibold">{new Date(report.eventDate).toLocaleDateString()}</span></span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                <Users className="w-4 h-4 text-slate-400" />
                                                                <span>By: <span className="font-semibold">{report.reportSubmittedByName}</span></span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                <Clock className="w-4 h-4 text-slate-400" />
                                                                <span>Submitted: <span className="font-semibold">{new Date(report.reportSubmittedAt).toLocaleDateString()}</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadReport(report)}
                                                        className="ml-6 flex flex-col items-center gap-1 min-w-[80px] group/btn"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover/btn:bg-green-500 group-hover/btn:text-white flex items-center justify-center transition-all shadow-sm">
                                                            <Download className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-500 group-hover/btn:text-green-600 dark:group-hover/btn:text-green-400">Download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Budgets Tab */}
                        {activeTab === 'budgets' && (
                            <div className="space-y-6">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <Edit className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    Event Budgets
                                </h2>

                                {events.filter(e => e.budgetImage).length === 0 ? (
                                    <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                        <Edit className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No budgets have been submitted yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {events
                                            .filter(e => e.budgetImage)
                                            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                                            .map((event) => {
                                                const isPast = new Date(event.date || Date.now()) < new Date();
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className="glass-card p-6 border border-slate-200/60 dark:border-slate-700/40 shadow-sm"
                                                    >
                                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isPast
                                                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                        }`}>
                                                                        {isPast ? 'Past Event' : 'Upcoming'}
                                                                    </span>
                                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                        {new Date(event.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-3">{event.title}</h4>

                                                                {/* Budget Status */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${event.budgetVerified
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                                        }`}>
                                                                        {event.budgetVerified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                                        {event.budgetVerified ? 'Verified' : 'Awaiting Verification'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Budget Actions */}
                                                            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[180px]">
                                                                {/* View Budget Button */}
                                                                <a
                                                                    href={event.budgetImage}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    View Budget
                                                                </a>

                                                                {/* Verify Button */}
                                                                {!event.budgetVerified && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const success = await verifyEventBudget(event.id!);
                                                                            if (success) {
                                                                                // Refresh events
                                                                                const allPosts = await getPosts();
                                                                                const clubEvents = allPosts.filter(
                                                                                    p => p.clubId === activeClubId && p.type === 'event'
                                                                                );
                                                                                setEvents(clubEvents);
                                                                            }
                                                                        }}
                                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Verify Budget
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
                        )}

                        {/* Team Tab */}
                        {activeTab === 'team' && (
                            <div className="space-y-6">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    Club Officers
                                </h2>

                                <div className="grid gap-6">
                                    {/* Secretary Section */}
                                    <div className="glass-card p-4 md:p-6 relative overflow-hidden group/card bg-white/50 dark:bg-slate-800/50 h-full flex flex-col">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <Users className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                                                <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                    Secretaries
                                                </h4>
                                                <button
                                                    onClick={() => openEditRoleModal('secretary', 'add')}
                                                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white p-2 md:px-3 md:py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                                    title="Add New"
                                                >
                                                    <Plus className="w-4 h-4 md:w-3 md:h-3" />
                                                    <span className="hidden md:inline">Add New</span>
                                                </button>
                                            </div>

                                            <div className="space-y-3 flex-1">
                                                {getOfficersByRole('secretary').length > 0 ? (
                                                    getOfficersByRole('secretary').map(officer => (
                                                        <div key={officer.id} className="w-full flex justify-between items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden backdrop-blur-sm">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{officer.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.email}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveMember(officer.id!, officer.name)}
                                                                className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Remove"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    club?.secretaryEmail ? (
                                                        <div className="w-full flex justify-between items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden backdrop-blur-sm">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">Secretary</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{club.secretaryEmail}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openEditRoleModal('secretary', 'edit')}
                                                                    className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveRole('secretary')}
                                                                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-400 italic text-center py-4 bg-slate-100/30 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50 border-dashed">No secretaries assigned</div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* President Section */}
                                    <div className="glass-card p-4 md:p-6 relative overflow-hidden group/card bg-white/50 dark:bg-slate-800/50 h-full flex flex-col">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <Users className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                                                <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                    Presidents
                                                </h4>
                                                <button
                                                    onClick={() => openEditRoleModal('president', 'add')}
                                                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white p-2 md:px-3 md:py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                                    title="Add New"
                                                >
                                                    <Plus className="w-4 h-4 md:w-3 md:h-3" />
                                                    <span className="hidden md:inline">Add New</span>
                                                </button>
                                            </div>

                                            <div className="space-y-3 flex-1">
                                                {getOfficersByRole('president').length > 0 ? (
                                                    getOfficersByRole('president').map(officer => (
                                                        <div key={officer.id} className="w-full flex justify-between items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden backdrop-blur-sm">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{officer.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.email}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveMember(officer.id!, officer.name)}
                                                                className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Remove"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    club?.presidentEmail ? (
                                                        <div className="w-full flex justify-between items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden backdrop-blur-sm">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">President</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{club.presidentEmail}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openEditRoleModal('president', 'edit')}
                                                                    className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveRole('president')}
                                                                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-400 italic text-center py-4 bg-slate-100/30 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50 border-dashed">No presidents assigned</div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Treasurer Section */}
                                    <div className="glass-card p-4 md:p-6 relative overflow-hidden group/card bg-white/50 dark:bg-slate-800/50 h-full flex flex-col">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <Users className="w-8 h-8 md:w-12 md:h-12 text-green-500" />
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                                                <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                    Treasurers
                                                </h4>
                                                <button
                                                    onClick={() => openEditRoleModal('treasurer', 'add')}
                                                    className="flex items-center gap-1.5 text-xs font-bold bg-green-500 hover:bg-green-600 text-white p-2 md:px-3 md:py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                                    title="Add New"
                                                >
                                                    <Plus className="w-4 h-4 md:w-3 md:h-3" />
                                                    <span className="hidden md:inline">Add New</span>
                                                </button>
                                            </div>

                                            <div className="space-y-3 flex-1">
                                                {getOfficersByRole('treasurer').length > 0 ? (
                                                    getOfficersByRole('treasurer').map(officer => (
                                                        <div key={officer.id} className="w-full flex justify-between items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden backdrop-blur-sm">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{officer.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.email}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveMember(officer.id!, officer.name)}
                                                                className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Remove"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    club?.treasurerEmail ? (
                                                        <div className="w-full flex justify-between items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden backdrop-blur-sm">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">Treasurer</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{club.treasurerEmail}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openEditRoleModal('treasurer', 'edit')}
                                                                    className="text-slate-400 hover:text-green-500 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveRole('treasurer')}
                                                                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-400 italic text-center py-4 bg-slate-100/30 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50 border-dashed">No treasurers assigned</div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Role Modal */}
            {showEditRoleModal && editingRole && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-md shadow-2xl relative">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                {club?.secretaryEmail && editingRole === 'secretary' ? 'Edit' :
                                    club?.presidentEmail && editingRole === 'president' ? 'Edit' :
                                        club?.treasurerEmail && editingRole === 'treasurer' ? 'Edit' : 'Add'} {editingRole}
                            </h3>
                            <button
                                onClick={() => { setShowEditRoleModal(false); setEditingRole(null); setFormMessage(null); }}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 mb-6">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                This will create a new account for the user. Existing credentials will be replaced.
                            </p>
                        </div>

                        {formMessage && (
                            <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${formMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                {formMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {formMessage.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="e.g. Amish Prabhu"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={roleForm.email}
                                    onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="e.g. 2021bcs022@wce.ac.in"
                                />
                            </div>

                            <button
                                onClick={handleUpdateRole}
                                disabled={isSaving}
                                className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md mt-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
    );
}
