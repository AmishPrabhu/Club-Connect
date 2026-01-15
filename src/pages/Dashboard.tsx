import { useState, useEffect, useRef } from 'react';
import { Search, Filter, TrendingUp, Users, ChevronRight } from 'lucide-react';
import ClubCard from '../components/ClubCard';
import { DBClub } from '../types/auth';
import { getClubs, getPosts } from '../lib/dbService';

interface DashboardProps {
  onNavigateToClub: (clubId: string) => void;
}

export default function Dashboard({ onNavigateToClub }: DashboardProps) {
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

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory;
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
    onNavigateToClub(clubId);
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-12" id="tour-dashboard-stats">
      <div className="mb-4 md:mb-12">
        <div className="flex items-center gap-2 mb-3 md:mb-6">
          <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white">
            All Clubs
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center z-20 relative">
          <div className="relative flex-1 w-full" ref={dropdownRef}>
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchQuery.length > 0) setShowDropdown(true); }}
              className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg md:rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md md:shadow-lg text-sm"
            />

            {/* Live Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {club.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-md">
                              {club.category.charAt(0).toUpperCase() + club.category.slice(1)} • {club.upcomingEvents || 0} events
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
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

          <div className="flex items-center gap-1.5 md:gap-2 bg-white dark:bg-slate-800 p-1 md:p-2 rounded-lg md:rounded-xl shadow-md md:shadow-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 md:w-5 md:h-5 text-slate-600 dark:text-slate-400 ml-1 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 md:px-4 py-1 md:py-2 rounded-md md:rounded-lg font-semibold text-[10px] md:text-sm transition-all whitespace-nowrap ${selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
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
          <div className="mb-3 md:mb-4 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'}
          </div>
          {/* Mobile: 2 columns with tight gap, Desktop: 3 columns */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club} onClick={() => onNavigateToClub(club.id!)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
