import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import ClubCard from '../components/ClubCard';
import { DBClub } from '../types/auth';
import { getClubs, getPosts, toggleClubLike } from '../lib/dbService';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigateToClub: (clubId: string, slug?: string) => void;
  onBack?: () => void;
}

export default function Dashboard({ onNavigateToClub, onBack }: DashboardProps) {
  const { user, updateUser } = useAuth();
  const [clubs, setClubs] = useState<DBClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ['all', 'technical', 'cultural', 'sports', 'academic'];

  // Fetch clubs and posts from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clubsData, postsData] = await Promise.all([
          getClubs(),
          getPosts()
        ]);

        // Calculate total events for each club
        const clubsWithCounts = clubsData.map(club => {
          const clubEventsCount = postsData.filter(post =>
            post.clubId === club.id
          ).length;

          return {
            ...club,
            upcomingEvents: clubEventsCount // Overwrite with total count
          };
        });

        setClubs(clubsWithCounts);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleLike = async (clubId: string, isLiked: boolean) => {
    if (!user) return; // Should prompt login?

    // Optimistically update global user state so Profile reflects it immediately
    // isLiked is the OLD state (before toggle) passed from ClubCard
    // If it WAS liked, we are removing it.
    let newLikedClubs = user.likedClubs || [];
    if (isLiked) {
      newLikedClubs = newLikedClubs.filter(id => id !== clubId);
    } else {
      newLikedClubs = [...newLikedClubs, clubId];
    }

    updateUser({ likedClubs: newLikedClubs });

    // API Call
    await toggleClubLike(user.id, clubId, isLiked);
  };

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Case-insensitive category check
    const clubCategory = (club.category || '').toLowerCase();
    const targetCategory = selectedCategory.toLowerCase();

    const matchesCategory = selectedCategory === 'all' || clubCategory === targetCategory;
    return matchesSearch && matchesCategory;
  });

  const searchResults = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  const handleResultClick = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    onNavigateToClub(clubId, club?.slug);
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen pb-20 scroll-mt-32 relative" id="tour-dashboard-stats">
      {/* Page-level floating dots */}
      <div className="page-dots">
        <div className="float-dot w-3 h-3 bg-cyan-400 top-[10%] right-[10%] animate-float-slow opacity-60"></div>
        <div className="float-dot w-2 h-2 bg-[#DAA520] top-[30%] right-[30%] animate-float-medium opacity-50"></div>
        <div className="float-dot w-1.5 h-1.5 bg-purple-400 top-[50%] left-[80%] animate-float-fast opacity-40"></div>
        <div className="float-dot w-2.5 h-2.5 bg-blue-300 top-[70%] left-[15%] animate-float-medium opacity-45" style={{ animationDelay: '1s' }}></div>
        <div className="float-dot w-2 h-2 bg-pink-300 top-[85%] right-[50%] animate-float-slow opacity-35" style={{ animationDelay: '2s' }}></div>
        <div className="float-dot w-1.5 h-1.5 bg-teal-400 top-[60%] left-[35%] animate-float-fast opacity-40" style={{ animationDelay: '1.5s' }}></div>
      </div>
      {/* Page Header */}
      <div className="relative overflow-hidden px-4 md:px-6 py-6 md:py-12">
        <div className="max-w-7xl mx-auto relative z-10">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white transition-colors font-medium text-sm md:text-base"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              Back to Home
            </button>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#002147]/5 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-[#002147] dark:text-blue-400" />
                </div>
                <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                  Discover Clubs
                </h1>
              </div>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                Explore the diverse range of student organizations at Walchand College of Engineering. Find your community and get involved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="py-4 md:py-6">
          {/* Search Bar */}
          <div className="relative mb-4 md:mb-6" id="tour-search-bar">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clubs by name, category, or description..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchQuery.length > 0) setShowDropdown(true); }}
              className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-4 glass-input rounded-lg md:rounded-xl text-sm md:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 transition-all shadow-sm focus:shadow-lg"
            />

            {/* Live Search Dropdown */}
            {showDropdown && (
              <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/40 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      Clubs
                    </div>
                    {searchResults.map((club) => (
                      <button
                        key={club.id}
                        onClick={() => handleResultClick(club.id!)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {club.image ? (
                              <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors">
                              {club.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-md">
                              {club.category.charAt(0).toUpperCase() + club.category.slice(1)} • {club.upcomingEvents || 0} events
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002147] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No clubs found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Category Filter */}
          <div className="mb-4 md:mb-6">
            <div className="flex overflow-x-auto scrollbar-hide gap-1.5 md:gap-2 pb-2 -mx-3 px-3 md:mx-0 md:px-0">
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-md md:rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 ${selectedCategory === category
                    ? 'bg-[#DAA520] text-white shadow-md border border-[#DAA520]'
                    : 'glass-card text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80'
                    }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                {clubs.length === 0 ? 'No clubs yet' : 'No clubs found matching your criteria'}
              </p>
              {clubs.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Clubs will appear here once an admin creates them.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {filteredClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onClick={() => onNavigateToClub(club.id!, club.slug)}
                    isLiked={user?.likedClubs?.includes(club.id!)}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
