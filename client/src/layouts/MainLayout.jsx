import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, LayoutDashboard, Ticket, Users, User, FileText, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import AdminChatWidget from '../components/AdminChatWidget';

const MainLayout = () => {
  const { user, logout, isAdmin } = useAuth();
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
    ...(isAdmin ? [{ name: 'Users', href: '/users', icon: Users }] : []),
    ...(user?.role === 'super_admin' ? [{ name: 'Performance', href: '/performance', icon: TrendingUp }] : []),
    ...(user?.role === 'super_admin' ? [{ name: 'System Logs', href: '/system-logs', icon: FileText }] : []),
    ...(!isAdmin ? [{ name: 'Profile', href: '/profile', icon: User }] : []),
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Teal */}
      <header className="bg-teal-600 border-b border-teal-700 fixed top-0 left-0 right-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Menu Button */}
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex items-center">
                {/* Logo Image - Replace with your actual logo */}
                <img 
                  src="/logo.png" 
                  alt="IntelliCare Support" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    // Fallback if logo not found - shows text instead
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback text logo (hidden if image loads) */}
                <div className="hidden items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 font-bold text-xl">IC</span>
                  </div>
                  <span className="ml-3 text-xl font-bold text-white">IntelliCare Support</span>
                </div>
              </div>
              {/* Desktop Hamburger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 rounded-md text-white hover:bg-teal-700 transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-white hover:bg-teal-700 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-teal-100 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
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
                  <Icon size={20} className="flex-shrink-0" />
                  <span className={`transition-opacity duration-200 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar - Dark */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16">
          <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-gray-900 h-full transform transition-transform duration-300 ease-in-out">
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
      } lg:pr-96`}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Admin Chat Sidebar - Only for admins and super admins */}
      {isAdmin && (
        <div className="hidden lg:block fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-200 z-20 shadow-xl">
          <AdminChatWidget />
        </div>
      )}
    </div>
  );
};

export default MainLayout;
