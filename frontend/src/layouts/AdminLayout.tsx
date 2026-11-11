import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LogOut, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/context/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get user display name and email
  const getUserDisplayName = () => {
    if (user?.team_member) {
      return `${user.team_member.first_name} ${user.team_member.last_name}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  // Generate initials for avatar fallback
  const getInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-light via-white to-gray-light">
      {/* Main Content Area with Sidebar - Full Height */}
      <SidebarProvider>
        {/* Vertical Sidebar with rounded corners and padding - separated from edges */}
        <div 
          className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="h-full bg-blue p-4 flex flex-col relative">
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="absolute -right-5 top-6 bg-white text-blue rounded-full p-1.5 hover:bg-white hover:scale-105 transition-colors z-50 border-2 border-blue/50"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            {/* Logo at the top */}
            <div className="flex-shrink-0 pb-6">
              <div className="flex items-center justify-center">
                <img
                  src="/logos/chizotech logo black_.png"
                  alt="ChizoTech Logo"
                  className={`transform hover:scale-105 transition-transform duration-300 ${
                    isCollapsed ? 'h-8 w-8' : 'h-10 w-auto'
                  }`}
                />
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto">
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive('/admin') || isActive('/admin/dashboard')}
                    className={`text-white hover:bg-blue-dark/20 data-[active=true]:bg-blue-dark/40 data-[active=true]:text-white rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center px-2' : ''
                    }`}
                    title={isCollapsed ? 'Dashboard' : ''}
                  >
                    <Link to="/admin/dashboard" className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            {/* User Profile and Logout - Grouped at bottom */}
            <div className="flex-shrink-0 space-y-2">
              {/* User Profile */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue/20 hover:bg-blue/30 transition-colors">
                <Avatar className="h-8 w-8 ring-2 ring-blue flex-shrink-0">
                  <AvatarImage src="" alt={getUserDisplayName()} />
                  <AvatarFallback className="bg-blue text-white font-semibold text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-light truncate">{getUserEmail()}</p>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleLogout}
                    className={`text-white hover:bg-red-500/20 hover:text-red-100 rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center px-2' : ''
                    }`}
                    title={isCollapsed ? 'Log Out' : ''}
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">Log Out</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div 
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? 'ml-28' : 'ml-72'
          }`}
        >
          <main className="p-8 min-h-screen max-w-[calc(100vw-18rem)] lg:max-w-[calc(100vw-20rem)]">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
