import { X, User, GraduationCap, Shield } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap, color: 'from-blue-600 to-blue-700' },
    { id: 'teacher', label: 'Teacher', icon: User, color: 'from-emerald-600 to-emerald-700' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'from-amber-600 to-amber-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Your Role</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="space-y-3">
          {roles.map((role) => (
            <button
              key={role.id}
              className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${role.color} text-white hover:shadow-lg transform hover:scale-105 transition-all`}
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <role.icon className="w-6 h-6" />
              </div>
              <span className="text-lg font-semibold">Login as {role.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
