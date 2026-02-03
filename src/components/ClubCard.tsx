import { Users, Calendar, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DBClub } from '../types/auth';

interface ClubCardProps {
  club: DBClub;
  onClick: () => void;
  isLiked?: boolean;
  onToggleLike?: (clubId: string, isLiked: boolean) => void;
}

export default function ClubCard({ club, onClick, isLiked = false, onToggleLike }: ClubCardProps) {
  const [isFavorited, setIsFavorited] = useState(isLiked);

  // Sync with prop if it changes (e.g. initial load)
  // But we want local Optimistic UI too, so we bias towards local state after interaction?
  // Actually, better to just use local state initialized by prop, and update on prop change.
  useEffect(() => {
    setIsFavorited(isLiked);
  }, [isLiked]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isFavorited;
    setIsFavorited(newState); // Optimistic update

    if (onToggleLike) {
      onToggleLike(club.id!, isFavorited); // Pass CURRENT state (before toggle) or new state? 
      // Best to pass the INTENT or the NEW state. 
      // Let's pass the OLD state so parent knows what to do? Or just "toggle".
      // impl: toggleClubLike(userId, clubId, isLiked) <- isLiked here means "is it currently liked before toggle" based on my dbService
    }
  };

  // ... imports need React useEffect

  // Fix: Need to import useEffect

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 rounded-xl p-3 md:p-6 border border-slate-200 dark:border-slate-800 hover:border-[#002147] dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#DAA520] to-[#002147]"></div>

      {/* Favorite Button - Absolute Top Right */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 right-2 md:top-3 md:right-3 p-1 md:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        aria-label={isFavorited ? "Unlike club" : "Like club"}
      >
        <Heart
          className={`w-3.5 h-3.5 md:w-5 md:h-5 transition-colors ${isFavorited
            ? 'text-red-500 fill-red-500'
            : 'text-slate-400 hover:text-red-400'
            }`}
        />
      </button>

      <div className="flex items-start justify-between mb-2 md:mb-4 mt-1">
        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-inner flex-shrink-0`}>
          {club.image ? (
            <img src={club.image} alt={club.name} className="w-full h-full object-cover rounded-lg md:rounded-xl" />
          ) : (
            <span className="text-xl md:text-3xl">{club.icon}</span>
          )}
        </div>
      </div>

      <h3 className="text-sm md:text-xl font-serif font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#002147] dark:group-hover:text-blue-400 transition-colors line-clamp-1">
        {club.name}
      </h3>
      <p className="text-[11px] md:text-sm text-slate-600 dark:text-slate-300 mb-2 md:mb-4 line-clamp-2 md:min-h-[40px] flex-grow">
        {club.description}
      </p>

      <div className="flex items-center gap-2 mb-2 md:mb-4">
        <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/30 text-[#002147] dark:text-blue-300 border border-blue-100 dark:border-blue-800 truncate">
          {club.category}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-4 w-full">
          <div className="flex items-center gap-1 text-[9px] md:text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            <span>{club.members}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] md:text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            <span>{club.upcomingEvents} Events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
