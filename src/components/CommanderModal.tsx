import { useState, useEffect } from 'react';
import { CommanderData, getScryfallURL, type CommanderMatchup } from '../lib/model';
import { formatPartners, getEDHRecUrl } from '../lib/utils';
import { fetchCard, fetchCommanderMatchups } from '../lib/supabase';
import { GamesTimeline } from './GamesTimeline';
import { Spinner } from './Spinner';

interface CommanderModalProps {
  commander: CommanderData | null;
  onClose: () => void;
}

export function CommanderModal({ commander, onClose }: CommanderModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [scryfallData, setScryfallData] = useState<{name: string; url: string}[]>([]);
  const [matchups, setMatchups] = useState<CommanderMatchup[]>([]);
  const [matchupsLoading, setMatchupsLoading] = useState(true);
  const [matchupsPage, setMatchupsPage] = useState(0);
  const [sortField, setSortField] = useState<'won' | 'opponent_won' | 'neither_won' | 'games_together'>('games_together');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const MATCHUPS_PER_PAGE = 10;

  useEffect(() => {
    let isMounted = true;

    async function loadScryfallData() {
      if (commander?.cardIds && commander.cardIds.length > 0) {
        const data = await Promise.all(
          commander.cardIds.map(async (id) => {
            const card = await fetchCard(id);
            return {
              name: card?.name || 'Unknown Card',
              url: getScryfallURL(card)
            };
          })
        );
        if (isMounted) {
          setScryfallData(data);
        }
      } else {
        if (isMounted) {
          setScryfallData([]);
        }
      }
    }
    loadScryfallData();

    return () => {
      isMounted = false;
    };
  }, [commander?.cardIds]);

  useEffect(() => {
    async function loadMatchups() {
      if (commander?.commander) {
        setMatchupsLoading(true);
        setMatchupsPage(0);
        setSortField('games_together');
        setSortDirection('desc');
        const data = await fetchCommanderMatchups(commander.commander);
        setMatchups(data);
        setMatchupsLoading(false);
      }
    }
    loadMatchups();
  }, [commander?.commander]);

  const handleResetSort = () => {
    setSortField('games_together');
    setSortDirection('desc');
    setMatchupsPage(0);
  };

  const sortedMatchups = [...matchups].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const handleSort = (field: 'won' | 'opponent_won' | 'neither_won' | 'games_together') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (!commander) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  };

  const renderSymbols = (colors: string | null | undefined) => {
    const dummyCommander = new CommanderData('', 0, 0, 0, 0, [], []);
    dummyCommander.colorIdentity = colors || 'C';
    return (
      <span>
        {dummyCommander.colorIdentitySymbolUrls().map((url, i) => (
          <img key={i} src={url} alt="" aria-hidden="true" className="inline w-5 h-5 mr-0.5" />
        ))}
      </span>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
    >
      {/* Modal */}
      <div 
        className={`relative w-full h-[90vh] rounded-t-2xl overflow-hidden shadow-2xl pointer-events-auto ${
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
        }`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Purple header with back button only */}
        <div className="sticky top-0 z-10 p-4 bg-purple-600">
          <button
            onClick={handleClose}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            aria-label="Close"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-6 h-6 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(90vh-80px)] px-6 pb-6 pt-4">

          {/* Three-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left column - Commander info */}
            <div className="flex flex-col gap-3 md:col-span-1">
              <div className="flex items-center gap-2">
                {renderSymbols(commander.colorIdentity)}
              </div>
              <h2 className="font-semibold text-2xl" style={{ color: 'var(--text-primary)' }}>
                {formatPartners(commander.commander).split('\n').map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h2>
               <div className="flex flex-col gap-1" style={{ color: 'var(--text-secondary)' }}>
                 <p className="text-xl">{commander.games} games</p>
                 <p className="text-xl">{commander.wins} wins ({commander.winrate()}% win rate)</p>
                 <p className="text-md mt-2">
                   <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Players:</span> {commander.players?.join(', ')}
                 </p>
               </div>

               {/* Tier badge and performance delta */}
               <div className="flex flex-col gap-2 mt-3">
                 <div className="flex items-center gap-2">
                   <div
                     className="px-3 py-1 rounded-full font-bold text-white text-md"
                     style={{
                       backgroundColor:
                         commander.tier === 'S' ? '#d97706' :
                         commander.tier === 'A' ? '#a855f7' :
                         commander.tier === 'B' ? '#3b82f6' :
                         commander.tier === 'C' ? '#6b7280' :
                         '#9ca3af'
                     }}
                   >
                     {commander.tier ? `Tier ${commander.tier}` : 'Unranked'}
                   </div>
                   {commander.tier && commander.winrateDelta !== undefined && commander.winrateDelta !== 0 && (
                     <span
                       className="text-md font-semibold"
                       style={{
                         color: commander.winrateDelta > 0 ? '#4ade80' : '#f87171'
                       }}
                     >
                       {commander.winrateDelta > 0 ? '+' : ''}{commander.winrateDelta.toFixed(2)}%
                     </span>
                   )}
                 </div>
               </div>

              {/* External links */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
                <a
                  href={getEDHRecUrl(commander.commander)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 bg-black text-white border-2 border-black hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-200 text-base font-medium"
                >
                  <img src="https://edhrec.com/favicon.ico" alt="" className="w-6 h-6" />
                  <span className="text-center">See decks in EDHRec</span>
                </a>
                {scryfallData.map((card, i) => (
                  <a
                    key={i}
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 bg-purple-500 text-white border-2 border-purple-500 hover:bg-purple-600 hover:text-white rounded-lg transition-all duration-200 text-base font-medium"
                  >
                    <img src="/cmd_results/scryfall-icon.svg" alt="" className="w-6 h-6" />
                    <span className="text-center">{card.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Center column - Card image */}
            <div className="flex items-start justify-center md:col-span-2">
              <div className="relative w-full max-w-sm h-auto overflow-hidden">
                {commander.imageUris && commander.imageUris.length > 0 && (
                  commander.imageUris.length === 1 ? (
                    <img
                      src={commander.imageUris[0]}
                      alt={commander.commander}
                      className="w-full rounded-lg object-contain"
                    />
                  ) : (
                    <div className="relative w-full" style={{ paddingBottom: '140%' }}>
                      <img
                        src={commander.imageUris[0]}
                        alt={commander.commander}
                        className="absolute top-0 left-0 w-4/5 rounded-lg z-0 hover:z-10 transition-all duration-200 object-contain"
                      />
                      <img
                        src={commander.imageUris[1]}
                        alt={commander.commander}
                        className="absolute top-8 left-12 w-4/5 rounded-lg z-0 hover:z-10 transition-all duration-200 object-contain"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Right column - Matchups */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-start mb-3 gap-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Matchups
                </h3>
                {!matchupsLoading && matchups.length > 0 && (
                  <button
                    onClick={handleResetSort}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    title="Reset to default sorting"
                  >
                    Reset sort
                  </button>
                )}
              </div>
              
              {matchupsLoading ? (
                <Spinner className="py-8" />
              ) : matchups.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No games played for this commander</p>
              ) : (
                <>
                  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="px-2 py-2 text-left w-[60%]" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Opponent</th>
                          <th
                            aria-sort={sortField === 'won' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            <button
                              type="button"
                              onClick={() => handleSort('won')}
                              className="w-full px-2 py-2 text-center hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <div className="flex items-center justify-center">
                                <span>Won</span>
                                {sortField === 'won' && (
                                  <span className="ml-1">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                                )}
                              </div>
                            </button>
                          </th>
                          <th
                            aria-sort={sortField === 'opponent_won' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            <button
                              type="button"
                              onClick={() => handleSort('opponent_won')}
                              className="w-full px-2 py-2 text-center hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <div className="flex items-center justify-center">
                                <span>They Won</span>
                                {sortField === 'opponent_won' && (
                                  <span className="ml-1">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                                )}
                              </div>
                            </button>
                          </th>
                          <th
                            aria-sort={sortField === 'neither_won' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            <button
                              type="button"
                              onClick={() => handleSort('neither_won')}
                              className="w-full px-2 py-2 text-center hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <div className="flex items-center justify-center">
                                <span>Neither</span>
                                {sortField === 'neither_won' && (
                                  <span className="ml-1">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                                )}
                              </div>
                            </button>
                          </th>
                          <th
                            aria-sort={sortField === 'games_together' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            <button
                              type="button"
                              onClick={() => handleSort('games_together')}
                              className="w-full px-2 py-2 text-center hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <div className="flex items-center justify-center">
                                <span>Together</span>
                                {sortField === 'games_together' && (
                                  <span className="ml-1">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                                )}
                              </div>
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMatchups
                          .slice(matchupsPage * MATCHUPS_PER_PAGE, (matchupsPage + 1) * MATCHUPS_PER_PAGE)
                          .map((m) => (
                            <tr key={m.opponent} className="border-t border-gray-700">
                              <td className="px-2 py-2 w-[60%]" style={{ color: 'var(--text-primary)' }}>{m.opponent}</td>
                              <td className="px-2 py-2 text-center text-green-400">{m.won}</td>
                              <td className="px-2 py-2 text-center text-red-400">{m.opponent_won}</td>
                              <td className="px-2 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{m.neither_won}</td>
                              <td className="px-2 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>{m.games_together}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {matchups.length > MATCHUPS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => setMatchupsPage(p => p - 1)}
                        disabled={matchupsPage === 0}
                        className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Page {matchupsPage + 1} of {Math.ceil(matchups.length / MATCHUPS_PER_PAGE)}
                      </span>
                      <button
                        onClick={() => setMatchupsPage(p => p + 1)}
                        disabled={(matchupsPage + 1) * MATCHUPS_PER_PAGE >= matchups.length}
                        className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Game History section */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Game History</h2>
            <GamesTimeline gameDates={commander.gameDates} />
          </div>
        </div>
      </div>
    </div>
  );
}
