"use client";

import type { ReactNode } from "react";
import { LIMITS, type Limit } from "@/domain/types";
import { readField } from "@/domain/workout";

export function limitText(l: Limit): string {
  if (l.integer) return `${l.min}~${l.max} 사이 정수`;
  if (l.minExclusive) return `0보다 크고 ${l.max} 이하`;
  return `${l.min}~${l.max} 사이`;
}

type FieldProps = {
  label: string;
  unit: string;
  value: string;
  limit: Limit;
  onChange(v: string): void;
  small?: boolean;
};

/** 숫자 입력 칸. type=number 대신 text + inputMode를 쓰고, 글자는 16px 이상(iOS 확대 방지) */
export function NumberField({ label, unit, value, limit, onChange, small }: FieldProps) {
  const invalid = readField(value, limit).kind === "invalid";
  return (
    <label className={`flex items-baseline gap-1 ${small ? "w-20" : "w-24"}`}>
      <input
        type="text"
        inputMode={limit.integer ? "numeric" : "decimal"}
        enterKeyHint="next"
        aria-label={label}
        aria-invalid={invalid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-11 w-full min-w-0 rounded-lg border bg-bg px-2 text-right text-base font-bold tabular-nums ${
          invalid ? "border-danger" : "border-line"
        }`}
      />
      <span className="shrink-0 text-sm text-muted">{unit}</span>
    </label>
  );
}

type RowProps<S> = {
  index: number;
  set: S;
  onChange(s: S): void;
  onRemove(): void;
};

function RowShell({ index, onRemove, error, children }: { index: number; onRemove(): void; error: string | null; children: ReactNode }) {
  return (
    <li className="py-1.5">
      <div className="flex items-center gap-2">
        {/* 세트는 순서가 있으므로 번호를 붙인다 */}
        <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted tabular-nums">{index + 1}</span>
        <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">{children}</div>
        <button type="button" onClick={onRemove} aria-label={`${index + 1}세트 삭제`} className="min-h-11 min-w-11 text-xl text-muted">
          ×
        </button>
      </div>
      {error && <p className="ml-7 text-sm text-danger">{error}</p>}
    </li>
  );
}

const errorOf = (checks: [string, string, Limit][]) => {
  const bad = checks.find(([, v, l]) => readField(v, l).kind === "invalid");
  return bad ? `${bad[0]}: ${limitText(bad[2])}` : null;
};

export function WeightedRow({ index, set, onChange, onRemove }: RowProps<{ weightKg: string; reps: string }>) {
  return (
    <RowShell index={index} onRemove={onRemove} error={errorOf([["무게", set.weightKg, LIMITS.weightKg], ["횟수", set.reps, LIMITS.reps]])}>
      <NumberField label="무게" unit="kg" value={set.weightKg} limit={LIMITS.weightKg} onChange={(weightKg) => onChange({ ...set, weightKg })} />
      <span className="text-muted">×</span>
      <NumberField label="횟수" unit="회" value={set.reps} limit={LIMITS.reps} onChange={(reps) => onChange({ ...set, reps })} small />
    </RowShell>
  );
}

export function RepsRow({ index, set, onChange, onRemove }: RowProps<{ reps: string; addedKg: string }>) {
  return (
    <RowShell index={index} onRemove={onRemove} error={errorOf([["횟수", set.reps, LIMITS.reps], ["추가 중량", set.addedKg, LIMITS.addedKg]])}>
      <NumberField label="횟수" unit="회" value={set.reps} limit={LIMITS.reps} onChange={(reps) => onChange({ ...set, reps })} small />
      <NumberField label="추가 중량" unit="+kg" value={set.addedKg} limit={LIMITS.addedKg} onChange={(addedKg) => onChange({ ...set, addedKg })} small />
    </RowShell>
  );
}

export function TimedRow({ index, set, onChange, onRemove }: RowProps<{ seconds: string }>) {
  return (
    <RowShell index={index} onRemove={onRemove} error={errorOf([["시간", set.seconds, LIMITS.seconds]])}>
      <NumberField label="시간(초)" unit="초" value={set.seconds} limit={LIMITS.seconds} onChange={(seconds) => onChange({ seconds })} />
    </RowShell>
  );
}
