import { useState, useEffect, useRef } from 'react';
import { Calendar, Bell, Users, Search, MapPin, Shield, Megaphone, ChevronRight, Award, Clock } from 'lucide-react';
import { Page } from '../types/page';
import { DBPost, DBClub, DBNotification } from '../types/auth';
import { getPosts, getNotifications, getClubs } from '../lib/dbService';

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


import { useAuth } from '../context/AuthContext';

export default function Home({ onNavigate, onNavigateToClub, onNavigateToPost, onNavigateToNotification }: HomeProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [clubs, setClubs] = useState<DBClub[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<DBPost | null>(null);


  // Search Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);






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
        setNotifications(notificationsData);
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Hero Section */}
      {/* Hero Section */}
      <div className="bg-[#002147] relative overflow-hidden pt-6 pb-12 md:pt-20 md:pb-32 transition-all duration-300">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.wce.ac.in/images/WCE_Main_Building.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#002147]/90"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
          {/* Left Column: Text & Actions */}
          <div className="w-full md:w-3/5 text-center md:text-left">
            {/* Mobile-Only App Greeting */}
            <div className="block md:hidden w-full text-left mb-6">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
                {user ? `Welcome Back, ${user.name.split(' ')[0]}` : 'Welcome Guest'}
              </p>
              <h1 className="text-3xl font-serif font-bold text-white leading-tight">
                Campus <span className="text-[#DAA520]">Connect</span>
              </h1>
            </div>

            {/* Desktop-Only Full Branding */}
            <div className="hidden md:block">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/50 border border-blue-700 text-blue-200 text-xs font-bold uppercase tracking-wider mb-6">
                <Award className="w-4 h-4 text-[#DAA520]" />
                <span>Est. 1947 • A Premier Institute</span>
              </div>
              <h1 className="text-6xl font-serif font-bold text-white leading-tight mb-6">
                Walchand College of <span className="text-[#DAA520]">Engineering</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
                Discover vibrant student communities, participate in exciting events, and lead the future. The official platform for all club activities.
              </p>
            </div>


          </div>

          {/* Right Column: Hero Visual - Desktop Only */}
          <div className="hidden md:block md:w-2/5">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#DAA520]/20 rounded-full blur-3xl animate-pulse"></div>
              <img
                src="/wce-logo.png"
                alt="WCE Emblem"
                className="w-64 h-64 object-contain mx-auto relative z-10 drop-shadow-2xl opacity-90"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-16 relative z-20 w-full flex-grow">

        {/* Stats Overview - 2 Large Action Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8 md:mb-12 -mt-6 md:-mt-16 relative z-20 px-4 md:px-0" id="tour-stats-grid">
          {/* Explore Clubs Card */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#002147] dark:text-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 flex flex-row items-center justify-between group transition-all transform hover:-translate-y-1 hover:shadow-xl border-l-4 border-[#DAA520] text-left gap-2 md:gap-0"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider opacity-80 mb-0.5 md:mb-1">Explore</span>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-0 md:gap-2">
                <span className="text-xl md:text-4xl font-black text-[#002147] dark:text-white tracking-tighter leading-none">{clubs.length || '50+'}</span>
                <span className="text-xs md:text-xl font-bold font-serif text-slate-700 dark:text-slate-300 leading-tight">Clubs</span>
              </div>
            </div>
            <div className="w-8 h-8 md:w-14 md:h-14 bg-[#002147]/5 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <Users className="w-4 h-4 md:w-7 md:h-7 text-[#002147] dark:text-[#DAA520]" />
            </div>
          </button>

          {/* Upcoming Events Card */}
          <button
            onClick={() => onNavigate('events')}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#002147] dark:text-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 flex flex-row items-center justify-between group transition-all transform hover:-translate-y-1 hover:shadow-xl border-l-4 border-[#002147] text-left gap-2 md:gap-0"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 md:mb-1">Upcoming</span>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-0 md:gap-2">
                <span className="text-xl md:text-4xl font-black text-[#002147] dark:text-white tracking-tighter leading-none">{upcomingPosts.length || '0'}</span>
                <span className="text-xs md:text-xl font-bold font-serif text-slate-700 dark:text-slate-300 leading-tight">Events</span>
              </div>
            </div>
            <div className="w-8 h-8 md:w-14 md:h-14 bg-blue-50 dark:bg-blue-900/20 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <Calendar className="w-4 h-4 md:w-7 md:h-7 text-[#002147] dark:text-blue-400" />
            </div>
          </button>
        </div>

        {/* Quick Actions & Search */}
        <div className="mb-12" id="tour-quick-actions">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Desktop Quick Actions - Hidden on Mobile to save space/redundancy */}
            <div className="hidden md:flex gap-4 w-full md:w-auto">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-[#002147]/30 dark:hover:border-blue-500/30 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#002147] dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                All Clubs
              </button>
              <button
                onClick={() => onNavigate('notifications')}
                className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-[#002147]/30 dark:hover:border-blue-500/30 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 group-hover:scale-110 transition-transform">
                  <Bell className="w-4 h-4" />
                </div>
                Alerts
              </button>
            </div>

            {/* Modern Search Bar */}
            <div className="flex-1 relative w-full" ref={dropdownRef}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#002147] transition-colors" />
                <input
                  type="text"
                  placeholder="Search for clubs, events, or announcements..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchQuery.length > 0) setShowDropdown(true); }}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#002147] dark:focus:border-blue-500 shadow-sm focus:shadow-lg transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">CMD + K</span>
                </div>
              </div>

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


        {/* Upcoming Events and Notifications Section */}
        <div className="mb-16" id="tour-upcoming-events">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                    Upcoming Events
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Don't miss out on what's happening on campus</p>
                </div>
                <button
                  onClick={() => onNavigate('events')}
                  className="px-4 py-2 text-sm font-bold text-[#002147] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  View Full Calendar
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : upcomingPosts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No upcoming events</h3>
                  <p className="text-slate-500 dark:text-slate-400">Check back later for new activities!</p>
                </div>
              ) : (
                upcomingPosts.slice(0, 5).map((post) => {
                  const club = clubs.find(c => c.name === post.clubName); // Try to find club for icon
                  return (
                    <div
                      key={post.id}
                      onClick={() => post.id && onNavigateToPost(post.id)}
                      className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer mb-6 transform hover:-translate-y-1 duration-300"
                    >
                      {/* Card Header for Desktop/Mobile Consistency */}
                      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          {club?.image ? (
                            <img src={club.image} alt={club.name} className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-700 shadow-sm p-0.5" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Users className="w-4 h-4 text-slate-500" /></div>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white font-serif">{post.clubName}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          Upcoming
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row">
                        {/* Event Image - Full Width Mobile, 40% Desktop */}
                        <div className="w-full md:w-[40%] h-56 md:h-auto relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                          {post.coverImage ? (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getEventColor(post.type)} flex items-center justify-center`}>
                              <Calendar className="w-16 h-16 text-white/40" />
                            </div>
                          )}
                          {/* Mobile Date Overlay */}
                          <div className="md:hidden absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{new Date(post.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{new Date(post.date).getDate()}</span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between bg-white dark:bg-slate-800">
                          <div>
                            <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors">
                              {post.title}
                            </h3>

                            <div className="space-y-4 mb-6">
                              {/* Date Row (Desktop) */}
                              <div className="hidden md:flex items-start gap-4">
                                <div className="mt-1"><Calendar className="w-5 h-5 text-blue-500" /></div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                  <p className="font-medium text-slate-700 dark:text-slate-300">
                                    {new Date(post.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3">
                            {/* Register Button - Shows when registrationLink exists */}
                            {post.registrationLink && (
                              <a
                                href={post.registrationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Register Now
                              </a>
                            )}

                            {/* RSVP Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRsvpEvent(post);
                              }}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              RSVP Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="lg:col-span-1" id="tour-notifications-panel">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 h-full">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Announcements</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Latest announcements</p>
                  </div>
                  <Bell className="w-5 h-5 text-[#DAA520] animate-pulse" />
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No new notices to display.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl transition-all hover:scale-[1.02] cursor-pointer border ${!notif.read
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'
                          }`}
                        onClick={() => onNavigateToNotification(notif)}
                      >
                        <div className="flex gap-3 items-start">
                          <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${notif.type === 'system' ? 'bg-amber-100 text-amber-600' :
                            notif.type === 'announcement' ? 'bg-purple-100 text-purple-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                            {notif.type === 'system' ? <Shield className="w-3.5 h-3.5" /> :
                              notif.type === 'announcement' ? <Megaphone className="w-3.5 h-3.5" /> :
                                <Calendar className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold mb-1 leading-tight ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onNavigate('notifications')}
                  className="w-full mt-6 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  View All Notices
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Campus Calendar & Weekly Events Section */}
        <div className="mb-8" id="tour-calendar-section">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-[#002147] dark:text-blue-400" />
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Campus Calendar</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[500px]">
            {/* Left: MiniCalendar - Styled */}
            <div className="w-full lg:w-auto flex-none">
              <div className="w-full lg:w-[350px] h-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden p-6">
                <MiniCalendar
                  events={posts}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>

            {/* Right: Weekly Events - Styled */}
            <div className="flex-1 h-full min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
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
      <div className="mt-12 text-center py-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => onNavigate('setupAdmin')}
          className="text-xs font-medium text-slate-400 hover:text-[#002147] dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <Shield className="w-3 h-3" />
          System Administration
        </button>
        <p className="text-[10px] text-slate-400 mt-2">© 2024 Walchand College of Engineering, Sangli. All rights reserved.</p>
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

    </div>
  );
}
