import { Users, Calendar, ArrowRight, Heart } from 'lucide-react';
import { useState } from 'react';

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  icon: string;
  image: string | null;
  color: string;
  upcomingEvents: number;
}

interface ClubCardProps {
  club: Club;
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
      className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer border border-slate-200 dark:border-slate-700 hover-lift animate-fadeIn"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${club.color} flex items-center justify-center text-3xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg overflow-hidden`}>
          {club.image ? (
            <img src={club.image} alt={club.name} className="w-full h-full object-contain p-2 bg-white" />
          ) : (
            club.icon
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
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {club.name}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
        {club.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Users className="w-4 h-4" />
          <span className="font-semibold">{club.members}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span className="font-semibold">{club.upcomingEvents} events</span>
        </div>
      </div>

      <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${club.color} text-white`}>
        {club.category}
      </div>
    </div>
  );
}
