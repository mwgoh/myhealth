import { describe, expect, it, vi } from "vitest";
import { createInitialStore } from "@/domain/seed";
import type { Store } from "@/domain/types";
import { downloadText, exportFileName, IMPORT_ERROR_MESSAGE, parseBackup, rawExportFileName, serializeBackup } from "./backup";

function sample(): Store {
  return {
    ...createInitialStore(),
    workouts: [
      {
        id: "w1",
        date: "2026-11-09",
        createdAt: "2026-11-09T01:00:00.000Z",
        memo: "가슴 운동",
        entries: [{ id: "e1", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: 52.5, reps: 8 }] }],
      },
    ],
  };
}

describe("backup", () => {
  it("파일 이름", () => {
    expect(exportFileName("2026-11-09")).toBe("workout-log-backup-2026-11-09.json");
    expect(rawExportFileName("2026-11-09")).toBe("workout-log-raw-2026-11-09.json");
  });

  it("내보내기 → 가져오기 왕복", () => {
    const s = sample();
    expect(parseBackup(serializeBackup(s))).toEqual({ ok: true, store: s });
  });

  it("BOM이 붙은 파일도 읽는다", () => {
    expect(parseBackup("﻿" + serializeBackup(sample())).ok).toBe(true);
  });

  it("JSON이 아니면 not-json", () => {
    expect(parseBackup("hello")).toEqual({ ok: false, error: "not-json" });
    expect(parseBackup("")).toEqual({ ok: false, error: "not-json" });
  });

  it("새 버전 백업", () => {
    expect(parseBackup(JSON.stringify({ ...sample(), version: 2 }))).toEqual({ ok: false, error: "unsupported-version" });
  });

  it("없는 종목 참조", () => {
    const s = sample();
    s.workouts[0].entries[0].exerciseId = "nope";
    expect(parseBackup(JSON.stringify(s))).toEqual({ ok: false, error: "unknown-exercise" });
  });

  it("측정 방식 불일치", () => {
    const s = sample();
    s.workouts[0].entries = [{ id: "e1", exerciseId: "seed-bench-press", kind: "timed", sets: [{ seconds: 30 }] }];
    expect(parseBackup(JSON.stringify(s))).toEqual({ ok: false, error: "kind-mismatch" });
  });

  it("모든 오류에 안내 문구가 있다", () => {
    expect(IMPORT_ERROR_MESSAGE["not-json"]).toBe("백업 파일(JSON)이 아닙니다.");
    expect(Object.values(IMPORT_ERROR_MESSAGE).every((m) => m.length > 0)).toBe(true);
  });

  it("내려받기 URL은 iOS 확인 창을 기다릴 수 있게 1분 동안 해제하지 않는다", () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: revoke });
    vi.stubGlobal("document", { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } });
    try {
      downloadText("a.json", "{}");
      vi.advanceTimersByTime(30_000);
      expect(revoke).not.toHaveBeenCalled();
      vi.advanceTimersByTime(30_000);
      expect(revoke).toHaveBeenCalledWith("blob:x");
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});
