import type { ExerciseVideoDef } from "../exercises/types";
import type { Paint, Shape } from "../exercises/shapes";
import { SCALE_CX } from "../exercises/helpers";
import { Figure } from "../figure/Figure";
import { COLOR, FLOOR_LINE_WIDTH, FLOOR_LINE_Y, GROUND_Y, SIZE } from "../layout";

const PAINT: Record<Exclude<Paint, "accent">, string> = {
  ink: COLOR.ink,
  muted: COLOR.muted,
  equip: COLOR.equip,
  equipDark: COLOR.equipDark,
  hub: COLOR.hub,
  water: COLOR.water,
};

function ShapeView({ shape, accent }: { shape: Shape; accent: string }) {
  const color = (p?: Paint) => (p === undefined ? "none" : p === "accent" ? accent : PAINT[p]);
  const style = { fill: color(shape.fill), stroke: color(shape.stroke), strokeWidth: shape.width ?? 0, opacity: shape.opacity };
  switch (shape.kind) {
    case "circle":
      return <circle cx={shape.c.x} cy={shape.c.y} r={shape.r} {...style} />;
    case "line":
      return <line x1={shape.a.x} y1={shape.a.y} x2={shape.b.x} y2={shape.b.y} strokeLinecap="round" {...style} />;
    case "rect":
      return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.radius ?? 0} {...style} />;
    case "path":
      return <path d={shape.d} strokeLinecap="round" strokeLinejoin="round" {...style} />;
  }
}

/** 바닥·기구·사람 그림. 720×720 좌표계의 <g>라 영상과 자세 확인 시트가 함께 쓴다. */
export function StageContent({ def, frame, accent }: { def: ExerciseVideoDef; frame: number; accent: string }) {
  const pose = def.pose(frame);
  const shapes = def.props?.(frame, pose) ?? [];
  const s = def.scale ?? 1;
  // 바닥선 위 SCALE_CX를 중심으로 줄여, 바닥에 닿은 관절은 그대로 바닥선에 닿는다
  const transform = s === 1 ? undefined : `translate(${SCALE_CX} ${GROUND_Y}) scale(${s}) translate(${-SCALE_CX} ${-GROUND_Y})`;
  return (
    <g>
      {def.floor !== false && (
        <line x1={40} x2={SIZE - 40} y1={FLOOR_LINE_Y} y2={FLOOR_LINE_Y} stroke={COLOR.muted} strokeWidth={FLOOR_LINE_WIDTH} strokeLinecap="round" />
      )}
      <g transform={transform}>
        {shapes.filter((x) => !x.front).map((x, i) => (
          <ShapeView key={`b${i}`} shape={x} accent={accent} />
        ))}
        <Figure pose={pose} view={def.view} armsBehind={def.armsBehind?.(frame)} />
        {shapes.filter((x) => x.front).map((x, i) => (
          <ShapeView key={`f${i}`} shape={x} accent={accent} />
        ))}
      </g>
    </g>
  );
}
