import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSaveSettings, useSettings } from "./useAdmin";
import DonationSettingsCard from "./DonationSettingsCard";
import WindowSettingsCard from "./WindowSettingsCard";

export default function SettingsPage() {
  const settingsQuery = useSettings();
  const saveSettings = useSaveSettings();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSettings({
      ...settingsQuery.data,
      presetAmountsUsd: settingsQuery.data.presetAmountsUsd.join(", "),
      presetAmountsInr: settingsQuery.data.presetAmountsInr.join(", "),
    });
  }, [settingsQuery.data]);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    try {
      await saveSettings.mutateAsync({
        ...settings,
        presetAmountsUsd: parseAmounts(settings.presetAmountsUsd),
        presetAmountsInr: parseAmounts(settings.presetAmountsInr),
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error.message || "Could not save settings");
    }
  }

  if (settingsQuery.isLoading || !settings) {
    return <main className="p-7">Loading settings…</main>;
  }

  return (
    <main className="space-y-5 p-4 md:p-7">
      <div>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure donations and the building layout.
        </p>
      </div>
      {settingsQuery.error && (
        <p className="text-destructive">{settingsQuery.error.message}</p>
      )}
      <form className="space-y-5" onSubmit={save}>
        <DonationSettingsCard settings={settings} onChange={updateSetting} />
        <WindowSettingsCard settings={settings} onChange={updateSetting} />
        <Button className="min-h-11" disabled={saveSettings.isPending}>
          {saveSettings.isPending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </main>
  );
}

function parseAmounts(value) {
  return String(value)
    .split(",")
    .map((amount) => Number(amount.trim()))
    .filter((amount) => Number.isInteger(amount) && amount > 0);
}
