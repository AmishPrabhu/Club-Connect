import { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, ChevronDown, Megaphone, Filter } from 'lucide-react';
import { DBPost, DBClub } from '../types/auth';
import { Page } from '../types/page';
import { getPosts, getClubs } from '../lib/dbService';

interface AnnouncementsProps {
    onBack: () => void;
    onNavigateToPost: (postId: string, returnTo?: { page: Page; params?: Record<string, string> }) => void;
}

import ImageModal from '../components/ImageModal';

// ... existing imports

export default function Announcements({ onBack, onNavigateToPost }: AnnouncementsProps) {
    // ... existing state
    const [posts, setPosts] = useState<DBPost[]>([]);
    const [clubs, setClubs] = useState<DBClub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(15);
    const [clubFilter, setClubFilter] = useState<string>('all');

    // Image Modal State
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openImageModal = (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();
        setModalImage(imageUrl);
        setIsModalOpen(true);
    };

    // ... existing useEffect


    useEffect(() => {
        const loadData = async () => {
            try {
                const [postsData, clubsData] = await Promise.all([
                    getPosts(),
                    getClubs()
                ]);
                // Filter only announcements and sort by date (newest first)
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

    // Filter posts based on club
    const filteredPosts = posts.filter(post => {
        if (clubFilter !== 'all' && post.clubName !== clubFilter) return false;
        return true;
    });

    const visiblePosts = filteredPosts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredPosts.length;

    // Get all club names from backend for the dropdown
    const allClubNames = clubs.map(c => c.name).sort();

    const handleClubFilterChange = (club: string) => {
        setClubFilter(club);
        setVisibleCount(15);
    };

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <ImageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={modalImage || ''}
            />

            {/* Page Header */}
            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-6 md:py-12">
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
                                    <Megaphone className="w-6 h-6 text-[#002147] dark:text-blue-400" />
                                </div>
                                <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                                    Announcements
                                </h1>
                            </div>
                            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                                {filteredPosts.length === posts.length
                                    ? `Stay updated with latest announcements from all ${clubs.length} clubs`
                                    : `Showing ${filteredPosts.length} announcements matching your filters`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="py-4 md:py-6 px-3 md:px-4">
                    {/* Filters */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4" id="tour-announcements-filter">
                        {/* Club Filter Dropdown */}
                        <div className="relative flex-1 md:max-w-xs">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <select
                                value={clubFilter}
                                onChange={(e) => handleClubFilterChange(e.target.value)}
                                className="w-full appearance-none bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/40 rounded-lg md:rounded-xl pl-9 md:pl-10 pr-10 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002147] dark:focus:ring-blue-500 cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                            >
                                <option value="all">All Clubs</option>
                                {allClubNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Results count (Desktop) */}
                        <div className="hidden md:flex ml-auto items-center text-sm text-slate-500 dark:text-slate-400">
                            {filteredPosts.length} announcements found
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-20">
                            <Megaphone className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No Announcements Found</h3>
                            <p className="text-slate-500 dark:text-slate-500">
                                {clubFilter !== 'all'
                                    ? 'Try changing the filter to see more announcements'
                                    : 'Check back later for announcements from clubs'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Announcements List */}
                            <div className="space-y-4" id="tour-announcements-list">
                                {visiblePosts.map((post) => (
                                    <div
                                        key={post.id}
                                        onClick={() => onNavigateToPost(post.id!)}
                                        className="group bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-700/40 hover:shadow-xl transition-all cursor-pointer"
                                    >
                                        <div className="flex flex-col sm:flex-row">
                                            {/* Left: Cover Image or Styled Icon */}
                                            {post.coverImage ? (
                                                <div
                                                    className="sm:w-1/4 h-40 sm:h-auto relative bg-slate-200 dark:bg-slate-700 flex-shrink-0 group/image overflow-hidden"
                                                    onClick={(e) => openImageModal(e, post.coverImage!)}
                                                >
                                                    <img
                                                        src={post.coverImage}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover/image:scale-110 cursor-zoom-in"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 duration-300 pointer-events-none">
                                                        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Click to expand</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="sm:w-1/4 h-40 sm:h-auto flex flex-col justify-center items-center relative overflow-hidden bg-[#002147] flex-shrink-0 min-h-[120px] border-r border-[#DAA520]">
                                                    {/* Decorative floating circles */}
                                                    <div className="absolute top-4 right-4 w-16 h-16 bg-[#DAA520]/20 rounded-full blur-sm" />
                                                    <div className="absolute bottom-4 left-4 w-10 h-10 bg-white/10 rounded-full blur-sm" />

                                                    {/* Icon */}
                                                    <div className="relative z-10 w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-[#DAA520]/50">
                                                        <Megaphone className="w-7 h-7 text-[#DAA520]" />
                                                    </div>

                                                    {/* Type label */}
                                                    <span className="relative z-10 text-xs font-serif font-bold text-[#DAA520] uppercase tracking-widest">
                                                        Announcement
                                                    </span>
                                                </div>
                                            )}

                                            {/* Right: Details */}
                                            <div className="sm:w-3/4 p-6 flex flex-col justify-center">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold font-serif text-[#002147] dark:text-white mb-2 group-hover:text-[#DAA520] transition-colors">
                                                            {post.title}
                                                        </h3>

                                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                                                            {post.content}
                                                        </p>

                                                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                            <span className="font-bold text-[#002147] dark:text-blue-400">{post.clubName}</span>
                                                            <span>•</span>
                                                            <span>{new Date(post.date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                        </div>
                                                    </div>

                                                    {/* Related Event Button - Right Side */}
                                                    {post.relatedEventTitle && post.relatedEventId && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onNavigateToPost(post.relatedEventId!, { page: 'announcements' });
                                                            }}
                                                            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-[#002147] hover:bg-[#00152e] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] border border-[#00152e]"
                                                        >
                                                            <Calendar className="w-5 h-5 text-[#DAA520]" />
                                                            <span>View Related Event</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        className="px-6 py-3 bg-[#002147] hover:bg-[#00152e] text-white rounded-lg font-bold transition-colors flex items-center gap-2 mx-auto uppercase tracking-wide shadow-md"
                                    >
                                        <ChevronDown className="w-5 h-5 text-[#DAA520]" />
                                        Load More Announcements
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    {/* Image Modal */}
                    <ImageModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        imageUrl={modalImage || ''}
                    />
                </div>
            </div>
        </div>
    );
}
