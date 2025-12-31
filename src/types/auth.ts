export type UserRole = 'user' | 'club-secretary' | 'admin' | 'president' | 'treasurer';

// Club member roles
export type ClubMemberRole = 'president' | 'vice-president' | 'treasurer' | 'secretary' | 'coordinator' | 'member';

// Club member structure (stored as subcollection in club)
export interface ClubMember {
  id?: string;
  name: string;
  email: string;
  role: ClubMemberRole;
  joinedAt: Date;
}

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
  presidentId?: string;
  presidentEmail?: string;
  treasurerId?: string;
  treasurerEmail?: string;
  whatsappLink?: string;  // WhatsApp community invite link
  createdAt: Date;
  updatedAt: Date;
}

// Attachment structure for posts (Cloudinary uploads)
export interface Attachment {
  url: string;
  publicId: string;  // Cloudinary public ID for management
  type: 'image' | 'video' | 'pdf' | 'link';
  label?: string;
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
  time?: string;  // Optional time span (e.g., "2:00 PM - 5:00 PM")
  location?: string;  // Optional location for events
  locationType?: 'campus' | 'external';  // Whether location is on campus or external
  locationUrl?: string;  // Google Maps URL for external locations
  rsvps?: number;
  registrationStart?: string;  // Registration start date (YYYY-MM-DD)
  registrationStartTime?: string;  // Registration start time (e.g., "10:00 AM")
  registrationEnd?: string;    // Registration end date (YYYY-MM-DD)
  registrationEndTime?: string;  // Registration end time (e.g., "5:00 PM")
  coverImage?: string;             // Main cover image for the post
  registrationLink?: string;       // Optional registration link for events
  eventWhatsappLink?: string;      // Optional WhatsApp group link for the event
  attachments?: Attachment[];      // Description images (uploaded when creating post)
  eventPhotos?: Attachment[];      // Event photos/videos (uploaded after event by secretary)
  relatedEventId?: string;         // For announcements: ID of a related upcoming event
  relatedEventTitle?: string;      // For announcements: Title of the related event
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
  relatedId?: string; // ID of the related entity (e.g., postId)
  read: boolean;
  createdAt: Date;
}
