import { useState, useEffect } from 'react';
import { Shield, Calendar, Clock, Users, Eye, UserPlus, Edit, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Page } from '../types/page';
import { DBPost, DBClub } from '../types/auth';
import { getPosts, getClubs, createClubSecretary, createClubPresident, createClubTreasurer, removeClubOfficer, verifyEventBudget } from '../lib/dbService';
import ConfirmModal from '../components/ConfirmModal';

interface AdvisorDashboardProps {
    onNavigate: (page: Page) => void;
    onNavigateToPost: (postId: string) => void;
}

export default function AdvisorDashboard({ onNavigateToPost }: AdvisorDashboardProps) {
    const { user } = useAuth();
    const activeClubId = user?.clubId;

    const [activeTab, setActiveTab] = useState<'events' | 'team' | 'budgets'>('events');
    const [events, setEvents] = useState<DBPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clubName, setClubName] = useState('');
    const [club, setClub] = useState<DBClub | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Role edit states
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<'secretary' | 'president' | 'treasurer' | null>(null);
    const [roleForm, setRoleForm] = useState({ name: '', email: '', password: 'Hello@123' });
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

            try {
                // Get club info
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === activeClubId);
                if (foundClub) {
                    setClubName(foundClub.name);
                    setClub(foundClub);
                }

                // Get all events for this club
                const allPosts = await getPosts();
                const clubEvents = allPosts.filter(
                    p => p.clubId === activeClubId && p.type === 'event'
                );
                setEvents(clubEvents);
            } catch (error) {
                console.error('Error loading advisor data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeClubId]);

    const openEditRoleModal = (role: 'secretary' | 'president' | 'treasurer') => {
        setEditingRole(role);
        setRoleForm({
            name: '', // Name not stored in DBClub for these roles
            email: role === 'secretary' ? (club?.secretaryEmail || '') :
                role === 'president' ? (club?.presidentEmail || '') :
                    (club?.treasurerEmail || ''),
            password: 'Hello@123'
        });
        setShowEditRoleModal(true);
        setFormMessage(null);
    };

    const handleUpdateRole = async () => {
        if (!roleForm.email || !roleForm.password || !roleForm.name || !club?.id || !editingRole) {
            setFormMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }

        if (roleForm.password.length < 6) {
            setFormMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setIsSaving(true);
        try {
            let result;
            if (editingRole === 'secretary') {
                result = await createClubSecretary(roleForm.email, roleForm.password, roleForm.name, club.id, club.name);
            } else if (editingRole === 'president') {
                result = await createClubPresident(roleForm.email, roleForm.password, roleForm.name, club.id, club.name);
            } else {
                result = await createClubTreasurer(roleForm.email, roleForm.password, roleForm.name, club.id, club.name);
            }

            if (result.success) {
                setFormMessage({ type: 'success', text: `${editingRole.charAt(0).toUpperCase() + editingRole.slice(1)} updated successfully!` });
                // Refresh club data
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === activeClubId);
                if (foundClub) setClub(foundClub);
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

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;
    const pastEvents = events.filter(e => new Date(e.date) < new Date()).length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
            {/* Header */}
            <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-[#DAA520]">
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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
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
            </div>

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
                                onClick={() => setActiveTab(tab.id as any)}
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
                                                        {event.date}
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
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((event) => {
                                            const isPast = new Date(event.date) < new Date();
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
                                                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                                                                                p => p.clubId === user?.clubId && p.type === 'event'
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
                                As the club advisor, you can update the credentials for any club officer.
                            </p>

                            <div className="grid gap-4">
                                {/* Secretary */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Secretary</h4>
                                        {club?.secretaryEmail ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate tracking-tight">{club.secretaryEmail}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not assigned</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => openEditRoleModal('secretary')}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {club?.secretaryEmail ? 'Edit' : 'Add'}
                                        </button>
                                        {club?.secretaryEmail && (
                                            <button
                                                onClick={() => handleRemoveRole('secretary')}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                title="Remove Secretary"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* President */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">President</h4>
                                        {club?.presidentEmail ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate tracking-tight">{club.presidentEmail}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not assigned</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => openEditRoleModal('president')}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {club?.presidentEmail ? 'Edit' : 'Add'}
                                        </button>
                                        {club?.presidentEmail && (
                                            <button
                                                onClick={() => handleRemoveRole('president')}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                title="Remove President"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Treasurer */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Treasurer</h4>
                                        {club?.treasurerEmail ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate tracking-tight">{club.treasurerEmail}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not assigned</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => openEditRoleModal('treasurer')}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {club?.treasurerEmail ? 'Edit' : 'Add'}
                                        </button>
                                        {club?.treasurerEmail && (
                                            <button
                                                onClick={() => handleRemoveRole('treasurer')}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                title="Remove Treasurer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Role Modal */}
            {showEditRoleModal && editingRole && (
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password *</label>
                                <input
                                    type="password"
                                    value={roleForm.password}
                                    onChange={(e) => setRoleForm({ ...roleForm, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Minimum 6 characters"
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
