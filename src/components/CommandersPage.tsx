import { useState, useEffect, useCallback } from 'react';
import { fetchAllCommanders } from '../lib/supabase';
import { type CommanderData } from '../lib/model';
import { escapeHtml, formatColorIdentity, formatPartners } from '../lib/utils';
import { GamesTimeline } from './GamesTimeline';

interface CommanderPageProps {
  isDark?: boolean;
}

export function CommanderPage({ isDark = true }: CommanderPageProps) {
  const [commanders, setCommanders] = useState<CommanderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommander, setSelectedCommander] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllCommanders();
      setCommanders(data);
    } catch (err) {
      console.error('Error loading commanders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uniqueCount = commanders.length;

  const colorIdentityCounts = commanders.reduce((acc, c) => {
    const colors = c.color_identity || 'C';
    acc[colors] = (acc[colors] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topColorIdentities = Object.entries(colorIdentityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([colors, count]) => ({
      colors,
      ...formatColorIdentity(colors),
      count
    }));

  const topCommanders = commanders
    .slice(0, 3)
    .map(c => ({
      name: c.commander,
      games: c.games_played
    }));

  const renderSymbols = (colors: string | null) => {
    const { symbols } = formatColorIdentity(colors);
    return <span dangerouslySetInnerHTML={{ __html: symbols }} />;
  };

  const filteredCommanders = searchTerm
    ? commanders.filter(c => 
        c.commander.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
    : commanders.slice(0, 10);

  const selectedCommanderData = commanders.find(c => c.commander === selectedCommander);

  const handleSelectCommander = (commander: string) => {
    setSelectedCommander(commander);
    setSearchTerm(commander);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-primary)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg p-4 text-center flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-4xl font-bold" style={{ color: isDark ? '#f9fafb' : '#111827' }}>{uniqueCount}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Unique commanders</div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-purple-400 text-center">Top color identities</h2>
          <div className="space-y-2">
            {topColorIdentities.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="w-20 text-center mr-1" style={{ color: 'var(--text-primary)' }}>{renderSymbols(item.colors)}</div>
                <div className="w-20" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                <div className="flex-1" />
                <div style={{ color: 'var(--text-secondary)' }}>{item.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-semibold mb-3 text-blue-400 text-center">Top commanders by games</h2>
          <div className="space-y-2">
            {topCommanders.map((c, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="truncate" style={{ color: 'var(--text-primary)' }} title={c.name}>
                  {escapeHtml(c.name)}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{c.games}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h2 className="text-xl font-semibold mb-4">Select Commander</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search commander..."
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              color: 'var(--text-primary)', 
              borderColor: isDark ? '#4b5563' : '#d1d5db' 
            }}
            className="w-full border rounded px-3 py-2"
          />
            {showDropdown && filteredCommanders.length > 0 && (
            <div 
              className="absolute z-10 w-full rounded mt-1 max-h-48 overflow-y-auto border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderColor: isDark ? '#4b5563' : '#d1d5db' 
              }}
            >
              {filteredCommanders.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectCommander(c.commander)}
                  className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0"
                  style={{ color: 'var(--text-primary)', borderColor: isDark ? '#4b5563' : '#e5e7eb' }}
                >
                  {escapeHtml(c.commander)}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedCommanderData && (
          <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="font-semibold text-xl mb-6 flex items-center flex-wrap gap-4">
              {renderSymbols(selectedCommanderData.color_identity)}
              <span className="text-purple-400">
                {formatPartners(selectedCommander).split('\n').map((line, i, arr) => (
                  <span key={i}>
                    {escapeHtml(line)}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </span>
              <span style={{ color: 'var(--text-secondary)' }} className="text-base font-normal">
                {selectedCommanderData.games_played} games · {selectedCommanderData.games_won} wins ({((selectedCommanderData.games_won / selectedCommanderData.games_played) * 100).toFixed(0)}%)
              </span>
              <span style={{ color: '#fbbf24' }} className="text-base font-normal">
                {selectedCommanderData.player_data?.length || 0} players: {selectedCommanderData.player_data.join(', ')}
              </span>
            </div>
            <GamesTimeline gameDates={selectedCommanderData.game_dates} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="relative w-96 h-144 mx-auto overflow-hidden">
                  {selectedCommanderData.image_uris && selectedCommanderData.image_uris.length > 0 && (
                    selectedCommanderData.image_uris.length === 1 ? (
                      <img
                        src={selectedCommanderData.image_uris[0]}
                        alt={selectedCommanderData.commander}
                        className="absolute top-0 left-0 w-82 rounded-lg z-0 object-contain"
                      />
                    ) : (
                      <>
                        <img
                          src={selectedCommanderData.image_uris[0]}
                          alt={selectedCommanderData.commander}
                          className="absolute top-0 left-0 w-72 rounded-lg z-0 hover:z-5 transition-all duration-200 object-contain"
                        />
                        <img
                          src={selectedCommanderData.image_uris[1]}
                          alt={selectedCommanderData.commander}
                          className="absolute top-10 left-10 w-72 rounded-lg z-0 hover:z-5 transition-all duration-200 object-contain"
                        />
                      </>
                    )
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                <p style={{ color: 'var(--text-secondary)' }}>Matchups coming in the future</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}