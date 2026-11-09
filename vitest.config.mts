import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // 날짜 계산이 현지 시간 기준인지 확인하려고 한국 시간대로 고정한다
    env: { TZ: "Asia/Seoul" },
  },
});
