import type { Game, PlayerData } from '../lib/model';
import { escapeHtml } from '../lib/utils';

interface GamesListProps {
  games: Game[];
}

export function GamesList({ games }: GamesListProps) {
  if (!games.length) {
    return <p className="text-gray-500 text-center py-4">No games yet</p>;
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {games.map(game => (
        <div key={game.id} className="bg-gray-700 rounded p-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold text-green-400">{escapeHtml(game.winner)}</span>
              <span className="text-gray-400"> won</span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(game.game_date).toLocaleDateString()}
            </span>
          </div>
          <div className="text-sm text-gray-300 mt-2 space-y-1">
            {game.player_data.map((p: PlayerData, i: number) => (
              <div key={i} className="flex justify-between">
                <span>
                  {escapeHtml(p.player)}
                  {p.player === game.starting_player && (
                    <span className="text-xs text-yellow-400"> started</span>
                  )}
                </span>
                <span className="text-purple-300">{escapeHtml(p.commander)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}