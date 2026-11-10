import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SEED_EXERCISES } from "./seed";
import { GUIDE_VIDEOS, guideVideoSrc } from "./videos";

const VIDEO_DIR = fileURLToPath(new URL("../../public/videos/", import.meta.url));

describe("guideVideoSrc", () => {
  it("기본 종목은 모두 /videos/<id>.mp4", () => {
    expect(guideVideoSrc("seed-squat")).toBe("/videos/seed-squat.mp4");
    for (const e of SEED_EXERCISES) expect(guideVideoSrc(e.id)).toBe(`/videos/${e.id}.mp4`);
  });
  it("직접 추가한 종목은 영상이 없다", () => {
    expect(guideVideoSrc("3f2b8c1e-0000-4000-8000-000000000000")).toBeUndefined();
    expect(guideVideoSrc("toString")).toBeUndefined();
  });
});

describe("영상 목록과 파일의 일치", () => {
  const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".mp4"));

  it("GUIDE_VIDEOS의 ID는 모두 기본 종목에 있다", () => {
    const seedIds = new Set(SEED_EXERCISES.map((e) => e.id));
    for (const id of GUIDE_VIDEOS) expect(seedIds.has(id)).toBe(true);
  });

  it("GUIDE_VIDEOS의 ID마다 public/videos/<id>.mp4 파일이 있다", () => {
    for (const id of GUIDE_VIDEOS) expect(files).toContain(`${id}.mp4`);
  });

  it("public/videos/의 mp4는 모두 GUIDE_VIDEOS에 있다(고아 파일 없음)", () => {
    for (const f of files) expect(GUIDE_VIDEOS.has(f.slice(0, -".mp4".length))).toBe(true);
  });
});
