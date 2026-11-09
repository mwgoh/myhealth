export type SaveStatusValue = "idle" | "saving" | "saved" | "failed" | "no-entries" | "invalid-date";

const LABEL: Record<SaveStatusValue, string> = {
  idle: "",
  saving: "저장 중",
  saved: "저장됨",
  failed: "저장 실패",
  "no-entries": "완성된 종목이 없어 저장되지 않음",
  "invalid-date": "날짜가 올바르지 않아 저장되지 않음",
};

export function SaveStatus({ status }: { status: SaveStatusValue }) {
  const tone = status === "failed" ? "text-danger font-semibold" : "text-muted";
  return (
    <p role="status" aria-live="polite" className={`text-sm ${tone}`}>
      {LABEL[status]}
    </p>
  );
}
