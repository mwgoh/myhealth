import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { FloatingAddButton } from "./FloatingAddButton";

/** 탭 화면 네 곳(기록·달력·요약·설정)의 공통 틀 */
export function TabShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      {/* 아래 여백: 떠 있는 버튼과 하단 탭에 내용이 가리지 않게 */}
      <main className="mx-auto max-w-md px-4 pt-6 pb-40">
        <h1 className="mb-5 text-3xl font-extrabold tracking-tight">{title}</h1>
        {children}
      </main>
      <FloatingAddButton />
      <BottomNav />
    </>
  );
}
