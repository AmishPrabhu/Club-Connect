import { useState, useEffect } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { ClubMember } from '../types/auth';
import { getClubMembers } from '../lib/dbService';

interface MemberBoardDetailProps {
  club: any;
  onBack: () => void;
}

const BOARD_ORDER: ('main' | 'executive' | 'member')[] = ['main', 'executive', 'member'];

const BOARD_LABELS: Record<string, string> = {
  main: 'Main Board (TY)',
  executive: 'Executive Board (SY)',
  member: 'Member Board (FY)',
};



export default function MemberBoardDetail({ club, onBack }: MemberBoardDetailProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [boardFilter, setBoardFilter] = useState<string>('');

  useEffect(() => {
    const loadMembers = async () => {
      if (club?.id) {
        try {
          const clubMembers = await getClubMembers(club.id);
          setMembers(clubMembers);
        } catch (error) {
          console.error('Error loading members:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [club?.id]);

  // Filter members by year
  const filteredMembers = yearFilter
    ? members.filter(m => {
      const joinYear = new Date(m.joinedAt).getFullYear();
      const selectedYear = parseInt(yearFilter);

      // Member must have joined on or before selected year
      if (joinYear > selectedYear) return false;

      // If member left, they must have left ON or AFTER the selected year
      // (i.e. if they left in 2025, they are still part of the 2025 board)
      if (m.leftAt) {
        const leftYear = new Date(m.leftAt).getFullYear();
        if (leftYear < selectedYear) return false;
      }

      return true;
    })
    : members;

  // Group members by board type
  const groupedMembers = BOARD_ORDER.reduce((acc, boardType) => {
    acc[boardType] = filteredMembers.filter(m => (m.boardType || 'member') === boardType);
    return acc;
  }, {} as Record<string, ClubMember[]>);

  // Filter board types to display
  const displayBoardOrder = boardFilter
    ? BOARD_ORDER.filter(bt => bt === boardFilter)
    : BOARD_ORDER;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      {/* Background Environment */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="absolute top-[10%] left-[5%] w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-purple-400/30 rounded-full animate-pulse delay-700"></div>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-slate-500 hover:text-[#002147] dark:text-slate-400 dark:hover:text-white transition-colors font-bold text-xs uppercase tracking-wide group"
      >
        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back
      </button>

      {/* Header Card - Compact & Row Layout */}
      <div className="mb-8 glass-card p-5 relative overflow-hidden rounded-2xl flex items-center gap-5">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-md shadow-slate-200/50 dark:shadow-none flex-shrink-0 relative z-10">
          {club.image ? (
            <img src={club.image} alt={club.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">{club.icon}</div>
          )}
        </div>

        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#002147]/10 dark:bg-blue-500/10 text-[#002147] dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider">
              <Users className="w-3 h-3" />
              <span>Directory</span>
            </div>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight truncate">
            {club.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
            Member Board & Officers
          </p>
        </div>
      </div>

      {/* Filters - Compact */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3 rounded-xl border border-white/20">
        {/* Board Type Filter */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Board</label>
          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="bg-transparent font-bold text-slate-700 dark:text-slate-200 text-sm focus:outline-none cursor-pointer hover:text-[#002147] dark:hover:text-white transition-colors"
          >
            <option value="">All</option>
            <option value="main">Main</option>
            <option value="executive">Exec</option>
            <option value="member">Member</option>
          </select>
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>

        {/* Year Filter */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-transparent font-bold text-slate-700 dark:text-slate-200 text-sm focus:outline-none cursor-pointer hover:text-[#002147] dark:hover:text-white transition-colors"
          >
            <option value="">All</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border-dashed">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No members found</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {displayBoardOrder.map((boardType) => {
            const boardMembers = groupedMembers[boardType];
            if (boardMembers.length === 0) return null;

            return (
              <div key={boardType} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white pl-3 border-l-4 border-[#002147]">
                    {BOARD_LABELS[boardType]}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                    {boardMembers.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {boardMembers.map((member) => (
                    <div
                      key={member.id}
                      className="glass-card glass-card-hover p-3 rounded-xl group relative overflow-hidden flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full p-0.5 bg-blue-600 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-800">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-base text-slate-400">{member.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                          {member.role || 'Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center pt-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total: <span className="text-slate-900 dark:text-white font-bold">{members.length}</span>
        </p>
      </div>
    </div>
  );
}
