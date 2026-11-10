// 자세 확인 시트를 PNG로 뽑는다. 시트 한 장에 종목 4개, 종목마다 본 동작의 주요 프레임 3개가 들어간다.
// 사용법: npm run stills [-- <출력 폴더> [sheet-01 sheet-02 ...]]  (기본 폴더: video/out/stills)
// 한 장면을 원래 크기로 보려면: npx remotion still src/index.ts <seed ID> <파일.png> --frame=<프레임> --port=3939
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, getCompositions, renderStill } from "@remotion/renderer";

// 앱 서버(3000)와 겹치지 않게 렌더링용 내부 서버 포트를 고정한다
const PORT = 3939;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [outArg, ...onlyIds] = process.argv.slice(2);
const outDir = path.resolve(outArg ?? path.join(root, "out/stills"));
const only = new Set(onlyIds);
mkdirSync(outDir, { recursive: true });

await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const sheets = (await getCompositions(serveUrl, { port: PORT })).filter(
  (c) => c.id.startsWith("sheet-") && (only.size === 0 || only.has(c.id)),
);

for (const composition of sheets) {
  const output = path.join(outDir, `${composition.id}.png`);
  await renderStill({ composition, serveUrl, output, frame: 0, imageFormat: "png", port: PORT });
  console.log(`${composition.id}: ${(composition.props as { ids: string[] }).ids.join(", ")}`);
}
console.log(`저장 위치: ${outDir}`);
