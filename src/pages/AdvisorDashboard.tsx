import { useState, useEffect } from 'react';
import { Shield, Calendar, Clock, Users, Eye, UserPlus, Edit, X, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Page } from '../types/page';
import { DBPost, DBClub, ClubMember } from '../types/auth';
import { getPosts, getClubs, createClubSecretary, createClubPresident, createClubTreasurer, removeClubOfficer, verifyEventBudget, getClubMembers, removeClubMember } from '../lib/dbService';
import ConfirmModal from '../components/ConfirmModal';

interface AdvisorDashboardProps {
    onNavigate: (page: Page) => void;
    onNavigateToPost: (postId: string) => void;
}

export default function AdvisorDashboard({ onNavigate, onNavigateToPost }: AdvisorDashboardProps) {
    const { user } = useAuth();
    const { selectedMembership } = useNavigation();
    const activeClubId = selectedMembership?.clubId || user?.clubId;

    const [activeTab, setActiveTab] = useState<'events' | 'team' | 'budgets'>('events');
    const [events, setEvents] = useState<DBPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clubName, setClubName] = useState('');
    const [club, setClub] = useState<DBClub | null>(null);
    const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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

            // STRICT CHECK: Verify user is actually the advisor for this SPECIFIC club
            // Global 'advisor' role allows entry to the page, but we must ensure they manage THIS club
            // Exception: If they are a Super Admin? Usually Super Admin has their own dashboard.
            // But if Super Admin wants to see Advisor view, maybe allow it? 
            // For now, let's enforce membership role check if selectedMembership exists.

            if (selectedMembership && selectedMembership.clubId === activeClubId) {
                if (selectedMembership.role.toLowerCase() !== 'advisor') {
                    // User is viewing a club where they are NOT the advisor (e.g. President)
                    // Redirect them to home or let them know
                    console.warn(`User ${user?.email} attempted to access Advisor Dashboard for ${activeClubId} but is ${selectedMembership.role}`);
                    // We can redirect to the correct dashboard based on their role?
                    // Or just redirect to Home for safety.
                    onNavigate('home');
                    return;
                }
            } else if (user?.role !== 'advisor' && user?.role !== 'admin') {
                // If checking via global user object (no selectedMembership), ensuring they are advisor
                onNavigate('home');
                return;
            }

            try {
                // Get club info
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === activeClubId);
                if (foundClub) {
                    setClubName(foundClub.name);
                    setClub(foundClub);

                    // Double check if using global user object: 
                    // If I am global advisor, am I assigned to THIS club?
                    // The club object has advisorEmail. Use that as source of truth.
                    if (user?.role !== 'admin' && foundClub.advisorEmail !== user?.email) {
                        console.warn(`User ${user?.email} is not the assigned advisor for ${foundClub.name}`);
                        onNavigate('home');
                        return;
                    }
                }

                // Get all events for this club
                const allPosts = await getPosts();
                const clubEvents = allPosts.filter(
                    p => p.clubId === activeClubId && p.type === 'event'
                );
                setEvents(clubEvents);

                // Get club members for officer list
                const members = await getClubMembers(activeClubId);
                setClubMembers(members);

            } catch (error) {
                console.error('Error loading advisor data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeClubId, selectedMembership, user, onNavigate]);

    // Helper function to get officers by role
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
                    // Refresh data
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

        // Password validation removed as we use email-only invite flow

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
                // Refresh club data
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === activeClubId);
                if (foundClub) setClub(foundClub);

                // Refresh members
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
                        // Refresh club data
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
            <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!activeClubId) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Club Assigned</h2>
                    <p className="text-slate-600 dark:text-slate-400">You are not assigned as an advisor to any club.</p>
                </div>
            </div>
        );
    }

    const upcomingEvents = events.filter(e => e.date && new Date(e.date) >= new Date()).length;
    const pastEvents = events.filter(e => e.date && new Date(e.date) < new Date()).length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12" >
            {/* Header */}
            < div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-[#DAA520]" >
                <div className="flex flex-row items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-[#002147] shrink-0">
                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-[#002147]" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-serif font-bold text-[#002147] dark:text-white truncate">
                            Advisor Dashboard
                        </h1>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                            <span className="text-[#DAA520]">{clubName}</span> • Manage events
                        </p>
                    </div>
                </div>
            </div >

            {/* Stats Cards */}
            < div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6" >
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border-l-2 md:border-l-4 border-[#002147]">
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-1">
                            <Calendar className="w-4 h-4 text-[#002147] dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold text-[#002147] dark:text-white leading-tight">{events.length}</p>
                            <p className="text-[10px] md:text-sm text-slate-600 dark:text-slate-300">Total</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border-l-2 md:border-l-4 border-[#DAA520]">
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-1">
                            <Clock className="w-4 h-4 text-[#DAA520] dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold text-[#DAA520] dark:text-white leading-tight">{upcomingEvents}</p>
                            <p className="text-[10px] md:text-sm text-slate-600 dark:text-slate-300">Upcoming</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border-l-2 md:border-l-4 border-slate-400">
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg mb-1">
                            <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold text-slate-700 dark:text-white leading-tight">{pastEvents}</p>
                            <p className="text-[10px] md:text-sm text-slate-600 dark:text-slate-300">Past</p>
                        </div>
                    </div>
                </div>
            </div >

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-6 md:mb-8 overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'events', label: 'Events', icon: Calendar },
                        { id: 'budgets', label: 'Budgets', icon: Edit },
                        { id: 'team', label: 'Team', icon: Users },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'events' | 'team' | 'budgets')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-all border-b-2 whitespace-nowrap flex-shrink-0 text-sm md:text-base ${activeTab === tab.id
                                    ? 'text-[#002147] dark:text-cyan-400 border-[#002147]'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === tab.id ? 'text-[#DAA520]' : ''}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 sm:p-6">
                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            {events.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400">No events found for your club.</p>
                                </div>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">{event.title}</h4>
                                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(event.date || Date.now()).toLocaleDateString()}
                                                    </span>
                                                    {event.rsvps !== undefined && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {event.rsvps} RSVPs
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => event.id && onNavigateToPost(event.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                    title="View Event"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Budgets Tab */}
                    {activeTab === 'budgets' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-[#002147] dark:text-white mb-2">Event Budgets</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Review and verify budgets submitted by the club treasurer.
                                </p>
                            </div>

                            {events.filter(e => e.budgetImage).length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
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
                                                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
                                                >
                                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
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
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{event.title}</h4>

                                                            {/* Budget Status */}
                                                            <div className="flex items-center gap-2 mt-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.budgetVerified
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                    }`}>
                                                                    {event.budgetVerified ? '✓ Verified' : '⏳ Awaiting Verification'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Budget Actions */}
                                                        <div className="flex flex-col gap-3 min-w-[180px]">
                                                            {/* View Budget Button */}
                                                            <a
                                                                href={event.budgetImage}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                            >
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
                                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                                                >
                                                                    ✓ Verify Budget
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
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Club Officers</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                As the club advisor, you can manage the officer team.
                            </p>

                            <div className="grid gap-4">
                                {/* Secretary Section */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-600">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Secretaries</h4>
                                        <button
                                            onClick={() => openEditRoleModal('secretary', 'add')}
                                            className="flex items-center gap-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {getOfficersByRole('secretary').length > 0 ? (
                                            getOfficersByRole('secretary').map(officer => (
                                                <div key={officer.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{officer.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.email}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveMember(officer.id!, officer.name)}
                                                        className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            club?.secretaryEmail ? (
                                                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">Secretary</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{club.secretaryEmail}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => openEditRoleModal('secretary', 'edit')}
                                                            className="text-slate-400 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveRole('secretary')}
                                                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic text-center py-2">No secretaries assigned</p>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* President Section */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-600">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Presidents</h4>
                                        <button
                                            onClick={() => openEditRoleModal('president', 'add')}
                                            className="flex items-center gap-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {getOfficersByRole('president').length > 0 ? (
                                            getOfficersByRole('president').map(officer => (
                                                <div key={officer.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{officer.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.email}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveMember(officer.id!, officer.name)}
                                                        className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            club?.presidentEmail ? (
                                                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">President</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{club.presidentEmail}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => openEditRoleModal('president', 'edit')}
                                                            className="text-slate-400 hover:text-amber-500 p-1 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveRole('president')}
                                                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic text-center py-2">No presidents assigned</p>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Treasurer Section */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-600">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Treasurers</h4>
                                        <button
                                            onClick={() => openEditRoleModal('treasurer', 'add')}
                                            className="flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {getOfficersByRole('treasurer').length > 0 ? (
                                            getOfficersByRole('treasurer').map(officer => (
                                                <div key={officer.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{officer.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{officer.email}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveMember(officer.id!, officer.name)}
                                                        className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            club?.treasurerEmail ? (
                                                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">Treasurer</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{club.treasurerEmail}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => openEditRoleModal('treasurer', 'edit')}
                                                            className="text-slate-400 hover:text-green-500 p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveRole('treasurer')}
                                                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic text-center py-2">No treasurers assigned</p>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* Edit Role Modal */}
            {
                showEditRoleModal && editingRole && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {club?.secretaryEmail && editingRole === 'secretary' ? 'Edit' :
                                        club?.presidentEmail && editingRole === 'president' ? 'Edit' :
                                            club?.treasurerEmail && editingRole === 'treasurer' ? 'Edit' : 'Add'} {editingRole.charAt(0).toUpperCase() + editingRole.slice(1)}
                                </h3>
                                <button onClick={() => { setShowEditRoleModal(false); setEditingRole(null); setFormMessage(null); }} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
                                ⚠️ This will create a new account. Existing credentials will be replaced.
                            </p>

                            {formMessage && (
                                <div className={`p-3 rounded-lg mb-4 ${formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {formMessage.text}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={roleForm.email}
                                        onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="user@wce.ac.in"
                                    />
                                </div>

                                <button
                                    onClick={handleUpdateRole}
                                    disabled={isSaving}
                                    className="w-full bg-[#002147] hover:bg-[#00152e] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <UserPlus className="w-5 h-5 text-[#DAA520]" />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
}
