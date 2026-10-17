export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {diagonal ? <path d="M5 19 19 5M5 5h14v14" /> : <path d="M4 12h16m-6-6 6 6-6 6" />}
    </svg>
  );
}

export function Wordmark() {
  return <span className="wordmark">slow<span>.</span></span>;
}

export function BeanMark({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="48" viewBox="0 0 40 48" fill="none" aria-hidden="true">
      <ellipse cx="20" cy="24" rx="15" ry="21" transform="rotate(28 20 24)" />
      <path d="M29 6c-21 8 2 26-18 36" />
    </svg>
  );
}
