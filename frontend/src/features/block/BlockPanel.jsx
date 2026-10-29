import { useBlock } from "@/features/block/useBlock";
import MediaGallery from "@/features/block/MediaGallery";
import StoryBody from "@/features/block/StoryBody";
import DonorList from "@/features/block/DonorList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlockPanel({ code, block, onDonate }) {
  const query = useBlock(code);
  const data = query.data;
  if (query.isPending) return <div className="space-y-4 py-5"><Skeleton className="h-56 w-full" /><Skeleton className="h-10 w-2/3" /><Skeleton className="h-32 w-full" /></div>;
  if (query.isError) return <div className="space-y-4 py-8"><p>This window could not load.</p><Button onClick={() => query.refetch()}>Try again</Button></div>;
  return <article className="space-y-6 py-5 pb-24">
    <MediaGallery media={data.media} />
    <header className="space-y-2"><div className="flex items-center gap-3"><span className="font-mono text-sm text-muted-foreground">{data.code}</span>{data.isLit && <Badge variant="secondary">Lit by {block?.donorCount ?? data.donors?.length ?? 0} {(block?.donorCount ?? data.donors?.length) === 1 ? "person" : "people"}</Badge>}</div><h1 className="font-display text-4xl">{data.name}</h1>{data.tagline && <p className="text-muted-foreground">{data.tagline}</p>}</header>
    <StoryBody html={data.storyHtml} />
    <section className="space-y-3"><h2 className="font-display text-2xl">People lighting this window</h2><DonorList donors={data.donors} /></section>
    <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:sticky lg:bottom-0 lg:-mx-6 lg:mt-8"><Button className="min-h-12 w-full" disabled={data.isClosed} onClick={onDonate}>{data.isClosed ? "Fully lit" : "Light this window"}</Button></div>
  </article>;
}
