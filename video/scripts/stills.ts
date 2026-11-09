// 종목마다 주요 순간의 정지 화면을 PNG로 뽑아 자세를 눈으로 확인한다.
// 사용법: npm run stills [-- <출력 폴더>]  (기본: video/out/stills)
// 프레임: 제목, 내려가는 중·자세 잡는 중, 가장 낮은 지점·버티기 시작, 줄넘기 공중, 완료
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, getCompositions, renderStill } from "@remotion/renderer";

const TITLE_FRAMES = 60;
// 앱 서버(3000)와 겹치지 않게 렌더링용 내부 서버 포트를 고정한다
const PORT = 3939;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] ?? path.join(root, "out/stills"));
mkdirSync(outDir, { recursive: true });

await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });

for (const composition of await getCompositions(serveUrl, { port: PORT })) {
  const frames = {
    title: 30,
    moving: TITLE_FRAMES + 30,
    deepest: TITLE_FRAMES + 60,
    air: TITLE_FRAMES + 70,
    done: composition.durationInFrames - 30,
  };
  for (const [name, frame] of Object.entries(frames)) {
    const output = path.join(outDir, `${composition.id}-${name}.png`);
    await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", port: PORT });
  }
  console.log(`${composition.id}: ${Object.keys(frames).length}장`);
}
console.log(`저장 위치: ${outDir}`);
