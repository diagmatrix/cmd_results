import { useState, useEffect, useCallback } from 'react';
import { StatsDisplay } from './StatsDisplay';
import { GameForm } from './GameForm';
import { GamesList } from './GamesList';
import { type Game, type GameStats, type Stats } from '../lib/model';
import {
  fetchRecentGames,
  fetchPlayers,
  fetchCommanderStats,
  fetchStats
} from '../lib/supabase';

interface HomePageProps {
  isDark?: boolean;
}

export default function HomePage({ isDark = true }: HomePageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<GameStats[]>([]);
  const [commandersByGames, setCommandersByGames] = useState<GameStats[]>([]);
  const [commandersByWins, setCommandersByWins] = useState<GameStats[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesData, playersData, commandersByGamesData, commandersByWinsData, statsData] = await Promise.all([
        fetchRecentGames(10),
        fetchPlayers(8),
        fetchCommanderStats(8, 'games_played'),
        fetchCommanderStats(8, 'winrate', 3),
        fetchStats()
      ]);
      setGames(gamesData);
      setPlayers(playersData);
      setCommandersByGames(commandersByGamesData);
      setCommandersByWins(commandersByWinsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGameSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Commander Game Tracker</h1>
      
      <StatsDisplay
        players={players}
        commandersByGames={commandersByGames}
        commandersByWins={commandersByWins}
        stats={stats}
        isDark={isDark}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl font-semibold mb-4">Add Game</h2>
          <GameForm isDark={isDark} onSuccess={handleGameSuccess} />
        </div>
        
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
          <GamesList games={games} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
