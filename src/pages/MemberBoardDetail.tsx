import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Crown, Mail } from 'lucide-react';
import { ClubMember } from '../types/auth';
import { getClubMembers } from '../lib/dbService';

interface MemberBoardDetailProps {
  club: any;
  onBack: () => void;
}

export default function MemberBoardDetail({ club, onBack }: MemberBoardDetailProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch members from Firestore
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

  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('president')) {
      return <Crown className="w-5 h-5 text-[#DAA520]" />;
    }
    return <Users className="w-5 h-5 text-[#002147]" />;
  };

  const formatRole = (role: string) => {
    return role.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Club Details
      </button>

      <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-l-4 border-[#DAA520]">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#002147] flex items-center justify-center border-2 border-[#DAA520] shadow-md">
            {club.image ? (
              <img
                src={club.image}
                alt={club.name}
                className="w-full h-full object-contain p-2 bg-white rounded-xl"
              />
            ) : (
              <span className="text-4xl">{club.icon}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#002147] dark:text-white">
              {club.name} - Member Board
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium mt-1">
              Meet the dedicated members who make {club.name} thrive
            </p>
          </div>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow hover:border-[#DAA520]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#002147] rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-[#DAA520]">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif font-bold text-[#002147] dark:text-white">
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {formatRole(member.role)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm pt-4 border-t border-slate-100 dark:border-slate-700">
                <Mail className="w-4 h-4 text-[#DAA520]" />
                <a
                  href={`mailto:${member.email}`}
                  className="text-[#002147] dark:text-blue-400 hover:underline font-medium"
                >
                  {member.email}
                </a>
              </div>
            </div>
          ))}
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
