import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function FloorBlocksPanel({ floor, blocks, onSelectBlock }) {
  return <section className="space-y-4 py-4"><p className="text-sm text-muted-foreground">Floor {floor}</p><h2 className="font-display text-4xl">Floor {floor}</h2>
    {blocks.length ? blocks.map((block) => <button key={block.code} className="block w-full text-left" onClick={() => onSelectBlock(block.code)}><Card className="transition-colors hover:border-primary"><CardContent className="space-y-2 p-4"><div className="flex items-start justify-between gap-3"><span className="font-mono text-sm text-muted-foreground">{block.code}</span>{block.isLit && <Badge variant="secondary">Lit by {block.donorCount} {block.donorCount === 1 ? "person" : "people"}</Badge>}</div><h3 className="font-display text-2xl">{block.name}</h3>{block.tagline && <p className="text-sm text-muted-foreground">{block.tagline}</p>}</CardContent></Card></button>) : <p className="rounded-xl border p-5 text-sm text-muted-foreground">No windows listed on this floor yet.</p>}
  </section>;
}
