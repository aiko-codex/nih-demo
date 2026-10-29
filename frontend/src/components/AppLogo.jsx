function WindowMark() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.35" />
      <rect x="11" y="1" width="8" height="8" rx="1.5" fill="#ffc56b" />
      <rect x="1" y="11" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.35" />
      <rect x="11" y="11" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export default function AppLogo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <WindowMark />
      <span className="text-[15px] font-semibold tracking-tight">
        National India Hub
      </span>
    </span>
  );
}
