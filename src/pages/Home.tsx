import { useState, useEffect, useRef } from 'react';
import { Calendar, Bell, Users, Search, MapPin, Shield, Megaphone, ChevronRight, Award, Clock, FileText } from 'lucide-react';
import { Page } from '../types/page';
import { DBPost, DBClub, DBNotification } from '../types/auth';
import { getPosts, getNotifications, getClubs } from '../lib/dbService';

import MiniCalendar from '../components/MiniCalendar';
import WeeklyEvents from '../components/WeeklyEvents';
import RSVPModal from '../components/RSVPModal';
import ImageModal from '../components/ImageModal';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onNavigateToClub: (clubId: string, slug?: string) => void;
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

  // Image Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    setSelectedImage(imageUrl);
  };


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
      const club = clubs.find(c => c.id === id);
      onNavigateToClub(id, club?.slug);
    } else {
      onNavigateToPost(id);
    }
    setShowDropdown(false);
    setSearchQuery('');
  };



  const getEventColor = (_type: string) => {
    return 'from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600';
  };

  // Filter to show only upcoming/incomplete events on home page (exclude announcements)
  const upcomingPosts = posts.filter(post => post.type === 'event' && post.date && new Date(post.date || '').getTime() >= new Date().getTime());

  return (
    <div className="flex flex-col min-h-screen relative pb-24 md:pb-0">
      {/* Page-level floating dots — visible across the entire page */}


      {/* Hero Section - "Premium Plan" Style Card */}
      {/* Hero Section - "Premium Plan" Style Card */}
      <div className="px-3 md:px-6 pt-2 md:pt-4 pb-4 md:pb-6 max-w-7xl mx-auto w-full">
        <div className="gradient-card p-5 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative overflow-hidden group">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 text-center md:text-left w-full md:w-auto">
            {/* Mobile Branding */}
            {/* Mobile Branding */}
            <div className="md:hidden mb-2 text-left">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Welcome Back, {user?.name?.split(' ')[0] || 'Student'}
              </p>
              <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white leading-none">
                Campus <span className="text-yellow-600 dark:text-yellow-400 font-sans">Connect</span>
              </h1>
            </div>

            {/* Desktop Branding */}
            <div className="hidden md:block">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-white/10 border border-white/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                <Award className="w-3.5 h-3.5" />
                <span>Premier Institute</span>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                Walchand College of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400">Engineering</span>
              </h1>
            </div>

            <p className="hidden md:block text-slate-600 dark:text-slate-300 text-xs md:text-base max-w-lg mb-4 md:mb-6 leading-relaxed line-clamp-2 md:line-clamp-none px-2 md:px-0">
              Discover vibrant student communities, participate in exciting events, and lead the future.
            </p>

          </div>

          {/* Hero Visual - Hidden on small mobile to save space, or very small */}
          <div className="relative z-10 hidden md:block w-32 h-32 md:w-48 md:h-48 flex-shrink-0 animate-float-slow">
            <img
              src="/wce-logo.png"
              alt="WCE Emblem"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-20 w-full flex-grow">

        {/* Navigation Grid - "Premium Feature" Style */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1">Quick Access</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Clubs Card */}
            <button
              onClick={() => onNavigate('dashboard')}
              className="glass-card glass-card-hover p-4 md:p-5 flex flex-col items-start gap-3 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-12 h-12 md:w-16 md:h-16 text-cyan-600 dark:text-cyan-400" />
              </div>

              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-0.5 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-0.5 leading-none">
                  {clubs.length || '0'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Active Clubs
                </p>
              </div>
            </button>

            {/* Events Card */}
            <button
              onClick={() => onNavigate('events')}
              className="glass-card glass-card-hover p-4 md:p-5 flex flex-col items-start gap-3 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-12 h-12 md:w-16 md:h-16 text-purple-600 dark:text-purple-400" />
              </div>

              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-0.5 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-0.5 leading-none">
                  {upcomingPosts.length || '0'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Upcoming Events
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions & Search */}
        <div className="mb-12" id="tour-quick-actions">
          <div className="flex flex-col md:flex-row gap-6 items-center">


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
                  className="w-full pl-12 pr-4 py-4 glass-input rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520]/30 shadow-sm focus:shadow-lg transition-all"
                />

              </div>

              {/* Live Search Dropdown */}
              {showDropdown && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/40 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                                {post.date ? new Date(post.date!).toLocaleDateString() : 'No date'}
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
        <div className="mb-16 scroll-mt-32" id="tour-upcoming-events">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base md:text-2xl font-serif font-bold text-slate-900 dark:text-white">
                    Upcoming Events
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Don't miss out on what's happening</p>
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
                <div className="text-center py-16 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
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
                      className="group glass-card glass-card-hover rounded-3xl overflow-hidden cursor-pointer mb-6"
                    >
                      {/* Card Header for Desktop/Mobile Consistency */}
                      <div className="px-5 py-4 flex items-center justify-between border-b border-white/20 dark:border-slate-700/30">
                        <div className="flex items-center gap-3">
                          {club?.image ? (
                            <img src={club.image} alt={club.name} className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-700 shadow-sm p-0.5" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Users className="w-4 h-4 text-slate-500" /></div>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white font-serif truncate max-w-[150px] md:max-w-none">{post.clubName}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-slate-700 dark:bg-slate-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          Upcoming
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row">
                        {/* Event Image - Full Width Mobile, 40% Desktop */}
                        <div
                          className={`w-full md:w-[40%] h-56 md:h-auto relative bg-slate-100 dark:bg-slate-900 overflow-hidden group/image flex-shrink-0 ${post.coverImage ? 'cursor-zoom-in' : ''}`}
                          onClick={(e) => post.coverImage && handleImageClick(e, post.coverImage)}
                        >
                          {post.coverImage ? (
                            <>
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 group-hover/image:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 duration-300 pointer-events-none">
                                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Click to expand</span>
                              </div>
                            </>
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getEventColor(post.type)} flex items-center justify-center`}>
                              <Calendar className="w-16 h-16 text-white/40" />
                            </div>
                          )}
                          {/* Mobile Date Overlay */}
                          <div className="md:hidden absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-lg shadow-lg flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{post.date ? new Date(post.date!).toLocaleDateString('en-US', { month: 'short' }) : '---'}</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{post.date ? new Date(post.date!).getDate() : '--'}</span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0 max-w-full p-5 md:p-6 flex flex-col justify-between bg-white/85 dark:bg-slate-900/80 backdrop-blur-md">
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
                                    {post.date ? new Date(post.date!).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date not specified'}
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

                              {/* Registration Row */}
                              {(post.registrationStart || post.registrationEnd) && (
                                <div className="flex items-start gap-4">
                                  <div className="mt-1"><FileText className="w-5 h-5 text-blue-500" /></div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Registration</p>
                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6">
                                      {post.registrationStart && (
                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                                          <span className="text-slate-500 font-normal mr-2">Opens:</span>
                                          {new Date(post.registrationStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          {post.registrationStartTime ? `, ${post.registrationStartTime}` : ''}
                                        </p>
                                      )}
                                      {post.registrationEnd && (
                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                                          <span className="text-slate-500 font-normal mr-2">Closes:</span>
                                          {new Date(post.registrationEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          {post.registrationEndTime ? `, ${post.registrationEndTime}` : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3">
                            {/* Register Button - Shows when registrationLink exists and registration hasn't ended */}
                            {post.registrationLink && (() => {
                              // Check if registration period has ended
                              if (post.registrationEnd) {
                                const registrationEndDateTime = new Date(post.registrationEnd);
                                if (post.registrationEndTime) {
                                  const timeMatch = post.registrationEndTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                                  if (timeMatch) {
                                    let hours = parseInt(timeMatch[1]);
                                    const minutes = parseInt(timeMatch[2]);
                                    const period = timeMatch[3];
                                    if (period) {
                                      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                                      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                                    }
                                    registrationEndDateTime.setHours(hours, minutes, 59, 999);
                                  }
                                } else {
                                  registrationEndDateTime.setHours(23, 59, 59, 999);
                                }
                                if (registrationEndDateTime < new Date()) {
                                  return null;
                                }
                              }
                              return (
                                <a
                                  href={post.registrationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full py-3 bg-[#DAA520] hover:bg-[#c99a1d] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Register Now
                                </a>
                              );
                            })()}

                            {/* RSVP Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRsvpEvent(post);
                              }}
                              className="w-full py-3 bg-[#002147] hover:bg-[#003366] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
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

            <div className="hidden md:block lg:col-span-1" id="tour-notifications-panel">
              <div className="glass-card rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20 dark:border-slate-700/30">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Announcements</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Latest announcements</p>
                  </div>
                  <Bell className="w-5 h-5 text-slate-400 dark:text-slate-500" />
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
                          <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400`}>
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
        <div className="mb-4 md:mb-8 scroll-mt-32" id="tour-calendar-section">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
            <Calendar className="w-4 h-4 md:w-6 md:h-6 text-[#002147] dark:text-blue-400" />
            <h2 className="text-base md:text-2xl font-serif font-bold text-slate-900 dark:text-white">Campus Calendar</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 h-auto md:h-[500px]">
            {/* Left: MiniCalendar - Styled */}
            <div className="w-full md:w-auto flex-none">
              <div className="w-full md:w-[320px] lg:w-[350px] h-full glass-card rounded-2xl overflow-hidden p-6 text-sm">
                <MiniCalendar
                  events={posts}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>

            {/* Right: Weekly Events - Styled */}
            <div className="flex-1 h-full min-w-0 glass-card rounded-2xl overflow-hidden">
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
        <p className="text-[10px] text-slate-400 mt-2">© 2026 Walchand College of Engineering, Sangli. All rights reserved.</p>
      </div>

      {/* RSVP Modal */}
      {rsvpEvent && (
        <RSVPModal
          isOpen={!!rsvpEvent}
          onClose={() => setRsvpEvent(null)}
          event={{
            id: rsvpEvent.id || '',
            title: rsvpEvent.title,
            date: rsvpEvent.date || '',
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
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage || ''}
      />

    </div>
  );
}
