import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Sparkles,
  Award,
  Bell,
  User,
  LogOut,
  Shield,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/magic-moments', icon: Sparkles, label: 'Creating Magic' },
    { path: '/nominate', icon: Award, label: 'Nominate' },
    { path: '/announcements', icon: Bell, label: 'Announcements' },
    { path: '/profile', icon: User, label: 'My Profile' },
  ];

  const adminNavItems = [
    { path: '/admin/nominations', icon: Shield, label: 'Nominations' },
    { path: '/admin/settings', icon: Settings, label: 'Admin Settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 glass-strong border-r border-emerald-200 flex flex-col shadow-xl">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <img
              src="/evergreen-logo.png"
              alt="Evergreen Logo"
              className="w-24 h-24 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                EVERGREEN
              </h1>
              <p className="text-xs text-emerald-600/70 font-medium">Caddie Shack</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Section */}
          {user?.is_admin && (
            <>
              <div className="pt-4 pb-2 px-4">
                <div className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider">
                  Admin
                </div>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-emerald-200 space-y-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-600 truncate">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
          <p className="text-xs text-emerald-600/60 text-center font-medium">
            Relentless Hospitality
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-emerald-50/50 via-blue-50/50 to-purple-50/50">
        {children}
      </main>
    </div>
  );
}
