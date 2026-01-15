import { useState, useEffect, useRef } from 'react';
import { Calendar, Bell, Users, Search, Edit, MapPin, Clock, Info, Plus, ExternalLink, ChevronRight } from 'lucide-react';
import { Page } from '../types/page';
import { DBPost, DBClub, DBNotification } from '../types/auth';
import { getPosts, getClubs, getTotalStudentCount } from '../lib/dbService';

import MiniCalendar from '../components/MiniCalendar';
import WeeklyEvents from '../components/WeeklyEvents';
import RSVPModal from '../components/RSVPModal';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onNavigateToClub: (clubId: string) => void;
  onNavigateToEvent: (eventId: string) => void;
  onNavigateToPost: (postId: string) => void;
  onNavigateToNotification: (notification: DBNotification) => void;
}
import ImageModal from '../components/ImageModal';

import { useAuth } from '../context/AuthContext';

export default function Home({ onNavigate, onNavigateToClub, onNavigateToPost, onNavigateToNotification }: HomeProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [clubs, setClubs] = useState<DBClub[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<DBPost | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  // Search Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Image Modal State
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openImageModal = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };


  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsData, clubsData, studentCount] = await Promise.all([
          getPosts(),
          getClubs(),
          getTotalStudentCount()
        ]);

        // Sync member counts for all clubs
        const { syncClubMemberCount } = await import('../lib/dbService');
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
        setTotalStudents(studentCount);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  const matchingClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchingEvents = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(p => p.type === 'event');

  const handleResultClick = (type: 'club' | 'post', id: string) => {
    if (type === 'club') {
      onNavigateToClub(id);
    } else {
      onNavigateToPost(id);
    }
    setShowDropdown(false);
    setSearchQuery('');
  };



  const getEventColor = (type: string) => {
    switch (type) {
      case 'event': return 'from-blue-500 to-cyan-500';
      case 'announcement': return 'from-purple-500 to-pink-500';
      default: return 'from-amber-500 to-orange-500';
    }
  };

  // Filter to show only upcoming/incomplete events on home page (exclude announcements)
  const upcomingPosts = posts.filter(post => new Date(post.date) >= new Date() && post.type === 'event');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 flex flex-col min-h-[calc(100vh-80px)]">
      <div className="flex-grow">


        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8" id="tour-stats-grid">
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Clubs</span>
              <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{clubs.length || '50'}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Students</span>
              <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{totalStudents || '0'}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-3 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Events</span>
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{upcomingPosts.length || '0'}</div>
          </div>
        </div>

        {/* Quick Actions & Search */}
        {/* Quick Actions & Search */}
        <div className="mb-8" id="tour-quick-actions">
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-3 md:gap-6 mb-6 md:mb-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 md:px-8 py-2 md:py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm md:text-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center gap-2 md:gap-3 shadow-sm hover:shadow-md"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">View All</span> Clubs
            </button>
            <button
              onClick={() => onNavigate('notifications')}
              className="px-4 md:px-8 py-2 md:py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm md:text-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center gap-2 md:gap-3 shadow-sm hover:shadow-md"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              Notifications
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 relative z-20">
            <div className="flex-1 relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search clubs, events..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if (searchQuery.length > 0) setShowDropdown(true); }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Live Search Dropdown */}
              {showDropdown && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Clubs Section */}
                  {matchingClubs.length > 0 && (
                    <div className="py-2 border-b border-slate-100 dark:border-slate-700/50">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                        Clubs
                      </div>
                      {matchingClubs.map((club) => (
                        <button
                          key={club.id}
                          onClick={() => handleResultClick('club', club.id!)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {club.image ? (
                                <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {club.name}
                              </h4>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Events Section */}
                  {matchingEvents.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                        Events
                      </div>
                      {matchingEvents.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => handleResultClick('post', post.id!)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${getEventColor(post.type)} flex-shrink-0`}>
                              <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                {post.title}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(post.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}

                  {matchingClubs.length === 0 && matchingEvents.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No matches found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Search Results for Clubs */}


        {/* Upcoming Events Section */}
        <div className="mb-8 md:mb-16" id="tour-upcoming-events">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Upcoming Events
                </h2>
                <button
                  onClick={() => onNavigate('events')}
                  className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : upcomingPosts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Edit className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No upcoming events. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingPosts.slice(0, 5).map((post) => {
                    const club = clubs.find(c => c.name === post.clubName);
                    return (
                      <div
                        key={post.id}
                        onClick={() => post.id && onNavigateToPost(post.id)}
                        className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {/* Header: Club info + Upcoming badge */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${getEventColor(post.type)} text-white overflow-hidden flex-shrink-0`}>
                              {club?.image ? (
                                <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                              ) : (
                                <Calendar className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{post.clubName}</span>
                          </div>
                          {new Date(post.date) >= new Date() && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                              Upcoming
                            </span>
                          )}
                        </div>

                        {/* Body: 50/50 split */}
                        <div className="flex">
                          {/* Left: Image - exactly 50% */}
                          <div className={`w-1/2 aspect-[4/3] relative flex-shrink-0 ${post.coverImage ? '' : `bg-gradient-to-br ${getEventColor(post.type)}`}`}>
                            {post.coverImage ? (
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                onClick={(e) => openImageModal(e, post.coverImage!)}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full">
                                <Calendar className="w-12 h-12 text-white/80" />
                              </div>
                            )}
                          </div>

                          {/* Right: Details - exactly 50% */}
                          <div className="w-1/2 p-4 flex flex-col justify-center">
                            {/* Title */}
                            <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white line-clamp-2 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {post.title}
                            </h3>

                            {/* Date, Time, Location - with icons */}
                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Date</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{new Date(post.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Time</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{post.time || 'All Day'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Venue</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{post.location || 'Campus'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {post.type === 'event' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRsvpEvent(post);
                                  }}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  RSVP
                                </button>
                                {post.registrationLink && (
                                  <a
                                    href={post.registrationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Register
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campus Calendar & Weekly Events Section */}
        <div className="mb-8 md:mb-16" id="tour-calendar-section">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">Campus Calendar</h2>
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8 h-auto lg:h-[460px]">
            {/* Left: MiniCalendar - Fixed Content Width */}
            <div className="w-full lg:w-auto flex-none">
              <div className="w-full lg:w-[350px] h-full">
                <MiniCalendar
                  events={posts}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>

            {/* Right: Weekly Events - Takes Remaining Space */}
            <div className="flex-1 h-full min-w-0">
              <WeeklyEvents
                events={posts}
                onNavigateToPost={onNavigateToPost}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Setup Admin Link (remove after initial setup) */}
      <div className="mt-auto text-center py-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => onNavigate('setupAdmin')}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          ⚙️ Initial Setup (Create Super Admin)
        </button>
      </div>

      {/* RSVP Modal */}
      {rsvpEvent && (
        <RSVPModal
          isOpen={!!rsvpEvent}
          onClose={() => setRsvpEvent(null)}
          event={{
            id: rsvpEvent.id || '',
            title: rsvpEvent.title,
            date: rsvpEvent.date,
            time: rsvpEvent.time || 'Time not specified',
            location: rsvpEvent.location || 'Location not specified',
            attendees: rsvpEvent.rsvps || 0
          }}
          clubName={rsvpEvent.clubName}
          user={user}
        />
      )}
      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={modalImage || ''}
      />
    </div>
  );
}
