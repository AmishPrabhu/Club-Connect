import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { DBTask, DBClub, DBPost } from '../types/auth';
import { getClubTasks, createClubTask, updateClubTask, deleteClubTask, getClubMembers } from '../lib/dbService';

interface ClubTaskManagerProps {
    club: DBClub;
    posts: DBPost[];
    members?: any[]; // Optional now
    initialMembers?: any[]; // Add this to match usage
}

export default function ClubTaskManager({ club, posts, members: initialMembers }: ClubTaskManagerProps) {
    const [tasks, setTasks] = useState<DBTask[]>([]);
    const [members, setMembers] = useState<any[]>(initialMembers || []);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

    // Create Task State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');

    useEffect(() => {
        loadData();
    }, [club.id]);

    const loadData = async () => {
        if (!club.id) return;
        setIsLoading(true);
        const [fetchedTasks, fetchedMembers] = await Promise.all([
            getClubTasks(club.id),
            initialMembers ? Promise.resolve(initialMembers) : getClubMembers(club.id)
        ]);
        setTasks(fetchedTasks);
        if (!initialMembers) setMembers(fetchedMembers);
        setIsLoading(false);
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim() || !club.id) return;

        const assignees = newTaskAssignees.length > 0 ? newTaskAssignees : [];
        const assigneeEmails = assignees.map(name => members.find((m: any) => m.name === name)?.email).filter(Boolean) as string[];

        const relatedEvent = posts.find(p => p.id === selectedEventId);

        const { task: newTask, error } = await createClubTask({
            title: newTaskTitle,
            description: newTaskDescription,
            clubId: club.id,
            assignedTo: assignees,
            assignedToEmails: assigneeEmails,
            status: 'pending',
            deadline: newTaskDeadline || undefined,
            relatedEventId: selectedEventId || undefined,
            relatedEventTitle: relatedEvent?.title || undefined,
        });

        if (newTask) {
            setTasks([newTask, ...tasks]);
            setIsCreateModalOpen(false);
            resetForm();
        } else {
            // Show error message to user
            alert(`Failed to create task: ${error || 'Please make sure you have the necessary permissions.'}`);
        }
    };

    const resetForm = () => {
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskAssignees([]);
        setNewTaskDeadline('');
        setSelectedEventId('');
    };

    const updateStatus = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
        const { success, error } = await updateClubTask(taskId, { status: newStatus });
        if (success) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } else {
            alert(`Failed to update task: ${error || 'Unknown error'}`);
        }
    };

    const handleDelete = async (taskId: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            const success = await deleteClubTask(taskId);
            if (success) {
                setTasks(tasks.filter(t => t.id !== taskId));
            }
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        Roles & Tasks
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Manage tasks and assignments for your club</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Task
                </button>
            </div>

            {/* Stats Cards - Compact horizontal on mobile */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div onClick={() => setFilter('pending')} className={`glass-card cursor-pointer p-3 md:p-4 hover:border-blue-400/50 transition-all group ${filter === 'pending' ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pending</span>
                        <Clock className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-500" />
                    </div>
                    <p className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
                </div>
                <div onClick={() => setFilter('in-progress')} className={`glass-card cursor-pointer p-3 md:p-4 hover:border-blue-400/50 transition-all group ${filter === 'in-progress' ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">In Progress</span>
                        <AlertCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-500" />
                    </div>
                    <p className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{inProgressCount}</p>
                </div>
                <div onClick={() => setFilter('completed')} className={`glass-card cursor-pointer p-3 md:p-4 hover:border-green-400/50 transition-all group ${filter === 'completed' ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-50/50 dark:bg-green-900/20' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Completed</span>
                        <CheckCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-500" />
                    </div>
                    <p className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{completedCount}</p>
                </div>
            </div>

            {/* Task List */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h4 className="font-semibold text-slate-900 dark:text-white capitalize">{filter === 'all' ? 'All Tasks' : `${filter} Tasks`}</h4>
                    <button onClick={() => setFilter('all')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No tasks found.</div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-semibold text-slate-900 dark:text-white">{task.title}</h5>
                                            {task.relatedEventTitle && (
                                                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                                    Event: {task.relatedEventTitle}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{task.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                            {task.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                            {task.assignedTo.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    Assigned to: {task.assignedTo.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={task.status}
                                            onChange={(e) => updateStatus(task.id, e.target.value as any)}
                                            className={`text-sm rounded-lg border-slate-300 dark:border-slate-600 px-2 py-1 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${task.status === 'completed' ? 'text-green-600 font-medium' :
                                                task.status === 'in-progress' ? 'text-blue-600 font-medium' :
                                                    'text-blue-600 font-medium'
                                                }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="glass-card max-w-lg w-full p-6 my-4 animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/50">
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Task</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. Design Event Poster"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Any details..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                                    <input
                                        type="date"
                                        value={newTaskDeadline}
                                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Related Event (Optional)</label>
                                    <select
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    >
                                        <option value="">None</option>
                                        {posts.filter(p => p.type === 'event').map(event => (
                                            <option key={event.id} value={event.id}>{event.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign Members</label>
                                <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-700">
                                    {members.map((member: any) => (
                                        <label key={member.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newTaskAssignees.includes(member.name)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewTaskAssignees([...newTaskAssignees, member.name]);
                                                    } else {
                                                        setNewTaskAssignees(newTaskAssignees.filter(n => n !== member.name));
                                                    }
                                                }}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-900 dark:text-white">{member.name} <span className="text-slate-500 text-xs">({member.role})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTask}
                                disabled={!newTaskTitle.trim()}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
