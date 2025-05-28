
import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ListTodo, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building,
  Bell,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DashboardLayout: React.FC = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/industries', label: 'Industries', icon: <Building className="w-5 h-5" /> },
    { to: '/companies', label: 'Companies', icon: <Building2 className="w-5 h-5" /> },
    { to: '/people', label: 'People', icon: <Users className="w-5 h-5" /> },
    { to: '/tasks', label: 'Tasks', icon: <ListTodo className="w-5 h-5" /> },
    { to: '/shopify', label: 'Shopify', icon: <ShoppingBag className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', label: 'Admin', icon: <Settings className="w-5 h-5" /> });
  }

  // Get display name from profile or fallback to email
  const displayName = profile?.full_name || user?.email;
  
  // Get initial for avatar
  const userInitial = profile?.full_name 
    ? profile.full_name.charAt(0) 
    : user?.email?.charAt(0) || 'U';

  return (
    <div className="min-h-screen bg-crm-background flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-crm-blue">Engineil.ing</span>
              <span className="text-lg font-medium">Connect</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crm-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crm-red"></span>
              </span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-crm-indigo flex items-center justify-center text-white">
                {userInitial}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-gray-500 capitalize">{profile?.role || 'user'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200">
          <nav className="flex-1 py-6 px-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-crm-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center text-gray-700"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={closeMobileMenu}
            ></div>
            
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="px-4 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => cn(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-crm-blue text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={closeMobileMenu}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center text-gray-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
