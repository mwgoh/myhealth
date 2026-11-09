type Item = { label: string; value: string };

/** 지표 묶음. 숫자를 크게, 이름을 작게 보여준다. */
export function SummaryCards({ items, columns = 3 }: { items: Item[]; columns?: 2 | 3 }) {
  return (
    <dl className={`grid gap-px overflow-hidden rounded-2xl bg-line ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-col-reverse bg-surface px-3 py-3">
          <dt className="mt-1 text-sm text-muted">{it.label}</dt>
          <dd className="text-xl font-extrabold tabular-nums">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
