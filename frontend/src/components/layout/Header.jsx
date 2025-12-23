import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Click outside detection to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const isActive = (path) => location.pathname === path;

  const navLinkClasses = (path) =>
    `text-base font-medium transition-colors duration-200 px-4 py-2 rounded-lg ${
      isActive(path)
        ? 'text-primary bg-primary-light'
        : 'text-gray-700 hover:text-primary hover:bg-gray-50'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Navigation */}
          <nav className="hidden md:flex items-center space-x-2 flex-1">
            <Link to="/about" className={navLinkClasses('/about')}>
              About
            </Link>
            <Link to="/gallery" className={navLinkClasses('/gallery')}>
              Gallery
            </Link>
          </nav>

          {/* Centered Logo */}
          <Link
            to="/"
            className="flex flex-col items-center group cursor-pointer px-6"
          >
            <img
              src="/assets/logo-variants/brain-icon-tight-v1.jpg"
              alt="Pain+ Logo"
              className="w-11 h-11 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-lg font-bold -mt-0.5">
              <span className="text-secondary">p</span>
              <span className="text-primary">ain</span>
              <span className="text-secondary">+</span>
            </span>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center justify-end space-x-2 flex-1">
            {isAuthenticated && (
              <>
                <Link
                  to="/mode"
                  className="hidden md:inline-flex items-center px-5 py-2.5 text-base font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors duration-200"
                >
                  Create Art
                </Link>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onKeyDown={handleKeyDown}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1"
                  >
                    {/* Avatar */}
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-full border-2 border-primary/30"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}

                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-200"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => setIsDropdownOpen(false)}
                        role="menuitem"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        onClick={() => setIsDropdownOpen(false)}
                        role="menuitem"
                      >
                        Settings
                      </Link>
                      <Link
                        to="/gallery"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none md:hidden"
                        onClick={() => setIsDropdownOpen(false)}
                        role="menuitem"
                      >
                        Gallery
                      </Link>
                      <Link
                        to="/mode"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none md:hidden"
                        onClick={() => setIsDropdownOpen(false)}
                        role="menuitem"
                      >
                        Create Art
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
