import { useCallback, useMemo, useState } from "react";
import BuildingCanvas from "@/features/building/BuildingCanvas";
import { mockBuilding } from "@/features/building/mockBuilding";
import { useTheme } from "@/components/ThemeProvider";

export default function DevBuildingPage() {
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedBlockCode, setSelectedBlockCode] = useState(null);
  const [unsupported, setUnsupported] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const blockOptions = useMemo(() => mockBuilding.blocks, []);

  const onUnsupported = useCallback(() => setUnsupported(true), []);
  const onSelectFloor = useCallback((floor) => {
    setSelectedFloor(floor);
    setSelectedBlockCode(null);
  }, []);
  const onSelectBlock = useCallback((code) => {
    const block = mockBuilding.blocks.find((item) => item.code === code);
    setSelectedBlockCode(code);
    if (block) setSelectedFloor(block.floor);
  }, []);

  return (
    <main className={`fixed inset-0 overflow-hidden ${isDark ? "bg-[#080b14] text-[#f3eee6]" : "bg-[#d9d4ca] text-[#14161f]"}`}>
      <BuildingCanvas
        blocks={mockBuilding.blocks}
        faces={mockBuilding.faces}
        selectedFloor={selectedFloor}
        selectedBlockCode={selectedBlockCode}
        onSelectFloor={onSelectFloor}
        onSelectBlock={onSelectBlock}
        onUnsupported={onUnsupported}
      />
      <header className="absolute left-3 right-3 top-3 z-10 flex flex-col items-stretch gap-2 sm:left-6 sm:right-6 sm:top-6 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className={`w-full rounded-xl border px-3 py-2 backdrop-blur-sm sm:w-auto ${isDark ? "border-white/10 bg-[#10131f]/90" : "border-black/10 bg-[#fffdf8]/90"}`}>
          <h1 className="font-display text-xl leading-tight sm:text-2xl">NIH · Building study</h1>
          <p className="text-xs opacity-70">10 floors · 240 windows · 4 lit blocks</p>
        </div>
        <div className={`grid w-full grid-cols-2 gap-2 rounded-xl border p-2 backdrop-blur-sm sm:flex sm:w-auto ${isDark ? "border-white/10 bg-[#10131f]/90" : "border-black/10 bg-[#fffdf8]/90"}`}>
          <label className="sr-only" htmlFor="floor-focus">Focus floor</label>
          <select
            id="floor-focus"
            className="h-10 w-full rounded-lg border border-current/15 bg-transparent px-2 text-sm sm:max-w-28"
            value={selectedFloor ?? ""}
            onChange={(event) => onSelectFloor(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">All floors</option>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((floor) => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="block-focus">Focus block</label>
          <select
            id="block-focus"
            className="h-10 w-full rounded-lg border border-current/15 bg-transparent px-2 text-sm sm:max-w-32"
            value={selectedBlockCode ?? ""}
            onChange={(event) => event.target.value ? onSelectBlock(event.target.value) : setSelectedBlockCode(null)}
          >
            <option value="">All blocks</option>
            {blockOptions.map((block) => (
              <option key={block.code} value={block.code}>{block.code} · {block.name}</option>
            ))}
          </select>
        </div>
      </header>
      <div className={`absolute bottom-4 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border px-4 py-2 text-center text-xs backdrop-blur-sm ${isDark ? "border-white/10 bg-[#10131f]/90" : "border-black/10 bg-[#fffdf8]/90"}`}>
        {unsupported ? "WebGL is unavailable in this browser." : "Tap a slab or window to focus · Double-click to reset"}
      </div>
    </main>
  );
}
