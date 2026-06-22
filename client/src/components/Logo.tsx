export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-[10px] grid place-items-center shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--color-accent)",
        boxShadow: "0 0 16px rgba(57,255,20,.4)",
      }}
    >
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="#000" strokeWidth="2.2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.6" fill="#000" />
      </svg>
    </div>
  );
}
