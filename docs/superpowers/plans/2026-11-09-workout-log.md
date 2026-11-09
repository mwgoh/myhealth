# 운동 기록 웹 구현 계획

> **에이전트 작업자용:** 이 계획은 작업 단위로 실행한다. 필수 하위 스킬은 superpowers:subagent-driven-development(추천) 또는 superpowers:executing-plans 중 하나다. 단계는 체크박스(`- [ ]`)로 진행 상황을 표시한다.

**목표:** 휴대폰 한 대에서 근력·맨몸·코어·스트레칭·유산소 운동을 기록하는 웹을 만든다. 데이터는 localStorage에 저장하고, 결과물은 Next.js 정적 사이트다.

**구조:** 순수 로직(`src/domain`)과 저장소(`src/storage`)는 React와 분리해 Vitest로 먼저 테스트한다. 화면(`src/app`, `src/components`)은 `useSyncExternalStore`로 저장소를 구독하는 클라이언트 컴포넌트다. 빌드는 `output: 'export'`로 서버 없이 정적 파일만 만든다.

**기술 스택:** Next.js 16.4.5 (App Router, TypeScript), React 19, Tailwind CSS 4, zod 4, Vitest 5, npm

**설계 문서:** `docs/superpowers/specs/2026-11-09-workout-log-design.md`. 이 계획은 설계 문서를 근거로 한다. 실행자는 두 문서를 모두 읽는다. 절 번호(예: "설계 5절")는 설계 문서를 가리킨다.

## 전역 제약

- 문서, 코드 주석, UI 문구는 모두 한국어로 쓴다. 코드 식별자, 라이브러리명, 명령어는 영문 그대로 둔다.
- **git 명령을 실행하지 않는다.** `git init`과 커밋을 하지 않는다. 사용자가 저장소를 나중에 직접 만든다. 그래서 각 작업에 커밋 단계가 없다.
- 버전: `next@16.4.5`, `react@19`, `tailwindcss@4`, `zod@4`, `vitest@5`. 패키지 관리자는 npm이다.
- `next.config.ts`에 `output: 'export'`를 둔다. 정적 내보내기에서 쓸 수 없는 서버 기능은 쓰지 않는다. Route Handler, Server Action, middleware/proxy, 이미지 최적화가 해당한다.
- 날짜 문자열을 다룰 때는 `src/domain/date.ts`의 함수만 쓴다. `new Date('YYYY-MM-DD')`는 쓰지 않는다. UTC로 해석되기 때문이다.
- 숫자 입력은 `<input type="text" inputMode="decimal">`을 쓴다. 정수 칸은 `inputMode="numeric"`을 쓴다. `type="number"`는 쓰지 않는다.
- 모든 입력 요소의 글자 크기는 16px 이상(`text-base`)이다. 16px보다 작으면 iOS Safari가 입력 칸을 누를 때 화면을 확대한다.
- 누를 수 있는 요소는 44px 이상(`min-h-11`, 아이콘 버튼은 `min-w-11`도)이다.
- 본문 폭은 `max-w-md mx-auto`로 제한한다.
- 하단 탭에는 `pb-[env(safe-area-inset-bottom)]`를 준다. `viewport`에는 `viewportFit: 'cover'`를 넣는다.
- 브라우저 기본 `alert`, `confirm`, `prompt`는 쓰지 않는다. 확인이 필요하면 `ConfirmDialog`를 쓴다.
- `window.localStorage`에는 `src/storage/browser-store.ts`에서만 접근한다.
- 린트 규칙을 끄는 주석(`eslint-disable`)은 쓰지 않는다. React Hooks 규칙에 걸리면 상태를 렌더링 중에 계산하거나 `key`로 해결한다.
- 테스트는 `TZ=Asia/Seoul`에서 실행한다(작업 1의 `vitest.config.ts`).

## 리뷰 중점

설계 문서가 따로 언급하지 않았고, 아래 작업의 기본 테스트로는 잡히지 않는 실패 상황 중 사용자가 실제로 겪기 쉬운 순서대로 적는다. 각 항목을 확인하는 테스트나 점검은 해당 작업에 넣어 두었다.

1. **새 기록이 처음 저장될 때 주소가 `?date=`에서 `?id=`로 바뀌어도, 입력 중이던 미완성 세트 줄이 사라지면 안 된다.** 편집기가 다시 마운트되면 초안이 저장본으로 다시 만들어진다. → 작업 10 화면 점검
2. **기록을 삭제한 직후, 남아 있던 자동 저장이 화면을 벗어나면서 실행되어 기록을 다시 만들면 안 된다.** → 작업 10 (삭제 전에 `cancel()`) 화면 점검
3. **아이폰에서 숫자 칸을 눌렀을 때 화면이 확대되면 안 된다.** 입력 글자 크기가 16px 미만이면 확대된다. → 작업 15 화면 점검
4. **메모장 등으로 열었다 저장한 백업 파일도 가져올 수 있어야 한다.** 이런 파일은 앞에 UTF-8 BOM이 붙는다. → 작업 8 단위 테스트
5. **localStorage 읽기가 예외를 던지는 환경에서, 읽지 못한 기존 데이터를 덮어쓰면 안 된다.** → 작업 7 단위 테스트

---

### 작업 1: 프로젝트 생성, 테스트 환경, 날짜 유틸

**파일:**
- 생성(생성기): `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `src/app/*` 등
- 생성: `vitest.config.ts`, `src/domain/date.ts`, `src/domain/date.test.ts`
- 수정: `README.md`, `AGENTS.md`, `CLAUDE.md`(생성되었다면) → 한국어로 교체
- 수정: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css` → 기본 예제 내용 제거
- 삭제: `public/*.svg` (생성기 예제 이미지)

**인터페이스:**
- 만드는 것 (`src/domain/date.ts`):
  - `type DateStr = string` — `"YYYY-MM-DD"`
  - `toDateStr(d: Date): DateStr` — 현지 시간 기준
  - `parseDateStr(s: string): Date | null` — 현지 자정. 형식이 틀렸거나 존재하지 않는 날짜면 `null`
  - `isValidDateStr(s: string): boolean`
  - `todayStr(now?: Date): DateStr`
  - `addDays(s: DateStr, n: number): DateStr`
  - `shiftMonth(s: DateStr, n: number): DateStr` — n개월 이동한 달의 **1일**
  - `weekRange(s: DateStr): { start: DateStr; end: DateStr }` — 월요일부터 일요일까지
  - `monthRange(s: DateStr): { start: DateStr; end: DateStr }`
  - `monthGrid(year: number, month: number): (DateStr | null)[][]` — month는 1~12. 7칸씩 끊은 줄 배열이고, 월요일에 시작하며 빈 칸은 `null`
  - `weekdayKo(s: DateStr): string` — `'월'`부터 `'일'`까지

- [ ] **1단계: 프로젝트 생성**

  ```powershell
  npx --yes create-next-app@16.4.5 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --no-agent-feedback --yes
  ```

  폴더가 비어 있지 않다고 거부하면 다음 순서로 다시 한다.
  1. `docs` 폴더를 scratchpad로 옮긴다.
  2. 위 명령을 다시 실행한다.
  3. `docs` 폴더를 원래 자리로 되돌린다.

  확인: `Test-Path .git`이 `False`여야 한다.

- [ ] **2단계: 영문 문서를 한국어로 교체**
  - `README.md`에 넣을 내용
    - 프로젝트 한 줄 소개
    - 명령: `npm run dev`, `npm test`, `npm run build`, `npm run lint`
    - 설계 문서와 계획 문서 경로
    - 데이터는 브라우저 localStorage에만 저장된다는 점, 그리고 백업이 필요하다는 경고
  - `AGENTS.md`(그리고 `CLAUDE.md`가 생성되었다면 그것도)는 뜻을 유지한 채 한국어로 옮긴다.

- [ ] **3단계: 의존성 설치**

  ```powershell
  npm install zod@4
  npm install -D vitest@5
  ```

- [ ] **4단계: 설정 파일 작성**
  - `next.config.ts`: `output: 'export'`
  - `package.json` scripts에 추가: `"test": "vitest run"`, `"test:watch": "vitest"`
  - `vitest.config.ts`
    - `resolve.alias`: `'@'` → `./src` (`fileURLToPath(new URL('./src', import.meta.url))`)
    - `test.environment`: `'node'`
    - `test.include`: `['src/**/*.test.ts']`
    - `test.env`: `{ TZ: 'Asia/Seoul' }`

- [ ] **5단계: 예제 내용 제거**
  - `page.tsx`는 `<main>운동 기록</main>`만 남긴다.
  - `globals.css`는 `@import "tailwindcss";`와 `body` 배경·글자색만 남긴다. 밝은 모드와 어두운 모드 둘 다 정한다(`prefers-color-scheme`).
  - `layout.tsx`
    - `<html lang="ko">`
    - `metadata.title`: `'운동 기록'`
    - `export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }`
    - 생성기가 넣은 Google 글꼴은 제거하고 시스템 글꼴을 쓴다.
  - `public/*.svg`를 삭제한다.

- [ ] **6단계: 실패하는 테스트 작성** (`src/domain/date.test.ts`)

  ```ts
  it('테스트 시간대가 Asia/Seoul이다', () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-540)
  })
  it('toDateStr은 UTC가 아니라 현지 날짜를 쓴다', () => {
    expect(toDateStr(new Date('2026-11-08T15:30:00Z'))).toBe('2026-11-09')
  })
  it('parseDateStr', () => {
    expect(parseDateStr('2026-11-09')?.getDate()).toBe(9)
    expect(parseDateStr('2026-02-30')).toBeNull()
    expect(parseDateStr('2026-2-3')).toBeNull()
    expect(parseDateStr('')).toBeNull()
  })
  it('addDays는 연도를 넘긴다', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
  it('shiftMonth는 말일에서 넘치지 않는다', () => {
    expect(shiftMonth('2026-01-31', 1)).toBe('2026-02-01')
    expect(shiftMonth('2026-01-15', -1)).toBe('2025-12-01')
  })
  it('weekRange는 월요일 시작', () => {
    expect(weekRange('2026-11-09')).toEqual({ start: '2026-11-09', end: '2026-11-15' }) // 월요일
    expect(weekRange('2026-11-15')).toEqual({ start: '2026-11-09', end: '2026-11-15' }) // 일요일
    expect(weekRange('2027-01-01')).toEqual({ start: '2026-12-28', end: '2027-01-03' }) // 연말을 넘는 주
  })
  it('monthRange는 윤년을 처리한다', () => {
    expect(monthRange('2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
    expect(monthRange('2028-02-05').end).toBe('2028-02-29')
  })
  it('monthGrid 2026년 11월', () => {
    const g = monthGrid(2026, 11)
    expect(g).toHaveLength(6)
    expect(g[0]).toEqual([null, null, null, null, null, null, '2026-11-01']) // 11/1은 일요일
    expect(g[1][0]).toBe('2026-11-02')
    expect(g[5]).toEqual(['2026-11-30', null, null, null, null, null, null])
  })
  it('weekdayKo', () => {
    expect(weekdayKo('2026-11-09')).toBe('월')
    expect(weekdayKo('2026-11-15')).toBe('일')
  })
  ```

- [ ] **7단계: 테스트 실행 → 실패 확인**

  `npm test`. `date.ts`가 없어서 실패해야 한다.

  시간대 테스트만 실패하면 `test.env`가 적용되지 않은 것이다. 이때는 `test.setupFiles`에 `process.env.TZ = 'Asia/Seoul'` 한 줄짜리 파일을 넣는다.

- [ ] **8단계: `src/domain/date.ts` 구현**
  - 날짜 계산은 `new Date(y, m - 1, d)`와 `setDate`를 쓴다. 밀리초 더하기는 쓰지 않는다.
  - 형식 검사는 `/^\d{4}-\d{2}-\d{2}$/`로 한 뒤, 만든 `Date`를 다시 문자열로 바꿔 원래 문자열과 같은지 본다. 이렇게 하면 `2026-02-30` 같은 날짜가 걸러진다.

- [ ] **9단계: 테스트 실행 → 통과 확인**

  `npm test`. 모두 PASS여야 한다.

- [ ] **10단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다. `out/index.html`이 있어야 한다.

---

### 작업 2: 도메인 타입과 스키마

**파일:**
- 생성: `src/domain/types.ts`, `src/domain/types.test.ts`

**인터페이스:**
- 쓰는 것: `isValidDateStr` (작업 1)
- 만드는 것:
  - `MEASURE_KINDS = ['weighted', 'reps', 'timed', 'cardio'] as const`, `type MeasureKind`
  - `CATEGORIES = ['strength', 'bodyweight', 'core', 'stretching', 'cardio'] as const`, `type Category`
  - `CATEGORY_LABEL: Record<Category, string>` = `{ strength: '#근력운동', bodyweight: '#맨몸운동', core: '#코어운동', stretching: '#스트레칭', cardio: '#유산소' }`
  - `KIND_LABEL: Record<MeasureKind, string>` = `{ weighted: '무게×횟수', reps: '횟수', timed: '시간(초)', cardio: '시간(분)·거리' }`
  - `type Limit = { min: number; max: number; integer: boolean; minExclusive: boolean }`
  - `LIMITS` (설계 4절 입력값 범위)
    - `weightKg {0, 1000, 소수}`
    - `reps {1, 1000, 정수}`
    - `addedKg {0, 500, 소수}`
    - `seconds {1, 36000, 정수}`
    - `cardioDurationMin {0 초과, 1440, 소수}`
    - `distanceKm {0 초과, 1000, 소수}`
    - `workoutDurationMin {1, 1440, 정수}`
  - `MEMO_MAX = 1000`
  - `withinLimit(n: number, l: Limit): boolean`
  - zod 스키마: `exerciseSchema`, `entrySchema` (`z.discriminatedUnion('kind', …)`), `workoutSchema`, `storeSchema`
  - 타입 `Exercise`, `Entry`, `Workout`, `Store`는 각 스키마의 `z.infer`다. 필드는 설계 4절과 같다.
  - `type StoreErrorCode = 'unsupported-version' | 'invalid-shape' | 'unknown-exercise' | 'kind-mismatch'`
  - `parseStore(input: unknown): { ok: true; store: Store } | { ok: false; error: StoreErrorCode }`

- [ ] **1단계: 실패하는 테스트 작성**

  아래 `store`는 테스트 안에서 만든 최소 유효 Store다. 종목 1개(`id 'ex1', kind 'weighted'`)와 그 종목을 쓰는 기록 1개를 담는다.

  ```ts
  it('withinLimit', () => {
    expect(withinLimit(0, LIMITS.weightKg)).toBe(true)
    expect(withinLimit(1000.5, LIMITS.weightKg)).toBe(false)
    expect(withinLimit(8.5, LIMITS.reps)).toBe(false)
    expect(withinLimit(0, LIMITS.cardioDurationMin)).toBe(false)
    expect(withinLimit(0.1, LIMITS.distanceKm)).toBe(true)
  })
  it('유효한 store는 통과한다', () => expect(parseStore(store)).toEqual({ ok: true, store }))
  it('version이 1보다 크면 unsupported-version', () =>
    expect(parseStore({ ...store, version: 2 })).toEqual({ ok: false, error: 'unsupported-version' }))
  it('구조가 틀리면 invalid-shape', () => {
    expect(parseStore(null)).toEqual({ ok: false, error: 'invalid-shape' })
    expect(parseStore({ version: 1, workouts: [] })).toEqual({ ok: false, error: 'invalid-shape' })
    // 날짜 '2026-02-30', entries: [], reps 0, memo 1001자, 종목 id 중복도 각각 invalid-shape
  })
  it('없는 종목을 참조하면 unknown-exercise', /* entry.exerciseId = 'nope' */)
  it('측정 방식이 다르면 kind-mismatch', /* weighted 종목을 kind 'reps' entry가 참조 */)
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- types`

- [ ] **3단계: `src/domain/types.ts` 구현**
  - `parseStore`는 다음 순서로 검사한다.
    1. 객체가 아니면 `invalid-shape`
    2. `typeof version === 'number' && version > 1`이면 `unsupported-version`
    3. `storeSchema.safeParse`가 실패하면 `invalid-shape`
    4. 종목·기록 id 중복이 있으면 `invalid-shape`
    5. 참조 검사: `unknown-exercise`, 그다음 `kind-mismatch`
  - `workoutSchema`의 제약
    - `date`: `isValidDateStr`로 refine
    - `createdAt`: `z.iso.datetime()`
    - `entries`: `.min(1)`
    - `memo`: `.max(MEMO_MAX).optional()`
    - `durationMin`: `.optional()`
  - 세트 배열은 `.min(1)`이다. 완성된 세트가 없는 종목은 저장하지 않기 때문이다.

- [ ] **4단계: 테스트 실행 → 통과 확인**

  `npm test -- types`

---

### 작업 3: ID 생성과 기본 종목·가이드

**파일:**
- 생성: `src/domain/id.ts`, `src/domain/id.test.ts`, `src/domain/seed.ts`, `src/domain/seed.test.ts`

**인터페이스:**
- 쓰는 것: `Exercise`, `Store`, `parseStore`, `CATEGORIES` (작업 2)
- 만드는 것:
  - `createId(): string` — `globalThis.crypto?.randomUUID`가 있으면 그것을, 없으면 대체 함수를 쓴다.
  - `type Guide = { target: string; tip: string }`
  - `SEED_EXERCISES: readonly Exercise[]` — 설계 5절 표의 42개를 표 순서대로 둔다. 모두 `archived: false`다.
  - `GUIDES: Readonly<Record<string, Guide>>` — 기본 종목 ID가 키다. `target`은 '주요 부위' 열, `tip`은 '핵심 포인트' 열을 **글자 그대로** 옮긴다.
  - `GUIDE_NOTE = '반동 없이 천천히, 통증이 느껴지면 멈추세요.'`
  - `STRETCH_NOTE = '한 동작을 20~30초 유지하고, 아픈 지점이 아니라 당기는 느낌이 드는 지점까지만.'`
  - `getGuide(exerciseId: string): Guide | undefined`
  - `createInitialStore(): Store` — 부를 때마다 새 배열과 새 객체를 만든다.

- [ ] **1단계: 실패하는 테스트 작성**

  ```ts
  // id.test.ts
  it('1000개가 모두 다르다', () => expect(new Set(Array.from({ length: 1000 }, createId)).size).toBe(1000))
  it('randomUUID가 없어도 동작한다', () => {
    vi.stubGlobal('crypto', {})
    const ids = Array.from({ length: 1000 }, createId)
    expect(new Set(ids).size).toBe(1000)
    expect(ids[0]).toMatch(/^[0-9a-z-]+$/)
    vi.unstubAllGlobals()
  })

  // seed.test.ts
  it('42개, ID 중복 없음', () => {
    expect(SEED_EXERCISES).toHaveLength(42)
    expect(new Set(SEED_EXERCISES.map(e => e.id)).size).toBe(42)
  })
  it('분류별 개수', () => {
    // strength 8, bodyweight 9, core 9, stretching 10, cardio 6
  })
  it('측정 방식', () => {
    expect(find('seed-wall-sit')).toMatchObject({ kind: 'timed', category: 'bodyweight' })
    expect(find('seed-plank')).toMatchObject({ kind: 'timed', category: 'core' })
    expect(find('seed-crunch')).toMatchObject({ kind: 'reps', category: 'core' })
    expect(SEED_EXERCISES.filter(e => e.category === 'stretching').every(e => e.kind === 'timed')).toBe(true)
    expect(SEED_EXERCISES.filter(e => e.category === 'strength').every(e => e.kind === 'weighted')).toBe(true)
    expect(SEED_EXERCISES.filter(e => e.category === 'cardio').every(e => e.kind === 'cardio')).toBe(true)
  })
  it('모든 기본 종목에 가이드가 있다', () =>
    expect(SEED_EXERCISES.every(e => getGuide(e.id)?.tip)).toBe(true))
  it('가이드 문구', () =>
    expect(getGuide('seed-swimming')).toEqual({ target: '심폐·전신', tip: '거리는 km로 적는다 (1500m → 1.5)' }))
  it('초기 Store는 스키마를 통과하고 매번 새 객체다', () => {
    expect(parseStore(createInitialStore()).ok).toBe(true)
    const a = createInitialStore(); a.exercises[0].archived = true
    expect(createInitialStore().exercises[0].archived).toBe(false)
  })
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- id seed`

- [ ] **3단계: 구현**
  - `id.ts`의 대체 함수는 `Date.now().toString(36)`에 무작위 부분을 붙인다.
    - 무작위 부분: `crypto.getRandomValues`가 있으면 그 값을, 없으면 `Math.random`을 36진수로 쓴다.
    - 둘은 `-`로 잇는다.
  - `seed.ts`에는 설계 5절 표를 옮긴다.

- [ ] **4단계: 테스트 실행 → 통과 확인**

  `npm test -- id seed`

---

### 작업 4: 종목 목록 규칙

**파일:**
- 생성: `src/domain/exercises.ts`, `src/domain/exercises.test.ts`

**인터페이스:**
- 쓰는 것: `Store`, `Exercise`, `Category`, `MeasureKind`, `Workout` (작업 2), `createInitialStore` (작업 3)
- 만드는 것:
  - `defaultKindFor(c: Category): MeasureKind`
  - `type NameCheck = { ok: true } | { ok: false; reason: 'empty' | 'duplicate' } | { ok: false; reason: 'duplicate-archived'; existingId: string }`
  - `checkNewExerciseName(exercises: readonly Exercise[], name: string): NameCheck` — 앞뒤 공백을 제거하고 소문자로 바꿔 비교한다.
  - `pickerList(store: Store, opts: { category: Category | 'all'; query: string }): Exercise[]`
    - 숨긴 종목을 뺀다.
    - 분류로 거른다.
    - 검색어 일치는 공백을 모두 제거하고 소문자로 바꾼 뒤 포함 여부로 판단한다.
    - 정렬
      - 한 번이라도 쓴 종목은 마지막 사용 시점(`date`, 그다음 `createdAt`)의 내림차순으로 앞에 둔다.
      - 쓰지 않은 종목은 Store 순서대로 뒤에 둔다.

- [ ] **1단계: 실패하는 테스트 작성**

  ```ts
  it('defaultKindFor', () => {
    expect(CATEGORIES.map(defaultKindFor)).toEqual(['weighted', 'reps', 'reps', 'timed', 'cardio'])
  })
  it('이름 검사', () => {
    const ex = createInitialStore().exercises
    expect(checkNewExerciseName(ex, '  벤치프레스 ')).toEqual({ ok: false, reason: 'duplicate' })
    expect(checkNewExerciseName(ex, '   ')).toEqual({ ok: false, reason: 'empty' })
    expect(checkNewExerciseName(ex, '케틀벨 스윙')).toEqual({ ok: true })
    const withEng = [...ex, { id: 'x', name: 'pull up', kind: 'reps', category: 'bodyweight', archived: true }]
    expect(checkNewExerciseName(withEng, 'Pull Up')).toEqual({ ok: false, reason: 'duplicate-archived', existingId: 'x' })
  })
  it('기록이 없으면 Store 순서', () => {
    expect(pickerList(createInitialStore(), { category: 'all', query: '플랭' }).map(e => e.id))
      .toEqual(['seed-plank', 'seed-side-plank'])
    expect(pickerList(createInitialStore(), { category: 'stretching', query: '플랭' })).toEqual([])
    expect(pickerList(createInitialStore(), { category: 'core', query: '사이드플랭크' }).map(e => e.id))
      .toEqual(['seed-side-plank'])
  })
  it('최근 사용순', () => {
    // 기록 A: 2026-11-01 seed-plank, 기록 B: 2026-11-05 seed-crunch
    expect(pickerList(storeWithAB, { category: 'core', query: '' }).map(e => e.id)).toEqual([
      'seed-crunch', 'seed-plank', 'seed-side-plank', 'seed-hollow-hold', 'seed-leg-raise',
      'seed-dead-bug', 'seed-bird-dog', 'seed-russian-twist', 'seed-mountain-climber',
    ])
  })
  it('숨긴 종목은 보이지 않는다', /* seed-plank archived → core 목록에 없음 */)
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- exercises`

- [ ] **3단계: `src/domain/exercises.ts` 구현**

- [ ] **4단계: 테스트 실행 → 통과 확인**

  `npm test -- exercises`

---

### 작업 5: 편집 초안 변환

**파일:**
- 생성: `src/domain/workout.ts`, `src/domain/workout.test.ts`

**인터페이스:**
- 쓰는 것: `Workout`, `Entry`, `Exercise`, `LIMITS`, `Limit`, `withinLimit`, `MEMO_MAX` (작업 2), `createId` (작업 3), `DateStr`, `isValidDateStr` (작업 1)
- 만드는 것:
  - 초안 타입. 모든 입력값은 문자열이다.
    ```ts
    type WeightedSetDraft = { weightKg: string; reps: string }
    type RepsSetDraft = { reps: string; addedKg: string }
    type TimedSetDraft = { seconds: string }
    type EntryDraft =
      | { id: string; exerciseId: string; kind: 'weighted'; sets: WeightedSetDraft[] }
      | { id: string; exerciseId: string; kind: 'reps'; sets: RepsSetDraft[] }
      | { id: string; exerciseId: string; kind: 'timed'; sets: TimedSetDraft[] }
      | { id: string; exerciseId: string; kind: 'cardio'; durationMin: string; distanceKm: string }
    type WorkoutDraft = { id: string; date: string; createdAt: string; durationMin: string; memo: string; entries: EntryDraft[] }
    ```
  - `type FieldState = { kind: 'empty' } | { kind: 'valid'; value: number } | { kind: 'invalid' }`
  - `readField(raw: string, limit: Limit): FieldState`
    1. 앞뒤 공백을 제거한다.
    2. 빈 문자열이면 `empty`
    3. `,`를 `.`로 바꾼다.
    4. `/^\d+(\.\d+)?$/`에 맞지 않거나 범위를 벗어나면 `invalid`
  - `newWorkoutDraft(date: DateStr, now: Date): WorkoutDraft` — `createdAt`은 `now.toISOString()`
  - `draftFromWorkout(w: Workout): WorkoutDraft` — 숫자는 `String(n)`으로 바꾼다. `addedKg`가 0이거나 선택 필드가 없으면 `''`
  - `newEntryDraft(ex: Exercise): EntryDraft` — 세트형은 빈 세트 1개, 유산소는 빈 문자열
  - `addSet(entry: EntryDraft): EntryDraft` — 마지막 세트의 문자열을 그대로 복사해 붙인다. 원본은 바꾸지 않는다. 유산소는 그대로 돌려준다.
  - `hasCompletedSets(entry: EntryDraft): boolean`
  - `toPersistable(d: WorkoutDraft): { ok: true; workout: Workout } | { ok: false; reason: 'no-entries' | 'invalid-date' }` — 규칙은 설계 8절 '편집 초안'
    - `reps` 세트에서 `addedKg`가 비었으면 0이고, `invalid`면 그 세트를 뺀다.
    - 유산소에서 `distanceKm`가 `invalid`면 그 종목을 뺀다.
    - `durationMin`이 `invalid`이거나 비었으면 필드를 생략한다.
    - `memo`는 `trim()` 결과가 빈 문자열이면 생략하고, 아니면 원문을 `MEMO_MAX`까지 자른다.

- [ ] **1단계: 실패하는 테스트 작성**

  ```ts
  it('readField', () => {
    expect(readField('52,5', LIMITS.weightKg)).toEqual({ kind: 'valid', value: 52.5 })
    expect(readField(' 60 ', LIMITS.weightKg)).toEqual({ kind: 'valid', value: 60 })
    expect(readField('', LIMITS.weightKg)).toEqual({ kind: 'empty' })
    expect(readField('-5', LIMITS.addedKg)).toEqual({ kind: 'invalid' })
    expect(readField('1e3', LIMITS.weightKg)).toEqual({ kind: 'invalid' })
    expect(readField('8.5', LIMITS.reps)).toEqual({ kind: 'invalid' })
  })
  it('addSet은 직전 세트를 복사하고 원본을 바꾸지 않는다', () => {
    const e = { id: 'e', exerciseId: 'seed-bench-press', kind: 'weighted', sets: [{ weightKg: '60', reps: '8' }] }
    const r = addSet(e)
    expect(r.sets).toEqual([{ weightKg: '60', reps: '8' }, { weightKg: '60', reps: '8' }])
    expect(e.sets).toHaveLength(1)
  })
  it('newEntryDraft', () => {
    expect(newEntryDraft(plank)).toMatchObject({ kind: 'timed', sets: [{ seconds: '' }] })
    expect(newEntryDraft(running)).toMatchObject({ kind: 'cardio', durationMin: '', distanceKm: '' })
  })
  it('toPersistable: 미완성·범위 초과 세트 제외', () => {
    // weighted 세트 [{60,8}, {'',8}, {'1001','5'}] → [{ weightKg: 60, reps: 8 }]
    // reps 세트 [{'10',''}, {'10','-5'}, {'8.5',''}] → [{ reps: 10, addedKg: 0 }]
    // timed 세트 [{'0'}, {'45'}] → [{ seconds: 45 }]
  })
  it('toPersistable: 유산소', () => {
    // durationMin '' → 그 종목 제외
    // '30' + distanceKm '' → { durationMin: 30 } (distanceKm 키 없음)
    // '30' + '5.2' → { durationMin: 30, distanceKm: 5.2 }
    // '30' + 'abc' → 그 종목 제외
  })
  it('toPersistable: 기록 단위 필드', () => {
    // durationMin '0' → 생략, '45' → 45, memo '  ' → 생략
    // 모든 종목이 미완성 → { ok: false, reason: 'no-entries' }
    // date '' → { ok: false, reason: 'invalid-date' }
  })
  it('draftFromWorkout ↔ toPersistable 왕복', () => {
    // 저장 형식 → 초안 → 저장 형식이 원래와 같다. id, createdAt 유지
    // addedKg 0은 초안에서 '', 52.5는 '52.5'
  })
  it('hasCompletedSets', /* 빈 세트만 → false, 완성 세트 1개 → true, 유산소 durationMin 유효 → true */)
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- workout`

- [ ] **3단계: `src/domain/workout.ts` 구현**

- [ ] **4단계: 테스트 실행 → 통과 확인**

  `npm test -- workout`

---

### 작업 6: 요약 집계와 표시 형식

**파일:**
- 생성: `src/domain/summary.ts`, `src/domain/summary.test.ts`, `src/domain/format.ts`, `src/domain/format.test.ts`

**인터페이스:**
- 쓰는 것: `Store`, `Workout`, `Entry`, `Exercise`, `Category`, `CATEGORIES` (작업 2), `DateStr`, `parseDateStr`, `weekdayKo` (작업 1)
- 만드는 것:
  - `summary.ts`
    ```ts
    type Summary = {
      workoutDays: number
      categoryDays: Record<Category, number>
      totalDurationMin: number
      missingDurationCount: number
      volumeKg: number
      totalReps: number
      cardioDurationMin: number
      cardioDistanceKm: number
    }
    ```
    `summarize(store: Store, range: { start: DateStr; end: DateStr }): Summary` — 양 끝 날짜를 포함한다. 규칙은 설계 6절이다.
  - `format.ts`
    - `formatDuration(min: number): string`
    - `formatInt(n: number): string`
    - `formatKm(n: number): string`
    - `formatDateLabel(s: DateStr): string`
    - `formatWeekLabel(r: { start: DateStr; end: DateStr }): string`
    - `formatMonthLabel(s: DateStr): string`
    - `entrySummaryText(e: Entry, ex: Exercise | undefined): string`
    - `workoutSummaryText(w: Workout, byId: ReadonlyMap<string, Exercise>): string`
    - `workoutCategories(w: Workout, byId: ReadonlyMap<string, Exercise>): Category[]`

- [ ] **1단계: 실패하는 테스트 작성** (`summary.test.ts`)

  준비 데이터: 기본 종목 Store에 아래 기록 4개를 넣는다.
  - W1 `2026-11-09`, `durationMin` 60
    - 벤치프레스 [{60,8}, {60,8}]
    - 플랭크 [{60}]
  - W2 `2026-11-09`, `durationMin` 없음
    - 러닝 30분 5.2km
  - W3 `2026-11-11`, `durationMin` 없음
    - 푸시업 [{20,0}, {15,10}]
    - 햄스트링 스트레칭 [{30}]
  - W4 `2026-11-16`
    - 벤치프레스 [{100,1}]

  ```ts
  it('주간 집계', () => {
    expect(summarize(s, { start: '2026-11-09', end: '2026-11-15' })).toEqual({
      workoutDays: 2,
      categoryDays: { strength: 1, bodyweight: 1, core: 1, stretching: 1, cardio: 1 },
      totalDurationMin: 90,      // 60 + 30(W2 유산소로 대체) + 0(W3)
      missingDurationCount: 1,   // W3
      volumeKg: 960, totalReps: 35, cardioDurationMin: 30, cardioDistanceKm: 5.2,
    })
  })
  it('빈 기간은 모두 0', /* 2026-10-01 ~ 2026-10-31, categoryDays도 다섯 개 모두 0 */)
  it('숨긴 종목도 분류별 일수에 센다', /* seed-plank archived → categoryDays.core는 그대로 1 */)
  ```

- [ ] **2단계: 실패하는 테스트 작성** (`format.test.ts`)

  ```ts
  expect(formatDuration(0)).toBe('0분')
  expect(formatDuration(45)).toBe('45분')
  expect(formatDuration(90)).toBe('1시간 30분')
  expect(formatDuration(120)).toBe('2시간')
  expect(formatDuration(59.6)).toBe('1시간')
  expect(formatInt(12345.6)).toBe('12,346')
  expect(formatKm(0.1 + 0.2)).toBe('0.3')
  expect(formatKm(10)).toBe('10.0')
  expect(formatDateLabel('2026-11-09')).toBe('11월 9일 (월)')
  expect(formatWeekLabel({ start: '2026-11-09', end: '2026-11-15' })).toBe('11월 9일 – 11월 15일')
  expect(formatWeekLabel({ start: '2026-12-28', end: '2027-01-03' })).toBe('2026년 12월 28일 – 2027년 1월 3일')
  expect(formatMonthLabel('2026-11-09')).toBe('2026년 11월')
  expect(entrySummaryText(bench5Sets, bench)).toBe('벤치프레스 5세트')
  expect(entrySummaryText(run30, running)).toBe('러닝 30분')
  expect(entrySummaryText(run30km52, running)).toBe('러닝 30분 5.2km')
  expect(entrySummaryText(run90, running)).toBe('러닝 1시간 30분')
  expect(entrySummaryText(bench2Sets, undefined)).toBe('알 수 없는 종목 2세트')
  expect(workoutSummaryText(w1, byId)).toBe('벤치프레스 2세트 · 플랭크 1세트')
  expect(workoutCategories(w3, byId)).toEqual(['bodyweight', 'stretching'])  // CATEGORIES 순서, 중복 없음
  ```

- [ ] **3단계: 테스트 실행 → 실패 확인**

  `npm test -- summary format`

- [ ] **4단계: 구현**
  - 기간 비교는 `"YYYY-MM-DD"` 문자열 비교로 한다.
  - `formatInt`는 `Math.round` 후 `toLocaleString('ko-KR')`를 쓴다.
  - `formatKm`은 `toFixed(1)`을 쓴다.
  - 기간 이름에서 연도가 다르면 양쪽에 연도를 붙인다. 구분자는 앞뒤에 공백을 둔 en dash(` – `)다.

- [ ] **5단계: 테스트 실행 → 통과 확인**

  `npm test -- summary format`

---

### 작업 7: 저장소

**파일:**
- 생성: `src/storage/store.ts`, `src/storage/store.test.ts`

**인터페이스:**
- 쓰는 것: `Store`, `Workout`, `Exercise`, `Category`, `MeasureKind`, `parseStore` (작업 2), `createInitialStore`, `createId` (작업 3), `checkNewExerciseName`, `NameCheck` (작업 4)
- 만드는 것:
  ```ts
  type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void }
  const STORAGE_KEY = 'workout-log'
  type StoreState =
    | { status: 'loading' }
    | { status: 'ready'; store: Store }
    | { status: 'corrupt'; raw: string }
    | { status: 'unsupported-version'; raw: string }
  type WriteResult = 'saved' | 'failed' | 'blocked'
  type AddExerciseResult = { ok: true; exercise: Exercise } | Extract<NameCheck, { ok: false }>
  interface WorkoutStore {
    getState(): StoreState                // 바뀌기 전까지 같은 객체를 돌려준다
    subscribe(listener: () => void): () => void
    load(): void                          // 저장소를 다시 읽는다 (첫 로드, 다른 탭 변경)
    upsertWorkout(w: Workout): WriteResult
    deleteWorkout(id: string): WriteResult
    addExercise(input: { name: string; category: Category; kind: MeasureKind }): AddExerciseResult
    setExerciseArchived(id: string, archived: boolean): WriteResult
    replaceAll(store: Store): WriteResult
    resetAll(): WriteResult               // corrupt나 unsupported-version 상태에서도 허용
  }
  function createWorkoutStore(storage: StorageLike): WorkoutStore  // 처음 상태는 loading
  ```
- 동작 규칙
  - `ready`가 아니면 `resetAll`을 뺀 쓰기는 모두 `'blocked'`이고, 저장소를 건드리지 않는다.
  - `setItem`이 예외를 던지면 `'failed'`를 돌려주되, 메모리의 상태는 바꾼다.
  - `load()` 중 `getItem`이 예외를 던지면 `ready`(초기 Store) 상태가 되고, 이후 쓰기를 모두 막는다. 막힌 쓰기는 `setItem`을 부르지 않고 `'failed'`를 돌려준다.
  - `addExercise`의 이름은 `trim()`해서 저장한다.

- [ ] **1단계: 실패하는 테스트 작성**

  `memoryStorage(initial?: string)`는 테스트용 저장 객체다. `setItem` 호출 횟수를 기록하고, 예외를 던지도록 설정할 수 있다.

  ```ts
  it('빈 저장소 → 기본 데이터를 만들어 저장한다', () => {
    // load 후 status 'ready', exercises 42개, storage.getItem(STORAGE_KEY)를 parse하면 상태의 store와 같다
  })
  it('손상된 JSON → corrupt, 쓰기 차단, 원본 유지', () => {
    const st = createWorkoutStore(memoryStorage('{bad json')); st.load()
    expect(st.getState()).toEqual({ status: 'corrupt', raw: '{bad json' })
    expect(st.upsertWorkout(w)).toBe('blocked')
    expect(storage.getItem(STORAGE_KEY)).toBe('{bad json')
  })
  it('스키마 불일치 → corrupt', /* '{"version":1}' */)
  it('새 버전 → unsupported-version, 쓰기 차단', /* version: 2 */)
  it('upsertWorkout: 새 기록은 추가, 같은 id는 교체, 구독자는 1번 호출', () => {})
  it('deleteWorkout', () => {})
  it('addExercise: 중복 거부, 성공하면 저장', () => {
    expect(st.addExercise({ name: '벤치프레스', category: 'strength', kind: 'weighted' }))
      .toEqual({ ok: false, reason: 'duplicate' })
    // ' 케틀벨 스윙 ' → ok, name '케틀벨 스윙', archived false, 저장소에 반영
  })
  it('setItem 예외 → failed, 메모리에는 반영', () => {
    // storage.failWrites = true → upsertWorkout(w) === 'failed', getState().store.workouts에 w 있음
  })
  it('getItem 예외 → 읽지 못한 데이터를 덮어쓰지 않는다', () => {   // 리뷰 중점 5
    // getItem이 throw → load 후 status 'ready'
    // upsertWorkout(w) === 'failed', setItem 호출 0번
  })
  it('resetAll은 corrupt에서도 동작한다', /* → ready, exercises 42개, 저장소 덮어씀 */)
  it('getState는 바뀌기 전까지 같은 객체', () => expect(st.getState()).toBe(st.getState()))
  it('다른 탭 변경: load()를 다시 부르면 새 데이터', () => {})
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- store`

- [ ] **3단계: `src/storage/store.ts` 구현**

- [ ] **4단계: 테스트 실행 → 통과 확인**

  `npm test -- store`

---

### 작업 8: 백업

**파일:**
- 생성: `src/storage/backup.ts`, `src/storage/backup.test.ts`

**인터페이스:**
- 쓰는 것: `Store`, `parseStore`, `StoreErrorCode` (작업 2), `DateStr` (작업 1)
- 만드는 것:
  - `exportFileName(today: DateStr): string` → `'workout-log-backup-2026-11-09.json'`
  - `rawExportFileName(today: DateStr): string` → `'workout-log-raw-2026-11-09.json'`
  - `serializeBackup(store: Store): string` — `JSON.stringify(store, null, 2)`
  - `type ImportError = 'not-json' | StoreErrorCode`
  - `parseBackup(text: string): { ok: true; store: Store } | { ok: false; error: ImportError }` — 맨 앞의 BOM(`﻿`)은 제거하고 읽는다.
  - `IMPORT_ERROR_MESSAGE: Record<ImportError, string>`
    - `not-json`: `'백업 파일(JSON)이 아닙니다.'`
    - `unsupported-version`: `'이 앱보다 새 버전에서 만든 백업입니다.'`
    - `invalid-shape`: `'백업 파일의 구조가 올바르지 않습니다.'`
    - `unknown-exercise`: `'존재하지 않는 종목을 가리키는 기록이 있습니다.'`
    - `kind-mismatch`: `'종목과 기록의 측정 방식이 맞지 않습니다.'`
  - `downloadText(fileName: string, text: string): void` — Blob과 `<a download>`를 쓰는 브라우저 전용 함수다. 단위 테스트는 하지 않는다.

- [ ] **1단계: 실패하는 테스트 작성**

  ```ts
  it('파일 이름', () => expect(exportFileName('2026-11-09')).toBe('workout-log-backup-2026-11-09.json'))
  it('내보내기 → 가져오기 왕복', () => expect(parseBackup(serializeBackup(s))).toEqual({ ok: true, store: s }))
  it('BOM이 붙은 파일도 읽는다', () => expect(parseBackup('﻿' + serializeBackup(s)).ok).toBe(true))  // 리뷰 중점 4
  it('JSON이 아니면 not-json', () => expect(parseBackup('hello')).toEqual({ ok: false, error: 'not-json' }))
  it('새 버전', /* version 2 → unsupported-version */)
  it('없는 종목 참조', /* → unknown-exercise */)
  it('측정 방식 불일치', /* → kind-mismatch */)
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- backup`

- [ ] **3단계: `src/storage/backup.ts` 구현**

- [ ] **4단계: 테스트 실행 → 통과 확인**

  `npm test -- backup`

---

### 작업 9: 앱 골격 (저장소 연결, 오류 화면, 하단 탭, 공통 컴포넌트)

**파일:**
- 생성: `src/storage/browser-store.ts`, `src/hooks/useStore.ts`
- 생성: `src/components/StoreGate.tsx`, `src/components/TabShell.tsx`, `src/components/BottomNav.tsx`, `src/components/FloatingAddButton.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/CategoryChip.tsx`
- 생성: `src/app/calendar/page.tsx`, `src/app/stats/page.tsx`, `src/app/settings/page.tsx`, `src/app/workout/page.tsx` — 이 단계에서는 제목만 있는 자리 표시 페이지다.
- 수정: `src/app/layout.tsx`, `src/app/page.tsx`

**인터페이스:**
- 쓰는 것: `createWorkoutStore`, `STORAGE_KEY`, `StoreState`, `WorkoutStore` (작업 7), `downloadText`, `rawExportFileName` (작업 8), `todayStr` (작업 1), `CATEGORY_LABEL`, `Category` (작업 2)
- 만드는 것:
  - `getBrowserStore(): WorkoutStore`
    - `window.localStorage`로 한 번만 만든다(싱글턴).
    - 처음 부를 때 `window.addEventListener('storage', e => e.key === STORAGE_KEY && store.load())`를 등록한다.
    - 서버(빌드)에서는 부르지 않는다.
  - `useStoreState(): StoreState`
    - `useSyncExternalStore`를 쓴다.
    - `typeof window === 'undefined'`이면 구독하지 않고 고정된 `LOADING` 객체를 돌려준다.
    - `getServerSnapshot`도 같은 `LOADING` 객체를 돌려준다.
  - `useReadyStore(): { store: Store; api: WorkoutStore }` — `StoreGate` 안에서만 쓴다. `ready`가 아니면 throw한다.
  - `<StoreGate>{children}</StoreGate>`
    - 마운트될 때 `getBrowserStore().load()`를 부른다.
    - `loading`: 로딩 문구 `'불러오는 중…'`
    - `corrupt`: 문구 `'저장된 데이터를 읽을 수 없습니다. 데이터는 지우지 않았습니다. 원본을 내보내 보관한 뒤 초기화할 수 있습니다.'`
    - `unsupported-version`: 문구 `'이 앱보다 새 버전에서 저장된 데이터입니다. 데이터는 지우지 않았습니다.'`
    - 오류 화면 버튼은 둘이다.
      - `'원본 그대로 내보내기'`: `downloadText(rawExportFileName(today), raw)`
      - `'초기화'`: `ConfirmDialog`를 거친 뒤 `resetAll()`
    - `ready`면 `children`을 그린다.
  - `<TabShell>{children}</TabShell>` — 본문 아래에 `FloatingAddButton`과 `BottomNav`를 붙인다. 본문 아래 여백으로 버튼과 탭에 내용이 가리지 않게 한다.
  - `<BottomNav />` — 기록 `/`, 달력 `/calendar`, 요약 `/stats`, 설정 `/settings`. 현재 탭은 `usePathname`으로 강조한다.
  - `<FloatingAddButton />` — `/workout?date=${todayStr()}`로 가는 `Link`이고 문구는 `'+ 운동 기록'`
  - `<ConfirmDialog open title message confirmLabel destructive? onConfirm onCancel>{children?}</ConfirmDialog>`
    - `role="dialog"`, `aria-modal="true"`
    - 바깥을 누르거나 Esc를 누르면 `onCancel`
    - `children`은 추가 버튼(예: '현재 데이터 먼저 내보내기')을 넣는 자리다.
  - `<CategoryChip category />` — `CATEGORY_LABEL`을 작은 칩으로 보여준다.
- `layout.tsx`의 `body`를 `<StoreGate>`로 감싼다. 탭 페이지 네 곳(`/`, `/calendar`, `/stats`, `/settings`)은 `<TabShell>`로 감싼다. `/workout`은 감싸지 않는다.

- [ ] **1단계: 위 파일을 구현한다**

- [ ] **2단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다. `out/`에 `index.html`, `calendar.html`, `stats.html`, `settings.html`, `workout.html`이 있어야 한다.

- [ ] **3단계: 화면 점검**

  `npm run dev`를 실행하고 브라우저를 390×844 크기로 연다.
  1. 탭 네 개 사이를 이동할 수 있고, 현재 탭이 강조된다.
  2. 개발자 도구 콘솔에 hydration 경고가 없다.
  3. `localStorage.setItem('workout-log', '{bad')`를 실행하고 새로고침하면 오류 화면이 나온다.
  4. '원본 그대로 내보내기'를 누르면 `{bad` 내용의 파일이 내려받아진다.
  5. '초기화' → 확인을 누르면 정상 화면으로 돌아온다.

---

### 작업 10: 편집 화면 (`/workout`)

**파일:**
- 생성: `src/hooks/debounced-saver.ts`, `src/hooks/debounced-saver.test.ts`, `src/hooks/useAutosave.ts`
- 생성: `src/components/WorkoutEditor.tsx`, `src/components/EntryCard.tsx`, `src/components/SetRow.tsx`, `src/components/ExercisePicker.tsx`, `src/components/SaveStatus.tsx`
- 수정: `src/app/workout/page.tsx`

**인터페이스:**
- 쓰는 것
  - 초안 함수 전부 (작업 5)
  - `pickerList`, `checkNewExerciseName`, `defaultKindFor` (작업 4)
  - `getGuide`, `GUIDE_NOTE`, `STRETCH_NOTE` (작업 3)
  - `useReadyStore` (작업 9)
  - `ConfirmDialog`, `CategoryChip` (작업 9)
  - `isValidDateStr`, `todayStr` (작업 1)
  - `CATEGORIES`, `CATEGORY_LABEL`, `KIND_LABEL`, `MEASURE_KINDS` (작업 2)
- 만드는 것
  - `createDebouncedSaver<T>(save: (v: T) => void, delayMs: number): { schedule(v: T): void; flush(): void; cancel(): void }`
  - `useAutosave<T>(value: T, save: (v: T) => void, delayMs = 500): { flush(): void; cancel(): void }`
    - 처음 받은 값은 저장 예약하지 않는다.
    - 값이 바뀌면 `schedule`한다.
    - `visibilitychange`(`document.visibilityState === 'hidden'`), `pagehide`, 언마운트 때 `flush`한다.
  - `type SaveStatusValue = 'idle' | 'saving' | 'saved' | 'failed' | 'no-entries' | 'invalid-date'`
  - `<SaveStatus status />` — 상태별 문구
    - `idle`: 빈 문자열
    - `saving`: `'저장 중'`
    - `saved`: `'저장됨'`
    - `failed`: `'저장 실패'`
    - `no-entries`: `'완성된 종목이 없어 저장되지 않음'`
    - `invalid-date`: `'날짜가 올바르지 않아 저장되지 않음'`
  - `<WorkoutEditor initialDraft: WorkoutDraft; isNew: boolean />`
  - `<EntryCard entry: EntryDraft; exercise: Exercise | undefined; onChange(e: EntryDraft): void; onRemove(): void />`
  - `<SetRow>` — 측정 방식별 입력 줄. 칸마다 `readField` 결과가 `invalid`면 빨간 테두리와 범위 안내 문구(예: `'1~1000 사이 정수'`)를 보여준다.
  - `<ExercisePicker open: boolean; onPick(ex: Exercise): void; onClose(): void />`

**동작 규칙**
- **주소 처리** (설계 7절 `/workout`)
  - `id` 파라미터가 있고 그 값이 지금 편집 중인 초안의 `id`와 같으면 편집기를 다시 만들지 않는다. 자기 자신이 실행한 `router.replace`이기 때문이다. 리뷰 중점 1에 해당한다.
  - 그 밖에 대상이 바뀌면 초안을 새로 만든다.
  - `?id=`에 해당하는 기록이 없으면 `'기록을 찾을 수 없습니다'`와 `/`로 가는 링크 `'목록으로'`를 보여준다.
  - `?date=`가 잘못되었거나 파라미터가 없으면 오늘 날짜로 새 기록을 연다.
  - `useSearchParams`를 쓰는 부분은 `<Suspense>`로 감싼다.
- **저장 흐름** (`save` 콜백)
  1. `toPersistable(draft)`가 실패하면 상태를 그 `reason`으로 바꾸고 끝낸다.
  2. 성공하면 `api.upsertWorkout`을 부른다. `'saved'`면 `saved`, 그 밖에는 `failed`로 바꾼다.
  3. 새 기록이 처음 `saved`되면 `router.replace('/workout?id=' + id)`를 부르고 `isNew`를 false로 바꾼다.
- **저장 실패 알림**: `failed`일 때 머리글 아래에 `'저장하지 못했습니다. 저장 공간을 확인하거나 설정에서 백업을 내보내세요.'` 막대를 보여준다.
- **삭제**: `ConfirmDialog`(`'이 기록을 삭제할까요?'`) → `autosave.cancel()` → `api.deleteWorkout(id)` → `router.replace('/')`. 리뷰 중점 2에 해당한다.
- **뒤로 가기**: `window.history.length > 1`이면 `router.back()`, 아니면 `router.replace('/')`
- **종목 삭제**: `hasCompletedSets`가 참이면 `ConfirmDialog`(`'이 종목과 입력한 세트를 삭제할까요?'`)를 거친다.
- **가이드**: ⓘ 버튼을 누르면 `target`, `tip`, `GUIDE_NOTE`가 펼쳐진다. 스트레칭 분류이면 `STRETCH_NOTE`도 보여준다.
- **종목 선택 창** (설계 7절 '종목 선택 창')
  - 새 종목 추가는 `api.addExercise`를 쓴다.
  - 결과가 `duplicate-archived`면 `'숨긴 종목에 같은 이름이 있습니다. 설정에서 숨김을 해제하세요.'`를 보여준다.
  - 결과가 `duplicate`면 `'이미 있는 종목입니다.'`를 보여준다.

- [ ] **1단계: 실패하는 테스트 작성** (`debounced-saver.test.ts`, `vi.useFakeTimers()`)

  ```ts
  it('500ms 안에 3번 예약하면 마지막 값으로 1번 저장', () => {
    s.schedule(1); s.schedule(2); s.schedule(3); vi.advanceTimersByTime(500)
    expect(save).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledWith(3)
  })
  it('flush는 즉시 저장하고 타이머는 다시 저장하지 않는다', () => {
    s.schedule(1); s.flush(); vi.advanceTimersByTime(1000)
    expect(save).toHaveBeenCalledTimes(1)
  })
  it('예약이 없으면 flush는 아무것도 하지 않는다', () => { s.flush(); expect(save).not.toHaveBeenCalled() })
  it('cancel 후 flush는 저장하지 않는다', () => {
    s.schedule(1); s.cancel(); s.flush(); vi.advanceTimersByTime(1000)
    expect(save).not.toHaveBeenCalled()
  })
  ```

- [ ] **2단계: 테스트 실행 → 실패 확인**

  `npm test -- debounced-saver`

- [ ] **3단계: `createDebouncedSaver` 구현 → 테스트 통과 확인**

- [ ] **4단계: 나머지 파일 구현**

  `useAutosave`, 컴포넌트, 페이지를 구현한다.

- [ ] **5단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다.

- [ ] **6단계: 화면 점검** (390×844)
  1. `+ 운동 기록`을 누르고 벤치프레스를 추가한다. 60/8을 입력한 뒤 `세트 추가`를 누르면 60/8이 복사된다.
  2. **리뷰 중점 1**
     - 세 번째 세트에 무게만 입력하고 0.5초를 기다린다.
     - 주소가 `?id=…`로 바뀌고 '저장됨'이 표시된다.
     - 무게만 입력한 세 번째 줄이 그대로 남아 있다.
  3. 새로고침하면 완성된 세트 2개만 남는다.
  4. 플랭크(초), 푸시업(횟수와 +kg), 러닝(분과 km)을 추가해 저장한다. 1001kg을 입력하면 빨간 테두리가 보이고 그 세트는 저장되지 않는다.
  5. 종목 선택 창에서 분류 칩, 검색(`사이드플랭크`), 새 종목 추가, 이름 중복 안내가 동작한다.
  6. **리뷰 중점 2**
     - 숫자를 바꾼 직후 0.5초 안에 삭제 → 확인을 누른다.
     - 홈으로 이동한 뒤 새로고침해도 그 기록이 없다.
  7. 다른 탭으로 전환했다 돌아오는 등 화면을 숨겼을 때 기다리던 저장이 실행된다. 숫자를 입력하고 곧바로 탭을 바꾼 뒤 새로고침하면 값이 남아 있다.

---

### 작업 11: 기록 목록 (`/`)

**파일:**
- 생성: `src/components/WorkoutCard.tsx`, `src/components/SummaryCards.tsx`
- 수정: `src/app/page.tsx`

**인터페이스:**
- 쓰는 것: `summarize` (작업 6), `formatDuration`, `formatInt`, `formatDateLabel`, `formatMonthLabel`, `workoutSummaryText`, `workoutCategories` (작업 6), `weekRange`, `todayStr` (작업 1), `useReadyStore`, `TabShell`, `CategoryChip` (작업 9)
- 만드는 것
  - `<WorkoutCard workout: Workout; byId: ReadonlyMap<string, Exercise> />`
    - `/workout?id=…`로 가는 `Link`다.
    - `formatDateLabel`, 분류 칩, `workoutSummaryText`를 보여준다.
  - `<SummaryCards items: { label: string; value: string }[] />` — 지표 카드 묶음. 작업 13에서도 쓴다.

- [ ] **1단계: 구현**
  - 맨 위 이번 주 요약 카드: 운동 일수 `'N일'`, 총 운동 시간 `formatDuration`, 총 볼륨 `formatInt + 'kg'`
  - 목록 정렬: 날짜 내림차순, 같은 날짜는 `createdAt` 내림차순
  - 월마다 `formatMonthLabel` 머리글을 붙인다.
  - 기록이 없으면 `'아직 기록이 없습니다'`와 기록 추가 링크를 보여준다.

- [ ] **2단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다.

- [ ] **3단계: 화면 점검**
  1. 작업 10에서 만든 기록이 최신순으로 보인다.
  2. 카드를 누르면 편집 화면이 열린다.
  3. 이번 주 요약 숫자가 직접 계산한 값과 같다.
  4. 전체 초기화 뒤에는 빈 화면 안내가 보인다.

---

### 작업 12: 달력 (`/calendar`)

**파일:**
- 생성: `src/components/MonthGrid.tsx`
- 수정: `src/app/calendar/page.tsx`

**인터페이스:**
- 쓰는 것: `monthGrid`, `shiftMonth`, `parseDateStr`, `isValidDateStr`, `todayStr` (작업 1), `formatMonthLabel` (작업 6), `WorkoutCard` (작업 11), `useReadyStore`, `TabShell` (작업 9)
- 만드는 것: `<MonthGrid year: number; month: number; selected: DateStr; today: DateStr; marked: ReadonlySet<DateStr>; onSelect(d: DateStr): void />`
  - 요일 머리글은 `월 화 수 목 금 토 일` 순서다.
  - 운동한 날에는 점을 찍고, 오늘에는 테두리를 둔다.
  - 선택한 날은 채워서 강조한다.

- [ ] **1단계: 구현**
  - 선택한 날짜는 `?date=`에서 읽는다. 값이 없거나 잘못되었으면 오늘로 한다.
  - 날짜를 누르면 `router.replace('/calendar?date=…')`를 부른다.
  - ◀ ▶를 누르면 `?date=`를 `shiftMonth(selected, ∓1)`로 바꾼다. 이동한 달의 1일이 선택된다.
  - 달력 아래에 선택한 날의 `WorkoutCard` 목록과 `'이 날짜로 기록 추가'`(`/workout?date=…`)를 보여준다.
  - `useSearchParams`를 쓰는 부분은 `<Suspense>`로 감싼다.

- [ ] **2단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다.

- [ ] **3단계: 화면 점검**
  1. 2026년 11월은 1일이 일요일 칸에서 시작하고 6줄이다.
  2. 운동한 날에 점이 찍힌다.
  3. 지난달 날짜를 고르고 기록을 편집한 뒤 뒤로 가면 같은 달과 날짜가 선택되어 있다.

---

### 작업 13: 요약 (`/stats`)

**파일:**
- 수정: `src/app/stats/page.tsx`

**인터페이스:**
- 쓰는 것: `summarize`, `formatDuration`, `formatInt`, `formatKm`, `formatWeekLabel`, `formatMonthLabel` (작업 6), `weekRange`, `monthRange`, `addDays`, `shiftMonth`, `todayStr` (작업 1), `SummaryCards` (작업 11), `CATEGORIES`, `CATEGORY_LABEL` (작업 2), `useReadyStore`, `TabShell` (작업 9)

- [ ] **1단계: 구현**
  - 주간·월간 전환 상태와 기준 날짜는 컴포넌트 상태로 둔다. 기본값은 주간과 오늘이다.
  - ◀ ▶ 이동
    - 주간은 `addDays(±7)`로 이동한다.
    - 월간은 `shiftMonth(±1)`로 이동한다.
    - 지금 보는 기간에 오늘이 포함되면 ▶를 비활성화한다.
  - 지표 카드
    - 운동 일수 `'N일'`
    - 총 운동 시간
    - 총 볼륨 `'…kg'`
    - 총 횟수 `'…회'`
    - 유산소 시간
    - 유산소 거리 `formatKm + 'km'`
  - 분류별 운동 일수는 `CATEGORIES` 순서로 다섯 개를 모두 보여준다. 0일도 보여준다.
  - `missingDurationCount > 0`이면 `'운동 시간이 입력되지 않은 기록 N개'`를 보여준다.

- [ ] **2단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다.

- [ ] **3단계: 화면 점검**
  1. 주간·월간 숫자가 직접 계산한 값과 같다(분류별 일수 포함).
  2. 이번 주와 이번 달에서는 ▶가 눌리지 않는다.
  3. 기간 이름이 `'11월 9일 – 11월 15일'` 형식이다.

---

### 작업 14: 설정 (`/settings`)

**파일:**
- 수정: `src/app/settings/page.tsx`
- 생성: `src/components/ExerciseManager.tsx`, `src/components/BackupPanel.tsx`

**인터페이스:**
- 쓰는 것: `api.addExercise`, `api.setExerciseArchived`, `api.replaceAll`, `api.resetAll` (작업 7), `serializeBackup`, `parseBackup`, `exportFileName`, `downloadText`, `IMPORT_ERROR_MESSAGE` (작업 8), `defaultKindFor` (작업 4), `CATEGORIES`, `CATEGORY_LABEL`, `MEASURE_KINDS`, `KIND_LABEL` (작업 2), `ConfirmDialog`, `useReadyStore`, `TabShell` (작업 9), `todayStr` (작업 1)

- [ ] **1단계: 구현**
  - **종목 관리**
    - 분류별로 묶어서 보여준다. 숨긴 종목은 흐리게 표시하고 '숨김 해제' 버튼을 둔다.
    - 추가 폼은 이름, 분류, 측정 방식으로 이뤄진다. 분류를 바꾸면 측정 방식이 `defaultKindFor`로 채워진다.
    - 이름 중복 안내 문구는 작업 10과 같다. 결과가 `empty`면 `'종목 이름을 입력하세요.'`를 보여준다.
  - **내보내기**: `downloadText(exportFileName(today), serializeBackup(store))`
  - **가져오기**
    1. `<input type="file" accept="application/json,.json">`로 파일을 고르고 `file.text()`로 읽은 뒤 `parseBackup`을 부른다.
    2. 실패하면 `IMPORT_ERROR_MESSAGE[error]`를 보여주고 데이터는 건드리지 않는다.
    3. 성공하면 `ConfirmDialog`를 띄운다.
       - 문구: `'현재 기록 N개를 가져온 기록 M개로 덮어씁니다.'`
       - `children`에 `'현재 데이터 먼저 내보내기'` 버튼을 둔다.
    4. 확인하면 `api.replaceAll`을 부른다.
    5. 같은 파일을 다시 고를 수 있도록 처리가 끝나면 input 값을 비운다.
  - **전체 초기화**: `ConfirmDialog`의 문구는 `'모든 기록과 직접 추가한 종목이 삭제됩니다.'`이고, `destructive` 스타일을 쓴다. 확인하면 `api.resetAll()`을 부른다.
  - 쓰기 결과가 `'failed'`면 `'저장하지 못했습니다.'`를 보여준다.

- [ ] **2단계: 빌드 확인**

  `npm run build`와 `npm run lint`가 성공해야 한다.

- [ ] **3단계: 화면 점검**
  1. 종목을 추가, 숨김, 숨김 해제할 수 있다. 숨긴 종목은 종목 선택 창에서 보이지 않는다.
  2. 내보내기 → 전체 초기화 → 가져오기를 하면 기록이 원래대로 돌아온다.
  3. 아무 텍스트 파일을 가져오면 `'백업 파일(JSON)이 아닙니다.'`가 나오고 기록은 그대로다.

---

### 작업 15: 최종 확인

**파일:** 없음. 확인만 한다. 문제가 나오면 해당 작업으로 돌아가 고친다.

- [ ] **1단계: 자동 검사**

  `npm test`, `npm run lint`, `npm run build`를 실행한다.
  - 모두 성공해야 한다.
  - `out/`에 `index.html`, `calendar.html`, `stats.html`, `settings.html`, `workout.html`이 있어야 한다.

- [ ] **2단계: 설계 10절 '화면 확인' 7개 항목**

  `npm run dev`를 실행하고 390×844 화면에서 순서대로 확인한다.

- [ ] **3단계: 리뷰 중점 3 (iOS 확대 방지)**

  편집 화면과 설정 화면에서 개발자 도구로 모든 `input`, `select`, `textarea`의 계산된 `font-size`를 확인한다. 모두 16px 이상이어야 한다.

  ```js
  [...document.querySelectorAll('input,select,textarea')].map(e => getComputedStyle(e).fontSize)
  ```

- [ ] **4단계: 다크 모드**

  개발자 도구에서 `prefers-color-scheme: dark`를 흉내 낸 뒤 모든 화면의 글자가 읽히는지 확인한다.

- [ ] **5단계: 결과 보고**

  통과한 항목, 실패한 항목, 건너뛴 항목을 사실대로 적는다.
