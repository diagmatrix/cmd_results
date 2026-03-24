import { useState, useEffect, useMemo, useCallback } from 'react';
import { GameForm } from './GameForm';
import { fetchAllGames } from '../lib/supabase';
import { type Game } from '../lib/model';
import { escapeHtml } from '../lib/utils';

interface GamesPageProps {
  isDark?: boolean;
}

type SortField = 'id' | 'game_date' | 'winner' | 'starting_player';
type SortDirection = 'asc' | 'desc';

interface Filters {
  winner: string;
  player: string;
  commander: string;
  dateFrom: string;
  dateTo: string;
}

export function GamesPage({ isDark = true }: GamesPageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('game_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<Filters>({
    winner: '',
    player: '',
    commander: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pageSize, setPageSize] = useState<25 | 50>(25);
  const [currentPage, setCurrentPage] = useState(1);

  const loadGames = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllGames();
    setGames(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGames();
  }, [loadGames]);

  const uniqueWinners = useMemo(() => {
    const winners = new Set(games.map(g => g.winner));
    return Array.from(winners).sort();
  }, [games]);

  const uniquePlayers = useMemo(() => {
    const players = new Set(games.flatMap(g => g.player_data.map(p => p.player)));
    return Array.from(players).sort();
  }, [games]);

  const uniqueCommanders = useMemo(() => {
    const commanders = new Set(games.flatMap(g => g.player_data.map(p => p.commander)));
    return Array.from(commanders).sort();
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (filters.winner && game.winner !== filters.winner) return false;
      if (filters.dateFrom && game.game_date < filters.dateFrom) return false;
      if (filters.dateTo && game.game_date > filters.dateTo) return false;
      if (filters.player) {
        const hasPlayer = game.player_data.some(p => 
          p.player.toLowerCase().includes(filters.player.toLowerCase())
        );
        if (!hasPlayer) return false;
      }
      if (filters.commander) {
        const hasCommander = game.player_data.some(p => 
          p.commander.toLowerCase().includes(filters.commander.toLowerCase())
        );
        if (!hasCommander) return false;
      }
      return true;
    });
  }, [games, filters]);

  const sortedGames = useMemo(() => {
    return [...filteredGames].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'game_date':
          comparison = a.game_date.localeCompare(b.game_date);
          break;
        case 'winner':
          comparison = a.winner.localeCompare(b.winner);
          break;
        case 'starting_player':
          comparison = (a.starting_player || '').localeCompare(b.starting_player || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredGames, sortField, sortDirection]);

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGames.slice(start, start + pageSize);
  }, [sortedGames, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedGames.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleGameAdded = () => {
    loadGames();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 opacity-30">⇅</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const renderSortableHeader = (label: string, field: SortField) => (
    <th
      className="px-3 py-2 text-left cursor-pointer hover:bg-opacity-80 transition"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
      onClick={() => handleSort(field)}
    >
      {label}
      <SortIcon field={field} />
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>Loading games...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Winner</label>
            <select
              value={filters.winner}
              onChange={(e) => handleFilterChange('winner', e.target.value)}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
              className="border rounded px-3 py-2 min-w-[140px]"
            >
              <option value="">All</option>
              {uniqueWinners.map(w => (
                <option key={w} value={escapeHtml(w)}>{escapeHtml(w)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Player</label>
            <select
              value={filters.player}
              onChange={(e) => handleFilterChange('player', e.target.value)}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
              className="border rounded px-3 py-2 min-w-[140px]"
            >
              <option value="">All</option>
              {uniquePlayers.map(p => (
                <option key={p} value={escapeHtml(p)}>{escapeHtml(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Commander</label>
            <select
              value={filters.commander}
              onChange={(e) => handleFilterChange('commander', e.target.value)}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
              className="border rounded px-3 py-2 min-w-[140px]"
            >
              <option value="">All</option>
              {uniqueCommanders.map(c => (
                <option key={c} value={escapeHtml(c)}>{escapeHtml(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={() => setFilters({ winner: '', player: '', commander: '', dateFrom: '', dateTo: '' })}
            className="px-4 py-2 rounded text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {renderSortableHeader('ID', 'id')}
                {renderSortableHeader('Date', 'game_date')}
                <th className="px-3 py-2 text-center" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  Player
                </th>
                <th className="px-3 py-2 text-center" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                  Commander
                </th>
                {renderSortableHeader('Winner', 'winner')}
                {renderSortableHeader('Starting', 'starting_player')}
              </tr>
            </thead>
            <tbody>
              {paginatedGames.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                    No games found
                  </td>
                </tr>
              ) : (
                paginatedGames.map((game) => (
                  game.player_data.map((player, playerIndex) => (
                    <tr key={`${game.id}-${playerIndex}`} className="border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                      {playerIndex === 0 && (
                        <>
                          <td className="px-3 py-2" rowSpan={game.player_data.length} style={{ color: 'var(--text-primary)' }}>
                            {game.id.slice(0, 8)}
                          </td>
                          <td className="px-3 py-2" rowSpan={game.player_data.length} style={{ color: 'var(--text-primary)' }}>
                            {new Date(game.game_date).toLocaleDateString()}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                        {escapeHtml(player.player)}
                      </td>
                      <td className="px-3 py-2" style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
                        {escapeHtml(player.commander)}
                      </td>
                      {playerIndex === 0 && (
                        <>
                          <td className="px-3 py-2 font-semibold" rowSpan={game.player_data.length} style={{ color: isDark ? '#4ade80' : '#15803d' }}>
                            {escapeHtml(game.winner)}
                          </td>
                          <td className="px-3 py-2" rowSpan={game.player_data.length} style={{ color: isDark ? '#fcd34d' : '#b45309' }}>
                            {game.starting_player ? escapeHtml(game.starting_player) : '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value) as 25 | 50); setCurrentPage(1); }}
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
            className="border rounded px-2 py-1"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>of {sortedGames.length} games</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            Next
          </button>
        </div>
      </div>

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xl font-semibold mb-4">Add Game</h2>
        <GameForm isDark={isDark} onSuccess={handleGameAdded} />
      </div>
    </div>
  );
}
