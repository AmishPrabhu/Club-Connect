import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ArrowLeft, ChevronDown, Filter, Settings } from 'lucide-react';
import ImageModal from '../components/ImageModal';
import { DBPost, DBClub, User } from '../types/auth';
import { getPosts, getClubs } from '../lib/dbService';

interface EventsProps {
    onBack: () => void;
    onNavigateToPost: (postId: string) => void;
    user?: User | null;
    onManageEvent?: (eventId: string) => void;
}



// ... existing imports

export default function Events({ onBack, onNavigateToPost, user, onManageEvent }: EventsProps) {
    // ... existing state
    const [posts, setPosts] = useState<DBPost[]>([]);
    const [clubs, setClubs] = useState<DBClub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [clubFilter, setClubFilter] = useState<string>('all');



    // ... existing useEffect and helpers

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();
        setSelectedImage(imageUrl);
    };


    useEffect(() => {
        const loadData = async () => {
            try {
                const [postsData, clubsData] = await Promise.all([
                    getPosts(),
                    getClubs()
                ]);
                // Filter only events (not announcements) and sort by date (newest first)
                const events = postsData
                    .filter(p => p.type === 'event' && p.date)
                    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
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
        const postDate = new Date(post.date || '');

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
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage || ''}
            />
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-6 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white transition-colors font-medium text-sm md:text-base"
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        Back to Home
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[#002147]/5 rounded-lg">
                                    <Calendar className="w-6 h-6 text-[#002147] dark:text-blue-400" />
                                </div>
                                <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                                    Campus Events
                                </h1>
                            </div>
                            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                                {filteredPosts.length === posts.length
                                    ? `Browse all ${posts.length} upcoming activities`
                                    : `Showing ${filteredPosts.length} of ${posts.length} events`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
                <div className="py-4 md:py-6">
                    {/* Filters */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4" id="tour-events-filter">
                        {/* Status Filter Chips */}
                        <div className="flex overflow-x-auto scrollbar-hide gap-1.5 md:gap-2 pb-2 -mx-3 px-3 md:mx-0 md:px-0">
                            {(['all', 'upcoming', 'completed'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusFilterChange(status)}
                                    className={`px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-md md:rounded-lg font-bold text-xs md:text-sm transition-all border whitespace-nowrap flex-shrink-0 ${statusFilter === status
                                        ? 'bg-[#002147] text-white border-[#002147] shadow-md'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Club Filter Dropdown */}
                        <div className="relative flex-1 md:max-w-xs md:ml-auto">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <select
                                value={clubFilter}
                                onChange={(e) => handleClubFilterChange(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl pl-9 md:pl-10 pr-10 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002147] dark:focus:ring-blue-500 cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
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
                                const isUpcoming = post.date ? new Date(post.date).getTime() >= new Date().getTime() : false;

                                // Check permissions
                                const canManage = user && (
                                    user.role === 'admin' ||
                                    ((user.role === 'club-secretary' || user.role === 'president' || user.role === 'treasurer') && user.clubId === post.clubId)
                                );

                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => post.id && onNavigateToPost(post.id)}
                                        className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer relative hover:-translate-y-1 duration-300"
                                    >
                                        {/* Card Header */}
                                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                {club?.image ? (
                                                    <img src={club.image} alt={club.name} className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-700 shadow-sm p-0.5" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                        <Calendar className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-900 dark:text-white font-serif truncate max-w-[150px] md:max-w-none">{post.clubName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canManage && onManageEvent && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (post.id) onManageEvent(post.id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-[#002147] dark:hover:text-blue-400 transition-colors"
                                                        title="Manage Event"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {isUpcoming ? (
                                                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                        Upcoming
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row">
                                            {/* Event Image - Full Width Mobile, 40% Desktop */}
                                            <div
                                                className={`w-full md:w-[40%] h-56 md:h-auto relative z-20 bg-slate-100 dark:bg-slate-900 overflow-hidden group/image flex-shrink-0 ${post.coverImage ? 'cursor-pointer' : ''}`}
                                                onClick={(e) => post.coverImage && handleImageClick(e, post.coverImage)}
                                            >
                                                {post.coverImage ? (
                                                    <>
                                                        <img
                                                            src={post.coverImage}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover/image:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 duration-300 pointer-events-none">
                                                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Click to expand</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${getEventColor(post.type)} flex items-center justify-center`}>
                                                        <Calendar className="w-16 h-16 text-white/40" />
                                                    </div>
                                                )}
                                                {/* Date Overlay (Mobile & Desktop) */}
                                                <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg flex flex-col items-center border border-slate-100 dark:border-slate-700 pointer-events-none">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'short' }) : '---'}</span>
                                                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{post.date ? new Date(post.date).getDate() : '--'}</span>
                                                </div>
                                            </div>

                                            {/* Event Details */}
                                            <div className="flex-1 min-w-0 max-w-full p-5 md:p-6 flex flex-col justify-between bg-white dark:bg-slate-800">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-all w-full">
                                                        {post.title}
                                                    </h3>

                                                    <div className="space-y-4 mb-6">
                                                        {/* Date Row (Desktop) */}
                                                        <div className="hidden md:flex items-start gap-4">
                                                            <div className="mt-1"><Calendar className="w-5 h-5 text-blue-500" /></div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                                                    {post.date ? new Date(post.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date not specified'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Time Row */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="mt-1"><Clock className="w-5 h-5 text-blue-500" /></div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
                                                                <p className="font-medium text-slate-700 dark:text-slate-300">{post.time || 'All Day'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Venue Row */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="mt-1"><MapPin className="w-5 h-5 text-blue-500" /></div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Venue</p>
                                                                <p className="font-medium text-slate-700 dark:text-slate-300">{post.location || 'Campus'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-auto">
                                                    <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
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

                </div>
            </div>
        </div>
    );
}
