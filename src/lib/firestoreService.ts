import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
    FirestoreClub,
    FirestorePost,
    FirestoreNotification,
    FirestoreUser,
    ClubMember,
} from '../types/auth';

// ==================== CLUBS ====================

export const getClubs = async (): Promise<FirestoreClub[]> => {
    try {
        const clubsRef = collection(db, 'clubs');
        const q = query(clubsRef, orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as FirestoreClub[];
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return [];
    }
};

export const createClub = async (clubData: Omit<FirestoreClub, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
        const clubsRef = collection(db, 'clubs');
        const docRef = await addDoc(clubsRef, {
            ...clubData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating club:', error);
        return null;
    }
};

export const updateClub = async (clubId: string, clubData: Partial<FirestoreClub>): Promise<boolean> => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, {
            ...clubData,
            updatedAt: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Error updating club:', error);
        return false;
    }
};

export const deleteClub = async (clubId: string): Promise<boolean> => {
    try {
        const clubRef = doc(db, 'clubs', clubId);
        await deleteDoc(clubRef);
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

export const createClubSecretary = async (
    email: string,
    password: string,
    name: string,
    clubId: string,
    clubName: string
): Promise<{ success: boolean; error?: string; userId?: string }> => {
    try {
        // Import required functions for secondary app
        const { initializeApp, deleteApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword: createUser } = await import('firebase/auth');

        // Get the current Firebase config
        const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };

        // Create a secondary app instance to create the user without affecting current session
        const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
        const secondaryAuth = getAuth(secondaryApp);

        try {
            // Create user with secondary auth instance
            const userCredential = await createUser(secondaryAuth, email, password);
            const uid = userCredential.user.uid;

            // Create Firestore user profile with club-secretary role
            const userProfile: FirestoreUser = {
                email,
                name,
                role: 'club-secretary',
                clubId,
                clubName,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await setDoc(doc(db, 'users', uid), userProfile);

            // Update the club with secretary info
            await updateClub(clubId, {
                secretaryId: uid,
                secretaryEmail: email,
            });

            // Add secretary as a club member with 'secretary' role
            const membersRef = collection(db, 'clubs', clubId, 'members');
            await addDoc(membersRef, {
                name,
                email,
                role: 'secretary',
                joinedAt: Timestamp.now(),
            });

            // Update member count to 1 (secretary is the first member)
            const clubRef = doc(db, 'clubs', clubId);
            const clubDoc = await getDoc(clubRef);
            if (clubDoc.exists()) {
                const currentMembers = clubDoc.data().members || 0;
                await updateDoc(clubRef, {
                    members: currentMembers + 1,
                    updatedAt: Timestamp.now(),
                });
            }

            // Delete the secondary app instance
            await deleteApp(secondaryApp);

            return { success: true, userId: uid };
        } catch (innerError: any) {
            // Clean up secondary app on error
            await deleteApp(secondaryApp);
            throw innerError;
        }
    } catch (error: any) {
        console.error('Error creating club secretary:', error);
        return { success: false, error: error.message || 'Failed to create secretary' };
    }
};

// ==================== POSTS ====================

export const getPosts = async (): Promise<FirestorePost[]> => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as FirestorePost[];
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

export const createPost = async (postData: Omit<FirestorePost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
        const postsRef = collection(db, 'posts');
        const docRef = await addDoc(postsRef, {
            ...postData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        return null;
    }
};

export const deletePost = async (postId: string): Promise<boolean> => {
    try {
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
};

export const updatePost = async (postId: string, postData: Partial<FirestorePost>): Promise<boolean> => {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            ...postData,
            updatedAt: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Error updating post:', error);
        return false;
    }
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (userId?: string): Promise<FirestoreNotification[]> => {
    try {
        const notificationsRef = collection(db, 'notifications');
        let q;

        if (userId) {
            // Get user-specific notifications and global notifications
            q = query(notificationsRef, orderBy('createdAt', 'desc'));
        } else {
            q = query(notificationsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as FirestoreNotification[];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const createNotification = async (
    notificationData: Omit<FirestoreNotification, 'id' | 'createdAt'>
): Promise<string | null> => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const docRef = await addDoc(notificationsRef, {
            ...notificationData,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await deleteDoc(notificationRef);
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
};

// ==================== CLUB MEMBERS ====================

// Get all members of a club
export const getClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    try {
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const q = query(membersRef, orderBy('joinedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            joinedAt: doc.data().joinedAt?.toDate() || new Date(),
        })) as ClubMember[];
    } catch (error) {
        console.error('Error fetching club members:', error);
        return [];
    }
};

// Sync club member count with actual number of members in subcollection
export const syncClubMemberCount = async (clubId: string): Promise<number> => {
    try {
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const snapshot = await getDocs(membersRef);
        const actualCount = snapshot.size;

        // Update the club's member count
        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, {
            members: actualCount,
            updatedAt: Timestamp.now(),
        });

        return actualCount;
    } catch (error) {
        console.error('Error syncing member count:', error);
        return 0;
    }
};

// Add a member to a club
export const addClubMember = async (
    clubId: string,
    memberData: Omit<ClubMember, 'id' | 'joinedAt'>
): Promise<{ success: boolean; error?: string; memberId?: string }> => {
    try {
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const docRef = await addDoc(membersRef, {
            ...memberData,
            joinedAt: Timestamp.now(),
        });

        // Update member count in club document
        const clubRef = doc(db, 'clubs', clubId);
        const clubDoc = await getDoc(clubRef);
        if (clubDoc.exists()) {
            const currentMembers = clubDoc.data().members || 0;
            await updateDoc(clubRef, {
                members: currentMembers + 1,
                updatedAt: Timestamp.now(),
            });
        }

        return { success: true, memberId: docRef.id };
    } catch (error: any) {
        console.error('Error adding club member:', error);
        return { success: false, error: error.message || 'Failed to add member' };
    }
};

// Update a member's info/role
export const updateClubMember = async (
    clubId: string,
    memberId: string,
    memberData: Partial<ClubMember>
): Promise<boolean> => {
    try {
        const memberRef = doc(db, 'clubs', clubId, 'members', memberId);
        await updateDoc(memberRef, memberData);
        return true;
    } catch (error) {
        console.error('Error updating club member:', error);
        return false;
    }
};

// Remove a member from a club
export const removeClubMember = async (
    clubId: string,
    memberId: string
): Promise<boolean> => {
    try {
        const memberRef = doc(db, 'clubs', clubId, 'members', memberId);
        await deleteDoc(memberRef);

        // Update member count in club document
        const clubRef = doc(db, 'clubs', clubId);
        const clubDoc = await getDoc(clubRef);
        if (clubDoc.exists()) {
            const currentMembers = clubDoc.data().members || 1;
            await updateDoc(clubRef, {
                members: Math.max(0, currentMembers - 1),
                updatedAt: Timestamp.now(),
            });
        }

        return true;
    } catch (error) {
        console.error('Error removing club member:', error);
        return false;
    }
};

