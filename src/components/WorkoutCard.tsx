import Link from "next/link";
import { parseDateStr, weekdayKo } from "@/domain/date";
import { workoutCategories, workoutSummaryText } from "@/domain/format";
import type { Exercise, Workout } from "@/domain/types";
import { CategoryChip } from "./CategoryChip";

type Props = { workout: Workout; byId: ReadonlyMap<string, Exercise> };

/** 일지의 한 줄: 왼쪽에 날짜, 오른쪽에 분류와 종목 요약 */
export function WorkoutCard({ workout, byId }: Props) {
  const day = parseDateStr(workout.date)?.getDate();
  return (
    <Link href={`/workout?id=${workout.id}`} className="flex gap-4 px-4 py-3 active:bg-bg">
      <div className="w-10 shrink-0 text-center">
        <div className="text-2xl leading-none font-extrabold tabular-nums">{day}</div>
        <div className="mt-1 text-sm text-muted">{weekdayKo(workout.date)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {workoutCategories(workout, byId).map((c) => (
            <CategoryChip key={c} category={c} />
          ))}
        </div>
        <p className="mt-1.5 leading-snug">{workoutSummaryText(workout, byId)}</p>
        {workout.memo && <p className="mt-0.5 truncate text-sm text-muted">{workout.memo}</p>}
      </div>
    </Link>
  );
}

/** 여러 기록을 한 덩어리로 묶고 줄 사이에 구분선을 둔다 */
export function WorkoutList({ workouts, byId }: { workouts: Workout[]; byId: ReadonlyMap<string, Exercise> }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
      {workouts.map((w) => (
        <li key={w.id}>
          <WorkoutCard workout={w} byId={byId} />
        </li>
      ))}
    </ul>
  );
}
