import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Spinner } from './components/Spinner';

const HomePage = lazy(() => import('./components/HomePage'));
const GamesPage = lazy(() => import('./components/GamesPage'));
const CommanderPage = lazy(() => import('./components/CommandersPage'));
const PlayersPage = lazy(() => import('./components/PlayersPage'));
const StatsPage = lazy(() => import('./components/StatsPage'));
const ChangelogPage = lazy(() => import('./components/ChangelogPage'));

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="main-content" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar 
        isDark={isDark} 
        onToggleTheme={() => setIsDark(!isDark)} 
      />
      <Suspense fallback={<Spinner className="py-8" />}>
        <Routes>
          <Route path="/" element={<HomePage isDark={isDark} />} />
          <Route path="/games" element={
            <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
              <h1 className="text-3xl font-bold mb-6 text-center">Games</h1>
              <GamesPage isDark={isDark} />
            </div>
          } />
          <Route path="/commanders" element={
            <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
              <h1 className="text-3xl font-bold mb-6 text-center">Commanders</h1>
              <CommanderPage isDark={isDark} />
            </div>
          } />
          <Route path="/players" element={
            <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
              <h1 className="text-3xl font-bold mb-6 text-center">Players</h1>
              <PlayersPage />
            </div>
          } />
          <Route path="/stats" element={
            <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
              <h1 className="text-3xl font-bold mb-6 text-center">Stats</h1>
              <StatsPage />
            </div>
          } />
          <Route path="/changelog" element={
            <div className="max-w-[95%] mx-auto pd-1 md:pd-2 lg:pd-4">
              <h1 className="text-3xl font-bold mb-6 text-center">Changelog</h1>
              <ChangelogPage />
            </div>
          } />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}

export default App;
