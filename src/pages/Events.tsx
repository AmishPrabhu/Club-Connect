import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ArrowLeft, ChevronDown, Filter, Settings } from 'lucide-react';
import { DBPost, DBClub, User } from '../types/auth';
import { getPosts, getClubs } from '../lib/dbService';

interface EventsProps {
    onBack: () => void;
    onNavigateToPost: (postId: string) => void;
    user?: User | null;
    onManageEvent?: (eventId: string) => void;
}

import ImageModal from '../components/ImageModal';

// ... existing imports

export default function Events({ onBack, onNavigateToPost, user, onManageEvent }: EventsProps) {
    // ... existing state
    const [posts, setPosts] = useState<DBPost[]>([]);
    const [clubs, setClubs] = useState<DBClub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [clubFilter, setClubFilter] = useState<string>('all');

    // Image Modal State
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openImageModal = (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();
        setModalImage(imageUrl);
        setIsModalOpen(true);
    };

    // ... existing useEffect and helpers


    useEffect(() => {
        const loadData = async () => {
            try {
                const [postsData, clubsData] = await Promise.all([
                    getPosts(),
                    getClubs()
                ]);
                // Filter only events (not announcements) and sort by date (newest first)
                const events = postsData
                    .filter(p => p.type === 'event')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setPosts(events);
                setClubs(clubsData);
            } catch (error) {
                console.error('Error loading events:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const getEventColor = (type: string) => {
        switch (type) {
            case 'event': return 'from-blue-500 to-cyan-500';
            case 'announcement': return 'from-purple-500 to-pink-500';
            default: return 'from-amber-500 to-orange-500';
        }
    };

    const loadMoreEvents = () => {
        setVisibleCount(prev => prev + 5);
    };

    // Filter posts based on status and club
    const filteredPosts = posts.filter(post => {
        const now = new Date();
        const postDate = new Date(post.date);

        // Status filter
        if (statusFilter === 'upcoming' && postDate < now) return false;
        if (statusFilter === 'completed' && postDate >= now) return false;

        // Club filter
        if (clubFilter !== 'all' && post.clubName !== clubFilter) return false;

        return true;
    });

    const visiblePosts = filteredPosts.slice(0, visibleCount);
    const hasMorePosts = visibleCount < filteredPosts.length;

    // Get all club names from backend for the dropdown
    const allClubNames = clubs.map(c => c.name).sort();

    // Reset visible count when filters change
    const handleStatusFilterChange = (status: 'all' | 'upcoming' | 'completed') => {
        setStatusFilter(status);
        setVisibleCount(15);
    };

    const handleClubFilterChange = (club: string) => {
        setClubFilter(club);
        setVisibleCount(15);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-8 md:py-12 mb-8">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#002147] dark:hover:text-blue-400 transition-colors mb-6 text-sm font-bold uppercase tracking-wide"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#002147] rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                            <Calendar className="w-7 h-7 text-[#DAA520]" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">Campus Events</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                {filteredPosts.length === posts.length
                                    ? `Browse all ${posts.length} upcoming activities and sessions.`
                                    : `Showing ${filteredPosts.length} of ${posts.length} events`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 w-full">
                {/* Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4" id="tour-events-filter">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            onClick={() => handleStatusFilterChange('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'all'
                                ? 'bg-[#002147] text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleStatusFilterChange('upcoming')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'upcoming'
                                ? 'bg-[#002147] text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => handleStatusFilterChange('completed')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'completed'
                                ? 'bg-[#002147] text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            Completed
                        </button>
                    </div>

                    {/* Club Filter Dropdown */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <select
                            value={clubFilter}
                            onChange={(e) => handleClubFilterChange(e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002147] dark:focus:ring-blue-500 cursor-pointer shadow-sm"
                        >
                            <option value="all">All Clubs</option>
                            {allClubNames.map((clubName: string) => (
                                <option key={clubName} value={clubName}>{clubName}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Events List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No events found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {posts.length === 0 ? 'No events have been created yet.' : 'Try adjusting your filters.'}
                        </p>
                        {posts.length > 0 && (
                            <button
                                onClick={() => { setStatusFilter('all'); setClubFilter('all'); }}
                                className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {visiblePosts.map((post) => {
                            const club = clubs.find(c => c.name === post.clubName);
                            const isUpcoming = new Date(post.date) >= new Date();

                            // Check permissions
                            const canManage = user && (
                                user.role === 'admin' ||
                                ((user.role === 'club-secretary' || user.role === 'president' || user.role === 'treasurer') && user.clubId === post.clubId)
                            );

                            return (
                                <div
                                    key={post.id}
                                    onClick={() => post.id && onNavigateToPost(post.id)}
                                    className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 cursor-pointer relative hover:-translate-y-1"
                                >
                                    <div className="flex flex-col md:flex-row h-full">
                                        {/* Date Badge Column (Left) */}
                                        <div className="md:w-32 bg-[#002147]/5 dark:bg-blue-900/10 flex flex-row md:flex-col items-center justify-between md:justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                                            <div className="flex md:flex-col items-center gap-2 md:gap-0">
                                                <span className="text-sm font-bold text-[#002147] dark:text-blue-400 uppercase tracking-wider md:mb-1">
                                                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-2xl md:text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                                                    {new Date(post.date).getDate()}
                                                </span>
                                            </div>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 md:mt-2 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                {new Date(post.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                        </div>

                                        {/* Content Column (Middle) */}
                                        <div className="flex-1 p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {club?.image ? (
                                                        <img src={club.image} alt={club.name} className="w-5 h-5 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{post.clubName}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {canManage && onManageEvent && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                post.id && onManageEvent(post.id);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-[#002147] transition-colors"
                                                            title="Manage Event"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isUpcoming && (
                                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                            Upcoming
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-4 group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors">
                                                {post.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-[#DAA520]" />
                                                    <span>{post.time || 'Time TBA'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-[#DAA520]" />
                                                    <span>{post.location || 'Campus Location'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image/Action Column (Right) */}
                                        <div className="md:w-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            {post.coverImage ? (
                                                <div className="w-full h-40 md:h-full relative group/image">
                                                    <img
                                                        src={post.coverImage}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-[#002147]/0 group-hover:bg-[#002147]/20 transition-colors" />
                                                </div>
                                            ) : (
                                                <div className={`w-full h-40 md:h-full flex items-center justify-center bg-gradient-to-br ${getEventColor(post.type)} opacity-10 group-hover:opacity-20 transition-opacity`}>
                                                    <Calendar className="w-12 h-12 text-[#002147]" />
                                                </div>
                                            )}

                                            {/* Hover Action */}
                                            <div className="absolute bottom-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                                                <button className="bg-white dark:bg-slate-900 text-[#002147] dark:text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg border border-slate-100">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More Button */}
                        {hasMorePosts && (
                            <div className="text-center pt-8">
                                <button
                                    onClick={loadMoreEvents}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#002147] hover:text-[#002147] transition-all shadow-sm hover:shadow-md"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    Load More Events
                                </button>
                            </div>
                        )}

                        {/* End of list message */}
                        {!hasMorePosts && filteredPosts.length > 0 && (
                            <div className="text-center py-12">
                                <span className="inline-block px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    End of List
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {/* Image Modal */}
                <ImageModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    imageUrl={modalImage || ''}
                />
            </div>
        </div>
    );
}
