import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 없이 정적 파일만 만든다 (out/)
  output: "export",
  // next dev가 AGENTS.md에 영문 관리 블록을 다시 쓰지 않게 한다. 같은 안내는 한국어로 AGENTS.md에 직접 적었다.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
