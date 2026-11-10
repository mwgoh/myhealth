"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "기록" },
  { href: "/calendar", label: "달력" },
  // 운동 중에 자주 여니 엄지가 닿기 쉬운 가운데에 둔다
  { href: "/timer", label: "타이머" },
  { href: "/stats", label: "요약" },
  { href: "/settings", label: "설정" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-sm ${active ? "font-bold text-ink" : "text-muted"}`}
              >
                <span className={`h-1 w-6 rounded-full ${active ? "bg-ink" : "bg-transparent"}`} aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
