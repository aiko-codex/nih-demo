import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DonationReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("t");
  const [startedAt] = useState(Date.now());
  const [timedOut, setTimedOut] = useState(false);
  const status = useQuery({
    queryKey: ["donation-status", token],
    queryFn: () => apiGet(`/donations/${encodeURIComponent(token)}/status`),
    enabled: Boolean(token),
    refetchInterval: (query) => query.state.data?.status === "pending" && Date.now() - startedAt < 60000 ? 2000 : false,
  });

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => setTimedOut(true), 60000);
    return () => window.clearTimeout(timer);
  }, [token]);
  useEffect(() => { if (status.isError) toast.error(status.error?.message || "Donation status could not load."); }, [status.isError, status.error]);

  const paid = status.data?.status === "paid";
  const failed = status.data?.status === "failed" || timedOut || status.data?.status === "refunded";
  const pending = status.data?.status === "pending" || (!status.data && !failed && !status.isError);

  return <main className="grid min-h-[100dvh] place-items-center p-6"><section className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 text-center">
    {status.isPending && !status.data ? <><Skeleton className="mx-auto h-10 w-56" /><Skeleton className="mx-auto h-5 w-64" /></> : <>
      <h1 className="font-display text-4xl">{paid ? "Your window is lit" : pending ? "Confirming your donation" : "Donation not confirmed"}</h1>
      <p className="text-muted-foreground">{paid ? "Thank you for lighting the National India Hub." : pending ? "We’re checking your payment. This can take a moment." : "Your donation could not be confirmed."}</p>
      {pending && !timedOut && <div className="mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Checking payment" />}
      {paid && status.data?.blockCode && <Button className="min-h-11 w-full" onClick={() => navigate(`/b/${status.data.blockCode}`)}>View your window</Button>}
      {failed && <Button className="min-h-11 w-full" onClick={() => status.data?.blockCode ? navigate(`/b/${status.data.blockCode}`) : navigate("/")}>Try again</Button>}
      {status.isError && <Button variant="outline" onClick={() => status.refetch()}>Check again</Button>}
    </>}
  </section></main>;
}
