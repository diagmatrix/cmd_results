import { Link, useLocation } from 'react-router-dom';

interface NavBarProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function NavBar({ isDark = false, onToggleTheme }: NavBarProps) {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/games', label: 'Games' },
    { path: '/commanders', label: 'Commanders' },
    { path: '/players', label: 'Players' },
    { path: '/stats', label: 'Stats' },
  ];

  return (
    <nav className="bg-purple-700 mb-6 w-full">
      <div className="flex items-center justify-between h-16 w-full max-w-7xl mx-auto px-4">
        <div className="flex space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-bold text-lg sm:text-xl hover:text-gray-600 px-4 py-2 rounded transition ${
                location.pathname === item.path ? 'text-gray-100' : 'text-purple-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full hover:bg-purple-600 transition"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
