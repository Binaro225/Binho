import { useState } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
  unreadCount: number;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user, unreadCount }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implémenter la recherche globale
      console.log('Recherche:', searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Notification Button */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar (Desktop) */}
          {user && (
            <div className="hidden md:flex items-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.email}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                  onClick={() => navigate('/settings#profile')}
                />
              ) : (
                <div
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate('/settings#profile')}
                >
                  <span className="text-blue-600 font-medium text-sm">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
