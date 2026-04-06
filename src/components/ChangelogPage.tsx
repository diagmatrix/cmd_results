import ReactMarkdown from 'react-markdown';
import changelogContent from '../../CHANGELOG.md?raw';

export default function ChangelogPage() {
  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div 
        className="prose prose-invert max-w-none"
        style={{ 
          color: 'var(--text-primary)',
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-purple-400">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: 'var(--text-primary)' }}>
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li style={{ color: 'var(--text-primary)' }}>
                {children}
              </li>
            ),
          }}
        >
          {changelogContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
