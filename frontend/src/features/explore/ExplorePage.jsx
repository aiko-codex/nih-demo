import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Search, List as ListIcon, X } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import ThemeToggle from "@/components/ThemeToggle";
import BuildingCanvas from "@/features/building/BuildingCanvas";
import { useBuilding } from "@/features/building/useBuilding";
import BlockPanel from "@/features/block/BlockPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import FloorBlocksPanel from "@/features/explore/FloorBlocksPanel";
import BlockSearch from "@/features/explore/BlockSearch";
import ListFallback from "@/features/explore/ListFallback";
import DonateDialog from "@/features/donate/DonateDialog";

function useWideScreen() {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

function FloorRail({ selectedFloor, onSelectFloor }) {
  return <nav aria-label="Floors" className="fixed right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col rounded-2xl border bg-card/95 p-1 shadow-lg sm:right-5">
    {Array.from({ length: 10 }, (_, index) => 10 - index).map((floor) => <Button key={floor} variant={Number(selectedFloor) === floor ? "default" : "ghost"} className="min-h-11 min-w-11 px-2" aria-label={`Floor ${floor}`} onClick={() => onSelectFloor(floor)}>{floor}</Button>)}
  </nav>;
}

function TopBar({ onSearch, onList, listMode }) {
  return <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 sm:px-6">
    <AppLogo />
    <div className="flex items-center gap-2">
      <Button variant="outline" className="min-h-11 gap-2" onClick={onSearch}><Search className="size-4" /><span className="hidden sm:inline">Search</span></Button>
      <Button variant="outline" className="min-h-11 gap-2" onClick={onList}><ListIcon className="size-4" /><span className="hidden sm:inline">{listMode ? "Building" : "List"}</span></Button>
      <ThemeToggle />
    </div>
  </header>;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { floor: routeFloor, code } = useParams();
  const building = useBuilding();
  const wide = useWideScreen();
  const [searchOpen, setSearchOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [listMode, setListMode] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const blocks = building.data?.blocks ?? [];
  const selectedBlock = blocks.find((block) => block.code.toLowerCase() === code?.toLowerCase());
  const activeFloor = routeFloor || selectedBlock?.floor;
  const panelOpen = Boolean(routeFloor || code);
  const faces = building.data?.faces ?? { left: 6, front: 12, right: 6 };
  const floorBlocks = useMemo(() => blocks.filter((block) => Number(block.floor) === Number(activeFloor)), [blocks, activeFloor]);
  const selectFloor = useCallback((floor) => navigate(`/f/${floor}`), [navigate]);
  const selectBlock = useCallback((blockCode) => navigate(`/b/${blockCode}`), [navigate]);
  const closePanel = () => navigate("/");

  const panel = code ? <BlockPanel code={code} block={selectedBlock} onDonate={() => setDonateOpen(true)} /> : routeFloor ? <FloorBlocksPanel floor={routeFloor} blocks={floorBlocks} onSelectBlock={selectBlock} /> : null;
  const listView = listMode || unsupported;

  return <main className="relative h-[100dvh] overflow-hidden bg-background">
    <TopBar onSearch={() => setSearchOpen(true)} onList={() => setListMode((value) => !value)} listMode={listMode} />
    <section className="absolute inset-0 pt-16" aria-label="Explore the National India Hub">
      {building.isPending ? <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 p-6"><Skeleton className="h-3/4 w-full" /><Skeleton className="h-20 w-full" /></div> : building.isError ? <div className="grid h-full place-items-center p-6"><div className="space-y-4 text-center"><p className="text-lg">The building could not load.</p><Button onClick={() => building.refetch()}>Try again</Button></div></div> : listView ? <ListFallback blocks={blocks} onSelectBlock={selectBlock} /> : <BuildingCanvas blocks={blocks} faces={faces} selectedFloor={activeFloor ? Number(activeFloor) : null} selectedBlockCode={code || null} onSelectFloor={selectFloor} onSelectBlock={selectBlock} onUnsupported={() => setUnsupported(true)} />}
      {!listView && <FloorRail selectedFloor={activeFloor} onSelectFloor={selectFloor} />}
      {!panelOpen && !listView && <div className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow">Tap a floor or a lit window</div>}
    </section>
    {panelOpen && panel && (wide ? <Sheet open onOpenChange={(open) => !open && closePanel()}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">{panel}</SheetContent></Sheet> : <Drawer open onOpenChange={(open) => !open && closePanel()} snapPoints={[0.35, 0.9]}><DrawerContent className="max-h-[90dvh] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">{panel}</DrawerContent></Drawer>)}
    {panelOpen && !panel && <Button variant="outline" className="fixed right-4 top-20 z-40" onClick={closePanel}><X className="size-4" />Close</Button>}
    <BlockSearch open={searchOpen} onOpenChange={setSearchOpen} blocks={blocks} onSelectBlock={selectBlock} />
    <DonateDialog open={donateOpen} onOpenChange={setDonateOpen} blockCode={code || ""} />
  </main>;
}
