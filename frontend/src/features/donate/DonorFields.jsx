import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function DonorFields({ values, onChange }) {
  const update = (field) => (event) => onChange({ ...values, [field]: event.target.value });
  return <div className="space-y-4"><div className="space-y-2"><Label htmlFor="donor-name">Name</Label><Input id="donor-name" autoComplete="name" required value={values.name} onChange={update("name")} /></div><div className="space-y-2"><Label htmlFor="donor-email">Email</Label><Input id="donor-email" type="email" autoComplete="email" required value={values.email} onChange={update("email")} /></div><div className="space-y-2"><Label htmlFor="donor-company">Company <span className="text-muted-foreground">(optional)</span></Label><Input id="donor-company" autoComplete="organization" value={values.company} onChange={update("company")} /></div><div className="flex items-center justify-between gap-4 rounded-xl border p-3"><div><Label htmlFor="show-name">Show my name on this window</Label><p className="mt-1 text-xs text-muted-foreground">Your name and company may appear publicly.</p></div><Switch id="show-name" checked={values.showPublicly} onCheckedChange={(checked) => onChange({ ...values, showPublicly: checked })} /></div><p className="text-xs text-muted-foreground">Your contact details are used to process your donation.</p></div>;
}
