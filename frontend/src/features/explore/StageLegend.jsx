import { Search } from "lucide-react";

function LegendDot({ lit }) {
  return lit ? (
    <span className="size-2 rounded-full bg-[#ffc56b] shadow-[0_0_10px_#ffc56b]" />
  ) : (
    <span className="size-2 rounded-[2px] ring-1 ring-[#ffd696]/60" />
  );
}

export default function StageLegend({ blocks, loading, failed, onRetry, onSearch }) {
  const litCount = blocks.filter((block) => block.lit ?? block.isLit).length;

  return (
    <div
      className="absolute bottom-5 left-4 z-30 flex items-center gap-2 sm:bottom-8 sm:left-8"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onSearch}
        aria-label="Find a window"
        className="glass-panel grid size-10 place-items-center rounded-full text-white/80
          transition-colors hover:text-white sm:hidden"
      >
        <Search className="size-4" />
      </button>
      <button
        type="button"
        onClick={onSearch}
        className="glass-panel hidden h-10 items-center gap-2.5 rounded-full pl-4 pr-5 text-sm
          text-white/80 transition-colors hover:text-white sm:inline-flex"
      >
        <Search className="size-4" />
        Find a window
      </button>
      <div className="glass-panel flex h-10 items-center gap-4 rounded-full px-4 text-xs text-white/70">
        {failed ? (
          <button type="button" onClick={onRetry} className="text-white hover:underline">
            Windows did not load. Retry
          </button>
        ) : (
          <>
            <span className="inline-flex items-center gap-2"><LegendDot /> Open</span>
            <span className="inline-flex items-center gap-2">
              <LegendDot lit /> {loading ? "Lit" : `${litCount} lit`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
