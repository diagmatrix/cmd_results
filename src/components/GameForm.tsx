import { useState, type FormEvent } from 'react';
import { insertGame, type GameFormData } from '../lib/supabase';
import { escapeHtml } from '../lib/utils';

interface PlayerRow {
  player: string;
  commander: string;
}

interface GameFormProps {
  onSuccess?: () => void;
}

const PLAYER_COUNT = 3;

export function GameForm({ onSuccess }: GameFormProps) {
  const [playerRows, setPlayerRows] = useState<PlayerRow[]>(
    Array(PLAYER_COUNT).fill({ player: '', commander: '' })
  );
  const [gameDate, setGameDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [winner, setWinner] = useState('');
  const [startingPlayer, setStartingPlayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerNames = playerRows.map(r => r.player).filter(Boolean);

  const handlePlayerChange = (index: number, field: 'player' | 'commander', value: string) => {
    const newRows = [...playerRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setPlayerRows(newRows);
  };

  const handleAddPlayer = () => {
    setPlayerRows([...playerRows, { player: '', commander: '' }]);
  };

  const handleRemovePlayer = (index: number) => {
    if (playerRows.length <= 2) return;
    const newRows = playerRows.filter((_, i) => i !== index);
    setPlayerRows(newRows);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validPlayers = playerRows.filter(p => p.player && p.commander);
    
    if (validPlayers.length < 2) {
      setError('Need at least 2 players with commanders');
      return;
    }

    if (!winner || !startingPlayer) {
      setError('Please select winner and starting player');
      return;
    }

    setIsSubmitting(true);

    const gameData: GameFormData = {
      playerData: validPlayers,
      winner,
      startingPlayer,
      createdAt: gameDate
    };

    const { error: insertError } = await insertGame(gameData);

    setIsSubmitting(false);

    if (insertError) {
      setError('Error saving game: ' + insertError.message);
      return;
    }

    setPlayerRows(Array(PLAYER_COUNT).fill({ player: '', commander: '' }));
    setWinner('');
    setStartingPlayer('');
    setGameDate(new Date().toISOString().split('T')[0]);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm">Players & Commanders</label>
          <button
            type="button"
            onClick={handleAddPlayer}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add Player
          </button>
        </div>
        <div className="space-y-2">
          {playerRows.map((row, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 items-center">
              <input
                type="text"
                value={row.player}
                onChange={(e) => handlePlayerChange(index, 'player', e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="bg-gray-700 rounded px-3 py-2"
                required
              />
              <input
                type="text"
                value={row.commander}
                onChange={(e) => handlePlayerChange(index, 'commander', e.target.value)}
                placeholder="Commander"
                className="bg-gray-700 rounded px-3 py-2"
                required
              />
              {index >= 2 && (
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(index)}
                  className="col-span-2 text-red-400 text-sm hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Winner</label>
          <select
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
            required
          >
            <option value="">Select...</option>
            {playerNames.map(n => (
              <option key={n} value={escapeHtml(n)}>{escapeHtml(n)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Starting Player</label>
          <select
            value={startingPlayer}
            onChange={(e) => setStartingPlayer(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
            required
          >
            <option value="">Select...</option>
            {playerNames.map(n => (
              <option key={n} value={escapeHtml(n)}>{escapeHtml(n)}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add Game'}
      </button>
    </form>
  );
}