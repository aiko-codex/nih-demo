import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ListFallback({ blocks, onSelectBlock }) {
  const floors = useMemo(() => Array.from({ length: 10 }, (_, index) => 10 - index), []);
  return <div className="h-full overflow-y-auto px-4 pb-24 pt-5 sm:px-8"><div className="mx-auto max-w-3xl space-y-8">{floors.map((floor) => {
    const floorBlocks = blocks.filter((block) => Number(block.floor) === floor);
    return <section key={floor}><h2 className="mb-3 font-display text-3xl">Floor {floor}</h2><div className="grid gap-3 sm:grid-cols-2">{floorBlocks.length ? floorBlocks.map((block) => <button key={block.code} className="text-left" onClick={() => onSelectBlock(block.code)}><Card className="h-full hover:border-primary"><CardContent className="space-y-1 p-4"><span className="font-mono text-xs text-muted-foreground">{block.code}</span><h3 className="font-display text-xl">{block.name}</h3><p className="text-sm text-muted-foreground">{block.tagline}</p>{block.isLit && <p className="pt-1 text-xs">Lit by {block.donorCount} {block.donorCount === 1 ? "person" : "people"}</p>}</CardContent></Card></button>) : <p className="text-sm text-muted-foreground">No windows listed.</p>}</div></section>;
  })}</div></div>;
}
