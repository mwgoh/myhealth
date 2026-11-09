"use client";

import { useEffect, useState, type ReactNode } from "react";
import { todayStr } from "@/domain/date";
import { useStoreState } from "@/hooks/useStore";
import { downloadText, rawExportFileName } from "@/storage/backup";
import { getBrowserStore } from "@/storage/browser-store";
import { ConfirmDialog } from "./ConfirmDialog";

const MESSAGE = {
  corrupt: "저장된 데이터를 읽을 수 없습니다. 데이터는 지우지 않았습니다. 원본을 내보내 보관한 뒤 초기화할 수 있습니다.",
  "unsupported-version": "이 앱보다 새 버전에서 저장된 데이터입니다. 데이터는 지우지 않았습니다.",
};

/** 저장소를 불러오고, 준비되기 전이나 데이터에 문제가 있으면 화면 대신 안내를 보여준다 */
export function StoreGate({ children }: { children: ReactNode }) {
  const state = useStoreState();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    getBrowserStore().load();
  }, []);

  if (state.status === "loading") {
    return <p className="p-6 text-center text-muted">불러오는 중…</p>;
  }
  if (state.status === "ready") return children;

  return (
    <main className="mx-auto max-w-md px-4 pt-10">
      <h1 className="text-2xl font-extrabold">기록을 열 수 없습니다</h1>
      <p className="mt-3 text-muted">{MESSAGE[state.status]}</p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => downloadText(rawExportFileName(todayStr()), state.raw)}
          className="min-h-12 rounded-xl bg-ink font-bold text-bg"
        >
          원본 그대로 내보내기
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="min-h-12 rounded-xl border border-danger font-bold text-danger"
        >
          초기화
        </button>
      </div>
      <ConfirmDialog
        open={confirmReset}
        title="초기화할까요?"
        message="저장된 데이터를 지우고 기본 종목만 있는 상태로 시작합니다. 원본을 내보내지 않았다면 되돌릴 수 없습니다."
        confirmLabel="초기화"
        destructive
        onConfirm={() => {
          getBrowserStore().resetAll();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </main>
  );
}
