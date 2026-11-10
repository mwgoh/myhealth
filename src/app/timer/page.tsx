"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TabShell } from "@/components/TabShell";
import { TimerEditor } from "@/components/TimerEditor";
import { TimerList } from "@/components/TimerList";
import { TimerRun } from "@/components/TimerRun";

/** ?run=<id> 실행, ?edit=<id|new>[&from=<id>] 편집, 그 밖에는 목록 */
function TimerRoute() {
  const params = useSearchParams();
  const run = params.get("run");
  const edit = params.get("edit");
  const from = params.get("from");

  if (run) return <TimerRun planId={run} />;
  if (edit) {
    return (
      <TabShell title={edit === "new" ? "새 타이머" : "타이머 편집"}>
        {/* 주소가 바뀌면 초안을 새로 만든다 */}
        <TimerEditor key={`${edit}:${from ?? ""}`} editId={edit} fromId={from} />
      </TabShell>
    );
  }
  return (
    <TabShell title="타이머">
      <TimerList />
    </TabShell>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">불러오는 중…</p>}>
      <TimerRoute />
    </Suspense>
  );
}
