import { Card, CardContent } from "@/components/ui/card";
import SlotPicker from "./SlotPicker";

export default function BlockPositionTab({
  block,
  blocks,
  currentId,
  onChange,
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <SlotPicker
          blocks={blocks}
          currentId={currentId}
          slotKey={block.slotKey}
          onChange={(slotKey) => onChange({ slotKey })}
        />
      </CardContent>
    </Card>
  );
}
