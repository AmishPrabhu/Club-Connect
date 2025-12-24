import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Share2, ArrowLeft } from 'lucide-react';

interface EventDetailProps {
  eventId: string;
  onBack: () => void;
}

export default function EventDetail({ eventId, onBack }: EventDetailProps) {
  // Dummy event data - in a real app, this would be fetched based on eventId
  const event = {
    id: eventId,
    title: 'Coding Workshop: Building with Gemini API',
    description: 'Join us for an exciting workshop where we\'ll explore the latest in AI development using Google\'s Gemini API. Learn how to integrate powerful AI capabilities into your applications.',
    startDate: 'Dec 25, 2025',
    endDate: 'Dec 26, 2025',
    registrationDeadline: 'Dec 20, 2025',
    time: '10:00 AM - 5:00 PM',
    venue: 'Computer Science Lab, Block A',
    capacity: 50,
    registered: 32,
    type: 'Workshop',
    color: 'from-blue-500 to-cyan-500',
    organizer: 'GDSC Club',
    tags: ['AI', 'Programming', 'Workshop'],
    agenda: [
      'Introduction to Gemini API',
      'Setting up development environment',
      'Building your first AI-powered app',
      'Best practices and Q&A'
    ]
  };

  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${event.color} text-white mb-3 inline-block`}>
              {event.type}
            </span>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">{event.description}</p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {isShared ? 'Shared!' : 'Share'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Date</div>
                <div className="text-slate-600 dark:text-slate-300">{event.startDate} - {event.endDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Time</div>
                <div className="text-slate-600 dark:text-slate-300">{event.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Venue</div>
                <div className="text-slate-600 dark:text-slate-300">{event.venue}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Capacity</div>
                <div className="text-slate-600 dark:text-slate-300">{event.registered}/{event.capacity} registered</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-2">Registration Deadline</div>
              <div className="text-slate-600 dark:text-slate-300">{event.registrationDeadline}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-2">Organizer</div>
              <div className="text-slate-600 dark:text-slate-300">{event.organizer}</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Agenda</h3>
          <div className="space-y-3">
            {event.agenda.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            Register Now
          </button>
          <button className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-slate-200 dark:border-slate-600">
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
