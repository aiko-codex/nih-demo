import MediaManager from "./MediaManager";

export default function BlockMediaTab({ blockId, media, isNew, onUpdated }) {
  if (isNew) {
    return (
      <p className="rounded-lg border p-5 text-muted-foreground">
        Save the block before adding media.
      </p>
    );
  }

  return <MediaManager blockId={blockId} media={media} onUpdated={onUpdated} />;
}
