import type { Category } from "../../src/domain/types";

export const SIZE = 720;
export const FPS = 30;

/** 바닥에 닿은 관절 중심의 y. 바닥선은 선 두께의 절반만큼 아래에 그린다. */
export const GROUND_Y = 540;
export const STROKE = 14;
export const FLOOR_LINE_WIDTH = 4;
export const FLOOR_LINE_Y = GROUND_Y + STROKE / 2 + FLOOR_LINE_WIDTH / 2;

export const COLOR = {
  bg: "#eef0f2",
  ink: "#1b1f24",
  muted: "#5e6670",
  track: "#d9dde2",
  hub: "#8a939d",
} as const;

/** 앱 globals.css의 밝은 모드 분류 색(바벨 원판 색)과 같다. layout.test.ts가 비교한다. */
export const CATEGORY_COLOR: Record<Category, string> = {
  strength: "#d7263d",
  bodyweight: "#1f5fbf",
  core: "#e0ac00",
  stretching: "#2e9e5b",
  cardio: "#8a939d",
};

/** 앱 types.ts의 CATEGORY_LABEL과 같다. types.ts는 zod를 불러오므로 영상 번들에서는 복사본을 쓴다. */
export const CATEGORY_LABEL: Record<Category, string> = {
  strength: "#근력운동",
  bodyweight: "#맨몸운동",
  core: "#코어운동",
  stretching: "#스트레칭",
  cardio: "#유산소",
};

// 영상 속 한글은 Windows 시스템 글꼴로 그린다
export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
