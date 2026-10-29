import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SettingField from "./SettingField";

const faces = ["Left", "Front", "Right"];

export default function WindowSettingsCard({ settings, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Window columns per floor</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {faces.map((face) => {
          const key = `windows${face}`;
          return (
            <SettingField key={key} label={`${face} face`}>
              <Input
                type="number"
                min="1"
                value={settings[key]}
                onChange={(event) => onChange(key, Number(event.target.value))}
              />
            </SettingField>
          );
        })}
      </CardContent>
    </Card>
  );
}
