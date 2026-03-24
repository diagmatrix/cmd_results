import { useState, useEffect, useCallback } from 'react';
import { NavBar } from './components/NavBar';
import { GameForm } from './components/GameForm';
import { GamesList } from './components/GamesList';
import { StatsDisplay } from './components/StatsDisplay';
import { type Game, type GameStats, type Stats } from './lib/model';
import {
  fetchRecentGames,
  fetchPlayers,
  fetchCommanders,
  fetchCombos,
  fetchStats
} from './lib/supabase';

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<GameStats[]>([]);
  const [commanders, setCommanders] = useState<GameStats[]>([]);
  const [combos, setCombos] = useState<GameStats[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesData, playersData, commandersData, combosData, statsData] = await Promise.all([
        fetchRecentGames(10),
        fetchPlayers(8),
        fetchCommanders(8),
        fetchCombos(8),
        fetchStats()
      ]);
      setGames(gamesData);
      setPlayers(playersData);
      setCommanders(commandersData);
      setCombos(combosData);
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
    <div className="main-content" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
      <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Commander Game Tracker</h1>
        
        <StatsDisplay
          players={players}
          commanders={commanders}
          combos={combos}
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
    </div>
  );
}

export default App;
