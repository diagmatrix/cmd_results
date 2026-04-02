import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-8 py-6 text-center border-t" style={{ borderColor: 'var(--bg-tertiary)' }}>
      <div className="space-x-4">
        <Link 
          to="/changelog" 
          className="hover:text-purple-400 transition"
          style={{ color: 'var(--text-secondary)' }}
        >
          Changelog
        </Link>
      </div>
    </footer>
  );
}
