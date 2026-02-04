import { useEffect } from 'react';
import { DarkModeProvider } from './context/DarkModeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { TourProvider } from './context/TourContext';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ClubDetail from './pages/ClubDetail';
import MemberBoardDetail from './pages/MemberBoardDetail';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import PostDetail from './pages/PostDetail';
import NotificationDetail from './pages/NotificationDetail';
import Events from './pages/Events';
import Announcements from './pages/Announcements';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import StudentDashboard from './pages/StudentDashboard';
import EventManagement from './pages/EventManagement';
import AdminDashboard from './pages/AdminDashboard';
import ClubSecretaryDashboard from './pages/ClubSecretaryDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import SetupAdmin from './pages/SetupAdmin';
import ResetPasswordPage from './pages/ResetPasswordPage';

import BottomNav from './components/BottomNav';

function AppContent() {
  const {
    currentPage,
    // previousPage,
    selectedClub,
    selectedMember,
    selectedEvent,
    selectedPost,
    selectedNotification,
    selectedManagementEventId,
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
    selectedMembership
  } = useNavigation();

  const { user, logout } = useAuth();

  const onLogoutClick = () => handleLogout(logout);

  // Protect Dashboard Routes
  useEffect(() => {
    // 1. Admin Dashboard Protection
    if (currentPage === 'adminDashboard') {
      if (!user || user.role !== 'admin') {
        navigateToPage('home');
      }
    }

    // 2. Advisor Dashboard Protection
    if (currentPage === 'advisorDashboard') {
      const hasGlobalRole = user && user.role === 'advisor';
      const hasClubRole = selectedMembership && selectedMembership.role.toLowerCase() === 'advisor';

      if (!user || (!hasGlobalRole && !hasClubRole)) {
        navigateToPage('home');
      }
    }

    // 3. Secretary/Club Dashboard Protection
    // Used by: Club Secretary, President, Treasurer
    if (currentPage === 'clubSecretaryDashboard') {
      const allowedGlobalRoles = ['club-secretary', 'president', 'treasurer'];
      const hasGlobalRole = user && allowedGlobalRoles.includes(user.role);

      // Also check selectedMembership (club-specific role)
      // Roles are typically Title Case, but we check flexible casing to be safe
      const allowedClubRoles = ['Secretary', 'President', 'Treasurer', 'secretary', 'president', 'treasurer'];
      const hasClubRole = selectedMembership && allowedClubRoles.includes(selectedMembership.role);

      if (!user || (!hasGlobalRole && !hasClubRole)) {
        navigateToPage('home');
      }
    }

    // 4. Student Dashboard & Profile Protection
    if ((currentPage === 'studentDashboard' || currentPage === 'userProfile') && !user) {
      navigateToPage('home');
    }

  }, [currentPage, user, navigateToPage, selectedMembership]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 pb-20 md:pb-0">
      {currentPage !== 'login' && currentPage !== 'signUp' && currentPage !== 'adminLogin' && currentPage !== 'setupAdmin' && currentPage !== 'eventManagement' && currentPage !== 'resetPassword' && (
        <Header
          currentPage={currentPage}
          onNavigate={navigateToPage}
          onLogout={onLogoutClick}
          user={user}
        />
      )}

      {/* Main Pages */}
      {currentPage === 'home' && <Home onNavigate={navigateToPage} onNavigateToClub={navigateToClub} onNavigateToEvent={navigateToEvent} onNavigateToPost={navigateToPost} onNavigateToNotification={navigateToNotification} />}
      {currentPage === 'dashboard' && <Dashboard onNavigateToClub={navigateToClub} onBack={() => navigateToPage('home')} />}
      {currentPage === 'club' && selectedClub && (
        <ClubDetail clubId={selectedClub} onBack={() => navigateToPage('dashboard')} onNavigateToMember={navigateToMemberBoard} onNavigateToPost={navigateToPost} />
      )}
      {currentPage === 'memberBoard' && selectedMember && (
        <MemberBoardDetail club={selectedMember} onBack={() => navigateToPage('club')} />
      )}
      {currentPage === 'notifications' && (
        <Notifications onBack={() => navigateToPage('home')} onNavigateToNotification={navigateToNotification} />
      )}
      {currentPage === 'userProfile' && (
        <UserProfile
          onBack={() => navigateToPage('home')}
          onNavigate={navigateToPage}
          onNavigateToPost={navigateToPost}
          onNavigateToClub={navigateToClub}
        />
      )}
      {currentPage === 'event' && selectedEvent && (
        <PostDetail postId={selectedEvent} onBack={navigateBack} onNavigateToPost={navigateToPost} user={user} onManageEvent={navigateToManagement} />
      )}
      {currentPage === 'post' && selectedPost && (
        <PostDetail postId={selectedPost} onBack={navigateBack} onNavigateToPost={navigateToPost} user={user} onManageEvent={navigateToManagement} />
      )}
      {currentPage === 'events' && (
        <Events onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} user={user} onManageEvent={navigateToManagement} />
      )}
      {currentPage === 'announcements' && (
        <Announcements onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} />
      )}


      {currentPage === 'notification' && selectedNotification && (
        <NotificationDetail notification={selectedNotification as any} onBack={() => navigateToPage('home')} onNavigateToPost={navigateToPost} />
      )}

      {currentPage === 'adminDashboard' && (
        <AdminDashboard />
      )}
      {currentPage === 'clubSecretaryDashboard' && (
        <ClubSecretaryDashboard onNavigate={navigateToPage} onNavigateToPost={navigateToPost} user={user} />
      )}

      {currentPage === 'studentDashboard' && (
        <StudentDashboard onNavigate={navigateToPage} onNavigateToPost={navigateToPost} />
      )}

      {currentPage === 'advisorDashboard' && (
        <AdvisorDashboard onNavigate={navigateToPage} onNavigateToPost={navigateToPost} />
      )}

      {currentPage === 'eventManagement' && selectedManagementEventId && (
        <EventManagement eventId={selectedManagementEventId} onBack={closeManagementTab} user={user} />
      )}

      {/* Login Modal for Club Secretary, President, Treasurer, and Admin */}
      {currentPage === 'login' && (
        <LoginPage onNavigate={navigateToPage} />
      )}

      {/* Sign Up Page for Students */}
      {currentPage === 'signUp' && (
        <SignUpPage onNavigate={navigateToPage} />
      )}

      {currentPage === 'setupAdmin' && (
        <SetupAdmin onNavigate={navigateToPage} />
      )}

      {/* Reset Password Page */}
      {currentPage === 'resetPassword' && (
        <ResetPasswordPage onNavigate={navigateToPage} />
      )}



      {/* Mobile Bottom Navigation */}
      {currentPage !== 'login' && currentPage !== 'signUp' && currentPage !== 'adminLogin' && currentPage !== 'setupAdmin' && currentPage !== 'resetPassword' && (
        <BottomNav currentPage={currentPage} onNavigate={navigateToPage} />
      )}
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <NavigationProvider>
          <TourProvider>
            <AppContent />
          </TourProvider>
        </NavigationProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
