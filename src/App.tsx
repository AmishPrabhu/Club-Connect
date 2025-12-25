import { useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ClubDetail from './pages/ClubDetail';
import MemberBoardDetail from './pages/MemberBoardDetail';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import EventDetail from './pages/EventDetail';
import LoginPage from './pages/LoginPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ClubSecretaryDashboard from './pages/ClubSecretaryDashboard';
import { DarkModeProvider } from './context/DarkModeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Page } from './types/page';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { isAuthenticated, user, logout } = useAuth();

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

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'club' && page !== 'memberBoard' && page !== 'event') {
      setSelectedClub(null);
      setSelectedMember(null);
      setSelectedEvent(null);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  // Login pages are shown based on currentPage state

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {currentPage !== 'login' && currentPage !== 'adminLogin' && (
        <Header 
          currentPage={currentPage} 
          onNavigate={navigateToPage} 
          onLogout={handleLogout}
          user={user}
        />
      )}

      {/* Main Pages */}
      {currentPage === 'home' && <Home onNavigate={navigateToPage} onNavigateToClub={navigateToClub} onNavigateToEvent={navigateToEvent} />}
      {currentPage === 'dashboard' && <Dashboard onNavigateToClub={navigateToClub} />}
      {currentPage === 'club' && selectedClub && (
        <ClubDetail clubId={selectedClub} onBack={() => navigateToPage('dashboard')} onNavigateToMember={navigateToMemberBoard} />
      )}
      {currentPage === 'memberBoard' && selectedMember && (
        <MemberBoardDetail club={selectedClub} onBack={() => navigateToPage('club')} />
      )}
      {currentPage === 'notifications' && (
        <Notifications onBack={() => navigateToPage('dashboard')} />
      )}
      {currentPage === 'userProfile' && (
        <UserProfile onBack={() => navigateToPage('dashboard')} />
      )}
      {currentPage === 'event' && selectedEvent && (
        <EventDetail eventId={selectedEvent} onBack={() => navigateToPage('home')} />
      )}
      {currentPage === 'adminLogin' && (
        <AdminLogin onNavigate={navigateToPage} />
      )}
      {currentPage === 'adminDashboard' && (
        <AdminDashboard onNavigate={navigateToPage} />
      )}
      {currentPage === 'clubSecretaryDashboard' && (
        <ClubSecretaryDashboard onNavigate={navigateToPage} user={user} />
      )}

      {/* Login Modal for Club Secretary and Admin */}
      {currentPage === 'login' && (
        <LoginPage onNavigate={navigateToPage} />
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
