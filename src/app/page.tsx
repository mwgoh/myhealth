"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import { TabShell } from "@/components/TabShell";
import { WorkoutList } from "@/components/WorkoutCard";
import { weekRange } from "@/domain/date";
import { formatDuration, formatInt, formatMonthLabel } from "@/domain/format";
import { sortNewestFirst } from "@/domain/sort";
import { summarize } from "@/domain/summary";
import type { Workout } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { useToday } from "@/hooks/useToday";

export default function Home() {
  const { store } = useReadyStore();
  const today = useToday();
  const byId = useMemo(() => new Map(store.exercises.map((e) => [e.id, e])), [store.exercises]);
  const week = summarize(store, weekRange(today));

  // 최신순으로 정렬한 뒤 월별로 묶는다
  const months = useMemo(() => {
    const groups: { label: string; workouts: Workout[] }[] = [];
    for (const w of sortNewestFirst(store.workouts)) {
      const label = formatMonthLabel(w.date);
      const last = groups.at(-1);
      if (last?.label === label) last.workouts.push(w);
      else groups.push({ label, workouts: [w] });
    }
    return groups;
  }, [store.workouts]);

  return (
    <TabShell title="기록">
      <section aria-label="이번 주">
        <h2 className="mb-2 font-bold">이번 주</h2>
        <SummaryCards
          items={[
            { label: "운동 일수", value: `${week.workoutDays}일` },
            { label: "총 운동 시간", value: formatDuration(week.totalDurationMin) },
            { label: "총 볼륨", value: `${formatInt(week.volumeKg)}kg` },
          ]}
        />
      </section>

      {months.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-lg font-bold">아직 기록이 없습니다</p>
          <p className="mt-1 text-muted">오늘 한 운동부터 남겨 보세요.</p>
          <Link href={`/workout?date=${today}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ink px-5 font-bold text-bg">
            첫 기록 남기기
          </Link>
        </div>
      ) : (
        months.map((m) => (
          <section key={m.label} className="mt-7">
            <h2 className="mb-2 font-bold">{m.label}</h2>
            <WorkoutList workouts={m.workouts} byId={byId} />
          </section>
        ))
      )}
    </TabShell>
  );
}
