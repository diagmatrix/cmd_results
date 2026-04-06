import { useState, useEffect, useCallback } from 'react';
import { type GameStats, Stats } from '../lib/model';
import { escapeHtml, formatPartners, getColorIdentityGradient } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { fetchPlayers, fetchCommanderStats, fetchStats } from '../lib/supabase';
import { Spinner } from './Spinner';

interface StatsDisplayProps {
  isDark?: boolean;
  refreshTrigger?: number;
}

export function StatsDisplay({ isDark = true, refreshTrigger = 0 }: StatsDisplayProps) {
  const [players, setPlayers] = useState<GameStats[]>([]);
  const [commandersByGames, setCommandersByGames] = useState<GameStats[]>([]);
  const [commandersByWins, setCommandersByWins] = useState<GameStats[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingCommandersByGames, setLoadingCommandersByGames] = useState(true);
  const [loadingCommandersByWins, setLoadingCommandersByWins] = useState(true);
  
  const navigate = useNavigate();

  const loadStatsData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const statsData = await fetchStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading overall stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadPlayersData = useCallback(async () => {
    setLoadingPlayers(true);
    try {
      const playersData = await fetchPlayers(8);
      setPlayers(playersData);
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  const loadCommandersByGamesData = useCallback(async () => {
    setLoadingCommandersByGames(true);
    try {
      const commandersData = await fetchCommanderStats(8, 'games_played');
      setCommandersByGames(commandersData);
    } catch (err) {
      console.error('Error loading commanders by games:', err);
    } finally {
      setLoadingCommandersByGames(false);
    }
  }, []);

  const loadCommandersByWinsData = useCallback(async () => {
    setLoadingCommandersByWins(true);
    try {
      const commandersData = await fetchCommanderStats(8, 'winrate', 3);
      setCommandersByWins(commandersData);
    } catch (err) {
      console.error('Error loading commanders by wins:', err);
    } finally {
      setLoadingCommandersByWins(false);
    }
  }, []);

  useEffect(() => {
    loadStatsData();
    loadPlayersData();
    loadCommandersByGamesData();
    loadCommandersByWinsData();
  }, [loadStatsData, loadPlayersData, loadCommandersByGamesData, loadCommandersByWinsData, refreshTrigger]);

  const safeStats = stats || new Stats(0, 0, 0);

  const purpleColor = isDark ? '#c4b5fd' : '#7c3aed';
  const yellowColor = isDark ? '#fcd34d' : '#b45309';

  const handleCommanderClick = (commanderName: string) => {
    navigate(`/commanders?commander=${encodeURIComponent(commanderName)}`);
  };

  const handlePlayerClick = (playerName: string) => {
    navigate(`/players?player=${encodeURIComponent(playerName)}`);
  };

  const renderColorSymbols = (commander: GameStats) => {
    const urls = commander.colorIdentitySymbolUrls();
    return (
      <div className="flex mt-1">
        {urls.map((url, index) => (
          <img key={index} src={url} alt="" aria-hidden="true" className="inline w-4 h-4 mr-0.5" />
        ))}
      </div>
    );
  }

  const renderPlayerStatCard = (player: GameStats) => (
    <button
      key={player.player}
      type="button"
      onClick={() => handlePlayerClick(player.player!)}
      aria-label={`View details for ${player.player}`}
      className="rounded p-3 flex flex-col justify-center text-left cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-tertiary)',
        backgroundImage: player.imageUri ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${player.imageUri})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="font-semibold" style={{ color: player.imageUri ? '#f9fafb' : 'var(--text-primary)' }}>{escapeHtml(player.player!)}</div>
      <div className="text-sm" style={{ color: player.imageUri ? '#c4b5fd' : purpleColor }}>{player.uniqueCommanders} unique commanders</div>
      <div className="text-2xl font-bold" style={{ color: player.imageUri ? '#f9fafb' : (isDark ? '#f9fafb' : '#111827') }}>{player.wins}/{player.games}</div>
      <div className="text-sm" style={{ color: player.imageUri ? '#d1d5db' : 'var(--text-secondary)' }}>{player.winrate()}% win rate</div>
      <div className="text-xs mt-1" style={{ color: player.imageUri ? '#fcd34d' : yellowColor }}>
        {player.started > 0 ? `${player.startedWon}/${player.started} going first` : 'never gone first'}
      </div>
    </button>
  );

  const renderCommanderStatCard = (commander: GameStats) => (
    <button
      key={commander.commander}
      type="button"
      onClick={() => handleCommanderClick(commander.commander!)}
      aria-label={`View details for ${commander.commander}`}
      className="rounded p-3 flex flex-col justify-center text-left cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
      style={{ background: getColorIdentityGradient(commander.colorIdentity, isDark) }}
    >
      <div className="font-semibold" style={{ whiteSpace: 'pre-line', color: purpleColor }}>{formatPartners(escapeHtml(commander.commander!))}</div>
      {renderColorSymbols(commander)}
      <div className="text-2xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{commander.wins}/{commander.games}</div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{commander.winrate()}% win rate</div>
      <div className="text-xs mt-1" style={{ color: yellowColor }}>
        {commander.started > 0 ? `${commander.startedWon}/${commander.started} going first` : 'never gone first'}
      </div>
    </button>
  );

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
       <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
           {loadingStats ? (
             <Spinner size="sm" />
           ) : (
             <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{safeStats.games}</div>
           )}
           <div style={{ color: 'var(--text-secondary)' }}>Total games recorded</div>
         </div>
         <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
           {loadingStats ? (
             <Spinner size="sm" />
           ) : (
             <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{safeStats.players}</div>
           )}
           <div style={{ color: 'var(--text-secondary)' }}>Unique players</div>
         </div>
         <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
           {loadingStats ? (
             <Spinner size="sm" />
           ) : (
             <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{safeStats.commanders}</div>
           )}
           <div style={{ color: 'var(--text-secondary)' }}>Unique commanders</div>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-blue-400 text-center">Top players by games played</h2>
          {loadingPlayers ? (
            <Spinner size="sm" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {players.map(renderPlayerStatCard)}
            </div>
          )}
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-purple-400 text-center">Most played commanders</h2>
          {loadingCommandersByGames ? (
            <Spinner size="sm" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {commandersByGames.map(renderCommanderStatCard)}
            </div>
          )}
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-green-400 text-center">Best performing commanders</h2>
          {loadingCommandersByWins ? (
            <Spinner size="sm" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {commandersByWins.map(renderCommanderStatCard)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
