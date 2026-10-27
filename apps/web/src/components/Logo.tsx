export function Lotua({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8c-3 6-3 12 0 18 3-6 3-12 0-18z" fill="#C48B9F" opacity="0.9" />
      <path d="M32 26c-6-3-12-3-18 0 6 3 12 3 18 0z" fill="#C48B9F" opacity="0.75" />
      <path d="M32 26c6-3 12-3 18 0-6 3-12 3-18 0z" fill="#C48B9F" opacity="0.75" />
      <path d="M32 26c-4 5-4 11 0 16 4-5 4-11 0-16z" fill="#9E5F70" opacity="0.85" />
      <path d="M30 42c-2 4-2 8 0 12 1-4 1-8 0-12z" fill="#9E5F70" />
      <circle cx="40" cy="14" r="2" fill="#C48B9F" />
      <circle cx="45" cy="20" r="1.2" fill="#C48B9F" opacity="0.7" />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <Lotua className={compact ? 'w-8 h-8' : 'w-11 h-11'} />
      <div className="leading-none">
        <div className={`font-extrabold tracking-wide ${compact ? 'text-lg' : 'text-2xl'}`}>
          <span className="text-mauve">COSMETIA</span>
        </div>
        <div className={`font-extrabold tracking-wide -mt-0.5 ${compact ? 'text-lg' : 'text-2xl'}`}>
          <span className="text-garnet">BELLEZA</span>
        </div>
        {!compact && (
          <div className="text-[10px] text-garnet/70 font-medium mt-0.5">Tu cosme está aquí!</div>
        )}
      </div>
    </div>
  );
}
