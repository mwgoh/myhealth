"use client";

import Link from "next/link";
import { useToday } from "@/hooks/useToday";

export function FloatingAddButton() {
  const today = useToday();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30">
      <div className="mx-auto flex max-w-md justify-end px-4">
        <Link
          href={`/workout?date=${today}`}
          className="pointer-events-auto flex min-h-12 items-center rounded-full bg-ink px-5 font-bold text-bg shadow-lg"
        >
          + 운동 기록
        </Link>
      </div>
    </div>
  );
}
