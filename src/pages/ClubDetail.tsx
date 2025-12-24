import { useState } from 'react';
import { ArrowLeft, Users, Calendar, MapPin, Clock, CheckCircle, Archive, Plus } from 'lucide-react';
import { clubs } from '../data/clubsData';
import RSVPModal from '../components/RSVPModal';

interface ClubDetailProps {
  clubId: string;
  onBack: () => void;
  onNavigateToMember: (member: any) => void;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: 'upcoming' | 'past';
  description: string;
}

export default function ClubDetail({ clubId, onBack, onNavigateToMember }: ClubDetailProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [rsvpModal, setRsvpModal] = useState<{ isOpen: boolean; event: Event | null }>({
    isOpen: false,
    event: null
  });

  const club = clubs.find(c => c.id === clubId);

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-center text-xl text-slate-600 dark:text-slate-400">Club not found</p>
      </div>
    );
  }

  // Mock events data - in a real app, this would come from an API
  const events: Event[] = [
    {
      id: 1,
      title: 'AI Workshop: Introduction to Machine Learning',
      date: 'Jan 25, 2026',
      time: '2:00 PM - 5:00 PM',
      location: 'Computer Lab 101',
      attendees: 45,
      status: 'upcoming',
      description: 'Learn the basics of machine learning with hands-on examples using Python and scikit-learn.'
    },
    {
      id: 2,
      title: 'Hackathon 2026 Kickoff',
      date: 'Feb 10, 2026',
      time: '10:00 AM - 12:00 PM',
      location: 'Auditorium',
      attendees: 120,
      status: 'upcoming',
      description: 'Join us for the official launch of our annual hackathon with team formation and project ideation.'
    },
    {
      id: 3,
      title: 'Cloud Computing Seminar',
      date: 'Dec 15, 2025',
      time: '3:00 PM - 6:00 PM',
      location: 'Seminar Hall A',
      attendees: 78,
      status: 'past',
      description: 'Explored AWS, Azure, and GCP services with practical demonstrations and use cases.'
    },
    {
      id: 4,
      title: 'Code Review Best Practices',
      date: 'Nov 20, 2025',
      time: '1:00 PM - 4:00 PM',
      location: 'Meeting Room 205',
      attendees: 32,
      status: 'past',
      description: 'Interactive session on effective code review techniques and tools for better collaboration.'
    }
  ];

  const filteredEvents = events.filter(event => event.status === activeTab);

  // Mock member data for different years
  const memberData: Record<number, Array<{ name: string; role: string; avatar: string }>> = {
    [new Date().getFullYear()]: [
      { name: 'John Doe', role: 'President', avatar: '👨‍💼' },
      { name: 'Jane Smith', role: 'Vice President', avatar: '👩‍💼' },
      { name: 'Bob Johnson', role: 'Secretary', avatar: '👨‍💻' },
      { name: 'Alice Brown', role: 'Treasurer', avatar: '👩‍💻' },
    ],
    [new Date().getFullYear() - 1]: [
      { name: 'Mike Wilson', role: 'President', avatar: '👨‍🎓' },
      { name: 'Sarah Davis', role: 'Vice President', avatar: '👩‍🎓' },
      { name: 'Tom Anderson', role: 'Secretary', avatar: '👨‍💻' },
      { name: 'Lisa Garcia', role: 'Treasurer', avatar: '👩‍💻' },
    ],
  };

  const currentMembers = memberData[selectedYear] || [];

  const handleRSVP = (event: Event) => {
    setRsvpModal({ isOpen: true, event });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      {/* Club Header */}
      <div className={`h-48 bg-gradient-to-r ${club.color} rounded-2xl relative mb-8 overflow-hidden`}>
        <img
          src={club.image}
          alt={club.name}
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-5xl mb-3">{club.icon}</div>
            <h1 className="text-3xl font-black">{club.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Left Side - 70% */}
        <div className="lg:col-span-5 space-y-8">
          {/* Club Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {club.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{club.members}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming Events</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{club.upcomingEvents}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Category</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white capitalize">{club.category}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Events Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h2>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      activeTab === 'upcoming'
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      activeTab === 'past'
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Past Events
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    No {activeTab} events
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500">
                    {activeTab === 'upcoming'
                      ? 'Check back later for upcoming events!'
                      : 'Past events will appear here.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="relative pl-8 pb-6 border-l-2 border-slate-200 dark:border-slate-700 last:border-l-0"
                    >
                      <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 ml-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                              {event.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                              {event.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <Calendar className="w-4 h-4" />
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <Clock className="w-4 h-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>

                          {activeTab === 'upcoming' && (
                            <button
                              onClick={() => handleRSVP(event)}
                              className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              RSVP
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Users className="w-4 h-4" />
                            <span>{event.attendees} attending</span>
                          </div>

                          {activeTab === 'past' && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - 30% */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">{club.icon}</div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {club.name} - Member Board
              </h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Meet the dedicated members who make {club.name} thrive
            </p>

            {/* Year Selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Select Year</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedYear(new Date().getFullYear())}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedYear === new Date().getFullYear()
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {new Date().getFullYear()}
                </button>
                <button
                  onClick={() => setSelectedYear(new Date().getFullYear() - 1)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedYear === new Date().getFullYear() - 1
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {new Date().getFullYear() - 1}
                </button>
              </div>
            </div>

            {/* Member list for selected year */}
            <div className="space-y-4">
              {currentMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateToMember(club)}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              View Full Board
            </button>
          </div>
        </div>
      </div>

      {/* RSVP Modal */}
      {rsvpModal.event && (
        <RSVPModal
          isOpen={rsvpModal.isOpen}
          onClose={() => setRsvpModal({ isOpen: false, event: null })}
          event={rsvpModal.event}
          clubName={club.name}
        />
      )}
    </div>
  );
}
