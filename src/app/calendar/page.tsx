"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { MonthGrid } from "@/components/MonthGrid";
import { TabShell } from "@/components/TabShell";
import { WorkoutList } from "@/components/WorkoutCard";
import { isValidDateStr, shiftMonth, type DateStr } from "@/domain/date";
import { formatDateLabel, formatMonthLabel, workoutCategories } from "@/domain/format";
import { sortNewestFirst } from "@/domain/sort";
import { CATEGORIES, type Category } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { useToday } from "@/hooks/useToday";

function CalendarView() {
  const params = useSearchParams();
  const router = useRouter();
  const { store } = useReadyStore();
  const today = useToday();
  const param = params.get("date");
  // 선택한 날짜를 주소에 두어, 편집하고 돌아와도 같은 달·날짜가 유지된다
  const selected = param && isValidDateStr(param) ? param : today;
  const year = Number(selected.slice(0, 4));
  const month = Number(selected.slice(5, 7));
  const select = (d: DateStr) => router.replace(`/calendar?date=${d}`, { scroll: false });

  const byId = useMemo(() => new Map(store.exercises.map((e) => [e.id, e])), [store.exercises]);
  const marks = useMemo(() => {
    const m = new Map<DateStr, Set<Category>>();
    for (const w of store.workouts) {
      const set = m.get(w.date) ?? new Set();
      workoutCategories(w, byId).forEach((c) => set.add(c));
      m.set(w.date, set);
    }
    return new Map([...m].map(([d, s]) => [d, CATEGORIES.filter((c) => s.has(c))]));
  }, [store.workouts, byId]);
  const dayWorkouts = sortNewestFirst(store.workouts.filter((w) => w.date === selected));

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => select(shiftMonth(selected, -1))} aria-label="이전 달" className="min-h-11 min-w-11 text-xl">
          ◀
        </button>
        <h2 className="text-lg font-bold">{formatMonthLabel(selected)}</h2>
        <button type="button" onClick={() => select(shiftMonth(selected, 1))} aria-label="다음 달" className="min-h-11 min-w-11 text-xl">
          ▶
        </button>
      </div>

      <MonthGrid year={year} month={month} selected={selected} today={today} marks={marks} onSelect={select} />

      <section className="mt-6">
        <h2 className="mb-2 font-bold">{formatDateLabel(selected)}</h2>
        {dayWorkouts.length > 0 ? (
          <WorkoutList workouts={dayWorkouts} byId={byId} />
        ) : (
          <p className="text-muted">이 날은 기록이 없습니다.</p>
        )}
        <Link
          href={`/workout?date=${selected}`}
          className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-line font-semibold"
        >
          이 날짜로 기록 추가
        </Link>
      </section>
    </>
  );
}

export default function CalendarPage() {
  return (
    <TabShell title="달력">
      <Suspense fallback={<p className="text-muted">불러오는 중…</p>}>
        <CalendarView />
      </Suspense>
    </TabShell>
  );
}
