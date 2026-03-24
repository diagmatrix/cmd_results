import { useState, useEffect, useCallback } from 'react';
import { NavBar } from './components/NavBar';
import { GameForm } from './components/GameForm';
import { GamesList } from './components/GamesList';
import { StatsDisplay } from './components/StatsDisplay';
import {
  type Game,
  type GameStats,
  type Stats,
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
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <NavBar />
      <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Commander Game Tracker</h1>
        
        <StatsDisplay
          players={players}
          commanders={commanders}
          combos={combos}
          stats={stats}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Add Game</h2>
            <GameForm onSuccess={handleGameSuccess} />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
            <GamesList games={games} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;