export type UserRole = 'user' | 'club-secretary' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clubId?: string; // For club secretaries
  clubName?: string; // For club secretaries
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Mock data for demonstration
export const mockUsers = [
  {
    id: 'admin1',
    email: 'admin@wce.ac.in',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin' as UserRole,
  },
  {
    id: 'secretary1',
    email: 'secretary@gdsc.wce.ac.in',
    password: 'secretary123',
    name: 'GDSC Secretary',
    role: 'club-secretary' as UserRole,
    clubId: 'gdsc',
    clubName: 'GDG',
  },
  {
    id: 'secretary2',
    email: 'secretary@mlsc.wce.ac.in',
    password: 'secretary123',
    name: 'MLSC Secretary',
    role: 'club-secretary' as UserRole,
    clubId: 'mlsc',
    clubName: 'MLSC',
  },
  {
    id: 'user1',
    email: 'student@wce.ac.in',
    password: 'student123',
    name: 'Student User',
    role: 'user' as UserRole,
  },
];
