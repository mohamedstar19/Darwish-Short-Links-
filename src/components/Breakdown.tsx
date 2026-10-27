/** A ranked list with proportional bars; the number is always shown as text */
export default function Breakdown({
  title,
  rows,
  total,
  empty,
  format,
  percent,
}: {
  title: string;
  rows: { label: string; count: number; dir?: "ltr" }[];
  total: number;
  empty: string;
  format: (n: number) => string;
  percent: (ratio: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="animate-rise rounded-2xl border border-border bg-card/95 p-5">
      <h2 className="mb-3 font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <li key={r.label} className="text-sm">
              <div className="mb-1 flex justify-between gap-3">
                <span className="truncate" dir={r.dir}>
                  {r.label}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  <b className="text-foreground">{format(r.count)}</b> ·{" "}
                  {percent(r.count / Math.max(total, 1))}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="animate-grow-x h-full rounded-full bg-primary dark:bg-primary-light"
                  style={{ width: `${(r.count / max) * 100}%`, "--i": i } as React.CSSProperties}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
