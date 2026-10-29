function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function DonorList({ donors = [] }) {
  if (!donors.length) {
    return <p className="text-sm text-muted-foreground">No sponsor yet. Yours could be the first light here.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {donors.map((donor, index) => (
        <li key={`${donor.name}-${index}`} className="flex items-center gap-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-medium
            text-primary">
            {initials(donor.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{donor.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[donor.company, donor.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
