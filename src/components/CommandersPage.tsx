import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAllCommanders } from '../lib/supabase';
import { CommanderData } from '../lib/model';
import { getManaSymbolUrl } from '../lib/utils';
import { Spinner } from './Spinner';
import { CommanderGrid } from './CommanderGrid';
import { CommanderModal } from './CommanderModal';

interface CommanderPageProps {
  isDark?: boolean;
}

type ColorMode = 'exact' | 'atMost' | 'atLeast';
type OrderBy = 'games' | 'wins' | 'name' | 'winrate' | 'tier';
type OrderDir = 'asc' | 'desc';

const COLORS = ['W', 'U', 'B', 'R', 'G', 'C'] as const;
const PAGE_SIZE = 20;

export default function CommanderPage({ isDark = true }: CommanderPageProps) {
  const [commanders, setCommanders] = useState<CommanderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [colorMode, setColorMode] = useState<ColorMode>('exact');
  const [orderBy, setOrderBy] = useState<OrderBy>('name');
  const [orderDir, setOrderDir] = useState<OrderDir>('asc');
  const [page, setPage] = useState(0);
  
  const [searchParams, setSearchParams] = useSearchParams();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllCommanders();
      setCommanders(data);
    } catch (err) {
      console.error('Error loading commanders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle modal opening from URL
  const modalCommanderName = searchParams.get('name');
  const modalCommander = commanders.find(c => c.commander === modalCommanderName) || null;

  const handleOpenModal = useCallback((commanderName: string) => {
    setSearchParams({ name: commanderName });
  }, [setSearchParams]);

  const handleCloseModal = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Filter and sort commanders
  const filteredAndSortedCommanders = useMemo(() => {
    let result = [...commanders];

    // Search filter
    if (searchTerm) {
      result = result.filter(c => 
        c.commander.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Color filter
    if (colorFilter.length > 0) {
      result = result.filter(c => {
        const commanderColors = (c.colorIdentity || 'C').split('').sort();
        const filterColors = [...colorFilter].sort();

        if (colorMode === 'exact') {
          // Exact match: commander colors must exactly match filter
          return commanderColors.length === filterColors.length && 
                 commanderColors.every((color, i) => color === filterColors[i]);
        } else if (colorMode === 'atMost') {
          // At most: commander must only have colors in the filter (subset)
          return commanderColors.every(color => filterColors.includes(color));
        } else {
          // At least: commander must have all filter colors (can have more)
          return filterColors.every(color => commanderColors.includes(color));
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      // Handle tier specially to keep unranked at bottom always
      if (orderBy === 'tier') {
        const tierOrder: Record<string, number> = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
        const valueA = a.tier ? tierOrder[a.tier] : 0;
        const valueB = b.tier ? tierOrder[b.tier] : 0;
        
        // If one is unranked and other isn't, unranked always goes last
        if ((valueA === 0) !== (valueB === 0)) {
          return valueA === 0 ? 1 : -1;
        }
        
        // Otherwise sort normally (asc for C→S, desc for S→C)
        return orderDir === 'asc' 
          ? valueA - valueB
          : valueB - valueA;
      }

      let valueA: number | string;
      let valueB: number | string;
      
      if (orderBy === 'games') {
        valueA = a.games;
        valueB = b.games;
      } else if (orderBy === 'wins') {
        valueA = a.wins;
        valueB = b.wins;
      } else if (orderBy === 'name') {
        valueA = a.commander.toLowerCase();
        valueB = b.commander.toLowerCase();
      } else {
        // winrate
        valueA = parseFloat(a.winrate());
        valueB = parseFloat(b.winrate());
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return orderDir === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return orderDir === 'asc' 
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      }
    });

    return result;
  }, [commanders, searchTerm, colorFilter, colorMode, orderBy, orderDir]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCommanders.length / PAGE_SIZE);
  const paginatedCommanders = filteredAndSortedCommanders.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, colorFilter, colorMode, orderBy, orderDir]);

  const toggleColor = (color: string) => {
    setColorFilter(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setColorFilter([]);
    setColorMode('exact');
    setOrderBy('name');
    setOrderDir('asc');
    setPage(0);
  };

  // Stats for top section
  const uniqueCount = commanders.length;

  const colorIdentityCounts = commanders.reduce((acc, c) => {
    const colors = c.colorIdentity?.split('').sort().join('') || 'C';
    acc[colors] = (acc[colors] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topColorIdentities = Object.entries(colorIdentityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([colors, count]) => {
      const dummyCommander = new CommanderData('', 0, 0, 0, 0, [], []);
      dummyCommander.colorIdentity = colors;
      return {
        colors,
        name: dummyCommander.colorIdentityName(),
        count
      };
    });

  const topCommanders = commanders
    .slice(0, 5)
    .map(c => ({
      name: c.commander,
      games: c.games
    }));

  const renderSymbols = (colors: string | null | undefined) => {
    const dummyCommander = new CommanderData('', 0, 0, 0, 0, [], []);
    dummyCommander.colorIdentity = colors || 'C';
    return (
      <span>
        {dummyCommander.colorIdentitySymbolUrls().map((url, i) => (
          <img key={i} src={url} alt="" aria-hidden="true" className="inline w-5 h-5 mr-0.5" />
        ))}
      </span>
    );
  };

  return (
    <div>
      {/* Top stats section */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg p-4 text-center flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {loading ? (
            <Spinner size="md" />
          ) : (
            <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{uniqueCount}</div>
          )}
          <div style={{ color: 'var(--text-secondary)' }}>Unique commanders</div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-purple-400 text-center">Top color identities</h2>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <div className="space-y-2">
              {topColorIdentities.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="w-20 text-center mr-1" style={{ color: 'var(--text-primary)' }}>{renderSymbols(item.colors)}</div>
                  <div className="w-20" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                  <div className="flex-1" />
                  <div style={{ color: 'var(--text-secondary)' }}>{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-blue-400 text-center">Top commanders by games</h2>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <div className="space-y-2">
              {topCommanders.map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="truncate" style={{ color: 'var(--text-primary)' }} title={c.name}>
                    {c.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.games}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky filter bar */}
      <div 
        className="sticky top-0 z-40 rounded-lg p-4 mb-6 shadow-lg"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search commander..."
            disabled={loading}
            className="w-full border rounded px-3 py-2"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              color: 'var(--text-primary)', 
              borderColor: isDark ? '#4b5563' : '#d1d5db' 
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Color filter */}
          <div className="flex items-center gap-3">
            <label className="text-lg font-semibold text-purple-400 whitespace-nowrap">
              Color Filter
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    colorFilter.includes(color) ? 'scale-110 ring-2 ring-purple-400' : 'opacity-60'
                  }`}
                  style={{ 
                    backgroundColor: colorFilter.includes(color) ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    borderColor: colorFilter.includes(color) ? '#c4b5fd' : isDark ? '#4b5563' : '#d1d5db'
                  }}
                >
                  <img src={getManaSymbolUrl(color)} alt={color} className="w-6 h-6 mx-auto" />
                </button>
              ))}
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => setColorMode('exact')}
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    colorMode === 'exact' ? 'font-bold' : ''
                  }`}
                  style={{
                    backgroundColor: colorMode === 'exact' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    color: colorMode === 'exact' ? '#c4b5fd' : 'var(--text-secondary)'
                  }}
                >
                  Exact
                </button>
                <button
                  onClick={() => setColorMode('atMost')}
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    colorMode === 'atMost' ? 'font-bold' : ''
                  }`}
                  style={{
                    backgroundColor: colorMode === 'atMost' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    color: colorMode === 'atMost' ? '#c4b5fd' : 'var(--text-secondary)'
                  }}
                >
                  At most
                </button>
                <button
                  onClick={() => setColorMode('atLeast')}
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    colorMode === 'atLeast' ? 'font-bold' : ''
                  }`}
                  style={{
                    backgroundColor: colorMode === 'atLeast' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    color: colorMode === 'atLeast' ? '#c4b5fd' : 'var(--text-secondary)'
                  }}
                >
                  At least
                </button>
              </div>
            </div>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-3">
            <label className="text-lg font-semibold text-blue-400 whitespace-nowrap">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setOrderBy('name')}
                className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                  orderBy === 'name' ? 'font-bold' : ''
                }`}
                style={{
                  backgroundColor: orderBy === 'name' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  color: orderBy === 'name' ? '#60a5fa' : 'var(--text-secondary)'
                }}
              >
                Name
              </button>
              <button
                onClick={() => setOrderBy('games')}
                className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                  orderBy === 'games' ? 'font-bold' : ''
                }`}
                style={{
                  backgroundColor: orderBy === 'games' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  color: orderBy === 'games' ? '#60a5fa' : 'var(--text-secondary)'
                }}
              >
                Games
              </button>
              <button
                onClick={() => setOrderBy('wins')}
                className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                  orderBy === 'wins' ? 'font-bold' : ''
                }`}
                style={{
                  backgroundColor: orderBy === 'wins' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  color: orderBy === 'wins' ? '#60a5fa' : 'var(--text-secondary)'
                }}
              >
                Wins
              </button>
               <button
                 onClick={() => setOrderBy('winrate')}
                 className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                   orderBy === 'winrate' ? 'font-bold' : ''
                 }`}
                 style={{
                   backgroundColor: orderBy === 'winrate' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                   color: orderBy === 'winrate' ? '#60a5fa' : 'var(--text-secondary)'
                 }}
               >
                 Winrate
               </button>
               <button
                 onClick={() => setOrderBy('tier')}
                 className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${
                   orderBy === 'tier' ? 'font-bold' : ''
                 }`}
                 style={{
                   backgroundColor: orderBy === 'tier' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                   color: orderBy === 'tier' ? '#60a5fa' : 'var(--text-secondary)'
                 }}
               >
                 Tier
               </button>
               <button
                 onClick={() => setOrderDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                 className="px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                 style={{
                   backgroundColor: 'var(--bg-tertiary)',
                   color: 'var(--text-primary)'
                 }}
               >
                 {orderDir === 'asc' ? '↑ Asc' : '↓ Desc'}
               </button>
            </div>
          </div>

          {/* Reset filters button */}
          <button
            onClick={resetFilters}
            className="px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-md ml-auto"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: '#ef4444'
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Showing {paginatedCommanders.length} of {filteredAndSortedCommanders.length} commanders
        </div>
      </div>

      {/* Commander grid */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <CommanderGrid
            commanders={paginatedCommanders}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onCommanderClick={handleOpenModal}
          />
        )}
      </div>

      {/* Commander modal */}
      <CommanderModal
        commander={modalCommander}
        onClose={handleCloseModal}
      />
    </div>
  );
}
