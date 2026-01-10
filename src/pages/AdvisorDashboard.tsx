import { useState, useEffect } from 'react';
import { Shield, Calendar, DollarSign, Clock, Users, Eye, FileText, ExternalLink, UserPlus, Edit, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Page } from '../types/page';
import { FirestorePost, BudgetItem, FirestoreClub } from '../types/auth';
import { getPosts, getClubs, updatePost, createClubSecretary, createClubPresident, createClubTreasurer, removeClubOfficer } from '../lib/firestoreService';

interface AdvisorDashboardProps {
    onNavigate: (page: Page) => void;
    onNavigateToPost: (postId: string) => void;
}

export default function AdvisorDashboard({ onNavigate, onNavigateToPost }: AdvisorDashboardProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'events' | 'budget' | 'team'>('events');
    const [events, setEvents] = useState<FirestorePost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clubName, setClubName] = useState('');
    const [club, setClub] = useState<FirestoreClub | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<FirestorePost | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Role edit states
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<'secretary' | 'president' | 'treasurer' | null>(null);
    const [roleForm, setRoleForm] = useState({ name: '', email: '', password: 'Hello@123' });
    const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.clubId) {
                setIsLoading(false);
                return;
            }

            try {
                // Get club info
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === user.clubId);
                if (foundClub) {
                    setClubName(foundClub.name);
                    setClub(foundClub);
                }

                // Get all events for this club
                const allPosts = await getPosts();
                const clubEvents = allPosts.filter(
                    p => p.clubId === user.clubId && p.type === 'event'
                );
                setEvents(clubEvents);
            } catch (error) {
                console.error('Error loading advisor data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user?.clubId]);

    const handleVerifyExpense = async (event: FirestorePost, itemId: string, verified: boolean) => {
        if (!event.id) return;

        setIsSaving(true);
        try {
            const updatedBudget = (event.eventBudget || []).map((item: BudgetItem) =>
                item.id === itemId
                    ? {
                        ...item,
                        verified,
                        verifiedAt: verified ? new Date() : undefined,
                        verifiedBy: verified ? user?.name : undefined,
                    }
                    : item
            );

            await updatePost(event.id, { eventBudget: updatedBudget });

            // Update local state
            setEvents(prev =>
                prev.map(e =>
                    e.id === event.id ? { ...e, eventBudget: updatedBudget } : e
                )
            );

            if (selectedEvent?.id === event.id) {
                setSelectedEvent({ ...selectedEvent, eventBudget: updatedBudget });
            }
        } catch (error) {
            console.error('Error verifying expense:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openEditRoleModal = (role: 'secretary' | 'president' | 'treasurer') => {
        setEditingRole(role);
        setRoleForm({
            name: '', // Name not stored in FirestoreClub for these roles
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
                const foundClub = clubs.find(c => c.id === user?.clubId);
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


    const handleRemoveRole = async (role: 'secretary' | 'president' | 'treasurer') => {
        if (!club?.id) return;

        if (!window.confirm(`Are you sure you want to remove the ${role}? This will unlink their account from the club.`)) {
            return;
        }

        setIsSaving(true);
        try {
            const result = await removeClubOfficer(club.id, role);
            if (result.success) {
                // Refresh club data
                const clubs = await getClubs();
                const foundClub = clubs.find(c => c.id === user?.clubId);
                if (foundClub) setClub(foundClub);
            } else {
                alert('Failed to remove officer');
            }
        } catch (error) {
            console.error('Error removing role:', error);
            alert('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user?.clubId) {
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

    const eventsWithBudget = events.filter(e => e.eventBudget && e.eventBudget.length > 0);
    const totalBudget = eventsWithBudget.reduce((sum, e) =>
        sum + (e.eventBudget || []).reduce((s, b) => s + (b.estimatedCost || 0), 0), 0
    );
    const totalActual = eventsWithBudget.reduce((sum, e) =>
        sum + (e.eventBudget || []).reduce((s, b) => s + (b.actualCost || 0), 0), 0
    );
    const pendingVerification = eventsWithBudget.reduce((sum, e) =>
        sum + (e.eventBudget || []).filter((b: BudgetItem) => b.paid && !b.verified && b.receiptUrl).length, 0
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                            Advisor Dashboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">{clubName}</p>
                    </div>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                    Welcome, {user?.name}. Review and verify event budgets for your club.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{events.length}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Total Events</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{totalBudget.toLocaleString()}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Total Budget</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{totalActual.toLocaleString()}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Actual Spent</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingVerification}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Pending Verification</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    {[
                        { id: 'events', label: 'Events', icon: Calendar },
                        { id: 'budget', label: 'Budget Review', icon: DollarSign },
                        { id: 'team', label: 'Team Management', icon: Users },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${activeTab === tab.id
                                    ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600'
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
                                                    {event.eventBudget && event.eventBudget.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="w-4 h-4" />
                                                            {event.eventBudget.length} budget items
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
                                                {event.eventBudget && event.eventBudget.length > 0 && (
                                                    <button
                                                        onClick={() => { setSelectedEvent(event); setActiveTab('budget'); }}
                                                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                        title="Review Budget"
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Budget Tab */}
                    {activeTab === 'budget' && (
                        <div className="space-y-6">
                            {selectedEvent ? (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                            Budget for: {selectedEvent.title}
                                        </h3>
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm"
                                        >
                                            ← Back to all events
                                        </button>
                                    </div>

                                    {selectedEvent.eventBudget && selectedEvent.eventBudget.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedEvent.eventBudget.map((item: BudgetItem) => (
                                                <div key={item.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h5 className="font-semibold text-slate-900 dark:text-white">{item.description}</h5>
                                                                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 capitalize">
                                                                    {item.category}
                                                                </span>
                                                                {item.paid && (
                                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                                        Paid
                                                                    </span>
                                                                )}
                                                                {item.verified && (
                                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                                                                        ✓ Verified
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-6 text-sm">
                                                                <span className="text-slate-600 dark:text-slate-400">
                                                                    Est: ₹{item.estimatedCost.toLocaleString()}
                                                                </span>
                                                                <span className="text-slate-900 dark:text-white font-medium">
                                                                    Actual: ₹{item.actualCost.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {/* Receipt Link */}
                                                            {item.receiptUrl && (
                                                                <a
                                                                    href={item.receiptUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    Receipt
                                                                </a>
                                                            )}

                                                            {/* Verify Checkbox - only show if paid and has receipt */}
                                                            {item.paid && item.receiptUrl && (
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.verified || false}
                                                                        onChange={(e) => handleVerifyExpense(selectedEvent, item.id, e.target.checked)}
                                                                        disabled={isSaving}
                                                                        className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                                    />
                                                                    <span className="text-sm text-slate-600 dark:text-slate-400">Verify</span>
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {item.verified && item.verifiedBy && (
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            Verified by {item.verifiedBy} on{' '}
                                                            {item.verifiedAt instanceof Date
                                                                ? item.verifiedAt.toLocaleDateString()
                                                                : new Date(item.verifiedAt!).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 dark:text-slate-400">No budget items for this event.</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Select an Event to Review</h3>
                                    {eventsWithBudget.length === 0 ? (
                                        <div className="text-center py-12">
                                            <DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-600 dark:text-slate-400">No events with budget data found.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {eventsWithBudget.map((event) => {
                                                const pending = (event.eventBudget || []).filter(
                                                    (b: BudgetItem) => b.paid && !b.verified && b.receiptUrl
                                                ).length;
                                                return (
                                                    <button
                                                        key={event.id}
                                                        onClick={() => setSelectedEvent(event)}
                                                        className="w-full text-left bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900 dark:text-white">{event.title}</h4>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400">{event.date}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                    {event.eventBudget?.length} items
                                                                </span>
                                                                {pending > 0 && (
                                                                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                                        {pending} pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
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
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Secretary</h4>
                                        {club?.secretaryEmail ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{club.secretaryEmail}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not assigned</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditRoleModal('secretary')}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {club?.secretaryEmail ? 'Edit' : 'Add'}
                                        </button>
                                        {club?.secretaryEmail && (
                                            <button
                                                onClick={() => handleRemoveRole('secretary')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                title="Remove Secretary"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* President */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">President</h4>
                                        {club?.presidentEmail ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{club.presidentEmail}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not assigned</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditRoleModal('president')}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {club?.presidentEmail ? 'Edit' : 'Add'}
                                        </button>
                                        {club?.presidentEmail && (
                                            <button
                                                onClick={() => handleRemoveRole('president')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                title="Remove President"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Treasurer */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Treasurer</h4>
                                        {club?.treasurerEmail ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{club.treasurerEmail}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not assigned</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditRoleModal('treasurer')}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {club?.treasurerEmail ? 'Edit' : 'Add'}
                                        </button>
                                        {club?.treasurerEmail && (
                                            <button
                                                onClick={() => handleRemoveRole('treasurer')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
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
                                className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
