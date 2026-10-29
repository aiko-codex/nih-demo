import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AmountField({ currency, settings, amount, onAmountChange, error }) {
  const presets = settings?.presets?.[currency] ?? [];
  const minimum = Number(settings?.minimums?.[currency] ?? (currency === "INR" ? 500 : 10));
  return <fieldset className="space-y-3"><legend className="text-sm font-medium">Amount</legend><div className="flex flex-wrap gap-2">{presets.map((preset) => <Button key={preset} type="button" variant={Number(amount) === Number(preset) ? "default" : "outline"} className="min-h-11" onClick={() => onAmountChange(String(preset))}>{currency} {Number(preset).toLocaleString()}</Button>)}</div><Input type="number" min={minimum} step="any" value={amount} onChange={(event) => onAmountChange(event.target.value)} placeholder={`Minimum ${currency} ${minimum}`} aria-label="Custom donation amount" />{error && <p className="text-sm text-destructive">{error}</p>}</fieldset>;
}
