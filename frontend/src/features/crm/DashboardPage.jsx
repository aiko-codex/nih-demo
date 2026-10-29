import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "./useAdmin";
import { formatMoney } from "@/lib/money";

export default function DashboardPage() {
  const { data, isLoading, error } = useStats();
  const t = data?.totals || {};
  const cards = [
    ["Raised · USD", formatMoney(t.USD, "USD")],
    ["Raised · INR", formatMoney(t.INR, "INR")],
    ["Donations", data?.donationCount ?? 0],
    ["Lit blocks", `${data?.litBlocks ?? 0} / ${data?.totalBlocks ?? 0}`],
  ];
  const chartData = data?.last30Days || [];
  return (
    <main className="space-y-6 p-4 md:p-7">
      <div>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          A clear view of what supporters have made possible.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl tabular-nums">
                {isLoading ? <Skeleton className="h-9 w-28" /> : value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              USD: { label: "USD", color: "var(--primary)" },
              INR: { label: "INR", color: "var(--accent)" },
            }}
            className="h-[300px] w-full"
          >
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(dateLabel) => String(dateLabel).slice(5)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="USD"
                stroke="var(--color-USD)"
                fill="var(--color-USD)"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="INR"
                stroke="var(--color-INR)"
                fill="var(--color-INR)"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  );
}
