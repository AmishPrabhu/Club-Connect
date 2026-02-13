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
import TeacherDashboard from './pages/TeacherDashboard';
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

  const { user, logout, isLoading, memberships } = useAuth();

  const onLogoutClick = () => handleLogout(logout);

  // Protect Dashboard Routes
  useEffect(() => {
    if (isLoading) return;

    // 1. Admin Dashboard Protection
    if (currentPage === 'adminDashboard') {
      if (!user || user.role !== 'admin') {
        console.warn('Unauthorized access attempt to admin dashboard');
        navigateToPage('home');
      }
    }

    // 2. Advisor Dashboard Protection
    if (currentPage === 'advisorDashboard') {
      const hasGlobalRole = user && user.role === 'advisor';
      const hasRoleInArray = user && user.roles?.includes('advisor');

      // Validate against FRESH memberships from AuthContext (not cached selectedMembership)
      const hasClubRole = selectedMembership && memberships.some(m =>
        m.clubId === selectedMembership.clubId &&
        m.role.toLowerCase() === 'advisor'
      );

      if (!user || (!hasGlobalRole && !hasRoleInArray && !hasClubRole)) {
        console.warn('Unauthorized access attempt to advisor dashboard. Role may have been removed.');
        navigateToPage('home');
      }
    }

    // 3. Secretary/Club Dashboard Protection
    // Used by: Club Secretary, President, Treasurer
    if (currentPage === 'clubSecretaryDashboard') {
      const allowedGlobalRoles = ['club-secretary', 'president', 'treasurer'];
      const hasGlobalRole = user && allowedGlobalRoles.includes(user.role);

      // Validate against FRESH memberships from AuthContext (not cached selectedMembership)
      // Check both ClubMember.role AND officerRole (from Club's email fields) AND boardType
      const allowedClubRoles = ['Secretary', 'President', 'Treasurer', 'secretary', 'president', 'treasurer'];
      const hasClubRole = selectedMembership && memberships.some(m =>
        m.clubId === selectedMembership.clubId &&
        (allowedClubRoles.includes(m.role) || m.officerRole || m.boardType === 'main' || m.boardType === 'executive')
      );

      if (!user || (!hasGlobalRole && !hasClubRole)) {
        console.warn('Unauthorized access attempt to club dashboard. Role may have been removed.');
        navigateToPage('home');
      }
    }

    // 4. Teacher Dashboard Protection
    if (currentPage === 'teacherDashboard') {
      const hasTeacherRole = user && (user.role === 'teacher' || user.roles?.includes('teacher'));
      if (!hasTeacherRole) {
        console.warn('Unauthorized access attempt to teacher dashboard');
        navigateToPage('home');
      }
    }

    // 4. Student Dashboard & Profile Protection
    if ((currentPage === 'studentDashboard' || currentPage === 'userProfile') && !user) {
      navigateToPage('home');
    }

  }, [currentPage, user, isLoading, navigateToPage, selectedMembership, memberships]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-200 pb-20 md:pb-0">
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

      {currentPage === 'teacherDashboard' && (
        <TeacherDashboard />
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
