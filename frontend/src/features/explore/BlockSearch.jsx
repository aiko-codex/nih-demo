import { useMemo, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function BlockSearch({ open, onOpenChange, blocks, onSelectBlock }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? blocks.filter((block) => `${block.code} ${block.name}`.toLowerCase().includes(term)) : blocks;
  }, [blocks, query]);

  return <CommandDialog open={open} onOpenChange={onOpenChange}>
    <CommandInput value={query} onValueChange={setQuery} placeholder="Search by code or name" />
    <CommandList><CommandEmpty>No windows found.</CommandEmpty><CommandGroup heading="Windows">{results.map((block) => <CommandItem key={block.code} value={`${block.code} ${block.name}`} onSelect={() => { onSelectBlock(block.code); onOpenChange(false); }}><span className="font-mono">{block.code}</span><span className="ml-3">{block.name}</span></CommandItem>)}</CommandGroup></CommandList>
  </CommandDialog>;
}
