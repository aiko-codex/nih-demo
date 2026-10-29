import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlock } from "@/features/block/useBlock";
import MediaGallery from "@/features/block/MediaGallery";
import SlotDetails from "@/features/block/SlotDetails";
import DonateDialog from "@/features/donate/DonateDialog";

function floorFromSlotKey(slotKey) {
  const row = Number(slotKey?.slice(1, 3));
  return row ? Math.ceil(row / 2) : null;
}

export default function SlotModal({ open, block, maxDonorsPerBlock, onOpenChange }) {
  const [donateOpen, setDonateOpen] = useState(false);
  const blockQuery = useBlock(block?.code);

  if (!block) return null;

  const details = blockQuery.data;
  const donorCount = Number(block.donorCount ?? details?.donors?.length ?? 0);
  const isFull = maxDonorsPerBlock > 0 && donorCount >= maxDonorsPerBlock;
  const floor = floorFromSlotKey(block.slotKey) ?? block.floor;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="dark left-0 top-0 flex h-dvh w-screen translate-x-0 translate-y-0 md:left-1/2 md:top-1/2
            md:-translate-x-1/2 md:-translate-y-1/2 max-w-none flex-col gap-0 overflow-hidden rounded-none border-0
            bg-[#0a0c13] p-0 text-foreground sm:max-w-none md:grid md:h-[min(86dvh,720px)]
            md:w-[min(94vw,1120px)] md:grid-cols-[1.35fr_1fr] md:rounded-3xl md:border md:border-white/10"
        >
          <DialogTitle className="sr-only">{block.name}</DialogTitle>
          <DialogDescription className="sr-only">Stories and sponsors for window {block.code}</DialogDescription>
          <section className="relative aspect-4/3 shrink-0 bg-black md:aspect-auto md:h-full">
            {blockQuery.isPending ? (
              <Skeleton className="size-full rounded-none" />
            ) : (
              <MediaGallery media={details?.media ?? []} />
            )}
          </section>
          <SlotDetails
            block={block}
            floor={floor}
            details={details}
            query={blockQuery}
            donorCount={donorCount}
            maxDonors={maxDonorsPerBlock}
            isFull={isFull}
            onDonate={() => setDonateOpen(true)}
          />
        </DialogContent>
      </Dialog>
      <DonateDialog open={donateOpen} onOpenChange={setDonateOpen} blockCode={block.code} />
    </>
  );
}
