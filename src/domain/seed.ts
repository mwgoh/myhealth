import type { Category, Exercise, MeasureKind, Store } from "./types";

export type Guide = { target: string; tip: string };

type SeedRow = [id: string, name: string, kind: MeasureKind, category: Category, target: string, tip: string];

// 설계 문서 5절 표를 그대로 옮긴다. 순서도 표와 같다.
const ROWS: SeedRow[] = [
  // #근력운동
  ["seed-bench-press", "벤치프레스", "weighted", "strength", "가슴·삼두", "견갑을 모으고 바를 가슴 중앙으로 내린다"],
  ["seed-squat", "스쿼트", "weighted", "strength", "허벅지·둔근", "무릎은 발끝 방향, 허리를 편 채 허벅지가 바닥과 평행할 때까지"],
  ["seed-deadlift", "데드리프트", "weighted", "strength", "등·둔근·햄스트링", "바를 정강이에 붙이고 허리를 편 채 엉덩이로 밀어 올린다"],
  ["seed-overhead-press", "오버헤드프레스", "weighted", "strength", "어깨·삼두", "갈비뼈를 내리고 복부에 힘을 준 채 머리 위로 곧게 민다"],
  ["seed-barbell-row", "바벨로우", "weighted", "strength", "등", "상체를 45도 숙이고 바를 배꼽 쪽으로 당긴다"],
  ["seed-lat-pulldown", "랫풀다운", "weighted", "strength", "광배·이두", "가슴을 들고 바를 쇄골 쪽으로 당긴다"],
  ["seed-leg-press", "레그프레스", "weighted", "strength", "허벅지·둔근", "무릎을 끝까지 펴서 잠그지 말고, 허리가 등판에서 뜨지 않게 한다"],
  ["seed-dumbbell-curl", "덤벨컬", "weighted", "strength", "이두", "팔꿈치를 몸통 옆에 고정하고 반동 없이 올린다"],
  // #맨몸운동
  ["seed-push-up", "푸시업", "reps", "bodyweight", "가슴·삼두", "머리부터 발끝까지 일직선, 팔꿈치는 몸통과 45도"],
  ["seed-pull-up", "풀업", "reps", "bodyweight", "등·이두", "견갑을 먼저 끌어내리고 턱이 바 위로 올라올 때까지"],
  ["seed-dips", "딥스", "reps", "bodyweight", "가슴 하부·삼두", "어깨가 팔꿈치보다 아래로 내려가지 않는 범위까지"],
  ["seed-air-squat", "맨몸 스쿼트", "reps", "bodyweight", "허벅지·둔근", "뒤꿈치를 바닥에 붙이고 의자에 앉듯이 내려간다"],
  ["seed-lunge", "런지", "reps", "bodyweight", "허벅지·둔근", "앞 무릎 90도, 좌우를 번갈아 하면 합계 횟수로 적는다"],
  ["seed-burpee", "버피", "reps", "bodyweight", "전신", "가슴을 바닥에 댔다가 일어나 점프하는 것까지 1회"],
  ["seed-pike-push-up", "파이크 푸시업", "reps", "bodyweight", "어깨", "엉덩이를 높이 들어 ㅅ자를 만들고 정수리를 손 사이로 내린다"],
  ["seed-glute-bridge", "글루트 브릿지", "reps", "bodyweight", "둔근·햄스트링", "맨 위에서 엉덩이를 1초 조인다"],
  ["seed-wall-sit", "월싯", "timed", "bodyweight", "허벅지", "무릎 90도, 등을 벽에 완전히 붙인다"],
  // #코어운동
  ["seed-plank", "플랭크", "timed", "core", "복부 전체", "엉덩이가 처지거나 솟지 않게 일직선을 유지한다"],
  ["seed-side-plank", "사이드 플랭크", "timed", "core", "옆구리", "골반을 들어 일직선, 한쪽을 한 세트로 적는다"],
  ["seed-hollow-hold", "할로우 홀드", "timed", "core", "복부", "허리를 바닥에 붙인 채 팔다리를 들어 바나나 모양을 만든다"],
  ["seed-crunch", "크런치", "reps", "core", "복직근 상부", "목이 아니라 복부 힘으로 견갑까지만 들어 올린다"],
  ["seed-leg-raise", "레그레이즈", "reps", "core", "복직근 하부", "허리가 뜨지 않는 범위에서 다리를 천천히 내린다"],
  ["seed-dead-bug", "데드버그", "reps", "core", "심부 코어", "허리를 바닥에 붙인 채 반대쪽 팔과 다리를 뻗는다, 좌우 합계"],
  ["seed-bird-dog", "버드독", "reps", "core", "허리 안정", "네 발 자세에서 반대쪽 팔다리를 뻗고 2초 버틴다, 좌우 합계"],
  ["seed-russian-twist", "러시안 트위스트", "reps", "core", "옆구리", "상체를 뒤로 기울이고 좌우로 비튼다, 좌우 합계"],
  ["seed-mountain-climber", "마운틴 클라이머", "reps", "core", "코어·전신", "플랭크 자세를 유지하며 무릎을 가슴으로 당긴다, 좌우 합계"],
  // #스트레칭
  ["seed-hamstring-stretch", "햄스트링 스트레칭", "timed", "stretching", "허벅지 뒤", "허리를 편 채 고관절부터 숙인다"],
  ["seed-quad-stretch", "대퇴사두 스트레칭", "timed", "stretching", "허벅지 앞", "선 자세에서 발목을 잡고 무릎이 아래를 향하게 한다"],
  ["seed-hip-flexor-stretch", "고관절 굴곡근 스트레칭", "timed", "stretching", "고관절 앞", "런지 자세에서 엉덩이를 조이며 골반을 앞으로 민다"],
  ["seed-pigeon-pose", "비둘기 자세", "timed", "stretching", "둔근·고관절", "앞 정강이를 몸 앞에 가로로 두고 상체를 천천히 숙인다"],
  ["seed-calf-stretch", "종아리 스트레칭", "timed", "stretching", "종아리", "벽을 밀며 뒤쪽 발뒤꿈치를 바닥에 붙인다"],
  ["seed-chest-stretch", "가슴 스트레칭", "timed", "stretching", "가슴·어깨 앞", "문틀에 팔을 걸치고 몸을 앞으로 기울인다"],
  ["seed-shoulder-stretch", "어깨 스트레칭", "timed", "stretching", "어깨 뒤", "팔을 몸 앞으로 가로질러 반대 팔로 당긴다"],
  ["seed-triceps-stretch", "삼두 스트레칭", "timed", "stretching", "팔 뒤", "팔꿈치를 머리 뒤로 접고 반대 손으로 누른다"],
  ["seed-cat-cow", "고양이-소 자세", "timed", "stretching", "척추", "숨을 마시며 등을 내리고, 내쉬며 둥글게 만다"],
  ["seed-childs-pose", "아이 자세", "timed", "stretching", "등·허리", "무릎을 꿇고 엉덩이를 뒤꿈치에 댄 채 팔을 앞으로 뻗는다"],
  // #유산소
  ["seed-running", "러닝", "cardio", "cardio", "심폐·하체", "대화가 가능한 강도를 기본으로 한다"],
  ["seed-walking", "걷기", "cardio", "cardio", "심폐", "팔을 자연스럽게 흔들며 빠른 걸음으로 걷는다"],
  ["seed-cycling", "사이클", "cardio", "cardio", "심폐·허벅지", "페달이 가장 아래일 때 무릎이 살짝 굽는 안장 높이"],
  ["seed-rowing", "로잉", "cardio", "cardio", "심폐·등·하체", "다리 → 허리 → 팔 순서로 당긴다"],
  ["seed-swimming", "수영", "cardio", "cardio", "심폐·전신", "거리는 km로 적는다 (1500m → 1.5)"],
  ["seed-jump-rope", "줄넘기", "cardio", "cardio", "심폐·종아리", "앞꿈치로 낮게 뛴다"],
];

export const SEED_EXERCISES: readonly Exercise[] = ROWS.map(([id, name, kind, category]) =>
  Object.freeze({ id, name, kind, category, archived: false }),
);

export const GUIDES: Readonly<Record<string, Guide>> = Object.fromEntries(
  ROWS.map(([id, , , , target, tip]) => [id, { target, tip }]),
);

export const GUIDE_NOTE = "반동 없이 천천히, 통증이 느껴지면 멈추세요.";
export const STRETCH_NOTE = "한 동작을 20~30초 유지하고, 아픈 지점이 아니라 당기는 느낌이 드는 지점까지만.";

export function getGuide(exerciseId: string): Guide | undefined {
  return Object.hasOwn(GUIDES, exerciseId) ? GUIDES[exerciseId] : undefined;
}

export function createInitialStore(): Store {
  return { version: 1, exercises: SEED_EXERCISES.map((e) => ({ ...e })), workouts: [] };
}
