import { Card, CardContent } from "@/components/ui/card";

export default function DonorList({ donors = [] }) {
  if (!donors.length) return <p className="text-sm text-muted-foreground">Be the first to light this window.</p>;
  return <ul className="space-y-2">{donors.map((donor, index) => <li key={`${donor.name}-${index}`}><Card><CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-3"><div><span className="font-medium">{donor.name}</span>{donor.company && <span className="ml-2 text-sm text-muted-foreground">{donor.company}</span>}</div>{donor.email && <span className="text-xs text-muted-foreground">{donor.email}</span>}</CardContent></Card></li>)}</ul>;
}
