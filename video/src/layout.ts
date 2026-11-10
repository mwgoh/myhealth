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
  // 기구(벤치·머신·벽)는 사람 그림보다 연하게
  equip: "#b8bec6",
  equipDark: "#8f979f",
  water: "#cfe1ef",
} as const;

/**
 * 카운터 글자가 차지하는 영역. 사람 그림 관절이 들어오면 안 된다(테스트가 확인).
 * 오른쪽 정렬이라 글자 폭에 따라 왼쪽 끝이 다르다: "10 / 10"은 약 240px, "0:30"·"준비"는 약 150px.
 */
export const COUNTER_BOX = { left: 410, right: 690, top: 240, bottom: 355 } as const;
export const COUNTER_BOX_SHORT = { ...COUNTER_BOX, left: 500 } as const;
/**
 * 제목 영역 아래끝. 사람 그림 관절은 이보다 아래에 있어야 한다(테스트가 확인).
 * 제목 글자는 위 36px + 이름 줄(44px×1.2) + 4px + 주요 부위 줄(26px×1.2) ≈ 124px에서 끝난다.
 */
export const HEADER_BOTTOM = 135;

/** 앱 globals.css의 밝은 모드 분류 색(바벨 원판 색)과 같다. layout.test.ts가 비교한다. */
export const CATEGORY_COLOR: Record<Category, string> = {
  strength: "#d7263d",
  kettlebell: "#e8590c",
  dumbbell: "#7048e8",
  bodyweight: "#1f5fbf",
  core: "#e0ac00",
  stretching: "#2e9e5b",
  cardio: "#8a939d",
};

/** 앱 types.ts의 CATEGORY_LABEL과 같다. types.ts는 zod를 불러오므로 영상 번들에서는 복사본을 쓴다. */
export const CATEGORY_LABEL: Record<Category, string> = {
  strength: "#근력운동",
  kettlebell: "#케틀벨",
  dumbbell: "#덤벨",
  bodyweight: "#맨몸운동",
  core: "#코어운동",
  stretching: "#스트레칭",
  cardio: "#유산소",
};

// 영상 속 한글은 Windows 시스템 글꼴로 그린다
export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
