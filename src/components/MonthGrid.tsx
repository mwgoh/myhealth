import { monthGrid, type DateStr } from "@/domain/date";
import { formatDateLabel } from "@/domain/format";
import { CATEGORY_LABEL, type Category } from "@/domain/types";
import { CATEGORY_DOT } from "./CategoryChip";

type Props = {
  year: number;
  month: number;
  selected: DateStr;
  today: DateStr;
  /** 날짜별로 그날 한 분류. 점 색으로 보여준다 */
  marks: ReadonlyMap<DateStr, Category[]>;
  onSelect(d: DateStr): void;
};

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function MonthGrid({ year, month, selected, today, marks, onSelect }: Props) {
  return (
    <div className="rounded-2xl bg-surface p-2">
      <div className="grid grid-cols-7 text-center text-sm text-muted" aria-hidden>
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      {monthGrid(year, month).map((row, i) => (
        <div key={i} className="grid grid-cols-7">
          {row.map((d, j) => {
            if (!d) return <span key={j} />;
            const cats = marks.get(d) ?? [];
            const isSelected = d === selected;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelect(d)}
                aria-pressed={isSelected}
                aria-label={`${formatDateLabel(d)}${cats.length ? `, ${cats.map((c) => CATEGORY_LABEL[c]).join(" ")}` : ""}`}
                className={`m-0.5 flex min-h-12 flex-col items-center justify-center rounded-xl tabular-nums ${
                  isSelected ? "bg-ink font-bold text-bg" : d === today ? "font-bold ring-2 ring-ink ring-inset" : ""
                }`}
              >
                {Number(d.slice(8))}
                {/* 분류는 최대 5개이고 점 5개(약 38px)가 칸 너비에 들어가므로 모두 그린다 */}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {cats.map((c) => (
                    <span key={c} className={`size-1.5 rounded-full ${CATEGORY_DOT[c]}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
