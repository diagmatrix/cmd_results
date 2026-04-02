import { type GameStats, Stats } from '../lib/model';
import { escapeHtml, formatPartners, getColorIdentityGradient } from '../lib/utils';

interface StatsDisplayProps {
  players: GameStats[];
  commandersByGames: GameStats[];
  commandersByWins: GameStats[];
  stats: Stats | null;
  isDark?: boolean;
}

export function StatsDisplay({ players, commandersByGames, commandersByWins, stats, isDark = true }: StatsDisplayProps) {
  const safeStats = stats || new Stats(0, 0, 0);

  const purpleColor = isDark ? '#c4b5fd' : '#7c3aed';
  const yellowColor = isDark ? '#fcd34d' : '#b45309';

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
    <div key={player.player} className="rounded p-3 flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{escapeHtml(player.player!)}</div>
      <div className="text-sm" style={{ color: purpleColor }}>{player.uniqueCommanders} unique commanders</div>
      <div className="text-2xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{player.wins}/{player.games}</div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{player.winrate()}% win rate</div>
      <div className="text-xs mt-1" style={{ color: yellowColor }}>
        {player.started > 0 ? `${player.startedWon}/${player.started} going first` : 'never gone first'}
      </div>
    </div>
  );

  const renderCommanderStatCard = (commander: GameStats) => (
    <div key={commander.commander} className="rounded p-3 flex flex-col justify-center" style={{ background: getColorIdentityGradient(commander.colorIdentity, isDark) }}>
      <div className="font-semibold" style={{ whiteSpace: 'pre-line', color: purpleColor }}>{formatPartners(escapeHtml(commander.commander!))}</div>
      {renderColorSymbols(commander)}
      <div className="text-2xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{commander.wins}/{commander.games}</div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{commander.winrate()}% win rate</div>
      <div className="text-xs mt-1" style={{ color: yellowColor }}>
        {commander.started > 0 ? `${commander.startedWon}/${commander.started} going first` : 'never gone first'}
      </div>
    </div>
  );

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{safeStats.games}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Total games recorded</div>
        </div>
        <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{safeStats.players}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Unique players</div>
        </div>
        <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{safeStats.commanders}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Unique commanders</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-blue-400 text-center">Top players by games played</h2>
          <div className="grid grid-cols-2 gap-2">
            {players.map(renderPlayerStatCard)}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-purple-400 text-center">Most played commanders</h2>
          <div className="grid grid-cols-2 gap-2">
            {commandersByGames.map(renderCommanderStatCard)}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-green-400 text-center">Best performing commanders</h2>
          <div className="grid grid-cols-2 gap-2">
            {commandersByWins.map(renderCommanderStatCard)}
          </div>
        </div>
      </div>
    </>
  );
}
