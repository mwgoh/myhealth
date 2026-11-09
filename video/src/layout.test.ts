import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORY_LABEL as APP_LABEL, CATEGORIES } from "../../src/domain/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "./layout";

describe("앱과 같은 분류 표시", () => {
  it("분류 라벨이 앱 types.ts와 같다", () => {
    expect(CATEGORY_LABEL).toEqual(APP_LABEL);
  });

  it("분류 색이 앱 globals.css의 밝은 모드 색과 같다", () => {
    const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
    for (const c of CATEGORIES) {
      // 처음 나오는 정의가 밝은 모드(:root) 값이다
      const m = css.match(new RegExp(`--cat-${c}:\\s*(#[0-9a-fA-F]{6})`));
      expect(m?.[1]).toBe(CATEGORY_COLOR[c]);
    }
  });
});
