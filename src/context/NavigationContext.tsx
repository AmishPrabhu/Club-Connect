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
    navigateToPage: (page: Page) => void;
    navigateToClub: (clubId: string) => void;
    navigateToMemberBoard: (member: any) => void;
    navigateToEvent: (eventId: string) => void;
    navigateToPost: (postId: string) => void;
    navigateToManagement: (eventId: string) => void;
    navigateToNotification: (notification: any) => Promise<void>;
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

    const navigateToPage = (page: Page) => {
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
            updateUrl(page);
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

    const navigateToPost = (postId: string) => {
        setPreviousPage(currentPage);
        setSelectedPost(postId);
        setCurrentPage('post');
        updateUrl('post', { postId });
    };

    const navigateToManagement = (eventId: string) => {
        // Open in new tab with URL params
        const url = `${window.location.origin}/?page=eventManagement&eventId=${eventId}`;
        window.open(url, '_blank');
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
        } else {
            // If opened via internal navigation, go back to previous page
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
                handleLogout,
                closeManagementTab,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};
