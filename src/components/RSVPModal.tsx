import { X, Calendar, MapPin, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string | number;
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: number;
  };
  clubName: string;
}

export default function RSVPModal({ isOpen, onClose, event, clubName }: RSVPModalProps) {
  const [step, setStep] = useState<'confirm' | 'success' | 'error'>('confirm');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRSVP = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setStep('success');
  };

  const handleClose = () => {
    setStep('confirm');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-slideUp">
        {step === 'confirm' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Confirm RSVP</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">by {clubName}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">RSVP Confirmation</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      By confirming, you'll receive email reminders and updates about this event. You can cancel your RSVP anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRSVP}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm RSVP'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">RSVP Confirmed!</h2>
              <p className="text-slate-600 dark:text-slate-300">
                You're all set for {event.title}. Check your email for event details and reminders.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Parse the date and time to create Google Calendar URL
                  const eventDate = new Date(event.date);

                  // Check if time is specified
                  const hasTime = event.time && event.time !== 'Time not specified';

                  let googleCalendarUrl: string;

                  if (hasTime) {
                    const [startTimeStr, endTimeStr] = event.time.split(' - ');

                    // Helper to parse time like "2:00 PM" to hours and minutes
                    const parseTime = (timeStr: string) => {
                      const match = timeStr?.match(/(\d+):(\d+)\s*(AM|PM)/i);
                      if (!match) return { hours: 9, minutes: 0 }; // Default 9 AM
                      let hours = parseInt(match[1]);
                      const minutes = parseInt(match[2]);
                      const period = match[3].toUpperCase();
                      if (period === 'PM' && hours !== 12) hours += 12;
                      if (period === 'AM' && hours === 12) hours = 0;
                      return { hours, minutes };
                    };

                    const startTime = parseTime(startTimeStr);
                    const endTime = endTimeStr ? parseTime(endTimeStr) : { hours: startTime.hours + 2, minutes: startTime.minutes };

                    const startDate = new Date(eventDate);
                    startDate.setHours(startTime.hours, startTime.minutes, 0);

                    const endDate = new Date(eventDate);
                    endDate.setHours(endTime.hours, endTime.minutes, 0);

                    // Format dates for Google Calendar in LOCAL time (YYYYMMDDTHHmmss)
                    const formatForGoogle = (date: Date) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      const seconds = String(date.getSeconds()).padStart(2, '0');
                      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
                    };

                    googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title + ' - ' + clubName)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent('Event by ' + clubName + '. RSVP confirmed via Club-Connect.')}&location=${encodeURIComponent(event.location)}`;
                  } else {
                    // All-day event format (YYYYMMDD) - use local date components
                    const formatDateOnly = (date: Date) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}${month}${day}`;
                    };
                    const nextDay = new Date(eventDate);
                    nextDay.setDate(nextDay.getDate() + 1);

                    googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title + ' - ' + clubName)}&dates=${formatDateOnly(eventDate)}/${formatDateOnly(nextDay)}&details=${encodeURIComponent('Event by ' + clubName + '. RSVP confirmed via Club-Connect.')}&location=${encodeURIComponent(event.location)}`;
                  }

                  window.open(googleCalendarUrl, '_blank');
                }}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Add to Google Calendar
              </button>

              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Got it!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
