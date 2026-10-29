import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlock, useBlocks, useSaveBlock, useSettings } from "./useAdmin";
import BlockDetailsTab from "./BlockDetailsTab";
import BlockPositionTab from "./BlockPositionTab";
import BlockStoryTab from "./BlockStoryTab";
import BlockMediaTab from "./BlockMediaTab";

export default function BlockEditPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { data: fetched, isLoading } = useBlock(isNew ? null : id);
  const { data: blockData } = useBlocks();
  const { data: settings = {} } = useSettings();
  const save = useSaveBlock();
  const queryClient = useQueryClient();
  const nav = useNavigate();
  const block = fetched?.block || fetched;
  const all = Array.isArray(blockData) ? blockData : blockData?.blocks || [];
  const [form, setForm] = useState({
    code: "",
    name: "",
    tagline: "",
    floor: 1,
    face: "front",
    windowStart: 0,
    windowSpan: 1,
    isPublished: false,
    storyHtml: "",
  });
  useEffect(() => {
    if (block)
      setForm({
        ...block,
        floor: Number(block.floor),
        windowStart: Number(block.windowStart || 0),
        windowSpan: Number(block.windowSpan || 1),
        isPublished: Boolean(block.isPublished),
      });
  }, [fetched]);
  function set(key, value) {
    setForm((currentBlock) => ({ ...currentBlock, [key]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    try {
      const result = await save.mutateAsync({
        ...(isNew ? {} : { id }),
        code: form.code,
        name: form.name,
        tagline: form.tagline,
        floor: form.floor,
        face: form.face,
        windowStart: form.windowStart,
        windowSpan: form.windowSpan,
        storyHtml: form.storyHtml,
        sortOrder: form.sortOrder ?? 0,
        isPublished: form.isPublished,
      });
      toast.success("Block saved");
      nav(`/crm/blocks/${result?.id || id || ""}`);
    } catch (err) {
      toast.error(err.message || "Could not save block");
    }
  }
  if (!isNew && isLoading) return <main className="p-7">Loading block…</main>;
  return (
    <main className="space-y-5 p-4 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button asChild variant="link" className="px-0">
            <Link to="/crm/blocks">← Blocks</Link>
          </Button>
          <h1 className="font-display text-4xl">
            {isNew ? "New block" : `Edit ${block?.code || "block"}`}
          </h1>
        </div>
        <Button form="block-form" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save block"}
        </Button>
      </div>
      <form id="block-form" onSubmit={submit}>
        <Tabs defaultValue="details">
          <TabsList className="mb-4 flex h-auto flex-wrap">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <BlockDetailsTab block={form} onChange={set} />
          </TabsContent>
          <TabsContent value="position">
            <BlockPositionTab
              block={form}
              settings={settings}
              blocks={all}
              currentId={id}
              onChange={(changes) =>
                setForm((currentBlock) => ({ ...currentBlock, ...changes }))
              }
            />
          </TabsContent>
          <TabsContent value="story">
            <BlockStoryTab
              value={form.storyHtml}
              onChange={(value) => set("storyHtml", value)}
            />
          </TabsContent>
          <TabsContent value="media">
            {isNew ? (
              <p className="rounded-lg border p-5 text-muted-foreground">
                Save the block before adding media.
              </p>
            ) : (
              <BlockMediaTab
                blockId={id}
                media={form.media || []}
                isNew={isNew}
                onUpdated={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["admin", "blocks", id],
                  })
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </form>
    </main>
  );
}
