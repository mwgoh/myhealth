"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { isValidDateStr, todayStr } from "@/domain/date";
import type { Store } from "@/domain/types";
import { draftFromWorkout, newWorkoutDraft, type WorkoutDraft } from "@/domain/workout";
import { useReadyStore } from "@/hooks/useStore";

type Session = { key: string; kind: "edit"; draft: WorkoutDraft; isNew: boolean } | { key: string; kind: "not-found" };

function openSession(key: string, id: string | null, date: string, store: Store): Session {
  if (id) {
    const w = store.workouts.find((x) => x.id === id);
    return w ? { key, kind: "edit", draft: draftFromWorkout(w), isNew: false } : { key, kind: "not-found" };
  }
  return { key, kind: "edit", draft: newWorkoutDraft(date, new Date()), isNew: true };
}

function WorkoutRoute() {
  const params = useSearchParams();
  const { store } = useReadyStore();
  const id = params.get("id");
  const dateParam = params.get("date");
  const date = dateParam && isValidDateStr(dateParam) ? dateParam : todayStr();
  const key = id ? `id:${id}` : `new:${date}`;

  const [session, setSession] = useState<Session>(() => openSession(key, id, date, store));

  // 주소가 바뀌면 편집 대상을 다시 고른다. 단, 새 기록의 첫 저장 뒤 편집기 스스로 ?id=로 바꾼 경우는
  // 같은 초안이므로 편집기를 그대로 둔다(다시 만들면 입력 중이던 미완성 세트가 사라진다).
  if (session.key !== key) {
    if (id && session.kind === "edit" && session.draft.id === id) setSession({ ...session, key });
    else setSession(openSession(key, id, date, store));
  }

  if (session.kind === "not-found") {
    return (
      <main className="mx-auto max-w-md px-4 pt-10">
        <p className="text-lg font-bold">기록을 찾을 수 없습니다</p>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-semibold underline">
          목록으로
        </Link>
      </main>
    );
  }
  return <WorkoutEditor key={session.draft.id} initialDraft={session.draft} isNew={session.isNew} />;
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">불러오는 중…</p>}>
      <WorkoutRoute />
    </Suspense>
  );
}
