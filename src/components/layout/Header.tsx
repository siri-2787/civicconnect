import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Menu, X, MapPin, BarChart3, AlertCircle, Shield, Home, LogOut, User } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  const navigation = {
    public: [
      { name: 'Home', page: 'home', icon: Home },
      { name: 'Track Issues', page: 'track', icon: MapPin },
      { name: 'Heatmap', page: 'heatmap', icon: MapPin },
      { name: 'Transparency', page: 'transparency', icon: BarChart3 },
    ],
    citizen: [
      { name: 'Home', page: 'home', icon: Home },
      { name: 'Report Issue', page: 'report', icon: AlertCircle },
      { name: 'My Issues', page: 'my-issues', icon: User },
      { name: 'Track Issues', page: 'track', icon: MapPin },
      { name: 'Heatmap', page: 'heatmap', icon: MapPin },
      { name: 'Transparency', page: 'transparency', icon: BarChart3 },
    ],
    officer: [
      { name: 'Home', page: 'home', icon: Home },
      { name: 'Dashboard', page: 'officer-dashboard', icon: Shield },
      { name: 'Track Issues', page: 'track', icon: MapPin },
      { name: 'Heatmap', page: 'heatmap', icon: MapPin },
    ],
    admin: [
      { name: 'Home', page: 'home', icon: Home },
      { name: 'Admin Dashboard', page: 'admin-dashboard', icon: Shield },
      { name: 'Analytics', page: 'analytics', icon: BarChart3 },
      { name: 'Track Issues', page: 'track', icon: MapPin },
      { name: 'Heatmap', page: 'heatmap', icon: MapPin },
    ],
  };

  const getNavItems = () => {
    if (!user) return navigation.public;
    if (profile?.role === 'admin') return navigation.admin;
    if (profile?.role === 'officer') return navigation.officer;
    return navigation.citizen;
  };

  const navItems = getNavItems();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <MapPin className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">CivicConnect</span>
          </div>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    currentPage === item.page
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => onNavigate('signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                    currentPage === item.page
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
