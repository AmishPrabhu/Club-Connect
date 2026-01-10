import { ArrowLeft, User, Mail, Calendar, Heart, Share2, Save, Edit, X, CalendarCheck, History, Clock, MapPin, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, getUserMemberships, getUserRSVPsByEmail, getPosts } from '../lib/firestoreService';
import { Page } from '../types/page';
import { FirestorePost } from '../types/auth';

interface UserProfileProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  onNavigateToPost: (postId: string) => void;
}

interface UserEvent {
  event: FirestorePost;
  rsvpDate: Date;
}

export default function UserProfile({ onBack, onNavigate, onNavigateToPost }: UserProfileProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'events'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    email: '',
    joinDate: '',
  });
  const [memberships, setMemberships] = useState<any[]>([]); // Add state for memberships
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    email: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Event State
  const [eventTab, setEventTab] = useState<'upcoming' | 'past'>('upcoming');
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setProfileData({
            name: profile.name || user.name || '',
            bio: (profile as any).bio || '',
            email: profile.email || user.email || '',
            joinDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown',
          });
          setEditForm({
            name: profile.name || user.name || '',
            bio: (profile as any).bio || '',
            email: profile.email || '',
          });
        } else {
          // Fallback to user context data
          setProfileData({
            name: user.name || '',
            bio: '',
            email: user.email || '',
            joinDate: 'Recently',
          });
          setEditForm({
            name: user.name || '',
            bio: '',
            email: user.email || '',
          });
        }

        // Fetch memberships
        if (user.email) {
          const userMemberships = await getUserMemberships(user.email);
          setMemberships(userMemberships);
        }
      }
    };
    loadProfile();
  }, [user]);

  // Fetch Events
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!user?.email) {
        setEventsLoading(false);
        return;
      }

      try {
        // Get user's RSVPs
        const userRSVPs = await getUserRSVPsByEmail(user.email);

        // Get all posts to match event details
        const allPosts = await getPosts();

        // Map RSVPs to events
        const events: UserEvent[] = [];
        for (const { eventId, rsvp } of userRSVPs) {
          const event = allPosts.find(p => p.id === eventId);
          if (event) {
            events.push({
              event,
              rsvpDate: rsvp.rsvpedAt,
            });
          }
        }

        // Sort by event date
        events.sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());
        setUserEvents(events);
      } catch (error) {
        console.error('Error fetching user events:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUserEvents();
  }, [user?.email]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setMessage(null);

    const result = await updateUserProfile(user.id, editForm);

    if (result.success) {
      setProfileData(prev => ({
        ...prev,
        name: editForm.name,
        bio: editForm.bio,
      }));
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
    setIsSaving(false);
  };

  const now = new Date();
  const upcomingEvents = userEvents.filter(e => new Date(e.event.date) >= now);
  const pastEvents = userEvents.filter(e => new Date(e.event.date) < now);
  const displayedEvents = eventTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Back to Home</span>
      </button>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
            👨‍🎓
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        name: profileData.name,
                        bio: profileData.bio,
                        email: profileData.email
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{profileData.name || 'User'}</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {profileData.bio || 'No bio yet. Click edit to add one!'}
                </p>
                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profileData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {profileData.joinDate}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Edit className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* Role Badge */}
        {user?.role && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.role === 'admin'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : user.role === 'club-secretary'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                {user.role === 'club-secretary' ? 'Club Secretary' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.clubName && (
                <span className="text-sm text-slate-600 dark:text-slate-400">• {user.clubName}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs - Hide for advisors */}
      {user?.role !== 'advisor' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'events', label: 'My Events', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Club Memberships</h3>
                  {memberships.length > 0 ? (
                    <div className="grid gap-4">
                      {memberships.map((membership, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${membership.clubColor ? `bg-gradient-to-br ${membership.clubColor}` : 'bg-slate-200 dark:bg-slate-600'}`}>
                            {membership.clubImage ? (
                              <img src={membership.clubImage} alt={membership.clubName} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              membership.clubIcon || '🏛️'
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{membership.clubName}</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                              ${membership.role === 'president' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                  membership.role === 'vice-president' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                    membership.role === 'treasurer' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                      membership.role === 'secretary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                                }`}>
                                {membership.role.charAt(0).toUpperCase() + membership.role.slice(1).replace('-', ' ')}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">• Since {new Date(membership.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 italic">Not a member of any club yet.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Profile Updated</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Your profile is now synced • Recently</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Welcome to Club-Connect!</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Start exploring clubs and events</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* Event Tabs */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setEventTab('upcoming')}
                    className={`pb-3 px-2 font-semibold transition-colors relative ${eventTab === 'upcoming'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    Upcoming ({upcomingEvents.length})
                    {eventTab === 'upcoming' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setEventTab('past')}
                    className={`pb-3 px-2 font-semibold transition-colors relative ${eventTab === 'past'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    Past ({pastEvents.length})
                    {eventTab === 'past' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                </div>

                {/* Event List */}
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : displayedEvents.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    {eventTab === 'upcoming' ? (
                      <>
                        <CalendarCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 mb-4">No upcoming events found.</p>
                        <button
                          onClick={() => onNavigate('events')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                        >
                          Browse Events
                        </button>
                      </>
                    ) : (
                      <>
                        <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">No past events found.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {displayedEvents.map(({ event, rsvpDate }) => (
                      <div
                        key={event.id}
                        className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${eventTab === 'upcoming'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {eventTab === 'upcoming' ? 'Upcoming' : 'Completed'}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">by {event.clubName}</span>
                            </div>

                            <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                              {event.title}
                            </h4>

                            <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              {event.time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {event.time}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {event.location}
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-2">
                              RSVP'd on {rsvpDate.toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => event.id && onNavigateToPost(event.id)}
                              className="p-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
