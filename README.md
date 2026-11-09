# 운동 기록

휴대폰에서 근력·맨몸·코어·스트레칭·유산소 운동을 기록하고 달력과 주간·월간 요약으로 보는 웹 앱이다. Next.js 정적 사이트로 만든다.

## 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (http://localhost:3000) |
| `npm test` | 단위 테스트 (Vitest) |
| `npm run build` | 정적 사이트 생성 (`out/`) |
| `npm start` | 빌드한 `out/`을 정적 서버로 실행 (http://localhost:3000). 먼저 `npm run build`를 한다 |
| `npm run lint` | ESLint 검사 |

## 문서

- 설계: `docs/superpowers/specs/2026-11-09-workout-log-design.md`
- 구현 계획: `docs/superpowers/plans/2026-11-09-workout-log.md`

## 데이터 주의

기록은 서버가 아니라 **이 브라우저의 localStorage에만** 저장된다.

- 브라우저 데이터를 지우거나 기기를 바꾸면 기록이 사라진다.
- 아이폰 Safari는 7일 동안 사이트를 열지 않으면 저장소를 지울 수 있다.
- 접속 주소가 바뀌면(예: PC의 IP로 접속하다 IP가 바뀌면) 이전 기록이 보이지 않는다.

**설정 → 백업 내보내기로 JSON 파일을 주기적으로 받아 두자.**
