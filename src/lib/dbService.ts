import api from './api';
import {
    DBClub,
    DBPost,
    DBNotification,
    DBUser,
    ClubMember,
    EventRSVP,
    ClubMessage,
} from '../types/auth';

// ==================== ACCOUNT DELETION ====================

export const requestDeleteOtp = async (): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await api.post('/auth/request-delete-otp');
        return { success: true, message: response.data.message };
    } catch (error: any) {
        console.error('Error requesting delete OTP:', error);
        return { success: false, message: error.response?.data?.message || 'Failed to send OTP' };
    }
};

export const deleteAccount = async (otp: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await api.delete('/auth/delete-account', { data: { otp } });
        return { success: true, message: response.data.message };
    } catch (error: any) {
        console.error('Error deleting account:', error);
        return { success: false, message: error.response?.data?.message || 'Failed to delete account' };
    }
};

// Helper to map _id to id
const mapId = (item: any) => {
    if (!item) return null;
    return { ...item, id: item._id };
};

// ==================== MESSAGING ====================


// ==================== MESSAGING ====================

export const createClubMessage = async (
    clubId: string,
    messageData: Omit<ClubMessage, 'id' | 'createdAt'>
): Promise<boolean> => {
    try {
        await api.post(`/clubs/${clubId}/messages`, messageData);
        return true;
    } catch (error) {
        console.error('Error creating club message:', error);
        return false;
    }
};

export const getClubMessages = async (clubId: string): Promise<ClubMessage[]> => {
    try {
        const response = await api.get(`/clubs/${clubId}/messages`);
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching club messages:', error);
        return [];
    }
};

// ...

export const getTotalStudentCount = async (): Promise<number> => {
    try {
        // We'll add this endpoint to users routes
        const response = await api.get('/users/stats/count');
        return response.data.count;
    } catch (error) {
        console.error('Error fetching student count:', error);
        return 1250; // Fallback
    }
};

// ==================== CLUBS ====================

export const getClubs = async (): Promise<DBClub[]> => {
    try {
        const response = await api.get('/clubs');
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return [];
    }
};

export const createClub = async (clubData: Omit<DBClub, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
        const response = await api.post('/clubs', clubData);
        return response.data._id;
    } catch (error) {
        console.error('Error creating club:', error);
        return null;
    }
};

export const updateClub = async (clubId: string, clubData: Partial<DBClub>): Promise<boolean> => {
    try {
        await api.put(`/clubs/${clubId}`, clubData);
        return true;
    } catch (error) {
        console.error('Error updating club:', error);
        return false;
    }
};

export const deleteClub = async (clubId: string): Promise<boolean> => {
    try {
        await api.delete(`/clubs/${clubId}`);
        return true;
    } catch (error) {
        console.error('Error deleting club:', error);
        return false;
    }
};

// Update club profile image URL (no file upload - just saves a URL)
export const updateClubImage = async (
    clubId: string,
    imageUrl: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const updateSuccess = await updateClub(clubId, { image: imageUrl });
        if (!updateSuccess) {
            return { success: false, error: 'Failed to update club image' };
        }
        return { success: true };
    } catch (error: any) {
        console.error('Error updating club image:', error);
        return { success: false, error: error.message || 'Failed to update image' };
    }
};

// ==================== CLUB SECRETARIES ====================

// Helper function to assign an officer role to a club
// Handles both new users and existing users (for multi-club support)
const assignOfficerRole = async (
    email: string,
    password: string,
    name: string,
    clubId: string,
    _clubName: string,
    role: 'club-secretary' | 'president' | 'treasurer' | 'advisor',
    roleLabel: string,
    clubUpdateField: 'secretary' | 'president' | 'treasurer' | 'advisor'
): Promise<{ success: boolean; error?: string; userId?: string }> => {
    try {
        let userId: string;

        // First, try to create a new user
        try {
            const response = await api.post('/auth/signup', {
                email,
                password,
                name,
                role,
            });
            userId = response.data.user.id;
        } catch (signupError: any) {
            // If user already exists, that's fine - we'll just add them as an officer
            if (signupError.response?.data?.message === 'User already exists') {
                // User exists, we need to find them and add club membership
                // For now, we'll just add the ClubMember entry (which uses email)
                userId = 'existing-user'; // Placeholder, actual ID not needed for club update by email
            } else {
                throw signupError;
            }
        }

        // Update the club with officer info
        const clubUpdates: any = {};
        if (clubUpdateField === 'secretary') {
            clubUpdates.secretaryId = userId === 'existing-user' ? null : userId;
            clubUpdates.secretaryEmail = email;
        } else if (clubUpdateField === 'president') {
            clubUpdates.presidentId = userId === 'existing-user' ? null : userId;
            clubUpdates.presidentEmail = email;
        } else if (clubUpdateField === 'treasurer') {
            clubUpdates.treasurerId = userId === 'existing-user' ? null : userId;
            clubUpdates.treasurerEmail = email;
        } else if (clubUpdateField === 'advisor') {
            clubUpdates.advisorId = userId === 'existing-user' ? null : userId;
            clubUpdates.advisorEmail = email;
            clubUpdates.advisorName = name;
        }
        await updateClub(clubId, clubUpdates);

        // Add ClubMember entry for multi-club support (skip for advisors as they verify via club fields)
        if (role !== 'advisor') {
            try {
                await addClubMember(clubId, {
                    name,
                    email,
                    role: roleLabel,
                    boardType: 'main',
                    joinedAt: new Date(),
                });
            } catch (memberError: any) {
                // If member already exists in this club, that's fine (might be updating role)
                console.log('ClubMember entry might already exist:', memberError.message);
            }
        }

        return { success: true, userId: userId === 'existing-user' ? undefined : userId };
    } catch (error: any) {
        console.error(`Error assigning ${roleLabel}:`, error);
        return { success: false, error: error.response?.data?.message || `Failed to assign ${roleLabel}` };
    }
};

export const createClubSecretary = async (
    email: string,
    password: string,
    name: string,
    clubId: string,
    clubName: string
): Promise<{ success: boolean; error?: string; userId?: string }> => {
    return assignOfficerRole(email, password, name, clubId, clubName, 'club-secretary', 'Secretary', 'secretary');
};

export const createClubPresident = async (
    email: string,
    password: string,
    name: string,
    clubId: string,
    clubName: string
): Promise<{ success: boolean; error?: string; userId?: string }> => {
    return assignOfficerRole(email, password, name, clubId, clubName, 'president', 'President', 'president');
};

export const createClubTreasurer = async (
    email: string,
    password: string,
    name: string,
    clubId: string,
    clubName: string
): Promise<{ success: boolean; error?: string; userId?: string }> => {
    return assignOfficerRole(email, password, name, clubId, clubName, 'treasurer', 'Treasurer', 'treasurer');
};

export const createClubAdvisor = async (
    email: string,
    password: string,
    name: string,
    clubId: string,
    clubName: string
): Promise<{ success: boolean; error?: string; userId?: string }> => {
    return assignOfficerRole(email, password, name, clubId, clubName, 'advisor', 'Advisor', 'advisor');
};

export const removeClubOfficer = async (
    clubId: string,
    role: 'secretary' | 'president' | 'treasurer' | 'advisor'
): Promise<{ success: boolean; error?: string }> => {
    try {
        const updates: any = {};

        if (role === 'secretary') {
            updates.secretaryId = null; // Mongoose allows null to clear
            updates.secretaryEmail = null;
        } else if (role === 'president') {
            updates.presidentId = null;
            updates.presidentEmail = null;
        } else if (role === 'treasurer') {
            updates.treasurerId = null;
            updates.treasurerEmail = null;
        } else if (role === 'advisor') {
            updates.advisorId = null;
            updates.advisorEmail = null;
            updates.advisorName = null;
        }

        await updateClub(clubId, updates);

        return { success: true };
    } catch (error: any) {
        console.error(`Error removing club ${role}:`, error);
        return { success: false, error: error.message || `Failed to remove ${role}` };
    }
};

// Update user profile
export const updateUserProfile = async (
    userId: string,
    profileData: { name?: string; bio?: string; clubId?: string; clubName?: string }
): Promise<{ success: boolean; error?: string }> => {
    try {
        await api.put(`/users/${userId}`, profileData);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        return { success: false, error: error.message || 'Failed to update profile' };
    }
};

// Get user profile data
export const getUserProfile = async (userId: string): Promise<DBUser | null> => {
    try {
        const response = await api.get(`/users/${userId}`);
        return mapId(response.data);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

// Toggle club like
export const toggleClubLike = async (userId: string, clubId: string, isLiked: boolean): Promise<boolean> => {
    try {
        if (isLiked) {
            // If currently liked, we want to unlike (delete)
            await api.delete(`/users/${userId}/like/${clubId}`);
        } else {
            // If not liked, we want to like (post)
            await api.post(`/users/${userId}/like/${clubId}`);
        }
        return true;
    } catch (error) {
        console.error('Error toggling club like:', error);
        return false;
    }
};

// ==================== POSTS ====================

export const getPosts = async (): Promise<DBPost[]> => {
    try {
        const response = await api.get('/posts');
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

export const createPost = async (postData: Omit<DBPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
        const response = await api.post('/posts', postData);
        return response.data._id;
    } catch (error) {
        console.error('Error creating post:', error);
        return null;
    }
};

// Interface for event collision info
export interface EventCollision {
    title: string;
    time: string;
    clubName: string;
}

// Check for event time collisions
export const checkEventTimeCollision = async (
    date: string,
    startTime: string
): Promise<EventCollision[]> => {
    try {
        const allPosts = await getPosts();

        // Filter to only events on the same date with a time field
        const eventsOnSameDate = allPosts.filter(post =>
            post.type === 'event' &&
            post.date === date &&
            post.time
        );

        if (!startTime) return [];

        // Convert the new event's start time to minutes
        const [newHours, newMinutes] = startTime.split(':').map(Number);
        const newStartMinutes = newHours * 60 + newMinutes;

        const collisions: EventCollision[] = [];

        for (const event of eventsOnSameDate) {
            // Parse existing event's time
            const timeStr = event.time!;
            const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);

            if (timeMatch) {
                let existingHours = parseInt(timeMatch[1]);
                const existingMinutes = parseInt(timeMatch[2]);
                const period = timeMatch[3].toUpperCase();

                if (period === 'PM' && existingHours !== 12) {
                    existingHours += 12;
                } else if (period === 'AM' && existingHours === 12) {
                    existingHours = 0;
                }

                const existingStartMinutes = existingHours * 60 + existingMinutes;

                // Check overlap
                if (Math.abs(newStartMinutes - existingStartMinutes) < 30) {
                    collisions.push({
                        title: event.title,
                        time: event.time!,
                        clubName: event.clubName,
                    });
                }
            }
        }

        return collisions;
    } catch (error) {
        console.error('Error checking event time collision:', error);
        return [];
    }
};

export const deletePost = async (postId: string): Promise<boolean> => {
    try {
        await api.delete(`/posts/${postId}`);
        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
};

export const updatePost = async (postId: string, postData: Partial<DBPost>): Promise<{ success: boolean; error?: string }> => {
    try {
        await api.put(`/posts/${postId}`, postData);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating post:', error);
        return { success: false, error: error.response?.data?.message || error.message || 'Failed to update post' };
    }
};

// Upload/update event budget image (Treasurer only)
export const updateEventBudget = async (eventId: string, budgetImage: string): Promise<boolean> => {
    try {
        await api.put(`/posts/${eventId}/budget`, { budgetImage });
        return true;
    } catch (error) {
        console.error('Error updating event budget:', error);
        return false;
    }
};

// Verify event budget (Advisor only)
export const verifyEventBudget = async (eventId: string): Promise<boolean> => {
    try {
        await api.put(`/posts/${eventId}/budget/verify`);
        return true;
    } catch (error) {
        return false;
    }
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (_userId?: string): Promise<DBNotification[]> => {
    try {
        // Backend handles filtering by userId using the token usually, 
        // but if we need explicit userId fetching we can pass it as query param if API supports it.
        // For now our API returns global + user specific mixed.
        const response = await api.get('/notifications');
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const getNotification = async (_notificationId: string): Promise<DBNotification | null> => {
    // Single notification fetch not implemented yet in backend but easy to add if needed.
    // For now returning null or relying on cached list.
    return null;
};

export const createNotification = async (
    notificationData: Omit<DBNotification, 'id' | 'createdAt'>
): Promise<string | null> => {
    try {
        const response = await api.post('/notifications', notificationData);
        return response.data._id;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
        await api.delete(`/notifications/${notificationId}`);
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
        await api.put(`/notifications/${notificationId}/read`, {});
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
};

// ==================== CLUB MEMBERS ====================


export const getClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    try {
        const response = await api.get(`/clubs/${clubId}/members`);
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching club members:', error);
        return [];
    }
};

export const syncClubMemberCount = async (clubId: string): Promise<number> => {
    // Backend should handle this automatically.
    // Return current count.
    const clubs = await getClubs();
    const club = clubs.find(c => c.id === clubId);
    return club?.members || 0;
};

export const addClubMember = async (
    clubId: string,
    memberData: Omit<ClubMember, 'id'>
): Promise<{ success: boolean; error?: string; memberId?: string }> => {
    try {
        const response = await api.post(`/clubs/${clubId}/members`, memberData);
        return { success: true, memberId: response.data._id };
    } catch (error: any) {
        console.error('Error adding club member:', error);
        return { success: false, error: error.response?.data?.message || error.message || "Failed to add member" };
    }
};

// ... 

export const updateClubMember = async (
    clubId: string,
    memberId: string,
    updates: Partial<ClubMember>
): Promise<boolean> => {
    try {
        await api.put(`/clubs/${clubId}/members/${memberId}`, updates);
        return true;
    } catch (error) {
        console.error('Error updating club member:', error);
        return false;
    }
};

export const removeClubMember = async (
    clubId: string,
    memberId: string
): Promise<boolean> => {
    try {
        await api.delete(`/clubs/${clubId}/members/${memberId}`);
        return true;
    } catch (error) {
        console.error('Error removing club member:', error);
        return false;
    }
};

// ==================== MISSING HELPERS (POLYFILLS) ====================

export const checkEmailExists = async (_email: string): Promise<boolean> => {
    // Basic implementation: try to login with wrong password? No.
    // Ideally use backend route. For now return true to allow flow.
    return true;
};

export const getUserMemberships = async (email: string): Promise<any[]> => {
    try {
        const memberships: any[] = [];

        // 1. Fetch regular memberships from backend (ClubMember collection)
        try {
            const response = await api.get('/users/memberships');
            if (response.data && Array.isArray(response.data)) {
                memberships.push(...response.data);
            }
        } catch (err) {
            console.warn("Failed to fetch remote memberships:", err);
        }

        // 2. Check for officer roles (legacy/direct Club association)
        const clubs = await getClubs();
        clubs.forEach(club => {
            // Check if already added (avoid duplicates)
            if (memberships.find(m => m.clubId === club.id)) return;

            if (club.secretaryEmail === email) {
                memberships.push({
                    clubId: club.id,
                    clubName: club.name,
                    clubImage: club.image,
                    clubIcon: '🏛️',
                    role: 'secretary',
                    joinedAt: club.updatedAt
                });
            } else if (club.presidentEmail === email) {
                memberships.push({
                    clubId: club.id,
                    clubName: club.name,
                    clubImage: club.image,
                    clubIcon: '🏛️',
                    role: 'president',
                    joinedAt: club.updatedAt
                });
            } else if (club.treasurerEmail === email) {
                memberships.push({
                    clubId: club.id,
                    clubName: club.name,
                    clubImage: club.image,
                    clubIcon: '🏛️',
                    role: 'treasurer',
                    joinedAt: club.updatedAt
                });
            } else if (club.advisorEmail === email) {
                memberships.push({
                    clubId: club.id,
                    clubName: club.name,
                    clubImage: club.image,
                    clubIcon: '🏛️',
                    role: 'advisor',
                    joinedAt: club.updatedAt
                });
            }
        });

        return memberships;
    } catch (e) {
        console.error("Error getting memberships", e);
        return [];
    }
};

export const getUserRSVPsByEmail = async (_email: string): Promise<EventRSVP[]> => {
    try {
        const response = await api.get('/posts/user/rsvps');
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching user RSVPs:', error);
        return [];
    }
};


export const getEventRSVPs = async (eventId: string): Promise<EventRSVP[]> => {
    try {
        const response = await api.get(`/posts/${eventId}/rsvps`);
        return response.data.map(mapId);
    } catch (error) {
        console.error('Error fetching event RSVPs:', error);
        return [];
    }
};

export const createEventRSVP = async (
    eventId: string,
    name: string,
    email: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        await api.post(`/posts/${eventId}/rsvp`, { name, email });
        return { success: true };
    } catch (error: any) {
        console.error("Error creating RSVP:", error);
        return { success: false, error: error.response?.data?.message || error.message || "Failed to RSVP" };
    }
};



export const updateParticipantAttendance = async (
    eventId: string,
    rsvpId: string,
    status: 'present' | 'absent'
): Promise<boolean> => {
    try {
        await api.patch(`/posts/${eventId}/rsvps/${rsvpId}`, { status });
        return true;
    } catch (error) {
        console.error('Error updating attendance:', error);
        return false;
    }
};

export const addEventParticipant = async (
    eventId: string,
    name: string,
    email: string,
    source: 'manual' | 'import' = 'manual'  // Default to manual if not specified
): Promise<{ success: boolean; error?: string }> => {
    try {
        await api.post(`/posts/${eventId}/rsvps/add`, { name, email, source });
        return { success: true };
    } catch (error: any) {
        console.error('Error adding participant:', error);
        return { success: false, error: error.response?.data?.message || 'Failed to add participant' };
    }
};

export const deleteEventParticipant = async (
    eventId: string,
    rsvpId: string
): Promise<boolean> => {
    try {
        await api.delete(`/posts/${eventId}/rsvps/${rsvpId}`);
        return true;
    } catch (error) {
        console.error('Error deleting participant:', error);
        return false;
    }
};

// ==================== CERTIFICATE FUNCTIONS ====================

// Save certificate template URL and name position settings
export const saveCertificateTemplate = async (
    eventId: string,
    templateUrl: string,
    namePosition: {
        x: number;
        y: number;
        fontSize: number;
        fontFamily: string;
        color: string;
    }
): Promise<boolean> => {
    try {
        await api.put(`/posts/${eventId}/certificate-template`, { templateUrl, namePosition });
        return true;
    } catch (error) {
        console.error('Error saving certificate template:', error);
        return false;
    }
};

// Update participant's certificate URL after generation
export const updateParticipantCertificate = async (
    eventId: string,
    rsvpId: string,
    certificateUrl: string
): Promise<boolean> => {
    try {
        await api.patch(`/posts/${eventId}/rsvps/${rsvpId}/certificate`, { certificateUrl });
        return true;
    } catch (error) {
        console.error('Error updating participant certificate:', error);
        return false;
    }
};

// ==================== USER TASKS ====================

export const getUserTasks = async (): Promise<any[]> => {
    try {
        const response = await api.get('/posts/user/tasks');
        return response.data;
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        return [];
    }
};
