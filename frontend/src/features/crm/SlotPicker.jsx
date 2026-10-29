import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

async function getSlotManifest() {
  const response = await fetch(
    `${import.meta.env.BASE_URL}building/slots.json`,
  );
  if (!response.ok) {
    throw new Error("Could not load building slots.");
  }
  return response.json();
}

export default function SlotPicker({
  blocks = [],
  currentId,
  slotKey,
  onChange,
}) {
  const slotsQuery = useQuery({
    queryKey: ["building-slot-manifest"],
    queryFn: getSlotManifest,
    staleTime: Infinity,
  });
  const slots = slotsQuery.data?.slots || [];
  const takenSlots = new Set(
    blocks
      .filter((block) => String(block.id) !== String(currentId))
      .map((block) => block.slotKey)
      .filter(Boolean),
  );

  if (slotsQuery.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading building slots…</p>
    );
  }
  if (slotsQuery.error) {
    return (
      <p className="text-sm text-destructive">{slotsQuery.error.message}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-xl border bg-card">
        <img
          src={`${import.meta.env.BASE_URL}building/night.jpg`}
          alt="National India Hub building"
          className="absolute inset-0 size-full object-fill"
        />
        {slots.map((slot) => {
          const selected = slot.key === slotKey;
          const taken = takenSlots.has(slot.key);

          return (
            <button
              key={slot.key}
              type="button"
              title={`${slot.key}${taken ? " · assigned" : ""}`}
              aria-label={`${slot.key}${taken ? " · assigned to another block" : ""}`}
              aria-pressed={selected}
              disabled={taken}
              onClick={() => onChange(slot.key)}
              className={[
                "absolute border transition-colors focus-visible:z-10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "z-[1] border-primary bg-primary/75"
                  : taken
                    ? "cursor-not-allowed border-border/40 bg-background/60 opacity-45"
                    : "border-transparent bg-transparent hover:border-primary hover:bg-primary/30",
              ].join(" ")}
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: `${slot.w * 100}%`,
                height: `${slot.h * 100}%`,
              }}
            />
          );
        })}
      </div>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <p className="text-sm" aria-live="polite">
          {slotKey ? (
            <>
              Selected slot: <span className="font-mono">{slotKey}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No slot selected</span>
          )}
        </p>
        {slotKey && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(null)}
          >
            Clear slot
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose an available outline on the building image.
      </p>
    </div>
  );
}
