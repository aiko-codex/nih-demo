import { useMemo, useState } from "react";
import { Link } from "react-router";
import { tableFeatures, useTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBlocks, useSaveBlock } from "./useAdmin";
import { toast } from "sonner";

export default function BlocksPage() {
  const { data = [], isLoading, error } = useBlocks();
  const save = useSaveBlock();
  const [search, setSearch] = useState("");
  const rows = Array.isArray(data) ? data : data.blocks || [];
  const filtered = rows.filter((row) =>
    `${row.code} ${row.name} ${row.face} ${row.floor}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const columns = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <Link
            className="font-mono text-primary underline-offset-4 hover:underline"
            to={`/crm/blocks/${row.original.id}`}
          >
            {row.original.code}
          </Link>
        ),
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "floor", header: "Floor" },
      { accessorKey: "face", header: "Face" },
      {
        accessorKey: "slotKey",
        header: "Slot",
        cell: ({ row }) => row.original.slotKey || "—",
      },
      {
        id: "windows",
        header: "Windows",
        cell: ({ row }) =>
          `${row.original.windowStart ?? 0}–${(row.original.windowStart ?? 0) + (row.original.windowSpan ?? 1) - 1}`,
      },
      {
        accessorKey: "isPublished",
        header: "Published",
        cell: ({ row }) => (
          <Switch
            checked={Boolean(row.original.isPublished)}
            aria-label={`Publish ${row.original.code}`}
            onCheckedChange={(isPublished) =>
              save.mutate(
                { id: row.original.id, isPublished },
                { onError: (error) => toast.error(error.message) },
              )
            }
          />
        ),
      },
      { accessorKey: "donorCount", header: "Donors" },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue()).toLocaleDateString() : "—",
      },
    ],
    [save],
  );
  const table = useTable({
    features: tableFeatures({}),
    data: filtered,
    columns,
  });
  return (
    <main className="space-y-5 p-4 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Blocks</h1>
          <p className="mt-1 text-muted-foreground">
            Manage stories and windows across the building.
          </p>
        </div>
        <Button asChild className="min-h-11">
          <Link to="/crm/blocks/new">New block</Link>
        </Button>
      </div>
      <Input
        className="max-w-sm"
        placeholder="Search blocks"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {error && <p className="text-destructive">{error.message}</p>}
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((g) => (
              <TableRow key={g.id}>
                {g.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : <table.FlexRender header={h} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>Loading blocks…</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((r) => (
                <TableRow key={r.id}>
                  {r.getVisibleCells().map((c) => (
                    <TableCell key={c.id}>
                      <table.FlexRender cell={c} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No blocks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
