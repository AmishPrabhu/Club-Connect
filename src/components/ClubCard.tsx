import { Users, Calendar, ArrowRight, Heart } from 'lucide-react';
import { useState } from 'react';
import { DBClub } from '../types/auth';

interface ClubCardProps {
  club: DBClub;
  onClick: () => void;
}

export default function ClubCard({ club, onClick }: ClubCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setIsFavorited(!isFavorited);
  };
  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-[#002147] dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#DAA520] to-[#002147]"></div>

      <div className="flex items-start justify-between mb-4 mt-2">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-inner`}>
          {club.image ? (
            <img src={club.image} alt={club.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-3xl">{club.icon}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Favorite club"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isFavorited
                ? 'text-red-500 fill-red-500'
                : 'text-slate-400 hover:text-red-400'
                }`}
            />
          </button>
        </div>
      </div>

      <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors line-clamp-1">
        {club.name}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 min-h-[40px]">
        {club.description}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/30 text-[#002147] dark:text-blue-300 border border-blue-100 dark:border-blue-800">
          {club.category}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Users className="w-4 h-4" />
            <span>{club.members}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{club.upcomingEvents} Events</span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#002147] group-hover:text-[#DAA520] transition-colors">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
