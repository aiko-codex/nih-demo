import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import SiteNav from "@/components/SiteNav";
import { apiGet } from "@/lib/api";
import BuildingStage from "@/features/building/BuildingStage";
import SlotModal from "@/features/block/SlotModal";
import BlockSearch from "@/features/explore/BlockSearch";
import StageLegend from "@/features/explore/StageLegend";

export default function ExplorePage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const stageRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const buildingQuery = useQuery({ queryKey: ["building"], queryFn: () => apiGet("/building") });
  const settingsQuery = useQuery({ queryKey: ["public-settings"], queryFn: () => apiGet("/settings/public") });
  const blocks = buildingQuery.data?.blocks ?? [];
  const selectedBlock = blocks.find((block) => block.code.toLowerCase() === code?.toLowerCase());
  const maxDonorsPerBlock = Number(settingsQuery.data?.maxDonorsPerBlock ?? 1);

  const closeBlock = useCallback(() => {
    stageRef.current?.resetZoom();
    navigate("/");
  }, [navigate]);

  const openBlockByCode = useCallback(async (blockCode) => {
    const block = blocks.find((candidate) => candidate.code.toLowerCase() === blockCode.toLowerCase());
    if (!block) return;
    if (block.slotKey) await stageRef.current?.zoomToSlot(block.slotKey);
    navigate(`/b/${block.code}`);
  }, [blocks, navigate]);

  return (
    <main className="dark fixed inset-0 overflow-hidden bg-[#05060b] text-white">
      <SiteNav />
      <BuildingStage
        ref={stageRef}
        blocks={blocks}
        onSelectBlock={(block) => navigate(`/b/${block.code}`)}
      />
      <div className="stage-vignette pointer-events-none absolute inset-0 z-10" />
      <StageLegend
        blocks={blocks}
        loading={buildingQuery.isPending}
        failed={buildingQuery.isError}
        onRetry={() => buildingQuery.refetch()}
        onSearch={() => setSearchOpen(true)}
      />
      <BlockSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        blocks={blocks}
        onSelectBlock={(blockCode) => {
          setSearchOpen(false);
          openBlockByCode(blockCode);
        }}
      />
      <SlotModal
        open={Boolean(code && selectedBlock)}
        block={selectedBlock}
        maxDonorsPerBlock={maxDonorsPerBlock}
        onOpenChange={(open) => !open && closeBlock()}
      />
    </main>
  );
}
