export type UserRole = 'user' | 'club-secretary' | 'admin' | 'president' | 'treasurer' | 'advisor';

// Club member roles
export type ClubMemberRole = 'president' | 'vice-president' | 'treasurer' | 'secretary' | 'coordinator' | 'member';

// Club message structure
export interface ClubMessage {
  id?: string;
  clubId: string;
  clubName: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  title: string;
  body: string;
  createdAt: Date;
}

// Club member structure (stored as subcollection in club)
export interface ClubMember {
  id?: string;
  name: string;
  email: string;
  role: string; // Custom role (e.g., "President", "App Executive", "Member")
  boardType: 'main' | 'executive' | 'member'; // Main Board (TY), Executive Board (SY), Member Board (FY)
  academicYear?: string;
  profileImage?: string; // Profile picture URL
  joinedAt: Date;
}

// Club membership for multi-club support (used in UI for club switching)
export interface ClubMembership {
  clubId: string;
  clubName: string;
  clubImage?: string;
  clubIcon?: string;
  clubColor?: string;
  role: string; // 'Secretary', 'President', 'Treasurer', 'Advisor', 'Member', etc.
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
  likedClubs?: string[]; // Array of club IDs
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  memberships: ClubMembership[];
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; lockoutDuration?: number }>;
  signUp: (email: string, password: string, name: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (credential?: string) => Promise<{ success: boolean; error?: string; needsSignup?: boolean; googleData?: { email: string; name: string; credential: string } }>;
  signUpWithGoogle: (credential: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

// Firestore user document structure (stored in 'users' collection)
export interface DBUser {
  email: string;
  name: string;
  role: UserRole;
  clubId?: string;
  clubName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore club document structure
export interface DBClub {
  id?: string;
  name: string;
  slug?: string;
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
  advisorId?: string;
  advisorEmail?: string;
  advisorName?: string;
  whatsappLink?: string;  // WhatsApp community invite link
  instagramLink?: string; // Instagram profile link
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

// Event Task structure for role assignments
export interface EventTask {
  id: string;
  title: string;
  assignedTo: string[];           // Array of member names
  assignedToEmails?: string[];    // Array of member emails
  deadline?: string;              // Deadline date (YYYY-MM-DD format)
  status: 'pending' | 'in-progress' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface DBTask {
  id: string;
  title: string;
  description: string;
  clubId: string;
  assignedTo: string[];
  assignedToEmails: string[];
  status: 'pending' | 'in-progress' | 'completed';
  deadline?: string;
  relatedEventId?: string;
  relatedEventTitle?: string;
  createdBy: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}



// Firestore post document structure
export interface DBPost {
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
  responseSpreadsheetUrl?: string;  // Optional Google Sheets URL for form responses
  eventWhatsappLink?: string;      // Optional WhatsApp group link for the event
  attachments?: Attachment[];      // Description images (uploaded when creating post)
  eventPhotos?: Attachment[];      // Event photos/videos (uploaded after event by secretary)
  relatedEventId?: string;         // For announcements: ID of a related upcoming event
  relatedEventTitle?: string;      // For announcements: Title of the related event
  eventTasks?: EventTask[];        // Tasks assigned to members for this event

  // Budget fields
  budgetImage?: string;            // URL of uploaded budget file/image
  budgetVerified?: boolean;        // Whether budget has been verified by advisor
  budgetVerifiedBy?: string;       // User ID of advisor who verified
  budgetVerifiedAt?: Date;         // When budget was verified

  // Certificate generation fields
  certificateTemplate?: {
    templateUrl: string;
    namePosition: {
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      color: string;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

// Firestore notification document structure
export interface DBNotification {
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

// Event RSVP structure (stored as subcollection under posts)
export interface EventRSVP {
  id?: string;
  eventId: string;
  name: string;
  email: string;
  rsvpedAt: Date;
  attendance?: 'present' | 'absent' | 'pending';  // Attendance status for the event
  certificateUrl?: string;  // URL of generated certificate for this participant
}

// Certificate configuration for name positioning
export interface CertificateNamePosition {
  x: number;      // X position (percentage)
  y: number;      // Y position (percentage)
  fontSize: number;
  fontFamily: string;
  color: string;
}
