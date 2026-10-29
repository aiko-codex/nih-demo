import { Card, CardContent } from "@/components/ui/card";
import WindowPicker from "./WindowPicker";

export default function BlockPositionTab({
  block,
  settings,
  blocks,
  currentId,
  onChange,
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <WindowPicker
          floor={block.floor}
          face={block.face}
          start={block.windowStart}
          span={block.windowSpan}
          windows={settings}
          blocks={blocks}
          currentId={currentId}
          onChange={onChange}
        />
        <p className="text-sm text-muted-foreground">
          Selected columns: {block.windowStart + 1}–
          {block.windowStart + block.windowSpan}
        </p>
      </CardContent>
    </Card>
  );
}
