import { useState } from 'react';
import { CommanderData } from '../lib/model';
import { formatPartners } from '../lib/utils';
import { GamesTimeline } from './GamesTimeline';

interface CommanderModalProps {
  commander: CommanderData | null;
  onClose: () => void;
}

export function CommanderModal({ commander, onClose }: CommanderModalProps) {
  const [isClosing, setIsClosing] = useState(false);

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
        {/* Purple header with back button and commander info */}
        <div className="sticky top-0 z-10 p-4 bg-purple-600">
          <div className="flex items-center gap-4">
            {/* Close button */}
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

            {/* Commander info */}
            <div className="flex items-center flex-wrap gap-3 text-white flex-1">
              {renderSymbols(commander.colorIdentity)}
              <span className="font-semibold text-lg">
                {formatPartners(commander.commander).split('\n').map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </span>
              <span className="text-sm opacity-90">
                {commander.games} games · {commander.wins} wins ({commander.winrate()}%)
              </span>
              <span className="text-sm text-yellow-300">
                {commander.players?.length || 0} players: {commander.players?.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(90vh-80px)] px-6 pb-6 pt-4">

          <GamesTimeline gameDates={commander.gameDates} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="relative w-96 h-144 mx-auto overflow-hidden">
                {commander.imageUris && commander.imageUris.length > 0 && (
                  commander.imageUris.length === 1 ? (
                    <img
                      src={commander.imageUris[0]}
                      alt={commander.commander}
                      className="absolute top-0 left-0 w-82 rounded-lg z-0 object-contain"
                    />
                  ) : (
                    <>
                      <img
                        src={commander.imageUris[0]}
                        alt={commander.commander}
                        className="absolute top-0 left-0 w-72 rounded-lg z-0 hover:z-5 transition-all duration-200 object-contain"
                      />
                      <img
                        src={commander.imageUris[1]}
                        alt={commander.commander}
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
      </div>
    </div>
  );
}
