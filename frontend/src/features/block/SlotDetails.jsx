import { Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StoryBody from "@/features/block/StoryBody";
import DonorList from "@/features/block/DonorList";

function MetaRow({ block, floor, isFull }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-white/70">{block.code}</span>
      {floor && <span className="rounded-full border border-white/12 px-2.5 py-1 text-white/70">Floor {floor}</span>}
      <span
        className={`rounded-full px-2.5 py-1 ${
          isFull ? "bg-primary/15 text-primary" : "border border-white/12 text-white/70"
        }`}
      >
        {isFull ? "Sponsored" : "Open"}
      </span>
    </div>
  );
}

function DonateFooter({ isFull, onDonate }) {
  if (isFull) {
    return (
      <p className="rounded-2xl border border-white/10 px-4 py-3.5 text-center text-sm text-muted-foreground">
        This window is lit. Explore another one on the building.
      </p>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={onDonate}
        className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground
          transition-[filter] hover:brightness-110"
      >
        Light this window
      </button>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="size-3" /> Secure payment · Stripe (USD) or Razorpay (INR)
      </p>
    </>
  );
}

export default function SlotDetails({ block, floor, details, query, donorCount, maxDonors, isFull, onDonate }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col md:h-full">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6 md:px-9 md:pt-10">
        <MetaRow block={block} floor={floor} isFull={isFull} />
        <h2 className="mt-5 text-4xl leading-[1.05] md:text-5xl">{block.name}</h2>
        {block.tagline && <p className="mt-3 text-[15px] text-muted-foreground">{block.tagline}</p>}

        <div className="my-7 h-px bg-white/10" />

        {query.isError ? (
          <button type="button" onClick={() => query.refetch()} className="text-sm text-primary hover:underline">
            The story could not load. Try again
          </button>
        ) : query.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <p className="eyebrow">The story</p>
            <div className="mt-3 text-[15px] leading-7 text-white/80">
              <StoryBody html={details?.storyHtml} />
            </div>
            <div className="mt-9 flex items-baseline justify-between">
              <p className="eyebrow">Sponsors</p>
              <span className="font-mono text-xs text-muted-foreground">
                {donorCount} / {maxDonors || 1}
              </span>
            </div>
            <div className="mt-2">
              <DonorList donors={details?.donors ?? []} />
            </div>
          </>
        )}
      </div>
      <div className="border-t border-white/10 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 md:px-9 md:pb-7">
        <DonateFooter isFull={isFull} onDonate={onDonate} />
      </div>
    </section>
  );
}
