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

const BOARD_COLORS: Record<string, string> = {
  main: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
  executive: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  member: 'border-slate-400 bg-slate-50 dark:bg-slate-800',
};

export default function MemberBoardDetail({ club, onBack }: MemberBoardDetailProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('');
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
    ? members.filter(m => String(m.joinedAt).includes(yearFilter))
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Club Details
      </button>

      <div className="mb-4 md:mb-8 p-3 md:p-6 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-sm border-l-4 border-[#DAA520]">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden bg-[#002147] flex items-center justify-center border-2 border-[#DAA520] shadow-md flex-shrink-0">
            {club.image ? (
              <img
                src={club.image}
                alt={club.name}
                className="w-full h-full object-contain p-1.5 md:p-2 bg-white rounded-lg md:rounded-xl"
              />
            ) : (
              <span className="text-xl md:text-4xl">{club.icon}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-3xl font-serif font-bold text-[#002147] dark:text-white truncate">
              {club.name} - Member Board
            </h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Board Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Board:</label>
          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="main">Main</option>
            <option value="executive">Executive</option>
            <option value="member">Member</option>
          </select>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year:</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        {(yearFilter || boardFilter) && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Showing {boardFilter ? groupedMembers[boardFilter]?.length || 0 : filteredMembers.length} member{(boardFilter ? groupedMembers[boardFilter]?.length : filteredMembers.length) !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No members found for this club.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayBoardOrder.map((boardType) => {
            const boardMembers = groupedMembers[boardType];
            if (boardMembers.length === 0) return null;

            return (
              <div key={boardType} className={`rounded-xl border-l-4 p-6 ${BOARD_COLORS[boardType]}`}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {BOARD_LABELS[boardType]} ({boardMembers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {boardMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 md:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#002147] rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg border-2 border-[#DAA520] flex-shrink-0">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-semibold text-[#002147] dark:text-white truncate">
                            {member.name}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
                            {member.role || 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Total Members: {members.length}
        </p>
      </div>
    </div>
  );
}
