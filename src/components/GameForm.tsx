import { useState, useEffect, useRef, type FormEvent } from 'react';
import { insertGame, fetchCommanderNames } from '../lib/supabase';
import { type GameFormData } from '../lib/model';
import type { CommanderName } from '../lib/model';

interface PlayerRow {
  player: string;
  commander: string;
}

interface GameFormProps {
  isDark?: boolean;
  onSuccess?: () => void;
}

const PLAYER_COUNT = 3;

export function GameForm({ isDark = true, onSuccess }: GameFormProps) {
  const [playerRows, setPlayerRows] = useState<PlayerRow[]>(
    Array(PLAYER_COUNT).fill({ player: '', commander: '' })
  );
  const [gameDate, setGameDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [winner, setWinner] = useState('');
  const [startingPlayer, setStartingPlayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [commanderSuggestions, setCommanderSuggestions] = useState<CommanderName[]>([]);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeRowIndex !== null && suggestionRefs.current[activeRowIndex] && !suggestionRefs.current[activeRowIndex]!.contains(event.target as Node)) {
        setActiveRowIndex(null);
        setCommanderSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeRowIndex]);

  const playerNames = playerRows.map(r => r.player.trim()).filter(Boolean);

  const handlePlayerChange = (index: number, field: 'player' | 'commander', value: string) => {
    const newRows = [...playerRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setPlayerRows(newRows);

    if (field === 'commander') {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      setActiveRowIndex(index);

      if (value.length >= 3) {
        debounceTimer.current = setTimeout(async () => {
          const commanders: CommanderName[] = await fetchCommanderNames(value, 7);

          setCommanderSuggestions(commanders);
        }, 300);
      } else {
        setCommanderSuggestions([]);
        setActiveRowIndex(null);
      }
    }
  };

  const selectCommander = (index: number, commander: string) => {
    const newRows = [...playerRows];
    newRows[index] = { ...newRows[index], commander };
    setPlayerRows(newRows);
    setActiveRowIndex(null);
    setCommanderSuggestions([]);
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

    // Trim values first, then filter out empty/whitespace-only entries
    const trimmedPlayers = playerRows
      .map(p => ({
        player: p.player.trim(),
        commander: p.commander.trim()
      }))
      .filter(p => p.player && p.commander);

    if (trimmedPlayers.length < 2) {
      setError('Need at least 2 players with commanders');
      return;
    }

    if (!winner) {
      setError('Please select winner');
      return;
    }

    setIsSubmitting(true);

    const gameData: GameFormData = {
      playerData: trimmedPlayers,
      winner: winner.trim(),
      startingPlayer: startingPlayer.trim(),
      gameDate: gameDate
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
          <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Players & Commanders</label>
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
            <div key={index} className="grid grid-cols-2 gap-2 items-center" ref={(el) => { suggestionRefs.current[index] = el; }}>
              <input
                type="text"
                value={row.player}
                onChange={(e) => handlePlayerChange(index, 'player', e.target.value)}
                placeholder={`Player ${index + 1}`}
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                className="border rounded px-3 py-2"
                required
              />
              <div className="relative">
                <input
                  type="text"
                  value={row.commander}
                  onChange={(e) => handlePlayerChange(index, 'commander', e.target.value)}
                  placeholder="Commander"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
                {activeRowIndex === index && commanderSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full rounded mt-1 max-h-48 overflow-y-auto border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}>
                    {commanderSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectCommander(index, suggestion.name)}
                        className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0"
                        style={{ color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#e5e7eb' }}
                      >
{suggestion.has_been_played === true && <span className="mr-2" style={{ color: isDark ? '#fcd34d' : '#b45309' }}>★</span>}
{suggestion.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
          <input
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
<div>
  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Winner</label>
  <select
    value={winner}
    onChange={(e) => setWinner(e.target.value)}
    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
    className="w-full border rounded px-3 py-2"
    required
  >
    <option value="">Select...</option>
    {playerNames.map(n => (
      <option key={n} value={n}>{n}</option>
    ))}
  </select>
</div>
<div>
  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Starting Player</label>
  <select
    value={startingPlayer}
    onChange={(e) => setStartingPlayer(e.target.value)}
    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">Select...</option>
    {playerNames.map(n => (
      <option key={n} value={n}>{n}</option>
    ))}
  </select>
</div>
      </div>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold disabled:opacity-50 flex-1"
        >
          {isSubmitting ? 'Adding...' : 'Add Game'}
        </button>
        <div className="relative group">
          <span className="rounded-full w-6 h-6 flex items-center justify-center cursor-help text-sm" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>?</span>
          <div className="absolute right-0 bottom-full mb-2 w-56 p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            For partner commanders, use | to separate (e.g., "Rebbec, Architect of Ascension | Vial Smasher the Fierce")
          </div>
        </div>
      </div>
    </form>
  );
}
