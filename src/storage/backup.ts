import type { DateStr } from "@/domain/date";
import { parseStore, type Store, type StoreErrorCode } from "@/domain/types";

export function exportFileName(today: DateStr): string {
  return `workout-log-backup-${today}.json`;
}

export function rawExportFileName(today: DateStr): string {
  return `workout-log-raw-${today}.json`;
}

export function serializeBackup(store: Store): string {
  return JSON.stringify(store, null, 2);
}

export type ImportError = "not-json" | StoreErrorCode;

export const IMPORT_ERROR_MESSAGE: Record<ImportError, string> = {
  "not-json": "백업 파일(JSON)이 아닙니다.",
  "unsupported-version": "이 앱보다 새 버전에서 만든 백업입니다.",
  "invalid-shape": "백업 파일의 구조가 올바르지 않습니다.",
  "unknown-exercise": "존재하지 않는 종목을 가리키는 기록이 있습니다.",
  "kind-mismatch": "종목과 기록의 측정 방식이 맞지 않습니다.",
};

export function parseBackup(text: string): { ok: true; store: Store } | { ok: false; error: ImportError } {
  // 메모장 등으로 저장한 파일은 맨 앞에 BOM이 붙어 JSON.parse가 실패한다
  const body = text.startsWith("﻿") ? text.slice(1) : text;
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return { ok: false, error: "not-json" };
  }
  const parsed = parseStore(json);
  return parsed.ok ? parsed : { ok: false, error: parsed.error };
}

/** 브라우저에서 텍스트를 파일로 내려받는다 */
export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // iOS Safari는 "다운로드하겠습니까?" 확인 뒤에야 파일을 읽으므로, 그동안 해제하지 않도록 1분 기다린다
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
