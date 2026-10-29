import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SettingField from "./SettingField";

export default function BlockDetailsTab({ block, onChange }) {
  return (
    <Card>
      <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
        <SettingField label="Code">
          <Input
            required
            maxLength={12}
            value={block.code}
            onChange={(event) =>
              onChange("code", event.target.value.toUpperCase())
            }
          />
        </SettingField>
        <SettingField label="Name">
          <Input
            required
            maxLength={120}
            value={block.name}
            onChange={(event) => onChange("name", event.target.value)}
          />
        </SettingField>
        <SettingField label="Tagline">
          <Input
            maxLength={200}
            value={block.tagline || ""}
            onChange={(event) => onChange("tagline", event.target.value)}
          />
        </SettingField>
        <SettingField label="Floor">
          <Input
            type="number"
            min="1"
            max="10"
            value={block.floor}
            onChange={(event) => onChange("floor", Number(event.target.value))}
          />
        </SettingField>
        <div className="flex items-center gap-3">
          <Switch
            checked={block.isPublished}
            onCheckedChange={(value) => onChange("isPublished", value)}
            aria-label="Published"
          />
          <Label>Published</Label>
        </div>
      </CardContent>
    </Card>
  );
}
