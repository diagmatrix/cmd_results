import { useState, useEffect } from 'react';
import { CommanderData, getScryfallURL } from '../lib/model';
import { formatPartners, getEDHRecUrl } from '../lib/utils';
import { fetchCard } from '../lib/supabase';
import { GamesTimeline } from './GamesTimeline';

interface CommanderModalProps {
  commander: CommanderData | null;
  onClose: () => void;
}

export function CommanderModal({ commander, onClose }: CommanderModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [scryfallData, setScryfallData] = useState<{name: string; url: string}[]>([]);

  useEffect(() => {
    async function loadScryfallData() {
      if (commander?.cardIds && commander.cardIds.length > 0) {
        const data = await Promise.all(
          commander.cardIds.map(async (id) => {
            const card = await fetchCard(id);
            return {
              name: (card as any)?.name || 'Unknown Card',
              url: getScryfallURL(card)
            };
          })
        );
        setScryfallData(data);
      }
    }
    loadScryfallData();
  }, [commander?.cardIds]);

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
                <p className="text-lg">{commander.games} games</p>
                <p className="text-lg">{commander.wins} wins ({commander.winrate()}%)</p>
                <p className="text-sm mt-2">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Players:</span> {commander.players?.join(', ')}
                </p>
              </div>

              {/* External links */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
                <a
                  href={getEDHRecUrl(commander.commander)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-all duration-200 text-base font-medium"
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
                    className="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-all duration-200 text-base font-medium"
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

            {/* Right column - Matchups placeholder */}
            <div className="flex flex-col items-center justify-center md:col-span-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              <p style={{ color: 'var(--text-secondary)' }}>Matchups coming in the future</p>
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
