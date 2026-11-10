/** 화면 좌표(px). y는 아래로 커진다. */
export type Vec = { x: number; y: number };

/** 마디 길이(px). 서 있을 때 키는 약 360px이다. */
export const SEG = {
  headR: 22,
  neck: 18,
  torso: 120,
  upperArm: 70,
  forearm: 62,
  thigh: 92,
  shin: 90,
  foot: 28,
} as const;

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
export const deg = (rad: number): number => (rad * 180) / Math.PI;
export const rad = (d: number): number => (d * Math.PI) / 180;

/** 각도(도, +x 기준, 위쪽이 +)의 단위 벡터. 화면은 y가 아래로 커지므로 y 부호를 뒤집는다. */
export function dir(degrees: number): Vec {
  const r = rad(degrees);
  return { x: Math.cos(r), y: -Math.sin(r) };
}

export const step = (p: Vec, degrees: number, length: number): Vec => add(p, scale(dir(degrees), length));

/** from에서 to를 보는 각도(도, +x 기준, 위쪽이 +) */
export const angleOf = (from: Vec, to: Vec): number => deg(Math.atan2(-(to.y - from.y), to.x - from.x));

/** 사인 곡선 ease-in-out. 0~1 밖의 값은 끝값으로 자른다. */
export const ease = (t: number): number => (1 - Math.cos(Math.PI * clamp(t, 0, 1))) / 2;

export type TwoBone = { mid: Vec; end: Vec; reached: boolean };

/**
 * 2관절 역기구학. 가운데 관절(팔꿈치·무릎)은 root→target 직선에서 hint 방향 쪽으로 접힌다.
 * 닿지 않는 거리면 목표 방향으로 쭉 편 팔다리를 돌려준다.
 */
export function solveTwoBone(root: Vec, target: Vec, l1: number, l2: number, hint: Vec): TwoBone {
  const d = dist(root, target);
  const u = d === 0 ? { x: 1, y: 0 } : scale(sub(target, root), 1 / d);
  if (d >= l1 + l2 || d <= Math.abs(l1 - l2)) {
    const mid = add(root, scale(u, l1));
    return { mid, end: add(mid, scale(u, l2)), reached: Math.abs(d - (l1 + l2)) < 1e-9 };
  }
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const perp = { x: -u.y, y: u.x };
  const side = perp.x * hint.x + perp.y * hint.y >= 0 ? 1 : -1;
  const mid = add(add(root, scale(u, along)), scale(perp, side * h));
  return { mid, end: { ...target }, reached: true };
}

/** 각 마디의 절대 각도(도). 몸통은 엉덩이→어깨, 팔다리는 몸쪽→끝쪽 방향이다. */
export type Angles = {
  torso: number;
  head: number;
  nearUpperArm: number;
  nearForearm: number;
  farUpperArm: number;
  farForearm: number;
  nearThigh: number;
  nearShin: number;
  nearFoot: number;
  farThigh: number;
  farShin: number;
  farFoot: number;
};

export type Limbs = { elbow: Vec; hand: Vec; knee: Vec; ankle: Vec; toe: Vec };

/**
 * neck은 목 위끝(머리 아래), head는 머리 중심이다. near는 가까운 쪽, far는 먼 쪽 팔다리다.
 * spineBend는 등을 휘어 그릴 때 몸통 가운데가 엉덩이→어깨 직선에서 벗어나는 거리(px)다.
 * 양수면 등 쪽(몸통 방향 +90°)으로 둥글게, 음수면 배 쪽으로 처진다. 관절 위치에는 영향이 없다.
 */
export type Pose = { hip: Vec; shoulder: Vec; neck: Vec; head: Vec; near: Limbs; far: Limbs; spineBend?: number };

export type Side = "near" | "far";

export function lerpAngles(a: Angles, b: Angles, t: number): Angles {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Angles)[]) out[k] = lerp(a[k], b[k], t);
  return out;
}

/** 두 각도 사이를 짧은 쪽으로 돈다(170° → -170°는 20°만 돈다) */
export function lerpAngleShortest(a: number, b: number, t: number): number {
  const diff = ((((b - a) % 360) + 540) % 360) - 180;
  return a + diff * t;
}

export function lerpAnglesShortest(a: Angles, b: Angles, t: number): Angles {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Angles)[]) out[k] = lerpAngleShortest(a[k], b[k], t);
  return out;
}

/** 자세에서 마디 각도를 거꾸로 읽는다. IK로 만든 자세를 키프레임으로 저장할 때 쓴다. */
export function anglesOf(p: Pose): Angles {
  return {
    torso: angleOf(p.hip, p.shoulder),
    head: angleOf(p.shoulder, p.neck),
    nearUpperArm: angleOf(p.shoulder, p.near.elbow),
    nearForearm: angleOf(p.near.elbow, p.near.hand),
    farUpperArm: angleOf(p.shoulder, p.far.elbow),
    farForearm: angleOf(p.far.elbow, p.far.hand),
    nearThigh: angleOf(p.hip, p.near.knee),
    nearShin: angleOf(p.near.knee, p.near.ankle),
    nearFoot: angleOf(p.near.ankle, p.near.toe),
    farThigh: angleOf(p.hip, p.far.knee),
    farShin: angleOf(p.far.knee, p.far.ankle),
    farFoot: angleOf(p.far.ankle, p.far.toe),
  };
}

/** 가까운 쪽과 먼 쪽 팔다리를 바꾼다. 좌우를 번갈아 하는 동작에 쓴다. */
export const swapSides = (p: Pose): Pose => ({ ...p, near: p.far, far: p.near });

function limbs(hip: Vec, shoulder: Vec, upper: number, fore: number, thigh: number, shin: number, foot: number): Limbs {
  const elbow = step(shoulder, upper, SEG.upperArm);
  const knee = step(hip, thigh, SEG.thigh);
  const ankle = step(knee, shin, SEG.shin);
  return {
    elbow,
    hand: step(elbow, fore, SEG.forearm),
    knee,
    ankle,
    toe: step(ankle, foot, SEG.foot),
  };
}

/** 정기구학: 엉덩이 위치와 마디 각도로 모든 관절을 계산한다 */
export function poseFromAngles(hip: Vec, a: Angles): Pose {
  const shoulder = step(hip, a.torso, SEG.torso);
  const neck = step(shoulder, a.head, SEG.neck);
  return {
    hip,
    shoulder,
    neck,
    head: step(neck, a.head, SEG.headR),
    near: limbs(hip, shoulder, a.nearUpperArm, a.nearForearm, a.nearThigh, a.nearShin, a.nearFoot),
    far: limbs(hip, shoulder, a.farUpperArm, a.farForearm, a.farThigh, a.farShin, a.farFoot),
  };
}

const moveLimbs = (l: Limbs, d: Vec): Limbs => ({
  elbow: add(l.elbow, d),
  hand: add(l.hand, d),
  knee: add(l.knee, d),
  ankle: add(l.ankle, d),
  toe: add(l.toe, d),
});

export function translate(p: Pose, d: Vec): Pose {
  return {
    ...p,
    hip: add(p.hip, d),
    shoulder: add(p.shoulder, d),
    neck: add(p.neck, d),
    head: add(p.head, d),
    near: moveLimbs(p.near, d),
    far: moveLimbs(p.far, d),
  };
}

/** pick이 고른 관절(기준점)이 target에 오도록 자세 전체를 옮긴다 */
export const anchorAt = (p: Pose, pick: (p: Pose) => Vec, target: Vec): Pose => translate(p, sub(target, pick(p)));

/** 손이 handTarget에 닿도록 그쪽 팔을 다시 계산한다 */
export function armIK(p: Pose, side: Side, handTarget: Vec, hint: Vec): Pose {
  const r = solveTwoBone(p.shoulder, handTarget, SEG.upperArm, SEG.forearm, hint);
  return { ...p, [side]: { ...p[side], elbow: r.mid, hand: r.end } };
}

/** 발목이 ankleTarget에 닿도록 그쪽 다리를 다시 계산하고, 발은 footDeg 방향으로 둔다 */
export function legIK(p: Pose, side: Side, ankleTarget: Vec, hint: Vec, footDeg: number): Pose {
  const r = solveTwoBone(p.hip, ankleTarget, SEG.thigh, SEG.shin, hint);
  return { ...p, [side]: { ...p[side], knee: r.mid, ankle: r.end, toe: step(r.end, footDeg, SEG.foot) } };
}

/** 마디마다 [시작 관절, 끝 관절, 정의한 길이] */
export function segments(p: Pose): [Vec, Vec, number][] {
  const out: [Vec, Vec, number][] = [
    [p.hip, p.shoulder, SEG.torso],
    [p.shoulder, p.neck, SEG.neck],
    [p.neck, p.head, SEG.headR],
  ];
  for (const l of [p.near, p.far]) {
    out.push(
      [p.shoulder, l.elbow, SEG.upperArm],
      [l.elbow, l.hand, SEG.forearm],
      [p.hip, l.knee, SEG.thigh],
      [l.knee, l.ankle, SEG.shin],
      [l.ankle, l.toe, SEG.foot],
    );
  }
  return out;
}

/**
 * 바닥 검사용 점: 모든 관절과 머리 아래끝.
 * headInset만큼 머리 아래끝을 올려 잡는다. 팔다리는 선 두께의 절반이 바닥 쪽으로 나오므로,
 * 같은 값을 주면 바닥에 누운 머리와 팔다리가 같은 기준으로 바닥에 닿는다.
 */
export function lowPoints(p: Pose, headInset = 0): Vec[] {
  const pts = [p.hip, p.shoulder, p.neck, { x: p.head.x, y: p.head.y + SEG.headR - headInset }];
  for (const l of [p.near, p.far]) pts.push(l.elbow, l.hand, l.knee, l.ankle, l.toe);
  return pts;
}
