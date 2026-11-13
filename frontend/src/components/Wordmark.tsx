interface WordmarkProps {
  tone?: 'dark' | 'light';
  className?: string;
}

// Text wordmark used until a Motherland logo exists.
export function Wordmark({ tone = 'dark', className = '' }: WordmarkProps) {
  return (
    <span
      className={`font-bold tracking-tight ${tone === 'dark' ? 'text-black' : 'text-white'} ${className}`}
    >
      Motherland
    </span>
  );
}
