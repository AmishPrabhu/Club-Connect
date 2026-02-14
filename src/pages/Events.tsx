import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronDown, Filter, Settings } from 'lucide-react';
import ImageModal from '../components/ImageModal';
import { DBPost, DBClub, User } from '../types/auth';
import { getPosts, getClubs } from '../lib/dbService';

interface EventsProps {
    onNavigateToPost: (postId: string) => void;
    user?: User | null;
    onManageEvent?: (eventId: string) => void;
}

export default function Events({ onNavigateToPost, user, onManageEvent }: EventsProps) {
    const [posts, setPosts] = useState<DBPost[]>([]);
    const [clubs, setClubs] = useState<DBClub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [clubFilter, setClubFilter] = useState<string>('all');
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

    const filteredPosts = posts.filter(post => {
        const now = new Date();
        const postDate = new Date(post.date || '');
        if (statusFilter === 'upcoming' && postDate < now) return false;
        if (statusFilter === 'completed' && postDate >= now) return false;
        if (clubFilter !== 'all' && post.clubName !== clubFilter) return false;
        return true;
    });

    const visiblePosts = filteredPosts.slice(0, visibleCount);
    const hasMorePosts = visibleCount < filteredPosts.length;
    const allClubNames = clubs.map(c => c.name).sort();

    const handleStatusFilterChange = (status: 'all' | 'upcoming' | 'completed') => {
        setStatusFilter(status);
        setVisibleCount(15);
    };

    const handleClubFilterChange = (club: string) => {
        setClubFilter(club);
        setVisibleCount(15);
    };

    return (
        <div className="flex flex-col min-h-screen pb-28 relative overflow-hidden">
            {/* Background Environment */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
                <div className="absolute top-[10%] left-[5%] w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
                <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-purple-400/30 rounded-full animate-pulse delay-700"></div>
                <div className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-blue-400/30 rounded-full animate-pulse delay-1000"></div>
            </div>
            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage || ''}
            />

            {/* Page Header */}
            <div className="px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full">
                <div className="gradient-card p-6 md:p-10 relative overflow-hidden group">
                    {/* Background Glows */}
                    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                                Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400">Events</span>
                            </h1>
                        </div>
                        <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                            Stay updated with the latest happenings at Walchand College of Engineering. Join workshops, competitions, and social gatherings.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
                <div className="py-4 md:py-6">
                    {/* Filters */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        {/* Status Filter Chips */}
                        <div className="flex overflow-x-auto scrollbar-hide gap-1.5 md:gap-2 pb-2 -mx-3 px-3 md:mx-0 md:px-0">
                            {(['all', 'upcoming', 'completed'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusFilterChange(status)}
                                    className={`px-3 md:px-5 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 ${statusFilter === status
                                            ? 'bg-[#002147] text-white shadow-lg shadow-[#002147]/20 border border-[#002147]'
                                            : 'glass-card text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm'
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
                                className="w-full appearance-none glass-input rounded-xl pl-10 pr-10 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002147]/20 cursor-pointer shadow-sm hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all border border-slate-200 dark:border-white/10"
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
                        <div className="text-center py-20 glass-card rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No events found</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                {posts.length === 0 ? 'No events have been created yet.' : 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {visiblePosts.map((post) => {
                                const club = clubs.find(c => c.name === post.clubName);
                                const isUpcoming = post.date ? new Date(post.date).getTime() >= new Date().getTime() : false;
                                const canManage = user && (
                                    user.role === 'admin' ||
                                    ((user.role === 'club-secretary' || user.role === 'president' || user.role === 'treasurer') && user.clubId === post.clubId)
                                );

                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => post.id && onNavigateToPost(post.id)}
                                        className="group glass-card glass-card-hover rounded-3xl overflow-hidden cursor-pointer relative duration-300 border border-slate-200 dark:border-white/10 hover:shadow-xl"
                                    >
                                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                {club?.image ? (
                                                    <img src={club.image} alt={club.name} className="w-8 h-8 rounded-lg object-contain bg-white shadow-sm p-0.5" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                        <Calendar className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{post.clubName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canManage && onManageEvent && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (post.id) onManageEvent(post.id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-[#002147] dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {isUpcoming ? (
                                                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                                                        Upcoming
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-600">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row h-full">
                                            <div
                                                className="w-full md:w-[40%] h-56 md:h-auto relative shrink-0 overflow-hidden"
                                                onClick={(e) => post.coverImage && handleImageClick(e, post.coverImage)}
                                            >
                                                {post.coverImage ? (
                                                    <img
                                                        src={post.coverImage}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${getEventColor(post.type)} flex items-center justify-center`}>
                                                        <Calendar className="w-16 h-16 text-white/40" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-xl shadow-lg flex flex-col items-center border border-slate-100 dark:border-slate-800">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                        {post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'short' }) : '---'}
                                                    </span>
                                                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                                        {post.date ? new Date(post.date).getDate() : '--'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1 p-6 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-[#002147] dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                                                        {post.title}
                                                    </h3>

                                                    <div className="space-y-3 mb-6">
                                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                                            <Clock className="w-4 h-4 text-purple-500" />
                                                            <span className="text-sm font-medium">{post.time || 'All Day'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                                            <MapPin className="w-4 h-4 text-purple-500" />
                                                            <span className="text-sm font-medium truncate">{post.location || 'Campus'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button className="w-full py-3 bg-[#002147] hover:bg-[#003366] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {hasMorePosts && (
                                <div className="text-center pt-8">
                                    <button
                                        onClick={loadMoreEvents}
                                        className="inline-flex items-center gap-2 px-8 py-3 glass-card text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all shadow-sm"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                        Load More Events
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
