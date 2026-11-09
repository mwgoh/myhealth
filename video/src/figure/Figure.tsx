import { COLOR, STROKE } from "../layout";
import { SEG, type Pose, type Vec } from "./geometry";

const pts = (...ps: Vec[]) => ps.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

/** 옆에서 본 사람 그림. 먼 쪽 팔다리는 연하게, 가까운 쪽은 진하게 그린다. */
export function Figure({ pose }: { pose: Pose }) {
  const { hip, shoulder, neck, head, near, far } = pose;
  return (
    <g fill="none" stroke={COLOR.ink} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <g opacity={0.4}>
        <polyline points={pts(hip, far.knee, far.ankle, far.toe)} />
        <polyline points={pts(shoulder, far.elbow, far.hand)} />
      </g>
      <polyline points={pts(hip, near.knee, near.ankle, near.toe)} />
      <polyline points={pts(hip, shoulder, neck)} strokeWidth={STROKE + 4} />
      <polyline points={pts(shoulder, near.elbow, near.hand)} />
      <circle cx={head.x} cy={head.y} r={SEG.headR} fill={COLOR.ink} stroke="none" />
    </g>
  );
}
