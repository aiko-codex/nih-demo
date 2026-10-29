import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useCreateDonation } from "@/features/donate/useCreateDonation";
import AmountField from "@/features/donate/AmountField";
import DonorFields from "@/features/donate/DonorFields";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const donationSchema = z.object({
  blockCode: z.string().min(1), currency: z.enum(["USD", "INR"]),
  amount: z.number().positive(), name: z.string().trim().min(1, "Enter your name."),
  email: z.string().email("Enter a valid email."), company: z.string().optional(), showPublicly: z.boolean(),
});

function defaultCurrency() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Kolkata" ? "INR" : "USD"; } catch { return "USD"; }
}

export default function DonateDialog({ open, onOpenChange, blockCode }) {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [amount, setAmount] = useState("");
  const [donor, setDonor] = useState({ name: "", email: "", company: "", showPublicly: true });
  const [currency, setCurrency] = useState(defaultCurrency);
  const settings = useQuery({ queryKey: ["public-settings"], queryFn: () => apiGet("/settings/public"), enabled: open });
  const createDonation = useCreateDonation();
  const form = useForm({ resolver: zodResolver(donationSchema), defaultValues: { blockCode, currency, amount: 0, ...donor } });

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const minimum = Number(settings.data?.minimums?.[currency] ?? (currency === "INR" ? 500 : 10));
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= minimum;
  const gst = currency === "INR" && settings.data?.gst?.enabled;
  const tax = gst && validAmount ? numericAmount * Number(settings.data.gst.percent || 0) / 100 : 0;
  const total = validAmount ? numericAmount + tax : 0;

  const submit = form.handleSubmit(async () => {
    const values = { blockCode, currency, amount: numericAmount, name: donor.name.trim(), email: donor.email.trim(), company: donor.company.trim() || undefined, showPublicly: donor.showPublicly };
    const checked = donationSchema.safeParse(values);
    if (!checked.success) { toast.error(checked.error.issues[0]?.message || "Check your donation details."); return; }
    try { await createDonation.mutateAsync(checked.data); }
    catch (error) { toast.error(error.message || "Donation could not be started."); }
  });

  const content = <form onSubmit={submit} className="space-y-5">
    <ToggleGroup type="single" value={currency} onValueChange={(value) => { if (value) setCurrency(value); }} aria-label="Currency" className="w-full"><ToggleGroupItem value="INR" className="min-h-11 flex-1">INR ₹</ToggleGroupItem><ToggleGroupItem value="USD" className="min-h-11 flex-1">USD $</ToggleGroupItem></ToggleGroup>
    <AmountField currency={currency} settings={settings.data} amount={amount} onAmountChange={setAmount} error={amount && !validAmount ? `Minimum donation is ${currency} ${minimum}.` : ""} />
    <DonorFields values={donor} onChange={setDonor} />
    <div className="space-y-2 border-t pt-3 text-sm"><div className="flex justify-between"><span>Donation</span><span>{validAmount ? formatMoney(Math.round(numericAmount * 100), currency) : formatMoney(0, currency)}</span></div>{gst && <div className="flex justify-between text-muted-foreground"><span>GST ({settings.data.gst.percent}%)</span><span>{formatMoney(Math.round(tax * 100), currency)}</span></div>}<div className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Math.round(total * 100), currency)}</span></div></div>
    <Button className="min-h-12 w-full" type="submit" disabled={createDonation.isPending || !validAmount}>{createDonation.isPending ? "Opening checkout…" : "Continue to payment"}</Button>
  </form>;

  if (wide) return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-3xl">Light this window</DialogTitle><DialogDescription>Choose an amount and add your details.</DialogDescription></DialogHeader>{content}</DialogContent></Dialog>;
  return <Drawer open={open} onOpenChange={onOpenChange}><DrawerContent className="max-h-[92dvh] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"><DrawerHeader className="px-0 text-left"><DrawerTitle className="font-display text-3xl">Light this window</DrawerTitle><DrawerDescription>Choose an amount and add your details.</DrawerDescription></DrawerHeader>{content}</DrawerContent></Drawer>;
}
