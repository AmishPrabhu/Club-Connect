import { useState, useEffect } from 'react';
import { Users, Calendar, Archive, MapPin, Clock } from 'lucide-react';
import { DBClub, DBPost, ClubMember } from '../types/auth';
import { getPosts, getClubs, getClubMembers } from '../lib/dbService';

interface ClubDetailProps {
  clubId: string;
  club?: DBClub; // Optional: allow passing full object if available
  onNavigateToPost: (postId: string) => void;
  onNavigateToMemberBoard: (club: any) => void;
}

export default function ClubDetail({ clubId, club: initialClub, onNavigateToPost, onNavigateToMemberBoard }: ClubDetailProps) {
  const [club, setClub] = useState<DBClub | null>(initialClub || null);
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [postFilter, setPostFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState(!initialClub);

  useEffect(() => {
    const loadData = async () => {
      try {
        let currentClub = club;
        if (!currentClub) {
          const clubs = await getClubs();
          const foundClub = clubs.find(c => c.id === clubId);
          if (foundClub) {
            setClub(foundClub);
            currentClub = foundClub;
          }
        }

        const targetId = clubId || currentClub?.id;

        if (targetId) {
          // Fetch Posts
          const postsData = await getPosts();
          const clubPosts = postsData.filter(p => p.clubId === targetId);
          setPosts(clubPosts);

          // Fetch Members
          const membersData = await getClubMembers(targetId);
          setMembers(membersData);
        }
      } catch (error) {
        console.error('Error loading club data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [clubId, club?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Club not found.</p>
      </div>
    );
  }

  // Filter posts based on toggle
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredPosts = posts.filter(post => {
    if (!post.date) return true; // Show if no date
    const parsedDate = new Date(post.date);
    if (isNaN(parsedDate.getTime())) return true;

    const isPast = parsedDate < today;
    return postFilter === 'upcoming' ? !isPast : isPast;
  });

  // Identify Officers from members list
  const officers = members.filter(m => ['president', 'secretary', 'treasurer'].includes(m.role.toLowerCase()));

  // Fallback if no members found
  const displayOfficers = officers.length > 0 ? officers : [
    { id: '1', name: 'Loading...', role: 'President', email: '' },
    { id: '2', name: 'Loading...', role: 'Secretary', email: '' },
    { id: '3', name: 'Loading...', role: 'Treasurer', email: '' }
  ] as ClubMember[];


  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12 relative overflow-hidden">
      {/* Background Environment */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="absolute top-[10%] left-[5%] w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-purple-400/30 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-blue-400/30 rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Club Header - Premium Box Style */}
      <div className="relative mb-6 md:mb-10 w-full">
        <div className="gradient-card p-6 md:p-10 relative overflow-hidden group min-h-[220px] md:min-h-[280px] flex items-center justify-center">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-7xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                {club.name.replace('WCE ', '')}
              </h1>
              <h2 className="text-xl md:text-2xl font-serif italic text-slate-600 dark:text-slate-300 max-w-3xl mx-auto md:mx-0">
                {club.name === 'WCE ACSES' ? 'Association of Computer Science and Engineering Students' : club.name}
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto md:mx-0">
                Igniting Innovation & Excellence at Walchand College of Engineering
              </p>
            </div>

            {club.image && (
              <div className="relative shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20 border border-white/20 bg-white/10 backdrop-blur-md p-4 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                <img src={club.image} alt={club.name} className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
        {/* Left Column: Content (About & Posts) */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6 border-l-4 border-[#002147] pl-4">About the Club</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-8">
                {club.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#002147] flex items-center justify-center text-white shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Members</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{members.length > 0 ? members.length : 50}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Events</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{posts.filter(p => p.type === 'event').length}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Category</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">Technical</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Calendar className="w-6 h-6 text-amber-500" />
                Posts & Events
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setPostFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${postFilter === 'upcoming' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setPostFilter('past')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${postFilter === 'past' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Past Events
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => post.id && onNavigateToPost(post.id)}
                    className="group p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer flex flex-col md:flex-row gap-6"
                  >
                    <div className="shrink-0 w-full md:w-48 h-32 rounded-lg overflow-hidden bg-slate-200">
                      <img src={post.coverImage || `https://source.unsplash.com/random/400x300?event,${post.id}`} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${post.type === 'event' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                          {post.type}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.date}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{post.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Archive className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No {postFilter} posts found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Member Board */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card glass-card-hover rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-white p-2 shadow-sm">
                {club.image ? (
                  <img src={club.image} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#002147]">{(club.name || '').charAt(0)}</div>
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-900 dark:text-white text-lg leading-tight">{club.name.replace('WCE ', '')} - Member Board</h3>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Meet the dedicated members who make {club.name.replace('WCE ', '')} thrive
            </p>

            <div className="space-y-4" id="tour-member-board">
              {/* Fallback if no members are loaded yet or just show typical officers */}
              {displayOfficers.map((member, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && displayOfficers[0]?.id.includes('Loading') && (
                <div className="text-center py-4 text-xs text-slate-400 italic">
                  Fetching members...
                </div>
              )}
            </div>

            <button
              onClick={() => club && onNavigateToMemberBoard(club)}
              className="w-full mt-8 py-3 bg-[#002147] hover:bg-[#003366] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5"
            >
              VIEW FULL BOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
