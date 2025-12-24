import { useState } from 'react';
import { Calendar, Trophy, Theater, Bell, MapPin, Clock, Users, Star, Zap, Heart, Search, ChevronRight, Sparkles, LucideIcon } from 'lucide-react';
import { Page } from '../App';
import { clubs } from '../data/clubsData';
import ClubCard from '../components/ClubCard';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onNavigateToClub: (clubId: string) => void;
  onNavigateToEvent: (eventId: string) => void;
}

interface Event {
  id: number;
  icon: LucideIcon;
  title: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  type: string;
  color: string;
}

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  icon: string;
  image: string;
  color: string;
  upcomingEvents: number;
}

export default function Home({ onNavigate, onNavigateToClub, onNavigateToEvent }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);

  const recentEvents: Event[] = [
    {
      id: 1,
      icon: Calendar,
      title: 'Coding Workshop Announced: Building with Gemini API',
      startDate: 'Dec 25, 2025',
      endDate: 'Dec 26, 2025',
      registrationDeadline: 'Dec 20, 2025',
      type: 'Workshop',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      icon: Theater,
      title: 'Drama Night Highlights: "The Silent Echo" Premiere',
      startDate: 'Dec 20, 2025',
      endDate: 'Dec 20, 2025',
      registrationDeadline: 'Dec 15, 2025',
      type: 'Cultural',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 3,
      icon: Trophy,
      title: 'Sports Meet Results: CS Department Wins Overall Trophy',
      startDate: 'Dec 18, 2025',
      endDate: 'Dec 18, 2025',
      registrationDeadline: 'Dec 10, 2025',
      type: 'Sports',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const handleSearch = () => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchingClubs = clubs.filter(club =>
      club.name.toLowerCase().includes(lowerQuery) ||
      club.description.toLowerCase().includes(lowerQuery)
    );
    const matchingEvents = recentEvents.filter(event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.type.toLowerCase().includes(lowerQuery)
    );

    setFilteredClubs(matchingClubs);
    setFilteredEvents(matchingEvents);
  };

  const notifications = [
    {
      id: 1,
      icon: MapPin,
      text: 'Venue changed for Art Fest to Main Auditorium',
      time: '2 hours ago',
      urgent: true,
    },
    {
      id: 2,
      icon: Clock,
      text: 'Hackathon registration ends today at 11:59 PM',
      time: '5 hours ago',
      urgent: true,
    },
    {
      id: 3,
      icon: Bell,
      text: 'New club applications are now open',
      time: '1 day ago',
      urgent: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Welcome to the future of campus life</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
          Discover Your <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Passion</span> at College
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Join 50+ vibrant clubs, attend 200+ exciting events, and connect with 1000+ like-minded students.
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
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">50+</div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Active Clubs</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">1000+</div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Students Engaged</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-2">200+</div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Events This Year</div>
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
              <ClubCard key={club.id} club={club} onClick={() => onNavigateToClub(club.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Events and Notifications Section */}
      <div className="mb-16">
        <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {filteredEvents.length > 0 ? 'Search Results' : 'Recent Events'}
            </h2>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All Clubs
            </button>
          </div>

          {(filteredEvents.length > 0 ? filteredEvents : recentEvents).map((event) => {
            const Icon = event.icon;
            return (
              <div
                key={event.id}
                onClick={() => onNavigateToEvent(event.id.toString())}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${event.color} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${event.color} text-white w-fit`}>
                        {event.type}
                      </span>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        <div>Event: {event.startDate} - {event.endDate}</div>
                        <div>Registration Deadline: {event.registrationDeadline}</div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Alerts</h3>
            </div>

            <div className="space-y-4">
              {notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl transition-all hover:scale-105 ${
                      notif.urgent
                        ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500'
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${notif.urgent ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {notif.text}
                        </p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{notif.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>
      </div>
      </div>





      {/* Why Choose Club Gram Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose Club-Connect</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">Experience the best of campus life</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">50+ Clubs</h3>
            <p className="text-slate-600 dark:text-slate-300">Diverse clubs for every interest</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">200+ Events</h3>
            <p className="text-slate-600 dark:text-slate-300">Exciting events throughout the year</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">1000+ Students</h3>
            <p className="text-slate-600 dark:text-slate-300">Vibrant and supportive community</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">24/7 Support</h3>
            <p className="text-slate-600 dark:text-slate-300">Always here when you need us</p>
          </div>
        </div>
      </div>
    </div>
  );
}
