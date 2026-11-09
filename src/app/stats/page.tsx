"use client";

import { useState } from "react";
import { CATEGORY_DOT } from "@/components/CategoryChip";
import { SummaryCards } from "@/components/SummaryCards";
import { TabShell } from "@/components/TabShell";
import { addDays, monthRange, shiftMonth, weekRange } from "@/domain/date";
import { formatDuration, formatInt, formatKm, formatMonthLabel, formatWeekLabel } from "@/domain/format";
import { summarize } from "@/domain/summary";
import { CATEGORIES, CATEGORY_LABEL } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { useToday } from "@/hooks/useToday";

type Mode = "week" | "month";

export default function StatsPage() {
  const { store } = useReadyStore();
  const today = useToday();
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(today);

  const range = mode === "week" ? weekRange(anchor) : monthRange(anchor);
  const label = mode === "week" ? formatWeekLabel(range) : formatMonthLabel(anchor);
  const s = summarize(store, range);
  const daysInRange = mode === "week" ? 7 : Number(range.end.slice(8));
  const atCurrent = range.end >= today; // 오늘이 포함된 기간이면 더 뒤로 갈 수 없다

  const move = (dir: -1 | 1) => setAnchor(mode === "week" ? addDays(anchor, dir * 7) : shiftMonth(anchor, dir));

  return (
    <TabShell title="요약">
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-surface p-1" role="group" aria-label="기간 단위">
        {(["week", "month"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setAnchor(today);
            }}
            className={`min-h-11 rounded-lg font-semibold ${mode === m ? "bg-ink text-bg" : "text-muted"}`}
          >
            {m === "week" ? "주간" : "월간"}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} aria-label="이전 기간" className="min-h-11 min-w-11 text-xl">
          ◀
        </button>
        <h2 className="text-lg font-bold">{label}</h2>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={atCurrent}
          aria-label="다음 기간"
          className="min-h-11 min-w-11 text-xl disabled:opacity-25"
        >
          ▶
        </button>
      </div>

      <SummaryCards
        columns={2}
        items={[
          { label: "운동 일수", value: `${s.workoutDays}일` },
          { label: "총 운동 시간", value: formatDuration(s.totalDurationMin) },
          { label: "총 볼륨", value: `${formatInt(s.volumeKg)}kg` },
          { label: "총 횟수", value: `${formatInt(s.totalReps)}회` },
          { label: "유산소 시간", value: formatDuration(s.cardioDurationMin) },
          { label: "유산소 거리", value: `${formatKm(s.cardioDistanceKm)}km` },
        ]}
      />
      {s.missingDurationCount > 0 && (
        <p className="mt-2 text-sm text-muted">운동 시간이 입력되지 않은 기록 {s.missingDurationCount}개</p>
      )}

      <section className="mt-7">
        <h2 className="mb-2 font-bold">분류별 운동 일수</h2>
        <ul className="space-y-3 rounded-2xl bg-surface p-4">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <div className="flex items-baseline justify-between">
                <span>{CATEGORY_LABEL[c]}</span>
                <span className="font-bold tabular-nums">{s.categoryDays[c]}일</span>
              </div>
              {/* 기간 일수 대비 막대. 색은 원판 색 */}
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg" aria-hidden>
                <div className={`h-full rounded-full ${CATEGORY_DOT[c]}`} style={{ width: `${(s.categoryDays[c] / daysInRange) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </TabShell>
  );
}
