import { useState, useEffect } from 'react';
import { Calendar, Bell, Users, Heart, Search, Sparkles, Edit, MapPin, Clock } from 'lucide-react';
import { Page } from '../types/page';
import { FirestorePost, FirestoreClub, FirestoreNotification } from '../types/auth';
import { getPosts, getNotifications, getClubs } from '../lib/firestoreService';
import ClubCard from '../components/ClubCard';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onNavigateToClub: (clubId: string) => void;
  onNavigateToEvent: (eventId: string) => void;
  onNavigateToPost: (postId: string) => void;
  onNavigateToNotification: (notification: FirestoreNotification) => void;
}

export default function Home({ onNavigate, onNavigateToClub, onNavigateToPost, onNavigateToNotification }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [clubs, setClubs] = useState<FirestoreClub[]>([]);
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FirestorePost[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<FirestoreClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsData, clubsData, notificationsData] = await Promise.all([
          getPosts(),
          getClubs(),
          getNotifications()
        ]);

        // Sync member counts for all clubs
        const { syncClubMemberCount } = await import('../lib/firestoreService');
        const clubsWithSyncedCounts = await Promise.all(
          clubsData.map(async (club) => {
            if (club.id) {
              const actualCount = await syncClubMemberCount(club.id);
              return { ...club, members: actualCount };
            }
            return club;
          })
        );

        setPosts(postsData);
        setClubs(clubsWithSyncedCounts);
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = () => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchingClubs = clubs.filter(club =>
      club.name.toLowerCase().includes(lowerQuery) ||
      club.description.toLowerCase().includes(lowerQuery)
    );
    const matchingPosts = posts.filter(post =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.type.toLowerCase().includes(lowerQuery)
    );

    setFilteredClubs(matchingClubs);
    setFilteredPosts(matchingPosts);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'event': return 'from-blue-500 to-cyan-500';
      case 'announcement': return 'from-purple-500 to-pink-500';
      default: return 'from-amber-500 to-orange-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Welcome to the future of campus life</span>
        </div>

        {/* College Name and Symbol */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 flex items-center justify-center">
            <img
              src="/wce-logo.png"
              alt="Walchand College of Engineering Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">
            Walchand College of Engineering - Sangli
          </h2>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
          Discover Your <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Passion</span> at College
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Join {clubs.length}+ vibrant clubs, attend exciting events, and connect with like-minded students.
          Your college journey starts here with Club-Connect.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Explore Clubs
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-2"
          >
            <Bell className="w-5 h-5" />
            View Notifications
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">{clubs.length || '50'}+</div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Active Clubs</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">1000+</div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Students Engaged</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-2">{posts.length || '0'}</div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Posts & Events</div>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="mb-16">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for clubs, events, or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Search Results for Clubs */}
      {filteredClubs.length > 0 && (
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Search Results - Clubs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club as any} onClick={() => onNavigateToClub(club.id!)} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts and Notifications Section */}
      <div className="mb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {filteredPosts.length > 0 ? 'Search Results' : 'Recent Posts'}
              </h2>
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All Clubs
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (filteredPosts.length > 0 ? filteredPosts : posts).length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Edit className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">No posts yet. Check back soon!</p>
              </div>
            ) : (
              (filteredPosts.length > 0 ? filteredPosts : posts).slice(0, 5).map((post) => {
                const club = clubs.find(c => c.name === post.clubName); // Try to find club for icon
                return (
                  <div
                    key={post.id}
                    onClick={() => post.id && onNavigateToPost(post.id)}
                    className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {/* Card Header: Club Info & Date */}
                    <div className="bg-slate-50 dark:bg-slate-700/30 px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold bg-gradient-to-br ${getEventColor(post.type)} text-white`}>
                          {club?.image ? (
                            <img src={club.image} alt={club.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{post.clubName}</h4>
                        </div>
                      </div>
                      {new Date(post.date) >= new Date() && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Card Body: Split Layout */}
                    <div className="p-0 flex flex-col sm:flex-row">
                      {/* Left: Cover Image */}
                      <div className="sm:w-2/5 h-48 sm:h-auto relative bg-slate-200 dark:bg-slate-700">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getEventColor(post.type)} opacity-20 flex items-center justify-center`}>
                            <Sparkles className="w-12 h-12 text-slate-400" />
                          </div>
                        )}


                      </div>

                      {/* Right: Details */}
                      <div className="sm:w-3/5 p-6 flex flex-col justify-center">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                          {post.title}
                        </h3>

                        <div className="space-y-3 mb-4">
                          {/* Date */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full shrink-0">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Date</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(post.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full shrink-0">
                              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Time</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {post.time || 'All Day'}
                              </p>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full shrink-0">
                              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Venue</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                {post.location || 'Campus'}
                              </p>
                            </div>
                          </div>

                          {/* Registration */}
                          {(post.registrationStart || post.registrationEnd) && (
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full shrink-0">
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Registration</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {post.registrationStart && new Date(post.registrationStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {post.registrationStartTime && ` ${post.registrationStartTime}`}
                                  {(post.registrationStart || post.registrationStartTime) && (post.registrationEnd || post.registrationEndTime) && ' - '}
                                  {post.registrationEnd && new Date(post.registrationEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {post.registrationEndTime && ` ${post.registrationEndTime}`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h3>
              </div>

              {notifications.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-sm">No notifications yet.</p>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl transition-all hover:scale-105 cursor-pointer ${!notif.read
                        ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500'
                        : 'bg-slate-50 dark:bg-slate-700/50'
                        }`}
                      onClick={() => onNavigateToNotification(notif)}
                    >
                      <div className="flex gap-3">
                        <Bell className={`w-5 h-5 flex-shrink-0 ${!notif.read ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Club-Connect Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose Club-Connect</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">Experience the best of campus life</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{clubs.length || '50'}+ Clubs</h3>
            <p className="text-slate-600 dark:text-slate-300">Diverse clubs for every interest</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{posts.length || '0'}+ Events</h3>
            <p className="text-slate-600 dark:text-slate-300">Exciting events throughout the year</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">1000+ Students</h3>
            <p className="text-slate-600 dark:text-slate-300">Vibrant and supportive community</p>
          </div>
        </div>
      </div>

      {/* Setup Admin Link (remove after initial setup) */}
      <div className="text-center mt-8 py-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => onNavigate('setupAdmin')}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          ⚙️ Initial Setup (Create Super Admin)
        </button>
      </div>
    </div>
  );
}
