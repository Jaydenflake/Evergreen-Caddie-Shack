import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Sparkles,
  Award,
  Bell,
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/magic-moments', icon: Sparkles, label: 'Magic Moments' },
    { path: '/nominate', icon: Award, label: 'Nominate' },
    { path: '/announcements', icon: Bell, label: 'Announcements' },
    { path: '/profile', icon: User, label: 'My Profile' },
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
        <nav className="flex-1 p-4 space-y-2">
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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-200">
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
