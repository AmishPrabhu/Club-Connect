import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Megaphone, Filter } from 'lucide-react';
import { DBPost, DBClub } from '../types/auth';
import { Page } from '../types/page';
import { getPosts, getClubs } from '../lib/dbService';
import ImageModal from '../components/ImageModal';

interface AnnouncementsProps {
    onNavigateToPost: (postId: string, returnTo?: { page: Page; params?: Record<string, string> }) => void;
}

export default function Announcements({ onNavigateToPost }: AnnouncementsProps) {
    const [posts, setPosts] = useState<DBPost[]>([]);
    const [clubs, setClubs] = useState<DBClub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);
    const [clubFilter, setClubFilter] = useState<string>('all');
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openImageModal = (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();
        setModalImage(imageUrl);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [postsData, clubsData] = await Promise.all([
                    getPosts(),
                    getClubs()
                ]);
                const announcements = postsData
                    .filter(p => p.type === 'announcement')
                    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
                setPosts(announcements);
                setClubs(clubsData);
            } catch (error) {
                console.error('Error loading announcements:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const loadMore = () => {
        setVisibleCount(prev => prev + 5);
    };

    const filteredPosts = posts.filter(post => {
        if (clubFilter !== 'all' && post.clubName !== clubFilter) return false;
        return true;
    });

    const visiblePosts = filteredPosts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredPosts.length;
    const allClubNames = clubs.map(c => c.name).sort();

    const handleClubFilterChange = (club: string) => {
        setClubFilter(club);
        setVisibleCount(15);
    };

    return (
        <div className="flex flex-col min-h-screen pb-20 relative overflow-hidden">
            {/* Background Environment */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
                <div className="absolute top-[10%] left-[5%] w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
                <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-purple-400/30 rounded-full animate-pulse delay-700"></div>
                <div className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-blue-400/30 rounded-full animate-pulse delay-1000"></div>
            </div>
            <ImageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={modalImage || ''}
            />

            {/* Page Header */}
            <div className="px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full">
                <div className="gradient-card p-6 md:p-10 relative overflow-hidden group">


                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                                <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                                Latest <span className="text-blue-700 dark:text-blue-400">Announcements</span>
                            </h1>
                        </div>
                        <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                            Never miss an update from your favorite clubs. Get real-time notifications about registrations, deadlines, and results.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="py-4 md:py-6">
                    {/* Filters */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 md:max-w-xs">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <select
                                value={clubFilter}
                                onChange={(e) => handleClubFilterChange(e.target.value)}
                                className="w-full appearance-none bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/40 rounded-xl pl-10 pr-10 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002147]/20 cursor-pointer shadow-sm hover:border-slate-300 transition-all"
                            >
                                <option value="all">All Clubs</option>
                                {allClubNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="hidden md:flex ml-auto items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {filteredPosts.length} announcements found
                        </div>
                    </div>

                    {/* Announcements List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-20 glass-card rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <Megaphone className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No Announcements Found</h3>
                            <p className="text-slate-500 dark:text-slate-500">
                                Try adjusting your filters or check back later.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visiblePosts.map((post) => (
                                <div
                                    key={post.id}
                                    onClick={() => onNavigateToPost(post.id!)}
                                    className="group glass-card glass-card-hover rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/5 cursor-pointer"
                                >
                                    <div className="flex flex-col sm:flex-row">
                                        {post.coverImage ? (
                                            <div
                                                className="sm:w-1/4 h-40 sm:h-auto relative bg-slate-200 dark:bg-slate-700 overflow-hidden"
                                                onClick={(e) => openImageModal(e, post.coverImage!)}
                                            >
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            </div>
                                        ) : (
                                            <div className="sm:w-1/4 h-40 sm:h-auto flex flex-col justify-center items-center relative overflow-hidden bg-[#002147] border-r border-slate-200/10">
                                                <div className="relative z-10 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-2">
                                                    <Megaphone className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <span className="relative z-10 text-[10px] font-bold text-blue-600 uppercase tracking-widest">Announcement</span>
                                            </div>
                                        )}

                                        <div className="flex-1 p-6">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-bold text-[#002147] dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                                                        {post.content}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                                        <span className="text-[#002147] dark:text-blue-400 uppercase tracking-wider">{post.clubName}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span>{new Date(post.date || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>

                                                {post.relatedEventId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onNavigateToPost(post.relatedEventId!, { page: 'announcements' });
                                                        }}
                                                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#002147] text-white text-xs font-bold rounded-xl hover:bg-[#003366] transition-all self-start md:self-center"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        View Event
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {hasMore && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        className="px-8 py-3 bg-[#002147] text-white rounded-xl font-bold shadow-md hover:bg-[#003366] transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <ChevronDown className="w-5 h-5" />
                                        Load More
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
