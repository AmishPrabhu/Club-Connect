import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Page } from '../types/page';
import { ClubMembership } from '../types/auth';
import { markNotificationAsRead } from '../lib/dbService';

interface NavigationContextType {
    currentPage: Page;
    previousPage: Page;
    selectedClub: string | null;
    selectedMember: any;
    selectedEvent: string | null;
    selectedPost: string | null;
    selectedNotification: any | null;
    selectedManagementEventId: string | null;
    isOpenedFromUrl: boolean;
    selectedMembership: ClubMembership | null;
    setSelectedMembership: (membership: ClubMembership | null) => void;
    navigateToPage: (page: Page, params?: Record<string, string>) => void;
    navigateToClub: (clubId: string) => void;
    navigateToMemberBoard: (member: any) => void;
    navigateToEvent: (eventId: string) => void;
    navigateToPost: (postId: string, returnTo?: { page: Page; params?: Record<string, string> }) => void;
    navigateToManagement: (eventId: string, returnTo?: { page: Page; params?: Record<string, string> }) => void;
    navigateToNotification: (notification: any) => Promise<void>;
    navigateBack: () => void;
    handleLogout: (logoutFn: () => Promise<void>) => Promise<void>;
    closeManagementTab: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [previousPage, setPreviousPage] = useState<Page>('home');
    const [selectedClub, setSelectedClub] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
    const [selectedManagementEventId, setSelectedManagementEventId] = useState<string | null>(null);
    const [isOpenedFromUrl, setIsOpenedFromUrl] = useState(false);

    const [returnLocation, setReturnLocation] = useState<{ page: Page; params?: Record<string, string> } | null>(null);

    // Initialize selectedMembership from localStorage if available
    const [selectedMembership, setSelectedMembershipState] = useState<ClubMembership | null>(() => {
        try {
            const saved = localStorage.getItem('selectedMembership');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Wrapper to persist selectedMembership to localStorage
    const setSelectedMembership = (membership: ClubMembership | null) => {
        setSelectedMembershipState(membership);
        if (membership) {
            localStorage.setItem('selectedMembership', JSON.stringify(membership));
        } else {
            localStorage.removeItem('selectedMembership');
        }
    };

    // Helper to update URL without reload
    const updateUrl = (page: Page, params?: Record<string, string>) => {
        const url = new URL(window.location.href);
        url.search = ''; // Clear existing params
        url.searchParams.set('page', page);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) url.searchParams.set(key, value);
            });
        }
        window.history.replaceState({}, '', url.toString());
    };

    // Initialize from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page') as Page | null;
        const eventIdParam = params.get('eventId');
        const clubIdParam = params.get('clubId');
        const postIdParam = params.get('postId');

        if (pageParam === 'eventManagement' && eventIdParam) {
            setSelectedManagementEventId(eventIdParam);
            setCurrentPage('eventManagement');
            setIsOpenedFromUrl(true);
        } else if (pageParam === 'resetPassword') {
            setCurrentPage('resetPassword');
            setIsOpenedFromUrl(true);
        } else if (pageParam === 'signUp') {
            setCurrentPage('signUp');
        } else if (pageParam === 'club' && clubIdParam) {
            setSelectedClub(clubIdParam);
            setCurrentPage('club');
        } else if (pageParam === 'post' && postIdParam) {
            setSelectedPost(postIdParam);
            setCurrentPage('post');
        } else if (pageParam === 'event' && postIdParam) {
            setSelectedEvent(postIdParam);
            setCurrentPage('event');
        } else if (pageParam && ['home', 'dashboard', 'events', 'announcements', 'notifications', 'userProfile', 'adminDashboard', 'clubSecretaryDashboard', 'studentDashboard', 'advisorDashboard', 'login'].includes(pageParam)) {
            setCurrentPage(pageParam);
        }
    }, []);

    const navigateToPage = (page: Page, params?: Record<string, string>) => {
        // If we are navigating to 'post' or 'eventManagement', we don't want to consume the returnLocation here.
        // But if we are navigating 'back' or to a main page, we check against returnLocation?
        // Actually, the main "Back" buttons in views usually call navigateToPage(previousPage).
        // So we should intersect there.

        // BETTER APPROACH: modify how Back buttons work in the pages themselves?
        // OR: Intercept here. If we are called with navigateToPage(previousPage) effectively...

        // Wait, closeManagementTab logic was specific.
        // Standard "Back" buttons in PostDetail call onBack={() => navigateToPage(previousPage)}.
        // So if we have a returnLocation stored, we should probably prefer it over the passed 'page' argument IF the passed argument matches 'previousPage' context?
        // Or simply: check if returnLocation exists, and if so, use it and clear it.

        if (returnLocation && page === previousPage) {
            // This is a heuristic: if we are navigating back to previous page, use returnLocation if available.
            // This assumes navigateToPage is being used as a "Back" function in this context.
            // Let's refine: The user asked for "Back" button behavior.
            // PostDetail's onBack prop is just a function. NavigationContext doesn't know it's "Back".

            // Let's stick to modifying the specific navigation functions (navigateToPost) to set state,
            // and then relying on the component (PostDetail) to use a special "goBack" function?
            // No, PostDetail uses onBack prop passed from App.tsx.

            // Let's look at App.tsx:
            // <PostDetail ... onBack={() => navigateToPage(previousPage)} ... />

            // So we need `navigateToPage` to handle this.
            // BUT `navigateToPage` is generic.

            // Let's modify App.tsx to use a smart back function?
            // Or update `navigateToPage` to check `returnLocation`.

        }

        setPreviousPage(currentPage);
        setCurrentPage(page);
        if (page !== 'club' && page !== 'memberBoard' && page !== 'event' && page !== 'post' && page !== 'eventManagement' && page !== 'notification') {
            setSelectedClub(null);
            setSelectedMember(null);
            setSelectedEvent(null);
            setSelectedPost(null);
            setSelectedNotification(null);
            setSelectedManagementEventId(null);
        }
        // Update URL for main pages
        if (['home', 'dashboard', 'events', 'announcements', 'notifications', 'userProfile', 'adminDashboard', 'clubSecretaryDashboard', 'studentDashboard', 'advisorDashboard', 'login', 'signUp'].includes(page)) {
            updateUrl(page, params);
        }
    };

    const navigateToClub = (clubId: string) => {
        setPreviousPage(currentPage);
        setSelectedClub(clubId);
        setCurrentPage('club');
        updateUrl('club', { clubId });
    };

    const navigateToMemberBoard = (member: any) => {
        setPreviousPage(currentPage);
        setSelectedMember(member);
        setCurrentPage('memberBoard');
        // MemberBoard doesn't persist to URL (complex object)
    };

    const navigateToEvent = (eventId: string) => {
        setPreviousPage(currentPage);
        setSelectedEvent(eventId);
        setCurrentPage('event');
        updateUrl('event', { postId: eventId });
    };

    const navigateToPost = (postId: string, returnTo?: { page: Page; params?: Record<string, string> }) => {
        setPreviousPage(currentPage);
        if (returnTo) {
            setReturnLocation(returnTo);
        }
        setSelectedPost(postId);
        setCurrentPage('post');
        updateUrl('post', { postId });
    };

    const navigateToManagement = (eventId: string, returnTo?: { page: Page; params?: Record<string, string> }) => {
        setPreviousPage(currentPage);
        if (returnTo) {
            setReturnLocation(returnTo);
        }
        setSelectedManagementEventId(eventId);
        setCurrentPage('eventManagement');
        updateUrl('eventManagement', { eventId });
    };

    const closeManagementTab = () => {
        if (isOpenedFromUrl) {
            // If opened from URL (new tab), close the tab
            window.close();
            // Fallback: if window.close() doesn't work (browser security), navigate to home
            // Clear URL params and go to home
            window.history.replaceState({}, '', window.location.origin);
            setCurrentPage('home');
            setSelectedManagementEventId(null);
            setIsOpenedFromUrl(false);
        } else if (returnLocation) {
            // Restore contextual location
            navigateToPage(returnLocation.page, returnLocation.params);
            setReturnLocation(null);
        } else {
            // Default fallback
            navigateToPage(previousPage);
        }
    };

    const navigateToNotification = async (notification: any) => {
        setPreviousPage(currentPage);
        if (notification.id && !notification.read) {
            await markNotificationAsRead(notification.id);
        }
        setSelectedNotification(notification);
        setCurrentPage('notification');
    };

    const navigateBack = () => {
        if (returnLocation) {
            navigateToPage(returnLocation.page, returnLocation.params);
            setReturnLocation(null);
        } else {
            navigateToPage(previousPage);
        }
    };

    const handleLogout = async (logoutFn: () => Promise<void>) => {
        await logoutFn();
        setSelectedMembership(null); // Clear membership on logout
        setCurrentPage('home');
    };

    return (
        <NavigationContext.Provider
            value={{
                currentPage,
                previousPage,
                selectedClub,
                selectedMember,
                selectedEvent,
                selectedPost,
                selectedNotification,
                selectedManagementEventId,
                isOpenedFromUrl,
                selectedMembership,
                setSelectedMembership,
                navigateToPage,
                navigateToClub,
                navigateToMemberBoard,
                navigateToEvent,
                navigateToPost,
                navigateToManagement,
                navigateToNotification,
                navigateBack,
                handleLogout,
                closeManagementTab,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};
