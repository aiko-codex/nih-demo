import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const faces = ["left", "front", "right"];
export default function WindowPicker({
  floor,
  face,
  start = 0,
  span = 1,
  windows = {},
  blocks = [],
  currentId,
  onChange,
}) {
  const faceSetting = `windows${face[0].toUpperCase()}${face.slice(1)}`;
  const width = Number(windows[faceSetting] || (face === "front" ? 12 : 6));
  const occupied = new Set();
  blocks
    .filter(
      (b) =>
        Number(b.floor) === Number(floor) &&
        b.face === face &&
        String(b.id) !== String(currentId),
    )
    .forEach((b) => {
      for (
        let i = Number(b.windowStart);
        i < Number(b.windowStart) + Number(b.windowSpan);
        i++
      )
        occupied.add(i);
    });
  function setFace(next) {
    onChange({ face: next, windowStart: 0, windowSpan: 1 });
  }
  function choose(windowIndex) {
    const first = start;
    if (span === 1) {
      onChange({ face, windowStart: windowIndex, windowSpan: 1 });
    } else if (windowIndex === first) {
      onChange({ face, windowStart: windowIndex, windowSpan: 1 });
    } else
      onChange({
        face,
        windowStart: Math.min(first, windowIndex),
        windowSpan: Math.abs(windowIndex - first) + 1,
      });
  }
  return (
    <Tabs value={face} onValueChange={setFace}>
      <TabsList>
        {faces.map((faceOption) => (
          <TabsTrigger key={faceOption} value={faceOption}>
            {faceOption}
          </TabsTrigger>
        ))}
      </TabsList>
      {faces.map((faceOption) => (
        <TabsContent key={faceOption} value={faceOption} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Floor {floor} · {faceOption} face · choose a start window, then an
            end window.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: width }, (_, i) => {
              const taken = faceOption === face && occupied.has(i);
              const selected =
                faceOption === face && i >= start && i < start + span;
              return (
                <Button
                  type="button"
                  key={i}
                  variant={selected ? "default" : "outline"}
                  disabled={taken}
                  onClick={() => choose(i)}
                  className={`min-h-11 ${taken ? "opacity-40" : ""}`}
                  aria-label={`Window ${i + 1}${taken ? ", in use" : ""}`}
                >
                  {i + 1}
                </Button>
              );
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
