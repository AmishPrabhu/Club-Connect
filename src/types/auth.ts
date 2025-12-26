export type UserRole = 'user' | 'club-secretary' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clubId?: string; // For club secretaries
  clubName?: string; // For club secretaries
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Firestore user document structure (stored in 'users' collection)
export interface FirestoreUser {
  email: string;
  name: string;
  role: UserRole;
  clubId?: string;
  clubName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore club document structure
export interface FirestoreClub {
  id?: string;
  name: string;
  description: string;
  category: 'technical' | 'academic' | 'cultural' | 'sports';
  members: number;
  icon: string;
  image: string;
  color: string;
  upcomingEvents: number;
  secretaryId?: string;
  secretaryEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore post document structure
export interface FirestorePost {
  id?: string;
  title: string;
  content: string;
  clubId: string;
  clubName: string;
  authorId: string;
  authorName: string;
  type: 'event' | 'announcement';
  status: 'draft' | 'published';
  date: string;
  rsvps?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore notification document structure
export interface FirestoreNotification {
  id?: string;
  title: string;
  message: string;
  type: 'system' | 'club' | 'event' | 'announcement';
  userId?: string; // Target user, empty for global
  clubId?: string; // Source club
  read: boolean;
  createdAt: Date;
}
