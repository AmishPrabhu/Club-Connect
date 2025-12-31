import { useState } from 'react';
import { markNotificationAsRead } from './lib/firestoreService';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ClubDetail from './pages/ClubDetail';
import MemberBoardDetail from './pages/MemberBoardDetail';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import EventDetail from './pages/EventDetail';
import PostDetail from './pages/PostDetail';
import NotificationDetail from './pages/NotificationDetail';
import Events from './pages/Events';
import Announcements from './pages/Announcements';
import LoginPage from './pages/LoginPage';

import AdminDashboard from './pages/AdminDashboard';
import ClubSecretaryDashboard from './pages/ClubSecretaryDashboard';
import SetupAdmin from './pages/SetupAdmin';
import { DarkModeProvider } from './context/DarkModeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Page } from './types/page';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const { user, logout } = useAuth();

  const navigateToClub = (clubId: string) => {
    setSelectedClub(clubId);
    setCurrentPage('club');
  };

  const navigateToMemberBoard = (member: any) => {
    setSelectedMember(member);
    setCurrentPage('memberBoard');
  };

  const navigateToEvent = (eventId: string) => {
    setSelectedEvent(eventId);
    setCurrentPage('event');
  };

  const navigateToPost = (postId: string) => {
    setSelectedPost(postId);
    setCurrentPage('post');
  };

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'club' && page !== 'memberBoard' && page !== 'event' && page !== 'post') {
      setSelectedClub(null);
      setSelectedMember(null);
      setSelectedEvent(null);
      setSelectedPost(null);
    }
  };

  const navigateToNotification = async (notification: any) => {
    // Mark notification as read when navigating to it
    if (notification.id && !notification.read) {
      await markNotificationAsRead(notification.id);
    }
    setSelectedPost(notification);
    setCurrentPage('notification');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('home');
  };

  // Login pages are shown based on currentPage state

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-200">
      {currentPage !== 'login' && currentPage !== 'adminLogin' && currentPage !== 'setupAdmin' && (
        <Header
          currentPage={currentPage}
          onNavigate={navigateToPage}
          onLogout={handleLogout}
          user={user}
        />
      )}

      {/* Main Pages */}
      {currentPage === 'home' && <Home onNavigate={navigateToPage} onNavigateToClub={navigateToClub} onNavigateToEvent={navigateToEvent} onNavigateToPost={navigateToPost} onNavigateToNotification={navigateToNotification} />}
      {currentPage === 'dashboard' && <Dashboard onNavigateToClub={navigateToClub} />}
      {currentPage === 'club' && selectedClub && (
        <ClubDetail clubId={selectedClub} onBack={() => navigateToPage('dashboard')} onNavigateToMember={navigateToMemberBoard} onNavigateToPost={navigateToPost} />
      )}
      {currentPage === 'memberBoard' && selectedMember && (
        <MemberBoardDetail club={selectedMember} onBack={() => navigateToPage('club')} />
      )}
      {currentPage === 'notifications' && (
        <Notifications onBack={() => navigateToPage('dashboard')} onNavigateToNotification={navigateToNotification} />
      )}
      {currentPage === 'userProfile' && (
        <UserProfile onBack={() => navigateToPage('dashboard')} />
      )}
      {currentPage === 'event' && selectedEvent && (
        <EventDetail eventId={selectedEvent} onBack={() => navigateToPage('home')} />
      )}
      {currentPage === 'post' && selectedPost && (
        <PostDetail postId={selectedPost} onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} user={user} />
      )}
      {currentPage === 'events' && (
        <Events onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} />
      )}
      {currentPage === 'announcements' && (
        <Announcements onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} />
      )}


      {currentPage === 'notification' && selectedPost && (
        <NotificationDetail notification={selectedPost as any} onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} />
      )}

      {currentPage === 'adminDashboard' && (
        <AdminDashboard onNavigate={navigateToPage} />
      )}
      {currentPage === 'clubSecretaryDashboard' && (
        <ClubSecretaryDashboard onNavigate={navigateToPage} onNavigateToPost={navigateToPost} user={user} />
      )}

      {/* Login Modal for Club Secretary and Admin */}
      {currentPage === 'login' && (
        <LoginPage onNavigate={navigateToPage} />
      )}

      {/* Setup Admin Page */}
      {currentPage === 'setupAdmin' && (
        <SetupAdmin onNavigate={navigateToPage} />
      )}
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
