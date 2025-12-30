import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ReportIssue } from './pages/ReportIssue';
import { TrackIssues } from './pages/TrackIssues';
import { MyIssues } from './pages/MyIssues';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Transparency } from './pages/Transparency';
import { Heatmap } from './pages/Heatmap';

// ✅ ADD THIS IMPORT
import IssuesNearMe from './pages/IssuesNearMe';

function AppContent() {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 text-lg">
            Loading CivicConnect...
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;

      case 'login':
        return <Login onNavigate={handleNavigate} />;

      case 'signup':
        return <Signup onNavigate={handleNavigate} />;

      case 'report':
        return <ReportIssue onNavigate={handleNavigate} />;

      case 'track':
        return <TrackIssues onNavigate={handleNavigate} />;

      case 'my-issues':
        return <MyIssues onNavigate={handleNavigate} />;

      case 'officer-dashboard':
        return <OfficerDashboard onNavigate={handleNavigate} />;

      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;

      case 'transparency':
        return <Transparency />;

      case 'heatmap':
        return <Heatmap />;

      // ✅ NEW PAGE
      case 'issues-near-me':
        return <IssuesNearMe />;

      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  const showHeader =
    currentPage !== 'login' && currentPage !== 'signup';

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      )}
      <main>{renderPage()}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
