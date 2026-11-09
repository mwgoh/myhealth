# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 안내다.

## 먼저 읽을 것

- [AGENTS.md](AGENTS.md): Next.js 16.4 주의사항, 정적 내보내기 제약, `Suspense`, 날짜 규칙. 여기서는 반복하지 않는다.
- 설계 문서 `docs/superpowers/specs/2026-11-09-workout-log-design.md`: 동작의 기준이다. 입력값 범위는 4절, 요약 계산은 6절, 오류 처리는 9절에 있다.
- 구현 계획 `docs/superpowers/plans/2026-11-09-workout-log.md`: 맨 앞 "전역 제약"과 "리뷰 중점"이 아래 규칙의 출처다. 계획의 "git 명령을 실행하지 않는다"는 저장소가 없던 때의 제약이라 지금은 맞지 않는다.
- `docs/superpowers/specs/2026-11-09-exercise-videos-design.md`는 사용자 검토 대기 중이고 아직 구현되지 않았다. `video/` 폴더도 없다.

## 명령

| 명령 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm test` | 전체 단위 테스트 (`vitest run`) |
| `npm test -- date` | 파일 경로에 `date`가 들어간 테스트만 실행. 여러 개는 `npm test -- id seed` |
| `npm run test:watch` | 감시 모드 |
| `npm run lint` | ESLint. 이 PC에서 3분 넘게 걸리므로 timeout을 넉넉히 둔다 |
| `npm run build` | 정적 사이트 생성. `out/`에 `index.html`, `calendar.html`, `stats.html`, `settings.html`, `workout.html`이 생긴다 |
| `npx next typegen && npx tsc --noEmit` | 빌드 없이 타입 검사. `LayoutProps` 같은 전역 타입은 `next dev`·`next build`·`next typegen`이 만든다 |

- `npm start`는 `next start`가 아니라 `serve`로 `out/`을 연다. `next start`는 `output: 'export'` 설정에서 오류로 끝난다. 빌드를 먼저 해야 한다.
  - `--no-compression`: `serve`가 쓰는 `compression` 패키지에 알려진 취약점(npm audit high)이 있어 압축을 끈다.
  - `--no-port-switching`: 3000번이 사용 중이면 다른 포트로 바꾸지 않고 실패한다. 포트가 바뀌면 접속 주소(origin)가 달라져 localStorage의 기록이 보이지 않는다.
- 작업을 마쳤다고 하려면 `npm test`, `npm run lint`, `npm run build`가 모두 통과해야 한다.

## 구조

의존 방향은 `domain` → `storage` → `hooks` → `components`·`app` 한 방향이다.

- `src/domain/`: React와 무관한 순수 함수. 업무 규칙은 모두 여기에 둔다.
  - `types.ts`에 zod 스키마와 입력 범위 `LIMITS`가 함께 있다. 저장 데이터 검증(zod)과 편집 화면의 칸 검사(`workout.ts`의 `readField`)가 같은 `LIMITS`를 쓴다.
  - `checkReferences`: 모든 기록이 존재하는 종목을 가리키고, `Entry.kind`가 그 종목의 `Exercise.kind`와 같은지 검사한다.
  - 기본 종목은 `seed-*` 고정 ID다. 가이드 문구는 Store가 아니라 `seed.ts` 코드에 있어 백업 파일에 들어가지 않는다.
- `src/storage/store.ts`: `createWorkoutStore(storage)`는 `getItem`·`setItem`만 가진 객체를 주입받는다. 테스트에는 메모리 구현을 넣는다.
- `src/storage/browser-store.ts`: localStorage(키 `workout-log`)에 연결한 싱글턴. `storage` 이벤트로 다른 탭의 변경을 다시 읽는다. `window.localStorage`는 이 파일에서만 쓴다.
- `src/hooks/`: `useSyncExternalStore` 래퍼. React에 묶인 부분은 얇게 두고, 시간에 따라 동작하는 로직은 `debounced-saver.ts`, `today-clock.ts`처럼 순수 파일로 빼서 테스트한다.

### 저장소 상태와 쓰기

- 상태는 `loading` | `ready` | `corrupt` | `unsupported-version`이다.
- `app/layout.tsx`가 모든 페이지를 `StoreGate`로 감싼다.
  - `StoreGate`는 effect에서 `load()`를 부르고, `ready`가 아니면 로딩 화면이나 오류 화면만 그린다.
  - 서버 스냅샷은 항상 `loading`이다. 그래서 정적 HTML에는 로딩 문구만 들어가고 hydration 불일치가 생기지 않는다.
- 페이지와 컴포넌트는 `useReadyStore()`로 `{ store, api }`를 받는다. `ready`가 아니면 예외를 던지므로 `StoreGate` 밖에서 쓰지 않는다.
- 쓰기 API는 `WriteResult`(`saved` | `failed` | `blocked`)를 돌려준다.
  - `ready`가 아니면 `blocked`다. 손상된 원본을 덮어쓰지 않기 위해서다. `resetAll`만 예외다(손상 상태를 벗어나는 유일한 길).
  - 메모리 상태를 먼저 바꾸고 `setItem`을 부른다. 저장에 실패해도 화면의 입력은 남고 `failed`를 돌려준다.
  - `checkReferences`를 통과하지 못하는 Store는 쓰지 않는다. 쓰면 다시 읽을 때 손상으로 판정되어 모든 탭이 오류 화면으로 잠긴다.
  - `getItem` 자체가 예외를 던지면 기본 Store로 열되 쓰기를 막는다.
- **스키마를 바꿀 때 주의한다.** 데이터는 사용자 브라우저의 localStorage와 백업 JSON에만 있다.
  - `storeSchema`를 좁히거나 선택 필드를 필수로 바꾸면 기존 데이터가 `corrupt`로 판정되어 앱이 열리지 않는다.
  - 지금은 `version: 1`만 받고 이전 버전을 변환하는 코드가 없다.

### 편집 화면 (`/workout`)

- 편집기는 입력 문자열을 그대로 담은 `WorkoutDraft`를 상태로 가진다. `toPersistable(draft)`가 완성된 세트만 골라 `Workout`으로 바꾸고, 남는 종목이 없으면 `{ ok: false }`를 돌려준다.
- `useAutosave`는 500ms 뒤에 저장한다. `visibilitychange`(hidden), `pagehide`, 언마운트 때는 기다리던 저장을 즉시 실행한다. 처음 받은 값은 저장하지 않는다.
- 새 기록(`?date=`)이 처음 저장되면 `router.replace`로 주소를 `?id=`로 바꾼다.
  - `workout/page.tsx`는 바뀐 `id`가 현재 초안의 `id`와 같으면 편집기를 다시 만들지 않는다. 다시 만들면 입력 중이던 미완성 세트가 사라진다.
  - 언마운트 중의 저장이면 주소를 바꾸지 않는다. 바꾸면 떠나려던 화면에서 편집 화면으로 끌려온다.
- 기록을 삭제하기 전에 `autosave.cancel()`을 부른다. 부르지 않으면 언마운트 때의 저장이 삭제한 기록을 되살린다.

## 코드 규칙

- 숫자 입력은 `type="text"`에 `inputMode="decimal"`(소수 칸) 또는 `"numeric"`(정수 칸)을 쓴다. `type="number"`는 쓰지 않는다.
- 입력 요소의 글자는 16px 이상(`text-base`)이다. 작으면 iOS Safari가 입력 칸을 누를 때 화면을 확대한다.
- 누를 수 있는 요소는 44px 이상(`min-h-11`, 아이콘 버튼은 `min-w-11`도)이다.
- 본문 폭은 `max-w-md mx-auto`로 제한한다.
- 브라우저 기본 `alert`·`confirm`·`prompt` 대신 `ConfirmDialog`를 쓴다.
- `eslint-disable` 주석은 쓰지 않는다. React Hooks 규칙에 걸리면 렌더링 중에 상태를 계산하거나 `key`로 해결한다(예: `workout/page.tsx`의 세션 전환).
- UI 문구는 한국어다.
- 색은 `globals.css`의 CSS 변수를 Tailwind 색으로 쓴다(`bg-bg`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `text-danger`, `bg-cat-*`). 다크 모드는 `prefers-color-scheme`에 따라 변수 값이 바뀌므로 `dark:` 변형을 쓰지 않는다.

## 테스트

- Vitest는 `environment: node`, `TZ=Asia/Seoul`로 실행한다. 한국 시간 새벽(UTC 기준 전날)의 날짜 계산 오류를 잡기 위해서다.
- `src/**/*.test.ts`만 실행한다. `.tsx` 테스트 파일은 실행되지 않는다. 테스트는 대상 파일 옆에 둔다.
- `domain`과 `storage`는 테스트를 먼저 쓴다(TDD).
- UI 컴포넌트 자동 테스트는 없다. 화면은 `npm run dev`를 띄우고 브라우저를 390×844 크기로 열어 확인한다. 확인 항목은 설계 문서 10절에 있다.
