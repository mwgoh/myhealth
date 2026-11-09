## 이 프로젝트의 Next.js는 학습 데이터와 다르다

이 버전(Next.js 16.4)은 API, 규칙, 파일 구조가 크게 바뀌었다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 관련 가이드를 읽고, 폐기 예정(deprecation) 안내를 따른다.

원래 이 안내는 `next dev`가 영문 관리 블록으로 자동 생성한다. 이 프로젝트는 문서를 한국어로만 두므로 `next.config.ts`에서 `agentRules: false`로 자동 생성을 끄고 같은 내용을 여기에 직접 적었다.

## 이 프로젝트에서 지킬 것

- 설계 문서: `docs/superpowers/specs/2026-11-09-workout-log-design.md`
- 구현 계획: `docs/superpowers/plans/2026-11-09-workout-log.md`
- `output: 'export'` 정적 사이트다. 서버 기능(Route Handler, Server Action, proxy, 이미지 최적화)은 쓸 수 없다.
- `useSearchParams`를 쓰는 클라이언트 컴포넌트는 `<Suspense>`로 감싼다. 감싸지 않으면 빌드가 실패한다.
- 날짜 문자열은 `src/domain/date.ts` 함수로만 다룬다.
