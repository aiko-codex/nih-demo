import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  useDeleteMedia,
  useEmbedMedia,
  useReorderMedia,
  useSetCover,
  useUpdateMedia,
  useUploadMedia,
} from "./useAdmin";

export default function MediaManager({ blockId, media = [], onUpdated }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState("");
  const upload = useUploadMedia();
  const embed = useEmbedMedia();
  const update = useUpdateMedia();
  const remove = useDeleteMedia();
  const reorder = useReorderMedia();
  const cover = useSetCover();
  async function uploadFiles(files) {
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        await upload.mutateAsync({
          id: blockId,
          formData: fd,
          onProgress: setProgress,
        });
      } catch (error) {
        toast.error(error.message);
      }
    }
    onUpdated();
    setProgress(0);
  }
  async function embedUrl() {
    if (!url.trim()) return;
    try {
      await embed.mutateAsync({ id: blockId, embedUrl: url.trim() });
      setUrl("");
      onUpdated();
      toast.success("Embed added");
    } catch (error) {
      toast.error(error.message);
    }
  }
  async function move(index, direction) {
    const next = [...media];
    const to = index + direction;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    try {
      await reorder.mutateAsync({ blockId, ids: next.map((m) => m.id) });
      onUpdated();
    } catch (error) {
      toast.error(error.message);
    }
  }
  return (
    <div className="space-y-5">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          uploadFiles([...event.dataTransfer.files]);
        }}
        className="cursor-pointer rounded-xl border border-dashed p-8 text-center"
        onClick={() => input.current?.click()}
      >
        <ImagePlus className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p>Drop media here or choose files</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images up to 8 MB; videos up to 60 MB
        </p>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(event) => uploadFiles([...event.target.files])}
        />
        {upload.isPending && <Progress value={progress} className="mt-4" />}
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="YouTube or Vimeo URL"
        />
        <Button
          type="button"
          variant="outline"
          onClick={embedUrl}
          disabled={embed.isPending}
        >
          Add embed
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((m, i) => (
          <Card key={m.id}>
            <CardContent className="space-y-3 p-3">
              {m.url && m.kind === "image" ? (
                <img
                  src={m.url}
                  alt={m.caption || "Block media"}
                  className="aspect-video w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                  {m.kind === "embed" ? "Video embed" : m.kind}
                </div>
              )}
              <Input
                aria-label="Caption"
                defaultValue={m.caption || ""}
                onBlur={(event) =>
                  update.mutate(
                    { id: m.id, blockId, caption: event.target.value },
                    {
                      onSuccess: onUpdated,
                      onError: (err) => toast.error(err.message),
                    },
                  )
                }
                placeholder="Caption"
              />
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Set cover"
                  onClick={() =>
                    cover.mutate(
                      { blockId, mediaId: m.id },
                      {
                        onSuccess: onUpdated,
                        onError: (error) => toast.error(error.message),
                      },
                    )
                  }
                >
                  <Star className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move up"
                  disabled={!i}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move down"
                  disabled={i === media.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Delete media"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this media?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This item will be removed from the block.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          remove.mutate(
                            { id: m.id, blockId },
                            {
                              onSuccess: onUpdated,
                              onError: (error) => toast.error(error.message),
                            },
                          )
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
