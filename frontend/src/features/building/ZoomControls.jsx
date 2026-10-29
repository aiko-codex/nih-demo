import { Minus, Plus, Scan } from "lucide-react";
import { maximumScale, minimumScale } from "@/features/building/stageView";

function ControlButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center text-white/80 transition-colors hover:text-white
        disabled:text-white/25"
    >
      {children}
    </button>
  );
}

export default function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }) {
  return (
    <div
      className="glass-panel absolute bottom-5 right-4 z-30 flex flex-col divide-y divide-white/10
        rounded-full sm:bottom-8 sm:right-8"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ControlButton label="Zoom in" disabled={scale >= maximumScale} onClick={onZoomIn}>
        <Plus className="size-4" />
      </ControlButton>
      <ControlButton label="Zoom out" disabled={scale <= minimumScale} onClick={onZoomOut}>
        <Minus className="size-4" />
      </ControlButton>
      <ControlButton label="Reset view" onClick={onReset}>
        <Scan className="size-4" />
      </ControlButton>
    </div>
  );
}
