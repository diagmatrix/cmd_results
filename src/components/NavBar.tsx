interface NavBarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function NavBar({ currentPage = 'home', onNavigate }: NavBarProps) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'games', label: 'Games' },
    { id: 'commanders', label: 'Commanders' },
    { id: 'players', label: 'Players' },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700 mb-6 w-full">
      <div className="flex items-center justify-start h-16 w-full max-w-7xl mx-auto px-4">
        <div className="flex space-x-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`text-gray-100 font-bold text-lg sm:text-xl hover:text-blue-400 px-4 py-2 rounded transition ${
                currentPage === item.id ? 'text-blue-400' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}