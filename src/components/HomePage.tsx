import { useState } from 'react';
import { StatsDisplay } from './StatsDisplay';
import { GameForm } from './GameForm';
import { GamesList } from './GamesList';

interface HomePageProps {
  isDark?: boolean;
}

export default function HomePage({ isDark = true }: HomePageProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGameSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Commander Game Tracker</h1>
      
      <StatsDisplay isDark={isDark} refreshTrigger={refreshTrigger} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl font-semibold mb-4">Add Game</h2>
          <GameForm isDark={isDark} onSuccess={handleGameSuccess} />
        </div>
        
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
          <GamesList limit={10} isDark={isDark} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
