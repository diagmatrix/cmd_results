interface GameDate {
  date: string;
  games: number;
  wins: number;
}

interface GamesTimelineProps {
  gameDates: GameDate[];
}

export function GamesTimeline({ gameDates }: GamesTimelineProps) {
  if (!gameDates || gameDates.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
        No game dates recorded
      </div>
    );
  }

  // Sort game dates by date (oldest first)
  const sortedDates = [...gameDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get result info for each game date
  const getResultInfo = (games: number, wins: number) => {
    if (wins === games) return { color: '#22c55e', label: 'W' };      // All wins
    if (wins === 0) return { color: '#ef4444', label: 'L' };           // All losses
    return { color: '#f59e0b', label: 'W/L' };                         // Mixed
  };

  return (
    <div className="w-full">
      {/* Container for horizontal line and ball columns */}
      <div className="relative">
        {/* Horizontal line - positioned to pass through center of balls */}
        <div
          className="absolute left-0 right-0 h-0.5"
          style={{
            backgroundColor: '#a855f7',
            top: '50%'
          }}
        />

        {/* Ball columns container - flexbox for horizontal distribution */}
        <div className={`flex ${sortedDates.length === 1 ? 'justify-center' : 'justify-between'} px-[5%]`}>
          {sortedDates.map((gameDate, i) => {
            const resultInfo = getResultInfo(gameDate.games, gameDate.wins);
            const size = Math.max(24, Math.min(44, 20 + gameDate.games * 4));

            return (
              <div
                key={i}
                className="flex flex-col items-center z-0"
              >
                {/* Date label above */}
                <div
                  className="text-xs mb-2 text-center whitespace-nowrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {new Date(gameDate.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>

                {/* Game ball */}
                <div
                  className="rounded-full flex items-center justify-center border-2 shadow-sm"
                  style={{
                    width: size,
                    height: size,
                    borderColor: resultInfo.color,
                    backgroundColor: resultInfo.color
                  }}
                >
                  <span className="text-white text-sm font-bold">{gameDate.games}</span>
                </div>

                {/* Result label below - semi-transparent background with colored text */}
                <div className="text-xs mt-2">
                  <span
                    className="px-2.5 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: resultInfo.color + '20', // Add 20 for 12.5% opacity
                      color: resultInfo.color
                    }}
                  >
                    {resultInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}