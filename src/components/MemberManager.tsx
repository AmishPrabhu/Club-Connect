import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserPlus, X, Check, Users, Download, Upload } from 'lucide-react';
import { ClubMember, UserRole } from '../types/auth';
import { getClubMembers, addClubMember, updateClubMember, removeClubMember } from '../lib/dbService';
import BulkImportModal from './BulkImportModal';

interface MemberManagerProps {
    clubId: string;
    clubName: string;
    isReadOnly?: boolean;
    userRole?: UserRole;
}

// Helper to sort members by board priority: Main > Executive > Member
const sortMembers = (members: ClubMember[]) => {
    const priority = { main: 0, executive: 1, member: 2 };
    return [...members].sort((a, b) => {
        const pA = priority[a.boardType || 'member'] ?? 2;
        const pB = priority[b.boardType || 'member'] ?? 2;
        return pA - pB;
    });
};

// Board type options
const BOARD_TYPE_OPTIONS: { value: 'main' | 'executive' | 'member'; label: string }[] = [
    { value: 'main', label: 'Main Board (TY)' },
    { value: 'executive', label: 'Executive Board (SY)' },
    { value: 'member', label: 'Member Board (FY)' },
];

const BOARD_TYPE_COLORS: Record<string, string> = {
    'main': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'executive': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'member': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

export default function MemberManager({ clubId, clubName, isReadOnly = false, userRole }: MemberManagerProps) {
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<ClubMember | null>(null);
    const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [boardTypeFilter, setBoardTypeFilter] = useState<string>('');

    // Form state
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        role: 'Member' as string,
        boardType: 'member' as 'main' | 'executive' | 'member',
        academicYear: '' as string,
        joinedAt: new Date().getFullYear().toString(),
    });

    // Fetch members on mount
    useEffect(() => {
        fetchMembers();
    }, [clubId]);

    const fetchMembers = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const membersList = await getClubMembers(clubId);
            setMembers(membersList);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMember.name.trim() || !newMember.email.trim()) {
            setFormMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }

        if (!newMember.email.endsWith('@walchandsangli.ac.in')) {
            setFormMessage({ type: 'error', text: 'Only @walchandsangli.ac.in email addresses are allowed' });
            return;
        }

        // Optimistic update
        const tempId = 'temp-' + Date.now();
        const optimisticMember: ClubMember = {
            id: tempId,
            ...newMember,
            role: newMember.boardType === 'member' ? 'Member' : newMember.role,
            joinedAt: new Date(newMember.joinedAt)
        };

        setMembers(prev => [...prev, optimisticMember]);
        setIsAddModalOpen(false);
        setFormMessage(null);

        // Reset form immediately
        const resetForm = { name: '', email: '', role: 'Member', boardType: 'member' as const, academicYear: '', joinedAt: new Date().getFullYear().toString() };
        setNewMember(resetForm);

        try {
            const result = await addClubMember(clubId, {
                ...newMember,
                role: newMember.boardType === 'member' ? 'Member' : newMember.role,
                joinedAt: new Date(newMember.joinedAt)
            });

            if (result.success && result.memberId) {
                // Silently update the ID
                setMembers(prev => prev.map(m => m.id === tempId ? { ...m, id: result.memberId } : m));
            } else {
                throw new Error(result.error || 'Failed to add member');
            }
        } catch (error: any) {
            // Revert changes
            setMembers(prev => prev.filter(m => m.id !== tempId));
            alert(`Failed to add member: ${error.message || 'Unknown error'}`);
            // Optionally restore form state here if needed, but for now alert is sufficient backup
        }
    };

    const handleUpdateMember = async () => {
        if (!editingMember) return;

        const originalMember = members.find(m => m.id === editingMember.id);

        // Optimistic update
        setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
        setEditingMember(null);

        const success = await updateClubMember(clubId, editingMember.id!, {
            name: editingMember.name,
            email: editingMember.email,
            role: editingMember.role,
            academicYear: editingMember.academicYear,
            joinedAt: editingMember.joinedAt,
            boardType: editingMember.boardType
        });

        if (!success) {
            // Revert
            if (originalMember) {
                setMembers(prev => prev.map(m => m.id === editingMember.id ? originalMember : m));
            }
            alert('Failed to update member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        const memberToRemove = members.find(m => m.id === memberId);

        // Optimistic update
        setMembers(prev => prev.filter(m => m.id !== memberId));

        const success = await removeClubMember(clubId, memberId);
        if (!success) {
            // Revert
            if (memberToRemove) {
                setMembers(prev => [...prev, memberToRemove]);
            }
            alert('Failed to remove member');
        }
    };

    const getBoardTypeLabel = (boardType: string) => {
        return BOARD_TYPE_OPTIONS.find(b => b.value === boardType)?.label || boardType;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Export members to CSV
    const exportToCSV = () => {
        let filteredMembers = yearFilter
            ? members.filter(m => String(m.joinedAt).includes(yearFilter))
            : members;

        // Apply board type filter
        if (boardTypeFilter) {
            filteredMembers = filteredMembers.filter(m => (m.boardType || 'member') === boardTypeFilter);
        }

        // Filter out advisors
        filteredMembers = filteredMembers.filter(m => !m.role.toLowerCase().includes('advisor'));

        const sortedMembers = sortMembers(filteredMembers);

        const headers = ['Name', 'Email', 'Role', 'Board Type', 'Academic Year', 'Year Joined'];
        const rows = sortedMembers.map(m => [
            m.name,
            m.email,
            m.role,
            m.boardType || 'member',
            m.academicYear || '',
            String(m.joinedAt).substring(0, 4) // Extract just the year from ISO string or Date
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const boardLabel = boardTypeFilter ? `_${boardTypeFilter}` : '';
        link.download = `${clubName}_members${boardLabel}${yearFilter ? `_${yearFilter}` : ''}.csv`;
        link.click();
    };

    // Check if user can export (secretary or president) - handle both original role names and lowercase from membership
    const roleLC = userRole?.toLowerCase();
    const canExport = roleLC === 'club-secretary' || roleLC === 'president' || roleLC === 'secretary';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{clubName} Members</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                        {canExport && (
                            <select
                                value={boardTypeFilter}
                                onChange={(e) => setBoardTypeFilter(e.target.value)}
                                className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Boards</option>
                                <option value="main">Main Board</option>
                                <option value="executive">Executive Board</option>
                                <option value="member">Member Board</option>
                            </select>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {canExport && (
                            <button
                                onClick={exportToCSV}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-2 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                title="Export to CSV"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-xs sm:text-base">Export</span>
                            </button>
                        )}
                        {!isReadOnly && (
                            <>
                                <button
                                    onClick={() => setIsBulkImportOpen(true)}
                                    className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span className="text-xs sm:text-base">Auto Import</span>
                                </button>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="text-xs sm:text-base">Add Member</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Members List */}
            {(() => {
                let filteredMembers = yearFilter
                    ? members.filter(m => String(m.joinedAt).includes(yearFilter))
                    : members;

                // Apply board type filter to displayed list
                if (boardTypeFilter) {
                    filteredMembers = filteredMembers.filter(m => (m.boardType || 'member') === boardTypeFilter);
                }

                // Filter out advisors from the list
                filteredMembers = filteredMembers.filter(m => !m.role.toLowerCase().includes('advisor'));

                const sortedMembers = sortMembers(filteredMembers);

                return sortedMembers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">
                            {yearFilter ? `No members found for ${yearFilter}` : 'No members yet. Add your first club member!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sortedMembers.map((member) => (
                            <div
                                key={member.id}
                                className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-700"
                            >
                                {editingMember?.id === member.id && editingMember ? (
                                    // Edit mode
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Name</label>
                                                <input
                                                    value={editingMember.name}
                                                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Email</label>
                                                <input
                                                    value={editingMember.email}
                                                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Academic Year</label>
                                                <select
                                                    value={editingMember.academicYear || ''}
                                                    onChange={(e) => setEditingMember({ ...editingMember, academicYear: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Year</option>
                                                    <option value="FY">FY</option>
                                                    <option value="SY">SY</option>
                                                    <option value="TY">TY</option>
                                                    <option value="Final Year">Final Year</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Joined At</label>
                                                <input
                                                    type="date"
                                                    value={editingMember.joinedAt instanceof Date ? editingMember.joinedAt.toISOString().split('T')[0] : new Date(editingMember.joinedAt).toISOString().split('T')[0]}
                                                    onChange={(e) => setEditingMember({ ...editingMember, joinedAt: new Date(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Board</label>
                                                <select
                                                    value={editingMember.boardType || 'member'}
                                                    onChange={(e) => {
                                                        const bt = e.target.value as 'main' | 'executive' | 'member';
                                                        setEditingMember({
                                                            ...editingMember,
                                                            boardType: bt,
                                                            role: bt === 'member' ? 'Member' : editingMember.role
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {BOARD_TYPE_OPTIONS.map((bt) => (
                                                        <option key={bt.value} value={bt.value}>
                                                            {bt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {editingMember.boardType !== 'member' && (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Custom Role</label>
                                                    <input
                                                        type="text"
                                                        value={editingMember.role}
                                                        onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="App Executive"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                                            <button
                                                onClick={() => setEditingMember(null)}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-all text-sm font-semibold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateMember}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-semibold flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View mode
                                    <>
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{member.name}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${BOARD_TYPE_COLORS[member.boardType || 'member']}`}>
                                                        {getBoardTypeLabel(member.boardType || 'member')}
                                                    </span>
                                                    {member.boardType !== 'member' && (
                                                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                            {member.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                    <span className="opacity-60">✉</span> {member.email}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-4">
                                                    {member.academicYear && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="opacity-60">🎓</span> {member.academicYear}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <span className="opacity-60">📅</span> Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        {!isReadOnly && (
                                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto justify-end sm:justify-center pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => setEditingMember(member)}
                                                    className="flex-1 sm:flex-none p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-blue-100 dark:border-blue-900/30 sm:border-0"
                                                    title="Edit member"
                                                >
                                                    <Edit2 className="w-4 h-4 mx-auto" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member.id!)}
                                                    className="flex-1 sm:flex-none p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-red-100 dark:border-red-900/30 sm:border-0"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Member</h3>
                            <button
                                onClick={() => { setIsAddModalOpen(false); setFormMessage(null); }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formMessage && (
                            <div className={`p-3 rounded-lg mb-4 ${formMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                {formMessage.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Member name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="member@walchandsangli.ac.in"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Board Type
                                </label>
                                <select
                                    value={newMember.boardType}
                                    onChange={(e) => {
                                        const bt = e.target.value as 'main' | 'executive' | 'member';
                                        setNewMember({
                                            ...newMember,
                                            boardType: bt,
                                            role: bt === 'member' ? 'Member' : newMember.role
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {BOARD_TYPE_OPTIONS.map((bt) => (
                                        <option key={bt.value} value={bt.value}>
                                            {bt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {newMember.boardType !== 'member' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={newMember.role}
                                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. President, App Executive"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Academic Year
                                    </label>
                                    <select
                                        value={newMember.academicYear}
                                        onChange={(e) => setNewMember({ ...newMember, academicYear: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Year</option>
                                        <option value="FY">FY</option>
                                        <option value="SY">SY</option>
                                        <option value="TY">TY</option>
                                        <option value="Final Year">Final Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Year Joined
                                    </label>
                                    <select
                                        value={newMember.joinedAt}
                                        onChange={(e) => setNewMember({ ...newMember, joinedAt: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Year</option>
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                        <option value="2027">2027</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsAddModalOpen(false); setFormMessage(null); }}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto Import Modal */}
            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                clubId={clubId}
                clubName={clubName}
                onSuccess={() => {
                    setIsBulkImportOpen(false);
                    fetchMembers(false);
                }}
            />
        </div>
    );
}
