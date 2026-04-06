import { CommanderData } from '../lib/model';
import { formatPartners } from '../lib/utils';

interface CommanderGridProps {
  commanders: CommanderData[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCommanderClick: (name: string) => void;
}

export function CommanderGrid({ 
  commanders, 
  page, 
  totalPages, 
  onPageChange, 
  onCommanderClick
}: CommanderGridProps) {
  
  const renderCommanderCard = (commander: CommanderData) => {
    const hasPartners = commander.imageUris && commander.imageUris.length > 1;
    
    return (
      <button
        key={commander.commander}
        type="button"
        onClick={() => onCommanderClick(commander.commander)}
        className="rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Commander image(s) */}
        <div className="relative w-full aspect-[5/7] mb-3 overflow-hidden rounded">
          {commander.imageUris && commander.imageUris.length > 0 ? (
            hasPartners ? (
              <div className="relative w-full h-full">
                <img
                  src={commander.imageUris[0]}
                  alt={commander.commander}
                  className="absolute top-0 left-0 w-[90%] object-cover rounded shadow-lg z-0 hover:z-10 transition-all duration-200"
                />
                <img
                  src={commander.imageUris[1]}
                  alt={commander.commander}
                  className="absolute bottom-0 right-0 w-[90%] object-cover rounded shadow-lg z-0 hover:z-10 transition-all duration-200"
                />
              </div>
            ) : (
              <img
                src={commander.imageUris[0]}
                alt={commander.commander}
                className="w-full h-full object-cover rounded"
              />
            )
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center rounded"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }} className="text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Commander name */}
        <div className="text-sm font-semibold text-center mb-1 text-purple-400" style={{ whiteSpace: 'pre-line' }}>
          {formatPartners(commander.commander)}
        </div>

        {/* Stats */}
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {commander.wins}/{commander.games} ({commander.winrate()}%)
        </div>
      </button>
    );
  };

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        {commanders.map(renderCommanderCard)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            ← Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              // Show first, last, current, and neighbors
              const showPage = i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1;
              const showEllipsis = (i === 1 && page > 3) || (i === totalPages - 2 && page < totalPages - 4);

              if (showEllipsis) {
                return <span key={i} style={{ color: 'var(--text-secondary)' }}>...</span>;
              }

              if (!showPage) return null;

              return (
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`px-3 py-1 rounded transition-all duration-200 ${
                    i === page ? 'font-bold' : ''
                  }`}
                  style={{ 
                    backgroundColor: i === page ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    color: i === page ? '#c4b5fd' : 'var(--text-primary)'
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages - 1}
            className="px-3 py-1 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
