import { colorForSlot } from "@/features/building/stageView";

export default function BuildingSlot({ slot, block, focused, onSelect }) {
  const isLit = Boolean(block.lit ?? block.isLit);
  const stateLabel = isLit ? "sponsored" : "open for sponsorship";

  return (
    <button
      type="button"
      data-focused={focused || undefined}
      className={`building-slot group absolute ${isLit ? "building-slot-lit" : "building-slot-open"}`}
      style={{
        left: `${slot.x * 100}%`,
        top: `${slot.y * 100}%`,
        width: `${slot.w * 100}%`,
        height: `${slot.h * 100}%`,
        "--slot-color": colorForSlot(slot.key),
      }}
      aria-label={`${block.code}, ${block.name}, ${stateLabel}`}
      onClick={onSelect}
    >
      <span className="building-slot-tip">
        <span className="font-mono text-[10px] tracking-wider text-white/55">{block.code}</span>
        <span className="block text-[13px] font-medium text-white">{block.name}</span>
      </span>
    </button>
  );
}
