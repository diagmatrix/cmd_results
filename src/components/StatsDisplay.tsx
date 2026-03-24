import { type Player, type Commander, type PlayerCommander, type Stats, Stats as StatsClass } from '../lib/supabase';
import { escapeHtml, formatPartners } from '../lib/utils';

interface StatsDisplayProps {
  players: Player[];
  commanders: Commander[];
  combos: PlayerCommander[];
  stats: Stats | null;
}

export function StatsDisplay({ players, commanders, combos, stats }: StatsDisplayProps) {
  const safeStats = stats || new StatsClass(0, 0, 0);

  const renderPlayerStatCard = (player: Player) => (
    <div key={player.player} className="bg-gray-700 rounded p-3">
      <div className="font-semibold">{escapeHtml(player.player)}</div>
      <div className="text-sm text-purple-300">{player.uniqueCommanders} unique commanders</div>
      <div className="text-2xl font-bold">{player.wins}/{player.games}</div>
      <div className="text-sm text-gray-400">{player.winrate()}% win rate</div>
      <div className="text-xs text-yellow-400 mt-1">
        {player.started > 0 ? `${player.startedWon}/${player.started} going first` : 'never gone first'}
      </div>
    </div>
  );

  const renderCommanderStatCard = (commander: Commander) => (
    <div key={commander.commander} className="bg-gray-700 rounded p-3">
      <div className="font-semibold text-purple-300" style={{ whiteSpace: 'pre-line' }}>{formatPartners(escapeHtml(commander.commander))}</div>
      <div className="text-2xl font-bold">{commander.wins}/{commander.games}</div>
      <div className="text-sm text-gray-400">{commander.winrate()}% win rate</div>
      <div className="text-xs text-yellow-400 mt-1">
        {commander.started > 0 ? `${commander.startedWon}/${commander.started} going first` : 'never gone first'}
      </div>
    </div>
  );

  const renderComboStatCard = (combo: PlayerCommander) => (
    <div key={`${combo.player}-${combo.commander}`} className="bg-gray-700 rounded p-3">
      <div className="font-semibold">{escapeHtml(combo.player)}</div>
      <div className="text-purple-300" style={{ whiteSpace: 'pre-line' }}>{formatPartners(escapeHtml(combo.commander))}</div>
      <div className="text-2xl font-bold">{combo.wins}/{combo.games}</div>
      <div className="text-sm text-gray-400">{combo.winrate()}% win rate</div>
    </div>
  );

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold">{safeStats.games}</div>
          <div className="text-gray-400">Total games recorded</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold">{safeStats.players}</div>
          <div className="text-gray-400">Unique players</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold">{safeStats.commanders}</div>
          <div className="text-gray-400">Unique commanders</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-8 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-blue-400 text-center">Top players by games played</h2>
          <div className="grid grid-cols-2 gap-2">
            {players.map(renderPlayerStatCard)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 col-span-3">
          <h2 className="text-lg font-semibold mb-3 text-purple-400 text-center">Top commanders by games played</h2>
          <div className="grid grid-cols-2 gap-2">
            {commanders.map(renderCommanderStatCard)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 col-span-3">
          <h2 className="text-lg font-semibold mb-3 text-green-400 text-center">Top player + commander by games played</h2>
          <div className="grid grid-cols-2 gap-2">
            {combos.map(renderComboStatCard)}
          </div>
        </div>
      </div>
    </>
  );
}