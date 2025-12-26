import { useState } from 'react';
import { ArrowLeft, Users, Crown, Mail, Phone } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface MemberBoardDetailProps {
  club: any;
  onBack: () => void;
}

export default function MemberBoardDetail({ club, onBack }: MemberBoardDetailProps) {
  // Mock member data - in a real app, this would come from an API
  const [members] = useState<Member[]>([
    {
      id: '1',
      name: 'John Doe',
      role: 'President',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Vice President',
      email: 'jane.smith@example.com',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      role: 'Secretary',
      email: 'bob.johnson@example.com',
      phone: '+1 (555) 987-6543',
    },
    {
      id: '4',
      name: 'Alice Brown',
      role: 'Treasurer',
      email: 'alice.brown@example.com',
    },
    {
      id: '5',
      name: 'Charlie Wilson',
      role: 'Member',
      email: 'charlie.wilson@example.com',
    },
  ]);

  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('president')) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    }
    return <Users className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Club Details
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
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
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">
            {club.name} - Member Board
          </h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Meet the dedicated members who make {club.name} thrive
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {member.name}
                </h3>
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-500" />
                <a
                  href={`mailto:${member.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {member.email}
                </a>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <a
                    href={`tel:${member.phone}`}
                    className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {member.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Total Members: {members.length}
        </p>
      </div>
    </div>
  );
}
