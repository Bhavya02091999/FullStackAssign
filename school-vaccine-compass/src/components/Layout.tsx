
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Vaccination Drives', path: '/vaccination-drives', icon: Calendar },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button 
          className="fixed top-4 left-4 z-50 bg-medical-600 text-white p-2 rounded-md shadow-md"
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
        >
          {showMobileSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "bg-sidebar h-screen w-64 text-white flex flex-col fixed z-40 transition-all",
          isMobile ? (showMobileSidebar ? "left-0" : "-left-64") : "left-0"
        )}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold">School Vaccination Portal</h1>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center py-3 px-4 rounded-md transition-colors",
                      isActive 
                        ? "bg-sidebar-accent text-white" 
                        : "text-white/80 hover:bg-sidebar-accent/50 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-accent">
          <div className="mb-4 px-2">
            <p className="text-sm text-white/80">Signed in as:</p>
            <p className="font-medium text-white">{user?.name || 'School Coordinator'}</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center bg-sidebar-accent hover:bg-sidebar-accent/80 border-sidebar-border"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={cn(
          "flex-1 transition-all",
          isMobile ? "ml-0" : "ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
    </div>
  );
};

export default Layout;
