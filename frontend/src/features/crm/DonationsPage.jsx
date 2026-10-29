import { useState } from "react";
import {
  useBlocks,
  useDonations,
  useUpdateDonation,
  donationExportUrl,
} from "./useAdmin";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DonationsPage() {
  const [filters, setFilters] = useState({
    status: "",
    currency: "",
    blockId: "",
    q: "",
    page: 1,
    perPage: 20,
  });
  const [term, setTerm] = useState("");
  const { data: blockData } = useBlocks();
  const { data, isLoading, error } = useDonations(filters);
  const update = useUpdateDonation();
  const rows = data?.items || data?.donations || [];
  const blocks = Array.isArray(blockData) ? blockData : blockData?.blocks || [];
  function set(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
      page: 1,
    }));
  }
  function mutate(id, body) {
    update.mutate(
      { id, ...body },
      {
        onSuccess: () => toast.success("Donation updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }
  return (
    <main className="space-y-5 p-4 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Donations</h1>
          <p className="mt-1 text-muted-foreground">
            Amounts are visible to administrators only.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={donationExportUrl(filters)} download>
            Export CSV
          </a>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          value={filters.status || "all"}
          onValueChange={(status) =>
            set("status", status === "all" ? "" : status)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["pending", "paid", "failed", "refunded"].map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.currency || "all"}
          onValueChange={(currency) =>
            set("currency", currency === "all" ? "" : currency)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All currencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All currencies</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="INR">INR</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.blockId || "all"}
          onValueChange={(blockId) =>
            set("blockId", blockId === "all" ? "" : blockId)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All blocks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All blocks</SelectItem>
            {blocks.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.code} · {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search donor"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            set("q", event.target.value);
          }}
        />
      </div>
      {error && <p className="text-destructive">{error.message}</p>}
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Donor",
                "Block",
                "Amount",
                "Status",
                "Date",
                "Show publicly",
                "",
              ].map((x) => (
                <TableHead key={x}>{x}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading donations…</TableCell>
              </TableRow>
            ) : (
              rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div>{d.donorName || d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.donorEmail || d.email}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{d.blockCode}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatMoney(d.amountMinor, d.currency)}
                  </TableCell>
                  <TableCell>{d.status}</TableCell>
                  <TableCell>
                    {d.createdAt
                      ? new Date(d.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(d.showPublicly)}
                      aria-label="Show donor publicly"
                      onCheckedChange={(showPublicly) =>
                        mutate(d.id, { showPublicly })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {d.status === "paid" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Mark refunded
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Mark this donation refunded?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This changes its status in the donation records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                mutate(d.id, { status: "refunded" })
                              }
                            >
                              Confirm refund
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && !rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No donations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={filters.page <= 1}
          onClick={() =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              page: currentFilters.page - 1,
            }))
          }
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {filters.page} of {data?.totalPages || 1}
        </span>
        <Button
          variant="outline"
          disabled={filters.page >= (data?.totalPages || 1)}
          onClick={() =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              page: currentFilters.page + 1,
            }))
          }
        >
          Next
        </Button>
      </div>
    </main>
  );
}
