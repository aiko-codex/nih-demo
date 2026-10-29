import { Label } from "@/components/ui/label";

export default function SettingField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
