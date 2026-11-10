# 인터벌 타이머와 새 분류(#케틀벨·#덤벨) 구현 계획

> **에이전트 작업자용:** 이 계획은 작업 단위로 실행한다. 사용자가 구현을 바로 지시해 이 세션에서 직접 실행한다(superpowers:executing-plans 방식). 단계는 체크박스(`- [ ]`)로 진행 상황을 표시한다.

**목표:** 분류 `#케틀벨`·`#덤벨`과 종목 10개(영상 포함)를 더하고, 기존 데이터에 새 기본 종목을 채우며, 음성 안내가 있는 인터벌 타이머 탭을 만든다.

**구조:** 계산은 모두 순수 함수(`src/domain/timer.ts`, `timer-run.ts`, `seed.ts`)로 만들어 테스트를 먼저 쓴다. 브라우저 API(음성·소리·화면 꺼짐 방지)는 `src/timer/`에 모으고, 진행 중 타이머는 모듈 상태로 두어 화면을 벗어나도 이어간다. 화면은 `/timer` 한 페이지에서 쿼리 파라미터로 목록·편집·실행을 바꾼다.

**기술 스택:** Next.js 16.4(정적 내보내기), React 19, zod 4, Vitest 5, Web Speech API, Web Audio API, Screen Wake Lock API, Remotion 4.0.538(영상)

**설계 문서:** `docs/superpowers/specs/2026-11-10-interval-timer-design.md`

## 전역 제약

- 문서·주석·UI 문구는 한국어. 식별자·라이브러리명은 영문.
- `output: 'export'`: 서버 기능 금지. `useSearchParams`는 `<Suspense>` 안에서.
- 날짜·시간 문자열은 `src/domain/date.ts` 함수로만.
- `window.localStorage`는 `src/storage/browser-store.ts`에서만. `speechSynthesis`·`AudioContext`·`navigator.wakeLock`은 `src/timer/`에서만.
- 숫자 입력은 `type="text"` + `inputMode="numeric"`, 글자 16px 이상(`text-base`), 누를 수 있는 요소 44px 이상(`min-h-11`).
- `alert`·`confirm` 대신 `ConfirmDialog`. `eslint-disable` 금지.
- 저장 형식은 선택 필드·분류 값 추가만(예전 데이터·백업 호환). `version`은 1 그대로.
- Windows Bash에서 vitest는 `cd D:/myhealth[/video]`(대문자 드라이브)로 실행.
- 커밋은 사용자가 요청할 때만(계획의 커밋 단계는 생략하고 마지막에 묻는다).

## 리뷰 중점

1. **다른 앱에 갔다 오면 그사이 안내가 한꺼번에 나오면 안 된다.** → 작업 5 `cuesBetween` "1.5초 넘게 지나면 버린다" 테스트
2. **틱 경계에서 같은 안내가 두 번 나오면 안 된다.** → 작업 5 `cuesBetween` (prev, now] 반열린 구간 테스트(연속 호출 합이 한 번 호출과 같음)
3. **준비 0초·휴식 0초 설정에서 빈 구간이 생기거나 3-2-1이 겹치면 안 된다.** → 작업 5 `buildSegments` 0초 구간 제외, 4초 미만 구간 3-2-1 없음 테스트
4. **기존 데이터에 새 기본 종목을 채울 때 사용자가 같은 이름으로 만든 종목과 중복되면 안 된다.** → 작업 3 `syncSeedExercises` 같은 이름 건너뛰기 테스트
5. **타이머에 쓰인 종목을 지우면 저장 데이터가 손상 판정돼 앱이 잠기면 안 된다.** → 작업 6 `checkExerciseDelete` 타이머 사용 거부 테스트

---

### 작업 1: 분류 2개 추가

**파일:**
- 수정: `src/domain/types.ts`(`CATEGORIES`, `CATEGORY_LABEL`), `src/domain/exercises.ts`(`DEFAULT_KIND`), `src/app/globals.css`(색 변수 밝은·어두운·`@theme`), `src/components/CategoryChip.tsx`(`CATEGORY_DOT`), `src/components/MonthGrid.tsx`(점 5px·간격 2px), `video/src/layout.ts`(`CATEGORY_COLOR`, `CATEGORY_LABEL`)
- 테스트: `src/domain/exercises.test.ts`, `video/src/layout.test.ts`(기존 비교 테스트가 그대로 검사)

**인터페이스:**
- 만든다: `Category`에 `"kettlebell"`, `"dumbbell"`. 순서 `["strength","kettlebell","dumbbell","bodyweight","core","stretching","cardio"]`. 라벨 `#케틀벨`, `#덤벨`. 색 kettlebell `#e8590c`/어두운 `#ff8a3d`, dumbbell `#7048e8`/어두운 `#9775fa`.

- [ ] 테스트: `defaultKindFor("kettlebell")`·`defaultKindFor("dumbbell")`이 `"weighted"`, `CATEGORIES.length === 7`
- [ ] 실패 확인 → 구현(위 파일들) → `npm test`, `npx tsc --noEmit`, 영상 `npm test`(layout.test 통과) 확인

### 작업 2: 새 기본 종목 10개와 덤벨컬 이동

**파일:** 수정 `src/domain/seed.ts`(`ROWS`), 테스트 `src/domain/seed.test.ts`

**인터페이스:** 만든다: 설계 6절 표의 ID·이름·주요 부위·핵심 포인트 그대로. `ROWS` 순서는 분류 순서(근력 7 → 케틀벨 5 → 덤벨 6 → 맨몸 9 → 코어 9 → 스트레칭 10 → 유산소 6). 덤벨컬은 `#덤벨`의 첫 종목.

- [ ] 테스트: 기본 종목 52개, 분류별 개수(근력 7·케틀벨 5·덤벨 6), `seed-dumbbell-curl`의 분류가 `dumbbell`, 새 10개 모두 `weighted`이고 가이드가 있음(기존 ID 중복·가이드 테스트는 그대로)
- [ ] 실패 확인 → `ROWS` 수정 → 통과 확인. 영상 프로젝트의 "기본 종목 순서와 같다" 테스트는 작업 4에서 맞춘다(그때까지 실패가 정상)

### 작업 3: 기존 데이터에 새 기본 종목 채우기

**파일:** 수정 `src/domain/seed.ts`, `src/storage/store.ts`(`load`, `replaceAll`); 테스트 `src/domain/seed.test.ts`, `src/storage/store.test.ts`

**인터페이스:**
- 만든다: `syncSeedExercises(store: Store): Store` — 바뀐 것이 없으면 같은 객체.
- `load()`: 파싱이 성공하면 `syncSeedExercises` 결과가 다를 때 `persist`. `replaceAll(next)`: `persist(syncSeedExercises(next))`.

- [ ] 테스트(seed): 빠진 기본 종목을 끝에 더함 / 같은 이름(공백·대소문자 무시)의 직접 만든 종목이 있으면 그 기본 종목은 더하지 않음 / 기존 기본 종목은 분류만 코드에 맞추고 이름·측정 방식·숨김은 그대로 / 바뀐 것 없으면 `toBe(같은 객체)`
- [ ] 테스트(store): 예전 형식(42개, 덤벨컬이 strength)을 넣고 `load()` → 52개, 덤벨컬 dumbbell, 저장소에도 기록됨 / 이미 최신이면 `setItem`을 부르지 않음 / corrupt면 바꾸지 않음
- [ ] 실패 확인 → 구현 → 통과 확인

### 작업 4: 새 종목 영상

**파일:** 생성 `video/src/exercises/{kbswing,kbgobletsquat,kbdeadlift,kbrow,kbpress,dbshoulderpress,dbbenchpress,dbrow,dblateralraise,dbkickback}.ts`; 수정 `video/src/exercises/shapes.ts`(`kettlebell`), `video/src/exercises/index.ts`(seed 순서), `video/src/exercises/exercises.test.ts`; 결과 `public/videos/*.mp4` 11개(덤벨컬 포함)

**인터페이스:**
- 만든다: `kettlebell(hand: Vec, front?: boolean): Shape[]` — 손잡이 고리(지름 14, 테두리 hub)와 몸통(반지름 15, 분류 색)이 손 아래 18px.
- 각 종목은 `ExerciseVideoDef`. 반복 10회, 케틀벨 스윙만 15회 × (30+30프레임). 원암 동작은 가까운 쪽 팔만 움직이고 먼 쪽 팔은 무릎·벤치를 짚거나 늘어뜨림. 래터럴 레이즈는 `view: "front"`.

- [ ] 테스트(종목별 제약): 스윙·고블릿·데드리프트·프레스·숄더프레스·킥백·래터럴 = 두 발목 고정 / 케틀벨 데드리프트 시작 시 벨이 바닥에 닿음 / 원암 로우 = 받치는 손·무릎(벤치) 고정 / 덤벨 벤치프레스 = 엉덩이 고정·두 손이 같은 수직선 / 킥백 = 위팔 각도 고정 / 래터럴 = 맨 위에서 두 손이 어깨 높이(±10px). 공통 테스트(마디 길이·바닥·글자 영역)는 자동 적용
- [ ] 실패 확인 → 정의 작성 → 영상 `npm test` 통과 → `npm run stills`로 시트를 눈으로 확인하고 고침
- [ ] `npm run render -- <새 ID 10개> seed-dumbbell-curl` → 11개 모두 "통과"
- [ ] 앱 `npm test`(영상 목록과 파일 일치) 통과

### 작업 5: 타이머 계산(순수 함수)

**파일:** 생성 `src/domain/timer.ts`, `src/domain/timer.test.ts`

**인터페이스(만든다):**
```ts
type TimerPlan = { id; name; prepSec; workSec; restSec; rounds; roundRestSec; exerciseIds: string[] }
const TIMER_LIMITS = { prepSec:{0,600}, workSec:{5,3600}, restSec:{0,3600}, rounds:{1,50}, roundRestSec:{0,3600}, nameMax:30, exercisesMax:20 }
const TIMER_PRESETS: readonly TimerPlan[]          // 설계 2절 표 6개, id는 "preset-…"
newTimerPlan(id: string): TimerPlan                // 기본값 "내 타이머" 10/30/10×3, 라운드 휴식 60, 종목 없음
type TimerField = "name"|"prepSec"|"workSec"|"restSec"|"rounds"|"roundRestSec"|"exerciseIds"
checkTimerPlan(p: TimerPlan): TimerField[]         // 범위를 벗어난 칸(없으면 [])
type Segment = { kind: "prep"|"work"|"rest"|"roundRest"; sec: number; startSec: number; round: number; index: number; exerciseId?: string; nextExerciseId?: string }
buildSegments(p: TimerPlan): Segment[]             // round 1부터, index는 라운드 안 종목 순서(0부터)
totalSec(segments: Segment[]): number
type Position = { segmentIndex: number; remainingSec: number; done: boolean }   // remainingSec는 올림
positionAt(segments: Segment[], elapsedMs: number): Position
type Cue = { atMs: number; speech?: string; beep?: "short"|"long" }
cuesBetween(segments, nameOf: (id: string) => string, prevMs: number, nowMs: number): Cue[]
timerSummary(p: TimerPlan): string                 // "40초 운동 · 20초 휴식 · 3라운드 · 4종목 · 약 13분"
```

- [ ] 테스트: 
  - `buildSegments(기본값)` → prep10, work30, rest10, work30, rest10, work30, `totalSec` 120 / 서킷(4종목, 40/20×3, 라운드 휴식 60) `totalSec` 790, 라운드 사이는 `roundRest` / prep 0·rest 0이면 그 구간 없음 / 마지막 구간은 work
  - `positionAt`: 0ms → 0번 구간 남은 10, 9999ms → 남은 1, 10000ms → 1번 구간 남은 30, 총 시간 이상 → done
  - `cuesBetween`: 운동 시작 "시작"+긴 삐, 서킷 "스쿼트 시작", 휴식 "휴식. 다음은 푸시업", 라운드 휴식 "라운드 휴식. 다음은 2라운드", 마지막 라운드 첫 운동 "마지막 라운드. … 시작", 절반(운동 20초 이상만), 마지막 3초 "3"/"2"/"1"+짧은 삐(구간 4초 이상만), 끝 "운동 끝. 수고하셨습니다"+긴 삐 / (0,1000]+(1000,2000] 결과 = (0,2000] 결과 / now−prev > 1500이면 [] 
  - `checkTimerPlan`: 운동 4초·세트 0·이름 공백·종목 21개가 각각 해당 칸 / 프리셋 6개는 모두 [] / 프리셋 종목 ID가 모두 기본 종목
  - `timerSummary`: 기본값 `"30초 운동 · 10초 휴식 · 3세트 · 약 2분"`, 전신 서킷 `"40초 운동 · 20초 휴식 · 3라운드 · 4종목 · 약 13분"`
- [ ] 실패 확인 → 구현 → 통과 확인

### 작업 6: 타이머 저장(스키마·저장소·백업·삭제 규칙)

**파일:** 수정 `src/domain/types.ts`(`timerPlanSchema`, `storeSchema.timers` 선택, `checkReferences`), `src/domain/exercises.ts`(`checkExerciseDelete`), `src/storage/store.ts`; 테스트 `types.test.ts`, `exercises.test.ts`, `store.test.ts`, `backup.test.ts`

**인터페이스:**
- 소비: 작업 5의 `TimerPlan`, `TIMER_LIMITS`
- 만든다: `WorkoutStore.saveTimer(plan: TimerPlan): WriteResult`(같은 id면 교체, 없으면 추가), `WorkoutStore.deleteTimer(id: string): WriteResult`. `DeleteCheck`의 `in-use`에 `timers: number` 추가(기록 수는 `uses`).

- [ ] 테스트: 타이머 없는 예전 데이터 통과 / 타이머 있는 데이터 통과 / 없는 종목을 가리키는 타이머 → `unknown-exercise` / `saveTimer` 추가·교체·저장소 기록 / `deleteTimer` / 타이머에 쓰인 직접 추가 종목 삭제 → `{ ok:false, reason:"in-use", uses:0, timers:1 }` / 백업 왕복에 타이머 포함
- [ ] 실패 확인 → 구현(`ExerciseManager` 삭제 안내 문구에 타이머 수 반영) → 통과 확인

### 작업 7: 진행 상태 기계(순수)와 브라우저 모듈

**파일:** 생성 `src/domain/timer-run.ts`, `src/domain/timer-run.test.ts`, `src/timer/speech.ts`, `src/timer/beep.ts`, `src/timer/wake-lock.ts`, `src/timer/session.ts`

**인터페이스(만든다):**
```ts
// timer-run.ts (순수)
type RunState = { elapsedMs: number; running: boolean }
skipNext(segments, s: RunState): RunState          // 지금 구간 끝(마지막이면 총 시간)으로
skipPrev(segments, s: RunState): RunState          // 구간 시작 후 2000ms 안이면 앞 구간 시작, 아니면 지금 구간 시작
// speech.ts
speechAvailable(): boolean                         // 한국어 음성이 있는가
speak(text: string): void                          // 앞 말을 끊고 말한다(ko-KR)
// beep.ts
unlockAudio(): void                                // 시작 버튼에서 부른다
beep(kind: "short" | "long"): void                 // 880Hz 0.12초 / 1320Hz 0.4초
// wake-lock.ts
requestWakeLock(): Promise<boolean>; releaseWakeLock(): void
// session.ts (모듈 상태, useSyncExternalStore로 구독)
type Session = { plan: TimerPlan; segments: Segment[]; state: RunState; voice: boolean; beep: boolean } | null
getSession(); subscribeSession(l); startSession(plan); pauseSession(); resumeSession(); skip("next"|"prev"); stopSession(); setSound({voice?, beep?}); tick(nowMs)  // tick이 elapsed를 더하고 cuesBetween으로 소리를 낸다
```

- [ ] 테스트(timer-run): `skipNext` 구간 중간 → 다음 구간 시작, 마지막 구간 → done 위치 / `skipPrev` 구간 시작 1초 후 → 앞 구간 시작, 5초 후 → 지금 구간 시작, 첫 구간 → 0
- [ ] 실패 확인 → 구현 → 통과. 브라우저 모듈은 수동 확인(작업 9)

### 작업 8: 화면(탭·목록·편집·실행)

**파일:** 수정 `src/components/BottomNav.tsx`(5탭: 기록·달력·타이머·요약·설정); 생성 `src/app/timer/page.tsx`, `src/components/TimerList.tsx`, `src/components/TimerEditor.tsx`, `src/components/TimerRun.tsx`

**인터페이스:**
- 소비: 작업 5~7 전부, 기존 `ExercisePicker`(`addedIds`, 여러 개 선택), `ExerciseGuide`의 영상(`guideVideoSrc`), `ConfirmDialog`
- `/timer` 쿼리: 없음 → 목록, `?edit=<id|new>` → 편집(프리셋 id면 복사본), `?run=<id>` → 실행. 실행 화면이 사라질 때(언마운트) 진행 중이면 `pauseSession()`.

- [ ] 목록: 이어하기(세션이 있고 끝나지 않았을 때), + 새 타이머, 내 타이머, 기본 프리셋, 요약 문구, 펼침 버튼(시작/편집/복사/삭제 · 프리셋은 시작/복사)
- [ ] 편집: −/+ 숫자 칸(초 5씩, 세트 1씩), 종목 목록(↑ ↓ ✕, + 종목 추가), 총 시간, 저장(범위 오류면 막음)/삭제(확인 창)
- [ ] 실행: 구간 색(준비 `bg-cat-core`, 운동 `bg-cat-strength`, 휴식 `bg-cat-stretching` 계열의 연한 배경), 큰 남은 시간, 라운드·종목 번호, 진행 막대, 전체 남은 시간, 영상(운동: 지금 종목, 휴식: 다음 종목), 이전/일시정지/다음, 음성·삐 켜기, 종료(확인 창), 끝 화면(다시 시작/닫기), 음성 미지원·화면 꺼짐 방지 미지원 안내
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` 통과

### 작업 9: 문서와 최종 확인

- [ ] CLAUDE.md: 타이머 구조(`src/domain/timer*.ts`, `src/timer/`), 기본 종목 채우기, 분류 7개
- [ ] `npm test`, `npm run lint`, `npm run build`, 영상 `npm test` 모두 통과
- [ ] 서버를 새 빌드로 띄우고 주소·확인 항목을 사용자에게 알린다. 커밋 여부를 묻는다
