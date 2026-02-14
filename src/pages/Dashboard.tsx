import { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, ChevronRight } from 'lucide-react';
import ClubCard from '../components/ClubCard';
import { DBClub } from '../types/auth';
import { getClubs, toggleClubLike } from '../lib/dbService';

interface DashboardProps {
  user: any;
  onNavigateToClub: (clubId: string) => void;
  onSignOut: () => void;
  onOpenAdvisorDashboard?: () => void;
  onOpenSecretaryDashboard?: () => void;
}

export default function Dashboard({ user, onNavigateToClub }: DashboardProps) {
  const [clubs, setClubs] = useState<DBClub[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [likedClubs, setLikedClubs] = useState<Set<string>>(new Set());

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Academic'];

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const clubsData = await getClubs();
        setClubs(clubsData);

        if (user?.likedClubs) {
          setLikedClubs(new Set(user.likedClubs));
        }
      } catch (error) {
        console.error('Error loading clubs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadClubs();
  }, [user]);

  const handleLikeToggle = async (clubId: string) => {
    if (!user?.id) return;

    const isLiked = likedClubs.has(clubId);
    const newLikedClubs = new Set(likedClubs);

    if (isLiked) {
      newLikedClubs.delete(clubId);
    } else {
      newLikedClubs.add(clubId);
    }
    setLikedClubs(newLikedClubs);

    try {
      await toggleClubLike(user.id, clubId, isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      setLikedClubs(likedClubs);
    }
  };

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || club.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen pb-20 relative overflow-hidden">
      {/* Background Environment */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="absolute top-[10%] left-[5%] w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-purple-400/30 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-blue-400/30 rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Page Header */}
      <div className="px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full">
        <div className="gradient-card p-6 md:p-10 relative overflow-hidden group">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400">Clubs</span>
              </h1>
            </div>
            <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Explore a diverse range of student-led organizations at Walchand College of Engineering. Find your passion and build your community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
        {/* Search and Filters */}
        <div className="py-6 space-y-6">
          <div className="relative max-w-2xl mx-auto md:mx-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clubs by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeCategory === category
                  ? 'bg-[#DAA520] text-white shadow-lg shadow-[#DAA520]/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Showing {filteredClubs.length} clubs
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 md:h-80 rounded-2xl md:rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"></div>
              ))}
            </div>
          ) : filteredClubs.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {filteredClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onClick={() => club.id && onNavigateToClub(club.id)}
                  isLiked={club.id ? likedClubs.has(club.id) : false}
                  onToggleLike={() => club.id && handleLikeToggle(club.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No clubs found</h3>
              <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-[#002147] to-[#003366] text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Are you a club member?</h3>
              <p className="text-slate-300">Join a club today to explore new opportunities and connect with peers.</p>
            </div>
            <button
              onClick={() => onNavigateToClub('all')}
              className="px-8 py-4 bg-white text-[#002147] rounded-2xl font-bold hover:bg-cyan-50 transition-all flex items-center gap-2 shadow-xl"
            >
              Explore All <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
