import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, MapPin, Clock, CheckCircle, Archive, Plus, Instagram, Globe, MessageCircle, Share2, Award, Info, FileText, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { DBClub, DBPost, Attachment } from '../types/auth';
import { getPosts } from '../lib/dbService';

interface ClubDetailProps {
  club: DBClub;
  onBack: () => void;
  onNavigateToPost: (postId: string) => void;
}

export default function ClubDetail({ club, onBack, onNavigateToPost }: ClubDetailProps) {
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'announcements'>('about');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const postsData = await getPosts();
        const clubPosts = postsData.filter(p => p.clubId === club.id);
        setPosts(clubPosts);
      } catch (error) {
        console.error('Error loading club posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, [club.id]);

  const events = posts.filter(p => p.type === 'event');
  const announcements = posts.filter(p => p.type === 'announcement');

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
        <div className="gradient-card p-6 md:p-10 relative overflow-hidden group min-h-[220px] md:min-h-[280px] flex items-center">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-white/10 border border-white/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                <Award className="w-3.5 h-3.5" />
                <span>Premier Club</span>
              </div>
              <h1 className="text-3xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                {club.name.split(' ').map((word, i) => (
                  i === club.name.split(' ').length - 1 ? (
                    <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400">{word}</span>
                  ) : word + ' '
                ))}
              </h1>
              <p className="text-sm md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto md:mx-0">
                {club.tagline || club.description.slice(0, 120) + '...'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 backdrop-blur-sm shadow-sm">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">50+ Members</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 backdrop-blur-sm shadow-sm">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Active Daily</span>
                </div>
              </div>
            </div>

            {club.image && (
              <div className="relative shrink-0 w-32 h-32 md:w-56 md:h-56">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-[2rem] blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative h-full w-full bg-white dark:bg-slate-800 p-4 md:p-8 rounded-[2rem] border border-white/50 dark:border-slate-700/50 shadow-2xl backdrop-blur-xl flex items-center justify-center">
                  <img src={club.image} alt={club.name} className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column: Stats and Tabs */}
        <div className="lg:col-span-1 space-y-8">
          {/* Quick Links Card */}
          <div className="glass-card p-8 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-500" />
              Information
            </h3>
            <div className="space-y-6">
              <div className="group cursor-pointer">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-transparent group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Club Charter</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="group cursor-pointer">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-transparent group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Member Directory</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <hr className="my-8 border-slate-100 dark:border-slate-800" />

            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Social Links</h3>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-cyan-500 hover:text-white transition-all transform hover:-translate-y-1">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-purple-500 hover:text-white transition-all transform hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-pink-500 hover:text-white transition-all transform hover:-translate-y-1">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Tags Card */}
          <div className="glass-card p-8 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {['Competitive Coding', 'Web Dev', 'Mobile Dev', 'Open Source', 'UI/UX'].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-transparent">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-1 rounded-[1.5rem] border border-white/50 dark:border-white/5 shadow-xl inline-flex mb-4">
            {(['about', 'events', 'announcements'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab
                    ? 'bg-[#002147] text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'about' && (
              <div className="glass-card p-8 md:p-10 rounded-[2.5rem] border border-white/50 dark:border-white/5 shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Our Mission</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-8">
                    {club.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/10">
                      <h4 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Vision
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">To create a world-class coding community within WCE.</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
                      <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Motto
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Excellence through collaboration and open source.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'events' || activeTab === 'announcements') && (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-2xl"></div>
                    ))}
                  </div>
                ) : (activeTab === 'events' ? events : announcements).length > 0 ? (
                  (activeTab === 'events' ? events : announcements).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => post.id && onNavigateToPost(post.id)}
                      className="group glass-card p-6 rounded-3xl border border-white/50 dark:border-white/5 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${activeTab === 'events' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-purple-500/10 text-purple-500'}`}>
                          {activeTab === 'events' ? <Calendar className="w-7 h-7" /> : <Archive className="w-7 h-7" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">{post.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{post.date}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 glass-card rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Archive className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No {activeTab} found</h3>
                    <p className="text-slate-500 dark:text-slate-400">Check back later for updates</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
