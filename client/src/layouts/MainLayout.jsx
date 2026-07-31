import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { LogOut, Menu, X, LayoutDashboard, Ticket, Users, User, FileText, TrendingUp, MessageSquare, Hash } from 'lucide-react';
import { useState } from 'react';

const MainLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCounts } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar open by default
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu separate state

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    ...(isAdmin ? [{ name: 'Chat', href: '/chat', icon: MessageSquare }] : []),
    ...(isAdmin ? [{ name: 'Users', href: '/users', icon: Users }] : []),
    ...(user?.role === 'super_admin' ? [{ name: 'Channels', href: '/channels', icon: Hash }] : []),
    ...(user?.role === 'super_admin' ? [{ name: 'Performance', href: '/performance', icon: TrendingUp }] : []),
    ...(user?.role === 'super_admin' ? [{ name: 'System Logs', href: '/system-logs', icon: FileText }] : []),
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Teal - Mobile Optimized */}
      <header className="bg-teal-600 border-b border-teal-700 fixed top-0 left-0 right-0 z-30">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Logo */}
              <div className="flex items-center">
                {/* Logo Image */}
                <img 
                  src="/logo.png" 
                  alt="IntelliCare Support" 
                  className="h-8 sm:h-10 w-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback text logo */}
                <div className="hidden items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 font-bold text-lg sm:text-xl">IC</span>
                  </div>
                  <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-white hidden md:inline">
                    IntelliCare Support
                  </span>
                </div>
              </div>
              {/* Desktop Hamburger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 rounded-md text-white hover:bg-teal-700 transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-md text-white hover:bg-teal-700 transition-colors relative"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                {/* Unread badge on mobile menu */}
                {unreadCounts.total > 0 && !mobileMenuOpen && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
                  </span>
                )}
              </button>
            </div>

            {/* User Menu - Mobile Optimized */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User Info - Hidden on smallest screens */}
              <div className="hidden sm:block text-right">
                <p className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] sm:text-xs text-teal-100 capitalize">{user?.role}</p>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-teal-700 rounded-lg transition-colors"
                aria-label="Logout"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden xs:inline sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Dark/Black Desktop */}
      <aside 
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col pt-16 bg-gray-900 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                    active
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <div className="relative flex-shrink-0">
                    <Icon size={20} />
                    {/* Badge on icon when sidebar is collapsed */}
                    {item.name === 'Chat' && unreadCounts.total > 0 && !sidebarOpen && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-gray-900 animate-pulse">
                        {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
                      </span>
                    )}
                  </div>
                  <span className={`flex-1 transition-opacity duration-200 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                    {item.name}
                  </span>
                  {/* Badge at the end when sidebar is expanded */}
                  {item.name === 'Chat' && unreadCounts.total > 0 && sidebarOpen && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center animate-pulse">
                      {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar - Dark - Improved */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14 sm:pt-16">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Sidebar */}
          <aside className="relative flex w-full max-w-xs flex-col bg-gray-900 h-full shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* User Info at Top - Mobile Only */}
            <div className="px-4 py-4 border-b border-gray-800 bg-gray-800 sm:hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-teal-300 capitalize">{user?.role}</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 sm:px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                      active
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.name === 'Chat' && unreadCounts.total > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 animate-pulse">
                        {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Footer - App Version */}
            <div className="px-4 py-3 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500">IntelliCare Support v1.0</p>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content - Mobile Optimized */}
      <main className={`pt-14 sm:pt-16 transition-all duration-300 ease-in-out min-h-screen ${
        sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
      }`}>
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
