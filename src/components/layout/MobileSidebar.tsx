import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { User } from '@/types';
import { cn } from '@/utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  onClick?: () => void;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  bottomNavItems: NavItem[];
  user: User | null;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  navItems,
  bottomNavItems,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col lg:hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FM</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">FinMaster</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                  onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* User Info */}
          {user && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
