"use client";

import { useRef, useState } from "react";
import { todayStr } from "@/domain/date";
import type { Store } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { downloadText, exportFileName, IMPORT_ERROR_MESSAGE, parseBackup, serializeBackup } from "@/storage/backup";
import type { WriteResult } from "@/storage/store";
import { ConfirmDialog } from "./ConfirmDialog";

export function BackupPanel() {
  const { store, api } = useReadyStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Store | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const exportNow = () => downloadText(exportFileName(todayStr()), serializeBackup(store));
  const report = (r: WriteResult, ok: string) =>
    setMessage(r === "saved" ? { text: ok, error: false } : { text: "저장하지 못했습니다.", error: true });

  const onFile = async (file: File | undefined) => {
    // 같은 파일을 다시 고를 수 있도록 값을 비운다
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) return setMessage({ text: IMPORT_ERROR_MESSAGE[parsed.error], error: true });
    setMessage(null);
    setPending(parsed.store);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">기록은 이 브라우저에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 파일로 받아 두세요.</p>
      <button type="button" onClick={exportNow} className="min-h-12 w-full rounded-xl bg-ink font-bold text-bg">
        백업 파일 내보내기
      </button>
      <label className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-line bg-surface font-bold">
        백업 파일 가져오기
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </label>
      <button type="button" onClick={() => setConfirmReset(true)} className="min-h-12 w-full rounded-xl border border-danger font-bold text-danger">
        전체 초기화
      </button>
      {message && (
        <p role="status" className={`text-sm ${message.error ? "text-danger" : "text-muted"}`}>
          {message.text}
        </p>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="백업으로 덮어쓸까요?"
        message={`현재 기록 ${store.workouts.length}개를 가져온 기록 ${pending?.workouts.length ?? 0}개로 덮어씁니다.`}
        confirmLabel="덮어쓰기"
        destructive
        onConfirm={() => {
          if (pending) report(api.replaceAll(pending), "백업을 가져왔습니다.");
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      >
        <button type="button" onClick={exportNow} className="min-h-11 w-full rounded-xl border border-line font-semibold">
          현재 데이터 먼저 내보내기
        </button>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmReset}
        title="전체 초기화할까요?"
        message="모든 기록과 직접 추가한 종목이 삭제됩니다."
        confirmLabel="초기화"
        destructive
        onConfirm={() => {
          report(api.resetAll(), "초기화했습니다.");
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
