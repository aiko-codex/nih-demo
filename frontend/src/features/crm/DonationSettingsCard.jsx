import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import SettingField from "./SettingField";

export default function DonationSettingsCard({ settings, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Donation mode</Label>
          <RadioGroup
            value={settings.donationMode}
            onValueChange={(value) => onChange("donationMode", value)}
            className="flex flex-wrap gap-5"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="multiple" id="mode-multiple" />
              <Label htmlFor="mode-multiple">
                Multiple donations per block
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="single" id="mode-single" />
              <Label htmlFor="mode-single">One donation per block</Label>
            </div>
          </RadioGroup>
        </div>
        <SettingSwitch
          label="Show donor email publicly"
          checked={settings.showDonorEmail}
          onChange={(value) => onChange("showDonorEmail", value)}
        />
        <div className="max-w-xs">
          <SettingField label="Max donors per block">
            <Input
              type="number"
              min="1"
              value={settings.maxDonorsPerBlock ?? 1}
              onChange={(event) =>
                onChange(
                  "maxDonorsPerBlock",
                  Math.max(1, Number(event.target.value)),
                )
              }
            />
          </SettingField>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Switch
            checked={settings.gstEnabled}
            onCheckedChange={(value) => onChange("gstEnabled", value)}
            aria-label="Apply GST to INR donations"
          />
          <Label>Apply GST to INR donations</Label>
          <Input
            className="w-28"
            type="number"
            min="0"
            max="100"
            value={settings.gstPercent}
            onChange={(event) =>
              onChange("gstPercent", Number(event.target.value))
            }
          />
          <span className="text-sm text-muted-foreground">percent</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField label="Minimum USD amount">
            <Input
              type="number"
              min="1"
              value={settings.minAmountUsd}
              onChange={(event) =>
                onChange("minAmountUsd", Number(event.target.value))
              }
            />
          </SettingField>
          <SettingField label="Minimum INR amount">
            <Input
              type="number"
              min="1"
              value={settings.minAmountInr}
              onChange={(event) =>
                onChange("minAmountInr", Number(event.target.value))
              }
            />
          </SettingField>
          <SettingField label="USD preset amounts (comma separated)">
            <Input
              value={settings.presetAmountsUsd}
              onChange={(event) =>
                onChange("presetAmountsUsd", event.target.value)
              }
            />
          </SettingField>
          <SettingField label="INR preset amounts (comma separated)">
            <Input
              value={settings.presetAmountsInr}
              onChange={(event) =>
                onChange("presetAmountsInr", event.target.value)
              }
            />
          </SettingField>
        </div>
        <SettingField label="US receipt note">
          <Textarea
            rows={3}
            value={settings.usReceiptNote}
            onChange={(event) => onChange("usReceiptNote", event.target.value)}
          />
        </SettingField>
      </CardContent>
    </Card>
  );
}

function SettingSwitch({ label, checked, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
      <Label>{label}</Label>
    </div>
  );
}
