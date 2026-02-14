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
      className="group glass-card glass-card-hover relative overflow-hidden flex flex-col h-full cursor-pointer p-5 transition-all duration-300 border-t border-white/10"
    >
      {/* Top Gradient Line (optional, enhances neon feel) */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Favorite Button - Absolute Top Right */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors z-20 group-hover:scale-110 duration-200"
        aria-label={isFavorited ? "Unlike club" : "Like club"}
      >
        <Heart
          className={`w-5 h-5 transition-colors ${isFavorited
            ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'
            : 'text-slate-400 group-hover:text-pink-400'
            }`}
        />
      </button>

      {/* Header: Icon + Category Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-white/10 bg-slate-800/50 shadow-inner backdrop-blur-sm group-hover:border-cyan-500/30 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300`}>
          {club.image ? (
            <img src={club.image} alt={club.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="drop-shadow-md">{club.icon}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1 tracking-tight">
          {club.name}
        </h3>

        {/* Categories / Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-100/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
            {club.category}
          </span>
          {club.departments?.slice(0, 1).map(dept => (
            <span key={dept} className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
              {dept.match(/\(([^)]+)\)/)?.[1] || dept}
            </span>
          ))}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {club.fullForm || club.description}
        </p>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500">
            <Users className="w-3.5 h-3.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
            <span>{club.members}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Calendar className="w-3.5 h-3.5 group-hover:text-purple-400 transition-colors" />
            <span>{club.upcomingEvents} Events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
