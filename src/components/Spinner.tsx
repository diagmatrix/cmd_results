interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div 
      className={`flex justify-center items-center ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <div className={`animate-spin rounded-full border-b-2 border-purple-400 ${sizeClasses[size]}`} />
      <span className="sr-only">Loading content</span>
    </div>
  );
}
