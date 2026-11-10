import type { Vec } from "../figure/geometry";

/** 소품 색. accent는 분류 색이다. 실제 색은 scenes/Stage.tsx가 정한다. */
export type Paint = "accent" | "ink" | "muted" | "equip" | "equipDark" | "hub" | "water";

type Style = { fill?: Paint; stroke?: Paint; width?: number; opacity?: number; /** 사람 그림 위에 그린다 */ front?: boolean };

export type Shape = Style &
  (
    | { kind: "circle"; c: Vec; r: number }
    | { kind: "line"; a: Vec; b: Vec }
    | { kind: "rect"; x: number; y: number; w: number; h: number; radius?: number }
    | { kind: "path"; d: string }
  );

/** 옆에서 본 바벨: 막대는 보이지 않고 원판만 보인다 */
export const barbell = (c: Vec): Shape[] => [
  { kind: "circle", c, r: 44, fill: "accent" },
  { kind: "circle", c, r: 9, fill: "hub" },
];

/** 옆에서 본 덤벨 원판 */
export const dumbbell = (c: Vec, front = false): Shape[] => [
  { kind: "circle", c, r: 15, fill: "accent", front },
  { kind: "circle", c, r: 5, fill: "hub", front },
];

/** 기구의 판·기둥 */
export const block = (x: number, y: number, w: number, h: number, paint: Paint = "equip"): Shape => ({
  kind: "rect",
  x,
  y,
  w,
  h,
  radius: Math.min(6, w / 2, h / 2),
  fill: paint,
});

/** 기구의 막대·프레임 */
export const beam = (a: Vec, b: Vec, width = 10, paint: Paint = "equip"): Shape => ({ kind: "line", a, b, stroke: paint, width });

/** 손으로 잡는 손잡이 끝 */
export const grip = (c: Vec, r = 8): Shape => ({ kind: "circle", c, r, fill: "hub", front: true });
