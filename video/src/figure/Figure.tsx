import { COLOR, STROKE } from "../layout";
import { add, angleOf, dir, lerpVec, scale, SEG, type Pose, type Vec } from "./geometry";

const pts = (...ps: Vec[]) => ps.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
const n = (v: number) => v.toFixed(2);

type Props = {
  pose: Pose;
  /** front: 앞에서 본 그림이라 양쪽 팔다리를 같은 진하기로 그린다 */
  view?: "side" | "front";
  /** 팔이 몸 뒤로 넘어가 가려질 때 두 팔을 모두 연하게 몸통 뒤에 그린다 */
  armsBehind?: boolean;
};

/** 몸통. 등이 휘면 엉덩이→어깨를 2차 곡선으로 그린다(곡선 가운데가 spineBend만큼 벗어난다) */
function torsoPath(p: Pose): string {
  const bend = p.spineBend ?? 0;
  if (bend === 0) return `M ${n(p.hip.x)} ${n(p.hip.y)} L ${n(p.shoulder.x)} ${n(p.shoulder.y)}`;
  const back = dir(angleOf(p.hip, p.shoulder) + 90);
  const c = add(lerpVec(p.hip, p.shoulder, 0.5), scale(back, 2 * bend));
  return `M ${n(p.hip.x)} ${n(p.hip.y)} Q ${n(c.x)} ${n(c.y)} ${n(p.shoulder.x)} ${n(p.shoulder.y)}`;
}

/** 옆에서 본 사람 그림. 먼 쪽 팔다리는 연하게, 가까운 쪽은 진하게 그린다. */
export function Figure({ pose, view = "side", armsBehind = false }: Props) {
  const { hip, shoulder, neck, head, near, far } = pose;
  const farOpacity = view === "front" ? 1 : 0.4;
  const nearArm = <polyline points={pts(shoulder, near.elbow, near.hand)} />;
  return (
    <g fill="none" stroke={COLOR.ink} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <g opacity={farOpacity}>
        <polyline points={pts(hip, far.knee, far.ankle, far.toe)} />
        <polyline points={pts(shoulder, far.elbow, far.hand)} />
      </g>
      {armsBehind && <g opacity={0.4}>{nearArm}</g>}
      <polyline points={pts(hip, near.knee, near.ankle, near.toe)} />
      <path d={torsoPath(pose)} strokeWidth={STROKE + 4} />
      <polyline points={pts(shoulder, neck)} strokeWidth={STROKE + 4} />
      {!armsBehind && nearArm}
      <circle cx={head.x} cy={head.y} r={SEG.headR} fill={COLOR.ink} stroke="none" />
    </g>
  );
}
