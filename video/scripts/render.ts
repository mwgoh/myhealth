// 모든 종목 영상을 ../public/videos/<seedId>.mp4로 렌더링하고 크기·길이를 확인한다.
// 사용법: npm run render [-- seed-squat seed-plank]  (ID를 주면 그 종목만)
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, getCompositions, renderMedia } from "@remotion/renderer";
import { ALL_FORMATS, FilePathSource, Input } from "mediabunny";

const SIZE = 720;
const MAX_BYTES = 1.5 * 1024 * 1024;
// 앱 서버(3000)와 겹치지 않게 렌더링용 내부 서버 포트를 고정한다
const PORT = 3939;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, "../public/videos");
const only = new Set(process.argv.slice(2));

await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const compositions = (await getCompositions(serveUrl, { port: PORT })).filter((c) => only.size === 0 || only.has(c.id));
const missing = [...only].filter((id) => !compositions.some((c) => c.id === id));
if (missing.length > 0) throw new Error(`없는 종목: ${missing.join(", ")}`);

/** 만든 파일을 다시 읽어 실제 크기·길이·코덱을 확인한다 */
async function readMetadata(file: string) {
  const input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(file) });
  try {
    const video = await input.getPrimaryVideoTrack();
    const audio = await input.getPrimaryAudioTrack();
    return {
      width: video ? await video.getDisplayWidth() : 0,
      height: video ? await video.getDisplayHeight() : 0,
      codec: video ? await video.getCodec() : null,
      hasAudio: audio !== null,
      seconds: await input.computeDuration(),
    };
  } finally {
    input.dispose();
  }
}

mkdirSync(outDir, { recursive: true });
let failed = false;

for (const composition of compositions) {
  const outputLocation = path.join(outDir, `${composition.id}.mp4`);
  // 소리 트랙 없이 H.264로 만든다. CRF 28은 선 그림에 충분한 화질이다.
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 28, muted: true, outputLocation, port: PORT });

  const meta = await readMetadata(outputLocation);
  const bytes = statSync(outputLocation).size;
  const expectedSec = composition.durationInFrames / composition.fps;
  const seconds = meta.seconds;
  const problems = [
    meta.width !== SIZE || meta.height !== SIZE ? `크기 ${meta.width}×${meta.height}` : null,
    !(Math.abs(seconds - expectedSec) <= 0.1) ? `길이 ${seconds}초(기대 ${expectedSec}초)` : null,
    meta.codec !== "avc" ? `코덱 ${meta.codec}(기대 avc=H.264)` : null,
    meta.hasAudio ? "소리 트랙 있음" : null,
    bytes > MAX_BYTES ? "1.5MB 초과" : null,
  ].filter((p) => p !== null);

  console.log(
    `${problems.length ? "실패" : "통과"}  ${composition.id.padEnd(24)} ${meta.width}×${meta.height}  ${seconds.toFixed(2)}초  ${(bytes / 1024 / 1024).toFixed(2)}MB${problems.length ? `  (${problems.join(", ")})` : ""}`,
  );
  if (problems.length) failed = true;
}

if (failed) process.exitCode = 1;
