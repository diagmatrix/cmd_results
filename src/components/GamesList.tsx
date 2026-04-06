import { useState, useEffect, useCallback } from 'react';
import type { Game, PlayerData } from '../lib/model';
import { escapeHtml } from '../lib/utils';
import { fetchRecentGames } from '../lib/supabase';
import { Spinner } from './Spinner';

interface GamesListProps {
  limit?: number;
  isDark?: boolean;
  refreshTrigger?: number;
}

export function GamesList({ limit = 10, isDark = true, refreshTrigger = 0 }: GamesListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecentGames(limit);
      setGames(data);
    } catch (err) {
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  if (loading) {
    return <Spinner />;
  }
  if (!games.length) {
    return <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No games yet</p>;
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {games.map(game => (
        <div key={game.id} className="rounded p-4" style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: isDark ? 'none' : '3px solid #9333ea' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold" style={{ color: isDark ? '#4ade80' : '#15803d' }}>{escapeHtml(game.winner)}</span>
              <span style={{ color: 'var(--text-secondary)' }}> won</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {new Date(game.game_date).toLocaleDateString()}
            </span>
          </div>
          <div className="text-sm mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            {game.player_data.map((p: PlayerData, i: number) => (
              <div key={i} className="flex justify-between">
                <span style={{ color: 'var(--text-primary)' }}>
                  {escapeHtml(p.player)}
                  {p.player === game.starting_player && (
                    <span className="text-xs" style={{ color: isDark ? '#fcd34d' : '#b45309' }}> started</span>
                  )}
                </span>
                <span style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>{escapeHtml(p.commander)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
