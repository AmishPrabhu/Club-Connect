import {
    collection,
    doc,
    getDocs,
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
