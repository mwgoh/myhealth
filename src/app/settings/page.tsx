"use client";

import { BackupPanel } from "@/components/BackupPanel";
import { ExerciseManager } from "@/components/ExerciseManager";
import { TabShell } from "@/components/TabShell";

export default function SettingsPage() {
  return (
    <TabShell title="설정">
      <section>
        <h2 className="mb-2 font-bold">종목 관리</h2>
        <ExerciseManager />
      </section>
      <section className="mt-8">
        <h2 className="mb-2 font-bold">백업</h2>
        <BackupPanel />
      </section>
    </TabShell>
  );
}
