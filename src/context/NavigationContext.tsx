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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        const eventIdParam = params.get('eventId');

        if (pageParam === 'eventManagement' && eventIdParam) {
            setSelectedManagementEventId(eventIdParam);
            setCurrentPage('eventManagement');
            setIsOpenedFromUrl(true);
        }
    }, []);

    const navigateToPage = (page: Page) => {
        setPreviousPage(currentPage);
        setCurrentPage(page);
        if (page !== 'club' && page !== 'memberBoard' && page !== 'event' && page !== 'post' && page !== 'eventManagement') {
            setSelectedClub(null);
            setSelectedMember(null);
            setSelectedEvent(null);
            setSelectedPost(null);
            setSelectedManagementEventId(null);
        }
    };

    const navigateToClub = (clubId: string) => {
        setSelectedClub(clubId);
        setCurrentPage('club');
    };

    const navigateToMemberBoard = (member: any) => {
        setSelectedMember(member);
        setCurrentPage('memberBoard');
    };

    const navigateToEvent = (eventId: string) => {
        setPreviousPage(currentPage);
        setSelectedEvent(eventId);
        setCurrentPage('event');
    };

    const navigateToPost = (postId: string) => {
        setPreviousPage(currentPage);
        setSelectedPost(postId);
        setCurrentPage('post');
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
        if (notification.id && !notification.read) {
            await markNotificationAsRead(notification.id);
        }
        setSelectedPost(notification);
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
